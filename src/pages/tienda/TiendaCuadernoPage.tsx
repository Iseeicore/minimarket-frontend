import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import {
  Plus, Loader2, ArrowUpRight, ArrowDownLeft,
  RotateCcw, BookOpen, ChevronLeft, Library,
} from 'lucide-react'
import { PanelPendientes } from '../../components/shared/PanelPendientes'
import {
  useRegistrosTienda,
  useCreateRegistroTienda,
  useMarcarDevueltoTienda,
} from '../../hooks/useRegistrosTienda'
import { usePendientesTienda } from '../../hooks/useRegistrosAlmacen'
import { useAuthStore } from '../../store/auth.store'
import { variantesService } from '../../services/productos.service'
import { qk } from '../../lib/query-keys'
import type { PendienteTienda, TipoMovRegistro } from '../../types'


// ── Helpers ────────────────────────────────────────────────────

/** Fecha local en formato yyyy-mm-dd — evita el desfase UTC en servidores. */
function getLocalISO(date: Date = new Date()): string {
  const y = date.getFullYear()
  const m = String(date.getMonth() + 1).padStart(2, '0')
  const d = String(date.getDate()).padStart(2, '0')
  return `${y}-${m}-${d}`
}

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

const TIPO_META: Record<TipoMovRegistro, {
  label: string
  Icon:  typeof ArrowUpRight
  badge: string
  color: string
}> = {
  SALIDA:        { label: 'Salida',        Icon: ArrowUpRight,  badge: 'bg-red-100 text-red-700 border border-red-200',          color: 'text-red-500'      },
  ENTRADA:       { label: 'Entrada',       Icon: ArrowDownLeft, badge: 'bg-green-100 text-green-700 border border-green-200',    color: 'text-green-600'    },
  TRANSFERENCIA: { label: 'Transf.',       Icon: RotateCcw,     badge: 'bg-blue-100 text-blue-700 border border-blue-200',      color: 'text-blue-500'     },
  DEVOLUCION:    { label: 'Devolución',    Icon: ArrowDownLeft, badge: 'bg-amber-100 text-amber-700 border border-amber-200',   color: 'text-amber-600'    },
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

// ── Modal: formulario de nuevo registro ───────────────────────
interface ModalNuevoProps {
  almacenId: number
  onClose:   () => void
}
function ModalNuevo({ almacenId, onClose }: ModalNuevoProps) {
  const [search, setSearch]                   = useState('')
  const [varianteId, setVarianteId]           = useState('')
  const [varianteNombre, setVarianteNombre]   = useState('')
  const [cantidad, setCantidad]               = useState('')
  const [tipo, setTipo]                       = useState<TipoMovRegistro>('SALIDA')

  const { data: variantes = [], isFetching } = useQuery({
    queryKey: qk.variantes.search(search),
    queryFn:  () => variantesService.getAll(search || undefined),
    staleTime: 1000 * 30,
    enabled:   search.length > 0,
  })

  const crear       = useCreateRegistroTienda()
  const cantidadNum = parseInt(cantidad, 10)
  const canSubmit   = !!varianteId && cantidadNum > 0 && !crear.isPending

  function seleccionar(id: number, nombre: string, sku?: string | null) {
    setVarianteId(String(id))
    setVarianteNombre(nombre + (sku ? ` (${sku})` : ''))
    setSearch('')
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!canSubmit) return
    crear.mutate(
      { almacenId, varianteId: Number(varianteId), cantidad: cantidadNum, tipo },
      { onSuccess: onClose },
    )
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/60"
      onClick={onClose}
    >
      <div
        className="w-full sm:max-w-md bg-white rounded-t-3xl sm:rounded-2xl overflow-hidden shadow-2xl"
        onClick={e => e.stopPropagation()}
      >
        <div className="bg-amber-700 px-5 pt-5 pb-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <BookOpen size={18} className="text-amber-200" />
            <h2 className="text-base font-bold text-white">Anotar en el cuaderno</h2>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center text-white hover:bg-white/20 transition-colors text-lg leading-none"
          >
            ×
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-5">
          {/* Producto */}
          <div>
            <label className="block text-sm font-bold text-slate-700 mb-2">¿Qué producto?</label>
            {varianteId ? (
              <div className="flex items-center justify-between gap-2 px-4 py-3 rounded-xl bg-amber-50 border border-amber-200">
                <span className="font-semibold text-amber-900 text-sm">{varianteNombre}</span>
                <button type="button" onClick={() => { setVarianteId(''); setVarianteNombre('') }}
                  className="text-xs text-amber-700 hover:text-amber-900 underline">
                  Cambiar
                </button>
              </div>
            ) : (
              <div>
                <input
                  type="text" inputMode="text" autoFocus
                  placeholder="Buscar producto por nombre..."
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                  className="w-full rounded-xl border border-tin/30 px-4 py-3.5 text-base focus:outline-none focus:border-amber-500 focus:ring-2 focus:ring-amber-200"
                />
                {search.length > 0 && (
                  <div className="mt-1 border border-tin/20 rounded-xl bg-white max-h-48 overflow-y-auto shadow-md">
                    {isFetching && <div className="flex justify-center py-3"><Loader2 size={16} className="animate-spin text-tin" /></div>}
                    {!isFetching && variantes.length === 0 && <p className="px-4 py-3 text-sm text-tin">Sin resultados</p>}
                    {variantes.map(v => (
                      <button key={v.id} type="button" onClick={() => seleccionar(v.id, v.nombre, v.sku)}
                        className="w-full text-left px-4 py-3 text-sm border-b border-tin/10 last:border-0 hover:bg-amber-50 transition-colors">
                        <span className="font-semibold text-slate-800">{v.nombre}</span>
                        {v.sku && <span className="ml-2 text-xs text-tin">{v.sku}</span>}
                        {v.producto && <span className="ml-1 text-xs text-gray-400">· {v.producto.nombre}</span>}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Cantidad */}
          <div>
            <label className="block text-sm font-bold text-slate-700 mb-2">¿Cuántos?</label>
            <input
              type="text" inputMode="numeric" placeholder="0"
              value={cantidad}
              onChange={e => { if (/^\d*$/.test(e.target.value)) setCantidad(e.target.value) }}
              className="w-full rounded-xl border border-tin/30 px-4 py-3.5 text-3xl font-bold text-center text-slate-900 focus:outline-none focus:border-amber-500 focus:ring-2 focus:ring-amber-200"
            />
          </div>

          {/* Tipo */}
          <div>
            <label className="block text-sm font-bold text-slate-700 mb-2">¿Qué pasó?</label>
            <div className="grid grid-cols-2 gap-2">
              {(['SALIDA', 'ENTRADA'] as TipoMovRegistro[]).map(t => {
                const meta = TIPO_META[t]
                return (
                  <button key={t} type="button" onClick={() => setTipo(t)}
                    className={`flex flex-col items-center justify-center py-4 rounded-xl border-2 font-bold text-sm transition-all duration-150 ${
                      tipo === t
                        ? t === 'SALIDA'
                          ? 'border-red-400 bg-red-50 text-red-700'
                          : 'border-green-400 bg-green-50 text-green-700'
                        : 'border-tin/20 bg-white text-tin-dark hover:border-tin/50'
                    }`}>
                    <meta.Icon size={24} className="mb-1" />
                    {meta.label}
                  </button>
                )
              })}
            </div>
          </div>

          <button
            type="submit" disabled={!canSubmit}
            className="w-full py-4 rounded-xl bg-amber-700 hover:bg-amber-800 text-white font-bold text-base transition-all duration-150 active:scale-[0.98] disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {crear.isPending
              ? <Loader2 size={20} className="animate-spin" />
              : <><BookOpen size={18} /> Anotar en el cuaderno</>
            }
          </button>
        </form>
      </div>
    </div>
  )
}

// ── Espirales decorativas ──────────────────────────────────────
function Espirales({ color = 'bg-black/20' }: { color?: string }) {
  return (
    <div className={`flex items-center gap-[5px] px-3 py-2 ${color}`}>
      {Array.from({ length: 22 }).map((_, i) => (
        <div key={i} className="w-4 h-4 rounded-full border-[2.5px] border-white/30 bg-white/20 shrink-0" />
      ))}
    </div>
  )
}

// ── Card de cuaderno (vista estantería) ────────────────────────
interface NotebookCardProps {
  iso:        string
  isToday:    boolean
  registros:  number   // cantidad de registros ese día
  onClick:    () => void
}
function NotebookCard({ iso, isToday, registros, onClick }: NotebookCardProps) {
  const d      = new Date(iso + 'T00:00:00')
  const day    = d.getDate()
  const month  = d.toLocaleDateString('es-PE', { month: 'short' })
  const weekday = d.toLocaleDateString('es-PE', { weekday: 'short' }).toUpperCase()
  const tapa   = tapaPara(iso)

  return (
    <button
      onClick={onClick}
      className="flex flex-col items-center gap-1.5 group active:scale-95 transition-transform duration-150"
    >
      {/* Cuerpo del cuaderno */}
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

        {/* Contenido de la tapa */}
        <div className="px-2 pt-2 pb-3 text-center">
          <p className="text-white/60 text-[10px] font-bold tracking-widest">{weekday}</p>
          <p className="text-white font-black leading-none mt-0.5" style={{ fontSize: 'clamp(1.75rem, 8vw, 2.5rem)' }}>
            {day}
          </p>
          <p className="text-white/70 text-xs font-medium capitalize">{month}</p>
        </div>

        {/* Badge "HOY" */}
        {isToday && (
          <div className="absolute top-2 right-2 bg-primary text-slate-900 text-[9px] font-black px-1.5 py-0.5 rounded-full uppercase">
            Hoy
          </div>
        )}
      </div>

      {/* Cantidad de registros */}
      <span className="text-xs font-semibold text-tin-dark">
        {registros === 0 ? 'Sin registros' : `${registros} registros`}
      </span>
    </button>
  )
}

// ── Vista estantería ───────────────────────────────────────────
interface ShelfViewProps {
  dias:          string[]
  registrosPorDia: Record<string, number>
  onSelect:      (iso: string) => void
  onBack:        () => void
}
function ShelfView({ dias, registrosPorDia, onSelect, onBack }: ShelfViewProps) {
  return (
    <div className="pt-2 pb-8">
      {/* Header estantería */}
      <div className="flex items-center gap-3 mb-6">
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

      {/* Grilla de cuadernos */}
      <div className="grid grid-cols-3 sm:grid-cols-4 gap-4">
        {dias.map(iso => (
          <NotebookCard
            key={iso}
            iso={iso}
            isToday={iso === TODAY_ISO}
            registros={registrosPorDia[iso] ?? 0}
            onClick={() => onSelect(iso)}
          />
        ))}
      </div>
    </div>
  )
}

// ── Vista cuaderno ─────────────────────────────────────────────
interface NotebookViewProps {
  selectedDate:  string
  registros:     any[]
  almacenId:     number | null
  pendientes:    PendienteTienda[]
  onOpenShelf:   () => void
  onOpenModal:   () => void
  onDevolver:    (id: number) => void
  devolviendo:   boolean
}
function NotebookView({
  selectedDate, registros, almacenId, pendientes,
  onOpenShelf, onOpenModal, onDevolver, devolviendo,
}: NotebookViewProps) {
  const isToday      = selectedDate === TODAY_ISO
  const fechaDisplay = formatFechaLarga(selectedDate)

  return (
    <div className="space-y-3 pt-2 pb-4">

      {/* ── Botón "Ver otro día" — prominente, antes del cuaderno ── */}
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

      {/* ── Pendientes del almacén — solo para el día de hoy ── */}
      {isToday && <PanelPendientes items={pendientes} />}

      <div
        className="rounded-2xl overflow-hidden shadow-xl"
        style={{ boxShadow: '4px 6px 20px rgba(0,0,0,0.2), -2px 2px 8px rgba(0,0,0,0.1)' }}
      >
        {/* ── TAPA ── */}
        <div className="bg-amber-700">
          <Espirales />
          <div className="px-5 py-5 pb-6">
            <div className="flex items-start justify-between gap-2">
              <div className="flex-1 min-w-0">
                <h1 className="text-white font-bold text-2xl leading-tight">Mi Cuaderno</h1>
                <p className="text-amber-200 text-sm mt-1 capitalize">{fechaDisplay}</p>
              </div>
              <div className="text-right shrink-0">
                {isToday && (
                  <span className="inline-block bg-primary text-slate-900 text-xs font-black px-2.5 py-1 rounded-full mb-1">
                    HOY
                  </span>
                )}
                <p className="text-white font-bold text-2xl">{registros.length}</p>
                <p className="text-amber-300 text-xs">registros</p>
              </div>
            </div>
          </div>
        </div>

        {/* ── HOJA CON LÍNEAS ROJAS ── */}
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

          {/* Sin registros */}
          {registros.length === 0 && (
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

          {/* Filas de registros */}
          {registros.map((r, idx) => {
            const meta = TIPO_META[r.tipo]
            const { Icon } = meta
            return (
              <div
                key={r.id}
                className="flex items-center gap-2 hover:bg-amber-50/60 transition-colors duration-100"
                style={{ minHeight: '3rem', borderBottom: '1px solid #fecaca', paddingLeft: '0.5rem', paddingRight: '0.75rem' }}
              >
                {/* Número de línea (en el margen) */}
                <span className="text-[11px] font-bold text-red-300 shrink-0 text-right" style={{ width: '1.75rem' }}>
                  {idx + 1}
                </span>
                <div style={{ width: '0.75rem', flexShrink: 0 }} />

                {/* Ícono tipo */}
                <Icon size={14} className={`shrink-0 ${meta.color}`} />

                {/* Nombre del producto */}
                <span className="flex-1 text-sm font-semibold text-slate-800 truncate min-w-0">
                  {r.variante?.nombre ?? `Variante #${r.varianteId}`}
                  {r.variante?.sku && (
                    <span className="ml-1.5 text-xs font-normal text-slate-400">{r.variante.sku}</span>
                  )}
                </span>

                {/* Cantidad */}
                <span className="w-10 text-center text-base font-bold text-slate-900 tabular-nums shrink-0">
                  {r.cantidad}
                </span>

                {/* Badge tipo — solo en sm+ */}
                <span className={`hidden sm:inline-flex w-16 justify-center text-[11px] font-bold px-1.5 py-0.5 rounded-full shrink-0 ${meta.badge}`}>
                  {meta.label}
                </span>

                {/* Hora */}
                <span className="w-12 text-right text-xs text-slate-400 tabular-nums shrink-0">
                  {formatHora(r.creadoEn)}
                </span>

                {/* Devolver */}
                {!r.devuelto && isToday && (
                  <button
                    onClick={() => onDevolver(r.id)}
                    disabled={devolviendo}
                    title="Marcar como devuelto"
                    className="ml-1 p-1.5 rounded-lg text-red-400 hover:text-red-600 hover:bg-red-50 transition-colors shrink-0"
                  >
                    <RotateCcw size={13} />
                  </button>
                )}
              </div>
            )
          })}

          {/* Líneas vacías de relleno */}
          {Array.from({ length: Math.max(4, 8 - registros.length) }).map((_, i) => (
            <div
              key={`empty-${i}`}
              style={{ minHeight: '3rem', borderBottom: '1px solid #fecaca' }}
            />
          ))}

          {/* Pie del cuaderno */}
          <div className="py-3 text-center" style={{ borderTop: '2px solid #fca5a5' }}>
            <p className="text-xs text-slate-400 italic">
              {registros.length === 0
                ? 'Página en blanco'
                : `${registros.length} ${registros.length === 1 ? 'anotación' : 'anotaciones'}`}
            </p>
          </div>
        </div>
      </div>

      {/* FAB — solo para el día de hoy */}
      {almacenId && isToday && (
        <button
          onClick={onOpenModal}
          className="fixed bottom-24 right-4 sm:right-6 w-16 h-16 rounded-full bg-amber-700 hover:bg-amber-800 shadow-lg shadow-amber-900/30 flex items-center justify-center transition-all duration-150 active:scale-95 z-30"
        >
          <Plus size={28} className="text-white" strokeWidth={2.5} />
        </button>
      )}
    </div>
  )
}

// ── Página principal ───────────────────────────────────────────
export default function TiendaCuadernoPage() {
  const usuario   = useAuthStore(s => s.usuario)
  const almacenId = usuario?.almacenId ?? null

  const { data: registros = [], isLoading } = useRegistrosTienda()
  const marcarDevuelto = useMarcarDevueltoTienda()
  const { data: pendientes = [] } = usePendientesTienda(almacenId)

  const [view, setView]               = useState<'notebook' | 'shelf'>('notebook')
  const [selectedDate, setSelectedDate] = useState(TODAY_ISO)
  const [showModal, setShowModal]     = useState(false)

  const dias = lastDays(14)

  // Agrupar por fecha para mostrar conteo en la estantería
  const registrosPorDia: Record<string, number> = {}
  for (const r of registros) {
    if (almacenId && r.almacenId !== almacenId) continue
    const iso = getLocalISO(new Date(r.creadoEn))
    registrosPorDia[iso] = (registrosPorDia[iso] ?? 0) + 1
  }

  // Registros del día seleccionado, orden más reciente primero
  const registrosDia = registros
    .filter(r => almacenId ? r.almacenId === almacenId : true)
    .filter(r => new Date(r.creadoEn).toDateString() === toDateString(selectedDate))
    .slice()
    .reverse()

  function goToShelf() { setView('shelf') }
  function goToNotebook(iso: string) { setSelectedDate(iso); setView('notebook') }

  if (isLoading) {
    return (
      <div className="flex justify-center items-center py-24">
        <Loader2 size={32} className="animate-spin text-amber-700" />
      </div>
    )
  }

  return (
    <>
      {/* ── Contenedor con animación de slide horizontal ── */}
      <div className="overflow-hidden">
        <div
          className="flex transition-transform duration-500 ease-in-out"
          style={{
            width: '200%',
            transform: view === 'shelf' ? 'translateX(0)' : 'translateX(-50%)',
          }}
        >
          {/* Panel izquierdo: estantería */}
          <div style={{ width: '50%' }}>
            <ShelfView
              dias={dias}
              registrosPorDia={registrosPorDia}
              onSelect={goToNotebook}
              onBack={() => setView('notebook')}
            />
          </div>

          {/* Panel derecho: cuaderno */}
          <div style={{ width: '50%' }}>
            <NotebookView
              selectedDate={selectedDate}
              registros={registrosDia}
              almacenId={almacenId}
              pendientes={pendientes}
              onOpenShelf={goToShelf}
              onOpenModal={() => setShowModal(true)}
              onDevolver={id => marcarDevuelto.mutate({ id })}
              devolviendo={marcarDevuelto.isPending}
            />
          </div>
        </div>
      </div>

      {/* ── Modal nuevo registro ── */}
      {showModal && almacenId && (
        <ModalNuevo almacenId={almacenId} onClose={() => setShowModal(false)} />
      )}
    </>
  )
}
