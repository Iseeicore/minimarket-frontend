import { useState } from 'react'
import { Search, Plus, Loader2, X } from 'lucide-react'
import { useDevoluciones, useCreateDevolucion } from '../hooks/useDevoluciones'
import { useVenta } from '../hooks/useVentas'
import Modal from '../components/shared/Modal'
import EmptyState from '../components/shared/EmptyState'
import Pagination from '../components/shared/Pagination'

// ── Helpers ────────────────────────────────────────────────────
function fmt(decimal: string | number) {
  return parseFloat(String(decimal)).toLocaleString('es-PE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
}

function formatFecha(iso: string) {
  return new Date(iso).toLocaleDateString('es-PE', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' })
}

// ── Sub-componente: step 2 — elegir ítems ─────────────────────
interface SeleccionItemsProps {
  ventaId: number
  onClose: () => void
}

function SeleccionItems({ ventaId, onClose }: SeleccionItemsProps) {
  const { data: venta, isLoading } = useVenta(ventaId)
  const createDevolucion           = useCreateDevolucion()

  // cantidad a devolver por itemVentaId
  const [cantidades, setCantidades] = useState<Record<number, number>>({})
  const [motivo, setMotivo]         = useState('')
  const [notas, setNotas]           = useState('')

  function handleChange(itemId: number, max: number, value: string) {
    const n = Math.min(Math.max(0, parseInt(value) || 0), max)
    setCantidades(prev => ({ ...prev, [itemId]: n }))
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!venta) return

    // Solo ítems con cantidad > 0
    const items = venta.items!
      .filter(i => (cantidades[i.id] ?? 0) > 0)
      .map(i => {
        const cant          = cantidades[i.id]
        const precio        = parseFloat(i.precioUnitario)
        const montoDevuelto = precio * cant  // sin descuento en la devolución simple
        return {
          itemVentaId:      i.id,
          cantidadDevuelta: cant,
          tipoDescuento:    'NINGUNO' as const,
          valorDescuento:   0,
          montoDevuelto,
        }
      })

    if (items.length === 0) return

    createDevolucion.mutate(
      { ventaId, motivo: motivo.trim() || undefined, notas: notas.trim() || undefined, items },
      { onSuccess: onClose }
    )
  }

  if (isLoading) {
    return (
      <div className="flex justify-center py-8">
        <Loader2 size={24} className="animate-spin text-tin" />
      </div>
    )
  }

  if (!venta || !venta.items?.length) {
    return <p className="text-sm text-tin text-center py-6">No se encontraron ítems para esta venta.</p>
  }

  const algunaCantidad = Object.values(cantidades).some(c => c > 0)

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {/* Info venta */}
      <div className="p-3 rounded-xl bg-tin-pale text-sm text-gray-700 flex justify-between">
        <span>Venta #{venta.id} · {formatFecha(venta.creadoEn)}</span>
        <span className="font-semibold">S/ {fmt(venta.total)}</span>
      </div>

      {/* Ítems */}
      <div className="space-y-2">
        <p className="text-xs font-semibold text-tin-dark uppercase tracking-wide">Ítems a devolver</p>
        {venta.items.map(item => {
          const cantMax = item.cantidad
          return (
            <div key={item.id} className="flex items-center justify-between p-3 rounded-xl border border-tin/20 bg-white">
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-800 truncate">
                  {item.variante?.nombre ?? `Variante #${item.varianteId}`}
                </p>
                <p className="text-xs text-tin-dark">
                  Vendido: {item.cantidad} · S/ {fmt(item.precioUnitario)} c/u
                </p>
              </div>
              <div className="flex items-center gap-2 shrink-0 ml-3">
                <span className="text-xs text-tin-dark">Devolver:</span>
                <input
                  type="number"
                  min={0}
                  max={cantMax}
                  value={cantidades[item.id] ?? 0}
                  onChange={e => handleChange(item.id, cantMax, e.target.value)}
                  className="w-16 text-center rounded-lg border border-tin/30 px-2 py-1 text-sm focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary"
                />
              </div>
            </div>
          )
        })}
      </div>

      {/* Motivo y notas */}
      <div>
        <label className="block text-xs font-medium text-tin-dark mb-1">Motivo (opcional)</label>
        <input
          type="text"
          value={motivo}
          onChange={e => setMotivo(e.target.value)}
          placeholder="Ej: producto en mal estado"
          className="w-full rounded-xl border border-tin/30 px-3 py-2 text-sm focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary"
        />
      </div>
      <div>
        <label className="block text-xs font-medium text-tin-dark mb-1">Notas (opcional)</label>
        <textarea
          value={notas}
          onChange={e => setNotas(e.target.value)}
          rows={2}
          placeholder="Observaciones adicionales..."
          className="w-full rounded-xl border border-tin/30 px-3 py-2 text-sm focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary resize-none"
        />
      </div>

      <div className="flex gap-2 pt-1">
        <button
          type="button"
          onClick={onClose}
          className="flex-1 py-2.5 rounded-xl border border-tin/30 text-sm font-medium text-gray-700 hover:bg-tin-pale transition-colors"
        >
          Cancelar
        </button>
        <button
          type="submit"
          disabled={!algunaCantidad || createDevolucion.isPending}
          className="flex-1 py-2.5 rounded-xl bg-primary hover:bg-primary-dark text-white font-semibold text-sm transition-all duration-150 active:scale-95 disabled:opacity-50"
        >
          {createDevolucion.isPending ? 'Procesando...' : 'Confirmar devolución'}
        </button>
      </div>
    </form>
  )
}

