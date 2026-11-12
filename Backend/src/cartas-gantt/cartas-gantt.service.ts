import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { UsuarioAutenticado } from '../common/auth';
import { CartaGantt, TareaGantt } from './carta-gantt.entity';
import { GuardarCartaGanttDto } from './cartas-gantt.dto';

@Injectable()
export class CartasGanttService {
  constructor(@InjectRepository(CartaGantt) private readonly repo: Repository<CartaGantt>) {}

  async listar() {
    const cartas = await this.repo.find({ order: { updatedAt: 'DESC' } });
    return cartas.map(({ id, nombre, descripcion, tareas, updatedAt }) => ({
      id,
      nombre,
      descripcion,
      updatedAt,
      totalTareas: tareas.length,
      inicio: tareas.map((t) => t.inicio).sort()[0] ?? null,
      fin: tareas.map((t) => t.fin).sort().at(-1) ?? null,
      avance: tareas.length ? Math.round(tareas.reduce((s, t) => s + t.avance, 0) / tareas.length) : 0,
    }));
  }

  async obtener(id: string): Promise<CartaGantt> {
    const carta = await this.repo.findOneBy({ id });
    if (!carta) throw new NotFoundException('Carta Gantt no encontrada');
    return carta;
  }

  async crear(dto: GuardarCartaGanttDto, usuario: UsuarioAutenticado): Promise<CartaGantt> {
    return this.repo.save(
      this.repo.create({
        nombre: dto.nombre.trim(),
        descripcion: dto.descripcion?.trim() || null,
        tareas: this.tareas(dto),
        creadaPorId: usuario.id,
      }),
    );
  }

  async actualizar(id: string, dto: GuardarCartaGanttDto): Promise<CartaGantt> {
    const carta = await this.obtener(id);
    carta.nombre = dto.nombre.trim();
    carta.descripcion = dto.descripcion?.trim() || null;
    carta.tareas = this.tareas(dto);
    return this.repo.save(carta);
  }

  async eliminar(id: string): Promise<void> {
    await this.obtener(id);
    await this.repo.delete(id);
  }

  private tareas(dto: GuardarCartaGanttDto): TareaGantt[] {
    const ids = new Set<string>();
    return dto.tareas.map((t) => {
      if (ids.has(t.id)) throw new BadRequestException('Hay tareas con el mismo identificador');
      ids.add(t.id);
      const inicio = t.inicio.slice(0, 10);
      const fin = t.fin.slice(0, 10);
      if (fin < inicio) throw new BadRequestException(`La tarea "${t.nombre}" termina antes de comenzar`);
      return { id: t.id, nombre: t.nombre.trim(), responsable: t.responsable?.trim() || null, inicio, fin, avance: t.avance };
    });
  }
}
