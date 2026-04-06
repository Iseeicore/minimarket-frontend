import api from '../lib/axios'
import type { Usuario, CreateUsuarioDto, UpdateUsuarioDto } from '../types'

export const usuariosService = {
  getAll:  ()                                    => api.get<Usuario[]>('/usuarios').then(r => r.data),
  getOne:  (id: number)                          => api.get<Usuario>(`/usuarios/${id}`).then(r => r.data),
  create:  (data: CreateUsuarioDto)              => api.post<Usuario>('/usuarios', data).then(r => r.data),
  update:  (id: number, data: UpdateUsuarioDto)  => api.patch<Usuario>(`/usuarios/${id}`, data).then(r => r.data),
  // DELETE en el backend es soft-delete (activo: false)
  remove:  (id: number)                          => api.delete<Usuario>(`/usuarios/${id}`).then(r => r.data),
}
