import { Column, Entity, Index } from 'typeorm';
import { EntidadBase } from '../common/base.entity';
import { EstadoSync, SistemaExterno, TipoSync } from '../common/enums';

/**
 * Cola de salida (outbox): cada cambio que debe llegar al ERP o al sistema de inventarios se registra en la
 * misma transacción que el cambio de negocio y se despacha después, con reintentos. Así una caída del sistema
 * externo nunca bloquea ni deja inconsistente la operación del taller.
 */
@Entity('sync_jobs')
@Index(['tipo', 'entidadId'], { unique: true })
@Index(['estado', 'proximoIntentoAt'])
export class SyncJob extends EntidadBase {
  @Column({ type: 'varchar', length: 12 })
  sistema: SistemaExterno;

  @Column({ type: 'varchar', length: 20 })
  tipo: TipoSync;

  @Column({ type: 'uuid' })
  entidadId: string;

  @Column({ type: 'jsonb' })
  payload: object;

  @Column({ type: 'varchar', length: 10, default: EstadoSync.PENDIENTE })
  estado: EstadoSync;

  @Column({ type: 'int', default: 0 })
  intentos: number;

  @Column({ type: 'text', nullable: true })
  ultimoError: string | null;

  @Column({ type: 'varchar', length: 120, nullable: true })
  referenciaExterna: string | null;

  @Column({ type: 'timestamptz', default: () => 'now()' })
  proximoIntentoAt: Date;

  @Column({ type: 'timestamptz', nullable: true })
  enviadoAt: Date | null;
}
