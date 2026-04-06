import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { qk } from '../lib/query-keys'
import { registrosTiendaService } from '../services/registros-tienda.service'
import type { CreateRegistroTiendaDto } from '../types'
import { sileo } from 'sileo'

export function useRegistrosTienda() {
  return useQuery({
    queryKey: qk.registroTienda.all,
    queryFn: registrosTiendaService.getAll,
    staleTime: 1000 * 30,
  })
}

// Clave parcial para invalidar todos los pendientes-tienda sin importar almacenId/horas
const PENDIENTES_KEY = ['registro-almacen', 'pendientes-tienda'] as const

export function useCreateRegistroTienda() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (data: CreateRegistroTiendaDto) => registrosTiendaService.create(data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: qk.registroTienda.all })
      qc.invalidateQueries({ queryKey: PENDIENTES_KEY })
      sileo.success('Registro creado correctamente')
    },
    onError: () => sileo.error('Error al crear el registro'),
  })
}

export function useMarcarDevueltoTienda() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, notas }: { id: number; notas?: string }) =>
      registrosTiendaService.marcarDevuelto(id, notas),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: qk.registroTienda.all })
      qc.invalidateQueries({ queryKey: PENDIENTES_KEY })
      sileo.success('Registro marcado como devuelto')
    },
    onError: () => sileo.error('Error al marcar la devolución'),
  })
}
