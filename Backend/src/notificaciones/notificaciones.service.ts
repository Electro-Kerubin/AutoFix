import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CanalNotificacion, EstadoNotificacion } from '../common/enums';
import { MensajeriaProvider } from './mensajeria.provider';
import { Notificacion } from './notificacion.entity';

export interface DestinatarioCliente {
  nombre: string;
  telefono: string | null;
  email: string | null;
  aceptaNotificaciones: boolean;
}

@Injectable()
export class NotificacionesService {
  private readonly logger = new Logger(NotificacionesService.name);

  constructor(
    @InjectRepository(Notificacion) private readonly repo: Repository<Notificacion>,
    private readonly proveedor: MensajeriaProvider,
  ) {}

  /**
   * Envía y deja registro. Nunca lanza: una notificación fallida no debe revertir la operación de negocio
   * que la originó. Prioriza WhatsApp si hay teléfono y cae a correo.
   */
  async notificarCliente(
    cliente: DestinatarioCliente,
    plantilla: string,
    mensaje: string,
    contexto: { otId?: string; reservaId?: string } = {},
  ): Promise<void> {
    if (!cliente.aceptaNotificaciones) return;

    const [canal, destinatario] = cliente.telefono
      ? [CanalNotificacion.WHATSAPP, cliente.telefono]
      : cliente.email
        ? [CanalNotificacion.EMAIL, cliente.email]
        : [null, null];
    if (!canal || !destinatario) return;

    const registro = this.repo.create({
      canal,
      destinatario,
      plantilla,
      mensaje,
      otId: contexto.otId ?? null,
      reservaId: contexto.reservaId ?? null,
      estado: EstadoNotificacion.ENVIADA,
      error: null,
    });
    try {
      await this.proveedor.enviar(canal, destinatario, mensaje);
    } catch (error) {
      registro.estado = EstadoNotificacion.ERROR;
      registro.error = error instanceof Error ? error.message : String(error);
      this.logger.warn(`No se pudo enviar ${plantilla} a ${destinatario}: ${registro.error}`);
    }
    await this.repo.save(registro).catch((e) => this.logger.error(`No se pudo registrar la notificación: ${e}`));
  }

  listarPorOt(otId: string): Promise<Notificacion[]> {
    return this.repo.find({ where: { otId }, order: { createdAt: 'DESC' } });
  }
}
