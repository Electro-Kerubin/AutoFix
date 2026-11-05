import { Body, Controller, Delete, Get, HttpCode, Param, ParseUUIDPipe, Patch, Post } from '@nestjs/common';
import { CurrentUser, Roles, UsuarioAutenticado } from '../common/auth';
import { CanalAprobacion, Rol } from '../common/enums';
import {
  CreateFallaDto,
  DecisionMostradorDto,
  GuardarPresupuestoDto,
  RechazoDto,
} from './presupuestos.dto';
import { PresupuestosService } from './presupuestos.service';

const REDACTORES = [Rol.JEFE_TALLER, Rol.RECEPCION, Rol.MECANICO] as const;
const GESTORES = [Rol.JEFE_TALLER, Rol.RECEPCION] as const;

@Controller()
export class PresupuestosController {
  constructor(private readonly service: PresupuestosService) {}

  @Get('ordenes-trabajo/:otId/presupuestos')
  listarPorOt(@Param('otId', ParseUUIDPipe) otId: string) {
    return this.service.listarPorOt(otId);
  }

  @Post('ordenes-trabajo/:otId/presupuestos') @Roles(...REDACTORES)
  crear(
    @Param('otId', ParseUUIDPipe) otId: string,
    @Body() dto: GuardarPresupuestoDto,
    @CurrentUser() usuario: UsuarioAutenticado,
  ) {
    return this.service.crear(otId, dto, usuario.id);
  }

  @Get('presupuestos/:id')
  obtener(@Param('id', ParseUUIDPipe) id: string) {
    return this.service.obtener(id);
  }

  @Patch('presupuestos/:id') @Roles(...REDACTORES)
  actualizar(@Param('id', ParseUUIDPipe) id: string, @Body() dto: GuardarPresupuestoDto) {
    return this.service.actualizar(id, dto);
  }

  @Delete('presupuestos/:id') @HttpCode(204) @Roles(...REDACTORES)
  eliminar(@Param('id', ParseUUIDPipe) id: string) {
    return this.service.eliminarBorrador(id);
  }

  @Post('presupuestos/:id/enviar') @HttpCode(200) @Roles(...GESTORES)
  enviar(@Param('id', ParseUUIDPipe) id: string, @CurrentUser() usuario: UsuarioAutenticado) {
    return this.service.enviar(id, usuario.id);
  }

  /** El cliente aprobó en el mostrador o por teléfono; el portal usa su propio endpoint público. */
  @Post('presupuestos/:id/aprobar') @HttpCode(200) @Roles(...GESTORES)
  aprobar(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: DecisionMostradorDto,
    @CurrentUser() usuario: UsuarioAutenticado,
  ) {
    return this.service.aprobar(id, { canal: dto.canal, nombre: dto.nombre, usuarioId: usuario.id });
  }

  @Post('presupuestos/:id/rechazar') @HttpCode(200) @Roles(...GESTORES)
  rechazar(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: RechazoDto,
    @CurrentUser() usuario: UsuarioAutenticado,
  ) {
    return this.service.rechazar(id, { canal: CanalAprobacion.MOSTRADOR, nombre: usuario.nombre, usuarioId: usuario.id }, dto.motivo);
  }

  @Get('catalogo-fallas')
  listarFallas() {
    return this.service.listarFallas();
  }

  @Post('catalogo-fallas') @Roles(Rol.JEFE_TALLER)
  crearFalla(@Body() dto: CreateFallaDto) {
    return this.service.crearFalla(dto);
  }
}
