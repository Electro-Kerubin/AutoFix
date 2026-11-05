import { ItemInventario } from './clientes-externos';

/** Catálogo de ejemplo: lo usa el inventario simulado y el seed de desarrollo. */
export const CATALOGO_DEMO: ItemInventario[] = [
  { codigo: 'FIL-ACE-001', nombre: 'Filtro de aceite', categoria: 'Filtros', precio: 8900 },
  { codigo: 'FIL-AIR-001', nombre: 'Filtro de aire', categoria: 'Filtros', precio: 12500 },
  { codigo: 'FIL-CAB-001', nombre: 'Filtro de cabina', categoria: 'Filtros', precio: 11900 },
  { codigo: 'LUB-5W30-1L', nombre: 'Aceite sintético 5W30 (litro)', categoria: 'Lubricantes', precio: 9800 },
  { codigo: 'FRE-PAS-DEL', nombre: 'Pastillas de freno delanteras', categoria: 'Frenos', precio: 34900 },
  { codigo: 'FRE-DIS-DEL', nombre: 'Disco de freno delantero', categoria: 'Frenos', precio: 52000 },
  { codigo: 'FRE-LIQ-500', nombre: 'Líquido de frenos DOT4 500ml', categoria: 'Frenos', precio: 6500 },
  { codigo: 'ENC-BUJ-001', nombre: 'Bujía de encendido', categoria: 'Motor', precio: 7200 },
  { codigo: 'MOT-COR-DIS', nombre: 'Kit correa de distribución', categoria: 'Motor', precio: 89900 },
  { codigo: 'ELE-BAT-60', nombre: 'Batería 60Ah', categoria: 'Eléctrico', precio: 79900 },
  { codigo: 'SUS-AMO-DEL', nombre: 'Amortiguador delantero', categoria: 'Suspensión', precio: 64900 },
  { codigo: 'ACC-LIM-001', nombre: 'Limpiaparabrisas (par)', categoria: 'Accesorios', precio: 15900 },
].map((item, indice) => ({
  ...item,
  stock: [
    { sucursalCodigo: 'BODEGA', cantidad: 40 + indice * 3, minimo: 10, ubicacion: `A-${indice + 1}` },
    { sucursalCodigo: 'STGO', cantidad: 6 + (indice % 5), minimo: 4, ubicacion: `B-${indice + 1}` },
    { sucursalCodigo: 'RGUA', cantidad: 4 + (indice % 4), minimo: 3, ubicacion: `B-${indice + 1}` },
    { sucursalCodigo: 'VINA', cantidad: 5 + (indice % 3), minimo: 3, ubicacion: `B-${indice + 1}` },
  ],
}));
