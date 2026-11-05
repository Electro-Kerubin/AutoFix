import { Column, Entity, Index, JoinColumn, ManyToOne } from 'typeorm';
import { EntidadBase } from '../common/base.entity';
import { Cliente } from '../clientes/cliente.entity';

@Entity('vehiculos')
export class Vehiculo extends EntidadBase {
  /** Patente canónica (mayúsculas, sin separadores). Llave de búsqueda de historial y garantías. */
  @Column({ type: 'varchar', length: 8, unique: true })
  patente: string;

  @Column({ type: 'varchar', length: 60 })
  marca: string;

  @Column({ type: 'varchar', length: 80 })
  modelo: string;

  @Column({ type: 'int', nullable: true })
  anio: number | null;

  @Column({ type: 'varchar', length: 25, nullable: true })
  vin: string | null;

  @Column({ type: 'varchar', length: 40, nullable: true })
  color: string | null;

  @Column({ type: 'int', nullable: true })
  kilometraje: number | null;

  @Index()
  @Column({ type: 'uuid' })
  clienteId: string;

  @ManyToOne(() => Cliente, (cliente) => cliente.vehiculos, { onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'clienteId' })
  cliente: Cliente;
}
