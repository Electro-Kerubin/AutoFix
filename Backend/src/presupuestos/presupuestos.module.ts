import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { NotificacionesModule } from '../notificaciones/notificaciones.module';
import { EvidenciaOt } from '../ordenes-trabajo/evidencia.entity';
import { OrdenTrabajo } from '../ordenes-trabajo/orden-trabajo.entity';
import { Repuesto } from '../repuestos/repuesto.entity';
import { CatalogoFalla } from './catalogo-falla.entity';
import { PresupuestoItem } from './presupuesto-item.entity';
import { Presupuesto } from './presupuesto.entity';
import { PresupuestosController } from './presupuestos.controller';
import { PresupuestosService } from './presupuestos.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([Presupuesto, PresupuestoItem, CatalogoFalla, EvidenciaOt, OrdenTrabajo, Repuesto]),
    NotificacionesModule,
  ],
  controllers: [PresupuestosController],
  providers: [PresupuestosService],
  exports: [PresupuestosService, TypeOrmModule],
})
export class PresupuestosModule {}
