import { BadRequestException, ConflictException, Inject, Injectable, NotFoundException } from '@nestjs/common';
import { ConfigType } from '@nestjs/config';
import { InjectDataSource, InjectRepository } from '@nestjs/typeorm';
import { DataSource, EntityManager, In, Repository } from 'typeorm';
import {
  CanalAprobacion,
  EstadoOt,
  EstadoPresupuesto,
  TipoItem,
  TipoPresupuesto,
} from '../common/enums';
import { appConfig } from '../config/app.config';
import { NotificacionesService } from '../notificaciones/notificaciones.service';
import { PLANTILLAS } from '../notificaciones/plantillas';
import { EvidenciaOt } from '../ordenes-trabajo/evidencia.entity';
import { OrdenTrabajo } from '../ordenes-trabajo/orden-trabajo.entity';
import { aplicarEstado, bloquearOt, exigirAbierta } from '../ordenes-trabajo/ot-transiciones';
import { Repuesto } from '../repuestos/repuesto.entity';
import { huellaDecision, totalPresupuesto } from './calculos';
import { CatalogoFalla } from './catalogo-falla.entity';
import { CreateFallaDto, GuardarPresupuestoDto, ItemPresupuestoDto } from './presupuestos.dto';
import { PresupuestoItem } from './presupuesto-item.entity';
import { Presupuesto } from './presupuesto.entity';

/** Quién y desde dónde toma la decisión; queda como evidencia en el presupuesto. */
export interface OrigenDecision {
  canal: CanalAprobacion;
  nombre: string;
  ip?: string | null;
  userAgent?: string | null;
  usuarioId?: string | null;
}

const PENDIENTES = [EstadoPresupuesto.BORRADOR, EstadoPresupuesto.ENVIADO];

@Injectable()
export class PresupuestosService {
  constructor(
    @InjectRepository(Presupuesto) private readonly repo: Repository<Presupuesto>,
    @InjectRepository(CatalogoFalla) private readonly fallas: Repository<CatalogoFalla>,
    @InjectRepository(EvidenciaOt) private readonly evidencias: Repository<EvidenciaOt>,
    @InjectRepository(OrdenTrabajo) private readonly ots: Repository<OrdenTrabajo>,
    @InjectDataSource() private readonly dataSource: DataSource,
    private readonly notificaciones: NotificacionesService,
    @Inject(appConfig.KEY) private readonly config: ConfigType<typeof appConfig>,
  ) {}

  listarPorOt(otId: string): Promise<Presupuesto[]> {
    return this.repo.find({
      where: { otId },
      relations: { items: true },
      order: { numero: 'ASC', items: { createdAt: 'ASC' } },
    });
  }

  async obtener(id: string): Promise<Presupuesto> {
    const presupuesto = await this.repo.findOne({
      where: { id },
      relations: { items: true },
      order: { items: { createdAt: 'ASC' } },
    });
    if (!presupuesto) throw new NotFoundException('Presupuesto no encontrado');
    return presupuesto;
  }

  async crear(otId: string, dto: GuardarPresupuestoDto, usuarioId: string): Promise<Presupuesto> {
    const id = await this.dataSource.transaction(async (manager) => {
      const ot = await bloquearOt(manager, otId);
      exigirAbierta(ot);

      const existentes = await manager.find(Presupuesto, { where: { otId } });
      if (existentes.some((p) => PENDIENTES.includes(p.estado))) {
        throw new ConflictException('La OT ya tiene un presupuesto en borrador o pendiente de respuesta del cliente');
      }
      const hayAprobado = existentes.some((p) => p.estado === EstadoPresupuesto.APROBADO);
      const items = await this.construirItems(manager, dto.items);

      const presupuesto = await manager.save(
        manager.create(Presupuesto, {
          otId,
          numero: existentes.reduce((max, p) => Math.max(max, p.numero), 0) + 1,
          tipo: hayAprobado ? TipoPresupuesto.ADICIONAL : TipoPresupuesto.INICIAL,
          estado: EstadoPresupuesto.BORRADOR,
          notas: dto.notas ?? null,
          total: totalPresupuesto(items),
          creadoPorId: usuarioId,
          items: items.map((i) => manager.create(PresupuestoItem, i)),
        }),
      );
      return presupuesto.id;
    });
    return this.obtener(id);
  }

