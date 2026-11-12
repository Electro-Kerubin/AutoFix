import { Column, Entity, Index, JoinColumn, ManyToOne } from 'typeorm';
import { EntidadBase } from '../common/base.entity';
import { TipoEventoKpi } from '../common/enums';
import { Sucursal } from '../sucursales/sucursal.entity';

@Entity('eventos_kpi')
@Index(['tipo', 'sucursalId', 'fecha'])
export class EventoKpi extends EntidadBase {
  @Column({ type: 'varchar', length: 24 })
  tipo: TipoEventoKpi;

  @Column({ type: 'uuid' })
  sucursalId: string;

  @ManyToOne(() => Sucursal, { onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'sucursalId' })
  sucursal: Sucursal;

  /** Día al que corresponde el hecho (YYYY-MM-DD, hora de Santiago). */
  @Column({ type: 'date' })
  fecha: string;

  /** Llamadas o atenciones del día; 1 para reclamos y compras. */
  @Column({ type: 'int', default: 1 })
  cantidad: number;

  /** CLP, sólo compras de repuestos. */
  @Column({ type: 'int', nullable: true })
  monto: number | null;

  @Column({ type: 'boolean', default: false })
  urgente: boolean;

  /** Horas de cierre, sólo CIERRE_TALLER. */
  @Column({ type: 'numeric', precision: 6, scale: 2, nullable: true })
  horas: string | null;

  /** MIGRACION | CAPACITACION | OTRO para cierres de taller. */
  @Column({ type: 'varchar', length: 20, nullable: true })
  motivo: string | null;

  @Column({ type: 'uuid', nullable: true })
  otId: string | null;

  @Column({ type: 'varchar', length: 500, nullable: true })
  detalle: string | null;

  @Column({ type: 'uuid', nullable: true })
  registradoPorId: string | null;
}
