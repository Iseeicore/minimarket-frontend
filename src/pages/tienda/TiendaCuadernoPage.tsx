import { useState } from 'react'
import {
  Loader2, BookOpen, ChevronLeft, Library,
  X, SlidersHorizontal,
} from 'lucide-react'
import { useRegistrosTiendaPaginado, useRegistrosTiendaConteo, useResumenDia } from '../../hooks/useRegistrosTienda'
import { useAuthStore } from '../../store/auth.store'
import { getLocalISO } from '../../lib/date'
import type { RegistroTienda } from '../../types'


// -- Helpers --

const TODAY_ISO = getLocalISO()

function toDateString(iso: string) {
  return new Date(iso + 'T00:00:00').toDateString()
}

function formatHora(iso: string) {
  return new Date(iso).toLocaleTimeString('es-PE', { hour: '2-digit', minute: '2-digit' })
}

function formatFechaLarga(iso: string) {
  return new Date(iso + 'T00:00:00').toLocaleDateString('es-PE', {
    weekday: 'long', day: 'numeric', month: 'long', year: 'numeric',
  })
}

/** Últimos N días en ISO yyyy-mm-dd local, de más reciente a más antiguo. */
function lastDays(n: number): string[] {
  return Array.from({ length: n }, (_, i) => {
    const d = new Date()
    d.setDate(d.getDate() - i)
    return getLocalISO(d)
  })
}

/** Paleta de tapas de cuaderno — cada fecha recibe un color distinto */
const TAPAS = [
  '#7f1d1d', // rojo oscuro
  '#78350f', // ámbar oscuro
  '#14532d', // verde oscuro
  '#1e3a5f', // azul marino
  '#4c1d95', // violeta
  '#7c2d12', // naranja oscuro
  '#134e4a', // teal oscuro
  '#831843', // rosa oscuro
  '#1e3a5f', // índigo
  '#365314', // lima oscuro
  '#164e63', // cyan oscuro
  '#3b0764', // púrpura
  '#500724', // rojo cereza
  '#052e16', // esmeralda muy oscuro
]

function tapaPara(iso: string) {
  const day = new Date(iso + 'T00:00:00').getDate()
  return TAPAS[day % TAPAS.length]
}

// -- Sub-componentes reutilizables --

/** Espirales decorativas en la tapa del cuaderno */
function Espirales({ color = 'bg-black/20' }: { color?: string }) {
  return (
    <div className={`flex items-center gap-[5px] px-3 py-2 ${color}`}>
      {Array.from({ length: 22 }).map((_, i) => (
        <div key={i} className="w-4 h-4 rounded-full border-[2.5px] border-white/30 bg-white/20 shrink-0" />
      ))}
    </div>
  )
}


// -- Vista: card de cuaderno (estantería) --

interface NotebookCardProps {
  iso:       string
  isToday:   boolean
  registros: number
  onClick:   () => void
}
function NotebookCard({ iso, isToday, registros, onClick }: NotebookCardProps) {
  const d       = new Date(iso + 'T00:00:00')
  const day     = d.getDate()
  const month   = d.toLocaleDateString('es-PE', { month: 'short' })
  const weekday = d.toLocaleDateString('es-PE', { weekday: 'short' }).toUpperCase()
  const tapa    = tapaPara(iso)

  return (
    <button
      onClick={onClick}
      className="flex flex-col items-center gap-1.5 group active:scale-95 transition-transform duration-150"
    >
      <div
        className="w-full rounded-xl overflow-hidden shadow-lg group-hover:shadow-xl transition-shadow duration-200 relative"
        style={{ backgroundColor: tapa }}
      >
        {/* Espirales miniatura */}
        <div className="flex items-center gap-[3px] px-2 py-1.5 bg-black/25">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="w-3 h-3 rounded-full border border-white/30 bg-white/20 shrink-0" />
          ))}
        </div>

        <div className="px-2 pt-2 pb-3 text-center">
          <p className="text-white/60 text-[10px] font-bold tracking-widest">{weekday}</p>
          <p className="text-white font-black leading-none mt-0.5" style={{ fontSize: 'clamp(1.75rem, 8vw, 2.5rem)' }}>
            {day}
          </p>
          <p className="text-white/70 text-xs font-medium capitalize">{month}</p>
        </div>

        {isToday && (
          <div className="absolute top-2 right-2 bg-primary text-slate-900 text-[9px] font-black px-1.5 py-0.5 rounded-full uppercase">
            Hoy
          </div>
        )}
      </div>

      <span className="text-xs font-semibold text-tin-dark">
        {registros === 0 ? 'Sin registros' : `${registros} registros`}
      </span>
    </button>
  )
}


