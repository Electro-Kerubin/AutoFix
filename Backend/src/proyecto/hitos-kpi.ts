// Generado desde Hitos_Proyecto_SUGO_AutoFix_5.xlsx y KPI_Proyecto_SUGO_AutoFix_v4.xlsx (carpeta Contexto).
export const HITOS_SUGO = [
  {
    "id": "H1",
    "logro": "Documento de arquitectura e integración (ENT-01) aprobado formalmente por el equipo de TI, cerrando el diseño y habilitando el inicio del desarrollo del core operativo.",
    "actividades": "ACT-01, ACT-02, ACT-03, ACT-04 (Hito)",
    "semana": "Semana 5 – 31-10-2026\n(cierre Fase 1: Inicio y arquitectura)",
    "fecha": "2026-10-31",
    "evidencia": "Documento de arquitectura e integración (ENT-01) firmado + acta de aprobación del equipo de TI, archivados en el repositorio del proyecto.",
    "indicador": "Binario (Sí/No): documento aprobado formalmente.\nComplementario: % de requisitos de integración (REQ-07, REQ-08) y supuesto SUP-01 cubiertos en el diseño.",
    "criterio": "Aprobación formal escrita del Jefe de TI interno y firma del Hito de Arquitectura, sin observaciones críticas pendientes.",
    "valida": "Jefe de TI interno y Director del proyecto (responsables del hito), al cierre de la Fase 1 (31-10-2026).",
    "accion": "Reunión extraordinaria de revisión de arquitectura; no se autoriza el inicio de la Fase 2 hasta subsanar observaciones. Se activa la respuesta al riesgo R-02 si la causa es demora de documentación del proveedor ERP."
  },
  {
    "id": "H2",
    "logro": "Módulo 1 – Agendamiento centralizado multisucursal: consolida la disponibilidad de horas de WhatsApp, Web, presencial y teléfono en una sola agenda, sin reservas duplicadas.",
    "actividades": "ACT-05 (Desarrollo módulo 1: Agendamiento centralizado multisucursal)",
    "semana": "Semana 8 – 25-11-2026\n(fin de ACT-05, dentro de Fase 2)",
    "fecha": "2026-11-25",
    "evidencia": "Build del módulo de agendamiento en ambiente de pruebas + resultados de pruebas de disponibilidad en tiempo real de las 3 sucursales piloto (parte de ENT-02).",
    "indicador": "Binario (Sí/No): módulo despliega disponibilidad real de las 3 sucursales piloto y bloquea reservas duplicadas (REQ-01).",
    "criterio": "0 reservas duplicadas detectadas en el set de pruebas; disponibilidad mostrada coincide con la agenda real de cada sucursal.",
    "valida": "Líder de desarrollo (responsable) y Gerente de operaciones (valida), al cierre de ACT-05 (25-11-2026).",
    "accion": "Se activa una revisión de la lógica de bloqueo de reservas; no se inicia ACT-06 hasta corregir duplicidades. Riesgo asociado: R-01 (resistencia/adopción del nuevo sistema)."
  },
  {
    "id": "H3",
    "logro": "Módulo 2 – Recepción y Orden de Trabajo (OT) digital: genera una OT digital estandarizada vinculada a una ficha única de cliente y vehículo por RUT/Patente.",
    "actividades": "ACT-06 (Desarrollo módulo 2: Recepción y OT digital)",
    "semana": "Semana 12 – 20-12-2026\n(fin de ACT-06, dentro de Fase 2)",
    "fecha": "2026-12-20",
    "evidencia": "Build del módulo de OT en ambiente de pruebas + registro de unificación de clientes duplicados por RUT/Patente (parte de ENT-02).",
    "indicador": "% de clientes de prueba unificados correctamente por RUT/Patente; Binario (Sí/No): generación de OT digital obligatoria al ingresar el vehículo (REQ-02).",
    "criterio": "100% de las OT de prueba generadas en formato digital; 0 fichas de cliente duplicadas en el set de prueba.",
    "valida": "Líder de desarrollo (responsable) y Jefes de taller (validan el flujo de recepción), al cierre de ACT-06 (20-12-2026).",
    "accion": "Se activa la respuesta al riesgo R-07 (inconsistencia en la unificación de la base histórica de clientes): revisar el algoritmo de normalización antes de iniciar ACT-07."
  },
  {
    "id": "H4",
    "logro": "Módulo 3 – Presupuestos y registro de evidencia: permite registrar y modificar presupuestos por OT y capturar la aceptación digital del cliente con respaldo fotográfico.",
    "actividades": "ACT-07 (Desarrollo módulo 3: Presupuestos y registro de evidencia)",
    "semana": "Semana 16 – 15-01-2027\n(fin de ACT-07, dentro de Fase 2)",
    "fecha": "2027-01-15",
    "evidencia": "Build del módulo de presupuestos en ambiente de pruebas + registros de aceptación simulada vía link móvil con fecha/hora (parte de ENT-03).",
    "indicador": "Binario (Sí/No): aceptación del cliente queda registrada con fecha y hora mediante firma/click seguro (REQ-03).",
    "criterio": "100% de los presupuestos de prueba con evidencia fotográfica y registro de aceptación trazable.",
    "valida": "Líder de desarrollo (responsable) y Gerente de operaciones / comercial (validan), al cierre de ACT-07 (15-01-2027).",
    "accion": "Se activa la respuesta al riesgo R-12 (baja calidad de datos en presupuestos modificados): reforzar el catálogo de fallas estandarizado antes de iniciar ACT-08."
  },
  {
    "id": "H5",
    "logro": "Módulo 4 – Trazabilidad de repuestos y garantías: descuenta lógicamente los repuestos usados por OT contra el inventario y habilita la consulta de garantías por vehículo.",
    "actividades": "ACT-08 (Desarrollo módulo 4: Trazabilidad de repuestos y garantías), ACT-09 (Hito 2 del Charter)",
    "semana": "Semana 19 – 10-02-2027\n(fin de ACT-08 / cierre Fase 2: Desarrollo core operativo)",
    "fecha": "2027-02-10",
    "evidencia": "Resultados de pruebas de integración interna de los 4 módulos + registro de trazabilidad de repuestos en ambiente de pruebas (ENT-03, ENT-04).",
    "indicador": "Trazabilidad de repuestos registrada en el 100% de las OT de prueba; búsqueda de garantías por patente en ambiente de pruebas.",
    "criterio": "100% de los 4 módulos del core funcionando sin errores críticos en ambiente de pruebas, listos para integrarse con el portal cliente y el ERP.",
    "valida": "Arquitecto de software (responsable del Hito 2 del Charter) y equipo QA, al cierre de la Fase 2 (10-02-2027).",
    "accion": "Se activa la respuesta a R-08 (consumo de repuestos no registrado) y R-14 (sincronización de stock); se usa parte de la reserva de contingencia ($9,7M) y se reprograma el inicio de la Fase 3 sin comprometer el Hito de salida a producción."
  },
  {
    "id": "H6",
    "logro": "Portal/app web móvil responsivo para clientes (ENT-05) operativo en ambiente de pruebas: el cliente consulta el estado de su vehículo, recibe notificaciones automáticas de cada cambio de estado y puede aceptar presupuestos desde el teléfono.",
    "actividades": "ACT-10 (Desarrollo Portal/App móvil responsivo para clientes)",
    "semana": "Semana 23 – 05-03-2027\n(fin de ACT-10, dentro de Fase 3)",
    "fecha": "2027-03-05",
    "evidencia": "Build del portal en ambiente de pruebas + registro de pruebas de navegación desde teléfonos móviles y de recepción de notificaciones de estado (ENT-05).",
    "indicador": "Binario (Sí/No): el cliente de prueba consulta el estado de su OT y recibe la notificación en cada cambio de estado (REQ-05).\nComplementario: % de cambios de estado de prueba que generan notificación; envío del enlace de aprobación por WhatsApp Business (SUP-09).",
    "criterio": "Navegación fluida desde teléfonos móviles y notificación recibida en el 100% de los cambios de estado de prueba, sin errores críticos.",
    "valida": "Diseñador UX / Dev Frontend (responsable) y Director comercial (valida), al cierre de ACT-10 (05-03-2027).",
    "accion": "Se activa la respuesta al riesgo R-05 (baja adopción del portal): si falla la plantilla de WhatsApp Business (SUP-09) se habilita SMS o correo como canal alternativo. No se inicia ACT-11 hasta corregir las fallas críticas de notificación o de aprobación."
  },
  {
    "id": "H7",
    "logro": "Los conectores de integración (APIs) con el ERP financiero y el sistema de inventario quedan construidos y probados, permitiendo el intercambio de datos sin modificar las plataformas base.",
    "actividades": "ACT-11, ACT-12 (Hito 3 del Charter)",
    "semana": "Semana 26 – 25-03-2027\n(cierre Fase 3: Portal cliente e integración)",
    "fecha": "2027-03-25",
    "evidencia": "Resultados de pruebas funcionales de los conectores (ENT-06); registro de transferencias de OT cerradas al ERP y consultas de stock sincronizadas.",
    "indicador": "% de pruebas funcionales de integración aprobadas sin errores (REQ-07, REQ-08).",
    "criterio": "Transferencia exitosa del 100% de las OT de prueba al ERP sin alterar su base; sincronización de inventario correcta.",
    "valida": "Jefe de TI interno y Director del proyecto, al cierre de la Fase 3 (25-03-2027); se consulta al proveedor del ERP.",
    "accion": "Se activa la respuesta a R-02 (demora/sobrecosto de integración ERP): usar exclusivamente APIs estándar ya documentadas y escalar al Directorio si el retraso compromete el Hito de salida a producción."
  },
  {
    "id": "H8",
    "logro": "Pruebas de calidad, estrés e integración end-to-end aprobadas sobre el sistema completo y con la base histórica de clientes (280.000 registros) migrada y unificada por RUT/Patente, habilitando el despliegue en producción.",
    "actividades": "ACT-13 (Pruebas de calidad, estrés e integración E2E), ACT-21 (Migración y unificación de la base histórica de clientes)",
    "semana": "Semana 29 – 15-04-2027\n(fin de ACT-13, dentro de Fase 4)",
    "fecha": "2027-04-15",
    "evidencia": "Informe de pruebas de QA (funcionales, estrés e integración E2E) con defectos registrados y su estado + reporte de la migración (ACT-21): fichas unificadas, duplicados residuales y registros rechazados.",
    "indicador": "% de casos de prueba E2E críticos aprobados; N.º de defectos críticos abiertos.\nComplementario: % de fichas de cliente unificadas por RUT/Patente sobre la base migrada (KPI 5).",
    "criterio": "100% de los casos E2E críticos aprobados; 0 defectos críticos abiertos; flujo completo OT → ERP e inventario sin errores (CE-07).",
    "valida": "Equipo QA (responsable) y Jefe de TI interno / Director del proyecto (validan), al cierre de ACT-13 (15-04-2027).",
    "accion": "No se inicia ACT-14 hasta cerrar los defectos críticos. Se activa R-13 (plazo) con ciclos cortos de corrección; si la causa es la calidad de los datos migrados se activa R-07 y se vuelve a ejecutar la normalización por RUT/Patente. La reserva de contingencia ($9,7M) solo se usa con autorización del Director del proyecto (R-09)."
  },
  {
    "id": "H9",
    "logro": "Entorno de producción cloud piloto (ENT-08) desplegado en la infraestructura del proveedor cloud nacional contratado, con SUGO instalado y con las pruebas de rendimiento, estrés y seguridad superadas.",
    "actividades": "ACT-14 (Despliegue e instalación en infraestructura Cloud nacional)",
    "semana": "Semana 30 – 25-04-2027\n(fin de ACT-14, dentro de Fase 4)",
    "fecha": "2027-04-25",
    "evidencia": "Acta de despliegue en el cloud + informe de pruebas de rendimiento, estrés y seguridad en el entorno productivo (incluye auditoría de seguridad externa, R-10) + checklist de parámetros de seguridad corporativos (REQ-10).",
    "indicador": "Binario (Sí/No): SUGO opera en el entorno cloud existente (REQ-10).\nComplementario: % de pruebas de rendimiento, estrés y seguridad aprobadas; N.º de vulnerabilidades críticas abiertas.",
    "criterio": "Pruebas de rendimiento, estrés y seguridad superadas; 0 vulnerabilidades críticas abiertas; opera bajo el entorno cloud existente cumpliendo los parámetros de seguridad corporativos.",
    "valida": "Ingeniero DevOps / TI interno (responsable) y Jefe de TI interno (valida), al cierre de ACT-14 (25-04-2027).",
    "accion": "No se autoriza la salida a producción hasta cerrar los hallazgos críticos (R-10). Si hay problemas de capacidad se escala al proveedor cloud nacional (SUP-05) y al Jefe de TI interno (SUP-08)."
  },
  {
    "id": "H10",
    "logro": "Capacitación por turnos completada en Santiago, Rancagua y Viña del Mar, con el plan y los materiales (ENT-07) validados, sin cerrar ningún taller.",
    "actividades": "ACT-15, ACT-16",
    "semana": "Semana 33 – 14-05-2027\n(fin de ACT-16, 1 día antes de la salida a producción)",
    "fecha": "2027-05-14",
    "evidencia": "Plan y materiales de capacitación (ENT-07) validados + registros de asistencia por turno y sucursal + registro de horas de taller cerradas, llevado por los Jefes de taller.",
    "indicador": "% de personal capacitado por sucursal = (personal capacitado ÷ personal programado) × 100.\nComplementario: horas de taller cerradas por capacitación (REQ-09).",
    "criterio": "≥ 90% del personal programado de recepción y taller capacitado en cada sucursal (umbral propuesto, a confirmar con el Gerente de operaciones); sesiones breves de 15 a 30 minutos (RES-06); 0 horas de taller cerradas.",
    "valida": "Encargado de capacitación (responsable); Director del proyecto y Jefes de taller (validan), al cierre de ACT-16 (14-05-2027).",
    "accion": "Se activa R-01 (resistencia al cambio): se refuerza la capacitación in situ en turnos breves y se usa el día de margen. Si falta personal (SUP-10) se reprograman turnos; si una sucursal no alcanza el umbral, el Director del proyecto y el Gerente de operaciones deciden si entra a la salida a producción o se difiere, sin detener las otras."
  },
  {
    "id": "H11",
    "logro": "Salida a producción piloto – Sucursal Santiago: el sistema SUGO queda operando en Santiago, registrando atenciones reales sin papel ni Excel.",
    "actividades": "ACT-17 (Hito 4 del Charter)",
    "semana": "Semana 33 – 15-05-2027\n(puesta en marcha simultánea de las 3 sucursales piloto)",
    "fecha": "2027-05-15",
    "evidencia": "Registro de OT reales generadas el primer día de operación en Santiago; checklist de salida a producción firmado por el Jefe de taller de Santiago.",
    "indicador": "Binario (Sí/No): Santiago opera con SUGO. Horas de taller cerradas por causa de la migración en esta sucursal (REQ-09).",
    "criterio": "Sucursal Santiago operando al 100% con SUGO; cero horas de cierre por causa del despliegue o la capacitación.",
    "valida": "Jefe de taller de Santiago (valida en terreno) y Director del proyecto (responsable), el día de la salida a producción (15-05-2027).",
    "accion": "Se activa la respuesta a R-06 (caída de conectividad) si la causa es de infraestructura local; si es de adopción, se activa R-01 y se refuerza la capacitación in situ sin detener las otras 2 sucursales."
  },
  {
    "id": "H12",
    "logro": "Salida a producción piloto – Sucursal Rancagua: el sistema SUGO queda operando en Rancagua, registrando atenciones reales sin papel ni Excel.",
    "actividades": "ACT-17 (Hito 4 del Charter)",
    "semana": "Semana 33 – 15-05-2027\n(puesta en marcha simultánea de las 3 sucursales piloto)",
    "fecha": "2027-05-15",
    "evidencia": "Registro de OT reales generadas el primer día de operación en Rancagua; checklist de salida a producción firmado por el Jefe de taller de Rancagua.",
    "indicador": "Binario (Sí/No): Rancagua opera con SUGO. Horas de taller cerradas por causa de la migración en esta sucursal (REQ-09).",
    "criterio": "Sucursal Rancagua operando al 100% con SUGO; cero horas de cierre por causa del despliegue o la capacitación.",
    "valida": "Jefe de taller de Rancagua (valida en terreno) y Director del proyecto (responsable), el día de la salida a producción (15-05-2027).",
    "accion": "Se activa la respuesta a R-06 (caída de conectividad) si la causa es de infraestructura local; si es de adopción, se activa R-01 y se refuerza la capacitación in situ sin detener las otras 2 sucursales."
  },
  {
    "id": "H13",
    "logro": "Salida a producción piloto – Sucursal Viña del Mar: el sistema SUGO queda operando en Viña del Mar, registrando atenciones reales sin papel ni Excel.",
    "actividades": "ACT-17 (Hito 4 del Charter)",
    "semana": "Semana 33 – 15-05-2027\n(puesta en marcha simultánea de las 3 sucursales piloto)",
    "fecha": "2027-05-15",
    "evidencia": "Registro de OT reales generadas el primer día de operación en Viña del Mar; checklist de salida a producción firmado por el Jefe de taller de Viña del Mar.",
    "indicador": "Binario (Sí/No): Viña del Mar opera con SUGO. Horas de taller cerradas por causa de la migración en esta sucursal (REQ-09).",
    "criterio": "Sucursal Viña del Mar operando al 100% con SUGO; cero horas de cierre por causa del despliegue o la capacitación.",
    "valida": "Jefe de taller de Viña del Mar (valida en terreno) y Director del proyecto (responsable), el día de la salida a producción (15-05-2027).",
    "accion": "Se activa la respuesta a R-06 (caída de conectividad) si la causa es de infraestructura local; si es de adopción, se activa R-01 y se refuerza la capacitación in situ sin detener las otras 2 sucursales."
  },
  {
    "id": "H14",
    "logro": "El Directorio y la Gerencia General reciben y aprueban el informe final de evaluación del piloto (ENT-10), con la medición de los KPIs de control y de beneficio comprometidos en el Charter, cerrando formalmente el proyecto.",
    "actividades": "ACT-18, ACT-19, ACT-20 (Hito)",
    "semana": "Semana 35 – 30-05-2027\n(cierre del proyecto)",
    "fecha": "2027-05-30",
    "evidencia": "Informe de evaluación del piloto (ENT-10) con la medición por sucursal de los KPIs de control (Grupo A) y de beneficio (Grupo B) frente a su línea base; acta de aprobación del Directorio y la Gerencia General.",
    "indicador": "Grupo A – KPIs de control (medición completa al cierre): KPI 1 presupuesto (≤100%), KPI 2 plazo (≤100%), KPI 4 reservas duplicadas (0%), KPI 5 unificación RUT/Patente (100%), KPI 6 OT digitales (100%), KPI 8 aceptación digital trazable (100%), KPI 10 trazabilidad de repuestos (100%), KPI 11 búsqueda de garantías (<5 s), KPI 13 y 14 errores de integración ERP/Inventario (0%), KPI 15 horas de taller cerradas (0 h), KPI 16 sucursales sin papel ni Excel (100%). KPI 17 a 24: KPIs principales de los hitos H1, H6, H8, H9, H10 y H11–H13 (cada uno con la meta definida en la hoja de KPI). KPI 25 resume el cumplimiento de este grupo (20 KPIs).\nGrupo B – KPIs de beneficio (lectura de la marcha blanca vs. línea base): KPI 3 no-shows (12% → <4%), KPI 9 compras urgentes (18% → ≤5%), KPI 12 llamadas de estado (40–70/día → reducción >70%, ≈16,5/día). KPI 7 (reclamos, línea base 317/año) se informa como conteo del período, sin exigencia de meta.",
    "criterio": "Informe aprobado formalmente por el Directorio y la Gerencia General con: (1) 100% de los KPIs del Grupo A cumpliendo su meta (KPI 25 = 100%); (2) los 3 KPIs de beneficio del Grupo B (3, 9 y 12) con la meta cumplida o, si la marcha blanca (13 días) no permite confirmarla, con tendencia favorable documentada frente a la línea base y un plan de seguimiento a 90 días a cargo de la Gerencia de operaciones.",
    "valida": "Directorio AutoFix y Gerencia General (aprueban); Director del proyecto (responsable del informe), en la presentación de cierre (30-05-2027).",
    "accion": "Si falla algún KPI del Grupo A, el proyecto no se cierra como exitoso y se corrige antes de la siguiente revisión. Si el Grupo A cumple pero el Grupo B no confirma la meta, el Directorio decide entre un plan de ajustes acotado antes de autorizar la expansión a 30 sucursales (Fase 2) o extender la marcha blanca y el seguimiento."
  }
] as const;

