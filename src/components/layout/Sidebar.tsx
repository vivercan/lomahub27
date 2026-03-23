import { useState } from 'react'
import { NavLink, useNavigate } from 'react-router-dom'
import {
  LayoutDashboard, Users, TrendingUp, FileText, Truck, Map,
  MessageSquare, BarChart3, DollarSign, Settings, LogOut,
  ChevronLeft, ChevronRight, Radio, Package, Clock, Send,
  Headphones, Activity, Target, Calculator, Calendar,
  Search, Building2, ArrowLeftRight, Thermometer,
  Layers, Bell, AlertTriangle, Mail, Zap, FolderOpen, Plug,
  Filter, FileSignature
} from 'lucide-react'
import { tokens } from '../../lib/tokens'
import { Logo } from '../ui/Logo'
import { useAuthContext } from '../../hooks/AuthContext'
import type { Rol } from '../../types/auth'
import { checkCustomAccess } from '../../types/auth'

interface NavItem {
  label: string
  path: string
  icon: React.ReactNode
  roles: Rol[]
}

const navItems: NavItem[] = [
  { label: 'War Room', path: '/war-room', icon: <LayoutDashboard size={18} />, roles: ['superadmin', 'admin', 'cs', 'ventas', 'direccion'] },
  { label: 'Dashboard', path: '/dashboard', icon: <LayoutDashboard size={18} />, roles: ['superadmin', 'admin'] },

  // âââ Ventas âââ
  { label: 'Dashboard Ventas', path: '/ventas/dashboard', icon: <TrendingUp size={18} />, roles: ['superadmin', 'admin', 'cs', 'ventas', 'gerente_comercial'] },
  { label: 'Panel de Oportunidades', path: '/ventas/mis-leads', icon: <Target size={18} />, roles: ['superadmin', 'admin', 'cs', 'ventas', 'gerente_comercial'] },
  { label: 'Agregar Lead', path: '/ventas/leads/nuevo', icon: <Users size={18} />, roles: ['superadmin', 'admin', 'cs', 'ventas', 'gerente_comercial'] },

  // âââ Cotizador / Pricing âââ
  { label: 'Cotizador', path: '/cotizador/nueva', icon: <FileText size={18} />, roles: ['superadmin', 'admin', 'cs', 'ventas', 'gerente_comercial', 'pricing'] },
  { label: 'Firma Digital', path: '/cotizador/firma-digital', icon: <FileSignature size={18} />, roles: ['superadmin', 'admin', 'ventas', 'gerente_comercial', 'pricing'] },
  { label: 'Cerebro Tarifario', path: '/pricing/cerebro-tarifario', icon: <Calculator size={18} />, roles: ['superadmin', 'admin', 'pricing', 'gerente_comercial', 'direccion'] },

  // âââ Clientes âââ
  { label: 'Alta de Cliente', path: '/clientes/alta', icon: <Users size={18} />, roles: ['superadmin', 'admin', 'cs', 'ventas', 'gerente_comercial', 'supervisor_cs', 'cxc', 'pricing'] },
  { label: 'Corporativos', path: '/clientes/corporativos', icon: <Building2 size={18} />, roles: ['superadmin', 'admin', 'cs', 'ventas'] },

  // âââ Operaciones âââ
  { label: 'Despachos', path: '/operaciones/despachos', icon: <Truck size={18} />, roles: ['superadmin', 'admin', 'cs', 'ventas', 'supervisor_cs'] },
  { label: 'Torre de Control', path: '/operaciones/torre-control', icon: <Radio size={18} />, roles: ['superadmin', 'admin', 'cs', 'ventas', 'supervisor_cs', 'operaciones', 'gerente_ops', 'direccion'] },
  { label: 'Mapa GPS', path: '/operaciones/mapa', icon: <Map size={18} />, roles: ['superadmin', 'admin', 'cs', 'ventas', 'supervisor_cs', 'operaciones', 'gerente_ops', 'direccion'] },
  { label: 'Dedicados', path: '/operaciones/dedicados', icon: <Truck size={18} />, roles: ['superadmin', 'admin', 'cs', 'ventas', 'operaciones', 'gerente_ops'] },
  { label: 'Prog. Dedicados', path: '/operaciones/programacion-dedicados', icon: <Calendar size={18} />, roles: ['superadmin', 'admin', 'operaciones', 'gerente_ops', 'direccion'] },
  { label: 'Prog. IMPEX', path: '/operaciones/programacion-impex', icon: <ArrowLeftRight size={18} />, roles: ['superadmin', 'admin', 'operaciones', 'gerente_ops', 'direccion'] },
  { label: 'Cruce Fronterizo', path: '/operaciones/cruce-fronterizo', icon: <ArrowLeftRight size={18} />, roles: ['superadmin', 'admin', 'operaciones', 'gerente_ops'] },
  { label: 'Control Temperatura', path: '/operaciones/control-temperatura', icon: <Thermometer size={18} />, roles: ['superadmin', 'admin', 'operaciones', 'gerente_ops'] },
  { label: 'PlaneaciÃ³n Flota', path: '/operaciones/planeacion-flota', icon: <Layers size={18} />, roles: ['superadmin', 'admin', 'operaciones', 'gerente_ops'] },
  { label: 'Cajas', path: '/operaciones/cajas', icon: <Package size={18} />, roles: ['superadmin', 'admin', 'cs', 'ventas', 'operaciones'] },
  { label: 'Tractos', path: '/operaciones/tractos', icon: <Truck size={18} />, roles: ['superadmin', 'admin', 'cs', 'ventas', 'operaciones', 'gerente_ops'] },
  { label: 'Disponibilidad', path: '/operaciones/disponibilidad', icon: <Clock size={18} />, roles: ['superadmin', 'admin', 'cs', 'ventas', 'gerente_ops', 'direccion'] },
  { label: 'Oferta Equipo', path: '/operaciones/oferta-equipo', icon: <Send size={18} />, roles: ['superadmin', 'admin', 'cs', 'ventas'] },
  { label: 'Rentabilidad', path: '/operaciones/rentabilidad', icon: <Calculator size={18} />, roles: ['superadmin', 'admin', 'operaciones', 'gerente_ops', 'direccion'] },

  // âââ Servicio âââ
  { label: 'Dashboard CS', path: '/servicio/dashboard', icon: <Headphones size={18} />, roles: ['superadmin', 'admin', 'cs', 'supervisor_cs'] },
  { label: 'WhatsApp', path: '/servicio/whatsapp', icon: <MessageSquare size={18} />, roles: ['superadmin', 'admin', 'cs', 'supervisor_cs'] },
  { label: 'MÃ©tricas Servicio', path: '/servicio/metricas', icon: <Activity size={18} />, roles: ['superadmin', 'admin', 'cs', 'supervisor_cs', 'direccion'] },
  { label: 'Tickets / Quejas', path: '/servicio/tickets', icon: <AlertTriangle size={18} />, roles: ['superadmin', 'admin', 'cs', 'supervisor_cs', 'direccion'] },
  { label: 'ComunicaciÃ³n Proactiva', path: '/servicio/comunicacion-proactiva', icon: <Bell size={18} />, roles: ['superadmin', 'admin', 'cs', 'supervisor_cs'] },
  { label: 'Escalamiento WA', path: '/servicio/escalamiento-whatsapp', icon: <Zap size={18} />, roles: ['superadmin', 'admin', 'cs'] },

  // âââ Comunicaciones âââ
  { label: 'Correos AutomÃ¡ticos', path: '/comunicaciones/correos', icon: <Mail size={18} />, roles: ['superadmin', 'admin', 'cs', 'ventas', 'gerente_comercial'] },
  { label: 'Notificaciones', path: '/comunicaciones/notificaciones', icon: <Bell size={18} />, roles: ['superadmin', 'admin', 'cs', 'ventas', 'operaciones', 'gerente_ops', 'supervisor_cs', 'direccion'] },

  // âââ Inteligencia âââ
  { label: 'KPI / AnalÃ­tica', path: '/inteligencia', icon: <BarChart3 size={18} />, roles: ['superadmin', 'admin', 'cs', 'ventas', 'direccion', 'gerente_comercial', 'gerente_ops'] },
  { label: 'Presupuesto', path: '/inteligencia/presupuesto', icon: <DollarSign size={18} />, roles: ['superadmin', 'admin', 'direccion', 'gerente_comercial', 'gerente_ops'] },
  { label: 'AnÃ¡lisis 80/20', path: '/inteligencia/pareto', icon: <Target size={18} />, roles: ['superadmin', 'admin', 'direccion', 'gerente_comercial', 'gerente_ops'] },

  // âââ CXC âââ
  { label: 'CXC / Cartera', path: '/cxc/cartera', icon: <DollarSign size={18} />, roles: ['superadmin', 'admin', 'cs', 'ventas', 'cxc', 'direccion'] },

  // âââ MÃ³dulos Fase 2 âââ
  { label: 'Actividades', path: '/actividades', icon: <Zap size={18} />, roles: ['superadmin', 'admin', 'cs', 'ventas', 'gerente_comercial', 'supervisor_cs'] },
  { label: 'Documentos', path: '/documentos', icon: <FolderOpen size={18} />, roles: ['superadmin', 'admin', 'cs', 'ventas', 'operaciones', 'gerente_ops', 'cxc'] },

  // âââ Admin âââ
  { label: 'ConfiguraciÃ³n', path: '/admin/configuracion', icon: <Settings size={18} />, roles: ['superadmin', 'admin'] },
  { label: 'Integraciones', path: '/admin/integraciones', icon: <Plug size={18} />, roles: ['superadmin', 'admin'] },
]

