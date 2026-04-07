import api from '../lib/axios'
import type { RegistroAlmacen, CreateRegistroAlmacenDto, PaginatedResult, PendienteTienda } from '../types'

export interface RegistroAlmacenFilters {
  page?: number
  limit?: number
  almacenId?: number
  desde?: string
  hasta?: string
}

export const registrosAlmacenService = {
  /** Paginado con filtros — devuelve { data, meta } */
  getPaginated: (filters: RegistroAlmacenFilters = {}) =>
    api.get<PaginatedResult<RegistroAlmacen>>('/registros-almacen', { params: filters }).then(r => r.data),

  /** Legacy — trae sin paginar */
  getAll: () =>
    api.get<PaginatedResult<RegistroAlmacen>>('/registros-almacen').then(r => r.data.data),

  getByVenta: (ventaId: number) =>
    api.get<RegistroAlmacen[]>(`/registros-almacen/por-venta/${ventaId}`).then(r => r.data),

  getOne: (id: number) =>
    api.get<RegistroAlmacen>(`/registros-almacen/${id}`).then(r => r.data),

  create: (data: CreateRegistroAlmacenDto) =>
    api.post<RegistroAlmacen>('/registros-almacen', data).then(r => r.data),

  marcarDevuelto: (id: number, notas?: string) =>
    api.patch<RegistroAlmacen>(`/registros-almacen/${id}/devolver`, { notas }).then(r => r.data),

  getPendientesTienda: (almacenId: number, horas = 24) =>
    api.get<PendienteTienda[]>(
      `/registros-almacen/pendientes-tienda?almacenId=${almacenId}&horas=${horas}`,
    ).then(r => r.data),
}
