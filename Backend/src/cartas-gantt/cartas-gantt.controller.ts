import { Body, Controller, Delete, Get, HttpCode, Param, ParseUUIDPipe, Post, Put } from '@nestjs/common';
import { CurrentUser, Roles, UsuarioAutenticado } from '../common/auth';
import { Rol } from '../common/enums';
import { GuardarCartaGanttDto } from './cartas-gantt.dto';
import { CartasGanttService } from './cartas-gantt.service';

@Controller('cartas-gantt')
@Roles(Rol.ADMIN, Rol.USUARIO_PROYECTO)
export class CartasGanttController {
  constructor(private readonly service: CartasGanttService) {}

  @Get()
  listar() {
    return this.service.listar();
  }

  @Get(':id')
  obtener(@Param('id', ParseUUIDPipe) id: string) {
    return this.service.obtener(id);
  }

  @Post()
  crear(@Body() dto: GuardarCartaGanttDto, @CurrentUser() usuario: UsuarioAutenticado) {
    return this.service.crear(dto, usuario);
  }

  @Put(':id')
  actualizar(@Param('id', ParseUUIDPipe) id: string, @Body() dto: GuardarCartaGanttDto) {
    return this.service.actualizar(id, dto);
  }

  @Delete(':id') @HttpCode(204)
  eliminar(@Param('id', ParseUUIDPipe) id: string) {
    return this.service.eliminar(id);
  }
}
