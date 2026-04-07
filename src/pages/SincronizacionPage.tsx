import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { GitCompare, Plus, Loader2, ChevronRight, ChevronDown } from 'lucide-react'
import { useSincronizaciones, useEjecutarSincronizacion } from '../hooks/useSincronizacion'
import { useAlmacenes } from '../hooks/useAlmacenes'
import { useAuthStore } from '../store/auth.store'
import { getLocalISO } from '../lib/date'
import Modal from '../components/shared/Modal'
import EmptyState from '../components/shared/EmptyState'
import type { TipoSincronizacion, EstadoSincronizacion } from '../types'

// ── Helpers ────────────────────────────────────────────────────
function formatFecha(iso: string) {
  return new Date(iso).toLocaleDateString('es-PE', {
    day: '2-digit', month: '2-digit', year: 'numeric',
  })
}

function formatFechaHora(iso: string) {
  return new Date(iso).toLocaleString('es-PE', {
    day: '2-digit', month: '2-digit', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  })
}

const ESTADO_COLOR: Record<EstadoSincronizacion, string> = {
  PENDIENTE:         'bg-gray-100 text-gray-600',
  EN_PROCESO:        'bg-blue-100 text-blue-700',
  COMPLETADA:        'bg-green-100 text-green-700',
  CON_DIFERENCIAS:   'bg-amber-100 text-amber-700',
}

const ESTADO_LABEL: Record<EstadoSincronizacion, string> = {
  PENDIENTE:       'Pendiente',
  EN_PROCESO:      'En proceso',
  COMPLETADA:      'Completada',
  CON_DIFERENCIAS: 'Con diferencias',
}

const TIPO_LABEL: Record<TipoSincronizacion, string> = {
  MANUAL:      'Manual',
  CIERRE_DIA:  'Cierre del día',
  PROGRAMADA:  'Programada',
}

// ── Formulario nueva sincronización ───────────────────────────
interface FormNuevaSincProps {
  onClose: () => void
}
function FormNuevaSync({ onClose }: FormNuevaSincProps) {
  const hoy    = getLocalISO()
  const ayer   = getLocalISO(new Date(Date.now() - 86400000))

  const { data: almacenes = [] }      = useAlmacenes()
  const usuario                       = useAuthStore(s => s.usuario)
  const defaultAlmacen                = usuario?.almacenId ? String(usuario.almacenId) : ''

  const [almacenId, setAlmacenId]     = useState(defaultAlmacen)
  const [tipo, setTipo]               = useState<TipoSincronizacion>('MANUAL')
  const [desde, setDesde]             = useState(ayer)
  const [hasta, setHasta]             = useState(hoy)

  const ejecutar = useEjecutarSincronizacion()

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!almacenId) return
    ejecutar.mutate(
      {
        almacenId: Number(almacenId),
        tipo,
        desde: new Date(desde).toISOString(),
        hasta: new Date(hasta + 'T23:59:59').toISOString(),
      },
      { onSuccess: onClose }
    )
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {/* Almacén */}
      <div>
        <label className="block text-xs font-semibold text-gray-600 uppercase tracking-wide mb-1">
          Almacén
        </label>
        <div className="relative">
          <select
            value={almacenId}
            onChange={e => setAlmacenId(e.target.value)}
            className="appearance-none w-full rounded-lg border border-tin/30 px-3 py-2 text-sm focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary bg-white cursor-pointer pr-7"
          >
            <option value="">Seleccioná un almacén</option>
            {almacenes.map(a => (
              <option key={a.id} value={a.id}>{a.nombre}</option>
            ))}
          </select>
          <ChevronDown size={12} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-tin pointer-events-none" />
        </div>
      </div>

      {/* Tipo */}
      <div>
        <label className="block text-xs font-semibold text-gray-600 uppercase tracking-wide mb-1">
          Tipo
        </label>
        <div className="flex gap-2">
          {(['MANUAL', 'CIERRE_DIA'] as TipoSincronizacion[]).map(t => (
            <button
              key={t}
              type="button"
              onClick={() => setTipo(t)}
              className={`flex-1 py-2 rounded-lg text-xs font-semibold border transition-colors ${
                tipo === t
                  ? 'bg-primary text-white border-primary'
                  : 'border-tin/30 text-gray-600 hover:border-tin/60'
              }`}
            >
              {TIPO_LABEL[t]}
            </button>
          ))}
        </div>
      </div>

      {/* Período */}
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-xs font-semibold text-gray-600 uppercase tracking-wide mb-1">
            Desde
          </label>
          <input
            type="date"
            value={desde}
            onChange={e => setDesde(e.target.value)}
            max={hasta}
            className="w-full rounded-lg border border-tin/30 px-3 py-2 text-sm focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary"
          />
        </div>
        <div>
          <label className="block text-xs font-semibold text-gray-600 uppercase tracking-wide mb-1">
            Hasta
          </label>
          <input
            type="date"
            value={hasta}
            onChange={e => setHasta(e.target.value)}
            min={desde}
            max={hoy}
            className="w-full rounded-lg border border-tin/30 px-3 py-2 text-sm focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary"
          />
        </div>
      </div>

      <div className="flex gap-2 pt-1">
        <button
          type="button"
          onClick={onClose}
          className="flex-1 py-2.5 rounded-xl border border-tin/30 text-sm font-medium text-gray-600 hover:bg-tin-pale transition-colors"
        >
          Cancelar
        </button>
        <button
          type="submit"
          disabled={!almacenId || ejecutar.isPending}
          className="flex-1 py-2.5 rounded-xl bg-primary hover:bg-primary-dark text-white font-semibold text-sm transition-all duration-150 active:scale-95 disabled:opacity-50"
        >
          {ejecutar.isPending
            ? <Loader2 size={14} className="animate-spin mx-auto" />
            : 'Ejecutar sincronización'
          }
        </button>
      </div>
    </form>
  )
}

