import api from '../lib/axios'
import type { StockAlmacen, MovimientoStock, PaginatedResult } from '../types'

export const stockService = {
  getAll:          ()                                              => api.get<StockAlmacen[]>('/stock').then(r => r.data),
  getByAlmacen:    (almacenId: number)                            => api.get<StockAlmacen[]>(`/stock/almacen/${almacenId}`).then(r => r.data),
  getMovimientos:  (page = 1, limit = 20, almacenId?: number)     =>
    api.get<PaginatedResult<MovimientoStock>>('/stock/movimientos', { params: { page, limit, ...(almacenId ? { almacenId } : {}) } }).then(r => r.data),
}
