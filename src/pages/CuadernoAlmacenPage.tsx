import { useState, Fragment } from 'react'
import { useQuery } from '@tanstack/react-query'
import { useNavigate } from 'react-router-dom'
import { BookOpen, Plus, Loader2, RotateCcw, ChevronDown, ChevronRight } from 'lucide-react'
import { useRegistrosAlmacen, useCreateRegistroAlmacen, useMarcarDevueltoAlmacen } from '../hooks/useRegistrosAlmacen'
import { useAlmacenes } from '../hooks/useAlmacenes'
import { useAuthStore } from '../store/auth.store'
import { variantesService } from '../services/productos.service'
import { ventasService } from '../services/ventas.service'
import { qk } from '../lib/query-keys'
import Modal from '../components/shared/Modal'
import EmptyState from '../components/shared/EmptyState'
import type { TipoMovRegistro } from '../types'

const LS_KEY_CA = 'mm:cuaderno-almacen:almacenId'

// ── Helpers ────────────────────────────────────────────────────
function formatFecha(iso: string) {
  return new Date(iso).toLocaleString('es-PE', {
    day: '2-digit', month: '2-digit', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  })
}

const TIPO_LABEL: Record<TipoMovRegistro, string> = {
  SALIDA:        'Salida',
  ENTRADA:       'Entrada',
  TRANSFERENCIA: 'Transferencia',
  DEVOLUCION:    'Devolución',
}

const TIPO_COLOR: Record<TipoMovRegistro, string> = {
  SALIDA:        'bg-red-100 text-red-700',
  ENTRADA:       'bg-green-100 text-green-700',
  TRANSFERENCIA: 'bg-blue-100 text-blue-700',
  DEVOLUCION:    'bg-amber-100 text-amber-700',
}

