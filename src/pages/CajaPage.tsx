import { useState, useEffect, type JSX } from 'react'
import { Wallet, Lock, Unlock, Plus, TrendingUp, TrendingDown, SlidersHorizontal, Loader2, ChevronDown } from 'lucide-react'
import {
  useCajas,
  useCajaActiva,
  useAbrirCaja,
  useCerrarCaja,
  useMovimientosCaja,
  useCrearMovimiento,
} from '../hooks/useCaja'
import { useAlmacenes } from '../hooks/useAlmacenes'
import { useAuthStore } from '../store/auth.store'
import Modal from '../components/shared/Modal'
import type { TipoMovCaja } from '../types'

// ── Helpers ────────────────────────────────────────────────────
function fmt(decimal: string | number) {
  return parseFloat(String(decimal)).toLocaleString('es-PE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
}

function formatFecha(iso: string) {
  return new Date(iso).toLocaleString('es-PE', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' })
}

const tipoIcon: Record<TipoMovCaja, JSX.Element> = {
  INGRESO: <TrendingUp  size={14} className="text-primary-dark" />,
  EGRESO:  <TrendingDown size={14} className="text-red-500" />,
  AJUSTE:  <SlidersHorizontal size={14} className="text-accent-dark" />,
}

const tipoColor: Record<TipoMovCaja, string> = {
  INGRESO: 'text-primary-dark',
  EGRESO:  'text-red-500',
  AJUSTE:  'text-accent-dark',
}

// ── Constante de persistencia ───────────────────────────────────
const LS_KEY = 'mm:caja:adminAlmacenId'

// ── Página ─────────────────────────────────────────────────────
export default function CajaPage() {
  const usuario      = useAuthStore(s => s.usuario)
  const isAdmin      = useAuthStore(s => s.isAdmin)
  const isAdminUser  = isAdmin()

  // Admin puede elegir cualquier almacén; almacenero usa el propio
  const { data: almacenes = [] }    = useAlmacenes()
  const { data: todasCajas = [] }   = useCajas()

  // Persistir almacén seleccionado en localStorage para que sobreviva la navegación
  const [adminAlmacenId, setAdminAlmacenId] = useState<number | null>(() => {
    const saved = localStorage.getItem(LS_KEY)
    return saved ? Number(saved) : null
  })

  const almacenId = isAdminUser ? adminAlmacenId : (usuario?.almacenId ?? null)

  function handleAlmacenChange(id: number | null) {
    setAdminAlmacenId(id)
    if (id) localStorage.setItem(LS_KEY, String(id))
    else localStorage.removeItem(LS_KEY)
  }

  // Auto-detectar caja abierta si admin no tiene almacén seleccionado
  useEffect(() => {
    if (!isAdminUser || adminAlmacenId) return
    const cajaAbierta = todasCajas.find(c => c.estado === 'ABIERTA')
    if (cajaAbierta) handleAlmacenChange(cajaAbierta.almacenId)
  }, [todasCajas, isAdminUser, adminAlmacenId])

  const { data: caja, isLoading }         = useCajaActiva(almacenId)
  const { data: movimientos = [] }         = useMovimientosCaja(caja?.id)
  const abrirMutation                      = useAbrirCaja()
  const cerrarMutation                     = useCerrarCaja()
  const crearMovMutation                   = useCrearMovimiento()

  // ── Modales ──────────────────────────────────────────────────
  const [cerrarModal, setCerrarModal]     = useState(false)
  const [movModal, setMovModal]           = useState(false)

  // ── Formularios ──────────────────────────────────────────────
  const [montoCierre, setMontoCierre]     = useState('')
  const [movForm, setMovForm]             = useState<{ tipo: TipoMovCaja; monto: string; descripcion: string }>({
    tipo: 'INGRESO', monto: '', descripcion: '',
  })

  // ── Abrir caja (siempre con montoApertura 0 — sin modal) ─────
  function handleAbrir() {
    if (!almacenId) return
    abrirMutation.mutate({ almacenId, montoApertura: 0 })
  }

  // ── Cerrar caja ──────────────────────────────────────────────
  function handleCerrar(e: React.FormEvent) {
    e.preventDefault()
    if (!caja) return
    cerrarMutation.mutate(
      { id: caja.id, data: { montoCierre: parseFloat(montoCierre) } },
      { onSuccess: () => { setCerrarModal(false); setMontoCierre('') } }
    )
  }

  // ── Movimiento manual ────────────────────────────────────────
  function handleMovimiento(e: React.FormEvent) {
    e.preventDefault()
    if (!caja) return
    crearMovMutation.mutate(
      {
        id: caja.id,
        data: {
          tipo: movForm.tipo,
          monto: parseFloat(movForm.monto),
          descripcion: movForm.descripcion.trim() || undefined,
        },
      },
      { onSuccess: () => { setMovModal(false); setMovForm({ tipo: 'INGRESO', monto: '', descripcion: '' }) } }
    )
  }

  // ── Loading ──────────────────────────────────────────────────
  if (isLoading) {
    return (
      <div className="flex justify-center items-center py-24">
        <Loader2 size={32} className="animate-spin text-tin" />
      </div>
    )
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">

      {/* ── Header ── */}
      <div className="flex flex-col sm:flex-row sm:items-center gap-3">
        <div className="flex-1 min-w-0">
          <h1 className="text-2xl font-bold text-gray-800">Caja</h1>
          {caja && (
            <p className="text-sm text-tin-dark mt-0.5">Abierta el {formatFecha(caja.abiertoEn)}</p>
          )}
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Selector de almacén — solo visible para admin */}
          {isAdmin() && (
            <div className="relative">
              <select
                value={adminAlmacenId ?? ''}
                onChange={e => handleAlmacenChange(e.target.value ? Number(e.target.value) : null)}
                className="appearance-none pl-3 pr-8 py-2 rounded-xl border border-tin/30 text-sm font-medium text-gray-700 bg-white hover:border-tin/60 focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary transition-colors cursor-pointer"
              >
                <option value="">Seleccionar almacén</option>
                {almacenes.map(a => (
                  <option key={a.id} value={a.id}>{a.nombre}</option>
                ))}
              </select>
              <ChevronDown size={14} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-tin pointer-events-none" />
            </div>
          )}

          {/* Mostrar botones solo si hay un almacén seleccionado */}
          {almacenId && (caja ? (
            <div className="flex gap-2">
              <button
                onClick={() => setMovModal(true)}
                className="flex items-center gap-1.5 px-3 py-2 min-h-[2.75rem] rounded-xl bg-accent/20 hover:bg-accent/30 text-accent-dark text-sm font-semibold transition-all duration-150 active:scale-95"
              >
                <Plus size={15} /> Movimiento
              </button>
              <button
                onClick={() => setCerrarModal(true)}
                className="flex items-center gap-1.5 px-3 py-2 min-h-[2.75rem] rounded-xl bg-red-50 hover:bg-red-100 text-red-600 text-sm font-semibold transition-all duration-150 active:scale-95"
              >
                <Lock size={15} /> Cerrar caja
              </button>
            </div>
          ) : (
            <button
              onClick={handleAbrir}
              disabled={abrirMutation.isPending}
              className="flex items-center gap-1.5 px-4 min-h-[2.75rem] rounded-xl bg-primary hover:bg-primary-dark text-gray-900 font-semibold text-sm transition-all duration-150 active:scale-95 disabled:opacity-50"
            >
              {abrirMutation.isPending ? <Loader2 size={15} className="animate-spin" /> : <Unlock size={15} />}
              {abrirMutation.isPending ? 'Abriendo...' : 'Abrir caja'}
            </button>
          ))}
        </div>
      </div>

      {/* ── Estado de caja ── */}
      {/* Sin almacén → distintos mensajes por rol */}
      {!almacenId ? (
        <div className="bg-white rounded-2xl border border-tin/20 shadow-sm flex flex-col items-center justify-center py-16 text-center px-6">
          <div className="w-14 h-14 rounded-2xl bg-tin-pale flex items-center justify-center mb-4">
            <Wallet size={28} className="text-tin" />
          </div>
          {isAdminUser ? (
            <>
              <h2 className="font-semibold text-gray-800 mb-1">Seleccioná un almacén</h2>
              <p className="text-sm text-tin-dark">
                Elegí un almacén en el selector de arriba para ver o gestionar su caja.
              </p>
            </>
          ) : (
            <>
              <h2 className="font-semibold text-gray-800 mb-1">Sin almacén asignado</h2>
              <p className="text-sm text-tin-dark">
                Tu usuario no tiene un almacén asignado. Contactá al administrador para que te asigne uno.
              </p>
            </>
          )}
        </div>
      ) : caja ? (
        <>
          {/* Panel resumen */}
          {(() => {
            const totalIngresos  = movimientos.filter(m => m.tipo === 'INGRESO').reduce((acc, m) => acc + parseFloat(m.monto), 0)
            const totalEgresos   = movimientos.filter(m => m.tipo === 'EGRESO').reduce((acc, m) => acc + parseFloat(m.monto), 0)
            const saldoEstimado  = parseFloat(String(caja.montoApertura)) + totalIngresos - totalEgresos
            return (
              <div className="bg-white rounded-2xl border border-tin/20 shadow-sm p-5 grid grid-cols-2 sm:grid-cols-4 gap-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-primary/15 flex items-center justify-center">
                    <Wallet size={20} className="text-primary-dark" />
                  </div>
                  <div>
                    <p className="text-xs text-tin-dark">Monto apertura</p>
                    <p className="text-lg font-bold text-gray-800">S/ {fmt(caja.montoApertura)}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-accent/15 flex items-center justify-center">
                    <Wallet size={20} className="text-accent-dark" />
                  </div>
                  <div>
                    <p className="text-xs text-tin-dark">Saldo estimado</p>
                    <p className="text-lg font-bold text-gray-800">S/ {fmt(saldoEstimado)}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                    <TrendingUp size={20} className="text-primary-dark" />
                  </div>
                  <div>
                    <p className="text-xs text-tin-dark">Total ingresos</p>
                    <p className="text-lg font-bold text-primary-dark">+S/ {fmt(totalIngresos)}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-red-50 flex items-center justify-center">
                    <TrendingDown size={20} className="text-red-500" />
                  </div>
                  <div>
                    <p className="text-xs text-tin-dark">Total egresos</p>
                    <p className="text-lg font-bold text-red-500">-S/ {fmt(totalEgresos)}</p>
                  </div>
                </div>
              </div>
            )
          })()}

          {/* Movimientos */}
          <div className="bg-white rounded-2xl border border-tin/20 shadow-sm overflow-hidden">
            <div className="px-5 py-4 border-b border-tin/20">
              <h2 className="font-semibold text-gray-800">Movimientos</h2>
            </div>

            {movimientos.length === 0 ? (
              <p className="text-sm text-tin text-center py-10">Sin movimientos aún</p>
            ) : (
              <div className="divide-y divide-tin/10">
                {movimientos.map(m => (
                  <div key={m.id} className="flex items-center justify-between px-5 py-3 hover:bg-tin-pale/40 transition-colors">
                    <div className="flex items-center gap-2.5">
                      <div className="w-7 h-7 rounded-lg bg-tin-pale flex items-center justify-center">
                        {tipoIcon[m.tipo]}
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-800">
                          {m.referenciaTipo ?? m.tipo}
                          {m.referenciaId && <span className="text-xs text-tin ml-1">#{m.referenciaId}</span>}
                        </p>
                        {m.descripcion && <p className="text-xs text-tin-dark">{m.descripcion}</p>}
                        <p className="text-xs text-tin">{formatFecha(m.creadoEn)}</p>
                      </div>
                    </div>
                    <p className={`font-semibold text-sm ${tipoColor[m.tipo]}`}>
                      {m.tipo === 'EGRESO' ? '-' : '+'}S/ {fmt(m.monto)}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </>
      ) : (
        /* Sin caja activa */
        <div className="bg-white rounded-2xl border border-tin/20 shadow-sm flex flex-col items-center justify-center py-16 text-center px-6">
          <div className="w-14 h-14 rounded-2xl bg-tin-pale flex items-center justify-center mb-4">
            <Lock size={28} className="text-tin" />
          </div>
          <h2 className="font-semibold text-gray-800 mb-1">Caja cerrada</h2>
          <p className="text-sm text-tin-dark mb-5">
            No hay una caja abierta para este almacén. Abrí la caja para registrar ventas.
          </p>
          <button
            onClick={handleAbrir}
            disabled={abrirMutation.isPending}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-primary hover:bg-primary-dark text-white font-semibold text-sm transition-all duration-150 active:scale-95 disabled:opacity-50"
          >
            {abrirMutation.isPending ? <Loader2 size={15} className="animate-spin" /> : <Unlock size={15} />}
            {abrirMutation.isPending ? 'Abriendo...' : 'Abrir caja'}
          </button>
        </div>
      )}


      {/* ── Modal cerrar caja ── */}
      <Modal open={cerrarModal} onClose={() => setCerrarModal(false)} title="Cerrar caja">
        <form onSubmit={handleCerrar} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Monto físico contado (S/)</label>
            <input
              type="number"
              min="0"
              step="0.01"
              value={montoCierre}
              onChange={e => setMontoCierre(e.target.value)}
              placeholder="0.00"
              className="w-full rounded-xl border border-tin/30 px-3 py-2.5 text-sm focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary"
              required
              autoFocus
            />
            <p className="text-xs text-tin-dark mt-1">Contá el efectivo físico antes de cerrar.</p>
          </div>
          <div className="flex gap-2 pt-1">
            <button
              type="button"
              onClick={() => setCerrarModal(false)}
              className="flex-1 py-2.5 rounded-xl border border-tin/30 text-sm font-medium text-gray-700 hover:bg-tin-pale transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={cerrarMutation.isPending}
              className="flex-1 py-2.5 rounded-xl bg-red-500 hover:bg-red-600 text-white font-semibold text-sm transition-all duration-150 active:scale-95 disabled:opacity-50"
            >
              {cerrarMutation.isPending ? 'Cerrando...' : 'Cerrar caja'}
            </button>
          </div>
        </form>
      </Modal>

      {/* ── Modal movimiento manual ── */}
      <Modal open={movModal} onClose={() => setMovModal(false)} title="Movimiento manual">
        <form onSubmit={handleMovimiento} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Tipo</label>
            <select
              value={movForm.tipo}
              onChange={e => setMovForm(f => ({ ...f, tipo: e.target.value as TipoMovCaja }))}
              className="w-full rounded-xl border border-tin/30 px-3 py-2.5 text-sm focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary"
            >
              <option value="INGRESO">Ingreso</option>
              <option value="EGRESO">Egreso</option>
              <option value="AJUSTE">Ajuste</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Monto (S/)</label>
            <input
              type="number"
              min="0.01"
              step="0.01"
              value={movForm.monto}
              onChange={e => setMovForm(f => ({ ...f, monto: e.target.value }))}
              placeholder="0.00"
              className="w-full rounded-xl border border-tin/30 px-3 py-2.5 text-sm focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Descripción (opcional)</label>
            <input
              type="text"
              value={movForm.descripcion}
              onChange={e => setMovForm(f => ({ ...f, descripcion: e.target.value }))}
              placeholder="Ej: pago de servicios"
              className="w-full rounded-xl border border-tin/30 px-3 py-2.5 text-sm focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary"
            />
          </div>
          <div className="flex gap-2 pt-1">
            <button
              type="button"
              onClick={() => setMovModal(false)}
              className="flex-1 py-2.5 rounded-xl border border-tin/30 text-sm font-medium text-gray-700 hover:bg-tin-pale transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={crearMovMutation.isPending}
              className="flex-1 py-2.5 rounded-xl bg-primary hover:bg-primary-dark text-white font-semibold text-sm transition-all duration-150 active:scale-95 disabled:opacity-50"
            >
              {crearMovMutation.isPending ? 'Guardando...' : 'Registrar'}
            </button>
          </div>
        </form>
      </Modal>

    </div>
  )
}