// -- Vista: estantería --

interface ShelfViewProps {
  dias:            string[]
  registrosPorDia: Record<string, number>
  onSelect:        (iso: string) => void
  onBack:          () => void
}
const DAYS_PER_PAGE = 8

function ShelfView({ dias, registrosPorDia, onSelect, onBack }: ShelfViewProps) {
  const [pagina, setPagina] = useState(1)

  const totalPages = Math.max(1, Math.ceil(dias.length / DAYS_PER_PAGE))
  const safePage   = Math.min(pagina, totalPages)
  const pageDias   = dias.slice((safePage - 1) * DAYS_PER_PAGE, safePage * DAYS_PER_PAGE)

  return (
    <div className="pt-2 pb-4 space-y-4">
      <div className="flex items-center gap-3">
        <button
          onClick={onBack}
          className="flex items-center justify-center w-10 h-10 rounded-xl bg-white border border-tin/20 shadow-sm hover:bg-tin-pale active:scale-95 transition-all duration-150"
        >
          <ChevronLeft size={20} className="text-slate-700" />
        </button>
        <div>
          <h2 className="text-xl font-bold text-slate-900">Mis cuadernos</h2>
          <p className="text-sm text-tin">Elegí el día que querés ver</p>
        </div>
      </div>

      <div className="grid grid-cols-3 sm:grid-cols-4 gap-4">
        {pageDias.map(iso => (
          <NotebookCard
            key={iso}
            iso={iso}
            isToday={iso === TODAY_ISO}
            registros={registrosPorDia[iso] ?? 0}
            onClick={() => onSelect(iso)}
          />
        ))}
      </div>

      {totalPages > 1 && (
        <div className="flex items-center justify-between gap-3">
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
      )}
    </div>
  )
}


// -- Panel de detalle del día (slide right-to-left) --
// Muestra resumen consolidado: productos agrupados con cantidad total

