import type { TipoSincronizacion, EstadoSincronizacion, EstadoReconciliacion } from './common.types'

// ── Sincronización ────────────────────────────────────────────────────────────
// Solo JEFE_VENTA y ADMIN pueden ejecutarla
// Compara RegistroAlmacen vs RegistroTienda en un período
export interface Sincronizacion {
  id: number
  almacenId: number
  tipo: TipoSincronizacion
  estado: EstadoSincronizacion
  periodoDesde: string
  periodoHasta: string
  totalCoincidencias: number
  totalDiferencias: number
  ejecutadoPor: number
  creadoEn: string
  completadoEn: string | null
  almacen?: { id: number; nombre: string }
  reconciliacion?: ReconciliacionItem[]
}

export interface CreateSincronizacionDto {
  almacenId: number
  tipo: TipoSincronizacion
  periodoDesde: string  // ISO date string
  periodoHasta: string  // ISO date string
}

// ── Ítem de reconciliación ────────────────────────────────────────────────────
// diferencia = cantidadAlmacen - cantidadTienda (puede ser negativa)
// SIN_CONTRAPARTIDA → transferencia directa sin registro en tienda
export interface ReconciliacionItem {
  id: number
  sincronizacionId: number
  varianteId: number
  cantidadAlmacen: number
  cantidadTienda: number
  diferencia: number        // almacen - tienda — puede ser negativo
  estado: EstadoReconciliacion
  notas: string | null
  resueltoPor: number | null
  resueltoEn: string | null
  variante?: { id: number; nombre: string; sku: string | null }
}

export interface ResolverItemDto {
  estado: EstadoReconciliacion
  notas?: string
}
