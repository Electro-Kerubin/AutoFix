import { createBrowserRouter } from "react-router"
import Workspace, { type WorkspaceView } from "./Workspace"

const page = (view: WorkspaceView) => () => <Workspace view={view} />

export const router = createBrowserRouter([
  { path: "/", Component: page("Resumen") },
  { path: "/proyectos", Component: page("Proyectos") },
  { path: "/planificacion", Component: page("Planificación") },
  { path: "/gantt", Component: page("Carta Gantt") },
  { path: "/recursos", Component: page("Recursos") },
  { path: "/hitos", Component: page("Hitos") },
  { path: "/kpi", Component: page("Indicadores KPI") },
  { path: "/cambios", Component: page("Gestión del cambio") },
  { path: "*", Component: page("Resumen") },
])
