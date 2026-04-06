import { useQuery } from '@tanstack/react-query'
import { qk } from '../lib/query-keys'
import { stockService } from '../services/stock.service'

/**
 * Stock de todas las variantes para un almacén dado.
 * staleTime: 30s — cambia con cada venta, compra o devolución.
 * Usado principalmente en VentasPage para mostrar disponibilidad en tiempo real.
 */
export function useStockByAlmacen(almacenId: number | null | undefined) {
  return useQuery({
    queryKey: qk.stock.byAlmacen(almacenId ?? 0),
    queryFn: () => stockService.getByAlmacen(almacenId!),
    enabled: !!almacenId,
    staleTime: 1000 * 30,
  })
}

/**
 * Movimientos de stock paginados.
 * staleTime: 30s — los movimientos crecen con cada venta/compra/devolución.
 */
export function useMovimientosStock(page = 1, limit = 20, almacenId?: number) {
  return useQuery({
    queryKey: qk.stock.movimientos(page, limit, almacenId),
    queryFn: () => stockService.getMovimientos(page, limit, almacenId),
    staleTime: 1000 * 30,
    placeholderData: prev => prev,
  })
}
