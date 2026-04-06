import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { qk } from '../lib/query-keys'
import { almacenesService } from '../services/almacenes.service'
import type { CreateAlmacenDto, UpdateAlmacenDto } from '../types'
import { sileo } from 'sileo'

/**
 * Retorna todos los almacenes.
 * staleTime alto: los almacenes raramente cambian.
 */
export function useAlmacenes() {
  return useQuery({
    queryKey: qk.almacenes.all,
    queryFn: almacenesService.getAll,
    staleTime: 1000 * 60 * 30,
  })
}

/** Crea un almacén e invalida el caché. */
export function useCreateAlmacen() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (data: CreateAlmacenDto) => almacenesService.create(data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: qk.almacenes.all })
      sileo.success('Almacén creado correctamente')
    },
    onError: () => sileo.error('Error al crear el almacén'),
  })
}

/** Actualiza un almacén e invalida el caché. */
export function useUpdateAlmacen() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: UpdateAlmacenDto }) =>
      almacenesService.update(id, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: qk.almacenes.all })
      sileo.success('Almacén actualizado')
    },
    onError: () => sileo.error('Error al actualizar el almacén'),
  })
}

/** Elimina un almacén e invalida el caché. */
export function useDeleteAlmacen() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: almacenesService.remove,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: qk.almacenes.all })
      sileo.success('Almacén eliminado')
    },
    onError: () => sileo.error('Error al eliminar el almacén'),
  })
}
