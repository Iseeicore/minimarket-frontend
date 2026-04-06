import { useState, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { Plus, ShoppingCart, Trash2, Search, X, PackagePlus } from 'lucide-react'
import { useCompras, useCreateCompra, useDeleteCompra } from '../hooks/useCompras'
import Pagination from '../components/shared/Pagination'
import { useAlmacenes } from '../hooks/useAlmacenes'
import { useContactos } from '../hooks/useContactos'
import Modal from '../components/shared/Modal'
import ConfirmDialog from '../components/shared/ConfirmDialog'
import EmptyState from '../components/shared/EmptyState'
import { useQueryClient } from '@tanstack/react-query'
import { qk } from '../lib/query-keys'
import { comprasService } from '../services/compras.service'
import { variantesService } from '../services/productos.service'
import type { EstadoCompra, CreateItemCompraDto } from '../types'

// ── Helpers visuales ─────────────────────────────────────────
const estadoBadge: Record<EstadoCompra, string> = {
  PENDIENTE: 'bg-amber-50 text-amber-700',
  PARCIAL:   'bg-accent/20 text-accent-dark',
  PAGADO:    'bg-primary-pale text-primary-dark',
}

function formatFecha(iso: string) {
  return new Date(iso).toLocaleDateString('es-PE', { day: '2-digit', month: '2-digit', year: 'numeric' })
}

// ── Tipo interno del ítem en el formulario ────────────────────
interface ItemForm extends CreateItemCompraDto {
  varianteNombre: string
}

export default function ComprasPage() {
  const navigate    = useNavigate()
  const qc          = useQueryClient()

  // ── Paginación ──────────────────────────────────────────────
  const [page, setPage] = useState(1)
  const LIMIT           = 20

  // ── Queries y mutations ──────────────────────────────────────
  const { data: result, isLoading } = useCompras(page, LIMIT)
  const compras  = result?.data ?? []
  const meta     = result?.meta
  const { data: almacenes = [] }          = useAlmacenes()
  const { data: contactos = [] }          = useContactos()
  const createMutation                    = useCreateCompra()
  const deleteMutation                    = useDeleteCompra()

  // ── Estado del modal de nueva orden ─────────────────────────
  const [modalOpen, setModalOpen]   = useState(false)
  const [confirmId, setConfirmId]   = useState<number | null>(null)
  const [form, setForm]             = useState({ almacenId: 0, contactoId: 0, notas: '' })
  const [items, setItems]           = useState<ItemForm[]>([])

  // ── Estado del buscador de variantes en el form ──────────────
  const [varSearch, setVarSearch]   = useState('')
  const [varResults, setVarResults] = useState<Array<{ id: number; nombre: string; sku: string | null }>>([])
  const [searching, setSearching]   = useState(false)

  // Proveedores filtrados — solo PROVEEDOR o AMBOS
  const proveedores = useMemo(
    () => contactos.filter(c => c.tipo === 'PROVEEDOR' || c.tipo === 'AMBOS'),
    [contactos]
  )

  // Total calculado de los ítems del formulario
  const totalForm = useMemo(
    () => items.reduce((acc, i) => acc + i.costoUnitario * i.cantidad, 0),
    [items]
  )

  // ── Handlers modal ───────────────────────────────────────────
  const openCreate = () => {
    setForm({ almacenId: almacenes[0]?.id ?? 0, contactoId: 0, notas: '' })
    setItems([])
    setVarSearch('')
    setVarResults([])
    setModalOpen(true)
  }

  const closeModal = () => {
    setModalOpen(false)
    setItems([])
    setVarSearch('')
    setVarResults([])
  }

  // Busca variantes según término ingresado
  const handleSearchVar = async (q: string) => {
    setVarSearch(q)
    if (q.length < 2) { setVarResults([]); return }
    setSearching(true)
    try {
      const vars = await variantesService.getAll(q)
      setVarResults(vars.filter(v => v.activo).map(v => ({ id: v.id, nombre: v.nombre, sku: v.sku })))
    } finally {
      setSearching(false)
    }
  }

  // Agrega variante al listado de ítems
  const agregarItem = (v: { id: number; nombre: string; sku: string | null }) => {
    if (items.find(i => i.varianteId === v.id)) return
    setItems(prev => [...prev, { varianteId: v.id, varianteNombre: v.nombre, cantidad: 1, costoUnitario: 0 }])
    setVarSearch('')
    setVarResults([])
  }

  const quitarItem = (varianteId: number) =>
    setItems(prev => prev.filter(i => i.varianteId !== varianteId))

  const updateItem = (varianteId: number, field: 'cantidad' | 'costoUnitario', val: number) =>
    setItems(prev => prev.map(i => i.varianteId === varianteId ? { ...i, [field]: val } : i))

  // ── Submit nueva orden ────────────────────────────────────────
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (items.length === 0) return
    await createMutation.mutateAsync({
      almacenId:  form.almacenId,
      contactoId: form.contactoId || undefined,
      notas:      form.notas || undefined,
      items:      items.map(({ varianteId, cantidad, costoUnitario }) => ({ varianteId, cantidad, costoUnitario })),
    })
    closeModal()
  }

  // Prefetch detalle al hover para navegación instantánea
  const handleRowHover = (id: number) => {
    qc.prefetchQuery({ queryKey: qk.compras.detail(id), queryFn: () => comprasService.getOne(id), staleTime: 1000 * 30 })
  }

  // ── Skeleton loader ──────────────────────────────────────────
  if (isLoading) {
    return (
      <div>
        <div className="flex items-center justify-between mb-6">
          <div className="h-8 w-36 bg-slate-200 rounded animate-pulse" />
          <div className="h-9 w-40 bg-slate-200 rounded-lg animate-pulse" />
        </div>
        <div className="bg-white rounded-xl border divide-y">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="flex gap-4 px-4 py-3 animate-pulse">
              <div className="h-4 bg-slate-200 rounded w-1/6" />
              <div className="h-4 bg-slate-200 rounded w-1/4" />
              <div className="h-4 bg-slate-200 rounded w-1/5" />
              <div className="h-4 bg-slate-200 rounded w-1/6" />
            </div>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div>
      {/* ── Cabecera ── */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-2">
          <ShoppingCart size={22} className="text-tin-dark" />
          <h1 className="text-2xl font-bold text-slate-900">Compras</h1>
        </div>
        <button
          onClick={openCreate}
          className="flex items-center gap-2 bg-primary hover:bg-primary-dark active:scale-95
            text-slate-900 font-medium px-4 py-2.5 rounded-lg text-sm transition-all duration-150"
        >
          <Plus size={16} /> Nueva orden
        </button>
      </div>

      {/* ── Lista ── */}
      {compras.length === 0 ? (
        <EmptyState message="No hay órdenes de compra" action={
          <button onClick={openCreate} className="text-accent-dark text-sm hover:underline">Crear la primera</button>
        } />
      ) : (
        <>
          {/* Tabla desktop */}
          <div className="hidden md:block bg-white rounded-xl shadow-sm border overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-tin-pale border-b">
                <tr>
                  <th className="text-left px-4 py-3 text-tin-dark font-medium">#</th>
                  <th className="text-left px-4 py-3 text-tin-dark font-medium">Proveedor</th>
                  <th className="text-left px-4 py-3 text-tin-dark font-medium">Estado</th>
                  <th className="text-right px-4 py-3 text-tin-dark font-medium">Total</th>
                  <th className="text-left px-4 py-3 text-tin-dark font-medium">Fecha</th>
                  <th className="px-4 py-3 w-12" />
                </tr>
              </thead>
              <tbody>
                {compras.map(c => (
                  <tr
                    key={c.id}
                    onMouseEnter={() => handleRowHover(c.id)}
                    onClick={() => navigate(`/compras/${c.id}`)}
                    className="border-b last:border-0 hover:bg-tin-pale/50 cursor-pointer transition-colors duration-100"
                  >
                    <td className="px-4 py-3 text-tin-dark font-mono">#{c.id}</td>
                    <td className="px-4 py-3 text-slate-700">{c.contacto?.nombre ?? <span className="text-tin text-xs">Sin proveedor</span>}</td>
                    <td className="px-4 py-3">
                      <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${estadoBadge[c.estado]}`}>
                        {c.estado}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right font-semibold text-slate-800 tabular-nums">
                      S/ {parseFloat(c.total).toFixed(2)}
                    </td>
                    <td className="px-4 py-3 text-tin-dark">{formatFecha(c.creadoEn)}</td>
                    <td className="px-4 py-3" onClick={e => e.stopPropagation()}>
                      {/* Solo se puede eliminar si está PENDIENTE */}
                      {c.estado === 'PENDIENTE' && (
                        <button
                          onClick={() => setConfirmId(c.id)}
                          className="p-1.5 rounded-lg text-tin hover:text-red-500 hover:bg-red-50 transition-colors duration-150"
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

          {/* Cards mobile */}
          <div className="md:hidden space-y-3">
            {compras.map(c => (
              <div
                key={c.id}
                onClick={() => navigate(`/compras/${c.id}`)}
                className="bg-white rounded-xl border shadow-sm px-4 py-3 cursor-pointer active:scale-[0.99] transition-transform duration-100"
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs text-tin font-mono">#{c.id}</span>
                  <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${estadoBadge[c.estado]}`}>
                    {c.estado}
                  </span>
                </div>
                <p className="font-medium text-slate-800 text-sm">{c.contacto?.nombre ?? 'Sin proveedor'}</p>
                <div className="flex items-center justify-between mt-1">
                  <span className="text-xs text-tin-dark">{formatFecha(c.creadoEn)}</span>
                  <span className="font-semibold text-slate-800 tabular-nums">S/ {parseFloat(c.total).toFixed(2)}</span>
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

      {/* ── Modal nueva orden ── */}
      <Modal open={modalOpen} title="Nueva orden de compra" onClose={closeModal} size="lg">
        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Almacén + Proveedor */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Almacén <span className="text-red-400">*</span></label>
              <select
                value={form.almacenId}
                onChange={e => setForm({ ...form, almacenId: Number(e.target.value) })}
                className="w-full border border-tin/40 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-accent-mid"
                required
              >
                <option value={0}>Seleccionar</option>
                {almacenes.map(a => <option key={a.id} value={a.id}>{a.nombre}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Proveedor</label>
              <select
                value={form.contactoId}
                onChange={e => setForm({ ...form, contactoId: Number(e.target.value) })}
                className="w-full border border-tin/40 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-accent-mid"
              >
                <option value={0}>Sin proveedor</option>
                {proveedores.map(p => <option key={p.id} value={p.id}>{p.nombre}</option>)}
              </select>
            </div>
          </div>

          {/* Ítems */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Productos <span className="text-red-400">*</span>
            </label>

            {/* Buscador de variantes */}
            <div className="relative mb-3">
              <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-tin" />
              <input
                value={varSearch}
                onChange={e => handleSearchVar(e.target.value)}
                placeholder="Buscar variante por nombre o SKU…"
                className="w-full pl-9 border border-tin/40 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-accent-mid"
              />
              {/* Resultados */}
              {varResults.length > 0 && (
                <div className="absolute z-10 top-full left-0 right-0 bg-white border border-tin/30 rounded-lg shadow-lg mt-1 max-h-48 overflow-y-auto">
                  {varResults.map(v => (
                    <button
                      key={v.id}
                      type="button"
                      onClick={() => agregarItem(v)}
                      className="w-full flex items-center gap-2 px-4 py-2.5 text-sm text-left hover:bg-tin-pale transition-colors duration-100"
                    >
                      <PackagePlus size={14} className="text-tin shrink-0" />
                      <span className="font-medium text-slate-700">{v.nombre}</span>
                      {v.sku && <span className="text-xs text-tin ml-auto">{v.sku}</span>}
                    </button>
                  ))}
                </div>
              )}
              {searching && (
                <p className="absolute top-full left-0 mt-1 text-xs text-tin px-3">Buscando…</p>
              )}
            </div>

            {/* Tabla de ítems agregados */}
            {items.length === 0 ? (
              <p className="text-sm text-tin text-center py-4 border border-dashed border-tin/30 rounded-lg">
                Agregá al menos un producto
              </p>
            ) : (
              <div className="border border-tin/30 rounded-lg overflow-hidden">
                <table className="w-full text-sm">
                  <thead className="bg-tin-pale">
                    <tr>
                      <th className="text-left px-3 py-2 text-tin-dark font-medium">Producto</th>
                      <th className="text-center px-3 py-2 text-tin-dark font-medium w-24">Cant.</th>
                      <th className="text-center px-3 py-2 text-tin-dark font-medium w-28">Costo unit.</th>
                      <th className="w-8" />
                    </tr>
                  </thead>
                  <tbody>
                    {items.map(item => (
                      <tr key={item.varianteId} className="border-t border-tin/20">
                        <td className="px-3 py-2 text-slate-700 font-medium">{item.varianteNombre}</td>
                        <td className="px-3 py-2">
                          <input
                            type="number" min={1} value={item.cantidad}
                            onChange={e => updateItem(item.varianteId, 'cantidad', Number(e.target.value))}
                            className="w-full text-center border border-tin/40 rounded px-2 py-1 text-sm focus:outline-none focus:ring-1 focus:ring-accent-mid"
                          />
                        </td>
                        <td className="px-3 py-2">
                          <input
                            type="number" min={0} step="0.01" value={item.costoUnitario}
                            onChange={e => updateItem(item.varianteId, 'costoUnitario', Number(e.target.value))}
                            className="w-full text-center border border-tin/40 rounded px-2 py-1 text-sm focus:outline-none focus:ring-1 focus:ring-accent-mid"
                          />
                        </td>
                        <td className="px-2 py-2">
                          <button type="button" onClick={() => quitarItem(item.varianteId)}
                            className="text-tin hover:text-red-500 transition-colors duration-150 p-1">
                            <X size={14} />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                <div className="flex justify-end px-3 py-2 bg-tin-pale/50 border-t border-tin/20">
                  <span className="text-sm font-semibold text-slate-800 tabular-nums">
                    Total: S/ {totalForm.toFixed(2)}
                  </span>
                </div>
              </div>
            )}
          </div>

          {/* Notas */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Notas</label>
            <input
              value={form.notas}
              onChange={e => setForm({ ...form, notas: e.target.value })}
              placeholder="Observaciones opcionales…"
              className="w-full border border-tin/40 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-accent-mid"
            />
          </div>

          <div className="flex gap-3 justify-end pt-2">
            <button type="button" onClick={closeModal}
              className="px-4 py-2 text-sm text-tin-dark border border-tin/40 rounded-lg hover:bg-tin-pale transition-colors duration-150">
              Cancelar
            </button>
            <button
              type="submit"
              disabled={createMutation.isPending || items.length === 0 || form.almacenId === 0}
              className="px-4 py-2 text-sm font-medium text-slate-900 bg-primary hover:bg-primary-dark
                rounded-lg active:scale-95 transition-all duration-150 disabled:opacity-50"
            >
              {createMutation.isPending ? 'Creando…' : 'Crear orden'}
            </button>
          </div>
        </form>
      </Modal>

      <ConfirmDialog
        open={!!confirmId}
        title="Eliminar orden"
        description="¿Estás seguro? Solo se puede eliminar si la orden no fue recibida."
        onConfirm={async () => { if (confirmId) { await deleteMutation.mutateAsync(confirmId); setConfirmId(null) } }}
        onCancel={() => setConfirmId(null)}
        loading={deleteMutation.isPending}
      />
    </div>
  )
}
