import type { EstadoCompra } from './common.types'

export interface OrdenCompra {
  id: number
  almacenId: number
  contactoId: number | null
  estado: EstadoCompra
  total: string          // Decimal serializado por Prisma
  notas: string | null
  recibidoEn: string | null
  creadoEn: string
  items?: ItemCompra[]
  pagos?: PagoCompra[]
  contacto?: { id: number; nombre: string } | null
  almacen?: { id: number; nombre: string }
}

export interface ItemCompra {
  id: number
  ordenCompraId: number
  varianteId: number
  cantidad: number
  costoUnitario: string  // Decimal
  subtotal: string       // Decimal
  variante?: { id: number; nombre: string; sku: string | null }
}

export interface PagoCompra {
  id: number
  ordenCompraId: number
  monto: string          // Decimal
  pagadoEn: string
  notas: string | null
}

export interface CreateOrdenCompraDto {
  almacenId: number
  contactoId?: number
  notas?: string
  items: CreateItemCompraDto[]
}

export interface CreateItemCompraDto {
  varianteId: number
  cantidad: number
  costoUnitario: number
}

export interface CreatePagoCompraDto {
  monto: number
  notas?: string
}
