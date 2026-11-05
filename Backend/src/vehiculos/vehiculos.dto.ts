import { PartialType } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsInt, IsOptional, IsString, IsUUID, Length, Max, Min } from 'class-validator';
import { EsPatente } from '../common/utils/validators';

export class CreateVehiculoDto {
  @EsPatente() patente: string;
  @IsString() @Length(1, 60) marca: string;
  @IsString() @Length(1, 80) modelo: string;
  @IsOptional() @Type(() => Number) @IsInt() @Min(1950) @Max(2100) anio?: number;
  @IsOptional() @IsString() @Length(5, 25) vin?: string;
  @IsOptional() @IsString() color?: string;
  @IsOptional() @Type(() => Number) @IsInt() @Min(0) kilometraje?: number;
  @IsUUID() clienteId: string;
}

export class UpdateVehiculoDto extends PartialType(CreateVehiculoDto) {}
