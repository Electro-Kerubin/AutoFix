import { Type } from 'class-transformer';
import { IsInt, IsOptional, IsString, Max, Min } from 'class-validator';

export class PaginacionDto {
  @IsOptional() @Type(() => Number) @IsInt() @Min(1)
  page: number = 1;

  @IsOptional() @Type(() => Number) @IsInt() @Min(1) @Max(100)
  limit: number = 20;

  @IsOptional() @IsString()
  q?: string;
}

export interface Pagina<T> {
  items: T[];
  total: number;
  page: number;
  limit: number;
}

export function pagina<T>(items: T[], total: number, dto: PaginacionDto): Pagina<T> {
  return { items, total, page: dto.page, limit: dto.limit };
}

export const saltar = (dto: PaginacionDto): number => (dto.page - 1) * dto.limit;
