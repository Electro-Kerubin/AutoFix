import { Controller, Get, Param, ParseUUIDPipe, Post, Query } from '@nestjs/common';
import { IsEnum, IsOptional } from 'class-validator';
import { Roles } from '../common/auth';
import { EstadoSync, Rol } from '../common/enums';
import { SyncService } from './sync.service';

class FiltroSyncDto {
  @IsOptional() @IsEnum(EstadoSync) estado?: EstadoSync;
}

@Controller('integraciones')
@Roles(Rol.ADMIN)
export class IntegracionesController {
  constructor(private readonly sync: SyncService) {}

  @Get('sync')
  listar(@Query() filtro: FiltroSyncDto) {
    return this.sync.listar(filtro.estado);
  }

  @Get('sync/resumen')
  resumen() {
    return this.sync.resumen();
  }

  @Post('sync/procesar')
  async procesarAhora() {
    return { procesados: await this.sync.procesarPendientes() };
  }

  @Post('sync/:id/reintentar')
  reintentar(@Param('id', ParseUUIDPipe) id: string) {
    return this.sync.reintentar(id);
  }
}
