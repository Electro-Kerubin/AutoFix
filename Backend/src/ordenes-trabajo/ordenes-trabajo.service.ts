import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { ConfigType } from '@nestjs/config';
import { InjectDataSource, InjectRepository } from '@nestjs/typeorm';
import { randomBytes } from 'node:crypto';
import { DataSource, In, QueryFailedError, Repository } from 'typeorm';
import { UsuarioAutenticado, sucursalDeAlcance } from '../common/auth';
import { EstadoOt, EstadoPresupuesto, EstadoReserva, Rol, SistemaExterno, TipoSync } from '../common/enums';
import { pagina, saltar } from '../common/pagination';
import { appConfig } from '../config/app.config';
import { GarantiasService } from '../garantias/garantias.service';
import { OtCerradaPayload } from '../integraciones/clientes-externos';
import { SyncService } from '../integraciones/sync.service';
import { NotificacionesService } from '../notificaciones/notificaciones.service';
import { PLANTILLAS } from '../notificaciones/plantillas';
import { Presupuesto } from '../presupuestos/presupuesto.entity';
import { Reserva } from '../reservas/reserva.entity';
import { OtRepuesto } from '../repuestos/ot-repuesto.entity';
import { Sucursal } from '../sucursales/sucursal.entity';
import { Usuario } from '../usuarios/usuario.entity';
import { Vehiculo } from '../vehiculos/vehiculo.entity';
import { OrdenTrabajo } from './orden-trabajo.entity';
import { AsignarMecanicoDto, CambiarEstadoDto, CreateOtDto, FiltroOtDto, ValidarRepuestosDto } from './ordenes-trabajo.dto';
import { ESTADOS_ABIERTOS, puedeTransicionar } from './ot-estados';
import { OtHistorial } from './ot-historial.entity';
import { aplicarEstado, bloquearOt, exigirAbierta } from './ot-transiciones';

const UNIQUE_VIOLATION = '23505';

@Injectable()
export class OrdenesTrabajoService {
  constructor(
    @InjectRepository(OrdenTrabajo) private readonly repo: Repository<OrdenTrabajo>,
    @InjectRepository(Vehiculo) private readonly vehiculos: Repository<Vehiculo>,
    @InjectRepository(Sucursal) private readonly sucursales: Repository<Sucursal>,
    @InjectRepository(Usuario) private readonly usuarios: Repository<Usuario>,
    @InjectDataSource() private readonly dataSource: DataSource,
    private readonly garantias: GarantiasService,
    private readonly sync: SyncService,
    private readonly notificaciones: NotificacionesService,
    @Inject(appConfig.KEY) private readonly config: ConfigType<typeof appConfig>,
  ) {}

  async listar(filtro: FiltroOtDto, usuario: UsuarioAutenticado) {
    const sucursalId = sucursalDeAlcance(usuario, filtro.sucursalId);
    const qb = this.repo
      .createQueryBuilder('ot')
      .leftJoinAndSelect('ot.cliente', 'cliente')
      .leftJoinAndSelect('ot.vehiculo', 'vehiculo')
      .leftJoinAndSelect('ot.sucursal', 'sucursal')
      .leftJoinAndSelect('ot.mecanico', 'mecanico')
      .orderBy('ot.fechaIngreso', 'DESC')
      .skip(saltar(filtro))
      .take(filtro.limit);

    if (sucursalId) qb.andWhere('ot.sucursalId = :sucursalId', { sucursalId });
    if (filtro.estado) qb.andWhere('ot.estado = :estado', { estado: filtro.estado });
    if (filtro.abiertas) qb.andWhere('ot.estado IN (:...abiertos)', { abiertos: ESTADOS_ABIERTOS });
    if (filtro.vehiculoId) qb.andWhere('ot.vehiculoId = :vehiculoId', { vehiculoId: filtro.vehiculoId });
    if (filtro.clienteId) qb.andWhere('ot.clienteId = :clienteId', { clienteId: filtro.clienteId });
    if (filtro.mecanicoId) qb.andWhere('ot.mecanicoId = :mecanicoId', { mecanicoId: filtro.mecanicoId });
    if (filtro.q?.trim()) {
      qb.andWhere(
        '(vehiculo.patente ILIKE :q OR cliente.nombre ILIKE :q OR cliente.rut ILIKE :q OR CAST(ot.secuencia AS TEXT) ILIKE :q)',
        { q: `%${filtro.q.trim()}%` },
      );
    }
    const [items, total] = await qb.getManyAndCount();
    return pagina(items, total, filtro);
  }

