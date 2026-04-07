import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { qk } from '../lib/query-keys'
import { comprasService } from '../services/compras.service'
import type { CreateOrdenCompraDto, CreatePagoCompraDto } from '../types'
import { useAuthStore } from '../store/auth.store'
import { sileo } from 'sileo'

/** Lista órdenes de compra paginadas. staleTime: 1min (datos operativos). */
export function useCompras(page = 1, limit = 20) {
  return useQuery({
    queryKey: qk.compras.list(page, limit),
    queryFn: () => comprasService.getAll(page, limit),
    staleTime: 1000 * 60,
    placeholderData: prev => prev,
  })
}

/** Detalle de una orden. Precarga en lista → navegación instantánea. */
export function useCompra(id: number | null) {
  return useQuery({
    queryKey: qk.compras.detail(id ?? 0),
    queryFn: () => comprasService.getOne(id!),
    enabled: !!id,
    staleTime: 1000 * 30,
  })
}

/** Crea una nueva orden de compra. */
export function useCreateCompra() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (data: CreateOrdenCompraDto) => comprasService.create(data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: qk.compras.all })   // invalida todas las páginas
      sileo.success({ title: 'Orden de compra creada' })
    },
    onError: () => sileo.error({ title: 'Error al crear la orden de compra' }),
  })
}

/**
 * Marca una orden como recibida.
 * Backend incrementa stock (COMPRA_ENTRADA) — invalida stock también.
 */
export function useRecibirOrden() {
  const qc = useQueryClient()
  const almacenId = useAuthStore(s => s.usuario?.almacenId)
  return useMutation({
    mutationFn: (id: number) => comprasService.recibirOrden(id),
    onSuccess: (_, id) => {
      qc.invalidateQueries({ queryKey: qk.compras.all })
      qc.invalidateQueries({ queryKey: qk.compras.detail(id) })
      if (almacenId) qc.invalidateQueries({ queryKey: qk.stock.byAlmacen(almacenId) })
      sileo.success({ title: 'Orden marcada como recibida — stock actualizado' })
    },
    onError: () => sileo.error({ title: 'No se pudo marcar como recibida' }),
  })
}

/** Registra un pago en una orden. El backend recalcula el estado (PARCIAL/PAGADO). */
export function useRegistrarPago() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: CreatePagoCompraDto }) =>
      comprasService.registrarPago(id, data),
    onSuccess: (_, { id }) => {
      qc.invalidateQueries({ queryKey: qk.compras.detail(id) })
      qc.invalidateQueries({ queryKey: qk.compras.all })
      sileo.success({ title: 'Pago registrado correctamente' })
    },
    onError: () => sileo.error({ title: 'No se pudo registrar el pago' }),
  })
}

/** Elimina una orden. Solo si no fue recibida (backend valida). */
export function useDeleteCompra() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: comprasService.remove,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: qk.compras.all })
      sileo.success({ title: 'Orden eliminada' })
    },
    onError: () => sileo.error({ title: 'Error al eliminar la orden' }),
  })
}