  async actualizar(id: string, dto: GuardarPresupuestoDto): Promise<Presupuesto> {
    await this.dataSource.transaction(async (manager) => {
      const presupuesto = await this.bloquear(manager, id);
      this.exigirBorrador(presupuesto);
      const items = await this.construirItems(manager, dto.items);
      await manager.delete(PresupuestoItem, { presupuestoId: id });
      await manager.insert(PresupuestoItem, items.map((i) => ({ ...i, presupuestoId: id })));
      await manager.update(Presupuesto, id, { notas: dto.notas ?? null, total: totalPresupuesto(items) });
    });
    return this.obtener(id);
  }

  async eliminarBorrador(id: string): Promise<void> {
    const presupuesto = await this.obtener(id);
    this.exigirBorrador(presupuesto);
    await this.repo.delete(id);
  }

  /** Envía el presupuesto al cliente y deja la OT esperando su respuesta. */
  async enviar(id: string, usuarioId: string): Promise<Presupuesto> {
    const { otId } = await this.obtener(id);
    await this.dataSource.transaction(async (manager) => {
      const ot = await bloquearOt(manager, otId);
      exigirAbierta(ot);
      const presupuesto = await this.bloquear(manager, id);
      this.exigirBorrador(presupuesto);

      if (presupuesto.tipo === TipoPresupuesto.ADICIONAL && !(await manager.existsBy(EvidenciaOt, { otId }))) {
        throw new BadRequestException(
          'Un presupuesto adicional requiere al menos una evidencia fotográfica adjunta a la OT',
        );
      }
      if (ot.estado !== EstadoOt.PRESUPUESTO_PENDIENTE) {
        await aplicarEstado(manager, ot, EstadoOt.PRESUPUESTO_PENDIENTE, usuarioId, `Presupuesto #${presupuesto.numero} enviado al cliente`);
      }
      await manager.update(Presupuesto, id, { estado: EstadoPresupuesto.ENVIADO, enviadoAt: new Date() });
    });

    const presupuesto = await this.obtener(id);
    await this.avisarAlCliente(presupuesto);
    return presupuesto;
  }

  async aprobar(id: string, origen: OrigenDecision): Promise<Presupuesto> {
    return this.decidir(id, true, origen);
  }

  async rechazar(id: string, origen: OrigenDecision, motivo: string): Promise<Presupuesto> {
    return this.decidir(id, false, origen, motivo);
  }

  // ---- Catálogo de fallas ----

  listarFallas(): Promise<CatalogoFalla[]> {
    return this.fallas.find({ where: { activa: true }, order: { categoria: 'ASC', nombre: 'ASC' } });
  }

  async crearFalla(dto: CreateFallaDto): Promise<CatalogoFalla> {
    if (await this.fallas.existsBy({ codigo: dto.codigo })) {
      throw new ConflictException(`Ya existe una falla con código ${dto.codigo}`);
    }
    return this.fallas.save(this.fallas.create(dto));
  }

  // ---- Internos ----

