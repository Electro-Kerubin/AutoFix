import { ArgumentsHost, Catch, ExceptionFilter, HttpStatus, Logger } from '@nestjs/common';
import type { Response } from 'express';
import { QueryFailedError } from 'typeorm';

/**
 * Traduce errores de integridad de PostgreSQL a respuestas HTTP con sentido, en vez de un 500 genérico.
 * Las reglas de negocio se validan antes en los servicios; esto es la red de seguridad para las carreras.
 */
@Catch(QueryFailedError)
export class PostgresExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger('Postgres');

  catch(error: QueryFailedError, host: ArgumentsHost): void {
    const res = host.switchToHttp().getResponse<Response>();
    const { code, constraint } = error.driverError as { code?: string; constraint?: string };

    const [status, message] =
      code === '23505' ? [HttpStatus.CONFLICT, 'Ya existe un registro con esos datos'] :
      code === '23503' ? [HttpStatus.CONFLICT, 'El registro está relacionado con otros datos y no puede modificarse así'] :
      code === '23514' ? [HttpStatus.CONFLICT, 'La operación viola una regla de integridad (por ejemplo, stock negativo)'] :
      code === '22P02' ? [HttpStatus.BAD_REQUEST, 'Uno de los valores enviados tiene un formato inválido'] :
      [HttpStatus.INTERNAL_SERVER_ERROR, 'Error interno del servidor'];

    if (status === HttpStatus.INTERNAL_SERVER_ERROR) this.logger.error(error.message, error.stack);
    res.status(status).json({ statusCode: status, message, error: HttpStatus[status], constraint });
  }
}
