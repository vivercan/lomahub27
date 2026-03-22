// src/pages/HomeDashboard.tsx
// V28: 9 modules with submódulos — click module → shows sub-routes as cards
// APROBADO POR JJ 19/Mar/2026 — Updated 22/Mar/2026 submódulos

import { useNavigate } from 'react-router-dom'
import { useEffect, useState } from 'react'
import AppHeader from '../components/layout/AppHeader'
import { useAuth } from '../hooks/useAuth'
import { supabase } from '../lib/supabase'
import { ArrowLeft } from 'lucide-react'

// ── Iconos SVG custom (inline para control total) ──
const icons = {
  ventas: (
    <svg width="55" height="55" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.1" strokeLinecap="round">
      <polyline points="3,17 9,11 13,15 21,7"/>
      <polyline points="17,7 21,7 21,11"/>
    </svg>
  ),
  clientes: (
    <svg width="55" height="55" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.1" strokeLinecap="round">
      <circle cx="9" cy="7" r="3"/>
      <path d="M1 21v-2a4 4 0 0 1 4-4h8a4 4 0 0 1 4 4v2"/>
      <circle cx="18" cy="8" r="2.5" strokeWidth="1.8"/>
      <path d="M21 21v-1.5a3 3 0 0 0-2-2.8"/>
    </svg>
  ),
  torre: (
    <svg width="58" height="58" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.1" strokeLinecap="round">
      <circle cx="12" cy="12" r="10" strokeWidth="1.8"/>
      <circle cx="12" cy="12" r="6" strokeWidth="1.5" opacity="0.6"/>
      <circle cx="12" cy="12" r="2" strokeWidth="1.8"/>
      <line x1="12" y1="12" x2="18" y2="6" strokeWidth="2.1"/>
    </svg>
  ),
  dedicados: (
    <svg width="60" height="60" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.3" strokeLinecap="round">
      <polyline points="17 1 21 5 17 9"/>
      <path d="M3 11V9a4 4 0 0 1 4-4h14"/>
      <polyline points="7 23 3 19 7 15"/>
      <path d="M21 13v2a4 4 0 0 1-4 4H3"/>
    </svg>
  ),
  cobranza: (
    <svg width="60" height="60" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.3" strokeLinecap="round">
      <line x1="12" y1="1" x2="12" y2="23"/>
      <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/>
    </svg>
  ),
  indicadores: (
    <svg width="55" height="55" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.1" strokeLinecap="round">
      <rect x="4" y="14" width="4" height="8" rx="0.5"/>
      <rect x="10" y="8" width="4" height="14" rx="0.5"/>
      <rect x="16" y="3" width="4" height="19" rx="0.5"/>
    </svg>
  ),
  comunicaciones: (
    <svg width="60" height="60" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round">
      <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/>
      <polyline points="22,6 12,13 2,6"/>
    </svg>
  ),
  reportes: (
    <svg width="60" height="60" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.3" strokeLinecap="round">
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
      <polyline points="14 2 14 8 20 8"/>
      <polyline points="9 15 11 17 15 13" strokeWidth="2.2"/>
    </svg>
  ),
  config: (
    <svg width="58" height="58" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round">
      <circle cx="12" cy="12" r="3"/>
      <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09a1.65 1.65 0 0 0-1.08-1.51 1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/>
    </svg>
  ),
}

