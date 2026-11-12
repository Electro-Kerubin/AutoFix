import { Body, Controller, Delete, Get, HttpCode, Param, ParseUUIDPipe, Post, Query } from '@nestjs/common';
import { CurrentUser, Roles, UsuarioAutenticado } from '../common/auth';
import { Rol } from '../common/enums';
import { CreateEventoKpiDto, FiltroEventosKpiDto } from './indicadores.dto';
import { IndicadoresService } from './indicadores.service';

/** Registro de hechos que alimentan los KPI del Charter: reclamos, llamadas, compras, cierres y atenciones fuera de SUGO. */
@Controller('indicadores/eventos')
export class IndicadoresController {
  constructor(private readonly service: IndicadoresService) {}

  @Get() @Roles(Rol.GERENCIA, Rol.JEFE_TALLER)
  listar(@Query() filtro: FiltroEventosKpiDto, @CurrentUser() usuario: UsuarioAutenticado) {
    return this.service.listar(filtro, usuario);
  }

  @Post() @Roles(Rol.JEFE_TALLER)
  registrar(@Body() dto: CreateEventoKpiDto, @CurrentUser() usuario: UsuarioAutenticado) {
    return this.service.registrar(dto, usuario);
  }

  @Delete(':id') @HttpCode(204) @Roles(Rol.JEFE_TALLER)
  eliminar(@Param('id', ParseUUIDPipe) id: string, @CurrentUser() usuario: UsuarioAutenticado) {
    return this.service.eliminar(id, usuario);
  }
}
