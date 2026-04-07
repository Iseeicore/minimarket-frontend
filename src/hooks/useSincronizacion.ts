import { useQuery, useMutation, useQueryClient, keepPreviousData } from '@tanstack/react-query'
import { qk } from '../lib/query-keys'
import { sincronizacionService } from '../services/sincronizacion.service'
import type { SincronizacionFilters } from '../services/sincronizacion.service'
import type { CreateSincronizacionDto, ResolverItemDto } from '../types'
import { sileo } from 'sileo'

/**
 * Sincronizaciones paginadas con filtros servidor.
 * Devuelve { data, meta } con paginación real.
 */
export function useSincronizacionesPaginado(filters: SincronizacionFilters) {
  return useQuery({
    queryKey: [...qk.sincronizacion.all, 'paginated', filters] as const,
    queryFn: () => sincronizacionService.getPaginated(filters),
    staleTime: 1000 * 60,
    placeholderData: keepPreviousData,
  })
}

/** Legacy — trae todas sin paginar */
export function useSincronizaciones() {
  return useQuery({
    queryKey: qk.sincronizacion.all,
    queryFn: sincronizacionService.getAll,
    staleTime: 1000 * 60,
  })
}

export function useSincronizacion(id: number | null) {
  return useQuery({
    queryKey: qk.sincronizacion.detail(id ?? 0),
    queryFn: () => sincronizacionService.getOne(id!),
    enabled: !!id,
    staleTime: 1000 * 30,
  })
}

export function useEjecutarSincronizacion() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (data: CreateSincronizacionDto) => sincronizacionService.ejecutar(data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: qk.sincronizacion.all })
      sileo.success({ title: 'Sincronización ejecutada correctamente' })
    },
    onError: () => sileo.error({ title: 'Error al ejecutar la sincronización' }),
  })
}

export function useResolverItem(sincId: number) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ itemId, data }: { itemId: number; data: ResolverItemDto }) =>
      sincronizacionService.resolverItem(sincId, itemId, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: qk.sincronizacion.detail(sincId) })
      sileo.success({ title: 'Ítem resuelto' })
    },
    onError: () => sileo.error({ title: 'Error al resolver el ítem' }),
  })
}

export function useResolverAuto(sincId: number) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: () => sincronizacionService.resolverAuto(sincId),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: qk.sincronizacion.detail(sincId) })
      qc.invalidateQueries({ queryKey: qk.sincronizacion.all })
      sileo.success({ title: 'Todos los ítems resueltos automáticamente' })
    },
    onError: () => sileo.error({ title: 'Error al resolver automáticamente' }),
  })
}
