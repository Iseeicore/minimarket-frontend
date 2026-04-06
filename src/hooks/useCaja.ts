import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { qk } from '../lib/query-keys'
import { cajaService } from '../services/caja.service'
import type { AbrirCajaDto, CerrarCajaDto, CreateMovimientoCajaDto } from '../types'
import { sileo } from 'sileo'

/** Lista todas las cajas (admin). */
export function useCajas() {
  return useQuery({
    queryKey: qk.caja.all,
    queryFn: cajaService.getAll,
    staleTime: 1000 * 30,
  })
}

/**
 * Caja activa del almacén. Puede ser null — no es error.
 * refetchInterval: 1min para mantener estado actualizado en POS.
 */
export function useCajaActiva(almacenId: number | null | undefined) {
  return useQuery({
    queryKey: qk.caja.activa(almacenId ?? 0),
    queryFn: () => cajaService.getActiva(almacenId!),
    enabled: !!almacenId,
    staleTime: 1000 * 30,
    refetchInterval: 1000 * 60,
    retry: false, // 404 cuando no hay caja abierta — no reintentar
  })
}

/** Detalle de una caja por ID. */
export function useCaja(id: number | null | undefined) {
  return useQuery({
    queryKey: qk.caja.detail(id ?? 0),
    queryFn: () => cajaService.getOne(id!),
    enabled: !!id,
    staleTime: 1000 * 30,
  })
}

/** Movimientos de una caja. */
export function useMovimientosCaja(id: number | null | undefined) {
  return useQuery({
    queryKey: qk.caja.movimientos(id ?? 0),
    queryFn: () => cajaService.getMovimientos(id!),
    enabled: !!id,
    staleTime: 1000 * 30,
  })
}

/** Abre la caja del día con monto de apertura. */
export function useAbrirCaja() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (data: AbrirCajaDto) => cajaService.abrir(data),
    onSuccess: (caja) => {
      qc.invalidateQueries({ queryKey: qk.caja.all })
      qc.invalidateQueries({ queryKey: qk.caja.activa(caja.almacenId) })
      sileo.success('Caja abierta correctamente')
    },
    onError: () => sileo.error('Error al abrir la caja'),
  })
}

/**
 * Cierra la caja con el monto físico contado.
 * Backend registra montoCierre y cerradoEn.
 */
export function useCerrarCaja() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: CerrarCajaDto }) =>
      cajaService.cerrar(id, data),
    onSuccess: (caja) => {
      qc.invalidateQueries({ queryKey: qk.caja.all })
      qc.invalidateQueries({ queryKey: qk.caja.activa(caja.almacenId) })
      qc.invalidateQueries({ queryKey: qk.caja.detail(caja.id) })
      sileo.success('Caja cerrada')
    },
    onError: () => sileo.error('Error al cerrar la caja'),
  })
}

/** Registra un movimiento manual (INGRESO / EGRESO / AJUSTE). */
export function useCrearMovimiento() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: CreateMovimientoCajaDto }) =>
      cajaService.crearMovimiento(id, data),
    onSuccess: (_, { id }) => {
      qc.invalidateQueries({ queryKey: qk.caja.movimientos(id) })
      qc.invalidateQueries({ queryKey: qk.caja.detail(id) })
      sileo.success('Movimiento registrado')
    },
    onError: () => sileo.error('Error al registrar el movimiento'),
  })
}
