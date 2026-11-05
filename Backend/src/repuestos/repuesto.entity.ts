import { Column, Entity, OneToMany } from 'typeorm';
import { EntidadBase } from '../common/base.entity';
import { StockSucursal } from './stock-sucursal.entity';

/** Copia local del catálogo del sistema de inventarios (que sigue siendo la fuente de verdad: EXC-02). */
@Entity('repuestos')
export class Repuesto extends EntidadBase {
  /** Código del sistema de inventario corporativo. */
  @Column({ type: 'varchar', length: 40, unique: true })
  codigo: string;

  @Column({ type: 'varchar', length: 200 })
  nombre: string;

  @Column({ type: 'varchar', length: 60, nullable: true })
  categoria: string | null;

  /** CLP. */
  @Column({ type: 'int', default: 0 })
  precioVenta: number;

  @Column({ type: 'boolean', default: true })
  activo: boolean;

  @Column({ type: 'timestamptz', nullable: true })
  sincronizadoAt: Date | null;

  @OneToMany(() => StockSucursal, (s) => s.repuesto)
  stock: StockSucursal[];
}
