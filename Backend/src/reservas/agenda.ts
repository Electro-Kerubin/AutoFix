import { DateTime } from 'luxon';
import { ZONA_HORARIA } from '../notificaciones/plantillas';

export interface HorarioSucursal {
  horaApertura: string;
  horaCierre: string;
  duracionSlotMin: number;
}

export interface Slot {
  inicio: Date;
  fin: Date;
}

const aMinutos = (hhmm: string): number => {
  const [h, m] = hhmm.split(':').map(Number);
  return h * 60 + m;
};

/** Genera los bloques de atención de un día (YYYY-MM-DD, hora de Chile) según el horario de la sucursal. */
export function generarSlots(fecha: string, horario: HorarioSucursal): Slot[] {
  const dia = DateTime.fromISO(fecha, { zone: ZONA_HORARIA }).startOf('day');
  if (!dia.isValid) return [];
  const apertura = aMinutos(horario.horaApertura);
  const cierre = aMinutos(horario.horaCierre);
  const slots: Slot[] = [];
  for (let minuto = apertura; minuto + horario.duracionSlotMin <= cierre; minuto += horario.duracionSlotMin) {
    const inicio = dia.plus({ minutes: minuto });
    slots.push({ inicio: inicio.toJSDate(), fin: inicio.plus({ minutes: horario.duracionSlotMin }).toJSDate() });
  }
  return slots;
}

/** ¿El bloque [inicio, inicio+duración) cae completo dentro del horario de atención del día local? */
export function dentroDeHorario(inicio: Date, horario: HorarioSucursal): boolean {
  const local = DateTime.fromJSDate(inicio, { zone: ZONA_HORARIA });
  const minuto = local.hour * 60 + local.minute;
  return minuto >= aMinutos(horario.horaApertura) && minuto + horario.duracionSlotMin <= aMinutos(horario.horaCierre);
}

export const seSolapan = (a: Slot, b: Slot): boolean => a.inicio < b.fin && a.fin > b.inicio;
