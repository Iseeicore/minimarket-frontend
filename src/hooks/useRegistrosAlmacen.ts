import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { qk } from '../lib/query-keys'
import { registrosAlmacenService } from '../services/registros-almacen.service'
import type { CreateRegistroAlmacenDto } from '../types'
import { sileo } from 'sileo'

export function useRegistrosAlmacen() {
  return useQuery({
    queryKey: qk.registroAlmacen.all,
    queryFn: registrosAlmacenService.getAll,
    staleTime: 1000 * 30,
  })
}

export function useCreateRegistroAlmacen() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (data: CreateRegistroAlmacenDto) => registrosAlmacenService.create(data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: qk.registroAlmacen.all })
      sileo.success('Registro creado correctamente')
    },
    onError: () => sileo.error('Error al crear el registro'),
  })
}

export function useMarcarDevueltoAlmacen() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, notas }: { id: number; notas?: string }) =>
      registrosAlmacenService.marcarDevuelto(id, notas),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: qk.registroAlmacen.all })
      sileo.success('Registro marcado como devuelto')
    },
    onError: () => sileo.error('Error al marcar la devolución'),
  })
}
