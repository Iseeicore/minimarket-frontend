import { useState, useEffect } from 'react'
import { useLocation } from 'react-router-dom'
import { Search, Plus, Loader2, X, ChevronRight, CheckCircle2, AlertCircle } from 'lucide-react'
import { useDevoluciones, useCreateDevolucion } from '../hooks/useDevoluciones'
import { useVenta } from '../hooks/useVentas'
import Modal from '../components/shared/Modal'
import EmptyState from '../components/shared/EmptyState'
import Pagination from '../components/shared/Pagination'
import type { Devolucion } from '../types'

// ── Helpers ────────────────────────────────────────────────────
function fmt(n: string | number) {
  return parseFloat(String(n)).toLocaleString('es-PE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
}
function formatFecha(iso: string) {
  return new Date(iso).toLocaleString('es-PE', {
    day: '2-digit', month: '2-digit', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  })
}

// ── Calcular monto total devuelto ──────────────────────────────
function calcMontoTotal(dev: Devolucion): number {
  return (dev.items ?? []).reduce((acc, i) => acc + parseFloat(i.montoDevuelto), 0)
}

// ── Determinar si es COMPLETA o PARCIAL ───────────────────────
function calcTipo(dev: Devolucion): 'COMPLETA' | 'PARCIAL' {
  const ventaTotal  = parseFloat(dev.venta?.total ?? '0')
  const devTotal    = calcMontoTotal(dev)
  if (ventaTotal <= 0) return 'PARCIAL'
  return devTotal >= ventaTotal * 0.99 ? 'COMPLETA' : 'PARCIAL'
}

// ── Fila colapsable de devolución ──────────────────────────────
function DevolucionRow({
  dev, expanded, onToggle,
}: { dev: Devolucion; expanded: boolean; onToggle: (id: number) => void }) {
  const tipo       = calcTipo(dev)
  const montoTotal = calcMontoTotal(dev)
  const isCompleta = tipo === 'COMPLETA'

  return (
    <div className={`border-b last:border-0 border-tin/10 ${isCompleta ? '' : ''}`}>

      {/* Fila principal */}
      <button
        type="button"
        onClick={() => onToggle(dev.id)}
        className={`w-full flex items-center gap-2.5 px-4 py-3.5 text-left transition-colors min-h-[2.75rem] ${
          isCompleta
            ? 'hover:bg-green-50/50'
            : 'hover:bg-amber-50/50'
        }`}
      >
        <ChevronRight
          size={13}
          className={`shrink-0 transition-transform duration-200 ${expanded ? 'rotate-90' : ''} ${
            isCompleta ? 'text-green-500' : 'text-amber-500'
          }`}
        />

        {/* ID */}
        <span className="text-xs font-mono text-tin w-8 shrink-0">#{dev.id}</span>

        {/* Fecha */}
        <span className="text-xs text-tin-dark shrink-0 hidden sm:inline w-28">
          {formatFecha(dev.creadoEn)}
        </span>

        {/* Venta + cliente */}
        <div className="flex-1 min-w-0">
          <span className="text-sm text-gray-700">
            Venta <span className="font-semibold">#{dev.ventaId}</span>
          </span>
          {dev.venta?.contacto?.nombre && (
            <span className="text-xs text-tin ml-2 hidden md:inline">
              · {dev.venta.contacto.nombre}
            </span>
          )}
          {dev.motivo && (
            <span className="text-xs text-tin-dark italic ml-2 hidden lg:inline">
              — {dev.motivo}
            </span>
          )}
        </div>

        {/* Badge COMPLETA / PARCIAL */}
        <span className={`shrink-0 flex items-center gap-1 text-xs font-semibold px-2.5 py-0.5 rounded-full border ${
          isCompleta
            ? 'bg-green-50 text-green-700 border-green-200'
            : 'bg-amber-50 text-amber-700 border-amber-200'
        }`}>
          {isCompleta
            ? <CheckCircle2 size={10} />
            : <AlertCircle size={10} />
          }
          {isCompleta ? 'Completa' : 'Parcial'}
        </span>

        {/* Monto */}
        <span className={`text-sm font-bold tabular-nums shrink-0 ${
          isCompleta ? 'text-green-700' : 'text-amber-700'
        }`}>
          -S/ {fmt(montoTotal)}
        </span>
      </button>

      {/* Contenido expandido */}
      {expanded && (
        <div className={`px-5 pb-4 pt-3 border-t ${
          isCompleta ? 'bg-green-50/30 border-green-100' : 'bg-amber-50/30 border-amber-100'
        }`}>

          {/* Datos generales */}
          <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mb-3 text-xs text-tin-dark">
            <span>Venta #{dev.ventaId} · S/ {fmt(dev.venta?.total ?? 0)} original</span>
            {dev.usuario && <span>Procesado por: <span className="font-medium text-gray-700">{dev.usuario.nombre}</span></span>}
            <span className="sm:hidden">{formatFecha(dev.creadoEn)}</span>
          </div>

          {dev.motivo && (
            <p className="text-xs text-gray-600 mb-3 italic">Motivo: {dev.motivo}</p>
          )}

          {/* Tabla de ítems */}
          {dev.items && dev.items.length > 0 ? (
            <div className="overflow-x-auto -mx-1 px-1">
              <table className="w-full text-xs min-w-[260px]">
                <thead>
                  <tr className="text-tin-dark border-b border-tin/20">
                    <th className="text-left pb-1.5 font-medium pr-3">Producto</th>
                    <th className="text-right pb-1.5 font-medium w-12">Cant.</th>
                    <th className="text-right pb-1.5 font-medium w-20">Monto dev.</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-tin/10">
                  {dev.items.map(item => (
                    <tr key={item.id}>
                      <td className="py-1.5 text-gray-700 pr-3">
                        {item.itemVenta?.variante?.nombre ?? `Item #${item.itemVentaId}`}
                      </td>
                      <td className="py-1.5 text-right text-gray-700 tabular-nums">
                        {item.cantidadDevuelta}
                      </td>
                      <td className="py-1.5 text-right font-semibold text-gray-800 tabular-nums">
                        S/ {fmt(item.montoDevuelto)}
                      </td>
                    </tr>
                  ))}
                </tbody>
                <tfoot>
                  <tr className="border-t border-tin/20">
                    <td colSpan={2} className="pt-2 text-right text-tin-dark font-medium">Total devuelto</td>
                    <td className={`pt-2 text-right font-bold tabular-nums ${
                      isCompleta ? 'text-green-700' : 'text-amber-700'
                    }`}>
                      S/ {fmt(montoTotal)}
                    </td>
                  </tr>
                </tfoot>
              </table>
            </div>
          ) : (
            <p className="text-xs text-tin">Sin detalle de ítems</p>
          )}

          {dev.notas && (
            <p className="text-xs text-tin-dark mt-2">
              Notas: <span className="text-gray-700">{dev.notas}</span>
            </p>
          )}
        </div>
      )}
    </div>
  )
}

// ── Formulario: elegir ítems a devolver ────────────────────────
function SeleccionItems({ ventaId, onClose }: { ventaId: number; onClose: () => void }) {
  const { data: venta, isLoading } = useVenta(ventaId)
  const createDevolucion           = useCreateDevolucion()
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
    const items = venta.items!
      .filter(i => (cantidades[i.id] ?? 0) > 0)
      .map(i => {
        const cant          = cantidades[i.id]
        const precio        = parseFloat(i.precioUnitario)
        const montoDevuelto = precio * cant
        return { itemVentaId: i.id, cantidadDevuelta: cant, tipoDescuento: 'NINGUNO' as const, valorDescuento: 0, montoDevuelto }
      })
    if (items.length === 0) return
    createDevolucion.mutate(
      { ventaId, motivo: motivo.trim() || undefined, notas: notas.trim() || undefined, items },
      { onSuccess: onClose }
    )
  }

  if (isLoading) return <div className="flex justify-center py-8"><Loader2 size={24} className="animate-spin text-tin" /></div>
  if (!venta || !venta.items?.length) return <p className="text-sm text-tin text-center py-6">No se encontraron ítems para esta venta.</p>

  const algunaCantidad = Object.values(cantidades).some(c => c > 0)

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="p-3 rounded-xl bg-tin-pale text-sm text-gray-700 flex justify-between items-center">
        <span>Venta #{venta.id} · {formatFecha(venta.creadoEn)}</span>
        <span className="font-semibold">S/ {fmt(venta.total)}</span>
      </div>

      <div className="space-y-2">
        <p className="text-xs font-semibold text-tin-dark uppercase tracking-wide">Ítems a devolver</p>
        {venta.items.map(item => (
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
                max={item.cantidad}
                value={cantidades[item.id] ?? 0}
                onChange={e => handleChange(item.id, item.cantidad, e.target.value)}
                className="w-16 text-center rounded-lg border border-tin/30 px-2 py-1 text-sm focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary"
              />
            </div>
          </div>
        ))}
      </div>

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
        <button type="button" onClick={onClose} className="flex-1 py-2.5 rounded-xl border border-tin/30 text-sm font-medium text-gray-700 hover:bg-tin-pale transition-colors">
          Cancelar
        </button>
        <button
          type="submit"
          disabled={!algunaCantidad || createDevolucion.isPending}
          className="flex-1 py-2.5 rounded-xl bg-primary hover:bg-primary-dark text-gray-900 font-semibold text-sm transition-all active:scale-95 disabled:opacity-50"
        >
          {createDevolucion.isPending ? 'Procesando...' : 'Confirmar devolución'}
        </button>
      </div>
    </form>
  )
}

