import { Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Api, Registro } from './api';

interface Tarea {
  id: string;
  nombre: string;
  responsable: string;
  inicio: string;
  fin: string;
  avance: number;
}

const DIA = 86_400_000;
const MESES = ['ENE', 'FEB', 'MAR', 'ABR', 'MAY', 'JUN', 'JUL', 'AGO', 'SEP', 'OCT', 'NOV', 'DIC'];

@Component({
  selector: 'app-cartas-gantt',
  imports: [CommonModule, FormsModule],
  template: `
    <div class="workspace">
      <div class="page-heading">
        <div>
          <span class="eyebrow">AUTOFIX · GESTOR DE PROYECTOS DE SOFTWARE</span>
          <h1>Cartas Gantt</h1>
          <p>Crea, edita y elimina las cartas Gantt de tus planificaciones.</p>
        </div>
        <div class="heading-actions">
          <button (click)="cargar()" [disabled]="loading()">↻ Actualizar</button>
          <button class="primary" (click)="nueva()">＋ Nueva carta Gantt</button>
        </div>
      </div>
      @if (error()) {
        <div class="alert error" role="alert">{{ error() }}</div>
      }
      @if (notice()) {
        <div class="alert success" role="status">{{ notice() }}</div>
      }
      @if (loading()) {
        <p class="loading">Cargando cartas Gantt…</p>
      }

      <article class="panel">
        <div class="panel-heading">
          <div>
            <h2>Cartas creadas</h2>
            <p>{{ cartas().length }} carta(s)</p>
          </div>
        </div>
        <div class="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Nombre</th>
                <th>Tareas</th>
                <th>Período</th>
                <th>Avance</th>
                <th>Modificada</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              @for (c of cartas(); track c.id) {
                <tr>
                  <td>
                    <strong>{{ c['nombre'] }}</strong
                    ><small>{{ c['descripcion'] }}</small>
                  </td>
                  <td>{{ c['totalTareas'] }}</td>
                  <td>{{ c['inicio'] ? fecha(c['inicio']) + ' — ' + fecha(c['fin']) : '—' }}</td>
                  <td>{{ c['avance'] }}%</td>
                  <td>{{ c['updatedAt'] | date: 'dd-MM-yyyy HH:mm' }}</td>
                  <td>
                    <button (click)="ver(c['id'])">Ver</button>
                    <button (click)="editar(c['id'])">Editar</button>
                    <button class="link danger" (click)="porBorrar.set(c)">Eliminar</button>
                  </td>
                </tr>
              } @empty {
                <tr>
                  <td colspan="6" class="empty">
                    Aún no hay cartas Gantt. Crea la primera con “Nueva carta Gantt”.
                  </td>
                </tr>
              }
            </tbody>
          </table>
        </div>
      </article>

      @if (visible(); as v) {
        <article class="panel">
          <div class="panel-heading">
            <div>
              <h2>{{ v['nombre'] }}</h2>
              <p>{{ v['descripcion'] }}</p>
            </div>
            <button (click)="visible.set(null)">Cerrar</button>
          </div>
          @if (grafico(v['tareas']); as g) {
            <div class="gantt-scroll">
              <div class="gantt">
                <div class="gantt-head">
                  <span>TAREA / RESPONSABLE</span>
                  <div [style.grid-template-columns]="'repeat(' + g.meses.length + ', 1fr)'">
                    @for (m of g.meses; track m) {
                      <span>{{ m }}</span>
                    }
                  </div>
                </div>
                @for (t of v['tareas']; track t.id; let i = $index) {
                  <div class="gantt-row">
                    <div class="phase">
                      <span class="phase-number">{{ i + 1 }}</span>
                      <div>
                        <strong>{{ t.nombre }}</strong
                        ><small
                          >{{ t.responsable || 'Sin responsable' }} · {{ t.avance }}% ·
                          {{ fecha(t.inicio) }} — {{ fecha(t.fin) }}</small
                        >
                      </div>
                    </div>
                    <div class="timeline" style="background: none">
                      <div
                        class="bar"
                        [style.left.%]="izquierda(g, t)"
                        [style.width.%]="ancho(g, t)"
                        [title]="t.nombre"
                      >
                        <i [style.width.%]="t.avance"></i>
                      </div>
                    </div>
                  </div>
                }
              </div>
            </div>
          } @else {
            <p class="empty">Esta carta aún no tiene tareas.</p>
          }
        </article>
      }
    </div>

    @if (editando(); as e) {
      <div class="overlay">
        <section class="modal" style="width: 920px; max-width: 100%" role="dialog" aria-modal="true">
          <div class="panel-heading">
            <div>
              <span class="eyebrow">CARTA GANTT</span>
              <h2>{{ e.id ? 'Editar carta Gantt' : 'Nueva carta Gantt' }}</h2>
            </div>
            <button (click)="editando.set(null)" aria-label="Cerrar">✕</button>
          </div>
          <form (ngSubmit)="guardar()" class="modal-body">
            @if (errorForm()) {
              <p class="alert error" role="alert">{{ errorForm() }}</p>
            }
            <label
              >Nombre<input name="nombre" [(ngModel)]="e.nombre" required minlength="2" maxlength="120"
            /></label>
            <label
              >Descripción<input name="descripcion" [(ngModel)]="e.descripcion" maxlength="500"
            /></label>
            <h3>Tareas</h3>
            @for (t of e.tareas; track t.id; let i = $index) {
              <div class="form-grid" style="grid-template-columns: 2fr 1.3fr 1fr 1fr 80px 40px">
                <label
                  >Tarea<input [name]="'n' + i" [(ngModel)]="t.nombre" required maxlength="160"
                /></label>
                <label
                  >Responsable<input [name]="'r' + i" [(ngModel)]="t.responsable" maxlength="120"
                /></label>
                <label
                  >Inicio<input [name]="'i' + i" type="date" [(ngModel)]="t.inicio" required
                /></label>
                <label
                  >Fin<input [name]="'f' + i" type="date" [(ngModel)]="t.fin" [min]="t.inicio" required
                /></label>
                <label
                  >Avance %<input
                    [name]="'a' + i"
                    type="number"
                    min="0"
                    max="100"
                    [(ngModel)]="t.avance"
                    required
                /></label>
                <button type="button" (click)="quitarTarea(i)" aria-label="Quitar tarea">✕</button>
              </div>
            }
            <button type="button" (click)="agregarTarea()">＋ Agregar tarea</button>
            <button class="primary wide" [disabled]="saving()">
              {{ saving() ? 'Guardando…' : 'Guardar carta Gantt' }}
            </button>
          </form>
        </section>
      </div>
    }

    @if (porBorrar(); as b) {
      <div class="overlay">
        <section class="modal" role="alertdialog" aria-modal="true">
          <div class="panel-heading">
            <div>
              <h2>Eliminar carta Gantt</h2>
              <p>¿Eliminar “{{ b['nombre'] }}”? Esta acción no se puede deshacer.</p>
            </div>
          </div>
          <div class="modal-body">
            <button (click)="porBorrar.set(null)">Cancelar</button>
            <button class="primary" (click)="eliminar(b['id'])" [disabled]="saving()">Eliminar</button>
          </div>
        </section>
      </div>
    }
  `,
})
export class CartasGantt implements OnInit {
  private readonly api = inject(Api);
  readonly cartas = signal<Registro[]>([]);
  readonly visible = signal<Registro | null>(null);
  readonly editando = signal<{ id: string; nombre: string; descripcion: string; tareas: Tarea[] } | null>(null);
  readonly porBorrar = signal<Registro | null>(null);
  readonly loading = signal(false);
  readonly saving = signal(false);
  readonly error = signal('');
  readonly errorForm = signal('');
  readonly notice = signal('');

