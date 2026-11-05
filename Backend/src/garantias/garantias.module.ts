import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Cliente } from '../clientes/cliente.entity';
import { OrdenTrabajo } from '../ordenes-trabajo/orden-trabajo.entity';
import { Vehiculo } from '../vehiculos/vehiculo.entity';
import { Garantia } from './garantia.entity';
import { GarantiasController } from './garantias.controller';
import { GarantiasService } from './garantias.service';

@Module({
  imports: [TypeOrmModule.forFeature([Garantia, Vehiculo, Cliente, OrdenTrabajo])],
  controllers: [GarantiasController],
  providers: [GarantiasService],
  exports: [GarantiasService, TypeOrmModule],
})
export class GarantiasModule {}
