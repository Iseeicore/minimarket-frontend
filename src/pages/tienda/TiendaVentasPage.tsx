import { useState, useMemo, useCallback, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  ShoppingCart, Search, Plus, Minus, Trash2,
  AlertTriangle, CheckCircle, Printer, RotateCcw,
  ArrowLeft, X, Package, CreditCard, Lock, Unlock,
  Receipt,
} from 'lucide-react'
import { sileo } from 'sileo'
import { useAuthStore } from '../../store/auth.store'
import { usePrinterStore } from '../../store/printer.store'
import { useCreateOrdenSalida, useStockDual } from '../../hooks/useOrdenesSalida'
import { useEstadoCaja, useAbrirDia, useCerrarCaja } from '../../hooks/useCaja'
import type { TipoOrden, OrigenStock, OrdenSalida, CerrarCajaDto } from '../../types'

// ── Tipos locales ──────────────────────────────────────────────────────────────

interface ItemPedido {
  varianteId:   number
  nombre:       string
  sku:          string | null
  unidadAbrev:  string
  stockAlmacen: number
  stockTienda:  number
  cantidad:     number
  origen:       OrigenStock
}

type PageState = 'creando' | 'alert' | 'confirmada'

// ── Helpers ────────────────────────────────────────────────────────────────────

function formatHora(iso: string) {
  return new Date(iso).toLocaleTimeString('es-PE', { hour: '2-digit', minute: '2-digit' })
}

function formatFecha(iso: string) {
  return new Date(iso).toLocaleDateString('es-PE', {
    day: '2-digit', month: '2-digit', year: 'numeric',
  })
}

/** Trunca un nombre a N caracteres para que quepa en el ticket */
function truncNombre(nombre: string, max = 13) {
  return nombre.length > max ? nombre.slice(0, max) + '.' : nombre
}

// ── Ticket reutilizable ───────────────────────────────────────────────────────

function TicketOrden({ orden, solicitante }: { orden: OrdenSalida; solicitante?: string }) {
  const totalMonto = orden.detalles.reduce((sum, d) => {
    const precio = parseFloat(d.variante?.precioVenta ?? '0')
    return sum + precio * d.cantidad
  }, 0)

  return (
    <div className="bg-white rounded-2xl border-2 border-dashed border-slate-300 px-4 py-5 font-mono text-xs space-y-2 print:block">

      {/* ═══ Header ═══ */}
      <p className="text-center text-sm font-bold tracking-widest text-slate-900">MINIMARKET</p>
      <div className="flex justify-center">
        <span className={`text-[10px] font-bold px-3 py-0.5 rounded-full ${
          orden.tipo === 'VENTA'
            ? 'bg-primary-pale text-primary-dark'
            : 'bg-cyan-100 text-cyan-700'
        }`}>
          {orden.tipo}
        </span>
      </div>
      <p className="text-center text-tin-dark">ORDEN #{orden.numero}</p>

      <div className="border-t border-dashed border-slate-300" />

      {/* Meta */}
      <div className="space-y-0.5 text-tin-dark">
        <p>Fecha: {formatFecha(orden.creadoEn)}  Hora: {formatHora(orden.creadoEn)}</p>
        <p>Solicito: {orden.solicitante?.nombre ?? solicitante ?? '—'}</p>
      </div>

      <div className="border-t border-dashed border-slate-300" />

      {/* ═══ Cabecera tabla ═══ */}
      <div className="grid grid-cols-[2.2rem_3rem_1fr_3.5rem] gap-x-1 text-tin-dark font-bold">
        <span>CAN</span>
        <span>P/U</span>
        <span>DESCRIP.</span>
        <span className="text-right">TOTAL</span>
      </div>

      <div className="border-t border-dashed border-slate-300" />

      {/* ═══ Items con espacio para anotaciones ═══ */}
      <div className="space-y-0">
        {orden.detalles.map((d, i) => {
          const prodNombre = d.variante?.producto?.nombre ?? ''
          const varNombre  = d.variante?.nombre ?? `#${d.varianteId}`
          const nombre     = prodNombre ? `${prodNombre} ${varNombre}` : varNombre
          const precio     = parseFloat(d.variante?.precioVenta ?? '0')
          const subtotal   = precio * d.cantidad
          return (
            <div key={d.id}>
              <div className="grid grid-cols-[2.2rem_3rem_1fr_3.5rem] gap-x-1 items-baseline text-slate-800">
                <span className="font-bold tabular-nums">{d.cantidad}</span>
                <span className="tabular-nums">{precio.toFixed(2)}</span>
                <span className="truncate" title={nombre}>
                  {truncNombre(nombre)}
                  {d.origen === 'TIENDA' && <span className="text-amber-500 ml-0.5">(T)</span>}
                </span>
                <span className="text-right font-bold tabular-nums">{subtotal.toFixed(2)}</span>
              </div>
              {/* Espacio entre items para anotaciones manuales */}
              {i < orden.detalles.length - 1 && (
                <div className="h-7 border-b border-dotted border-slate-200" />
              )}
            </div>
          )
        })}
      </div>

      <div className="border-t border-dashed border-slate-300 mt-2" />

      {/* ═══ Totales ═══ */}
      <div className="space-y-1">
        <div className="flex justify-between text-tin-dark">
          <span>ITEMS: {orden.totalProductos}</span>
          <span>CANT: {orden.totalUnidades}</span>
        </div>
        <div className="flex justify-between text-sm font-bold text-slate-900 pt-0.5">
          <span>TOTAL:</span>
          <span className="tabular-nums">S/ {totalMonto.toFixed(2)}</span>
        </div>
      </div>

      <div className="border-t border-dashed border-slate-300" />

      <p className="text-center text-tin-dark text-[10px] pt-1">GRACIAS POR SU COMPRA</p>
    </div>
  )
}

