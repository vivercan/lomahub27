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
import { CARD_ICON_POS, CARD_ICON_P, CARD_ICON_S } from '../lib/cardIconStyle'
import { Filter, Briefcase, MessagesSquare, Truck, BarChart3, Receipt, Files, Radio, Settings, Star, RefreshCw } from 'lucide-react'

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
const P = CARD_ICON_P  // principal
const S = CARD_ICON_S  // secondary

const iconWrap: React.CSSProperties = {
  position: 'absolute',
  top: 0, right: 0, width: '100%', height: '100%',
  pointerEvents: 'none', overflow: 'hidden',
  borderRadius: '14px',
  transition: 'transform 0.6s cubic-bezier(0.23,1,0.32,1)',
}

const svgPos: React.CSSProperties = CARD_ICON_POS

// Lucide premium outline family — single visual family, positioned via cardIconStyle.ts
const lucideStyle = { ...svgPos, color: P } as React.CSSProperties
const IconOportunidades = () => (<Filter style={lucideStyle} strokeWidth={1.5} absoluteStrokeWidth />)
const IconComercial = () => (<Briefcase style={lucideStyle} strokeWidth={1.5} absoluteStrokeWidth />)
const IconServicio = () => (<MessagesSquare style={lucideStyle} strokeWidth={1.5} absoluteStrokeWidth />)
const IconDespacho = () => (<Truck style={lucideStyle} strokeWidth={1.5} absoluteStrokeWidth />)
const IconVentas = () => (<BarChart3 style={lucideStyle} strokeWidth={1.5} absoluteStrokeWidth />)
const IconCotizaciones = () => (<Receipt style={lucideStyle} strokeWidth={1.5} absoluteStrokeWidth />)
const IconPlantillas = () => (<Files style={lucideStyle} strokeWidth={1.5} absoluteStrokeWidth />)
const IconComunicaciones = () => (<Radio style={lucideStyle} strokeWidth={1.5} absoluteStrokeWidth />)
const IconConfig = () => (
  <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none' }}>
    <Star style={{ position: 'absolute', right: '40%', bottom: '34%', width: '20%', height: '20%', color: P }} strokeWidth={1.5} absoluteStrokeWidth />
    <RefreshCw style={{ position: 'absolute', right: '-6%', bottom: '-8%', width: '34%', height: '34%', color: P }} strokeWidth={1.5} absoluteStrokeWidth />
    <Settings style={{ position: 'absolute', right: '-14%', bottom: '-20%', width: '72%', height: '100%', color: P }} strokeWidth={1.5} absoluteStrokeWidth />
  </div>
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
