import { Body, Controller, Get, Param, ParseUUIDPipe, Patch, Post, Query } from '@nestjs/common';
import { Roles } from '../common/auth';
import { Rol } from '../common/enums';
import { PaginacionDto } from '../common/pagination';
import { CreateClienteDto, UnificarClientesDto, UpdateClienteDto } from './clientes.dto';
import { ClientesService } from './clientes.service';

@Controller('clientes')
export class ClientesController {
  constructor(private readonly service: ClientesService) {}

  @Get()
  buscar(@Query() dto: PaginacionDto) {
    return this.service.buscar(dto);
  }

  @Get('rut/:rut')
  buscarPorRut(@Param('rut') rut: string) {
    return this.service.buscarPorRut(rut);
  }

  @Get(':id')
  obtener(@Param('id', ParseUUIDPipe) id: string) {
    return this.service.obtener(id);
  }

  @Post() @Roles(Rol.RECEPCION, Rol.JEFE_TALLER)
  crear(@Body() dto: CreateClienteDto) {
    return this.service.crear(dto);
  }

  @Post('unificar') @Roles(Rol.JEFE_TALLER)
  unificar(@Body() dto: UnificarClientesDto) {
    return this.service.unificar(dto.origenId, dto.destinoId);
  }

  @Patch(':id') @Roles(Rol.RECEPCION, Rol.JEFE_TALLER)
  actualizar(@Param('id', ParseUUIDPipe) id: string, @Body() dto: UpdateClienteDto) {
    return this.service.actualizar(id, dto);
  }
}