  ngOnInit() {
    void this.cargar();
  }

  async cargar() {
    this.loading.set(true);
    this.error.set('');
    try {
      this.cartas.set(await this.api.get<Registro[]>('/cartas-gantt'));
    } catch (e) {
      this.error.set((e as Error).message);
    } finally {
      this.loading.set(false);
    }
  }

  fecha(valor: string) {
    const [a, m, d] = valor.slice(0, 10).split('-');
    return `${d}-${m}-${a}`;
  }

  nueva() {
    this.errorForm.set('');
    this.editando.set({ id: '', nombre: '', descripcion: '', tareas: [this.tareaVacia()] });
  }

  async editar(id: string) {
    this.errorForm.set('');
    try {
      const c = await this.api.get(`/cartas-gantt/${id}`);
      this.editando.set({
        id,
        nombre: c['nombre'],
        descripcion: c['descripcion'] ?? '',
        tareas: c['tareas'].map((t: Registro) => ({ ...t, responsable: t['responsable'] ?? '' })),
      });
    } catch (e) {
      this.error.set((e as Error).message);
    }
  }

  async ver(id: string) {
    try {
      this.visible.set(await this.api.get(`/cartas-gantt/${id}`));
    } catch (e) {
      this.error.set((e as Error).message);
    }
  }

