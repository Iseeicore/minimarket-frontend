import { useState } from 'react'
import { Plus, Pencil, Trash2, ChevronDown, ChevronRight, Tag } from 'lucide-react'
import { useProductos, useCreateProducto, useUpdateProducto, useDeleteProducto, useCreateVariante, useUpdateVariante } from '../hooks/useProductos'
import { useCategorias, useCreateCategoria } from '../hooks/useCategorias'
import { useUnidadesMedida } from '../hooks/useUnidadesMedida'
import Modal from '../components/shared/Modal'
import ConfirmDialog from '../components/shared/ConfirmDialog'
import EmptyState from '../components/shared/EmptyState'
import type { Producto, Variante, CreateVarianteDto } from '../types'

const emptyVarianteForm = (): Omit<CreateVarianteDto, 'productoId'> => ({
  unidadId: 0, nombre: '', sku: '', costoBase: 0, precioVenta: 0, stockMinimo: 0, activo: true,
})

export default function ProductosPage() {
  const { data: productos = [], isLoading } = useProductos()
  const { data: categorias = [] } = useCategorias()
  const { data: unidades = [] } = useUnidadesMedida()

  const createProducto = useCreateProducto()
  const updateProducto = useUpdateProducto()
  const deleteProducto = useDeleteProducto()
  const createVariante = useCreateVariante()
  const updateVariante = useUpdateVariante()
  const createCategoria = useCreateCategoria()

  // Estados producto
  const [modalOpen, setModalOpen] = useState(false)
  const [editing, setEditing] = useState<Producto | null>(null)
  const [confirmId, setConfirmId] = useState<number | null>(null)
  const [productoForm, setProductoForm] = useState({ nombre: '', categoriaId: 0, descripcion: '' })
  const [productoCreado, setProductoCreado] = useState<Producto | null>(null)

  // Estado inline categoría
  const [modalCatOpen, setModalCatOpen] = useState(false)
  const [catForm, setCatForm] = useState({ nombre: '', descripcion: '' })

  // Estado variante
  const [varianteForm, setVarianteForm] = useState(emptyVarianteForm())
  const [mostrarVariante, setMostrarVariante] = useState(false)
  const [editingVariante, setEditingVariante] = useState<Variante | null>(null)

  // Expandir producto en tabla
  const [expandedId, setExpandedId] = useState<number | null>(null)

  const openCreate = () => { setEditing(null); setProductoCreado(null); setProductoForm({ nombre: '', categoriaId: 0, descripcion: '' }); setMostrarVariante(false); setModalOpen(true) }
  const openEdit = (p: Producto) => { setEditing(p); setProductoCreado(null); setProductoForm({ nombre: p.nombre, categoriaId: p.categoriaId, descripcion: p.descripcion ?? '' }); setMostrarVariante(false); setModalOpen(true) }
  const closeModal = () => { setModalOpen(false); setEditing(null); setProductoCreado(null); setMostrarVariante(false); setEditingVariante(null) }

  const handleSubmitProducto = async (e: React.FormEvent) => {
    e.preventDefault()
    const data = { nombre: productoForm.nombre, categoriaId: productoForm.categoriaId, descripcion: productoForm.descripcion || undefined }
    if (editing) {
      await updateProducto.mutateAsync({ id: editing.id, data })
      closeModal()
    } else {
      const nuevo = await createProducto.mutateAsync(data)
      setProductoCreado(nuevo)
      setMostrarVariante(false)
    }
  }

  const handleSubmitVariante = async (e: React.FormEvent) => {
    e.preventDefault()
    const pId = productoCreado?.id ?? editing?.id
    if (!pId) return
    const data = { ...varianteForm, productoId: pId, sku: varianteForm.sku || undefined }
    if (editingVariante) {
      await updateVariante.mutateAsync({ id: editingVariante.id, data })
    } else {
      await createVariante.mutateAsync(data)
    }
    setVarianteForm(emptyVarianteForm())
    setEditingVariante(null)
  }

  const handleCrearCategoria = async (e: React.FormEvent) => {
    e.preventDefault()
    const nueva = await createCategoria.mutateAsync({ nombre: catForm.nombre, descripcion: catForm.descripcion || undefined })
    setProductoForm({ ...productoForm, categoriaId: nueva.id })
    setModalCatOpen(false)
    setCatForm({ nombre: '', descripcion: '' })
  }

  if (isLoading) return <div className="text-gray-400 text-sm">Cargando...</div>

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-800">Productos</h1>
        <button onClick={openCreate} className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg text-sm hover:bg-blue-700">
          <Plus size={16} /> Nuevo producto
        </button>
      </div>

      {productos.length === 0 ? (
        <EmptyState message="No hay productos" />
      ) : (
        <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b">
              <tr>
                <th className="w-8 px-4 py-3"></th>
                <th className="text-left px-4 py-3 text-gray-600 font-medium">Producto</th>
                <th className="text-left px-4 py-3 text-gray-600 font-medium">Categoría</th>
                <th className="text-left px-4 py-3 text-gray-600 font-medium">Variantes</th>
                <th className="px-4 py-3"></th>
              </tr>
            </thead>
            <tbody>
              {productos.map(p => (
                <>
                  <tr key={p.id} className="border-b hover:bg-gray-50">
                    <td className="px-4 py-3">
                      <button onClick={() => setExpandedId(expandedId === p.id ? null : p.id)} className="text-gray-400 hover:text-gray-600">
                        {expandedId === p.id ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
                      </button>
                    </td>
                    <td className="px-4 py-3 font-medium text-gray-800">{p.nombre}</td>
                    <td className="px-4 py-3">
                      <span className="flex items-center gap-1 text-gray-500"><Tag size={12} />{p.categoria?.nombre ?? '—'}</span>
                    </td>
                    <td className="px-4 py-3 text-gray-500">{p.variantes?.length ?? 0} variante(s)</td>
                    <td className="px-4 py-3">
                      <div className="flex gap-2 justify-end">
                        <button onClick={() => openEdit(p)} className="text-gray-400 hover:text-blue-600 p-1 rounded"><Pencil size={16} /></button>
                        <button onClick={() => setConfirmId(p.id)} className="text-gray-400 hover:text-red-600 p-1 rounded"><Trash2 size={16} /></button>
                      </div>
                    </td>
                  </tr>
                  {expandedId === p.id && p.variantes && p.variantes.length > 0 && (
                    <tr key={`${p.id}-variantes`} className="bg-blue-50/30">
                      <td colSpan={5} className="px-8 pb-3 pt-1">
                        <table className="w-full text-xs">
                          <thead>
                            <tr className="text-gray-500">
                              <th className="text-left py-1 font-medium">Variante</th>
                              <th className="text-left py-1 font-medium">SKU</th>
                              <th className="text-left py-1 font-medium">Unidad</th>
                              <th className="text-right py-1 font-medium">Costo</th>
                              <th className="text-right py-1 font-medium">Precio venta</th>
                              <th className="text-right py-1 font-medium">Stock mín.</th>
                            </tr>
                          </thead>
                          <tbody>
                            {p.variantes.map(v => (
                              <tr key={v.id} className="border-t border-blue-100">
                                <td className="py-1.5 font-medium text-gray-700">{v.nombre}</td>
                                <td className="py-1.5 text-gray-500">{v.sku ?? '—'}</td>
                                <td className="py-1.5 text-gray-500">{v.unidad?.abreviatura}</td>
                                <td className="py-1.5 text-right text-gray-500">S/ {Number(v.costoBase).toFixed(2)}</td>
                                <td className="py-1.5 text-right font-medium text-gray-700">S/ {Number(v.precioVenta).toFixed(2)}</td>
                                <td className="py-1.5 text-right text-gray-500">{v.stockMinimo}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </td>
                    </tr>
                  )}
                </>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Modal crear/editar producto */}
      <Modal open={modalOpen} title={editing ? 'Editar producto' : 'Nuevo producto'} onClose={closeModal} size="lg">
        <div className="space-y-6">
          {/* Formulario producto */}
          {!productoCreado && (
            <form onSubmit={handleSubmitProducto} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Nombre *</label>
                <input value={productoForm.nombre} onChange={e => setProductoForm({ ...productoForm, nombre: e.target.value })}
                  className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" required />
              </div>
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-sm font-medium text-gray-700">Categoría *</label>
                  <button type="button" onClick={() => setModalCatOpen(true)} className="text-xs text-blue-600 hover:underline">+ Nueva categoría</button>
                </div>
                <select value={productoForm.categoriaId} onChange={e => setProductoForm({ ...productoForm, categoriaId: Number(e.target.value) })}
                  className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" required>
                  <option value={0}>Seleccionar categoría</option>
                  {categorias.map(c => <option key={c.id} value={c.id}>{c.nombre}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Descripción</label>
                <input value={productoForm.descripcion} onChange={e => setProductoForm({ ...productoForm, descripcion: e.target.value })}
                  className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
              </div>
              <div className="flex gap-3 justify-between pt-2">
                <button type="button" onClick={closeModal} className="px-4 py-2 text-sm text-gray-600 border rounded-lg hover:bg-gray-50">Cancelar</button>
                <div className="flex gap-2">
                  {editing && (
                    <button type="submit" disabled={updateProducto.isPending}
                      className="px-4 py-2 text-sm text-white bg-blue-600 rounded-lg hover:bg-blue-700 disabled:opacity-50">
                      {updateProducto.isPending ? 'Guardando...' : 'Actualizar'}
                    </button>
                  )}
                  {!editing && (
                    <button type="submit" disabled={createProducto.isPending}
                      className="px-4 py-2 text-sm text-white bg-blue-600 rounded-lg hover:bg-blue-700 disabled:opacity-50">
                      {createProducto.isPending ? 'Guardando...' : 'Guardar y agregar variante →'}
                    </button>
                  )}
                </div>
              </div>
            </form>
          )}

          {/* Panel variante (aparece después de crear producto) */}
          {productoCreado && (
            <div className="border-t pt-4">
              <div className="flex items-center justify-between mb-3">
                <div>
                  <p className="text-sm text-green-600 font-medium">Producto "{productoCreado.nombre}" creado</p>
                  <p className="text-xs text-gray-500">Agregá una variante o cerrá este modal</p>
                </div>
                <button onClick={() => setMostrarVariante(!mostrarVariante)}
                  className="text-sm text-blue-600 hover:underline flex items-center gap-1">
                  {mostrarVariante ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
                  {mostrarVariante ? 'Ocultar' : 'Agregar variante'}
                </button>
              </div>

              {mostrarVariante && (
                <form onSubmit={handleSubmitVariante} className="grid grid-cols-2 gap-3 bg-gray-50 p-4 rounded-lg">
                  <div className="col-span-2">
                    <label className="block text-xs font-medium text-gray-700 mb-1">Nombre variante *</label>
                    <input placeholder="Ej: 1.5 LT" value={varianteForm.nombre} onChange={e => setVarianteForm({ ...varianteForm, nombre: e.target.value })}
                      className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" required />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">Unidad *</label>
                    <select value={varianteForm.unidadId} onChange={e => setVarianteForm({ ...varianteForm, unidadId: Number(e.target.value) })}
                      className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" required>
                      <option value={0}>Seleccionar</option>
                      {unidades.map(u => <option key={u.id} value={u.id}>{u.nombre} ({u.abreviatura})</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">SKU</label>
                    <input value={varianteForm.sku} onChange={e => setVarianteForm({ ...varianteForm, sku: e.target.value })}
                      className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">Costo base (S/) *</label>
                    <input type="number" step="0.01" min="0" value={varianteForm.costoBase} onChange={e => setVarianteForm({ ...varianteForm, costoBase: Number(e.target.value) })}
                      className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" required />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">Precio venta (S/) *</label>
                    <input type="number" step="0.01" min="0" value={varianteForm.precioVenta} onChange={e => setVarianteForm({ ...varianteForm, precioVenta: Number(e.target.value) })}
                      className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" required />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">Stock mínimo *</label>
                    <input type="number" min="0" value={varianteForm.stockMinimo} onChange={e => setVarianteForm({ ...varianteForm, stockMinimo: Number(e.target.value) })}
                      className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" required />
                  </div>
                  <div className="col-span-2 flex gap-3 justify-end">
                    <button type="button" onClick={closeModal} className="px-3 py-2 text-xs text-gray-600 border rounded-lg hover:bg-gray-50">Listo, cerrar</button>
                    <button type="submit" disabled={createVariante.isPending}
                      className="px-3 py-2 text-xs text-white bg-green-600 rounded-lg hover:bg-green-700 disabled:opacity-50">
                      {createVariante.isPending ? 'Guardando...' : '+ Agregar variante'}
                    </button>
                  </div>
                </form>
              )}

              {!mostrarVariante && (
                <button onClick={closeModal} className="text-sm text-gray-500 hover:text-gray-700 mt-2">Cerrar modal</button>
              )}
            </div>
          )}
        </div>
      </Modal>

      {/* Modal inline crear categoría */}
      <Modal open={modalCatOpen} title="Nueva categoría" onClose={() => setModalCatOpen(false)} size="sm">
        <form onSubmit={handleCrearCategoria} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Nombre *</label>
            <input value={catForm.nombre} onChange={e => setCatForm({ ...catForm, nombre: e.target.value })}
              className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" required />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Descripción</label>
            <input value={catForm.descripcion} onChange={e => setCatForm({ ...catForm, descripcion: e.target.value })}
              className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
          </div>
          <div className="flex gap-3 justify-end pt-2">
            <button type="button" onClick={() => setModalCatOpen(false)} className="px-4 py-2 text-sm text-gray-600 border rounded-lg hover:bg-gray-50">Cancelar</button>
            <button type="submit" disabled={createCategoria.isPending} className="px-4 py-2 text-sm text-white bg-blue-600 rounded-lg hover:bg-blue-700 disabled:opacity-50">
              {createCategoria.isPending ? 'Creando...' : 'Crear categoría'}
            </button>
          </div>
        </form>
      </Modal>

      <ConfirmDialog open={!!confirmId} title="Eliminar producto" description="¿Estás seguro? Se eliminarán todas sus variantes."
        onConfirm={async () => { if (confirmId) { await deleteProducto.mutateAsync(confirmId); setConfirmId(null) } }}
        onCancel={() => setConfirmId(null)} loading={deleteProducto.isPending} />
    </div>
  )
}
