import api from '../lib/axios'
import type { Sincronizacion, CreateSincronizacionDto, ResolverItemDto } from '../types'

export const sincronizacionService = {
  getAll: () =>
    api.get<Sincronizacion[]>('/sincronizacion').then(r => r.data),

  getOne: (id: number) =>
    api.get<Sincronizacion>(`/sincronizacion/${id}`).then(r => r.data),

  ejecutar: (data: CreateSincronizacionDto) =>
    api.post<Sincronizacion>('/sincronizacion', data).then(r => r.data),

  resolverItem: (sincId: number, itemId: number, data: ResolverItemDto) =>
    api.post(`/sincronizacion/${sincId}/items/${itemId}/resolver`, data).then(r => r.data),

  resolverAuto: (sincId: number) =>
    api.post<Sincronizacion>(`/sincronizacion/${sincId}/resolver-auto`).then(r => r.data),
}
