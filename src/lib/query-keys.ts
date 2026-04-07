export const qk = {
  categorias: {
    all: ['categorias'] as const,
    detail: (id: number) => ['categorias', id] as const,
  },
  unidadesMedida: {
    all: ['unidades-medida'] as const,
    detail: (id: number) => ['unidades-medida', id] as const,
  },
  almacenes: {
    all: ['almacenes'] as const,
    detail: (id: number) => ['almacenes', id] as const,
  },
  productos: {
    all: ['productos'] as const,
    detail: (id: number) => ['productos', id] as const,
  },
  variantes: {
    all: ['variantes'] as const,
    search: (q: string) => ['variantes', 'search', q] as const,
    byProducto: (productoId: number) => ['variantes', 'producto', productoId] as const,
  },
  contactos: {
    all: ['contactos'] as const,
    byTipo: (tipo: string) => ['contactos', tipo] as const,
    detail: (id: number) => ['contactos', id] as const,
  },
  compras: {
    all: ['compras'] as const,
    list: (page: number, limit: number) => ['compras', 'list', page, limit] as const,
    detail: (id: number) => ['compras', id] as const,
    pagos: (id: number) => ['compras', id, 'pagos'] as const,
  },
  ventas: {
    all: ['ventas'] as const,
    hoy: (almacenId?: number) =>
      almacenId
        ? ['ventas', 'hoy', almacenId] as const
        : ['ventas', 'hoy'] as const,
    detail: (id: number) => ['ventas', id] as const,
  },
  caja: {
    all: ['cajas'] as const,
    activa: (almacenId: number) => ['caja', 'activa', almacenId] as const,
    estado: (almacenId: number) => ['caja', 'estado', almacenId] as const,
    detail: (id: number) => ['caja', id] as const,
    movimientos: (id: number) => ['caja', id, 'movimientos'] as const,
  },
  devoluciones: {
    all: ['devoluciones'] as const,
    list: (page: number, limit: number) => ['devoluciones', 'list', page, limit] as const,
    detail: (id: number) => ['devoluciones', id] as const,
  },
  bitacora: {
    all: ['bitacora'] as const,
    list: (page: number, limit: number, almacenId?: number) =>
      almacenId
        ? ['bitacora', 'list', page, limit, almacenId] as const
        : ['bitacora', 'list', page, limit] as const,
  },
  stock: {
    byAlmacen: (almacenId: number) => ['stock', almacenId] as const,
    movimientos: (page: number, limit: number, almacenId?: number) =>
      almacenId
        ? ['stock', 'movimientos', page, limit, almacenId] as const
        : ['stock', 'movimientos', page, limit] as const,
  },
  dashboard: {
    summary:      ['dashboard', 'summary'] as const,
    ventasSemana: ['dashboard', 'ventas-semana'] as const,
    // Sin fecha = hoy (live). Con fecha = histórico (caché infinito)
    listaDiaCruda: (fecha?: string) =>
      fecha ? ['dashboard', 'lista-dia', 'cruda', fecha] as const
            : ['dashboard', 'lista-dia', 'cruda'] as const,
    listaDia: (fecha?: string) =>
      fecha ? ['dashboard', 'lista-dia', fecha] as const
            : ['dashboard', 'lista-dia'] as const,
    // Histórico paginado desde ResumenDia
    historico: (page: number, limit: number, almacenId?: number) =>
      ['dashboard', 'historico', page, limit, almacenId ?? 'todos'] as const,
  },
  // Cuaderno del JEFE_ALMACEN
  registroAlmacen: {
    all:              ['registro-almacen'] as const,
    byAlmacen:        (almacenId: number) => ['registro-almacen', almacenId] as const,
    detail:           (id: number)        => ['registro-almacen', 'detail', id] as const,
    pendientesTienda: (almacenId: number, horas: number) =>
      ['registro-almacen', 'pendientes-tienda', almacenId, horas] as const,
  },
  // Cuaderno del JEFE_VENTA
  registroTienda: {
    all:          ['registro-tienda'] as const,
    byAlmacen:    (almacenId: number) => ['registro-tienda', almacenId] as const,
    detail:       (id: number)        => ['registro-tienda', 'detail', id] as const,
  },
  // Sincronización almacén ↔ tienda
  sincronizacion: {
    all:          ['sincronizacion'] as const,
    byAlmacen:    (almacenId: number) => ['sincronizacion', almacenId] as const,
    detail:       (id: number)        => ['sincronizacion', 'detail', id] as const,
    items:        (id: number)        => ['sincronizacion', id, 'items'] as const,
  },
  // Órdenes de salida (reemplaza sincronización para jefe_tienda)
  ordenesSalida: {
    all:        ['ordenes-salida'] as const,
    byAlmacen:  (almacenId: number) => ['ordenes-salida', almacenId] as const,
    detail:     (id: number)        => ['ordenes-salida', 'detail', id] as const,
    stockDual:  (almacenId: number) => ['ordenes-salida', 'stock-dual', almacenId] as const,
  },
} as const
