import type { TipoMovRegistro } from './common.types'

// ── Cuaderno del JEFE_ALMACEN ─────────────────────────────────────────────────
// Auto-generado al crear Nota de Venta; también manual para ENTRADA/TRANSFERENCIA
export interface RegistroAlmacen {
  id: number
  almacenId: number
  varianteId: number
  ventaId: number | null
  cantidad: number
  tipo: TipoMovRegistro
  notas: string | null
  devuelto: boolean
  creadoPor: number
  creadoEn: string
  variante?: { id: number; nombre: string; sku: string | null }
  almacen?: { id: number; nombre: string }
  venta?: { id: number; tipoComprobante: string; serie: string | null; nroComprobante: string | null } | null
}

export interface CreateRegistroAlmacenDto {
  varianteId: number
  cantidad: number
  tipo: TipoMovRegistro
  notas?: string
}

// ── Cuaderno del JEFE_VENTA ───────────────────────────────────────────────────
// Entrada manual libre — no vinculada a Nota de Venta
export interface RegistroTienda {
  id: number
  almacenId: number
  varianteId: number
  cantidad: number
  tipo: TipoMovRegistro
  notas: string | null
  devuelto: boolean
  creadoPor: number
  creadoEn: string
  variante?: { id: number; nombre: string; sku: string | null }
  almacen?: { id: number; nombre: string }
}

export interface CreateRegistroTiendaDto {
  varianteId: number
  cantidad: number
  tipo: TipoMovRegistro
  notas?: string
}
