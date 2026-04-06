import { Outlet, NavLink, useNavigate } from 'react-router-dom'
import { useAuthStore } from '../../store/auth.store'
import { Home, BookOpen, GitCompare, LogOut, Store, Package } from 'lucide-react'

const NAV_TABS = [
  { to: '/tienda',                label: 'Inicio',      icon: Home,      end: true  },
  { to: '/tienda/stock',          label: 'Stock',       icon: Package,   end: false },
  { to: '/tienda/cuaderno',       label: 'Cuaderno',    icon: BookOpen,  end: false },
  { to: '/tienda/sincronizacion', label: 'Sincronizar', icon: GitCompare, end: false },
]

export default function TiendaLayout() {
  const { usuario, logout } = useAuthStore()
  const navigate = useNavigate()

  function handleLogout() {
    logout()
    navigate('/login')
  }

  const nombre = usuario?.nombre?.split(' ')[0] ?? ''

  return (
    <div className="flex flex-col min-h-screen bg-tin-pale">

      {/* ── Cabecera ── */}
      <header className="bg-gray-900 px-4 py-3 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center shrink-0">
            <Store size={16} className="text-gray-900" />
          </div>
          <span className="font-bold text-white text-base">MiniMarket</span>
        </div>

        <div className="flex items-center gap-3">
          {nombre && (
            <p className="text-sm font-medium text-gray-300 hidden sm:block">{usuario?.nombre}</p>
          )}
          <button
            onClick={handleLogout}
            className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm text-gray-400 hover:text-white hover:bg-white/10 transition-colors min-h-[2.75rem]"
          >
            <LogOut size={16} />
            <span className="hidden sm:inline text-sm">Salir</span>
          </button>
        </div>
      </header>

      {/* ── Contenido ── */}
      <main className="flex-1 overflow-auto pb-24">
        <div className="p-4 sm:p-6 max-w-2xl mx-auto">
          <Outlet />
        </div>
      </main>

      {/* ── Nav inferior (bottom tabs) ── */}
      <nav className="fixed bottom-0 inset-x-0 bg-white border-t border-tin/20 grid grid-cols-4 z-40 safe-area-inset-bottom">
        {NAV_TABS.map(({ to, label, icon: Icon, end }) => (
          <NavLink
            key={to}
            to={to}
            end={end}
            className={({ isActive }) =>
              `flex flex-col items-center justify-center py-3 gap-1 transition-colors duration-150 min-h-[3.5rem] ${
                isActive ? 'text-primary-dark' : 'text-tin hover:text-slate-700'
              }`
            }
          >
            {({ isActive }) => (
              <>
                <Icon size={24} strokeWidth={isActive ? 2.5 : 1.5} />
                <span className="text-xs font-semibold tracking-wide">{label}</span>
                {isActive && (
                  <span className="absolute bottom-0 left-1/2 -translate-x-1/2 w-8 h-0.5 bg-primary rounded-t-full" />
                )}
              </>
            )}
          </NavLink>
        ))}
      </nav>
    </div>
  )
}
