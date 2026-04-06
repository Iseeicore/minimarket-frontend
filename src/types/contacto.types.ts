import type { TipoContacto } from './common.types'

export interface Contacto {
  id: number
  empresaId: number
  tipo: TipoContacto
  nombre: string
  tipoDoc: string | null
  nroDoc: string | null
  telefono: string | null
  email: string | null
  direccion: string | null
  notas: string | null
  creadoEn: string
}

export interface CreateContactoDto {
  empresaId: number
  tipo: TipoContacto
  nombre: string
  tipoDoc?: string
  nroDoc?: string
  telefono?: string
  email?: string
  direccion?: string
  notas?: string
}

export type UpdateContactoDto = Partial<CreateContactoDto>
