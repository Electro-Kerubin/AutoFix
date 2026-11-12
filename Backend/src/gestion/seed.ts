import { CONTEXTO } from '../proyecto/contexto';
import { HITOS_SUGO, KPI_SUGO } from '../proyecto/hitos-kpi';
import { ProjectData, Indicator } from './model';

// Actividades de la planificación vigente que cierran cada hito del archivo de Hitos.
// El archivo de Hitos numera 21 actividades; la planificación versionada tiene 20, por eso se asocian por entregable.
const ACTIVIDADES_HITO: Record<string, string[]> = {
 H1:['ACT-03'],H2:['ACT-04'],H3:['ACT-05'],H4:['ACT-06'],H5:['ACT-07','ACT-08'],H6:['ACT-09'],H7:['ACT-10','ACT-11'],
 H8:['ACT-12'],H9:['ACT-13'],H10:['ACT-16'],H11:['ACT-17'],H12:['ACT-17'],H13:['ACT-17'],H14:['ACT-18','ACT-19','ACT-20'],
};
const RESPONSABLE_HITO: Record<string, string> = {
 H1:'Jefe de TI interno / Director del proyecto',H2:'Líder de desarrollo',H3:'Líder de desarrollo',H4:'Líder de desarrollo',
 H5:'Arquitecto de software',H6:'Diseñador UX / Dev Frontend',H7:'Jefe de TI interno / Director del proyecto',H8:'Equipo QA',
 H9:'Ingeniero DevOps / TI interno',H10:'Encargado de capacitación',H11:'Director del proyecto',H12:'Director del proyecto',
 H13:'Director del proyecto',H14:'Director del proyecto',
};
function hitosSugo(){return HITOS_SUGO.map(h=>({id:h.id,name:h.id+' · '+(h.logro.includes(':')&&h.logro.indexOf(':')<=120?h.logro.slice(0,h.logro.indexOf(':')):h.logro.slice(0,110)),owner:RESPONSABLE_HITO[h.id],date:h.fecha,actualDate:null,status:'PENDIENTE' as const,criteria:h.criterio+'\nValida: '+h.valida+'\nEvidencia requerida: '+h.evidencia,evidence:'',activities:ACTIVIDADES_HITO[h.id]}));}

