import api from '../lib/axios'
import type { RegistroTienda, CreateRegistroTiendaDto, PaginatedResult } from '../types'

export interface ResumenDiaItem {
  varianteId: number
  totalCantidad: number
  variante?: {
    id: number
    nombre: string
    producto?: { id: number; nombre: string }
    unidad?: { id: number; abreviatura: string }
  }
}

export interface RegistroTiendaFilters {
  page?: number
  limit?: number
  almacenId?: number
  desde?: string   // YYYY-MM-DD
  hasta?: string   // YYYY-MM-DD
}

export const registrosTiendaService = {
  /** Paginado con filtros — devuelve { data, meta } */
  getPaginated: (filters: RegistroTiendaFilters = {}) =>
    api.get<PaginatedResult<RegistroTienda>>('/registros-tienda', { params: filters }).then(r => r.data),

  /** Shortcut legacy — trae todos sin paginar (limit alto) */
  getAll: () =>
    api.get<PaginatedResult<RegistroTienda>>('/registros-tienda', { params: { limit: 100 } }).then(r => r.data.data),

  /** Conteo por día — endpoint liviano para estantería */
  conteoPorDia: (almacenId: number, desde: string, hasta: string) =>
    api.get<Record<string, number>>('/registros-tienda/conteo-por-dia', { params: { almacenId, desde, hasta } }).then(r => r.data),

  /** Resumen consolidado por producto — agrupa y suma cantidades del día */
  resumenDia: (params: { almacenId: number; fecha: string; tipo?: string; page?: number; limit?: number }) =>
    api.get<PaginatedResult<ResumenDiaItem>>('/registros-tienda/resumen-dia', { params }).then(r => r.data),

  getOne: (id: number) =>
    api.get<RegistroTienda>(`/registros-tienda/${id}`).then(r => r.data),

  create: (data: CreateRegistroTiendaDto) =>
    api.post<RegistroTienda>('/registros-tienda', data).then(r => r.data),

  marcarDevuelto: (id: number, notas?: string) =>
    api.patch<RegistroTienda>(`/registros-tienda/${id}/devolver`, { notas }).then(r => r.data),
}
