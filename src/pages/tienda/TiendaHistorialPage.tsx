import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { History, Loader2, ChevronRight, CheckCircle2, AlertTriangle, RefreshCw } from 'lucide-react'
import { useSincronizacionesPaginado } from '../../hooks/useSincronizacion'
import type { EstadoSincronizacion } from '../../types'

// ── Helpers ────────────────────────────────────────────────────
function formatFecha(iso: string) {
  return new Date(iso).toLocaleDateString('es-PE', {
    day: '2-digit', month: '2-digit', year: 'numeric',
  })
}
function formatHora(iso: string) {
  return new Date(iso).toLocaleTimeString('es-PE', { hour: '2-digit', minute: '2-digit' })
}

const ESTADO_META: Record<EstadoSincronizacion, { label: string; cls: string; icon: typeof CheckCircle2 }> = {
  PENDIENTE:       { label: 'Pendiente',       cls: 'bg-tin-pale text-tin-dark',         icon: RefreshCw     },
  EN_PROCESO:      { label: 'En proceso',       cls: 'bg-accent/20 text-accent-dark',     icon: Loader2       },
  COMPLETADA:      { label: 'Completada',       cls: 'bg-primary-pale text-primary-dark', icon: CheckCircle2  },
  CON_DIFERENCIAS: { label: 'Con diferencias',  cls: 'bg-amber-100 text-amber-700',       icon: AlertTriangle },
}

export default function TiendaHistorialPage() {
  const navigate = useNavigate()
  const [pagina, setPagina] = useState(1)
  const { data: sincsData, isLoading } = useSincronizacionesPaginado({ page: pagina, limit: 10 })
  const sincs = sincsData?.data ?? []
  const meta  = sincsData?.meta

  if (isLoading && sincs.length === 0) {
    return (
      <div className="flex justify-center items-center py-24">
        <Loader2 size={32} className="animate-spin text-tin" />
      </div>
    )
  }

  const totalPages = meta?.totalPages ?? 1

  return (
    <div className="space-y-5 pt-2">

      {/* ── Header ── */}
      <div className="flex items-center gap-3">
        <History size={22} className="text-tin-dark" />
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Historial</h1>
          <p className="text-sm text-tin mt-0.5">Todas las sincronizaciones · {meta?.total ?? sincs.length} registros</p>
        </div>
      </div>

      {/* ── Lista paginada ── */}
      {sincs.length === 0 ? (
        <div className="bg-white rounded-2xl border border-tin/20 p-8 text-center">
          <History size={36} className="mx-auto text-tin mb-3" />
          <p className="font-semibold text-slate-700">Sin historial aún</p>
          <p className="text-sm text-tin mt-1">Ejecutá la primera comparación desde la pantalla anterior</p>
        </div>
      ) : (
        <div className="space-y-2.5">
          {sincs.map(s => {
            const meta = ESTADO_META[s.estado]
            const { icon: StateIcon } = meta
            return (
              <button
                key={s.id}
                onClick={() => navigate(`/tienda/sincronizacion/${s.id}`)}
                className="w-full bg-white rounded-2xl border border-tin/20 shadow-sm p-4 text-left hover:border-primary/40 active:scale-[0.98] transition-all duration-150 flex items-center gap-3"
              >
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${meta.cls}`}>
                  <StateIcon size={18} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-bold text-slate-900 text-sm">
                    {formatFecha(s.periodoDesde)} → {formatFecha(s.periodoHasta)}
                  </p>
                  <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                    <span className="text-xs text-tin">{formatHora(s.creadoEn)}</span>
                    <span className="text-xs text-tin">·</span>
                    <span className={`text-xs font-semibold ${meta.cls.includes('amber') ? 'text-amber-600' : 'text-tin-dark'}`}>
                      {meta.label}
                    </span>
                    {s.totalDiferencias > 0 && (
                      <>
                        <span className="text-xs text-tin">·</span>
                        <span className="text-xs font-semibold text-amber-600">
                          {s.totalDiferencias} diferencias
                        </span>
                      </>
                    )}
                  </div>
                </div>
                <ChevronRight size={16} className="text-tin shrink-0" />
              </button>
            )
          })}
        </div>
      )}

      {/* ── Paginación server-side ── */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between gap-3 pb-4">
          <button
            onClick={() => setPagina(p => Math.max(1, p - 1))}
            disabled={pagina <= 1}
            className="flex-1 py-3 bg-white border border-tin/30 rounded-2xl text-sm font-semibold text-slate-700 disabled:opacity-40 disabled:cursor-not-allowed active:scale-[0.98] transition-all min-h-[2.75rem]"
          >
            ← Anterior
          </button>
          <span className="text-sm text-tin-dark font-medium whitespace-nowrap">
            {pagina} / {totalPages}
          </span>
          <button
            onClick={() => setPagina(p => Math.min(totalPages, p + 1))}
            disabled={pagina >= totalPages}
            className="flex-1 py-3 bg-white border border-tin/30 rounded-2xl text-sm font-semibold text-slate-700 disabled:opacity-40 disabled:cursor-not-allowed active:scale-[0.98] transition-all min-h-[2.75rem]"
          >
            Siguiente →
          </button>
        </div>
      )}
    </div>
  )
}