  async obtener(id: string): Promise<OrdenTrabajo> {
    const ot = await this.repo.findOne({
      where: { id },
      relations: {
        sucursal: true,
        cliente: true,
        vehiculo: true,
        mecanico: true,
        repuestos: { repuesto: true, sucursalOrigen: true },
        presupuestos: { items: true },
        evidencias: true,
        historial: { usuario: true },
      },
      order: {
        historial: { createdAt: 'ASC' },
        presupuestos: { numero: 'ASC' },
        evidencias: { createdAt: 'ASC' },
        repuestos: { createdAt: 'ASC' },
      },
    });
    if (!ot) throw new NotFoundException('Orden de trabajo no encontrada');
    return ot;
  }

  async crear(dto: CreateOtDto, usuario: UsuarioAutenticado) {
    const sucursal = await this.sucursales.findOneBy({ id: dto.sucursalId });
    if (!sucursal) throw new NotFoundException('Sucursal no encontrada');
    if (!sucursal.activa) throw new BadRequestException('La sucursal no está activa');

    const vehiculo = await this.vehiculos.findOne({ where: { id: dto.vehiculoId }, relations: { cliente: true } });
    if (!vehiculo) throw new NotFoundException('Vehículo no encontrado');
    if (vehiculo.clienteId !== dto.clienteId) {
      throw new BadRequestException('El vehículo no pertenece al cliente indicado');
    }
    if (vehiculo.kilometraje != null && dto.kilometraje < vehiculo.kilometraje) {
      throw new BadRequestException(`El kilometraje no puede ser menor al último registrado (${vehiculo.kilometraje} km)`);
    }
    if (dto.mecanicoId) await this.exigirMecanico(dto.mecanicoId, sucursal.id);

    let id: string;
    try {
      id = await this.dataSource.transaction(async (manager) => {
        const abierta = await manager.findOne(OrdenTrabajo, {
          where: { vehiculoId: vehiculo.id, estado: In(ESTADOS_ABIERTOS) },
        });
        if (abierta) throw new ConflictException(`El vehículo ya tiene una OT abierta (${abierta.numero})`);

        if (dto.reservaId) {
          const reserva = await manager.findOneBy(Reserva, { id: dto.reservaId });
          if (!reserva || reserva.vehiculoId !== vehiculo.id) {
            throw new BadRequestException('La reserva no corresponde a este vehículo');
          }
          if (reserva.estado === EstadoReserva.CANCELADA) throw new ConflictException('La reserva está cancelada');
          await manager.update(Reserva, reserva.id, { estado: EstadoReserva.ASISTIO });
        }

        const ot = await manager.save(
          manager.create(OrdenTrabajo, {
            sucursalId: sucursal.id,
            clienteId: dto.clienteId,
            vehiculoId: vehiculo.id,
            reservaId: dto.reservaId ?? null,
            motivoIngreso: dto.motivoIngreso,
            kilometraje: dto.kilometraje,
            observacionesRecepcion: dto.observacionesRecepcion ?? null,
            mecanicoId: dto.mecanicoId ?? null,
            creadaPorId: usuario.id,
            tokenPortal: randomBytes(24).toString('hex'),
          }),
        );
        await manager.insert(OtHistorial, {
          otId: ot.id,
          estadoAnterior: null,
          estadoNuevo: EstadoOt.RECEPCIONADA,
          usuarioId: usuario.id,
          comentario: 'Recepción del vehículo',
        });
        await manager.update(Vehiculo, vehiculo.id, { kilometraje: dto.kilometraje });
        return ot.id;
      });
    } catch (error) {
      // La carrera entre dos recepciones simultáneas la resuelve el índice único parcial.
      if (error instanceof QueryFailedError && (error.driverError as { code?: string })?.code === UNIQUE_VIOLATION) {
        throw new ConflictException('El vehículo ya tiene una OT abierta');
      }
      throw error;
    }

    const orden = await this.obtener(id);
    await this.notificaciones.notificarCliente(
      vehiculo.cliente,
      'VEHICULO_RECEPCIONADO',
      PLANTILLAS.VEHICULO_RECEPCIONADO({
        nombre: vehiculo.cliente.nombre,
        patente: vehiculo.patente,
        numero: orden.numero,
        link: await this.linkPortal(id),
      }),
      { otId: id },
    );
    // Aviso para la recepción: garantías vigentes del vehículo antes de cobrar (REQ-06).
    const garantiasVigentes = await this.garantias.vigentesPorVehiculo(vehiculo.id);
    return { orden, garantiasVigentes };
  }

