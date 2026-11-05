import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { LogMensajeriaProvider, MensajeriaProvider } from './mensajeria.provider';
import { Notificacion } from './notificacion.entity';
import { NotificacionesService } from './notificaciones.service';

@Module({
  imports: [TypeOrmModule.forFeature([Notificacion])],
  providers: [NotificacionesService, { provide: MensajeriaProvider, useClass: LogMensajeriaProvider }],
  exports: [NotificacionesService, TypeOrmModule],
})
export class NotificacionesModule {}
