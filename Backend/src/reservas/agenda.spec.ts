import { dentroDeHorario, generarSlots, seSolapan } from './agenda';

const horario = { horaApertura: '08:30', horaCierre: '18:00', duracionSlotMin: 60 };

describe('agenda', () => {
  it('genera bloques completos dentro del horario de atención', () => {
    const slots = generarSlots('2026-11-03', horario);
    expect(slots).toHaveLength(9); // 08:30 … 16:30 (el último termina 17:30; 17:30–18:30 no cabe)
    expect(slots[0].fin.getTime() - slots[0].inicio.getTime()).toBe(60 * 60_000);
  });

  it('respeta la hora local de Chile aunque cambie el horario de verano', () => {
    // 2026-11-03: Chile en UTC-3 → 08:30 locales = 11:30 UTC
    expect(generarSlots('2026-11-03', horario)[0].inicio.toISOString()).toBe('2026-11-03T11:30:00.000Z');
    // 2026-07-01: Chile en UTC-4 → 08:30 locales = 12:30 UTC
    expect(generarSlots('2026-07-01', horario)[0].inicio.toISOString()).toBe('2026-07-01T12:30:00.000Z');
  });

  it('devuelve vacío con una fecha inválida', () => {
    expect(generarSlots('no-es-fecha', horario)).toEqual([]);
  });

  it('valida que el bloque completo caiga dentro del horario', () => {
    expect(dentroDeHorario(new Date('2026-11-03T11:30:00Z'), horario)).toBe(true); // 08:30
    expect(dentroDeHorario(new Date('2026-11-03T11:00:00Z'), horario)).toBe(false); // 08:00, antes de abrir
    expect(dentroDeHorario(new Date('2026-11-03T20:30:00Z'), horario)).toBe(false); // 17:30 + 60 min excede el cierre
    expect(dentroDeHorario(new Date('2026-11-03T20:00:00Z'), horario)).toBe(true); // 17:00 + 60 min = 18:00
  });

  it('detecta solapes sin contar bloques contiguos', () => {
    const a = { inicio: new Date('2026-11-03T12:00:00Z'), fin: new Date('2026-11-03T13:00:00Z') };
    expect(seSolapan(a, { inicio: new Date('2026-11-03T12:30:00Z'), fin: new Date('2026-11-03T13:30:00Z') })).toBe(true);
    expect(seSolapan(a, { inicio: new Date('2026-11-03T13:00:00Z'), fin: new Date('2026-11-03T14:00:00Z') })).toBe(false);
  });
});