// ── Sub-iconos (28px) para submódulos ──
const si = {
  leads: <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><polyline points="3,17 9,11 13,15 21,7"/><polyline points="17,7 21,7 21,11"/></svg>,
  funnel: <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3"/></svg>,
  programa: <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>,
  comisiones: <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg>,
  torre: <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="2"/><line x1="12" y1="12" x2="18" y2="6"/></svg>,
  despachos: <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><rect x="1" y="3" width="15" height="13" rx="1"/><polygon points="16 8 20 8 23 11 23 16 16 16 16 8"/><circle cx="5.5" cy="18.5" r="2.5"/><circle cx="18.5" cy="18.5" r="2.5"/></svg>,
  mapa: <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>,
  impex: <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M16 3h5v5"/><path d="M21 3l-7 7"/><path d="M8 21H3v-5"/><path d="M3 21l7-7"/></svg>,
  dashboard: <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/></svg>,
  whatsapp: <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"/></svg>,
  metricas: <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><rect x="4" y="14" width="4" height="8" rx="0.5"/><rect x="10" y="8" width="4" height="14" rx="0.5"/><rect x="16" y="3" width="4" height="19" rx="0.5"/></svg>,
  tickets: <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M15 5v2"/><path d="M15 11v2"/><path d="M15 17v2"/><path d="M5 5h14a2 2 0 0 1 2 2v10a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V7c0-1.1.9-2 2-2z"/></svg>,
  dedicados: <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><polyline points="17 1 21 5 17 9"/><path d="M3 11V9a4 4 0 0 1 4-4h14"/><polyline points="7 23 3 19 7 15"/><path d="M21 13v2a4 4 0 0 1-4 4H3"/></svg>,
  rentabilidad: <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/></svg>,
  programacion: <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>,
  cartera: <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><rect x="2" y="7" width="20" height="14" rx="2" ry="2"/><path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"/></svg>,
  correos: <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/></svg>,
  notificaciones: <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/></svg>,
  config: <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9c.26.65.89 1.08 1.51 1.08H21a2 2 0 0 1 0 4h-.09c-.62 0-1.25.43-1.51 1.08z"/></svg>,
  integraciones: <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M12 2v4"/><path d="M12 18v4"/><path d="M4.93 4.93l2.83 2.83"/><path d="M16.24 16.24l2.83 2.83"/><path d="M2 12h4"/><path d="M18 12h4"/><path d="M4.93 19.07l2.83-2.83"/><path d="M16.24 7.76l2.83-2.83"/></svg>,
  actividades: <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/></svg>,
  documentos: <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>,
}

interface SubModulo {
  name: string
  route: string
  icon: React.ReactNode
  desc: string
}

interface ModuleConfig {
  id: number
  name: string
  icon: React.ReactNode
  row: number
  kpi: string | null
  kpiType: 'number' | 'status' | 'text'
  kpiLabel?: string
  statusLabel?: string
  statusColor?: string
  priority: 'high' | 'mid' | 'low'
  isWarRoom?: boolean
  submodulos: SubModulo[]
}

