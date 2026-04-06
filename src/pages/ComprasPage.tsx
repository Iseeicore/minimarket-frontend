import { useState, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Plus, ShoppingCart, Trash2, Search, X,
  PackagePlus, Warehouse, ChevronLeft, ChevronRight, Loader2,
} from 'lucide-react'
import { useCompras, useCreateCompra, useDeleteCompra } from '../hooks/useCompras'
import Pagination from '../components/shared/Pagination'
import { useAlmacenes } from '../hooks/useAlmacenes'
import { useContactos } from '../hooks/useContactos'
import Modal from '../components/shared/Modal'
import ConfirmDialog from '../components/shared/ConfirmDialog'
import EmptyState from '../components/shared/EmptyState'
import { useAuthStore } from '../store/auth.store'
import { useQueryClient } from '@tanstack/react-query'
import { qk } from '../lib/query-keys'
import { comprasService } from '../services/compras.service'
import { variantesService } from '../services/productos.service'
import type { EstadoCompra } from '../types'

// ── Helpers ─────────────────────────────────────────────────────────────────
const estadoBadge: Record<EstadoCompra, string> = {
  PENDIENTE: 'bg-amber-50 text-amber-700 border border-amber-200',
  PARCIAL:   'bg-accent/20 text-accent-dark border border-accent/40',
  PAGADO:    'bg-primary-pale text-primary-dark border border-primary/30',
}

const estadoLabel: Record<EstadoCompra, string> = {
  PENDIENTE: 'Pendiente',
  PARCIAL:   'Parcial',
  PAGADO:    'Pagado',
}

function formatFecha(iso: string) {
  return new Date(iso).toLocaleDateString('es-PE', { day: '2-digit', month: '2-digit', year: 'numeric' })
}

// ── Item del formulario — strings para inputs numéricos ─────────────────────
interface ItemForm {
  varianteId:    number
  varianteNombre: string
  cantidad:      string   // string → no "0 pegado"
  costoUnitario: string   // string → no "0 pegado"
}

// Límite de ítems por página dentro del formulario
const ITEMS_PER_PAGE = 5

