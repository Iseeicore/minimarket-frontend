import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import Layout from './components/layout/Layout'
import TiendaLayout from './components/layout/TiendaLayout'
import ProtectedRoute from './components/layout/ProtectedRoute'
import { useAuthStore } from './store/auth.store'
import LoginPage from './pages/LoginPage'
import RegisterPage from './pages/RegisterPage'
import DashboardPage from './pages/DashboardPage'
import VentasPage from './pages/VentasPage'
import ComprasPage from './pages/ComprasPage'
import CompraDetalle from './pages/CompraDetalle'
import CajaPage from './pages/CajaPage'
import DevolucionesPage from './pages/DevolucionesPage'
import ProductosPage from './pages/ProductosPage'
import CategoriasPage from './pages/CategoriasPage'
import AlmacenesPage from './pages/AlmacenesPage'
import UsuariosPage from './pages/UsuariosPage'
import UnidadesMedidaPage from './pages/UnidadesMedidaPage'
import ContactosPage from './pages/ContactosPage'
import StockPage from './pages/StockPage'
import BitacoraPage from './pages/BitacoraPage'
import ListaDiaPage from './pages/ListaDiaPage'
import CuadernoAlmacenPage from './pages/CuadernoAlmacenPage'
import CuadernoTiendaPage from './pages/CuadernoTiendaPage'
import SincronizacionPage from './pages/SincronizacionPage'
import SincronizacionDetallePage from './pages/SincronizacionDetallePage'
import TiendaHomePage from './pages/tienda/TiendaHomePage'
import TiendaCuadernoPage from './pages/tienda/TiendaCuadernoPage'
import TiendaVentasPage from './pages/tienda/TiendaVentasPage'
import TiendaStockPage from './pages/tienda/TiendaStockPage'
import TiendaImpresora from './pages/tienda/TiendaImpresora'
import TiendaTicketsPage from './pages/tienda/TiendaTicketsPage'

/** Redirige según rol: JEFE_VENTA → /tienda, resto → /dashboard */
function SmartRedirect() {
  const rol = useAuthStore(s => s.usuario?.rol)
  return <Navigate to={rol === 'JEFE_VENTA' ? '/tienda' : '/dashboard'} replace />
}

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5,
      retry: 1,
    },
  },
})

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
          <Route element={<ProtectedRoute />}>
            <Route element={<Layout />}>
              <Route path="/dashboard" element={<DashboardPage />} />
              <Route path="/ventas" element={<VentasPage />} />
              <Route path="/compras" element={<ComprasPage />} />
              <Route path="/compras/:id" element={<CompraDetalle />} />
              <Route path="/caja" element={<CajaPage />} />
              <Route path="/devoluciones" element={<DevolucionesPage />} />
              <Route path="/stock" element={<StockPage />} />
              <Route path="/contactos" element={<ContactosPage />} />
              <Route path="/bitacora" element={<BitacoraPage />} />
              <Route path="/lista-dia" element={<ListaDiaPage />} />

              {/* Cuadernos — JEFE_ALMACEN */}
              <Route
                element={<ProtectedRoute roles={['ADMIN', 'JEFE_ALMACEN']} />}
              >
                <Route path="/cuaderno-almacen" element={<CuadernoAlmacenPage />} />
              </Route>

              {/* Cuadernos — JEFE_VENTA (acceso desde sidebar para ADMIN) */}
              <Route
                element={<ProtectedRoute roles={['ADMIN', 'JEFE_VENTA']} />}
              >
                <Route path="/cuaderno-tienda" element={<CuadernoTiendaPage />} />
                <Route path="/sincronizacion" element={<SincronizacionPage />} />
                <Route path="/sincronizacion/:id" element={<SincronizacionDetallePage />} />
              </Route>

              {/* Admin only */}
              <Route element={<ProtectedRoute adminOnly />}>
                <Route path="/productos" element={<ProductosPage />} />
                <Route path="/categorias" element={<CategoriasPage />} />
                <Route path="/almacenes" element={<AlmacenesPage />} />
                <Route path="/unidades-medida" element={<UnidadesMedidaPage />} />
                <Route path="/usuarios" element={<UsuariosPage />} />
              </Route>
            </Route>
          </Route>

          {/* ── Layout exclusivo JEFE_VENTA ── */}
          <Route element={<ProtectedRoute roles={['ADMIN', 'JEFE_VENTA']} />}>
            <Route element={<TiendaLayout />}>
              <Route path="/tienda" element={<TiendaHomePage />} />
              <Route path="/tienda/cuaderno" element={<TiendaCuadernoPage />} />
              <Route path="/tienda/stock" element={<TiendaStockPage />} />
              <Route path="/tienda/ventas" element={<TiendaVentasPage />} />
              <Route path="/tienda/tickets" element={<TiendaTicketsPage />} />
              <Route path="/tienda/impresora" element={<TiendaImpresora />} />
            </Route>
          </Route>

          <Route path="*" element={<SmartRedirect />} />
        </Routes>
      </BrowserRouter>
    </QueryClientProvider>
  )
}
