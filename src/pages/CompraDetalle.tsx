import { useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { ArrowLeft, PackageCheck, CreditCard, X, Plus } from 'lucide-react'
import { useCompra, useRecibirOrden, useRegistrarPago } from '../hooks/useCompras'
import type { EstadoCompra } from '../types'

// ── Helpers ────────────────────────────────────────────────────
function fmt(decimal: string) {
  return parseFloat(decimal).toLocaleString('es-PE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
}

function formatFecha(iso: string) {
  return new Date(iso).toLocaleDateString('es-PE', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' })
}

const estadoBadge: Record<EstadoCompra, string> = {
  PENDIENTE: 'bg-amber-50 text-amber-700 border border-amber-200',
  PARCIAL:   'bg-accent/20 text-accent-dark border border-accent-mid',
  PAGADO:    'bg-primary-pale text-primary-dark border border-primary',
}

const estadoLabel: Record<EstadoCompra, string> = {
  PENDIENTE: 'Pendiente',
  PARCIAL:   'Pago parcial',
  PAGADO:    'Pagado',
}

// ── Stepper ────────────────────────────────────────────────────
interface StepperProps {
  recibido: boolean
  pagado: boolean
}

function Stepper({ recibido, pagado }: StepperProps) {
  const steps = [
    { label: 'Orden creada', done: true },
    { label: 'Mercadería recibida', done: recibido },
    { label: 'Pago completado', done: pagado },
  ]

  return (
    <div className="flex items-center gap-0 mb-6">
      {steps.map((step, i) => (
        <div key={i} className="flex items-center flex-1 last:flex-none">
          <div className="flex flex-col items-center">
            <div
              className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold transition-colors duration-300 ${
                step.done
                  ? 'bg-primary text-white'
                  : 'bg-tin-pale text-tin border border-tin/30'
              }`}
            >
              {step.done ? '✓' : i + 1}
            </div>
            <span className={`text-xs mt-1 whitespace-nowrap ${step.done ? 'text-primary-dark font-medium' : 'text-tin'}`}>
              {step.label}
            </span>
          </div>
          {i < steps.length - 1 && (
            <div className={`h-0.5 flex-1 mx-2 mb-4 transition-colors duration-300 ${step.done && steps[i + 1].done ? 'bg-primary' : 'bg-tin/30'}`} />
          )}
        </div>
      ))}
    </div>
  )
}

// ── Slide-over de pagos ────────────────────────────────────────
interface PagosSlideOverProps {
  open: boolean
  onClose: () => void
  ordenId: number
  pagos: Array<{ id: number; monto: string; pagadoEn: string; notas: string | null }>
  totalOrden: number
  isPending: boolean
}

function PagosSlideOver({ open, onClose, ordenId, pagos, totalOrden, isPending }: PagosSlideOverProps) {
  const registrar = useRegistrarPago()
  const [monto, setMonto]   = useState('')
  const [notas, setNotas]   = useState('')

  const totalPagado = pagos.reduce((acc, p) => acc + parseFloat(p.monto), 0)
  const saldo       = totalOrden - totalPagado

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    const montoNum = parseFloat(monto)
    if (!montoNum || montoNum <= 0) return
    registrar.mutate(
      { id: ordenId, data: { monto: montoNum, notas: notas.trim() || undefined } },
      {
        onSuccess: () => {
          setMonto('')
          setNotas('')
        },
      }
    )
  }

  return (
    <>
      {/* Backdrop */}
      <div
        className={`fixed inset-0 bg-black/40 z-40 transition-opacity duration-200 ${open ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}
        onClick={onClose}
      />

      {/* Panel */}
      <div
        className={`fixed top-0 right-0 h-full w-full sm:w-96 bg-white z-50 shadow-2xl flex flex-col transition-transform duration-300 ${open ? 'translate-x-0' : 'translate-x-full'}`}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-tin/20">
          <h2 className="font-semibold text-gray-800 flex items-center gap-2">
            <CreditCard size={18} className="text-accent-dark" />
            Pagos
          </h2>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg hover:bg-tin-pale transition-colors"
          >
            <X size={18} className="text-tin-dark" />
          </button>
        </div>

        {/* Saldo */}
        <div className="px-5 py-3 bg-tin-pale border-b border-tin/20">
          <div className="flex justify-between text-sm">
            <span className="text-tin-dark">Total orden</span>
            <span className="font-medium text-gray-800">S/ {fmt(String(totalOrden))}</span>
          </div>
          <div className="flex justify-between text-sm mt-1">
            <span className="text-tin-dark">Pagado</span>
            <span className="font-medium text-primary-dark">S/ {fmt(String(totalPagado))}</span>
          </div>
          <div className="flex justify-between text-sm mt-1 border-t border-tin/20 pt-1">
            <span className="font-semibold text-gray-800">Saldo</span>
            <span className={`font-bold ${saldo > 0 ? 'text-amber-600' : 'text-primary-dark'}`}>
              S/ {fmt(String(saldo))}
            </span>
          </div>
        </div>

        {/* Historial */}
        <div className="flex-1 overflow-y-auto px-5 py-4">
          <p className="text-xs font-semibold text-tin-dark uppercase tracking-wide mb-3">Historial</p>
          {pagos.length === 0 ? (
            <p className="text-sm text-tin text-center py-6">Sin pagos registrados</p>
          ) : (
            <div className="space-y-2">
              {pagos.map(p => (
                <div key={p.id} className="flex items-start justify-between p-3 rounded-xl bg-tin-pale">
                  <div>
                    <p className="text-sm font-medium text-gray-800">S/ {fmt(p.monto)}</p>
                    <p className="text-xs text-tin-dark mt-0.5">{formatFecha(p.pagadoEn)}</p>
                    {p.notas && <p className="text-xs text-tin mt-0.5 italic">{p.notas}</p>}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Form nuevo pago */}
        {!isPending && saldo > 0 && (
          <form onSubmit={handleSubmit} className="px-5 py-4 border-t border-tin/20 space-y-3">
            <p className="text-xs font-semibold text-tin-dark uppercase tracking-wide flex items-center gap-1">
              <Plus size={12} /> Registrar pago
            </p>
            <div>
              <label className="block text-xs text-tin-dark mb-1">Monto (S/)</label>
              <input
                type="number"
                min="0.01"
                step="0.01"
                value={monto}
                onChange={e => setMonto(e.target.value)}
                placeholder={`Máx. ${fmt(String(saldo))}`}
                className="w-full rounded-xl border border-tin/30 px-3 py-2 text-sm focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary"
                required
              />
            </div>
            <div>
              <label className="block text-xs text-tin-dark mb-1">Notas (opcional)</label>
              <input
                type="text"
                value={notas}
                onChange={e => setNotas(e.target.value)}
                placeholder="Ej: transferencia BCP"
                className="w-full rounded-xl border border-tin/30 px-3 py-2 text-sm focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary"
              />
            </div>
            <button
              type="submit"
              disabled={registrar.isPending}
              className="w-full bg-primary hover:bg-primary-dark text-white font-semibold py-2.5 rounded-xl transition-all duration-150 active:scale-95 disabled:opacity-50"
            >
              {registrar.isPending ? 'Registrando...' : 'Registrar pago'}
            </button>
          </form>
        )}
      </div>
    </>
  )
}

// ── Página principal ───────────────────────────────────────────
export default function CompraDetalle() {
  const { id }     = useParams<{ id: string }>()
  const navigate   = useNavigate()
  const compraId   = id ? parseInt(id, 10) : null

  const { data: compra, isLoading } = useCompra(compraId)
  const recibirMutation             = useRecibirOrden()
  const [pagosOpen, setPagosOpen]   = useState(false)

  const recibido = !!compra?.recibidoEn
  const pagado   = compra?.estado === 'PAGADO'

  // ── Skeleton ─────────────────────────────────────────────────
  if (isLoading) {
    return (
      <div className="animate-pulse space-y-6">
        <div className="h-6 w-40 bg-tin-pale rounded" />
        <div className="h-32 bg-tin-pale rounded-2xl" />
        <div className="h-48 bg-tin-pale rounded-2xl" />
      </div>
    )
  }

  if (!compra) {
    return (
      <div className="text-center py-16">
        <p className="text-tin-dark">Orden no encontrada.</p>
        <button onClick={() => navigate('/compras')} className="mt-4 text-sm text-primary-dark underline">
          Volver a compras
        </button>
      </div>
    )
  }

  const items  = compra.items  ?? []
  const pagos  = compra.pagos  ?? []
  const total  = parseFloat(compra.total)

  return (
    <div className="max-w-3xl mx-auto space-y-6">

      {/* ── Cabecera ── */}
      <div className="flex items-center gap-3">
        <button
          onClick={() => navigate('/compras')}
          className="p-2 rounded-xl hover:bg-tin-pale transition-colors active:scale-95 duration-150"
        >
          <ArrowLeft size={20} className="text-tin-dark" />
        </button>
        <div className="flex-1">
          <h1 className="text-xl font-bold text-gray-800">
            Orden de compra #{compra.id}
          </h1>
          <p className="text-sm text-tin-dark">{formatFecha(compra.creadoEn)}</p>
        </div>
        <span className={`px-3 py-1 rounded-full text-xs font-semibold ${estadoBadge[compra.estado]}`}>
          {estadoLabel[compra.estado]}
        </span>
      </div>

      {/* ── Stepper ── */}
      <div className="bg-white rounded-2xl border border-tin/20 shadow-sm p-5">
        <Stepper recibido={recibido} pagado={pagado} />

        <div className="flex flex-col sm:flex-row gap-3">
          {/* Botón recibir */}
          <button
            onClick={() => recibirMutation.mutate(compra.id)}
            disabled={recibido || recibirMutation.isPending}
            className={`flex-1 flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl font-semibold text-sm transition-all duration-150 active:scale-95 ${
              recibido
                ? 'bg-tin-pale text-tin cursor-not-allowed'
                : 'bg-accent/30 hover:bg-accent/50 text-accent-dark'
            }`}
          >
            <PackageCheck size={16} />
            {recibido ? 'Mercadería recibida' : recibirMutation.isPending ? 'Procesando...' : 'Marcar como recibida'}
          </button>

          {/* Botón pagos */}
          <button
            onClick={() => setPagosOpen(true)}
            className="flex-1 flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl font-semibold text-sm bg-primary/20 hover:bg-primary/30 text-primary-dark transition-all duration-150 active:scale-95"
          >
            <CreditCard size={16} />
            Gestionar pagos
            {pagos.length > 0 && (
              <span className="bg-primary text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                {pagos.length}
              </span>
            )}
          </button>
        </div>
      </div>

      {/* ── Info general ── */}
      <div className="bg-white rounded-2xl border border-tin/20 shadow-sm p-5 grid grid-cols-2 sm:grid-cols-3 gap-4 text-sm">
        <div>
          <p className="text-xs text-tin-dark mb-0.5">Almacén</p>
          <p className="font-medium text-gray-800">{compra.almacen?.nombre ?? '—'}</p>
        </div>
        <div>
          <p className="text-xs text-tin-dark mb-0.5">Proveedor</p>
          <p className="font-medium text-gray-800">{compra.contacto?.nombre ?? '—'}</p>
        </div>
        <div>
          <p className="text-xs text-tin-dark mb-0.5">Recibido el</p>
          <p className="font-medium text-gray-800">{compra.recibidoEn ? formatFecha(compra.recibidoEn) : '—'}</p>
        </div>
        {compra.notas && (
          <div className="col-span-2 sm:col-span-3">
            <p className="text-xs text-tin-dark mb-0.5">Notas</p>
            <p className="text-gray-700 italic">{compra.notas}</p>
          </div>
        )}
      </div>

      {/* ── Tabla de ítems ── */}
      <div className="bg-white rounded-2xl border border-tin/20 shadow-sm overflow-hidden">
        <div className="px-5 py-4 border-b border-tin/20">
          <h2 className="font-semibold text-gray-800">Artículos</h2>
        </div>

        {/* Tabla desktop */}
        <div className="hidden sm:block overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-tin-pale text-tin-dark text-xs uppercase tracking-wide">
              <tr>
                <th className="px-5 py-3 text-left font-medium">Variante</th>
                <th className="px-5 py-3 text-right font-medium">Cant.</th>
                <th className="px-5 py-3 text-right font-medium">Costo unit.</th>
                <th className="px-5 py-3 text-right font-medium">Subtotal</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-tin/10">
              {items.map(item => (
                <tr key={item.id} className="hover:bg-tin-pale/50 transition-colors">
                  <td className="px-5 py-3 text-gray-800">
                    {item.variante?.nombre ?? `#${item.varianteId}`}
                    {item.variante?.sku && (
                      <span className="ml-2 text-xs text-tin">({item.variante.sku})</span>
                    )}
                  </td>
                  <td className="px-5 py-3 text-right text-gray-700">{item.cantidad}</td>
                  <td className="px-5 py-3 text-right text-gray-700">S/ {fmt(item.costoUnitario)}</td>
                  <td className="px-5 py-3 text-right font-medium text-gray-800">S/ {fmt(item.subtotal)}</td>
                </tr>
              ))}
            </tbody>
            <tfoot className="bg-tin-pale/70 border-t border-tin/20">
              <tr>
                <td colSpan={3} className="px-5 py-3 text-right font-semibold text-gray-800">Total</td>
                <td className="px-5 py-3 text-right font-bold text-gray-900">S/ {fmt(compra.total)}</td>
              </tr>
            </tfoot>
          </table>
        </div>

        {/* Cards mobile */}
        <div className="sm:hidden divide-y divide-tin/10">
          {items.map(item => (
            <div key={item.id} className="px-4 py-3 flex justify-between items-center">
              <div>
                <p className="font-medium text-gray-800 text-sm">
                  {item.variante?.nombre ?? `#${item.varianteId}`}
                </p>
                {item.variante?.sku && (
                  <p className="text-xs text-tin">{item.variante.sku}</p>
                )}
                <p className="text-xs text-tin-dark mt-0.5">
                  {item.cantidad} × S/ {fmt(item.costoUnitario)}
                </p>
              </div>
              <p className="font-semibold text-gray-800">S/ {fmt(item.subtotal)}</p>
            </div>
          ))}
          <div className="px-4 py-3 flex justify-between items-center bg-tin-pale/70">
            <span className="font-semibold text-gray-800">Total</span>
            <span className="font-bold text-gray-900">S/ {fmt(compra.total)}</span>
          </div>
        </div>

        {items.length === 0 && (
          <p className="text-sm text-tin text-center py-8">Sin artículos</p>
        )}
      </div>

      {/* ── Slide-over pagos ── */}
      <PagosSlideOver
        open={pagosOpen}
        onClose={() => setPagosOpen(false)}
        ordenId={compra.id}
        pagos={pagos}
        totalOrden={total}
        isPending={compra.estado === 'PENDIENTE' && !recibido}
      />
    </div>
  )
}
