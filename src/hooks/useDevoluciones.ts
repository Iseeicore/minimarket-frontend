import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { qk } from '../lib/query-keys'
import { devolucionesService } from '../services/devoluciones.service'
import type { CreateDevolucionDto } from '../types'
import { useAuthStore } from '../store/auth.store'
import { sileo } from 'sileo'

/** Devoluciones paginadas. staleTime: 1min. */
export function useDevoluciones(page = 1, limit = 20) {
  return useQuery({
    queryKey: qk.devoluciones.list(page, limit),
    queryFn: () => devolucionesService.getAll(page, limit),
    staleTime: 1000 * 60,
    placeholderData: prev => prev,
  })
}

/** Detalle de una devolución con items. */
export function useDevolucion(id: number | null) {
  return useQuery({
    queryKey: qk.devoluciones.detail(id ?? 0),
    queryFn: () => devolucionesService.getOne(id!),
    enabled: !!id,
    staleTime: 1000 * 60,
  })
}

/**
 * Crea una devolución.
 * Backend es transacción: revierte stock (DEVOLUCION_ENTRADA) + egresa caja +
 * marca venta DEVUELTA si todos los items fueron devueltos.
 * Al éxito: invalida devoluciones, ventas, stock y caja.
 */
export function useCreateDevolucion() {
  const qc = useQueryClient()
  const almacenId = useAuthStore(s => s.usuario?.almacenId)
  return useMutation({
    mutationFn: (data: CreateDevolucionDto) => devolucionesService.create(data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: qk.devoluciones.all })
      qc.invalidateQueries({ queryKey: qk.ventas.all })
      qc.invalidateQueries({ queryKey: qk.registroAlmacen.all })
      if (almacenId) {
        qc.invalidateQueries({ queryKey: qk.stock.byAlmacen(almacenId) })
        qc.invalidateQueries({ queryKey: qk.caja.activa(almacenId) })
      }
      sileo.success('Devolución procesada — stock restaurado')
    },
    onError: (error: any) => {
      const msg: string = error?.response?.data?.message ?? ''
      if (msg.toLowerCase().includes('devuelto') || msg.toLowerCase().includes('supera')) {
        sileo.error('La cantidad a devolver supera la vendida')
      } else {
        sileo.error('Error al procesar la devolución')
      }
    },
  })
}