// ── Página principal ───────────────────────────────────────────
export default function DevolucionesPage() {
  const [page, setPage]           = useState(1)
  const LIMIT                     = 20
  const { data: result, isLoading } = useDevoluciones(page, LIMIT)
  const devoluciones              = result?.data ?? []
  const meta                      = result?.meta

  const [modalOpen, setModalOpen] = useState(false)

  // Step 1: ingresar ID de venta
  const [ventaInput, setVentaInput] = useState('')
  const [ventaId, setVentaId]       = useState<number | null>(null)

  function handleBuscarVenta(e: React.FormEvent) {
    e.preventDefault()
    const id = parseInt(ventaInput, 10)
    if (id > 0) setVentaId(id)
  }

  function resetModal() {
    setModalOpen(false)
    setVentaInput('')
    setVentaId(null)
  }

  // ── Skeleton ─────────────────────────────────────────────────
  if (isLoading) {
    return (
      <div className="space-y-4 animate-pulse">
        <div className="h-8 w-48 bg-tin-pale rounded" />
        {[...Array(4)].map((_, i) => (
          <div key={i} className="h-16 bg-tin-pale rounded-2xl" />
        ))}
      </div>
    )
  }

  return (
    <div className="space-y-6">

      {/* ── Header ── */}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-800">Devoluciones</h1>
        <button
          onClick={() => setModalOpen(true)}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-primary hover:bg-primary-dark text-white font-semibold text-sm transition-all duration-150 active:scale-95"
        >
          <Plus size={16} /> Nueva devolución
        </button>
      </div>

      {/* ── Lista desktop ── */}
      {devoluciones.length === 0 ? (
        <EmptyState message="Aún no hay devoluciones registradas." />
      ) : (
        <>
          {/* Tabla desktop */}
          <div className="hidden sm:block bg-white rounded-2xl border border-tin/20 shadow-sm overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-tin-pale text-tin-dark text-xs uppercase tracking-wide">
                <tr>
                  <th className="px-5 py-3 text-left font-medium">#</th>
                  <th className="px-5 py-3 text-left font-medium">Venta</th>
                  <th className="px-5 py-3 text-left font-medium">Fecha</th>
                  <th className="px-5 py-3 text-left font-medium">Motivo</th>
                  <th className="px-5 py-3 text-right font-medium">Ítems</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-tin/10">
                {devoluciones.map(dev => (
                  <tr key={dev.id} className="hover:bg-tin-pale/50 transition-colors">
                    <td className="px-5 py-3 text-tin-dark font-mono">#{dev.id}</td>
                    <td className="px-5 py-3 text-gray-700">Venta #{dev.ventaId}</td>
                    <td className="px-5 py-3 text-gray-700">{formatFecha(dev.creadoEn)}</td>
                    <td className="px-5 py-3 text-gray-700 italic">{dev.motivo ?? '—'}</td>
                    <td className="px-5 py-3 text-right text-gray-700">
                      {dev.items?.length ?? '—'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Cards mobile */}
          <div className="sm:hidden space-y-3">
            {devoluciones.map(dev => (
              <div key={dev.id} className="bg-white rounded-2xl border border-tin/20 shadow-sm p-4">
                <div className="flex justify-between items-start">
                  <div>
                    <p className="font-semibold text-gray-800">Devolución #{dev.id}</p>
                    <p className="text-sm text-tin-dark mt-0.5">Venta #{dev.ventaId}</p>
                    {dev.motivo && <p className="text-sm text-gray-600 italic mt-0.5">{dev.motivo}</p>}
                  </div>
                  <p className="text-xs text-tin shrink-0 ml-3">{formatFecha(dev.creadoEn)}</p>
                </div>
              </div>
            ))}
          </div>

          {meta && (
            <Pagination
              page={page}
              totalPages={meta.totalPages}
              total={meta.total}
              limit={LIMIT}
              onPage={p => { setPage(p); window.scrollTo({ top: 0, behavior: 'smooth' }) }}
            />
          )}
        </>
      )}

      {/* ── Modal nueva devolución ── */}
      <Modal
        open={modalOpen}
        onClose={resetModal}
        title="Nueva devolución"
      >
        {!ventaId ? (
          /* Step 1: buscar venta */
          <form onSubmit={handleBuscarVenta} className="space-y-4">
            <p className="text-sm text-gray-600">
              Ingresá el número de la venta a devolver. El sistema traerá los ítems vendidos.
            </p>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">N° de venta</label>
              <div className="flex gap-2">
                <input
                  type="number"
                  min={1}
                  value={ventaInput}
                  onChange={e => setVentaInput(e.target.value)}
                  placeholder="Ej: 42"
                  className="flex-1 rounded-xl border border-tin/30 px-3 py-2.5 text-sm focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary"
                  autoFocus
                  required
                />
                <button
                  type="submit"
                  className="px-4 py-2.5 rounded-xl bg-primary hover:bg-primary-dark text-white font-semibold text-sm transition-all duration-150 active:scale-95 flex items-center gap-1.5"
                >
                  <Search size={14} /> Buscar
                </button>
              </div>
            </div>
            <button
              type="button"
              onClick={resetModal}
              className="w-full py-2.5 rounded-xl border border-tin/30 text-sm font-medium text-gray-700 hover:bg-tin-pale transition-colors"
            >
              Cancelar
            </button>
          </form>
        ) : (
          /* Step 2: seleccionar ítems */
          <div>
            <div className="flex items-center justify-between mb-4">
              <button
                onClick={() => setVentaId(null)}
                className="flex items-center gap-1 text-xs text-tin-dark hover:text-gray-700 transition-colors"
              >
                <X size={12} /> Cambiar venta
              </button>
            </div>
            <SeleccionItems ventaId={ventaId} onClose={resetModal} />
          </div>
        )}
      </Modal>

    </div>
  )
}
