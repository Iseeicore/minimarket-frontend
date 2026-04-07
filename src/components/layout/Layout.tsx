import { useState } from 'react'
import { Outlet, NavLink, Navigate, useNavigate } from 'react-router-dom'
import { useAuthStore } from '../../store/auth.store'
import {
  LayoutDashboard, Package, Tag, Warehouse, Users,
  ShoppingCart, Receipt, CreditCard, RotateCcw,
  ClipboardList, BookOpen, LogOut, Store, Ruler,
  Boxes, UserCog, Contact, Menu, X, GitCompare, FileSpreadsheet,
  type LucideIcon,
} from 'lucide-react'
import type { RolUsuario } from '../../types'

// ── Estructura de grupos de navegación ────────────────────────

interface NavItem {
  to:           string
  label:        string
  icon:         LucideIcon
  adminOnly?:   boolean
  allowedRoles?: RolUsuario[]  // Si se define, solo esos roles ven el ítem
}

interface NavGroup {
  label?:       string
  adminOnly?:   boolean
  allowedRoles?: RolUsuario[]  // Si se define, solo esos roles ven el grupo
  items:        NavItem[]
}

// Agrupación semántica:
// Sin grupo   → Dashboard (punto de entrada, siempre visible)
// OPERACIONES → lo que el equipo hace todos los días
// INVENTARIO  → productos + stock; admins también editan catálogos
// CUADERNO    → módulos exclusivos JEFE_ALMACEN / JEFE_VENTA
// REPORTES    → consulta de lo ocurrido, sin mutaciones
// CONFIG      → datos maestros que raramente cambian (solo admin)
const NAV_GROUPS: NavGroup[] = [
  {
    items: [
      { to: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
    ],
  },
  {
    label: 'Operaciones',
    // Todos los roles excepto JEFE_VENTA ven el grupo completo de operaciones
    items: [
      { to: '/ventas',       label: 'Ventas',      icon: Receipt      },
      { to: '/compras',      label: 'Compras',     icon: ShoppingCart, allowedRoles: ['ADMIN', 'JEFE_ALMACEN', 'ALMACENERO'] },
      { to: '/caja',         label: 'Caja',        icon: CreditCard,   allowedRoles: ['ADMIN', 'JEFE_ALMACEN', 'ALMACENERO'] },
      { to: '/devoluciones', label: 'Devoluciones',icon: RotateCcw    },
      { to: '/contactos',    label: 'Contactos',   icon: Contact,      allowedRoles: ['ADMIN', 'JEFE_ALMACEN'] },
    ],
  },
  {
    label: 'Inventario',
    items: [
      { to: '/stock',           label: 'Stock',              icon: Boxes   },
      { to: '/productos',       label: 'Productos',          icon: Package,  adminOnly: true },
      { to: '/categorias',      label: 'Categorías',         icon: Tag,      adminOnly: true },
      { to: '/unidades-medida', label: 'Unidades de medida', icon: Ruler,    adminOnly: true },
    ],
  },
  {
    // Cuadernos virtuales — solo JEFE_ALMACEN y JEFE_VENTA (+ ADMIN que puede ver todo)
    label:        'Cuaderno',
    allowedRoles: ['ADMIN', 'JEFE_ALMACEN', 'JEFE_VENTA'],
    items: [
      {
        to: '/cuaderno-almacen',
        label: 'Cuaderno Almacén',
        icon: BookOpen,
        allowedRoles: ['ADMIN', 'JEFE_ALMACEN'],
      },
      {
        to: '/cuaderno-tienda',
        label: 'Cuaderno Tienda',
        icon: BookOpen,
        allowedRoles: ['ADMIN', 'JEFE_VENTA'],
      },
      {
        to: '/sincronizacion',
        label: 'Sincronización',
        icon: GitCompare,
        allowedRoles: ['ADMIN', 'JEFE_VENTA'],
      },
    ],
  },
  {
    label: 'Reportes',
    items: [
      { to: '/lista-dia', label: 'Lista del día', icon: ClipboardList },
      { to: '/bitacora',  label: 'Bitácora',      icon: BookOpen,      allowedRoles: ['ADMIN', 'ALMACENERO'] },
    ],
  },
  {
    label:     'Configuración',
    adminOnly: true,
    items: [
      { to: '/almacenes',           label: 'Almacenes',     icon: Warehouse       },
      { to: '/usuarios',            label: 'Usuarios',      icon: UserCog         },
      { to: '/admin/carga-masiva',  label: 'Carga masiva',  icon: FileSpreadsheet },
    ],
  },
]

// ── Ítem de nav ────────────────────────────────────────────────
function NavItem({ to, label, Icon }: { to: string; label: string; Icon: LucideIcon }) {
  return (
    <NavLink
      to={to}
      className={({ isActive }) =>
        `group flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm font-medium transition-all duration-150 ${
          isActive
            ? 'bg-primary/15 text-primary'
            : 'text-gray-400 hover:bg-white/5 hover:text-gray-200'
        }`
      }
    >
      {({ isActive }) => (
        <>
          <Icon
            size={16}
            className={`shrink-0 transition-colors ${isActive ? 'text-primary' : 'text-gray-500 group-hover:text-gray-300'}`}
          />
          <span className="truncate">{label}</span>
        </>
      )}
    </NavLink>
  )
}

// ── Sidebar interno (reutilizable para desktop y drawer mobile) ─
function SidebarContent({ onClose }: { onClose?: () => void }) {
  const { usuario, logout, isAdmin } = useAuthStore()
  const navigate                     = useNavigate()

  const rolActual = usuario?.rol ?? ''

  function canSeeItem(item: NavItem): boolean {
    if (item.adminOnly && !isAdmin()) return false
    if (item.allowedRoles && !item.allowedRoles.includes(rolActual as RolUsuario)) return false
    return true
  }

  function canSeeGroup(group: NavGroup): boolean {
    if (group.adminOnly && !isAdmin()) return false
    if (group.allowedRoles && !group.allowedRoles.includes(rolActual as RolUsuario)) return false
    return true
  }

  function handleLogout() {
    logout()
    navigate('/login')
  }

  return (
    <div className="flex flex-col h-full bg-gray-900">

      {/* ── Cabecera: logo + usuario ── */}
      <div className="px-4 pt-5 pb-4 border-b border-white/8">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center shrink-0">
              <Store size={16} className="text-gray-900" />
            </div>
            <span className="font-bold text-white text-base">MiniMarket</span>
          </div>
          {/* Botón cerrar — solo en drawer mobile */}
          {onClose && (
            <button
              onClick={onClose}
              className="p-1 text-gray-400 hover:text-white transition-colors lg:hidden"
            >
              <X size={18} />
            </button>
          )}
        </div>

        {/* Info del usuario logueado */}
        <div className="mt-3 flex items-center gap-2.5">
          <div className="w-7 h-7 rounded-full bg-primary/20 flex items-center justify-center shrink-0">
            <span className="text-xs font-bold text-primary">
              {usuario?.nombre?.[0]?.toUpperCase() ?? '?'}
            </span>
          </div>
          <div className="min-w-0">
            <p className="text-sm font-medium text-gray-200 truncate">{usuario?.nombre}</p>
            <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded uppercase tracking-wide ${
              isAdmin()
                ? 'bg-accent/20 text-accent-mid'
                : 'bg-white/8 text-gray-400'
            }`}>
              {usuario?.rol}
            </span>
          </div>
        </div>
      </div>

      {/* ── Nav agrupada ── */}
      <nav className="flex-1 overflow-y-auto px-2 py-3 space-y-4">
        {NAV_GROUPS.map((group, gi) => {
          if (!canSeeGroup(group)) return null

          const visibles = group.items.filter(i => canSeeItem(i))
          if (visibles.length === 0) return null

          return (
            <div key={gi}>
              {group.label && (
                <p className="px-3 pb-1.5 text-[10px] font-semibold text-gray-500 uppercase tracking-widest">
                  {group.label}
                </p>
              )}
              <div className="space-y-0.5">
                {visibles.map(item => (
                  <NavItem
                    key={item.to}
                    to={item.to}
                    label={item.label}
                    Icon={item.icon}
                  />
                ))}
              </div>
            </div>
          )
        })}
      </nav>

      {/* ── Pie: cerrar sesión ── */}
      <div className="px-2 py-3 border-t border-white/8">
        <button
          onClick={handleLogout}
          className="flex items-center gap-2.5 w-full px-3 py-2 rounded-lg text-sm text-gray-500 hover:bg-white/5 hover:text-gray-300 transition-all duration-150"
        >
          <LogOut size={15} className="shrink-0" />
          Cerrar sesión
        </button>
      </div>
    </div>
  )
}

// ── Layout principal ───────────────────────────────────────────
export default function Layout() {
  const [drawerOpen, setDrawerOpen] = useState(false)
  const rol = useAuthStore(s => s.usuario?.rol)

  // JEFE_VENTA tiene su propio layout — no pasa por acá
  if (rol === 'JEFE_VENTA') return <Navigate to="/tienda" replace />

  return (
    <div className="flex h-screen bg-tin-pale">

      {/* ── Sidebar desktop (fijo, ≥ lg) ── */}
      <aside className="hidden lg:flex lg:w-60 lg:shrink-0 lg:flex-col">
        <SidebarContent />
      </aside>

      {/* ── Drawer mobile (< lg) ── */}
      <>
        {/* Backdrop */}
        <div
          className={`fixed inset-0 z-40 bg-black/50 transition-opacity duration-200 lg:hidden ${
            drawerOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'
          }`}
          onClick={() => setDrawerOpen(false)}
        />
        {/* Panel */}
        <div
          className={`fixed inset-y-0 left-0 z-50 w-64 transition-transform duration-300 lg:hidden ${
            drawerOpen ? 'translate-x-0' : '-translate-x-full'
          }`}
        >
          <SidebarContent onClose={() => setDrawerOpen(false)} />
        </div>
      </>

      {/* ── Contenido principal ── */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">

        {/* Top bar mobile */}
        <header className="lg:hidden flex items-center gap-3 px-4 py-3 bg-white border-b border-tin/20 shrink-0">
          <button
            onClick={() => setDrawerOpen(true)}
            className="p-1.5 rounded-lg hover:bg-tin-pale transition-colors"
          >
            <Menu size={20} className="text-gray-700" />
          </button>
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded bg-primary flex items-center justify-center">
              <Store size={13} className="text-gray-900" />
            </div>
            <span className="font-bold text-gray-800 text-sm">MiniMarket</span>
          </div>
        </header>

        {/* Página */}
        <main className="flex-1 overflow-auto">
          <div className="p-4 sm:p-6 lg:p-8 xl:p-10">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  )
}