export const KPI_SUGO = [
  {
    "n": 1,
    "ambito": "Proyecto",
    "nombre": "Cumplimiento del presupuesto aprobado del proyecto.",
    "formula": "(Costo real acumulado ÷ Presupuesto aprobado) × 100",
    "variables": "Presupuesto aprobado: $190.000.000 CLP (Identificación!C10, Criterio de éxito 1 en Identificación!C16); Costo real acumulado: Recursos y costos (a registrar durante la ejecución).",
    "unidad": "%",
    "meta": "x ≤ 100 %",
    "interpretacion": "Aún no hay ejecución real (proyecto planificado 01-10-2026 a 30-05-2027). KPI de control mensual contra el EDT (columna Costo estimado); meta: no sobrepasar $190.000.000 CLP."
  },
  {
    "n": 2,
    "ambito": "Proyecto",
    "nombre": "Cumplimiento del plazo planificado del proyecto.",
    "formula": "(Duración real ÷ Duración planificada) × 100",
    "variables": "Duración planificada: 8 meses / 242 días, 01-10-2026 a 30-05-2027 (Identificación!C10, C14, C15); Duración real: se registra al cierre.",
    "unidad": "%",
    "meta": "x ≤ 100 %",
    "interpretacion": "Pendiente de medición; se evalúa formalmente en el Hito 14 (cierre del proyecto, 30-05-2027, archivo de Hitos)."
  },
  {
    "n": 3,
    "ambito": "Agendamiento",
    "nombre": "Reducción de absentismo (no-show) y reservas duplicadas.",
    "formula": "(Horas de atención perdidas por no-show o duplicidad ÷ Horas de atención reservadas) × 100",
    "variables": "Línea base: 12 % de horas perdidas (Identificación!C8); meta declarada en Beneficio esperado 1 (Identificación!C11).",
    "unidad": "%",
    "meta": "x < 4 %",
    "interpretacion": "Línea base 12 % → meta < 4 %: reducir al menos 8 puntos porcentuales (caída relativa ≥ 66,7 %). Se mide con el módulo de agendamiento desde H11–H13 (sucursales piloto en operación)."
  },
  {
    "n": 4,
    "ambito": "Agendamiento",
    "nombre": "Reservas duplicadas detectadas en el sistema.",
    "formula": "(N.º de reservas con conflicto de horario ÷ N.º total de reservas del período) × 100",
    "variables": "Criterio de aceptación REQ-01: «bloquea reservas duplicadas» (Alcance!E11).",
    "unidad": "%",
    "meta": "x = 0 %",
    "interpretacion": "Indicador de control técnico del módulo 1; se verifica en las pruebas de H2 (25-11-2026) y de forma continua en producción."
  },
  {
    "n": 5,
    "ambito": "Recepción / OT",
    "nombre": "Unificación de clientes por RUT/Patente.",
    "formula": "(N.º de fichas de cliente unificadas correctamente ÷ N.º de clientes con historial) × 100",
    "variables": "Base histórica de clientes: 280.000 (Identificación!C7); criterio REQ-02 (Alcance!E12); riesgo asociado R-07.",
    "unidad": "%",
    "meta": "x = 100 %",
    "interpretacion": "Se verifica en H3 (20-12-2026) sobre una muestra de prueba, antes de migrar los 280.000 registros históricos completos."
  },
  {
    "n": 6,
    "ambito": "Recepción / OT",
    "nombre": "Digitalización de Órdenes de Trabajo (OT).",
    "formula": "(N.º de OT generadas en formato digital ÷ N.º total de OT generadas) × 100",
    "variables": "Criterio general de éxito n.º 4: «Registro digital del 100% de las OT, repuestos y presupuestos aceptados» (Identificación!C16).",
    "unidad": "%",
    "meta": "x = 100 %",
    "interpretacion": "Se mide desde la salida a producción (H11–H13, 15-05-2027) en las 3 sucursales piloto; meta: cero OT en papel o Excel."
  },
  {
    "n": 7,
    "ambito": "Presupuestos",
    "nombre": "Reclamos por diferencias entre presupuesto y cobro final.",
    "formula": "N.º de reclamos registrados en el período",
    "variables": "Línea base: 317 reclamos anuales (Identificación!C8); Beneficio esperado 2: «Eliminación de los reclamos...» (Identificación!C11).",
    "unidad": "reclamos/año",
    "meta": "x = 0 (eliminación)",
    "interpretacion": "Línea base 317 reclamos/año. Con trazabilidad y aprobación digital (REQ-03) se espera tender a 0; se compara el primer año de operación piloto contra esta línea base."
  },
  {
    "n": 8,
    "ambito": "Presupuestos",
    "nombre": "Trazabilidad de la aceptación digital de presupuestos.",
    "formula": "(N.º de presupuestos con aceptación registrada con fecha/hora ÷ N.º total de presupuestos emitidos) × 100",
    "variables": "Criterio de aceptación REQ-03 (Alcance!E13).",
    "unidad": "%",
    "meta": "x = 100 %",
    "interpretacion": "Se verifica en H4 (15-01-2027, cierre del módulo 3) y de forma continua en producción."
  },
  {
    "n": 9,
    "ambito": "Repuestos",
    "nombre": "Compras urgentes de repuestos de alto costo.",
    "formula": "(Costo de compras urgentes de repuestos ÷ Costo total de compras de repuestos) × 100",
    "variables": "Línea base: 18 % (Identificación!C8); meta en Beneficio esperado 3 (Identificación!C11).",
    "unidad": "%",
    "meta": "x ≤ 5 %",
    "interpretacion": "Línea base 18 % → meta ≤ 5 %: reducir 13 puntos porcentuales (caída relativa ≥ 72 %). Se habilita con la trazabilidad del módulo 4 (H5) y sus alertas de reposición."
  },
  {
    "n": 10,
    "ambito": "Repuestos",
    "nombre": "Trazabilidad de repuestos por Orden de Trabajo.",
    "formula": "(N.º de OT con repuestos trazados contra inventario ÷ N.º total de OT con repuestos utilizados) × 100",
    "variables": "Criterio REQ-04 (Alcance!E14); Criterio general de éxito n.º 4 (Identificación!C16).",
    "unidad": "%",
    "meta": "x = 100 %",
    "interpretacion": "Se verifica en H5 (10-02-2027, cierre Fase 2: desarrollo core operativo) y de forma continua en producción."
  },
  {
    "n": 11,
    "ambito": "Garantías",
    "nombre": "Tiempo de búsqueda del historial de garantías.",
    "formula": "Tiempo de respuesta de la consulta por patente/RUT",
    "variables": "Criterio de aceptación REQ-06 (Alcance!E16).",
    "unidad": "segundos",
    "meta": "x < 5 s",
    "interpretacion": "No existe línea base cuantificada en el Charter (hoy el proceso es manual y puede tardar considerablemente entre sucursales); se mide por primera vez en las pruebas del módulo 4 (H5)."
  },
  {
    "n": 12,
    "ambito": "Atención al cliente",
    "nombre": "Llamadas telefónicas de consulta de estado del vehículo.",
    "formula": "Promedio de llamadas recibidas por sucursal al día",
    "variables": "Línea base: 40 a 70 llamadas diarias por sucursal, promedio 55 (Identificación!C8); meta en Beneficio esperado 4 (Identificación!C11); REQ-05 (Alcance!E15).",
    "unidad": "llamadas/sucursal/día",
    "meta": "reducción > 70 % (x ≤ ≈16,5)",
    "interpretacion": "Línea base 40–70 (prom. 55) → meta ≤ ≈16,5 llamadas/día. Se mide tras habilitar el portal/app cliente (ENT-05, hito H6), comparando contra el promedio histórico de cada sucursal piloto."
  },
  {
    "n": 13,
    "ambito": "Integración",
    "nombre": "Errores en la transferencia de OT cerradas al ERP.",
    "formula": "(N.º de OT cerradas transferidas con error al ERP ÷ N.º total de OT cerradas transferidas) × 100",
    "variables": "Criterio REQ-07 (Alcance!E17); Criterio general de éxito n.º 3 (Identificación!C16); riesgo asociado R-02.",
    "unidad": "%",
    "meta": "x = 0 %",
    "interpretacion": "Se verifica en H7 (25-03-2027, cierre de la integración ERP/Inventario) y de forma continua en producción."
  },
  {
    "n": 14,
    "ambito": "Integración",
    "nombre": "Errores de sincronización con el sistema de inventario.",
    "formula": "(N.º de sincronizaciones de stock con error ÷ N.º total de sincronizaciones) × 100",
    "variables": "Criterio de aceptación REQ-08 (Alcance!E18).",
    "unidad": "%",
    "meta": "x = 0 %",
    "interpretacion": "Se verifica en H7 (25-03-2027) y de forma continua en producción."
  },
  {
    "n": 15,
    "ambito": "Piloto / Operación",
    "nombre": "Horas de taller cerradas por causa de la migración.",
    "formula": "Suma de horas de cierre registradas por sucursal piloto durante el despliegue",
    "variables": "Criterio REQ-09 (Alcance!E19); Criterio general de éxito n.º 2 (Identificación!C16).",
    "unidad": "horas",
    "meta": "x = 0 h",
    "interpretacion": "Se mide por sucursal en H11, H12 y H13 (15-05-2027: Santiago, Rancagua y Viña del Mar, respectivamente)."
  },
  {
    "n": 16,
    "ambito": "Adopción",
    "nombre": "Sucursales piloto operando con SUGO sin papel ni Excel.",
    "formula": "(N.º de sucursales piloto operando 100 % con SUGO ÷ 3 sucursales piloto) × 100",
    "variables": "Criterio general de éxito n.º 5 (Identificación!C16); ENT-09, «Sistema SUGO en operación piloto» (Alcance!B32).",
    "unidad": "%",
    "meta": "x = 100 %",
    "interpretacion": "Se mide con H11, H12 y H13; meta: 3 de 3 sucursales (100 %) operando con SUGO el día de la salida a producción."
  },
  {
    "n": 17,
    "ambito": "Arquitectura",
    "nombre": "Requisitos del Charter cubiertos en el documento de arquitectura e integración aprobado.",
    "formula": "(N.º de requisitos del Charter cubiertos en ENT-01 ÷ N.º de requisitos incluidos en el Charter) × 100",
    "variables": "Requisitos incluidos: REQ-01 a REQ-10 (Alcance!A11:A20); criterio de aceptación de ENT-01 (Alcance!D24); supuesto SUP-01 (documentación de APIs del ERP).",
    "unidad": "%",
    "meta": "x = 100 %",
    "interpretacion": "Sin línea base: se mide por primera vez al cierre de la Fase 1. Se verifica en H1 (31-10-2026) con una matriz de trazabilidad requisito → diseño, con énfasis en REQ-07 y REQ-08 (integración con ERP e inventario). Un valor menor a 100 % impide autorizar el inicio de la Fase 2."
  },
  {
    "n": 18,
    "ambito": "Portal cliente",
    "nombre": "Cambios de estado de la OT notificados automáticamente al cliente.",
    "formula": "(N.º de cambios de estado notificados al cliente ÷ N.º de cambios de estado generados en la OT) × 100",
    "variables": "Criterio de aceptación de ENT-05 (Alcance!D28); REQ-05 (Alcance!B15, E15); riesgo R-05; supuesto SUP-09 (plantilla de WhatsApp Business).",
    "unidad": "%",
    "meta": "x = 100 %",
    "interpretacion": "Hoy el cliente debe llamar al taller para conocer el estado (40 a 70 llamadas diarias por sucursal; Identificación!C8), por lo que no hay línea base. Se mide en H6 (05-03-2027) con datos de prueba y de forma continua en producción desde H11–H13. Es la condición previa para lograr la reducción de llamadas del KPI 12."
  },
  {
    "n": 19,
    "ambito": "Pruebas (QA)",
    "nombre": "Casos de prueba end-to-end críticos aprobados.",
    "formula": "(N.º de casos E2E críticos aprobados ÷ N.º de casos E2E críticos ejecutados) × 100",
    "variables": "Casos críticos: flujo completo agendamiento → OT → presupuesto → repuestos → cierre → ERP e inventario (ACT-13 del Cronograma); criterio de éxito CE-07 (Aprobación!D20). Condición complementaria: 0 defectos críticos abiertos.",
    "unidad": "%",
    "meta": "x = 100 % y 0 defectos críticos abiertos",
    "interpretacion": "El Charter no define un umbral de calidad para las pruebas; el 100 % de casos críticos y los 0 defectos críticos abiertos son una propuesta del equipo. Se mide en H8 (15-04-2027) sobre la base histórica ya migrada (ACT-21). Si no se cumple, no se inicia el despliegue en cloud (ACT-14)."
  },
  {
    "n": 20,
    "ambito": "Despliegue cloud",
    "nombre": "Pruebas de rendimiento, estrés y seguridad aprobadas en el entorno cloud productivo.",
    "formula": "(N.º de pruebas de rendimiento, estrés y seguridad aprobadas ÷ N.º de pruebas ejecutadas) × 100",
    "variables": "Criterio de aceptación de ENT-08 (Alcance!D31); REQ-10 (Alcance!E20); riesgo R-10 (auditoría de seguridad externa); supuesto SUP-05 (capacidad del cloud).",
    "unidad": "%",
    "meta": "x = 100 % y 0 vulnerabilidades críticas abiertas",
    "interpretacion": "Sin línea base; se mide por primera vez al desplegar. Se verifica en H9 (25-04-2027) en el entorno del proveedor cloud nacional ya contratado. El Charter exige que las pruebas se superen, pero no fija cuántas vulnerabilidades se toleran: el valor de 0 críticas es una propuesta del equipo."
  },
  {
    "n": 21,
    "ambito": "Capacitación",
    "nombre": "Personal programado que completó la capacitación por turnos en cada sucursal piloto.",
    "formula": "(N.º de personas capacitadas ÷ N.º de personas programadas en la sucursal) × 100",
    "variables": "Criterio de aceptación de ENT-07 (Alcance!D30); REQ-09 (Alcance!E19); restricción RES-06 (sesiones de 15 a 30 minutos); supuesto SUP-10; riesgo R-01.",
    "unidad": "%",
    "meta": "x ≥ 90 % por sucursal",
    "interpretacion": "El Charter no fija un porcentaje mínimo de capacitados; el 90 % es un umbral propuesto, a confirmar con el Gerente de operaciones. Se mide por sucursal en H10 (14-05-2027), un día antes de la salida a producción, junto con las horas de taller cerradas por capacitación (KPI 15), que deben ser 0."
  },
  {
    "n": 22,
    "ambito": "Piloto – Santiago",
    "nombre": "Atenciones de la sucursal Santiago registradas en SUGO sin papel ni Excel.",
    "formula": "(N.º de OT generadas en SUGO en la sucursal ÷ N.º total de OT generadas en la sucursal) × 100",
    "variables": "Criterio de aceptación de ENT-09 (Alcance!D32): operación diaria activa registrando atenciones reales sin papel ni Excel; criterio general de éxito n.º 4 (Identificación!C16); riesgos R-01 y R-06.",
    "unidad": "%",
    "meta": "x = 100 %",
    "interpretacion": "Mismo KPI y misma fórmula en las tres sucursales piloto. Se mide en H11 (15-05-2027, Santiago) y durante la marcha blanca del 16 al 28-05-2027. La meta es igual para todas, pero la rapidez con que cada sucursal llega al 100 % depende de su capacidad de adaptación; por eso se registra el valor diario y los días que tarda en alcanzar la meta. Se complementa con los KPI 6, 15 y 16, que consolidan las tres sucursales."
  },
  {
    "n": 23,
    "ambito": "Piloto – Rancagua",
    "nombre": "Atenciones de la sucursal Rancagua registradas en SUGO sin papel ni Excel.",
    "formula": "(N.º de OT generadas en SUGO en la sucursal ÷ N.º total de OT generadas en la sucursal) × 100",
    "variables": "Criterio de aceptación de ENT-09 (Alcance!D32): operación diaria activa registrando atenciones reales sin papel ni Excel; criterio general de éxito n.º 4 (Identificación!C16); riesgos R-01 y R-06.",
    "unidad": "%",
    "meta": "x = 100 %",
    "interpretacion": "Mismo KPI y misma fórmula en las tres sucursales piloto. Se mide en H12 (15-05-2027, Rancagua) y durante la marcha blanca del 16 al 28-05-2027. La meta es igual para todas, pero la rapidez con que cada sucursal llega al 100 % depende de su capacidad de adaptación; por eso se registra el valor diario y los días que tarda en alcanzar la meta. Se complementa con los KPI 6, 15 y 16, que consolidan las tres sucursales."
  },
  {
    "n": 24,
    "ambito": "Piloto – Viña del Mar",
    "nombre": "Atenciones de la sucursal Viña del Mar registradas en SUGO sin papel ni Excel.",
    "formula": "(N.º de OT generadas en SUGO en la sucursal ÷ N.º total de OT generadas en la sucursal) × 100",
    "variables": "Criterio de aceptación de ENT-09 (Alcance!D32): operación diaria activa registrando atenciones reales sin papel ni Excel; criterio general de éxito n.º 4 (Identificación!C16); riesgos R-01 y R-06.",
    "unidad": "%",
    "meta": "x = 100 %",
    "interpretacion": "Mismo KPI y misma fórmula en las tres sucursales piloto. Se mide en H13 (15-05-2027, Viña del Mar) y durante la marcha blanca del 16 al 28-05-2027. La meta es igual para todas, pero la rapidez con que cada sucursal llega al 100 % depende de su capacidad de adaptación; por eso se registra el valor diario y los días que tarda en alcanzar la meta. Se complementa con los KPI 6, 15 y 16, que consolidan las tres sucursales."
  },
  {
    "n": 25,
    "ambito": "Cierre del proyecto",
    "nombre": "Cumplimiento de los KPIs de control del proyecto al cierre.",
    "formula": "(N.º de KPIs de control con la meta cumplida ÷ N.º total de KPIs de control) × 100",
    "variables": "KPIs de control (Grupo A del Hito 14): KPI 1, 2, 4, 5, 6, 8, 10, 11, 13 a 16 y 17 a 24 (20 KPIs); criterios de éxito CE-01 a CE-08 (Aprobación!A14:D21).",
    "unidad": "%",
    "meta": "x = 100 %",
    "interpretacion": "Resume los 20 KPIs de control; no incluye los KPIs de beneficio (3, 9 y 12), cuya meta se confirma con la lectura de la marcha blanca y el seguimiento a 90 días definido en H14. Se mide en H14 (30-05-2027) con el informe final del piloto (ENT-10). Si no llega a 100 %, el proyecto no se cierra como exitoso."
  }
] as const;
