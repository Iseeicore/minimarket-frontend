import type { Variante } from './producto.types'
import type { TipoMovStock } from './common.types'

export interface MovimientoStock {
  id:              number
  almacenId:       number
  varianteId:      number
  tipo:            TipoMovStock
  referenciaTipo:  string | null
  referenciaId:    number | null
  cantidad:        number
  cantidadAntes:   number
  cantidadDespues: number
  creadoEn:        string
  creadoPor:       number
  almacen?:        { id: number; nombre: string }
  variante?:       { id: number; nombre: string; sku: string | null; producto?: { id: number; nombre: string } }
  usuario?:        { id: number; nombre: string }
}

export interface StockAlmacen {
  id: number
  almacenId: number
  varianteId: number
  cantidad: number
  variante?: Variante & {
    unidad?: { id: number; nombre: string; abreviatura: string }
    producto?: { id: number; nombre: string }
  }
}
