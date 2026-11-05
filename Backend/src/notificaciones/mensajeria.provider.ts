import { Injectable, Logger } from '@nestjs/common';
import { CanalNotificacion } from '../common/enums';

/**
 * Puerto de salida hacia el canal de mensajería. La implementación real (WhatsApp Business / SMS / correo)
 * se enchufa aquí sin tocar el resto del sistema (supuesto SUP-09: aprobación de plantillas de Meta pendiente).
 */
export abstract class MensajeriaProvider {
  abstract enviar(canal: CanalNotificacion, destinatario: string, mensaje: string): Promise<void>;
}

/** Implementación por defecto: registra el mensaje en el log en vez de enviarlo. */
@Injectable()
export class LogMensajeriaProvider extends MensajeriaProvider {
  private readonly logger = new Logger('Mensajeria');

  async enviar(canal: CanalNotificacion, destinatario: string, mensaje: string): Promise<void> {
    this.logger.log(`[${canal}] → ${destinatario}: ${mensaje}`);
  }
}
