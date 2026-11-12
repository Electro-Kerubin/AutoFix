import { Column, Entity } from 'typeorm';
import { EntidadBase } from '../common/base.entity';

export interface TareaGantt {
  id: string;
  nombre: string;
  responsable: string | null;
  /** YYYY-MM-DD */
  inicio: string;
  fin: string;
  /** 0 a 100 */
  avance: number;
}

/** Carta Gantt independiente: lista de tareas con fechas y avance. */
@Entity('cartas_gantt')
export class CartaGantt extends EntidadBase {
  @Column({ type: 'varchar', length: 120 })
  nombre: string;

  @Column({ type: 'varchar', length: 500, nullable: true })
  descripcion: string | null;

  @Column({ type: 'jsonb', default: () => `'[]'` })
  tareas: TareaGantt[];

  @Column({ type: 'uuid', nullable: true })
  creadaPorId: string | null;
}