// ── Formulario nuevo registro ──────────────────────────────────
interface FormNuevoRegistroProps {
  almacenId: number
  onClose: () => void
}
function FormNuevoRegistro({ almacenId, onClose }: FormNuevoRegistroProps) {
  const [varianteId, setVarianteId] = useState('')
  const [cantidad, setCantidad]     = useState('')
  const [tipo, setTipo]             = useState<TipoMovRegistro>('SALIDA')
  const [notas, setNotas]           = useState('')
  const [search, setSearch]         = useState('')

  const { data: variantes = [], isFetching } = useQuery({
    queryKey: qk.variantes.search(search),
    queryFn: () => variantesService.getAll(search || undefined),
    staleTime: 1000 * 30,
  })

  const crear = useCreateRegistroAlmacen()

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!varianteId || !cantidad) return
    crear.mutate(
      { almacenId, varianteId: Number(varianteId), cantidad: Number(cantidad), tipo, notas: notas.trim() || undefined },
      { onSuccess: onClose }
    )
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {/* Variante */}
      <div>
        <label className="block text-xs font-semibold text-gray-600 uppercase tracking-wide mb-1">
          Producto / variante
        </label>
        <input
          type="text"
          placeholder="Buscar por nombre o SKU..."
          value={search}
          onChange={e => { setSearch(e.target.value); setVarianteId('') }}
          className="w-full rounded-lg border border-tin/30 px-3 py-2 text-sm focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary"
        />
        {search && (
          <div className="mt-1 border border-tin/20 rounded-lg bg-white max-h-40 overflow-y-auto shadow-sm">
            {isFetching && (
              <div className="flex justify-center py-2">
                <Loader2 size={14} className="animate-spin text-tin" />
              </div>
            )}
            {!isFetching && variantes.length === 0 && (
              <p className="px-3 py-2 text-xs text-tin">Sin resultados</p>
            )}
            {variantes.map(v => (
              <button
                key={v.id}
                type="button"
                onClick={() => { setVarianteId(String(v.id)); setSearch(`${v.nombre}${v.sku ? ` (${v.sku})` : ''}`) }}
                className={`w-full text-left px-3 py-2 text-sm hover:bg-tin-pale transition-colors ${
                  varianteId === String(v.id) ? 'bg-primary/10 text-primary font-medium' : 'text-gray-700'
                }`}
              >
                <span className="font-medium">{v.nombre}</span>
                {v.sku && <span className="ml-2 text-xs text-tin">{v.sku}</span>}
                {v.producto && <span className="ml-2 text-xs text-gray-400">· {v.producto.nombre}</span>}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Cantidad y Tipo en fila */}
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-xs font-semibold text-gray-600 uppercase tracking-wide mb-1">
            Cantidad
          </label>
          <input
            type="number"
            min={1}
            value={cantidad}
            onChange={e => setCantidad(e.target.value)}
            placeholder="0"
            className="w-full rounded-lg border border-tin/30 px-3 py-2 text-sm focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary"
          />
        </div>
        <div>
          <label className="block text-xs font-semibold text-gray-600 uppercase tracking-wide mb-1">
            Tipo
          </label>
          <div className="relative">
            <select
              value={tipo}
              onChange={e => setTipo(e.target.value as TipoMovRegistro)}
              className="appearance-none w-full rounded-lg border border-tin/30 px-3 py-2 text-sm focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary bg-white cursor-pointer pr-7"
            >
              <option value="SALIDA">Salida</option>
              <option value="ENTRADA">Entrada</option>
              <option value="TRANSFERENCIA">Transferencia</option>
            </select>
            <ChevronDown size={12} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-tin pointer-events-none" />
          </div>
        </div>
      </div>

      {/* Notas */}
      <div>
        <label className="block text-xs font-semibold text-gray-600 uppercase tracking-wide mb-1">
          Notas <span className="font-normal text-tin normal-case">(opcional)</span>
        </label>
        <textarea
          value={notas}
          onChange={e => setNotas(e.target.value)}
          rows={2}
          placeholder="Observaciones del movimiento..."
          className="w-full rounded-lg border border-tin/30 px-3 py-2 text-sm focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary resize-none"
        />
      </div>

      <div className="flex gap-2 pt-1">
        <button
          type="button"
          onClick={onClose}
          className="flex-1 py-2.5 rounded-xl border border-tin/30 text-sm font-medium text-gray-600 hover:bg-tin-pale transition-colors"
        >
          Cancelar
        </button>
        <button
          type="submit"
          disabled={!varianteId || !cantidad || crear.isPending}
          className="flex-1 py-2.5 rounded-xl bg-primary hover:bg-primary-dark text-white font-semibold text-sm transition-all duration-150 active:scale-95 disabled:opacity-50"
        >
          {crear.isPending ? <Loader2 size={14} className="animate-spin mx-auto" /> : 'Guardar'}
        </button>
      </div>
    </form>
  )
}

// ── Detalle de venta expandible en fila del cuaderno ──────────
// Se monta solo cuando la fila está abierta → fetch lazy automático
function VentaExpandida({ ventaId, onDevolver }: { ventaId: number; onDevolver: () => void }) {
  const { data: venta, isLoading } = useQuery({
    queryKey: qk.ventas.detail(ventaId),
    queryFn:  () => ventasService.getOne(ventaId),
    staleTime: 1000 * 60,
  })

  const fmtN = (n: string | number) =>
    parseFloat(String(n)).toLocaleString('es-PE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })

  if (isLoading) return (
    <div className="flex justify-center py-4">
      <Loader2 size={18} className="animate-spin text-tin" />
    </div>
  )
  if (!venta) return null

  return (
    <div className="bg-slate-50 border-t border-tin/10 px-6 py-4">
      {/* Cabecera venta */}
      <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
        <div className="text-sm space-x-2">
          <span className="font-semibold text-gray-700">Venta #{venta.id}</span>
          {venta.contacto && <span className="text-tin-dark">· Cliente: <span className="font-medium text-gray-700">{venta.contacto.nombre}</span></span>}
          <span className={`text-xs font-semibold px-1.5 py-0.5 rounded ${
            venta.estado === 'DEVUELTA'  ? 'bg-red-100 text-red-700'  :
            venta.estado === 'CANCELADA' ? 'bg-gray-100 text-gray-500' :
            'bg-green-100 text-green-700'
          }`}>{venta.estado}</span>
        </div>
        <span className="text-sm font-bold text-gray-700">Total: S/ {fmtN(venta.total)}</span>
      </div>

      {/* Tabla de ítems */}
      {(venta.items ?? []).length > 0 && (
        <div className="overflow-x-auto mb-4">
          <table className="w-full text-xs min-w-[280px]">
            <thead>
              <tr className="border-b border-tin/20 text-tin-dark">
                <th className="text-left pb-1.5 font-medium">Producto</th>
                <th className="text-right pb-1.5 font-medium w-14">Cant.</th>
                <th className="text-right pb-1.5 font-medium w-24">P. unit.</th>
                <th className="text-right pb-1.5 font-medium w-24">Subtotal</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-tin/10">
              {venta.items!.map(it => (
                <tr key={it.id}>
                  <td className="py-1.5 text-gray-700 pr-2">
                    {it.variante?.nombre ?? `Variante #${it.varianteId}`}
                  </td>
                  <td className="py-1.5 text-right text-gray-600 tabular-nums">{it.cantidad}</td>
                  <td className="py-1.5 text-right text-gray-600 tabular-nums">S/ {fmtN(it.precioUnitario)}</td>
                  <td className="py-1.5 text-right font-medium text-gray-700 tabular-nums">S/ {fmtN(it.subtotal)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Acción */}
      {venta.estado !== 'CANCELADA' && (
        <div className="flex justify-end">
          <button
            onClick={onDevolver}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-600 text-white font-semibold text-sm transition-all active:scale-95"
          >
            <RotateCcw size={13} />
            Procesar devolución
          </button>
        </div>
      )}
    </div>
  )
}


// ── Modal confirmar devolución ─────────────────────────────────
interface ConfirmDevolucionProps {
  onConfirm: (notas: string) => void
  onClose: () => void
  isPending: boolean
}
function ConfirmDevolucion({ onConfirm, onClose, isPending }: ConfirmDevolucionProps) {
  const [notas, setNotas] = useState('')
  return (
    <div className="space-y-4">
      <p className="text-sm text-gray-600">
        Marcá este registro como devuelto. El movimiento quedará excluido de la sincronización.
      </p>
      <div>
        <label className="block text-xs font-semibold text-gray-600 uppercase tracking-wide mb-1">
          Notas <span className="font-normal text-tin normal-case">(opcional)</span>
        </label>
        <textarea
          value={notas}
          onChange={e => setNotas(e.target.value)}
          rows={2}
          placeholder="Motivo de la devolución..."
          className="w-full rounded-lg border border-tin/30 px-3 py-2 text-sm focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary resize-none"
        />
      </div>
      <div className="flex gap-2">
        <button
          onClick={onClose}
          className="flex-1 py-2.5 rounded-xl border border-tin/30 text-sm font-medium text-gray-600 hover:bg-tin-pale transition-colors"
        >
          Cancelar
        </button>
        <button
          onClick={() => onConfirm(notas)}
          disabled={isPending}
          className="flex-1 py-2.5 rounded-xl bg-red-500 hover:bg-red-600 text-white font-semibold text-sm transition-all duration-150 active:scale-95 disabled:opacity-50"
        >
          {isPending ? <Loader2 size={14} className="animate-spin mx-auto" /> : 'Confirmar devolución'}
        </button>
      </div>
    </div>
  )
}

// ── Página principal ───────────────────────────────────────────
export default function CuadernoAlmacenPage() {
  const usuario      = useAuthStore(s => s.usuario)
  const isAdmin      = useAuthStore(s => s.isAdmin)
  const isAdminUser  = isAdmin()
  const { data: almacenes = [] } = useAlmacenes()

  // Admin selecciona almacén; JEFE_ALMACEN usa el propio
  const [adminAlmacenId, setAdminAlmacenId] = useState<number | null>(() => {
    const saved = localStorage.getItem(LS_KEY_CA)
    return saved ? Number(saved) : null
  })
  const almacenId: number | null = isAdminUser
    ? adminAlmacenId
    : (usuario?.almacenId ?? null)

  function handleAlmacenChange(id: number | null) {
    setAdminAlmacenId(id)
    if (id) localStorage.setItem(LS_KEY_CA, String(id))
    else localStorage.removeItem(LS_KEY_CA)
  }

  const navigate                            = useNavigate()
  const { data: registros = [], isLoading } = useRegistrosAlmacen()
  const marcarDevuelto                      = useMarcarDevueltoAlmacen()

  const [showForm, setShowForm]         = useState(false)
  const [devolverId, setDevolverId]     = useState<number | null>(null)
  const [filtroTipo, setFiltroTipo]     = useState<TipoMovRegistro | ''>('')
  const [expandedRows, setExpanded]     = useState<Set<number>>(new Set())

  function toggleRow(id: number) {
    setExpanded(prev => {
      const next = new Set(prev)
      next.has(id) ? next.delete(id) : next.add(id)
      return next
    })
  }

  // Filtrar por almacén si admin seleccionó uno
  const porAlmacen = almacenId
    ? registros.filter(r => r.almacenId === almacenId)
    : registros

  const filtrados = filtroTipo
    ? porAlmacen.filter(r => r.tipo === filtroTipo)
    : porAlmacen

  if (isLoading) {
    return (
      <div className="flex justify-center items-center py-24">
        <Loader2 size={32} className="animate-spin text-tin" />
      </div>
    )
  }

  return (
    <div className="space-y-5">

      {/* ── Header ── */}
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-3">
          <BookOpen size={22} className="text-tin-dark shrink-0" />
          <div>
            <h1 className="text-2xl font-bold text-gray-800">Cuaderno Almacén</h1>
            <p className="text-sm text-tin-dark mt-0.5">Movimientos del cuaderno virtual del almacén</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {isAdminUser && (
            <div className="relative">
              <select
                value={adminAlmacenId ?? ''}
                onChange={e => handleAlmacenChange(e.target.value ? Number(e.target.value) : null)}
                className="appearance-none pl-3 pr-8 py-2 rounded-xl border border-tin/30 text-sm font-medium text-gray-700 bg-white hover:border-tin/60 focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary transition-colors cursor-pointer"
              >
                <option value="">Todos los almacenes</option>
                {almacenes.map(a => (
                  <option key={a.id} value={a.id}>{a.nombre}</option>
                ))}
              </select>
              <ChevronDown size={14} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-tin pointer-events-none" />
            </div>
          )}
          {almacenId && (
            <>
              <button
                onClick={() => navigate('/devoluciones')}
                className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-white font-semibold text-sm transition-all duration-150 active:scale-95 shrink-0"
              >
                <RotateCcw size={15} />
                <span className="hidden sm:inline">Nueva devolución</span>
                <span className="sm:hidden">Dev.</span>
              </button>
              <button
                onClick={() => setShowForm(true)}
                className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-primary hover:bg-primary-dark text-gray-900 font-semibold text-sm transition-all duration-150 active:scale-95 shrink-0"
              >
                <Plus size={15} />
                <span className="hidden sm:inline">Nuevo registro</span>
                <span className="sm:hidden">Nuevo</span>
              </button>
            </>
          )}
        </div>
      </div>

      {/* ── Filtros ── */}
      <div className="flex items-center gap-2">
        <span className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Filtrar:</span>
        {(['', 'SALIDA', 'ENTRADA', 'TRANSFERENCIA', 'DEVOLUCION'] as const).map(t => (
          <button
            key={t}
            onClick={() => setFiltroTipo(t)}
            className={`px-3 py-1.5 rounded-full text-xs font-semibold transition-colors ${
              filtroTipo === t
                ? 'bg-primary text-white'
                : 'bg-white border border-tin/30 text-gray-600 hover:border-tin/60'
            }`}
          >
            {t === '' ? 'Todos' : TIPO_LABEL[t]}
          </button>
        ))}
        <span className="ml-auto text-xs text-tin">{filtrados.length} registros</span>
      </div>

      {/* ── Lista ── */}
      {filtrados.length === 0 ? (
        <EmptyState message="Sin registros. ¡Creá el primer movimiento del cuaderno!" />
      ) : (
        <>
          {/* Tabla — md+ */}
          <div className="hidden md:block bg-white rounded-2xl border border-tin/20 shadow-sm overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-tin/20">
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Variante</th>
                  <th className="text-center px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Cant.</th>
                  <th className="text-center px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Tipo</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Notas</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Fecha</th>
                  <th className="px-4 py-3" />
                </tr>
              </thead>
              <tbody>
                {filtrados.map((r, idx) => (
                  <Fragment key={r.id}>
                    <tr className={`border-b border-tin/10 ${expandedRows.has(r.id) ? 'bg-amber-50/30' : idx % 2 !== 0 ? 'bg-tin-pale/40' : ''}`}>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          {/* Chevron expandible para SALIDA con ventaId */}
                          {r.tipo === 'SALIDA' && r.ventaId && (
                            <button
                              onClick={() => toggleRow(r.id)}
                              className="shrink-0 p-0.5 text-tin hover:text-amber-600 transition-colors"
                            >
                              <ChevronRight
                                size={13}
                                className={`transition-transform duration-200 ${expandedRows.has(r.id) ? 'rotate-90 text-amber-600' : ''}`}
                              />
                            </button>
                          )}
                          <div>
                            <span className="font-medium text-gray-800">{r.variante?.nombre ?? `Variante #${r.varianteId}`}</span>
                            {r.variante?.sku && <span className="ml-2 text-xs text-tin">{r.variante.sku}</span>}
                            {r.venta && (
                              <span className="ml-2 text-xs bg-primary/10 text-primary-dark px-1.5 py-0.5 rounded">
                                Venta #{r.venta.id}
                              </span>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-center font-semibold text-gray-800">{r.cantidad}</td>
                      <td className="px-4 py-3 text-center">
                        <span className={`px-2.5 py-1 rounded-full text-xs font-semibold ${TIPO_COLOR[r.tipo]}`}>
                          {TIPO_LABEL[r.tipo]}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-gray-500 max-w-[200px] truncate">{r.notas ?? '—'}</td>
                      <td className="px-4 py-3 text-gray-400 text-xs whitespace-nowrap">{formatFecha(r.creadoEn)}</td>
                      <td className="px-4 py-3">
                        {(r.tipo === 'SALIDA' || r.tipo === 'TRANSFERENCIA') && !r.devuelto && !(r.tipo === 'SALIDA' && r.ventaId) && (
                          <button
                            onClick={() => setDevolverId(r.id)}
                            title="Anular registro del cuaderno"
                            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-red-200 text-red-600 text-xs font-medium hover:bg-red-50 transition-colors"
                          >
                            <RotateCcw size={12} />
                            Anular
                          </button>
                        )}
                      </td>
                    </tr>
                    {/* Fila expandida con detalle de venta */}
                    {expandedRows.has(r.id) && r.ventaId && (
                      <tr>
                        <td colSpan={6} className="p-0">
                          <VentaExpandida
                            ventaId={r.ventaId}
                            onDevolver={() => navigate('/devoluciones', { state: { ventaId: r.ventaId } })}
                          />
                        </td>
                      </tr>
                    )}
                  </Fragment>
                ))}
              </tbody>
            </table>
          </div>

          {/* Cards — mobile */}
          <div className="md:hidden space-y-3">
            {filtrados.map(r => {
              const isExpanded  = expandedRows.has(r.id)
              const tieneVenta  = r.tipo === 'SALIDA' && !!r.ventaId
              return (
                <div key={r.id} className={`bg-white rounded-2xl border shadow-sm overflow-hidden ${tieneVenta && isExpanded ? 'border-amber-300' : 'border-tin/20'}`}>
                  {/* Cabecera */}
                  <div
                    className={`p-4 ${tieneVenta ? 'cursor-pointer active:bg-tin-pale/50' : ''}`}
                    onClick={tieneVenta ? () => toggleRow(r.id) : undefined}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          {tieneVenta && (
                            <ChevronRight
                              size={13}
                              className={`text-amber-500 transition-transform duration-200 ${isExpanded ? 'rotate-90' : ''}`}
                            />
                          )}
                          <span className="font-semibold text-gray-800 text-sm">
                            {r.variante?.nombre ?? `Variante #${r.varianteId}`}
                          </span>
                          {r.variante?.sku && <span className="text-xs text-tin">{r.variante.sku}</span>}
                        </div>
                        {r.venta && (
                          <span className="text-xs bg-primary/10 text-primary-dark px-1.5 py-0.5 rounded mt-1 inline-block">
                            Venta #{r.venta.id}
                          </span>
                        )}
                      </div>
                      <span className={`shrink-0 px-2.5 py-1 rounded-full text-xs font-semibold ${TIPO_COLOR[r.tipo]}`}>
                        {TIPO_LABEL[r.tipo]}
                      </span>
                    </div>

                    <div className="mt-2.5 flex items-center justify-between gap-2">
                      <div className="flex items-center gap-3">
                        <div className="text-center">
                          <p className="text-xs text-gray-400">Cantidad</p>
                          <p className="font-bold text-gray-800">{r.cantidad}</p>
                        </div>
                        {r.notas && (
                          <p className="text-xs text-gray-500 italic truncate max-w-[140px]">"{r.notas}"</p>
                        )}
                      </div>
                      {/* Solo "Anular" para SALIDA manual / TRANSFERENCIA */}
                      {(r.tipo === 'SALIDA' || r.tipo === 'TRANSFERENCIA') && !r.devuelto && !tieneVenta && (
                        <button
                          onClick={e => { e.stopPropagation(); setDevolverId(r.id) }}
                          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-red-200 text-red-600 text-xs font-medium hover:bg-red-50 transition-colors"
                        >
                          <RotateCcw size={12} />
                          Anular
                        </button>
                      )}
                    </div>
                    <p className="text-xs text-gray-400 mt-2">{formatFecha(r.creadoEn)}</p>
                  </div>

                  {/* Detalle de venta expandible */}
                  {isExpanded && r.ventaId && (
                    <VentaExpandida
                      ventaId={r.ventaId}
                      onDevolver={() => navigate('/devoluciones', { state: { ventaId: r.ventaId } })}
                    />
                  )}
                </div>
              )
            })}
          </div>
        </>
      )}

      {/* ── Modal nuevo registro ── */}
      <Modal open={showForm} title="Nuevo registro" onClose={() => setShowForm(false)} size="md">
        {almacenId && <FormNuevoRegistro almacenId={almacenId} onClose={() => setShowForm(false)} />}
      </Modal>

      {/* ── Modal confirmar devolución ── */}
      <Modal
        open={devolverId !== null}
        title="Confirmar devolución"
        onClose={() => setDevolverId(null)}
        size="sm"
      >
        <ConfirmDevolucion
          isPending={marcarDevuelto.isPending}
          onClose={() => setDevolverId(null)}
          onConfirm={(notas) => {
            if (devolverId === null) return
            marcarDevuelto.mutate(
              { id: devolverId, notas: notas.trim() || undefined },
              { onSuccess: () => setDevolverId(null) }
            )
          }}
        />
      </Modal>
    </div>
  )
}
