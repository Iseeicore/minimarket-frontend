import { useNavigate } from 'react-router-dom'
import { BookOpen, GitCompare, TrendingUp, Loader2, CreditCard, ClipboardList } from 'lucide-react'
import { useVentasHoy } from '../../hooks/useVentas'
import { useSincronizaciones } from '../../hooks/useSincronizacion'
import { useCajaActiva } from '../../hooks/useCaja'
import { useAuthStore } from '../../store/auth.store'

function formatMoney(n: number) {
  return n.toLocaleString('es-PE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
}

export default function TiendaHomePage() {
  const navigate  = useNavigate()
  const usuario   = useAuthStore(s => s.usuario)
  const almacenId = usuario?.almacenId ?? null

  const { data: ventasHoy = [], isLoading: loadingVentas } = useVentasHoy()
  const { data: sincs    = [] }                            = useSincronizaciones()
  const { data: cajaActiva }                               = useCajaActiva(almacenId)

  const totalMonto = ventasHoy.reduce((sum, v) => sum + parseFloat(String(v.total)), 0)
  const cantVentas = ventasHoy.length
  const cajaAbierta = !!cajaActiva

  const ultimaSync       = sincs[0] ?? null
  const haySincPendiente = ultimaSync?.estado === 'CON_DIFERENCIAS' || ultimaSync?.estado === 'PENDIENTE'

  const nombre = usuario?.nombre?.split(' ')[0] ?? 'Jefe'

  return (
    <div className="space-y-6 pt-2">

      {/* ── Saludo ── */}
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Hola, {nombre}</h1>
        <p className="text-tin mt-0.5">¿Qué pasó hoy?</p>
      </div>

      {/* ── Cards resumen ── */}
      <div className="grid grid-cols-2 gap-3">

        {/* Ventas del día */}
        <div className="col-span-2 bg-white rounded-2xl border border-tin/20 shadow-sm p-5">
          <div className="flex items-center gap-2 mb-3">
            <TrendingUp size={17} className="text-primary-dark" />
            <p className="text-xs font-semibold text-tin-dark uppercase tracking-wide">Ventas de hoy</p>
          </div>
          {loadingVentas ? (
            <Loader2 size={26} className="animate-spin text-tin" />
          ) : (
            <>
              <p className="text-4xl font-bold text-slate-900 tabular-nums leading-none">
                S/ {formatMoney(totalMonto)}
              </p>
              <p className="text-sm text-tin mt-2">
                {cantVentas === 0
                  ? 'Sin ventas registradas hoy'
                  : `${cantVentas} ${cantVentas === 1 ? 'venta' : 'ventas'} registradas`}
              </p>
            </>
          )}
        </div>

        {/* Estado de caja */}
        <div className={`bg-white rounded-2xl border shadow-sm p-4 flex items-start gap-3 ${
          cajaAbierta ? 'border-green-200' : 'border-tin/20'
        }`}>
          <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${
            cajaAbierta ? 'bg-green-100' : 'bg-tin-pale'
          }`}>
            <CreditCard size={18} className={cajaAbierta ? 'text-green-600' : 'text-tin'} />
          </div>
          <div className="min-w-0">
            <p className="text-xs text-tin-dark font-semibold uppercase tracking-wide">Caja</p>
            <p className={`text-sm font-bold mt-0.5 ${cajaAbierta ? 'text-green-700' : 'text-gray-500'}`}>
              {cajaAbierta ? 'Abierta' : 'Cerrada'}
            </p>
            {cajaActiva && (
              <p className="text-xs text-tin mt-0.5">
                Apertura: S/ {parseFloat(cajaActiva.montoApertura).toFixed(2)}
              </p>
            )}
          </div>
        </div>

        {/* Sincronización pendiente o estado */}
        <button
          onClick={() => navigate('/tienda/sincronizacion')}
          className={`bg-white rounded-2xl border shadow-sm p-4 flex items-start gap-3 text-left hover:border-primary/40 active:scale-[0.98] transition-all ${
            haySincPendiente ? 'border-amber-200' : 'border-tin/20'
          }`}
        >
          <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${
            haySincPendiente ? 'bg-amber-100' : 'bg-tin-pale'
          }`}>
            <GitCompare size={18} className={haySincPendiente ? 'text-amber-600' : 'text-tin'} />
            {haySincPendiente && (
              <span className="absolute w-2 h-2 rounded-full bg-amber-400 top-0 right-0 animate-pulse" />
            )}
          </div>
          <div className="min-w-0">
            <p className="text-xs text-tin-dark font-semibold uppercase tracking-wide">Sync</p>
            <p className={`text-sm font-bold mt-0.5 ${haySincPendiente ? 'text-amber-700' : 'text-gray-500'}`}>
              {haySincPendiente ? 'Pendiente' : (ultimaSync ? 'Al día' : 'Sin syncs')}
            </p>
          </div>
        </button>
      </div>

      {/* ── Banner alerta sync ── */}
      {haySincPendiente && (
        <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 flex items-start gap-3">
          <span className="w-3 h-3 rounded-full bg-amber-400 shrink-0 mt-0.5 animate-pulse" />
          <div>
            <p className="font-bold text-amber-800 text-sm">
              {ultimaSync?.estado === 'CON_DIFERENCIAS'
                ? 'Hay diferencias sin resolver'
                : 'Sincronización pendiente'}
            </p>
            <p className="text-xs text-amber-700 mt-0.5">
              Revisá la sincronización para ver los detalles.
            </p>
          </div>
        </div>
      )}

      {/* ── Acciones ── */}
      <div className="space-y-3">
        <button
          onClick={() => navigate('/tienda/cuaderno')}
          className="w-full flex items-center gap-4 p-5 bg-white rounded-2xl border border-tin/20 shadow-sm hover:border-primary/40 hover:shadow-md active:scale-[0.98] transition-all duration-150"
        >
          <div className="w-14 h-14 rounded-xl bg-primary/15 flex items-center justify-center shrink-0">
            <BookOpen size={28} className="text-primary-dark" />
          </div>
          <div className="text-left">
            <p className="text-lg font-bold text-slate-900">Anotar en mi cuaderno</p>
            <p className="text-sm text-tin mt-0.5">Registrá un movimiento del día</p>
          </div>
        </button>

        <button
          onClick={() => navigate('/tienda/lista-dia')}
          className="w-full flex items-center gap-4 p-5 bg-white rounded-2xl border border-tin/20 shadow-sm hover:border-primary/40 hover:shadow-md active:scale-[0.98] transition-all duration-150"
        >
          <div className="w-14 h-14 rounded-xl bg-accent/20 flex items-center justify-center shrink-0">
            <ClipboardList size={28} className="text-accent-dark" />
          </div>
          <div className="text-left">
            <p className="text-lg font-bold text-slate-900">Lista del día</p>
            <p className="text-sm text-tin mt-0.5">Compará tu cuaderno con el del almacén</p>
          </div>
        </button>

        <button
          onClick={() => navigate('/tienda/sincronizacion')}
          className="w-full flex items-center gap-4 p-5 bg-white rounded-2xl border border-tin/20 shadow-sm hover:border-primary/40 hover:shadow-md active:scale-[0.98] transition-all duration-150"
        >
          <div className={`w-14 h-14 rounded-xl flex items-center justify-center shrink-0 ${
            haySincPendiente ? 'bg-amber-100' : 'bg-accent/20'
          }`}>
            <GitCompare size={28} className={haySincPendiente ? 'text-amber-600' : 'text-accent-dark'} />
          </div>
          <div className="text-left flex-1">
            <p className="text-lg font-bold text-slate-900">Ver sincronización</p>
            <p className="text-sm text-tin mt-0.5">Comparar cuadernos almacén y tienda</p>
          </div>
          {haySincPendiente && (
            <span className="w-3 h-3 rounded-full bg-amber-400 animate-pulse shrink-0" />
          )}
        </button>
      </div>
    </div>
  )
}