// ── Componente ───────────────────────────────────────────────────────────────
export default function ComprasPage() {
  const navigate    = useNavigate()
  const qc          = useQueryClient()

  const usuario     = useAuthStore(s => s.usuario)
  const isAdminUser = useAuthStore(s => s.isAdmin())

  // Paginación de la lista de compras
  const [page, setPage] = useState(1)
  const LIMIT           = 20

  // Queries
  const { data: result, isLoading } = useCompras(page, LIMIT)
  const compras    = result?.data ?? []
  const meta       = result?.meta
  const { data: almacenes = [] }  = useAlmacenes()
  const { data: contactos = [] }  = useContactos()
  const createMutation            = useCreateCompra()
  const deleteMutation            = useDeleteCompra()

  // Estado del modal
  const [modalOpen, setModalOpen]   = useState(false)
  const [confirmId, setConfirmId]   = useState<number | null>(null)
  const [form, setForm]             = useState({ almacenId: 0, contactoId: 0, notas: '' })
  const [items, setItems]           = useState<ItemForm[]>([])
  const [errors, setErrors]         = useState<string[]>([])  // mensajes de error del submit

  // Paginación de ítems dentro del modal
  const [itemPage, setItemPage]     = useState(1)
  const totalItemPages              = Math.max(1, Math.ceil(items.length / ITEMS_PER_PAGE))
  const safePage                    = Math.min(itemPage, totalItemPages)
  const itemsVisible                = items.slice((safePage - 1) * ITEMS_PER_PAGE, safePage * ITEMS_PER_PAGE)

  // Buscador de variantes
  const [varSearch, setVarSearch]   = useState('')
  const [varResults, setVarResults] = useState<Array<{ id: number; nombre: string; sku: string | null }>>([])
  const [searching, setSearching]   = useState(false)

  // Solo proveedores
  const proveedores = useMemo(
    () => contactos.filter(c => c.tipo === 'PROVEEDOR' || c.tipo === 'AMBOS'),
    [contactos]
  )

  // Total calculado
  const totalForm = useMemo(
    () => items.reduce((acc, i) => {
      const costo = parseFloat(i.costoUnitario) || 0
      const cant  = parseInt(i.cantidad, 10)    || 0
      return acc + costo * cant
    }, 0),
    [items]
  )

  // ── Handlers del modal ────────────────────────────────────────────────────
  const openCreate = () => {
    // Admin elige almacén; rol con almacén asignado usa el propio
    const almacenId = isAdminUser
      ? (almacenes[0]?.id ?? 0)
      : (usuario?.almacenId ?? 0)

    setForm({ almacenId, contactoId: 0, notas: '' })
    setItems([])
    setErrors([])
    setItemPage(1)
    setVarSearch('')
    setVarResults([])
    setModalOpen(true)
  }

  const closeModal = () => {
    setModalOpen(false)
    setItems([])
    setErrors([])
    setItemPage(1)
    setVarSearch('')
    setVarResults([])
  }

  const handleSearchVar = async (q: string) => {
    setVarSearch(q)
    if (q.length < 2) { setVarResults([]); return }
    setSearching(true)
    try {
      const vars = await variantesService.getAll(q)
      setVarResults(vars.filter(v => v.activo).map(v => ({ id: v.id, nombre: v.nombre, sku: v.sku })))
    } finally { setSearching(false) }
  }

  const agregarItem = (v: { id: number; nombre: string; sku: string | null }) => {
    if (items.find(i => i.varianteId === v.id)) return
    const newItems = [...items, { varianteId: v.id, varianteNombre: v.nombre, cantidad: '1', costoUnitario: '' }]
    setItems(newItems)
    // Ir a la última página para ver el ítem recién agregado
    setItemPage(Math.ceil(newItems.length / ITEMS_PER_PAGE))
    setVarSearch('')
    setVarResults([])
  }

  const quitarItem = (varianteId: number) => {
    const newItems = items.filter(i => i.varianteId !== varianteId)
    setItems(newItems)
    const newTotal = Math.ceil(newItems.length / ITEMS_PER_PAGE)
    if (itemPage > newTotal) setItemPage(Math.max(1, newTotal))
  }

  const updateItem = (varianteId: number, field: 'cantidad' | 'costoUnitario', val: string) => {
    if (field === 'cantidad') {
      // Solo enteros positivos
      if (val !== '' && !/^\d+$/.test(val)) return
    } else {
      // Decimales: dígitos y hasta un punto
      const normalized = val.replace(',', '.')
      if (val !== '' && !/^(\d+\.?\d*|\.\d*)$/.test(normalized)) return
      setItems(prev => prev.map(i => i.varianteId === varianteId ? { ...i, [field]: normalized } : i))
      return
    }
    setItems(prev => prev.map(i => i.varianteId === varianteId ? { ...i, [field]: val } : i))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    const errs: string[] = []
    if (!form.almacenId)  errs.push('Seleccioná un almacén')
    if (items.length === 0) errs.push('Agregá al menos un producto')
    const itemsInvalidos = items.filter(i => !parseInt(i.cantidad, 10))
    if (itemsInvalidos.length) errs.push('Todos los ítems deben tener cantidad válida')
    if (errs.length) { setErrors(errs); return }

    await createMutation.mutateAsync({
      almacenId:  form.almacenId,
      contactoId: form.contactoId || undefined,
      notas:      form.notas || undefined,
      items: items.map(({ varianteId, cantidad, costoUnitario }) => ({
        varianteId,
        cantidad:      parseInt(cantidad, 10) || 1,
        costoUnitario: parseFloat(costoUnitario) || 0,
      })),
    })
    closeModal()
  }

  // Prefetch detalle al hover
  const handleRowHover = (id: number) => {
    qc.prefetchQuery({
      queryKey: qk.compras.detail(id),
      queryFn:  () => comprasService.getOne(id),
      staleTime: 30_000,
    })
  }

  // ── Nombre del almacén del usuario ────────────────────────────────────────
  const almacenUsuario = almacenes.find(a => a.id === (usuario?.almacenId ?? 0))

  // ── Skeleton ──────────────────────────────────────────────────────────────
  if (isLoading) {
    return (
      <div className="space-y-5">
        <div className="flex items-center justify-between">
          <div className="h-8 w-36 bg-tin-pale rounded-xl animate-pulse" />
          <div className="h-10 w-40 bg-tin-pale rounded-xl animate-pulse" />
        </div>
        <div className="bg-white rounded-2xl border border-tin/20 divide-y">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="flex gap-4 px-5 py-4 animate-pulse">
              <div className="h-4 bg-tin-pale rounded w-12" />
              <div className="h-4 bg-tin-pale rounded w-1/4" />
              <div className="h-4 bg-tin-pale rounded w-16" />
              <div className="h-4 bg-tin-pale rounded w-20 ml-auto" />
            </div>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-5">

      {/* ── Header ──────────────────────────────────────────────────────── */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-primary/15 flex items-center justify-center">
            <ShoppingCart size={20} className="text-primary-dark" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-800">Compras</h1>
            {meta && (
              <p className="text-sm text-tin-dark mt-0.5">{meta.total} orden{meta.total !== 1 ? 'es' : ''}</p>
            )}
          </div>
        </div>
        <button
          onClick={openCreate}
          className="flex items-center gap-2 bg-primary hover:bg-primary-dark text-white px-4 py-2.5 rounded-xl text-sm font-semibold transition-all duration-150 active:scale-95"
        >
          <Plus size={16} /> Nueva orden
        </button>
      </div>

      {/* ── Lista ───────────────────────────────────────────────────────── */}
      {compras.length === 0 ? (
        <EmptyState
          message="No hay órdenes de compra"
          action={<button onClick={openCreate} className="text-primary-dark text-sm font-medium hover:underline">Crear la primera</button>}
        />
      ) : (
        <>
          {/* Desktop — tabla */}
          <div className="hidden md:block bg-white rounded-2xl border border-tin/20 shadow-sm overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-tin-pale border-b border-tin/20">
                <tr>
                  <th className="text-left px-5 py-3.5 text-tin-dark font-medium">#</th>
                  <th className="text-left px-4 py-3.5 text-tin-dark font-medium">Proveedor</th>
                  <th className="text-left px-4 py-3.5 text-tin-dark font-medium hidden lg:table-cell">Almacén</th>
                  <th className="text-left px-4 py-3.5 text-tin-dark font-medium">Estado</th>
                  <th className="text-right px-4 py-3.5 text-tin-dark font-medium">Total</th>
                  <th className="text-left px-4 py-3.5 text-tin-dark font-medium">Fecha</th>
                  <th className="px-4 py-3.5 w-12" />
                </tr>
              </thead>
              <tbody>
                {compras.map(c => (
                  <tr
                    key={c.id}
                    onMouseEnter={() => handleRowHover(c.id)}
                    onClick={() => navigate(`/compras/${c.id}`)}
                    className="border-b border-tin/10 last:border-0 hover:bg-tin-pale/40 cursor-pointer transition-colors"
                  >
                    <td className="px-5 py-3.5 text-tin font-mono text-xs">#{c.id}</td>
                    <td className="px-4 py-3.5 font-medium text-gray-800">
                      {c.contacto?.nombre ?? <span className="text-tin text-xs italic">Sin proveedor</span>}
                    </td>
                    <td className="px-4 py-3.5 text-tin-dark hidden lg:table-cell text-xs">
                      {(c as any).almacen?.nombre ?? '—'}
                    </td>
                    <td className="px-4 py-3.5">
                      <span className={`text-xs font-medium px-2.5 py-1 rounded-full ${estadoBadge[c.estado]}`}>
                        {estadoLabel[c.estado]}
                      </span>
                    </td>
                    <td className="px-4 py-3.5 text-right font-semibold text-gray-800 tabular-nums">
                      S/ {parseFloat(c.total).toFixed(2)}
                    </td>
                    <td className="px-4 py-3.5 text-tin-dark">{formatFecha(c.creadoEn)}</td>
                    <td className="px-4 py-3.5" onClick={e => e.stopPropagation()}>
                      {c.estado === 'PENDIENTE' && (
                        <button
                          onClick={() => setConfirmId(c.id)}
                          className="p-1.5 rounded-lg text-tin hover:text-red-500 hover:bg-red-50 transition-colors"
                        >
                          <Trash2 size={15} />
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Mobile — cards */}
          <div className="md:hidden space-y-3">
            {compras.map(c => (
              <div
                key={c.id}
                onClick={() => navigate(`/compras/${c.id}`)}
                className="bg-white rounded-2xl border border-tin/20 shadow-sm px-4 py-4 cursor-pointer active:scale-[0.99] transition-all"
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs text-tin font-mono">#{c.id}</span>
                  <span className={`text-xs font-medium px-2.5 py-0.5 rounded-full ${estadoBadge[c.estado]}`}>
                    {estadoLabel[c.estado]}
                  </span>
                </div>
                <p className="font-semibold text-gray-800 text-sm">{c.contacto?.nombre ?? 'Sin proveedor'}</p>
                <div className="flex items-center justify-between mt-2">
                  <span className="text-xs text-tin-dark">{formatFecha(c.creadoEn)}</span>
                  <span className="font-bold text-gray-800 tabular-nums">S/ {parseFloat(c.total).toFixed(2)}</span>
                </div>
              </div>
            ))}
          </div>

          {meta && (
            <Pagination
              page={page}
              totalPages={meta.totalPages}
              total={meta.total}
              limit={LIMIT}
              onPage={p => { setPage(p); window.scrollTo({ top: 0, behavior: 'smooth' }) }}
            />
          )}
        </>
      )}

      {/* ── Modal nueva orden ────────────────────────────────────────────── */}
      <Modal open={modalOpen} title="Nueva orden de compra" onClose={closeModal} size="xl">
        <form onSubmit={handleSubmit} className="space-y-6">

          {/* Almacén + Proveedor */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Almacén */}
            {isAdminUser ? (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Almacén *</label>
                <div className="relative">
                  <Warehouse size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-tin pointer-events-none" />
                  <select
                    value={form.almacenId}
                    onChange={e => setForm({ ...form, almacenId: Number(e.target.value) })}
                    className="w-full pl-8 border border-tin/30 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary"
                    required
                  >
                    <option value={0}>Seleccioná</option>
                    {almacenes.map(a => <option key={a.id} value={a.id}>{a.nombre}</option>)}
                  </select>
                </div>
              </div>
            ) : (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Almacén</label>
                <div className="flex items-center gap-2.5 bg-primary-pale border border-primary/20 rounded-xl px-3 py-2.5">
                  <Warehouse size={15} className="text-primary-dark shrink-0" />
                  <span className="text-sm font-medium text-gray-700">
                    {almacenUsuario?.nombre ?? 'Tu almacén'}
                  </span>
                </div>
              </div>
            )}

            {/* Proveedor */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Proveedor <span className="text-tin font-normal">(opcional)</span></label>
              <select
                value={form.contactoId}
                onChange={e => setForm({ ...form, contactoId: Number(e.target.value) })}
                className="w-full border border-tin/30 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary"
              >
                <option value={0}>Sin proveedor</option>
                {proveedores.map(p => <option key={p.id} value={p.id}>{p.nombre}</option>)}
              </select>
            </div>
          </div>

          {/* Buscador de productos */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              Productos *
              {items.length > 0 && (
                <span className="ml-2 text-xs font-normal text-tin-dark">
                  ({items.length} agregado{items.length !== 1 ? 's' : ''})
                </span>
              )}
            </label>

            <div className="relative">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-tin pointer-events-none" />
              {searching && <Loader2 size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-tin animate-spin" />}
              <input
                value={varSearch}
                onChange={e => handleSearchVar(e.target.value)}
                placeholder="Buscar producto por nombre o código interno…"
                className="w-full pl-8 pr-8 border border-tin/30 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary"
              />
              {/* Dropdown resultados */}
              {varResults.length > 0 && (
                <div className="absolute z-20 top-full left-0 right-0 bg-white border border-tin/30 rounded-xl shadow-lg mt-1.5 max-h-52 overflow-y-auto">
                  {varResults.map(v => (
                    <button
                      key={v.id}
                      type="button"
                      onClick={() => agregarItem(v)}
                      className="w-full flex items-center gap-3 px-4 py-3 text-sm text-left hover:bg-tin-pale transition-colors first:rounded-t-xl last:rounded-b-xl"
                    >
                      <PackagePlus size={14} className="text-primary-dark shrink-0" />
                      <span className="font-medium text-gray-700 flex-1">{v.nombre}</span>
                      {v.sku && (
                        <span className="text-xs text-tin bg-tin-pale px-2 py-0.5 rounded-full font-mono">
                          {v.sku}
                        </span>
                      )}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Tabla de ítems */}
          {items.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-8 border-2 border-dashed border-tin/20 rounded-xl">
              <ShoppingCart size={28} className="text-tin mb-2" />
              <p className="text-sm text-tin-dark">Buscá y agregá productos arriba</p>
            </div>
          ) : (
            <div className="border border-tin/20 rounded-2xl overflow-hidden">
              {/* Cabecera — solo sm+ */}
              <div className="hidden sm:grid grid-cols-[1fr_100px_120px_40px] gap-3 px-4 py-2.5 bg-tin-pale border-b border-tin/20">
                <span className="text-xs font-semibold text-tin-dark">Producto</span>
                <span className="text-xs font-semibold text-tin-dark text-center">Cantidad</span>
                <span className="text-xs font-semibold text-tin-dark text-center">Costo unit. (S/)</span>
                <span />
              </div>

              {/* Ítems (paginados) */}
              <div className="divide-y divide-tin/10">
                {itemsVisible.map((item, idx) => (
                  <div key={item.varianteId}>
                    {/* Desktop — fila en grid */}
                    <div className="hidden sm:grid grid-cols-[1fr_100px_120px_40px] gap-3 items-center px-4 py-3 hover:bg-tin-pale/30 transition-colors">
                      <div className="min-w-0">
                        <p className="text-sm font-medium text-gray-800 truncate">{item.varianteNombre}</p>
                        <p className="text-xs text-tin">Ítem {(safePage - 1) * ITEMS_PER_PAGE + idx + 1}</p>
                      </div>
                      <input
                        value={item.cantidad}
                        onChange={e => updateItem(item.varianteId, 'cantidad', e.target.value)}
                        inputMode="numeric"
                        placeholder="1"
                        className="text-center border border-tin/30 rounded-xl px-2 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary w-full"
                      />
                      <input
                        value={item.costoUnitario}
                        onChange={e => updateItem(item.varianteId, 'costoUnitario', e.target.value)}
                        inputMode="decimal"
                        placeholder="0.00"
                        className="text-center border border-tin/30 rounded-xl px-2 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary w-full"
                      />
                      <button
                        type="button"
                        onClick={() => quitarItem(item.varianteId)}
                        className="flex items-center justify-center p-1.5 rounded-lg text-tin hover:text-red-500 hover:bg-red-50 transition-colors"
                      >
                        <X size={14} />
                      </button>
                    </div>

                    {/* Mobile — card stacked */}
                    <div className="sm:hidden px-4 py-3 space-y-2">
                      <div className="flex items-center justify-between">
                        <div className="min-w-0 flex-1">
                          <p className="text-sm font-medium text-gray-800 truncate">{item.varianteNombre}</p>
                          <p className="text-xs text-tin">Ítem {(safePage - 1) * ITEMS_PER_PAGE + idx + 1}</p>
                        </div>
                        <button
                          type="button"
                          onClick={() => quitarItem(item.varianteId)}
                          className="p-1.5 ml-2 rounded-lg text-tin hover:text-red-500 hover:bg-red-50 transition-colors shrink-0"
                        >
                          <X size={14} />
                        </button>
                      </div>
                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <label className="block text-xs text-tin-dark mb-1">Cantidad</label>
                          <input
                            value={item.cantidad}
                            onChange={e => updateItem(item.varianteId, 'cantidad', e.target.value)}
                            inputMode="numeric"
                            placeholder="1"
                            className="w-full text-center border border-tin/30 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary"
                          />
                        </div>
                        <div>
                          <label className="block text-xs text-tin-dark mb-1">Costo unit. (S/)</label>
                          <input
                            value={item.costoUnitario}
                            onChange={e => updateItem(item.varianteId, 'costoUnitario', e.target.value)}
                            inputMode="decimal"
                            placeholder="0.00"
                            className="w-full text-center border border-tin/30 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary"
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Paginación de ítems */}
              {totalItemPages > 1 && (
                <div className="flex items-center justify-between px-4 py-2.5 border-t border-tin/20 bg-tin-pale/30">
                  <button
                    type="button"
                    disabled={safePage === 1}
                    onClick={() => setItemPage(p => p - 1)}
                    className="p-1.5 rounded-lg text-tin-dark hover:bg-white disabled:opacity-30 transition-colors"
                  >
                    <ChevronLeft size={15} />
                  </button>
                  <span className="text-xs text-tin-dark">
                    Página {safePage} de {totalItemPages}
                    <span className="text-tin ml-2">({items.length} productos)</span>
                  </span>
                  <button
                    type="button"
                    disabled={safePage === totalItemPages}
                    onClick={() => setItemPage(p => p + 1)}
                    className="p-1.5 rounded-lg text-tin-dark hover:bg-white disabled:opacity-30 transition-colors"
                  >
                    <ChevronRight size={15} />
                  </button>
                </div>
              )}

              {/* Total */}
              <div className="flex items-center justify-between px-4 py-3 bg-primary-pale/60 border-t border-primary/20">
                <span className="text-sm text-gray-700">
                  {items.length} producto{items.length !== 1 ? 's' : ''}
                </span>
                <div className="text-right">
                  <p className="text-xs text-tin-dark">Total estimado</p>
                  <p className="text-lg font-bold text-gray-800 tabular-nums">
                    S/ {totalForm.toFixed(2)}
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Notas */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              Notas <span className="text-tin font-normal">(opcional)</span>
            </label>
            <input
              value={form.notas}
              onChange={e => setForm({ ...form, notas: e.target.value })}
              placeholder="Ej: Entrega urgente, verificar vencimiento…"
              className="w-full border border-tin/30 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary"
            />
          </div>

          {/* Errores de submit */}
          {errors.length > 0 && (
            <div className="bg-red-50 border border-red-200 rounded-xl px-4 py-3 space-y-1">
              {errors.map(e => (
                <p key={e} className="text-sm text-red-600">{e}</p>
              ))}
            </div>
          )}

          {/* Acciones */}
          <div className="flex gap-3 justify-end pt-1">
            <button
              type="button"
              onClick={closeModal}
              className="px-4 py-2.5 text-sm text-gray-600 border border-tin/30 rounded-xl hover:bg-tin-pale transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={createMutation.isPending || items.length === 0 || form.almacenId === 0}
              className="px-5 py-2.5 text-sm font-semibold text-white bg-primary hover:bg-primary-dark rounded-xl transition-all duration-150 active:scale-95 disabled:opacity-50"
            >
              {createMutation.isPending
                ? 'Creando…'
                : `Crear orden${items.length > 0 ? ` · ${items.length} producto${items.length !== 1 ? 's' : ''}` : ''}`}
            </button>
          </div>
        </form>
      </Modal>

      <ConfirmDialog
        open={!!confirmId}
        title="Eliminar orden"
        description="¿Estás seguro? Solo se puede eliminar si la orden está pendiente."
        onConfirm={async () => { if (confirmId) { await deleteMutation.mutateAsync(confirmId); setConfirmId(null) } }}
        onCancel={() => setConfirmId(null)}
        loading={deleteMutation.isPending}
      />
    </div>
  )
}