const modules: ModuleConfig[] = [
  {
    id: 1, name: 'Comercial', icon: icons.ventas, row: 1, kpi: null, kpiType: 'number', kpiLabel: 'leads activos', priority: 'high', isWarRoom: true,
    submodulos: [
      { name: 'Mis Leads', route: '/ventas/mis-leads', icon: si.leads, desc: 'Pipeline de prospectos' },
      { name: 'Funnel', route: '/ventas/funnel', icon: si.funnel, desc: 'Embudo de conversión' },
      { name: 'Programa Semanal', route: '/ventas/programa-semanal', icon: si.programa, desc: 'Agenda de visitas' },
      { name: 'Comisiones', route: '/ventas/comisiones', icon: si.comisiones, desc: 'Comisiones por ejecutivo' },
    ]
  },
  {
    id: 2, name: 'Operaciones', icon: icons.torre, row: 1, kpi: null, kpiType: 'number', kpiLabel: 'viajes activos', priority: 'high',
    submodulos: [
      { name: 'Torre de Control', route: '/operaciones/torre-control', icon: si.torre, desc: 'Monitoreo en tiempo real' },
      { name: 'Despachos', route: '/operaciones/despachos', icon: si.despachos, desc: 'Asignación de viajes' },
      { name: 'Mapa GPS', route: '/operaciones/mapa', icon: si.mapa, desc: 'Rastreo de unidades' },
      { name: 'IMPEX', route: '/operaciones/programacion-impex', icon: si.impex, desc: 'Calendario semanal' },
    ]
  },
  {
    id: 3, name: 'Servicio', icon: icons.clientes, row: 1, kpi: null, kpiType: 'number', kpiLabel: 'clientes', priority: 'high',
    submodulos: [
      { name: 'Dashboard', route: '/servicio/dashboard', icon: si.dashboard, desc: 'Visión general CS' },
      { name: 'WhatsApp', route: '/servicio/whatsapp', icon: si.whatsapp, desc: 'Bandeja de mensajes' },
      { name: 'Métricas', route: '/servicio/metricas', icon: si.metricas, desc: 'KPIs de servicio' },
      { name: 'Tickets', route: '/servicio/tickets', icon: si.tickets, desc: 'Quejas y SLAs' },
    ]
  },
  {
    id: 4, name: 'Dedicados', icon: icons.dedicados, row: 1, kpi: null, kpiType: 'number', kpiLabel: 'segmentos', priority: 'mid',
    submodulos: [
      { name: 'Flota Dedicada', route: '/operaciones/dedicados', icon: si.dedicados, desc: 'Monitor de unidades' },
      { name: 'Programación', route: '/operaciones/programacion-dedicados', icon: si.programacion, desc: 'Agenda dedicados' },
      { name: 'Rentabilidad', route: '/operaciones/rentabilidad', icon: si.rentabilidad, desc: 'Margen por tracto' },
    ]
  },
  {
    id: 5, name: 'Cobranza', icon: icons.cobranza, row: 1, kpi: null, kpiType: 'number', kpiLabel: 'cuentas CXC', priority: 'mid',
    submodulos: [
      { name: 'Cartera', route: '/cxc/cartera', icon: si.cartera, desc: 'Cartera de cobranza' },
    ]
  },
  {
    id: 6, name: 'Comunicaciones', icon: icons.comunicaciones, row: 2, kpi: null, kpiType: 'status', statusLabel: 'Activo', statusColor: 'g', priority: 'mid',
    submodulos: [
      { name: 'Correos', route: '/comunicaciones/correos', icon: si.correos, desc: 'Correos automáticos' },
      { name: 'Notificaciones', route: '/comunicaciones/notificaciones', icon: si.notificaciones, desc: 'Centro de alertas' },
    ]
  },
  {
    id: 7, name: 'Configuración', icon: icons.config, row: 2, kpi: null, kpiType: 'text', kpiLabel: '—', priority: 'low',
    submodulos: [
      { name: 'Sistema', route: '/admin/configuracion', icon: si.config, desc: 'Usuarios y catálogos' },
      { name: 'Integraciones', route: '/admin/integraciones', icon: si.integraciones, desc: 'APIs y conectores' },
    ]
  },
  {
    id: 8, name: 'Actividades', icon: icons.indicadores, row: 2, kpi: null, kpiType: 'status', statusLabel: 'Activo', statusColor: 'g', priority: 'low',
    submodulos: [
      { name: 'Bitácora', route: '/actividades', icon: si.actividades, desc: 'Registro de actividades' },
    ]
  },
  {
    id: 9, name: 'Documentos', icon: icons.reportes, row: 2, kpi: null, kpiType: 'status', statusLabel: 'Activo', statusColor: 'g', priority: 'low',
    submodulos: [
      { name: 'Repositorio', route: '/documentos', icon: si.documentos, desc: 'Gestión documental' },
    ]
  },
]

