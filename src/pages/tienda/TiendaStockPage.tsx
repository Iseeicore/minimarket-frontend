import { useState, useMemo } from 'react'
import { Package, Search, AlertTriangle, Loader2, Warehouse, Store } from 'lucide-react'
import { useStockDual } from '../../hooks/useOrdenesSalida'
import { useAuthStore } from '../../store/auth.store'

const ITEMS_PER_PAGE = 8

function TiendaStockPage() {
  // -- Estado --
  const [busqueda, setBusqueda] = useState('')
  const [pagina, setPagina]     = useState(1)

  // -- Auth --
  const usuario   = useAuthStore(s => s.usuario)
  const almacenId = usuario?.almacenId ?? null

  // -- Queries --
  const { data: stock = [], isLoading } = useStockDual(almacenId)

  // -- Filtrado --
  const filtrado = useMemo(() => {
    const q = busqueda.trim().toLowerCase()
    if (!q) return stock
    return stock.filter(item => {
      const prod     = item.variante?.producto?.nombre?.toLowerCase() ?? ''
      const variante = item.variante?.nombre?.toLowerCase() ?? ''
      return prod.includes(q) || variante.includes(q)
    })
  }, [stock, busqueda])

  // -- Paginación --
  const totalPages = Math.max(1, Math.ceil(filtrado.length / ITEMS_PER_PAGE))
  const safePage   = Math.min(pagina, totalPages)
  const pageItems  = filtrado.slice((safePage - 1) * ITEMS_PER_PAGE, safePage * ITEMS_PER_PAGE)

  function handleBuscar(valor: string) {
    setBusqueda(valor)
    setPagina(1)
  }

  // -- Loading --
  if (isLoading) {
    return (
      <div className="flex justify-center items-center py-24">
        <Loader2 size={32} className="animate-spin text-tin" />
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-4 pt-2" style={{ height: 'calc(100dvh - 3.5rem - 5rem)' }}>

      {/* ── Header ── */}
      <div className="flex items-center gap-3 shrink-0">
        <Package size={22} className="text-tin-dark" />
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Stock</h1>
          <p className="text-sm text-tin mt-0.5">{filtrado.length} productos disponibles</p>
        </div>
      </div>

      {/* ── Buscador ── */}
      <div className="relative shrink-0">
        <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-tin pointer-events-none" />
        <input
          type="text"
          value={busqueda}
          onChange={e => handleBuscar(e.target.value)}
          placeholder="Buscar producto..."
          className="w-full pl-11 pr-4 py-3.5 bg-white border border-tin/30 rounded-2xl text-base text-slate-900 placeholder:text-tin focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all"
        />
      </div>

      {/* ── Cards — área con scroll propio ── */}
      <div className="flex-1 overflow-y-auto min-h-0">
        {pageItems.length === 0 ? (
          <div className="bg-white rounded-2xl border border-tin/20 p-8 text-center">
            <Package size={36} className="mx-auto text-tin mb-3" />
            <p className="font-semibold text-slate-700">Sin resultados</p>
            <p className="text-sm text-tin mt-1">Probá con otro nombre de producto</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 pb-2">
            {pageItems.map(item => {
              const nombreProd = item.variante?.producto?.nombre ?? '—'
              const nombreVar  = item.variante?.nombre ?? '—'
              const unidad     = item.variante?.unidad?.abreviatura ?? ''
              const precio     = Number(item.variante?.precioVenta ?? 0)
              const minimo     = item.stockMinimo ?? 0

              const almacen   = item.almacen   ?? 0
              const tienda    = item.tienda    ?? 0
              const total     = item.total     ?? (almacen + tienda)
              const inicioHoy  = item.inicioHoy  ?? total
              const salidaHoy  = item.salidaHoy  ?? 0
              const ingresoHoy = item.ingresoHoy ?? 0

              // -- Variantes de alerta --
              const sinStock        = almacen === 0 && tienda === 0
              const sinStockAlmacen = almacen === 0 && tienda > 0
              const stockBajo       = !sinStock && total <= minimo

              // -- Barra de progreso: stock actual vs inicio del día --
              const pct = inicioHoy > 0 ? (total / inicioHoy) * 100 : 100
              const barWidth = Math.min(100, Math.max(0, pct))

              const barColor = sinStock
                ? 'bg-red-400'
                : pct <= 30
                  ? 'bg-red-400'
                  : pct <= 60
                    ? 'bg-amber-400'
                    : 'bg-primary'

              // -- Borde de la card --
              const cardBorder = sinStock || sinStockAlmacen
                ? 'border-red-300'
                : stockBajo
                  ? 'border-amber-300'
                  : 'border-tin/20'

              return (
                <div
                  key={item.varianteId}
                  className={`bg-white rounded-2xl border shadow-sm p-4 sm:p-5 flex flex-col gap-2.5 ${cardBorder}`}
                >
                  {/* Nombre + badge de alerta */}
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0 flex-1">
                      <p className="text-base font-semibold text-slate-900 leading-tight truncate">
                        {nombreProd} {nombreVar}
                      </p>
                    </div>

                    {sinStock && (
                      <span className="shrink-0 flex items-center gap-1 bg-red-50 text-red-700 text-xs font-semibold px-2 py-1 rounded-lg border border-red-200">
                        <AlertTriangle size={11} />
                        Sin stock
                      </span>
                    )}
                    {sinStockAlmacen && (
                      <span className="shrink-0 flex items-center gap-1 bg-red-50 text-red-700 text-xs font-semibold px-2 py-1 rounded-lg border border-red-200">
                        <AlertTriangle size={11} />
                        Sin stock en almacen
                      </span>
                    )}
                    {stockBajo && (
                      <span className="shrink-0 flex items-center gap-1 bg-amber-50 text-amber-700 text-xs font-semibold px-2 py-1 rounded-lg border border-amber-200">
                        <AlertTriangle size={11} />
                        Stock bajo
                      </span>
                    )}
                  </div>

                  {/* Tres columnas: Almacen / Tienda / Total */}
                  <div className="grid grid-cols-3 gap-1">
                    <div className="flex flex-col items-start gap-0.5">
                      <div className="flex items-center gap-1 text-tin">
                        <Warehouse size={14} />
                        <span className="text-xs text-tin-dark">Almacen</span>
                      </div>
                      <span className="text-sm font-semibold text-slate-800 tabular-nums">{almacen}</span>
                    </div>

                    <div className="flex flex-col items-center gap-0.5">
                      <div className="flex items-center gap-1 text-tin">
                        <Store size={14} />
                        <span className="text-xs text-tin-dark">Tienda</span>
                      </div>
                      <span className="text-sm font-semibold text-slate-800 tabular-nums">{tienda}</span>
                    </div>

                    <div className="flex flex-col items-end gap-0.5">
                      <span className="text-xs text-tin-dark">Total</span>
                      <span className="text-sm font-bold text-slate-900 tabular-nums">{total}</span>
                    </div>
                  </div>

                  {/* Barra de progreso — anima ancho + color en cada refetch */}
                  <div className="h-2 bg-tin-pale rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full ${barColor}`}
                      style={{
                        width: `${barWidth}%`,
                        transition: 'width 600ms ease-out, background-color 600ms ease-out',
                      }}
                    />
                  </div>

                  {/* Unidad + movimiento del día + precio */}
                  <div className="flex items-center justify-between gap-1">
                    <span className="text-xs text-tin-dark">{unidad}</span>
                    <div className="flex items-center gap-2 flex-1 justify-center">
                      {ingresoHoy > 0 && (
                        <span className="text-xs font-semibold text-green-500 tabular-nums">
                          +{ingresoHoy}
                        </span>
                      )}
                      {salidaHoy > 0 && (
                        <span className="text-xs font-semibold text-red-400 tabular-nums">
                          -{salidaHoy}
                        </span>
                      )}
                    </div>
                    <span className="text-xs text-tin-dark tabular-nums">S/ {precio.toFixed(2)}</span>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>

      {/* ── Paginación — siempre visible abajo ── */}
      <div className="shrink-0 flex items-center justify-between gap-3 pb-1">
        <button
          onClick={() => setPagina(p => Math.max(1, p - 1))}
          disabled={safePage === 1}
          className="flex-1 py-3 bg-white border border-tin/30 rounded-2xl text-sm font-semibold text-slate-700 disabled:opacity-40 disabled:cursor-not-allowed active:scale-[0.98] transition-all min-h-[2.75rem]"
        >
          ← Anterior
        </button>
        <span className="text-sm text-tin-dark font-medium whitespace-nowrap">
          {safePage} / {totalPages}
        </span>
        <button
          onClick={() => setPagina(p => Math.min(totalPages, p + 1))}
          disabled={safePage === totalPages}
          className="flex-1 py-3 bg-white border border-tin/30 rounded-2xl text-sm font-semibold text-slate-700 disabled:opacity-40 disabled:cursor-not-allowed active:scale-[0.98] transition-all min-h-[2.75rem]"
        >
          Siguiente →
        </button>
      </div>

    </div>
  )
}

export default TiendaStockPage
