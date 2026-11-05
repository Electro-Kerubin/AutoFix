import { Column, Entity, Index, JoinColumn, ManyToOne, OneToMany } from 'typeorm';
import { EntidadBase } from '../common/base.entity';
import { CanalAprobacion, EstadoPresupuesto, TipoPresupuesto } from '../common/enums';
import { OrdenTrabajo } from '../ordenes-trabajo/orden-trabajo.entity';
import { PresupuestoItem } from './presupuesto-item.entity';

@Entity('presupuestos')
@Index(['otId', 'numero'], { unique: true })
export class Presupuesto extends EntidadBase {
  @Column({ type: 'uuid' })
  otId: string;

  @ManyToOne(() => OrdenTrabajo, (ot) => ot.presupuestos, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'otId' })
  ordenTrabajo: OrdenTrabajo;

  /** Correlativo dentro de la OT (1 = presupuesto inicial, 2.. = trabajos adicionales). */
  @Column({ type: 'int' })
  numero: number;

  @Column({ type: 'varchar', length: 10 })
  tipo: TipoPresupuesto;

  @Column({ type: 'varchar', length: 10, default: EstadoPresupuesto.BORRADOR })
  estado: EstadoPresupuesto;

  @Column({ type: 'text', nullable: true })
  notas: string | null;

  /** CLP, calculado en el servidor a partir de los ítems. */
  @Column({ type: 'int', default: 0 })
  total: number;

  @Column({ type: 'uuid', nullable: true })
  creadoPorId: string | null;

  @Column({ type: 'timestamptz', nullable: true })
  enviadoAt: Date | null;

  // ---- Evidencia de la decisión del cliente (REQ-03) ----
  @Column({ type: 'timestamptz', nullable: true })
  decididoAt: Date | null;

  @Column({ type: 'varchar', length: 10, nullable: true })
  decisionCanal: CanalAprobacion | null;

  @Column({ type: 'varchar', length: 160, nullable: true })
  decisionNombre: string | null;

  @Column({ type: 'varchar', length: 64, nullable: true })
  decisionIp: string | null;

  @Column({ type: 'varchar', length: 300, nullable: true })
  decisionUserAgent: string | null;

  /** SHA-256 del contenido aprobado (ítems, total y momento): permite demostrar que no fue alterado. */
  @Column({ type: 'varchar', length: 64, nullable: true })
  decisionHash: string | null;

  @Column({ type: 'varchar', length: 500, nullable: true })
  motivoRechazo: string | null;

  @OneToMany(() => PresupuestoItem, (item) => item.presupuesto, { cascade: ['insert'] })
  items: PresupuestoItem[];
}
