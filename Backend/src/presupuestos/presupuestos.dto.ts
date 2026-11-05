import { Type } from 'class-transformer';
import {
  ArrayMaxSize,
  ArrayMinSize,
  IsArray,
  IsEnum,
  IsInt,
  IsOptional,
  IsString,
  IsUUID,
  Length,
  Max,
  Min,
  ValidateNested,
} from 'class-validator';
import { CanalAprobacion, TipoItem } from '../common/enums';

export class ItemPresupuestoDto {
  @IsEnum(TipoItem) tipo: TipoItem;
  /** Si se indica un repuesto y se omite, se usa el nombre del catálogo. */
  @IsOptional() @IsString() @Length(3, 300) descripcion?: string;
  @IsInt() @Min(1) @Max(1000) cantidad: number;
  /** CLP. Si se indica un repuesto y se omite, se usa su precio de venta vigente. */
  @IsOptional() @IsInt() @Min(0) precioUnitario?: number;
  @IsOptional() @IsUUID() repuestoId?: string;
  @IsOptional() @IsUUID() catalogoFallaId?: string;
  @IsOptional() @IsInt() @Min(0) @Max(120) garantiaMeses?: number;
}

export class GuardarPresupuestoDto {
  @IsOptional() @IsString() @Length(0, 2000) notas?: string;

  @IsArray() @ArrayMinSize(1) @ArrayMaxSize(100)
  @ValidateNested({ each: true }) @Type(() => ItemPresupuestoDto)
  items: ItemPresupuestoDto[];
}

/** Aprobación o rechazo registrada por personal del taller a nombre del cliente. */
export class DecisionMostradorDto {
  @IsEnum(CanalAprobacion) canal: CanalAprobacion;
  @IsString() @Length(3, 160) nombre: string;
}

export class RechazoDto {
  @IsString() @Length(3, 500) motivo: string;
}

export class CreateFallaDto {
  @IsString() @Length(2, 20) codigo: string;
  @IsString() @Length(3, 200) nombre: string;
  @IsString() @Length(2, 60) categoria: string;
}