export function Sidebar() {
  const [collapsed, setCollapsed] = useState(false)
  const { user, logout } = useAuthContext()
  const navigate = useNavigate()

  if (!user) return null

  // If user has permisosCustom, only show routes matching those permissions
  const visibleItems = user.permisosCustom && user.permisosCustom.length > 0
    ? navItems.filter(item => checkCustomAccess(user.permisosCustom!, item.path))
    : navItems.filter(item => item.roles.includes(user.rol))

  const handleLogout = async () => {
    try {
      await logout()
      // logout() will handle navigation with page reload
    } catch (error) {
      console.error('Logout failed:', error)
    }
  }

  return (
    <aside
      className="h-screen flex flex-col transition-all duration-300 border-r"
      style={{
        width: collapsed ? '64px' : '240px',
        background: tokens.colors.bgCard,
        borderColor: tokens.colors.border,
      }}
    >
      {/* Logo */}
      <div className="flex items-center justify-between px-3 py-4 border-b" style={{ borderColor: tokens.colors.border }}>
        {!collapsed && <Logo variant="text" size={48} />}
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="p-1 rounded hover:bg-opacity-20"
          style={{ color: tokens.colors.textMuted }}
        >
          {collapsed ? <ChevronRight size={18} /> : <ChevronLeft size={18} />}
        </button>
      </div>

      {/* Nav */}
      <nav className="flex-1 overflow-y-auto py-2 px-2">
        {visibleItems.map(item => (
          <NavLink
            key={item.path}
            to={item.path}
            className={({ isActive }) =>
              `flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-all mb-0.5 ${isActive ? 'font-medium' : ''}`
            }
            style={({ isActive }) => ({
              background: isActive ? `${tokens.colors.primary}22` : 'transparent',
              color: isActive ? tokens.colors.primary : tokens.colors.textSecondary,
              fontFamily: tokens.fonts.body,
            })}
            title={collapsed ? item.label : undefined}
          >
            {item.icon}
            {!collapsed && <span>{item.label}</span>}
          </NavLink>
        ))}
      </nav>

      {/* User + Logout */}
      <div className="border-t px-3 py-3" style={{ borderColor: tokens.colors.border }}>
        {!collapsed && (
          <div className="mb-2">
            <p className="text-xs font-medium truncate" style={{ color: tokens.colors.textPrimary }}>{user.email}</p>
            <p className="text-xs truncate" style={{ color: tokens.colors.textMuted }}>{user.rol}</p>
          </div>
        )}
        <button
          onClick={handleLogout}
          className="flex items-center gap-2 text-sm w-full px-2 py-1.5 rounded hover:bg-opacity-20 transition-colors"
          style={{ color: tokens.colors.red }}
        >
          <LogOut size={16} />
          {!collapsed && 'Cerrar SesiÃ³n'}
        </button>
      </div>
    </aside>
  )
}
