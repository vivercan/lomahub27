// src/pages/HomeDashboard.tsx





// V26c: Dashboard 14 modulos — Tarjetas grandes 48px
// Dashboard 14 modulos — Grid 7x2 — Iconos custom — V22b
// APROBADO POR JJ 19/Mar/2026

import { useNavigate } from 'react-router-dom'
import { useEffect, useState } from 'react'
import AppHeader from '../components/layout/AppHeader'
import { useAuth } from '../hooks/useAuth'
import { supabase } from '../lib/supabase'

// ── Iconos SVG custom (inline para control total) ──
const icons = {
  warRoom: (
    <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
      <circle cx="12" cy="11" r="2.5" strokeWidth="1.5"/>
    </svg>
  ),
  ventas: (
    <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
      <polyline points="3,17 9,11 13,15 21,7"/>
      <polyline points="17,7 21,7 21,11"/>
    </svg>
  ),
  clientes: (
    <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
      <circle cx="9" cy="7" r="3"/>
      <path d="M1 21v-2a4 4 0 0 1 4-4h8a4 4 0 0 1 4 4v2"/>
      <circle cx="18" cy="8" r="2.5" strokeWidth="1.5"/>
      <path d="M21 21v-1.5a3 3 0 0 0-2-2.8"/>
    </svg>
  ),
  servicio: (
    <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
      <path d="M3 18v-6a9 9 0 0 1 18 0v6"/>
      <path d="M21 19a2 2 0 0 1-2 2h-1a2 2 0 0 1-2-2v-3a2 2 0 0 1 2-2h3z"/>
      <path d="M3 19a2 2 0 0 0 2 2h1a2 2 0 0 0 2-2v-3a2 2 0 0 0-2-2H3z"/>
    </svg>
  ),
  torre: (
    <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
      <circle cx="12" cy="12" r="10" strokeWidth="1.5"/>
      <circle cx="12" cy="12" r="6" strokeWidth="1.2" opacity="0.6"/>
      <circle cx="12" cy="12" r="2" strokeWidth="1.5"/>
      <line x1="12" y1="12" x2="18" y2="6" strokeWidth="2"/>
    </svg>
  ),
  mapa: (
    <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
      <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/>
      <circle cx="12" cy="10" r="3"/>
    </svg>
  ),
  flota: (
    <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
      <rect x="1" y="3" width="15" height="13" rx="1"/>
      <polygon points="16 8 20 8 23 11 23 16 16 16 16 8"/>
      <circle cx="5.5" cy="18.5" r="2.5"/>
      <circle cx="18.5" cy="18.5" r="2.5"/>
    </svg>
  ),
  dedicados: (
    <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
      <polyline points="17 1 21 5 17 9"/>
      <path d="M3 11V9a4 4 0 0 1 4-4h14"/>
      <polyline points="7 23 3 19 7 15"/>
      <path d="M21 13v2a4 4 0 0 1-4 4H3"/>
    </svg>
  ),
  cobranza: (
    <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
      <line x1="12" y1="1" x2="12" y2="23"/>
      <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/>
    </svg>
  ),
  indicadores: (
    <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
      <rect x="4" y="14" width="4" height="8" rx="0.5"/>
      <rect x="10" y="8" width="4" height="14" rx="0.5"/>
      <rect x="16" y="3" width="4" height="19" rx="0.5"/>
    </svg>
  ),
  rentabilidad: (
    <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
      <line x1="12" y1="3" x2="12" y2="21"/>
      <line x1="4" y1="3" x2="20" y2="3"/>
      <path d="M4 3L2 10h8L8 3"/>
      <path d="M16 3l2 7h-8l2-7"/>
      <line x1="8" y1="21" x2="16" y2="21"/>
    </svg>
  ),
  comunicaciones: (
    <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
      <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/>
      <polyline points="22,6 12,13 2,6"/>
    </svg>
  ),
  reportes: (
    <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
      <polyline points="14 2 14 8 20 8"/>
      <polyline points="9 15 11 17 15 13" strokeWidth="2.2"/>
    </svg>
  ),
  config: (
    <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
      <circle cx="12" cy="12" r="3"/>
      <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09a1.65 1.65 0 0 0-1.08-1.51 1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/>
    </svg>
  ),
}

