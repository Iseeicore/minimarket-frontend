import { useNavigate } from 'react-router-dom'
import { BookOpen, ShoppingCart, TrendingUp, Loader2, CreditCard, Package } from 'lucide-react'
import { useVentasHoy } from '../../hooks/useVentas'
import { useOrdenesSalidaPaginado } from '../../hooks/useOrdenesSalida'
import { useCajaActiva } from '../../hooks/useCaja'
import { useAuthStore } from '../../store/auth.store'
import { todayLocal } from '../../lib/date'

function formatMoney(n: number) {
  return n.toLocaleString('es-PE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
}

export default function TiendaHomePage() {
  const navigate  = useNavigate()
  const usuario   = useAuthStore(s => s.usuario)
  const almacenId = usuario?.almacenId ?? null

  const hoy = todayLocal()

  const { data: ventasHoy = [], isLoading: loadingVentas } = useVentasHoy()
  const { data: ordenesData }  = useOrdenesSalidaPaginado({
    almacenId: almacenId ?? undefined,
    desde: hoy,
    hasta: hoy,
    limit: 50,
  })
  const { data: cajaActiva }   = useCajaActiva(almacenId)

  const ordenes       = ordenesData?.data ?? []
  const totalMonto    = ventasHoy.reduce((sum, v) => sum + parseFloat(String(v.total)), 0)
  const cantVentas    = ventasHoy.length
  const cajaAbierta   = !!cajaActiva
  const totalItemsHoy = ordenes.reduce((sum, o) => sum + o.totalUnidades, 0)

  const nombre = usuario?.nombre?.split(' ')[0] ?? 'Jefe'

  return (
    <div className="bg-gray-100 rounded-2xl border border-tin/20 p-4">
      <div className="space-y-5">

        {/* -- Saludo -- */}
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Hola, {nombre}</h1>
          <p className="text-tin mt-0.5">Como va el dia?</p>
        </div>

        {/* -- Cards resumen -- */}
        <div className="grid grid-cols-2 gap-3">

          {/* Ventas del dia */}
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

          {/* Ordenes del dia */}
          <button
            onClick={() => navigate('/tienda/ventas')}
            className="bg-white rounded-2xl border border-tin/20 shadow-sm p-4 flex items-start gap-3 text-left hover:border-primary/40 active:scale-[0.98] transition-all"
          >
            <div className="w-9 h-9 rounded-xl bg-primary/15 flex items-center justify-center shrink-0">
              <ShoppingCart size={18} className="text-primary-dark" />
            </div>
            <div className="min-w-0">
              <p className="text-xs text-tin-dark font-semibold uppercase tracking-wide">Ordenes</p>
              <p className="text-sm font-bold mt-0.5 text-slate-900">
                {ordenes.length === 0 ? 'Sin ordenes' : `${ordenes.length} ordenes`}
              </p>
              {totalItemsHoy > 0 && (
                <p className="text-xs text-tin mt-0.5">{totalItemsHoy} items</p>
              )}
            </div>
          </button>
        </div>

        {/* -- Acciones -- */}
        <div className="space-y-3">
          <button
            onClick={() => navigate('/tienda/ventas')}
            className="w-full flex items-center gap-4 p-5 bg-white rounded-2xl border border-tin/20 shadow-sm hover:border-primary/40 hover:shadow-md active:scale-[0.98] transition-all duration-150"
          >
            <div className="w-14 h-14 rounded-xl bg-primary/15 flex items-center justify-center shrink-0">
              <ShoppingCart size={28} className="text-primary-dark" />
            </div>
            <div className="text-left">
              <p className="text-lg font-bold text-slate-900">Nueva Orden</p>
              <p className="text-sm text-tin mt-0.5">Venta o transferencia de productos</p>
            </div>
          </button>

          <button
            onClick={() => navigate('/tienda/cuaderno')}
            className="w-full flex items-center gap-4 p-5 bg-white rounded-2xl border border-tin/20 shadow-sm hover:border-primary/40 hover:shadow-md active:scale-[0.98] transition-all duration-150"
          >
            <div className="w-14 h-14 rounded-xl bg-accent/20 flex items-center justify-center shrink-0">
              <BookOpen size={28} className="text-accent-dark" />
            </div>
            <div className="text-left">
              <p className="text-lg font-bold text-slate-900">Cuaderno</p>
              <p className="text-sm text-tin mt-0.5">Registro de movimientos del dia</p>
            </div>
          </button>

          <button
            onClick={() => navigate('/tienda/stock')}
            className="w-full flex items-center gap-4 p-5 bg-white rounded-2xl border border-tin/20 shadow-sm hover:border-primary/40 hover:shadow-md active:scale-[0.98] transition-all duration-150"
          >
            <div className="w-14 h-14 rounded-xl bg-accent/20 flex items-center justify-center shrink-0">
              <Package size={28} className="text-accent-dark" />
            </div>
            <div className="text-left">
              <p className="text-lg font-bold text-slate-900">Ver Stock</p>
              <p className="text-sm text-tin mt-0.5">Almacen y tienda</p>
            </div>
          </button>
        </div>

      </div>
    </div>
  )
}
