import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { IntegracionesModule } from '../integraciones/integraciones.module';
import { OrdenTrabajo } from '../ordenes-trabajo/orden-trabajo.entity';
import { Sucursal } from '../sucursales/sucursal.entity';
import { MovimientoStock } from './movimiento-stock.entity';
import { OtRepuesto } from './ot-repuesto.entity';
import { Repuesto } from './repuesto.entity';
import { RepuestosController } from './repuestos.controller';
import { RepuestosService } from './repuestos.service';
import { StockSucursal } from './stock-sucursal.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([Repuesto, StockSucursal, MovimientoStock, OtRepuesto, Sucursal, OrdenTrabajo]),
    IntegracionesModule,
  ],
  controllers: [RepuestosController],
  providers: [RepuestosService],
  exports: [RepuestosService, TypeOrmModule],
})
export class RepuestosModule {}
