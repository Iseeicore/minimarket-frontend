import { useState } from 'react'
import { Plus, Pencil, Trash2, Phone, Mail, FileText, MapPin, Building2, User, Users } from 'lucide-react'
import { useContactos, useCreateContacto, useUpdateContacto, useDeleteContacto } from '../hooks/useContactos'
import Modal from '../components/shared/Modal'
import ConfirmDialog from '../components/shared/ConfirmDialog'
import EmptyState from '../components/shared/EmptyState'
import type { Contacto, TipoContacto } from '../types'

// ── Metadatos por tipo ─────────────────────────────────────────────────────
const TIPO_META: Record<TipoContacto, {
  label: string
  badgeCls: string
  Icon: typeof User
  docSugerido: string
}> = {
  CLIENTE:    { label: 'Cliente',    badgeCls: 'bg-accent/30 text-accent-dark',        Icon: User,     docSugerido: 'DNI' },
  PROVEEDOR:  { label: 'Proveedor',  badgeCls: 'bg-primary/20 text-primary-dark',      Icon: Building2, docSugerido: 'RUC' },
  AMBOS:      { label: 'Ambos',      badgeCls: 'bg-tin-pale text-tin-dark border border-tin/30', Icon: Users, docSugerido: '' },
}

const TIPOS_DOC = ['DNI', 'RUC', 'Pasaporte', 'CE', 'Otro']

const emptyForm = {
  nombre: '', tipo: 'CLIENTE' as TipoContacto,
  tipoDoc: 'DNI', nroDoc: '',
  telefono: '', email: '',
  direccion: '', notas: '',
}

