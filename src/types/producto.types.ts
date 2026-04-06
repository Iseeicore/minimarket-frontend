export interface UnidadBasica {
  id: number
  nombre: string
  abreviatura: string
}

export interface Variante {
  id: number
  productoId: number
  unidadId: number
  nombre: string
  sku: string | null
  costoBase: number
  precioVenta: number
  stockMinimo: number
  activo: boolean
  unidad?: UnidadBasica
  producto?: { id: number; nombre: string }
}

export interface Producto {
  id: number
  categoriaId: number
  nombre: string
  descripcion: string | null
  categoria?: { id: number; nombre: string }
  variantes?: Variante[]
}

export interface CreateProductoDto {
  categoriaId: number
  nombre: string
  descripcion?: string
}

export type UpdateProductoDto = Partial<CreateProductoDto>

export interface CreateVarianteDto {
  productoId: number
  unidadId: number
  nombre: string
  sku?: string
  costoBase: number
  precioVenta: number
  stockMinimo: number
  activo?: boolean
}

export type UpdateVarianteDto = Partial<CreateVarianteDto>
