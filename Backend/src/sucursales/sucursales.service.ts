import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CreateSucursalDto, UpdateSucursalDto } from './sucursales.dto';
import { Sucursal } from './sucursal.entity';

@Injectable()
export class SucursalesService {
  constructor(@InjectRepository(Sucursal) private readonly repo: Repository<Sucursal>) {}

  listar(soloActivas = true): Promise<Sucursal[]> {
    return this.repo.find({ where: soloActivas ? { activa: true } : {}, order: { nombre: 'ASC' } });
  }

  async obtener(id: string): Promise<Sucursal> {
    const sucursal = await this.repo.findOneBy({ id });
    if (!sucursal) throw new NotFoundException('Sucursal no encontrada');
    return sucursal;
  }

  async crear(dto: CreateSucursalDto): Promise<Sucursal> {
    if (await this.repo.existsBy({ codigo: dto.codigo })) {
      throw new ConflictException(`Ya existe una sucursal con código ${dto.codigo}`);
    }
    return this.repo.save(this.repo.create(dto));
  }

  async actualizar(id: string, dto: UpdateSucursalDto): Promise<Sucursal> {
    const sucursal = await this.obtener(id);
    return this.repo.save(Object.assign(sucursal, dto));
  }
}
