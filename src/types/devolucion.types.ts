import type { TipoDescuento } from './common.types'

export interface Devolucion {
  id: number
  ventaId: number
  procesadoPor: number   // usuarioId
  motivo: string | null
  notas: string | null
  creadoEn: string
  items?: ItemDevolucion[]
  venta?: { id: number; creadoEn: string; total: string; contacto?: { nombre: string } | null }
  usuario?: { id: number; nombre: string; rol: string }
}

export interface ItemDevolucion {
  id: number
  devolucionId: number
  itemVentaId: number
  cantidadDevuelta: number
  tipoDescuento: TipoDescuento
  valorDescuento: string  // Decimal
  montoDevuelto: string   // Decimal
  itemVenta?: { variante?: { nombre: string; sku: string | null } }
}

export interface CreateDevolucionDto {
  ventaId: number
  motivo?: string
  notas?: string
  items: CreateItemDevolucionDto[]
}

export interface CreateItemDevolucionDto {
  itemVentaId: number
  cantidadDevuelta: number
  tipoDescuento: TipoDescuento
  valorDescuento: number
  montoDevuelto: number
}
