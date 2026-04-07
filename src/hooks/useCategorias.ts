import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { qk } from '../lib/query-keys'
import { categoriasService } from '../services/categorias.service'
import { sileo } from 'sileo'

export function useCategorias() {
  return useQuery({ queryKey: qk.categorias.all, queryFn: categoriasService.getAll })
}

export function useCreateCategoria() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: categoriasService.create,
    onSuccess: () => { qc.invalidateQueries({ queryKey: qk.categorias.all }); sileo.success({ title: 'Categoría creada' }) },
    onError: () => sileo.error({ title: 'Error al crear la categoría' }),
  })
}

export function useUpdateCategoria() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: any }) => categoriasService.update(id, data),
    onSuccess: () => { qc.invalidateQueries({ queryKey: qk.categorias.all }); sileo.success({ title: 'Categoría actualizada' }) },
    onError: () => sileo.error({ title: 'Error al actualizar la categoría' }),
  })
}

export function useDeleteCategoria() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: categoriasService.remove,
    onSuccess: () => { qc.invalidateQueries({ queryKey: qk.categorias.all }); sileo.success({ title: 'Categoría eliminada' }) },
    onError: () => sileo.error({ title: 'Error al eliminar la categoría' }),
  })
}
