import { Column, Entity, JoinColumn, ManyToOne } from 'typeorm';
import { EntidadBase } from '../common/base.entity';
import { Rol } from '../common/enums';
import { Sucursal } from '../sucursales/sucursal.entity';

@Entity('usuarios')
export class Usuario extends EntidadBase {
  @Column({ type: 'varchar', length: 120 })
  nombre: string;

  @Column({ type: 'varchar', length: 160, unique: true })
  email: string;

  @Column({ type: 'varchar', length: 100, select: false })
  passwordHash: string;

  @Column({ type: 'varchar', length: 20 })
  rol: Rol;

  @Column({ type: 'uuid', nullable: true })
  sucursalId: string | null;

  @ManyToOne(() => Sucursal, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'sucursalId' })
  sucursal: Sucursal | null;

  @Column({ type: 'boolean', default: true })
  activo: boolean;

  @Column({ type: 'timestamptz', nullable: true })
  ultimoAcceso: Date | null;
}
