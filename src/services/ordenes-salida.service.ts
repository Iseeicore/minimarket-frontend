import api from '../lib/axios'
import type { OrdenSalida, CreateOrdenSalidaDto, StockDual, PaginatedResult } from '../types'

export interface OrdenSalidaFilters {
  almacenId?: number
  desde?: string
  hasta?: string
  page?: number
  limit?: number
}

export const ordenesSalidaService = {
  getPaginated: (filters: OrdenSalidaFilters) =>
    api.get<PaginatedResult<OrdenSalida>>('/ordenes-salida', { params: filters }).then(r => r.data),

  /** Legacy — trae sin paginar (limit alto) */
  getAll: (almacenId: number) =>
    api.get<PaginatedResult<OrdenSalida>>('/ordenes-salida', { params: { almacenId, limit: 50 } }).then(r => r.data.data),

  getOne: (id: number) =>
    api.get<OrdenSalida>(`/ordenes-salida/${id}`).then(r => r.data),

  create: (dto: CreateOrdenSalidaDto) =>
    api.post<OrdenSalida>('/ordenes-salida', dto).then(r => r.data),

  completar: (id: number) =>
    api.patch<OrdenSalida>(`/ordenes-salida/${id}/completar`).then(r => r.data),

  cancelar: (id: number) =>
    api.patch<OrdenSalida>(`/ordenes-salida/${id}/cancelar`).then(r => r.data),

  // Stock dual: almacén + tienda en una sola consulta
  getStockDual: (almacenId: number) =>
    api.get<StockDual[]>(`/stock/dual/${almacenId}`).then(r => r.data),
}
