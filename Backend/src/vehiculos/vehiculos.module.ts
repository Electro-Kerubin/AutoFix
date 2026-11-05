import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ClientesModule } from '../clientes/clientes.module';
import { Vehiculo } from './vehiculo.entity';
import { VehiculosController } from './vehiculos.controller';
import { VehiculosService } from './vehiculos.service';

@Module({
  imports: [TypeOrmModule.forFeature([Vehiculo]), ClientesModule],
  controllers: [VehiculosController],
  providers: [VehiculosService],
  exports: [VehiculosService, TypeOrmModule],
})
export class VehiculosModule {}