interface SlideDetalleDiaProps {
  open:          boolean
  onClose:       () => void
  almacenId:     number | null
  selectedDate:  string
}
function SlideDetalleDia({ open, onClose, almacenId, selectedDate }: SlideDetalleDiaProps) {
  const [tipoFiltro, setTipoFiltro] = useState<'SALIDA' | 'TRANSFERENCIA'>('SALIDA')
  const [pagina, setPagina] = useState(1)

  const { data: resumenData, isLoading } = useResumenDia({
    almacenId,
    fecha: selectedDate,
    tipo: tipoFiltro,
    page: pagina,
    limit: 10,
  })

  const items      = resumenData?.data ?? []
  const meta       = resumenData?.meta
  const totalPages = meta?.totalPages ?? 1

  // Reset pagina al cambiar tipo
  function handleTipo(tipo: 'SALIDA' | 'TRANSFERENCIA') {
    setTipoFiltro(tipo)
    setPagina(1)
  }

  return (
    <>
      {/* Overlay */}
      <div
        onClick={onClose}
        className={`fixed inset-0 z-40 bg-black/40 transition-opacity duration-300 ${
          open ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'
        }`}
      />

      {/* Panel lateral derecho */}
      <div
        className={`fixed top-0 right-0 bottom-0 z-50 w-[min(22rem,92vw)] bg-white shadow-2xl
          flex flex-col transform transition-transform duration-300
          ${open ? 'translate-x-0' : 'translate-x-full'}`}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-tin/20 shrink-0">
          <div className="flex items-center gap-2">
            <BookOpen size={18} className="text-amber-700" />
            <h2 className="text-base font-bold text-slate-900">Resumen del Día</h2>
          </div>
          <button
            onClick={onClose}
            className="w-9 h-9 rounded-xl flex items-center justify-center text-tin hover:text-slate-700 hover:bg-slate-100 transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        {/* Toggle Ventas / Transferencias */}
        <div className="px-4 pt-4 shrink-0">
          <div className="flex gap-2 bg-tin-pale rounded-xl p-1">
            <button
              onClick={() => handleTipo('SALIDA')}
              className={`flex-1 min-h-[2.25rem] rounded-lg font-bold text-xs transition-all duration-200 active:scale-95 ${
                tipoFiltro === 'SALIDA'
                  ? 'bg-green-500 text-white shadow-sm'
                  : 'text-tin-dark hover:text-slate-700'
              }`}
            >
              Ventas
            </button>
            <button
              onClick={() => handleTipo('TRANSFERENCIA')}
              className={`flex-1 min-h-[2.25rem] rounded-lg font-bold text-xs transition-all duration-200 active:scale-95 ${
                tipoFiltro === 'TRANSFERENCIA'
                  ? 'bg-blue-500 text-white shadow-sm'
                  : 'text-tin-dark hover:text-slate-700'
              }`}
            >
              Transferencias
            </button>
          </div>

          {meta && (
            <p className="text-xs text-tin mt-2 text-center">
              {meta.total} {meta.total === 1 ? 'producto' : 'productos'}
            </p>
          )}
        </div>

        {/* Lista de productos consolidados */}
        <div className="flex-1 overflow-y-auto px-4 py-4">
          {isLoading && items.length === 0 ? (
            <div className="flex justify-center py-12">
              <Loader2 size={24} className="animate-spin text-tin" />
            </div>
          ) : items.length === 0 ? (
            <p className="text-sm text-tin italic text-center py-8">
              Sin {tipoFiltro === 'SALIDA' ? 'ventas' : 'transferencias'} para este día.
            </p>
          ) : (
            <div className="space-y-1.5">
              {items.map((item, idx) => {
                const nombre = item.variante?.producto?.nombre
                  ? `${item.variante.producto.nombre} - ${item.variante.nombre}`
                  : item.variante?.nombre ?? `#${item.varianteId}`
                const unidad = item.variante?.unidad?.abreviatura ?? ''
                const num = ((pagina - 1) * 10) + idx + 1

                return (
                  <div key={item.varianteId} className="flex items-baseline gap-2 px-2 py-1.5 rounded-lg hover:bg-tin-pale/50 transition-colors">
                    <span className="text-xs text-tin w-5 text-right shrink-0">{num}</span>
                    <span className="text-sm text-slate-800 flex-1 min-w-0 truncate">{nombre}</span>
                    <span className="flex-1 border-b border-dotted border-slate-300 mx-1 shrink" aria-hidden />
                    <span className="text-sm font-bold text-slate-900 tabular-nums shrink-0">
                      {item.totalCantidad}
                    </span>
                    {unidad && (
                      <span className="text-xs text-tin shrink-0 w-6">{unidad}</span>
                    )}
                  </div>
                )
              })}
            </div>
          )}
        </div>

        {/* Paginación */}
        {totalPages > 1 && (
          <div className="shrink-0 flex items-center justify-between gap-2 px-4 py-3 border-t border-tin/20">
            <button
              onClick={() => setPagina(p => Math.max(1, p - 1))}
              disabled={pagina <= 1}
              className="min-h-[2rem] px-3 text-xs font-semibold text-tin-dark bg-tin-pale rounded-lg active:scale-95 transition-all disabled:opacity-40"
            >
              Anterior
            </button>
            <span className="text-xs text-tin-dark">{pagina} / {totalPages}</span>
            <button
              onClick={() => setPagina(p => Math.min(totalPages, p + 1))}
              disabled={pagina >= totalPages}
              className="min-h-[2rem] px-3 text-xs font-semibold text-tin-dark bg-tin-pale rounded-lg active:scale-95 transition-all disabled:opacity-40"
            >
              Siguiente
            </button>
          </div>
        )}
      </div>
    </>
  )
}


// -- Vista: cuaderno (modo lectura) --

