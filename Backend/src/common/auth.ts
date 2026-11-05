import {
  CanActivate,
  createParamDecorator,
  ExecutionContext,
  ForbiddenException,
  Injectable,
  SetMetadata,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { AuthGuard } from '@nestjs/passport';
import { ROLES_RED_COMPLETA, Rol } from './enums';

export interface UsuarioAutenticado {
  id: string;
  email: string;
  nombre: string;
  rol: Rol;
  sucursalId: string | null;
}

const IS_PUBLIC = 'isPublic';
const ROLES = 'roles';

/** Marca un endpoint como accesible sin JWT. */
export const Public = () => SetMetadata(IS_PUBLIC, true);

/** Restringe un endpoint a los roles indicados (ADMIN siempre tiene acceso). */
export const Roles = (...roles: Rol[]) => SetMetadata(ROLES, roles);

export const CurrentUser = createParamDecorator(
  (_data: unknown, ctx: ExecutionContext): UsuarioAutenticado => ctx.switchToHttp().getRequest().user,
);

@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {
  constructor(private readonly reflector: Reflector) {
    super();
  }

  override canActivate(ctx: ExecutionContext) {
    const publico = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC, [ctx.getHandler(), ctx.getClass()]);
    return publico ? true : super.canActivate(ctx);
  }
}

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  canActivate(ctx: ExecutionContext): boolean {
    const requeridos = this.reflector.getAllAndOverride<Rol[] | undefined>(ROLES, [ctx.getHandler(), ctx.getClass()]);
    if (!requeridos?.length) return true;
    const usuario: UsuarioAutenticado | undefined = ctx.switchToHttp().getRequest().user;
    if (usuario && (usuario.rol === Rol.ADMIN || requeridos.includes(usuario.rol))) return true;
    throw new ForbiddenException('No tienes permisos para realizar esta acción');
  }
}

/**
 * Sucursal a la que se debe limitar la consulta del usuario:
 * `undefined` = toda la red (ADMIN/GERENCIA o sin sucursal asignada).
 */
export function sucursalDeAlcance(usuario: UsuarioAutenticado, solicitada?: string): string | undefined {
  if (ROLES_RED_COMPLETA.includes(usuario.rol)) return solicitada;
  return usuario.sucursalId ?? solicitada;
}
