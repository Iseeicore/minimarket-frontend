import { useQuery } from '@tanstack/react-query'
import { qk } from '../lib/query-keys'
import { dashboardService } from '../services/dashboard.service'

/** Devuelve YYYY-MM-DD de hoy en hora local */
function fechaHoy(): string {
  return new Date().toISOString().slice(0, 10)
}

/** True si la fecha es anterior a hoy — esos datos no van a cambiar nunca */
function esFechaHistorica(fecha?: string): boolean {
  return !!fecha && fecha < fechaHoy()
}

/**
 * Lista cruda del día — una fila por ItemVenta, orden cronológico.
 * Sin fecha = hoy (live, staleTime 30s).
 * Con fecha pasada = histórico (staleTime Infinity — el día ya está cerrado).
 */
export function useListaDiaCruda(fecha?: string) {
  const historica = esFechaHistorica(fecha)
  return useQuery({
    queryKey: qk.dashboard.listaDiaCruda(fecha),
    queryFn:  () => dashboardService.getListaDiaCruda(fecha),
    staleTime: historica ? Infinity : 1000 * 30,
  })
}

/**
 * Lista organizada del día — agrupada por variante, sin repeticiones.
 * Sin fecha = hoy (live, staleTime 30s).
 * Con fecha pasada = histórico (staleTime Infinity).
 */
export function useListaDia(fecha?: string) {
  const historica = esFechaHistorica(fecha)
  return useQuery({
    queryKey: qk.dashboard.listaDia(fecha),
    queryFn:  () => dashboardService.getListaDia(fecha),
    staleTime: historica ? Infinity : 1000 * 30,
  })
}

/**
 * Histórico paginado de ResumenDia.
 * Solo incluye días con caja cerrada — el registro se crea al cerrar.
 * staleTime Infinity: los resúmenes no cambian una vez guardados.
 */
export function useHistorico(page = 1, limit = 30, almacenId?: number) {
  return useQuery({
    queryKey: qk.dashboard.historico(page, limit, almacenId),
    queryFn:  () => dashboardService.getHistorico(page, limit, almacenId),
    staleTime: Infinity,
  })
}
