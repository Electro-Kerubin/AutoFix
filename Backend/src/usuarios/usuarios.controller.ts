import { Body, Controller, Get, Param, ParseUUIDPipe, Patch, Post } from '@nestjs/common';
import { Roles } from '../common/auth';
import { Rol } from '../common/enums';
import { CreateUsuarioDto, UpdateUsuarioDto } from './usuarios.dto';
import { UsuariosService } from './usuarios.service';

@Controller('usuarios')
@Roles(Rol.ADMIN)
export class UsuariosController {
  constructor(private readonly service: UsuariosService) {}

  @Get()
  listar() {
    return this.service.listar();
  }

  @Get(':id')
  obtener(@Param('id', ParseUUIDPipe) id: string) {
    return this.service.obtener(id);
  }

  @Post()
  crear(@Body() dto: CreateUsuarioDto) {
    return this.service.crear(dto);
  }

  @Patch(':id')
  actualizar(@Param('id', ParseUUIDPipe) id: string, @Body() dto: UpdateUsuarioDto) {
    return this.service.actualizar(id, dto);
  }
}
