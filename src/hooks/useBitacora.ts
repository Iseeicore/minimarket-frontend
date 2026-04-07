import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { qk } from '../lib/query-keys'
import { bitacoraService } from '../services/bitacora.service'
import type { CreateEntradaBitacoraDto } from '../types'
import { sileo } from 'sileo'

/**
 * Entradas de bitácora paginadas.
 * staleTime: 1min — es append-only, no cambia frecuentemente.
 */
export function useBitacora(page = 1, limit = 20, almacenId?: number) {
  return useQuery({
    queryKey: qk.bitacora.list(page, limit, almacenId),
    queryFn: () => bitacoraService.getAll(page, limit, almacenId),
    staleTime: 1000 * 60,
    placeholderData: prev => prev,
  })
}

/**
 * Crea una entrada en la bitácora.
 * El backend adjunta el usuarioId desde el JWT — no lo enviamos desde frontend.
 */
export function useCreateEntrada() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (data: CreateEntradaBitacoraDto) => bitacoraService.create(data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: qk.bitacora.all })
      sileo.success({ title: 'Entrada registrada en bitácora' })
    },
    onError: () => sileo.error({ title: 'Error al registrar en bitácora' }),
  })
}
