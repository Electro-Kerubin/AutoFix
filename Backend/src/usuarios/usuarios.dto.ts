import { PartialType } from '@nestjs/swagger';
import { IsBoolean, IsEmail, IsEnum, IsOptional, IsString, IsUUID, Length, MinLength } from 'class-validator';
import { Rol } from '../common/enums';

export class CreateUsuarioDto {
  @IsString() @Length(2, 120) nombre: string;
  @IsEmail() email: string;
  @IsString() @MinLength(8) password: string;
  @IsEnum(Rol) rol: Rol;
  @IsOptional() @IsUUID() sucursalId?: string;
}

export class UpdateUsuarioDto extends PartialType(CreateUsuarioDto) {
  @IsOptional() @IsBoolean() activo?: boolean;
}

export class CambiarPasswordDto {
  @IsString() passwordActual: string;
  @IsString() @MinLength(8) passwordNueva: string;
}
