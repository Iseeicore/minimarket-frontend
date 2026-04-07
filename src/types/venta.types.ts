import type { EstadoVenta, MetodoPago, TipoDescuento, TipoComprobante } from './common.types'

export interface Venta {
  id: number
  almacenId: number
  cajaId: number
  contactoId: number | null
  estado: EstadoVenta
  metodoPago: MetodoPago
  subtotal: string        // Decimal
  descuentoTotal: string  // Decimal
  igv: string             // Decimal — default 0
  total: string           // Decimal
  tipoComprobante: TipoComprobante  // default TICKET
  serie: string | null    // ej. "B001"
  nroComprobante: string | null     // 10 dígitos ej. "0000000001"
  notas: string | null
  creadoEn: string
  creadoPor: number       // usuarioId
  items?: ItemVenta[]
  contacto?: { id: number; nombre: string } | null
}

export interface ItemVenta {
  id: number
  ventaId: number
  varianteId: number
  cantidad: number
  precioUnitario: string  // Decimal
  tipoDescuento: TipoDescuento
  valorDescuento: string  // Decimal
  subtotal: string        // Decimal
  variante?: { id: number; nombre: string; sku: string | null; unidad?: { abreviatura: string }; producto?: { nombre: string } }
}

// Ítem en el carrito local — estado UI antes de confirmar la venta
export interface ItemCarrito {
  varianteId: number
  nombre: string
  sku: string | null
  unidadAbrev: string
  precioUnitario: number
  stockDisponible: number
  cantidad: number
}

export interface CreateVentaDto {
  almacenId: number
  cajaId: number
  contactoId?: number
  metodoPago: MetodoPago
  tipoComprobante?: TipoComprobante  // default TICKET si se omite
  serie?: string
  nroComprobante?: string
  notas?: string
  items: CreateItemVentaDto[]
}

export interface CreateItemVentaDto {
  varianteId: number
  cantidad: number
  precioUnitario: number
  // Siempre NINGUNO por defecto en la vista POS — descuentos son opcionales
  tipoDescuento: TipoDescuento
  valorDescuento: number
}