// Fórmula ejecutable de cada KPI del Charter. Las variables sin dato (null) dejan el semáforo en SIN_DATOS hasta registrarlas.
// Los KPI 3-16 y 18 y 22-24 también se miden automáticamente en la operación (Indicadores de operación).
const FORMULAS_KPI: Record<number,{formula:string;target:number;warning:number;direction:'HIGH'|'LOW';manual:Record<string,number|null>}> = {
 1:{formula:'costoReal / 190000000 * 100',target:100,warning:100,direction:'LOW',manual:{}},
 2:{formula:'duracionReal / duracionPlanificada * 100',target:100,warning:100,direction:'LOW',manual:{duracionReal:null,duracionPlanificada:242}},
 3:{formula:'horasPerdidas / horasReservadas * 100',target:4,warning:12,direction:'LOW',manual:{horasPerdidas:null,horasReservadas:null}},
 4:{formula:'reservasConflicto / reservasTotales * 100',target:0,warning:1,direction:'LOW',manual:{reservasConflicto:null,reservasTotales:null}},
 5:{formula:'fichasUnificadas / clientesConHistorial * 100',target:100,warning:95,direction:'HIGH',manual:{fichasUnificadas:null,clientesConHistorial:null}},
 6:{formula:'otDigitales / otTotales * 100',target:100,warning:95,direction:'HIGH',manual:{otDigitales:null,otTotales:null}},
 7:{formula:'reclamos',target:0,warning:317,direction:'LOW',manual:{reclamos:null}},
 8:{formula:'aceptacionesConFechaHora / presupuestosEmitidos * 100',target:100,warning:95,direction:'HIGH',manual:{aceptacionesConFechaHora:null,presupuestosEmitidos:null}},
 9:{formula:'comprasUrgentes / comprasTotales * 100',target:5,warning:18,direction:'LOW',manual:{comprasUrgentes:null,comprasTotales:null}},
 10:{formula:'otConRepuestosTrazados / otConRepuestos * 100',target:100,warning:95,direction:'HIGH',manual:{otConRepuestosTrazados:null,otConRepuestos:null}},
 11:{formula:'segundosBusqueda',target:5,warning:10,direction:'LOW',manual:{segundosBusqueda:null}},
 12:{formula:'llamadasPorSucursalDia',target:16.5,warning:55,direction:'LOW',manual:{llamadasPorSucursalDia:null}},
 13:{formula:'otConErrorErp / otTransferidas * 100',target:0,warning:1,direction:'LOW',manual:{otConErrorErp:null,otTransferidas:null}},
 14:{formula:'syncConError / syncTotales * 100',target:0,warning:1,direction:'LOW',manual:{syncConError:null,syncTotales:null}},
 15:{formula:'horasCerradas',target:0,warning:8,direction:'LOW',manual:{horasCerradas:null}},
 16:{formula:'sucursalesOperando / 3 * 100',target:100,warning:66,direction:'HIGH',manual:{sucursalesOperando:null}},
 17:{formula:'requisitosCubiertos / 10 * 100',target:100,warning:90,direction:'HIGH',manual:{requisitosCubiertos:null}},
 18:{formula:'cambiosNotificados / cambiosGenerados * 100',target:100,warning:95,direction:'HIGH',manual:{cambiosNotificados:null,cambiosGenerados:null}},
 19:{formula:'casosAprobados / casosEjecutados * 100',target:100,warning:95,direction:'HIGH',manual:{casosAprobados:null,casosEjecutados:null}},
 20:{formula:'pruebasAprobadas / pruebasEjecutadas * 100',target:100,warning:95,direction:'HIGH',manual:{pruebasAprobadas:null,pruebasEjecutadas:null}},
 21:{formula:'personasCapacitadas / personasProgramadas * 100',target:90,warning:80,direction:'HIGH',manual:{personasCapacitadas:null,personasProgramadas:null}},
 22:{formula:'otEnSugo / otTotales * 100',target:100,warning:95,direction:'HIGH',manual:{otEnSugo:null,otTotales:null}},
 23:{formula:'otEnSugo / otTotales * 100',target:100,warning:95,direction:'HIGH',manual:{otEnSugo:null,otTotales:null}},
 24:{formula:'otEnSugo / otTotales * 100',target:100,warning:95,direction:'HIGH',manual:{otEnSugo:null,otTotales:null}},
 25:{formula:'kpiControlCumplidos / 20 * 100',target:100,warning:90,direction:'HIGH',manual:{kpiControlCumplidos:null}},
};
function kpiSugo():Indicator[]{return KPI_SUGO.map(k=>{const f=FORMULAS_KPI[k.n];return {id:'KPI-S'+String(k.n).padStart(2,'0'),name:'KPI '+k.n+' · '+k.nombre,objective:k.interpretacion.slice(0,1500),scope:'PROJECT' as const,scopeId:'',formula:f.formula,unit:k.unidad,target:f.target,warning:f.warning,direction:f.direction,maximum:null,period:'Por hito',source:k.variables.slice(0,300),owner:'Director del proyecto',manual:f.manual,history:[]} as Indicator;});}
export function initialProject():ProjectData{
 const c=CONTEXTO;
 const indicators:Indicator[]=[
  ['KPI-01','Avance del proyecto','Trabajo ejecutado ponderado por duración','PROJECT','trabajoCompletado / trabajoTotal * 100','%',100,'HIGH',80],
  ['KPI-02','Cumplimiento de hitos','Hitos cumplidos dentro de su fecha comprometida','PROJECT','hitosEnPlazo / hitosEvaluados * 100','%',100,'HIGH',80],
  ['KPI-03','Desviación de costos','Comparar costo real con costo distribuido a la fecha','PROJECT','(costoReal - costoPlanificadoFecha) / costoPlanificadoFecha * 100','%',0,'LOW',10],
  ['KPI-04','Actividades atrasadas','Detectar trabajo pendiente fuera de plazo','PROJECT','actividadesAtrasadas / actividadesEvaluadas * 100','%',0,'LOW',15],
  ['KPI-05','Utilización de profesionales','Carga asignada respecto de capacidad configurada','PROJECT','horasAsignadas / horasDisponibles * 100','%',85,'RANGE',0],
  ['KPI-06','Cumplimiento de actividades','Actividades terminadas dentro del plan vigente','PROJECT','actividadesEnPlazo / actividadesTerminadas * 100','%',100,'HIGH',80],
  ['KPI-C1','Cierre de solicitudes','Medir el avance del proceso de cambio','CHANGE','cambiosCerrados / cambiosTotales * 100','%',90,'HIGH',70],
  ['KPI-C2','Cambios implementados en plazo','Evaluar cumplimiento de compromisos del cambio','CHANGE','cambiosEnPlazo / cambiosCerrados * 100','%',90,'HIGH',75],
  ['KPI-C3','Efectividad de los cambios','Verificar que los cambios cerrados lograron su objetivo','CHANGE','cambiosEfectivos / cambiosEvaluados * 100','%',90,'HIGH',70],
 ].map(([id,name,objective,scope,formula,unit,target,direction,warning])=>({id,name,objective,scope,formula,unit,target,direction,warning,maximum:id==='KPI-05'?100:null,scopeId:'',period:'Semanal',source:'Registros del gestor de proyectos',owner:'Director del proyecto',manual:{},history:[]} as Indicator)).concat(kpiSugo());
 const activities=c.actividades.map(a=>({id:a.id,name:a.nombre,description:a.nota,owner:a.responsable,phase:Number(a.id.slice(-2))<=3?'Inicio y arquitectura':Number(a.id.slice(-2))<=8?'Desarrollo core':Number(a.id.slice(-2))<=11?'Portal e integraciones':Number(a.id.slice(-2))<=15?'Pruebas y despliegue':'Piloto y cierre',start:a.inicio,end:a.fin,duration:a.duracion,progress:a.avance,actualStart:null,actualEnd:null,dependencies:(a.dependencias.match(/ACT-\d+/g)||[]).map(activityId=>({activityId,type:'FS' as const,lag:0}))}));
 return {code:'AUTOFIX-SUGO',name:'Implementación SUGO · AutoFix',description:'Planificar y controlar el proyecto de software SUGO para AutoFix: alcance, ejecución, recursos, presupuesto y cambios organizacionales.',scope:'Piloto de implementación en Santiago, Rancagua y Viña del Mar. ERP e inventario existentes se integran sin reemplazarlos; sin despliegues en las otras 14 sucursales. Sin intervenciones operativas en diciembre y enero.',owner:'Director del proyecto',start:c.inicio,end:c.fin,budget:c.presupuesto,state:'PLANIFICADO',calendar:{workdays:[0,1,2,3,4,5,6],holidays:[]},activities,resources:c.recursos.map(r=>({id:r.id,name:r.nombre,type:r.categoria==='Humano'?'PROFESSIONAL':r.categoria.includes('licencia')?'LICENSE':r.categoria==='Material'?'MATERIAL':r.categoria==='Equipo'?'EQUIPMENT':'OTHER',specialty:r.descripcion,basis:'UNIT',quantity:r.cantidad,unit:r.unidad,unitCost:r.cantidad?r.costo/r.cantidad:0,hoursWeek:null,weeks:1,capacityWeek:null,actualCost:null,sourceAssignment:r.actividades})),assignments:[],milestones:hitosSugo(),indicators,changes:[],risks:c.riesgos.map(r=>({id:r.id,name:r.nombre,probability:r.probabilidad,impact:r.impacto,response:r.respuesta,owner:r.responsable,state:r.estado})),stakeholders:[],criteria:c.criterios,sources:['project_charter_uso_Ramirez_Baeza.xlsm','Planificacion_EDT_WBS_Gantt_Ramirez_Baeza.xlsx','Guia_Proyecto_Integrador_2.pdf'],baseline:{budget:c.presupuesto,activities:activities.map(a=>({id:a.id,start:a.start,end:a.end,duration:a.duration}))},audits:[]};
}