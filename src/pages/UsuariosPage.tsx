import { useState, useEffect } from 'react'
import { Users, Plus, Pencil, UserX, Eye, EyeOff, ShieldCheck, Package, Loader2 } from 'lucide-react'
import { useUsuarios, useCreateUsuario, useUpdateUsuario, useDeleteUsuario } from '../hooks/useUsuarios'
import { useAlmacenes } from '../hooks/useAlmacenes'
import { useAuthStore } from '../store/auth.store'
import Modal from '../components/shared/Modal'
import ConfirmDialog from '../components/shared/ConfirmDialog'
import EmptyState from '../components/shared/EmptyState'
import type { RolUsuario, CreateUsuarioDto, UpdateUsuarioDto } from '../types'

// ── Helpers ────────────────────────────────────────────────────
function formatFecha(iso: string) {
  return new Date(iso).toLocaleDateString('es-PE', { day: '2-digit', month: '2-digit', year: 'numeric' })
}

const rolBadge: Record<RolUsuario, string> = {
  ADMIN:       'bg-accent/20 text-accent-dark border border-accent-mid',
  ALMACENERO:  'bg-primary-pale text-primary-dark border border-primary',
}

const rolLabel: Record<RolUsuario, string> = {
  ADMIN:      'Admin',
  ALMACENERO: 'Almacenero',
}

// ── Tipo del formulario interno ────────────────────────────────
interface FormState {
  nombre:    string
  email:     string
  password:  string
  rol:       RolUsuario
  almacenId: string   // string para el select, convertimos al enviar
}

const FORM_EMPTY: FormState = {
  nombre: '', email: '', password: '', rol: 'ALMACENERO', almacenId: '',
}

// ── Modal de creación / edición ────────────────────────────────
interface FormModalProps {
  open:       boolean
  editingId:  number | null    // null = crear, id = editar
  onClose:    () => void
}

