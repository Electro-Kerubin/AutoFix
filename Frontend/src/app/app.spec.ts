import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { App } from './app';
import { Api } from './api';

describe('AutoFix sesión', () => {
  beforeEach(() => {
    sessionStorage.clear();
    TestBed.configureTestingModule({ imports: [App], providers: [provideRouter([{ path: '**', children: [] }])] });
  });
  afterEach(() => {
    vi.restoreAllMocks();
    sessionStorage.clear();
  });
  it('muestra acceso sin renderizar datos operativos para usuarios sin sesión', async () => {
    const fixture = TestBed.createComponent(App);
    await fixture.whenStable();
    expect(fixture.nativeElement.querySelector('h2').textContent).toContain('Ingresa a AutoFix');
    expect(fixture.nativeElement.querySelector('.sidebar')).toBeNull();
  });
  it('muestra a recepción sólo la operación de su rol', async () => {
    const fixture = TestBed.createComponent(App);
    const api = TestBed.inject(Api);
    api.usuario.set({
      id: 'recepcion',
      nombre: 'Recepción',
      email: 'recepcion@autofix.cl',
      rol: 'RECEPCION',
      sucursalId: 'santiago',
    });
    api.ready.set(true);
    await fixture.whenStable();
    const text = fixture.nativeElement.querySelector('nav').textContent;
    expect(text).toContain('Agenda de taller');
    expect(text).toContain('Órdenes de trabajo');
    expect(text).toContain('Garantías e historial');
    expect(text).not.toContain('Integraciones');
    expect(text).not.toContain('Indicadores de operación');
    expect(text).not.toContain('Administrador KPI');
  });
  it('oculta la operación y las integraciones al usuario de proyecto', async () => {
    const fixture = TestBed.createComponent(App);
    const api = TestBed.inject(Api);
    api.usuario.set({
      id: 'recepcion',
      nombre: 'Recepción',
      email: 'recepcion@autofix.cl',
      rol: 'USUARIO_PROYECTO',
      sucursalId: null,
    });
    api.ready.set(true);
    await fixture.whenStable();
    const text = fixture.nativeElement.querySelector('nav').textContent;
    expect(text).toContain('Actividades y dependencias');
    expect(text).toContain('Tablero de cambios');
    expect(text).not.toContain('Agenda de taller');
    expect(text).not.toContain('Integraciones');
    expect(text).toContain('Administrador KPI');
  });
  it('descarta la sesión cuando la API responde 401', async () => {
    const api = TestBed.inject(Api);
    api.usuario.set({
      id: 'a',
      nombre: 'Admin',
      email: 'a@autofix.cl',
      rol: 'ADMIN',
      sucursalId: null,
    });
    vi.spyOn(globalThis, 'fetch').mockResolvedValue(
      new Response(JSON.stringify({ message: 'Sesión vencida' }), { status: 401 }),
    );
    await expect(api.get('/clientes')).rejects.toThrow('Sesión vencida');
    expect(api.usuario()).toBeNull();
  });
  it('conserva el detalle de validación enviado por el backend', async () => {
    const api = TestBed.inject(Api);
    vi.spyOn(globalThis, 'fetch').mockResolvedValue(
      new Response(JSON.stringify({ message: ['RUT inválido', 'nombre requerido'] }), {
        status: 400,
      }),
    );
    await expect(api.post('/clientes', {})).rejects.toThrow('RUT inválido · nombre requerido');
  });
});
