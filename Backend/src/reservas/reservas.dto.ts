import { IsDateString, IsEnum, IsISO8601, IsOptional, IsString, IsUUID, Length, Matches } from 'class-validator';
import { CanalReserva, EstadoReserva } from '../common/enums';

export class CreateReservaDto {
  @IsUUID() sucursalId: string;
  @IsUUID() clienteId: string;
  @IsUUID() vehiculoId: string;
  /** Instante de inicio en ISO-8601 (con zona horaria), ej. 2026-11-03T10:00:00-03:00. */
  @IsISO8601({ strict: true }) inicio: string;
  @IsEnum(CanalReserva) canal: CanalReserva;
  @IsString() @Length(3, 300) motivo: string;
}

export class DisponibilidadDto {
  @IsUUID() sucursalId: string;
  @Matches(/^\d{4}-\d{2}-\d{2}$/, { message: 'fecha debe tener formato YYYY-MM-DD' }) fecha: string;
}

export class FiltroReservasDto {
  @IsOptional() @IsUUID() sucursalId?: string;
  @IsOptional() @IsDateString() desde?: string;
  @IsOptional() @IsDateString() hasta?: string;
  @IsOptional() @IsEnum(EstadoReserva) estado?: EstadoReserva;
  @IsOptional() @IsUUID() clienteId?: string;
  @IsOptional() @IsUUID() vehiculoId?: string;
}

export class CancelarReservaDto {
  @IsString() @Length(3, 300) motivo: string;
}