function FormUsuarioModal({ open, editingId, onClose }: FormModalProps) {
  const isEdit = editingId !== null

  const { data: usuarios = [] }  = useUsuarios()
  const { data: almacenes = [] } = useAlmacenes()
  const createMut                = useCreateUsuario()
  const updateMut                = useUpdateUsuario()

  const [form, setForm]         = useState<FormState>(FORM_EMPTY)
  const [showPass, setShowPass] = useState(false)

  // Pre-cargar datos al abrir en modo edición
  useEffect(() => {
    if (!open) return
    if (isEdit) {
      const u = usuarios.find(u => u.id === editingId)
      if (u) {
        setForm({
          nombre:    u.nombre,
          email:     u.email,
          password:  '',
          rol:       u.rol,
          almacenId: u.almacenId ? String(u.almacenId) : '',
        })
      }
    } else {
      setForm(FORM_EMPTY)
      setShowPass(false)
    }
  }, [open, editingId, isEdit, usuarios])

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target
    setForm(prev => ({
      ...prev,
      [name]: value,
      // Si cambia a ADMIN, limpiar almacenId
      ...(name === 'rol' && value === 'ADMIN' ? { almacenId: '' } : {}),
    }))
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()

    if (isEdit) {
      const patch: UpdateUsuarioDto = {
        nombre:    form.nombre.trim(),
        rol:       form.rol,
        almacenId: form.rol === 'ALMACENERO' ? Number(form.almacenId) || null : null,
      }
      // Solo enviar password si el campo no está vacío
      if (form.password.trim()) patch.password = form.password

      updateMut.mutate({ id: editingId, data: patch }, { onSuccess: onClose })
    } else {
      const payload: CreateUsuarioDto = {
        nombre:   form.nombre.trim(),
        email:    form.email.trim(),
        password: form.password,
        rol:      form.rol,
        ...(form.rol === 'ALMACENERO' && form.almacenId
          ? { almacenId: Number(form.almacenId) }
          : {}),
      }
      createMut.mutate(payload, { onSuccess: onClose })
    }
  }

  const isPending = createMut.isPending || updateMut.isPending

  const inputCls = 'w-full border border-tin/30 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-colors'

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={isEdit ? 'Editar usuario' : 'Nuevo usuario'}
    >
      <form onSubmit={handleSubmit} className="space-y-4">

        {/* Nombre */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Nombre completo</label>
          <input
            name="nombre"
            type="text"
            value={form.nombre}
            onChange={handleChange}
            placeholder="Juan Pérez"
            className={inputCls}
            required
          />
        </div>

        {/* Email — solo al crear */}
        {!isEdit && (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
            <input
              name="email"
              type="email"
              value={form.email}
              onChange={handleChange}
              placeholder="juan@empresa.com"
              className={inputCls}
              required
              autoComplete="off"
            />
          </div>
        )}

        {/* Contraseña */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Contraseña{isEdit && <span className="text-xs text-tin font-normal ml-1">(opcional)</span>}
          </label>
          <div className="relative">
            <input
              name="password"
              type={showPass ? 'text' : 'password'}
              value={form.password}
              onChange={handleChange}
              placeholder={isEdit ? 'Dejar vacío para no cambiar' : 'Mínimo 6 caracteres'}
              minLength={isEdit ? undefined : 6}
              className={`${inputCls} pr-10`}
              required={!isEdit}
              autoComplete="new-password"
            />
            <button
              type="button"
              onClick={() => setShowPass(v => !v)}
              tabIndex={-1}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-tin hover:text-tin-dark transition-colors"
            >
              {showPass ? <EyeOff size={16} /> : <Eye size={16} />}
            </button>
          </div>
        </div>

        {/* Rol */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Rol</label>
          <select
            name="rol"
            value={form.rol}
            onChange={handleChange}
            className={inputCls}
          >
            <option value="ALMACENERO">Almacenero</option>
            <option value="ADMIN">Admin</option>
          </select>
        </div>

        {/* Almacén — solo si rol = ALMACENERO */}
        {form.rol === 'ALMACENERO' && (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Almacén</label>
            <select
              name="almacenId"
              value={form.almacenId}
              onChange={handleChange}
              className={inputCls}
              required
            >
              <option value="">— Seleccioná un almacén —</option>
              {almacenes.map(a => (
                <option key={a.id} value={a.id}>{a.nombre}</option>
              ))}
            </select>
          </div>
        )}

        {/* Acciones */}
        <div className="flex gap-2 pt-2">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 py-2.5 rounded-xl border border-tin/30 text-sm font-medium text-gray-700 hover:bg-tin-pale transition-colors"
          >
            Cancelar
          </button>
          <button
            type="submit"
            disabled={isPending}
            className="flex-1 py-2.5 rounded-xl bg-primary hover:bg-primary-dark text-white font-semibold text-sm transition-all duration-150 active:scale-95 disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {isPending && <Loader2 size={14} className="animate-spin" />}
            {isPending ? 'Guardando...' : isEdit ? 'Guardar cambios' : 'Crear usuario'}
          </button>
        </div>
      </form>
    </Modal>
  )
}

// ── Página principal ───────────────────────────────────────────
export default function UsuariosPage() {
  const { usuario: yo }                          = useAuthStore()
  const { data: usuarios = [], isLoading }        = useUsuarios()
  const deleteMut                                 = useDeleteUsuario()

  const [modalOpen, setModalOpen]   = useState(false)
  const [editingId, setEditingId]   = useState<number | null>(null)
  const [confirmId, setConfirmId]   = useState<number | null>(null)

  function openCreate() {
    setEditingId(null)
    setModalOpen(true)
  }

  function openEdit(id: number) {
    setEditingId(id)
    setModalOpen(true)
  }

  function handleDesactivar() {
    if (confirmId === null) return
    deleteMut.mutate(confirmId, { onSuccess: () => setConfirmId(null) })
  }

  // ── Skeleton ─────────────────────────────────────────────────
  if (isLoading) {
    return (
      <div className="space-y-4 animate-pulse">
        <div className="flex justify-between">
          <div className="h-8 w-40 bg-tin-pale rounded" />
          <div className="h-10 w-36 bg-tin-pale rounded-xl" />
        </div>
        {[...Array(5)].map((_, i) => (
          <div key={i} className="h-14 bg-tin-pale rounded-2xl" />
        ))}
      </div>
    )
  }

  return (
    <div className="space-y-6">

      {/* ── Header ── */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Usuarios</h1>
          <p className="text-sm text-tin-dark mt-0.5">
            {usuarios.length} usuario{usuarios.length !== 1 ? 's' : ''} en la empresa
          </p>
        </div>
        <button
          onClick={openCreate}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-primary hover:bg-primary-dark text-white font-semibold text-sm transition-all duration-150 active:scale-95"
        >
          <Plus size={16} /> Nuevo usuario
        </button>
      </div>

      {/* ── Tabla desktop ── */}
      {usuarios.length === 0 ? (
        <EmptyState message="Sin usuarios registrados." />
      ) : (
        <>
          <div className="hidden md:block bg-white rounded-2xl border border-tin/20 shadow-sm overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-tin-pale text-tin-dark text-xs uppercase tracking-wide">
                <tr>
                  <th className="px-5 py-3 text-left font-medium">Nombre</th>
                  <th className="px-5 py-3 text-left font-medium">Email</th>
                  <th className="px-5 py-3 text-left font-medium">Rol</th>
                  <th className="px-5 py-3 text-left font-medium">Almacén</th>
                  <th className="px-5 py-3 text-left font-medium">Estado</th>
                  <th className="px-5 py-3 text-left font-medium">Desde</th>
                  <th className="px-3 py-3" />
                </tr>
              </thead>
              <tbody className="divide-y divide-tin/10">
                {usuarios.map(u => {
                  const esSelf = u.id === yo?.id
                  return (
                    <tr
                      key={u.id}
                      className={`transition-colors hover:bg-tin-pale/40 ${!u.activo ? 'opacity-50' : ''}`}
                    >
                      <td className="px-5 py-3">
                        <div className="flex items-center gap-2">
                          <div className="w-7 h-7 rounded-full bg-primary/15 flex items-center justify-center shrink-0">
                            <span className="text-xs font-bold text-primary-dark">
                              {u.nombre[0].toUpperCase()}
                            </span>
                          </div>
                          <span className="font-medium text-gray-800">{u.nombre}</span>
                        </div>
                      </td>
                      <td className="px-5 py-3 text-gray-600">{u.email}</td>
                      <td className="px-5 py-3">
                        <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold ${rolBadge[u.rol]}`}>
                          {u.rol === 'ADMIN'
                            ? <ShieldCheck size={11} />
                            : <Package size={11} />
                          }
                          {rolLabel[u.rol]}
                        </span>
                      </td>
                      <td className="px-5 py-3 text-gray-600">
                        {u.almacen?.nombre ?? <span className="text-tin">—</span>}
                      </td>
                      <td className="px-5 py-3">
                        <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${
                          u.activo
                            ? 'bg-primary-pale text-primary-dark'
                            : 'bg-tin-pale text-tin-dark'
                        }`}>
                          {u.activo ? 'Activo' : 'Inactivo'}
                        </span>
                      </td>
                      <td className="px-5 py-3 text-tin-dark text-xs">{formatFecha(u.creadoEn)}</td>
                      <td className="px-3 py-3">
                        <div className="flex items-center gap-1 justify-end">
                          <button
                            onClick={() => openEdit(u.id)}
                            className="p-1.5 rounded-lg hover:bg-tin-pale transition-colors active:scale-95 duration-100"
                            title="Editar"
                          >
                            <Pencil size={14} className="text-tin-dark" />
                          </button>
                          {/* No puede desactivarse a sí mismo, ni a alguien ya inactivo */}
                          {!esSelf && u.activo && (
                            <button
                              onClick={() => setConfirmId(u.id)}
                              className="p-1.5 rounded-lg hover:bg-red-50 transition-colors active:scale-95 duration-100"
                              title="Desactivar"
                            >
                              <UserX size={14} className="text-red-500" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>

          {/* ── Cards mobile ── */}
          <div className="md:hidden space-y-3">
            {usuarios.map(u => {
              const esSelf = u.id === yo?.id
              return (
                <div
                  key={u.id}
                  className={`bg-white rounded-2xl border border-tin/20 shadow-sm p-4 ${!u.activo ? 'opacity-50' : ''}`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div className="w-9 h-9 rounded-full bg-primary/15 flex items-center justify-center shrink-0">
                        <span className="text-sm font-bold text-primary-dark">
                          {u.nombre[0].toUpperCase()}
                        </span>
                      </div>
                      <div className="min-w-0">
                        <p className="font-semibold text-gray-800 text-sm truncate">{u.nombre}</p>
                        <p className="text-xs text-tin-dark truncate">{u.email}</p>
                      </div>
                    </div>
                    <div className="flex gap-1 shrink-0">
                      <button
                        onClick={() => openEdit(u.id)}
                        className="p-1.5 rounded-lg hover:bg-tin-pale transition-colors active:scale-95 duration-100"
                      >
                        <Pencil size={14} className="text-tin-dark" />
                      </button>
                      {!esSelf && u.activo && (
                        <button
                          onClick={() => setConfirmId(u.id)}
                          className="p-1.5 rounded-lg hover:bg-red-50 transition-colors active:scale-95 duration-100"
                        >
                          <UserX size={14} className="text-red-500" />
                        </button>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-2 mt-3 flex-wrap">
                    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold ${rolBadge[u.rol]}`}>
                      {u.rol === 'ADMIN' ? <ShieldCheck size={10} /> : <Package size={10} />}
                      {rolLabel[u.rol]}
                    </span>
                    <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${
                      u.activo ? 'bg-primary-pale text-primary-dark' : 'bg-tin-pale text-tin-dark'
                    }`}>
                      {u.activo ? 'Activo' : 'Inactivo'}
                    </span>
                    {u.almacen && (
                      <span className="text-xs text-tin-dark">{u.almacen.nombre}</span>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        </>
      )}

      {/* ── Modal crear / editar ── */}
      <FormUsuarioModal
        open={modalOpen}
        editingId={editingId}
        onClose={() => setModalOpen(false)}
      />

      {/* ── Confirm desactivar ── */}
      <ConfirmDialog
        open={confirmId !== null}
        title="¿Desactivar usuario?"
        description="El usuario no podrá ingresar al sistema. Podés reactivarlo después desde la edición."
        onConfirm={handleDesactivar}
        onCancel={() => setConfirmId(null)}
        loading={deleteMut.isPending}
      />
    </div>
  )
}
