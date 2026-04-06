import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { qk } from '../lib/query-keys'
import { productosService, variantesService } from '../services/productos.service'
import { sileo } from 'sileo'

export function useProductos() {
  return useQuery({ queryKey: qk.productos.all, queryFn: productosService.getAll })
}

export function useProducto(id: number) {
  return useQuery({ queryKey: qk.productos.detail(id), queryFn: () => productosService.getOne(id), enabled: !!id })
}

export function useCreateProducto() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: productosService.create,
    onSuccess: () => { qc.invalidateQueries({ queryKey: qk.productos.all }); sileo.success('Producto creado') },
    onError: () => sileo.error('Error al crear el producto'),
  })
}

export function useUpdateProducto() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: any }) => productosService.update(id, data),
    onSuccess: () => { qc.invalidateQueries({ queryKey: qk.productos.all }); sileo.success('Producto actualizado') },
    onError: () => sileo.error('Error al actualizar el producto'),
  })
}

export function useDeleteProducto() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: productosService.remove,
    onSuccess: () => { qc.invalidateQueries({ queryKey: qk.productos.all }); sileo.success('Producto eliminado') },
    onError: () => sileo.error('Error al eliminar el producto'),
  })
}

export function useVariantes(search?: string) {
  return useQuery({
    queryKey: search ? qk.variantes.search(search) : qk.variantes.all,
    queryFn: () => variantesService.getAll(search),
    enabled: !search || search.length >= 2,
  })
}

export function useCreateVariante() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: variantesService.create,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: qk.productos.all })
      qc.invalidateQueries({ queryKey: qk.variantes.all })
      sileo.success('Variante creada')
    },
    onError: () => sileo.error('Error al crear la variante'),
  })
}

export function useUpdateVariante() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: any }) => variantesService.update(id, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: qk.productos.all })
      qc.invalidateQueries({ queryKey: qk.variantes.all })
      sileo.success('Variante actualizada')
    },
    onError: () => sileo.error('Error al actualizar la variante'),
  })
}
