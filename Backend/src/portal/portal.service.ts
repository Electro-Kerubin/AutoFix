import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DateTime } from 'luxon';
import { Repository } from 'typeorm';
import { CanalAprobacion, EstadoOt, EstadoPresupuesto } from '../common/enums';
import { GarantiasService } from '../garantias/garantias.service';
import { EvidenciasService } from '../ordenes-trabajo/evidencias.service';
import { OrdenTrabajo } from '../ordenes-trabajo/orden-trabajo.entity';
import { estaAbierta } from '../ordenes-trabajo/ot-estados';
import { PresupuestosService } from '../presupuestos/presupuestos.service';

/** Tras la entrega o cancelación el link sigue vigente este tiempo (consulta de garantía/recibo). */
const VIGENCIA_POST_CIERRE_DIAS = 30;
const TOKEN_VALIDO = /^[a-f0-9]{48}$/;

export interface OrigenPortal {
  ip: string | null;
  userAgent: string | null;
}

@Injectable()
export class PortalService {
  constructor(
    @InjectRepository(OrdenTrabajo) private readonly ots: Repository<OrdenTrabajo>,
    private readonly presupuestos: PresupuestosService,
    private readonly evidencias: EvidenciasService,
    private readonly garantias: GarantiasService,
  ) {}

  /** Vista del cliente: sin RUT, contacto ni comentarios internos de la bitácora. */
  async ver(token: string) {
    const ot = await this.buscar(token);
    const [garantias, presupuestos, evidencias] = await Promise.all([
      this.garantias.vigentesPorVehiculo(ot.vehiculoId),
      this.presupuestos.listarPorOt(ot.id),
      this.evidencias.listar(ot.id),
    ]);
    const abierta = estaAbierta(ot.estado);

    return {
      numero: ot.numero,
      estado: ot.estado,
      motivoIngreso: ot.motivoIngreso,
      fechaIngreso: ot.fechaIngreso,
      fechaEntrega: ot.fechaEntrega,
      totalFinal: ot.totalFinal,
      cliente: { nombre: ot.cliente.nombre },
      vehiculo: {
        patente: ot.vehiculo.patente,
        marca: ot.vehiculo.marca,
        modelo: ot.vehiculo.modelo,
        anio: ot.vehiculo.anio,
      },
      sucursal: { nombre: ot.sucursal.nombre, direccion: ot.sucursal.direccion, telefono: ot.sucursal.telefono },
      lineaDeTiempo: ot.historial.map((h) => ({ estado: h.estadoNuevo, fecha: h.createdAt })),
      presupuestos: presupuestos
        .filter((p) => p.estado !== EstadoPresupuesto.BORRADOR)
        .map((p) => ({
          id: p.id,
          numero: p.numero,
          tipo: p.tipo,
          estado: p.estado,
          notas: p.notas,
          total: p.total,
          enviadoAt: p.enviadoAt,
          decididoAt: p.decididoAt,
          puedeDecidir: abierta && p.estado === EstadoPresupuesto.ENVIADO,
          items: p.items.map((i) => ({
            tipo: i.tipo,
            descripcion: i.descripcion,
            cantidad: i.cantidad,
            precioUnitario: i.precioUnitario,
            subtotal: i.cantidad * i.precioUnitario,
          })),
        })),
      evidencias: evidencias.map((e) => ({ id: e.id, descripcion: e.descripcion, fecha: e.createdAt })),
      garantiasVigentes: garantias.map((g) => ({
        descripcion: g.descripcion,
        meses: g.meses,
        fechaVencimiento: g.fechaVencimiento,
      })),
    };
  }

  async aprobar(token: string, presupuestoId: string, nombre: string | undefined, origen: OrigenPortal) {
    const ot = await this.buscar(token);
    await this.exigirPresupuestoDeLaOt(ot.id, presupuestoId);
    await this.presupuestos.aprobar(presupuestoId, {
      canal: CanalAprobacion.PORTAL,
      nombre: nombre?.trim() || ot.cliente.nombre,
      ...origen,
    });
    return this.ver(token);
  }

  async rechazar(token: string, presupuestoId: string, motivo: string | undefined, nombre: string | undefined, origen: OrigenPortal) {
    if (!motivo?.trim()) throw new BadRequestException('Indique el motivo del rechazo');
    const ot = await this.buscar(token);
    await this.exigirPresupuestoDeLaOt(ot.id, presupuestoId);
    await this.presupuestos.rechazar(
      presupuestoId,
      { canal: CanalAprobacion.PORTAL, nombre: nombre?.trim() || ot.cliente.nombre, ...origen },
      motivo.trim(),
    );
    return this.ver(token);
  }

  async archivoEvidencia(token: string, evidenciaId: string) {
    const ot = await this.buscar(token);
    return this.evidencias.ubicar(evidenciaId, ot.id);
  }

  // ---- Internos ----

  private async buscar(token: string): Promise<OrdenTrabajo> {
    // Respuesta idéntica para token mal formado, inexistente o vencido: no revela nada al que adivina.
    const noEncontrada = new NotFoundException('El enlace no es válido o ya expiró');
    if (!TOKEN_VALIDO.test(token)) throw noEncontrada;

    const ot = await this.ots
      .createQueryBuilder('ot')
      .innerJoinAndSelect('ot.cliente', 'cliente')
      .innerJoinAndSelect('ot.vehiculo', 'vehiculo')
      .innerJoinAndSelect('ot.sucursal', 'sucursal')
      .leftJoinAndSelect('ot.historial', 'historial')
      .where('ot.tokenPortal = :token', { token })
      .orderBy('historial.createdAt', 'ASC')
      .getOne();
    if (!ot) throw noEncontrada;

    const cerrada = [EstadoOt.ENTREGADA, EstadoOt.CANCELADA].includes(ot.estado);
    const cierre = ot.fechaEntrega ?? ot.updatedAt;
    if (cerrada && DateTime.fromJSDate(cierre).plus({ days: VIGENCIA_POST_CIERRE_DIAS }) < DateTime.now()) {
      throw noEncontrada;
    }
    return ot;
  }

  private async exigirPresupuestoDeLaOt(otId: string, presupuestoId: string): Promise<void> {
    const presupuesto = await this.presupuestos.obtener(presupuestoId);
    if (presupuesto.otId !== otId) throw new NotFoundException('Presupuesto no encontrado');
  }
}
