import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { Api, Pagina, Registro } from './api';

@Component({
  selector: 'app-workspace',
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './workspace.html',
})
export class Workspace {
  readonly api = inject(Api);
  private route = inject(ActivatedRoute);
  readonly view = this.route.snapshot.routeConfig?.path || '';
  readonly titles: Record<string, string> = {
    '': 'Panel de operaciones',
    ordenes: 'Órdenes de trabajo',
    agenda: 'Agenda de taller',
    clientes: 'Clientes',
    vehiculos: 'Vehículos',
    repuestos: 'Repuestos y stock',
    garantias: 'Garantías e historial',
    indicadores: 'Indicadores de operación',
    proyecto: 'Proyecto SUGO',
    integraciones: 'Integraciones',
  };
  readonly descriptions: Record<string, string> = {
    '': 'Una visión clara de lo que ocurre en tus talleres.',
    ordenes: 'Del ingreso a la entrega, cada trabajo tiene su historia.',
    agenda: 'Reservas coordinadas y capacidad disponible por sucursal.',
    clientes: 'Una ficha única para cada cliente de la red.',
    vehiculos: 'Vehículos conectados con sus propietarios y atenciones.',
    repuestos: 'Disponibilidad, consumo y trazabilidad por orden.',
    garantias: 'Consulta las atenciones de toda la red por patente o RUT.',
    indicadores: 'Resultados de la operación frente a los objetivos del piloto.',
    proyecto: 'Planificación y compromisos desde los documentos del proyecto.',
    integraciones: 'Seguimiento de envíos a ERP e inventario.',
  };
  readonly rows = signal<Registro[]>([]);
  readonly total = signal(0);
  readonly loading = signal(false);
  readonly saving = signal(false);
  readonly error = signal('');
  readonly notice = signal('');
  readonly sucursales = signal<Registro[]>([]);
  readonly selected = signal<Registro | null>(null);
  readonly kpi = signal<any>(null);
  readonly context = signal<any>(null);
  readonly modal = signal('');
  readonly clientes = signal<Registro[]>([]);
  readonly vehiculos = signal<Registro[]>([]);
  readonly parts = signal<Registro[]>([]);
  readonly detail = signal<Registro | null>(null);
  readonly availability = signal<any>(null);
  readonly history = signal<any>(null);
  readonly transitions: Record<string, string[]> = {
    RECEPCIONADA: ['EN_DIAGNOSTICO', 'CANCELADA'],
    EN_DIAGNOSTICO: ['PRESUPUESTO_PENDIENTE', 'CANCELADA'],
    PRESUPUESTO_PENDIENTE: ['EN_REPARACION', 'EN_DIAGNOSTICO', 'CANCELADA'],
    EN_REPARACION: ['PRESUPUESTO_PENDIENTE', 'LISTA_ENTREGA'],
    LISTA_ENTREGA: ['ENTREGADA', 'EN_REPARACION'],
    ENTREGADA: [],
    CANCELADA: [],
  };
  query = '';
  sucursal = '';
  estado = '';
  page = 1;
  desde = '';
  hasta = '';
  tab = 'gantt';
  form: Record<string, any> = {};
  actionState = '';
  comment = '';
  portalUrl = '';
  budgetItems: Record<string, any>[] = [];
  private generation = 0;
  constructor() {
    this.sucursal = this.api.usuario()?.sucursalId || '';
    void this.init();
  }
  async init() {
    try {
      this.sucursales.set(await this.api.get<Registro[]>('/sucursales'));
    } catch (e) {
      this.fail(e);
    }
    await this.load();
  }
  label(value: unknown) {
    return String(value ?? '')
      .replaceAll('_', ' ')
      .toLowerCase()
      .replace(/^./, (c) => c.toUpperCase());
  }
  money(value: unknown) {
    return new Intl.NumberFormat('es-CL', {
      style: 'currency',
      currency: 'CLP',
      maximumFractionDigits: 0,
    }).format(Number(value) || 0);
  }
  date(value: unknown) {
    return value
      ? new Date(String(value).length === 10 ? value + 'T12:00:00' : String(value)).toLocaleString(
          'es-CL',
          {
            dateStyle: 'medium',
            ...(String(value).length > 10 ? { timeStyle: 'short' as const } : {}),
          },
        )
      : '—';
  }
  fail(e: unknown) {
    this.error.set(e instanceof Error ? e.message : 'No se pudo completar la operación.');
  }
  params(extra: Record<string, string | number | undefined> = {}) {
    const p = new URLSearchParams();
    for (const [k, v] of Object.entries(extra)) {
      if (v !== '' && v !== undefined) p.set(k, String(v));
    }
    return p.size ? '?' + p.toString() : '';
  }
  get scoped() {
    return this.sucursal ? { sucursalId: this.sucursal } : {};
  }
  get canWrite() {
    return this.api.can('RECEPCION', 'JEFE_TALLER');
  }
  get openDetail() {
    return !!this.detail() && !['ENTREGADA', 'CANCELADA'].includes(this.detail()!['estado']);
  }
  async load() {
    const generation = ++this.generation;
    this.loading.set(true);
    this.error.set('');
    if (this.desde && this.hasta && this.desde > this.hasta) {
      this.error.set('La fecha de inicio no puede ser posterior a la fecha de fin.');
      this.loading.set(false);
      return;
    }
    try {
      let result: Pagina | Registro[] | undefined;
      if (['clientes', 'vehiculos', 'repuestos', 'ordenes'].includes(this.view)) {
        const path = this.view === 'ordenes' ? 'ordenes-trabajo' : this.view;
        result = await this.api.get<Pagina>(
          '/' +
            path +
            this.params({
              page: this.page,
              limit: 12,
              q: this.query,
              ...(['ordenes', 'repuestos'].includes(this.view) ? this.scoped : {}),
              ...(this.view === 'ordenes' && this.estado ? { estado: this.estado } : {}),
            }),
        );
      } else if (this.view === 'agenda')
        result = await this.api.get<Registro[]>(
          '/reservas' +
            this.params({
              ...this.scoped,
              ...(this.desde ? { desde: this.desde } : {}),
              ...(this.hasta ? { hasta: this.hasta } : {}),
            }),
        );
      else if (this.view === 'integraciones') {
        if (!this.api.can('ADMIN'))
          throw new Error('Esta sección requiere acceso de administración.');
        result = await this.api.get<Registro[]>(
          '/integraciones/sync' + this.params(this.estado ? { estado: this.estado } : {}),
        );
      } else if (this.view === 'proyecto')
        this.context.set(await this.api.get('/proyecto/contexto'));
      else if (this.view === 'garantias') {
        if (this.query.trim().length >= 2) {
          const histories = await this.api.get<any[]>(
            '/garantias/historial' + this.params({ q: this.query }),
          );
          this.history.set({
            vehiculos: histories.map((h) => h.vehiculo),
            ordenes: histories.flatMap((h) =>
              h.ordenes.map((o: any) => ({ ...o, vehiculo: h.vehiculo })),
            ),
            garantias: histories.flatMap((h) => h.garantias),
          });
        }
      } else {
        if (this.view === 'indicadores' && !this.api.can('GERENCIA', 'JEFE_TALLER'))
          throw new Error('No tienes acceso a los indicadores.');
        const [orders, kpi] = await Promise.all([
          this.api.get<Pagina>(
            '/ordenes-trabajo' + this.params({ limit: 6, abiertas: 'true', ...this.scoped }),
          ),
          this.api.can('GERENCIA', 'JEFE_TALLER')
            ? this.api.get(
                '/reportes/kpis' +
                  this.params({ ...this.scoped, desde: this.desde, hasta: this.hasta }),
              )
            : Promise.resolve(null),
        ]);
        if (generation !== this.generation) return;
        this.rows.set(orders.items);
        this.total.set(orders.total);
        this.kpi.set(kpi);
      }
      if (generation !== this.generation) return;
      if (result) {
        this.rows.set(Array.isArray(result) ? result : result.items);
        this.total.set(Array.isArray(result) ? result.length : result.total);
      }
    } catch (e) {
      if (generation === this.generation) {
        this.rows.set([]);
        this.kpi.set(null);
        this.fail(e);
      }
    } finally {
      if (generation === this.generation) this.loading.set(false);
    }
  }
  search() {
    this.page = 1;
    void this.load();
  }
  paginate(delta: number) {
    this.page += delta;
    void this.load();
  }
  async act(work: () => Promise<unknown>, message: string) {
    if (this.saving()) return;
    this.saving.set(true);
    this.error.set('');
    this.notice.set('');
    try {
      await work();
      this.notice.set(message);
    } catch (e) {
      this.fail(e);
    } finally {
      this.saving.set(false);
    }
  }
  async open(kind: string) {
    this.error.set('');
    this.form = {
      canal: 'WEB',
      kilometraje: 0,
      anio: new Date().getFullYear(),
      sucursalId: this.sucursal || this.sucursales().find((s) => s['tipo'] === 'TALLER')?.id,
      aceptaNotificaciones: true,
    };
    this.availability.set(null);
    this.modal.set(kind);
    try {
      if (['vehiculo', 'ot', 'reserva'].includes(kind)) {
        this.clientes.set((await this.api.get<Pagina>('/clientes?limit=100')).items);
        this.vehiculos.set([]);
      }
    } catch (e) {
      this.fail(e);
    }
  }
  async findClients(term: string) {
    try {
      this.clientes.set(
        (await this.api.get<Pagina>('/clientes' + this.params({ limit: 100, q: term }))).items,
      );
    } catch (e) {
      this.fail(e);
    }
  }
  async ownerChanged() {
    this.form['vehiculoId'] = '';
    try {
      this.vehiculos.set(
        (
          await this.api.get<Pagina>(
            '/vehiculos' + this.params({ limit: 100, clienteId: this.form['clienteId'] }),
          )
        ).items,
      );
    } catch (e) {
      this.fail(e);
    }
  }
  async slots() {
    this.availability.set(null);
    this.form['inicio'] = '';
    if (!this.form['sucursalId'] || !this.form['fecha']) return;
    try {
      this.availability.set(
        await this.api.get(
          '/reservas/disponibilidad' +
            this.params({ sucursalId: this.form['sucursalId'], fecha: this.form['fecha'] }),
        ),
      );
    } catch (e) {
      this.fail(e);
    }
  }
  async submit() {
    await this.act(async () => {
      let payload: Record<string, unknown> = {};
      const kind = this.modal();
      let path = '';
      if (kind === 'cliente') {
        path = '/clientes';
        payload = {
          rut: this.form['rut'],
          nombre: this.form['nombre'],
          aceptaNotificaciones: this.form['aceptaNotificaciones'],
          ...(this.form['email'] ? { email: this.form['email'] } : {}),
          ...(this.form['telefono'] ? { telefono: this.form['telefono'] } : {}),
        };
      }
      if (kind === 'vehiculo') {
        path = '/vehiculos';
        payload = {
          clienteId: this.form['clienteId'],
          patente: this.form['patente'],
          marca: this.form['marca'],
          modelo: this.form['modelo'],
          anio: Number(this.form['anio']),
          kilometraje: Number(this.form['kilometraje']),
        };
      }
      if (kind === 'ot') {
        path = '/ordenes-trabajo';
        payload = {
          sucursalId: this.form['sucursalId'],
          clienteId: this.form['clienteId'],
          vehiculoId: this.form['vehiculoId'],
          motivoIngreso: this.form['motivo'],
          kilometraje: Number(this.form['kilometraje']),
          ...(this.form['reservaId'] ? { reservaId: this.form['reservaId'] } : {}),
        };
      }
      if (kind === 'reserva') {
        path = '/reservas';
        payload = {
          sucursalId: this.form['sucursalId'],
          clienteId: this.form['clienteId'],
          vehiculoId: this.form['vehiculoId'],
          motivo: this.form['motivo'],
          inicio: this.form['inicio'],
          canal: this.form['canal'],
        };
      }
      await this.api.post(path, payload);
      this.modal.set('');
      await this.load();
    }, 'Registro guardado correctamente.');
  }
  async inspect(order: Registro) {
    this.error.set('');
    this.portalUrl = '';
    this.actionState = '';
    this.comment = '';
    try {
      this.detail.set(await this.api.get('/ordenes-trabajo/' + order.id));
      this.budgetItems = [];
      this.form = {};
      if (this.api.can('MECANICO', 'JEFE_TALLER', 'BODEGA', 'RECEPCION'))
        this.parts.set((await this.api.get<Pagina>('/repuestos?limit=100')).items);
    } catch (e) {
      this.fail(e);
    }
  }
  async refreshDetail() {
    const id = this.detail()?.id;
    if (id) this.detail.set(await this.api.get('/ordenes-trabajo/' + id));
    await this.load();
  }
  async transition() {
    if (!this.actionState) return;
    await this.act(async () => {
      await this.api.post('/ordenes-trabajo/' + this.detail()!.id + '/estado', {
        estado: this.actionState,
        ...(this.comment ? { comentario: this.comment } : {}),
      });
      this.actionState = '';
      this.comment = '';
      await this.refreshDetail();
    }, 'Estado actualizado.');
  }
  async linkPortal() {
    await this.act(async () => {
      const r = await this.api.get('/ordenes-trabajo/' + this.detail()!.id + '/link-portal');
      this.portalUrl = r['url'];
    }, 'Enlace del cliente generado.');
  }
  async validateParts() {
    await this.act(async () => {
      await this.api.post(
        '/ordenes-trabajo/' + this.detail()!.id + '/validar-repuestos',
        this.detail()!['repuestos']?.length ? {} : { sinRepuestos: true },
      );
      await this.refreshDetail();
    }, 'Consumo de repuestos validado.');
  }
  async assignPart() {
    await this.act(async () => {
      await this.api.post('/ordenes-trabajo/' + this.detail()!.id + '/repuestos', {
        repuestoId: this.form['repuestoId'],
        cantidad: Number(this.form['cantidad'] || 1),
        garantiaMeses: Number(this.form['garantiaMeses'] || 0),
      });
      await this.refreshDetail();
    }, 'Repuesto asignado; stock actualizado.');
  }
  budgetPart(item: Record<string, any>) {
    const part = this.parts().find((p) => p.id === item['repuestoId']);
    if (part) {
      item['descripcion'] = part['nombre'];
      item['precioUnitario'] = part['precioVenta'];
    }
  }
  clearBudgetPart(item: Record<string, any>) {
    delete item['repuestoId'];
  }
  async removePart(id: string) {
    await this.act(async () => {
      await this.api.request(
        'DELETE',
        '/ordenes-trabajo/' + this.detail()!.id + '/repuestos/' + id,
      );
      await this.refreshDetail();
    }, 'Repuesto retirado; stock restituido.');
  }
  addBudgetItem() {
    this.budgetItems.push({
      tipo: 'MANO_OBRA',
      descripcion: '',
      cantidad: 1,
      precioUnitario: 0,
      garantiaMeses: 0,
    });
  }
  async createBudget() {
    await this.act(async () => {
      await this.api.post('/ordenes-trabajo/' + this.detail()!.id + '/presupuestos', {
        items: this.budgetItems,
        notas: this.form['notas'] || '',
      });
      this.budgetItems = [];
      await this.refreshDetail();
    }, 'Presupuesto guardado como borrador.');
  }
  async budgetAction(p: Registro, action: string) {
    await this.act(async () => {
      let payload: Record<string, unknown> = {};
      if (action === 'aprobar') {
        if (!this.form['firmante']?.trim())
          throw new Error('Indica el nombre del cliente que autorizó el presupuesto.');
        payload = { nombre: this.form['firmante'], canal: 'MOSTRADOR' };
      }
      if (action === 'rechazar') {
        if (!this.form['rechazo']?.trim()) throw new Error('Indica un motivo de rechazo.');
        payload = { motivo: this.form['rechazo'] };
      }
      await this.api.post('/presupuestos/' + p.id + '/' + action, payload);
      await this.refreshDetail();
    }, 'Presupuesto actualizado.');
  }
  async upload(event: Event) {
    const file = (event.target as HTMLInputElement).files?.[0];
    if (!file) return;
    await this.act(async () => {
      const data = new FormData();
      data.append('archivo', file);
      if (this.form['evidencia']) data.append('descripcion', this.form['evidencia']);
      await this.api.post('/ordenes-trabajo/' + this.detail()!.id + '/evidencias', data);
      await this.refreshDetail();
    }, 'Evidencia adjuntada.');
  }
  async downloadEvidence(id: string) {
    await this.act(
      () => this.api.archivo('/evidencias/' + id + '/archivo'),
      'Evidencia descargada.',
    );
  }
  async reservationAction(row: Registro, action: string) {
    await this.act(async () => {
      await this.api.post('/reservas/' + row.id + '/' + action);
      await this.load();
    }, 'Asistencia actualizada.');
  }
  async receive(row: Registro) {
    await this.open('ot');
    this.form = {
      ...this.form,
      clienteId: row['clienteId'],
      sucursalId: row['sucursalId'],
      reservaId: row.id,
      motivo: row['motivo'],
    };
    await this.ownerChanged();
    this.form['vehiculoId'] = row['vehiculoId'];
    this.form['kilometraje'] = row['vehiculo']?.kilometraje || 0;
  }
  async sync(id?: string) {
    await this.act(async () => {
      await this.api.post(
        id ? '/integraciones/sync/' + id + '/reintentar' : '/integraciones/sync/procesar',
      );
      await this.load();
    }, 'Sincronización solicitada.');
  }
  async stock(row: Registro) {
    this.selected.set(row);
    this.form = {
      sucursalId: this.sucursal || this.sucursales()[0]?.id,
      cantidad: 0,
      stockMinimo: 0,
      motivo: '',
    };
    this.modal.set('stock');
  }
  async saveStock() {
    await this.act(async () => {
      await this.api.post('/repuestos/' + this.selected()!.id + '/ajuste-stock', {
        sucursalId: this.form['sucursalId'],
        cantidad: Number(this.form['cantidad']),
        stockMinimo: Number(this.form['stockMinimo']),
        motivo: this.form['motivo'],
      });
      this.modal.set('');
      await this.load();
    }, 'Conteo de stock guardado.');
  }
  stockTotal(row: Registro) {
    return (row['stock'] || []).reduce((n: number, s: Registro) => n + Number(s['cantidad']), 0);
  }
  progress() {
    const a = this.context()?.actividades || [];
    return a.length
      ? Math.round(
          a.reduce((n: number, r: any) => n + r.avance * r.duracion, 0) /
            a.reduce((n: number, r: any) => n + r.duracion, 0),
        )
      : 0;
  }
  ganttLeft(item: any) {
    return (
      ((Date.parse(item.inicio) - Date.parse('2026-10-01')) /
        (Date.parse('2027-05-31') - Date.parse('2026-10-01'))) *
      100
    );
  }
  ganttWidth(item: any) {
    return Math.max(
      0.5,
      ((Date.parse(item.fin) - Date.parse(item.inicio) + 86400000) /
        (Date.parse('2027-05-31') - Date.parse('2026-10-01'))) *
        100,
    );
  }
  exportPlan() {
    const rows = [
      ['ID', 'Actividad', 'Inicio', 'Fin', 'Responsable', 'Avance %', 'Predecesoras'],
      ...(this.context()?.actividades || []).map((a: any) => [
        a.id,
        a.nombre,
        a.inicio,
        a.fin,
        a.responsable,
        a.avance,
        a.dependencias,
      ]),
    ];
    const csv =
      '\uFEFF' +
      rows
        .map((r) => r.map((v: any) => '"' + String(v ?? '').replaceAll('"', '""') + '"').join(';'))
        .join('\r\n');
    const url = URL.createObjectURL(new Blob([csv], { type: 'text/csv;charset=utf-8' }));
    const a = document.createElement('a');
    a.href = url;
    a.download = 'AutoFix_Planificacion.csv';
    a.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  }
}
