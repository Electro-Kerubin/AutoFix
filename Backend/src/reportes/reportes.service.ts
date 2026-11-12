import { Injectable } from '@nestjs/common';
import { InjectDataSource } from '@nestjs/typeorm';
import { DateTime } from 'luxon';
import { DataSource } from 'typeorm';
import { UsuarioAutenticado, sucursalDeAlcance } from '../common/auth';
import { GarantiasService } from '../garantias/garantias.service';
import { ZONA_HORARIA } from '../notificaciones/plantillas';
import { DatosKpiSugo, construirKpiSugo } from './kpi-sugo';

type Conteos = Record<string, number>;

const aConteos = (filas: { clave: string; total: number }[]): Conteos =>
  Object.fromEntries(filas.map((f) => [f.clave, f.total]));

const porcentaje = (parte: number, total: number): number | null =>
  total > 0 ? Math.round((parte / total) * 1000) / 10 : null;

@Injectable()
export class ReportesService {
  constructor(
    @InjectDataSource() private readonly db: DataSource,
    private readonly garantias: GarantiasService,
  ) {}

  /** Indicadores que contrastan con las metas de éxito del proyecto (no-show, compras urgentes, reclamos, llamadas). */
  async kpis(
    filtro: { sucursalId?: string; desde?: string; hasta?: string },
    usuario: UsuarioAutenticado,
  ) {
    const sucursalId = sucursalDeAlcance(usuario, filtro.sucursalId) ?? null;
    const hasta = filtro.hasta
      ? DateTime.fromISO(filtro.hasta, { zone: ZONA_HORARIA }).endOf('day')
      : DateTime.now().setZone(ZONA_HORARIA);
    const desde = filtro.desde
      ? DateTime.fromISO(filtro.desde, { zone: ZONA_HORARIA }).startOf('day')
      : hasta.minus({ days: 30 }).startOf('day');
    const rango = [desde.toJSDate(), hasta.toJSDate(), sucursalId];

    const [reservas, otAbiertas, otCerradas, presupuestos, consumo, bajoMinimo, sync, notificaciones] = await Promise.all([
      this.db.query<{ clave: string; total: number }[]>(
        `SELECT estado AS clave, COUNT(*)::int AS total FROM reservas
          WHERE inicio >= $1 AND inicio <= $2 AND ($3::uuid IS NULL OR "sucursalId" = $3) GROUP BY estado`,
        rango,
      ),
      this.db.query<{ clave: string; total: number }[]>(
        `SELECT estado AS clave, COUNT(*)::int AS total FROM ordenes_trabajo
          WHERE estado NOT IN ('ENTREGADA','CANCELADA') AND ($1::uuid IS NULL OR "sucursalId" = $1) GROUP BY estado`,
        [sucursalId],
      ),
      this.db.query<{ total: number; horas: string | null; monto: string | null }[]>(
        `SELECT COUNT(*)::int AS total,
                AVG(EXTRACT(EPOCH FROM ("fechaEntrega" - "fechaIngreso")) / 3600) AS horas,
                SUM("totalFinal") AS monto
           FROM ordenes_trabajo
          WHERE estado = 'ENTREGADA' AND "fechaEntrega" >= $1 AND "fechaEntrega" <= $2
            AND ($3::uuid IS NULL OR "sucursalId" = $3)`,
        rango,
      ),
      this.db.query<{ enviados: number; aprobados: number; rechazados: number; minutos: string | null }[]>(
        `SELECT COUNT(*)::int AS enviados,
                COUNT(*) FILTER (WHERE p.estado = 'APROBADO')::int AS aprobados,
                COUNT(*) FILTER (WHERE p.estado = 'RECHAZADO')::int AS rechazados,
                AVG(EXTRACT(EPOCH FROM (p."decididoAt" - p."enviadoAt")) / 60) FILTER (WHERE p."decididoAt" IS NOT NULL) AS minutos
           FROM presupuestos p JOIN ordenes_trabajo ot ON ot.id = p."otId"
          WHERE p."enviadoAt" >= $1 AND p."enviadoAt" <= $2 AND ($3::uuid IS NULL OR ot."sucursalId" = $3)`,
        rango,
      ),
      this.db.query<{ unidades: string | null }[]>(
        `SELECT -SUM(cantidad) AS unidades FROM movimientos_stock
          WHERE tipo IN ('SALIDA_OT','REVERSA_OT') AND "createdAt" >= $1 AND "createdAt" <= $2
            AND ($3::uuid IS NULL OR "sucursalId" = $3)`,
        rango,
      ),
      this.db.query<{ total: number }[]>(
        `SELECT COUNT(*)::int AS total FROM stock_sucursal
          WHERE "stockMinimo" > 0 AND cantidad <= "stockMinimo" AND ($1::uuid IS NULL OR "sucursalId" = $1)`,
        [sucursalId],
      ),
      this.db.query<{ clave: string; total: number }[]>(`SELECT estado AS clave, COUNT(*)::int AS total FROM sync_jobs GROUP BY estado`),
      this.db.query<{ clave: string; total: number }[]>(
        `SELECT estado AS clave, COUNT(*)::int AS total FROM notificaciones WHERE "createdAt" >= $1 AND "createdAt" <= $2 GROUP BY estado`,
        rango.slice(0, 2),
      ),
    ]);

    const r = aConteos(reservas);
    const asistidas = (r['ASISTIO'] ?? 0) + (r['NO_SHOW'] ?? 0);
    const p = presupuestos[0];
    const cerradas = otCerradas[0];

    return {
      periodo: { desde: desde.toISO(), hasta: hasta.toISO(), sucursalId },
      reservas: {
        porEstado: r,
        total: Object.values(r).reduce((a, b) => a + b, 0),
        /** Meta del proyecto: bajar de 12% a menos de 4%. */
        tasaNoShow: porcentaje(r['NO_SHOW'] ?? 0, asistidas),
      },
      ordenesTrabajo: {
        abiertasPorEstado: aConteos(otAbiertas),
        abiertas: otAbiertas.reduce((a, b) => a + b.total, 0),
        entregadas: cerradas.total,
        horasPromedioEnTaller: cerradas.horas ? Math.round(Number(cerradas.horas) * 10) / 10 : null,
        montoFacturado: Number(cerradas.monto ?? 0),
      },
      presupuestos: {
        enviados: p.enviados,
        aprobados: p.aprobados,
        rechazados: p.rechazados,
        tasaAprobacion: porcentaje(p.aprobados, p.aprobados + p.rechazados),
        minutosPromedioRespuesta: p.minutos ? Math.round(Number(p.minutos)) : null,
      },
      repuestos: {
        unidadesConsumidas: Number(consumo[0]?.unidades ?? 0),
        itemsBajoMinimo: bajoMinimo[0].total,
      },
      integraciones: aConteos(sync),
      notificaciones: aConteos(notificaciones),
      kpiSugo: construirKpiSugo(await this.datosKpiSugo(desde, hasta, sucursalId)),
    };
  }

