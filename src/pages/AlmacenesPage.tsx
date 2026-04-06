import { useState } from 'react'
import { Plus, Pencil, Trash2, Warehouse, MapPin } from 'lucide-react'
import {
  useAlmacenes,
  useCreateAlmacen,
  useUpdateAlmacen,
  useDeleteAlmacen,
} from '../hooks/useAlmacenes'
import Modal from '../components/shared/Modal'
import ConfirmDialog from '../components/shared/ConfirmDialog'
import EmptyState from '../components/shared/EmptyState'
import type { Almacen } from '../types'

// Estado inicial limpio del formulario
const emptyForm = () => ({ nombre: '', direccion: '' })

export default function AlmacenesPage() {
  // ── Queries y mutations ──────────────────────────────────────
  const { data: almacenes = [], isLoading } = useAlmacenes()
  const createMutation = useCreateAlmacen()
  const updateMutation = useUpdateAlmacen()
  const deleteMutation = useDeleteAlmacen()

  // ── Estado local ─────────────────────────────────────────────
  const [modalOpen, setModalOpen] = useState(false)
  const [editing, setEditing] = useState<Almacen | null>(null)
  const [confirmId, setConfirmId] = useState<number | null>(null)
  const [form, setForm] = useState(emptyForm())

  // empresaId se deriva del primer almacén cargado — sistema de empresa única.
  // Si no hay almacenes aún, se usa 1 como fallback (ID de la empresa del seed).
  const empresaId = almacenes[0]?.empresaId ?? 1

  // ── Handlers de modal ────────────────────────────────────────
  const openCreate = () => {
    setEditing(null)
    setForm(emptyForm())
    setModalOpen(true)
  }

  const openEdit = (a: Almacen) => {
    setEditing(a)
    setForm({ nombre: a.nombre, direccion: a.direccion ?? '' })
    setModalOpen(true)
  }

  const closeModal = () => {
    setModalOpen(false)
    setEditing(null)
  }

  // ── Submit del formulario ────────────────────────────────────
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    const data = {
      nombre: form.nombre,
      direccion: form.direccion || undefined,
    }
    if (editing) {
      await updateMutation.mutateAsync({ id: editing.id, data })
    } else {
      await createMutation.mutateAsync({ ...data, empresaId })
    }
    closeModal()
  }

  // ── Confirm eliminar ─────────────────────────────────────────
  const handleDelete = async () => {
    if (!confirmId) return
    await deleteMutation.mutateAsync(confirmId)
    setConfirmId(null)
  }

  // ── Loading skeleton ─────────────────────────────────────────
  if (isLoading) {
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between mb-6">
          <div className="h-8 w-40 bg-slate-200 rounded animate-pulse" />
          <div className="h-9 w-36 bg-slate-200 rounded-lg animate-pulse" />
        </div>
        <div className="bg-white rounded-xl border divide-y">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="flex items-center gap-4 px-4 py-4 animate-pulse">
              <div className="h-4 bg-slate-200 rounded w-1/3" />
              <div className="h-4 bg-slate-200 rounded w-1/4" />
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
          <Warehouse size={22} className="text-tin-dark" />
          <h1 className="text-2xl font-bold text-slate-900">Almacenes</h1>
        </div>
        <button
          onClick={openCreate}
          className="flex items-center gap-2 bg-primary hover:bg-primary-dark active:scale-95
            text-slate-900 font-medium px-4 py-2.5 rounded-lg text-sm transition-all duration-150"
        >
          <Plus size={16} />
          Nuevo almacén
        </button>
      </div>

      {/* ── Tabla / Empty state ── */}
      {almacenes.length === 0 ? (
        <EmptyState
          message="No hay almacenes registrados"
          action={
            <button onClick={openCreate} className="text-accent-dark text-sm hover:underline">
              Crear el primero
            </button>
          }
        />
      ) : (
        <>
          {/* Tabla — visible en sm+ */}
          <div className="hidden sm:block bg-white rounded-xl shadow-sm border overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-tin-pale border-b">
                <tr>
                  <th className="text-left px-4 py-3 text-tin-dark font-medium">Nombre</th>
                  <th className="text-left px-4 py-3 text-tin-dark font-medium">Dirección</th>
                  <th className="px-4 py-3 w-20" />
                </tr>
              </thead>
              <tbody>
                {almacenes.map(a => (
                  <tr
                    key={a.id}
                    className="border-b last:border-0 transition-colors duration-100 hover:bg-tin-pale/50"
                  >
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <Warehouse size={15} className="text-tin shrink-0" />
                        <span className="font-medium text-slate-800">{a.nombre}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      {a.direccion ? (
                        <div className="flex items-center gap-1 text-tin-dark">
                          <MapPin size={13} className="text-tin shrink-0" />
                          {a.direccion}
                        </div>
                      ) : (
                        <span className="text-tin text-xs">Sin dirección</span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex gap-1 justify-end">
                        <button
                          onClick={() => openEdit(a)}
                          className="p-1.5 rounded-lg text-tin hover:text-accent-dark hover:bg-accent/20
                            transition-colors duration-150"
                          title="Editar"
                        >
                          <Pencil size={15} />
                        </button>
                        <button
                          onClick={() => setConfirmId(a.id)}
                          className="p-1.5 rounded-lg text-tin hover:text-red-500 hover:bg-red-50
                            transition-colors duration-150"
                          title="Eliminar"
                        >
                          <Trash2 size={15} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Cards — visible solo en mobile */}
          <div className="sm:hidden space-y-3">
            {almacenes.map(a => (
              <div
                key={a.id}
                className="bg-white rounded-xl border shadow-sm px-4 py-3 flex items-center justify-between"
              >
                <div>
                  <div className="flex items-center gap-2 mb-0.5">
                    <Warehouse size={15} className="text-tin" />
                    <span className="font-medium text-slate-800 text-sm">{a.nombre}</span>
                  </div>
                  {a.direccion && (
                    <div className="flex items-center gap-1 text-xs text-tin-dark mt-1">
                      <MapPin size={11} />
                      {a.direccion}
                    </div>
                  )}
                </div>
                <div className="flex gap-1">
                  <button
                    onClick={() => openEdit(a)}
                    className="p-2 rounded-lg text-tin hover:text-accent-dark hover:bg-accent/20
                      transition-colors duration-150 min-h-[2.75rem] min-w-[2.75rem] flex items-center justify-center"
                  >
                    <Pencil size={16} />
                  </button>
                  <button
                    onClick={() => setConfirmId(a.id)}
                    className="p-2 rounded-lg text-tin hover:text-red-500 hover:bg-red-50
                      transition-colors duration-150 min-h-[2.75rem] min-w-[2.75rem] flex items-center justify-center"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </>
      )}

      {/* ── Modal crear / editar ── */}
      <Modal
        open={modalOpen}
        title={editing ? 'Editar almacén' : 'Nuevo almacén'}
        onClose={closeModal}
        size="sm"
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              Nombre <span className="text-red-400">*</span>
            </label>
            <input
              value={form.nombre}
              onChange={e => setForm({ ...form, nombre: e.target.value })}
              placeholder="Ej: Almacén Central"
              className="w-full border border-tin/40 rounded-lg px-3 py-2 text-sm
                focus:outline-none focus:ring-2 focus:ring-accent-mid focus:border-transparent
                transition-shadow duration-150"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Dirección</label>
            <input
              value={form.direccion}
              onChange={e => setForm({ ...form, direccion: e.target.value })}
              placeholder="Ej: Av. Principal 123"
              className="w-full border border-tin/40 rounded-lg px-3 py-2 text-sm
                focus:outline-none focus:ring-2 focus:ring-accent-mid focus:border-transparent
                transition-shadow duration-150"
            />
          </div>
          <div className="flex gap-3 justify-end pt-2">
            <button
              type="button"
              onClick={closeModal}
              className="px-4 py-2 text-sm text-tin-dark border border-tin/40 rounded-lg
                hover:bg-tin-pale transition-colors duration-150"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={createMutation.isPending || updateMutation.isPending}
              className="px-4 py-2 text-sm font-medium text-slate-900 bg-primary hover:bg-primary-dark
                rounded-lg active:scale-95 transition-all duration-150 disabled:opacity-50"
            >
              {createMutation.isPending || updateMutation.isPending ? 'Guardando...' : 'Guardar'}
            </button>
          </div>
        </form>
      </Modal>

      {/* ── Confirm eliminar ── */}
      <ConfirmDialog
        open={!!confirmId}
        title="Eliminar almacén"
        description="¿Estás seguro? Los usuarios y cajas asociados a este almacén quedarán sin asignación."
        onConfirm={handleDelete}
        onCancel={() => setConfirmId(null)}
        loading={deleteMutation.isPending}
      />
    </div>
  )
}
