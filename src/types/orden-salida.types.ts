// ── Ordenes de Salida ─────────────────────────────────────────────────────────
// Reemplaza sincronización — jefe_tienda solicita productos de almacén

export type TipoOrden = 'VENTA' | 'TRANSFERENCIA'
export type EstadoOrden = 'PENDIENTE' | 'COMPLETADA' | 'CANCELADA'
export type OrigenStock = 'ALMACEN' | 'TIENDA'

export interface OrdenSalidaDetalle {
  id: number
  ordenSalidaId: number
  varianteId: number
  cantidad: number
  origen: OrigenStock
  variante?: {
    id: number
    nombre: string
    sku: string | null
    precioVenta: string
    producto?: { id: number; nombre: string }
    unidad?: { id: number; nombre: string; abreviatura: string }
  }
}

export interface OrdenSalida {
  id: number
  numero: number
  tipo: TipoOrden
  estado: EstadoOrden
  almacenId: number
  solicitadoPor: number
  totalProductos: number
  totalUnidades: number
  creadoEn: string
  completadoEn: string | null
  detalles: OrdenSalidaDetalle[]
  solicitante?: { id: number; nombre: string }
}

export interface CreateOrdenSalidaDto {
  almacenId: number
  tipo: TipoOrden
  items: CreateOrdenSalidaItemDto[]
}

export interface CreateOrdenSalidaItemDto {
  varianteId: number
  cantidad: number
  origen: OrigenStock
}

// ── Stock Dual ────────────────────────────────────────────────────────────────
// Vista unificada: cuánto hay en almacén y cuánto en tienda
export interface StockDual {
  varianteId: number
  almacen: number
  tienda: number
  total: number
  inicioHoy: number
  salidaHoy: number
  ingresoHoy: number
  stockMinimo: number
  variante?: {
    id: number
    nombre: string
    sku: string | null
    precioVenta: string
    producto?: { id: number; nombre: string }
    unidad?: { id: number; nombre: string; abreviatura: string }
  }
}
