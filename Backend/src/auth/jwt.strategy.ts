import { Inject, Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigType } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { UsuarioAutenticado } from '../common/auth';
import { Rol } from '../common/enums';
import { appConfig } from '../config/app.config';
import { UsuariosService } from '../usuarios/usuarios.service';

interface JwtPayload {
  sub: string;
}

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(
    @Inject(appConfig.KEY) config: ConfigType<typeof appConfig>,
    private readonly usuarios: UsuariosService,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: config.jwt.secret,
    });
  }

  /** Se consulta el usuario en cada request para que una baja o cambio de rol tenga efecto inmediato. */
  async validate(payload: JwtPayload): Promise<UsuarioAutenticado> {
    const usuario = await this.usuarios.obtener(payload.sub).catch(() => null);
    if (!usuario?.activo) throw new UnauthorizedException('Sesión inválida');
    return {
      id: usuario.id,
      email: usuario.email,
      nombre: usuario.nombre,
      rol: usuario.rol as Rol,
      sucursalId: usuario.sucursalId,
    };
  }
}
