/**
 * Los 25 KPI del archivo KPI_Proyecto_SUGO_AutoFix_v4.xlsx evaluados contra los datos del sistema.
 * Es una función pura: recibe los conteos ya consultados y devuelve cada KPI con su valor, meta y cumplimiento.
 */

export interface DatosKpiSugo {
  reservas: { horasPerdidas: number; horasReservadas: number; activas: number; conflictos: number };
  unificacion: { clientes: number; clientesDuplicados: number; vehiculos: number; vehiculosDuplicados: number };
  pilotos: { id: string; nombre: string; ot: number; fueraDeSugo: number }[];
  presupuestos: { decididos: number; trazables: number; pendientes: number };
  repuestos: { otConRepuestos: number; otTrazadas: number };
  eventos: {
    reclamos: number;
    compras: number;
    comprasUrgentes: number;
    llamadas: number;
    diasConLlamadas: number;
    horasCierre: number;
  };
  sync: { erp: { total: number; errores: number }; inventario: { total: number; errores: number } };
  notificaciones: { cambios: number; notificados: number };
  /** Milisegundos de una consulta real de historial por patente; null si no hay vehículos para medir. */
  busquedaGarantiaMs: number | null;
}

export type FuenteKpi = 'SISTEMA' | 'REGISTRO' | 'PROYECTO';

export interface KpiSugo {
  n: number;
  nombre: string;
  ambito: string;
  hito: string;
  valor: number | null;
  unidad: string;
  meta: string;
  /** null = sin datos suficientes para evaluar. */
  cumple: boolean | null;
  detalle: string;
  fuente: FuenteKpi;
}

/** Promedio histórico de llamadas de estado por sucursal y día (Charter) y meta de reducción > 70 %. */
export const LLAMADAS_LINEA_BASE = 55;
export const LLAMADAS_META = 16.5;

const pct = (parte: number, total: number): number | null => (total > 0 ? Math.round((parte / total) * 1000) / 10 : null);
const redondear = (n: number): number => Math.round(n * 100) / 100;
const evaluar = (valor: number | null, ok: (v: number) => boolean): boolean | null => (valor === null ? null : ok(valor));

type Base = Omit<KpiSugo, 'cumple' | 'valor'>;

