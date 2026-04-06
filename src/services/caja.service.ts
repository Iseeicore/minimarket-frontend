import api from '../lib/axios'
import type { Caja, MovimientoCaja, AbrirCajaDto, CerrarCajaDto, CreateMovimientoCajaDto } from '../types'

export const cajaService = {
  getAll:          ()                                            => api.get<Caja[]>('/caja').then(r => r.data),
  getActiva:       (almacenId: number)                          => api.get<Caja>(`/caja/activa/${almacenId}`).then(r => r.data),
  getOne:          (id: number)                                 => api.get<Caja>(`/caja/${id}`).then(r => r.data),
  getMovimientos:  (id: number)                                 => api.get<MovimientoCaja[]>(`/caja/${id}/movimientos`).then(r => r.data),
  abrir:           (data: AbrirCajaDto)                         => api.post<Caja>('/caja/abrir', data).then(r => r.data),
  cerrar:          (id: number, data: CerrarCajaDto)            => api.post<Caja>(`/caja/${id}/cerrar`, data).then(r => r.data),
  crearMovimiento: (id: number, data: CreateMovimientoCajaDto)  => api.post<MovimientoCaja>(`/caja/${id}/movimientos`, data).then(r => r.data),
}
