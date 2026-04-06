import api from '../lib/axios'
import type { Contacto, CreateContactoDto, UpdateContactoDto } from '../types'

export const contactosService = {
  getAll: (tipo?: string) => api.get<Contacto[]>('/contactos', { params: tipo ? { tipo } : undefined }).then(r => r.data),
  getOne: (id: number) => api.get<Contacto>(`/contactos/${id}`).then(r => r.data),
  create: (data: CreateContactoDto) => api.post<Contacto>('/contactos', data).then(r => r.data),
  update: (id: number, data: UpdateContactoDto) => api.patch<Contacto>(`/contactos/${id}`, data).then(r => r.data),
  remove: (id: number) => api.delete(`/contactos/${id}`).then(r => r.data),
}
