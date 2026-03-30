import { useState } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import {
  LayoutDashboard, Target, Users, TrendingUp, FileText, FileSignature,
  Truck, Radio, Map, Package, Clock, Send, ArrowLeftRight, Thermometer,
  Layers, Calculator, Calendar, Headphones, MessageSquare, Activity,
  AlertTriangle, Bell, Zap, Mail, BarChart3, DollarSign, Settings,
  Plug, FolderOpen, ChevronDown, ChevronRight, PanelLeftClose, PanelLeft
} from 'lucide-react'
import { tokens } from '../../lib/tokens'
import { useAuthContext } from '../../hooks/AuthContext'
import type { Rol } from '../../types/auth'

interface SubItem {
  label: string
  path: string
  icon: React.ReactNode
  roles: Rol[]
}

interface ModuleGroup {
  id: string
  label: string
  icon: React.ReactNode
  items: SubItem[]
}

const modules: ModuleGroup[] = [
  {
    id: 'comercial',
    label: 'Comercial',
    icon: <TrendingUp size={18} />,
    items: [
      { label: 'Dashboard Ventas', path: '/ventas/dashboard', icon: <TrendingUp size={16} />, roles: ['superadmin', 'admin', 'cs', 'ventas'] },
      { label: 'Panel de Oportunidades', path: '/ventas/mis-leads', icon: <Target size={16} />, roles: ['superadmin', 'admin', 'cs', 'ventas'] },
      { label: 'Agregar Lead', path: '/ventas/leads/nuevo', icon: <Users size={16} />, roles: ['superadmin', 'admin', 'cs', 'ventas'] },
      { label: 'Cotizador', path: '/cotizador/nueva', icon: <FileText size={16} />, roles: ['superadmin', 'admin', 'cs', 'ventas'] },
      { label: 'Alta de Cliente', path: '/clientes/alta', icon: <Users size={16} />, roles: ['superadmin', 'admin', 'cs', 'ventas'] },
      { label: 'Funnel de Ventas', path: '/ventas/funnel', icon: <TrendingUp size={16} />, roles: ['superadmin', 'admin', 'ventas'] },
      { label: 'Comisiones', path: '/ventas/comisiones', icon: <Calculator size={16} />, roles: ['superadmin', 'admin', 'ventas'] },
      { label: 'Prospeccion', path: '/ventas/prospeccion', icon: <Search size={16} />, roles: ['superadmin', 'admin', 'ventas'] },
    ]
  },
  {
    id: 'operaciones',
    label: 'Operaciones',
    icon: <Truck size={18} />,
    items: [
      { label: 'Torre de Control', path: '/operaciones/torre-control', icon: <Radio size={16} />, roles: ['superadmin', 'admin', 'cs', 'operaciones'] },
      { label: 'Despachos', path: '/operaciones/despachos', icon: <Truck size={16} />, roles: ['superadmin', 'admin', 'cs', 'operaciones'] },
      { label: 'Mapa GPS', path: '/operaciones/mapa', icon: <Map size={16} />, roles: ['superadmin', 'admin', 'cs', 'operaciones'] },
      { label: 'Tractos', path: '/operaciones/tractos', icon: <Truck size={16} />, roles: ['superadmin', 'admin', 'operaciones'] },
      { label: 'Cajas', path: '/operaciones/cajas', icon: <Package size={16} />, roles: ['superadmin', 'admin', 'operaciones'] },
      { label: 'Cruce Fronterizo', path: '/operaciones/cruce-fronterizo', icon: <ArrowLeftRight size={16} />, roles: ['superadmin', 'admin', 'operaciones'] },
      { label: 'Rentabilidad', path: '/operaciones/rentabilidad', icon: <Calculator size={16} />, roles: ['superadmin', 'admin', 'operaciones'] },
    ]
  },
  {
    id: 'servicio',
    label: 'Servicio',
    icon: <Headphones size={18} />,
    items: [
      { label: 'Dashboard CS', path: '/servicio/dashboard', icon: <Headphones size={16} />, roles: ['superadmin', 'admin', 'cs'] },
      { label: 'WhatsApp', path: '/servicio/whatsapp', icon: <MessageSquare size={16} />, roles: ['superadmin', 'admin', 'cs'] },
      { label: 'Tickets', path: '/servicio/tickets', icon: <AlertTriangle size={16} />, roles: ['superadmin', 'admin', 'cs'] },
      { label: 'Metricas', path: '/servicio/metricas', icon: <Activity size={16} />, roles: ['superadmin', 'admin', 'cs'] },
    ]
  },
  {
    id: 'dedicados',
    label: 'Dedicados',
    icon: <Calendar size={18} />,
    items: [
      { label: 'Monitor Dedicados', path: '/operaciones/dedicados', icon: <Truck size={16} />, roles: ['superadmin', 'admin', 'cs', 'operaciones'] },
      { label: 'Prog. Dedicados', path: '/operaciones/programacion-dedicados', icon: <Calendar size={16} />, roles: ['superadmin', 'admin', 'operaciones'] },
      { label: 'Disponibilidad', path: '/operaciones/disponibilidad', icon: <Clock size={16} />, roles: ['superadmin', 'admin', 'operaciones'] },
      { label: 'Oferta Equipo', path: '/operaciones/oferta-equipo', icon: <Send size={16} />, roles: ['superadmin', 'admin', 'cs', 'ventas'] },
    ]
  },
  {
    id: 'cobranza',
    label: 'Cobranza',
    icon: <DollarSign size={18} />,
    items: [
      { label: 'Cartera', path: '/cxc/cartera', icon: <DollarSign size={16} />, roles: ['superadmin', 'admin', 'cs', 'ventas'] },
      { label: 'Aging Report', path: '/cxc/aging', icon: <BarChart3 size={16} />, roles: ['superadmin', 'admin', 'cs'] },
      { label: 'Acciones de Cobro', path: '/cxc/acciones', icon: <Zap size={16} />, roles: ['superadmin', 'admin', 'cs'] },
    ]
  },
  {
    id: 'comunicaciones',
    label: 'Comunicaciones',
    icon: <Mail size={18} />,
    items: [
      { label: 'Correos', path: '/comunicaciones/correos', icon: <Mail size={16} />, roles: ['superadmin', 'admin', 'cs', 'ventas'] },
      { label: 'Notificaciones', path: '/comunicaciones/notificaciones', icon: <Bell size={16} />, roles: ['superadmin', 'admin', 'cs', 'ventas', 'operaciones'] },
      { label: 'AI Chief of Staff', path: '/comunicaciones/chief-of-staff', icon: <Zap size={16} />, roles: ['superadmin', 'admin'] },
    ]
  },
  {
    id: 'inteligencia',
    label: 'Inteligencia',
    icon: <BarChart3 size={18} />,
    items: [
      { label: 'KPI / Analitica', path: '/inteligencia', icon: <BarChart3 size={16} />, roles: ['superadmin', 'admin', 'ventas'] },
      { label: 'Presupuesto', path: '/inteligencia/presupuesto', icon: <DollarSign size={16} />, roles: ['superadmin', 'admin'] },
      { label: 'Pareto 80/20', path: '/inteligencia/pareto', icon: <Target size={16} />, roles: ['superadmin', 'admin'] },
    ]
  },
  {
    id: 'config',
    label: 'Configuracion',
    icon: <Settings size={18} />,
    items: [
      { label: 'Sistema', path: '/admin/configuracion', icon: <Settings size={16} />, roles: ['superadmin', 'admin'] },
      { label: 'Integraciones', path: '/admin/integraciones', icon: <Plug size={16} />, roles: ['superadmin', 'admin'] },
    ]
  },
]

