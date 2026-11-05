import { Injectable, Logger } from '@nestjs/common';

/*
 * Puertos hacia los sistemas existentes (EXC-01 / EXC-02: no se reemplazan ni se modifican).
 * Los contratos de datos de las implementaciones HTTP son una propuesta inicial: deben ajustarse a la
 * documentación real de las APIs cuando el proveedor del ERP la entregue (supuesto SUP-01, WBS 1.2.4.2 y 1.2.5.2).
 */

export interface LineaOtCerrada {
  tipo: string;
  descripcion: string;
  cantidad: number;
  precioUnitario: number;
}

export interface OtCerradaPayload {
  otId: string;
  numero: string;
  sucursalCodigo: string;
  cliente: { rut: string; nombre: string };
  vehiculo: { patente: string; marca: string; modelo: string };
  fechaIngreso: string;
  fechaEntrega: string;
  total: number;
  lineas: LineaOtCerrada[];
}

export interface ConsumoPayload {
  otId: string;
  otNumero: string;
  sucursalCodigo: string;
  repuestoCodigo: string;
  /** Positivo = consumo; negativo = reversa. */
  cantidad: number;
}

export interface ItemInventario {
  codigo: string;
  nombre: string;
  categoria?: string;
  precio: number;
  stock: { sucursalCodigo: string; cantidad: number; minimo?: number; ubicacion?: string }[];
}

export abstract class ErpClient {
  abstract enviarOtCerrada(payload: OtCerradaPayload): Promise<{ referencia: string }>;
}

export abstract class InventarioClient {
  abstract listarStock(): Promise<ItemInventario[]>;
  abstract registrarConsumo(payload: ConsumoPayload): Promise<void>;
}

const TIMEOUT_MS = 10_000;

async function llamar<T>(url: string, apiKey: string, init: RequestInit & { idempotencyKey?: string } = {}): Promise<T> {
  const { idempotencyKey, ...resto } = init;
  const respuesta = await fetch(url, {
    ...resto,
    signal: AbortSignal.timeout(TIMEOUT_MS),
    headers: {
      'Content-Type': 'application/json',
      Accept: 'application/json',
      ...(apiKey ? { Authorization: `Bearer ${apiKey}` } : {}),
      ...(idempotencyKey ? { 'Idempotency-Key': idempotencyKey } : {}),
    },
  });
  if (!respuesta.ok) {
    const detalle = (await respuesta.text().catch(() => '')).slice(0, 300);
    throw new Error(`HTTP ${respuesta.status} ${respuesta.statusText} en ${url}: ${detalle}`);
  }
  return (respuesta.status === 204 ? undefined : await respuesta.json()) as T;
}

export class HttpErpClient extends ErpClient {
  constructor(
    private readonly baseUrl: string,
    private readonly apiKey: string,
  ) {
    super();
  }

  async enviarOtCerrada(payload: OtCerradaPayload): Promise<{ referencia: string }> {
    const respuesta = await llamar<{ id?: string; referencia?: string }>(`${this.baseUrl}/ordenes-trabajo`, this.apiKey, {
      method: 'POST',
      body: JSON.stringify(payload),
      idempotencyKey: `sugo-ot-${payload.otId}`,
    });
    return { referencia: respuesta?.referencia ?? respuesta?.id ?? payload.numero };
  }
}

export class HttpInventarioClient extends InventarioClient {
  constructor(
    private readonly baseUrl: string,
    private readonly apiKey: string,
  ) {
    super();
  }

  listarStock(): Promise<ItemInventario[]> {
    return llamar<ItemInventario[]>(`${this.baseUrl}/repuestos`, this.apiKey);
  }

  async registrarConsumo(payload: ConsumoPayload): Promise<void> {
    await llamar<void>(`${this.baseUrl}/consumos`, this.apiKey, {
      method: 'POST',
      body: JSON.stringify(payload),
      idempotencyKey: `sugo-consumo-${payload.otId}-${payload.repuestoCodigo}-${payload.cantidad}`,
    });
  }
}

/** Se usa mientras no haya URL configurada (desarrollo / demo): simula el sistema externo. */
@Injectable()
export class MockErpClient extends ErpClient {
  private readonly logger = new Logger('ERP(mock)');

  async enviarOtCerrada(payload: OtCerradaPayload): Promise<{ referencia: string }> {
    this.logger.log(`OT ${payload.numero} recibida por el ERP simulado (total $${payload.total})`);
    return { referencia: `MOCK-${payload.numero}` };
  }
}
