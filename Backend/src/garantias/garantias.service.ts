import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DateTime } from 'luxon';
import { EntityManager, MoreThanOrEqual, Repository } from 'typeorm';
import { Cliente } from '../clientes/cliente.entity';
import { EstadoPresupuesto, TipoItem } from '../common/enums';
import { normalizarPatente } from '../common/utils/patente';
import { normalizarRut, validarRut } from '../common/utils/rut';
import { ZONA_HORARIA } from '../notificaciones/plantillas';
import { OrdenTrabajo } from '../ordenes-trabajo/orden-trabajo.entity';
import { PresupuestoItem } from '../presupuestos/presupuesto-item.entity';
import { OtRepuesto } from '../repuestos/ot-repuesto.entity';
import { Vehiculo } from '../vehiculos/vehiculo.entity';
import { Garantia } from './garantia.entity';

const hoy = (): string => DateTime.now().setZone(ZONA_HORARIA).toISODate()!;

@Injectable()
export class GarantiasService {
  constructor(
    @InjectRepository(Garantia) private readonly repo: Repository<Garantia>,
    @InjectRepository(Vehiculo) private readonly vehiculos: Repository<Vehiculo>,
    @InjectRepository(Cliente) private readonly clientes: Repository<Cliente>,
    @InjectRepository(OrdenTrabajo) private readonly ots: Repository<OrdenTrabajo>,
  ) {}

  vigentesPorVehiculo(vehiculoId: string): Promise<Garantia[]> {
    return this.repo.find({
      where: { vehiculoId, fechaVencimiento: MoreThanOrEqual(hoy()) },
      relations: { repuesto: true, ordenTrabajo: { sucursal: true } },
      order: { fechaVencimiento: 'ASC' },
    });
  }

  /**
   * Búsqueda a nivel de toda la red por patente o RUT (REQ-06): historial de atenciones y repuestos aplicados,
   * sin importar en qué sucursal se hicieron. Con RUT devuelve todos los vehículos del cliente.
   */
  async historial(consulta: string) {
    const q = consulta.trim();
    if (!q) throw new BadRequestException('Indique una patente o un RUT');

    let vehiculos: Vehiculo[];
    if (validarRut(q)) {
      const cliente = await this.clientes.findOneBy({ rut: normalizarRut(q) });
      vehiculos = cliente
        ? await this.vehiculos.find({ where: { clienteId: cliente.id }, relations: { cliente: true }, take: 10 })
        : [];
    } else {
      const vehiculo = await this.vehiculos.findOne({
        where: { patente: normalizarPatente(q) },
        relations: { cliente: true },
      });
      vehiculos = vehiculo ? [vehiculo] : [];
    }
    if (!vehiculos.length) throw new NotFoundException('No se encontraron vehículos para esa búsqueda');

    return Promise.all(vehiculos.map((vehiculo) => this.historialDeVehiculo(vehiculo)));
  }

  private async historialDeVehiculo(vehiculo: Vehiculo) {
    const [ordenes, garantias] = await Promise.all([
      this.ots.find({
        where: { vehiculoId: vehiculo.id },
        relations: { sucursal: true, repuestos: { repuesto: true } },
        order: { fechaIngreso: 'DESC' },
        take: 100,
      }),
      this.repo.find({
        where: { vehiculoId: vehiculo.id },
        relations: { repuesto: true, ordenTrabajo: { sucursal: true } },
        order: { fechaVencimiento: 'DESC' },
      }),
    ]);
    const hoyIso = hoy();
    return {
      vehiculo,
      ordenes,
      garantias,
      garantiasVigentes: garantias.filter((g) => g.fechaVencimiento >= hoyIso),
    };
  }

  /**
   * Genera las garantías de una OT al entregarla: una por cada repuesto realmente usado y por cada
   * trabajo de mano de obra aprobado que ofrezca garantía. Corre dentro de la transacción de entrega.
   */
  async crearParaEntrega(manager: EntityManager, ot: OrdenTrabajo, fechaEntrega: Date): Promise<number> {
    const inicio = DateTime.fromJSDate(fechaEntrega, { zone: ZONA_HORARIA });
    const nueva = (meses: number, descripcion: string, repuestoId: string | null) =>
      manager.create(Garantia, {
        otId: ot.id,
        vehiculoId: ot.vehiculoId,
        repuestoId,
        descripcion,
        meses,
        fechaInicio: inicio.toISODate()!,
        fechaVencimiento: inicio.plus({ months: meses }).toISODate()!,
      });

    const repuestos = await manager.find(OtRepuesto, { where: { otId: ot.id }, relations: { repuesto: true } });
    const manoDeObra = await manager
      .createQueryBuilder(PresupuestoItem, 'item')
      .innerJoin('item.presupuesto', 'p')
      .where('p.otId = :otId', { otId: ot.id })
      .andWhere('p.estado = :estado', { estado: EstadoPresupuesto.APROBADO })
      .andWhere('item.tipo = :tipo', { tipo: TipoItem.MANO_OBRA })
      .andWhere('item.garantiaMeses > 0')
      .getMany();

    const garantias = [
      ...repuestos
        .filter((r) => r.garantiaMeses > 0)
        .map((r) => nueva(r.garantiaMeses, `${r.repuesto.nombre} (${r.repuesto.codigo})`, r.repuestoId)),
      ...manoDeObra.map((i) => nueva(i.garantiaMeses, i.descripcion, null)),
    ];
    if (garantias.length) await manager.save(garantias);
    return garantias.length;
  }
}
