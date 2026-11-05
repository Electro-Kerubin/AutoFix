import { Injectable } from '@nestjs/common';
import { InjectDataSource } from '@nestjs/typeorm';
import { DateTime } from 'luxon';
import { DataSource } from 'typeorm';
import { UsuarioAutenticado, sucursalDeAlcance } from '../common/auth';
import { ZONA_HORARIA } from '../notificaciones/plantillas';

type Conteos = Record<string, number>;

const aConteos = (filas: { clave: string; total: number }[]): Conteos =>
  Object.fromEntries(filas.map((f) => [f.clave, f.total]));

const porcentaje = (parte: number, total: number): number | null =>
  total > 0 ? Math.round((parte / total) * 1000) / 10 : null;

@Injectable()
export class ReportesService {
  constructor(@InjectDataSource() private readonly db: DataSource) {}

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
    };
  }
}