// ── Input de cantidad ─────────────────────────────────────────────────────────
// Al focus se limpia para escribir directo (ej: "20" sin que quede "120").
// Si se excede el stock → alert + se cap al máximo.

function CantidadInput({ cantidad, max, onChange }: { cantidad: number; max: number; onChange: (v: number) => void }) {
  const [local, setLocal] = useState('')
  const [enfocado, setEnfocado] = useState(false)

  // Sincronizar cuando la cantidad cambia desde afuera (botones +/-)
  const prevCantidad = useRef(cantidad)
  if (prevCantidad.current !== cantidad) {
    prevCantidad.current = cantidad
    if (!enfocado) setLocal('')
  }

  function handleFocus() {
    setEnfocado(true)
    setLocal('')
  }

  function handleBlur() {
    setEnfocado(false)
    const parsed = parseInt(local)

    // Si no escribio nada, dejar como estaba
    if (!local || isNaN(parsed) || parsed < 1) {
      setLocal('')
      return
    }

    // Si excede el stock → alert + cap al maximo
    if (parsed > max) {
      sileo.warning(`Stock disponible: ${max}. Se ajusto al maximo.`)
      setLocal('')
      onChange(max)
      return
    }

    setLocal('')
    onChange(parsed)
  }

  return (
    <input
      type="text"
      inputMode="numeric"
      value={enfocado ? local : ''}
      placeholder={String(cantidad)}
      onChange={e => setLocal(e.target.value.replace(/[^0-9]/g, ''))}
      onFocus={handleFocus}
      onBlur={handleBlur}
      onKeyDown={e => { if (e.key === 'Enter') (e.target as HTMLInputElement).blur() }}
      className="w-16 h-9 text-center text-sm font-bold tabular-nums bg-white border border-tin/30 rounded-lg focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary/20 text-slate-900 placeholder:text-slate-400 placeholder:font-bold"
    />
  )
}

// ── Componente principal ────────────────────────────────────────────────────────