export function construirKpiSugo(d: DatosKpiSugo): KpiSugo[] {
  const k = (base: Base, valor: number | null, ok: (v: number) => boolean): KpiSugo => ({
    ...base,
    valor,
    cumple: evaluar(valor, ok),
  });
  const proyecto = (n: number, nombre: string, ambito: string, hito: string, unidad: string, meta: string): KpiSugo => ({
    n,
    nombre,
    ambito,
    hito,
    valor: null,
    unidad,
    meta,
    cumple: null,
    detalle: 'Se mide en Proyecto SUGO (costos, cronograma, hitos y evidencias del equipo), no desde la operación de talleres.',
    fuente: 'PROYECTO',
  });

  const noShow = pct(d.reservas.horasPerdidas, d.reservas.horasReservadas);
  const duplicadas = pct(d.reservas.conflictos, d.reservas.activas);
  const unificadas = pct(
    d.unificacion.clientes - d.unificacion.clientesDuplicados,
    d.unificacion.clientes,
  );
  const otSugo = d.pilotos.reduce((a, p) => a + p.ot, 0);
  const otFuera = d.pilotos.reduce((a, p) => a + p.fueraDeSugo, 0);
  const digitales = pct(otSugo, otSugo + otFuera);
  const aceptacion = pct(d.presupuestos.trazables, d.presupuestos.decididos);
  const compras = pct(d.eventos.comprasUrgentes, d.eventos.compras);
  const trazabilidad = pct(d.repuestos.otTrazadas, d.repuestos.otConRepuestos);
  const garantiaSeg = d.busquedaGarantiaMs === null ? null : redondear(d.busquedaGarantiaMs / 1000);
  const llamadas = d.eventos.diasConLlamadas > 0 ? redondear(d.eventos.llamadas / d.eventos.diasConLlamadas) : null;
  const errErp = pct(d.sync.erp.errores, d.sync.erp.total);
  const errInv = pct(d.sync.inventario.errores, d.sync.inventario.total);
  const operando = d.pilotos.filter((p) => p.ot > 0 && p.fueraDeSugo === 0).length;
  const sucursalesOperando = pct(operando, d.pilotos.length);
  const notificados = pct(d.notificaciones.notificados, d.notificaciones.cambios);

  const porPiloto = (indice: number, ambito: string, orden: number): KpiSugo => {
    const p = d.pilotos[indice];
    const base: Base = {
      n: 22 + orden,
      nombre: `Atenciones de ${ambito} registradas en SUGO sin papel ni Excel`,
      ambito: `Piloto – ${ambito}`,
      hito: `H${11 + orden}`,
      unidad: '%',
      meta: '= 100 %',
      detalle: p
        ? `${p.ot} OT en SUGO y ${p.fueraDeSugo} atención(es) registradas fuera de SUGO en el período.`
        : 'La sucursal piloto no existe en el sistema.',
      fuente: 'REGISTRO',
    };
    return k(base, p ? pct(p.ot, p.ot + p.fueraDeSugo) : null, (v) => v === 100);
  };
  const piloto = (nombre: string) => d.pilotos.findIndex((p) => p.nombre === nombre);
  // El orden fijo del Charter es Santiago, Rancagua, Viña del Mar.
  const ordenado = ['Santiago', 'Rancagua', 'Viña del Mar'].map((nombre) => ({ nombre, indice: piloto(nombre) }));

  return [
    proyecto(1, 'Cumplimiento del presupuesto aprobado del proyecto', 'Proyecto', 'H14', '%', '≤ 100 %'),
    proyecto(2, 'Cumplimiento del plazo planificado del proyecto', 'Proyecto', 'H14', '%', '≤ 100 %'),
    k(
      {
        n: 3,
        nombre: 'Reducción de absentismo (no-show) y reservas duplicadas',
        ambito: 'Agendamiento',
        hito: 'H11–H13',
        unidad: '%',
        meta: '< 4 % (línea base 12 %)',
        detalle: `${redondear(d.reservas.horasPerdidas)} h perdidas de ${redondear(d.reservas.horasReservadas)} h con resultado de asistencia.`,
        fuente: 'SISTEMA',
      },
      noShow,
      (v) => v < 4,
    ),
    k(
      {
        n: 4,
        nombre: 'Reservas duplicadas detectadas en el sistema',
        ambito: 'Agendamiento',
        hito: 'H2',
        unidad: '%',
        meta: '= 0 %',
        detalle: `${d.reservas.conflictos} reserva(s) con conflicto de horario o exceso de cupo entre ${d.reservas.activas} vigentes.`,
        fuente: 'SISTEMA',
      },
      duplicadas,
      (v) => v === 0,
    ),
    k(
      {
        n: 5,
        nombre: 'Unificación de clientes por RUT/Patente',
        ambito: 'Recepción / OT',
        hito: 'H3',
        unidad: '%',
        meta: '= 100 %',
        detalle: `${d.unificacion.clientesDuplicados} RUT y ${d.unificacion.vehiculosDuplicados} patente(s) repetidos en ${d.unificacion.clientes} clientes y ${d.unificacion.vehiculos} vehículos.`,
        fuente: 'SISTEMA',
      },
      unificadas === null ? null : d.unificacion.vehiculosDuplicados > 0 ? 0 : unificadas,
      (v) => v === 100,
    ),
    k(
      {
        n: 6,
        nombre: 'Digitalización de Órdenes de Trabajo (OT)',
        ambito: 'Recepción / OT',
        hito: 'H11–H13',
        unidad: '%',
        meta: '= 100 %',
        detalle: `${otSugo} OT en SUGO y ${otFuera} atención(es) en papel o Excel registradas en las sucursales piloto.`,
        fuente: 'REGISTRO',
      },
      digitales,
      (v) => v === 100,
    ),
    k(
      {
        n: 7,
        nombre: 'Reclamos por diferencias entre presupuesto y cobro final',
        ambito: 'Presupuestos',
        hito: 'H14',
        unidad: 'reclamos',
        meta: '= 0 (línea base 317 al año)',
        detalle: 'Cantidad de reclamos registrados en el período; no tiene meta exigible durante la marcha blanca.',
        fuente: 'REGISTRO',
      },
      d.eventos.reclamos,
      (v) => v === 0,
    ),
    k(
      {
        n: 8,
        nombre: 'Trazabilidad de la aceptación digital de presupuestos',
        ambito: 'Presupuestos',
        hito: 'H4',
        unidad: '%',
        meta: '= 100 %',
        detalle: `${d.presupuestos.trazables} de ${d.presupuestos.decididos} decisiones con fecha/hora, canal, nombre y huella; ${d.presupuestos.pendientes} pendiente(s) de respuesta.`,
        fuente: 'SISTEMA',
      },
      aceptacion,
      (v) => v === 100,
    ),
    k(
      {
        n: 9,
        nombre: 'Compras urgentes de repuestos de alto costo',
        ambito: 'Repuestos',
        hito: 'H5',
        unidad: '%',
        meta: '≤ 5 % (línea base 18 %)',
        detalle: `$${d.eventos.comprasUrgentes.toLocaleString('es-CL')} urgentes de $${d.eventos.compras.toLocaleString('es-CL')} comprados.`,
        fuente: 'REGISTRO',
      },
      compras,
      (v) => v <= 5,
    ),
    k(
      {
        n: 10,
        nombre: 'Trazabilidad de repuestos por Orden de Trabajo',
        ambito: 'Repuestos',
        hito: 'H5',
        unidad: '%',
        meta: '= 100 %',
        detalle: `${d.repuestos.otTrazadas} de ${d.repuestos.otConRepuestos} OT entregadas con repuestos tienen el consumo validado contra inventario.`,
        fuente: 'SISTEMA',
      },
      trazabilidad,
      (v) => v === 100,
    ),
    k(
      {
        n: 11,
        nombre: 'Tiempo de búsqueda del historial de garantías',
        ambito: 'Garantías',
        hito: 'H5',
        unidad: 's',
        meta: '< 5 s',
        detalle: 'Medición en vivo de una consulta de historial por patente en toda la red.',
        fuente: 'SISTEMA',
      },
      garantiaSeg,
      (v) => v < 5,
    ),
    k(
      {
        n: 12,
        nombre: 'Llamadas telefónicas de consulta de estado del vehículo',
        ambito: 'Atención al cliente',
        hito: 'H6',
        unidad: 'llamadas/sucursal/día',
        meta: `≤ ${LLAMADAS_META} (reducción > 70 % sobre ${LLAMADAS_LINEA_BASE})`,
        detalle:
          llamadas === null
            ? 'Sin registros de llamadas en el período.'
            : `${d.eventos.llamadas} llamadas en ${d.eventos.diasConLlamadas} día(s)-sucursal; reducción de ${Math.round((1 - llamadas / LLAMADAS_LINEA_BASE) * 100)} % frente a la línea base.`,
        fuente: 'REGISTRO',
      },
      llamadas,
      (v) => v <= LLAMADAS_META,
    ),
    k(
      {
        n: 13,
        nombre: 'Errores en la transferencia de OT cerradas al ERP',
        ambito: 'Integración',
        hito: 'H7',
        unidad: '%',
        meta: '= 0 %',
        detalle: `${d.sync.erp.errores} envío(s) con error de ${d.sync.erp.total}.`,
        fuente: 'SISTEMA',
      },
      errErp,
      (v) => v === 0,
    ),
    k(
      {
        n: 14,
        nombre: 'Errores de sincronización con el sistema de inventario',
        ambito: 'Integración',
        hito: 'H7',
        unidad: '%',
        meta: '= 0 %',
        detalle: `${d.sync.inventario.errores} sincronización(es) con error de ${d.sync.inventario.total}.`,
        fuente: 'SISTEMA',
      },
      errInv,
      (v) => v === 0,
    ),
    k(
      {
        n: 15,
        nombre: 'Horas de taller cerradas por causa de la migración',
        ambito: 'Piloto / Operación',
        hito: 'H11–H13',
        unidad: 'horas',
        meta: '= 0 h',
        detalle: 'Suma de cierres de taller registrados por migración, capacitación u otro motivo.',
        fuente: 'REGISTRO',
      },
      redondear(d.eventos.horasCierre),
      (v) => v === 0,
    ),
    k(
      {
        n: 16,
        nombre: 'Sucursales piloto operando con SUGO sin papel ni Excel',
        ambito: 'Adopción',
        hito: 'H11–H13',
        unidad: '%',
        meta: '= 100 %',
        detalle: `${operando} de ${d.pilotos.length} sucursal(es) piloto con OT en SUGO y sin atenciones fuera del sistema.`,
        fuente: 'REGISTRO',
      },
      sucursalesOperando,
      (v) => v === 100,
    ),
    proyecto(17, 'Requisitos del Charter cubiertos en el documento de arquitectura', 'Arquitectura', 'H1', '%', '= 100 %'),
    k(
      {
        n: 18,
        nombre: 'Cambios de estado de la OT notificados automáticamente al cliente',
        ambito: 'Portal cliente',
        hito: 'H6',
        unidad: '%',
        meta: '= 100 %',
        detalle: `${d.notificaciones.notificados} de ${d.notificaciones.cambios} cambios de estado notificados (sólo clientes que autorizan avisos y tienen contacto).`,
        fuente: 'SISTEMA',
      },
      notificados,
      (v) => v === 100,
    ),
    proyecto(19, 'Casos de prueba end-to-end críticos aprobados', 'Pruebas (QA)', 'H8', '%', '= 100 % y 0 defectos críticos'),
    proyecto(20, 'Pruebas de rendimiento, estrés y seguridad en el entorno cloud', 'Despliegue cloud', 'H9', '%', '= 100 % y 0 vulnerabilidades críticas'),
    proyecto(21, 'Personal programado que completó la capacitación por turnos', 'Capacitación', 'H10', '%', '≥ 90 % por sucursal'),
    ...ordenado.map(({ nombre, indice }, i) =>
      indice >= 0
        ? porPiloto(indice, nombre, i)
        : k(
            {
              n: 22 + i,
              nombre: `Atenciones de ${nombre} registradas en SUGO sin papel ni Excel`,
              ambito: `Piloto – ${nombre}`,
              hito: `H${11 + i}`,
              unidad: '%',
              meta: '= 100 %',
              detalle: 'La sucursal no está marcada como piloto en el sistema o el filtro la excluye.',
              fuente: 'REGISTRO',
            },
            null,
            () => false,
          ),
    ),
    proyecto(25, 'Cumplimiento de los KPI de control del proyecto al cierre', 'Cierre del proyecto', 'H14', '%', '= 100 %'),
  ];
}
