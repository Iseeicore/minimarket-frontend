import { useState, useEffect, useRef } from 'react'
import {
  Search, ShoppingCart, Trash2, Plus, Minus, CreditCard,
  Loader2, AlertTriangle, ChevronRight, Receipt,
} from 'lucide-react'
import { useCreateVenta, useVentasHoy } from '../hooks/useVentas'
import { useCajaActiva } from '../hooks/useCaja'
import { useStockByAlmacen } from '../hooks/useStock'
import { useContactos } from '../hooks/useContactos'
import { useAuthStore } from '../store/auth.store'
import { variantesService } from '../services/productos.service'
import type { ItemCarrito, MetodoPago, Venta } from '../types'

// ── Helpers ────────────────────────────────────────────────────
function fmt(n: number) {
  return n.toLocaleString('es-PE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
}
function formatHora(iso: string) {
  return new Date(iso).toLocaleTimeString('es-PE', { hour: '2-digit', minute: '2-digit' })
}

const metodoPagoLabel: Record<MetodoPago, string> = {
  EFECTIVO:      'Efectivo',
  YAPE:          'Yape',
  TRANSFERENCIA: 'Transfer.',
  OTRO:          'Otro',
}
const metodoPagoLabelFull: Record<MetodoPago, string> = {
  EFECTIVO:      'Efectivo',
  YAPE:          'Yape',
  TRANSFERENCIA: 'Transferencia',
  OTRO:          'Otro',
}

// ── Fila colapsable de venta ───────────────────────────────────
function VentaRow({
  venta, expanded, onToggle,
}: { venta: Venta; expanded: boolean; onToggle: (id: number) => void }) {
  return (
    <div className="border-b border-tin/10 last:border-0">
      {/* Fila principal — siempre visible */}
      <button
        type="button"
        onClick={() => onToggle(venta.id)}
        className="w-full flex items-center gap-2 px-4 py-3 hover:bg-tin-pale/50 transition-colors text-left min-h-[2.75rem]"
      >
        <ChevronRight
          size={13}
          className={`text-tin shrink-0 transition-transform duration-200 ${expanded ? 'rotate-90' : ''}`}
        />
        <span className="text-xs font-mono text-tin w-8 shrink-0">#{venta.id}</span>
        <span className="text-xs text-tin-dark shrink-0 w-12">{formatHora(venta.creadoEn)}</span>
        <span className="text-sm text-gray-700 flex-1 truncate min-w-0">
          {venta.contacto?.nombre ?? <span className="text-tin italic">Sin cliente</span>}
        </span>
        <span className="text-xs text-tin-dark shrink-0 hidden sm:inline">{venta.metodoPago}</span>
        <span className="text-sm font-bold text-gray-800 tabular-nums shrink-0">
          S/ {fmt(parseFloat(venta.total))}
        </span>
      </button>

      {/* Contenido expandido */}
      {expanded && (
        <div className="px-5 pb-4 pt-3 bg-tin-pale/30 border-t border-tin/10">

          {/* Datos del cliente */}
          {venta.contacto && (
            <p className="text-xs text-tin-dark mb-3">
              Cliente: <span className="font-semibold text-gray-700">{venta.contacto.nombre}</span>
              {' · '}
              <span className="text-tin">Pago: {venta.metodoPago}</span>
            </p>
          )}

          {/* Tabla de ítems */}
          {venta.items && venta.items.length > 0 ? (
            <div className="overflow-x-auto -mx-1 px-1">
              <table className="w-full text-xs min-w-[280px]">
                <thead>
                  <tr className="text-tin-dark border-b border-tin/20">
                    <th className="text-left pb-1.5 font-medium pr-3">Producto</th>
                    <th className="text-right pb-1.5 font-medium w-9">Cant.</th>
                    <th className="text-right pb-1.5 font-medium w-16">P.Unit.</th>
                    <th className="text-right pb-1.5 font-medium w-16">Subtotal</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-tin/10">
                  {venta.items.map(item => (
                    <tr key={item.id}>
                      <td className="py-1.5 text-gray-700 pr-3">
                        <p className="font-medium">{item.variante?.nombre ?? `#${item.varianteId}`}</p>
                        {item.variante?.producto?.nombre && (
                          <p className="text-tin text-[10px]">{item.variante.producto.nombre}</p>
                        )}
                      </td>
                      <td className="py-1.5 text-right text-gray-700 tabular-nums">{item.cantidad}</td>
                      <td className="py-1.5 text-right text-gray-600 tabular-nums">
                        S/ {fmt(parseFloat(item.precioUnitario))}
                      </td>
                      <td className="py-1.5 text-right font-semibold text-gray-800 tabular-nums">
                        S/ {fmt(parseFloat(item.subtotal))}
                      </td>
                    </tr>
                  ))}
                </tbody>
                <tfoot>
                  <tr className="border-t border-tin/20">
                    <td colSpan={3} className="pt-2 text-right text-tin-dark font-medium">Total</td>
                    <td className="pt-2 text-right font-bold text-gray-900 tabular-nums">
                      S/ {fmt(parseFloat(venta.total))}
                    </td>
                  </tr>
                </tfoot>
              </table>
            </div>
          ) : (
            <p className="text-xs text-tin">Sin detalle de ítems</p>
          )}

          {venta.notas && (
            <p className="text-xs text-tin-dark mt-2">
              Nota: <span className="text-gray-700">{venta.notas}</span>
            </p>
          )}
        </div>
      )}
    </div>
  )
}

// ── Constantes ─────────────────────────────────────────────────
const VENTAS_PER_PAGE = 8

// ── Componente POS ─────────────────────────────────────────────
export default function VentasPage() {
  const usuario   = useAuthStore(s => s.usuario)
  const almacenId = usuario?.almacenId ?? null

  // ── Queries ──────────────────────────────────────────────────
  const { data: caja, isLoading: cajaLoading } = useCajaActiva(almacenId)
  const { data: stockItems = [] }               = useStockByAlmacen(almacenId)
  const { data: contactos = [] }                = useContactos()
  const { data: ventasHoy = [] }                = useVentasHoy()
  const createVenta                             = useCreateVenta()

  // ── Estado del carrito ───────────────────────────────────────
  const [carrito, setCarrito]       = useState<ItemCarrito[]>([])
  const [metodoPago, setMetodoPago] = useState<MetodoPago>('EFECTIVO')
  const [contactoId, setContactoId] = useState<number>(0)

  // ── Estado de la lista de ventas ─────────────────────────────
  const [expanded, setExpanded]   = useState<Set<number>>(new Set())
  const [ventaPage, setVentaPage] = useState(1)

  // ── Buscador de variantes ────────────────────────────────────
  const [query, setQuery]               = useState('')
  const [resultados, setResultados]     = useState<Array<{ id: number; nombre: string; sku: string | null; precio: number }>>([])
  const [buscando, setBuscando]         = useState(false)
  const [showDropdown, setShowDropdown] = useState(false)
  const debounceRef                     = useRef<ReturnType<typeof setTimeout> | null>(null)
  const inputRef                        = useRef<HTMLInputElement>(null)

  // Mapa de stock O(1)
  const stockMap = new Map(stockItems.map(s => [s.varianteId, s.cantidad]))
  const clientes = contactos.filter(c => c.tipo === 'CLIENTE' || c.tipo === 'AMBOS')

  // Paginación de ventas del día
  const totalVentaPages = Math.max(1, Math.ceil(ventasHoy.length / VENTAS_PER_PAGE))
  const safeVentaPage   = Math.min(ventaPage, totalVentaPages)
  const ventasVisible   = ventasHoy.slice(
    (safeVentaPage - 1) * VENTAS_PER_PAGE,
    safeVentaPage * VENTAS_PER_PAGE
  )

  function toggleExpanded(id: number) {
    setExpanded(prev => {
      const next = new Set(prev)
      next.has(id) ? next.delete(id) : next.add(id)
      return next
    })
  }

  // ── Búsqueda con debounce ────────────────────────────────────
  useEffect(() => {
    if (!query.trim()) { setResultados([]); setShowDropdown(false); return }
    if (debounceRef.current) clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(async () => {
      setBuscando(true)
      try {
        const vars    = await variantesService.getAll(query.trim())
        const activas = vars
          .filter(v => v.activo)
          .map(v => ({ id: v.id, nombre: v.nombre, sku: v.sku, precio: parseFloat(String(v.precioVenta)) }))
        setResultados(activas)
        setShowDropdown(true)
      } catch { setResultados([]) }
      finally { setBuscando(false) }
    }, 300)
    return () => { if (debounceRef.current) clearTimeout(debounceRef.current) }
  }, [query])

  // ── Operaciones del carrito ───────────────────────────────────
  function agregarItem(v: { id: number; nombre: string; sku: string | null; precio: number }) {
    const stock       = stockMap.get(v.id) ?? 0
    const stockItem   = stockItems.find(s => s.varianteId === v.id)
    const unidadAbrev = stockItem?.variante?.unidad?.abreviatura ?? 'u'
    setCarrito(prev => {
      const existe = prev.find(i => i.varianteId === v.id)
      if (existe) {
        if (existe.cantidad >= stock) return prev
        return prev.map(i => i.varianteId === v.id ? { ...i, cantidad: i.cantidad + 1 } : i)
      }
      if (stock <= 0) return prev
      return [...prev, {
        varianteId: v.id, nombre: v.nombre, sku: v.sku, unidadAbrev,
        precioUnitario: parseFloat(String(v.precio)), stockDisponible: stock, cantidad: 1,
      }]
    })
    setQuery('')
    setShowDropdown(false)
    inputRef.current?.focus()
  }

  function cambiarCantidad(varianteId: number, delta: number) {
    setCarrito(prev =>
      prev.map(i => i.varianteId === varianteId ? { ...i, cantidad: i.cantidad + delta } : i)
          .filter(i => i.cantidad > 0)
    )
  }

  function quitarItem(varianteId: number) {
    setCarrito(prev => prev.filter(i => i.varianteId !== varianteId))
  }

  const subtotal = carrito.reduce((acc, i) => acc + i.precioUnitario * i.cantidad, 0)

  function confirmarVenta() {
    if (!caja || !almacenId || carrito.length === 0) return
    createVenta.mutate(
      {
        almacenId,
        cajaId:     caja.id,
        contactoId: contactoId || undefined,
        metodoPago,
        items: carrito.map(i => ({
          varianteId:     i.varianteId,
          cantidad:       i.cantidad,
          precioUnitario: parseFloat(String(i.precioUnitario)),
          tipoDescuento:  'NINGUNO' as const,
          valorDescuento: 0,
        })),
      },
      {
        onSuccess: () => {
          setCarrito([])
          setContactoId(0)
          setMetodoPago('EFECTIVO')
          setExpanded(new Set()) // colapsar ventas al registrar
          setVentaPage(1)        // volver a página 1 para ver la nueva venta
        },
      }
    )
  }

  if (cajaLoading) {
    return (
      <div className="flex justify-center items-center py-24">
        <Loader2 size={32} className="animate-spin text-tin" />
      </div>
    )
  }

  return (
    <div className="flex flex-col lg:flex-row gap-4">

      {/* ── Panel izquierdo — POS + historial ── */}
      <div className="flex-1 min-w-0 space-y-4 pb-44 lg:pb-0">

        {/* Alerta caja cerrada */}
        {!caja && (
          <div className="flex items-start gap-3 p-4 rounded-2xl bg-amber-50 border border-amber-200">
            <AlertTriangle size={18} className="text-amber-600 mt-0.5 shrink-0" />
            <div>
              <p className="text-sm font-semibold text-amber-800">Caja cerrada</p>
              <p className="text-xs text-amber-700 mt-0.5">
                No podés registrar ventas sin caja abierta. Andá a <strong>Caja</strong> y abrila primero.
              </p>
            </div>
          </div>
        )}

        {/* Buscador */}
        <div className="bg-white rounded-2xl border border-tin/20 shadow-sm p-4">
          <p className="text-xs font-semibold text-tin-dark uppercase tracking-wide mb-2">Agregar producto</p>
          <div className="relative">
            <div className="flex items-center gap-2 border border-tin/30 rounded-xl px-3 py-2.5 focus-within:border-primary focus-within:ring-1 focus-within:ring-primary bg-white">
              {buscando
                ? <Loader2 size={16} className="text-tin animate-spin shrink-0" />
                : <Search size={16} className="text-tin shrink-0" />
              }
              <input
                ref={inputRef}
                type="text"
                value={query}
                onChange={e => setQuery(e.target.value)}
                onFocus={() => resultados.length > 0 && setShowDropdown(true)}
                onBlur={() => setTimeout(() => setShowDropdown(false), 150)}
                placeholder="Buscá por nombre o SKU..."
                className="flex-1 text-sm outline-none bg-transparent min-w-0"
                disabled={!caja}
              />
            </div>

            {showDropdown && resultados.length > 0 && (
              <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-tin/20 rounded-xl shadow-lg z-20 max-h-64 overflow-y-auto">
                {resultados.map(v => {
                  const stock = stockMap.get(v.id) ?? 0
                  return (
                    <button
                      key={v.id}
                      type="button"
                      onMouseDown={() => agregarItem(v)}
                      className="w-full flex items-center justify-between px-4 py-3 hover:bg-tin-pale text-left transition-colors"
                    >
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-medium text-gray-800 truncate">{v.nombre}</p>
                        {v.sku && <p className="text-xs text-tin">{v.sku}</p>}
                      </div>
                      <div className="text-right shrink-0 ml-3">
                        <p className="text-sm font-semibold text-gray-800">S/ {fmt(v.precio)}</p>
                        <p className={`text-xs ${stock > 0 ? 'text-primary-dark' : 'text-red-500'}`}>
                          Stock: {stock}
                        </p>
                      </div>
                    </button>
                  )
                })}
              </div>
            )}
            {showDropdown && !buscando && resultados.length === 0 && query.trim() && (
              <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-tin/20 rounded-xl shadow-lg z-20 px-4 py-3">
                <p className="text-sm text-tin text-center">Sin resultados para "{query}"</p>
              </div>
            )}
          </div>
        </div>

        {/* Carrito — tabla desktop (≥ sm) */}
        <div className="hidden sm:block bg-white rounded-2xl border border-tin/20 shadow-sm overflow-hidden">
          <div className="px-5 py-4 border-b border-tin/20 flex items-center gap-2">
            <ShoppingCart size={16} className="text-tin-dark" />
            <h2 className="font-semibold text-gray-800">Carrito</h2>
            {carrito.length > 0 && (
              <span className="ml-auto text-xs bg-primary text-gray-900 rounded-full px-2 py-0.5 font-semibold">
                {carrito.reduce((a, i) => a + i.cantidad, 0)} ítems
              </span>
            )}
          </div>
          {carrito.length === 0 ? (
            <p className="text-sm text-tin text-center py-12">El carrito está vacío</p>
          ) : (
            <div className="max-h-56 overflow-y-auto">
            <table className="w-full text-sm">
              <thead className="bg-tin-pale text-tin-dark text-xs uppercase tracking-wide sticky top-0 z-10">
                <tr>
                  <th className="px-5 py-3 text-left font-medium">Producto</th>
                  <th className="px-5 py-3 text-right font-medium">Precio</th>
                  <th className="px-5 py-3 text-center font-medium">Cant.</th>
                  <th className="px-5 py-3 text-right font-medium">Subtotal</th>
                  <th className="px-2 py-3" />
                </tr>
              </thead>
              <tbody className="divide-y divide-tin/10">
                {carrito.map(item => (
                  <tr key={item.varianteId} className="hover:bg-tin-pale/30 transition-colors">
                    <td className="px-5 py-3">
                      <p className="font-medium text-gray-800">{item.nombre}</p>
                      <p className="text-xs text-tin">Stock: {item.stockDisponible} {item.unidadAbrev}</p>
                    </td>
                    <td className="px-5 py-3 text-right text-gray-700">S/ {fmt(item.precioUnitario)}</td>
                    <td className="px-5 py-3">
                      <div className="flex items-center justify-center gap-2">
                        <button
                          onClick={() => cambiarCantidad(item.varianteId, -1)}
                          className="w-7 h-7 rounded-lg bg-tin-pale hover:bg-tin/20 flex items-center justify-center transition-colors active:scale-95"
                        >
                          <Minus size={12} className="text-tin-dark" />
                        </button>
                        <span className="w-6 text-center font-semibold text-gray-800">{item.cantidad}</span>
                        <button
                          onClick={() => cambiarCantidad(item.varianteId, +1)}
                          disabled={item.cantidad >= item.stockDisponible}
                          className="w-7 h-7 rounded-lg bg-tin-pale hover:bg-tin/20 flex items-center justify-center transition-colors active:scale-95 disabled:opacity-40"
                        >
                          <Plus size={12} className="text-tin-dark" />
                        </button>
                      </div>
                    </td>
                    <td className="px-5 py-3 text-right font-semibold text-gray-800">
                      S/ {fmt(item.precioUnitario * item.cantidad)}
                    </td>
                    <td className="px-2 py-3">
                      <button
                        onClick={() => quitarItem(item.varianteId)}
                        className="p-1.5 rounded-lg hover:bg-red-50 text-tin hover:text-red-500 transition-colors"
                      >
                        <Trash2 size={14} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            </div>
          )}
        </div>

        {/* Carrito — cards mobile (< sm) */}
        {carrito.length > 0 && (
          <div className="sm:hidden bg-white rounded-2xl border border-tin/20 shadow-sm overflow-hidden">
            <div className="px-4 py-3 border-b border-tin/20 flex items-center gap-2">
              <ShoppingCart size={15} className="text-tin-dark" />
              <span className="font-semibold text-gray-800 text-sm">Carrito</span>
              <span className="ml-auto text-xs bg-primary text-gray-900 rounded-full px-2 py-0.5 font-semibold">
                {carrito.reduce((a, i) => a + i.cantidad, 0)} ítems
              </span>
            </div>
            <div className="divide-y divide-tin/10 max-h-56 overflow-y-auto">
              {carrito.map(item => (
                <div key={item.varianteId} className="px-4 py-3 flex items-center gap-2">
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-gray-800 text-sm truncate">{item.nombre}</p>
                    <p className="text-xs text-tin-dark">S/ {fmt(item.precioUnitario)} · Stock: {item.stockDisponible}</p>
                  </div>
                  <div className="flex items-center gap-1.5 shrink-0">
                    <button onClick={() => cambiarCantidad(item.varianteId, -1)} className="min-h-[2.75rem] min-w-[2.75rem] rounded-xl bg-tin-pale flex items-center justify-center active:scale-95">
                      <Minus size={14} className="text-tin-dark" />
                    </button>
                    <span className="w-6 text-center font-bold text-gray-800 text-sm">{item.cantidad}</span>
                    <button onClick={() => cambiarCantidad(item.varianteId, +1)} disabled={item.cantidad >= item.stockDisponible} className="min-h-[2.75rem] min-w-[2.75rem] rounded-xl bg-tin-pale flex items-center justify-center active:scale-95 disabled:opacity-40">
                      <Plus size={14} className="text-tin-dark" />
                    </button>
                  </div>
                  <p className="font-bold text-gray-800 text-sm shrink-0 w-16 text-right tabular-nums">
                    S/ {fmt(item.precioUnitario * item.cantidad)}
                  </p>
                  <button onClick={() => quitarItem(item.varianteId)} className="p-2 text-tin hover:text-red-500 shrink-0">
                    <Trash2 size={14} />
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Carrito vacío — mobile */}
        {carrito.length === 0 && (
          <div className="sm:hidden bg-white rounded-2xl border border-tin/20 shadow-sm flex flex-col items-center justify-center py-10">
            <ShoppingCart size={28} className="text-tin mb-2" />
            <p className="text-sm text-tin">El carrito está vacío</p>
          </div>
        )}

        {/* ── Lista de ventas del día ── */}
        <div className="bg-white rounded-2xl border border-tin/20 shadow-sm overflow-hidden">

          {/* Cabecera fija */}
          <div className="px-5 py-3.5 border-b border-tin/20 flex items-center justify-between bg-white">
            <div className="flex items-center gap-2">
              <Receipt size={14} className="text-tin-dark" />
              <span className="font-semibold text-gray-800 text-sm">Ventas del día</span>
            </div>
            <span className="text-xs font-semibold bg-tin-pale text-tin-dark px-2.5 py-0.5 rounded-full tabular-nums">
              {ventasHoy.length}
            </span>
          </div>

          {/* Lista con scroll interno */}
          <div className="max-h-72 overflow-y-auto">
            {ventasHoy.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-10 text-center">
                <Receipt size={24} className="text-tin mb-2" />
                <p className="text-sm text-tin">Sin ventas registradas hoy</p>
              </div>
            ) : (
              ventasVisible.map(v => (
                <VentaRow
                  key={v.id}
                  venta={v}
                  expanded={expanded.has(v.id)}
                  onToggle={toggleExpanded}
                />
              ))
            )}
          </div>

          {/* Paginación */}
          {totalVentaPages > 1 && (
            <div className="flex items-center justify-between px-5 py-3 border-t border-tin/20 bg-tin-pale/30">
              <button
                onClick={() => setVentaPage(p => Math.max(1, p - 1))}
                disabled={safeVentaPage === 1}
                className="text-xs font-semibold text-tin-dark disabled:opacity-40 px-2.5 py-1.5 rounded-lg hover:bg-white transition-colors"
              >
                ← Anterior
              </button>
              <span className="text-xs text-tin-dark tabular-nums">
                {safeVentaPage} / {totalVentaPages}
              </span>
              <button
                onClick={() => setVentaPage(p => Math.min(totalVentaPages, p + 1))}
                disabled={safeVentaPage === totalVentaPages}
                className="text-xs font-semibold text-tin-dark disabled:opacity-40 px-2.5 py-1.5 rounded-lg hover:bg-white transition-colors"
              >
                Siguiente →
              </button>
            </div>
          )}
        </div>
      </div>

      {/* ── Panel cobro — desktop (≥ lg) ── */}
      <div className="hidden lg:block lg:w-80 shrink-0">
        <div className="bg-white rounded-2xl border border-tin/20 shadow-sm p-5 space-y-4 sticky top-4">
          <h2 className="font-semibold text-gray-800 flex items-center gap-2">
            <CreditCard size={16} className="text-tin-dark" /> Cobro
          </h2>

          <div>
            <label className="block text-xs font-medium text-tin-dark mb-1">Cliente (opcional)</label>
            <select
              value={contactoId}
              onChange={e => setContactoId(Number(e.target.value))}
              className="w-full rounded-xl border border-tin/30 px-3 py-2 text-sm focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary"
            >
              <option value={0}>— Sin cliente —</option>
              {clientes.map(c => <option key={c.id} value={c.id}>{c.nombre}</option>)}
            </select>
          </div>

          <div>
            <label className="block text-xs font-medium text-tin-dark mb-2">Método de pago</label>
            <div className="grid grid-cols-2 gap-2">
              {(Object.keys(metodoPagoLabelFull) as MetodoPago[]).map(mp => (
                <button
                  key={mp}
                  type="button"
                  onClick={() => setMetodoPago(mp)}
                  className={`py-2 rounded-xl text-xs font-semibold border transition-all duration-150 active:scale-95 ${
                    metodoPago === mp
                      ? 'bg-primary/20 border-primary text-primary-dark'
                      : 'bg-white border-tin/30 text-gray-700 hover:bg-tin-pale'
                  }`}
                >
                  {metodoPagoLabelFull[mp]}
                </button>
              ))}
            </div>
          </div>

          <div className="pt-2 border-t border-tin/20 space-y-1.5">
            <div className="flex justify-between text-sm">
              <span className="text-tin-dark">Subtotal</span>
              <span className="text-gray-800">S/ {fmt(subtotal)}</span>
            </div>
            <div className="flex justify-between font-bold text-base">
              <span className="text-gray-900">Total</span>
              <span className="text-gray-900">S/ {fmt(subtotal)}</span>
            </div>
          </div>

          <button
            onClick={confirmarVenta}
            disabled={!caja || carrito.length === 0 || createVenta.isPending}
            className="w-full py-3 rounded-xl bg-primary hover:bg-primary-dark text-gray-900 font-bold text-sm transition-all duration-150 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {createVenta.isPending
              ? 'Procesando...'
              : !caja
              ? 'Caja cerrada'
              : carrito.length === 0
              ? 'Carrito vacío'
              : `Confirmar venta · S/ ${fmt(subtotal)}`}
          </button>
        </div>
      </div>

      {/* ── Barra cobro sticky — mobile (< lg) ── */}
      <div className="lg:hidden fixed bottom-0 left-0 right-0 z-30 bg-white/95 backdrop-blur-sm border-t border-tin/20 shadow-[0_-4px_24px_rgba(0,0,0,0.08)] px-4 pt-3 pb-5 space-y-3">
        <div className="grid grid-cols-2 gap-2">
          <select
            value={contactoId}
            onChange={e => setContactoId(Number(e.target.value))}
            className="w-full rounded-xl border border-tin/30 px-3 py-2 text-xs focus:outline-none focus:border-primary bg-white"
          >
            <option value={0}>Sin cliente</option>
            {clientes.map(c => <option key={c.id} value={c.id}>{c.nombre}</option>)}
          </select>
          <div className="grid grid-cols-2 gap-1">
            {(Object.keys(metodoPagoLabel) as MetodoPago[]).map(mp => (
              <button
                key={mp}
                type="button"
                onClick={() => setMetodoPago(mp)}
                className={`py-1.5 rounded-lg text-[11px] font-semibold border transition-all active:scale-95 ${
                  metodoPago === mp
                    ? 'bg-primary/20 border-primary text-primary-dark'
                    : 'bg-white border-tin/30 text-gray-600'
                }`}
              >
                {metodoPagoLabel[mp]}
              </button>
            ))}
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="shrink-0">
            <p className="text-xs text-tin-dark leading-none mb-0.5">Total</p>
            <p className="text-2xl font-bold text-gray-900 tabular-nums leading-none">S/ {fmt(subtotal)}</p>
          </div>
          <button
            onClick={confirmarVenta}
            disabled={!caja || carrito.length === 0 || createVenta.isPending}
            className="flex-1 min-h-[2.75rem] rounded-xl bg-primary hover:bg-primary-dark text-gray-900 font-bold text-sm transition-all active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {createVenta.isPending ? 'Procesando...' : !caja ? 'Caja cerrada' : carrito.length === 0 ? 'Carrito vacío' : 'Confirmar venta'}
          </button>
        </div>
      </div>

    </div>
  )
}
