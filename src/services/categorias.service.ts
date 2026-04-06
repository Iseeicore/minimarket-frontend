import api from '../lib/axios'
import type { Categoria, CreateCategoriaDto, UpdateCategoriaDto } from '../types'

export const categoriasService = {
  getAll: () => api.get<Categoria[]>('/categorias').then(r => r.data),
  getOne: (id: number) => api.get<Categoria>(`/categorias/${id}`).then(r => r.data),
  create: (data: CreateCategoriaDto) => api.post<Categoria>('/categorias', data).then(r => r.data),
  update: (id: number, data: UpdateCategoriaDto) => api.patch<Categoria>(`/categorias/${id}`, data).then(r => r.data),
  remove: (id: number) => api.delete(`/categorias/${id}`).then(r => r.data),
}
