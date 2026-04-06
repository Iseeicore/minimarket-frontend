import { useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import {
  ChevronLeft, ChevronRight, ChevronDown,
  CheckCircle2, AlertTriangle, GitCompare,
  Loader2, RotateCcw, X, PanelRightOpen,
} from 'lucide-react'
import { useSincronizacion } from '../../hooks/useSincronizacion'
import { useRegistrosTienda } from '../../hooks/useRegistrosTienda'
import type { EstadoReconciliacion, ReconciliacionItem } from '../../types'

// ── Constantes ─────────────────────────────────────────────────
const ITEMS_PER_PAGE = 10

// ── Helpers ────────────────────────────────────────────────────
function formatFecha(iso: string) {
  return new Date(iso).toLocaleDateString('es-PE', {
    weekday: 'long', day: 'numeric', month: 'long', year: 'numeric',
  })
}
function formatHora(iso: string) {
  return new Date(iso).toLocaleTimeString('es-PE', { hour: '2-digit', minute: '2-digit' })
}

// ── Metadatos de estado por ítem ───────────────────────────────
const ITEM_META: Record<EstadoReconciliacion, {
  icon:  string
  label: string
  linea: string   // color del texto del ratio
  bg:    string   // fondo del badge en el slide
}> = {
  COINCIDE:           { icon: '✅', label: 'Coincide',         linea: 'text-green-700',  bg: 'bg-green-50 text-green-700 border-green-200'    },
  DIFERENCIA:         { icon: '❌', label: 'Diferencia',       linea: 'text-red-600',    bg: 'bg-red-50 text-red-700 border-red-200'          },
  SIN_CONTRAPARTIDA:  { icon: '⚠️', label: 'Sin contrapartida', linea: 'text-amber-600',  bg: 'bg-amber-50 text-amber-700 border-amber-200'    },
  PENDIENTE_REVISION: { icon: '🔵', label: 'Pendiente',         linea: 'text-blue-600',   bg: 'bg-blue-50 text-blue-700 border-blue-200'       },
  RESUELTO:           { icon: '✔️', label: 'Resuelto',          linea: 'text-tin-dark',   bg: 'bg-tin-pale text-tin-dark border-tin/30'         },
}

// ── Espirales (decoración tapa) ────────────────────────────────
function Espirales() {
  return (
    <div className="flex items-center gap-[5px] px-3 py-2 bg-black/25">
      {Array.from({ length: 22 }).map((_, i) => (
        <div key={i} className="w-4 h-4 rounded-full border-[2.5px] border-white/30 bg-white/20 shrink-0" />
      ))}
    </div>
  )
}

// ── Sección colapsable del slide ───────────────────────────────
interface SlideSectionProps {
  title:    string
  icon:     string
  count:    number
  open:     boolean
  onToggle: () => void
  children: React.ReactNode
}
function SlideSection({ title, icon, count, open, onToggle, children }: SlideSectionProps) {
  return (
    <div className="border-b border-tin/20 last:border-0">
      <button
        onClick={onToggle}
        className="w-full flex items-center justify-between px-4 py-3.5 hover:bg-tin-pale/50 transition-colors"
      >
        <div className="flex items-center gap-2">
          <span className="text-base">{icon}</span>
          <span className="font-bold text-sm text-slate-800">{title}</span>
          <span className="ml-1 px-2 py-0.5 rounded-full bg-slate-100 text-xs font-bold text-slate-600">
            {count}
          </span>
        </div>
        <ChevronDown
          size={16}
          className={`text-tin transition-transform duration-200 ${open ? 'rotate-180' : ''}`}
        />
      </button>

      <div className={`overflow-hidden transition-all duration-300 ease-in-out ${
        open ? 'max-h-[600px] opacity-100' : 'max-h-0 opacity-0'
      }`}>
        <div className="pb-2">{children}</div>
      </div>
    </div>
  )
}

// ── Slide de análisis (panel derecho) ─────────────────────────
interface AnalisisSlideProps {
  open:               boolean
  onClose:            () => void
  coincidencias:      ReconciliacionItem[]
  diferencias:        ReconciliacionItem[]
  sinContrapartida:   ReconciliacionItem[]
  omitidas:           any[]
}
function AnalisisSlide({
  open, onClose,
  coincidencias, diferencias, sinContrapartida, omitidas,
}: AnalisisSlideProps) {
  const [expanded, setExpanded] = useState<string | null>('diferencias')
  const toggle = (s: string) => setExpanded(prev => prev === s ? null : s)

  return (
    <>
      {/* Backdrop */}
      <div
        className={`fixed inset-0 z-40 bg-black/40 transition-opacity duration-300 ${
          open ? 'opacity-100' : 'opacity-0 pointer-events-none'
        }`}
        onClick={onClose}
      />

      {/* Panel */}
      <div className={`fixed inset-y-0 right-0 z-50 w-full sm:w-96 bg-white shadow-2xl
        transform transition-transform duration-300 ease-in-out flex flex-col
        ${open ? 'translate-x-0' : 'translate-x-full'}`}
      >
        {/* Header del slide */}
        <div className="bg-amber-700 shrink-0">
          <div className="flex items-center justify-between px-4 pt-4 pb-3">
            <div className="flex items-center gap-2">
              <GitCompare size={18} className="text-amber-200" />
              <h2 className="font-bold text-white text-base">Análisis ordenado</h2>
            </div>
            <button
              onClick={onClose}
              className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center text-white hover:bg-white/20 transition-colors"
            >
              <X size={16} />
            </button>
          </div>
        </div>

        {/* Secciones */}
        <div className="flex-1 overflow-y-auto">

          {/* ── Coincidencias ── */}
          <SlideSection
            title="Todo coincide"
            icon="✅"
            count={coincidencias.length}
            open={expanded === 'coincidencias'}
            onToggle={() => toggle('coincidencias')}
          >
            {coincidencias.length === 0 ? (
              <p className="px-4 py-2 text-sm text-tin italic">Sin coincidencias</p>
            ) : (
              /* Formato cuadernillo dentro del slide */
              <div className="mx-3 rounded-xl overflow-hidden border border-green-200 bg-green-50/30">
                {coincidencias.map((item, idx) => (
                  <div
                    key={item.id}
                    className="flex items-center gap-2 px-3 py-2.5 border-b border-green-100/80 last:border-0"
                  >
                    <span className="text-[10px] text-green-400 font-bold w-5 text-right shrink-0">
                      {idx + 1}
                    </span>
                    <span className="flex-1 text-sm font-medium text-slate-800 truncate">
                      {item.variante?.nombre ?? `Variante #${item.varianteId}`}
                    </span>
                    <span className="text-sm font-bold text-green-700 tabular-nums shrink-0">
                      {item.cantidadAlmacen} / {item.cantidadTienda}
                    </span>
                    <span className="text-base shrink-0">✅</span>
                  </div>
                ))}
              </div>
            )}
          </SlideSection>

          {/* ── Diferencias ── */}
          <SlideSection
            title="Hay diferencias"
            icon="❌"
            count={diferencias.length}
            open={expanded === 'diferencias'}
            onToggle={() => toggle('diferencias')}
          >
            {diferencias.length === 0 ? (
              <p className="px-4 py-2 text-sm text-tin italic">Sin diferencias</p>
            ) : (
              <div className="space-y-2 mx-3">
                {diferencias.map(item => (
                  <div key={item.id} className="bg-red-50 border border-red-200 rounded-xl p-3">
                    <p className="font-bold text-slate-800 text-sm">
                      {item.variante?.nombre ?? `Variante #${item.varianteId}`}
                    </p>
                    <div className="flex items-center gap-4 mt-2">
                      <div className="text-center">
                        <p className="text-[10px] text-slate-500 uppercase tracking-wide">Almacén</p>
                        <p className="text-lg font-black text-slate-900 tabular-nums">{item.cantidadAlmacen}</p>
                      </div>
                      <div className="flex-1 text-center">
                        <div className="h-px bg-red-200" />
                        <p className={`text-base font-black mt-0.5 ${
                          item.diferencia > 0 ? 'text-green-600' : 'text-red-600'
                        }`}>
                          {item.diferencia > 0 ? `+${item.diferencia}` : item.diferencia}
                        </p>
                      </div>
                      <div className="text-center">
                        <p className="text-[10px] text-slate-500 uppercase tracking-wide">Tienda</p>
                        <p className="text-lg font-black text-slate-900 tabular-nums">{item.cantidadTienda}</p>
                      </div>
                    </div>
                    {item.notas && (
                      <p className="text-xs text-slate-500 mt-2 italic">"{item.notas}"</p>
                    )}
                  </div>
                ))}
              </div>
            )}
          </SlideSection>

          {/* ── Sin contrapartida ── */}
          {sinContrapartida.length > 0 && (
            <SlideSection
              title="Solo en un lado"
              icon="⚠️"
              count={sinContrapartida.length}
              open={expanded === 'sinContra'}
              onToggle={() => toggle('sinContra')}
            >
              <div className="space-y-2 mx-3">
                {sinContrapartida.map(item => (
                  <div key={item.id} className="bg-amber-50 border border-amber-200 rounded-xl p-3">
                    <p className="font-bold text-slate-800 text-sm">
                      {item.variante?.nombre ?? `Variante #${item.varianteId}`}
                    </p>
                    <p className="text-xs text-amber-700 mt-1">
                      {item.cantidadAlmacen > 0
                        ? `Solo en almacén: ${item.cantidadAlmacen}`
                        : `Solo en tienda: ${item.cantidadTienda}`}
                    </p>
                  </div>
                ))}
              </div>
            </SlideSection>
          )}

          {/* ── Omitidas del sync (devueltas) ── */}
          <SlideSection
            title="Omitidas del sync"
            icon="🔄"
            count={omitidas.length}
            open={expanded === 'omitidas'}
            onToggle={() => toggle('omitidas')}
          >
            {omitidas.length === 0 ? (
              <p className="px-4 py-2 text-sm text-tin italic">
                Sin registros omitidos — ninguno fue marcado como devuelto antes de esta sync.
              </p>
            ) : (
              <div className="space-y-1.5 mx-3">
                {omitidas.map((r: any) => (
                  <div key={r.id} className="flex items-center gap-2 bg-tin-pale rounded-xl px-3 py-2.5">
                    <RotateCcw size={14} className="text-tin shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-slate-700 truncate">
                        {r.variante?.nombre ?? `Variante #${r.varianteId}`}
                      </p>
                      <p className="text-xs text-tin">
                        Devuelta · {r.cantidad} unid.
                        {r.notasDevolucion ? ` — ${r.notasDevolucion}` : ''}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </SlideSection>

        </div>
      </div>
    </>
  )
}

// ── Página principal ───────────────────────────────────────────
export default function TiendaSincronizacionDetallePage() {
  const { id }   = useParams<{ id: string }>()
  const navigate = useNavigate()
  const sincId   = id ? Number(id) : null

  const { data: sinc, isLoading }      = useSincronizacion(sincId)
  const { data: todosRegistros = [] }  = useRegistrosTienda()

  const [currentPage, setCurrentPage] = useState(1)
  const [slideOpen, setSlideOpen]     = useState(false)

  const items = sinc?.reconciliacion ?? []

  // ── Paginación ────────────────────────────────────────────────
  const totalPages = Math.max(1, Math.ceil(items.length / ITEMS_PER_PAGE))
  const safePage   = Math.min(currentPage, totalPages)
  const pageItems  = items.slice((safePage - 1) * ITEMS_PER_PAGE, safePage * ITEMS_PER_PAGE)
  const emptyLines = Math.max(0, ITEMS_PER_PAGE - pageItems.length)

  // ── Categorías para el slide ──────────────────────────────────
  const coincidencias    = items.filter(i => i.estado === 'COINCIDE')
  const diferencias      = items.filter(i => i.estado === 'DIFERENCIA')
  const sinContrapartida = items.filter(i => i.estado === 'SIN_CONTRAPARTIDA')
  const resueltos        = items.filter(i => i.estado === 'RESUELTO')

  // Devoluciones que se omitieron en esta sync (marcadas como devuelto antes del sync)
  const sincFecha = sinc ? new Date(sinc.periodoDesde).toDateString() : null
  const omitidas  = todosRegistros.filter(r =>
    r.devuelto === true &&
    sincFecha &&
    new Date(r.creadoEn).toDateString() === sincFecha,
  )

  if (isLoading || !sinc) {
    return (
      <div className="flex justify-center items-center py-24">
        <Loader2 size={32} className="animate-spin text-amber-700" />
      </div>
    )
  }

  const hayProblemas = sinc.totalDiferencias > 0 || sinContrapartida.length > 0

  return (
    <>
      <div className="pt-2 pb-8 space-y-3">

        {/* ── Botón volver ── */}
        <button
          onClick={() => navigate('/tienda/sincronizacion')}
          className="flex items-center gap-2 text-sm font-semibold text-tin-dark hover:text-slate-700 transition-colors"
        >
          <ChevronLeft size={18} />
          Volver a sincronización
        </button>

        {/* ── Cuadernillo ── */}
        <div
          className="rounded-2xl overflow-hidden"
          style={{ boxShadow: '4px 6px 20px rgba(0,0,0,0.18), -2px 2px 8px rgba(0,0,0,0.08)' }}
        >

          {/* ── TAPA ── */}
          <div className={hayProblemas ? 'bg-red-800' : 'bg-amber-700'}>
            <Espirales />
            <div className="px-5 py-5 pb-6">
              {/* Stats en tapa */}
              <p className={`text-xs font-bold uppercase tracking-widest mb-1 ${
                hayProblemas ? 'text-red-200' : 'text-amber-200'
              }`}>
                MiniMarket · Sincronización
              </p>
              <h1 className="text-white font-bold text-2xl leading-tight">
                {formatFecha(sinc.periodoDesde)}
              </h1>
              <p className={`text-sm mt-1 ${hayProblemas ? 'text-red-200' : 'text-amber-200'}`}>
                Ejecutada a las {formatHora(sinc.creadoEn)}
              </p>

              {/* Resumen de números */}
              <div className="mt-4 grid grid-cols-3 gap-2">
                <div className="bg-white/10 rounded-xl p-2.5 text-center">
                  <p className="text-white font-black text-xl tabular-nums">{items.length}</p>
                  <p className="text-white/70 text-[10px] uppercase tracking-wide">Total</p>
                </div>
                <div className="bg-white/10 rounded-xl p-2.5 text-center">
                  <p className="text-white font-black text-xl tabular-nums text-primary">
                    {sinc.totalCoincidencias}
                  </p>
                  <p className="text-white/70 text-[10px] uppercase tracking-wide">Coinciden</p>
                </div>
                <div className={`rounded-xl p-2.5 text-center ${
                  hayProblemas ? 'bg-red-500/30' : 'bg-white/10'
                }`}>
                  <p className={`font-black text-xl tabular-nums ${
                    hayProblemas ? 'text-red-200' : 'text-white'
                  }`}>
                    {sinc.totalDiferencias}
                  </p>
                  <p className="text-white/70 text-[10px] uppercase tracking-wide">Difieren</p>
                </div>
              </div>
            </div>
          </div>

          {/* ── HOJA CON LÍNEAS ── */}
          <div className="relative" style={{ backgroundColor: '#fef9ec' }}>

            {/* Margen rojo vertical */}
            <div className="absolute top-0 bottom-0 w-[2px]" style={{ left: '3rem', backgroundColor: '#fca5a5' }} />

            {/* Encabezado de columnas */}
            <div
              className="flex items-center gap-1 py-2 border-b-2"
              style={{ borderColor: '#fca5a5', paddingLeft: '3.5rem', paddingRight: '0.75rem' }}
            >
              <span className="flex-1 text-[10px] font-bold text-red-400 uppercase tracking-widest">Producto</span>
              <span className="w-14 text-center text-[10px] font-bold text-red-400 uppercase tracking-widest">Almacén</span>
              <span className="w-5 text-center text-[10px] text-red-300">/</span>
              <span className="w-14 text-center text-[10px] font-bold text-red-400 uppercase tracking-widest">Tienda</span>
              <span className="w-6 text-center text-[10px] font-bold text-red-400 uppercase tracking-widest"></span>
            </div>

            {/* ── Filas de ítems ── */}
            {pageItems.map((item, idx) => {
              const meta   = ITEM_META[item.estado]
              const lineNo = (safePage - 1) * ITEMS_PER_PAGE + idx + 1
              const iguales = item.cantidadAlmacen === item.cantidadTienda
              return (
                <div
                  key={item.id}
                  className="flex items-center gap-1 hover:bg-amber-50/50 transition-colors"
                  style={{
                    minHeight: '3rem',
                    borderBottom: '1px solid #fecaca',
                    paddingLeft: '0.5rem',
                    paddingRight: '0.75rem',
                  }}
                >
                  {/* Número de línea (en el margen) */}
                  <span className="text-[11px] font-bold text-red-300 shrink-0 text-right" style={{ width: '1.75rem' }}>
                    {lineNo}
                  </span>
                  <div style={{ width: '0.75rem', flexShrink: 0 }} />

                  {/* Nombre */}
                  <span className="flex-1 text-sm font-semibold text-slate-800 truncate min-w-0">
                    {item.variante?.nombre ?? `Variante #${item.varianteId}`}
                    {item.variante?.sku && (
                      <span className="ml-1.5 text-xs font-normal text-slate-400">{item.variante.sku}</span>
                    )}
                  </span>

                  {/* Almacén */}
                  <span className={`w-14 text-center text-base font-black tabular-nums shrink-0 ${
                    iguales ? 'text-green-700' : 'text-red-600'
                  }`}>
                    {item.cantidadAlmacen}
                  </span>

                  {/* Separador */}
                  <span className="w-5 text-center text-tin text-sm shrink-0">/</span>

                  {/* Tienda */}
                  <span className={`w-14 text-center text-base font-black tabular-nums shrink-0 ${
                    iguales ? 'text-green-700' : 'text-red-600'
                  }`}>
                    {item.cantidadTienda}
                  </span>

                  {/* Ícono estado */}
                  <span className="w-6 text-center text-base shrink-0">{meta.icon}</span>
                </div>
              )
            })}

            {/* ── Líneas vacías de relleno ── */}
            {Array.from({ length: emptyLines }).map((_, i) => (
              <div
                key={`empty-${i}`}
                style={{ minHeight: '3rem', borderBottom: '1px solid #fecaca' }}
              />
            ))}

            {/* ── PAGINACIÓN ── */}
            <div
              className="grid grid-cols-3 items-center gap-2 py-3 px-3"
              style={{ borderTop: '2px solid #fca5a5' }}
            >
              <button
                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                disabled={safePage === 1}
                className="flex items-center justify-center gap-1.5 py-3 px-3 rounded-xl bg-amber-100 text-amber-800 font-bold text-sm transition-all active:scale-95 disabled:opacity-30 disabled:cursor-not-allowed min-h-[2.75rem]"
              >
                <ChevronLeft size={16} />
                Anterior
              </button>

              <div className="text-center">
                <p className="text-xs font-bold text-slate-600">
                  Página {safePage} de {totalPages}
                </p>
                <p className="text-[10px] text-tin mt-0.5">
                  {items.length} productos
                </p>
              </div>

              <button
                onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                disabled={safePage === totalPages}
                className="flex items-center justify-center gap-1.5 py-3 px-3 rounded-xl bg-amber-100 text-amber-800 font-bold text-sm transition-all active:scale-95 disabled:opacity-30 disabled:cursor-not-allowed min-h-[2.75rem]"
              >
                Siguiente
                <ChevronRight size={16} />
              </button>
            </div>

            {/* ── Pie: botón análisis ── */}
            <div className="px-3 pb-4" style={{ borderTop: '1px solid #fecaca' }}>
              <button
                onClick={() => setSlideOpen(true)}
                className="w-full mt-3 flex items-center justify-center gap-2 py-4 rounded-xl border-2 border-amber-300 bg-amber-50 text-amber-800 font-bold text-base hover:bg-amber-100 active:scale-[0.98] transition-all duration-150"
              >
                <PanelRightOpen size={20} />
                Ver análisis ordenado
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* ── Slide análisis ── */}
      <AnalisisSlide
        open={slideOpen}
        onClose={() => setSlideOpen(false)}
        coincidencias={coincidencias}
        diferencias={diferencias}
        sinContrapartida={sinContrapartida}
        omitidas={omitidas}
      />
    </>
  )
}
