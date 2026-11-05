import { Body, Controller, Get, HttpCode, Param, ParseUUIDPipe, Post, Req, Res } from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import { IsOptional, IsString, Length } from 'class-validator';
import type { Request, Response } from 'express';
import { Public } from '../common/auth';
import { OrigenPortal, PortalService } from './portal.service';

class DecisionPortalDto {
  @IsOptional() @IsString() @Length(2, 160) nombre?: string;
  @IsOptional() @IsString() @Length(3, 500) motivo?: string;
}

const origen = (req: Request): OrigenPortal => ({
  ip: req.ip ?? null,
  userAgent: req.get('user-agent') ?? null,
});

/** Endpoints sin sesión: el acceso lo da el token secreto del link que recibe el cliente. */
@Public()
@Throttle({ default: { limit: 60, ttl: 60_000 } })
@Controller('portal/:token')
export class PortalController {
  constructor(private readonly service: PortalService) {}

  @Get()
  ver(@Param('token') token: string) {
    return this.service.ver(token);
  }

  @Post('presupuestos/:presupuestoId/aprobar') @HttpCode(200)
  aprobar(
    @Param('token') token: string,
    @Param('presupuestoId', ParseUUIDPipe) presupuestoId: string,
    @Body() dto: DecisionPortalDto,
    @Req() req: Request,
  ) {
    return this.service.aprobar(token, presupuestoId, dto.nombre, origen(req));
  }

  @Post('presupuestos/:presupuestoId/rechazar') @HttpCode(200)
  rechazar(
    @Param('token') token: string,
    @Param('presupuestoId', ParseUUIDPipe) presupuestoId: string,
    @Body() dto: DecisionPortalDto,
    @Req() req: Request,
  ) {
    return this.service.rechazar(token, presupuestoId, dto.motivo, dto.nombre, origen(req));
  }

  @Get('evidencias/:evidenciaId/archivo')
  async evidencia(
    @Param('token') token: string,
    @Param('evidenciaId', ParseUUIDPipe) evidenciaId: string,
    @Res() res: Response,
  ) {
    const { ruta, mimeType } = await this.service.archivoEvidencia(token, evidenciaId);
    res.type(mimeType).setHeader('Cache-Control', 'private, max-age=3600');
    res.sendFile(ruta);
  }
}
