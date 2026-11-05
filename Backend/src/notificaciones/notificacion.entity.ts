import { Column, Entity, Index } from 'typeorm';
import { EntidadBase } from '../common/base.entity';
import { CanalNotificacion, EstadoNotificacion } from '../common/enums';

@Entity('notificaciones')
export class Notificacion extends EntidadBase {
  @Column({ type: 'varchar', length: 10 })
  canal: CanalNotificacion;

  @Column({ type: 'varchar', length: 160 })
  destinatario: string;

  @Column({ type: 'varchar', length: 60 })
  plantilla: string;

  @Column({ type: 'text' })
  mensaje: string;

  @Column({ type: 'varchar', length: 10 })
  estado: EstadoNotificacion;

  @Column({ type: 'text', nullable: true })
  error: string | null;

  @Index()
  @Column({ type: 'uuid', nullable: true })
  otId: string | null;

  @Index()
  @Column({ type: 'uuid', nullable: true })
  reservaId: string | null;
}
