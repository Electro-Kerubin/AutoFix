import { Column, Entity } from 'typeorm';
import { EntidadBase } from '../common/base.entity';
import { TipoSucursal } from '../common/enums';

@Entity('sucursales')
export class Sucursal extends EntidadBase {
  @Column({ type: 'varchar', length: 20, unique: true })
  codigo: string;

  @Column({ type: 'varchar', length: 120 })
  nombre: string;

  @Column({ type: 'varchar', length: 20, default: TipoSucursal.TALLER })
  tipo: TipoSucursal;

  @Column({ type: 'varchar', length: 80, nullable: true })
  ciudad: string | null;

  @Column({ type: 'varchar', length: 200, nullable: true })
  direccion: string | null;

  @Column({ type: 'varchar', length: 30, nullable: true })
  telefono: string | null;

  /** Puestos de trabajo simultáneos: tope de reservas que se solapan en el mismo horario. */
  @Column({ type: 'int', default: 4 })
  boxes: number;

  @Column({ type: 'varchar', length: 5, default: '08:30' })
  horaApertura: string;

  @Column({ type: 'varchar', length: 5, default: '18:00' })
  horaCierre: string;

  @Column({ type: 'int', default: 60 })
  duracionSlotMin: number;

  @Column({ type: 'boolean', default: true })
  activa: boolean;

  /** Una de las 3 sucursales de la Fase 1 (Santiago, Rancagua, Viña del Mar). */
  @Column({ type: 'boolean', default: false })
  piloto: boolean;
}
