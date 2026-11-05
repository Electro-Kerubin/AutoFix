import { Column, CreateDateColumn, Entity, Index, JoinColumn, ManyToOne, PrimaryGeneratedColumn } from 'typeorm';
import { OrdenTrabajo } from './orden-trabajo.entity';

/** Foto u otro respaldo digital de un hallazgo (R-12: evidencia obligatoria en presupuestos adicionales). */
@Entity('evidencias_ot')
export class EvidenciaOt {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Index()
  @Column({ type: 'uuid' })
  otId: string;

  @ManyToOne(() => OrdenTrabajo, (ot) => ot.evidencias, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'otId' })
  ordenTrabajo: OrdenTrabajo;

  @Column({ type: 'varchar', length: 255 })
  nombreOriginal: string;

  /** Nombre del archivo en disco (aleatorio); nunca se usa el nombre que envía el cliente. */
  @Column({ type: 'varchar', length: 80 })
  archivo: string;

  @Column({ type: 'varchar', length: 60 })
  mimeType: string;

  @Column({ type: 'int' })
  tamano: number;

  @Column({ type: 'varchar', length: 300, nullable: true })
  descripcion: string | null;

  @Column({ type: 'uuid', nullable: true })
  subidaPorId: string | null;

  @CreateDateColumn({ type: 'timestamptz' })
  createdAt: Date;
}
