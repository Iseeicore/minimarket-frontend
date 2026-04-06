import { Navigate, Outlet } from 'react-router-dom'
import { useAuthStore } from '../../store/auth.store'
import type { RolUsuario } from '../../types'

interface Props {
  adminOnly?: boolean
  roles?: RolUsuario[]   // Si se define, solo esos roles pueden acceder
}

export default function ProtectedRoute({ adminOnly = false, roles }: Props) {
  const { token, isAdmin, usuario } = useAuthStore()

  if (!token) return <Navigate to="/login" replace />
  if (adminOnly && !isAdmin()) return <Navigate to="/dashboard" replace />
  if (roles && roles.length > 0) {
    const rol = usuario?.rol
    if (!rol || !roles.includes(rol)) return <Navigate to="/dashboard" replace />
  }

  return <Outlet />
}
