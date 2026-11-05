import {
  Body,
  Controller,
  Get,
  HttpCode,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Query,
  Res,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import type { Response } from 'express';
import { CurrentUser, Roles, UsuarioAutenticado } from '../common/auth';
import { Rol } from '../common/enums';
import { NotificacionesService } from '../notificaciones/notificaciones.service';
import { EvidenciasService, MAX_EVIDENCIA_BYTES } from './evidencias.service';
import {
  AsignarMecanicoDto,
  CambiarEstadoDto,
  CreateOtDto,
  FiltroOtDto,
  ValidarRepuestosDto,
} from './ordenes-trabajo.dto';
import { OrdenesTrabajoService } from './ordenes-trabajo.service';

@Controller()
export class OrdenesTrabajoController {
  constructor(
    private readonly service: OrdenesTrabajoService,
    private readonly evidencias: EvidenciasService,
    private readonly notificaciones: NotificacionesService,
  ) {}

  @Get('ordenes-trabajo')
  listar(@Query() filtro: FiltroOtDto, @CurrentUser() usuario: UsuarioAutenticado) {
    return this.service.listar(filtro, usuario);
  }

  @Post('ordenes-trabajo') @Roles(Rol.RECEPCION, Rol.JEFE_TALLER)
  crear(@Body() dto: CreateOtDto, @CurrentUser() usuario: UsuarioAutenticado) {
    return this.service.crear(dto, usuario);
  }

  @Get('ordenes-trabajo/:id')
  obtener(@Param('id', ParseUUIDPipe) id: string) {
    return this.service.obtener(id);
  }

  @Post('ordenes-trabajo/:id/estado') @HttpCode(200) @Roles(Rol.JEFE_TALLER, Rol.RECEPCION, Rol.MECANICO)
  cambiarEstado(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: CambiarEstadoDto,
    @CurrentUser() usuario: UsuarioAutenticado,
  ) {
    return this.service.cambiarEstado(id, dto, usuario);
  }

  @Patch('ordenes-trabajo/:id/mecanico') @Roles(Rol.JEFE_TALLER)
  asignarMecanico(@Param('id', ParseUUIDPipe) id: string, @Body() dto: AsignarMecanicoDto) {
    return this.service.asignarMecanico(id, dto);
  }

  @Post('ordenes-trabajo/:id/validar-repuestos') @HttpCode(200) @Roles(Rol.JEFE_TALLER, Rol.BODEGA)
  validarRepuestos(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: ValidarRepuestosDto,
    @CurrentUser() usuario: UsuarioAutenticado,
  ) {
    return this.service.validarRepuestos(id, dto, usuario);
  }

  @Get('ordenes-trabajo/:id/link-portal') @Roles(Rol.RECEPCION, Rol.JEFE_TALLER)
  async linkPortal(@Param('id', ParseUUIDPipe) id: string) {
    return { url: await this.service.linkPortal(id) };
  }

  @Get('ordenes-trabajo/:id/notificaciones')
  notificacionesDeOt(@Param('id', ParseUUIDPipe) id: string) {
    return this.notificaciones.listarPorOt(id);
  }

  @Get('ordenes-trabajo/:id/evidencias')
  listarEvidencias(@Param('id', ParseUUIDPipe) id: string) {
    return this.evidencias.listar(id);
  }

  @Post('ordenes-trabajo/:id/evidencias') @Roles(Rol.MECANICO, Rol.JEFE_TALLER, Rol.RECEPCION)
  @UseInterceptors(FileInterceptor('archivo', { limits: { fileSize: MAX_EVIDENCIA_BYTES, files: 1 } }))
  subirEvidencia(
    @Param('id', ParseUUIDPipe) id: string,
    @UploadedFile() archivo: Express.Multer.File | undefined,
    @Body('descripcion') descripcion: string | undefined,
    @CurrentUser() usuario: UsuarioAutenticado,
  ) {
    return this.evidencias.subir(id, archivo, descripcion, usuario.id);
  }

  @Get('evidencias/:id/archivo')
  async archivoEvidencia(@Param('id', ParseUUIDPipe) id: string, @Res() res: Response) {
    const { ruta, mimeType } = await this.evidencias.ubicar(id);
    res.type(mimeType).setHeader('Cache-Control', 'private, max-age=3600');
    res.sendFile(ruta);
  }
}
