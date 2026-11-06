const fs = require("fs");
const X = require("./read-context.cjs");
const root = process.cwd();
const date = (v) => {
  if (typeof v === "number") {
    const d = X.SSF.parse_date_code(v);
    return `${d.y}-${String(d.m).padStart(2, "0")}-${String(d.d).padStart(2, "0")}`;
  }
  return String(v || "");
};
const charter = X.readFile("Contexto/project_charter_uso_Ramirez_Baeza.xlsm");
const planning = X.readFile(
  "Contexto/Planificacion_EDT_WBS_Gantt_Ramirez_Baeza.xlsx",
);
const rows = (w, s) =>
  X.utils.sheet_to_json(w.Sheets[s], { header: 1 }).filter((r) => r.length);
const data = {
  nombre: "Sistema Unificado de Gestión Operativa (SUGO)",
  presupuesto: 190000000,
  inicio: "2026-10-01",
  fin: "2027-05-30",
  nota: "El Charter compromete el 30-may-2027. La EDT extiende el cierre administrativo al 31-may-2027. Avances registrados en los archivos, sin inferir ejecución por fecha.",
  sucursales: ["Santiago", "Rancagua", "Viña del Mar"],
  fuentes: [
    "project_charter_uso_Ramirez_Baeza.xlsm",
    "Planificacion_EDT_WBS_Gantt_Ramirez_Baeza.xlsx",
    "EDT_Diccionario_Ramirez_Baeza.xlsx",
  ],
  actividades: rows(planning, "Cronograma")
    .filter((r) => /^ACT-/.test(r[0]))
    .map((r) => ({
      id: r[0],
      nombre: r[1],
      dependencias: r[2],
      duracion: r[4],
      responsable: r[5],
      inicio: date(r[6]),
      fin: date(r[7]),
      hito: r[8] === "Sí",
      avance: Number(r[9]) || 0,
      nota: r[10] || "",
    })),
  hitos: rows(charter, "Cronograma")
    .filter((r) => r[3] === "Hito")
    .map((r) => ({
      id: r[0],
      nombre: r[2],
      responsable: r[4],
      fecha: date(r[6]),
      estado: r[9],
    })),
  recursos: rows(charter, "Recursos y costos")
    .filter((r) => /^REC-/.test(r[0]))
    .map((r) => ({
      id: r[0],
      categoria: r[1],
      nombre: r[2],
      descripcion: r[3],
      cantidad: r[4],
      unidad: r[5],
      costo: r[7],
      disponibilidad: r[8],
      actividades: r[9],
      responsable: r[10],
    })),
  riesgos: rows(charter, "Riesgos")
    .filter((r) => /^R-/.test(r[0]))
    .map((r) => ({
      id: r[0],
      nombre: r[1],
      probabilidad: r[4],
      impacto: r[5],
      exposicion: r[6],
      respuesta: r[7],
      responsable: r[8],
      estado: r[9],
    })),
  criterios: rows(charter, "Aprobación")
    .filter((r) => /^CE-/.test(r[0]))
    .map((r) => ({
      id: r[0],
      nombre: r[1],
      evidencia: r[2],
      meta: r[3],
      estado: r[4],
    })),
};
fs.mkdirSync("Backend/src/proyecto", { recursive: true });
fs.writeFileSync(
  "Backend/src/proyecto/contexto.ts",
  "// Generado desde los documentos versionados de Contexto; valores de línea base.\nexport const CONTEXTO = " +
    JSON.stringify(data, null, 2) +
    ";\n",
);
console.log({
  actividades: data.actividades.length,
  hitos: data.hitos.length,
  recursos: data.recursos.length,
  riesgos: data.riesgos.length,
});
