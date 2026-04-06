import type { RolUsuario } from './common.types'

export interface Usuario {
  id: number
  nombre: string
  email: string
  rol: RolUsuario
  activo: boolean
  almacenId: number | null
  empresaId: number
  creadoEn: string
  empresa?: { id: number; nombre: string }
  almacen?: { id: number; nombre: string } | null
}

export interface CreateUsuarioDto {
  nombre: string
  email: string
  password: string
  rol: RolUsuario
  almacenId?: number
}

export interface UpdateUsuarioDto {
  nombre?: string
  rol?: RolUsuario
  almacenId?: number | null
  activo?: boolean
  password?: string
}
