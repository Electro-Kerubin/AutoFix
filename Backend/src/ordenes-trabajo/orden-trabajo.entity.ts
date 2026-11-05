import { AfterLoad, Column, Entity, Generated, Index, JoinColumn, ManyToOne, OneToMany } from 'typeorm';
import { DateTime } from 'luxon';
import { Cliente } from '../clientes/cliente.entity';
import { EntidadBase } from '../common/base.entity';
import { EstadoOt } from '../common/enums';
import { ZONA_HORARIA } from '../notificaciones/plantillas';
import { Presupuesto } from '../presupuestos/presupuesto.entity';
import { OtRepuesto } from '../repuestos/ot-repuesto.entity';
import { Sucursal } from '../sucursales/sucursal.entity';
import { Usuario } from '../usuarios/usuario.entity';
import { Vehiculo } from '../vehiculos/vehiculo.entity';
import { EvidenciaOt } from './evidencia.entity';
import { OtHistorial } from './ot-historial.entity';

@Entity('ordenes_trabajo')
@Index(['sucursalId', 'estado'])
// Garantía a nivel de base de datos: un vehículo no puede tener dos OT abiertas a la vez.
@Index('uq_ot_abierta_por_vehiculo', ['vehiculoId'], {
  unique: true,
  where: `"estado" NOT IN ('ENTREGADA', 'CANCELADA')`,
})
export class OrdenTrabajo extends EntidadBase {
  /** Correlativo global; el número legible (OT-2026-000123) se arma en `numero`. */
  @Column({ type: 'int' })
  @Generated('increment')
  secuencia: number;

  /** No persistido: se calcula al cargar. */
  numero: string;

  @Column({ type: 'uuid' })
  sucursalId: string;

  @ManyToOne(() => Sucursal, { onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'sucursalId' })
  sucursal: Sucursal;

  @Index()
  @Column({ type: 'uuid' })
  clienteId: string;

  @ManyToOne(() => Cliente, { onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'clienteId' })
  cliente: Cliente;

  @Index()
  @Column({ type: 'uuid' })
  vehiculoId: string;

  @ManyToOne(() => Vehiculo, { onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'vehiculoId' })
  vehiculo: Vehiculo;

  @Column({ type: 'uuid', nullable: true })
  reservaId: string | null;

  @Column({ type: 'varchar', length: 24, default: EstadoOt.RECEPCIONADA })
  estado: EstadoOt;

  @Column({ type: 'varchar', length: 500 })
  motivoIngreso: string;

  @Column({ type: 'text', nullable: true })
  observacionesRecepcion: string | null;

  @Column({ type: 'int' })
  kilometraje: number;

  @Column({ type: 'timestamptz', default: () => 'now()' })
  fechaIngreso: Date;

  @Column({ type: 'timestamptz', nullable: true })
  fechaEntrega: Date | null;

  @Column({ type: 'uuid', nullable: true })
  mecanicoId: string | null;

  @ManyToOne(() => Usuario, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'mecanicoId' })
  mecanico: Usuario | null;

  @Column({ type: 'uuid', nullable: true })
  creadaPorId: string | null;

  /** Se fija al cerrar el uso de repuestos: sin esto no se puede entregar la OT (riesgo R-08). */
  @Column({ type: 'timestamptz', nullable: true })
  repuestosValidadosAt: Date | null;

  @Column({ type: 'uuid', nullable: true })
  repuestosValidadosPorId: string | null;

  /** Monto final (suma de presupuestos aprobados) congelado al entregar. CLP. */
  @Column({ type: 'int', nullable: true })
  totalFinal: number | null;

  /** Token secreto del link que recibe el cliente para seguir su vehículo y aprobar presupuestos. */
  @Index({ unique: true })
  @Column({ type: 'varchar', length: 64, select: false })
  tokenPortal: string;

  @OneToMany(() => Presupuesto, (p) => p.ordenTrabajo)
  presupuestos: Presupuesto[];

  @OneToMany(() => OtRepuesto, (r) => r.ordenTrabajo)
  repuestos: OtRepuesto[];

  @OneToMany(() => OtHistorial, (h) => h.ordenTrabajo)
  historial: OtHistorial[];

  @OneToMany(() => EvidenciaOt, (e) => e.ordenTrabajo)
  evidencias: EvidenciaOt[];

  @AfterLoad()
  calcularNumero(): void {
    if (this.secuencia == null || !this.fechaIngreso) return;
    const anio = DateTime.fromJSDate(this.fechaIngreso, { zone: ZONA_HORARIA }).year;
    this.numero = `OT-${anio}-${String(this.secuencia).padStart(6, '0')}`;
  }
}
