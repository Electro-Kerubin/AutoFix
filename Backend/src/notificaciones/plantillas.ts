import { DateTime } from 'luxon';

export const ZONA_HORARIA = 'America/Santiago';

const fechaHora = (fecha: Date): string =>
  DateTime.fromJSDate(fecha, { zone: ZONA_HORARIA }).setLocale('es-CL').toFormat("cccc d 'de' LLLL 'a las' HH:mm");

export const PLANTILLAS = {
  RESERVA_CONFIRMADA: (p: { nombre: string; sucursal: string; inicio: Date; patente: string }) =>
    `Hola ${p.nombre}, tu hora en AutoFix ${p.sucursal} para el vehículo ${p.patente} quedó confirmada para el ${fechaHora(p.inicio)}.`,

  RESERVA_RECORDATORIO: (p: { nombre: string; sucursal: string; inicio: Date; patente: string }) =>
    `Hola ${p.nombre}, te recordamos tu hora en AutoFix ${p.sucursal} para el vehículo ${p.patente}: ${fechaHora(p.inicio)}.`,

  VEHICULO_RECEPCIONADO: (p: { nombre: string; patente: string; numero: string; link: string }) =>
    `Hola ${p.nombre}, recibimos tu vehículo ${p.patente} (${p.numero}). Sigue el avance en línea: ${p.link}`,

  PRESUPUESTO_POR_APROBAR: (p: { nombre: string; patente: string; total: number; link: string }) =>
    `Hola ${p.nombre}, hay un presupuesto por $${p.total.toLocaleString('es-CL')} para tu vehículo ${p.patente}. Revísalo y apruébalo aquí: ${p.link}`,

  /** Aviso genérico de cambio de estado de la OT (REQ-05): evita que el cliente deba llamar para saber el avance. */
  ESTADO_OT: (p: { nombre: string; patente: string; numero: string; estado: string; link: string }) => {
    const detalle: Record<string, string> = {
      EN_DIAGNOSTICO: 'está en diagnóstico',
      EN_REPARACION: 'ya está en reparación',
      ENTREGADA: 'fue entregado. ¡Gracias por confiar en AutoFix!',
      CANCELADA: 'tuvo su orden de trabajo cancelada',
    };
    return `Hola ${p.nombre}, tu vehículo ${p.patente} (${p.numero}) ${detalle[p.estado] ?? 'cambió de estado'}. Sigue el avance: ${p.link}`;
  },

  VEHICULO_LISTO: (p: { nombre: string; patente: string; sucursal: string }) =>
    `Hola ${p.nombre}, tu vehículo ${p.patente} está listo para retiro en AutoFix ${p.sucursal}.`,
} as const;

export type NombrePlantilla = keyof typeof PLANTILLAS;
