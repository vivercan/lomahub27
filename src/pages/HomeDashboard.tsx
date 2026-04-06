// ——————————————————————————————————————————————————————————————————————————————
// | BLINDAJE DASHBOARD V27f — ARCHIVO PROTEGIDO                               |
// |                                                                            |
// | ESTILO: M1 REFINADO + ICONOS PREMIUM WHITE-STROKE  | Aprobado JJ Abr/2026 |
// | • 9 cards (7+2): solid vivid colors + single white-stroke icon per card    |
// | • Icon principal: rgba(255,255,255,0.12) | Secondary: rgba(255,255,255,0.08)|
// | • Hover: movimiento sutil de icono                                         |
// | • Fila 1: 7 cards | Fila 2: Comunicaciones + Config a la derecha           |
// | • Sin barra KPIs — eliminada por JJ 3/Abr/2026                            |
// ——————————————————————————————————————————————————————————————————————————————
import React, { useState, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import AppHeader from '../components/layout/AppHeader'
import { useAuthContext } from '../hooks/AuthContext'

// ============================================================================
// TYPES
// ============================================================================
interface CardConfig {
  id: string
  label: string
  route: string
  kpiValue: number | string
  kpiLabel: string
  statusDot: 'green' | 'yellow' | 'red' | 'gray'
  statusText: string
  icon: React.ReactNode
}

// ============================================================================
// M1 REFINADO — VISUAL CONSTANTS
// ============================================================================
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
  dotSize: '6px',
} as const

const DOT_COLORS: Record<string, string> = {
  green: '#10B981',
  yellow: '#F59E0B',
  red: '#EF4444',
  gray: '#CBD5E1',
}

// Color solido vívido por modulo — fondo completo de cada card
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

// ============================================================================
// ICON SYSTEM — White-stroke premium icons
// Principal: rgba(255,255,255,0.12)  |  Secondary: rgba(255,255,255,0.08)
// ============================================================================
const P = 'rgba(255,255,255,0.13)'  // principal
const S = 'rgba(255,255,255,0.09)'  // secondary

const iconWrap: React.CSSProperties = {
  position: 'absolute',
  top: 0, right: 0, width: '100%', height: '100%',
  pointerEvents: 'none', overflow: 'hidden',
  borderRadius: '14px',
  transition: 'transform 0.6s cubic-bezier(0.23,1,0.32,1)',
}

const svgPos: React.CSSProperties = {
  position: 'absolute', right: 0, bottom: 0,
  width: '100%', height: '100%',
  transform: 'scale(2.1)',
  transformOrigin: '100% 100%',
}

// 1. Oportunidades — Funnel/Pipeline ascending
const IconOportunidades = () => (
  <svg viewBox="0 0 200 140" style={svgPos}>
    <polygon points="55,25 145,25 125,65 75,65" fill="none" stroke={P} strokeWidth="2.5" strokeLinejoin="round" />
    <rect x="75" y="65" width="50" height="45" rx="3" fill="none" stroke={P} strokeWidth="2.5" />
    <line x1="75" y1="85" x2="125" y2="85" stroke={S} strokeWidth="1.5" />
    <path d="M100,58 L100,32" stroke={P} strokeWidth="2" strokeLinecap="round" />
    <path d="M92,40 L100,32 L108,40" fill="none" stroke={P} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
)

// 2. Comercial — Briefcase
const IconComercial = () => (
  <svg viewBox="0 0 200 140" style={svgPos}>
    <rect x="50" y="45" width="100" height="65" rx="8" fill="none" stroke={P} strokeWidth="2.5" />
    <path d="M78,45 L78,35 Q78,25 88,25 L112,25 Q122,25 122,35 L122,45" fill="none" stroke={P} strokeWidth="2" />
    <line x1="50" y1="72" x2="150" y2="72" stroke={S} strokeWidth="1.5" />
    <rect x="90" y="64" width="20" height="16" rx="4" fill="none" stroke={P} strokeWidth="1.5" />
  </svg>
)

// 3. Servicio a Clientes — Headset
const IconServicio = () => (
  <svg viewBox="0 0 200 140" style={svgPos}>
    <path d="M62,80 Q62,35 100,35 Q138,35 138,80" fill="none" stroke={P} strokeWidth="2.5" />
    <rect x="50" y="72" width="20" height="34" rx="8" fill="none" stroke={P} strokeWidth="2" />
    <rect x="130" y="72" width="20" height="34" rx="8" fill="none" stroke={P} strokeWidth="2" />
    <path d="M150,95 Q158,95 158,105 L158,108 Q158,118 145,118 L130,118" fill="none" stroke={S} strokeWidth="1.5" strokeLinecap="round" />
    <circle cx="130" cy="118" r="4" fill="none" stroke={S} strokeWidth="1.5" />
  </svg>
)

