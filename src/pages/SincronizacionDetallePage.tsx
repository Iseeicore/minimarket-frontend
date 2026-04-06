import { useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { ArrowLeft, GitCompare, Loader2, CheckCheck, ChevronDown } from 'lucide-react'
import { useSincronizacion, useResolverItem, useResolverAuto } from '../hooks/useSincronizacion'
import Modal from '../components/shared/Modal'
import type { EstadoSincronizacion, EstadoReconciliacion, ReconciliacionItem } from '../types'

// ── Helpers ────────────────────────────────────────────────────
function formatFecha(iso: string) {
  return new Date(iso).toLocaleDateString('es-PE', {
    day: '2-digit', month: '2-digit', year: 'numeric',
  })
}

const ESTADO_SINC_COLOR: Record<EstadoSincronizacion, string> = {
  PENDIENTE:       'bg-gray-100 text-gray-600',
  EN_PROCESO:      'bg-blue-100 text-blue-700',
  COMPLETADA:      'bg-green-100 text-green-700',
  CON_DIFERENCIAS: 'bg-amber-100 text-amber-700',
}

const ESTADO_SINC_LABEL: Record<EstadoSincronizacion, string> = {
  PENDIENTE:       'Pendiente',
  EN_PROCESO:      'En proceso',
  COMPLETADA:      'Completada',
  CON_DIFERENCIAS: 'Con diferencias',
}

const ESTADO_ITEM_COLOR: Record<EstadoReconciliacion, string> = {
  COINCIDE:          'bg-green-100 text-green-700',
  DIFERENCIA:        'bg-amber-100 text-amber-700',
  SIN_CONTRAPARTIDA: 'bg-orange-100 text-orange-700',
  PENDIENTE_REVISION:'bg-blue-100 text-blue-700',
  RESUELTO:          'bg-gray-100 text-gray-500',
}

const ESTADO_ITEM_LABEL: Record<EstadoReconciliacion, string> = {
  COINCIDE:          'Coincide',
  DIFERENCIA:        'Diferencia',
  SIN_CONTRAPARTIDA: 'Sin contrapartida',
  PENDIENTE_REVISION:'Pendiente revisión',
  RESUELTO:          'Resuelto',
}

// ── Modal resolver ítem ────────────────────────────────────────
interface ResolverItemModalProps {
  item: ReconciliacionItem
  sincId: number
  onClose: () => void
}
function ResolverItemModal({ item, sincId, onClose }: ResolverItemModalProps) {
  const [estado, setEstado] = useState<EstadoReconciliacion>('RESUELTO')
  const [notas, setNotas]   = useState('')
  const resolver            = useResolverItem(sincId)

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    resolver.mutate(
      { itemId: item.id, data: { estado, notas: notas.trim() || undefined } },
      { onSuccess: onClose }
    )
  }

  return (
    <div className="space-y-4">
      {/* Info del ítem */}
      <div className="bg-tin-pale rounded-xl p-3 space-y-1.5">
        <p className="text-sm font-semibold text-gray-800">
          {item.variante?.nombre ?? `Variante #${item.varianteId}`}
        </p>
        <div className="flex items-center gap-4 text-xs text-gray-600">
          <span>Almacén: <span className="font-semibold">{item.cantidadAlmacen}</span></span>
          <span>Tienda: <span className="font-semibold">{item.cantidadTienda}</span></span>
          <span>
            Diferencia:{' '}
            <span className={`font-semibold ${item.diferencia !== 0 ? 'text-amber-600' : 'text-green-600'}`}>
              {item.diferencia > 0 ? `+${item.diferencia}` : item.diferencia}
            </span>
          </span>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Estado final */}
        <div>
          <label className="block text-xs font-semibold text-gray-600 uppercase tracking-wide mb-1">
            Marcar como
          </label>
          <div className="relative">
            <select
              value={estado}
              onChange={e => setEstado(e.target.value as EstadoReconciliacion)}
              className="appearance-none w-full rounded-lg border border-tin/30 px-3 py-2 text-sm focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary bg-white cursor-pointer pr-7"
            >
              <option value="RESUELTO">Resuelto</option>
              <option value="PENDIENTE_REVISION">Pendiente revisión</option>
              <option value="COINCIDE">Coincide</option>
            </select>
            <ChevronDown size={12} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-tin pointer-events-none" />
          </div>
        </div>

        {/* Notas */}
        <div>
          <label className="block text-xs font-semibold text-gray-600 uppercase tracking-wide mb-1">
            Notas <span className="font-normal text-tin normal-case">(opcional)</span>
          </label>
          <textarea
            value={notas}
            onChange={e => setNotas(e.target.value)}
            rows={2}
            placeholder="Explicación de la resolución..."
            className="w-full rounded-lg border border-tin/30 px-3 py-2 text-sm focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary resize-none"
          />
        </div>

        <div className="flex gap-2">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 py-2.5 rounded-xl border border-tin/30 text-sm font-medium text-gray-600 hover:bg-tin-pale transition-colors"
          >
            Cancelar
          </button>
          <button
            type="submit"
            disabled={resolver.isPending}
            className="flex-1 py-2.5 rounded-xl bg-primary hover:bg-primary-dark text-white font-semibold text-sm transition-all duration-150 active:scale-95 disabled:opacity-50"
          >
            {resolver.isPending ? <Loader2 size={14} className="animate-spin mx-auto" /> : 'Confirmar'}
          </button>
        </div>
      </form>
    </div>
  )
}

