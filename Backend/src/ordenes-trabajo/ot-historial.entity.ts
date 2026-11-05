import { Column, CreateDateColumn, Entity, Index, JoinColumn, ManyToOne, PrimaryGeneratedColumn } from 'typeorm';
import { EstadoOt } from '../common/enums';
import { Usuario } from '../usuarios/usuario.entity';
import { OrdenTrabajo } from './orden-trabajo.entity';

/** Bitácora inmutable de cambios de estado: alimenta la línea de tiempo del portal y la trazabilidad. */
@Entity('ot_historial')
export class OtHistorial {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Index()
  @Column({ type: 'uuid' })
  otId: string;

  @ManyToOne(() => OrdenTrabajo, (ot) => ot.historial, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'otId' })
  ordenTrabajo: OrdenTrabajo;

  @Column({ type: 'varchar', length: 24, nullable: true })
  estadoAnterior: EstadoOt | null;

  @Column({ type: 'varchar', length: 24 })
  estadoNuevo: EstadoOt;

  @Column({ type: 'uuid', nullable: true })
  usuarioId: string | null;

  @ManyToOne(() => Usuario, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'usuarioId' })
  usuario: Usuario | null;

  @Column({ type: 'varchar', length: 500, nullable: true })
  comentario: string | null;

  @CreateDateColumn({ type: 'timestamptz' })
  createdAt: Date;
}
