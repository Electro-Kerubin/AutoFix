import { Controller, Get, Query } from '@nestjs/common';
import { IsDateString, IsOptional, IsUUID } from 'class-validator';
import { CurrentUser, Roles, UsuarioAutenticado } from '../common/auth';
import { Rol } from '../common/enums';
import { ReportesService } from './reportes.service';

class FiltroKpisDto {
  @IsOptional() @IsUUID() sucursalId?: string;
  @IsOptional() @IsDateString() desde?: string;
  @IsOptional() @IsDateString() hasta?: string;
}

@Controller('reportes')
@Roles(Rol.GERENCIA, Rol.JEFE_TALLER)
export class ReportesController {
  constructor(private readonly service: ReportesService) {}

  @Get('kpis')
  kpis(@Query() filtro: FiltroKpisDto, @CurrentUser() usuario: UsuarioAutenticado) {
    return this.service.kpis(filtro, usuario);
  }
}
