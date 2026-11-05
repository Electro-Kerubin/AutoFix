import { Column, Entity, Index, JoinColumn, ManyToOne } from 'typeorm';
import { EntidadBase } from '../common/base.entity';
import { OrdenTrabajo } from '../ordenes-trabajo/orden-trabajo.entity';
import { Sucursal } from '../sucursales/sucursal.entity';
import { Repuesto } from './repuesto.entity';

/** Repuesto efectivamente utilizado en una OT (REQ-04: trazabilidad por código). */
@Entity('ot_repuestos')
export class OtRepuesto extends EntidadBase {
  @Index()
  @Column({ type: 'uuid' })
  otId: string;

  @ManyToOne(() => OrdenTrabajo, (ot) => ot.repuestos, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'otId' })
  ordenTrabajo: OrdenTrabajo;

  @Column({ type: 'uuid' })
  repuestoId: string;

  @ManyToOne(() => Repuesto, { onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'repuestoId' })
  repuesto: Repuesto;

  /** Bodega o taller desde donde se descontó el stock. */
  @Column({ type: 'uuid' })
  sucursalOrigenId: string;

  @ManyToOne(() => Sucursal, { onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'sucursalOrigenId' })
  sucursalOrigen: Sucursal;

  @Column({ type: 'int' })
  cantidad: number;

  /** CLP vigente al momento de la asignación. */
  @Column({ type: 'int' })
  precioUnitario: number;

  @Column({ type: 'int', default: 0 })
  garantiaMeses: number;

  @Column({ type: 'uuid', nullable: true })
  asignadoPorId: string | null;
}
