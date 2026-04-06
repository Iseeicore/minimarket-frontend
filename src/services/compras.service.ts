import api from '../lib/axios'
import type { OrdenCompra, CreateOrdenCompraDto, PagoCompra, CreatePagoCompraDto, PaginatedResult } from '../types'

export const comprasService = {
  getAll:         (page = 1, limit = 20)          => api.get<PaginatedResult<OrdenCompra>>('/compras', { params: { page, limit } }).then(r => r.data),
  getOne:         (id: number)                   => api.get<OrdenCompra>(`/compras/${id}`).then(r => r.data),
  create:         (data: CreateOrdenCompraDto)   => api.post<OrdenCompra>('/compras', data).then(r => r.data),
  recibirOrden:   (id: number)                   => api.post<OrdenCompra>(`/compras/${id}/recibir`).then(r => r.data),
  registrarPago:  (id: number, data: CreatePagoCompraDto) => api.post<PagoCompra>(`/compras/${id}/pagos`, data).then(r => r.data),
  remove:         (id: number)                   => api.delete(`/compras/${id}`).then(r => r.data),
}
