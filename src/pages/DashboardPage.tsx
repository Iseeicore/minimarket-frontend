import { useState, useEffect, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  TrendingUp, AlertTriangle, Wallet, Loader2,
  CheckCircle2, XCircle, Package, ArrowRight, Warehouse,
} from 'lucide-react'
import { useVentasHoy } from '../hooks/useVentas'
import { useStockByAlmacen } from '../hooks/useStock'
import { useCajaActiva, useCajas } from '../hooks/useCaja'
import { useAlmacenes } from '../hooks/useAlmacenes'
import { useAuthStore } from '../store/auth.store'

// -- Helpers ------------------------------------------------------------------

function fmt(n: number) {
  return n.toLocaleString('es-PE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
}
function formatHora(iso: string) {
  return new Date(iso).toLocaleTimeString('es-PE', { hour: '2-digit', minute: '2-digit' })
}
function saludo() {
  const h = new Date().getHours()
  if (h < 12) return 'Buenos días'
  if (h < 19) return 'Buenas tardes'
  return 'Buenas noches'
}

// -- Dashboard ----------------------------------------------------------------

export default function DashboardPage() {
  const navigate    = useNavigate()
  const { usuario, isAdmin } = useAuthStore()
  const nombre      = usuario?.nombre?.split(' ')[0] ?? ''

  // -- Selector de almacén (solo ADMIN) --
  const { data: almacenes = [] } = useAlmacenes()
  const { data: cajas = [] }     = useCajas()

  // IDs de almacenes con caja abierta
  const almacenesConCaja = useMemo(() => {
    const ids = new Set<number>()
    for (const c of cajas) {
      if (c.estado === 'ABIERTA') ids.add(c.almacenId)
    }
    return ids
  }, [cajas])

  const [selectedAlmacenId, setSelectedAlmacenId] = useState<number | null>(
    usuario?.almacenId ?? null,
  )

  // Auto-select: cuando llegan los almacenes, elegir el que tiene caja abierta
  useEffect(() => {
    if (!isAdmin() || selectedAlmacenId) return
    if (almacenes.length === 0) return

    const conCaja = almacenes.find((a) => almacenesConCaja.has(a.id))
    setSelectedAlmacenId(conCaja?.id ?? almacenes[0]?.id ?? null)
  }, [almacenes, almacenesConCaja, isAdmin, selectedAlmacenId])

  // -- Queries filtradas por almacén seleccionado --
  const almacenId = selectedAlmacenId
  const { data: ventasHoy  = [], isLoading: loadingVentas } = useVentasHoy(almacenId ?? undefined)
  const { data: stockItems = [], isLoading: loadingStock  } = useStockByAlmacen(almacenId)
  const { data: caja,            isLoading: loadingCaja   } = useCajaActiva(almacenId)

  // -- Derivados --
  const totalHoy    = ventasHoy.reduce((acc, v) => acc + parseFloat(v.total), 0)
  const txnsHoy     = ventasHoy.length
  const cajaAbierta = !!caja

  const bajosMinimo = stockItems.filter(s => s.cantidad < (s.variante?.stockMinimo ?? 0))

  const valorInventario = stockItems.reduce(
    (acc, s) => acc + s.cantidad * parseFloat(s.variante?.precioVenta ?? '0'), 0
  )

  const topVariantes = useMemo(() => {
    const mapa = new Map<number, { nombre: string; cant: number }>()
    for (const v of ventasHoy) {
      if (!v.items) continue
      for (const item of v.items) {
        const nombre = item.variante?.nombre ?? `#${item.varianteId}`
        const prev   = mapa.get(item.varianteId)
        mapa.set(item.varianteId, { nombre, cant: (prev?.cant ?? 0) + item.cantidad })
      }
    }
    const lista = Array.from(mapa.values()).sort((a, b) => b.cant - a.cant).slice(0, 5)
    const maxCant = lista[0]?.cant ?? 1
    return lista.map(l => ({ label: l.nombre, value: l.cant, max: maxCant }))
  }, [ventasHoy])

  const metodoPagoResumen = useMemo(() => {
    const mapa: Record<string, number> = {}
    for (const v of ventasHoy) {
      mapa[v.metodoPago] = (mapa[v.metodoPago] ?? 0) + parseFloat(v.total)
    }
    return Object.entries(mapa).sort((a, b) => b[1] - a[1])
  }, [ventasHoy])

  if (!almacenId && isAdmin() && almacenes.length === 0) {
    return (
      <div className="flex justify-center items-center py-24">
        <Loader2 size={32} className="animate-spin text-tin" />
      </div>
    )
  }

  if (loadingVentas || loadingStock || loadingCaja) {
    return (
      <div className="flex justify-center items-center py-24">
        <Loader2 size={32} className="animate-spin text-tin" />
      </div>
    )
  }

  // -- JSX --
  return (
    <div className="space-y-5 w-full">

      {/* -- Header -- */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-xs font-semibold text-tin uppercase tracking-widest mb-1">
            {new Date().toLocaleDateString('es-PE', { weekday: 'long', day: '2-digit', month: 'long' })}
          </p>
          <h1 className="text-2xl font-bold text-gray-800">
            {saludo()}{nombre ? `, ${nombre}` : ''}
          </h1>
        </div>
        <div className={`flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-bold shrink-0 border ${
          cajaAbierta
            ? 'bg-green-50 text-green-700 border-green-200'
            : 'bg-tin-pale text-tin-dark border-tin/30'
        }`}>
          <span className={`w-2 h-2 rounded-full shrink-0 ${cajaAbierta ? 'bg-green-500 animate-pulse' : 'bg-tin'}`} />
          {cajaAbierta ? 'Caja abierta' : 'Caja cerrada'}
        </div>
      </div>

      {/* -- Selector de almacén (solo ADMIN) -- */}
      {isAdmin() && almacenes.length > 0 && (
        <div className="flex items-center gap-3 p-3 bg-white rounded-2xl border border-tin/20 shadow-sm">
          <Warehouse size={18} className="text-tin-dark shrink-0" />
          <label className="text-sm font-medium text-gray-700 shrink-0">Almacén</label>
          <select
            value={almacenId ?? ''}
            onChange={(e) => setSelectedAlmacenId(+e.target.value)}
            className="flex-1 text-sm font-medium text-gray-900 bg-tin-pale/50 border border-tin/20 rounded-xl px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary/40 min-h-[2.75rem]"
          >
            {almacenes.map((a) => (
              <option key={a.id} value={a.id}>
                {a.nombre} {almacenesConCaja.has(a.id) ? '● Caja abierta' : ''}
              </option>
            ))}
          </select>
        </div>
      )}

      {/* -- Alerta stock bajo mínimo -- */}
      {bajosMinimo.length > 0 && (
        <button
          onClick={() => navigate('/stock')}
          className="w-full flex items-start gap-3 p-4 rounded-2xl bg-amber-50 border border-amber-200 hover:bg-amber-100 transition-colors text-left group"
        >
          <AlertTriangle size={18} className="text-amber-600 mt-0.5 shrink-0" />
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-amber-800">
              {bajosMinimo.length} {bajosMinimo.length === 1 ? 'artículo bajo' : 'artículos bajo'} el mínimo — revisá el stock
            </p>
            <p className="text-xs text-amber-700 mt-0.5 truncate">
              {bajosMinimo.slice(0, 4).map(s => s.variante?.nombre).join(' · ')}
              {bajosMinimo.length > 4 ? ` y ${bajosMinimo.length - 4} más` : ''}
            </p>
          </div>
          <ArrowRight size={15} className="text-amber-500 shrink-0 mt-0.5 group-hover:translate-x-0.5 transition-transform" />
        </button>
      )}

      {/* -- Hero metric + stats secundarias -- */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">

        {/* Ventas del día — hero */}
        <div className="sm:col-span-2 bg-white rounded-2xl border border-tin/20 shadow-sm p-5 flex items-center gap-5">
          <div className="w-14 h-14 rounded-2xl bg-primary/15 flex items-center justify-center shrink-0">
            <TrendingUp size={26} className="text-primary-dark" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs font-semibold text-tin-dark uppercase tracking-wide">Ventas del día</p>
            <p className="text-4xl font-bold text-gray-900 tabular-nums leading-tight mt-0.5">
              S/ {fmt(totalHoy)}
            </p>
            <p className="text-sm text-tin mt-1">
              {txnsHoy === 0
                ? 'Sin transacciones aún'
                : `${txnsHoy} ${txnsHoy === 1 ? 'transacción' : 'transacciones'}`}
            </p>
          </div>
          {txnsHoy > 0 && (
            <button
              onClick={() => navigate('/ventas')}
              className="shrink-0 text-xs font-semibold text-primary-dark hover:underline flex items-center gap-1"
            >
              Ver todas <ArrowRight size={12} />
            </button>
          )}
        </div>

        {/* Caja */}
        <div className={`bg-white rounded-2xl border shadow-sm p-5 flex items-center gap-4 ${
          cajaAbierta ? 'border-green-200' : 'border-tin/20'
        }`}>
          <div className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 ${
            cajaAbierta ? 'bg-green-100' : 'bg-tin-pale'
          }`}>
            {cajaAbierta
              ? <CheckCircle2 size={22} className="text-green-600" />
              : <XCircle size={22} className="text-tin" />
            }
          </div>
          <div className="min-w-0">
            <p className="text-xs font-semibold text-tin-dark uppercase tracking-wide">Caja</p>
            <p className={`text-xl font-bold mt-0.5 tabular-nums ${
              cajaAbierta ? 'text-green-700' : 'text-gray-400'
            }`}>
              {caja ? `S/ ${fmt(parseFloat(caja.montoApertura))}` : 'Cerrada'}
            </p>
            <p className="text-xs text-tin mt-0.5">
              {caja ? 'Apertura de hoy' : 'Sin caja activa'}
            </p>
          </div>
        </div>
      </div>

      {/* -- Fila secundaria -- */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="bg-white rounded-2xl border border-tin/20 shadow-sm p-4">
          <p className="text-xs text-gray-400 font-medium uppercase tracking-wide">Inventario</p>
          <p className="text-2xl font-bold text-gray-800 mt-1 tabular-nums">S/ {fmt(valorInventario)}</p>
          <p className="text-xs text-tin mt-0.5">{stockItems.length} variantes</p>
        </div>
        <div className={`rounded-2xl border shadow-sm p-4 ${
          bajosMinimo.length > 0 ? 'bg-amber-50 border-amber-200' : 'bg-white border-tin/20'
        }`}>
          <p className="text-xs text-gray-400 font-medium uppercase tracking-wide">Stock crítico</p>
          <p className={`text-2xl font-bold mt-1 ${bajosMinimo.length > 0 ? 'text-amber-600' : 'text-gray-800'}`}>
            {bajosMinimo.length}
          </p>
          <p className="text-xs text-tin mt-0.5">
            {bajosMinimo.length === 0 ? 'Todo en orden' : 'bajo el mínimo'}
          </p>
        </div>
        {metodoPagoResumen.slice(0, 2).map(([metodo, total]) => (
          <div key={metodo} className="bg-white rounded-2xl border border-tin/20 shadow-sm p-4">
            <p className="text-xs text-gray-400 font-medium uppercase tracking-wide">{metodo}</p>
            <p className="text-2xl font-bold text-gray-800 mt-1 tabular-nums">S/ {fmt(total)}</p>
            <p className="text-xs text-tin mt-0.5">hoy</p>
          </div>
        ))}
        {metodoPagoResumen.length === 0 && (
          <>
            <div className="bg-white rounded-2xl border border-tin/20 shadow-sm p-4">
              <p className="text-xs text-gray-400 font-medium uppercase tracking-wide">EFECTIVO</p>
              <p className="text-2xl font-bold text-gray-400 mt-1">S/ 0.00</p>
              <p className="text-xs text-tin mt-0.5">sin ventas</p>
            </div>
            <div className="bg-white rounded-2xl border border-tin/20 shadow-sm p-4">
              <p className="text-xs text-gray-400 font-medium uppercase tracking-wide">YAPE / OTROS</p>
              <p className="text-2xl font-bold text-gray-400 mt-1">S/ 0.00</p>
              <p className="text-xs text-tin mt-0.5">sin ventas</p>
            </div>
          </>
        )}
      </div>

      {/* -- Contenido principal -- */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-4">

        {/* Top vendidos — 3 cols */}
        <div className="lg:col-span-3 bg-white rounded-2xl border border-tin/20 shadow-sm p-5">
          <h2 className="text-sm font-bold text-gray-800 uppercase tracking-wide mb-4">
            Top vendidos hoy
          </h2>
          {topVariantes.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-8 text-center">
              <Package size={28} className="text-tin mb-2" />
              <p className="text-sm text-tin">Sin ventas con detalle de ítems</p>
            </div>
          ) : (
            <div className="space-y-3">
              {topVariantes.map((item, i) => {
                const pct = item.max > 0 ? Math.round((item.value / item.max) * 100) : 0
                return (
                  <div key={i} className="flex items-center gap-3">
                    <span className="text-xs font-bold text-tin w-4 shrink-0">{i + 1}</span>
                    <p className="text-sm text-gray-700 w-32 sm:w-44 truncate shrink-0">{item.label}</p>
                    <div className="flex-1 bg-tin-pale rounded-full h-2 overflow-hidden">
                      <div
                        className="h-full rounded-full bg-primary transition-all duration-500"
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                    <p className="text-sm font-bold text-gray-800 w-8 text-right tabular-nums shrink-0">
                      {item.value}
                    </p>
                  </div>
                )
              })}
            </div>
          )}
        </div>

        {/* Últimas ventas — 2 cols */}
        <div className="lg:col-span-2 bg-white rounded-2xl border border-tin/20 shadow-sm overflow-hidden">
          <div className="px-5 py-4 border-b border-tin/20 flex items-center justify-between">
            <h2 className="text-sm font-bold text-gray-800 uppercase tracking-wide">Últimas ventas</h2>
            {ventasHoy.length > 5 && (
              <button
                onClick={() => navigate('/ventas')}
                className="text-xs text-primary-dark font-semibold hover:underline flex items-center gap-1"
              >
                Ver todo <ArrowRight size={11} />
              </button>
            )}
          </div>
          {ventasHoy.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-8 text-center">
              <p className="text-sm text-tin">Sin ventas hoy</p>
            </div>
          ) : (
            <div className="divide-y divide-tin/10">
              {[...ventasHoy].reverse().slice(0, 6).map(v => (
                <div key={v.id} className="flex items-center justify-between px-5 py-3.5 hover:bg-tin-pale/40 transition-colors">
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-gray-800">
                      <span className="text-tin font-mono mr-1.5">#{v.id}</span>
                      {formatHora(v.creadoEn)}
                    </p>
                    <p className="text-xs text-tin-dark mt-0.5">
                      {v.contacto?.nombre ?? 'Sin cliente'} · {v.metodoPago}
                    </p>
                  </div>
                  <p className="font-bold text-gray-800 tabular-nums shrink-0 ml-3">
                    S/ {fmt(parseFloat(v.total))}
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* -- Artículos a reabastecer -- */}
      {bajosMinimo.length > 0 && (
        <div className="bg-white rounded-2xl border border-amber-200 shadow-sm overflow-hidden">
          <div className="px-5 py-4 border-b border-amber-100 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <AlertTriangle size={15} className="text-amber-600" />
              <h2 className="text-sm font-bold text-amber-800 uppercase tracking-wide">
                Artículos a reabastecer
              </h2>
            </div>
            <button
              onClick={() => navigate('/compras')}
              className="text-xs text-amber-700 font-semibold hover:underline flex items-center gap-1"
            >
              Crear compra <ArrowRight size={11} />
            </button>
          </div>
          <div className="divide-y divide-amber-50">
            {bajosMinimo.slice(0, 8).map(s => {
              const actual  = s.cantidad
              const minimo  = s.variante?.stockMinimo ?? 0
              const deficit = minimo - actual
              return (
                <div key={s.id} className="flex items-center gap-4 px-5 py-3.5">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-gray-800 truncate">
                      {s.variante?.nombre ?? `#${s.varianteId}`}
                    </p>
                    <div className="flex items-center gap-3 mt-1">
                      <div className="flex-1 bg-amber-100 rounded-full h-1.5 overflow-hidden max-w-[120px]">
                        <div
                          className="h-full rounded-full bg-amber-400"
                          style={{ width: minimo > 0 ? `${Math.min(100, (actual / minimo) * 100)}%` : '0%' }}
                        />
                      </div>
                      <p className="text-xs text-gray-500 shrink-0">
                        {actual} / {minimo}
                      </p>
                    </div>
                  </div>
                  <span className="shrink-0 px-2.5 py-1 rounded-full bg-red-100 text-red-700 text-xs font-bold">
                    faltan {deficit}
                  </span>
                </div>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}
