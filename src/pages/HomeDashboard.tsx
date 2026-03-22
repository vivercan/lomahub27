// src/pages/HomeDashboard.tsx





// V28: 9 modules — Comercial, Operaciones, Servicio, Dedicados, Cobranza, Comunicaciones, Config, Actividades, Documentos — Servicio tamed, subtitle legibility, icon family — icon consistency, subtitle subordination, Comms authority — elite precision — Tarjetas grandes 48px
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
    <svg width="55" height="55" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.1" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
      <circle cx="12" cy="11" r="2.5" strokeWidth="1.8"/>
    </svg>
  ),
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
  servicio: (
    <svg width="55" height="55" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.1" strokeLinecap="round">
      <path d="M3 18v-6a9 9 0 0 1 18 0v6"/>
      <path d="M21 19a2 2 0 0 1-2 2h-1a2 2 0 0 1-2-2v-3a2 2 0 0 1 2-2h3z"/>
      <path d="M3 19a2 2 0 0 0 2 2h1a2 2 0 0 0 2-2v-3a2 2 0 0 0-2-2H3z"/>
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
  mapa: (
    <svg width="55" height="55" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.1" strokeLinecap="round">
      <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/>
      <circle cx="12" cy="10" r="3"/>
    </svg>
  ),
  flota: (
    <svg width="55" height="55" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.1" strokeLinecap="round">
      <rect x="1" y="3" width="15" height="13" rx="1"/>
      <polygon points="16 8 20 8 23 11 23 16 16 16 16 8"/>
      <circle cx="5.5" cy="18.5" r="2.5"/>
      <circle cx="18.5" cy="18.5" r="2.5"/>
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
  rentabilidad: (
    <svg width="60" height="60" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.3" strokeLinecap="round">
      <line x1="12" y1="3" x2="12" y2="21"/>
      <line x1="4" y1="3" x2="20" y2="3"/>
      <path d="M4 3L2 10h8L8 3"/>
      <path d="M16 3l2 7h-8l2-7"/>
      <line x1="8" y1="21" x2="16" y2="21"/>
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

const modules = [
  { id: 1, name: 'Comercial', icon: icons.ventas, route: '/ventas/mis-leads', row: 1, kpi: '—', kpiType: 'number', kpiLabel: 'leads activos', priority: 'high', isWarRoom: true },
  { id: 2, name: 'Operaciones', icon: icons.torre, route: '/operaciones/torre-control', row: 1, kpi: '—', kpiType: 'number', kpiLabel: 'viajes activos', priority: 'high' },
  { id: 3, name: 'Servicio', icon: icons.clientes, route: '/servicio/dashboard', row: 1, kpi: '—', kpiType: 'number', kpiLabel: 'clientes', priority: 'high' },
  { id: 4, name: 'Dedicados', icon: icons.dedicados, route: '/operaciones/dedicados', row: 1, kpi: '—', kpiType: 'number', kpiLabel: 'segmentos', priority: 'mid' },
  { id: 5, name: 'Cobranza', icon: icons.cobranza, route: '/cxc/cartera', row: 1, kpi: '—', kpiType: 'number', kpiLabel: 'cuentas CXC', priority: 'mid' },
  { id: 6, name: 'Comunicaciones', icon: icons.comunicaciones, route: '/servicio/whatsapp', row: 2, kpi: null, kpiType: 'status', statusLabel: 'Activo', statusColor: 'g', priority: 'mid' },
  { id: 7, name: 'Configuración', icon: icons.config, route: '/admin/configuracion', row: 2, kpi: null, kpiType: 'text', kpiLabel: '—', priority: 'low' },
  { id: 8, name: 'Actividades', icon: icons.indicadores, route: '/inteligencia', row: 2, kpi: null, kpiType: 'status', statusLabel: 'Próximamente', statusColor: 'a', priority: 'low' },
  { id: 9, name: 'Documentos', icon: icons.reportes, route: '/inteligencia/presupuesto', row: 2, kpi: null, kpiType: 'status', statusLabel: 'Próximamente', statusColor: 'a', priority: 'low' },
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
    if (m.id === 1) return String(counts.leads || 0)
    if (m.id === 2) return String(counts.viajes || 0)
    if (m.id === 3) return String(counts.clientes || 0)
    if (m.id === 4) return String(counts.tractos || 0)
    if (m.id === 5) return String(counts.cxc_cartera || 0)
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
      <div className="dash-status-bar" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-evenly', padding: '14px 28px', margin: '14px 0 10px', background: 'rgba(255,255,255,0.025)', border: '1px solid rgba(255,255,255,0.05)', borderRadius: '0', flexShrink: 0 }}>
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
      <div style={{ flex: 1, padding: '4px 20px', maxWidth: '100%',  overflow: 'hidden', display: 'flex', flexDirection: 'column', gap: '14px' }}>
        {[1, 2].map(row => (
          <div key={row} style={{ display: 'grid', gridTemplateColumns: `repeat(${row === 1 ? 5 : 4}, 1fr)`, gap: '10px' }}>
            {modules.filter(m => m.row === row).map((mod, idx) => (
              <button
                key={mod.id}
                className={`dash-card-${row === 1 ? idx : idx + 7}`}
                onClick={() => navigate(mod.route)}
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
                  WebkitFontSmoothing: 'antialiased' as any,
                  position: 'relative' as const, overflow: 'hidden',
                  color: mod.isWarRoom ? '#E8611A' : hover === mod.id ? 'rgba(255,255,255,0.90)' : 'rgba(255,255,255,0.45)',
                }}
              >
                {/* Top accent line */}
                <div style={{
                  position: 'absolute', top: 0, left: '15%', right: '15%', height: '1px',
                  background: mod.isWarRoom ? 'linear-gradient(90deg, transparent, rgba(232,97,26,0.2), transparent)' : 'linear-gradient(90deg, transparent, rgba(160,170,190,0.12), transparent)',
                  opacity: mod.isWarRoom ? 0.85 : mod.priority === 'high' ? 0.65 : hover === mod.id ? 0.75 : 0.3,
                  transition: 'opacity 0.3s',
                }} />

                {/* Icon */}
                <div style={{ height: '55px', position: 'relative', transition: 'all 0.2s', filter: hover === mod.id ? 'brightness(1.18)' : 'brightness(1.0)' }}>
                  {mod.icon}
                </div>

                {/* Name */}
                <span style={{
                  fontWeight: 600, fontSize: '14px', letterSpacing: '0.3px', textAlign: 'center', lineHeight: 1.2,
                  color: mod.isWarRoom ? 'rgba(255,255,255,0.70)' : hover === mod.id ? 'rgba(255,255,255,0.90)' : 'rgba(255,255,255,0.50)',
                  transition: 'color 0.25s',
                }}>{mod.name}</span>

                {/* KPI */}
                <div style={{
                  fontWeight: 500, fontSize: '11.5px', textAlign: 'center',
                  color: hover === mod.id ? 'rgba(255,255,255,0.48)' : 'rgba(255,255,255,0.28)',
                  transition: 'color 0.25s', letterSpacing: '0.3px',
                }}>
                  {mod.kpiType === 'number' && (
                    <><span style={{ fontWeight: 800, fontSize: '30px', display: 'block', marginBottom: '1px', color: hover === mod.id ? 'rgba(255,255,255,0.92)' : mod.priority === 'high' ? 'rgba(255,255,255,0.72)' : 'rgba(255,255,255,0.58)' }}>{mod.kpiType === 'number' ? getKpi(mod) : mod.kpi}</span>{mod.kpiLabel}</>
                  )}
                  {mod.kpiType === 'status' && (
                    <><span style={{ display: 'inline-block', width: '3px', height: '3px', borderRadius: '50%', marginRight: '4px', verticalAlign: 'middle', background: mod.statusColor === 'g' ? '#10B981' : '#F59E0B' }} />{mod.statusLabel}</>
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