const modules = [
  { id: 1,  name: 'War Room',         icon: icons.warRoom,       route: '/war-room',                row: 1, kpi: null,   kpiType: 'status', statusLabel: 'Operativo',  statusColor: 'g', isWarRoom: true },
  { id: 2,  name: 'Ventas',           icon: icons.ventas,        route: '/ventas/mis-leads',        row: 1, kpi: '—',    kpiType: 'number', kpiLabel: 'leads activos' },
  { id: 3,  name: 'Clientes',         icon: icons.clientes,      route: '/clientes/alta',           row: 1, kpi: '—',    kpiType: 'number', kpiLabel: 'contactos' },
  { id: 4,  name: 'Servicio',         icon: icons.servicio,      route: '/servicio/dashboard',      row: 1, kpi: '—',    kpiType: 'number', kpiLabel: 'ejecutivas' },
  { id: 5,  name: 'Torre de Control', icon: icons.torre,         route: '/operaciones/torre-control', row: 1, kpi: '—',    kpiType: 'number', kpiLabel: 'viajes activos' },
  { id: 6,  name: 'Mapa GPS',         icon: icons.mapa,          route: '/operaciones/mapa',        row: 1, kpi: '—',    kpiType: 'number', kpiLabel: 'unidades' },
  { id: 7,  name: 'Flota',            icon: icons.flota,         route: '/flota/tractos',           row: 1, kpi: '—',    kpiType: 'number', kpiLabel: 'unidades' },
  { id: 8,  name: 'Dedicados',        icon: icons.dedicados,     route: '/operaciones/dedicados',   row: 2, kpi: '—',    kpiType: 'number', kpiLabel: 'segmentos' },
  { id: 9,  name: 'Cobranza',         icon: icons.cobranza,      route: '/cxc/cartera',             row: 2, kpi: '—',    kpiType: 'number', kpiLabel: 'cuentas CXC' },
  { id: 10, name: 'Indicadores',      icon: icons.indicadores,   route: '/inteligencia',            row: 2, kpi: null,   kpiType: 'status', statusLabel: 'Rankings',    statusColor: 'g' },
  { id: 11, name: 'Rentabilidad',     icon: icons.rentabilidad,  route: '/operaciones/rentabilidad', row: 2, kpi: null,   kpiType: 'status', statusLabel: 'Margen',      statusColor: 'a' },
  { id: 12, name: 'Comunicaciones',   icon: icons.comunicaciones, route: '/servicio/whatsapp',       row: 2, kpi: null,   kpiType: 'status', statusLabel: 'Activo',      statusColor: 'g' },
  { id: 13, name: 'Reportes',         icon: icons.reportes,      route: '/inteligencia/presupuesto', row: 2, kpi: null,   kpiType: 'status', statusLabel: 'Disponible',  statusColor: 'g' },
  { id: 14, name: 'Configuración', icon: icons.config,     route: '/admin/configuracion',     row: 2, kpi: null,   kpiType: 'text',   kpiLabel: '—' },
]

