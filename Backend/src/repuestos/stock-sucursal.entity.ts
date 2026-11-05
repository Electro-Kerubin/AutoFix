import { Check, Column, Entity, Index, JoinColumn, ManyToOne } from 'typeorm';
import { EntidadBase } from '../common/base.entity';
import { Sucursal } from '../sucursales/sucursal.entity';
import { Repuesto } from './repuesto.entity';

@Entity('stock_sucursal')
@Index(['repuestoId', 'sucursalId'], { unique: true })
@Check('"cantidad" >= 0')
export class StockSucursal extends EntidadBase {
  @Column({ type: 'uuid' })
  repuestoId: string;

  @ManyToOne(() => Repuesto, (r) => r.stock, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'repuestoId' })
  repuesto: Repuesto;

  /** Taller o bodega central. */
  @Index()
  @Column({ type: 'uuid' })
  sucursalId: string;

  @ManyToOne(() => Sucursal, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'sucursalId' })
  sucursal: Sucursal;

  @Column({ type: 'int', default: 0 })
  cantidad: number;

  /** Bajo este nivel se genera alerta de reposición (evita compras urgentes). */
  @Column({ type: 'int', default: 0 })
  stockMinimo: number;

  @Column({ type: 'varchar', length: 40, nullable: true })
  ubicacion: string | null;
}
