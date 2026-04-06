import { useState } from 'react'
import { Plus, Pencil, Trash2 } from 'lucide-react'
import { useContactos, useCreateContacto, useUpdateContacto, useDeleteContacto } from '../hooks/useContactos'
import Modal from '../components/shared/Modal'
import ConfirmDialog from '../components/shared/ConfirmDialog'
import EmptyState from '../components/shared/EmptyState'
import type { Contacto, TipoContacto } from '../types'

const TIPO_LABELS: Record<TipoContacto, string> = {
  CLIENTE: 'Cliente',
  PROVEEDOR: 'Proveedor',
  AMBOS: 'Ambos',
}

const TIPO_COLORS: Record<TipoContacto, string> = {
  CLIENTE: 'bg-blue-100 text-blue-700',
  PROVEEDOR: 'bg-green-100 text-green-700',
  AMBOS: 'bg-purple-100 text-purple-700',
}

const emptyForm = { nombre: '', tipo: 'CLIENTE' as TipoContacto, tipoDoc: '', nroDoc: '', telefono: '', email: '', direccion: '', notas: '', empresaId: 1 }

export default function ContactosPage() {
  const [filtroTipo, setFiltroTipo] = useState<string | undefined>(undefined)
  const { data: contactos = [], isLoading } = useContactos(filtroTipo)
  const createMutation = useCreateContacto()
  const updateMutation = useUpdateContacto()
  const deleteMutation = useDeleteContacto()

  const [modalOpen, setModalOpen] = useState(false)
  const [editing, setEditing] = useState<Contacto | null>(null)
  const [confirmId, setConfirmId] = useState<number | null>(null)
  const [form, setForm] = useState(emptyForm)

  const openCreate = () => { setEditing(null); setForm(emptyForm); setModalOpen(true) }
  const openEdit = (c: Contacto) => {
    setEditing(c)
    setForm({ nombre: c.nombre, tipo: c.tipo, tipoDoc: c.tipoDoc ?? '', nroDoc: c.nroDoc ?? '', telefono: c.telefono ?? '', email: c.email ?? '', direccion: c.direccion ?? '', notas: c.notas ?? '', empresaId: c.empresaId })
    setModalOpen(true)
  }
  const closeModal = () => { setModalOpen(false); setEditing(null) }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    const data = { ...form, tipoDoc: form.tipoDoc || undefined, nroDoc: form.nroDoc || undefined, telefono: form.telefono || undefined, email: form.email || undefined, direccion: form.direccion || undefined, notas: form.notas || undefined }
    if (editing) await updateMutation.mutateAsync({ id: editing.id, data })
    else await createMutation.mutateAsync(data)
    closeModal()
  }

  const field = (label: string, name: keyof typeof form, required = false, type = 'text') => (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-1">{label}{required && ' *'}</label>
      <input
        type={type}
        value={form[name] as string}
        onChange={e => setForm({ ...form, [name]: e.target.value })}
        className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        required={required}
      />
    </div>
  )

  if (isLoading) return <div className="text-gray-400 text-sm">Cargando...</div>

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-800">Contactos</h1>
        <button onClick={openCreate} className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg text-sm hover:bg-blue-700">
          <Plus size={16} /> Nuevo contacto
        </button>
      </div>

      <div className="flex gap-2 mb-4">
        {[undefined, 'CLIENTE', 'PROVEEDOR', 'AMBOS'].map(t => (
          <button key={t ?? 'todos'} onClick={() => setFiltroTipo(t)}
            className={`px-3 py-1 rounded-full text-xs font-medium border transition-colors ${filtroTipo === t ? 'bg-blue-600 text-white border-blue-600' : 'bg-white text-gray-600 border-gray-300 hover:border-blue-400'}`}>
            {t ?? 'Todos'}
          </button>
        ))}
      </div>

      {contactos.length === 0 ? (
        <EmptyState message="No hay contactos" />
      ) : (
        <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b">
              <tr>
                <th className="text-left px-4 py-3 text-gray-600 font-medium">Nombre</th>
                <th className="text-left px-4 py-3 text-gray-600 font-medium">Tipo</th>
                <th className="text-left px-4 py-3 text-gray-600 font-medium">Teléfono</th>
                <th className="text-left px-4 py-3 text-gray-600 font-medium">Email</th>
                <th className="px-4 py-3"></th>
              </tr>
            </thead>
            <tbody>
              {contactos.map(c => (
                <tr key={c.id} className="border-b last:border-0 hover:bg-gray-50">
                  <td className="px-4 py-3 font-medium text-gray-800">{c.nombre}</td>
                  <td className="px-4 py-3">
                    <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${TIPO_COLORS[c.tipo]}`}>{TIPO_LABELS[c.tipo]}</span>
                  </td>
                  <td className="px-4 py-3 text-gray-500">{c.telefono ?? '—'}</td>
                  <td className="px-4 py-3 text-gray-500">{c.email ?? '—'}</td>
                  <td className="px-4 py-3">
                    <div className="flex gap-2 justify-end">
                      <button onClick={() => openEdit(c)} className="text-gray-400 hover:text-blue-600 p-1 rounded"><Pencil size={16} /></button>
                      <button onClick={() => setConfirmId(c.id)} className="text-gray-400 hover:text-red-600 p-1 rounded"><Trash2 size={16} /></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <Modal open={modalOpen} title={editing ? 'Editar contacto' : 'Nuevo contacto'} onClose={closeModal} size="lg">
        <form onSubmit={handleSubmit} className="grid grid-cols-2 gap-4">
          <div className="col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-1">Tipo *</label>
            <select value={form.tipo} onChange={e => setForm({ ...form, tipo: e.target.value as TipoContacto })}
              className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
              <option value="CLIENTE">Cliente</option>
              <option value="PROVEEDOR">Proveedor</option>
              <option value="AMBOS">Ambos</option>
            </select>
          </div>
          <div className="col-span-2">{field('Nombre', 'nombre', true)}</div>
          {field('Tipo documento', 'tipoDoc')}
          {field('Nro. documento', 'nroDoc')}
          {field('Teléfono', 'telefono')}
          {field('Email', 'email', false, 'email')}
          <div className="col-span-2">{field('Dirección', 'direccion')}</div>
          <div className="col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-1">Notas</label>
            <textarea value={form.notas} onChange={e => setForm({ ...form, notas: e.target.value })}
              className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" rows={2} />
          </div>
          <div className="col-span-2 flex gap-3 justify-end pt-2">
            <button type="button" onClick={closeModal} className="px-4 py-2 text-sm text-gray-600 border rounded-lg hover:bg-gray-50">Cancelar</button>
            <button type="submit" disabled={createMutation.isPending || updateMutation.isPending}
              className="px-4 py-2 text-sm text-white bg-blue-600 rounded-lg hover:bg-blue-700 disabled:opacity-50">
              {createMutation.isPending || updateMutation.isPending ? 'Guardando...' : 'Guardar'}
            </button>
          </div>
        </form>
      </Modal>

      <ConfirmDialog open={!!confirmId} title="Eliminar contacto" description="¿Estás seguro? Esta acción no se puede deshacer."
        onConfirm={async () => { if (confirmId) { await deleteMutation.mutateAsync(confirmId); setConfirmId(null) } }}
        onCancel={() => setConfirmId(null)} loading={deleteMutation.isPending} />
    </div>
  )
}
