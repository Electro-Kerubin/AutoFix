import { ConflictException, NotFoundException } from '@nestjs/common';
import { EntityManager } from 'typeorm';
import { EstadoOt } from '../common/enums';
import { OrdenTrabajo } from './orden-trabajo.entity';
import { OtHistorial } from './ot-historial.entity';
import { estaAbierta, puedeTransicionar } from './ot-estados';

/**
 * Carga la OT con bloqueo de fila (sin relaciones) para serializar cambios concurrentes
 * sobre la misma orden dentro de una transacción.
 */
export async function bloquearOt(manager: EntityManager, otId: string): Promise<OrdenTrabajo> {
  const ot = await manager.findOne(OrdenTrabajo, { where: { id: otId }, lock: { mode: 'pessimistic_write' } });
  if (!ot) throw new NotFoundException('Orden de trabajo no encontrada');
  return ot;
}

export function exigirAbierta(ot: OrdenTrabajo): void {
  if (!estaAbierta(ot.estado)) {
    throw new ConflictException(`La orden de trabajo está ${ot.estado.toLowerCase()} y ya no admite cambios`);
  }
}

/** Cambia el estado validando el flujo y deja registro en la bitácora. */
export async function aplicarEstado(
  manager: EntityManager,
  ot: OrdenTrabajo,
  nuevo: EstadoOt,
  usuarioId: string | null,
  comentario?: string | null,
): Promise<void> {
  if (!puedeTransicionar(ot.estado, nuevo)) {
    throw new ConflictException(`No se puede pasar la OT de ${ot.estado} a ${nuevo}`);
  }
  const anterior = ot.estado;
  await manager.update(OrdenTrabajo, ot.id, { estado: nuevo });
  await manager.insert(OtHistorial, {
    otId: ot.id,
    estadoAnterior: anterior,
    estadoNuevo: nuevo,
    usuarioId,
    comentario: comentario ?? null,
  });
  ot.estado = nuevo;
}