export default function HomeDashboard() {
  const navigate = useNavigate()
  const { user, logout } = useAuth()
  const [hover, setHover] = useState<number | null>(null)
  const [subHover, setSubHover] = useState<string | null>(null)
  const [counts, setCounts] = useState<Record<string, number>>({})
  const [selectedModule, setSelectedModule] = useState<ModuleConfig | null>(null)

  useEffect(() => {
    async function load() {
      const tables = ['leads', 'clientes', 'viajes', 'tractos', 'cajas', 'gps_tracking', 'cxc_cartera']
      const results: Record<string, number> = {}
      for (const table of tables) {
        const { count } = await supabase.from(table).select('*', { count: 'exact', head: true })
        results[table] = count || 0
      }
      setCounts(results)
    }
    load()
  }, [])

  const getKpi = (m: ModuleConfig) => {
    if (m.id === 1) return String(counts.leads || 0)
    if (m.id === 2) return String(counts.viajes || 0)
    if (m.id === 3) return String(counts.clientes || 0)
    if (m.id === 4) return String(counts.tractos || 0)
    if (m.id === 5) return String(counts.cxc_cartera || 0)
    return m.kpi
  }

  const handleModuleClick = (mod: ModuleConfig) => {
    if (mod.submodulos.length === 1) {
      navigate(mod.submodulos[0].route)
    } else {
      setSelectedModule(mod)
    }
  }

  const handleLogout = async () => { await logout() }

  const formatName = (email?: string) => {
    if (!email) return 'Usuario'
    const name = email.split('@')[0].replace(/[._]/g, ' ')
    return name.split(' ').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ')
  }

  return (
    <div style={{ height: '100vh', overflow: 'hidden', background: '#2a2a36', display: 'flex', flexDirection: 'column' }}>
      <AppHeader
        onLogout={handleLogout}
        userName={formatName(user?.email)}
        userRole={user?.rol || 'admin'}
      />

      {/* Status bar */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-evenly', padding: '14px 28px', margin: '14px 0 10px', background: 'rgba(255,255,255,0.025)', border: '1px solid rgba(255,255,255,0.05)', borderRadius: '0', flexShrink: 0 }}>
        {[
          { num: String(counts.viajes || 0), label: 'viajes activos', color: '#10B981' },
          { num: String(counts.gps_tracking || 0), label: 'unidades GPS', color: '#10B981' },
          { num: '—', label: 'alertas hoy', color: '#F59E0B' },
          { num: '—', label: 'facturado hoy', color: '#10B981' },
          { num: String(counts.leads || 0), label: 'leads pipeline', color: '#10B981' },
        ].map((s, i) => (
          <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            {i > 0 && <div style={{ width: '1px', height: '24px', background: 'rgba(255,255,255,0.06)', marginRight: '20px' }} />}
            <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: s.color, boxShadow: `0 0 8px ${s.color}40` }} />
            <span style={{ fontWeight: 800, fontSize: '18px', color: 'rgba(255,255,255,0.85)' }}>{s.num}</span>
            <span style={{ fontWeight: 500, fontSize: '13px', color: 'rgba(255,255,255,0.35)' }}>{s.label}</span>
          </div>
        ))}
      </div>

      {/* Main content area */}
      <div style={{ flex: 1, padding: '4px 20px', maxWidth: '100%', overflow: 'hidden', display: 'flex', flexDirection: 'column', gap: '14px' }}>
        {selectedModule ? (
          /* ── Submódulos view ── */
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', paddingTop: '8px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <button
                onClick={() => setSelectedModule(null)}
                style={{ display: 'flex', alignItems: 'center', gap: '6px', background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '10px', padding: '8px 14px', cursor: 'pointer', color: 'rgba(255,255,255,0.6)', fontFamily: "'Montserrat', sans-serif", fontSize: '13px', fontWeight: 500, transition: 'all 0.15s' }}
              >
                <ArrowLeft size={16} /> Volver
              </button>
              <span style={{ fontFamily: "'Montserrat', sans-serif", fontWeight: 700, fontSize: '22px', color: 'rgba(255,255,255,0.85)' }}>
                {selectedModule.name}
              </span>
              <span style={{ fontFamily: "'Montserrat', sans-serif", fontWeight: 500, fontSize: '13px', color: 'rgba(255,255,255,0.35)', background: 'rgba(255,255,255,0.05)', padding: '3px 10px', borderRadius: '8px' }}>
                {selectedModule.submodulos.length} submódulos
              </span>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: `repeat(${Math.min(selectedModule.submodulos.length, 4)}, 1fr)`, gap: '14px' }}>
              {selectedModule.submodulos.map((sub) => (
                <button
                  key={sub.route}
                  onClick={() => navigate(sub.route)}
                  onMouseEnter={() => setSubHover(sub.route)}
                  onMouseLeave={() => setSubHover(null)}
                  style={{
                    display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '12px',
                    padding: '32px 20px 28px',
                    background: 'linear-gradient(180deg, rgba(54,54,67,1) 0%, rgba(42,42,54,1) 45%, rgba(33,33,43,1) 100%)',
                    borderTop: '1px solid rgba(160,170,190,0.14)',
                    borderLeft: '1px solid rgba(160,170,190,0.10)',
                    borderBottom: '1px solid rgba(0,0,0,0.42)',
                    borderRight: '1px solid rgba(0,0,0,0.32)',
                    borderRadius: '20px', cursor: 'pointer',
                    transition: 'all 0.16s ease',
                    boxShadow: subHover === sub.route
                      ? '0 10px 22px rgba(0,0,0,0.35), 0 3px 8px rgba(0,0,0,0.25), inset 0 1px 0 rgba(200,210,225,0.09)'
                      : '0 8px 20px rgba(0,0,0,0.22), 0 2px 6px rgba(0,0,0,0.24), inset 0 1px 0 rgba(255,255,255,0.05)',
                    transform: subHover === sub.route ? 'translateY(-2px)' : 'none',
                    fontFamily: "'Montserrat', sans-serif",
                    color: subHover === sub.route ? 'rgba(255,255,255,0.90)' : 'rgba(255,255,255,0.45)',
                    position: 'relative', overflow: 'hidden',
                  }}
                >
                  <div style={{ position: 'absolute', top: 0, left: '15%', right: '15%', height: '1px', background: 'linear-gradient(90deg, transparent, rgba(160,170,190,0.12), transparent)', opacity: subHover === sub.route ? 0.75 : 0.3, transition: 'opacity 0.3s' }} />
                  <div style={{ width: '56px', height: '56px', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'all 0.2s', filter: subHover === sub.route ? 'brightness(1.18)' : 'brightness(1.0)' }}>
                    {sub.icon}
                  </div>
                  <span style={{ fontWeight: 600, fontSize: '15px', letterSpacing: '0.3px', textAlign: 'center', color: subHover === sub.route ? 'rgba(255,255,255,0.90)' : 'rgba(255,255,255,0.55)', transition: 'color 0.25s' }}>
                    {sub.name}
                  </span>
                  <span style={{ fontWeight: 500, fontSize: '11.5px', color: subHover === sub.route ? 'rgba(255,255,255,0.48)' : 'rgba(255,255,255,0.28)', transition: 'color 0.25s', letterSpacing: '0.3px' }}>
                    {sub.desc}
                  </span>
                </button>
              ))}
            </div>
          </div>
        ) : (
          /* ── Main modules grid ── */
          <>
            {[1, 2].map(row => (
              <div key={row} style={{ display: 'grid', gridTemplateColumns: `repeat(${row === 1 ? 5 : 4}, 1fr)`, gap: '10px' }}>
                {modules.filter(m => m.row === row).map((mod) => (
                  <button
                    key={mod.id}
                    onClick={() => handleModuleClick(mod)}
                    onMouseEnter={() => setHover(mod.id)}
                    onMouseLeave={() => setHover(null)}
                    style={{
                      display: 'flex', flexDirection: 'column', alignItems: 'center',
                      justifyContent: 'center', gap: '8px', padding: '20px 14px 18px',
                      background: mod.isWarRoom
                        ? 'linear-gradient(180deg, rgba(56,50,56,1) 0%, rgba(42,38,48,1) 45%, rgba(31,30,40,1) 100%)'
                        : 'linear-gradient(180deg, rgba(54,54,67,1) 0%, rgba(42,42,54,1) 45%, rgba(33,33,43,1) 100%)',
                      borderTop: `1px solid ${mod.isWarRoom ? 'rgba(200,160,120,0.14)' : `rgba(160,170,190,${mod.priority === 'high' ? 0.14 : 0.11})`}`,
                      borderLeft: `1px solid ${mod.isWarRoom ? 'rgba(200,160,120,0.10)' : `rgba(160,170,190,${mod.priority === 'high' ? 0.10 : 0.07})`}`,
                      borderBottom: '1px solid rgba(0,0,0,0.42)',
                      borderRight: '1px solid rgba(0,0,0,0.32)',
                      borderRadius: '20px', cursor: 'pointer',
                      transition: 'all 0.16s ease',
                      boxShadow: hover === mod.id
                        ? `0 10px 22px rgba(0,0,0,0.35), 0 3px 8px rgba(0,0,0,0.25), inset 0 1px 0 rgba(200,210,225,0.09), inset 0 -1px 0 rgba(0,0,0,0.15)${mod.isWarRoom ? ', 0 0 20px rgba(232,97,26,0.06)' : ''}`
                        : `0 8px 20px rgba(0,0,0,0.22), 0 2px 6px rgba(0,0,0,0.24), inset 0 1px 0 rgba(255,255,255,${mod.priority === 'high' ? '0.05' : '0.04'}), inset 0 -2px 4px rgba(0,0,0,0.10)`,
                      transform: hover === mod.id ? 'translateY(-2px)' : 'none',
                      fontFamily: "'Montserrat', sans-serif",
                      position: 'relative', overflow: 'hidden',
                      color: mod.isWarRoom ? '#E8611A' : hover === mod.id ? 'rgba(255,255,255,0.90)' : 'rgba(255,255,255,0.45)',
                    }}
                  >
                    <div style={{ position: 'absolute', top: 0, left: '15%', right: '15%', height: '1px', background: mod.isWarRoom ? 'linear-gradient(90deg, transparent, rgba(232,97,26,0.2), transparent)' : 'linear-gradient(90deg, transparent, rgba(160,170,190,0.12), transparent)', opacity: mod.isWarRoom ? 0.85 : mod.priority === 'high' ? 0.65 : hover === mod.id ? 0.75 : 0.3, transition: 'opacity 0.3s' }} />

                    <div style={{ height: '55px', position: 'relative', transition: 'all 0.2s', filter: hover === mod.id ? 'brightness(1.18)' : 'brightness(1.0)' }}>
                      {mod.icon}
                    </div>

                    <span style={{ fontWeight: 600, fontSize: '14px', letterSpacing: '0.3px', textAlign: 'center', lineHeight: 1.2, color: mod.isWarRoom ? 'rgba(255,255,255,0.70)' : hover === mod.id ? 'rgba(255,255,255,0.90)' : 'rgba(255,255,255,0.50)', transition: 'color 0.25s' }}>
                      {mod.name}
                    </span>

                    <div style={{ fontWeight: 500, fontSize: '11.5px', textAlign: 'center', color: hover === mod.id ? 'rgba(255,255,255,0.48)' : 'rgba(255,255,255,0.28)', transition: 'color 0.25s', letterSpacing: '0.3px' }}>
                      {mod.kpiType === 'number' && (
                        <><span style={{ fontWeight: 800, fontSize: '30px', display: 'block', marginBottom: '1px', color: hover === mod.id ? 'rgba(255,255,255,0.92)' : mod.priority === 'high' ? 'rgba(255,255,255,0.72)' : 'rgba(255,255,255,0.58)' }}>{getKpi(mod)}</span>{mod.kpiLabel}</>
                      )}
                      {mod.kpiType === 'status' && (
                        <><span style={{ display: 'inline-block', width: '3px', height: '3px', borderRadius: '50%', marginRight: '4px', verticalAlign: 'middle', background: mod.statusColor === 'g' ? '#10B981' : '#F59E0B' }} />{mod.statusLabel}</>
                      )}
                      {mod.kpiType === 'text' && mod.kpiLabel}
                    </div>

                    {mod.submodulos.length > 1 && (
                      <div style={{ position: 'absolute', top: '8px', right: '10px', background: 'rgba(255,255,255,0.06)', borderRadius: '6px', padding: '2px 7px', fontSize: '10px', fontWeight: 600, color: 'rgba(255,255,255,0.30)' }}>
                        {mod.submodulos.length}
                      </div>
                    )}
                  </button>
                ))}
              </div>
            ))}
          </>
        )}
      </div>
    </div>
  )
}
