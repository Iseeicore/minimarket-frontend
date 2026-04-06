import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { qk } from '../lib/query-keys'
import { ventasService } from '../services/ventas.service'
import type { CreateVentaDto } from '../types'
import { useAuthStore } from '../store/auth.store'
import { sileo } from 'sileo'

/** Todas las ventas. */
export function useVentas() {
  return useQuery({
    queryKey: qk.ventas.all,
    queryFn: ventasService.getAll,
    staleTime: 1000 * 30,
  })
}

/** Ventas del día actual. refetchInterval para mantener actualizado. */
export function useVentasHoy() {
  return useQuery({
    queryKey: qk.ventas.hoy,
    queryFn: ventasService.getHoy,
    staleTime: 1000 * 30,
    refetchInterval: 1000 * 60,
  })
}

/** Detalle de una venta con items. */
export function useVenta(id: number | null) {
  return useQuery({
    queryKey: qk.ventas.detail(id ?? 0),
    queryFn: () => ventasService.getOne(id!),
    enabled: !!id,
    staleTime: 1000 * 60,
  })
}

/**
 * Crea una venta completa.
 * Backend es transacción atómica: verifica caja + stock → crea venta →
 * decrementa stock (VENTA_SALIDA) → registra ingreso caja.
 * Al éxito: invalida ventas, stock y caja.
 */
export function useCreateVenta() {
  const qc = useQueryClient()
  const almacenId = useAuthStore(s => s.usuario?.almacenId)
  return useMutation({
    mutationFn: (data: CreateVentaDto) => ventasService.create(data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: qk.ventas.all })
      qc.invalidateQueries({ queryKey: qk.ventas.hoy })
      if (almacenId) {
        qc.invalidateQueries({ queryKey: qk.stock.byAlmacen(almacenId) })
        qc.invalidateQueries({ queryKey: qk.caja.activa(almacenId) })
      }
      sileo.success('Venta registrada correctamente')
    },
    onError: (error: any) => {
      // El backend puede devolver 400 con mensaje de stock insuficiente
      const msg: string = error?.response?.data?.message ?? ''
      if (msg.toLowerCase().includes('stock')) {
        sileo.error('Stock insuficiente para completar la venta')
      } else if (msg.toLowerCase().includes('caja')) {
        sileo.error('No hay caja abierta — abrí la caja primero')
      } else {
        sileo.error('Error al registrar la venta')
      }
    },
  })
}
