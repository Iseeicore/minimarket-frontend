export interface Almacen {
  id: number
  empresaId: number
  nombre: string
  direccion: string | null
  empresa?: { nombre: string }
}

export interface CreateAlmacenDto {
  empresaId: number
  nombre: string
  direccion?: string
}

export type UpdateAlmacenDto = Partial<CreateAlmacenDto>
