import { create } from 'zustand'
import { persist } from 'zustand/middleware'

import type { RolUsuario } from '../types'

interface Usuario {
  id: number
  nombre: string
  email: string
  rol: RolUsuario
  almacenId: number | null
  empresaId: number | null
}

interface AuthState {
  token: string | null
  usuario: Usuario | null
  setAuth: (token: string, usuario: Usuario) => void
  logout: () => void
  isAdmin: () => boolean
  isJefeVenta: () => boolean
  isJefeAlmacen: () => boolean
  /** Puede operar en almacén (crear registros, notas de venta) */
  puedeOperar: () => boolean
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      token: null,
      usuario: null,
      setAuth: (token, usuario) => {
        localStorage.setItem('token', token)
        set({ token, usuario })
      },
      logout: () => {
        localStorage.removeItem('token')
        set({ token: null, usuario: null })
      },
      isAdmin:       () => get().usuario?.rol === 'ADMIN',
      isJefeVenta:   () => get().usuario?.rol === 'JEFE_VENTA',
      isJefeAlmacen: () => get().usuario?.rol === 'JEFE_ALMACEN',
      puedeOperar:   () => ['ADMIN', 'JEFE_ALMACEN', 'ALMACENERO'].includes(get().usuario?.rol ?? ''),
    }),
    { name: 'auth-storage' }
  )
)
