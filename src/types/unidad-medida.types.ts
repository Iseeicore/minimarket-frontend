export interface UnidadMedida {
  id: number
  nombre: string
  abreviatura: string
}

export interface CreateUnidadMedidaDto {
  nombre: string
  abreviatura: string
}

export type UpdateUnidadMedidaDto = Partial<CreateUnidadMedidaDto>