// 4. Despacho Inteligente — Truck
const IconDespacho = () => (
  <svg viewBox="0 0 200 140" style={svgPos}>
    <rect x="25" y="42" width="85" height="52" rx="4" fill="none" stroke={P} strokeWidth="2.5" />
    <path d="M110,55 L142,55 L158,78 L158,94 L110,94 Z" fill="none" stroke={P} strokeWidth="2" strokeLinejoin="round" />
    <circle cx="55" cy="100" r="10" fill="none" stroke={P} strokeWidth="2" />
    <circle cx="95" cy="100" r="10" fill="none" stroke={S} strokeWidth="1.5" />
    <circle cx="142" cy="100" r="10" fill="none" stroke={P} strokeWidth="2" />
    <line x1="25" y1="62" x2="110" y2="62" stroke={S} strokeWidth="1.2" />
  </svg>
)

// 5. Ventas — Ascending bar chart with trend
const IconVentas = () => (
  <svg viewBox="0 0 200 140" style={svgPos}>
    <rect x="42" y="82" width="20" height="34" rx="3" fill={S} stroke={P} strokeWidth="2" />
    <rect x="70" y="60" width="20" height="56" rx="3" fill={S} stroke={P} strokeWidth="2" />
    <rect x="98" y="38" width="20" height="78" rx="3" fill={S} stroke={P} strokeWidth="2" />
    <rect x="126" y="18" width="20" height="98" rx="3" fill={S} stroke={P} strokeWidth="2" />
    <path d="M52,78 L80,56 L108,34 L136,14" fill="none" stroke={P} strokeWidth="1.8" strokeLinecap="round" strokeDasharray="5 4" />
  </svg>
)

// 6. Cotizaciones — Document with $ sign
const IconCotizaciones = () => (
  <svg viewBox="0 0 200 140" style={svgPos}>
    <rect x="58" y="12" width="75" height="100" rx="6" fill="none" stroke={P} strokeWidth="2.5" />
    <line x1="74" y1="38" x2="118" y2="38" stroke={S} strokeWidth="1.5" strokeLinecap="round" />
    <line x1="74" y1="52" x2="108" y2="52" stroke={S} strokeWidth="1.5" strokeLinecap="round" />
    <line x1="74" y1="66" x2="98" y2="66" stroke={S} strokeWidth="1.5" strokeLinecap="round" />
    <text x="112" y="92" fontSize="28" fontFamily="Montserrat" fontWeight="700" fill="none" stroke={P} strokeWidth="1.5">$</text>
  </svg>
)

// 7. Plantillas — Stacked layered documents
const IconPlantillas = () => (
  <svg viewBox="0 0 200 140" style={svgPos}>
    <rect x="68" y="14" width="55" height="78" rx="5" fill="none" stroke={S} strokeWidth="1.8" />
    <rect x="78" y="24" width="55" height="78" rx="5" fill="none" stroke={P} strokeWidth="2" />
    <rect x="88" y="34" width="55" height="78" rx="5" fill="none" stroke={P} strokeWidth="2.5" />
    <line x1="98" y1="52" x2="132" y2="52" stroke={S} strokeWidth="1.2" strokeLinecap="round" />
    <line x1="98" y1="64" x2="126" y2="64" stroke={S} strokeWidth="1.2" strokeLinecap="round" />
    <line x1="98" y1="76" x2="120" y2="76" stroke={S} strokeWidth="1.2" strokeLinecap="round" />
  </svg>
)

// 8. Comunicaciones — Chat bubbles
const IconComunicaciones = () => (
  <svg viewBox="0 0 200 140" style={svgPos}>
    <rect x="35" y="18" width="72" height="50" rx="12" fill="none" stroke={P} strokeWidth="2.5" />
    <path d="M55,68 L45,82 L70,68" fill="none" stroke={P} strokeWidth="2" strokeLinejoin="round" />
    <rect x="90" y="52" width="68" height="44" rx="12" fill="none" stroke={P} strokeWidth="2" />
    <path d="M140,96 L148,108 L128,96" fill="none" stroke={S} strokeWidth="1.5" strokeLinejoin="round" />
    <circle cx="58" cy="40" r="4" fill={S} />
    <circle cx="72" cy="40" r="4" fill={S} />
    <circle cx="86" cy="40" r="4" fill={S} />
  </svg>
)

