import { huellaDecision, totalPresupuesto } from './calculos';

describe('presupuesto', () => {
  it('suma cantidad × precio de cada línea', () => {
    expect(
      totalPresupuesto([
        { cantidad: 1, precioUnitario: 85_000 },
        { cantidad: 4, precioUnitario: 9_800 },
      ]),
    ).toBe(124_200);
    expect(totalPresupuesto([])).toBe(0);
  });
});

describe('huella de la decisión del cliente', () => {
  const base = {
    presupuestoId: 'p1',
    decision: 'APROBADO' as const,
    total: 100,
    decididoAt: new Date('2026-11-03T13:00:00Z'),
    items: [{ tipo: 'MANO_OBRA', descripcion: 'Cambio de aceite', cantidad: 1, precioUnitario: 100 }],
  };

  it('es determinista y tiene forma de SHA-256', () => {
    expect(huellaDecision(base)).toBe(huellaDecision({ ...base }));
    expect(huellaDecision(base)).toMatch(/^[a-f0-9]{64}$/);
  });

  it('cambia si se altera cualquier dato aprobado', () => {
    const original = huellaDecision(base);
    expect(huellaDecision({ ...base, total: 101 })).not.toBe(original);
    expect(huellaDecision({ ...base, decision: 'RECHAZADO' })).not.toBe(original);
    expect(huellaDecision({ ...base, items: [{ ...base.items[0], precioUnitario: 99 }] })).not.toBe(original);
    expect(huellaDecision({ ...base, decididoAt: new Date('2026-11-03T13:00:01Z') })).not.toBe(original);
  });
});
