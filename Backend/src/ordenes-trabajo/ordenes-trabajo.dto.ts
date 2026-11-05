import { Transform } from 'class-transformer';
import { IsBoolean, IsEnum, IsInt, IsOptional, IsString, IsUUID, Length, Min } from 'class-validator';
import { EstadoOt } from '../common/enums';
import { PaginacionDto } from '../common/pagination';

export class CreateOtDto {
  @IsUUID() sucursalId: string;
  @IsUUID() clienteId: string;
  @IsUUID() vehiculoId: string;
  @IsOptional() @IsUUID() reservaId?: string;
  @IsString() @Length(3, 500) motivoIngreso: string;
  @IsInt() @Min(0) kilometraje: number;
  @IsOptional() @IsString() @Length(0, 2000) observacionesRecepcion?: string;
  @IsOptional() @IsUUID() mecanicoId?: string;
}

export class CambiarEstadoDto {
  @IsEnum(EstadoOt) estado: EstadoOt;
  @IsOptional() @IsString() @Length(3, 500) comentario?: string;
}

export class AsignarMecanicoDto {
  @IsUUID() mecanicoId: string;
}

export class ValidarRepuestosDto {
  /** Declara explícitamente que la OT no usó repuestos. */
  @IsOptional() @IsBoolean() sinRepuestos?: boolean;
}

export class FiltroOtDto extends PaginacionDto {
  @IsOptional() @IsUUID() sucursalId?: string;
  @IsOptional() @IsEnum(EstadoOt) estado?: EstadoOt;
  @IsOptional() @Transform(({ value }) => value === 'true' || value === true) @IsBoolean() abiertas?: boolean;
  @IsOptional() @IsUUID() vehiculoId?: string;
  @IsOptional() @IsUUID() clienteId?: string;
  @IsOptional() @IsUUID() mecanicoId?: string;
}
