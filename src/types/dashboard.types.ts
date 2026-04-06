import type { MetodoPago } from './common.types'

/** Una fila del endpoint /dashboard/lista-dia/cruda — una línea por ItemVenta */
export interface FilaCrudaDia {
  ventaId:        number
  hora:           string       // ISO
  metodoPago:     MetodoPago
  varianteId:     number
  producto:       string       // "Agua"
  variante:       string       // "10 LT"
  unidad:         string       // "LT"
  cantidad:       number
  precioUnitario: number
  subtotal:       number
}

/** Una fila del endpoint /dashboard/lista-dia — agrupado por variante */
export interface FilaOrganizadaDia {
  varianteId:     number
  nombre:         string       // "10 LT"
  producto:       string       // "Agua"
  unidad:         string       // "LT"
  totalCantidad:  number
  precioUnitario: number
  totalSubtotal:  number
}

/** Un registro de la tabla resumenes_dia — generado al cerrar caja */
export interface ResumenDia {
  id:                 number
  fecha:              string   // ISO — solo la fecha "2026-04-03T00:00:00.000Z"
  almacen:            string
  almacenId:          number
  totalVentas:        number
  montoTotal:         number
  montoPorEfectivo:   number
  montoPorYape:       number
  montoTransferencia: number
  montoOtro:          number
  totalDevoluciones:  number
}

/** Respuesta paginada del endpoint /dashboard/historico */
export interface HistoricoResponse {
  data: ResumenDia[]
  meta: {
    total:      number
    page:       number
    limit:      number
    totalPages: number
  }
}
