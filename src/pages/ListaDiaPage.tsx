import { useState } from 'react'
import { ListOrdered, Layers, X, ChevronLeft, ChevronRight } from 'lucide-react'
import { useListaDiaCruda, useListaDia } from '../hooks/useListaDia'
import { todayLocal } from '../lib/date'
import type { FilaOrganizadaDia } from '../types'

function fechaHoy() {
  return todayLocal()
}

// ── Helpers ────────────────────────────────────────────────────
function fmt(n: number) {
  return n.toLocaleString('es-PE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
}

function fmtHora(iso: string) {
  return new Date(iso).toLocaleTimeString('es-PE', { hour: '2-digit', minute: '2-digit' })
}

// ── Skeleton para el panel organizado ─────────────────────────
// Anticipa la estructura del conteo organizado antes de que lleguen los datos.
function SkeletonOrganizado() {
  return (
    <div className="space-y-0 animate-pulse">
      {[70, 55, 80, 60, 45, 65, 72].map((w, i) => (
        <div key={i} className={`flex items-center gap-3 px-5 py-3 ${i % 2 === 0 ? 'bg-amber-50/60' : 'bg-white'}`}>
          <div className="h-3.5 bg-amber-200/70 rounded" style={{ width: `${w}%` }} />
          <div className="h-3.5 bg-amber-200/70 rounded w-8 ml-auto shrink-0" />
          <div className="h-3.5 bg-amber-200/70 rounded w-14 shrink-0" />
        </div>
      ))}
    </div>
  )
}

// ── Panel organizado (slide-over derecho) ─────────────────────
interface PanelOrganizadoProps {
  open:      boolean
  onClose:   () => void
  filas:     FilaOrganizadaDia[]
  isLoading: boolean
}

function PanelOrganizado({ open, onClose, filas, isLoading }: PanelOrganizadoProps) {
  const totalGeneral = filas.reduce((acc, f) => acc + f.totalSubtotal, 0)

  return (
    <>
      {/* Backdrop */}
      <div
        className={`fixed inset-0 bg-black/40 z-40 transition-opacity duration-200 ${
          open ? 'opacity-100' : 'opacity-0 pointer-events-none'
        }`}
        onClick={onClose}
      />

      {/* Panel */}
      <div
        className={`fixed top-0 right-0 h-full w-full sm:w-[28rem] z-50 shadow-2xl flex flex-col
          transition-transform duration-300 ease-in-out
          bg-amber-50 border-l border-amber-200
          ${open ? 'translate-x-0' : 'translate-x-full'}`}
      >
        {/* Header del panel */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-amber-200 bg-amber-100 shrink-0">
          <div className="flex items-center gap-2">
            <Layers size={17} className="text-amber-700" />
            <h2 className="font-semibold text-amber-900">Conteo organizado</h2>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg hover:bg-amber-200 transition-colors active:scale-95 duration-100"
          >
            <X size={17} className="text-amber-700" />
          </button>
        </div>

        {/* Cuerpo del panel */}
        <div className="flex-1 overflow-y-auto">
          {isLoading ? (
            <SkeletonOrganizado />
          ) : filas.length === 0 ? (
            <p className="text-sm text-amber-700 text-center py-12">Sin ventas hoy.</p>
          ) : (
            <table className="w-full text-sm">
              <thead className="bg-amber-200/80 text-amber-800 text-xs uppercase tracking-wide sticky top-0">
                <tr>
                  <th className="px-5 py-3 text-left font-semibold">Producto</th>
                  <th className="px-3 py-3 text-left font-semibold">Variante</th>
                  <th className="px-3 py-3 text-right font-semibold">Cant.</th>
                  <th className="px-5 py-3 text-right font-semibold">Total</th>
                </tr>
              </thead>
              <tbody>
                {filas.map((f, i) => (
                  <tr
                    key={f.varianteId}
                    className={`border-b border-amber-200/60 ${
                      i % 2 === 0 ? 'bg-white' : 'bg-amber-50/60'
                    }`}
                  >
                    <td className="px-5 py-2.5 font-medium text-amber-950">{f.producto}</td>
                    <td className="px-3 py-2.5 text-amber-700 text-xs">
                      {f.nombre}
                      <span className="ml-1 text-amber-500 uppercase tracking-wide">{f.unidad}</span>
                    </td>
                    <td className="px-3 py-2.5 text-right font-semibold text-amber-900 tabular-nums">
                      {f.totalCantidad}
                    </td>
                    <td className="px-5 py-2.5 text-right font-semibold text-amber-900 tabular-nums">
                      S/ {fmt(f.totalSubtotal)}
                    </td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr className="bg-amber-200/80 border-t-2 border-amber-300">
                  <td colSpan={3} className="px-5 py-3.5 font-bold text-amber-900">Total general</td>
                  <td className="px-5 py-3.5 text-right font-bold text-amber-950 tabular-nums">
                    S/ {fmt(totalGeneral)}
                  </td>
                </tr>
              </tfoot>
            </table>
          )}
        </div>
      </div>
    </>
  )
}

// ── Página principal ───────────────────────────────────────────
export default function ListaDiaPage() {
  const [fecha, setFecha] = useState(fechaHoy())
  const esHoy = fecha === fechaHoy()

  const { data: filasCrudas = [],      isLoading: loadingCruda }      = useListaDiaCruda(esHoy ? undefined : fecha)
  const { data: filasOrganizadas = [], isLoading: loadingOrganizado }  = useListaDia(esHoy ? undefined : fecha)
  const [panelOpen, setPanelOpen] = useState(false)

  const totalDia = filasCrudas.reduce((acc, f) => acc + f.subtotal, 0)

  function irDiaAnterior() {
    const d = new Date(fecha + 'T12:00:00')
    d.setDate(d.getDate() - 1)
    setFecha(d.toISOString().slice(0, 10))
  }

  function irDiaSiguiente() {
    const d = new Date(fecha + 'T12:00:00')
    d.setDate(d.getDate() + 1)
    const siguiente = d.toISOString().slice(0, 10)
    // No permitir navegar al futuro
    if (siguiente <= fechaHoy()) setFecha(siguiente)
  }

  // ── Skeleton mientras carga la lista cruda ───────────────────
  if (loadingCruda) {
    return (
      <div className="space-y-6">
        {/* Header skeleton */}
        <div className="flex items-center justify-between animate-pulse">
          <div className="space-y-2">
            <div className="h-7 w-48 bg-amber-100 rounded" />
            <div className="h-4 w-64 bg-amber-100 rounded" />
          </div>
          <div className="h-10 w-32 bg-amber-100 rounded-xl" />
        </div>
        {/* Tabla skeleton — estilo cuadrilla */}
        <div className="rounded-2xl border border-amber-200 overflow-hidden bg-amber-50">
          <div className="h-11 bg-amber-100 animate-pulse" />
          {[...Array(8)].map((_, i) => (
            <div key={i} className={`flex gap-4 px-5 py-3 animate-pulse border-b border-amber-200/50 ${i % 2 === 0 ? 'bg-white' : 'bg-amber-50'}`}>
              <div className="h-4 bg-amber-200/60 rounded w-1/3" />
              <div className="h-4 bg-amber-200/60 rounded w-1/5" />
              <div className="h-4 bg-amber-200/60 rounded w-12 ml-auto" />
              <div className="h-4 bg-amber-200/60 rounded w-16" />
            </div>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">

      {/* ── Header ── */}
      <div className="flex flex-col sm:flex-row sm:items-start gap-3">
        <div className="flex-1">
          <div className="flex items-center gap-1.5">
            <h1 className="text-2xl font-bold text-gray-800">Lista del Día</h1>
            {esHoy && (
              <span className="text-xs font-semibold bg-primary/15 text-primary-dark px-2 py-0.5 rounded-full">
                Hoy
              </span>
            )}
          </div>

          {/* Navegación de fecha */}
          <div className="flex items-center gap-1 mt-1.5">
            <button
              onClick={irDiaAnterior}
              className="p-1 rounded-lg hover:bg-amber-100 transition-colors active:scale-95 duration-100 min-h-[2rem] min-w-[2rem] flex items-center justify-center"
              title="Día anterior"
            >
              <ChevronLeft size={16} className="text-amber-700" />
            </button>
            <input
              type="date"
              value={fecha}
              max={fechaHoy()}
              onChange={e => setFecha(e.target.value)}
              className="text-sm text-amber-800 font-medium bg-transparent border-none outline-none cursor-pointer"
            />
            <button
              onClick={irDiaSiguiente}
              disabled={esHoy}
              className="p-1 rounded-lg hover:bg-amber-100 transition-colors active:scale-95 duration-100 min-h-[2rem] min-w-[2rem] flex items-center justify-center disabled:opacity-30 disabled:cursor-not-allowed"
              title="Día siguiente"
            >
              <ChevronRight size={16} className="text-amber-700" />
            </button>
            {!esHoy && (
              <button
                onClick={() => setFecha(fechaHoy())}
                className="ml-1 text-xs text-amber-700 underline hover:text-amber-900 transition-colors"
              >
                Ir a hoy
              </button>
            )}
          </div>

          <p className="text-xs text-tin mt-0.5">
            {filasCrudas.length} líneas · Total S/ {fmt(totalDia)}
            {!esHoy && <span className="ml-1 text-amber-600">(día cerrado)</span>}
          </p>
        </div>
        <button
          onClick={() => setPanelOpen(true)}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-amber-400 hover:bg-amber-500 text-amber-950 font-semibold text-sm transition-all duration-150 active:scale-95 shrink-0 min-h-[2.75rem]"
        >
          <Layers size={15} /> Organizar
        </button>
      </div>

      {/* ── Lista cruda: estilo cuadrilla / papel y lápiz ── */}
      {filasCrudas.length === 0 ? (
        <div className="bg-amber-50 rounded-2xl border border-amber-200 flex flex-col items-center py-16 text-center px-6">
          <ListOrdered size={32} className="text-amber-400 mb-3" />
          <p className="font-medium text-amber-800">Sin ventas hoy</p>
          <p className="text-sm text-amber-600 mt-1">Registrá ventas para que aparezcan aquí.</p>
        </div>
      ) : (
        <>
          {/* ── Tabla desktop: cuadrilla ── */}
          <div className="hidden sm:block rounded-2xl border border-amber-200 overflow-hidden shadow-sm">

            {/* Barra de encabezado */}
            <div className="flex items-center gap-2 px-5 py-3.5 bg-amber-100 border-b border-amber-200">
              <ListOrdered size={15} className="text-amber-700" />
              <h2 className="font-semibold text-amber-900">Lo que salió hoy</h2>
              <span className="ml-auto text-xs text-amber-600 tabular-nums">{filasCrudas.length} líneas</span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-sm">

                {/* Encabezado columnas */}
                <thead className="bg-amber-200/70 text-amber-800 text-xs uppercase tracking-wide">
                  <tr>
                    <th className="px-5 py-3 text-left font-semibold w-8 text-amber-500">#</th>
                    <th className="px-2 py-3 text-left font-semibold">Hora</th>
                    <th className="px-4 py-3 text-left font-semibold">Producto</th>
                    <th className="px-3 py-3 text-left font-semibold">Variante</th>
                    <th className="px-3 py-3 text-center font-semibold">Unidad</th>
                    <th className="px-3 py-3 text-right font-semibold">Cant.</th>
                    <th className="px-3 py-3 text-right font-semibold">P. Unit.</th>
                    <th className="px-5 py-3 text-right font-semibold">Total</th>
                  </tr>
                </thead>

                <tbody>
                  {filasCrudas.map((f, idx) => (
                    <tr
                      key={`${f.ventaId}-${f.varianteId}-${idx}`}
                      className={`border-b border-amber-200/50 transition-colors hover:bg-amber-100/50 ${
                        idx % 2 === 0 ? 'bg-white' : 'bg-amber-50/60'
                      }`}
                    >
                      {/* Número de línea — aspecto cuadrilla */}
                      <td className="px-5 py-2.5 text-xs text-amber-400 tabular-nums select-none">
                        {idx + 1}
                      </td>
                      <td className="px-2 py-2.5 text-xs text-amber-600 tabular-nums">
                        {fmtHora(f.hora)}
                      </td>
                      <td className="px-4 py-2.5 font-medium text-amber-950">{f.producto}</td>
                      <td className="px-3 py-2.5 text-amber-700 text-xs">{f.variante}</td>
                      <td className="px-3 py-2.5 text-center text-xs text-amber-600 uppercase tracking-wide">
                        {f.unidad}
                      </td>
                      <td className="px-3 py-2.5 text-right font-semibold text-amber-900 tabular-nums">
                        {f.cantidad}
                      </td>
                      <td className="px-3 py-2.5 text-right text-amber-700 tabular-nums">
                        S/ {fmt(f.precioUnitario)}
                      </td>
                      <td className="px-5 py-2.5 text-right font-semibold text-amber-950 tabular-nums">
                        S/ {fmt(f.subtotal)}
                      </td>
                    </tr>
                  ))}
                </tbody>

                {/* Total del día */}
                <tfoot>
                  <tr className="bg-amber-200/80 border-t-2 border-amber-300">
                    <td colSpan={7} className="px-5 py-3.5 text-right font-bold text-amber-900">
                      Total del día
                    </td>
                    <td className="px-5 py-3.5 text-right font-bold text-amber-950 tabular-nums text-base">
                      S/ {fmt(totalDia)}
                    </td>
                  </tr>
                </tfoot>

              </table>
            </div>
          </div>

          {/* ── Cards mobile ── */}
          <div className="sm:hidden rounded-2xl border border-amber-200 overflow-hidden shadow-sm">
            <div className="px-4 py-3 bg-amber-100 border-b border-amber-200 flex items-center justify-between">
              <span className="font-semibold text-amber-900 text-sm">Lo que salió hoy</span>
              <span className="text-xs text-amber-600 tabular-nums">{filasCrudas.length} líneas</span>
            </div>
            <div>
              {filasCrudas.map((f, idx) => (
                <div
                  key={`${f.ventaId}-${f.varianteId}-${idx}`}
                  className={`px-4 py-3 flex items-center justify-between border-b border-amber-200/50 ${
                    idx % 2 === 0 ? 'bg-white' : 'bg-amber-50/60'
                  }`}
                >
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-amber-950 truncate">{f.producto}</p>
                    <p className="text-xs text-amber-600">
                      {f.variante} · <span className="uppercase">{f.unidad}</span>
                      <span className="ml-2 text-amber-500">{fmtHora(f.hora)}</span>
                    </p>
                  </div>
                  <div className="text-right ml-3 shrink-0">
                    <p className="font-semibold text-amber-950 tabular-nums">S/ {fmt(f.subtotal)}</p>
                    <p className="text-xs text-amber-600">× {f.cantidad}</p>
                  </div>
                </div>
              ))}
            </div>
            <div className="px-4 py-3.5 flex justify-between bg-amber-200/80 border-t-2 border-amber-300">
              <span className="font-bold text-amber-900">Total del día</span>
              <span className="font-bold text-amber-950 tabular-nums">S/ {fmt(totalDia)}</span>
            </div>
          </div>
        </>
      )}

      {/* ── Panel organizado (slide-over) ── */}
      <PanelOrganizado
        open={panelOpen}
        onClose={() => setPanelOpen(false)}
        filas={filasOrganizadas}
        isLoading={loadingOrganizado}
      />

    </div>
  )
}
