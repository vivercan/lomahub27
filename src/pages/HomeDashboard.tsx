// src/pages/HomeDashboard.tsx
// Dashboard 14 modulos — Grid 7x2
// APROBADO POR JJ 19/Mar/2026

import { useNavigate } from 'react-router-dom'
import {
  LayoutDashboard, TrendingUp, Users, Headphones,
  Radio, Map, Truck, Package, DollarSign,
  BarChart3, PieChart, MessageSquare, FileText, Settings,
} from 'lucide-react'
import AppHeader from '../components/layout/AppHeader'
import { useAuth } from '../hooks/useAuth'

const modules = [
  // Fila 1
  { id: 1,  name: 'War Room',         icon: LayoutDashboard, route: '/war-room',                row: 1 },
  { id: 2,  name: 'Ventas',           icon: TrendingUp,      route: '/ventas/mis-leads',        row: 1 },
  { id: 3,  name: 'Clientes',         icon: Users,           route: '/clientes/alta',           row: 1 },
  { id: 4,  name: 'Servicio',         icon: Headphones,      route: '/servicio/dashboard',      row: 1 },
  { id: 5,  name: 'Torre de Control', icon: Radio,           route: '/operaciones/torre-control', row: 1 },
  { id: 6,  name: 'Mapa GPS',         icon: Map,             route: '/operaciones/mapa',        row: 1 },
  { id: 7,  name: 'Flota',            icon: Truck,           route: '/flota/tractos',           row: 1 },
  // Fila 2
  { id: 8,  name: 'Dedicados',        icon: Package,         route: '/operaciones/dedicados',   row: 2 },
  { id: 9,  name: 'Cobranza',         icon: DollarSign,      route: '/cxc/cartera',             row: 2 },
  { id: 10, name: 'Indicadores',      icon: BarChart3,       route: '/inteligencia',            row: 2 },
  { id: 11, name: 'Rentabilidad',     icon: PieChart,        route: '/operaciones/rentabilidad', row: 2 },
  { id: 12, name: 'Comunicaciones',   icon: MessageSquare,   route: '/servicio/whatsapp',       row: 2 },
  { id: 13, name: 'Reportes',         icon: FileText,        route: '/inteligencia/presupuesto', row: 2 },
  { id: 14, name: 'Configuracion',    icon: Settings,        route: '/admin/configuracion',     row: 2 },
]
export default function HomeDashboard() {
  const navigate = useNavigate()
  const { user, logout } = useAuth()

  const handleLogout = async () => {
    await logout()
  }

  return (
    <div style={{ minHeight: '100vh', background: '#2a2a36' }}>
      <AppHeader
        onLogout={handleLogout}
        userName={user?.email?.split('@')[0] || 'Usuario'}
        userRole={user?.rol || 'admin'}
      />

      <div style={{
        display: 'flex', flexDirection: 'column', gap: '16px',
        padding: '32px 36px', maxWidth: '1400px', margin: '0 auto',
      }}>
        {/* Fila 1 */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '14px' }}>
          {modules.filter(m => m.row === 1).map(mod => (
            <ModuleCard key={mod.id} mod={mod} onClick={() => navigate(mod.route)} />
          ))}
        </div>

        {/* Fila 2 */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '14px' }}>
          {modules.filter(m => m.row === 2).map(mod => (
            <ModuleCard key={mod.id} mod={mod} onClick={() => navigate(mod.route)} />
          ))}
        </div>
      </div>
    </div>
  )
}
function ModuleCard({ mod, onClick }: { mod: typeof modules[0], onClick: () => void }) {
  const Icon = mod.icon
  return (
    <button
      onClick={onClick}
      style={{
        display: 'flex', flexDirection: 'column', alignItems: 'center',
        justifyContent: 'center', gap: '10px', padding: '24px 12px',
        background: 'linear-gradient(135deg, rgba(255,255,255,0.045) 0%, rgba(255,255,255,0.015) 50%, rgba(255,255,255,0.028) 100%)',
        border: '1px solid rgba(255,255,255,0.06)', borderRadius: '12px',
        cursor: 'pointer', transition: 'all 0.25s ease',
        boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
        fontFamily: "'Montserrat', sans-serif", WebkitFontSmoothing: 'antialiased',
        color: 'rgba(255,255,255,0.55)',
      }}
      onMouseEnter={e => {
        const el = e.currentTarget
        el.style.borderColor = 'rgba(232,97,26,0.18)'
        el.style.transform = 'translateY(-2px)'
        el.style.boxShadow = '0 8px 24px rgba(0,0,0,0.3)'
        el.style.color = 'rgba(255,255,255,0.92)'
      }}
      onMouseLeave={e => {
        const el = e.currentTarget
        el.style.borderColor = 'rgba(255,255,255,0.06)'
        el.style.transform = 'translateY(0)'
        el.style.boxShadow = '0 4px 12px rgba(0,0,0,0.15)'
        el.style.color = 'rgba(255,255,255,0.55)'
      }}
    >
      <Icon size={28} />
      <span style={{
        fontWeight: 600, fontSize: '12.5px', textAlign: 'center',
        transition: 'color 0.2s', color: 'inherit',
      }}>{mod.name}</span>
    </button>
  )
}
