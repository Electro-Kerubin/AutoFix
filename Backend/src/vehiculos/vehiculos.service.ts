import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { ILike, Repository } from 'typeorm';
import { Cliente } from '../clientes/cliente.entity';
import { PaginacionDto, pagina, saltar } from '../common/pagination';
import { normalizarPatente } from '../common/utils/patente';
import { CreateVehiculoDto, UpdateVehiculoDto } from './vehiculos.dto';
import { Vehiculo } from './vehiculo.entity';

@Injectable()
export class VehiculosService {
  constructor(
    @InjectRepository(Vehiculo) private readonly repo: Repository<Vehiculo>,
    @InjectRepository(Cliente) private readonly clientes: Repository<Cliente>,
  ) {}

  async buscar(dto: PaginacionDto, clienteId?: string) {
    const termino = dto.q?.trim();
    const filtroCliente = clienteId ? { clienteId } : {};
    const where = termino
      ? [
          { ...filtroCliente, patente: ILike(`%${normalizarPatente(termino)}%`) },
          { ...filtroCliente, marca: ILike(`%${termino}%`) },
          { ...filtroCliente, modelo: ILike(`%${termino}%`) },
        ]
      : filtroCliente;
    const [items, total] = await this.repo.findAndCount({
      where,
      relations: { cliente: true },
      order: { patente: 'ASC' },
      skip: saltar(dto),
      take: dto.limit,
    });
    return pagina(items, total, dto);
  }

  async obtener(id: string): Promise<Vehiculo> {
    const vehiculo = await this.repo.findOne({ where: { id }, relations: { cliente: true } });
    if (!vehiculo) throw new NotFoundException('Vehículo no encontrado');
    return vehiculo;
  }

  buscarPorPatente(patente: string): Promise<Vehiculo | null> {
    return this.repo.findOne({ where: { patente: normalizarPatente(patente) }, relations: { cliente: true } });
  }

  async crear(dto: CreateVehiculoDto): Promise<Vehiculo> {
    const patente = normalizarPatente(dto.patente);
    const existente = await this.repo.findOneBy({ patente });
    if (existente) {
      throw new ConflictException({ message: `Ya existe un vehículo con patente ${patente}`, vehiculoId: existente.id });
    }
    await this.exigirCliente(dto.clienteId);
    const creado = await this.repo.save(this.repo.create({ ...dto, patente }));
    return this.obtener(creado.id);
  }

  async actualizar(id: string, dto: UpdateVehiculoDto): Promise<Vehiculo> {
    const vehiculo = await this.obtener(id);
    const { patente, clienteId, ...resto } = dto;
    if (patente) {
      const nueva = normalizarPatente(patente);
      if (nueva !== vehiculo.patente && (await this.repo.existsBy({ patente: nueva }))) {
        throw new ConflictException(`Ya existe un vehículo con patente ${nueva}`);
      }
      vehiculo.patente = nueva;
    }
    if (clienteId && clienteId !== vehiculo.clienteId) {
      await this.exigirCliente(clienteId);
      vehiculo.clienteId = clienteId;
    }
    Object.assign(vehiculo, resto);
    // `cliente` cargado tiene precedencia sobre `clienteId` al guardar: se descarta para que aplique el cambio.
    const { cliente: _cliente, ...persistible } = vehiculo;
    await this.repo.save(persistible);
    return this.obtener(id);
  }

  private async exigirCliente(clienteId: string): Promise<void> {
    if (!(await this.clientes.existsBy({ id: clienteId }))) throw new NotFoundException('Cliente no encontrado');
  }
}
