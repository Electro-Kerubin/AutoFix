import { useEffect, useMemo, useState } from "react"
import { useNavigate } from "react-router"
import * as XLSX from "xlsx"

type IconName = "grid" | "folder" | "tree" | "calendar" | "users" | "flag" | "chart" | "changes" | "settings" | "search" | "bell" | "chevron" | "more" | "arrow" | "check" | "clock" | "warning" | "close" | "minus" | "plus" | "upload" | "download" | "file"

const paths: Record<IconName, React.ReactNode> = {
  grid: (
    <>
      <rect x="3" y="3" width="7" height="7" rx="2" />
      <rect x="14" y="3" width="7" height="7" rx="2" />
      <rect x="3" y="14" width="7" height="7" rx="2" />
      <rect x="14" y="14" width="7" height="7" rx="2" />
    </>
  ),
  folder: (
    <path d="M3 7.5A2.5 2.5 0 0 1 5.5 5H10l2 2h6.5A2.5 2.5 0 0 1 21 9.5v7A2.5 2.5 0 0 1 18.5 19h-13A2.5 2.5 0 0 1 3 16.5z" />
  ),
  tree: (
    <>
      <path d="M12 4v5M7 20v-5h10v5M12 9H6v3M12 9h6v3" />
      <rect x="4" y="12" width="4" height="3" rx="1" />
      <rect x="16" y="12" width="4" height="3" rx="1" />
      <rect x="10" y="2" width="4" height="3" rx="1" />
    </>
  ),
  calendar: (
    <>
      <rect x="3" y="5" width="18" height="16" rx="3" />
      <path d="M8 3v4M16 3v4M3 10h18" />
    </>
  ),
  users: (
    <>
      <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
      <circle cx="9" cy="7" r="4" />
      <path d="M22 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75" />
    </>
  ),
  flag: (
    <>
      <path d="M5 22V4" />
      <path d="M5 4h11l-2 4 2 4H5" />
    </>
  ),
  chart: (
    <>
      <path d="M4 20V10M10 20V4M16 20v-7M22 20H2" />
    </>
  ),
  changes: (
    <>
      <path d="M20 7h-9M20 7l-3-3M20 7l-3 3M4 17h9M4 17l3-3M4 17l3 3" />
    </>
  ),
  settings: (
    <>
      <circle cx="12" cy="12" r="3" />
      <path d="M19.4 15a1.7 1.7 0 0 0 .34 1.88l.06.06-2.83 2.83-.06-.06a1.7 1.7 0 0 0-1.88-.34 1.7 1.7 0 0 0-1.03 1.56V21h-4v-.08A1.7 1.7 0 0 0 8.94 19.4a1.7 1.7 0 0 0-1.88.34l-.06.06-2.83-2.83.06-.06A1.7 1.7 0 0 0 4.6 15a1.7 1.7 0 0 0-1.52-1H3v-4h.08A1.7 1.7 0 0 0 4.6 8.94a1.7 1.7 0 0 0-.34-1.88L4.2 7l2.83-2.83.06.06A1.7 1.7 0 0 0 9 4.6 1.7 1.7 0 0 0 10 3.08V3h4v.08A1.7 1.7 0 0 0 15.06 4.6a1.7 1.7 0 0 0 1.88-.34L17 4.2 19.83 7l-.06.06A1.7 1.7 0 0 0 19.4 9c.14.61.69 1 1.52 1H21v4h-.08a1.7 1.7 0 0 0-1.52 1Z" />
    </>
  ),
  search: (
    <>
      <circle cx="11" cy="11" r="7" />
      <path d="m20 20-4-4" />
    </>
  ),
  bell: (
    <>
      <path d="M18 8a6 6 0 0 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9" />
      <path d="M10 21h4" />
    </>
  ),
  chevron: <path d="m9 18 6-6-6-6" />,
  more: (
    <>
      <circle cx="5" cy="12" r="1" />
      <circle cx="12" cy="12" r="1" />
      <circle cx="19" cy="12" r="1" />
    </>
  ),
  arrow: (
    <>
      <path d="M5 12h14M13 6l6 6-6 6" />
    </>
  ),
  check: <path d="m5 12 4 4L19 6" />,
  clock: (
    <>
      <circle cx="12" cy="12" r="9" />
      <path d="M12 7v5l3 2" />
    </>
  ),
  warning: (
    <>
      <path d="M10.3 3.5 2.6 17a2 2 0 0 0 1.74 3h15.32a2 2 0 0 0 1.74-3L13.7 3.5a2 2 0 0 0-3.4 0Z" />
      <path d="M12 9v4M12 17h.01" />
    </>
  ),
  close: <path d="m6 6 12 12M18 6 6 18" />,
  minus: <path d="M5 12h14" />,
  plus: <path d="M12 5v14M5 12h14" />,
  upload: (
    <>
      <path d="M12 16V4M7 9l5-5 5 5" />
      <path d="M5 14v5h14v-5" />
    </>
  ),
  download: (
    <>
      <path d="M12 4v12M7 11l5 5 5-5" />
      <path d="M5 20h14" />
    </>
  ),
  file: (
    <>
      <path d="M6 2h8l4 4v16H6z" />
      <path d="M14 2v5h5M9 12h6M9 16h6" />
    </>
  ),
}

function Icon({ name, size = 18 }: { name: IconName; size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      {paths[name]}
    </svg>
  )
}

