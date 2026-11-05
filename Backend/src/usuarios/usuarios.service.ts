import { BadRequestException, ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import * as bcrypt from 'bcryptjs';
import { Repository } from 'typeorm';
import { CreateUsuarioDto, UpdateUsuarioDto } from './usuarios.dto';
import { Usuario } from './usuario.entity';

const BCRYPT_ROUNDS = 10;

@Injectable()
export class UsuariosService {
  constructor(@InjectRepository(Usuario) private readonly repo: Repository<Usuario>) {}

  listar(): Promise<Usuario[]> {
    return this.repo.find({ relations: { sucursal: true }, order: { nombre: 'ASC' } });
  }

  async obtener(id: string): Promise<Usuario> {
    const usuario = await this.repo.findOne({ where: { id }, relations: { sucursal: true } });
    if (!usuario) throw new NotFoundException('Usuario no encontrado');
    return usuario;
  }

  /** Incluye el hash de la contraseña; sólo para autenticación. */
  buscarParaLogin(email: string): Promise<Usuario | null> {
    return this.repo
      .createQueryBuilder('u')
      .addSelect('u.passwordHash')
      .where('u.email = :email', { email: email.trim().toLowerCase() })
      .getOne();
  }

  async crear(dto: CreateUsuarioDto): Promise<Usuario> {
    const email = dto.email.trim().toLowerCase();
    if (await this.repo.existsBy({ email })) throw new ConflictException('Ya existe un usuario con ese email');
    const { password, ...resto } = dto;
    const usuario = await this.repo.save(
      this.repo.create({ ...resto, email, passwordHash: await bcrypt.hash(password, BCRYPT_ROUNDS) }),
    );
    return this.obtener(usuario.id);
  }

  async actualizar(id: string, dto: UpdateUsuarioDto): Promise<Usuario> {
    const usuario = await this.obtener(id);
    const { password, email, ...resto } = dto;
    Object.assign(usuario, resto);
    if (email !== undefined) usuario.email = email.trim().toLowerCase();
    if (password) usuario.passwordHash = await bcrypt.hash(password, BCRYPT_ROUNDS);
    await this.repo.save(usuario);
    return this.obtener(id);
  }

  async cambiarPassword(id: string, actual: string, nueva: string): Promise<void> {
    const usuario = await this.repo
      .createQueryBuilder('u')
      .addSelect('u.passwordHash')
      .where('u.id = :id', { id })
      .getOne();
    if (!usuario || !(await bcrypt.compare(actual, usuario.passwordHash))) {
      throw new BadRequestException('La contraseña actual no es correcta');
    }
    await this.repo.update(id, { passwordHash: await bcrypt.hash(nueva, BCRYPT_ROUNDS) });
  }

  registrarAcceso(id: string): Promise<unknown> {
    return this.repo.update(id, { ultimoAcceso: new Date() });
  }

  hash(password: string): Promise<string> {
    return bcrypt.hash(password, BCRYPT_ROUNDS);
  }
}
