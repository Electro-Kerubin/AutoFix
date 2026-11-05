import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { NotificacionesModule } from '../notificaciones/notificaciones.module';
import { Sucursal } from '../sucursales/sucursal.entity';
import { Vehiculo } from '../vehiculos/vehiculo.entity';
import { Reserva } from './reserva.entity';
import { ReservasController } from './reservas.controller';
import { ReservasService } from './reservas.service';

@Module({
  imports: [TypeOrmModule.forFeature([Reserva, Sucursal, Vehiculo]), NotificacionesModule],
  controllers: [ReservasController],
  providers: [ReservasService],
  exports: [ReservasService, TypeOrmModule],
})
export class ReservasModule {}
