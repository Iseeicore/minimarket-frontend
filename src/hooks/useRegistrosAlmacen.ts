import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { qk } from '../lib/query-keys'
import { registrosAlmacenService } from '../services/registros-almacen.service'
import type { CreateRegistroAlmacenDto } from '../types'
import { sileo } from 'sileo'

/** Movimientos del almacén sin contrapartida en el cuaderno de tienda.
 *  Se refresca cada 15s. También se invalida manualmente al agregar/anular
 *  un registro de tienda, para que el panel desaparezca de inmediato. */
export function usePendientesTienda(almacenId: number | null, horas = 24) {
  return useQuery({
    queryKey: qk.registroAlmacen.pendientesTienda(almacenId ?? 0, horas),
    queryFn:  () => registrosAlmacenService.getPendientesTienda(almacenId!, horas),
    enabled:  !!almacenId,
    staleTime: 1000 * 15,
    refetchInterval: 1000 * 15,
  })
}

export function useRegistrosAlmacen() {
  return useQuery({
    queryKey: qk.registroAlmacen.all,
    queryFn: registrosAlmacenService.getAll,
    staleTime: 1000 * 15,
    refetchInterval: 1000 * 15,
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