interface NotebookViewProps {
  selectedDate: string
  registros:    RegistroTienda[]
  totalRegistros: number
  page:         number
  totalPages:   number
  onPageChange: (page: number) => void
  onOpenShelf:  () => void
  onOpenPanel:  () => void
}
const ITEMS_PER_PAGE = 10

function NotebookView({ selectedDate, registros, totalRegistros, page, totalPages, onPageChange, onOpenShelf, onOpenPanel }: NotebookViewProps) {
  const isToday      = selectedDate === TODAY_ISO
  const fechaDisplay = formatFechaLarga(selectedDate)

  const pageRegistros = registros
  const startIdx      = (page - 1) * ITEMS_PER_PAGE

  // Conteos de la página actual (la info total viene del meta)
  const totalVentas         = registros.filter(r => r.tipo === 'SALIDA').reduce((s, r) => s + r.cantidad, 0)
  const totalTransferencias = registros.filter(r => r.tipo === 'TRANSFERENCIA').reduce((s, r) => s + r.cantidad, 0)

  // -- JSX --
  return (
    <div className="space-y-3 pt-2 pb-4">

      {/* Botón "Ver otro día" — prominente, da contexto inmediato de navegación */}
      <button
        onClick={onOpenShelf}
        className="w-full flex items-center gap-3 px-5 py-4 bg-white border-2 border-amber-300 rounded-2xl shadow-sm hover:bg-amber-50 hover:border-amber-400 active:scale-[0.98] transition-all duration-150"
      >
        <div className="w-11 h-11 rounded-xl bg-amber-100 flex items-center justify-center shrink-0">
          <Library size={22} className="text-amber-700" />
        </div>
        <div className="text-left">
          <p className="font-bold text-amber-900 text-base leading-tight">Ver otro día</p>
          <p className="text-xs text-amber-700 mt-0.5">Elegí el cuaderno del día que querés ver</p>
        </div>
      </button>

      {/* Cuaderno */}
      <div
        className="rounded-2xl overflow-hidden shadow-xl"
        style={{ boxShadow: '4px 6px 20px rgba(0,0,0,0.2), -2px 2px 8px rgba(0,0,0,0.1)' }}
      >
        {/* TAPA */}
        <div className="bg-amber-700">
          <Espirales />
          <div className="px-5 py-5 pb-6">
            <div className="flex items-start justify-between gap-2">
              <div className="flex-1 min-w-0">
                <h1 className="text-white font-bold text-2xl leading-tight">Mi Cuaderno</h1>
                <p className="text-amber-200 text-sm mt-1 capitalize">{fechaDisplay}</p>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                {/* Botón Filtrar — abre el slide panel */}
                <button
                  onClick={onOpenPanel}
                  className="flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl bg-primary text-slate-900 text-xs font-black shadow-lg hover:bg-primary-dark active:scale-95 transition-all"
                >
                  <SlidersHorizontal size={13} />
                  Filtrar
                </button>
                <div className="text-right">
                  {isToday && (
                    <span className="inline-block bg-primary text-slate-900 text-xs font-black px-2.5 py-1 rounded-full mb-1">
                      HOY
                    </span>
                  )}
                  <p className="text-white font-bold text-2xl">{totalRegistros}</p>
                  <p className="text-amber-300 text-xs">registros</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* HOJA CON LÍNEAS */}
        <div className="relative" style={{ backgroundColor: '#fef9ec' }}>

          {/* Línea roja de margen (vertical) */}
          <div
            className="absolute top-0 bottom-0 w-[2px]"
            style={{ left: '3rem', backgroundColor: '#fca5a5' }}
          />

          {/* Encabezado de columnas */}
          <div
            className="flex items-center gap-2 py-2 border-b-2"
            style={{ borderColor: '#fca5a5', paddingLeft: '3.5rem', paddingRight: '1rem' }}
          >
            <span className="flex-1 text-[10px] font-bold text-red-400 uppercase tracking-widest">Producto</span>
            <span className="w-10 text-center text-[10px] font-bold text-red-400 uppercase tracking-widest">Cant.</span>
            <span className="w-16 text-center text-[10px] font-bold text-red-400 uppercase tracking-widest hidden sm:block">Tipo</span>
            <span className="w-12 text-right text-[10px] font-bold text-red-400 uppercase tracking-widest">Hora</span>
          </div>

          {/* Estado vacío — rellena la hoja con líneas para mantener la estética */}
          {totalRegistros === 0 && (
            <>
              {Array.from({ length: 8 }).map((_, i) => (
                <div
                  key={i}
                  className="flex items-center"
                  style={{ minHeight: '3rem', borderBottom: '1px solid #fecaca', paddingLeft: '3.5rem', paddingRight: '1rem' }}
                >
                  {i === 3 && (
                    <p className="text-slate-400 text-sm italic w-full text-center pr-12">
                      {isToday ? 'Todavía no hay nada anotado hoy...' : 'Sin registros para este día.'}
                    </p>
                  )}
                </div>
              ))}
            </>
          )}

          {/* Filas de registros — paginadas */}
          {pageRegistros.map((r, idx) => {
            // Badge visual diferenciado por tipo para lectura rápida
            const esVenta         = r.tipo === 'SALIDA'
            const esTransferencia = r.tipo === 'TRANSFERENCIA'
            const badgeClass      = esVenta
              ? 'bg-green-100 text-green-700 border border-green-200'
              : esTransferencia
                ? 'bg-blue-100 text-blue-700 border border-blue-200'
                : 'bg-slate-100 text-slate-600 border border-slate-200'
            const badgeLabel      = esVenta ? 'VENTA' : esTransferencia ? 'TRANSF.' : r.tipo

            return (
              <div
                key={r.id}
                className="flex items-center gap-2 hover:bg-amber-50/60 transition-colors duration-100"
                style={{ minHeight: '3rem', borderBottom: '1px solid #fecaca', paddingLeft: '0.5rem', paddingRight: '0.75rem' }}
              >
                {/* Número de línea en el margen */}
                <span className="text-[11px] font-bold text-red-300 shrink-0 text-right" style={{ width: '1.75rem' }}>
                  {startIdx + idx + 1}
                </span>
                <div style={{ width: '0.75rem', flexShrink: 0 }} />

                {/* Nombre del producto */}
                <span className="flex-1 text-sm font-semibold text-slate-800 truncate min-w-0">
                  {r.variante?.producto?.nombre ? `${r.variante.producto.nombre} - ${r.variante.nombre}` : r.variante?.nombre ?? `#${r.varianteId}`}
                </span>

                {/* Cantidad — centrada y prominente */}
                <span className="w-10 text-center text-base font-bold text-slate-900 tabular-nums shrink-0">
                  {r.cantidad}
                </span>

                {/* Badge tipo — solo en sm+ */}
                <span className={`hidden sm:inline-flex w-16 justify-center text-[11px] font-bold px-1.5 py-0.5 rounded-full shrink-0 ${badgeClass}`}>
                  {badgeLabel}
                </span>

                {/* Hora */}
                <span className="w-12 text-right text-xs text-slate-400 tabular-nums shrink-0">
                  {formatHora(r.creadoEn)}
                </span>
              </div>
            )
          })}

          {/* Líneas vacías de relleno — mantiene la profundidad visual del cuaderno */}
          {Array.from({ length: Math.max(2, 8 - pageRegistros.length) }).map((_, i) => (
            <div
              key={`empty-${i}`}
              style={{ minHeight: '3rem', borderBottom: '1px solid #fecaca' }}
            />
          ))}

          {/* Pie del cuaderno — resumen de items por tipo */}
          <div className="py-3 px-5" style={{ borderTop: '2px solid #fca5a5' }}>
            {totalRegistros === 0 ? (
              <p className="text-xs text-slate-400 italic text-center">Página en blanco</p>
            ) : (
              <p className="text-xs text-slate-500 text-center">
                <span className="font-bold text-green-700">Ventas: {totalVentas} items</span>
                <span className="mx-3 text-slate-300">|</span>
                <span className="font-bold text-blue-700">Transferencias: {totalTransferencias} items</span>
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Paginación del cuaderno — servidor */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between gap-3">
          <button
            onClick={() => onPageChange(Math.max(1, page - 1))}
            disabled={page === 1}
            className="flex-1 py-3 bg-white border border-tin/30 rounded-2xl text-sm font-semibold text-slate-700 disabled:opacity-40 disabled:cursor-not-allowed active:scale-[0.98] transition-all min-h-[2.75rem]"
          >
            ← Anterior
          </button>
          <span className="text-sm text-tin-dark font-medium whitespace-nowrap">
            Hoja {page} / {totalPages}
          </span>
          <button
            onClick={() => onPageChange(Math.min(totalPages, page + 1))}
            disabled={page === totalPages}
            className="flex-1 py-3 bg-white border border-tin/30 rounded-2xl text-sm font-semibold text-slate-700 disabled:opacity-40 disabled:cursor-not-allowed active:scale-[0.98] transition-all min-h-[2.75rem]"
          >
            Siguiente →
          </button>
        </div>
      )}
    </div>
  )
}


