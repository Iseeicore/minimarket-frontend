import { Loader2, ClipboardList, CheckCircle2, AlertCircle } from 'lucide-react'
import { useRegistrosTiendaPaginado } from '../../hooks/useRegistrosTienda'
import { useRegistrosAlmacenPaginado, usePendientesTienda } from '../../hooks/useRegistrosAlmacen'
import { PanelPendientes } from '../../components/shared/PanelPendientes'
import { useAuthStore } from '../../store/auth.store'

// ── Helpers ────────────────────────────────────────────────────
function getLocalISO(date: Date = new Date()): string {
  const y = date.getFullYear()
  const m = String(date.getMonth() + 1).padStart(2, '0')
  const d = String(date.getDate()).padStart(2, '0')
  return `${y}-${m}-${d}`
}

// ── Tipos locales ──────────────────────────────────────────────
interface FilaComparativa {
  varianteId:   number
  nombre:       string
  sku:          string | null
  cantTienda:   number   // suma registros tienda hoy (SALIDA)
  cantAlmacen:  number   // suma registros almacen hoy (SALIDA)
  diferencia:   number   // tienda - almacen
}

// ── Página ────────────────────────────────────────────────────
export default function TiendaListaDiaPage() {
  const almacenId = useAuthStore(s => s.usuario?.almacenId ?? null)
  const hoy = getLocalISO()

  const { data: regTiendaData, isLoading: loadT }  = useRegistrosTiendaPaginado({
    almacenId: almacenId ?? undefined, desde: hoy, hasta: hoy, limit: 200,
  })
  const { data: regAlmacenData, isLoading: loadA }  = useRegistrosAlmacenPaginado({
    almacenId: almacenId ?? undefined, desde: hoy, hasta: hoy, limit: 200,
  })
  const { data: pendientes = [] } = usePendientesTienda(almacenId)

  const regTienda  = regTiendaData?.data ?? []
  const regAlmacen = regAlmacenData?.data ?? []
  const isLoading  = loadT || loadA

  // Filtrar solo SALIDA — ya vienen filtrados por fecha del server
  const tiendaHoy  = regTienda.filter(r  => r.tipo === 'SALIDA')
  const almacenHoy = regAlmacen.filter(r => r.tipo === 'SALIDA')

  // Construir mapa: varianteId → { nombre, sku, cantTienda, cantAlmacen }
  const mapaVariantes = new Map<number, FilaComparativa>()

  for (const r of tiendaHoy) {
    const id = r.varianteId
    if (!mapaVariantes.has(id)) {
      mapaVariantes.set(id, {
        varianteId:  id,
        nombre:      r.variante?.nombre ?? `Variante #${id}`,
        sku:         r.variante?.sku ?? null,
        cantTienda:  0,
        cantAlmacen: 0,
        diferencia:  0,
      })
    }
    mapaVariantes.get(id)!.cantTienda += r.cantidad
  }

  for (const r of almacenHoy) {
    const id = r.varianteId
    if (!mapaVariantes.has(id)) {
      mapaVariantes.set(id, {
        varianteId:  id,
        nombre:      r.variante?.nombre ?? `Variante #${id}`,
        sku:         r.variante?.sku ?? null,
        cantTienda:  0,
        cantAlmacen: 0,
        diferencia:  0,
      })
    }
    mapaVariantes.get(id)!.cantAlmacen += r.cantidad
  }

  // Calcular diferencia y ordenar: con diferencia primero
  const filas: FilaComparativa[] = Array.from(mapaVariantes.values())
    .map(f => ({ ...f, diferencia: f.cantTienda - f.cantAlmacen }))
    .sort((a, b) => Math.abs(b.diferencia) - Math.abs(a.diferencia))

  const conDiferencia = filas.filter(f => f.diferencia !== 0)
  const coinciden     = filas.filter(f => f.diferencia === 0)

  const hoyLabel = new Date().toLocaleDateString('es-PE', {
    weekday: 'long', day: '2-digit', month: 'long',
  })

  if (isLoading) {
    return (
      <div className="flex justify-center items-center py-24">
        <Loader2 size={32} className="animate-spin text-tin" />
      </div>
    )
  }

  return (
    <div className="space-y-5 pt-2">

      {/* ── Header ── */}
      <div>
        <div className="flex items-center gap-2 mb-0.5">
          <ClipboardList size={20} className="text-tin-dark" />
          <h1 className="text-2xl font-bold text-slate-900">Lista del día</h1>
        </div>
        <p className="text-sm text-tin capitalize">{hoyLabel}</p>
      </div>

      {/* ── Pendientes del almacén ── */}
      <PanelPendientes items={pendientes} />

      {/* ── Resumen ── */}
      <div className="grid grid-cols-2 gap-3">
        <div className="bg-white rounded-2xl border border-tin/20 shadow-sm p-4 text-center">
          <p className="text-xs text-gray-400 uppercase tracking-wide">Ítems hoy</p>
          <p className="text-2xl font-bold text-slate-800 mt-1">{filas.length}</p>
        </div>
        <div className={`rounded-2xl border shadow-sm p-4 text-center ${
          conDiferencia.length > 0
            ? 'bg-amber-50 border-amber-200'
            : 'bg-green-50 border-green-200'
        }`}>
          <p className="text-xs text-gray-400 uppercase tracking-wide">Diferencias</p>
          <p className={`text-2xl font-bold mt-1 ${
            conDiferencia.length > 0 ? 'text-amber-600' : 'text-green-600'
          }`}>
            {conDiferencia.length}
          </p>
        </div>
      </div>

      {filas.length === 0 ? (
        <div className="bg-white rounded-2xl border border-tin/20 p-8 text-center">
          <ClipboardList size={36} className="mx-auto text-tin mb-3" />
          <p className="font-semibold text-slate-700">Sin movimientos hoy</p>
          <p className="text-sm text-tin mt-1">
            Anotá algo en tu cuaderno para que aparezca acá
          </p>
        </div>
      ) : (
        <>
          {/* ── Cabecera de columnas ── */}
          <div className="grid grid-cols-3 gap-2 px-1">
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Producto</p>
            <p className="text-xs font-semibold text-center text-primary-dark uppercase tracking-wide">Tienda</p>
            <p className="text-xs font-semibold text-center text-tin-dark uppercase tracking-wide">Almacén</p>
          </div>

          {/* ── Ítems con diferencia ── */}
          {conDiferencia.length > 0 && (
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <AlertCircle size={14} className="text-amber-500" />
                <p className="text-xs font-bold text-amber-700 uppercase tracking-wide">
                  Con diferencia ({conDiferencia.length})
                </p>
              </div>
              {conDiferencia.map(f => (
                <div
                  key={f.varianteId}
                  className="bg-amber-50 border border-amber-200 rounded-2xl p-4 grid grid-cols-3 gap-2 items-center"
                >
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-slate-800 truncate">{f.nombre}</p>
                    {f.sku && <p className="text-xs text-tin">{f.sku}</p>}
                  </div>
                  <div className="text-center">
                    <p className="text-xl font-bold text-primary-dark">{f.cantTienda}</p>
                    <p className="text-xs text-tin">mío</p>
                  </div>
                  <div className="text-center relative">
                    <p className="text-xl font-bold text-tin-dark">{f.cantAlmacen}</p>
                    <p className="text-xs text-tin">almacén</p>
                    <span className={`absolute -top-1 -right-1 text-[10px] font-bold px-1 rounded-full ${
                      f.diferencia > 0
                        ? 'bg-green-100 text-green-700'
                        : 'bg-red-100 text-red-700'
                    }`}>
                      {f.diferencia > 0 ? `+${f.diferencia}` : f.diferencia}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* ── Ítems que coinciden ── */}
          {coinciden.length > 0 && (
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <CheckCircle2 size={14} className="text-green-500" />
                <p className="text-xs font-bold text-green-700 uppercase tracking-wide">
                  Coinciden ({coinciden.length})
                </p>
              </div>
              {coinciden.map(f => (
                <div
                  key={f.varianteId}
                  className="bg-white border border-tin/20 rounded-2xl p-4 grid grid-cols-3 gap-2 items-center"
                >
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-slate-800 truncate">{f.nombre}</p>
                    {f.sku && <p className="text-xs text-tin">{f.sku}</p>}
                  </div>
                  <div className="text-center">
                    <p className="text-xl font-bold text-primary-dark">{f.cantTienda}</p>
                    <p className="text-xs text-tin">mío</p>
                  </div>
                  <div className="text-center">
                    <p className="text-xl font-bold text-tin-dark">{f.cantAlmacen}</p>
                    <p className="text-xs text-tin">almacén</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  )
}