function TiendaVentasPage() {
  const navigate  = useNavigate()
  const usuario   = useAuthStore(s => s.usuario)
  const almacenId = usuario?.almacenId ?? null

  // -- Queries --
  const { data: stockDual = [] }  = useStockDual(almacenId)
  const createOrden = useCreateOrdenSalida()
  const printer                   = usePrinterStore()

  // -- Caja --
  const { data: estadoCaja, isLoading: loadingCaja } = useEstadoCaja(almacenId)
  const abrirDia    = useAbrirDia()
  const cerrarCaja  = useCerrarCaja()
  const [showCerrar, setShowCerrar] = useState(false)
  const [montoCierre, setMontoCierre] = useState('')

  const cajaAbiertaHoy = estadoCaja?.estado === 'ABIERTA_HOY'
  const cajaRequiereAccion = estadoCaja?.requiereAccion ?? true

  // Imprime via BT si conectada, si no fallback a window.print()
  // Las notificaciones sileo se manejan en el store
  async function handlePrint(orden: OrdenSalida) {
    try {
      await printer.printOrden(orden)
    } catch {
      // Error ya notificado por el store
    }
  }

  // -- Estado --
  const [pageState, setPageState]     = useState<PageState>('creando')
  const [tipoOrden, setTipoOrden]     = useState<TipoOrden>('VENTA')
  const [busqueda, setBusqueda]       = useState('')
  const [pedido, setPedido]           = useState<ItemPedido[]>([])
  const [alertItem, setAlertItem]     = useState<typeof stockDual[0] | null>(null)
  const [ordenConfirmada, setOrdenConfirmada] = useState<OrdenSalida | null>(null)
  const debounceRef                   = useRef<ReturnType<typeof setTimeout> | null>(null)
  const [queryBusqueda, setQueryBusqueda] = useState('')

  // -- Handlers --

  const handleBusqueda = useCallback((valor: string) => {
    setBusqueda(valor)
    if (debounceRef.current) clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(() => {
      setQueryBusqueda(valor.trim().toLowerCase())
      setPaginaBusqueda(1)
    }, 300)
  }, [])

  // Busca por nombre de producto, variante o SKU
  const resultados = useMemo(() => {
    if (!queryBusqueda) return []
    return stockDual.filter(s => {
      const producto = s.variante?.producto?.nombre?.toLowerCase() ?? ''
      const variante = s.variante?.nombre?.toLowerCase() ?? ''
      const sku      = s.variante?.sku?.toLowerCase()    ?? ''
      return producto.includes(queryBusqueda) || variante.includes(queryBusqueda) || sku.includes(queryBusqueda)
    })
  }, [stockDual, queryBusqueda])

  // Paginacion de resultados de busqueda
  const ITEMS_BUSQUEDA = 8
  const [paginaBusqueda, setPaginaBusqueda] = useState(1)
  const totalPagsBusqueda = Math.max(1, Math.ceil(resultados.length / ITEMS_BUSQUEDA))
  const resultadosPag = resultados.slice((paginaBusqueda - 1) * ITEMS_BUSQUEDA, paginaBusqueda * ITEMS_BUSQUEDA)

  function handleAgregarProducto(item: typeof stockDual[0]) {
    // Si ya está en el pedido, incrementar
    const existe = pedido.find(p => p.varianteId === item.varianteId)
    if (existe) {
      setPedido(prev => prev.map(p =>
        p.varianteId === item.varianteId
          ? { ...p, cantidad: Math.min(p.cantidad + 1, p.stockAlmacen + p.stockTienda) }
          : p
      ))
      setBusqueda('')
      setQueryBusqueda('')
      return
    }

    // Sin stock en almacén pero hay en tienda → alert
    if (item.almacen === 0 && item.tienda > 0) {
      setAlertItem(item)
      setPageState('alert')
      return
    }

    // Sin stock en ningún lado → no agregar
    if (item.almacen === 0 && item.tienda === 0) return

    // Agregar desde almacén normalmente
    const nombreProd = item.variante?.producto?.nombre ?? ''
    const nombreVar  = item.variante?.nombre ?? `#${item.varianteId}`
    const nuevoItem: ItemPedido = {
      varianteId:   item.varianteId,
      nombre:       nombreProd ? `${nombreProd} - ${nombreVar}` : nombreVar,
      sku:          item.variante?.sku ?? null,
      unidadAbrev:  item.variante?.unidad?.abreviatura ?? 'un',
      stockAlmacen: item.almacen,
      stockTienda:  item.tienda,
      cantidad:     1,
      origen:       'ALMACEN',
    }
    setPedido(prev => {
      const next = [...prev, nuevoItem]
      setPaginaPedido(Math.ceil(next.length / ITEMS_PEDIDO))
      return next
    })
    setBusqueda('')
    setQueryBusqueda('')
  }

  function handleAceptarDesdeTienda() {
    if (!alertItem) return
    const nombreProd = alertItem.variante?.producto?.nombre ?? ''
    const nombreVar  = alertItem.variante?.nombre ?? `#${alertItem.varianteId}`
    const nuevoItem: ItemPedido = {
      varianteId:   alertItem.varianteId,
      nombre:       nombreProd ? `${nombreProd} - ${nombreVar}` : nombreVar,
      sku:          alertItem.variante?.sku ?? null,
      unidadAbrev:  alertItem.variante?.unidad?.abreviatura ?? 'un',
      stockAlmacen: alertItem.almacen,
      stockTienda:  alertItem.tienda,
      cantidad:     1,
      origen:       'TIENDA',
    }
    setPedido(prev => {
      const next = [...prev, nuevoItem]
      setPaginaPedido(Math.ceil(next.length / ITEMS_PEDIDO))
      return next
    })
    setAlertItem(null)
    setPageState('creando')
    setBusqueda('')
    setQueryBusqueda('')
  }

  function handleCerrarAlert() {
    setAlertItem(null)
    setPageState('creando')
  }

  function handleCambiarCantidad(varianteId: number, delta: number) {
    setPedido(prev => prev.map(p => {
      if (p.varianteId !== varianteId) return p
      const stockMax = p.origen === 'TIENDA' ? p.stockTienda : p.stockAlmacen
      const nueva    = Math.max(1, Math.min(p.cantidad + delta, stockMax))
      return { ...p, cantidad: nueva }
    }))
  }

  function handleSetCantidad(varianteId: number, valor: number) {
    setPedido(prev => prev.map(p => {
      if (p.varianteId !== varianteId) return p
      const stockMax = p.origen === 'TIENDA' ? p.stockTienda : p.stockAlmacen
      const nueva    = Math.max(1, Math.min(valor, stockMax))
      return { ...p, cantidad: nueva }
    }))
  }

  function handleEliminar(varianteId: number) {
    setPedido(prev => {
      const next = prev.filter(p => p.varianteId !== varianteId)
      const maxPag = Math.max(1, Math.ceil(next.length / ITEMS_PEDIDO))
      if (paginaPedido > maxPag) setPaginaPedido(maxPag)
      return next
    })
  }

  function handleConfirmar() {
    if (!almacenId || pedido.length === 0) return
    createOrden.mutate(
      {
        almacenId,
        tipo:  tipoOrden,
        items: pedido.map(p => ({
          varianteId: p.varianteId,
          cantidad:   p.cantidad,
          origen:     p.origen,
        })),
      },
      {
        onSuccess: (data) => {
          setOrdenConfirmada(data)
          setPageState('confirmada')
        },
      }
    )
  }

  function handleNuevaOrden() {
    setPedido([])
    setBusqueda('')
    setQueryBusqueda('')
    setTipoOrden('VENTA')
    setOrdenConfirmada(null)
    setPageState('creando')
  }

  // -- Paginacion pedido (3 items por página) --
  const ITEMS_PEDIDO = 3
  const [paginaPedido, setPaginaPedido] = useState(1)
  const totalPagsPedido = Math.max(1, Math.ceil(pedido.length / ITEMS_PEDIDO))
  const pedidoPag = pedido.slice((paginaPedido - 1) * ITEMS_PEDIDO, paginaPedido * ITEMS_PEDIDO)

  // -- Cálculos resumen --
  const totalProductos = pedido.length
  const totalUnidades  = pedido.reduce((sum, p) => sum + p.cantidad, 0)

  function handleCerrarCaja() {
    if (!estadoCaja?.caja) return
    const monto = parseFloat(montoCierre) || 0
    cerrarCaja.mutate(
      { id: estadoCaja.caja.id, data: { montoCierre: monto } as CerrarCajaDto },
      { onSuccess: () => { setShowCerrar(false); setMontoCierre('') } }
    )
  }

  // ── JSX ────────────────────────────────────────────────────────────────────

  // ── GATE: Caja no disponible ──
  if (loadingCaja) {
    return (
      <div className="flex flex-col items-center justify-center py-24 gap-3">
        <CreditCard size={32} className="text-tin animate-pulse" />
        <p className="text-sm text-tin">Verificando caja...</p>
      </div>
    )
  }

  if (!cajaAbiertaHoy && estadoCaja) {
    const esDiaAnterior = estadoCaja.estado === 'ABIERTA_DIA_ANTERIOR'
    return (
      <div className="flex flex-col items-center justify-center gap-5 pt-12">
        <div className={`w-20 h-20 rounded-3xl flex items-center justify-center ${
          esDiaAnterior ? 'bg-amber-100' : 'bg-tin-pale'
        }`}>
          <Lock size={36} className={esDiaAnterior ? 'text-amber-500' : 'text-tin'} />
        </div>

        <div className="text-center space-y-2">
          <h2 className="text-xl font-bold text-slate-900">
            {esDiaAnterior ? 'Caja del dia anterior abierta' : 'Caja cerrada'}
          </h2>
          <p className="text-sm text-tin-dark max-w-xs mx-auto">
            {esDiaAnterior
              ? 'Quedo una caja sin cerrar. Se cerrara automaticamente y se abrira la de hoy.'
              : 'Para crear ordenes necesitas abrir la caja del dia.'}
          </p>
        </div>

        <button
          onClick={() => almacenId && abrirDia.mutate(almacenId)}
          disabled={abrirDia.isPending}
          className="min-h-[3rem] px-8 flex items-center justify-center gap-2 bg-primary hover:bg-primary-dark text-slate-900 font-bold text-base rounded-2xl shadow-md shadow-primary/20 active:scale-[0.98] transition-all duration-150 disabled:opacity-50"
        >
          <Unlock size={18} />
          {abrirDia.isPending ? 'Abriendo...' : 'Abrir caja de hoy'}
        </button>

        {esDiaAnterior && estadoCaja.caja && (
          <p className="text-xs text-tin">
            Caja #{estadoCaja.caja.id} abierta el{' '}
            {new Date(estadoCaja.caja.abiertoEn).toLocaleDateString('es-PE')}
          </p>
        )}
      </div>
    )
  }

  // ── STATE 2: Alert modal ──
  if (pageState === 'alert' && alertItem) {
    return (
      <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/40 p-0 sm:p-4">
        <div className="w-full sm:w-auto sm:min-w-[22rem] sm:max-w-sm bg-white rounded-t-2xl sm:rounded-2xl p-6 space-y-4">

          {/* Icono + título */}
          <div className="flex flex-col items-center text-center gap-2">
            <div className="w-14 h-14 rounded-2xl bg-amber-100 flex items-center justify-center">
              <AlertTriangle size={28} className="text-amber-500" />
            </div>
            <h2 className="text-lg font-bold text-slate-900">Sin stock en Almacén</h2>
          </div>

          {/* Info del producto */}
          <div className="bg-tin-pale rounded-xl p-4 space-y-1">
            <p className="font-semibold text-slate-800 text-sm">
              {alertItem.variante?.nombre ?? `Variante #${alertItem.varianteId}`}
            </p>
            <div className="flex gap-4 mt-2">
              <div className="text-center">
                <p className="text-xs text-tin">Almacén</p>
                <p className="text-xl font-bold text-red-500">0</p>
              </div>
              <div className="text-center">
                <p className="text-xs text-tin">Tienda</p>
                <p className="text-xl font-bold text-amber-600">{alertItem.tienda.toLocaleString('es-PE')}</p>
              </div>
            </div>
          </div>

          <p className="text-sm text-tin-dark text-center">
            No hay unidades en almacén para despachar.
            Pero tenés <span className="font-bold text-amber-600">{alertItem.tienda.toLocaleString('es-PE')} unidades</span> en tienda.
          </p>

          {/* Botones */}
          <div className="space-y-2.5">
            <button
              onClick={handleAceptarDesdeTienda}
              className="w-full min-h-[2.75rem] flex items-center justify-center gap-2 bg-amber-500 hover:bg-amber-600 text-white font-bold text-sm rounded-xl active:scale-95 transition-all duration-150"
            >
              Continuar con stock de tienda ({alertItem.tienda.toLocaleString('es-PE')} disp.)
            </button>
            <button
              onClick={handleCerrarAlert}
              className="w-full min-h-[2.75rem] flex items-center justify-center gap-2 bg-tin-pale hover:bg-slate-200 text-tin-dark font-semibold text-sm rounded-xl active:scale-95 transition-all duration-150"
            >
              <X size={15} />
              Cancelar
            </button>
          </div>
        </div>
      </div>
    )
  }

  // ── STATE 3: Orden confirmada + ticket ──
  if (pageState === 'confirmada' && ordenConfirmada) {
    const orden = ordenConfirmada
    return (
      <div className="space-y-5 pt-2">

        {/* ── Header confirmado ── */}
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-2xl bg-primary/20 flex items-center justify-center shrink-0">
            <CheckCircle size={22} className="text-primary-dark" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-slate-900">Orden Confirmada</h1>
            <p className="text-xs text-tin mt-0.5">Podés imprimir o guardar el ticket</p>
          </div>
        </div>

        {/* ── Ticket ── */}
        <div id="ticket-imprimir">
          <TicketOrden orden={orden} solicitante={usuario?.nombre} />
        </div>

        {/* ── Acciones ── */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 print:hidden">
          <button
            onClick={() => handlePrint(orden)}
            disabled={printer.isPrinting}
            className={`flex items-center justify-center gap-2 min-h-[2.75rem] font-semibold text-sm rounded-xl active:scale-95 transition-all duration-150 disabled:opacity-50 ${
              printer.status === 'connected'
                ? 'bg-primary hover:bg-primary-dark text-slate-900 font-bold'
                : 'bg-tin-pale hover:bg-slate-200 text-tin-dark'
            }`}
          >
            <Printer size={16} />
            {printer.isPrinting ? 'Imprimiendo...' : printer.status === 'connected' ? 'Imprimir Ticket' : 'Imprimir (sin BT)'}
          </button>
          <button
            onClick={handleNuevaOrden}
            className="flex items-center justify-center gap-2 min-h-[2.75rem] bg-primary hover:bg-primary-dark text-slate-900 font-bold text-sm rounded-xl active:scale-95 transition-all duration-150"
          >
            <RotateCcw size={16} />
            Nueva Orden
          </button>
          <button
            onClick={() => navigate(-1)}
            className="flex items-center justify-center gap-2 min-h-[2.75rem] bg-white border border-tin/20 hover:border-tin/40 text-tin-dark font-semibold text-sm rounded-xl active:scale-95 transition-all duration-150"
          >
            <ArrowLeft size={16} />
            Volver
          </button>
        </div>
      </div>
    )
  }

  // ── STATE 1: Creando orden ──
  return (
    <div className="space-y-5 pt-2 print:hidden">

      {/* ── Header ── */}
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-primary/15 flex items-center justify-center shrink-0">
          <ShoppingCart size={20} className="text-primary-dark" />
        </div>
        <h1 className="text-xl font-bold text-slate-900 flex-1">Nueva Orden de Salida</h1>
        <button
          onClick={() => setShowCerrar(true)}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-green-50 border border-green-200 text-green-700 text-xs font-bold active:scale-95 transition-all"
        >
          <CreditCard size={13} />
          Caja abierta
        </button>
      </div>

      {/* ── Modal cerrar caja ── */}
      {showCerrar && estadoCaja?.caja && (
        <div
          className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/40 p-0 sm:p-4"
          onClick={() => setShowCerrar(false)}
        >
          <div
            className="w-full sm:w-auto sm:min-w-[22rem] sm:max-w-sm bg-white rounded-t-2xl sm:rounded-2xl p-6 space-y-4"
            onClick={e => e.stopPropagation()}
          >
            <div className="flex flex-col items-center text-center gap-2">
              <div className="w-14 h-14 rounded-2xl bg-red-50 flex items-center justify-center">
                <Lock size={28} className="text-red-400" />
              </div>
              <h2 className="text-lg font-bold text-slate-900">Cerrar caja</h2>
              <p className="text-sm text-tin-dark">Ingresa el monto fisico en caja para cerrar</p>
            </div>

            <div>
              <label className="text-xs font-semibold text-tin-dark">Monto de cierre (S/)</label>
              <input
                type="number"
                step="0.01"
                min="0"
                value={montoCierre}
                onChange={e => setMontoCierre(e.target.value)}
                placeholder="0.00"
                className="mt-1 w-full min-h-[2.75rem] px-4 py-2 rounded-xl border border-tin/30 bg-white text-lg font-bold text-slate-900 tabular-nums text-center focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all"
              />
            </div>

            <div className="space-y-2.5">
              <button
                onClick={handleCerrarCaja}
                disabled={cerrarCaja.isPending}
                className="w-full min-h-[2.75rem] flex items-center justify-center gap-2 bg-red-500 hover:bg-red-600 text-white font-bold text-sm rounded-xl active:scale-95 transition-all duration-150 disabled:opacity-50"
              >
                <Lock size={15} />
                {cerrarCaja.isPending ? 'Cerrando...' : 'Cerrar caja'}
              </button>
              <button
                onClick={() => setShowCerrar(false)}
                className="w-full min-h-[2.75rem] flex items-center justify-center gap-2 bg-tin-pale hover:bg-slate-200 text-tin-dark font-semibold text-sm rounded-xl active:scale-95 transition-all duration-150"
              >
                Cancelar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Toggle tipo ── */}
      <div className="flex gap-2 bg-tin-pale rounded-xl p-1">
        <button
          onClick={() => setTipoOrden('VENTA')}
          className={`flex-1 min-h-[2.75rem] rounded-lg font-bold text-sm transition-all duration-200 active:scale-95 ${
            tipoOrden === 'VENTA'
              ? 'bg-primary text-slate-900 shadow-sm'
              : 'text-tin-dark hover:text-slate-700'
          }`}
        >
          Venta
        </button>
        <button
          onClick={() => setTipoOrden('TRANSFERENCIA')}
          className={`flex-1 min-h-[2.75rem] rounded-lg font-bold text-sm transition-all duration-200 active:scale-95 ${
            tipoOrden === 'TRANSFERENCIA'
              ? 'bg-cyan-400 text-slate-900 shadow-sm'
              : 'text-tin-dark hover:text-slate-700'
          }`}
        >
          Transferencia
        </button>
      </div>

      {/* ── Búsqueda de producto ── */}
      <div className="relative">
        <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-tin pointer-events-none" />
        <input
          type="text"
          value={busqueda}
          onChange={e => handleBusqueda(e.target.value)}
          placeholder="Buscar producto..."
          className="w-full min-h-[2.75rem] pl-10 pr-4 py-2.5 rounded-xl border border-tin/30 bg-white text-sm text-slate-800 placeholder:text-tin focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all duration-150"
        />
        {busqueda && (
          <button
            onClick={() => { setBusqueda(''); setQueryBusqueda('') }}
            className="absolute right-3 top-1/2 -translate-y-1/2 w-6 h-6 flex items-center justify-center rounded-full bg-tin-pale hover:bg-slate-200 transition-colors"
          >
            <X size={12} className="text-tin-dark" />
          </button>
        )}
      </div>

      {/* ── Resultados de búsqueda ── */}
      {resultadosPag.length > 0 && (
        <div className="bg-white rounded-2xl border border-tin/20 shadow-sm overflow-hidden transition-all duration-200">
          <div className="max-h-[24rem] overflow-y-auto divide-y divide-tin/10">
            {resultadosPag.map(item => {
              const sinStock = item.almacen === 0 && item.tienda === 0
              const soloTienda = item.almacen === 0 && item.tienda > 0
              const nombreProd = item.variante?.producto?.nombre ?? ''
              const nombreVar  = item.variante?.nombre ?? `#${item.varianteId}`
              return (
                <div
                  key={item.varianteId}
                  className={`flex items-center gap-3 px-4 py-3 ${sinStock ? 'opacity-50' : ''}`}
                >
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-slate-800 truncate">
                      {nombreProd ? `${nombreProd} - ${nombreVar}` : nombreVar}
                    </p>
                    <div className="flex gap-3 mt-0.5">
                      <span className="text-xs text-tin-dark">
                        Alm: <span className={`font-bold ${item.almacen === 0 ? 'text-red-500' : 'text-slate-700'}`}>
                          {item.almacen.toLocaleString('es-PE')}
                        </span>
                      </span>
                      <span className="text-xs text-tin-dark">
                        Tie: <span className="font-bold text-slate-700">
                          {item.tienda.toLocaleString('es-PE')}
                        </span>
                      </span>
                    </div>
                  </div>
                  {sinStock ? (
                    <div className="w-9 h-9 rounded-xl bg-tin-pale flex items-center justify-center shrink-0">
                      <AlertTriangle size={15} className="text-tin" />
                    </div>
                  ) : soloTienda ? (
                    <button
                      onClick={() => handleAgregarProducto(item)}
                      className="w-9 h-9 rounded-xl bg-amber-100 hover:bg-amber-200 text-amber-700 flex items-center justify-center shrink-0 active:scale-95 transition-all duration-150"
                      title="Solo stock en tienda"
                    >
                      <AlertTriangle size={15} />
                    </button>
                  ) : (
                    <button
                      onClick={() => handleAgregarProducto(item)}
                      className="w-9 h-9 rounded-xl bg-primary/15 hover:bg-primary/30 text-primary-dark flex items-center justify-center shrink-0 active:scale-95 transition-all duration-150"
                    >
                      <Plus size={17} />
                    </button>
                  )}
                </div>
              )
            })}
          </div>

          {/* Paginacion de resultados */}
          {totalPagsBusqueda > 1 && (
            <div className="flex items-center justify-between px-4 py-2.5 border-t border-tin/10 bg-tin-pale/50">
              <button
                onClick={() => setPaginaBusqueda(p => Math.max(1, p - 1))}
                disabled={paginaBusqueda <= 1}
                className="min-h-[2rem] px-3 text-xs font-semibold text-tin-dark bg-white rounded-lg border border-tin/20 hover:border-tin/40 active:scale-95 transition-all disabled:opacity-40"
              >
                Anterior
              </button>
              <span className="text-xs text-tin-dark">
                {paginaBusqueda} / {totalPagsBusqueda} ({resultados.length} items)
              </span>
              <button
                onClick={() => setPaginaBusqueda(p => Math.min(totalPagsBusqueda, p + 1))}
                disabled={paginaBusqueda >= totalPagsBusqueda}
                className="min-h-[2rem] px-3 text-xs font-semibold text-tin-dark bg-white rounded-lg border border-tin/20 hover:border-tin/40 active:scale-95 transition-all disabled:opacity-40"
              >
                Siguiente
              </button>
            </div>
          )}
        </div>
      )}

      {queryBusqueda && resultados.length === 0 && (
        <div className="bg-white rounded-2xl border border-tin/20 p-6 text-center">
          <Package size={28} className="mx-auto text-tin mb-2" />
          <p className="text-sm text-tin">Sin resultados para "{queryBusqueda}"</p>
        </div>
      )}

      {/* ── Lista del pedido ── */}
      {pedido.length > 0 && (
        <div className="space-y-3">
          <p className="text-xs font-bold text-tin-dark uppercase tracking-wide">Tu pedido</p>

          <div className="space-y-2">
            {pedidoPag.map(item => {
              const stockMax = item.origen === 'TIENDA' ? item.stockTienda : item.stockAlmacen
              return (
                <div
                  key={item.varianteId}
                  className="bg-white rounded-2xl border border-tin/20 shadow-sm p-4 space-y-3"
                >
                  {/* Nombre + eliminar */}
                  <div className="flex items-start gap-2">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className="text-sm font-semibold text-slate-800 truncate">{item.nombre}</p>
                        {item.origen === 'TIENDA' && (
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-100 text-amber-700 shrink-0">
                            desde tienda
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-tin mt-0.5">
                        Alm: {item.stockAlmacen.toLocaleString('es-PE')} · Tie: {item.stockTienda.toLocaleString('es-PE')} · Max: {stockMax.toLocaleString('es-PE')}
                      </p>
                    </div>
                    <button
                      onClick={() => handleEliminar(item.varianteId)}
                      className="w-8 h-8 rounded-lg bg-red-50 hover:bg-red-100 text-red-400 hover:text-red-600 flex items-center justify-center active:scale-90 transition-all duration-150 shrink-0"
                    >
                      <Trash2 size={13} />
                    </button>
                  </div>

                  {/* Controles cantidad: -20 -10 -1 [input] +1 +10 +20 */}
                  <div className="flex items-center justify-center gap-1">
                    <button
                      onClick={() => handleCambiarCantidad(item.varianteId, -20)}
                      disabled={item.cantidad <= 1}
                      className="h-9 px-2 rounded-lg bg-tin-pale hover:bg-slate-200 text-tin-dark text-xs font-bold active:scale-90 transition-all disabled:opacity-30"
                    >
                      -20
                    </button>
                    <button
                      onClick={() => handleCambiarCantidad(item.varianteId, -10)}
                      disabled={item.cantidad <= 1}
                      className="h-9 px-2 rounded-lg bg-tin-pale hover:bg-slate-200 text-tin-dark text-xs font-bold active:scale-90 transition-all disabled:opacity-30"
                    >
                      -10
                    </button>
                    <button
                      onClick={() => handleCambiarCantidad(item.varianteId, -1)}
                      disabled={item.cantidad <= 1}
                      className="w-9 h-9 rounded-lg bg-tin-pale hover:bg-slate-200 text-tin-dark flex items-center justify-center active:scale-90 transition-all disabled:opacity-30"
                    >
                      <Minus size={14} />
                    </button>

                    <CantidadInput
                      cantidad={item.cantidad}
                      max={stockMax}
                      onChange={val => handleSetCantidad(item.varianteId, val)}
                    />

                    <button
                      onClick={() => handleCambiarCantidad(item.varianteId, 1)}
                      disabled={item.cantidad >= stockMax}
                      className="w-9 h-9 rounded-lg bg-primary/15 hover:bg-primary/30 text-primary-dark flex items-center justify-center active:scale-90 transition-all disabled:opacity-30"
                    >
                      <Plus size={14} />
                    </button>
                    <button
                      onClick={() => handleCambiarCantidad(item.varianteId, 10)}
                      disabled={item.cantidad >= stockMax}
                      className="h-9 px-2 rounded-lg bg-primary/15 hover:bg-primary/30 text-primary-dark text-xs font-bold active:scale-90 transition-all disabled:opacity-30"
                    >
                      +10
                    </button>
                    <button
                      onClick={() => handleCambiarCantidad(item.varianteId, 20)}
                      disabled={item.cantidad >= stockMax}
                      className="h-9 px-2 rounded-lg bg-primary/15 hover:bg-primary/30 text-primary-dark text-xs font-bold active:scale-90 transition-all disabled:opacity-30"
                    >
                      +20
                    </button>
                  </div>
                </div>
              )
            })}
          </div>

          {/* Paginacion pedido */}
          {totalPagsPedido > 1 && (
            <div className="flex items-center justify-between">
              <button
                onClick={() => setPaginaPedido(p => Math.max(1, p - 1))}
                disabled={paginaPedido <= 1}
                className="min-h-[2rem] px-3 text-xs font-semibold text-tin-dark bg-white rounded-lg border border-tin/20 hover:border-tin/40 active:scale-95 transition-all disabled:opacity-40"
              >
                Anterior
              </button>
              <span className="text-xs text-tin-dark">
                {paginaPedido} / {totalPagsPedido}
              </span>
              <button
                onClick={() => setPaginaPedido(p => Math.min(totalPagsPedido, p + 1))}
                disabled={paginaPedido >= totalPagsPedido}
                className="min-h-[2rem] px-3 text-xs font-semibold text-tin-dark bg-white rounded-lg border border-tin/20 hover:border-tin/40 active:scale-95 transition-all disabled:opacity-40"
              >
                Siguiente
              </button>
            </div>
          )}

          {/* Barra de resumen */}
          <div className="bg-tin-pale rounded-xl px-4 py-2.5 flex items-center justify-between">
            <p className="text-sm text-tin-dark">
              <span className="font-bold text-slate-800">{totalProductos.toLocaleString('es-PE')}</span> producto{totalProductos !== 1 ? 's' : ''}
            </p>
            <p className="text-sm text-tin-dark">
              <span className="font-bold text-slate-800">{totalUnidades.toLocaleString('es-PE')}</span> unidade{totalUnidades !== 1 ? 's' : ''}
            </p>
          </div>
        </div>
      )}

      {/* ── Botón confirmar ── */}
      <button
        onClick={handleConfirmar}
        disabled={pedido.length === 0 || createOrden.isPending}
        className="w-full min-h-[3rem] flex items-center justify-center gap-2 bg-primary hover:bg-primary-dark text-slate-900 font-bold text-base rounded-2xl shadow-md shadow-primary/20 active:scale-[0.98] transition-all duration-150 disabled:opacity-40 disabled:cursor-not-allowed disabled:shadow-none"
      >
        <ShoppingCart size={18} />
        {createOrden.isPending ? 'Procesando...' : 'Confirmar e Imprimir Ticket'}
      </button>

      {/* ── Separador + botón listado tickets ── */}
      <div className="border-t border-tin/20" />
      <button
        onClick={() => navigate('/tienda/tickets')}
        className="w-full flex items-center gap-4 p-4 bg-white rounded-2xl border border-tin/20 shadow-sm hover:border-primary/40 hover:shadow-md active:scale-[0.98] transition-all duration-150"
      >
        <div className="w-11 h-11 rounded-xl bg-tin-pale flex items-center justify-center shrink-0">
          <Receipt size={22} className="text-tin-dark" />
        </div>
        <div className="text-left flex-1">
          <p className="text-base font-bold text-slate-900">Listado de tickets</p>
          <p className="text-xs text-tin mt-0.5">Ver órdenes del día e imprimir</p>
        </div>
      </button>
    </div>
  )
}

export default TiendaVentasPage
