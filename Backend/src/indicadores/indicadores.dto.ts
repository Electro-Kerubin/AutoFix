import { Type } from 'class-transformer';
import {
  IsBoolean,
  IsDateString,
  IsEnum,
  IsIn,
  IsInt,
  IsNumber,
  IsOptional,
  IsString,
  IsUUID,
  Length,
  Max,
  Min,
} from 'class-validator';
import { TipoEventoKpi } from '../common/enums';

export const MOTIVOS_CIERRE = ['MIGRACION', 'CAPACITACION', 'OTRO'] as const;

export class CreateEventoKpiDto {
  @IsEnum(TipoEventoKpi) tipo: TipoEventoKpi;
  /** Por defecto la sucursal del usuario. */
  @IsOptional() @IsUUID() sucursalId?: string;
  /** Por defecto hoy (YYYY-MM-DD). */
  @IsOptional() @IsDateString() fecha?: string;
  @IsOptional() @IsInt() @Min(1) @Max(10000) cantidad?: number;
  @IsOptional() @IsInt() @Min(0) monto?: number;
  @IsOptional() @IsBoolean() urgente?: boolean;
  @IsOptional() @Type(() => Number) @IsNumber({ maxDecimalPlaces: 2 }) @Min(0.25) @Max(744) horas?: number;
  @IsOptional() @IsIn(MOTIVOS_CIERRE) motivo?: string;
  @IsOptional() @IsUUID() otId?: string;
  @IsOptional() @IsString() @Length(3, 500) detalle?: string;
}

export class FiltroEventosKpiDto {
  @IsOptional() @IsEnum(TipoEventoKpi) tipo?: TipoEventoKpi;
  @IsOptional() @IsUUID() sucursalId?: string;
  @IsOptional() @IsDateString() desde?: string;
  @IsOptional() @IsDateString() hasta?: string;
}
