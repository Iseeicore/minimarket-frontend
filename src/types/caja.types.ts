import type { EstadoCaja, TipoMovCaja, MetodoPago } from './common.types'

export interface Caja {
  id: number
  almacenId: number
  abiertoPor: number     // usuarioId
  abiertoEn: string
  cerradoEn: string | null
  montoApertura: string  // Decimal
  montoCierre: string | null
  estado: EstadoCaja
  almacen?: { id: number; nombre: string }
}

export interface MovimientoCaja {
  id: number
  cajaId: number
  tipo: TipoMovCaja
  referenciaTipo: string | null
  referenciaId: number | null
  monto: string          // Decimal
  descripcion: string | null
  creadoEn: string
}

export interface ResumenMetodoPago {
  metodoPago: MetodoPago
  total: number
}

export interface AbrirCajaDto {
  almacenId: number
  montoApertura: number
}

export interface CerrarCajaDto {
  montoCierre: number
}

export interface CreateMovimientoCajaDto {
  tipo: TipoMovCaja
  monto: number
  descripcion?: string
}
