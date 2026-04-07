import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  ChevronLeft, ChevronRight, Printer, X, Loader2, Receipt,
} from 'lucide-react'
import { useAuthStore } from '../../store/auth.store'
import { usePrinterStore } from '../../store/printer.store'
import { useOrdenesSalidaPaginado } from '../../hooks/useOrdenesSalida'
import type { OrdenSalida } from '../../types'

// ── Helpers ────────────────────────────────────────────────────────────────────

function getLocalISO(date: Date = new Date()): string {
  const y = date.getFullYear()
  const m = String(date.getMonth() + 1).padStart(2, '0')
  const d = String(date.getDate()).padStart(2, '0')
  return `${y}-${m}-${d}`
}

const TODAY_ISO = getLocalISO()

function shiftDay(iso: string, delta: number): string {
  const d = new Date(iso + 'T00:00:00')
  d.setDate(d.getDate() + delta)
  return getLocalISO(d)
}

function formatFechaCorta(iso: string) {
  return new Date(iso + 'T00:00:00').toLocaleDateString('es-PE', {
    weekday: 'short', day: 'numeric', month: 'short',
  })
}

function formatHora(iso: string) {
  return new Date(iso).toLocaleTimeString('es-PE', { hour: '2-digit', minute: '2-digit' })
}

function formatFecha(iso: string) {
  return new Date(iso).toLocaleDateString('es-PE', {
    day: '2-digit', month: '2-digit', year: 'numeric',
  })
}

function truncNombre(nombre: string, max = 13) {
  return nombre.length > max ? nombre.slice(0, max) + '.' : nombre
}

// ── Ticket visual ──────────────────────────────────────────────────────────────

function TicketOrden({ orden, solicitante }: { orden: OrdenSalida; solicitante?: string }) {
  const totalMonto = orden.detalles.reduce((sum, d) => {
    const precio = parseFloat(d.variante?.precioVenta ?? '0')
    return sum + precio * d.cantidad
  }, 0)

  return (
    <div className="bg-white rounded-2xl border-2 border-dashed border-slate-300 px-4 py-5 font-mono text-xs space-y-2">
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

      <div className="space-y-0.5 text-tin-dark">
        <p>Fecha: {formatFecha(orden.creadoEn)}  Hora: {formatHora(orden.creadoEn)}</p>
        <p>Solicito: {orden.solicitante?.nombre ?? solicitante ?? '—'}</p>
      </div>

      <div className="border-t border-dashed border-slate-300" />

      <div className="grid grid-cols-[2.2rem_3rem_1fr_3.5rem] gap-x-1 text-tin-dark font-bold">
        <span>CAN</span>
        <span>P/U</span>
        <span>DESCRIP.</span>
        <span className="text-right">TOTAL</span>
      </div>

      <div className="border-t border-dashed border-slate-300" />

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
              {i < orden.detalles.length - 1 && (
                <div className="h-7 border-b border-dotted border-slate-200" />
              )}
            </div>
          )
        })}
      </div>

      <div className="border-t border-dashed border-slate-300 mt-2" />

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

// ── Página principal ───────────────────────────────────────────────────────────

