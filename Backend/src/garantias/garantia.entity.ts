import { Column, Entity, Index, JoinColumn, ManyToOne } from 'typeorm';
import { EntidadBase } from '../common/base.entity';
import { OrdenTrabajo } from '../ordenes-trabajo/orden-trabajo.entity';
import { Repuesto } from '../repuestos/repuesto.entity';
import { Vehiculo } from '../vehiculos/vehiculo.entity';

@Entity('garantias')
@Index(['vehiculoId', 'fechaVencimiento'])
export class Garantia extends EntidadBase {
  @Index()
  @Column({ type: 'uuid' })
  otId: string;

  @ManyToOne(() => OrdenTrabajo, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'otId' })
  ordenTrabajo: OrdenTrabajo;

  @Column({ type: 'uuid' })
  vehiculoId: string;

  @ManyToOne(() => Vehiculo, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'vehiculoId' })
  vehiculo: Vehiculo;

  @Column({ type: 'uuid', nullable: true })
  repuestoId: string | null;

  @ManyToOne(() => Repuesto, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'repuestoId' })
  repuesto: Repuesto | null;

  @Column({ type: 'varchar', length: 300 })
  descripcion: string;

  @Column({ type: 'int' })
  meses: number;

  @Column({ type: 'date' })
  fechaInicio: string;

  @Column({ type: 'date' })
  fechaVencimiento: string;
}
