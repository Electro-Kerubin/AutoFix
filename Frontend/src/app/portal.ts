import { Component, inject, input, OnInit, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Api, Registro } from './api';
@Component({
  selector: 'app-portal',
  imports: [FormsModule],
  template: ` <div class="portal-shell">
    <header>
      <a class="brand" href="/"
        ><span class="brand-mark">A</span><span>AutoFix<small>PORTAL DEL CLIENTE</small></span></a
      ><span>Tu vehículo, siempre cerca.</span>
    </header>
    <main>
      @if (error()) {
        <div class="alert error" role="alert">{{ error() }}</div>
      }
      @if (loading()) {
        <p class="loading">Consultando tu atención…</p>
      }
      @if (data(); as d) {
        <span class="eyebrow">SEGUIMIENTO DE TU VEHÍCULO</span>
        <h1>Hola, {{ d['cliente'].nombre }}</h1>
        <p class="muted">
          {{ d['vehiculo'].marca }} {{ d['vehiculo'].modelo }} · {{ d['vehiculo'].patente }} ·
          {{ d['sucursal'].nombre }}
        </p>
        <section class="callout">
          <span class="tag">{{ label(d['estado']) }}</span>
          <h2>{{ d['numero'] }}</h2>
          <p>{{ d['motivoIngreso'] }}</p>
          <small>Ingreso {{ date(d['fechaIngreso']) }}</small>
        </section>
        <section class="panel">
          <div class="panel-heading"><h2>Avance de tu atención</h2></div>
          <div class="portal-body">
            @for (h of d['lineaDeTiempo']; track $index) {
              <div class="timeline-event">
                <i></i>
                <div>
                  <strong>{{ label(h.estado) }}</strong
                  ><small>{{ date(h.fecha) }}</small>
                </div>
              </div>
            }
          </div>
        </section>
        <h2>Presupuestos</h2>
        @for (p of d['presupuestos']; track p.id) {
          <article class="panel portal-budget">
            <div class="budget-title">
              <h3>{{ label(p.tipo) }}</h3>
              <span class="tag">{{ label(p.estado) }}</span
              ><strong>{{ money(p.total) }}</strong>
            </div>
            @for (i of p.items; track $index) {
              <p class="budget-line">
                <span>{{ i.cantidad }} × {{ i.descripcion }}</span
                ><span>{{ money(i.subtotal) }}</span>
              </p>
            }
            <p>{{ p.notas }}</p>
            @if (p.puedeDecidir) {
              <form (ngSubmit)="decide(p.id, 'aprobar')">
                <label
                  >Tu nombre<input
                    name="nombre"
                    [(ngModel)]="nombre"
                    minlength="2"
                    maxlength="160"
                    required /></label
                ><label class="check-label"
                  ><input type="checkbox" name="consentimiento" [(ngModel)]="consent" required />
                  Confirmo que revisé los trabajos y autorizo el monto de este presupuesto.</label
                ><button class="primary" [disabled]="busy() || !consent">
                  Aprobar {{ money(p.total) }}
                </button>
              </form>
              <form (ngSubmit)="decide(p.id, 'rechazar')">
                <label
                  >Si prefieres rechazarlo, indica el motivo<textarea
                    name="motivo"
                    [(ngModel)]="motivo"
                    minlength="3"
                    maxlength="500"
                    required
                  ></textarea></label
                ><button [disabled]="busy()">Rechazar presupuesto</button>
              </form>
            }
          </article>
        } @empty {
          <p class="empty panel">Tu taller todavía no ha enviado presupuestos.</p>
        }
        @if (d['evidencias'].length) {
          <article class="panel portal-budget">
            <h2>Evidencias del diagnóstico</h2>
            @for (e of d['evidencias']; track e.id) {
              <p>
                <a [href]="evidenceUrl(e.id)" target="_blank" rel="noopener"
                  >{{ e.descripcion || 'Ver evidencia' }} ↗</a
                >
              </p>
            }
          </article>
        }
        @if (d['garantiasVigentes'].length) {
          <article class="panel portal-budget">
            <h2>Tus garantías vigentes</h2>
            @for (g of d['garantiasVigentes']; track $index) {
              <p>
                <strong>{{ g.descripcion }}</strong
                ><small>Válida hasta {{ date(g.fechaVencimiento) }}</small>
              </p>
            }
          </article>
        }
        <p class="muted">
          {{ d['sucursal'].nombre }} · {{ d['sucursal'].direccion }} · {{ d['sucursal'].telefono }}
        </p>
      }
      <footer>AutoFix · Sistema Unificado de Gestión Operativa</footer>
    </main>
  </div>`,
})
export class Portal implements OnInit {
  readonly api = inject(Api);
  readonly token = input.required<string>();
  readonly data = signal<Registro | null>(null);
  readonly error = signal('');
  readonly loading = signal(true);
  readonly busy = signal(false);
  nombre = '';
  motivo = '';
  consent = false;
  ngOnInit() {
    void this.load();
  }
  async load() {
    try {
      this.data.set(await this.api.get('/portal/' + encodeURIComponent(this.token())));
    } catch (e) {
      this.error.set((e as Error).message);
    } finally {
      this.loading.set(false);
    }
  }
  async decide(id: string, action: string) {
    if (this.busy()) return;
    this.busy.set(true);
    this.error.set('');
    try {
      if (action === 'aprobar' && !this.consent)
        throw new Error('Confirma que revisaste el presupuesto.');
      this.data.set(
        await this.api.post(
          '/portal/' + encodeURIComponent(this.token()) + '/presupuestos/' + id + '/' + action,
          { nombre: this.nombre, ...(action === 'rechazar' ? { motivo: this.motivo } : {}) },
        ),
      );
      this.consent = false;
    } catch (e) {
      this.error.set((e as Error).message);
    } finally {
      this.busy.set(false);
    }
  }
  label(v: unknown) {
    return String(v)
      .replaceAll('_', ' ')
      .toLowerCase()
      .replace(/^./, (c) => c.toUpperCase());
  }
  money(v: unknown) {
    return new Intl.NumberFormat('es-CL', {
      style: 'currency',
      currency: 'CLP',
      maximumFractionDigits: 0,
    }).format(Number(v) || 0);
  }
  date(v: unknown) {
    return new Date(String(v)).toLocaleDateString('es-CL', { dateStyle: 'medium' });
  }
  evidenceUrl(id: string) {
    return '/api/portal/' + encodeURIComponent(this.token()) + '/evidencias/' + id + '/archivo';
  }
}
