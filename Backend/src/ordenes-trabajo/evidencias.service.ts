import { BadRequestException, Inject, Injectable, NotFoundException } from '@nestjs/common';
import { ConfigType } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { randomUUID } from 'node:crypto';
import { mkdir, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import { Repository } from 'typeorm';
import { appConfig } from '../config/app.config';
import { EvidenciaOt } from './evidencia.entity';
import { OrdenTrabajo } from './orden-trabajo.entity';
import { exigirAbierta } from './ot-transiciones';

export const MAX_EVIDENCIA_BYTES = 5 * 1024 * 1024;

interface TipoImagen {
  mime: string;
  ext: string;
}

/** Identifica la imagen por su contenido (firma binaria); el Content-Type que declara el cliente no es confiable. */
export function detectarImagen(buffer: Buffer): TipoImagen | null {
  if (buffer.length > 12) {
    if (buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff) return { mime: 'image/jpeg', ext: 'jpg' };
    if (buffer.subarray(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]))) {
      return { mime: 'image/png', ext: 'png' };
    }
    if (buffer.toString('ascii', 0, 4) === 'RIFF' && buffer.toString('ascii', 8, 12) === 'WEBP') {
      return { mime: 'image/webp', ext: 'webp' };
    }
  }
  return null;
}

@Injectable()
export class EvidenciasService {
  constructor(
    @InjectRepository(EvidenciaOt) private readonly repo: Repository<EvidenciaOt>,
    @InjectRepository(OrdenTrabajo) private readonly ots: Repository<OrdenTrabajo>,
    @Inject(appConfig.KEY) private readonly config: ConfigType<typeof appConfig>,
  ) {}

  listar(otId: string): Promise<EvidenciaOt[]> {
    return this.repo.find({ where: { otId }, order: { createdAt: 'ASC' } });
  }

  async subir(
    otId: string,
    archivo: { buffer: Buffer; originalname: string; size: number } | undefined,
    descripcion: string | undefined,
    usuarioId: string,
  ): Promise<EvidenciaOt> {
    if (!archivo) throw new BadRequestException('Adjunte una imagen en el campo "archivo"');
    const ot = await this.ots.findOneBy({ id: otId });
    if (!ot) throw new NotFoundException('Orden de trabajo no encontrada');
    exigirAbierta(ot);

    const tipo = detectarImagen(archivo.buffer);
    if (!tipo) throw new BadRequestException('Sólo se aceptan imágenes JPEG, PNG o WebP');

    const nombreEnDisco = `${randomUUID()}.${tipo.ext}`;
    const directorio = join(this.config.uploadsDir, otId);
    await mkdir(directorio, { recursive: true });
    await writeFile(join(directorio, nombreEnDisco), archivo.buffer);

    return this.repo.save(
      this.repo.create({
        otId,
        nombreOriginal: archivo.originalname.slice(0, 255),
        archivo: nombreEnDisco,
        mimeType: tipo.mime,
        tamano: archivo.size,
        descripcion: descripcion?.slice(0, 300) ?? null,
        subidaPorId: usuarioId,
      }),
    );
  }

  /** Resuelve la ruta en disco; `otId` permite al portal acotar la búsqueda a la OT de su token. */
  async ubicar(id: string, otId?: string): Promise<{ ruta: string; mimeType: string; nombre: string }> {
    const evidencia = await this.repo.findOne({ where: otId ? { id, otId } : { id } });
    if (!evidencia) throw new NotFoundException('Evidencia no encontrada');
    return {
      ruta: join(this.config.uploadsDir, evidencia.otId, evidencia.archivo),
      mimeType: evidencia.mimeType,
      nombre: evidencia.nombreOriginal,
    };
  }
}
