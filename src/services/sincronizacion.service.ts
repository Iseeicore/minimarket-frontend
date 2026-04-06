import api from '../lib/axios'
import type { Sincronizacion, CreateSincronizacionDto, ResolverItemDto, PaginatedResult } from '../types'

export const sincronizacionService = {
  // Backend devuelve PaginatedResult — extraemos solo el array de data
  getAll: () =>
    api.get<PaginatedResult<Sincronizacion>>('/sincronizacion').then(r => r.data.data),

  getOne: (id: number) =>
    api.get<Sincronizacion>(`/sincronizacion/${id}`).then(r => r.data),

  ejecutar: (data: CreateSincronizacionDto) =>
    api.post<Sincronizacion>('/sincronizacion', data).then(r => r.data),

  resolverItem: (sincId: number, itemId: number, data: ResolverItemDto) =>
    api.post(`/sincronizacion/${sincId}/items/${itemId}/resolver`, data).then(r => r.data),

  resolverAuto: (sincId: number) =>
    api.post<Sincronizacion>(`/sincronizacion/${sincId}/resolver-auto`).then(r => r.data),
}
