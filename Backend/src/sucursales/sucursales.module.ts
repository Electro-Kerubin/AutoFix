import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { SucursalesController } from './sucursales.controller';
import { Sucursal } from './sucursal.entity';
import { SucursalesService } from './sucursales.service';

@Module({
  imports: [TypeOrmModule.forFeature([Sucursal])],
  controllers: [SucursalesController],
  providers: [SucursalesService],
  exports: [SucursalesService, TypeOrmModule],
})
export class SucursalesModule {}
