import { Injectable, Logger } from '@nestjs/common';
import { CATALOGO_DEMO } from './catalogo-demo';
import { ConsumoPayload, InventarioClient, ItemInventario } from './clientes-externos';

/** Inventario simulado para desarrollo / demo, mientras no exista INVENTARIO_BASE_URL. */
@Injectable()
export class MockInventarioClient extends InventarioClient {
  private readonly logger = new Logger('Inventario(mock)');

  async listarStock(): Promise<ItemInventario[]> {
    return CATALOGO_DEMO;
  }

  async registrarConsumo(payload: ConsumoPayload): Promise<void> {
    this.logger.log(`Consumo ${payload.cantidad} × ${payload.repuestoCodigo} (OT ${payload.otNumero}) registrado`);
  }
}