  agregarTarea() {
    this.editando.update((e) => (e ? { ...e, tareas: [...e.tareas, this.tareaVacia(e.tareas.at(-1))] } : e));
  }

  quitarTarea(indice: number) {
    this.editando.update((e) => (e ? { ...e, tareas: e.tareas.filter((_, i) => i !== indice) } : e));
  }

  async guardar() {
    const e = this.editando();
    if (!e || this.saving()) return;
    this.saving.set(true);
    this.errorForm.set('');
    const cuerpo = {
      nombre: e.nombre,
      descripcion: e.descripcion,
      tareas: e.tareas.map((t) => ({ ...t, avance: Number(t.avance) })),
    };
    try {
      const guardada = e.id
        ? await this.api.request<Registro>('PUT', `/cartas-gantt/${e.id}`, cuerpo)
        : await this.api.post<Registro>('/cartas-gantt', cuerpo);
      this.editando.set(null);
      this.notice.set(e.id ? 'Carta Gantt actualizada.' : 'Carta Gantt creada.');
      if (this.visible()?.id === guardada.id) this.visible.set(guardada);
      await this.cargar();
    } catch (err) {
      this.errorForm.set((err as Error).message);
    } finally {
      this.saving.set(false);
    }
  }

  async eliminar(id: string) {
    this.saving.set(true);
    try {
      await this.api.request('DELETE', `/cartas-gantt/${id}`);
      this.porBorrar.set(null);
      if (this.visible()?.id === id) this.visible.set(null);
      this.notice.set('Carta Gantt eliminada.');
      await this.cargar();
    } catch (err) {
      this.porBorrar.set(null);
      this.error.set((err as Error).message);
    } finally {
      this.saving.set(false);
    }
  }

  /** Rango de fechas y meses del gráfico a partir de las tareas. */
  grafico(tareas: Tarea[]) {
    if (!tareas?.length) return null;
    const inicio = Math.min(...tareas.map((t) => Date.parse(t.inicio)));
    const fin = Math.max(...tareas.map((t) => Date.parse(t.fin))) + DIA;
    const desde = new Date(inicio);
    const hasta = new Date(fin);
    const meses: string[] = [];
    const total = (hasta.getUTCFullYear() - desde.getUTCFullYear()) * 12 + hasta.getUTCMonth() - desde.getUTCMonth();
    for (let i = 0; i <= total; i++) {
      const mes = desde.getUTCMonth() + i;
      meses.push(`${MESES[mes % 12]} ${String(desde.getUTCFullYear() + Math.floor(mes / 12)).slice(2)}`);
    }
    // El eje parte el 1 del primer mes y termina el último día del último mes, para alinear con los encabezados.
    const eje0 = Date.UTC(desde.getUTCFullYear(), desde.getUTCMonth(), 1);
    const eje1 = Date.UTC(hasta.getUTCFullYear(), hasta.getUTCMonth() + 1, 1);
    return { eje0, eje1, meses };
  }

  izquierda(g: { eje0: number; eje1: number }, t: Tarea) {
    return ((Date.parse(t.inicio) - g.eje0) / (g.eje1 - g.eje0)) * 100;
  }

  ancho(g: { eje0: number; eje1: number }, t: Tarea) {
    return Math.max(0.5, ((Date.parse(t.fin) - Date.parse(t.inicio) + DIA) / (g.eje1 - g.eje0)) * 100);
  }

  private tareaVacia(previa?: Tarea): Tarea {
    const hoy = new Date().toISOString().slice(0, 10);
    return {
      id: crypto.randomUUID().slice(0, 8),
      nombre: '',
      responsable: '',
      inicio: previa?.fin ?? hoy,
      fin: previa?.fin ?? hoy,
      avance: 0,
    };
  }
}
