import { PartialType } from '@nestjs/swagger';
import { IsBoolean, IsEmail, IsOptional, IsString, IsUUID, Length, Matches } from 'class-validator';
import { EsRut } from '../common/utils/validators';

export class CreateClienteDto {
  @EsRut() rut: string;
  @IsString() @Length(2, 160) nombre: string;
  @IsOptional() @IsEmail() email?: string;
  @IsOptional() @Matches(/^\+\d{8,15}$/, { message: 'telefono debe estar en formato internacional, ej. +56912345678' })
  telefono?: string;
  @IsOptional() @IsBoolean() aceptaNotificaciones?: boolean;
}

export class UpdateClienteDto extends PartialType(CreateClienteDto) {}

export class UnificarClientesDto {
  /** Ficha duplicada que se elimina. */
  @IsUUID() origenId: string;
  /** Ficha que se conserva y recibe vehículos, reservas y OTs. */
  @IsUUID() destinoId: string;
}
