import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DateTime } from 'luxon';
import { Repository } from 'typeorm';
import { UsuarioAutenticado, sucursalDeAlcance } from '../common/auth';
import { TipoEventoKpi } from '../common/enums';
import { ZONA_HORARIA } from '../notificaciones/plantillas';
import { OrdenTrabajo } from '../ordenes-trabajo/orden-trabajo.entity';
import { Sucursal } from '../sucursales/sucursal.entity';
import { EventoKpi } from './evento-kpi.entity';
import { CreateEventoKpiDto, FiltroEventosKpiDto } from './indicadores.dto';

const hoy = (): string => DateTime.now().setZone(ZONA_HORARIA).toISODate()!;

@Injectable()
export class IndicadoresService {
  constructor(
    @InjectRepository(EventoKpi) private readonly repo: Repository<EventoKpi>,
    @InjectRepository(Sucursal) private readonly sucursales: Repository<Sucursal>,
    @InjectRepository(OrdenTrabajo) private readonly ots: Repository<OrdenTrabajo>,
  ) {}

  async registrar(dto: CreateEventoKpiDto, usuario: UsuarioAutenticado): Promise<EventoKpi> {
    const sucursalId = sucursalDeAlcance(usuario, dto.sucursalId);
    if (!sucursalId) throw new BadRequestException('Indique la sucursal del registro');
    // Un usuario de sucursal no puede registrar hechos de otra.
    if (dto.sucursalId && dto.sucursalId !== sucursalId) {
      throw new BadRequestException('Sólo puede registrar hechos de su propia sucursal');
    }
    if (!(await this.sucursales.existsBy({ id: sucursalId }))) throw new NotFoundException('Sucursal no encontrada');

    const fecha = dto.fecha?.slice(0, 10) ?? hoy();
    if (fecha > hoy()) throw new BadRequestException('La fecha no puede ser futura');

    switch (dto.tipo) {
      case TipoEventoKpi.COMPRA_REPUESTO:
        if (dto.monto === undefined) throw new BadRequestException('Indique el monto de la compra');
        break;
      case TipoEventoKpi.CIERRE_TALLER:
        if (dto.horas === undefined || !dto.motivo) {
          throw new BadRequestException('Indique las horas de cierre y su motivo (migración, capacitación u otro)');
        }
        break;
      case TipoEventoKpi.LLAMADA_ESTADO:
      case TipoEventoKpi.ATENCION_FUERA_SUGO:
        if (dto.cantidad === undefined) throw new BadRequestException('Indique la cantidad');
        break;
      case TipoEventoKpi.RECLAMO:
        if (!dto.detalle) throw new BadRequestException('Describa el reclamo');
        if (dto.otId && !(await this.ots.existsBy({ id: dto.otId }))) {
          throw new NotFoundException('Orden de trabajo no encontrada');
        }
        break;
    }

    const unitario = dto.tipo === TipoEventoKpi.RECLAMO || dto.tipo === TipoEventoKpi.COMPRA_REPUESTO;
    const registrado = await this.repo.save(
      this.repo.create({
        tipo: dto.tipo,
        sucursalId,
        fecha,
        cantidad: unitario ? 1 : (dto.cantidad ?? 1),
        monto: dto.tipo === TipoEventoKpi.COMPRA_REPUESTO ? (dto.monto ?? 0) : null,
        urgente: dto.tipo === TipoEventoKpi.COMPRA_REPUESTO ? !!dto.urgente : false,
        horas: dto.tipo === TipoEventoKpi.CIERRE_TALLER ? String(dto.horas) : null,
        motivo: dto.tipo === TipoEventoKpi.CIERRE_TALLER ? (dto.motivo ?? null) : null,
        otId: dto.otId ?? null,
        detalle: dto.detalle ?? null,
        registradoPorId: usuario.id,
      }),
    );
    return this.repo.findOneOrFail({ where: { id: registrado.id }, relations: { sucursal: true } });
  }

  listar(filtro: FiltroEventosKpiDto, usuario: UsuarioAutenticado): Promise<EventoKpi[]> {
    const sucursalId = sucursalDeAlcance(usuario, filtro.sucursalId);
    const qb = this.repo
      .createQueryBuilder('e')
      .leftJoinAndSelect('e.sucursal', 'sucursal')
      .orderBy('e.fecha', 'DESC')
      .addOrderBy('e.createdAt', 'DESC')
      .take(100);
    if (sucursalId) qb.andWhere('e.sucursalId = :sucursalId', { sucursalId });
    if (filtro.tipo) qb.andWhere('e.tipo = :tipo', { tipo: filtro.tipo });
    if (filtro.desde) qb.andWhere('e.fecha >= :desde', { desde: filtro.desde.slice(0, 10) });
    if (filtro.hasta) qb.andWhere('e.fecha <= :hasta', { hasta: filtro.hasta.slice(0, 10) });
    return qb.getMany();
  }

  async eliminar(id: string, usuario: UsuarioAutenticado): Promise<void> {
    const evento = await this.repo.findOneBy({ id });
    if (!evento || sucursalDeAlcance(usuario, evento.sucursalId) !== evento.sucursalId) {
      throw new NotFoundException('Registro no encontrado');
    }
    await this.repo.delete(id);
  }
}
