import { Body, Controller, Get, HttpCode, Param, ParseUUIDPipe, Post, Query } from '@nestjs/common';
import { CurrentUser, Roles, UsuarioAutenticado } from '../common/auth';
import { Rol } from '../common/enums';
import { CancelarReservaDto, CreateReservaDto, DisponibilidadDto, FiltroReservasDto } from './reservas.dto';
import { ReservasService } from './reservas.service';

@Controller('reservas')
export class ReservasController {
  constructor(private readonly service: ReservasService) {}

  @Get('disponibilidad')
  disponibilidad(@Query() dto: DisponibilidadDto) {
    return this.service.disponibilidad(dto.sucursalId, dto.fecha);
  }

  @Get()
  listar(@Query() filtro: FiltroReservasDto, @CurrentUser() usuario: UsuarioAutenticado) {
    return this.service.listar(filtro, usuario);
  }

  @Get(':id')
  obtener(@Param('id', ParseUUIDPipe) id: string) {
    return this.service.obtener(id);
  }

  @Post() @Roles(Rol.RECEPCION, Rol.JEFE_TALLER)
  crear(@Body() dto: CreateReservaDto, @CurrentUser() usuario: UsuarioAutenticado) {
    return this.service.crear(dto, usuario);
  }

  @Post(':id/cancelar') @HttpCode(200) @Roles(Rol.RECEPCION, Rol.JEFE_TALLER)
  cancelar(@Param('id', ParseUUIDPipe) id: string, @Body() dto: CancelarReservaDto) {
    return this.service.cancelar(id, dto.motivo);
  }

  @Post(':id/asistio') @HttpCode(200) @Roles(Rol.RECEPCION, Rol.JEFE_TALLER)
  asistio(@Param('id', ParseUUIDPipe) id: string) {
    return this.service.marcarAsistencia(id, true);
  }

  @Post(':id/no-show') @HttpCode(200) @Roles(Rol.RECEPCION, Rol.JEFE_TALLER)
  noShow(@Param('id', ParseUUIDPipe) id: string) {
    return this.service.marcarAsistencia(id, false);
  }
}
