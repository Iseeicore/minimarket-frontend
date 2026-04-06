import api from '../lib/axios'
import type { EntradaBitacora, CreateEntradaBitacoraDto, PaginatedResult } from '../types'

export const bitacoraService = {
  getAll:  (page = 1, limit = 20, almacenId?: number) =>
    api.get<PaginatedResult<EntradaBitacora>>('/bitacora', { params: { page, limit, ...(almacenId ? { almacenId } : {}) } }).then(r => r.data),
  create:  (data: CreateEntradaBitacoraDto)  => api.post<EntradaBitacora>('/bitacora', data).then(r => r.data),
}
