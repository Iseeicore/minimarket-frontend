import { useNavigate } from 'react-router-dom'
import {
  GitCompare, CheckCircle2, AlertTriangle,
  Loader2, ChevronRight, History, RefreshCw,
} from 'lucide-react'
import { useSincronizaciones, useEjecutarSincronizacion } from '../../hooks/useSincronizacion'
import { useAuthStore } from '../../store/auth.store'
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

/**
 * Calcula inicio y fin del día LOCAL como ISO UTC.
 * new Date(y, m, d, 0, 0, 0) usa hora local → .toISOString() convierte a UTC
 * correctamente, respetando el offset del cliente (ej. Peru UTC-5).
 */
function getBoundsDeHoy() {
  const hoy   = new Date()
  const y     = hoy.getFullYear()
  const m     = hoy.getMonth()
  const d     = hoy.getDate()
  const inicio = new Date(y, m, d,  0,  0,  0, 0)
  const fin    = new Date(y, m, d, 23, 59, 59, 999)
  return { desde: inicio.toISOString(), hasta: fin.toISOString() }
}

const ESTADO_META: Record<EstadoSincronizacion, {
  label: string
  cls:   string
  icon:  typeof CheckCircle2
}> = {
  PENDIENTE:       { label: 'Pendiente',       cls: 'bg-tin-pale text-tin-dark',         icon: RefreshCw     },
  EN_PROCESO:      { label: 'En proceso',       cls: 'bg-accent/20 text-accent-dark',     icon: Loader2       },
  COMPLETADA:      { label: 'Todo coincide',    cls: 'bg-primary-pale text-primary-dark', icon: CheckCircle2  },
  CON_DIFERENCIAS: { label: 'Con diferencias',  cls: 'bg-amber-100 text-amber-700',       icon: AlertTriangle },
}

// ── Página principal ───────────────────────────────────────────
export default function TiendaSincronizacionPage() {
  const navigate   = useNavigate()
  const usuario    = useAuthStore(s => s.usuario)
  const almacenId  = usuario?.almacenId ?? null

  const { data: sincs = [], isLoading } = useSincronizaciones()
  const ejecutar = useEjecutarSincronizacion()

  const recientes    = sincs.slice(0, 3)
  const ultimaSync   = sincs[0] ?? null
  const tieneProblema = ultimaSync?.estado === 'CON_DIFERENCIAS'
  const estaBien      = ultimaSync?.estado === 'COMPLETADA'

  const hoyLabel = new Date().toLocaleDateString('es-PE', {
    weekday: 'long', day: 'numeric', month: 'long',
  })

  function handleComparar() {
    if (!almacenId) return
    const { desde, hasta } = getBoundsDeHoy()
    ejecutar.mutate(
      { almacenId, tipo: 'CIERRE_DIA', desde, hasta },
      { onSuccess: (data) => navigate(`/tienda/sincronizacion/${data.id}`) },
    )
  }

  if (isLoading) {
    return (
      <div className="flex justify-center items-center py-24">
        <Loader2 size={32} className="animate-spin text-tin" />
      </div>
    )
  }

  return (
    <div className="space-y-5 pt-2">

      {/* ── Header ── */}
      <div className="flex items-center gap-3">
        <GitCompare size={22} className="text-tin-dark" />
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Sincronización</h1>
          <p className="text-sm text-tin mt-0.5 capitalize">{hoyLabel}</p>
        </div>
      </div>

      {/* ── Banner: hay diferencias ── */}
      {tieneProblema && (
        <div className="bg-amber-50 border-2 border-amber-300 rounded-2xl p-5 flex items-start gap-4">
          <AlertTriangle size={28} className="text-amber-500 shrink-0 mt-0.5" />
          <div>
            <p className="font-bold text-amber-900 text-base">Hay diferencias sin resolver</p>
            <p className="text-sm text-amber-700 mt-1">
              El último comparativo encontró diferencias entre el almacén y la tienda.
            </p>
            <button
              onClick={() => ultimaSync && navigate(`/sincronizacion/${ultimaSync.id}`)}
              className="mt-3 px-4 py-2.5 bg-amber-500 hover:bg-amber-600 text-white font-bold text-sm rounded-xl transition-colors active:scale-95"
            >
              Ver qué hay diferente
            </button>
          </div>
        </div>
      )}

      {/* ── Banner: todo bien ── */}
      {estaBien && ultimaSync && (
        <div className="bg-primary-pale border border-primary/30 rounded-2xl p-4 flex items-center gap-3">
          <CheckCircle2 size={22} className="text-primary-dark shrink-0" />
          <div>
            <p className="font-bold text-primary-dark text-sm">Todo coincide</p>
            <p className="text-xs text-tin mt-0.5">
              Última comparación a las {formatHora(ultimaSync.creadoEn)}
            </p>
          </div>
        </div>
      )}

      {/* ── Botón principal: disparo directo, sin modal ── */}
      {almacenId && (
        <button
          onClick={handleComparar}
          disabled={ejecutar.isPending}
          className="w-full flex items-center justify-center gap-3 py-6 bg-primary hover:bg-primary-dark text-slate-900 font-bold text-xl rounded-2xl shadow-md shadow-primary/20 active:scale-[0.98] transition-all duration-150 disabled:opacity-60 disabled:cursor-not-allowed"
        >
          {ejecutar.isPending
            ? <><Loader2 size={24} className="animate-spin" /> Comparando...</>
            : <><GitCompare size={24} /> Comparar el día de hoy</>
          }
        </button>
      )}

      {/* ── Comparaciones recientes ── */}
      {recientes.length > 0 && (
        <div>
          <div className="flex items-center justify-between mb-3">
            <p className="text-sm font-semibold text-tin-dark uppercase tracking-wide">Últimas comparaciones</p>
            <button
              onClick={() => navigate('/tienda/sincronizacion/historial')}
              className="flex items-center gap-1 text-sm text-primary-dark font-medium hover:underline"
            >
              <History size={14} />
              Ver todo el historial
            </button>
          </div>
          <div className="space-y-2.5">
            {recientes.map(s => {
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
                      {formatFecha(s.creadoEn)}
                    </p>
                    <div className="flex items-center gap-3 mt-0.5">
                      <span className="text-xs text-tin">{formatHora(s.creadoEn)}</span>
                      {s.totalDiferencias > 0 && (
                        <span className="text-xs font-semibold text-amber-600">
                          {s.totalDiferencias} diferencias
                        </span>
                      )}
                      {s.totalDiferencias === 0 && s.estado === 'COMPLETADA' && (
                        <span className="text-xs font-semibold text-primary-dark">
                          {s.totalCoincidencias} coincidencias
                        </span>
                      )}
                    </div>
                  </div>
                  <ChevronRight size={16} className="text-tin shrink-0" />
                </button>
              )
            })}
          </div>
        </div>
      )}

      {/* ── Empty state ── */}
      {sincs.length === 0 && (
        <div className="bg-white rounded-2xl border border-tin/20 p-8 text-center">
          <GitCompare size={36} className="mx-auto text-tin mb-3" />
          <p className="font-semibold text-slate-700">Sin comparaciones aún</p>
          <p className="text-sm text-tin mt-1">Tocá el botón para hacer la primera comparación del día</p>
        </div>
      )}
    </div>
  )
}
