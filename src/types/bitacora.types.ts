export interface EntradaBitacora {
  id:           number
  almacenId:    number
  usuarioId:    number
  contenido:    string       // campo real del backend (no 'texto')
  registradoEn: string       // campo real del backend (no 'creadoEn')
  almacen?: { id: number; nombre: string }
  usuario?: { id: number; nombre: string; rol: string }
}

export interface CreateEntradaBitacoraDto {
  almacenId: number           // requerido por el backend
  contenido: string           // campo real (no 'texto')
}
