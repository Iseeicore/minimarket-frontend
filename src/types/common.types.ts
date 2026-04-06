export interface PaginationMeta {
  total: number
  page: number
  limit: number
  totalPages: number
}

export interface PaginatedResult<T> {
  data: T[]
  meta: PaginationMeta
}

export type TipoDescuento = 'POR_UNIDAD' | 'POR_TOTAL' | 'NINGUNO'
export type MetodoPago = 'EFECTIVO' | 'YAPE' | 'TRANSFERENCIA' | 'OTRO'
export type RolUsuario = 'ADMIN' | 'JEFE_VENTA' | 'JEFE_ALMACEN' | 'ALMACENERO'
export type TipoContacto = 'CLIENTE' | 'PROVEEDOR' | 'AMBOS'
export type EstadoCompra = 'PENDIENTE' | 'PARCIAL' | 'PAGADO'
export type EstadoVenta = 'COMPLETADA' | 'CANCELADA' | 'DEVUELTA'
export type EstadoCaja = 'ABIERTA' | 'CERRADA'
export type TipoMovStock = 'COMPRA_ENTRADA' | 'VENTA_SALIDA' | 'DEVOLUCION_ENTRADA' | 'AJUSTE' | 'TRANSFERENCIA_SALIDA'
export type TipoMovCaja = 'INGRESO' | 'EGRESO' | 'AJUSTE'

// Comprobantes fiscales
export type TipoComprobante = 'TICKET' | 'BOLETA' | 'FACTURA'

// Cuadernos virtuales (RegistroAlmacen / RegistroTienda)
export type TipoMovRegistro = 'SALIDA' | 'ENTRADA' | 'TRANSFERENCIA'

// Sincronización
export type TipoSincronizacion   = 'MANUAL' | 'CIERRE_DIA' | 'PROGRAMADA'
export type EstadoSincronizacion = 'PENDIENTE' | 'EN_PROCESO' | 'COMPLETADA' | 'CON_DIFERENCIAS'
export type EstadoReconciliacion = 'COINCIDE' | 'DIFERENCIA' | 'SIN_CONTRAPARTIDA' | 'PENDIENTE_REVISION' | 'RESUELTO'

// Módulos de la app (usado en permisos por rol)
export type ModuloApp =
  | 'VENTAS' | 'COMPRAS' | 'CAJA' | 'DEVOLUCIONES' | 'STOCK'
  | 'PRODUCTOS' | 'VARIANTES' | 'CONTACTOS' | 'BITACORA' | 'DASHBOARD'
  | 'REGISTRO_ALMACEN' | 'REGISTRO_TIENDA' | 'SINCRONIZACION'