interface SidebarProps {
  collapsed?: boolean
  onToggle?: () => void
}

export function Sidebar({ collapsed = false, onToggle }: SidebarProps) {
  const [expandedGroups, setExpandedGroups] = useState<Record<string, boolean>>({})
  const { user } = useAuthContext()
  const navigate = useNavigate()
  const location = useLocation()

  if (!user) return null

  const toggleGroup = (id: string) => {
    setExpandedGroups(prev => ({ ...prev, [id]: !prev[id] }))
  }

  const isActive = (path: string) => location.pathname === path
  const isGroupActive = (group: ModuleGroup) => group.items.some(item => location.pathname.startsWith(item.path.split('/:')[0]))

  const visibleModules = modules.map(mod => ({
    ...mod,
    items: mod.items.filter(item => item.roles.includes(user.rol))
  })).filter(mod => mod.items.length > 0)

  const w = collapsed ? 56 : 220

  return (
    <aside style={{
      width: w,
      minWidth: w,
      height: '100vh',
      display: 'flex',
      flexDirection: 'column' as const,
      background: '#1a1a24',
      borderRight: '1px solid rgba(255,255,255,0.06)',
      transition: 'width 0.2s ease, min-width 0.2s ease',
      overflow: 'hidden',
      fontFamily: tokens.fonts.body,
    }}>
      {/* Header */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: collapsed ? 'center' : 'space-between',
        padding: collapsed ? '12px 8px' : '12px 14px',
        borderBottom: '1px solid rgba(255,255,255,0.06)',
        flexShrink: 0,
      }}>
        {!collapsed && (
          <button
            onClick={() => navigate('/dashboard')}
            style={{
              background: 'none', border: 'none', cursor: 'pointer',
              display: 'flex', alignItems: 'center', gap: 8, padding: 0,
            }}
          >
            <LayoutDashboard size={18} style={{ color: tokens.colors.primary }} />
            <span style={{ color: tokens.colors.textPrimary, fontSize: 14, fontWeight: 700, fontFamily: tokens.fonts.heading }}>
              LomaHUB27
            </span>
          </button>
        )}
        <button
          onClick={onToggle}
          style={{
            background: 'none', border: 'none', cursor: 'pointer',
            color: tokens.colors.textMuted, padding: 4, borderRadius: 6,
            display: 'flex', alignItems: 'center',
          }}
        >
          {collapsed ? <PanelLeft size={18} /> : <PanelLeftClose size={18} />}
        </button>
      </div>

      {/* Dashboard link */}
      <div style={{ padding: collapsed ? '8px 4px' : '8px 10px', flexShrink: 0 }}>
        <button
          onClick={() => navigate('/dashboard')}
          style={{
            width: '100%',
            display: 'flex', alignItems: 'center', gap: 10,
            padding: collapsed ? '8px 0' : '8px 10px',
            justifyContent: collapsed ? 'center' : 'flex-start',
            background: location.pathname === '/dashboard' ? `${tokens.colors.primary}18` : 'transparent',
            border: 'none', borderRadius: 8, cursor: 'pointer',
            color: location.pathname === '/dashboard' ? tokens.colors.primary : tokens.colors.textSecondary,
            fontSize: 13, fontWeight: 600, fontFamily: tokens.fonts.body,
            transition: 'all 0.15s ease',
          }}
        >
          <LayoutDashboard size={17} />
          {!collapsed && <span>Dashboard</span>}
        </button>
      </div>

      {/* Module groups */}
      <nav style={{
        flex: 1,
        overflowY: 'auto',
        overflowX: 'hidden',
        padding: collapsed ? '4px 4px' : '4px 10px',
        scrollbarWidth: 'none' as any,
      }}>
        {visibleModules.map(mod => {
          const groupActive = isGroupActive(mod)
          const isExpanded = expandedGroups[mod.id] ?? groupActive

          return (
            <div key={mod.id} style={{ marginBottom: 2 }}>
              {/* Group header */}
              <button
                onClick={() => collapsed ? navigate(mod.items[0].path) : toggleGroup(mod.id)}
                title={collapsed ? mod.label : undefined}
                style={{
                  width: '100%',
                  display: 'flex', alignItems: 'center', gap: 10,
                  padding: collapsed ? '8px 0' : '7px 10px',
                  justifyContent: collapsed ? 'center' : 'flex-start',
                  background: groupActive ? `${tokens.colors.primary}12` : 'transparent',
                  border: 'none', borderRadius: 8, cursor: 'pointer',
                  color: groupActive ? tokens.colors.primary : tokens.colors.textSecondary,
                  fontSize: 13, fontWeight: 600, fontFamily: tokens.fonts.body,
                  transition: 'all 0.15s ease',
                }}
              >
                <span style={{ flexShrink: 0 }}>{mod.icon}</span>
                {!collapsed && (
                  <>
                    <span style={{ flex: 1, textAlign: 'left' }}>{mod.label}</span>
                    {isExpanded ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
                  </>
                )}
              </button>

              {/* Sub-items */}
              {!collapsed && isExpanded && (
                <div style={{ paddingLeft: 16, marginTop: 1, marginBottom: 4 }}>
                  {mod.items.map(item => (
                    <button
                      key={item.path}
                      onClick={() => navigate(item.path)}
                      style={{
                        width: '100%',
                        display: 'flex', alignItems: 'center', gap: 8,
                        padding: '6px 10px',
                        background: isActive(item.path) ? `${tokens.colors.primary}20` : 'transparent',
                        border: 'none', borderRadius: 6, cursor: 'pointer',
                        color: isActive(item.path) ? tokens.colors.textPrimary : tokens.colors.textMuted,
                        fontSize: 12, fontWeight: isActive(item.path) ? 600 : 400,
                        fontFamily: tokens.fonts.body,
                        textAlign: 'left' as const,
                        transition: 'all 0.12s ease',
                      }}
                    >
                      {item.icon}
                      <span>{item.label}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>
          )
        })}
      </nav>

      {/* User footer */}
      {!collapsed && (
        <div style={{
          padding: '10px 14px',
          borderTop: '1px solid rgba(255,255,255,0.06)',
          flexShrink: 0,
        }}>
          <p style={{ margin: 0, fontSize: 11, color: tokens.colors.textMuted, fontWeight: 500 }}>
            {user.email?.split('@')[0]?.split('.').map((p: string) => p.charAt(0).toUpperCase() + p.slice(1)).join(' ')}
          </p>
          <p style={{ margin: 0, fontSize: 10, color: tokens.colors.textMuted, opacity: 0.6, textTransform: 'uppercase' as const }}>
            {user.rol}
          </p>
        </div>
      )}
    </aside>
  )
}
