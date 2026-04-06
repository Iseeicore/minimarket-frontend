import api from '../lib/axios'
import type { Devolucion, CreateDevolucionDto, PaginatedResult } from '../types'

export const devolucionesService = {
  getAll:  (page = 1, limit = 20)      => api.get<PaginatedResult<Devolucion>>('/devoluciones', { params: { page, limit } }).then(r => r.data),
  getOne:  (id: number)                => api.get<Devolucion>(`/devoluciones/${id}`).then(r => r.data),
  create:  (data: CreateDevolucionDto) => api.post<Devolucion>('/devoluciones', data).then(r => r.data),
}
