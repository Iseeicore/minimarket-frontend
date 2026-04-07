import api from '../lib/axios'
import type { Venta, CreateVentaDto } from '../types'

export const ventasService = {
  getAll:  ()                        => api.get<Venta[]>('/ventas').then(r => r.data),
  getHoy:  (almacenId?: number)       => api.get<Venta[]>('/ventas/hoy', { params: almacenId ? { almacenId } : undefined }).then(r => r.data),
  getOne:  (id: number)              => api.get<Venta>(`/ventas/${id}`).then(r => r.data),
  create:  (data: CreateVentaDto)    => api.post<Venta>('/ventas', data).then(r => r.data),
}
