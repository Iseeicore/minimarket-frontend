import { http, HttpResponse } from 'msw'

const API = import.meta.env.VITE_API_URL ?? 'http://localhost:3000'

// ── Fixtures ────────────────────────────────────────────────────────────────

const ventasHoy = [
  { id: 1, total: '150.00', estado: 'COMPLETADA', creadoEn: new Date().toISOString() },
  { id: 2, total: '85.50', estado: 'COMPLETADA', creadoEn: new Date().toISOString() },
]

const ordenesSalida = {
  data: [
    {
      id: 1, numero: 1, tipo: 'VENTA', estado: 'COMPLETADA',
      almacenId: 1, solicitadoPor: 1, totalProductos: 2, totalUnidades: 5,
      creadoEn: new Date().toISOString(), completadoEn: new Date().toISOString(),
      detalles: [
        { id: 1, ordenSalidaId: 1, varianteId: 1, cantidad: 3, origen: 'ALMACEN',
          variante: { id: 1, nombre: 'Tarro', sku: null, precioVenta: '5.00',
            producto: { id: 1, nombre: 'Leche Gloria' }, unidad: { id: 1, nombre: 'Unidad', abreviatura: 'und' } } },
      ],
      solicitante: { id: 1, nombre: 'Maria Tienda' },
    },
  ],
  meta: { total: 1, page: 1, limit: 10, totalPages: 1 },
}

const cajaActiva = {
  id: 1, almacenId: 1, estado: 'ABIERTA', montoApertura: '100.00',
  creadoEn: new Date().toISOString(),
}

const estadoCaja = {
  estado: 'ABIERTA_HOY', requiereAccion: false, caja: cajaActiva,
}

const stockDual = [
  {
    varianteId: 1, almacen: 50, tienda: 10, total: 60, stockMinimo: 5,
    inicioHoy: 65, salidaHoy: 5, ingresoHoy: 0,
    variante: { id: 1, nombre: 'Tarro', sku: null, precioVenta: '5.00',
      producto: { id: 1, nombre: 'Leche Gloria' }, unidad: { id: 1, nombre: 'Unidad', abreviatura: 'und' } },
  },
  {
    varianteId: 2, almacen: 0, tienda: 3, total: 3, stockMinimo: 10,
    inicioHoy: 8, salidaHoy: 5, ingresoHoy: 0,
    variante: { id: 2, nombre: 'Clasica 42g', sku: null, precioVenta: '1.50',
      producto: { id: 2, nombre: 'Papas Lays' }, unidad: { id: 2, nombre: 'Unidad', abreviatura: 'und' } },
  },
]

const registrosTienda = {
  data: [
    { id: 1, almacenId: 1, varianteId: 1, tipo: 'SALIDA', cantidad: 3, devuelto: false,
      creadoEn: new Date().toISOString(),
      variante: { id: 1, nombre: 'Tarro', sku: null, producto: { id: 1, nombre: 'Leche Gloria' } } },
  ],
  meta: { total: 1, page: 1, limit: 10, totalPages: 1 },
}

const conteoPorDia: Record<string, number> = {}
const hoy = new Date().toISOString().slice(0, 10)
conteoPorDia[hoy] = 7

const registrosAlmacen = {
  data: [
    { id: 1, almacenId: 1, varianteId: 1, tipo: 'SALIDA', cantidad: 3, devuelto: false,
      creadoEn: new Date().toISOString(),
      variante: { id: 1, nombre: 'Tarro', sku: null, producto: { id: 1, nombre: 'Leche Gloria' } } },
  ],
  meta: { total: 1, page: 1, limit: 200, totalPages: 1 },
}

const sincronizaciones = {
  data: [
    { id: 1, almacenId: 1, tipo: 'CIERRE_DIA', estado: 'COMPLETADA',
      periodoDesde: new Date().toISOString(), periodoHasta: new Date().toISOString(),
      totalItems: 5, totalDiferencias: 0, creadoEn: new Date().toISOString(),
      reconciliacion: [] },
  ],
  meta: { total: 1, page: 1, limit: 10, totalPages: 1 },
}

const pendientesTienda: unknown[] = []

// ── Handlers ────────────────────────────────────────────────────────────────

export const handlers = [
  // Ventas
  http.get(`${API}/ventas/hoy`, () => HttpResponse.json(ventasHoy)),

  // Ordenes de salida (paginado)
  http.get(`${API}/ordenes-salida`, () => HttpResponse.json(ordenesSalida)),

  // Caja
  http.get(`${API}/caja/activa/:almacenId`, () => HttpResponse.json(cajaActiva)),
  http.get(`${API}/caja/estado/:almacenId`, () => HttpResponse.json(estadoCaja)),

  // Stock dual
  http.get(`${API}/stock/dual/:almacenId`, () => HttpResponse.json(stockDual)),

  // Registros tienda
  http.get(`${API}/registros-tienda`, ({ request }) => {
    const url = new URL(request.url)
    if (url.pathname.includes('conteo-por-dia')) return HttpResponse.json(conteoPorDia)
    return HttpResponse.json(registrosTienda)
  }),
  http.get(`${API}/registros-tienda/conteo-por-dia`, () => HttpResponse.json(conteoPorDia)),

  // Registros almacen
  http.get(`${API}/registros-almacen`, () => HttpResponse.json(registrosAlmacen)),
  http.get(`${API}/registros-almacen/pendientes-tienda`, () => HttpResponse.json(pendientesTienda)),

  // Sincronizacion
  http.get(`${API}/sincronizacion`, () => HttpResponse.json(sincronizaciones)),
  http.get(`${API}/sincronizacion/:id`, () => HttpResponse.json(sincronizaciones.data[0])),
]
