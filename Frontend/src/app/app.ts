import { Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { Api } from './api';

interface NavItem {
  path: string;
  label: string;
  icon: string;
  /** Roles con acceso (ADMIN siempre accede). Sin lista = cualquier usuario de la operación. */
  roles?: string[];
}

/** Operación de talleres: agenda, OT, presupuestos, repuestos, garantías e indicadores. */
const OPERACION: NavItem[] = [
  { path: '/panel', label: 'Panel de operaciones', icon: '◫' },
  { path: '/ordenes', label: 'Órdenes de trabajo', icon: '▤', roles: ['RECEPCION', 'JEFE_TALLER', 'MECANICO', 'GERENCIA'] },
  { path: '/agenda', label: 'Agenda de taller', icon: '▦', roles: ['RECEPCION', 'JEFE_TALLER', 'GERENCIA'] },
  { path: '/clientes', label: 'Clientes', icon: '♙', roles: ['RECEPCION', 'JEFE_TALLER'] },
  { path: '/vehiculos', label: 'Vehículos', icon: '⇄', roles: ['RECEPCION', 'JEFE_TALLER'] },
  { path: '/repuestos', label: 'Repuestos y stock', icon: '▧', roles: ['MECANICO', 'JEFE_TALLER', 'BODEGA', 'GERENCIA'] },
  { path: '/garantias', label: 'Garantías e historial', icon: '✓' },
  { path: '/indicadores', label: 'Indicadores de operación', icon: '▥', roles: ['GERENCIA', 'JEFE_TALLER'] },
  { path: '/integraciones', label: 'Integraciones', icon: '⟳', roles: [] },
];

/** Gestor del proyecto SUGO: planificación, hitos, KPI del proyecto, cambios y riesgos. */
const PROYECTO: NavItem[] = [
  { path: '/', label: 'Seguimiento del proyecto', icon: '◫' },
  { path: '/proyectos', label: 'Proyectos', icon: '▤' },
  { path: '/planificacion', label: 'Actividades y dependencias', icon: '⇄' },
  { path: '/gantt', label: 'Carta Gantt', icon: '▦' },
  { path: '/cartas-gantt', label: 'Cartas Gantt', icon: '▤' },
  { path: '/recursos', label: 'Recursos y costos', icon: '♙' },
  { path: '/hitos', label: 'Hitos', icon: '⚑' },
  { path: '/kpi', label: 'Administrador KPI', icon: '▥' },
  { path: '/cambios', label: 'Solicitudes de cambio', icon: '⟳' },
  { path: '/tablero-cambios', label: 'Tablero de cambios', icon: '◈' },
  { path: '/riesgos', label: 'Riesgos', icon: '△' },
  { path: '/contexto', label: 'Contexto y alcance', icon: '◎' },
  { path: '/trazabilidad', label: 'Trazabilidad', icon: '≡' },
];

@Component({
  selector: 'app-root',
  imports: [FormsModule, RouterLink, RouterLinkActive, RouterOutlet],
  templateUrl: './app.html',
})
export class App {
  readonly api = inject(Api);
  private readonly router = inject(Router);
  email = '';
  password = '';
  readonly error = signal('');
  readonly busy = signal(false);
  readonly menu = signal(false);
  /** El portal del cliente se abre con un enlace privado y no requiere iniciar sesión. */
  readonly isPortal = globalThis.location?.pathname.startsWith('/portal/') ?? false;

  constructor() {
    void this.api.restore().then(() => this.irAlInicio());
  }

  get esProyecto() {
    return this.api.can('USUARIO_PROYECTO');
  }
  get esOperacion() {
    return this.api.usuario()?.rol !== 'USUARIO_PROYECTO';
  }
  get operacion() {
    return OPERACION.filter((i) => (i.roles ? this.api.can(...i.roles) : this.esOperacion));
  }
  get proyecto() {
    return this.esProyecto ? PROYECTO : [];
  }
  get rolEtiqueta() {
    const roles: Record<string, string> = {
      ADMIN: 'Administrador',
      USUARIO_PROYECTO: 'Usuario de proyecto',
      GERENCIA: 'Gerencia',
      JEFE_TALLER: 'Jefe de taller',
      RECEPCION: 'Recepción',
      MECANICO: 'Mecánico',
      BODEGA: 'Bodega',
    };
    return roles[this.api.usuario()?.rol ?? ''] ?? '';
  }

  async login() {
    this.busy.set(true);
    this.error.set('');
    try {
      await this.api.login(this.email, this.password);
      this.password = '';
      this.irAlInicio();
    } catch (e) {
      this.error.set((e as Error).message);
    } finally {
      this.busy.set(false);
    }
  }

  /** Cada perfil aterriza en su espacio: el equipo de proyecto en el gestor, el resto en la operación. */
  private irAlInicio() {
    if (!this.api.usuario() || this.isPortal) return;
    const raiz = this.router.url === '/' || globalThis.location?.pathname === '/';
    if (raiz && this.esOperacion) void this.router.navigateByUrl('/panel');
  }
}
