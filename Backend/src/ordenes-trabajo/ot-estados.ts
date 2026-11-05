import { EstadoOt } from '../common/enums';

/** Flujo permitido entre estados de la orden de trabajo. */
export const TRANSICIONES: Record<EstadoOt, readonly EstadoOt[]> = {
  [EstadoOt.RECEPCIONADA]: [EstadoOt.EN_DIAGNOSTICO, EstadoOt.CANCELADA],
  [EstadoOt.EN_DIAGNOSTICO]: [EstadoOt.PRESUPUESTO_PENDIENTE, EstadoOt.CANCELADA],
  [EstadoOt.PRESUPUESTO_PENDIENTE]: [EstadoOt.EN_REPARACION, EstadoOt.EN_DIAGNOSTICO, EstadoOt.CANCELADA],
  [EstadoOt.EN_REPARACION]: [EstadoOt.PRESUPUESTO_PENDIENTE, EstadoOt.LISTA_ENTREGA],
  [EstadoOt.LISTA_ENTREGA]: [EstadoOt.ENTREGADA, EstadoOt.EN_REPARACION],
  [EstadoOt.ENTREGADA]: [],
  [EstadoOt.CANCELADA]: [],
};

/** OT que todavía admiten cambios (presupuestos, repuestos, evidencias). */
export const ESTADOS_ABIERTOS: readonly EstadoOt[] = [
  EstadoOt.RECEPCIONADA,
  EstadoOt.EN_DIAGNOSTICO,
  EstadoOt.PRESUPUESTO_PENDIENTE,
  EstadoOt.EN_REPARACION,
  EstadoOt.LISTA_ENTREGA,
];

export const estaAbierta = (estado: EstadoOt): boolean => ESTADOS_ABIERTOS.includes(estado);

export const puedeTransicionar = (desde: EstadoOt, hasta: EstadoOt): boolean => TRANSICIONES[desde].includes(hasta);
