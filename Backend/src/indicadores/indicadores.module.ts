import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { OrdenTrabajo } from '../ordenes-trabajo/orden-trabajo.entity';
import { Sucursal } from '../sucursales/sucursal.entity';
import { EventoKpi } from './evento-kpi.entity';
import { IndicadoresController } from './indicadores.controller';
import { IndicadoresService } from './indicadores.service';

@Module({
  imports: [TypeOrmModule.forFeature([EventoKpi, Sucursal, OrdenTrabajo])],
  controllers: [IndicadoresController],
  providers: [IndicadoresService],
})
export class IndicadoresModule {}