// -- Página principal --

function TiendaCuadernoPage() {
  // -- Estado --
  const [view, setView]             = useState<'notebook' | 'shelf'>('notebook')
  const [selectedDate, setSelectedDate] = useState(TODAY_ISO)
  const [showPanel, setShowPanel]   = useState(false)
  const [pagina, setPaginaCuaderno] = useState(1)

  // -- Auth --
  const usuario   = useAuthStore(s => s.usuario)
  const almacenId = usuario?.almacenId ?? null

  const dias = lastDays(14)
  const desdeFecha = dias[dias.length - 1] // 14 días atrás
  const hastaFecha = dias[0]               // hoy

  // -- Query: conteo para la estantería (limit alto, agrupa en select) --
  const { data: conteoData, isLoading: loadingConteo } = useRegistrosTiendaConteo(
    almacenId, desdeFecha, hastaFecha,
  )
  const registrosPorDia = conteoData ?? {}

  // -- Query: registros del día seleccionado (paginado servidor) --
  const { data: paginaData, isLoading: loadingDia } = useRegistrosTiendaPaginado({
    almacenId: almacenId ?? undefined,
    desde: selectedDate,
    hasta: selectedDate,
    page: pagina,
    limit: ITEMS_PER_PAGE,
  })
  const registrosDia = [...(paginaData?.data ?? [])].reverse()
  const meta         = paginaData?.meta

  const isLoading = loadingConteo || loadingDia

  // -- Handlers --
  function goToShelf() { setView('shelf') }
  function goToNotebook(iso: string) { setSelectedDate(iso); setPaginaCuaderno(1); setView('notebook') }

  // -- JSX --
  if (isLoading) {
    return (
      <div className="flex justify-center items-center py-24">
        <Loader2 size={32} className="animate-spin text-amber-700" />
      </div>
    )
  }

  return (
    <>
      {/* Contenedor con altura fija — scroll propio, no depende del navegador */}
      <div className="overflow-hidden" style={{ height: 'calc(100dvh - 11.5rem)' }}>
        <div
          className="flex h-full transition-transform duration-500 ease-in-out"
          style={{
            width: '200%',
            transform: view === 'shelf' ? 'translateX(0)' : 'translateX(-50%)',
          }}
        >
          {/* Panel izquierdo: estantería */}
          <div className="overflow-y-auto" style={{ width: '50%' }}>
            <ShelfView
              dias={dias}
              registrosPorDia={registrosPorDia}
              onSelect={goToNotebook}
              onBack={() => setView('notebook')}
            />
          </div>

          {/* Panel derecho: cuaderno (solo lectura) */}
          <div className="overflow-y-auto" style={{ width: '50%' }}>
            <NotebookView
              key={selectedDate}
              selectedDate={selectedDate}
              registros={registrosDia}
              totalRegistros={meta?.total ?? 0}
              page={pagina}
              totalPages={meta?.totalPages ?? 1}
              onPageChange={setPaginaCuaderno}
              onOpenShelf={goToShelf}
              onOpenPanel={() => setShowPanel(true)}
            />
          </div>
        </div>
      </div>

      {/* Slide panel: detalle del día agrupado por orden */}
      <SlideDetalleDia
        open={showPanel}
        onClose={() => setShowPanel(false)}
        almacenId={almacenId}
        selectedDate={selectedDate}
      />
    </>
  )
}

export default TiendaCuadernoPage
