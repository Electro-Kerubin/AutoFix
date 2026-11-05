import { Body, Controller, Get, Param, ParseUUIDPipe, Patch, Post, Query } from '@nestjs/common';
import { IsOptional, IsUUID } from 'class-validator';
import { Roles } from '../common/auth';
import { Rol } from '../common/enums';
import { PaginacionDto } from '../common/pagination';
import { CreateVehiculoDto, UpdateVehiculoDto } from './vehiculos.dto';
import { VehiculosService } from './vehiculos.service';

class BuscarVehiculosDto extends PaginacionDto {
  @IsOptional() @IsUUID() clienteId?: string;
}

@Controller('vehiculos')
export class VehiculosController {
  constructor(private readonly service: VehiculosService) {}

  @Get()
  buscar(@Query() dto: BuscarVehiculosDto) {
    return this.service.buscar(dto, dto.clienteId);
  }

  @Get('patente/:patente')
  buscarPorPatente(@Param('patente') patente: string) {
    return this.service.buscarPorPatente(patente);
  }

  @Get(':id')
  obtener(@Param('id', ParseUUIDPipe) id: string) {
    return this.service.obtener(id);
  }

  @Post() @Roles(Rol.RECEPCION, Rol.JEFE_TALLER)
  crear(@Body() dto: CreateVehiculoDto) {
    return this.service.crear(dto);
  }

  @Patch(':id') @Roles(Rol.RECEPCION, Rol.JEFE_TALLER)
  actualizar(@Param('id', ParseUUIDPipe) id: string, @Body() dto: UpdateVehiculoDto) {
    return this.service.actualizar(id, dto);
  }
}
