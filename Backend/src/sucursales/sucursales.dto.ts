import { PartialType } from '@nestjs/swagger';
import { IsBoolean, IsEnum, IsInt, IsOptional, IsString, Length, Matches, Max, Min } from 'class-validator';
import { TipoSucursal } from '../common/enums';

const HORA = /^([01]\d|2[0-3]):[0-5]\d$/;

export class CreateSucursalDto {
  @IsString() @Length(2, 20) codigo: string;
  @IsString() @Length(2, 120) nombre: string;
  @IsOptional() @IsEnum(TipoSucursal) tipo?: TipoSucursal;
  @IsOptional() @IsString() ciudad?: string;
  @IsOptional() @IsString() direccion?: string;
  @IsOptional() @IsString() telefono?: string;
  @IsOptional() @IsInt() @Min(1) @Max(50) boxes?: number;
  @IsOptional() @Matches(HORA, { message: 'horaApertura debe tener formato HH:mm' }) horaApertura?: string;
  @IsOptional() @Matches(HORA, { message: 'horaCierre debe tener formato HH:mm' }) horaCierre?: string;
  @IsOptional() @IsInt() @Min(15) @Max(240) duracionSlotMin?: number;
  @IsOptional() @IsBoolean() activa?: boolean;
  @IsOptional() @IsBoolean() piloto?: boolean;
}

export class UpdateSucursalDto extends PartialType(CreateSucursalDto) {}
