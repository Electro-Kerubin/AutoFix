import { Injectable, signal } from '@angular/core';

export interface Usuario {
  id: string;
  nombre: string;
  email: string;
  rol: string;
  sucursalId: string | null;
}
// Entity responses include relations selected by each backend endpoint.
export interface Registro {
  [key: string]: any;
  id: string;
}
export interface Pagina {
  items: Registro[];
  total: number;
  page: number;
  limit: number;
}

@Injectable({ providedIn: 'root' })
export class Api {
  readonly usuario = signal<Usuario | null>(null);
  private token = sessionStorage.getItem('autofix-token') || '';
  readonly ready = signal(false);
  async restore() {
    if (this.token) {
      try {
        this.usuario.set(await this.get<Usuario>('/auth/me'));
      } catch {
        this.logout();
      }
    }
    this.ready.set(true);
  }
  async login(email: string, password: string) {
    const result = await this.post<{ accessToken: string; usuario: Usuario }>('/auth/login', {
      email,
      password,
    });
    this.token = result.accessToken;
    sessionStorage.setItem('autofix-token', this.token);
    this.usuario.set(result.usuario);
  }
  logout() {
    this.token = '';
    sessionStorage.removeItem('autofix-token');
    this.usuario.set(null);
  }
  can(...roles: string[]) {
    const rol = this.usuario()?.rol;
    return rol === 'ADMIN' || (!!rol && roles.includes(rol));
  }
  get<T = Registro>(path: string) {
    return this.request<T>('GET', path);
  }
  post<T = Registro>(path: string, body: unknown = {}) {
    return this.request<T>('POST', path, body);
  }
  patch<T = Registro>(path: string, body: unknown) {
    return this.request<T>('PATCH', path, body);
  }
  async request<T>(method: string, path: string, body?: unknown): Promise<T> {
    const headers: Record<string, string> = {};
    if (this.token && !path.startsWith('/portal/'))
      headers['Authorization'] = `Bearer ${this.token}`;
    if (body !== undefined && !(body instanceof FormData))
      headers['Content-Type'] = 'application/json';
    let response: Response;
    try {
      response = await fetch('/api' + path, {
        method,
        headers,
        body:
          body instanceof FormData ? body : body === undefined ? undefined : JSON.stringify(body),
      });
    } catch {
      throw new Error(
        'No se pudo conectar con AutoFix. Comprueba que el servidor esté disponible.',
      );
    }
    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      if (
        response.status === 401 &&
        !path.startsWith('/auth/login') &&
        !path.startsWith('/portal/')
      )
        this.logout();
      throw new Error(
        Array.isArray(error.message)
          ? error.message.join(' · ')
          : error.message || `Error del servidor (${response.status})`,
      );
    }
    return response.status === 204 ? (undefined as T) : response.json();
  }
  async archivo(path: string) {
    const response = await fetch('/api' + path, {
      headers: { Authorization: `Bearer ${this.token}` },
    });
    if (!response.ok) throw new Error('No se pudo descargar la evidencia.');
    const url = URL.createObjectURL(await response.blob());
    const link = document.createElement('a');
    link.href = url;
    link.download = 'evidencia';
    link.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  }
}
