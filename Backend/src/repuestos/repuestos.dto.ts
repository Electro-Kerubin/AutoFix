import { PartialType } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsBoolean, IsInt, IsOptional, IsString, IsUUID, Length, Max, Min } from 'class-validator';
import { PaginacionDto } from '../common/pagination';

export class BuscarRepuestosDto extends PaginacionDto {
  @IsOptional() @IsUUID() sucursalId?: string;
}

export class CreateRepuestoDto {
  @IsString() @Length(2, 40) codigo: string;
  @IsString() @Length(2, 200) nombre: string;
  @IsOptional() @IsString() @Length(2, 60) categoria?: string;
  @Type(() => Number) @IsInt() @Min(0) precioVenta: number;
}

export class UpdateRepuestoDto extends PartialType(CreateRepuestoDto) {
  @IsOptional() @IsBoolean() activo?: boolean;
}

export class AjusteStockDto {
  @IsUUID() sucursalId: string;
  /** Cantidad física resultante tras el conteo. */
  @IsInt() @Min(0) cantidad: number;
  @IsOptional() @IsInt() @Min(0) stockMinimo?: number;
  @IsOptional() @IsString() @Length(1, 40) ubicacion?: string;
  @IsString() @Length(3, 300) motivo: string;
}

export class AsignarRepuestoDto {
  @IsUUID() repuestoId: string;
  @IsInt() @Min(1) @Max(1000) cantidad: number;
  /** Bodega/taller del que sale el repuesto; por defecto la sucursal de la OT. */
  @IsOptional() @IsUUID() sucursalOrigenId?: string;
  @IsOptional() @IsInt() @Min(0) precioUnitario?: number;
  @IsOptional() @IsInt() @Min(0) @Max(120) garantiaMeses?: number;
}