// ── Página principal ───────────────────────────────────────────
export default function DevolucionesPage() {
  const location                    = useLocation()
  const [page, setPage]             = useState(1)
  const LIMIT                       = 20
  const { data: result, isLoading } = useDevoluciones(page, LIMIT)
  const devoluciones                = result?.data ?? []
  const meta                        = result?.meta

  const [expanded, setExpanded]     = useState<Set<number>>(new Set())
  const [modalOpen, setModalOpen]   = useState(false)
  const [ventaInput, setVentaInput] = useState('')
  const [ventaId, setVentaId]       = useState<number | null>(null)

  // Auto-abrir modal si venimos del cuaderno con un ventaId en el state de navegación
  useEffect(() => {
    const navVentaId = (location.state as { ventaId?: number } | null)?.ventaId
    if (navVentaId) {
      setVentaId(navVentaId)
      setVentaInput(String(navVentaId))
      setModalOpen(true)
      // Limpiar el state para evitar re-trigger si el usuario navega hacia atrás
      window.history.replaceState({}, '')
    }
  }, [])

  function toggleExpanded(id: number) {
    setExpanded(prev => {
      const next = new Set(prev)
      next.has(id) ? next.delete(id) : next.add(id)
      return next
    })
  }

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

  // Contadores
  const completas = devoluciones.filter(d => calcTipo(d) === 'COMPLETA').length
  const parciales  = devoluciones.filter(d => calcTipo(d) === 'PARCIAL').length

  if (isLoading) {
    return (
      <div className="space-y-4 animate-pulse">
        <div className="h-8 w-48 bg-tin-pale rounded" />
        {[...Array(4)].map((_, i) => <div key={i} className="h-16 bg-tin-pale rounded-2xl" />)}
      </div>
    )
  }

  return (
    <div className="space-y-6">

      {/* ── Header ── */}
      <div className="flex flex-col sm:flex-row sm:items-center gap-3">
        <div className="flex-1">
          <h1 className="text-2xl font-bold text-gray-800">Devoluciones</h1>
          {meta && (
            <div className="flex items-center gap-3 mt-1">
              <span className="text-sm text-tin-dark">{meta.total} registradas</span>
              {completas > 0 && (
                <span className="flex items-center gap-1 text-xs font-medium text-green-700">
                  <CheckCircle2 size={12} /> {completas} completa{completas !== 1 ? 's' : ''}
                </span>
              )}
              {parciales > 0 && (
                <span className="flex items-center gap-1 text-xs font-medium text-amber-700">
                  <AlertCircle size={12} /> {parciales} parcial{parciales !== 1 ? 'es' : ''}
                </span>
              )}
            </div>
          )}
        </div>
        <button
          onClick={() => setModalOpen(true)}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-primary hover:bg-primary-dark text-gray-900 font-semibold text-sm transition-all active:scale-95 min-h-[2.75rem]"
        >
          <Plus size={16} /> Nueva devolución
        </button>
      </div>

      {/* ── Lista ── */}
      {devoluciones.length === 0 ? (
        <EmptyState message="Aún no hay devoluciones registradas." />
      ) : (
        <>
          {/* Leyenda */}
          <div className="flex items-center gap-4 text-xs text-tin-dark">
            <span className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-green-400 shrink-0" />
              Completa — monto total devuelto
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-amber-400 shrink-0" />
              Parcial — devolución de ítems seleccionados
            </span>
          </div>

          {/* Accordion — desktop */}
          <div className="hidden sm:block bg-white rounded-2xl border border-tin/20 shadow-sm overflow-hidden">
            {/* Scroll interno */}
            <div className="max-h-[32rem] overflow-y-auto">
              {/* Cabecera sticky */}
              <div className="sticky top-0 z-10 grid grid-cols-[auto_1fr_auto_auto] gap-3 px-4 py-2.5 bg-tin-pale border-b border-tin/20">
                <span className="text-xs font-semibold text-tin-dark w-8">#</span>
                <span className="text-xs font-semibold text-tin-dark">Venta / Cliente</span>
                <span className="text-xs font-semibold text-tin-dark">Estado</span>
                <span className="text-xs font-semibold text-tin-dark text-right">Devuelto</span>
              </div>
              {devoluciones.map(dev => (
                <DevolucionRow
                  key={dev.id}
                  dev={dev}
                  expanded={expanded.has(dev.id)}
                  onToggle={toggleExpanded}
                />
              ))}
            </div>
          </div>

          {/* Cards mobile */}
          <div className="sm:hidden space-y-2">
            {devoluciones.map(dev => {
              const tipo       = calcTipo(dev)
              const montoTotal = calcMontoTotal(dev)
              const isCompleta = tipo === 'COMPLETA'
              return (
                <div
                  key={dev.id}
                  onClick={() => toggleExpanded(dev.id)}
                  className={`bg-white rounded-2xl border shadow-sm transition-all cursor-pointer ${
                    isCompleta ? 'border-green-200' : 'border-amber-200'
                  }`}
                >
                  {/* Cabecera de card */}
                  <div className="flex items-start justify-between p-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-xs font-mono text-tin">#{dev.id}</span>
                        <span className={`flex items-center gap-1 text-xs font-semibold px-2 py-0.5 rounded-full border ${
                          isCompleta ? 'bg-green-50 text-green-700 border-green-200' : 'bg-amber-50 text-amber-700 border-amber-200'
                        }`}>
                          {isCompleta ? <CheckCircle2 size={9} /> : <AlertCircle size={9} />}
                          {isCompleta ? 'Completa' : 'Parcial'}
                        </span>
                      </div>
                      <p className="text-sm font-semibold text-gray-800">Venta #{dev.ventaId}</p>
                      {dev.motivo && <p className="text-xs text-tin-dark italic">{dev.motivo}</p>}
                      <p className="text-xs text-tin mt-0.5">{formatFecha(dev.creadoEn)}</p>
                    </div>
                    <div className="text-right shrink-0 ml-3">
                      <p className={`text-lg font-bold tabular-nums ${isCompleta ? 'text-green-700' : 'text-amber-700'}`}>
                        -S/ {fmt(montoTotal)}
                      </p>
                      <ChevronRight
                        size={14}
                        className={`ml-auto text-tin transition-transform ${expanded.has(dev.id) ? 'rotate-90' : ''}`}
                      />
                    </div>
                  </div>

                  {/* Detalle expandido mobile */}
                  {expanded.has(dev.id) && dev.items && dev.items.length > 0 && (
                    <div className={`px-4 pb-4 border-t ${isCompleta ? 'border-green-100 bg-green-50/30' : 'border-amber-100 bg-amber-50/30'}`}>
                      <div className="mt-3 space-y-2">
                        {dev.items.map(item => (
                          <div key={item.id} className="flex justify-between text-xs">
                            <span className="text-gray-700 flex-1 truncate pr-2">
                              {item.itemVenta?.variante?.nombre ?? `Item #${item.itemVentaId}`}
                              <span className="text-tin ml-1">×{item.cantidadDevuelta}</span>
                            </span>
                            <span className="font-semibold text-gray-800 tabular-nums shrink-0">
                              S/ {fmt(item.montoDevuelto)}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )
            })}
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
      <Modal open={modalOpen} onClose={resetModal} title="Nueva devolución">
        {!ventaId ? (
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
                  className="px-4 py-2.5 rounded-xl bg-primary hover:bg-primary-dark text-gray-900 font-semibold text-sm transition-all active:scale-95 flex items-center gap-1.5"
                >
                  <Search size={14} /> Buscar
                </button>
              </div>
            </div>
            <button type="button" onClick={resetModal} className="w-full py-2.5 rounded-xl border border-tin/30 text-sm font-medium text-gray-700 hover:bg-tin-pale transition-colors">
              Cancelar
            </button>
          </form>
        ) : (
          <div>
            <button
              onClick={() => setVentaId(null)}
              className="flex items-center gap-1 text-xs text-tin-dark hover:text-gray-700 transition-colors mb-4"
            >
              <X size={12} /> Cambiar venta
            </button>
            <SeleccionItems ventaId={ventaId} onClose={resetModal} />
          </div>
        )}
      </Modal>

    </div>
  )
}
