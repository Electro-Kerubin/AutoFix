import { Column, Entity, Index, JoinColumn, ManyToOne } from 'typeorm';
import { Cliente } from '../clientes/cliente.entity';
import { EntidadBase } from '../common/base.entity';
import { CanalReserva, EstadoReserva } from '../common/enums';
import { Sucursal } from '../sucursales/sucursal.entity';
import { Vehiculo } from '../vehiculos/vehiculo.entity';

@Entity('reservas')
@Index(['sucursalId', 'inicio'])
@Index(['vehiculoId', 'inicio'])
export class Reserva extends EntidadBase {
  @Column({ type: 'uuid' })
  sucursalId: string;

  @ManyToOne(() => Sucursal, { onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'sucursalId' })
  sucursal: Sucursal;

  @Column({ type: 'uuid' })
  clienteId: string;

  @ManyToOne(() => Cliente, { onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'clienteId' })
  cliente: Cliente;

  @Column({ type: 'uuid' })
  vehiculoId: string;

  @ManyToOne(() => Vehiculo, { onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'vehiculoId' })
  vehiculo: Vehiculo;

  @Column({ type: 'timestamptz' })
  inicio: Date;

  @Column({ type: 'timestamptz' })
  fin: Date;

  @Column({ type: 'varchar', length: 12 })
  canal: CanalReserva;

  @Column({ type: 'varchar', length: 12, default: EstadoReserva.CONFIRMADA })
  estado: EstadoReserva;

  @Column({ type: 'varchar', length: 300 })
  motivo: string;

  @Column({ type: 'varchar', length: 300, nullable: true })
  motivoCancelacion: string | null;

  @Column({ type: 'uuid', nullable: true })
  creadaPorId: string | null;

  @Column({ type: 'timestamptz', nullable: true })
  recordatorioEnviadoAt: Date | null;
}