  async cambiarEstado(id: string, dto: CambiarEstadoDto, usuario: UsuarioAutenticado): Promise<OrdenTrabajo> {
    const nuevo = dto.estado;
    if ([EstadoOt.ENTREGADA, EstadoOt.CANCELADA].includes(nuevo) && usuario.rol === Rol.MECANICO) {
      throw new ForbiddenException('Sólo recepción o jefatura de taller puede entregar o cancelar una OT');
    }
    if (nuevo === EstadoOt.PRESUPUESTO_PENDIENTE) {
      throw new BadRequestException('Este estado se alcanza al enviar un presupuesto al cliente');
    }

    await this.dataSource.transaction(async (manager) => {
      const ot = await bloquearOt(manager, id);
      if (!puedeTransicionar(ot.estado, nuevo)) {
        throw new ConflictException(`No se puede pasar la OT de ${ot.estado} a ${nuevo}`);
      }

      switch (nuevo) {
        case EstadoOt.EN_REPARACION: {
          const pendiente = await manager.existsBy(Presupuesto, { otId: id, estado: EstadoPresupuesto.ENVIADO });
          if (pendiente) throw new ConflictException('Hay un presupuesto pendiente de respuesta del cliente');
          if (!(await manager.existsBy(Presupuesto, { otId: id, estado: EstadoPresupuesto.APROBADO }))) {
            throw new ConflictException('Se requiere un presupuesto aprobado por el cliente para iniciar la reparación');
          }
          break;
        }
        case EstadoOt.CANCELADA: {
          if (!dto.comentario) throw new BadRequestException('Indique el motivo de la cancelación');
          if (await manager.existsBy(OtRepuesto, { otId: id })) {
            throw new ConflictException('Retire los repuestos asignados antes de cancelar la OT');
          }
          break;
        }
        case EstadoOt.ENTREGADA:
          await this.cerrar(manager, ot);
          break;
        default:
          break;
      }
      await aplicarEstado(manager, ot, nuevo, usuario.id, dto.comentario);
    });

    const orden = await this.obtener(id);
    if (nuevo === EstadoOt.LISTA_ENTREGA) {
      await this.notificaciones.notificarCliente(
        orden.cliente,
        'VEHICULO_LISTO',
        PLANTILLAS.VEHICULO_LISTO({ nombre: orden.cliente.nombre, patente: orden.vehiculo.patente, sucursal: orden.sucursal.nombre }),
        { otId: id },
      );
    }
    return orden;
  }

  async asignarMecanico(id: string, dto: AsignarMecanicoDto): Promise<OrdenTrabajo> {
    const ot = await this.repo.findOneBy({ id });
    if (!ot) throw new NotFoundException('Orden de trabajo no encontrada');
    exigirAbierta(ot);
    await this.exigirMecanico(dto.mecanicoId, ot.sucursalId);
    await this.repo.update(id, { mecanicoId: dto.mecanicoId });
    return this.obtener(id);
  }