// ── Página principal ───────────────────────────────────────────
export default function SincronizacionPage() {
  const { data: sincronizaciones = [], isLoading } = useSincronizaciones()
  const navigate = useNavigate()
  const [showForm, setShowForm] = useState(false)

  if (isLoading) {
    return (
      <div className="flex justify-center items-center py-24">
        <Loader2 size={32} className="animate-spin text-tin" />
      </div>
    )
  }

  return (
    <div className="space-y-5">

      {/* ── Header ── */}
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-3">
          <GitCompare size={22} className="text-tin-dark shrink-0" />
          <div>
            <h1 className="text-2xl font-bold text-gray-800">Sincronización</h1>
            <p className="text-sm text-tin-dark mt-0.5">Compará el cuaderno almacén vs. tienda</p>
          </div>
        </div>
        <button
          onClick={() => setShowForm(true)}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-primary hover:bg-primary-dark text-white font-semibold text-sm transition-all duration-150 active:scale-95 shrink-0"
        >
          <Plus size={15} />
          <span className="hidden sm:inline">Nueva sincronización</span>
          <span className="sm:hidden">Nueva</span>
        </button>
      </div>

      {/* ── Lista ── */}
      {sincronizaciones.length === 0 ? (
        <EmptyState message="Sin sincronizaciones. ¡Ejecutá la primera para detectar diferencias!" />
      ) : (
        <div className="space-y-3">
          {sincronizaciones.map(s => (
            <button
              key={s.id}
              onClick={() => navigate(`/sincronizacion/${s.id}`)}
              className="w-full bg-white rounded-2xl border border-tin/20 shadow-sm p-4 text-left hover:border-primary/40 hover:shadow-md transition-all duration-150 group"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1 min-w-0">
                  {/* Período y almacén */}
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-semibold text-gray-800 text-sm">
                      {formatFecha(s.periodoDesde)} → {formatFecha(s.periodoHasta)}
                    </span>
                    <span className="text-xs text-gray-400">·</span>
                    <span className="text-xs text-gray-500">{s.almacen?.nombre ?? `Almacén #${s.almacenId}`}</span>
                  </div>

                  {/* Tipo y fecha */}
                  <div className="flex items-center gap-2 mt-1">
                    <span className="text-xs text-gray-400">{TIPO_LABEL[s.tipo]}</span>
                    <span className="text-xs text-gray-300">·</span>
                    <span className="text-xs text-gray-400">{formatFechaHora(s.creadoEn)}</span>
                  </div>

                  {/* Stats */}
                  <div className="flex items-center gap-4 mt-2.5">
                    <div className="flex items-center gap-1.5">
                      <div className="w-2 h-2 rounded-full bg-green-400" />
                      <span className="text-xs text-gray-600">
                        <span className="font-semibold">{s.totalCoincidencias}</span> coincidencias
                      </span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <div className={`w-2 h-2 rounded-full ${s.totalDiferencias > 0 ? 'bg-amber-400' : 'bg-gray-300'}`} />
                      <span className="text-xs text-gray-600">
                        <span className={`font-semibold ${s.totalDiferencias > 0 ? 'text-amber-600' : ''}`}>
                          {s.totalDiferencias}
                        </span> diferencias
                      </span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <span className={`px-2.5 py-1 rounded-full text-xs font-semibold ${ESTADO_COLOR[s.estado]}`}>
                    {ESTADO_LABEL[s.estado]}
                  </span>
                  <ChevronRight size={16} className="text-gray-300 group-hover:text-primary transition-colors" />
                </div>
              </div>
            </button>
          ))}
        </div>
      )}

      {/* ── Modal nueva sincronización ── */}
      <Modal open={showForm} title="Nueva sincronización" onClose={() => setShowForm(false)} size="sm">
        <FormNuevaSync onClose={() => setShowForm(false)} />
      </Modal>
    </div>
  )
}
