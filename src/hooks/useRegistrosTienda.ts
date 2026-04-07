import { useQuery, useMutation, useQueryClient, keepPreviousData } from '@tanstack/react-query'
import { qk } from '../lib/query-keys'
import { registrosTiendaService } from '../services/registros-tienda.service'
import type { RegistroTiendaFilters } from '../services/registros-tienda.service'
import type { CreateRegistroTiendaDto } from '../types'
import { sileo } from 'sileo'

export type { ResumenDiaItem } from '../services/registros-tienda.service'

/** Legacy — trae todos los registros (limit alto, sin paginar servidor) */
export function useRegistrosTienda() {
  return useQuery({
    queryKey: qk.registroTienda.all,
    queryFn: registrosTiendaService.getAll,
    staleTime: 1000 * 30,
  })
}

/**
 * Registros paginados con filtros servidor.
 * Devuelve { data, meta } con paginación real.
 */
export function useRegistrosTiendaPaginado(filters: RegistroTiendaFilters) {
  return useQuery({
    queryKey: [...qk.registroTienda.all, 'paginated', filters] as const,
    queryFn: () => registrosTiendaService.getPaginated(filters),
    staleTime: 1000 * 30,
    placeholderData: keepPreviousData,
    enabled: !!filters.almacenId,
  })
}

/**
 * Conteo de registros por día — endpoint liviano para la estantería.
 * Devuelve { "2026-04-07": 12, "2026-04-06": 8 }
 */
export function useRegistrosTiendaConteo(almacenId: number | null, desde: string, hasta: string) {
  return useQuery({
    queryKey: [...qk.registroTienda.all, 'conteo', almacenId, desde, hasta] as const,
    queryFn: () => registrosTiendaService.conteoPorDia(almacenId!, desde, hasta),
    staleTime: 1000 * 60,
    enabled: !!almacenId,
  })
}

/**
 * Resumen consolidado del día: productos agrupados con cantidad total.
 * Paginado servidor.
 */
export function useResumenDia(params: {
  almacenId: number | null | undefined
  fecha: string
  tipo?: string
  page?: number
  limit?: number
}) {
  return useQuery({
    queryKey: [...qk.registroTienda.all, 'resumen-dia', params] as const,
    queryFn: () => registrosTiendaService.resumenDia({
      almacenId: params.almacenId!,
      fecha: params.fecha,
      tipo: params.tipo,
      page: params.page,
      limit: params.limit,
    }),
    enabled: !!params.almacenId,
    staleTime: 1000 * 30,
    placeholderData: keepPreviousData,
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
      sileo.success({ title: 'Registro creado correctamente' })
    },
    onError: () => sileo.error({ title: 'Error al crear el registro' }),
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
      sileo.success({ title: 'Registro marcado como devuelto' })
    },
    onError: () => sileo.error({ title: 'Error al marcar la devolución' }),
  })
}
