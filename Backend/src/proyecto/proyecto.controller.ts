import { Controller, Get } from '@nestjs/common';
import { CONTEXTO } from './contexto';
@Controller('proyecto')
export class ProyectoController {
  @Get('contexto') contexto() {
    return CONTEXTO;
  }
}
