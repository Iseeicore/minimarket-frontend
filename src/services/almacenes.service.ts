import api from '../lib/axios'
import type { Almacen, CreateAlmacenDto, UpdateAlmacenDto } from '../types'

export const almacenesService = {
  getAll: () => api.get<Almacen[]>('/almacenes').then(r => r.data),
  getOne: (id: number) => api.get<Almacen>(`/almacenes/${id}`).then(r => r.data),
  create: (data: CreateAlmacenDto) => api.post<Almacen>('/almacenes', data).then(r => r.data),
  update: (id: number, data: UpdateAlmacenDto) => api.patch<Almacen>(`/almacenes/${id}`, data).then(r => r.data),
  remove: (id: number) => api.delete(`/almacenes/${id}`).then(r => r.data),
}
