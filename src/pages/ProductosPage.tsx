import { Fragment, useState } from 'react'
import {
  Plus, Pencil, Trash2, ChevronDown, ChevronRight,
  Tag, Package, Loader2, Layers,
} from 'lucide-react'
import {
  useProductos, useCreateProducto, useUpdateProducto,
  useDeleteProducto, useCreateVariante, useUpdateVariante,
} from '../hooks/useProductos'
import { useCategorias, useCreateCategoria } from '../hooks/useCategorias'
import { useUnidadesMedida } from '../hooks/useUnidadesMedida'
import Modal from '../components/shared/Modal'
import ConfirmDialog from '../components/shared/ConfirmDialog'
import EmptyState from '../components/shared/EmptyState'
import type { Producto, Variante } from '../types'

// ── Form state — strings para inputs numéricos (evita el "0 pegado") ───────
interface VarianteFormState {
  nombre: string
  unidadId: number
  codigoVariante: string   // SKU — renombrado para el usuario
  costoBase: string
  precioVenta: string
  stockMinimo: string
  activo: boolean
}

const emptyVarianteForm = (): VarianteFormState => ({
  nombre: '', unidadId: 0, codigoVariante: '',
  costoBase: '', precioVenta: '', stockMinimo: '', activo: true,
})

// ── Helpers ────────────────────────────────────────────────────────────────
function parseDecimal(v: string) { return parseFloat(v.replace(',', '.')) || 0 }
function parseInt_(v: string)    { return parseInt(v, 10) || 0 }

