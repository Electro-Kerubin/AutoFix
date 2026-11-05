import { Column, CreateDateColumn, Entity, Index, PrimaryGeneratedColumn } from 'typeorm';
import { TipoMovimientoStock } from '../common/enums';

/** Libro de movimientos: cada cambio de stock queda con su causa, la OT asociada y quién lo hizo. */
@Entity('movimientos_stock')
export class MovimientoStock {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Index()
  @Column({ type: 'uuid' })
  repuestoId: string;

  @Column({ type: 'uuid' })
  sucursalId: string;

  @Column({ type: 'varchar', length: 16 })
  tipo: TipoMovimientoStock;

  /** Con signo: negativo = salida. */
  @Column({ type: 'int' })
  cantidad: number;

  @Column({ type: 'int' })
  stockResultante: number;

  @Index()
  @Column({ type: 'uuid', nullable: true })
  otId: string | null;

  @Column({ type: 'varchar', length: 300, nullable: true })
  motivo: string | null;

  @Column({ type: 'uuid', nullable: true })
  usuarioId: string | null;

  @CreateDateColumn({ type: 'timestamptz' })
  createdAt: Date;
}
