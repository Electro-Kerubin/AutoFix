import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcryptjs';
import { UsuariosService } from '../usuarios/usuarios.service';

@Injectable()
export class AuthService {
  constructor(
    private readonly usuarios: UsuariosService,
    private readonly jwt: JwtService,
  ) {}

  async login(email: string, password: string) {
    const usuario = await this.usuarios.buscarParaLogin(email);
    // Mismo mensaje para usuario inexistente, inactivo o clave errónea: no filtra qué cuentas existen.
    const valido = usuario?.activo && (await bcrypt.compare(password, usuario.passwordHash));
    if (!usuario || !valido) throw new UnauthorizedException('Credenciales inválidas');

    await this.usuarios.registrarAcceso(usuario.id);
    const accessToken = await this.jwt.signAsync({ sub: usuario.id, rol: usuario.rol });
    return {
      accessToken,
      usuario: {
        id: usuario.id,
        nombre: usuario.nombre,
        email: usuario.email,
        rol: usuario.rol,
        sucursalId: usuario.sucursalId,
      },
    };
  }
}
