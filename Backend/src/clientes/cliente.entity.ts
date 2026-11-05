import { Column, Entity, OneToMany } from 'typeorm';
import { EntidadBase } from '../common/base.entity';
import { Vehiculo } from '../vehiculos/vehiculo.entity';

@Entity('clientes')
export class Cliente extends EntidadBase {
  /** RUT canónico "12345678-5": es la llave de unificación de la base histórica. */
  @Column({ type: 'varchar', length: 12, unique: true })
  rut: string;

  @Column({ type: 'varchar', length: 160 })
  nombre: string;

  @Column({ type: 'varchar', length: 160, nullable: true })
  email: string | null;

  /** Formato internacional, ej. +56912345678. Se usa para WhatsApp/SMS. */
  @Column({ type: 'varchar', length: 20, nullable: true })
  telefono: string | null;

  @Column({ type: 'boolean', default: true })
  aceptaNotificaciones: boolean;

  @OneToMany(() => Vehiculo, (vehiculo) => vehiculo.cliente)
  vehiculos: Vehiculo[];
}
