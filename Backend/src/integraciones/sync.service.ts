import { Inject, Injectable, Logger, NotFoundException } from '@nestjs/common';
import { ConfigType } from '@nestjs/config';
import { Interval } from '@nestjs/schedule';
import { InjectRepository } from '@nestjs/typeorm';
import { EntityManager, In, Repository } from 'typeorm';
import { EstadoSync, SistemaExterno, TipoSync } from '../common/enums';
import { appConfig } from '../config/app.config';
import {
  ConsumoPayload,
  ErpClient,
  InventarioClient,
  OtCerradaPayload,
} from './clientes-externos';
import { SyncJob } from './sync-job.entity';

export const MAX_INTENTOS = 6;
const LOTE = 20;
/** Tiempo que un job queda "reservado" mientras se procesa, para que otra instancia no lo tome. */
const ARRIENDO_MS = 5 * 60_000;

/** Espera antes del reintento n: 1, 2, 4, 8, 16 min… con tope de 60. */
export const esperaMinutos = (intentos: number): number => Math.min(2 ** Math.max(intentos - 1, 0), 60);

@Injectable()
export class SyncService {
  private readonly logger = new Logger(SyncService.name);
  private procesando = false;

  constructor(
    @InjectRepository(SyncJob) private readonly repo: Repository<SyncJob>,
    private readonly erp: ErpClient,
    private readonly inventario: InventarioClient,
    @Inject(appConfig.KEY) private readonly config: ConfigType<typeof appConfig>,
  ) {}

  /** Encola dentro de la transacción del llamador. Es idempotente por (tipo, entidadId). */
  async encolar(
    manager: EntityManager,
    sistema: SistemaExterno,
    tipo: TipoSync,
    entidadId: string,
    payload: OtCerradaPayload | ConsumoPayload,
  ): Promise<void> {
    await manager
      .createQueryBuilder()
      .insert()
      .into(SyncJob)
      .values({ sistema, tipo, entidadId, payload })
      .orIgnore()
      .execute();
  }

  listar(estado?: EstadoSync, limit = 100): Promise<SyncJob[]> {
    return this.repo.find({ where: estado ? { estado } : {}, order: { createdAt: 'DESC' }, take: limit });
  }

  async resumen() {
    const filas: { estado: EstadoSync; total: string }[] = await this.repo
      .createQueryBuilder('j')
      .select('j.estado', 'estado')
      .addSelect('COUNT(*)', 'total')
      .groupBy('j.estado')
      .getRawMany();
    return Object.fromEntries(filas.map((f) => [f.estado, Number(f.total)]));
  }

  /** Consumos/reversas de repuestos que el inventario aún no recibió. */
  pendientesInventario(): Promise<number> {
    return this.repo.count({
      where: { sistema: SistemaExterno.INVENTARIO, estado: In([EstadoSync.PENDIENTE, EstadoSync.ERROR, EstadoSync.FALLIDO]) },
    });
  }

  async reintentar(id: string): Promise<SyncJob> {
    const job = await this.repo.findOneBy({ id });
    if (!job) throw new NotFoundException('Job de sincronización no encontrado');
    if (job.estado !== EstadoSync.ENVIADO) {
      job.estado = EstadoSync.PENDIENTE;
      job.intentos = 0;
      job.proximoIntentoAt = new Date();
      await this.repo.save(job);
    }
    return job;
  }

  @Interval(30_000)
  async procesarPorReloj(): Promise<void> {
    if (!this.config.workersEnabled) return;
    await this.procesarPendientes();
  }

  /** Despacha los jobs vencidos. Devuelve cuántos se intentaron. */
  async procesarPendientes(): Promise<number> {
    if (this.procesando) return 0;
    this.procesando = true;
    try {
      const jobs = await this.reservarLote();
      for (const job of jobs) await this.despachar(job);
      return jobs.length;
    } catch (error) {
      this.logger.error(`Fallo al procesar la cola de sincronización: ${String(error)}`);
      return 0;
    } finally {
      this.procesando = false;
    }
  }

  private reservarLote(): Promise<SyncJob[]> {
    return this.repo.manager.transaction(async (manager) => {
      const jobs = await manager
        .getRepository(SyncJob)
        .createQueryBuilder('j')
        .setLock('pessimistic_write')
        .setOnLocked('skip_locked')
        .where('j.estado IN (:...estados)', { estados: [EstadoSync.PENDIENTE, EstadoSync.ERROR] })
        .andWhere('j.proximoIntentoAt <= now()')
        .orderBy('j.createdAt', 'ASC')
        .limit(LOTE)
        .getMany();
      for (const job of jobs) job.proximoIntentoAt = new Date(Date.now() + ARRIENDO_MS);
      return jobs.length ? manager.save(jobs) : jobs;
    });
  }

  private async despachar(job: SyncJob): Promise<void> {
    try {
      job.referenciaExterna = await this.llamarSistema(job);
      job.estado = EstadoSync.ENVIADO;
      job.enviadoAt = new Date();
      job.ultimoError = null;
    } catch (error) {
      job.intentos += 1;
      job.ultimoError = error instanceof Error ? error.message : String(error);
      job.estado = job.intentos >= MAX_INTENTOS ? EstadoSync.FALLIDO : EstadoSync.ERROR;
      job.proximoIntentoAt = new Date(Date.now() + esperaMinutos(job.intentos) * 60_000);
      this.logger.warn(`Sync ${job.tipo} ${job.entidadId} falló (intento ${job.intentos}): ${job.ultimoError}`);
    }
    await this.repo.save(job);
  }

  private async llamarSistema(job: SyncJob): Promise<string | null> {
    switch (job.tipo) {
      case TipoSync.OT_CERRADA:
        return (await this.erp.enviarOtCerrada(job.payload as unknown as OtCerradaPayload)).referencia;
      case TipoSync.CONSUMO_REPUESTO:
      case TipoSync.REVERSA_CONSUMO:
        await this.inventario.registrarConsumo(job.payload as unknown as ConsumoPayload);
        return null;
    }
  }
}
