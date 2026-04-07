import api from '../lib/axios'

export interface CargaMasivaResult {
  categorias: number
  productos: number
  variantes: number
  stockAlmacen: number
  stockTienda: number
}

export const cargaMasivaService = {
  cargarCatalogo: (file: File, almacenId: number) => {
    const formData = new FormData()
    formData.append('archivo', file)
    return api
      .post<CargaMasivaResult>(`/carga-masiva/catalogo?almacenId=${almacenId}`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      })
      .then((r) => r.data)
  },
}
