import { Type } from 'class-transformer';
import {
  ArrayMaxSize,
  IsArray,
  IsDateString,
  IsInt,
  IsOptional,
  IsString,
  Length,
  Max,
  Min,
  ValidateNested,
} from 'class-validator';

export class TareaGanttDto {
  @IsString() @Length(1, 36) id: string;
  @IsString() @Length(1, 160) nombre: string;
  @IsOptional() @IsString() @Length(0, 120) responsable?: string;
  @IsDateString() inicio: string;
  @IsDateString() fin: string;
  @IsInt() @Min(0) @Max(100) avance: number;
}

export class GuardarCartaGanttDto {
  @IsString() @Length(2, 120) nombre: string;
  @IsOptional() @IsString() @Length(0, 500) descripcion?: string;
  @IsArray() @ArrayMaxSize(300) @ValidateNested({ each: true }) @Type(() => TareaGanttDto) tareas: TareaGanttDto[];
}
