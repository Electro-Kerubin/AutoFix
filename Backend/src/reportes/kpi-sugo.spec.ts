import { describe, expect, it } from 'vitest';
import { DatosKpiSugo, construirKpiSugo } from './kpi-sugo';

const base = (): DatosKpiSugo => ({
  reservas: { horasPerdidas: 2, horasReservadas: 100, activas: 50, conflictos: 0 },
  unificacion: { clientes: 10, clientesDuplicados: 0, vehiculos: 12, vehiculosDuplicados: 0 },
  pilotos: [
    { id: 'a', nombre: 'Rancagua', ot: 4, fueraDeSugo: 0 },
    { id: 'b', nombre: 'Santiago', ot: 10, fueraDeSugo: 1 },
    { id: 'c', nombre: 'Viña del Mar', ot: 0, fueraDeSugo: 0 },
  ],
  presupuestos: { decididos: 8, trazables: 8, pendientes: 1 },
  repuestos: { otConRepuestos: 5, otTrazadas: 5 },
  eventos: { reclamos: 0, compras: 1000, comprasUrgentes: 40, llamadas: 100, diasConLlamadas: 10, horasCierre: 0 },
  sync: { erp: { total: 4, errores: 0 }, inventario: { total: 10, errores: 1 } },
  notificaciones: { cambios: 20, notificados: 20 },
  busquedaGarantiaMs: 120,
});

const porN = (d: DatosKpiSugo) => new Map(construirKpiSugo(d).map((k) => [k.n, k]));

describe('KPI del Charter', () => {
  it('entrega los 25 KPI en orden', () => {
    expect(construirKpiSugo(base()).map((k) => k.n)).toEqual(Array.from({ length: 25 }, (_, i) => i + 1));
  });

  it('evalúa metas con datos favorables', () => {
    const k = porN(base());
    expect(k.get(3)).toMatchObject({ valor: 2, cumple: true });
    expect(k.get(4)).toMatchObject({ valor: 0, cumple: true });
    expect(k.get(8)).toMatchObject({ valor: 100, cumple: true });
    expect(k.get(9)).toMatchObject({ valor: 4, cumple: true });
    expect(k.get(11)).toMatchObject({ valor: 0.12, cumple: true });
    expect(k.get(12)).toMatchObject({ valor: 10, cumple: true });
    expect(k.get(18)).toMatchObject({ valor: 100, cumple: true });
  });

  it('marca incumplimiento y sin datos', () => {
    const d = base();
    d.eventos.comprasUrgentes = 400;
    d.reservas.conflictos = 1;
    d.sync.erp = { total: 0, errores: 0 };
    const k = porN(d);
    expect(k.get(9)?.cumple).toBe(false);
    expect(k.get(4)?.cumple).toBe(false);
    expect(k.get(13)).toMatchObject({ valor: null, cumple: null });
    expect(k.get(14)?.cumple).toBe(false);
  });

  it('mide cada piloto en el orden del Charter y exige las 3 sucursales para el KPI 16', () => {
    const k = porN(base());
    expect(k.get(22)).toMatchObject({ ambito: 'Piloto – Santiago', hito: 'H11', cumple: false });
    expect(k.get(23)).toMatchObject({ ambito: 'Piloto – Rancagua', hito: 'H12', valor: 100, cumple: true });
    expect(k.get(24)).toMatchObject({ ambito: 'Piloto – Viña del Mar', hito: 'H13', valor: null });
    expect(k.get(16)).toMatchObject({ valor: 33.3, cumple: false });
  });

  it('deja los KPI de gestión del proyecto fuera de la medición operativa', () => {
    const k = porN(base());
    for (const n of [1, 2, 17, 19, 20, 21, 25]) expect(k.get(n)).toMatchObject({ fuente: 'PROYECTO', valor: null, cumple: null });
  });
});