export default function HomeDashboard() {
  const navigate = useNavigate()
  const { user, logout } = useAuth()
  const [hover, setHover] = useState<number | null>(null)
  const [counts, setCounts] = useState<Record<string, number>>({})

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

  const getKpi = (m: typeof modules[0]) => {
    if (m.id === 2) return String(counts.leads || 0)
    if (m.id === 3) return String(counts.clientes || 0)
    if (m.id === 5) return String(counts.viajes || 0)
    if (m.id === 6) return String(counts.gps_tracking || 0)
    if (m.id === 7) return String((counts.tractos || 0) + (counts.cajas || 0))
    if (m.id === 9) return String(counts.cxc_cartera || 0)
    return m.kpi
  }


  const handleLogout = async () => { await logout() }

  // Format user name: "Juan Viveros" from email
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

      {/* Status bar — pulso operativo */}
      <div className="dash-status-bar" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-evenly', padding: '10px 24px', margin: '0 0 0', background: 'rgba(255,255,255,0.025)', border: '1px solid rgba(255,255,255,0.05)', borderRadius: '0', flexShrink: 0 }}>
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

      {/* Grid de modulos */}
      <div style={{ flex: 1, padding: '10px 20px', maxWidth: '100%',  overflow: 'hidden', display: 'flex', flexDirection: 'column', gap: '14px' }}>
        {[1, 2].map(row => (
          <div key={row} style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '10px' }}>
            {modules.filter(m => m.row === row).map((mod, idx) => (
              <button
                key={mod.id}
                className={`dash-card-${row === 1 ? idx : idx + 7}`}
                onClick={() => navigate(mod.route)}
                onMouseEnter={() => setHover(mod.id)}
                onMouseLeave={() => setHover(null)}
                style={{
                  display: 'flex', flexDirection: 'column', alignItems: 'center',
                  justifyContent: 'center', gap: '8px', padding: '16px 10px 14px',
                  aspectRatio: '1 / 1',
                  background: mod.isWarRoom
                    ? 'linear-gradient(145deg, rgba(232,97,26,0.08) 0%, rgba(45,45,58,1) 40%, rgba(35,35,48,1) 100%)'
                    : 'linear-gradient(145deg, rgba(60,60,75,1) 0%, rgba(45,45,58,1) 40%, rgba(35,35,48,1) 100%)',
                  borderTop: `1px solid ${mod.isWarRoom ? 'rgba(232,97,26,0.25)' : 'rgba(255,255,255,0.12)'}`,
                  borderLeft: `1px solid ${mod.isWarRoom ? 'rgba(232,97,26,0.2)' : 'rgba(255,255,255,0.08)'}`,
                  borderBottom: `1px solid rgba(0,0,0,0.3)`,
                  borderRight: `1px solid rgba(0,0,0,0.2)`,
                  borderRadius: '12px', cursor: 'pointer',
                  transition: 'all 0.25s ease',
                  boxShadow: hover === mod.id ? '0 8px 24px rgba(0,0,0,0.4), 0 0 15px rgba(244,123,32,0.08), inset 0 1px 0 rgba(255,255,255,0.05)' : '4px 4px 12px rgba(0,0,0,0.3), -2px -2px 8px rgba(255,255,255,0.02), inset 0 1px 0 rgba(255,255,255,0.04)',
                  transform: hover === mod.id ? 'translateY(-3px)' : 'none',
                  fontFamily: "'Montserrat', sans-serif",
                  WebkitFontSmoothing: 'antialiased' as any,
                  position: 'relative' as const, overflow: 'hidden',
                  color: mod.isWarRoom ? '#E8611A' : hover === mod.id ? 'rgba(255,255,255,0.90)' : 'rgba(255,255,255,0.45)',
                }}
              >
                {/* Top accent line */}
                <div style={{
                  position: 'absolute', top: 0, left: '20%', right: '20%', height: '1px',
                  background: 'linear-gradient(90deg, transparent, rgba(232,97,26,0.15), transparent)',
                  opacity: mod.isWarRoom ? 0.6 : hover === mod.id ? 1 : 0,
                  transition: 'opacity 0.3s',
                }} />

                {/* Icon */}
                <div style={{ height: '48px', transition: 'color 0.25s' }}>
                  {mod.icon}
                </div>

                {/* Name */}
                <span style={{
                  fontWeight: 600, fontSize: '15px', textAlign: 'center', lineHeight: 1.2,
                  color: mod.isWarRoom ? 'rgba(255,255,255,0.70)' : hover === mod.id ? 'rgba(255,255,255,0.90)' : 'rgba(255,255,255,0.50)',
                  transition: 'color 0.25s',
                }}>{mod.name}</span>

                {/* KPI */}
                <div style={{
                  fontWeight: 700, fontSize: '13px', textAlign: 'center',
                  color: hover === mod.id ? 'rgba(255,255,255,0.60)' : 'rgba(255,255,255,0.30)',
                  transition: 'color 0.25s', letterSpacing: '0.3px',
                }}>
                  {mod.kpiType === 'number' && (
                    <><span style={{ fontWeight: 800, fontSize: '28px', display: 'block', marginBottom: '1px', color: hover === mod.id ? 'rgba(255,255,255,0.85)' : 'rgba(255,255,255,0.55)' }}>{mod.kpiType === 'number' ? getKpi(mod) : mod.kpi}</span>{mod.kpiLabel}</>
                  )}
                  {mod.kpiType === 'status' && (
                    <><span style={{ display: 'inline-block', width: '5px', height: '5px', borderRadius: '50%', marginRight: '4px', verticalAlign: 'middle', background: mod.statusColor === 'g' ? '#10B981' : '#F59E0B' }} />{mod.statusLabel}</>
                  )}
                  {mod.kpiType === 'text' && mod.kpiLabel}
                </div>
              </button>
            ))}
          </div>
        ))}
      </div>
    </div>
  )
}
