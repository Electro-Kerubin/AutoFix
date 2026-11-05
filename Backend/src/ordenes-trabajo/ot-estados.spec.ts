import { EstadoOt } from '../common/enums';
import { ESTADOS_ABIERTOS, TRANSICIONES, estaAbierta, puedeTransicionar } from './ot-estados';

describe('flujo de estados de la OT', () => {
  it('permite el camino feliz completo', () => {
    const camino = [
      EstadoOt.RECEPCIONADA,
      EstadoOt.EN_DIAGNOSTICO,
      EstadoOt.PRESUPUESTO_PENDIENTE,
      EstadoOt.EN_REPARACION,
      EstadoOt.LISTA_ENTREGA,
      EstadoOt.ENTREGADA,
    ];
    for (let i = 0; i < camino.length - 1; i++) expect(puedeTransicionar(camino[i], camino[i + 1])).toBe(true);
  });

  it('no permite saltarse el diagnóstico ni la aprobación', () => {
    expect(puedeTransicionar(EstadoOt.RECEPCIONADA, EstadoOt.EN_REPARACION)).toBe(false);
    expect(puedeTransicionar(EstadoOt.EN_DIAGNOSTICO, EstadoOt.EN_REPARACION)).toBe(false);
    expect(puedeTransicionar(EstadoOt.EN_REPARACION, EstadoOt.ENTREGADA)).toBe(false);
  });

  it('permite volver a presupuesto cuando aparece trabajo adicional en reparación', () => {
    expect(puedeTransicionar(EstadoOt.EN_REPARACION, EstadoOt.PRESUPUESTO_PENDIENTE)).toBe(true);
  });

  it('los estados finales no tienen salida', () => {
    expect(TRANSICIONES[EstadoOt.ENTREGADA]).toEqual([]);
    expect(TRANSICIONES[EstadoOt.CANCELADA]).toEqual([]);
  });

  it('no se puede cancelar una OT en reparación o lista (hay trabajo hecho)', () => {
    expect(puedeTransicionar(EstadoOt.EN_REPARACION, EstadoOt.CANCELADA)).toBe(false);
    expect(puedeTransicionar(EstadoOt.LISTA_ENTREGA, EstadoOt.CANCELADA)).toBe(false);
  });

  it('estaAbierta coincide con ESTADOS_ABIERTOS y excluye los finales', () => {
    for (const e of ESTADOS_ABIERTOS) expect(estaAbierta(e)).toBe(true);
    expect(estaAbierta(EstadoOt.ENTREGADA)).toBe(false);
    expect(estaAbierta(EstadoOt.CANCELADA)).toBe(false);
  });
});
