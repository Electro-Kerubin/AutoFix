import { Body, Controller, Get, HttpCode, Post } from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import { CurrentUser, Public, UsuarioAutenticado } from '../common/auth';
import { CambiarPasswordDto } from '../usuarios/usuarios.dto';
import { UsuariosService } from '../usuarios/usuarios.service';
import { LoginDto } from './auth.dto';
import { AuthService } from './auth.service';

@Controller('auth')
export class AuthController {
  constructor(
    private readonly auth: AuthService,
    private readonly usuarios: UsuariosService,
  ) {}

  @Public()
  @Throttle({ default: { limit: 10, ttl: 60_000 } })
  @Post('login') @HttpCode(200)
  login(@Body() dto: LoginDto) {
    return this.auth.login(dto.email, dto.password);
  }

  @Get('me')
  me(@CurrentUser() usuario: UsuarioAutenticado) {
    return usuario;
  }

  @Post('cambiar-password') @HttpCode(204)
  async cambiarPassword(@CurrentUser() usuario: UsuarioAutenticado, @Body() dto: CambiarPasswordDto) {
    await this.usuarios.cambiarPassword(usuario.id, dto.passwordActual, dto.passwordNueva);
  }
}
