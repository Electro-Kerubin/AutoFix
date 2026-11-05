import { Body, Controller, Delete, Get, HttpCode, Param, ParseUUIDPipe, Patch, Post, Query } from '@nestjs/common';
import { IsOptional, IsUUID } from 'class-validator';
import { CurrentUser, Roles, UsuarioAutenticado } from '../common/auth';
import { Rol } from '../common/enums';
import {
  AjusteStockDto,
  AsignarRepuestoDto,
  BuscarRepuestosDto,
  CreateRepuestoDto,
  UpdateRepuestoDto,
} from './repuestos.dto';
import { RepuestosService } from './repuestos.service';

class FiltroAlertasDto {
  @IsOptional() @IsUUID() sucursalId?: string;
}

const EN_TALLER = [Rol.MECANICO, Rol.JEFE_TALLER, Rol.BODEGA] as const;

@Controller()
export class RepuestosController {
  constructor(private readonly service: RepuestosService) {}

  @Get('repuestos')
  buscar(@Query() dto: BuscarRepuestosDto) {
    return this.service.buscar(dto);
  }

  @Get('repuestos/alertas')
  alertas(@Query() filtro: FiltroAlertasDto) {
    return this.service.alertasReposicion(filtro.sucursalId);
  }

  @Post('repuestos/sincronizar') @HttpCode(200) @Roles(Rol.BODEGA)
  sincronizar(@CurrentUser() usuario: UsuarioAutenticado) {
    return this.service.sincronizarDesdeInventario(usuario);
  }

  @Get('repuestos/:id')
  obtener(@Param('id', ParseUUIDPipe) id: string) {
    return this.service.obtener(id);
  }

  @Post('repuestos') @Roles(Rol.BODEGA)
  crear(@Body() dto: CreateRepuestoDto) {
    return this.service.crear(dto);
  }

  @Patch('repuestos/:id') @Roles(Rol.BODEGA)
  actualizar(@Param('id', ParseUUIDPipe) id: string, @Body() dto: UpdateRepuestoDto) {
    return this.service.actualizar(id, dto);
  }

  @Post('repuestos/:id/ajuste-stock') @HttpCode(200) @Roles(Rol.BODEGA, Rol.JEFE_TALLER)
  ajustar(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: AjusteStockDto,
    @CurrentUser() usuario: UsuarioAutenticado,
  ) {
    return this.service.ajustarStock(id, dto, usuario);
  }

  @Get('ordenes-trabajo/:otId/repuestos')
  listarPorOt(@Param('otId', ParseUUIDPipe) otId: string) {
    return this.service.listarPorOt(otId);
  }

  @Post('ordenes-trabajo/:otId/repuestos') @Roles(...EN_TALLER)
  asignar(
    @Param('otId', ParseUUIDPipe) otId: string,
    @Body() dto: AsignarRepuestoDto,
    @CurrentUser() usuario: UsuarioAutenticado,
  ) {
    return this.service.asignarAOt(otId, dto, usuario);
  }

  @Delete('ordenes-trabajo/:otId/repuestos/:otRepuestoId') @HttpCode(204) @Roles(...EN_TALLER)
  quitar(
    @Param('otId', ParseUUIDPipe) otId: string,
    @Param('otRepuestoId', ParseUUIDPipe) otRepuestoId: string,
    @CurrentUser() usuario: UsuarioAutenticado,
  ) {
    return this.service.quitarDeOt(otId, otRepuestoId, usuario);
  }
}