  /**
   * El responsable confirma que los repuestos registrados son los realmente usados (o que no se usó ninguno).
   * Sin esta validación no se puede entregar la OT (riesgo R-08: consumo no registrado → compras urgentes).
   */
  async validarRepuestos(id: string, dto: ValidarRepuestosDto, usuario: UsuarioAutenticado): Promise<OrdenTrabajo> {
    await this.dataSource.transaction(async (manager) => {
      const ot = await bloquearOt(manager, id);
      exigirAbierta(ot);
      const cantidad = await manager.countBy(OtRepuesto, { otId: id });
      if (cantidad === 0 && !dto.sinRepuestos) {
        throw new BadRequestException('No hay repuestos asignados: asígnelos o declare que la OT no usó repuestos');
      }
      if (cantidad > 0 && dto.sinRepuestos) {
        throw new BadRequestException('La OT tiene repuestos asignados; no puede declararse sin repuestos');
      }
      await manager.update(OrdenTrabajo, id, { repuestosValidadosAt: new Date(), repuestosValidadosPorId: usuario.id });
    });
    return this.obtener(id);
  }

  async linkPortal(otId: string): Promise<string> {
    const ot = await this.repo.createQueryBuilder('ot').addSelect('ot.tokenPortal').where('ot.id = :otId', { otId }).getOneOrFail();
    return `${this.config.publicUrl}/portal/${ot.tokenPortal}`;
  }

  // ---- Internos ----

  /** Validaciones y efectos de la entrega: total final, garantías y envío al ERP (misma transacción). */
  private async cerrar(manager: DataSource['manager'], ot: OrdenTrabajo): Promise<void> {
    if (!ot.repuestosValidadosAt) {
      throw new ConflictException('Valide los repuestos utilizados antes de entregar la OT');
    }
    if (await manager.existsBy(Presupuesto, { otId: ot.id, estado: EstadoPresupuesto.ENVIADO })) {
      throw new ConflictException('Hay un presupuesto pendiente de respuesta del cliente');
    }
    const aprobados = await manager.find(Presupuesto, {
      where: { otId: ot.id, estado: EstadoPresupuesto.APROBADO },
      relations: { items: true },
      order: { numero: 'ASC' },
    });
    const total = aprobados.reduce((suma, p) => suma + p.total, 0);
    const fechaEntrega = new Date();

    await manager.update(OrdenTrabajo, ot.id, { fechaEntrega, totalFinal: total });
    await this.garantias.crearParaEntrega(manager, ot, fechaEntrega);

    const detalle = await manager.findOneOrFail(OrdenTrabajo, {
      where: { id: ot.id },
      relations: { sucursal: true, cliente: true, vehiculo: true },
    });
    const payload: OtCerradaPayload = {
      otId: ot.id,
      numero: detalle.numero,
      sucursalCodigo: detalle.sucursal.codigo,
      cliente: { rut: detalle.cliente.rut, nombre: detalle.cliente.nombre },
      vehiculo: { patente: detalle.vehiculo.patente, marca: detalle.vehiculo.marca, modelo: detalle.vehiculo.modelo },
      fechaIngreso: detalle.fechaIngreso.toISOString(),
      fechaEntrega: fechaEntrega.toISOString(),
      total,
      lineas: aprobados.flatMap((p) =>
        p.items.map((i) => ({ tipo: i.tipo, descripcion: i.descripcion, cantidad: i.cantidad, precioUnitario: i.precioUnitario })),
      ),
    };
    await this.sync.encolar(manager, SistemaExterno.ERP, TipoSync.OT_CERRADA, ot.id, payload);
  }

  private async exigirMecanico(usuarioId: string, sucursalId: string): Promise<void> {
    const mecanico = await this.usuarios.findOneBy({ id: usuarioId });
    if (!mecanico?.activo || ![Rol.MECANICO, Rol.JEFE_TALLER].includes(mecanico.rol)) {
      throw new BadRequestException('El responsable debe ser un mecánico o jefe de taller activo');
    }
    if (mecanico.sucursalId !== sucursalId) {
      throw new BadRequestException('El responsable debe pertenecer a la sucursal de la OT');
    }
  }
}
