import { useState } from 'react'
import { Plus, Pencil, Trash2, Ruler } from 'lucide-react'
import {
  useUnidadesMedida,
  useCreateUnidadMedida,
  useUpdateUnidadMedida,
  useDeleteUnidadMedida,
} from '../hooks/useUnidadesMedida'
import Modal from '../components/shared/Modal'
import ConfirmDialog from '../components/shared/ConfirmDialog'
import EmptyState from '../components/shared/EmptyState'
import type { UnidadMedida } from '../types'

// Estado inicial limpio del formulario
const emptyForm = () => ({ nombre: '', abreviatura: '' })

export default function UnidadesMedidaPage() {
  // ── Queries y mutations ──────────────────────────────────────
  const { data: unidades = [], isLoading } = useUnidadesMedida()
  const createMutation = useCreateUnidadMedida()
  const updateMutation = useUpdateUnidadMedida()
  const deleteMutation = useDeleteUnidadMedida()

  // ── Estado local ─────────────────────────────────────────────
  const [modalOpen, setModalOpen] = useState(false)
  const [editing, setEditing] = useState<UnidadMedida | null>(null)
  const [confirmId, setConfirmId] = useState<number | null>(null)
  const [form, setForm] = useState(emptyForm())

  // ── Handlers de modal ────────────────────────────────────────
  const openCreate = () => {
    setEditing(null)
    setForm(emptyForm())
    setModalOpen(true)
  }

  const openEdit = (u: UnidadMedida) => {
    setEditing(u)
    setForm({ nombre: u.nombre, abreviatura: u.abreviatura })
    setModalOpen(true)
  }

  const closeModal = () => {
    setModalOpen(false)
    setEditing(null)
  }

  // ── Submit del formulario ────────────────────────────────────
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (editing) {
      await updateMutation.mutateAsync({ id: editing.id, data: form })
    } else {
      await createMutation.mutateAsync(form)
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
          <div className="h-8 w-48 bg-slate-200 rounded animate-pulse" />
          <div className="h-9 w-36 bg-slate-200 rounded-lg animate-pulse" />
        </div>
        <div className="bg-white rounded-xl border divide-y">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="flex items-center gap-4 px-4 py-3 animate-pulse">
              <div className="h-4 bg-slate-200 rounded w-1/3" />
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
          <Ruler size={22} className="text-tin-dark" />
          <h1 className="text-2xl font-bold text-slate-900">Unidades de Medida</h1>
        </div>
        <button
          onClick={openCreate}
          className="flex items-center gap-2 bg-primary hover:bg-primary-dark active:scale-95
            text-slate-900 font-medium px-4 py-2.5 rounded-lg text-sm transition-all duration-150"
        >
          <Plus size={16} />
          Nueva unidad
        </button>
      </div>

      {/* ── Tabla / Empty state ── */}
      {unidades.length === 0 ? (
        <EmptyState
          message="No hay unidades de medida"
          action={
            <button onClick={openCreate} className="text-accent-dark text-sm hover:underline">
              Crear la primera
            </button>
          }
        />
      ) : (
        <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
          {/* Tabla desktop */}
          <div className="hidden sm:block">
            <table className="w-full text-sm">
              <thead className="bg-tin-pale border-b">
                <tr>
                  <th className="text-left px-4 py-3 text-tin-dark font-medium">Nombre</th>
                  <th className="text-left px-4 py-3 text-tin-dark font-medium">Abreviatura</th>
                  <th className="px-4 py-3 w-20" />
                </tr>
              </thead>
              <tbody>
                {unidades.map(u => (
                  <tr
                    key={u.id}
                    className="border-b last:border-0 transition-colors duration-100 hover:bg-tin-pale/50"
                  >
                    <td className="px-4 py-3 font-medium text-slate-800">{u.nombre}</td>
                    <td className="px-4 py-3">
                      <span className="inline-block bg-accent/30 text-accent-dark text-xs font-semibold
                        px-2 py-0.5 rounded-full">
                        {u.abreviatura}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex gap-1 justify-end">
                        <button
                          onClick={() => openEdit(u)}
                          className="p-1.5 rounded-lg text-tin hover:text-accent-dark hover:bg-accent/20
                            transition-colors duration-150"
                          title="Editar"
                        >
                          <Pencil size={15} />
                        </button>
                        <button
                          onClick={() => setConfirmId(u.id)}
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

          {/* Cards mobile */}
          <div className="sm:hidden divide-y">
            {unidades.map(u => (
              <div key={u.id} className="flex items-center justify-between px-4 py-3">
                <div>
                  <p className="font-medium text-slate-800 text-sm">{u.nombre}</p>
                  <span className="inline-block bg-accent/30 text-accent-dark text-xs font-semibold
                    px-2 py-0.5 rounded-full mt-1">
                    {u.abreviatura}
                  </span>
                </div>
                <div className="flex gap-1">
                  <button
                    onClick={() => openEdit(u)}
                    className="p-2 rounded-lg text-tin hover:text-accent-dark hover:bg-accent/20
                      transition-colors duration-150 min-h-[2.75rem] min-w-[2.75rem] flex items-center justify-center"
                  >
                    <Pencil size={16} />
                  </button>
                  <button
                    onClick={() => setConfirmId(u.id)}
                    className="p-2 rounded-lg text-tin hover:text-red-500 hover:bg-red-50
                      transition-colors duration-150 min-h-[2.75rem] min-w-[2.75rem] flex items-center justify-center"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── Modal crear / editar ── */}
      <Modal
        open={modalOpen}
        title={editing ? 'Editar unidad de medida' : 'Nueva unidad de medida'}
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
              placeholder="Ej: Kilogramo"
              className="w-full border border-tin/40 rounded-lg px-3 py-2 text-sm
                focus:outline-none focus:ring-2 focus:ring-accent-mid focus:border-transparent
                transition-shadow duration-150"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              Abreviatura <span className="text-red-400">*</span>
            </label>
            <input
              value={form.abreviatura}
              onChange={e => setForm({ ...form, abreviatura: e.target.value })}
              placeholder="Ej: kg"
              className="w-full border border-tin/40 rounded-lg px-3 py-2 text-sm
                focus:outline-none focus:ring-2 focus:ring-accent-mid focus:border-transparent
                transition-shadow duration-150"
              required
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
        title="Eliminar unidad de medida"
        description="¿Estás seguro? Si hay variantes usando esta unidad, la eliminación puede fallar."
        onConfirm={handleDelete}
        onCancel={() => setConfirmId(null)}
        loading={deleteMutation.isPending}
      />
    </div>
  )
}