export default function TiendaTicketsPage() {
  const navigate  = useNavigate()
  const usuario   = useAuthStore(s => s.usuario)
  const almacenId = usuario?.almacenId ?? null
  const printer   = usePrinterStore()

  const [fecha, setFecha]   = useState(TODAY_ISO)
  const [pagina, setPagina] = useState(1)

  const isHoy    = fecha === TODAY_ISO
  const esFuturo = fecha > TODAY_ISO

  function cambiarDia(delta: number) {
    const nueva = shiftDay(fecha, delta)
    if (nueva > TODAY_ISO) return
    setFecha(nueva)
    setPagina(1)
  }

  const { data: ordenesData, isLoading } = useOrdenesSalidaPaginado({
    almacenId: almacenId ?? undefined,
    desde: fecha,
    hasta: fecha,
    page: pagina,
    limit: 10,
  })

  const ordenes    = ordenesData?.data ?? []
  const meta       = ordenesData?.meta
  const totalPages = meta?.totalPages ?? 1
  const totalOrdenes = meta?.total ?? ordenes.length

  const [ordenModal, setOrdenModal] = useState<OrdenSalida | null>(null)

  async function handlePrint(orden: OrdenSalida) {
    try { await printer.printOrden(orden) } catch { /* notificado por store */ }
  }

  return (
    <div
      className="flex flex-col gap-3 pt-2"
      style={{ height: 'calc(100dvh - 11.5rem)' }}
    >
      {/* ── Header ── */}
      <div className="flex items-center gap-3 shrink-0">
        <button
          onClick={() => navigate('/tienda/ventas')}
          className="flex items-center justify-center w-10 h-10 rounded-xl bg-white border border-tin/20 shadow-sm hover:bg-tin-pale active:scale-95 transition-all"
        >
          <ChevronLeft size={20} className="text-slate-700" />
        </button>
        <div className="flex-1">
          <h1 className="text-2xl font-bold text-slate-900">Tickets</h1>
          <p className="text-sm text-tin mt-0.5">
            {totalOrdenes} {totalOrdenes === 1 ? 'orden' : 'ordenes'}
          </p>
        </div>
      </div>

      {/* ── Filtro de fecha ← día → ── */}
      <div className="shrink-0 flex items-center justify-between bg-white border border-tin/20 rounded-2xl shadow-sm px-2 py-1.5">
        <button
          onClick={() => cambiarDia(-1)}
          className="w-10 h-10 rounded-xl flex items-center justify-center hover:bg-tin-pale active:scale-95 transition-all"
        >
          <ChevronLeft size={20} className="text-slate-700" />
        </button>

        <div className="text-center flex-1">
          <p className="text-sm font-bold text-slate-900 capitalize">
            {formatFechaCorta(fecha)}
          </p>
          {isHoy && (
            <span className="text-[10px] font-black text-primary-dark uppercase">Hoy</span>
          )}
        </div>

        <button
          onClick={() => cambiarDia(1)}
          disabled={esFuturo || isHoy}
          className="w-10 h-10 rounded-xl flex items-center justify-center hover:bg-tin-pale active:scale-95 transition-all disabled:opacity-30 disabled:cursor-not-allowed"
        >
          <ChevronRight size={20} className="text-slate-700" />
        </button>
      </div>

      {/* ── Lista de órdenes ── */}
      <div className="flex-1 min-h-0 overflow-y-auto">
        {isLoading && ordenes.length === 0 ? (
          <div className="flex justify-center items-center py-16">
            <Loader2 size={28} className="animate-spin text-tin" />
          </div>
        ) : ordenes.length === 0 ? (
          <div className="bg-white rounded-2xl border border-tin/20 p-8 text-center">
            <Receipt size={36} className="mx-auto text-tin mb-3" />
            <p className="font-semibold text-slate-700">
              {isHoy ? 'Sin órdenes hoy' : 'Sin órdenes este día'}
            </p>
            <p className="text-sm text-tin mt-1">Las órdenes confirmadas aparecerán acá</p>
          </div>
        ) : (
          <div className="space-y-2.5 pb-2">
            {ordenes.map(orden => (
              <button
                key={orden.id}
                onClick={() => setOrdenModal(orden)}
                className="w-full bg-white rounded-2xl border border-tin/20 shadow-sm p-4 flex items-center gap-3 text-left hover:border-primary/40 hover:shadow-md active:scale-[0.98] transition-all duration-150"
              >
                <div className="w-11 h-11 rounded-xl bg-tin-pale flex items-center justify-center shrink-0">
                  <span className="text-sm font-bold text-tin-dark">#{orden.numero}</span>
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                      orden.tipo === 'VENTA'
                        ? 'bg-primary-pale text-primary-dark'
                        : 'bg-cyan-100 text-cyan-700'
                    }`}>
                      {orden.tipo}
                    </span>
                    <span className="text-xs text-tin">{formatHora(orden.creadoEn)}</span>
                  </div>
                  <p className="text-xs text-tin mt-0.5">
                    {orden.totalProductos} prod. · {orden.totalUnidades.toLocaleString('es-PE')} unid.
                  </p>
                </div>

                <div className="w-9 h-9 rounded-xl bg-tin-pale flex items-center justify-center shrink-0">
                  <Printer size={15} className="text-tin-dark" />
                </div>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* ── Paginación ── */}
      {totalPages > 1 && (
        <div className="shrink-0 flex items-center justify-between gap-3 pb-1">
          <button
            onClick={() => setPagina(p => Math.max(1, p - 1))}
            disabled={pagina <= 1}
            className="flex-1 py-3 bg-white border border-tin/30 rounded-2xl text-sm font-semibold text-slate-700 disabled:opacity-40 disabled:cursor-not-allowed active:scale-[0.98] transition-all min-h-[2.75rem]"
          >
            ← Anterior
          </button>
          <span className="text-sm text-tin-dark font-medium whitespace-nowrap">
            {pagina} / {totalPages}
          </span>
          <button
            onClick={() => setPagina(p => Math.min(totalPages, p + 1))}
            disabled={pagina >= totalPages}
            className="flex-1 py-3 bg-white border border-tin/30 rounded-2xl text-sm font-semibold text-slate-700 disabled:opacity-40 disabled:cursor-not-allowed active:scale-[0.98] transition-all min-h-[2.75rem]"
          >
            Siguiente →
          </button>
        </div>
      )}

      {/* ── Modal ticket ── */}
      {ordenModal && (
        <div
          className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/40 p-0 sm:p-4"
          onClick={() => setOrdenModal(null)}
        >
          <div
            className="w-full sm:w-auto sm:min-w-[22rem] sm:max-w-md bg-white rounded-t-2xl sm:rounded-2xl p-5 space-y-4 max-h-[85vh] overflow-y-auto"
            onClick={e => e.stopPropagation()}
          >
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-bold text-slate-900">Orden #{ordenModal.numero}</h2>
              <button
                onClick={() => setOrdenModal(null)}
                className="w-8 h-8 rounded-lg bg-tin-pale hover:bg-slate-200 flex items-center justify-center active:scale-90 transition-all"
              >
                <X size={16} className="text-tin-dark" />
              </button>
            </div>

            <TicketOrden orden={ordenModal} solicitante={usuario?.nombre} />

            <div className="flex gap-2">
              <button
                onClick={() => handlePrint(ordenModal)}
                disabled={printer.isPrinting}
                className={`flex-1 min-h-[2.75rem] flex items-center justify-center gap-2 font-bold text-sm rounded-xl active:scale-95 transition-all duration-150 disabled:opacity-50 ${
                  printer.status === 'connected'
                    ? 'bg-primary hover:bg-primary-dark text-slate-900'
                    : 'bg-tin-pale hover:bg-slate-200 text-tin-dark'
                }`}
              >
                <Printer size={16} />
                {printer.isPrinting ? 'Imprimiendo...' : printer.status === 'connected' ? 'Imprimir Ticket' : 'Imprimir (sin BT)'}
              </button>
              <button
                onClick={() => setOrdenModal(null)}
                className="flex-1 min-h-[2.75rem] flex items-center justify-center gap-2 bg-tin-pale hover:bg-slate-200 text-tin-dark font-semibold text-sm rounded-xl active:scale-95 transition-all duration-150"
              >
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
