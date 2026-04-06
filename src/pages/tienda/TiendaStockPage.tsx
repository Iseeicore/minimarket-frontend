import { useState, useMemo } from 'react'
import { Package, Search, AlertTriangle, Loader2 } from 'lucide-react'
import { useStockByAlmacen } from '../../hooks/useStock'
import { useAuthStore } from '../../store/auth.store'

const ITEMS_PER_PAGE = 8

export default function TiendaStockPage() {
  const usuario   = useAuthStore(s => s.usuario)
  const almacenId = usuario?.almacenId ?? null

  const { data: stock = [], isLoading } = useStockByAlmacen(almacenId)

  const [busqueda, setBusqueda] = useState('')
  const [pagina, setPagina]     = useState(1)

  // ── Filtrado ─────────────────────────────────────────────────────
  const filtrado = useMemo(() => {
    const q = busqueda.trim().toLowerCase()
    if (!q) return stock
    return stock.filter(s => {
      const prod     = s.variante?.producto?.nombre?.toLowerCase() ?? ''
      const variante = s.variante?.nombre?.toLowerCase() ?? ''
      return prod.includes(q) || variante.includes(q)
    })
  }, [stock, busqueda])

  // ── Paginación ───────────────────────────────────────────────────
  const totalPages = Math.max(1, Math.ceil(filtrado.length / ITEMS_PER_PAGE))
  const safePage   = Math.min(pagina, totalPages)
  const pageItems  = filtrado.slice((safePage - 1) * ITEMS_PER_PAGE, safePage * ITEMS_PER_PAGE)

  function handleBuscar(valor: string) {
    setBusqueda(valor)
    setPagina(1)
  }

  if (isLoading) {
    return (
      <div className="flex justify-center items-center py-24">
        <Loader2 size={32} className="animate-spin text-tin" />
      </div>
    )
  }

  return (
    // Flex column: header + search fijos, cards scroll interno, paginación fija abajo
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
              const prod     = item.variante?.producto?.nombre ?? '—'
              const variante = item.variante?.nombre ?? '—'
              const unidad   = item.variante?.unidad?.abreviatura ?? ''
              const precio   = Number(item.variante?.precioVenta ?? 0)
              const minimo   = item.variante?.stockMinimo ?? 0
              const bajo     = item.cantidad <= minimo

              return (
                <div
                  key={item.id}
                  className={`bg-white rounded-2xl border shadow-sm p-4 flex flex-col gap-2 ${
                    bajo ? 'border-amber-300' : 'border-tin/20'
                  }`}
                >
                  {/* Nombre producto */}
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <p className="font-bold text-slate-900 text-base leading-tight">{prod}</p>
                      <p className="text-xs text-tin-dark mt-0.5">{variante}</p>
                    </div>
                    {bajo && (
                      <span className="shrink-0 flex items-center gap-1 bg-amber-50 text-amber-700 text-xs font-semibold px-2 py-1 rounded-lg border border-amber-200">
                        <AlertTriangle size={11} />
                        Poco
                      </span>
                    )}
                  </div>

                  {/* Cantidad — número grande */}
                  <div className="flex items-end justify-between mt-1">
                    <div>
                      <p className="text-4xl font-black text-slate-900 leading-none tabular-nums">
                        {item.cantidad}
                      </p>
                      <p className="text-sm text-tin font-medium mt-0.5">{unidad}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-xs text-tin">Precio</p>
                      <p className="text-base font-bold text-primary-dark tabular-nums">
                        S/ {precio.toFixed(2)}
                      </p>
                    </div>
                  </div>

                  {/* Barra visual de stock */}
                  <div className="mt-1">
                    <div className="h-1.5 bg-tin-pale rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all ${bajo ? 'bg-amber-400' : 'bg-primary'}`}
                        style={{ width: `${Math.min(100, minimo > 0 ? (item.cantidad / (minimo * 3)) * 100 : 100)}%` }}
                      />
                    </div>
                    {minimo > 0 && (
                      <p className="text-xs text-tin mt-1">Mínimo: {minimo} {unidad}</p>
                    )}
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
          className="flex-1 py-3 bg-white border border-tin/30 rounded-2xl text-sm font-semibold text-slate-700 disabled:opacity-40 disabled:cursor-not-allowed active:scale-[0.98] transition-all"
        >
          ← Anterior
        </button>
        <span className="text-sm text-tin-dark font-medium whitespace-nowrap">
          {safePage} / {totalPages}
        </span>
        <button
          onClick={() => setPagina(p => Math.min(totalPages, p + 1))}
          disabled={safePage === totalPages}
          className="flex-1 py-3 bg-white border border-tin/30 rounded-2xl text-sm font-semibold text-slate-700 disabled:opacity-40 disabled:cursor-not-allowed active:scale-[0.98] transition-all"
        >
          Siguiente →
        </button>
      </div>

    </div>
  )
}
