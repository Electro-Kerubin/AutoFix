import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { GarantiasModule } from '../garantias/garantias.module';
import { IntegracionesModule } from '../integraciones/integraciones.module';
import { NotificacionesModule } from '../notificaciones/notificaciones.module';
import { Presupuesto } from '../presupuestos/presupuesto.entity';
import { OtRepuesto } from '../repuestos/ot-repuesto.entity';
import { Reserva } from '../reservas/reserva.entity';
import { Sucursal } from '../sucursales/sucursal.entity';
import { Usuario } from '../usuarios/usuario.entity';
import { Vehiculo } from '../vehiculos/vehiculo.entity';
import { EvidenciaOt } from './evidencia.entity';
import { EvidenciasService } from './evidencias.service';
import { OrdenTrabajo } from './orden-trabajo.entity';
import { OrdenesTrabajoController } from './ordenes-trabajo.controller';
import { OrdenesTrabajoService } from './ordenes-trabajo.service';
import { OtHistorial } from './ot-historial.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      OrdenTrabajo,
      OtHistorial,
      EvidenciaOt,
      Vehiculo,
      Sucursal,
      Usuario,
      Reserva,
      Presupuesto,
      OtRepuesto,
    ]),
    GarantiasModule,
    IntegracionesModule,
    NotificacionesModule,
  ],
  controllers: [OrdenesTrabajoController],
  providers: [OrdenesTrabajoService, EvidenciasService],
  exports: [OrdenesTrabajoService, EvidenciasService, TypeOrmModule],
})
export class OrdenesTrabajoModule {}
