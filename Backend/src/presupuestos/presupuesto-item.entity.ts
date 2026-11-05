import { Column, Entity, Index, JoinColumn, ManyToOne } from 'typeorm';
import { EntidadBase } from '../common/base.entity';
import { TipoItem } from '../common/enums';
import { Repuesto } from '../repuestos/repuesto.entity';
import { CatalogoFalla } from './catalogo-falla.entity';
import { Presupuesto } from './presupuesto.entity';

@Entity('presupuesto_items')
export class PresupuestoItem extends EntidadBase {
  @Index()
  @Column({ type: 'uuid' })
  presupuestoId: string;

  @ManyToOne(() => Presupuesto, (p) => p.items, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'presupuestoId' })
  presupuesto: Presupuesto;

  @Column({ type: 'varchar', length: 12 })
  tipo: TipoItem;

  @Column({ type: 'varchar', length: 300 })
  descripcion: string;

  @Column({ type: 'int' })
  cantidad: number;

  /** CLP por unidad. */
  @Column({ type: 'int' })
  precioUnitario: number;

  @Column({ type: 'uuid', nullable: true })
  repuestoId: string | null;

  @ManyToOne(() => Repuesto, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'repuestoId' })
  repuesto: Repuesto | null;

  @Column({ type: 'uuid', nullable: true })
  catalogoFallaId: string | null;

  @ManyToOne(() => CatalogoFalla, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'catalogoFallaId' })
  catalogoFalla: CatalogoFalla | null;

  /** Meses de garantía que ofrece este trabajo (0 = sin garantía). */
  @Column({ type: 'int', default: 0 })
  garantiaMeses: number;
}