function fmt(v: string | number) {
  return parseFloat(String(v)).toLocaleString('es-PE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
}

// ── Validación ─────────────────────────────────────────────────────────────
function validarProducto(form: { nombre: string; categoriaId: number }) {
  const errs: Record<string, string> = {}
  if (!form.nombre.trim())   errs.nombre      = 'El nombre es obligatorio'
  if (!form.categoriaId)     errs.categoriaId  = 'Seleccioná una categoría'
  return errs
}

function validarVariante(form: VarianteFormState) {
  const errs: Record<string, string> = {}
  if (!form.nombre.trim())        errs.nombre      = 'El nombre es obligatorio'
  if (!form.unidadId)             errs.unidadId    = 'Seleccioná una unidad'
  if (parseDecimal(form.costoBase) < 0)   errs.costoBase   = 'Debe ser 0 o mayor'
  if (parseDecimal(form.precioVenta) <= 0) errs.precioVenta = 'El precio de venta debe ser mayor a 0'
  if (parseInt_(form.stockMinimo) < 0)    errs.stockMinimo = 'Debe ser 0 o mayor'
  return errs
}

// ── Componente ─────────────────────────────────────────────────────────────
export default function ProductosPage() {
  const { data: productos = [], isLoading } = useProductos()
  const { data: categorias = [] }           = useCategorias()
  const { data: unidades = [] }             = useUnidadesMedida()

  const createProducto  = useCreateProducto()
  const updateProducto  = useUpdateProducto()
  const deleteProducto  = useDeleteProducto()
  const createVariante  = useCreateVariante()
  const updateVariante  = useUpdateVariante()
  const createCategoria = useCreateCategoria()

  // ── Estados producto ───────────────────────────────────────────────────
  const [modalOpen, setModalOpen]         = useState(false)
  const [editing, setEditing]             = useState<Producto | null>(null)
  const [confirmId, setConfirmId]         = useState<number | null>(null)
  const [productoForm, setProductoForm]   = useState({ nombre: '', categoriaId: 0, descripcion: '' })
  const [productoErrors, setProductoErrors] = useState<Record<string, string>>({})
  const [productoCreado, setProductoCreado] = useState<Producto | null>(null)

  // ── Estado categoría inline ────────────────────────────────────────────
  const [modalCatOpen, setModalCatOpen]   = useState(false)
  const [catForm, setCatForm]             = useState({ nombre: '', descripcion: '' })

  // ── Estado variante ────────────────────────────────────────────────────
  const [varianteForm, setVarianteForm]       = useState(emptyVarianteForm())
  const [varianteErrors, setVarianteErrors]   = useState<Record<string, string>>({})
  const [mostrarVariante, setMostrarVariante] = useState(false)
  const [editingVariante, setEditingVariante] = useState<Variante | null>(null)

  // Expandir filas
  const [expandedId, setExpandedId]       = useState<number | null>(null)

  // ── Helpers de apertura ────────────────────────────────────────────────
  const openCreate = () => {
    setEditing(null); setProductoCreado(null)
    setProductoForm({ nombre: '', categoriaId: 0, descripcion: '' })
    setProductoErrors({})
    setMostrarVariante(false)
    setModalOpen(true)
  }

  const openEdit = (p: Producto) => {
    setEditing(p); setProductoCreado(null)
    setProductoForm({ nombre: p.nombre, categoriaId: p.categoriaId, descripcion: p.descripcion ?? '' })
    setProductoErrors({})
    setMostrarVariante(false)
    setModalOpen(true)
  }

  const closeModal = () => {
    setModalOpen(false); setEditing(null); setProductoCreado(null)
    setMostrarVariante(false); setEditingVariante(null)
    setProductoErrors({}); setVarianteErrors({})
  }

  const openEditVariante = (v: Variante) => {
    setEditingVariante(v)
    setVarianteForm({
      nombre: v.nombre, unidadId: v.unidadId,
      codigoVariante: v.sku ?? '',
      costoBase:   String(v.costoBase),
      precioVenta: String(v.precioVenta),
      stockMinimo: String(v.stockMinimo),
      activo: v.activo,
    })
    setVarianteErrors({})
    setMostrarVariante(true)
  }

  // ── Handlers ───────────────────────────────────────────────────────────
  const handleSubmitProducto = async (e: React.FormEvent) => {
    e.preventDefault()
    const errs = validarProducto(productoForm)
    if (Object.keys(errs).length) { setProductoErrors(errs); return }

    const data = {
      nombre:      productoForm.nombre.trim(),
      categoriaId: productoForm.categoriaId,
      descripcion: productoForm.descripcion.trim() || undefined,
    }

    if (editing) {
      await updateProducto.mutateAsync({ id: editing.id, data })
      closeModal()
    } else {
      const nuevo = await createProducto.mutateAsync(data)
      setProductoCreado(nuevo)
      setMostrarVariante(true)
    }
  }

  const handleSubmitVariante = async (e: React.FormEvent) => {
    e.preventDefault()
    const errs = validarVariante(varianteForm)
    if (Object.keys(errs).length) { setVarianteErrors(errs); return }

    const pId = productoCreado?.id ?? editing?.id
    if (!pId) return

    const data = {
      productoId:  pId,
      nombre:      varianteForm.nombre.trim(),
      unidadId:    varianteForm.unidadId,
      sku:         varianteForm.codigoVariante.trim() || undefined,
      costoBase:   parseDecimal(varianteForm.costoBase),
      precioVenta: parseDecimal(varianteForm.precioVenta),
      stockMinimo: parseInt_(varianteForm.stockMinimo),
      activo:      varianteForm.activo,
    }

    if (editingVariante) {
      await updateVariante.mutateAsync({ id: editingVariante.id, data })
    } else {
      await createVariante.mutateAsync(data)
    }
    setVarianteForm(emptyVarianteForm())
    setVarianteErrors({})
    setEditingVariante(null)
  }

  const handleCrearCategoria = async (e: React.FormEvent) => {
    e.preventDefault()
    const nueva = await createCategoria.mutateAsync({
      nombre: catForm.nombre,
      descripcion: catForm.descripcion || undefined,
    })
    setProductoForm({ ...productoForm, categoriaId: nueva.id })
    setModalCatOpen(false)
    setCatForm({ nombre: '', descripcion: '' })
  }

  // ── Clases compartidas ─────────────────────────────────────────────────
  const inputCls = (err?: string) =>
    `w-full rounded-xl border px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary transition-colors ${
      err ? 'border-red-400 bg-red-50' : 'border-tin/30'
    }`

  if (isLoading) {
    return (
      <div className="flex justify-center items-center py-24">
        <Loader2 size={32} className="animate-spin text-tin" />
      </div>
    )
  }

  return (
    <div>
      {/* ── Header ─────────────────────────────────────────────────────── */}
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-800">Productos</h1>
        <button
          onClick={openCreate}
          className="flex items-center gap-2 bg-primary hover:bg-primary-dark text-white px-4 py-2.5 rounded-xl text-sm font-semibold transition-all duration-150 active:scale-95"
        >
          <Plus size={16} /> Nuevo producto
        </button>
      </div>

      {/* ── Tabla ──────────────────────────────────────────────────────── */}
      {productos.length === 0 ? (
        <EmptyState message="No hay productos" />
      ) : (
        <div className="bg-white rounded-2xl shadow-sm border border-tin/20 overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-tin-pale border-b border-tin/20">
              <tr>
                <th className="w-8 px-4 py-3"></th>
                <th className="text-left px-4 py-3 text-tin-dark font-medium">Producto</th>
                <th className="text-left px-4 py-3 text-tin-dark font-medium">Categoría</th>
                <th className="text-left px-4 py-3 text-tin-dark font-medium">Subproductos</th>
                <th className="px-4 py-3"></th>
              </tr>
            </thead>
            <tbody>
              {productos.map(p => (
                <Fragment key={p.id}>
                  <tr className="border-b border-tin/10 hover:bg-tin-pale/40 transition-colors">
                    <td className="px-4 py-3">
                      <button
                        onClick={() => setExpandedId(expandedId === p.id ? null : p.id)}
                        className="text-tin hover:text-gray-600 transition-colors"
                      >
                        {expandedId === p.id
                          ? <ChevronDown size={16} />
                          : <ChevronRight size={16} />}
                      </button>
                    </td>
                    <td className="px-4 py-3 font-medium text-gray-800">{p.nombre}</td>
                    <td className="px-4 py-3">
                      <span className="flex items-center gap-1.5 text-tin-dark">
                        <Tag size={12} className="text-tin" />
                        {p.categoria?.nombre ?? '—'}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span className="flex items-center gap-1.5 text-tin-dark">
                        <Layers size={12} className="text-tin" />
                        {p.variantes?.length ?? 0}
                        {' '}<span className="text-tin text-xs">variante{(p.variantes?.length ?? 0) !== 1 ? 's' : ''}</span>
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex gap-1.5 justify-end">
                        <button
                          onClick={() => openEdit(p)}
                          className="text-tin hover:text-primary-dark p-1.5 rounded-lg hover:bg-primary-pale transition-colors"
                        >
                          <Pencil size={15} />
                        </button>
                        <button
                          onClick={() => setConfirmId(p.id)}
                          className="text-tin hover:text-red-500 p-1.5 rounded-lg hover:bg-red-50 transition-colors"
                        >
                          <Trash2 size={15} />
                        </button>
                      </div>
                    </td>
                  </tr>

                  {/* Variantes expandidas */}
                  {expandedId === p.id && (
                    <tr className="bg-primary-pale/30">
                      <td colSpan={5} className="px-6 py-3">
                        {(!p.variantes || p.variantes.length === 0) ? (
                          <p className="text-xs text-tin text-center py-2">Sin subproductos — editá el producto para agregarlos</p>
                        ) : (
                          <div className="space-y-1">
                            <p className="text-xs font-semibold text-tin-dark mb-2 flex items-center gap-1.5">
                              <Package size={12} /> Subproductos / Variantes
                            </p>
                            <table className="w-full text-xs">
                              <thead>
                                <tr className="text-tin">
                                  <th className="text-left py-1 font-medium">Nombre</th>
                                  <th className="text-left py-1 font-medium">Cód. variante</th>
                                  <th className="text-left py-1 font-medium">Unidad</th>
                                  <th className="text-right py-1 font-medium">Costo</th>
                                  <th className="text-right py-1 font-medium">Precio venta</th>
                                  <th className="text-right py-1 font-medium">Stock mín.</th>
                                  <th className="text-center py-1 font-medium">Estado</th>
                                </tr>
                              </thead>
                              <tbody>
                                {p.variantes.map(v => (
                                  <tr
                                    key={v.id}
                                    className="border-t border-primary/20 hover:bg-white/60 cursor-pointer transition-colors"
                                    onClick={() => { openEdit(p); openEditVariante(v) }}
                                  >
                                    <td className="py-2 font-medium text-gray-700">{v.nombre}</td>
                                    <td className="py-2 text-tin font-mono">{v.sku ?? <span className="text-tin/50 italic">—</span>}</td>
                                    <td className="py-2 text-tin-dark">{v.unidad?.abreviatura}</td>
                                    <td className="py-2 text-right text-tin-dark">S/ {fmt(v.costoBase)}</td>
                                    <td className="py-2 text-right font-semibold text-gray-700">S/ {fmt(v.precioVenta)}</td>
                                    <td className="py-2 text-right text-tin-dark">{v.stockMinimo}</td>
                                    <td className="py-2 text-center">
                                      <span className={`inline-block px-2 py-0.5 rounded-full text-xs font-medium ${
                                        v.activo
                                          ? 'bg-primary/20 text-primary-dark'
                                          : 'bg-tin-pale text-tin'
                                      }`}>
                                        {v.activo ? 'Activo' : 'Inactivo'}
                                      </span>
                                    </td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>
                        )}
                      </td>
                    </tr>
                  )}
                </Fragment>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* ── Modal crear/editar producto ─────────────────────────────────── */}
      <Modal open={modalOpen} title={editing ? 'Editar producto' : 'Nuevo producto'} onClose={closeModal} size="lg">
        <div className="space-y-6">

          {/* Formulario producto */}
          {!productoCreado && (
            <form onSubmit={handleSubmitProducto} className="space-y-4">

              {/* Nombre */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Nombre *</label>
                <input
                  value={productoForm.nombre}
                  onChange={e => { setProductoForm({ ...productoForm, nombre: e.target.value }); setProductoErrors({ ...productoErrors, nombre: '' }) }}
                  placeholder="Ej: Papas Lays"
                  className={inputCls(productoErrors.nombre)}
                  autoFocus
                />
                {productoErrors.nombre && <p className="text-xs text-red-500 mt-1">{productoErrors.nombre}</p>}
              </div>

              {/* Categoría */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-sm font-medium text-gray-700">Categoría *</label>
                  <button type="button" onClick={() => setModalCatOpen(true)} className="text-xs text-primary-dark hover:underline font-medium">
                    + Nueva categoría
                  </button>
                </div>
                <select
                  value={productoForm.categoriaId}
                  onChange={e => { setProductoForm({ ...productoForm, categoriaId: Number(e.target.value) }); setProductoErrors({ ...productoErrors, categoriaId: '' }) }}
                  className={inputCls(productoErrors.categoriaId)}
                >
                  <option value={0}>Seleccioná una categoría</option>
                  {categorias.map(c => <option key={c.id} value={c.id}>{c.nombre}</option>)}
                </select>
                {productoErrors.categoriaId && <p className="text-xs text-red-500 mt-1">{productoErrors.categoriaId}</p>}
              </div>

              {/* Descripción */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Descripción <span className="text-tin font-normal">(opcional)</span></label>
                <input
                  value={productoForm.descripcion}
                  onChange={e => setProductoForm({ ...productoForm, descripcion: e.target.value })}
                  placeholder="Descripción breve del producto"
                  className={inputCls()}
                />
              </div>

              <div className="flex gap-3 justify-between pt-2">
                <button type="button" onClick={closeModal} className="px-4 py-2.5 text-sm text-gray-600 border border-tin/30 rounded-xl hover:bg-tin-pale transition-colors">
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={editing ? updateProducto.isPending : createProducto.isPending}
                  className="px-4 py-2.5 text-sm text-white bg-primary hover:bg-primary-dark rounded-xl font-semibold transition-all duration-150 active:scale-95 disabled:opacity-50"
                >
                  {editing
                    ? (updateProducto.isPending ? 'Guardando...' : 'Actualizar')
                    : (createProducto.isPending ? 'Guardando...' : 'Guardar y agregar subproducto →')}
                </button>
              </div>
            </form>
          )}

          {/* Panel subproductos (aparece después de crear) */}
          {productoCreado && (
            <div>
              {/* Confirmación */}
              <div className="flex items-center gap-3 bg-primary-pale rounded-xl px-4 py-3 mb-4">
                <div className="w-8 h-8 rounded-lg bg-primary/30 flex items-center justify-center flex-shrink-0">
                  <Package size={16} className="text-primary-dark" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-gray-800">"{productoCreado.nombre}" creado</p>
                  <p className="text-xs text-tin-dark">Ahora podés agregar sus variantes / subproductos</p>
                </div>
                <button
                  onClick={closeModal}
                  className="text-xs text-tin hover:text-gray-700 font-medium whitespace-nowrap"
                >
                  Cerrar
                </button>
              </div>

              {/* Toggle */}
              <button
                type="button"
                onClick={() => { setMostrarVariante(!mostrarVariante); setVarianteErrors({}) }}
                className="flex items-center gap-2 text-sm font-semibold text-primary-dark hover:text-primary mb-3 transition-colors"
              >
                {mostrarVariante ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
                {mostrarVariante ? 'Ocultar formulario' : '+ Agregar subproducto'}
              </button>

              {mostrarVariante && <VarianteForm
                form={varianteForm}
                errors={varianteErrors}
                unidades={unidades}
                isEditing={!!editingVariante}
                isPending={createVariante.isPending || updateVariante.isPending}
                onChange={(field, val) => {
                  setVarianteForm(f => ({ ...f, [field]: val }))
                  setVarianteErrors(errs => ({ ...errs, [field]: '' }))
                }}
                onSubmit={handleSubmitVariante}
                onCancel={closeModal}
              />}
            </div>
          )}

          {/* Agregar variante a producto existente */}
          {editing && (
            <div className="border-t border-tin/20 pt-5">
              <button
                type="button"
                onClick={() => { setMostrarVariante(!mostrarVariante); setVarianteErrors({}); setEditingVariante(null); setVarianteForm(emptyVarianteForm()) }}
                className="flex items-center gap-2 text-sm font-semibold text-primary-dark hover:text-primary mb-3 transition-colors"
              >
                {mostrarVariante ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
                {mostrarVariante ? 'Ocultar' : (editingVariante ? 'Editar subproducto' : '+ Agregar subproducto')}
              </button>

              {mostrarVariante && <VarianteForm
                form={varianteForm}
                errors={varianteErrors}
                unidades={unidades}
                isEditing={!!editingVariante}
                isPending={createVariante.isPending || updateVariante.isPending}
                onChange={(field, val) => {
                  setVarianteForm(f => ({ ...f, [field]: val }))
                  setVarianteErrors(errs => ({ ...errs, [field]: '' }))
                }}
                onSubmit={handleSubmitVariante}
                onCancel={() => { setMostrarVariante(false); setEditingVariante(null); setVarianteForm(emptyVarianteForm()) }}
              />}
            </div>
          )}
        </div>
      </Modal>

      {/* ── Modal crear categoría ───────────────────────────────────────── */}
      <Modal open={modalCatOpen} title="Nueva categoría" onClose={() => setModalCatOpen(false)} size="sm">
        <form onSubmit={handleCrearCategoria} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Nombre *</label>
            <input
              value={catForm.nombre}
              onChange={e => setCatForm({ ...catForm, nombre: e.target.value })}
              className={inputCls()}
              required
              autoFocus
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Descripción <span className="text-tin font-normal">(opcional)</span></label>
            <input
              value={catForm.descripcion}
              onChange={e => setCatForm({ ...catForm, descripcion: e.target.value })}
              className={inputCls()}
            />
          </div>
          <div className="flex gap-3 justify-end pt-2">
            <button type="button" onClick={() => setModalCatOpen(false)} className="px-4 py-2.5 text-sm text-gray-600 border border-tin/30 rounded-xl hover:bg-tin-pale transition-colors">
              Cancelar
            </button>
            <button
              type="submit"
              disabled={createCategoria.isPending}
              className="px-4 py-2.5 text-sm text-white bg-primary hover:bg-primary-dark rounded-xl font-semibold transition-all disabled:opacity-50"
            >
              {createCategoria.isPending ? 'Creando...' : 'Crear categoría'}
            </button>
          </div>
        </form>
      </Modal>

      {/* ── ConfirmDialog eliminar ──────────────────────────────────────── */}
      <ConfirmDialog
        open={!!confirmId}
        title="Eliminar producto"
        description="¿Estás seguro? Se eliminarán también todos sus subproductos."
        onConfirm={async () => { if (confirmId) { await deleteProducto.mutateAsync(confirmId); setConfirmId(null) } }}
        onCancel={() => setConfirmId(null)}
        loading={deleteProducto.isPending}
      />
    </div>
  )
}

// ── Formulario de variante (subproducto) ────────────────────────────────────
interface VarianteFormProps {
  form: VarianteFormState
  errors: Record<string, string>
  unidades: { id: number; nombre: string; abreviatura: string }[]
  isEditing: boolean
  isPending: boolean
  onChange: (field: keyof VarianteFormState, val: string | number | boolean) => void
  onSubmit: (e: React.FormEvent) => void
  onCancel: () => void
}

function VarianteForm({ form, errors, unidades, isEditing, isPending, onChange, onSubmit, onCancel }: VarianteFormProps) {
  const inputCls = (err?: string) =>
    `w-full rounded-xl border px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary transition-colors ${
      err ? 'border-red-400 bg-red-50' : 'border-tin/30'
    }`

  // Handler para inputs numéricos: permite escribir libre (string), sin forzar formato
  const handleNumeric = (field: keyof VarianteFormState) =>
    (e: React.ChangeEvent<HTMLInputElement>) => {
      // Permite: dígitos, un punto, coma → reemplaza coma por punto
      const raw = e.target.value.replace(',', '.')
      if (raw === '' || /^(\d+\.?\d*|\.\d*)$/.test(raw)) onChange(field, raw)
    }

  const handleInt = (field: keyof VarianteFormState) =>
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const raw = e.target.value
      if (raw === '' || /^\d+$/.test(raw)) onChange(field, raw)
    }

  return (
    <form onSubmit={onSubmit} className="bg-tin-pale/50 border border-tin/20 rounded-2xl p-4 space-y-4">
      <p className="text-xs font-semibold text-tin-dark uppercase tracking-wide flex items-center gap-1.5">
        <Package size={12} /> Datos del subproducto
      </p>

      {/* Nombre variante */}
      <div>
        <label className="block text-xs font-medium text-gray-700 mb-1">Nombre del subproducto *</label>
        <input
          value={form.nombre}
          onChange={e => onChange('nombre', e.target.value)}
          placeholder="Ej: Jalapeño, Clásica, 1.5 LT"
          className={inputCls(errors.nombre)}
          autoFocus
        />
        {errors.nombre && <p className="text-xs text-red-500 mt-1">{errors.nombre}</p>}
      </div>

      <div className="grid grid-cols-2 gap-3">
        {/* Unidad de medida */}
        <div>
          <label className="block text-xs font-medium text-gray-700 mb-1">Unidad de medida *</label>
          <select
            value={form.unidadId}
            onChange={e => onChange('unidadId', Number(e.target.value))}
            className={inputCls(errors.unidadId)}
          >
            <option value={0}>Seleccioná</option>
            {unidades.map(u => <option key={u.id} value={u.id}>{u.nombre} ({u.abreviatura})</option>)}
          </select>
          {errors.unidadId && <p className="text-xs text-red-500 mt-1">{errors.unidadId}</p>}
        </div>

        {/* Código variante (SKU) */}
        <div>
          <label className="block text-xs font-medium text-gray-700 mb-1">
            Código variante
            <span className="text-tin font-normal ml-1">(interno, opcional)</span>
          </label>
          <input
            value={form.codigoVariante}
            onChange={e => onChange('codigoVariante', e.target.value)}
            placeholder="Ej: LAY-JAL-01"
            className={inputCls()}
          />
          <p className="text-xs text-tin mt-0.5">Código interno para identificar la variante</p>
        </div>

        {/* Costo base */}
        <div>
          <label className="block text-xs font-medium text-gray-700 mb-1">Costo (S/) *</label>
          <input
            value={form.costoBase}
            onChange={handleNumeric('costoBase')}
            placeholder="0.00"
            inputMode="decimal"
            className={inputCls(errors.costoBase)}
          />
          {errors.costoBase && <p className="text-xs text-red-500 mt-1">{errors.costoBase}</p>}
        </div>

        {/* Precio venta */}
        <div>
          <label className="block text-xs font-medium text-gray-700 mb-1">Precio de venta (S/) *</label>
          <input
            value={form.precioVenta}
            onChange={handleNumeric('precioVenta')}
            placeholder="0.00"
            inputMode="decimal"
            className={inputCls(errors.precioVenta)}
          />
          {errors.precioVenta && <p className="text-xs text-red-500 mt-1">{errors.precioVenta}</p>}
        </div>

        {/* Stock mínimo */}
        <div>
          <label className="block text-xs font-medium text-gray-700 mb-1">Stock mínimo *</label>
          <input
            value={form.stockMinimo}
            onChange={handleInt('stockMinimo')}
            placeholder="0"
            inputMode="numeric"
            className={inputCls(errors.stockMinimo)}
          />
          <p className="text-xs text-tin mt-0.5">Alerta cuando el stock baje de este número</p>
          {errors.stockMinimo && <p className="text-xs text-red-500 mt-1">{errors.stockMinimo}</p>}
        </div>

        {/* Activo */}
        <div className="flex items-center gap-3 pt-5">
          <label className="flex items-center gap-2 cursor-pointer select-none">
            <div
              role="checkbox"
              aria-checked={form.activo}
              tabIndex={0}
              onClick={() => onChange('activo', !form.activo)}
              onKeyDown={e => e.key === ' ' && onChange('activo', !form.activo)}
              className={`w-10 h-6 rounded-full transition-colors cursor-pointer ${form.activo ? 'bg-primary' : 'bg-tin/40'}`}
            >
              <div className={`w-4 h-4 rounded-full bg-white shadow mt-1 transition-transform ${form.activo ? 'translate-x-5' : 'translate-x-1'}`} />
            </div>
            <span className="text-xs font-medium text-gray-700">Activo</span>
          </label>
        </div>
      </div>

      {/* Acciones */}
      <div className="flex gap-3 justify-end pt-1">
        <button
          type="button"
          onClick={onCancel}
          className="px-3 py-2 text-xs text-gray-600 border border-tin/30 rounded-xl hover:bg-white transition-colors"
        >
          {isEditing ? 'Cancelar' : 'Listo, cerrar'}
        </button>
        <button
          type="submit"
          disabled={isPending}
          className="px-4 py-2 text-xs text-white bg-primary hover:bg-primary-dark rounded-xl font-semibold transition-all duration-150 active:scale-95 disabled:opacity-50"
        >
          {isPending ? 'Guardando...' : (isEditing ? 'Actualizar subproducto' : '+ Guardar subproducto')}
        </button>
      </div>
    </form>
  )
}
