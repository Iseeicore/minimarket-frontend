import { useState, useMemo } from 'react'
import { Search, AlertTriangle, Package, Loader2, ArrowUpDown } from 'lucide-react'
import { useStockByAlmacen, useMovimientosStock } from '../hooks/useStock'
import { useAlmacenes } from '../hooks/useAlmacenes'
import { useAuthStore } from '../store/auth.store'
import EmptyState from '../components/shared/EmptyState'
import Pagination from '../components/shared/Pagination'
import type { TipoMovStock } from '../types'

// ── Helpers ────────────────────────────────────────────────────
function fmt(n: number) {
  return n.toLocaleString('es-PE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
}

function formatFecha(iso: string) {
  return new Date(iso).toLocaleString('es-PE', {
    day: '2-digit', month: '2-digit', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  })
}

const tipoMovBadge: Record<TipoMovStock, string> = {
  COMPRA_ENTRADA:    'bg-primary-pale text-primary-dark',
  VENTA_SALIDA:      'bg-accent/20 text-accent-dark',
  DEVOLUCION_ENTRADA:'bg-amber-50 text-amber-700',
  AJUSTE:            'bg-tin-pale text-tin-dark',
}

type Tab = 'inventario' | 'movimientos'

export default function StockPage() {
  const { usuario, isAdmin } = useAuthStore()

  // Admin puede cambiar el almacén que visualiza; almacenero solo ve el suyo
  const { data: almacenes = [] }              = useAlmacenes()
  const [almacenSelId, setAlmacenSelId]       = useState<number>(usuario?.almacenId ?? 0)
  const almacenId                             = isAdmin() ? (almacenSelId || almacenes[0]?.id) : usuario?.almacenId

  // ── Tabs ─────────────────────────────────────────────────────
  const [tab, setTab] = useState<Tab>('inventario')

  // ── Inventario ──────────────────────────────────────────────
  const { data: stockItems = [], isLoading }  = useStockByAlmacen(almacenId)
  const [query, setQuery]                     = useState('')

  // ── Movimientos ─────────────────────────────────────────────
  const [movPage, setMovPage] = useState(1)
  const MOV_LIMIT             = 20
  const { data: movResult, isLoading: movLoading } = useMovimientosStock(movPage, MOV_LIMIT, almacenId ?? undefined)

  // Filtrar por nombre/SKU del producto o variante
  const filtrado = useMemo(() => {
    const q = query.trim().toLowerCase()
    if (!q) return stockItems
    return stockItems.filter(s => {
      const nombre   = s.variante?.nombre?.toLowerCase() ?? ''
      const producto = s.variante?.producto?.nombre?.toLowerCase() ?? ''
      const sku      = s.variante?.sku?.toLowerCase() ?? ''
      return nombre.includes(q) || producto.includes(q) || sku.includes(q)
    })
  }, [stockItems, query])

  // Separar alertas de stock bajo (cantidad < stockMinimo)
  const bajosMinimo = filtrado.filter(s => s.cantidad < (s.variante?.stockMinimo ?? 0))
  const enNormal    = filtrado.filter(s => s.cantidad >= (s.variante?.stockMinimo ?? 0))

  if (isLoading && tab === 'inventario') {
    return (
      <div className="flex justify-center items-center py-24">
        <Loader2 size={32} className="animate-spin text-tin" />
      </div>
    )
  }

  return (
    <div className="space-y-6">

      {/* ── Header ── */}
      <div className="flex flex-col sm:flex-row sm:items-center gap-3">
        <div className="flex-1">
          <h1 className="text-2xl font-bold text-gray-800">Stock</h1>
          <p className="text-sm text-tin-dark mt-0.5">
            {stockItems.length} variantes · {bajosMinimo.length} bajo mínimo
          </p>
        </div>

        {/* Selector de almacén (solo admin) */}
        {isAdmin() && almacenes.length > 0 && (
          <select
            value={almacenSelId}
            onChange={e => { setAlmacenSelId(Number(e.target.value)); setMovPage(1) }}
            className="rounded-xl border border-tin/30 px-3 py-2 text-sm focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary bg-white"
          >
            {almacenes.map(a => (
              <option key={a.id} value={a.id}>{a.nombre}</option>
            ))}
          </select>
        )}
      </div>

      {/* ── Tabs ── */}
      <div className="flex gap-1 bg-tin-pale p-1 rounded-xl w-fit">
        <button
          onClick={() => setTab('inventario')}
          className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-medium transition-colors duration-150 ${
            tab === 'inventario' ? 'bg-white text-slate-900 shadow-sm' : 'text-tin-dark hover:text-slate-700'
          }`}
        >
          <Package size={15} /> Inventario
        </button>
        <button
          onClick={() => setTab('movimientos')}
          className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-medium transition-colors duration-150 ${
            tab === 'movimientos' ? 'bg-white text-slate-900 shadow-sm' : 'text-tin-dark hover:text-slate-700'
          }`}
        >
          <ArrowUpDown size={15} /> Movimientos
        </button>
      </div>

      {tab === 'inventario' && (<>
      {/* ── Buscador ── */}
      <div className="flex items-center gap-2 border border-tin/30 rounded-xl px-3 py-2.5 bg-white focus-within:border-primary focus-within:ring-1 focus-within:ring-primary">
        <Search size={16} className="text-tin shrink-0" />
        <input
          type="text"
          value={query}
          onChange={e => setQuery(e.target.value)}
          placeholder="Buscar por nombre, producto o SKU..."
          className="flex-1 text-sm outline-none bg-transparent"
        />
      </div>

      {/* ── Alertas: bajo mínimo ── */}
      {bajosMinimo.length > 0 && (
        <div className="space-y-3">
          <div className="flex items-center gap-2 text-amber-700">
            <AlertTriangle size={16} />
            <span className="text-sm font-semibold">Stock bajo mínimo ({bajosMinimo.length})</span>
          </div>

          {/* Tabla desktop */}
          <div className="hidden sm:block bg-white rounded-2xl border border-amber-200 shadow-sm overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-amber-50 text-amber-700 text-xs uppercase tracking-wide">
                <tr>
                  <th className="px-5 py-3 text-left font-medium">Variante</th>
                  <th className="px-5 py-3 text-left font-medium">Producto</th>
                  <th className="px-5 py-3 text-right font-medium">Actual</th>
                  <th className="px-5 py-3 text-right font-medium">Mínimo</th>
                  <th className="px-5 py-3 text-right font-medium">Precio venta</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-amber-100">
                {bajosMinimo.map(s => (
                  <tr key={s.id} className="hover:bg-amber-50/60 transition-colors">
                    <td className="px-5 py-3 text-gray-800 font-medium">
                      {s.variante?.nombre ?? `#${s.varianteId}`}
                      {s.variante?.sku && (
                        <span className="ml-2 text-xs text-tin">({s.variante.sku})</span>
                      )}
                    </td>
                    <td className="px-5 py-3 text-gray-600">{s.variante?.producto?.nombre ?? '—'}</td>
                    <td className="px-5 py-3 text-right">
                      <span className="font-bold text-amber-700">
                        {s.cantidad} {s.variante?.unidad?.abreviatura ?? ''}
                      </span>
                    </td>
                    <td className="px-5 py-3 text-right text-tin-dark">{s.variante?.stockMinimo ?? '—'}</td>
                    <td className="px-5 py-3 text-right text-gray-700">S/ {fmt(s.variante?.precioVenta ?? 0)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Cards mobile */}
          <div className="sm:hidden space-y-2">
            {bajosMinimo.map(s => (
              <div key={s.id} className="bg-white rounded-2xl border border-amber-200 p-4 flex items-center justify-between">
                <div>
                  <p className="font-medium text-gray-800 text-sm">{s.variante?.nombre ?? `#${s.varianteId}`}</p>
                  <p className="text-xs text-tin-dark">{s.variante?.producto?.nombre}</p>
                </div>
                <div className="text-right">
                  <p className="font-bold text-amber-700">{s.cantidad} {s.variante?.unidad?.abreviatura ?? ''}</p>
                  <p className="text-xs text-tin-dark">mín: {s.variante?.stockMinimo ?? '—'}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── Stock normal ── */}
      {enNormal.length === 0 && bajosMinimo.length === 0 && !isLoading ? (
        <EmptyState message="Sin registros de stock para este almacén." />
      ) : enNormal.length > 0 ? (
        <div className="space-y-3">
          <p className="text-sm font-semibold text-tin-dark uppercase tracking-wide">Inventario</p>

          {/* Tabla desktop */}
          <div className="hidden sm:block bg-white rounded-2xl border border-tin/20 shadow-sm overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-tin-pale text-tin-dark text-xs uppercase tracking-wide">
                <tr>
                  <th className="px-5 py-3 text-left font-medium">Variante</th>
                  <th className="px-5 py-3 text-left font-medium">Producto</th>
                  <th className="px-5 py-3 text-right font-medium">Stock</th>
                  <th className="px-5 py-3 text-right font-medium">Mínimo</th>
                  <th className="px-5 py-3 text-right font-medium">Precio venta</th>
                  <th className="px-5 py-3 text-right font-medium">Valor inventario</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-tin/10">
                {enNormal.map(s => {
                  const valorItem = s.cantidad * (s.variante?.precioVenta ?? 0)
                  return (
                    <tr key={s.id} className="hover:bg-tin-pale/50 transition-colors">
                      <td className="px-5 py-3 text-gray-800 font-medium">
                        {s.variante?.nombre ?? `#${s.varianteId}`}
                        {s.variante?.sku && (
                          <span className="ml-2 text-xs text-tin">({s.variante.sku})</span>
                        )}
                      </td>
                      <td className="px-5 py-3 text-gray-600">{s.variante?.producto?.nombre ?? '—'}</td>
                      <td className="px-5 py-3 text-right text-gray-800 font-semibold">
                        {s.cantidad} <span className="text-xs text-tin font-normal">{s.variante?.unidad?.abreviatura ?? ''}</span>
                      </td>
                      <td className="px-5 py-3 text-right text-tin-dark">{s.variante?.stockMinimo ?? '—'}</td>
                      <td className="px-5 py-3 text-right text-gray-700">S/ {fmt(s.variante?.precioVenta ?? 0)}</td>
                      <td className="px-5 py-3 text-right font-semibold text-gray-800">S/ {fmt(valorItem)}</td>
                    </tr>
                  )
                })}
              </tbody>
              <tfoot className="bg-tin-pale/70 border-t border-tin/20">
                <tr>
                  <td colSpan={5} className="px-5 py-3 text-right font-semibold text-gray-800">Valor total inventario</td>
                  <td className="px-5 py-3 text-right font-bold text-gray-900">
                    S/ {fmt(enNormal.reduce((acc, s) => acc + s.cantidad * (s.variante?.precioVenta ?? 0), 0))}
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>

          {/* Cards mobile */}
          <div className="sm:hidden space-y-2">
            {enNormal.map(s => (
              <div key={s.id} className="bg-white rounded-2xl border border-tin/20 shadow-sm p-4 flex items-center justify-between">
                <div>
                  <div className="flex items-center gap-1.5">
                    <Package size={14} className="text-tin shrink-0" />
                    <p className="font-medium text-gray-800 text-sm">{s.variante?.nombre ?? `#${s.varianteId}`}</p>
                  </div>
                  <p className="text-xs text-tin-dark mt-0.5">{s.variante?.producto?.nombre}</p>
                  <p className="text-xs text-tin">S/ {fmt(s.variante?.precioVenta ?? 0)}</p>
                </div>
                <div className="text-right">
                  <p className="font-bold text-gray-800">{s.cantidad} <span className="text-xs font-normal text-tin">{s.variante?.unidad?.abreviatura ?? ''}</span></p>
                  <p className="text-xs text-tin-dark">mín: {s.variante?.stockMinimo ?? '—'}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      ) : null}
      </>)}

      {/* ── Tab: Movimientos ── */}
      {tab === 'movimientos' && (
        <div className="space-y-4">
          {movLoading ? (
            <div className="flex justify-center py-16">
              <Loader2 size={28} className="animate-spin text-tin" />
            </div>
          ) : !movResult?.data.length ? (
            <EmptyState message="Sin movimientos de stock registrados." />
          ) : (<>
            {/* Tabla desktop */}
            <div className="hidden sm:block bg-white rounded-2xl border border-tin/20 shadow-sm overflow-hidden">
              <table className="w-full text-sm">
                <thead className="bg-tin-pale text-tin-dark text-xs uppercase tracking-wide">
                  <tr>
                    <th className="px-5 py-3 text-left font-medium">#</th>
                    <th className="px-5 py-3 text-left font-medium">Tipo</th>
                    <th className="px-5 py-3 text-left font-medium">Variante</th>
                    <th className="px-5 py-3 text-right font-medium">Cant.</th>
                    <th className="px-5 py-3 text-right font-medium">Antes</th>
                    <th className="px-5 py-3 text-right font-medium">Después</th>
                    <th className="px-5 py-3 text-left font-medium">Usuario</th>
                    <th className="px-5 py-3 text-left font-medium">Fecha</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-tin/10">
                  {movResult.data.map(m => (
                    <tr key={m.id} className="hover:bg-tin-pale/50 transition-colors">
                      <td className="px-5 py-3 text-tin-dark font-mono">#{m.id}</td>
                      <td className="px-5 py-3">
                        <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${tipoMovBadge[m.tipo]}`}>
                          {m.tipo.replace('_', ' ')}
                        </span>
                      </td>
                      <td className="px-5 py-3 text-gray-800">
                        {m.variante?.nombre ?? `#${m.varianteId}`}
                        <span className="block text-xs text-tin-dark">{m.variante?.producto?.nombre}</span>
                      </td>
                      <td className="px-5 py-3 text-right font-semibold text-gray-800 tabular-nums">{m.cantidad}</td>
                      <td className="px-5 py-3 text-right text-tin-dark tabular-nums">{m.cantidadAntes}</td>
                      <td className="px-5 py-3 text-right text-tin-dark tabular-nums">{m.cantidadDespues}</td>
                      <td className="px-5 py-3 text-gray-600">{m.usuario?.nombre ?? '—'}</td>
                      <td className="px-5 py-3 text-tin-dark">{formatFecha(m.creadoEn)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Cards mobile */}
            <div className="sm:hidden space-y-2">
              {movResult.data.map(m => (
                <div key={m.id} className="bg-white rounded-2xl border border-tin/20 shadow-sm p-4">
                  <div className="flex items-center justify-between mb-2">
                    <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${tipoMovBadge[m.tipo]}`}>
                      {m.tipo.replace('_', ' ')}
                    </span>
                    <span className="text-xs text-tin">{formatFecha(m.creadoEn)}</span>
                  </div>
                  <p className="font-medium text-gray-800 text-sm">{m.variante?.nombre ?? `#${m.varianteId}`}</p>
                  <p className="text-xs text-tin-dark">{m.variante?.producto?.nombre}</p>
                  <div className="flex items-center gap-4 mt-2 text-xs text-tin-dark">
                    <span>Cant: <b className="text-gray-800">{m.cantidad}</b></span>
                    <span>{m.cantidadAntes} → {m.cantidadDespues}</span>
                    <span className="ml-auto">{m.usuario?.nombre ?? '—'}</span>
                  </div>
                </div>
              ))}
            </div>

            <Pagination
              page={movPage}
              totalPages={movResult.meta.totalPages}
              total={movResult.meta.total}
              limit={MOV_LIMIT}
              onPage={p => { setMovPage(p); window.scrollTo({ top: 0, behavior: 'smooth' }) }}
            />
          </>)}
        </div>
      )}
    </div>
  )
}
