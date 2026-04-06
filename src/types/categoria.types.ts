export interface Categoria {
  id: number
  nombre: string
  descripcion: string | null
}

export interface CreateCategoriaDto {
  nombre: string
  descripcion?: string
}

export type UpdateCategoriaDto = Partial<CreateCategoriaDto>
