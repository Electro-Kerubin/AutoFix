import { Column, Entity } from 'typeorm';
import { EntidadBase } from '../common/base.entity';

/** Catálogo estandarizado de fallas: evita observaciones ambiguas en presupuestos (riesgo R-12). */
@Entity('catalogo_fallas')
export class CatalogoFalla extends EntidadBase {
  @Column({ type: 'varchar', length: 20, unique: true })
  codigo: string;

  @Column({ type: 'varchar', length: 200 })
  nombre: string;

  @Column({ type: 'varchar', length: 60 })
  categoria: string;

  @Column({ type: 'boolean', default: true })
  activa: boolean;
}
