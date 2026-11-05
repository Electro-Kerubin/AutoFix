import { Body, Controller, Get, Param, ParseUUIDPipe, Patch, Post, Query } from '@nestjs/common';
import { Roles } from '../common/auth';
import { Rol } from '../common/enums';
import { CreateSucursalDto, UpdateSucursalDto } from './sucursales.dto';
import { SucursalesService } from './sucursales.service';

@Controller('sucursales')
export class SucursalesController {
  constructor(private readonly service: SucursalesService) {}

  @Get()
  listar(@Query('todas') todas?: string) {
    return this.service.listar(todas !== 'true');
  }

  @Get(':id')
  obtener(@Param('id', ParseUUIDPipe) id: string) {
    return this.service.obtener(id);
  }

  @Post() @Roles(Rol.ADMIN)
  crear(@Body() dto: CreateSucursalDto) {
    return this.service.crear(dto);
  }

  @Patch(':id') @Roles(Rol.ADMIN)
  actualizar(@Param('id', ParseUUIDPipe) id: string, @Body() dto: UpdateSucursalDto) {
    return this.service.actualizar(id, dto);
  }
}
