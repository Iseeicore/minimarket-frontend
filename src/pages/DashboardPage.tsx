import { useMemo } from 'react'
import {
  ShoppingCart, TrendingUp, AlertTriangle, Wallet,
  BarChart3, Loader2, CheckCircle2, XCircle
} from 'lucide-react'
import { useVentasHoy } from '../hooks/useVentas'
import { useStockByAlmacen } from '../hooks/useStock'
import { useCajaActiva } from '../hooks/useCaja'
import { useAuthStore } from '../store/auth.store'

// ── Helpers ────────────────────────────────────────────────────
function fmt(n: number) {
  return n.toLocaleString('es-PE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
}

function formatHora(iso: string) {
  return new Date(iso).toLocaleTimeString('es-PE', { hour: '2-digit', minute: '2-digit' })
}

// ── Stat Card ──────────────────────────────────────────────────
interface StatCardProps {
  label: string
  value: string
  sub?: string
  icon: React.ReactNode
  accent?: string
}

function StatCard({ label, value, sub, icon, accent = 'bg-tin-pale' }: StatCardProps) {
  return (
    <div className="bg-white rounded-2xl border border-tin/20 shadow-sm p-5 flex items-start gap-4">
      <div className={`w-11 h-11 rounded-xl ${accent} flex items-center justify-center shrink-0`}>
        {icon}
      </div>
      <div>
        <p className="text-xs text-tin-dark font-medium">{label}</p>
        <p className="text-2xl font-bold text-gray-900 leading-tight tabular-nums">{value}</p>
        {sub && <p className="text-xs text-tin mt-0.5">{sub}</p>}
      </div>
    </div>
  )
}

// ── Barra CSS (sin recharts) ───────────────────────────────────
interface BarChartProps {
  items: Array<{ label: string; value: number; max: number }>
  colorClass: string
}

function BarChart({ items, colorClass }: BarChartProps) {
  return (
    <div className="space-y-2">
      {items.map((item, i) => {
        const pct = item.max > 0 ? Math.round((item.value / item.max) * 100) : 0
        return (
          <div key={i} className="flex items-center gap-3">
            <p className="text-xs text-tin-dark w-28 sm:w-36 truncate shrink-0">{item.label}</p>
            <div className="flex-1 bg-tin-pale rounded-full h-2 overflow-hidden">
              <div
                className={`h-full rounded-full transition-all duration-500 ${colorClass}`}
                style={{ width: `${pct}%` }}
              />
            </div>
            <p className="text-xs font-semibold text-gray-700 w-12 text-right tabular-nums shrink-0">
              {item.value}
            </p>
          </div>
        )
      })}
    </div>
  )
}

// ── Dashboard ──────────────────────────────────────────────────
export default function DashboardPage() {
  const { usuario } = useAuthStore()
  const almacenId   = usuario?.almacenId ?? null

  // ── Queries ──────────────────────────────────────────────────
  const { data: ventasHoy  = [], isLoading: loadingVentas } = useVentasHoy()
  const { data: stockItems = [], isLoading: loadingStock  } = useStockByAlmacen(almacenId)
  const { data: caja,            isLoading: loadingCaja   } = useCajaActiva(almacenId)

  // ── Derivados ─────────────────────────────────────────────────
  const totalHoy   = ventasHoy.reduce((acc, v) => acc + parseFloat(v.total), 0)
  const txnsHoy    = ventasHoy.length

  // Stock bajo mínimo
  const bajosMinimo = stockItems.filter(s => s.cantidad < (s.variante?.stockMinimo ?? 0))

  // Valor total del inventario
  // precioVenta viene como string Decimal del backend → parseFloat
  const valorInventario = stockItems.reduce(
    (acc, s) => acc + s.cantidad * parseFloat(s.variante?.precioVenta ?? '0'), 0
  )

  // Top 5 variantes más vendidas hoy (usando items de las ventas)
  const topVariantes: Array<{ label: string; value: number; max: number }> = useMemo(() => {
    const mapa = new Map<number, { nombre: string; cant: number }>()
    for (const v of ventasHoy) {
      if (!v.items) continue
      for (const item of v.items) {
        const nombre = item.variante?.nombre ?? `#${item.varianteId}`
        const prev   = mapa.get(item.varianteId)
        mapa.set(item.varianteId, {
          nombre,
          cant: (prev?.cant ?? 0) + item.cantidad,
        })
      }
    }
    const lista = Array.from(mapa.values())
      .sort((a, b) => b.cant - a.cant)
      .slice(0, 5)
    const maxCant = lista[0]?.cant ?? 1
    return lista.map(l => ({ label: l.nombre, value: l.cant, max: maxCant }))
  }, [ventasHoy])

  // Desglose por método de pago del día
  const metodoPagoResumen = useMemo(() => {
    const mapa: Record<string, number> = {}
    for (const v of ventasHoy) {
      mapa[v.metodoPago] = (mapa[v.metodoPago] ?? 0) + parseFloat(v.total)
    }
    return Object.entries(mapa).sort((a, b) => b[1] - a[1])
  }, [ventasHoy])

  const isLoading = loadingVentas || loadingStock || loadingCaja

  if (isLoading) {
    return (
      <div className="flex justify-center items-center py-24">
        <Loader2 size={32} className="animate-spin text-tin" />
      </div>
    )
  }

  return (
    <div className="space-y-6">

      {/* ── Header ── */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Dashboard</h1>
          <p className="text-sm text-tin-dark mt-0.5">
            {new Date().toLocaleDateString('es-PE', { weekday: 'long', day: '2-digit', month: 'long' })}
          </p>
        </div>
        {/* Estado de caja */}
        <div className={`flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-semibold border ${
          caja
            ? 'bg-primary-pale text-primary-dark border-primary/30'
            : 'bg-tin-pale text-tin-dark border-tin/30'
        }`}>
          <span className={`w-2 h-2 rounded-full ${caja ? 'bg-primary animate-pulse' : 'bg-tin'}`} />
          {caja ? 'Caja abierta' : 'Caja cerrada'}
        </div>
      </div>

      {/* ── Alertas urgentes ── */}
      {bajosMinimo.length > 0 && (
        <div className="flex items-start gap-3 p-4 rounded-2xl bg-amber-50 border border-amber-200">
          <AlertTriangle size={18} className="text-amber-600 mt-0.5 shrink-0" />
          <div>
            <p className="text-sm font-semibold text-amber-800">
              {bajosMinimo.length} {bajosMinimo.length === 1 ? 'variante' : 'variantes'} con stock bajo mínimo
            </p>
            <p className="text-xs text-amber-700 mt-0.5">
              {bajosMinimo.slice(0, 3).map(s => s.variante?.nombre).join(', ')}
              {bajosMinimo.length > 3 ? ` y ${bajosMinimo.length - 3} más` : ''}
            </p>
          </div>
        </div>
      )}

      {/* ── Stats cards ── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        <StatCard
          label="Ventas del día"
          value={`S/ ${fmt(totalHoy)}`}
          sub={`${txnsHoy} transacciones`}
          icon={<TrendingUp size={20} className="text-primary-dark" />}
          accent="bg-primary/15"
        />
        <StatCard
          label="Valor del inventario"
          value={`S/ ${fmt(valorInventario)}`}
          sub={`${stockItems.length} variantes en stock`}
          icon={<BarChart3 size={20} className="text-accent-dark" />}
          accent="bg-accent/20"
        />
        <StatCard
          label="Stock bajo mínimo"
          value={String(bajosMinimo.length)}
          sub={bajosMinimo.length === 0 ? 'Todo en orden' : 'Requiere reabastecimiento'}
          icon={<AlertTriangle size={20} className={bajosMinimo.length > 0 ? 'text-amber-500' : 'text-primary-dark'} />}
          accent={bajosMinimo.length > 0 ? 'bg-amber-50' : 'bg-primary/15'}
        />
        <StatCard
          label="Caja"
          value={caja ? `S/ ${fmt(parseFloat(caja.montoApertura))}` : 'Cerrada'}
          sub={caja ? 'Monto de apertura' : 'Sin ventas activas'}
          icon={caja
            ? <CheckCircle2 size={20} className="text-primary-dark" />
            : <XCircle size={20} className="text-tin" />
          }
          accent={caja ? 'bg-primary/15' : 'bg-tin-pale'}
        />
      </div>

      {/* ── Fila inferior ── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">

        {/* Top variantes vendidas hoy */}
        <div className="bg-white rounded-2xl border border-tin/20 shadow-sm p-5">
          <h2 className="font-semibold text-gray-800 mb-4 flex items-center gap-2">
            <ShoppingCart size={16} className="text-tin-dark" /> Top vendidos hoy
          </h2>
          {topVariantes.length === 0 ? (
            <p className="text-sm text-tin text-center py-6">Sin ventas con detalle de ítems</p>
          ) : (
            <BarChart items={topVariantes} colorClass="bg-primary" />
          )}
        </div>

        {/* Desglose por método de pago */}
        <div className="bg-white rounded-2xl border border-tin/20 shadow-sm p-5">
          <h2 className="font-semibold text-gray-800 mb-4 flex items-center gap-2">
            <Wallet size={16} className="text-tin-dark" /> Recaudado por método
          </h2>
          {metodoPagoResumen.length === 0 ? (
            <p className="text-sm text-tin text-center py-6">Sin ventas hoy</p>
          ) : (
            <div className="space-y-3">
              {metodoPagoResumen.map(([metodo, total]) => (
                <div key={metodo} className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-primary" />
                    <span className="text-sm text-gray-700">{metodo}</span>
                  </div>
                  <span className="font-semibold text-gray-800 tabular-nums">S/ {fmt(total)}</span>
                </div>
              ))}
              <div className="border-t border-tin/20 pt-2 flex justify-between">
                <span className="text-sm font-semibold text-gray-800">Total</span>
                <span className="font-bold text-gray-900 tabular-nums">S/ {fmt(totalHoy)}</span>
              </div>
            </div>
          )}
        </div>

        {/* Últimas ventas del día */}
        <div className="bg-white rounded-2xl border border-tin/20 shadow-sm overflow-hidden lg:col-span-2">
          <div className="px-5 py-4 border-b border-tin/20">
            <h2 className="font-semibold text-gray-800">Últimas ventas del día</h2>
          </div>
          {ventasHoy.length === 0 ? (
            <p className="text-sm text-tin text-center py-8">Sin ventas hoy</p>
          ) : (
            <>
              {/* Tabla desktop */}
              <div className="hidden sm:block overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-tin-pale text-tin-dark text-xs uppercase tracking-wide">
                    <tr>
                      <th className="px-5 py-3 text-left font-medium">#</th>
                      <th className="px-5 py-3 text-left font-medium">Hora</th>
                      <th className="px-5 py-3 text-left font-medium">Cliente</th>
                      <th className="px-5 py-3 text-left font-medium">Método</th>
                      <th className="px-5 py-3 text-right font-medium">Total</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-tin/10">
                    {[...ventasHoy].reverse().slice(0, 8).map(v => (
                      <tr key={v.id} className="hover:bg-tin-pale/50 transition-colors">
                        <td className="px-5 py-3 text-tin-dark font-mono">#{v.id}</td>
                        <td className="px-5 py-3 text-gray-600">{formatHora(v.creadoEn)}</td>
                        <td className="px-5 py-3 text-gray-700">{v.contacto?.nombre ?? '—'}</td>
                        <td className="px-5 py-3 text-gray-700">{v.metodoPago}</td>
                        <td className="px-5 py-3 text-right font-semibold text-gray-800">
                          S/ {fmt(parseFloat(v.total))}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              {/* Cards mobile */}
              <div className="sm:hidden divide-y divide-tin/10">
                {[...ventasHoy].reverse().slice(0, 5).map(v => (
                  <div key={v.id} className="px-4 py-3 flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-800">#{v.id} · {formatHora(v.creadoEn)}</p>
                      <p className="text-xs text-tin-dark">{v.metodoPago}</p>
                    </div>
                    <p className="font-semibold text-gray-800">S/ {fmt(parseFloat(v.total))}</p>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>

        {/* Stock bajo mínimo — widget */}
        {bajosMinimo.length > 0 && (
          <div className="bg-white rounded-2xl border border-amber-200 shadow-sm overflow-hidden lg:col-span-2">
            <div className="px-5 py-4 border-b border-amber-200 flex items-center gap-2">
              <AlertTriangle size={15} className="text-amber-600" />
              <h2 className="font-semibold text-amber-800">Artículos a reabastecer</h2>
            </div>
            <div className="p-5">
              <BarChart
                items={bajosMinimo.slice(0, 8).map(s => ({
                  label: s.variante?.nombre ?? `#${s.varianteId}`,
                  value: s.cantidad,
                  max:   s.variante?.stockMinimo ?? 1,
                }))}
                colorClass="bg-amber-400"
              />
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
