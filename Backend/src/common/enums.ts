export enum Rol {
  ADMIN = 'ADMIN',
  USUARIO_PROYECTO = 'USUARIO_PROYECTO',
  GERENCIA = 'GERENCIA',
  JEFE_TALLER = 'JEFE_TALLER',
  RECEPCION = 'RECEPCION',
  MECANICO = 'MECANICO',
  BODEGA = 'BODEGA',
}

/** Roles que ven la información de todas las sucursales. */
export const ROLES_RED_COMPLETA: readonly Rol[] = [Rol.ADMIN, Rol.GERENCIA];

export enum TipoSucursal {
  TALLER = 'TALLER',
  BODEGA_CENTRAL = 'BODEGA_CENTRAL',
}

export enum CanalReserva {
  WHATSAPP = 'WHATSAPP',
  WEB = 'WEB',
  PRESENCIAL = 'PRESENCIAL',
  TELEFONO = 'TELEFONO',
}

export enum EstadoReserva {
  CONFIRMADA = 'CONFIRMADA',
  ASISTIO = 'ASISTIO',
  NO_SHOW = 'NO_SHOW',
  CANCELADA = 'CANCELADA',
}

export enum EstadoOt {
  RECEPCIONADA = 'RECEPCIONADA',
  EN_DIAGNOSTICO = 'EN_DIAGNOSTICO',
  PRESUPUESTO_PENDIENTE = 'PRESUPUESTO_PENDIENTE',
  EN_REPARACION = 'EN_REPARACION',
  LISTA_ENTREGA = 'LISTA_ENTREGA',
  ENTREGADA = 'ENTREGADA',
  CANCELADA = 'CANCELADA',
}

export enum TipoPresupuesto {
  INICIAL = 'INICIAL',
  ADICIONAL = 'ADICIONAL',
}

export enum EstadoPresupuesto {
  BORRADOR = 'BORRADOR',
  ENVIADO = 'ENVIADO',
  APROBADO = 'APROBADO',
  RECHAZADO = 'RECHAZADO',
}

export enum TipoItem {
  MANO_OBRA = 'MANO_OBRA',
  REPUESTO = 'REPUESTO',
}

export enum CanalAprobacion {
  PORTAL = 'PORTAL',
  MOSTRADOR = 'MOSTRADOR',
  TELEFONO = 'TELEFONO',
}

export enum TipoMovimientoStock {
  SALIDA_OT = 'SALIDA_OT',
  REVERSA_OT = 'REVERSA_OT',
  AJUSTE = 'AJUSTE',
  SYNC_INVENTARIO = 'SYNC_INVENTARIO',
}

export enum CanalNotificacion {
  WHATSAPP = 'WHATSAPP',
  SMS = 'SMS',
  EMAIL = 'EMAIL',
}

export enum EstadoNotificacion {
  ENVIADA = 'ENVIADA',
  ERROR = 'ERROR',
}

export enum SistemaExterno {
  ERP = 'ERP',
  INVENTARIO = 'INVENTARIO',
}

export enum TipoSync {
  OT_CERRADA = 'OT_CERRADA',
  CONSUMO_REPUESTO = 'CONSUMO_REPUESTO',
  REVERSA_CONSUMO = 'REVERSA_CONSUMO',
}

export enum EstadoSync {
  PENDIENTE = 'PENDIENTE',
  ENVIADO = 'ENVIADO',
  ERROR = 'ERROR',
  FALLIDO = 'FALLIDO',
}

/** Hechos operativos que el sistema no genera solo y que alimentan los KPI del Charter (6, 7, 9, 12, 15, 22-24). */
export enum TipoEventoKpi {
  /** KPI 7: reclamo por diferencia entre presupuesto y cobro final. */
  RECLAMO = 'RECLAMO',
  /** KPI 12: llamadas del día preguntando por el estado de un vehículo (cantidad). */
  LLAMADA_ESTADO = 'LLAMADA_ESTADO',
  /** KPI 9: compra de repuestos, normal o urgente (monto). */
  COMPRA_REPUESTO = 'COMPRA_REPUESTO',
  /** KPI 15: horas de taller cerradas por migración o capacitación. */
  CIERRE_TALLER = 'CIERRE_TALLER',
  /** KPI 6 y 22-24: atenciones registradas en papel o Excel en vez de SUGO (cantidad). */
  ATENCION_FUERA_SUGO = 'ATENCION_FUERA_SUGO',
}