  /** Consulta los hechos del período que necesitan los 25 KPI del Charter (ver kpi-sugo.ts). */
  private async datosKpiSugo(desde: DateTime, hasta: DateTime, sucursalId: string | null): Promise<DatosKpiSugo> {
    const rango = [desde.toJSDate(), hasta.toJSDate(), sucursalId];
    const dias = [desde.toISODate(), hasta.toISODate(), sucursalId];

    const [reservas, conflictos, unificacion, pilotos, presupuestos, repuestos, eventos, sync, notificaciones, busqueda] =
      await Promise.all([
        this.db.query<{ perdidas: string; reservadas: string }[]>(
          `SELECT COALESCE(SUM(EXTRACT(EPOCH FROM (fin - inicio)) / 3600) FILTER (WHERE estado = 'NO_SHOW'), 0) AS perdidas,
                  COALESCE(SUM(EXTRACT(EPOCH FROM (fin - inicio)) / 3600) FILTER (WHERE estado IN ('ASISTIO','NO_SHOW')), 0) AS reservadas
             FROM reservas WHERE inicio >= $1 AND inicio <= $2 AND ($3::uuid IS NULL OR "sucursalId" = $3)`,
          rango,
        ),
        // Reserva en conflicto: el mismo vehículo en dos horarios que se solapan, o más reservas simultáneas que boxes.
        this.db.query<{ activas: number; conflictos: number }[]>(
          `SELECT COUNT(*)::int AS activas,
                  COUNT(*) FILTER (WHERE
                    EXISTS (SELECT 1 FROM reservas b WHERE b.id <> a.id AND b.estado IN ('CONFIRMADA','ASISTIO')
                              AND b."vehiculoId" = a."vehiculoId" AND b.inicio < a.fin AND b.fin > a.inicio)
                    OR (SELECT COUNT(*) FROM reservas b WHERE b.estado IN ('CONFIRMADA','ASISTIO')
                          AND b."sucursalId" = a."sucursalId" AND b.inicio < a.fin AND b.fin > a.inicio) > s.boxes
                  )::int AS conflictos
             FROM reservas a JOIN sucursales s ON s.id = a."sucursalId"
            WHERE a.estado IN ('CONFIRMADA','ASISTIO') AND a.inicio >= $1 AND a.inicio <= $2
              AND ($3::uuid IS NULL OR a."sucursalId" = $3)`,
          rango,
        ),
        this.db.query<{ clientes: number; cdup: number; vehiculos: number; vdup: number }[]>(
          `SELECT (SELECT COUNT(*)::int FROM clientes) AS clientes,
                  (SELECT (COUNT(*) - COUNT(DISTINCT rut))::int FROM clientes) AS cdup,
                  (SELECT COUNT(*)::int FROM vehiculos) AS vehiculos,
                  (SELECT (COUNT(*) - COUNT(DISTINCT patente))::int FROM vehiculos) AS vdup`,
        ),
        this.db.query<{ id: string; nombre: string; ot: number; fuera: number }[]>(
          `SELECT s.id, s.nombre,
                  (SELECT COUNT(*)::int FROM ordenes_trabajo ot
                    WHERE ot."sucursalId" = s.id AND ot."fechaIngreso" >= $1 AND ot."fechaIngreso" <= $2) AS ot,
                  (SELECT COALESCE(SUM(e.cantidad), 0)::int FROM eventos_kpi e
                    WHERE e."sucursalId" = s.id AND e.tipo = 'ATENCION_FUERA_SUGO' AND e.fecha >= $4::date AND e.fecha <= $5::date) AS fuera
             FROM sucursales s WHERE s.piloto AND s.tipo = 'TALLER' AND ($3::uuid IS NULL OR s.id = $3)
            ORDER BY s.nombre`,
          [...rango, dias[0], dias[1]],
        ),
        this.db.query<{ decididos: number; trazables: number; pendientes: number }[]>(
          `SELECT COUNT(*) FILTER (WHERE p.estado IN ('APROBADO','RECHAZADO'))::int AS decididos,
                  COUNT(*) FILTER (WHERE p.estado IN ('APROBADO','RECHAZADO') AND p."decididoAt" IS NOT NULL
                                     AND p."decisionCanal" IS NOT NULL AND p."decisionNombre" IS NOT NULL
                                     AND p."decisionHash" IS NOT NULL)::int AS trazables,
                  COUNT(*) FILTER (WHERE p.estado = 'ENVIADO')::int AS pendientes
             FROM presupuestos p JOIN ordenes_trabajo ot ON ot.id = p."otId"
            WHERE p."enviadoAt" >= $1 AND p."enviadoAt" <= $2 AND ($3::uuid IS NULL OR ot."sucursalId" = $3)`,
          rango,
        ),
        this.db.query<{ con: number; trazadas: number }[]>(
          `SELECT COUNT(*) FILTER (WHERE EXISTS (SELECT 1 FROM ot_repuestos r WHERE r."otId" = ot.id))::int AS con,
                  COUNT(*) FILTER (WHERE EXISTS (SELECT 1 FROM ot_repuestos r WHERE r."otId" = ot.id)
                                     AND ot."repuestosValidadosAt" IS NOT NULL)::int AS trazadas
             FROM ordenes_trabajo ot
            WHERE ot.estado = 'ENTREGADA' AND ot."fechaEntrega" >= $1 AND ot."fechaEntrega" <= $2
              AND ($3::uuid IS NULL OR ot."sucursalId" = $3)`,
          rango,
        ),
        this.db.query<{ reclamos: number; compras: string; urgentes: string; llamadas: number; dias: number; horas: string }[]>(
          `SELECT COUNT(*) FILTER (WHERE tipo = 'RECLAMO')::int AS reclamos,
                  COALESCE(SUM(monto) FILTER (WHERE tipo = 'COMPRA_REPUESTO'), 0) AS compras,
                  COALESCE(SUM(monto) FILTER (WHERE tipo = 'COMPRA_REPUESTO' AND urgente), 0) AS urgentes,
                  COALESCE(SUM(cantidad) FILTER (WHERE tipo = 'LLAMADA_ESTADO'), 0)::int AS llamadas,
                  COUNT(DISTINCT ("sucursalId", fecha)) FILTER (WHERE tipo = 'LLAMADA_ESTADO')::int AS dias,
                  COALESCE(SUM(horas) FILTER (WHERE tipo = 'CIERRE_TALLER'), 0) AS horas
             FROM eventos_kpi WHERE fecha >= $1::date AND fecha <= $2::date AND ($3::uuid IS NULL OR "sucursalId" = $3)`,
          dias,
        ),
        // Cada reintento fallido incrementa "intentos"; un envío a la primera queda en 0.
        this.db.query<{ sistema: string; total: number; errores: number }[]>(
          `SELECT sistema, COUNT(*)::int AS total,
                  COUNT(*) FILTER (WHERE estado IN ('ERROR','FALLIDO') OR intentos > 0)::int AS errores
             FROM sync_jobs
            WHERE "createdAt" >= $1 AND "createdAt" <= $2
              AND ($3::uuid IS NULL OR payload->>'sucursalCodigo' = (SELECT codigo FROM sucursales WHERE id = $3))
            GROUP BY sistema`,
          rango,
        ),
        // Un cambio de estado cuenta como notificado si hay un aviso enviado para ese estado alrededor del cambio.
        this.db.query<{ cambios: number; notificados: number }[]>(
          `SELECT COUNT(*)::int AS cambios,
                  COUNT(*) FILTER (WHERE EXISTS (
                    SELECT 1 FROM notificaciones n
                     WHERE n."otId" = h."otId" AND n."estadoOt" = h."estadoNuevo" AND n.estado = 'ENVIADA'
                       AND n."createdAt" >= h."createdAt" - interval '1 minute'
                       AND n."createdAt" <= h."createdAt" + interval '10 minutes'))::int AS notificados
             FROM ot_historial h
             JOIN ordenes_trabajo ot ON ot.id = h."otId"
             JOIN clientes c ON c.id = ot."clienteId"
            WHERE h."createdAt" >= $1 AND h."createdAt" <= $2 AND ($3::uuid IS NULL OR ot."sucursalId" = $3)
              AND c."aceptaNotificaciones" AND (c.telefono IS NOT NULL OR c.email IS NOT NULL)`,
          rango,
        ),
        this.medirBusquedaGarantia(),
      ]);

    const sistema = (nombre: string) => sync.find((s) => s.sistema === nombre) ?? { total: 0, errores: 0 };
    return {
      reservas: {
        horasPerdidas: Number(reservas[0].perdidas),
        horasReservadas: Number(reservas[0].reservadas),
        activas: conflictos[0].activas,
        conflictos: conflictos[0].conflictos,
      },
      unificacion: {
        clientes: unificacion[0].clientes,
        clientesDuplicados: unificacion[0].cdup,
        vehiculos: unificacion[0].vehiculos,
        vehiculosDuplicados: unificacion[0].vdup,
      },
      pilotos: pilotos.map((p) => ({ id: p.id, nombre: p.nombre, ot: p.ot, fueraDeSugo: p.fuera })),
      presupuestos: presupuestos[0],
      repuestos: { otConRepuestos: repuestos[0].con, otTrazadas: repuestos[0].trazadas },
      eventos: {
        reclamos: eventos[0].reclamos,
        compras: Number(eventos[0].compras),
        comprasUrgentes: Number(eventos[0].urgentes),
        llamadas: eventos[0].llamadas,
        diasConLlamadas: eventos[0].dias,
        horasCierre: Number(eventos[0].horas),
      },
      sync: { erp: sistema('ERP'), inventario: sistema('INVENTARIO') },
      notificaciones: notificaciones[0] ?? { cambios: 0, notificados: 0 },
      busquedaGarantiaMs: busqueda,
    };
  }

  /** KPI 11: cronometra la misma consulta de historial por patente que usa la pantalla de garantías. */
  private async medirBusquedaGarantia(): Promise<number | null> {
    const [vehiculo] = await this.db.query<{ patente: string }[]>(
      `SELECT v.patente FROM vehiculos v ORDER BY (SELECT COUNT(*) FROM ordenes_trabajo o WHERE o."vehiculoId" = v.id) DESC LIMIT 1`,
    );
    if (!vehiculo) return null;
    const inicio = process.hrtime.bigint();
    await this.garantias.historial(vehiculo.patente);
    return Number(process.hrtime.bigint() - inicio) / 1e6;
  }
}

