import { Controller, Get, Param, ParseUUIDPipe, Query } from '@nestjs/common';
import { IsString, MinLength } from 'class-validator';
import { GarantiasService } from './garantias.service';

class ConsultaHistorialDto {
  /** Patente o RUT. */
  @IsString() @MinLength(2) q: string;
}

@Controller('garantias')
export class GarantiasController {
  constructor(private readonly service: GarantiasService) {}

  @Get('historial')
  historial(@Query() dto: ConsultaHistorialDto) {
    return this.service.historial(dto.q);
  }

  @Get('vigentes/:vehiculoId')
  vigentes(@Param('vehiculoId', ParseUUIDPipe) vehiculoId: string) {
    return this.service.vigentesPorVehiculo(vehiculoId);
  }
}
