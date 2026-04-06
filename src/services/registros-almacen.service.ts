import api from '../lib/axios'
import type { RegistroAlmacen, CreateRegistroAlmacenDto } from '../types'

export const registrosAlmacenService = {
  getAll: () =>
    api.get<RegistroAlmacen[]>('/registros-almacen').then(r => r.data),

  getByVenta: (ventaId: number) =>
    api.get<RegistroAlmacen[]>(`/registros-almacen/por-venta/${ventaId}`).then(r => r.data),

  getOne: (id: number) =>
    api.get<RegistroAlmacen>(`/registros-almacen/${id}`).then(r => r.data),

  create: (data: CreateRegistroAlmacenDto) =>
    api.post<RegistroAlmacen>('/registros-almacen', data).then(r => r.data),

  marcarDevuelto: (id: number, notas?: string) =>
    api.patch<RegistroAlmacen>(`/registros-almacen/${id}/devolver`, { notas }).then(r => r.data),
}
