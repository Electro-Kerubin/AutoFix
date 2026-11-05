import { BadRequestException, ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectDataSource, InjectRepository } from '@nestjs/typeorm';
import { DataSource, ILike, Repository } from 'typeorm';
import { PaginacionDto, pagina, saltar } from '../common/pagination';
import { normalizarRut } from '../common/utils/rut';
import { CreateClienteDto, UpdateClienteDto } from './clientes.dto';
import { Cliente } from './cliente.entity';

@Injectable()
export class ClientesService {
  constructor(
    @InjectRepository(Cliente) private readonly repo: Repository<Cliente>,
    @InjectDataSource() private readonly dataSource: DataSource,
  ) {}

  async buscar(dto: PaginacionDto) {
    const termino = dto.q?.trim();
    const where = termino
      ? [{ nombre: ILike(`%${termino}%`) }, { rut: ILike(`%${normalizarRut(termino)}%`) }, { email: ILike(`%${termino}%`) }]
      : {};
    const [items, total] = await this.repo.findAndCount({
      where,
      order: { nombre: 'ASC' },
      skip: saltar(dto),
      take: dto.limit,
    });
    return pagina(items, total, dto);
  }

  async obtener(id: string): Promise<Cliente> {
    const cliente = await this.repo.findOne({ where: { id }, relations: { vehiculos: true } });
    if (!cliente) throw new NotFoundException('Cliente no encontrado');
    return cliente;
  }

  buscarPorRut(rut: string): Promise<Cliente | null> {
    return this.repo.findOne({ where: { rut: normalizarRut(rut) }, relations: { vehiculos: true } });
  }

  async crear(dto: CreateClienteDto): Promise<Cliente> {
    const rut = normalizarRut(dto.rut);
    const existente = await this.repo.findOneBy({ rut });
    if (existente) {
      throw new ConflictException({
        message: `Ya existe un cliente con RUT ${rut}`,
        clienteId: existente.id,
      });
    }
    return this.repo.save(this.repo.create({ ...dto, rut }));
  }

  async actualizar(id: string, dto: UpdateClienteDto): Promise<Cliente> {
    const cliente = await this.obtener(id);
    const { rut, ...resto } = dto;
    if (rut) {
      const nuevoRut = normalizarRut(rut);
      if (nuevoRut !== cliente.rut && (await this.repo.existsBy({ rut: nuevoRut }))) {
        throw new ConflictException(`Ya existe un cliente con RUT ${nuevoRut}; use la unificación de fichas`);
      }
      cliente.rut = nuevoRut;
    }
    Object.assign(cliente, resto);
    await this.repo.save(cliente);
    return this.obtener(id);
  }

  /**
   * Fusiona una ficha duplicada en otra: reasigna vehículos, reservas y OTs y elimina la duplicada.
   * Responde al riesgo R-07 (clientes duplicados en la base histórica).
   */
  async unificar(origenId: string, destinoId: string): Promise<Cliente> {
    if (origenId === destinoId) throw new BadRequestException('Origen y destino deben ser distintos');
    await this.obtener(origenId);
    await this.obtener(destinoId);

    await this.dataSource.transaction(async (manager) => {
      for (const tabla of ['vehiculos', 'reservas', 'ordenes_trabajo']) {
        await manager.query(`UPDATE "${tabla}" SET "clienteId" = $1 WHERE "clienteId" = $2`, [destinoId, origenId]);
      }
      await manager.delete(Cliente, { id: origenId });
    });
    return this.obtener(destinoId);
  }
}
