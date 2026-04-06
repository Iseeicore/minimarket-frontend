import api from '../lib/axios'
import type { UnidadMedida, CreateUnidadMedidaDto, UpdateUnidadMedidaDto } from '../types'

export const unidadesMedidaService = {
  getAll: () => api.get<UnidadMedida[]>('/unidades-medida').then(r => r.data),
  getOne: (id: number) => api.get<UnidadMedida>(`/unidades-medida/${id}`).then(r => r.data),
  create: (data: CreateUnidadMedidaDto) => api.post<UnidadMedida>('/unidades-medida', data).then(r => r.data),
  update: (id: number, data: UpdateUnidadMedidaDto) => api.patch<UnidadMedida>(`/unidades-medida/${id}`, data).then(r => r.data),
  remove: (id: number) => api.delete(`/unidades-medida/${id}`).then(r => r.data),
}
