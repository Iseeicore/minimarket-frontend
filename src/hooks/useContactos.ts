import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { qk } from '../lib/query-keys'
import { contactosService } from '../services/contactos.service'
import { sileo } from 'sileo'

export function useContactos(tipo?: string) {
  return useQuery({
    queryKey: tipo ? qk.contactos.byTipo(tipo) : qk.contactos.all,
    queryFn: () => contactosService.getAll(tipo),
  })
}

export function useCreateContacto() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: contactosService.create,
    onSuccess: () => { qc.invalidateQueries({ queryKey: qk.contactos.all }); sileo.success('Contacto creado') },
    onError: () => sileo.error('Error al crear el contacto'),
  })
}

export function useUpdateContacto() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: any }) => contactosService.update(id, data),
    onSuccess: () => { qc.invalidateQueries({ queryKey: qk.contactos.all }); sileo.success('Contacto actualizado') },
    onError: () => sileo.error('Error al actualizar el contacto'),
  })
}

export function useDeleteContacto() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: contactosService.remove,
    onSuccess: () => { qc.invalidateQueries({ queryKey: qk.contactos.all }); sileo.success('Contacto eliminado') },
    onError: () => sileo.error('Error al eliminar el contacto'),
  })
}
