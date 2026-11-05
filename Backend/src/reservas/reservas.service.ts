import { BadRequestException, ConflictException, Inject, Injectable, Logger, NotFoundException } from '@nestjs/common';
import { ConfigType } from '@nestjs/config';
import { Interval } from '@nestjs/schedule';
import { InjectDataSource, InjectRepository } from '@nestjs/typeorm';
import { DateTime } from 'luxon';
import { DataSource, EntityManager, In, IsNull, LessThan, MoreThan, Repository } from 'typeorm';
import { UsuarioAutenticado } from '../common/auth';
import { EstadoReserva } from '../common/enums';
import { appConfig } from '../config/app.config';
import { NotificacionesService } from '../notificaciones/notificaciones.service';
import { PLANTILLAS, ZONA_HORARIA } from '../notificaciones/plantillas';
import { Sucursal } from '../sucursales/sucursal.entity';
import { Vehiculo } from '../vehiculos/vehiculo.entity';
import { dentroDeHorario, generarSlots, seSolapan } from './agenda';
import { CreateReservaDto, FiltroReservasDto } from './reservas.dto';
import { Reserva } from './reserva.entity';

/** Estados que ocupan un box y un vehículo en la agenda. */
const OCUPAN_AGENDA = [EstadoReserva.CONFIRMADA, EstadoReserva.ASISTIO];
/** Margen para registrar una reserva presencial que ya empezó. */
const TOLERANCIA_PASADO_MS = 10 * 60_000;

@Injectable()
export class ReservasService {
  private readonly logger = new Logger(ReservasService.name);

  constructor(
    @InjectRepository(Reserva) private readonly repo: Repository<Reserva>,
    @InjectRepository(Sucursal) private readonly sucursales: Repository<Sucursal>,
    @InjectRepository(Vehiculo) private readonly vehiculos: Repository<Vehiculo>,
    @InjectDataSource() private readonly dataSource: DataSource,
    private readonly notificaciones: NotificacionesService,
    @Inject(appConfig.KEY) private readonly config: ConfigType<typeof appConfig>,
  ) {}

  async disponibilidad(sucursalId: string, fecha: string) {
    const sucursal = await this.obtenerSucursalActiva(sucursalId);
    const slots = generarSlots(fecha, sucursal);
    if (!slots.length) return [];

    const reservas = await this.repo.find({
      where: {
        sucursalId,
        estado: In(OCUPAN_AGENDA),
        inicio: LessThan(slots[slots.length - 1].fin),
        fin: MoreThan(slots[0].inicio),
      },
    });
    const ahora = new Date();
    return slots.map((slot) => {
      const ocupados = reservas.filter((r) => seSolapan(slot, r)).length;
      return {
        inicio: slot.inicio,
        fin: slot.fin,
        boxes: sucursal.boxes,
        ocupados,
        disponible: slot.inicio.getTime() >= ahora.getTime() - TOLERANCIA_PASADO_MS && ocupados < sucursal.boxes,
      };
    });
  }

  listar(filtro: FiltroReservasDto, usuario: UsuarioAutenticado) {
    const sucursalId = filtro.sucursalId ?? usuario.sucursalId ?? undefined;
    const qb = this.repo
      .createQueryBuilder('r')
      .leftJoinAndSelect('r.cliente', 'cliente')
      .leftJoinAndSelect('r.vehiculo', 'vehiculo')
      .leftJoinAndSelect('r.sucursal', 'sucursal')
      .orderBy('r.inicio', 'ASC');
    if (sucursalId) qb.andWhere('r.sucursalId = :sucursalId', { sucursalId });
    if (filtro.estado) qb.andWhere('r.estado = :estado', { estado: filtro.estado });
    if (filtro.clienteId) qb.andWhere('r.clienteId = :clienteId', { clienteId: filtro.clienteId });
    if (filtro.vehiculoId) qb.andWhere('r.vehiculoId = :vehiculoId', { vehiculoId: filtro.vehiculoId });
    if (filtro.desde) {
      qb.andWhere('r.inicio >= :desde', { desde: DateTime.fromISO(filtro.desde, { zone: ZONA_HORARIA }).startOf('day').toJSDate() });
    }
    if (filtro.hasta) {
      qb.andWhere('r.inicio <= :hasta', { hasta: DateTime.fromISO(filtro.hasta, { zone: ZONA_HORARIA }).endOf('day').toJSDate() });
    }
    return qb.take(500).getMany();
  }

  async obtener(id: string): Promise<Reserva> {
    const reserva = await this.repo.findOne({
      where: { id },
      relations: { cliente: true, vehiculo: true, sucursal: true },
    });
    if (!reserva) throw new NotFoundException('Reserva no encontrada');
    return reserva;
  }