  private async decidir(id: string, aprobado: boolean, origen: OrigenDecision, motivo?: string): Promise<Presupuesto> {
    const { otId } = await this.obtener(id);
    await this.dataSource.transaction(async (manager) => {
      const ot = await bloquearOt(manager, otId);
      exigirAbierta(ot);
      const presupuesto = await this.bloquear(manager, id);
      if (presupuesto.estado !== EstadoPresupuesto.ENVIADO) {
        throw new ConflictException('El presupuesto no está pendiente de respuesta del cliente');
      }
      const items = await manager.find(PresupuestoItem, { where: { presupuestoId: id } });
      const decididoAt = new Date();
      const estado = aprobado ? EstadoPresupuesto.APROBADO : EstadoPresupuesto.RECHAZADO;

      await manager.update(Presupuesto, id, {
        estado,
        decididoAt,
        decisionCanal: origen.canal,
        decisionNombre: origen.nombre,
        decisionIp: origen.ip ?? null,
        decisionUserAgent: origen.userAgent?.slice(0, 300) ?? null,
        decisionHash: huellaDecision({
          presupuestoId: id,
          decision: estado === EstadoPresupuesto.APROBADO ? 'APROBADO' : 'RECHAZADO',
          total: presupuesto.total,
          decididoAt,
          items,
        }),
        motivoRechazo: aprobado ? null : (motivo ?? null),
      });

      if (ot.estado === EstadoOt.PRESUPUESTO_PENDIENTE) {
        if (aprobado) {
          await aplicarEstado(manager, ot, EstadoOt.EN_REPARACION, origen.usuarioId ?? null, `Presupuesto #${presupuesto.numero} aprobado (${origen.canal})`);
        } else {
          const hayAprobado = await manager.existsBy(Presupuesto, { otId, estado: EstadoPresupuesto.APROBADO });
          await aplicarEstado(
            manager,
            ot,
            hayAprobado ? EstadoOt.EN_REPARACION : EstadoOt.EN_DIAGNOSTICO,
            origen.usuarioId ?? null,
            `Presupuesto #${presupuesto.numero} rechazado: ${motivo ?? 'sin motivo'}`,
          );
        }
      }
    });
    return this.obtener(id);
  }

  private async construirItems(manager: EntityManager, dtos: ItemPresupuestoDto[]) {
    const repuestoIds = [...new Set(dtos.map((i) => i.repuestoId).filter((x): x is string => !!x))];
    const repuestos = repuestoIds.length ? await manager.find(Repuesto, { where: { id: In(repuestoIds) } }) : [];
    const porId = new Map(repuestos.map((r) => [r.id, r]));

    return dtos.map((dto) => {
      const repuesto = dto.repuestoId ? porId.get(dto.repuestoId) : undefined;
      if (dto.repuestoId && !repuesto) throw new NotFoundException(`Repuesto ${dto.repuestoId} no encontrado`);
      if (dto.tipo === TipoItem.MANO_OBRA && dto.repuestoId) {
        throw new BadRequestException('Un ítem de mano de obra no puede referenciar un repuesto');
      }
      const descripcion = dto.descripcion ?? repuesto?.nombre;
      const precioUnitario = dto.precioUnitario ?? repuesto?.precioVenta;
      if (!descripcion) throw new BadRequestException('Cada ítem requiere una descripción');
      if (precioUnitario === undefined) throw new BadRequestException(`El ítem "${descripcion}" requiere un precio`);
      return {
        tipo: dto.tipo,
        descripcion,
        cantidad: dto.cantidad,
        precioUnitario,
        repuestoId: dto.repuestoId ?? null,
        catalogoFallaId: dto.catalogoFallaId ?? null,
        garantiaMeses: dto.garantiaMeses ?? 0,
      };
    });
  }

  private async bloquear(manager: EntityManager, id: string): Promise<Presupuesto> {
    const presupuesto = await manager.findOne(Presupuesto, { where: { id }, lock: { mode: 'pessimistic_write' } });
    if (!presupuesto) throw new NotFoundException('Presupuesto no encontrado');
    return presupuesto;
  }

  private exigirBorrador(presupuesto: Presupuesto): void {
    if (presupuesto.estado !== EstadoPresupuesto.BORRADOR) {
      throw new ConflictException('Sólo se puede modificar un presupuesto en borrador; cree un presupuesto adicional');
    }
  }

  private async avisarAlCliente(presupuesto: Presupuesto): Promise<void> {
    const ot = await this.ots
      .createQueryBuilder('ot')
      .addSelect('ot.tokenPortal')
      .leftJoinAndSelect('ot.cliente', 'cliente')
      .leftJoinAndSelect('ot.vehiculo', 'vehiculo')
      .where('ot.id = :id', { id: presupuesto.otId })
      .getOne();
    if (!ot) return;
    await this.notificaciones.notificarCliente(
      ot.cliente,
      'PRESUPUESTO_POR_APROBAR',
      PLANTILLAS.PRESUPUESTO_POR_APROBAR({
        nombre: ot.cliente.nombre,
        patente: ot.vehiculo.patente,
        total: presupuesto.total,
        link: `${this.config.publicUrl}/portal/${ot.tokenPortal}`,
      }),
      { otId: ot.id },
    );
  }
}
