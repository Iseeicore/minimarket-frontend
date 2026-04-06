import api from '../lib/axios'
import type { RegistroTienda, CreateRegistroTiendaDto, PaginatedResult } from '../types'

export const registrosTiendaService = {
  // Backend devuelve PaginatedResult — extraemos solo el array de data
  getAll: () =>
    api.get<PaginatedResult<RegistroTienda>>('/registros-tienda').then(r => r.data.data),

  getOne: (id: number) =>
    api.get<RegistroTienda>(`/registros-tienda/${id}`).then(r => r.data),

  create: (data: CreateRegistroTiendaDto) =>
    api.post<RegistroTienda>('/registros-tienda', data).then(r => r.data),

  marcarDevuelto: (id: number, notas?: string) =>
    api.patch<RegistroTienda>(`/registros-tienda/${id}/devolver`, { notas }).then(r => r.data),
}
