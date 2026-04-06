import api from '../lib/axios'
import type { Producto, CreateProductoDto, UpdateProductoDto, Variante, CreateVarianteDto, UpdateVarianteDto } from '../types'

export const productosService = {
  getAll: () => api.get<Producto[]>('/productos').then(r => r.data),
  getOne: (id: number) => api.get<Producto>(`/productos/${id}`).then(r => r.data),
  create: (data: CreateProductoDto) => api.post<Producto>('/productos', data).then(r => r.data),
  update: (id: number, data: UpdateProductoDto) => api.patch<Producto>(`/productos/${id}`, data).then(r => r.data),
  remove: (id: number) => api.delete(`/productos/${id}`).then(r => r.data),
}

export const variantesService = {
  getAll: (search?: string) => api.get<Variante[]>('/variantes', { params: search ? { search } : undefined }).then(r => r.data),
  getOne: (id: number) => api.get<Variante>(`/variantes/${id}`).then(r => r.data),
  create: (data: CreateVarianteDto) => api.post<Variante>('/variantes', data).then(r => r.data),
  update: (id: number, data: UpdateVarianteDto) => api.patch<Variante>(`/variantes/${id}`, data).then(r => r.data),
  remove: (id: number) => api.delete(`/variantes/${id}`).then(r => r.data),
}