const nav = [
  { label: "Resumen", path: "/", icon: "grid" as IconName },
  { label: "Proyectos", path: "/proyectos", icon: "folder" as IconName },
  { label: "Planificación", path: "/planificacion", icon: "tree" as IconName },
  { label: "Carta Gantt", path: "/gantt", icon: "calendar" as IconName },
  { label: "Recursos", path: "/recursos", icon: "users" as IconName },
  { label: "Hitos", path: "/hitos", icon: "flag" as IconName },
  { label: "Indicadores KPI", path: "/kpi", icon: "chart" as IconName },
  {
    label: "Gestión del cambio",
    path: "/cambios",
    icon: "changes" as IconName,
  },
]

export type WorkspaceView = "Resumen" | "Proyectos" | "Planificación" | "Carta Gantt" | "Recursos" | "Hitos" | "Indicadores KPI" | "Gestión del cambio"

const basePhases = [
  {
    id: "01",
    name: "Inicio y arquitectura",
    start: 0,
    duration: 5,
    progress: 100,
    color: "navy",
    owner: "AM",
  },
  {
    id: "02",
    name: "Desarrollo core operativo",
    start: 5,
    duration: 14,
    progress: 68,
    color: "blue",
    owner: "RV",
  },
  {
    id: "03",
    name: "Portal cliente e integración",
    start: 15,
    duration: 11,
    progress: 34,
    color: "sky",
    owner: "CS",
  },
  {
    id: "04",
    name: "Piloto y capacitación",
    start: 26,
    duration: 7,
    progress: 8,
    color: "amber",
    owner: "MB",
  },
  {
    id: "05",
    name: "Evaluación y cierre",
    start: 33,
    duration: 2,
    progress: 0,
    color: "muted",
    owner: "AM",
  },
]

type ScheduleItem = typeof basePhases[number] & {
  isMilestone?: boolean
  startDate?: Date
  endDate?: Date
}

const normalizeHeader = (value: string) =>
  value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]/g, "")

const parseExcelDate = (value: unknown) => {
  if (value instanceof Date && !Number.isNaN(value.getTime())) return value
  if (typeof value === "number") {
    const parsed = XLSX.SSF.parse_date_code(value)
    if (parsed) return new Date(parsed.y, parsed.m - 1, parsed.d)
  }
  if (typeof value === "string") {
    const clean = value.trim()
    const localMatch = clean.match(/^(\d{1,2})[/-](\d{1,2})[/-](\d{4})$/)
    const date = localMatch
      ? new Date(+localMatch[3], +localMatch[2] - 1, +localMatch[1])
      : new Date(clean)
    if (!Number.isNaN(date.getTime())) return date
  }
  return null
}

const milestones = [
  {
    code: "H1",
    title: "Arquitectura aprobada",
    date: "31 oct 2026",
    state: "Completado",
    color: "green",
  },
  {
    code: "H2",
    title: "Core operativo validado",
    date: "10 feb 2027",
    state: "En curso",
    color: "blue",
  },
  {
    code: "H3",
    title: "Integraciones aprobadas",
    date: "25 mar 2027",
    state: "Próximo",
    color: "gray",
  },
  {
    code: "H4",
    title: "Piloto en 3 sucursales",
    date: "15 may 2027",
    state: "Próximo",
    color: "gray",
  },
  {
    code: "H5",
    title: "Evaluación del piloto",
    date: "30 may 2027",
    state: "Próximo",
    color: "gray",
  },
]

const initialChanges = [
  {
    id: "SC-005",
    title: "Autenticación reforzada del portal",
    owner: "Carolina Silva",
    impact: "+ $2,4M · + 3 días",
    state: "Pendiente",
    risk: "Medio",
  },
  {
    id: "SC-004",
    title: "Catálogo de repuestos equivalentes",
    owner: "Rodrigo Vera",
    impact: "+ $1,8M · Sin plazo",
    state: "En análisis",
    risk: "Bajo",
  },
  {
    id: "SC-003",
    title: "Integración WhatsApp para avisos",
    owner: "Marcela Díaz",
    impact: "+ $4,1M · + 5 días",
    state: "Aprobada",
    risk: "Medio",
  },
]

