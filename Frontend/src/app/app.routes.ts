import { Routes } from '@angular/router';

/** Gestor del proyecto SUGO (ADMIN y USUARIO_PROYECTO). */
const RUTAS_PROYECTO = [
  '',
  'proyectos',
  'planificacion',
  'gantt',
  'recursos',
  'hitos',
  'kpi',
  'cambios',
  'tablero-cambios',
  'riesgos',
  'contexto',
  'trazabilidad',
];

/** Operación de talleres. El componente decide qué pantalla mostrar según `data.view`. */
const RUTAS_OPERACION = [
  'ordenes',
  'agenda',
  'clientes',
  'vehiculos',
  'repuestos',
  'garantias',
  'indicadores',
  'integraciones',
];

export const routes: Routes = [
  ...RUTAS_PROYECTO.map((path) => ({
    path,
    loadComponent: () => import('./project-workspace').then((m) => m.ProjectWorkspace),
  })),
  { path: 'cartas-gantt', loadComponent: () => import('./cartas-gantt').then((m) => m.CartasGantt) },
  { path: 'panel', data: { view: '' }, loadComponent: () => import('./workspace').then((m) => m.Workspace) },
  ...RUTAS_OPERACION.map((path) => ({
    path,
    data: { view: path },
    loadComponent: () => import('./workspace').then((m) => m.Workspace),
  })),
  // Enlace privado que recibe el cliente: no requiere iniciar sesión.
  { path: 'portal/:token', loadComponent: () => import('./portal').then((m) => m.Portal) },
  { path: '**', redirectTo: '' },
];
