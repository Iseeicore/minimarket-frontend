import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { usuariosService } from '../services/usuarios.service'
import type { CreateUsuarioDto, UpdateUsuarioDto } from '../types'
import { sileo } from 'sileo'

const QK_USUARIOS = ['usuarios'] as const
const qkDetail    = (id: number) => ['usuarios', id] as const

/** Lista todos los usuarios de la empresa. Solo ADMIN. staleTime: 1min. */
export function useUsuarios() {
  return useQuery({
    queryKey: QK_USUARIOS,
    queryFn:  usuariosService.getAll,
    staleTime: 1000 * 60,
  })
}

/** Crea un usuario. Invalida la lista. */
export function useCreateUsuario() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (data: CreateUsuarioDto) => usuariosService.create(data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: QK_USUARIOS })
      sileo.success({ title: 'Usuario creado correctamente' })
    },
    onError: (err: any) => {
      const msg: string = err?.response?.data?.message ?? ''
      if (msg.toLowerCase().includes('email')) {
        sileo.error({ title: 'Ese email ya está registrado' })
      } else {
        sileo.error({ title: 'Error al crear el usuario' })
      }
    },
  })
}

/** Edita un usuario (nombre, rol, almacén, activo, password opcional). */
export function useUpdateUsuario() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: UpdateUsuarioDto }) =>
      usuariosService.update(id, data),
    onSuccess: (_, { id }) => {
      qc.invalidateQueries({ queryKey: QK_USUARIOS })
      qc.invalidateQueries({ queryKey: qkDetail(id) })
      sileo.success({ title: 'Usuario actualizado' })
    },
    onError: () => sileo.error({ title: 'Error al actualizar el usuario' }),
  })
}

/**
 * Desactiva un usuario (soft-delete via DELETE en el backend).
 * El admin no puede desactivarse a sí mismo — esa validación va en la UI.
 */
export function useDeleteUsuario() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: number) => usuariosService.remove(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: QK_USUARIOS })
      sileo.success({ title: 'Usuario desactivado' })
    },
    onError: () => sileo.error({ title: 'No se pudo desactivar el usuario' }),
  })
}
