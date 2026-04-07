import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { qk } from '../lib/query-keys'
import { unidadesMedidaService } from '../services/unidades-medida.service'
import { sileo } from 'sileo'

export function useUnidadesMedida() {
  return useQuery({ queryKey: qk.unidadesMedida.all, queryFn: unidadesMedidaService.getAll })
}

export function useCreateUnidadMedida() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: unidadesMedidaService.create,
    onSuccess: () => { qc.invalidateQueries({ queryKey: qk.unidadesMedida.all }); sileo.success({ title: 'Unidad creada' }) },
    onError: () => sileo.error({ title: 'Error al crear la unidad' }),
  })
}

export function useUpdateUnidadMedida() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: any }) => unidadesMedidaService.update(id, data),
    onSuccess: () => { qc.invalidateQueries({ queryKey: qk.unidadesMedida.all }); sileo.success({ title: 'Unidad actualizada' }) },
    onError: () => sileo.error({ title: 'Error al actualizar la unidad' }),
  })
}

export function useDeleteUnidadMedida() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: unidadesMedidaService.remove,
    onSuccess: () => { qc.invalidateQueries({ queryKey: qk.unidadesMedida.all }); sileo.success({ title: 'Unidad eliminada' }) },
    onError: () => sileo.error({ title: 'Error al eliminar la unidad' }),
  })
}
