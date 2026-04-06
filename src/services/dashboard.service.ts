import api from '../lib/axios'
import type { FilaCrudaDia, FilaOrganizadaDia, HistoricoResponse } from '../types'

export const dashboardService = {
  /** Hoy si no se pasa fecha, o el día indicado en YYYY-MM-DD */
  getListaDiaCruda: (fecha?: string) =>
    api.get<FilaCrudaDia[]>('/dashboard/lista-dia/cruda', {
      params: fecha ? { fecha } : undefined,
    }).then(r => r.data),

  /** Hoy si no se pasa fecha, o el día indicado en YYYY-MM-DD */
  getListaDia: (fecha?: string) =>
    api.get<FilaOrganizadaDia[]>('/dashboard/lista-dia', {
      params: fecha ? { fecha } : undefined,
    }).then(r => r.data),

  /**
   * Histórico paginado desde ResumenDia — se genera al cerrar la caja.
   * Solo disponible para días con caja cerrada.
   */
  getHistorico: (page = 1, limit = 30, almacenId?: number) =>
    api.get<HistoricoResponse>('/dashboard/historico', {
      params: { page, limit, ...(almacenId ? { almacenId } : {}) },
    }).then(r => r.data),
}