// ── Página principal ───────────────────────────────────────────
export default function SincronizacionDetallePage() {
  const { id }     = useParams<{ id: string }>()
  const navigate   = useNavigate()
  const sincId     = id ? Number(id) : null

  const { data: sinc, isLoading } = useSincronizacion(sincId)
  const resolverAuto              = useResolverAuto(sincId ?? 0)

  const [resolverItem, setResolverItem] = useState<ReconciliacionItem | null>(null)

  const items    = sinc?.reconciliacion ?? []
  const pendientes = items.filter(i =>
    i.estado !== 'COINCIDE' && i.estado !== 'RESUELTO'
  )

  if (isLoading || !sinc) {
    return (
      <div className="flex justify-center items-center py-24">
        <Loader2 size={32} className="animate-spin text-tin" />
      </div>
    )
  }

  return (
    <div className="space-y-5">

      {/* ── Header ── */}
      <div className="flex items-start gap-3">
        <button
          onClick={() => navigate('/sincronizacion')}
          className="p-2 rounded-xl hover:bg-tin-pale transition-colors text-gray-500 hover:text-gray-800 shrink-0 mt-0.5"
        >
          <ArrowLeft size={18} />
        </button>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-3 flex-wrap">
            <div className="flex items-center gap-2">
              <GitCompare size={20} className="text-tin-dark" />
              <h1 className="text-xl font-bold text-gray-800">Sincronización #{sinc.id}</h1>
            </div>
            <span className={`px-2.5 py-1 rounded-full text-xs font-semibold ${ESTADO_SINC_COLOR[sinc.estado]}`}>
              {ESTADO_SINC_LABEL[sinc.estado]}
            </span>
          </div>
          <p className="text-sm text-gray-500 mt-1">
            {formatFecha(sinc.periodoDesde)} → {formatFecha(sinc.periodoHasta)}
            {sinc.almacen && <span className="ml-2">· {sinc.almacen.nombre}</span>}
          </p>
        </div>
      </div>

      {/* ── Stats ── */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="bg-white rounded-2xl border border-tin/20 shadow-sm p-4 text-center">
          <p className="text-xs text-gray-400 uppercase tracking-wide">Total ítems</p>
          <p className="text-2xl font-bold text-gray-800 mt-1">{items.length}</p>
        </div>
        <div className="bg-white rounded-2xl border border-tin/20 shadow-sm p-4 text-center">
          <p className="text-xs text-gray-400 uppercase tracking-wide">Coincidencias</p>
          <p className="text-2xl font-bold text-green-600 mt-1">{sinc.totalCoincidencias}</p>
        </div>
        <div className="bg-white rounded-2xl border border-tin/20 shadow-sm p-4 text-center">
          <p className="text-xs text-gray-400 uppercase tracking-wide">Diferencias</p>
          <p className={`text-2xl font-bold mt-1 ${sinc.totalDiferencias > 0 ? 'text-amber-600' : 'text-gray-800'}`}>
            {sinc.totalDiferencias}
          </p>
        </div>
        <div className="bg-white rounded-2xl border border-tin/20 shadow-sm p-4 text-center">
          <p className="text-xs text-gray-400 uppercase tracking-wide">Sin resolver</p>
          <p className={`text-2xl font-bold mt-1 ${pendientes.length > 0 ? 'text-blue-600' : 'text-gray-800'}`}>
            {pendientes.length}
          </p>
        </div>
      </div>

      {/* ── Acciones bulk ── */}
      {pendientes.length > 0 && (
        <div className="flex justify-end">
          <button
            onClick={() => resolverAuto.mutate()}
            disabled={resolverAuto.isPending}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-primary hover:bg-primary-dark text-white font-semibold text-sm transition-all duration-150 active:scale-95 disabled:opacity-50"
          >
            {resolverAuto.isPending
              ? <Loader2 size={14} className="animate-spin" />
              : <CheckCheck size={15} />
            }
            Resolver todos automáticamente
          </button>
        </div>
      )}

      {/* ── Items tabla — md+ ── */}
      {items.length > 0 && (
        <>
          <div className="hidden md:block bg-white rounded-2xl border border-tin/20 shadow-sm overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-tin/20">
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Variante</th>
                  <th className="text-center px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Almacén</th>
                  <th className="text-center px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Tienda</th>
                  <th className="text-center px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Diferencia</th>
                  <th className="text-center px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Estado</th>
                  <th className="px-4 py-3" />
                </tr>
              </thead>
              <tbody>
                {items.map((item, idx) => (
                  <tr
                    key={item.id}
                    className={`border-b border-tin/10 last:border-0 ${idx % 2 === 0 ? '' : 'bg-tin-pale/40'}`}
                  >
                    <td className="px-4 py-3">
                      <span className="font-medium text-gray-800">
                        {item.variante?.nombre ?? `Variante #${item.varianteId}`}
                      </span>
                      {item.variante?.sku && (
                        <span className="ml-2 text-xs text-tin">{item.variante.sku}</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-center font-semibold text-gray-700">{item.cantidadAlmacen}</td>
                    <td className="px-4 py-3 text-center font-semibold text-gray-700">{item.cantidadTienda}</td>
                    <td className="px-4 py-3 text-center">
                      <span className={`font-bold ${
                        item.diferencia > 0 ? 'text-green-600' :
                        item.diferencia < 0 ? 'text-red-600' : 'text-gray-400'
                      }`}>
                        {item.diferencia > 0 ? `+${item.diferencia}` : item.diferencia}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-center">
                      <span className={`px-2.5 py-1 rounded-full text-xs font-semibold ${ESTADO_ITEM_COLOR[item.estado]}`}>
                        {ESTADO_ITEM_LABEL[item.estado]}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      {item.estado !== 'COINCIDE' && item.estado !== 'RESUELTO' && (
                        <button
                          onClick={() => setResolverItem(item)}
                          className="px-3 py-1.5 rounded-lg border border-primary/30 text-primary text-xs font-medium hover:bg-primary/10 transition-colors"
                        >
                          Resolver
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Cards — mobile */}
          <div className="md:hidden space-y-3">
            {items.map(item => (
              <div key={item.id} className="bg-white rounded-2xl border border-tin/20 shadow-sm p-4">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1 min-w-0">
                    <span className="font-semibold text-gray-800 text-sm">
                      {item.variante?.nombre ?? `Variante #${item.varianteId}`}
                    </span>
                    {item.variante?.sku && (
                      <span className="ml-2 text-xs text-tin">{item.variante.sku}</span>
                    )}
                  </div>
                  <span className={`shrink-0 px-2.5 py-1 rounded-full text-xs font-semibold ${ESTADO_ITEM_COLOR[item.estado]}`}>
                    {ESTADO_ITEM_LABEL[item.estado]}
                  </span>
                </div>

                <div className="mt-3 flex items-center justify-between gap-3">
                  <div className="flex items-center gap-4 text-xs text-gray-600">
                    <div>
                      <p className="text-gray-400">Almacén</p>
                      <p className="font-bold text-gray-800">{item.cantidadAlmacen}</p>
                    </div>
                    <div>
                      <p className="text-gray-400">Tienda</p>
                      <p className="font-bold text-gray-800">{item.cantidadTienda}</p>
                    </div>
                    <div>
                      <p className="text-gray-400">Dif.</p>
                      <p className={`font-bold ${
                        item.diferencia > 0 ? 'text-green-600' :
                        item.diferencia < 0 ? 'text-red-600' : 'text-gray-400'
                      }`}>
                        {item.diferencia > 0 ? `+${item.diferencia}` : item.diferencia}
                      </p>
                    </div>
                  </div>
                  {item.estado !== 'COINCIDE' && item.estado !== 'RESUELTO' && (
                    <button
                      onClick={() => setResolverItem(item)}
                      className="px-3 py-1.5 rounded-lg border border-primary/30 text-primary text-xs font-medium hover:bg-primary/10 transition-colors shrink-0"
                    >
                      Resolver
                    </button>
                  )}
                </div>

                {item.notas && (
                  <p className="text-xs text-gray-400 mt-2 italic">"{item.notas}"</p>
                )}
              </div>
            ))}
          </div>
        </>
      )}

      {/* ── Modal resolver ítem ── */}
      <Modal
        open={resolverItem !== null}
        title="Resolver ítem"
        onClose={() => setResolverItem(null)}
        size="sm"
      >
        {resolverItem && sincId && (
          <ResolverItemModal
            item={resolverItem}
            sincId={sincId}
            onClose={() => setResolverItem(null)}
          />
        )}
      </Modal>
    </div>
  )
}