// 9. Configuracion — Gear
const IconConfig = () => (
  <svg viewBox="0 0 200 140" style={svgPos}>
    <circle cx="100" cy="68" r="28" fill="none" stroke={P} strokeWidth="2.5" />
    <circle cx="100" cy="68" r="14" fill="none" stroke={P} strokeWidth="2" />
    {/* Gear teeth — 6 positions */}
    <rect x="96" y="32" width="8" height="14" rx="2" fill={S} stroke={P} strokeWidth="1.2" />
    <rect x="96" y="90" width="8" height="14" rx="2" fill={S} stroke={P} strokeWidth="1.2" />
    <rect x="64" y="64" width="14" height="8" rx="2" fill={S} stroke={P} strokeWidth="1.2" />
    <rect x="122" y="64" width="14" height="8" rx="2" fill={S} stroke={P} strokeWidth="1.2" />
    <rect x="73" y="43" width="10" height="8" rx="2" fill={S} stroke={S} strokeWidth="1" transform="rotate(-45,78,47)" />
    <rect x="117" y="85" width="10" height="8" rx="2" fill={S} stroke={S} strokeWidth="1" transform="rotate(-45,122,89)" />
  </svg>
)

// ============================================================================
// COMPONENT
// ============================================================================
export default function HomeDashboard() {
  const navigate = useNavigate()
  const { user, logout } = useAuthContext()
  const [hoveredCard, setHoveredCard] = useState<string | null>(null)

  const formatName = (email?: string) => {
    if (!email) return 'Usuario'
    const name = email.split('@')[0]
    return name
      .split('.')
      .map((p: string) => p.charAt(0).toUpperCase() + p.slice(1))
      .join(' ')
  }

  const handleLogout = async () => {
    await logout()
    navigate('/login')
  }

  // KPI state
  const [kpis, setKpis] = useState({
    leadsActivos: 0,
    viajesActivos: 0,
    clientes: 0,
    segmentosDedicados: 0,
    cuentasCxc: 0,
    unidadesGps: 0,
    alertasHoy: 0,
    formatosActivos: 0,
    leadsPipeline: 0,
    tractosTotal: 0,
    cajasTotal: 0,
  })
  const [kpisLoaded, setKpisLoaded] = useState(false)

  const fetchKpis = useCallback(async () => {
    const { data: { session } } = await supabase.auth.getSession()
    if (!session) {
      console.warn('[KPI] No active session — redirecting to login')
      navigate('/login')
      return
    }

    const sc = async (table: string, fn?: (q: any) => any): Promise<number> => {
      try {
        const base = supabase.from(table).select('*', { count: 'exact', head: true })
        const { count, error } = await (fn ? fn(base) : base)
        if (error) { console.warn(`[KPI] ${table}:`, error.message); return 0 }
        return count ?? 0
      } catch (e) { console.warn(`[KPI] ${table} exception:`, e); return 0 }
    }

    const [
      leads, viajes, clientes, dedicados, cxc, gps,
      formatosActivos, viajesRiesgo, notifUnread, tractos, cajas,
    ] = await Promise.all([
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

    setKpis({
      leadsActivos: leads,
      viajesActivos: viajes,
      clientes,
      segmentosDedicados: dedicados,
      cuentasCxc: cxc,
      unidadesGps: gps,
      alertasHoy: viajesRiesgo + notifUnread,
      formatosActivos,
      leadsPipeline: leads,
      tractosTotal: tractos,
      cajasTotal: cajas,
    })
    setKpisLoaded(true)
  }, [navigate])

  useEffect(() => {
    fetchKpis()
    const interval = setInterval(fetchKpis, 60000)
    return () => clearInterval(interval)
  }, [fetchKpis])

  // ——— 9 CARD DEFINITIONS ———————————————————————
  const mainCards: CardConfig[] = [
    {
      id: 'oportunidades', label: 'Oportunidades', route: '/ventas/mis-leads',
      kpiValue: kpis.leadsActivos, kpiLabel: 'leads',
      statusDot: 'green', statusText: 'Pipeline activo',
      icon: <IconOportunidades />,
    },
    {
      id: 'comercial', label: 'Comercial', route: '/ventas/dashboard',
      kpiValue: kpis.formatosActivos.toLocaleString(), kpiLabel: 'formatos',
      statusDot: 'green', statusText: '11 submodulos',
      icon: <IconComercial />,
    },
    {
      id: 'servicio-clientes', label: 'Servicio a Clientes', route: '/servicio/dashboard',
      kpiValue: kpis.clientes.toLocaleString(), kpiLabel: 'clientes',
      statusDot: 'green', statusText: '3 submodulos',
      icon: <IconServicio />,
    },
    {
      id: 'despacho', label: 'Despacho Inteligente', route: '/operaciones/torre-control',
      kpiValue: kpis.viajesActivos, kpiLabel: 'viajes',
      statusDot: kpis.viajesActivos > 0 ? 'green' : 'gray',
      statusText: kpis.viajesActivos > 0 ? 'Operando' : 'Sin viajes',
      icon: <IconDespacho />,
    },
    {
      id: 'ventas', label: 'Ventas', route: '/ventas/mis-leads',
      kpiValue: kpis.formatosActivos.toLocaleString(), kpiLabel: 'formatos',
      statusDot: 'green', statusText: 'Pipeline activo',
      icon: <IconVentas />,
    },
    {
      id: 'cotizaciones', label: 'Cotizaciones', route: '/cotizador/nueva',
      kpiValue: '\u2014', kpiLabel: 'pendientes',
      statusDot: 'gray', statusText: 'Disponible',
      icon: <IconCotizaciones />,
    },
    {
      id: 'plantillas', label: 'Plantillas', route: '/documentos',
      kpiValue: '\u2014', kpiLabel: 'plantillas',
      statusDot: 'gray', statusText: 'Disponible',
      icon: <IconPlantillas />,
    },
  ]

  const row2Cards: CardConfig[] = [
    {
      id: 'comunicaciones', label: 'Comunicaciones', route: '/comunicaciones/correos',
      kpiValue: '3', kpiLabel: 'canales',
      statusDot: 'green', statusText: 'Activo',
      icon: <IconComunicaciones />,
    },
    {
      id: 'config', label: 'Configuracion', route: '/admin/configuracion',
      kpiValue: '\u2699\uFE0F', kpiLabel: 'admin',
      statusDot: 'gray', statusText: 'Sistema',
      icon: <IconConfig />,
    },
  ]

  // ——— CARD STYLE ————————————————————————————————
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

  // ——— RENDER CARD ————————————————————————————————
  const renderCard = (card: CardConfig) => {
    const isHovered = hoveredCard === card.id
    return (
      <div
        key={card.id}
        onClick={() => navigate(card.route)}
        onMouseEnter={() => setHoveredCard(card.id)}
        onMouseLeave={() => setHoveredCard(null)}
        style={getCardStyle(isHovered, card.id)}
      >
        {/* Single icon layer — moves on hover */}
        <div style={{
          ...iconWrap,
          transform: isHovered ? 'translate(4px, -4px) scale(1.05)' : 'translate(0,0) scale(1)',
        }}>
          {card.icon}
        </div>

        {/* Status dot — unificado blanco sutil (Opción B) */}
        <div style={{
          position: 'absolute', top: '14px', right: '14px',
          width: '6px', height: '6px', borderRadius: '50%',
          backgroundColor: 'rgba(255,255,255,0.35)',
        }} />

        {/* Module name */}
        <div style={{
          fontFamily: DASH.fontFamily,
          fontSize: DASH.titleSize,
          fontWeight: DASH.titleWeight,
          color: '#FFFFFF',
          lineHeight: 1.2,
          marginBottom: 'auto',
          position: 'relative',
          zIndex: 1,
        }}>
          {card.label}
        </div>

        {/* KPI */}
        <div style={{
          fontFamily: DASH.fontFamily,
          fontSize: DASH.kpiSize,
          fontWeight: DASH.kpiWeight,
          color: '#FFFFFF',
          lineHeight: 1,
          marginTop: '6px',
          position: 'relative',
          zIndex: 1,
        }}>
          {!kpisLoaded && typeof card.kpiValue === 'number' ? '...' : card.kpiValue}
        </div>

        {/* Subtitle */}
        <div style={{
          fontFamily: DASH.fontBody,
          fontSize: DASH.subSize,
          fontWeight: DASH.subWeight,
          color: 'rgba(255,255,255,0.7)',
          marginTop: '3px',
          position: 'relative',
          zIndex: 1,
        }}>
          {card.statusText}
        </div>
      </div>
    )
  }

  // ——— RENDER ————————————————————————————————————
  return (
    <div style={{
      height: '100vh',
      overflow: 'hidden',
      display: 'flex',
      flexDirection: 'column',
      backgroundColor: DASH.bg,
      fontFamily: DASH.fontFamily,
      color: '#1E293B',
    }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Montserrat:wght@400;500;600;700;800&display=swap');
      `}</style>

      {/* Zona 1 — AppHeader */}
      <AppHeader
        onLogout={handleLogout}
        userName={formatName(user?.email)}
        userRole={user?.rol || 'admin'}
        userEmail={user?.email}
      />

      {/* Zona 2 — Grid de Cards */}
      <div style={{
        flex: '1 1 auto',
        padding: DASH.gridPadding,
        display: 'flex',
        flexDirection: 'column',
        gap: DASH.gridGap,
        overflow: 'hidden',
      }}>
        {/* Fila 1: 7 cards principales */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(7, 1fr)',
          gap: DASH.gridGap,
        }}>
          {mainCards.map(renderCard)}
        </div>

        {/* Fila 2: Comunicaciones + Config alineados a la derecha */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(7, 1fr)',
          gap: DASH.gridGap,
        }}>
          <div style={{ gridColumn: '6 / 7' }}>
            {renderCard(row2Cards[0])}
          </div>
          <div style={{ gridColumn: '7 / 8' }}>
            {renderCard(row2Cards[1])}
          </div>
        </div>
      </div>
    </div>
  )
}