export default function Workspace({ view }: { view: WorkspaceView }) {
  const navigate = useNavigate()
  const active = view
  const [phaseDurations, setPhaseDurations] = useState(
    basePhases.map((p) => p.duration),
  )
  const [editPhase, setEditPhase] = useState<number | null>(null)
  const [resourcesAdded, setResourcesAdded] = useState(false)
  const [changes, setChanges] = useState(initialChanges)
  const [changePanel, setChangePanel] = useState(false)
  const [importPanel, setImportPanel] = useState(false)
  const [importedSchedule, setImportedSchedule] =
    useState<ScheduleItem[] | null>(null)
  const [importFileName, setImportFileName] = useState("")
  const [importError, setImportError] = useState("")
  const [importSuccess, setImportSuccess] = useState<{
    activities: number
    milestones: number
    fileName: string
  } | null>(null)
  const [toast, setToast] = useState("")
  const [query, setQuery] = useState("")

  useEffect(() => {
    const saved = window.localStorage.getItem("autofix-gantt")
    if (!saved) return
    try {
      const data = JSON.parse(saved) as {
        fileName: string
        schedule: Array<Omit<ScheduleItem, "startDate" | "endDate"> & {
          startDate?: string
          endDate?: string
        }>
      }
      setImportedSchedule(
        data.schedule.map((item) => ({
          ...item,
          startDate: item.startDate ? new Date(item.startDate) : undefined,
          endDate: item.endDate ? new Date(item.endDate) : undefined,
        })),
      )
      setImportFileName(data.fileName)
    } catch {
      window.localStorage.removeItem("autofix-gantt")
    }
  }, [])

  useEffect(() => {
    if (importedSchedule) {
      window.localStorage.setItem(
        "autofix-gantt",
        JSON.stringify({
          fileName: importFileName,
          schedule: importedSchedule,
        }),
      )
    } else {
      window.localStorage.removeItem("autofix-gantt")
    }
  }, [importFileName, importedSchedule])

  const approvedCount = changes.filter((c) => c.state === "Aprobada").length
  const defaultDurationDelta = phaseDurations.reduce(
    (sum, d, i) => sum + d - basePhases[i].duration,
    0,
  )
  const cost = 127.4 + (resourcesAdded ? 3.2 : 0) + (approvedCount - 1) * 2.4

  const phases = useMemo<ScheduleItem[]>(
    () =>
      importedSchedule ??
      basePhases.map((phase, index) => ({
        ...phase,
        duration: phaseDurations[index],
      })),
    [importedSchedule, phaseDurations],
  )
  const timelineWeeks = Math.max(
    importedSchedule ? 1 : 35,
    ...phases.map((phase) => phase.start + phase.duration),
  )
  const durationDelta = importedSchedule
    ? Math.max(0, timelineWeeks - 35)
    : defaultDurationDelta
  const importedEndDate = importedSchedule
    ?.map((item) => item.endDate)
    .filter((date): date is Date => Boolean(date))
    .sort((a, b) => b.getTime() - a.getTime())[0]
  const endDate = importedEndDate
    ? importedEndDate.toLocaleDateString("es-CL", {
        day: "2-digit",
        month: "short",
        year: "numeric",
      })
    : durationDelta > 0
      ? new Date(2027, 4, 30 + durationDelta * 7).toLocaleDateString("es-CL", { day: "2-digit", month: "short", year: "numeric" })
      : "30 may 2027"

  const showToast = (message: string) => {
    setToast(message)
    window.setTimeout(() => setToast(""), 2800)
  }

  const updateDuration = (index: number, delta: number) => {
    if (importedSchedule) {
      setImportedSchedule((current) =>
        current
          ? current.map((item, i) =>
              i === index
                ? { ...item, duration: Math.max(1, item.duration + delta) }
                : item,
            )
          : current,
      )
      return
    }
    setPhaseDurations((current) =>
      current.map((value, i) =>
        i === index ? Math.max(1, value + delta) : value,
      ),
    )
  }

  const approveChange = (id: string) => {
    setChanges((current) =>
      current.map((change) =>
        change.id === id ? { ...change, state: "Aprobada" } : change,
      ),
    )
    setChangePanel(false)
    showToast("Solicitud aprobada. Costos y KPI actualizados.")
  }

  const navigateTo = (label: string) => {
    const target = nav.find((item) => item.label === label)
    if (target) navigate(target.path)
  }

  const downloadTemplate = () => {
    const rows = [
      {
        ID: "ACT-01",
        Actividad: "Diseñar arquitectura de integración",
        "Fecha inicio": "01-10-2026",
        "Fecha fin": "21-10-2026",
        Responsable: "Andrea Morales",
        "Avance %": 100,
        Tipo: "Actividad",
      },
      {
        ID: "ACT-02",
        Actividad: "Desarrollar agenda unificada",
        "Fecha inicio": "22-10-2026",
        "Fecha fin": "15-12-2026",
        Responsable: "Rodrigo Vera",
        "Avance %": 65,
        Tipo: "Actividad",
      },
      {
        ID: "H1",
        Actividad: "Arquitectura aprobada",
        "Fecha inicio": "21-10-2026",
        "Fecha fin": "21-10-2026",
        Responsable: "Andrea Morales",
        "Avance %": 100,
        Tipo: "Hito",
      },
    ]
    const workbook = XLSX.utils.book_new()
    const worksheet = XLSX.utils.json_to_sheet(rows)
    worksheet["!cols"] = [
      { wch: 12 },
      { wch: 38 },
      { wch: 16 },
      { wch: 16 },
      { wch: 24 },
      { wch: 12 },
      { wch: 14 },
    ]
    XLSX.utils.book_append_sheet(workbook, worksheet, "Planificacion")
    XLSX.writeFile(workbook, "Plantilla_Carta_Gantt_AutoFix.xlsx")
  }

  const exportSchedule = () => {
    const baseline = new Date(2026, 9, 1)
    const rows = phases.map((phase) => {
      const start =
        phase.startDate ??
        new Date(baseline.getTime() + phase.start * 7 * 86400000)
      const end =
        phase.endDate ??
        new Date(start.getTime() + (phase.duration * 7 - 1) * 86400000)
      return {
        ID: phase.id,
        Actividad: phase.name,
        "Fecha inicio": start.toLocaleDateString("es-CL"),
        "Fecha fin": end.toLocaleDateString("es-CL"),
        Responsable: phase.owner,
        "Avance %": phase.progress,
        Tipo: phase.isMilestone ? "Hito" : "Actividad",
      }
    })
    const workbook = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(
      workbook,
      XLSX.utils.json_to_sheet(rows),
      "Carta Gantt",
    )
    XLSX.writeFile(workbook, "Carta_Gantt_AutoFix.xlsx")
    showToast("Carta Gantt exportada correctamente.")
  }

  const importExcel = async (file: File) => {
    setImportError("")
    try {
      const workbook = XLSX.read(await file.arrayBuffer(), {
        type: "array",
        cellDates: true,
      })
      const worksheet = workbook.Sheets[workbook.SheetNames[0]]
      const rawRows = XLSX.utils.sheet_to_json<Record<string, unknown>>(
        worksheet,
        { defval: "" },
      )
      if (!rawRows.length) throw new Error("La primera hoja no contiene filas.")

      const rows = rawRows.map((raw) => {
        const normalized = Object.fromEntries(
          Object.entries(raw).map(([key, value]) => [
            normalizeHeader(key),
            value,
          ]),
        )
        return {
          id: String(
            normalized.id ??
              normalized.codigo ??
              `ACT-${rawRows.indexOf(raw) + 1}`,
          ),
          name: String(
            normalized.actividad ?? normalized.tarea ?? normalized.nombre ?? "",
          ).trim(),
          startDate: parseExcelDate(
            normalized.fechainicio ?? normalized.inicio,
          ),
          endDate: parseExcelDate(normalized.fechafin ?? normalized.fin),
          owner: String(
            normalized.responsable ?? normalized.recurso ?? "Sin asignar",
          ).trim(),
          progress: Number(
            normalized.avance ??
              normalized.avanceporcentaje ??
              normalized.porcentaje ??
              0,
          ),
          type: String(normalized.tipo ?? "Actividad").toLowerCase(),
        }
      })

      if (rows.some((row) => !row.name || !row.startDate || !row.endDate)) {
        throw new Error(
          'Faltan columnas requeridas: "Actividad", "Fecha inicio" o "Fecha fin".',
        )
      }

      if (rows.some((row) => row.startDate && row.endDate && row.endDate < row.startDate)) { throw new Error("La fecha de fin no puede ser anterior a la fecha de inicio.") }
      const validRows = rows as Array<typeof rows[number] & {
        startDate: Date
        endDate: Date
      }>
      const firstDate = new Date(
        Math.min(...validRows.map((row) => row.startDate.getTime())),
      )
      const colors = ["navy", "blue", "sky", "amber", "muted"] as const
      const schedule = validRows
        .sort((a, b) => a.startDate.getTime() - b.startDate.getTime())
        .map((row, index): ScheduleItem => {
          const start = Math.max(
            0,
            Math.floor(
              (row.startDate.getTime() - firstDate.getTime()) /
                (7 * 24 * 60 * 60 * 1000),
            ),
          )
          const duration = Math.max(
            1,
            Math.ceil(
              (row.endDate.getTime() - row.startDate.getTime() + 86400000) /
                (7 * 24 * 60 * 60 * 1000),
            ),
          )
          const initials =
            row.owner
              .split(/\s+/)
              .slice(0, 2)
              .map((part) => part[0])
              .join("")
              .toUpperCase() || "SA"
          return {
            id: row.id,
            name: row.name,
            start,
            duration,
            progress: Math.min(100, Math.max(0, row.progress || 0)),
            color: colors[index % colors.length],
            owner: initials,
            isMilestone: row.type.includes("hito"),
            startDate: row.startDate,
            endDate: row.endDate,
          }
        })

      setImportedSchedule(schedule)
      setImportFileName(file.name)
      setImportPanel(false)
      setImportSuccess({
        activities: schedule.length,
        milestones: schedule.filter((item) => item.isMilestone).length,
        fileName: file.name,
      })
    } catch (error) {
      setImportError(
        error instanceof Error
          ? error.message
          : "No fue posible leer el archivo.",
      )
    }
  }

  const moduleTitle = active === "Resumen" ? "Panel del proyecto" : active
  const viewClass = `view-${active
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/\s+/g, "-")}`
  const filteredChanges = changes.filter((c) =>
    `${c.id} ${c.title}`.toLowerCase().includes(query.toLowerCase()),
  )

  return (
    <div className="app-shell">
      <aside className="sidebar">
        <div className="brand">
          <div className="brand-mark">
            <span>A</span>
          </div>
          <div>
            <strong>AutoFix</strong>
            <small>Gestión de proyectos</small>
          </div>
        </div>
        <nav className="main-nav" aria-label="Navegación principal">
          <p className="nav-label">ESPACIO DE TRABAJO</p>
          {nav.map((item) => (
            <button
              key={item.label}
              className={active === item.label ? "active" : ""}
              onClick={() => navigateTo(item.label)}
            >
              <Icon name={item.icon} />
              <span>{item.label}</span>
              {item.label === "Gestión del cambio" && <b>5</b>}
            </button>
          ))}
        </nav>
        <div className="sidebar-bottom">
          <button>
            <Icon name="settings" />
            <span>Configuración</span>
          </button>
          <div className="profile">
            <div className="avatar">AM</div>
            <div>
              <strong>Andrea Morales</strong>
              <small>Directora de proyecto</small>
            </div>
            <Icon name="more" />
          </div>
        </div>
      </aside>

      <main>
        <header className="topbar">
          <div className="mobile-brand">AutoFix</div>
          <div className="breadcrumbs">
            <span>Proyectos</span>
            <Icon name="chevron" size={14} />
            <strong>SUGO AutoFix</strong>
          </div>
          <div className="top-actions">
            <label className="search">
              <Icon name="search" size={17} />
              <input
                aria-label="Buscar"
                placeholder="Buscar en el proyecto"
                value={query}
                onChange={(event) => setQuery(event.target.value)}
              />
              <kbd>⌘ K</kbd>
            </label>
            <button className="icon-button" aria-label="Notificaciones">
              <Icon name="bell" />
              <i />
            </button>
            <button className="help">?</button>
          </div>
        </header>

        <div className={`content ${viewClass}`} id="page-top">
          <section className="page-heading">
            <div>
              <div className="eyebrow">
                <span className="live-dot" /> PROYECTO ACTIVO · AUTOFIX
              </div>
              <h1>{moduleTitle}</h1>
              <p>Sistema Unificado de Gestión Operativa (SUGO)</p>
            </div>
            <div className="heading-actions">
              <button
                className="secondary"
                onClick={() => setChangePanel(true)}
              >
                <Icon name="changes" /> Nueva solicitud
              </button>
              <button className="primary" onClick={() => setImportPanel(true)}>
                <Icon name="upload" /> Importar Excel
              </button>
            </div>
          </section>

          <section className="project-strip">
            <div className="project-identity">
              <div className="project-icon">
                <span className="car-line">⌁</span>
              </div>
              <div>
                <strong>Modernización operación de talleres</strong>
                <small>AF-SUGO-2026 · Piloto 3 sucursales</small>
              </div>
            </div>
            <div className="strip-stat">
              <small>Estado</small>
              <span className="status-pill">
                <i /> En ejecución
              </span>
            </div>
            <div className="strip-stat">
              <small>Avance general</small>
              <strong>42%</strong>
              <div className="mini-progress">
                <span style={{ width: "42%" }} />
              </div>
            </div>
            <div className="strip-stat">
              <small>Fecha de término</small>
              <strong>{endDate}</strong>
              <em>
                {durationDelta > 0 ? `+${durationDelta} días` : "En plazo"}
              </em>
            </div>
            <div className="strip-stat">
              <small>Presupuesto</small>
              <strong>${cost.toFixed(1)}M</strong>
              <em>de $190M CLP</em>
            </div>
          </section>

          <section className="project-detail-grid">
            <article className="panel project-brief">
              <div className="panel-header">
                <div>
                  <h2>Ficha del proyecto</h2>
                  <p>Información general y alcance aprobado</p>
                </div>
                <span className="industrial-badge">PRIORIDAD ALTA</span>
              </div>
              <div className="brief-content">
                <div>
                  <small>OBJETIVO</small>
                  <p>
                    Unificar la operación de los talleres AutoFix mediante una
                    plataforma que centralice agenda, órdenes, presupuestos,
                    repuestos y garantías.
                  </p>
                </div>
                <div className="brief-metrics">
                  <span>
                    <strong>8 meses</strong>
                    <small>Duración objetivo</small>
                  </span>
                  <span>
                    <strong>$190M</strong>
                    <small>Presupuesto CLP</small>
                  </span>
                  <span>
                    <strong>17</strong>
                    <small>Talleres totales</small>
                  </span>
                </div>
              </div>
            </article>
            <article className="panel pilot-card">
              <div className="panel-header">
                <div>
                  <h2>Sucursales piloto</h2>
                  <p>Primera operación funcional</p>
                </div>
              </div>
              <div className="pilot-list">
                {["Santiago", "Rancagua", "Viña del Mar"].map(
                  (branch, index) => (
                    <div key={branch}>
                      <span>{String(index + 1).padStart(2, "0")}</span>
                      <strong>{branch}</strong>
                      <small>Preparación {84 - index * 9}%</small>
                    </div>
                  ),
                )}
              </div>
            </article>
          </section>

          <section className="panel planning-panel">
            <div className="panel-header">
              <div>
                <h2>Planificación de actividades</h2>
                <p>
                  Define fechas, responsables y avance antes de generar el Gantt
                </p>
              </div>
              <div className="panel-actions">
                <button onClick={() => setImportPanel(true)}>
                  <Icon name="upload" size={14} /> Importar Excel
                </button>
                <button onClick={exportSchedule}>
                  <Icon name="download" size={14} /> Exportar
                </button>
              </div>
            </div>
            <div className="planning-table-wrap">
              <table className="planning-table">
                <thead>
                  <tr>
                    <th>ID</th>
                    <th>Actividad</th>
                    <th>Responsable</th>
                    <th>Duración</th>
                    <th>Avance</th>
                    <th>Estado</th>
                  </tr>
                </thead>
                <tbody>
                  {phases.map((phase) => (
                    <tr key={phase.id}>
                      <td>
                        <span className="activity-code">{phase.id}</span>
                      </td>
                      <td>
                        <strong>{phase.name}</strong>
                        <small>
                          {phase.isMilestone ? "Hito de control" : "Actividad"}
                        </small>
                      </td>
                      <td>
                        <span className="owner-cell">
                          <i>{phase.owner}</i> {phase.owner}
                        </span>
                      </td>
                      <td>{phase.duration} semanas</td>
                      <td>
                        <div className="table-progress">
                          <span style={{ width: `${phase.progress}%` }} />
                        </div>
                        <b>{phase.progress}%</b>
                      </td>
                      <td>
                        <span
                          className={`table-status ${
                            phase.progress === 100
                              ? "done"
                              : phase.progress > 0
                                ? "active"
                                : ""
                          }`}
                        >
                          {phase.progress === 100
                            ? "Completada"
                            : phase.progress > 0
                              ? "En curso"
                              : "Pendiente"}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="planning-footer">
              <span>
                {phases.length} elementos ·{" "}
                {phases.filter((phase) => phase.isMilestone).length} hitos
              </span>
              <button onClick={() => navigate("/gantt")}>
                Generar vista Gantt <Icon name="arrow" size={15} />
              </button>
            </div>
          </section>

          <section className="kpi-grid" id="kpi-section">
            <article className="kpi-card">
              <div className="kpi-top">
                <span className="kpi-icon blue">
                  <Icon name="chart" />
                </span>
                <span className="trend good">↗ 4,2%</span>
              </div>
              <small>Avance planificado vs. real</small>
              <div className="kpi-value">
                42,3% <span>/ 45%</span>
              </div>
              <div className="progress">
                <span style={{ width: "42.3%" }} />
                <i style={{ left: "45%" }} />
              </div>
              <p>
                <b>2,7%</b> bajo lo planificado
              </p>
            </article>
            <article className="kpi-card">
              <div className="kpi-top">
                <span className="kpi-icon purple">
                  <Icon name="calendar" />
                </span>
                <span className="trend neutral">
                  {durationDelta > 0 ? "Con desvío" : "Estable"}
                </span>
              </div>
              <small>Índice de desempeño plazo</small>
              <div className="kpi-value">
                {durationDelta > 0 ? "0,91" : "0,94"} <span>SPI</span>
              </div>
              <div className="spark purple-spark">
                <i />
                <i />
                <i />
                <i />
                <i />
                <i />
                <i />
              </div>
              <p>
                Umbral de alerta: <b>0,90</b>
              </p>
            </article>
            <article className="kpi-card">
              <div className="kpi-top">
                <span className="kpi-icon green">
                  <Icon name="chart" />
                </span>
                <span className="trend good">↗ 0,06</span>
              </div>
              <small>Índice de desempeño costo</small>
              <div className="kpi-value">
                1,03 <span>CPI</span>
              </div>
              <div className="spark green-spark">
                <i />
                <i />
                <i />
                <i />
                <i />
                <i />
                <i />
              </div>
              <p>
                <b>$62,6M</b> disponibles
              </p>
            </article>
            <article className="kpi-card">
              <div className="kpi-top">
                <span className="kpi-icon amber">
                  <Icon name="warning" />
                </span>
                <span className="trend warning">Requiere atención</span>
              </div>
              <small>Hitos comprometidos</small>
              <div className="kpi-value">
                1 <span>de 5 completado</span>
              </div>
              <div className="milestone-dots">
                <i className="done" />
                <i className="current" />
                <i />
                <i />
                <i />
              </div>
              <p>
                Próximo: <b>Core operativo</b>
              </p>
            </article>
          </section>

          <section className="dashboard-grid">
            <article className="panel gantt-panel" id="gantt-section">
              <div className="panel-header">
                <div>
                  <h2>Cronograma general</h2>
                  <p>
                    {importedSchedule
                      ? `${importFileName} · ${phases.length} actividades`
                      : "Vista consolidada por fase · 35 semanas"}
                  </p>
                </div>
                <div className="panel-actions">
                  <button onClick={() => setImportPanel(true)}>
                    <Icon name="upload" size={14} /> Importar
                  </button>
                  <button onClick={exportSchedule}>
                    <Icon name="download" size={14} /> Exportar
                  </button>
                  <button
                    onClick={() => setEditPhase(editPhase === null ? 1 : null)}
                  >
                    {editPhase === null
                      ? "Editar duración"
                      : "Finalizar edición"}
                  </button>
                  <button className="square">
                    <Icon name="more" />
                  </button>
                </div>
              </div>
              <div className="gantt-head">
                <span>ACTIVIDAD / RESPONSABLE</span>
                <div>
                  {["OCT", "NOV", "DIC", "ENE", "FEB", "MAR", "ABR", "MAY"].map(
                    (month) => (
                      <b key={month}>{month}</b>
                    ),
                  )}
                </div>
              </div>
              <div className="gantt-body">
                <div className="today-line">
                  <span>HOY</span>
                </div>
                {phases.map((phase, index) => (
                  <div className="gantt-row" key={phase.id}>
                    <div className="phase-info">
                      <span className={`phase-number ${phase.color}`}>
                        {phase.id}
                      </span>
                      <div>
                        <strong>{phase.name}</strong>
                        <small>
                          {phase.duration} sem · {phase.progress}%
                        </small>
                      </div>
                      <span className="tiny-avatar">{phase.owner}</span>
                      {editPhase !== null && (
                        <div className="duration-editor">
                          <button
                            onClick={() => updateDuration(index, -1)}
                            aria-label="Restar semana"
                          >
                            <Icon name="minus" size={12} />
                          </button>
                          <button
                            onClick={() => updateDuration(index, 1)}
                            aria-label="Sumar semana"
                          >
                            <Icon name="plus" size={12} />
                          </button>
                        </div>
                      )}
                    </div>
                    <div className="timeline">
                      <div className="grid-lines">
                        {Array.from({ length: 8 }).map((_, i) => (
                          <i key={i} />
                        ))}
                      </div>
                      <div
                        className={`bar ${phase.color}`}
                        style={{
                          left: `${(phase.start / timelineWeeks) * 100}%`,
                          width: `${(phase.duration / timelineWeeks) * 100}%`,
                        }}
                      >
                        <span style={{ width: `${phase.progress}%` }} />
                        {phase.progress > 20 && <b>{phase.progress}%</b>}
                      </div>
                      {(phase.isMilestone ||
                        (!importedSchedule && index < 4)) && (
                        <div
                          className="milestone-mark"
                          style={{
                            left: `${Math.min(97, ((phase.start + phase.duration) / timelineWeeks) * 100)}%`,
                          }}
                        />
                      )}
                    </div>
                  </div>
                ))}
              </div>
              <div className="panel-footer">
                <div>
                  <span className="legend planned" /> Planificado{" "}
                  <span className="legend progress-legend" /> Avance real{" "}
                  <span className="diamond" /> Hito
                </div>
                {importedSchedule ? (
                  <button
                    onClick={() => {
                      setImportedSchedule(null)
                      setImportFileName("")
                      showToast("Se restauró la planificación de demostración.")
                    }}
                  >
                    Restaurar demo
                  </button>
                ) : (
                  <button onClick={() => navigate("/gantt")}>
                    Ver Carta Gantt completa <Icon name="arrow" size={15} />
                  </button>
                )}
              </div>
            </article>

            <article className="panel milestones-panel" id="milestones-section">
              <div className="panel-header">
                <div>
                  <h2>Próximos hitos</h2>
                  <p>Fechas y criterios de control</p>
                </div>
                <button className="square">
                  <Icon name="more" />
                </button>
              </div>
              <div className="milestone-list">
                {milestones.map((milestone, index) => (
                  <div className="milestone-item" key={milestone.code}>
                    <div className={`milestone-badge ${milestone.color}`}>
                      {milestone.color === "green" ? (
                        <Icon name="check" size={15} />
                      ) : (
                        milestone.code
                      )}
                    </div>
                    <div className="milestone-copy">
                      <strong>{milestone.title}</strong>
                      <small>
                        {milestone.code} · {milestone.date}
                      </small>
                    </div>
                    <span className={`milestone-state ${milestone.color}`}>
                      {milestone.state}
                    </span>
                    {index < milestones.length - 1 && (
                      <i className="connector" />
                    )}
                  </div>
                ))}
              </div>
              <button className="full-link" onClick={() => navigate("/hitos")}>
                Ver todos los hitos <Icon name="arrow" size={15} />
              </button>
            </article>
          </section>

          <section className="bottom-grid">
            <article className="panel resource-panel" id="resources-section">
              <div className="panel-header">
                <div>
                  <h2>Capacidad del equipo</h2>
                  <p>5 profesionales · Semana actual</p>
                </div>
                <button
                  onClick={() => {
                    setResourcesAdded(!resourcesAdded)
                    showToast(
                      resourcesAdded
                        ? "Asignación restaurada."
                        : "Recurso QA asignado. Costo actualizado.",
                    )
                  }}
                >
                  {resourcesAdded ? "Restaurar equipo" : "Modificar recursos"}
                </button>
              </div>
              <div className="resource-content">
                <div
                  className="capacity-ring"
                  style={
                    {
                      "--value": resourcesAdded ? "82deg" : "104deg",
                    } as React.CSSProperties
                  }
                >
                  <div>
                    <strong>{resourcesAdded ? "73%" : "86%"}</strong>
                    <small>capacidad</small>
                  </div>
                </div>
                <div className="resource-copy">
                  <div>
                    <span>Horas asignadas</span>
                    <b>{resourcesAdded ? "176 / 240 h" : "172 / 200 h"}</b>
                  </div>
                  <div className="resource-bar">
                    <span style={{ width: resourcesAdded ? "73%" : "86%" }} />
                  </div>
                  <p>
                    <Icon
                      name={resourcesAdded ? "check" : "warning"}
                      size={15}
                    />{" "}
                    {resourcesAdded
                      ? "Carga equilibrada tras asignar apoyo QA"
                      : "1 profesional con sobreasignación"}
                  </p>
                </div>
              </div>
            </article>

            <article className="panel changes-panel">
              <div className="panel-header">
                <div>
                  <h2>Solicitudes de cambio</h2>
                  <p>Seguimiento de impacto y aprobación</p>
                </div>
                <button onClick={() => setChangePanel(true)}>
                  Gestionar cambios
                </button>
              </div>
              <div className="change-row">
                <div className="change-number">
                  {changes.filter((c) => c.state === "Pendiente").length + 1}
                </div>
                <div>
                  <strong>Pendientes de decisión</strong>
                  <small>Comité de control · Próxima sesión 28 ene</small>
                </div>
                <span className="change-tag amber">Revisar</span>
              </div>
              <div className="change-row">
                <div className="change-number approved">{approvedCount}</div>
                <div>
                  <strong>Cambios aprobados</strong>
                  <small>
                    Impacto acumulado: $
                    {(4.1 + Math.max(0, approvedCount - 1) * 2.4).toFixed(1)}M
                  </small>
                </div>
                <span className="change-tag green">Aplicados</span>
              </div>
            </article>
          </section>
        </div>
      </main>

      {importSuccess && (
        <div className="overlay import-overlay" role="presentation">
          <section
            className="success-modal"
            role="dialog"
            aria-modal="true"
            aria-label="Importación completada"
          >
            <div className="success-mark">
              <Icon name="check" size={32} />
            </div>
            <span>IMPORTACIÓN COMPLETADA</span>
            <h2>Tu Carta Gantt está lista</h2>
            <p>
              Procesamos <strong>{importSuccess.fileName}</strong> sin errores y
              guardamos el cronograma en este dispositivo.
            </p>
            <div className="success-stats">
              <div>
                <strong>{importSuccess.activities}</strong>
                <small>Filas procesadas</small>
              </div>
              <div>
                <strong>
                  {importSuccess.activities - importSuccess.milestones}
                </strong>
                <small>Actividades</small>
              </div>
              <div>
                <strong>{importSuccess.milestones}</strong>
                <small>Hitos</small>
              </div>
            </div>
            <div className="success-checks">
              <p>
                <Icon name="check" size={15} /> Fechas y duraciones calculadas
              </p>
              <p>
                <Icon name="check" size={15} /> Responsables y avances asignados
              </p>
              <p>
                <Icon name="check" size={15} /> Carta Gantt generada
              </p>
            </div>
            <button
              onClick={() => {
                setImportSuccess(null)
                navigate("/gantt")
              }}
            >
              Ver Carta Gantt <Icon name="arrow" size={16} />
            </button>
          </section>
        </div>
      )}

      {importPanel && (
        <div
          className="overlay import-overlay"
          role="presentation"
          onMouseDown={() => setImportPanel(false)}
        >
          <section
            className="import-modal"
            role="dialog"
            aria-modal="true"
            aria-label="Importar planificación desde Excel"
            onMouseDown={(event) => event.stopPropagation()}
          >
            <div className="import-head">
              <div className="import-head-icon">
                <Icon name="file" size={24} />
              </div>
              <div>
                <span>CREAR CARTA GANTT</span>
                <h2>Importar planificación desde Excel</h2>
                <p>
                  Cada fila del archivo se convertirá en una actividad o hito.
                </p>
              </div>
              <button onClick={() => setImportPanel(false)} aria-label="Cerrar">
                <Icon name="close" />
              </button>
            </div>

            <div className="import-body">
              <div className="import-step">
                <span>1</span>
                <div>
                  <strong>Usa las columnas esperadas</strong>
                  <p>
                    Actividad, Fecha inicio y Fecha fin son obligatorias. Puedes
                    agregar ID, Responsable, Avance % y Tipo.
                  </p>
                </div>
              </div>
              <div className="column-preview">
                {[
                  "ID",
                  "Actividad*",
                  "Fecha inicio*",
                  "Fecha fin*",
                  "Responsable",
                  "Avance %",
                  "Tipo",
                ].map((column) => (
                  <span key={column}>{column}</span>
                ))}
              </div>
              <button className="template-button" onClick={downloadTemplate}>
                <Icon name="download" size={17} />
                <span>
                  <strong>Descargar plantilla de ejemplo</strong>
                  <small>Excel preparado con actividades e hitos</small>
                </span>
              </button>

              <div className="import-step second">
                <span>2</span>
                <div>
                  <strong>Sube tu archivo completado</strong>
                  <p>Se procesará localmente y podrás editarlo después.</p>
                </div>
              </div>
              <input
                id="gantt-file"
                className="file-input"
                type="file"
                accept=".xlsx,.xls,.csv"
                onChange={(event) => {
                  const file = event.target.files?.[0]
                  if (file) void importExcel(file)
                }}
              />
              <div
                className="drop-zone"
                role="button"
                tabIndex={0}
                onClick={() => document.getElementById("gantt-file")?.click()}
                onKeyDown={(event) => {
                  if (event.key === "Enter")
                    document.getElementById("gantt-file")?.click()
                }}
                onDragOver={(event) => event.preventDefault()}
                onDrop={(event) => {
                  event.preventDefault()
                  const file = event.dataTransfer.files[0]
                  if (file) void importExcel(file)
                }}
              >
                <span className="drop-icon">
                  <Icon name="upload" size={24} />
                </span>
                <strong>Arrastra tu Excel aquí</strong>
                <p>o haz clic para buscar un archivo</p>
                <small>.XLSX, .XLS o .CSV · Primera hoja del archivo</small>
              </div>
              {importError && (
                <div className="import-error">
                  <Icon name="warning" size={17} />
                  <span>{importError}</span>
                </div>
              )}
              <div className="import-note">
                <Icon name="check" size={16} />
                <p>
                  <strong>La aplicación hará el resto:</strong> calculará
                  duración, posición temporal y avance para dibujar la Carta
                  Gantt automáticamente.
                </p>
              </div>
            </div>
          </section>
        </div>
      )}

      {changePanel && (
        <div
          className="overlay"
          role="presentation"
          onMouseDown={() => setChangePanel(false)}
        >
          <aside
            className="drawer"
            role="dialog"
            aria-modal="true"
            aria-label="Gestión de solicitudes"
            onMouseDown={(e) => e.stopPropagation()}
          >
            <div className="drawer-head">
              <div>
                <span>CONTROL INTEGRADO</span>
                <h2>Solicitudes de cambio</h2>
                <p>Evalúa el impacto antes de aprobar.</p>
              </div>
              <button onClick={() => setChangePanel(false)} aria-label="Cerrar">
                <Icon name="close" />
              </button>
            </div>
            <div className="drawer-summary">
              <div>
                <small>PENDIENTES</small>
                <strong>
                  {changes.filter((c) => c.state !== "Aprobada").length}
                </strong>
              </div>
              <div>
                <small>IMPACTO APROBADO</small>
                <strong>
                  ${(4.1 + Math.max(0, approvedCount - 1) * 2.4).toFixed(1)}M
                </strong>
              </div>
              <div>
                <small>RIESGO</small>
                <strong className="amber-text">Medio</strong>
              </div>
            </div>
            <div className="drawer-list">
              {filteredChanges.map((change) => (
                <article className="change-card" key={change.id}>
                  <div className="change-card-top">
                    <span>{change.id}</span>
                    <b
                      className={
                        change.state === "Aprobada" ? "approved-text" : ""
                      }
                    >
                      {change.state}
                    </b>
                  </div>
                  <h3>{change.title}</h3>
                  <p>Responsable: {change.owner}</p>
                  <div className="impact">
                    <span>Impacto estimado</span>
                    <strong>{change.impact}</strong>
                  </div>
                  {change.state !== "Aprobada" ? (
                    <button onClick={() => approveChange(change.id)}>
                      <Icon name="check" size={16} /> Aprobar y aplicar al
                      proyecto
                    </button>
                  ) : (
                    <div className="applied">
                      <Icon name="check" size={15} /> Reflejado en planificación
                      y costos
                    </div>
                  )}
                </article>
              ))}
            </div>
          </aside>
        </div>
      )}
      {toast && (
        <div className="toast">
          <Icon name="check" size={17} />
          {toast}
        </div>
      )}
    </div>
  )
}