// ── Helpers ────────────────────────────────────────────────────────────────
function ContactoBadge({ tipo }: { tipo: TipoContacto }) {
  const m = TIPO_META[tipo]
  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${m.badgeCls}`}>
      <m.Icon size={10} />
      {m.label}
    </span>
  )
}

// ── Página ─────────────────────────────────────────────────────────────────
export default function ContactosPage() {
  const [filtroTipo, setFiltroTipo] = useState<string | undefined>(undefined)
  const { data: contactos = [], isLoading } = useContactos(filtroTipo)
  const createMutation = useCreateContacto()
  const updateMutation = useUpdateContacto()
  const deleteMutation = useDeleteContacto()

  const [modalOpen, setModalOpen]   = useState(false)
  const [editing, setEditing]       = useState<Contacto | null>(null)
  const [confirmId, setConfirmId]   = useState<number | null>(null)
  const [form, setForm]             = useState(emptyForm)
  const [errors, setErrors]         = useState<Record<string, string>>({})

  const openCreate = () => {
    setEditing(null)
    setForm(emptyForm)
    setErrors({})
    setModalOpen(true)
  }

  const openEdit = (c: Contacto) => {
    setEditing(c)
    setForm({
      nombre: c.nombre, tipo: c.tipo,
      tipoDoc: c.tipoDoc ?? '', nroDoc: c.nroDoc ?? '',
      telefono: c.telefono ?? '', email: c.email ?? '',
      direccion: c.direccion ?? '', notas: c.notas ?? '',
    })
    setErrors({})
    setModalOpen(true)
  }

  const closeModal = () => { setModalOpen(false); setEditing(null); setErrors({}) }

  // Auto-set tipoDoc cuando cambia el tipo
  const handleTipoChange = (tipo: TipoContacto) => {
    setForm(f => ({ ...f, tipo, tipoDoc: TIPO_META[tipo].docSugerido }))
  }

  const validate = () => {
    const errs: Record<string, string> = {}
    if (!form.nombre.trim()) errs.nombre = 'El nombre es obligatorio'
    if (form.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email))
      errs.email = 'Email inválido'
    return errs
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    const errs = validate()
    if (Object.keys(errs).length) { setErrors(errs); return }

    const data = {
      empresaId: 1,
      tipo: form.tipo,
      nombre:    form.nombre.trim(),
      tipoDoc:   form.tipoDoc  || undefined,
      nroDoc:    form.nroDoc   || undefined,
      telefono:  form.telefono || undefined,
      email:     form.email    || undefined,
      direccion: form.direccion || undefined,
      notas:     form.notas    || undefined,
    }
    if (editing) await updateMutation.mutateAsync({ id: editing.id, data })
    else         await createMutation.mutateAsync(data)
    closeModal()
  }

  const inputCls = (err?: string) =>
    `w-full rounded-xl border px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary transition-colors ${
      err ? 'border-red-400 bg-red-50' : 'border-tin/30'
    }`

  if (isLoading) {
    return (
      <div className="flex justify-center items-center py-24">
        <div className="w-8 h-8 rounded-full border-2 border-primary border-t-transparent animate-spin" />
      </div>
    )
  }

  return (
    <div className="space-y-5">

      {/* ── Header ─────────────────────────────────────────────────────── */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Contactos</h1>
          <p className="text-sm text-tin-dark mt-0.5">
            {contactos.length} {contactos.length === 1 ? 'contacto' : 'contactos'}{filtroTipo ? ` · ${TIPO_META[filtroTipo as TipoContacto]?.label}` : ''}
          </p>
        </div>
        <button
          onClick={openCreate}
          className="flex items-center gap-2 bg-primary hover:bg-primary-dark text-white px-4 py-2.5 rounded-xl text-sm font-semibold transition-all duration-150 active:scale-95"
        >
          <Plus size={16} /> Nuevo contacto
        </button>
      </div>

      {/* ── Filtros ─────────────────────────────────────────────────────── */}
      <div className="flex gap-2 flex-wrap">
        {([undefined, 'CLIENTE', 'PROVEEDOR', 'AMBOS'] as const).map(t => {
          const active = filtroTipo === t
          return (
            <button
              key={t ?? 'todos'}
              onClick={() => setFiltroTipo(t)}
              className={`px-3.5 py-1.5 rounded-full text-xs font-semibold border transition-colors ${
                active
                  ? 'bg-gray-800 text-white border-gray-800'
                  : 'bg-white text-tin-dark border-tin/30 hover:border-tin/60 hover:text-gray-700'
              }`}
            >
              {t ? TIPO_META[t].label : 'Todos'}
            </button>
          )
        })}
      </div>

      {/* ── Lista ──────────────────────────────────────────────────────── */}
      {contactos.length === 0 ? (
        <EmptyState message={filtroTipo ? `No hay ${TIPO_META[filtroTipo as TipoContacto]?.label.toLowerCase()}s` : 'No hay contactos'} />
      ) : (
        <>
          {/* Desktop — tabla (md+) */}
          <div className="hidden md:block bg-white rounded-2xl border border-tin/20 shadow-sm overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-tin-pale border-b border-tin/20">
                <tr>
                  <th className="text-left px-5 py-3 text-tin-dark font-medium">Nombre</th>
                  <th className="text-left px-4 py-3 text-tin-dark font-medium">Tipo</th>
                  <th className="text-left px-4 py-3 text-tin-dark font-medium hidden lg:table-cell">Documento</th>
                  <th className="text-left px-4 py-3 text-tin-dark font-medium">Teléfono</th>
                  <th className="text-left px-4 py-3 text-tin-dark font-medium hidden xl:table-cell">Email</th>
                  <th className="text-left px-4 py-3 text-tin-dark font-medium hidden xl:table-cell">Dirección</th>
                  <th className="px-4 py-3"></th>
                </tr>
              </thead>
              <tbody>
                {contactos.map(c => (
                  <tr key={c.id} className="border-b border-tin/10 last:border-0 hover:bg-tin-pale/40 transition-colors">
                    <td className="px-5 py-3.5 font-semibold text-gray-800">{c.nombre}</td>
                    <td className="px-4 py-3.5"><ContactoBadge tipo={c.tipo} /></td>
                    <td className="px-4 py-3.5 hidden lg:table-cell">
                      {c.tipoDoc || c.nroDoc ? (
                        <span className="flex items-center gap-1.5 text-tin-dark text-xs">
                          <FileText size={12} className="text-tin" />
                          <span className="font-medium">{c.tipoDoc}</span>
                          {c.nroDoc && <span className="text-tin">·</span>}
                          {c.nroDoc && <span>{c.nroDoc}</span>}
                        </span>
                      ) : <span className="text-tin">—</span>}
                    </td>
                    <td className="px-4 py-3.5">
                      {c.telefono
                        ? <a href={`tel:${c.telefono}`} className="flex items-center gap-1.5 text-tin-dark hover:text-primary-dark transition-colors text-sm">
                            <Phone size={12} className="text-tin" /> {c.telefono}
                          </a>
                        : <span className="text-tin">—</span>}
                    </td>
                    <td className="px-4 py-3.5 hidden xl:table-cell">
                      {c.email
                        ? <a href={`mailto:${c.email}`} className="flex items-center gap-1.5 text-tin-dark hover:text-primary-dark transition-colors text-xs truncate max-w-[180px]">
                            <Mail size={11} className="text-tin shrink-0" /> {c.email}
                          </a>
                        : <span className="text-tin">—</span>}
                    </td>
                    <td className="px-4 py-3.5 hidden xl:table-cell">
                      {c.direccion
                        ? <span className="flex items-center gap-1.5 text-tin-dark text-xs truncate max-w-[200px]">
                            <MapPin size={11} className="text-tin shrink-0" /> {c.direccion}
                          </span>
                        : <span className="text-tin">—</span>}
                    </td>
                    <td className="px-4 py-3.5">
                      <div className="flex gap-1 justify-end">
                        <button
                          onClick={() => openEdit(c)}
                          className="p-1.5 text-tin hover:text-primary-dark rounded-lg hover:bg-primary-pale transition-colors"
                        >
                          <Pencil size={15} />
                        </button>
                        <button
                          onClick={() => setConfirmId(c.id)}
                          className="p-1.5 text-tin hover:text-red-500 rounded-lg hover:bg-red-50 transition-colors"
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

          {/* Mobile — cards */}
          <div className="md:hidden space-y-3">
            {contactos.map(c => {
              return (
                <div key={c.id} className="bg-white rounded-2xl border border-tin/20 shadow-sm p-4">
                  <div className="flex items-start justify-between mb-2.5">
                    <div>
                      <p className="font-semibold text-gray-800">{c.nombre}</p>
                      <div className="mt-1"><ContactoBadge tipo={c.tipo} /></div>
                    </div>
                    <div className="flex gap-1 -mt-1">
                      <button
                        onClick={() => openEdit(c)}
                        className="p-2 text-tin hover:text-primary-dark rounded-xl hover:bg-primary-pale transition-colors"
                      >
                        <Pencil size={15} />
                      </button>
                      <button
                        onClick={() => setConfirmId(c.id)}
                        className="p-2 text-tin hover:text-red-500 rounded-xl hover:bg-red-50 transition-colors"
                      >
                        <Trash2 size={15} />
                      </button>
                    </div>
                  </div>
                  <div className="space-y-1.5 text-sm">
                    {c.telefono && (
                      <a href={`tel:${c.telefono}`} className="flex items-center gap-2 text-tin-dark hover:text-primary-dark transition-colors">
                        <Phone size={13} className="text-tin" /> {c.telefono}
                      </a>
                    )}
                    {c.email && (
                      <a href={`mailto:${c.email}`} className="flex items-center gap-2 text-tin-dark hover:text-primary-dark transition-colors truncate">
                        <Mail size={13} className="text-tin" /> {c.email}
                      </a>
                    )}
                    {(c.tipoDoc || c.nroDoc) && (
                      <p className="flex items-center gap-2 text-tin-dark">
                        <FileText size={13} className="text-tin" />
                        {c.tipoDoc} {c.nroDoc && `· ${c.nroDoc}`}
                      </p>
                    )}
                    {c.direccion && (
                      <p className="flex items-center gap-2 text-tin-dark">
                        <MapPin size={13} className="text-tin" /> {c.direccion}
                      </p>
                    )}
                    {!c.telefono && !c.email && !c.tipoDoc && !c.nroDoc && !c.direccion && (
                      <p className="text-xs text-tin italic">Sin datos de contacto</p>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        </>
      )}

      {/* ── Modal crear/editar ──────────────────────────────────────────── */}
      <Modal open={modalOpen} title={editing ? 'Editar contacto' : 'Nuevo contacto'} onClose={closeModal} size="lg">
        <form onSubmit={handleSubmit} className="space-y-5">

          {/* Tipo — control segmentado */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Tipo de contacto *</label>
            <div className="grid grid-cols-3 gap-2">
              {(['CLIENTE', 'PROVEEDOR', 'AMBOS'] as TipoContacto[]).map(t => {
                const m = TIPO_META[t]
                const active = form.tipo === t
                return (
                  <button
                    key={t}
                    type="button"
                    onClick={() => handleTipoChange(t)}
                    className={`flex flex-col items-center gap-1.5 py-3 px-2 rounded-xl border-2 text-sm font-medium transition-all ${
                      active
                        ? 'border-primary bg-primary-pale text-primary-dark'
                        : 'border-tin/20 bg-white text-tin-dark hover:border-tin/50'
                    }`}
                  >
                    <m.Icon size={18} className={active ? 'text-primary-dark' : 'text-tin'} />
                    {m.label}
                  </button>
                )
              })}
            </div>
          </div>

          {/* Nombre */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Nombre *</label>
            <input
              value={form.nombre}
              onChange={e => { setForm(f => ({ ...f, nombre: e.target.value })); setErrors(errs => ({ ...errs, nombre: '' })) }}
              placeholder={form.tipo === 'PROVEEDOR' ? 'Ej: Distribuidora Norte SAC' : 'Ej: Juan Pérez'}
              className={inputCls(errors.nombre)}
              autoFocus
            />
            {errors.nombre && <p className="text-xs text-red-500 mt-1">{errors.nombre}</p>}
          </div>

          {/* Teléfono + Email */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Teléfono
                {form.tipo !== 'PROVEEDOR' && <span className="text-tin font-normal ml-1">(recomendado)</span>}
              </label>
              <div className="relative">
                <Phone size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-tin pointer-events-none" />
                <input
                  value={form.telefono}
                  onChange={e => setForm(f => ({ ...f, telefono: e.target.value }))}
                  placeholder="Ej: 987 654 321"
                  className={inputCls() + ' pl-8'}
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
              <div className="relative">
                <Mail size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-tin pointer-events-none" />
                <input
                  type="text"
                  value={form.email}
                  onChange={e => { setForm(f => ({ ...f, email: e.target.value })); setErrors(errs => ({ ...errs, email: '' })) }}
                  placeholder="contacto@empresa.com"
                  className={inputCls(errors.email) + ' pl-8'}
                />
              </div>
              {errors.email && <p className="text-xs text-red-500 mt-1">{errors.email}</p>}
            </div>
          </div>

          {/* Tipo doc + Nro doc */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Tipo de documento
                {form.tipo === 'PROVEEDOR' && <span className="text-primary-dark font-medium ml-1 text-xs">(RUC para facturas)</span>}
              </label>
              <select
                value={form.tipoDoc}
                onChange={e => setForm(f => ({ ...f, tipoDoc: e.target.value }))}
                className={inputCls()}
              >
                <option value="">Sin documento</option>
                {TIPOS_DOC.map(d => <option key={d} value={d}>{d}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Número de documento</label>
              <input
                value={form.nroDoc}
                onChange={e => setForm(f => ({ ...f, nroDoc: e.target.value }))}
                placeholder={form.tipoDoc === 'RUC' ? '20123456789' : form.tipoDoc === 'DNI' ? '12345678' : ''}
                className={inputCls()}
              />
            </div>
          </div>

          {/* Dirección */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Dirección <span className="text-tin font-normal">(opcional)</span>
            </label>
            <div className="relative">
              <MapPin size={14} className="absolute left-3 top-3 text-tin pointer-events-none" />
              <input
                value={form.direccion}
                onChange={e => setForm(f => ({ ...f, direccion: e.target.value }))}
                placeholder="Av. Principal 123, Piso 2"
                className={inputCls() + ' pl-8'}
              />
            </div>
          </div>

          {/* Notas */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Notas <span className="text-tin font-normal">(opcional)</span>
            </label>
            <textarea
              value={form.notas}
              onChange={e => setForm(f => ({ ...f, notas: e.target.value }))}
              placeholder={form.tipo === 'PROVEEDOR' ? 'Ej: Pago a 30 días, no acepta devoluciones...' : 'Ej: Compra frecuente, descuento especial...'}
              className={inputCls() + ' resize-none'}
              rows={2}
            />
          </div>

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
              disabled={createMutation.isPending || updateMutation.isPending}
              className="px-5 py-2.5 text-sm text-white bg-primary hover:bg-primary-dark rounded-xl font-semibold transition-all duration-150 active:scale-95 disabled:opacity-50"
            >
              {createMutation.isPending || updateMutation.isPending
                ? 'Guardando...'
                : (editing ? 'Actualizar' : 'Guardar contacto')}
            </button>
          </div>
        </form>
      </Modal>

      {/* ── Confirm eliminar ────────────────────────────────────────────── */}
      <ConfirmDialog
        open={!!confirmId}
        title="Eliminar contacto"
        description="¿Estás seguro? Esta acción no se puede deshacer."
        onConfirm={async () => { if (confirmId) { await deleteMutation.mutateAsync(confirmId); setConfirmId(null) } }}
        onCancel={() => setConfirmId(null)}
        loading={deleteMutation.isPending}
      />
    </div>
  )
}
