import { useQuery, useMutation, useQueryClient, keepPreviousData } from '@tanstack/react-query'
import { qk } from '../lib/query-keys'
import { ordenesSalidaService } from '../services/ordenes-salida.service'
import type { OrdenSalidaFilters } from '../services/ordenes-salida.service'
import type { CreateOrdenSalidaDto } from '../types'
import { sileo } from 'sileo'

// ── Queries ──────────────────────────────────────────────────────────────────

/**
 * Órdenes de salida paginadas con filtros servidor.
 */
export function useOrdenesSalidaPaginado(filters: OrdenSalidaFilters) {
  return useQuery({
    queryKey: [...qk.ordenesSalida.all, 'paginated', filters] as const,
    queryFn: () => ordenesSalidaService.getPaginated(filters),
    staleTime: 1000 * 30,
    placeholderData: keepPreviousData,
    enabled: !!filters.almacenId,
  })
}

/**
 * Legacy — todas las órdenes de salida para un almacén (limit alto).
 * staleTime: 30s — cambia con cada orden nueva.
 */
export function useOrdenesSalida(almacenId: number | null | undefined) {
  return useQuery({
    queryKey: qk.ordenesSalida.byAlmacen(almacenId ?? 0),
    queryFn: () => ordenesSalidaService.getAll(almacenId!),
    enabled: !!almacenId,
    staleTime: 1000 * 30,
  })
}

/**
 * Detalle de una orden de salida.
 */
export function useOrdenSalida(id: number | null | undefined) {
  return useQuery({
    queryKey: qk.ordenesSalida.detail(id ?? 0),
    queryFn: () => ordenesSalidaService.getOne(id!),
    enabled: !!id,
  })
}

/**
 * Stock dual: almacén + tienda desglosados.
 * staleTime: 30s — cambia con cada orden completada.
 */
export function useStockDual(almacenId: number | null | undefined) {
  return useQuery({
    queryKey: qk.ordenesSalida.stockDual(almacenId ?? 0),
    queryFn: () => ordenesSalidaService.getStockDual(almacenId!),
    enabled: !!almacenId,
    staleTime: 1000 * 10,
    refetchInterval: 1000 * 15,
  })
}

// ── Mutations ────────────────────────────────────────────────────────────────

/**
 * Crear nueva orden de salida.
 * Al confirmar: stock almacén -N, stock tienda +N, registra en cuadernillo.
 */
export function useCreateOrdenSalida() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (dto: CreateOrdenSalidaDto) => ordenesSalidaService.create(dto),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['ordenes-salida'] })
      qc.invalidateQueries({ queryKey: ['stock'] })
      qc.invalidateQueries({ queryKey: ['registro-tienda'] })
      sileo.success('Orden creada correctamente')
    },
    onError: () => {
      sileo.error('No se pudo crear la orden')
    },
  })
}

/** Completar orden pendiente — almacenero confirma despacho */
export function useCompletarOrden() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: number) => ordenesSalidaService.completar(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['ordenes-salida'] })
      qc.invalidateQueries({ queryKey: ['stock'] })
      sileo.success('Orden completada')
    },
    onError: () => {
      sileo.error('No se pudo completar la orden')
    },
  })
}

/** Cancelar orden pendiente */
export function useCancelarOrden() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: number) => ordenesSalidaService.cancelar(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['ordenes-salida'] })
      sileo.success('Orden cancelada')
    },
    onError: () => {
      sileo.error('No se pudo cancelar la orden')
    },
  })
}
