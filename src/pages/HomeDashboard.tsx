// ——————————————————————————————————————————————————————————————————————————————
// | BLINDAJE DASHBOARD V27g — CLEAN TEXT ONLY                                  |
// | • 9 cards: solid vivid colors + text/numbers only                          |
// | • White dot top-right preserved                                            |
// | • All background icons REMOVED — clean minimalist                          |
// | • Aprobado JJ Abr/2026                                                     |
// ——————————————————————————————————————————————————————————————————————————————
import React, { useState, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import AppHeader from '../components/layout/AppHeader'
import { useAuthContext } from '../hooks/AuthContext'

interface CardConfig {
  id: string
  label: string
  route: string
  kpiValue: number | string
  kpiLabel: string
  statusDot: 'green' | 'yellow' | 'red' | 'gray'
  statusText: string
}

const DASH = {
  bg: '#E8EBF0',
  fontFamily: "'Montserrat', sans-serif",
  fontBody: "'Montserrat', sans-serif",
  cardRadius: '14px',
  cardPadding: '22px',
  cardShadow: '0 2px 4px rgba(0,0,0,0.06), 0 4px 12px rgba(0,0,0,0.05), 0 8px 24px rgba(0,0,0,0.04), inset 0 1px 0 rgba(255,255,255,0.9)',
  cardHoverShadow: '0 6px 12px rgba(0,0,0,0.1), 0 12px 32px rgba(0,0,0,0.1), 0 20px 56px rgba(0,0,0,0.08), inset 0 1px 0 rgba(255,255,255,0.95)',
  gridGap: '14px',
  gridPadding: '16px 28px',
  titleSize: '20px',
  titleWeight: 800,
  kpiSize: '28px',
  kpiWeight: 600,
  subSize: '9px',
  subWeight: 400,
} as const

const CARD_BG: Record<string, string> = {
  'oportunidades': '#2563EB',
  'comercial':     '#0891B2',
  'servicio-clientes': '#059669',
  'despacho':      '#EA580C',
  'ventas':        '#16A34A',
  'cotizaciones':  '#D97706',
  'plantillas':    '#7C3AED',
  'comunicaciones':'#DB2777',
  'config':        '#6366F1',
}

export default function HomeDashboard() {
  const navigate = useNavigate()
  const { user, logout } = useAuthContext()
  const [hoveredCard, setHoveredCard] = useState<string | null>(null)

  const formatName = (email?: string) => {
    if (!email) return 'Usuario'
    const name = email.split('@')[0]
    return name.split('.').map((p: string) => p.charAt(0).toUpperCase() + p.slice(1)).join(' ')
  }

  const handleLogout = async () => {
    await logout()
    navigate('/login')
  }

  const [kpis, setKpis] = useState({
    leadsActivos: 0, viajesActivos: 0, clientes: 0, segmentosDedicados: 0,
    cuentasCxc: 0, unidadesGps: 0, alertasHoy: 0, formatosActivos: 0,
    leadsPipeline: 0, tractosTotal: 0, cajasTotal: 0,
  })
  const [kpisLoaded, setKpisLoaded] = useState(false)

  const fetchKpis = useCallback(async () => {
    const { data: { session } } = await supabase.auth.getSession()
    if (!session) { navigate('/login'); return }
    const sc = async (table: string, fn?: (q: any) => any): Promise<number> => {
      try {
        const base = supabase.from(table).select('*', { count: 'exact', head: true })
        const { count, error } = await (fn ? fn(base) : base)
        if (error) { console.warn(`[KPI] ${table}:`, error.message); return 0 }
        return count ?? 0
      } catch (e) { console.warn(`[KPI] ${table} exception:`, e); return 0 }
    }
    const [leads, viajes, clientes, dedicados, cxc, gps, formatosActivos, viajesRiesgo, notifUnread, tractos, cajas] = await Promise.all([
      sc('leads', q => q.is('deleted_at', null)),
      sc('viajes', q => q.in('estado', ['asignado', 'en_transito', 'en_curso', 'programado'])),
      sc('clientes', q => q.is('deleted_at', null)),
      sc('formatos_venta', q => q.eq('tipo_servicio', 'DEDICADO')),
      sc('cxc_cartera'),
      sc('gps_tracking'),
      sc('formatos_venta', q => q.eq('activo', true)),
      sc('viajes', q => q.in('estado', ['en_riesgo', 'retrasado'])),
      sc('notificaciones', q => q.eq('leida', false).is('deleted_at', null)),
      sc('tractos', q => q.eq('activo', true)),
      sc('cajas', q => q.eq('activo', true)),
    ])
    setKpis({ leadsActivos: leads, viajesActivos: viajes, clientes, segmentosDedicados: dedicados, cuentasCxc: cxc, unidadesGps: gps, alertasHoy: viajesRiesgo + notifUnread, formatosActivos, leadsPipeline: leads, tractosTotal: tractos, cajasTotal: cajas })
    setKpisLoaded(true)
  }, [navigate])

  useEffect(() => { fetchKpis(); const i = setInterval(fetchKpis, 60000); return () => clearInterval(i) }, [fetchKpis])

  const mainCards: CardConfig[] = [
    { id: 'oportunidades', label: 'Oportunidades', route: '/ventas/mis-leads', kpiValue: kpis.leadsActivos, kpiLabel: 'leads', statusDot: 'green', statusText: 'Pipeline activo' },
    { id: 'comercial', label: 'Comercial', route: '/ventas/dashboard', kpiValue: kpis.formatosActivos.toLocaleString(), kpiLabel: 'formatos', statusDot: 'green', statusText: '11 submodulos' },
    { id: 'servicio-clientes', label: 'Servicio a Clientes', route: '/servicio/dashboard', kpiValue: kpis.clientes.toLocaleString(), kpiLabel: 'clientes', statusDot: 'green', statusText: '3 submodulos' },
    { id: 'despacho', label: 'Despacho Inteligente', route: '/operaciones/torre-control', kpiValue: kpis.viajesActivos, kpiLabel: 'viajes', statusDot: kpis.viajesActivos > 0 ? 'green' : 'gray', statusText: kpis.viajesActivos > 0 ? 'Operando' : 'Sin viajes' },
    { id: 'ventas', label: 'Ventas', route: '/ventas/mis-leads', kpiValue: kpis.formatosActivos.toLocaleString(), kpiLabel: 'formatos', statusDot: 'green', statusText: 'Pipeline activo' },
    { id: 'cotizaciones', label: 'Cotizaciones', route: '/cotizador/nueva', kpiValue: '\u2014', kpiLabel: 'pendientes', statusDot: 'gray', statusText: 'Disponible' },
    { id: 'plantillas', label: 'Plantillas', route: '/documentos', kpiValue: '\u2014', kpiLabel: 'plantillas', statusDot: 'gray', statusText: 'Disponible' },
  ]
  const row2Cards: CardConfig[] = [
    { id: 'comunicaciones', label: 'Comunicaciones', route: '/comunicaciones/correos', kpiValue: '3', kpiLabel: 'canales', statusDot: 'green', statusText: 'Activo' },
    { id: 'config', label: 'Configuracion', route: '/admin/configuracion', kpiValue: '', kpiLabel: '', statusDot: 'gray', statusText: '' },
  ]

  const getCardStyle = (isHovered: boolean, cardId?: string): React.CSSProperties => ({
    aspectRatio: '1 / 0.75',
    borderRadius: DASH.cardRadius,
    padding: DASH.cardPadding,
    background: (cardId && CARD_BG[cardId]) || '#2563EB',
    border: 'none',
    cursor: 'pointer',
    position: 'relative',
    overflow: 'hidden',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'flex-start',
    justifyContent: 'flex-start',
    transition: 'transform 0.25s ease, box-shadow 0.25s ease',
    transform: isHovered ? 'translateY(-3px)' : 'translateY(0)',
    boxShadow: isHovered ? DASH.cardHoverShadow : DASH.cardShadow,
  })

  const renderCard = (card: CardConfig) => {
    const isHovered = hoveredCard === card.id
    return (
      <div key={card.id} onClick={() => navigate(card.route)} onMouseEnter={() => setHoveredCard(card.id)} onMouseLeave={() => setHoveredCard(null)} style={getCardStyle(isHovered, card.id)}>
        <div style={{ position: 'absolute', top: '14px', right: '14px', width: '6px', height: '6px', borderRadius: '50%', backgroundColor: 'rgba(255,255,255,0.35)' }} />
        <div style={{ fontFamily: DASH.fontFamily, fontSize: DASH.titleSize, fontWeight: DASH.titleWeight, color: '#FFFFFF', lineHeight: 1.2, marginBottom: 'auto', position: 'relative', zIndex: 1 }}>{card.label}</div>
        <div style={{ fontFamily: DASH.fontFamily, fontSize: DASH.kpiSize, fontWeight: DASH.kpiWeight, color: '#FFFFFF', lineHeight: 1, marginTop: '6px', position: 'relative', zIndex: 1 }}>{!kpisLoaded && typeof card.kpiValue === 'number' ? '...' : card.kpiValue}</div>
        <div style={{ fontFamily: DASH.fontBody, fontSize: DASH.subSize, fontWeight: DASH.subWeight, color: 'rgba(255,255,255,0.7)', marginTop: '3px', position: 'relative', zIndex: 1 }}>{card.statusText}</div>
      </div>
    )
  }

  return (
    <div style={{ height: '100vh', overflow: 'hidden', display: 'flex', flexDirection: 'column', backgroundColor: DASH.bg, fontFamily: DASH.fontFamily, color: '#1E293B' }}>
      <style>{`@import url('https://fonts.googleapis.com/css2?family=Montserrat:wght@400;500;600;700;800&display=swap');`}</style>
      <AppHeader onLogout={handleLogout} userName={formatName(user?.email)} userRole={user?.rol || 'admin'} userEmail={user?.email} />
      <div style={{ flex: '1 1 auto', padding: DASH.gridPadding, display: 'flex', flexDirection: 'column', gap: DASH.gridGap, overflow: 'hidden' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: DASH.gridGap }}>{mainCards.map(renderCard)}</div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: DASH.gridGap }}>
          <div style={{ gridColumn: '6 / 7' }}>{renderCard(row2Cards[0])}</div>
          <div style={{ gridColumn: '7 / 8' }}>{renderCard(row2Cards[1])}</div>
        </div>
      </div>
    </div>
  )
}
