import { createHash } from 'node:crypto';

export interface LineaCalculable {
  cantidad: number;
  precioUnitario: number;
}

export const totalLinea = (l: LineaCalculable): number => l.cantidad * l.precioUnitario;

export const totalPresupuesto = (lineas: readonly LineaCalculable[]): number =>
  lineas.reduce((suma, l) => suma + totalLinea(l), 0);

/**
 * Huella SHA-256 de lo que el cliente aprobó. Se guarda junto con la fecha/IP para poder demostrar
 * más adelante que el contenido no cambió después de la aprobación.
 */
export function huellaDecision(datos: {
  presupuestoId: string;
  decision: 'APROBADO' | 'RECHAZADO';
  total: number;
  decididoAt: Date;
  items: { tipo: string; descripcion: string; cantidad: number; precioUnitario: number }[];
}): string {
  const canonico = JSON.stringify({
    presupuestoId: datos.presupuestoId,
    decision: datos.decision,
    total: datos.total,
    decididoAt: datos.decididoAt.toISOString(),
    items: datos.items.map((i) => [i.tipo, i.descripcion, i.cantidad, i.precioUnitario]),
  });
  return createHash('sha256').update(canonico).digest('hex');
}