  async crear(dto: CreateReservaDto, usuario: UsuarioAutenticado): Promise<Reserva> {
    const sucursal = await this.obtenerSucursalActiva(dto.sucursalId);
    const vehiculo = await this.vehiculos.findOne({ where: { id: dto.vehiculoId }, relations: { cliente: true } });
    if (!vehiculo) throw new NotFoundException('Vehículo no encontrado');
    if (vehiculo.clienteId !== dto.clienteId) {
      throw new BadRequestException('El vehículo no pertenece al cliente indicado');
    }

    const inicio = new Date(dto.inicio);
    if (inicio.getTime() < Date.now() - TOLERANCIA_PASADO_MS) {
      throw new BadRequestException('No se puede reservar en el pasado');
    }
    if (!dentroDeHorario(inicio, sucursal)) {
      throw new BadRequestException(
        `El horario está fuera de la atención de la sucursal (${sucursal.horaApertura}–${sucursal.horaCierre})`,
      );
    }
    const fin = new Date(inicio.getTime() + sucursal.duracionSlotMin * 60_000);

    const reserva = await this.dataSource.transaction(async (manager) => {
      // Serializa las reservas concurrentes de una misma sucursal / vehículo para que la verificación
      // de cupo y la inserción sean atómicas (evita duplicados por doble clic o dos recepcionistas).
      await this.bloquear(manager, `reserva:sucursal:${sucursal.id}`);
      await this.bloquear(manager, `reserva:vehiculo:${vehiculo.id}`);

      const solapadas = await manager.find(Reserva, {
        where: { estado: In(OCUPAN_AGENDA), inicio: LessThan(fin), fin: MoreThan(inicio) },
      });
      if (solapadas.some((r) => r.vehiculoId === vehiculo.id)) {
        throw new ConflictException('El vehículo ya tiene una reserva en ese horario');
      }
      if (solapadas.filter((r) => r.sucursalId === sucursal.id).length >= sucursal.boxes) {
        throw new ConflictException('No hay cupo disponible en ese horario');
      }
      return manager.save(
        manager.create(Reserva, {
          sucursalId: sucursal.id,
          clienteId: dto.clienteId,
          vehiculoId: vehiculo.id,
          inicio,
          fin,
          canal: dto.canal,
          motivo: dto.motivo,
          creadaPorId: usuario.id,
        }),
      );
    });

    await this.notificaciones.notificarCliente(
      vehiculo.cliente,
      'RESERVA_CONFIRMADA',
      PLANTILLAS.RESERVA_CONFIRMADA({
        nombre: vehiculo.cliente.nombre,
        sucursal: sucursal.nombre,
        inicio,
        patente: vehiculo.patente,
      }),
      { reservaId: reserva.id },
    );
    return this.obtener(reserva.id);
  }

  async cancelar(id: string, motivo: string): Promise<Reserva> {
    const reserva = await this.obtener(id);
    this.exigirConfirmada(reserva);
    reserva.estado = EstadoReserva.CANCELADA;
    reserva.motivoCancelacion = motivo;
    return this.guardar(reserva);
  }

  async marcarAsistencia(id: string, asistio: boolean): Promise<Reserva> {
    const reserva = await this.obtener(id);
    this.exigirConfirmada(reserva);
    if (!asistio && reserva.inicio.getTime() > Date.now()) {
      throw new BadRequestException('No se puede marcar inasistencia antes de la hora de la reserva');
    }
    reserva.estado = asistio ? EstadoReserva.ASISTIO : EstadoReserva.NO_SHOW;
    return this.guardar(reserva);
  }

  @Interval(15 * 60_000)
  async enviarRecordatoriosPorReloj(): Promise<void> {
    if (this.config.workersEnabled) await this.enviarRecordatorios();
  }

  /** Avisa a los clientes con reserva en las próximas 24 horas que aún no recibieron recordatorio. */
  async enviarRecordatorios(): Promise<number> {
    const ahora = new Date();
    const pendientes = await this.repo.find({
      where: {
        estado: EstadoReserva.CONFIRMADA,
        recordatorioEnviadoAt: IsNull(),
        inicio: LessThan(new Date(ahora.getTime() + 24 * 3_600_000)),
        fin: MoreThan(ahora),
      },
      relations: { cliente: true, vehiculo: true, sucursal: true },
      take: 200,
    });
    for (const reserva of pendientes) {
      await this.notificaciones.notificarCliente(
        reserva.cliente,
        'RESERVA_RECORDATORIO',
        PLANTILLAS.RESERVA_RECORDATORIO({
          nombre: reserva.cliente.nombre,
          sucursal: reserva.sucursal.nombre,
          inicio: reserva.inicio,
          patente: reserva.vehiculo.patente,
        }),
        { reservaId: reserva.id },
      );
      await this.repo.update(reserva.id, { recordatorioEnviadoAt: new Date() });
    }
    if (pendientes.length) this.logger.log(`${pendientes.length} recordatorio(s) de reserva enviados`);
    return pendientes.length;
  }

  private bloquear(manager: EntityManager, clave: string) {
    return manager.query('SELECT pg_advisory_xact_lock(hashtext($1))', [clave]);
  }

  private exigirConfirmada(reserva: Reserva): void {
    if (reserva.estado !== EstadoReserva.CONFIRMADA) {
      throw new ConflictException(`La reserva ya está ${reserva.estado.toLowerCase()}`);
    }
  }

  private async guardar(reserva: Reserva): Promise<Reserva> {
    await this.repo.update(reserva.id, {
      estado: reserva.estado,
      motivoCancelacion: reserva.motivoCancelacion,
    });
    return this.obtener(reserva.id);
  }

  private async obtenerSucursalActiva(id: string): Promise<Sucursal> {
    const sucursal = await this.sucursales.findOneBy({ id });
    if (!sucursal) throw new NotFoundException('Sucursal no encontrada');
    if (!sucursal.activa) throw new BadRequestException('La sucursal no está activa');
    return sucursal;
  }
}
