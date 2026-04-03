// ╔══════════════════════════════════════════════════════════════════════════════╗
// ║ 🛡️  BLINDAJE DASHBOARD V27f — ARCHIVO PROTEGIDO                           ║
// ║                                                                            ║
// ║  ESTILO: M1 REFINADO + 3D GEOMETRIC PREMIUM — Aprobado JJ 3/Abr/2026     ║
// ║    • 8 cards (7+1): white + subtle 3D geometric per module                ║
// ║    • NO icons — solo nombre grande + figuras geométricas flotantes        ║
// ║    • Hover: movimiento sutil de geometría                                  ║
// ║    • Fila 1: 7 cards | Fila 2: 1 card (Config) alineada a la derecha     ║
// ╚══════════════════════════════════════════════════════════════════════════════╝

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
  geo: React.ReactNode
}

// ============================================================================
// M1 REFINADO + 3D GEOMETRIC — VISUAL CONSTANTS
// ============================================================================

const DASH = {
  bg: '#E8EBF0',
  fontFamily: "'Montserrat', sans-serif",
  fontBody: "'Inter', sans-serif",
  cardBg: '#FFFFFF',
  cardBorder: '1px solid #E8EBF0',
  cardRadius: '14px',
  cardPadding: '22px',
  cardShadow: '0 1px 2px rgba(0,0,0,0.04), 0 2px 8px rgba(0,0,0,0.03), 0 4px 16px rgba(0,0,0,0.02)',
  cardHoverShadow: '0 2px 4px rgba(0,0,0,0.06), 0 4px 16px rgba(0,0,0,0.06), 0 8px 32px rgba(0,0,0,0.04)',
  gridGap: '16px',
  gridPadding: '16px 28px',
  titleSize: '20px',
  titleWeight: 800,
  titleColor: '#64748B',
  kpiSize: '32px',
  kpiWeight: 600,
  kpiColor: '#64748B',
  subSize: '9px',
  subWeight: 400,
  subColor: '#94A3B8',
  dotSize: '6px',
  metricsPadding: '12px 28px',
  metricsBg: 'rgba(255,255,255,0.6)',
  metricsBorder: '1px solid #D1D5DB',
} as const

const DOT_COLORS: Record<string, string> = {
  green: '#10B981', yellow: '#F59E0B', red: '#EF4444', gray: '#CBD5E1',
}

// ============================================================================
// 3D GEOMETRIC SVG PATTERNS — unique per module, very subtle
// ============================================================================

const geoStyle: React.CSSProperties = {
  position: 'absolute',
  top: 0,
  right: 0,
  width: '100%',
  height: '100%',
  pointerEvents: 'none',
  overflow: 'hidden',
  borderRadius: '14px',
  transition: 'transform 0.6s cubic-bezier(0.23,1,0.32,1)',
}

// Oportunidades — ascending chevrons
const GeoOportunidades = () => (
  <div style={geoStyle} className="geo-inner">
    <svg viewBox="0 0 200 140" style={{ position: 'absolute', right: '-10px', bottom: '-10px', width: '65%', height: '75%', opacity: 0.25 }}>
      <polygon points="100,20 140,60 120,60 120,100 80,100 80,60 60,60" fill="none" stroke="#F97316" strokeWidth="1.5" transform="translate(20,0)" />
      <polygon points="100,35 130,65 115,65 115,95 85,95 85,65 70,65" fill="none" stroke="#F97316" strokeWidth="1" transform="translate(40,20)" />
      <polygon points="100,50 125,75 113,75 113,100 87,100 87,75 75,75" fill="none" stroke="#F97316" strokeWidth="0.8" transform="translate(60,10)" />
    </svg>
  
    <svg viewBox="0 0 120 100" style={{ position: 'absolute', left: '-8px', top: '28%', width: '40%', height: '45%', opacity: 0.18 }}>
      <polyline points="30,60 45,40 60,60" fill="none" stroke="#0EA5E9" strokeWidth="1.5" />
      <polyline points="45,50 60,30 75,50" fill="none" stroke="#0EA5E9" strokeWidth="1.2" />
      <polyline points="55,65 70,45 85,65" fill="none" stroke="#0EA5E9" strokeWidth="0.8" />
    </svg></div>
)

// Comercial — overlapping hexagons
const GeoComercial = () => (
  <div style={geoStyle} className="geo-inner">
    <svg viewBox="0 0 200 140" style={{ position: 'absolute', right: '-5px', bottom: '-5px', width: '70%', height: '80%', opacity: 0.25 }}>
      <polygon points="50,0 93.3,25 93.3,75 50,100 6.7,75 6.7,25" fill="none" stroke="#EF4444" strokeWidth="1.5" transform="translate(60,15) scale(0.7)" />
      <polygon points="50,0 93.3,25 93.3,75 50,100 6.7,75 6.7,25" fill="none" stroke="#EF4444" strokeWidth="1.2" transform="translate(90,35) scale(0.6)" />
      <polygon points="50,0 93.3,25 93.3,75 50,100 6.7,75 6.7,25" fill="none" stroke="#EF4444" strokeWidth="1" transform="translate(40,50) scale(0.5)" />
      <polygon points="50,0 93.3,25 93.3,75 50,100 6.7,75 6.7,25" fill="none" stroke="#EF4444" strokeWidth="0.8" transform="translate(110,10) scale(0.45)" />
    </svg>
  
    <svg viewBox="0 0 120 100" style={{ position: 'absolute', left: '-8px', top: '28%', width: '40%', height: '45%', opacity: 0.18 }}>
      <polygon points="35,20 50,12 65,20 65,36 50,44 35,36" fill="none" stroke="#0EA5E9" strokeWidth="1.3" />
      <polygon points="55,35 67,28 79,35 79,48 67,55 55,48" fill="none" stroke="#0EA5E9" strokeWidth="0.9" />
    </svg></div>
)

// Servicio a Clientes — concentric arcs
const GeoServicio = () => (
  <div style={geoStyle} className="geo-inner">
    <svg viewBox="0 0 200 140" style={{ position: 'absolute', right: '-10px', bottom: '-15px', width: '65%', height: '75%', opacity: 0.25 }}>
      <circle cx="130" cy="90" r="60" fill="none" stroke="#FB923C" strokeWidth="1.5" />
      <circle cx="130" cy="90" r="45" fill="none" stroke="#FB923C" strokeWidth="1.2" />
      <circle cx="130" cy="90" r="30" fill="none" stroke="#FB923C" strokeWidth="1" />
      <circle cx="130" cy="90" r="15" fill="none" stroke="#FB923C" strokeWidth="0.8" />
    </svg>
  
    <svg viewBox="0 0 120 100" style={{ position: 'absolute', left: '-8px', top: '28%', width: '40%', height: '45%', opacity: 0.18 }}>
      <path d="M25,55 A30,30 0 0,1 75,55" fill="none" stroke="#0EA5E9" strokeWidth="1.3" />
      <path d="M35,55 A20,20 0 0,1 65,55" fill="none" stroke="#0EA5E9" strokeWidth="1" />
      <path d="M42,55 A13,13 0 0,1 58,55" fill="none" stroke="#0EA5E9" strokeWidth="0.8" />
    </svg></div>
)

// Despacho Inteligente — isometric cubes
const GeoDespacho = () => (
  <div style={geoStyle} className="geo-inner">
    <svg viewBox="0 0 200 140" style={{ position: 'absolute', right: '-5px', bottom: '-5px', width: '70%', height: '80%', opacity: 0.25 }}>
      <g transform="translate(80,30)">
        <polygon points="30,0 60,17 30,34 0,17" fill="none" stroke="#DC2626" strokeWidth="1.2" />
        <polygon points="0,17 30,34 30,64 0,47" fill="none" stroke="#DC2626" strokeWidth="1.2" />
        <polygon points="60,17 30,34 30,64 60,47" fill="none" stroke="#DC2626" strokeWidth="1.2" />
      </g>
      <g transform="translate(110,50)">
        <polygon points="25,0 50,14 25,28 0,14" fill="none" stroke="#DC2626" strokeWidth="1" />
        <polygon points="0,14 25,28 25,53 0,39" fill="none" stroke="#DC2626" strokeWidth="1" />
        <polygon points="50,14 25,28 25,53 50,39" fill="none" stroke="#DC2626" strokeWidth="1" />
      </g>
      <g transform="translate(60,60)">
        <polygon points="20,0 40,11 20,22 0,11" fill="none" stroke="#DC2626" strokeWidth="0.8" />
        <polygon points="0,11 20,22 20,42 0,31" fill="none" stroke="#DC2626" strokeWidth="0.8" />
        <polygon points="40,11 20,22 20,42 40,31" fill="none" stroke="#DC2626" strokeWidth="0.8" />
      </g>
    </svg>
  
    <svg viewBox="0 0 120 100" style={{ position: 'absolute', left: '-8px', top: '28%', width: '40%', height: '45%', opacity: 0.18 }}>
      <g transform="translate(30,15)">
        <polygon points="25,0 50,14 25,28 0,14" fill="none" stroke="#0EA5E9" strokeWidth="1.3" />
        <polygon points="0,14 25,28 25,53 0,39" fill="none" stroke="#0EA5E9" strokeWidth="1" />
        <polygon points="50,14 25,28 25,53 50,39" fill="none" stroke="#0EA5E9" strokeWidth="1" />
      </g>
    </svg></div>
)

// Comunicaciones — radiating waves
const GeoComunicaciones = () => (
  <div style={geoStyle} className="geo-inner">
    <svg viewBox="0 0 200 140" style={{ position: 'absolute', right: '-10px', bottom: '-10px', width: '65%', height: '75%', opacity: 0.25 }}>
      <path d="M140,100 Q140,60 170,40" fill="none" stroke="#F97316" strokeWidth="1.5" />
      <path d="M130,100 Q130,55 165,30" fill="none" stroke="#F97316" strokeWidth="1.2" />
      <path d="M120,100 Q120,50 160,20" fill="none" stroke="#F97316" strokeWidth="1" />
      <path d="M110,100 Q110,50 155,15" fill="none" stroke="#F97316" strokeWidth="0.8" />
      <circle cx="145" cy="105" r="4" fill="none" stroke="#F97316" strokeWidth="1.2" />
    </svg>
  
    <svg viewBox="0 0 120 100" style={{ position: 'absolute', left: '-8px', top: '28%', width: '40%', height: '45%', opacity: 0.18 }}>
      <circle cx="30" cy="50" r="8" fill="none" stroke="#0EA5E9" strokeWidth="1.3" />
      <path d="M42,38 A20,20 0 0,1 42,62" fill="none" stroke="#0EA5E9" strokeWidth="1" />
      <path d="M50,30 A28,28 0 0,1 50,70" fill="none" stroke="#0EA5E9" strokeWidth="0.8" />
    </svg></div>
)

// Cotizaciones — diamond cluster
const GeoCotizaciones = () => (
  <div style={geoStyle} className="geo-inner">
    <svg viewBox="0 0 200 140" style={{ position: 'absolute', right: '-5px', bottom: '-5px', width: '65%', height: '80%', opacity: 0.25 }}>
      <rect x="90" y="30" width="40" height="40" rx="2" fill="none" stroke="#EF4444" strokeWidth="1.5" transform="rotate(45,110,50)" />
      <rect x="110" y="50" width="30" height="30" rx="2" fill="none" stroke="#EF4444" strokeWidth="1.2" transform="rotate(45,125,65)" />
      <rect x="75" y="55" width="25" height="25" rx="2" fill="none" stroke="#EF4444" strokeWidth="1" transform="rotate(45,87.5,67.5)" />
      <rect x="105" y="75" width="20" height="20" rx="2" fill="none" stroke="#EF4444" strokeWidth="0.8" transform="rotate(45,115,85)" />
    </svg>
  
    <svg viewBox="0 0 120 100" style={{ position: 'absolute', left: '-8px', top: '28%', width: '40%', height: '45%', opacity: 0.18 }}>
      <rect x="35" y="25" width="28" height="28" rx="2" fill="none" stroke="#0EA5E9" strokeWidth="1.3" transform="rotate(45,49,39)" />
      <rect x="48" y="38" width="20" height="20" rx="2" fill="none" stroke="#0EA5E9" strokeWidth="0.9" transform="rotate(45,58,48)" />
    </svg></div>
)

// Plantillas — layered offset rectangles
const GeoPlantillas = () => (
  <div style={geoStyle} className="geo-inner">
    <svg viewBox="0 0 200 140" style={{ position: 'absolute', right: '-5px', bottom: '-10px', width: '65%', height: '75%', opacity: 0.25 }}>
      <rect x="70" y="20" width="60" height="80" rx="4" fill="none" stroke="#FB923C" strokeWidth="1.5" />
      <rect x="82" y="30" width="60" height="80" rx="4" fill="none" stroke="#FB923C" strokeWidth="1.2" />
      <rect x="94" y="40" width="60" height="80" rx="4" fill="none" stroke="#FB923C" strokeWidth="1" />
    </svg>
  
    <svg viewBox="0 0 120 100" style={{ position: 'absolute', left: '-8px', top: '28%', width: '40%', height: '45%', opacity: 0.18 }}>
      <rect x="20" y="15" width="35" height="48" rx="3" fill="none" stroke="#0EA5E9" strokeWidth="1.3" />
      <rect x="28" y="22" width="35" height="48" rx="3" fill="none" stroke="#0EA5E9" strokeWidth="0.9" />
      <line x1="26" y1="30" x2="48" y2="30" stroke="#0EA5E9" strokeWidth="0.7" />
      <line x1="26" y1="38" x2="45" y2="38" stroke="#0EA5E9" strokeWidth="0.7" />
    </svg></div>
)

// Config — interlocking gears (engrane)
const GeoConfig = () => (
  <div style={geoStyle} className="geo-inner">
    <svg viewBox="0 0 200 140" style={{ position: 'absolute', right: '-5px', bottom: '-5px', width: '60%', height: '70%', opacity: 0.25 }}>
      <g transform="translate(90,45)">
        <circle cx="0" cy="0" r="22" fill="none" stroke="#DC2626" strokeWidth="1.5" />
        <circle cx="0" cy="0" r="10" fill="none" stroke="#DC2626" strokeWidth="1.2" />
        <rect x="-4" y="-28" width="8" height="12" rx="1.5" fill="none" stroke="#DC2626" strokeWidth="1.3" />
        <rect x="-4" y="-28" width="8" height="12" rx="1.5" fill="none" stroke="#DC2626" strokeWidth="1.3" transform="rotate(45,0,0)" />
        <rect x="-4" y="-28" width="8" height="12" rx="1.5" fill="none" stroke="#DC2626" strokeWidth="1.3" transform="rotate(90,0,0)" />
        <rect x="-4" y="-28" width="8" height="12" rx="1.5" fill="none" stroke="#DC2626" strokeWidth="1.3" transform="rotate(135,0,0)" />
        <rect x="-4" y="-28" width="8" height="12" rx="1.5" fill="none" stroke="#DC2626" strokeWidth="1.3" transform="rotate(180,0,0)" />
        <rect x="-4" y="-28" width="8" height="12" rx="1.5" fill="none" stroke="#DC2626" strokeWidth="1.3" transform="rotate(225,0,0)" />
        <rect x="-4" y="-28" width="8" height="12" rx="1.5" fill="none" stroke="#DC2626" strokeWidth="1.3" transform="rotate(270,0,0)" />
        <rect x="-4" y="-28" width="8" height="12" rx="1.5" fill="none" stroke="#DC2626" strokeWidth="1.3" transform="rotate(315,0,0)" />
      </g>
      <g transform="translate(130,75)">
        <circle cx="0" cy="0" r="14" fill="none" stroke="#DC2626" strokeWidth="1" />
        <circle cx="0" cy="0" r="6" fill="none" stroke="#DC2626" strokeWidth="0.8" />
        <rect x="-3" y="-19" width="6" height="8" rx="1" fill="none" stroke="#DC2626" strokeWidth="1" />
        <rect x="-3" y="-19" width="6" height="8" rx="1" fill="none" stroke="#DC2626" strokeWidth="1" transform="rotate(60,0,0)" />
        <rect x="-3" y="-19" width="6" height="8" rx="1" fill="none" stroke="#DC2626" strokeWidth="1" transform="rotate(120,0,0)" />
        <rect x="-3" y="-19" width="6" height="8" rx="1" fill="none" stroke="#DC2626" strokeWidth="1" transform="rotate(180,0,0)" />
        <rect x="-3" y="-19" width="6" height="8" rx="1" fill="none" stroke="#DC2626" strokeWidth="1" transform="rotate(240,0,0)" />
        <rect x="-3" y="-19" width="6" height="8" rx="1" fill="none" stroke="#DC2626" strokeWidth="1" transform="rotate(300,0,0)" />
      </g>
    </svg>
  
    <svg viewBox="0 0 120 100" style={{ position: 'absolute', left: '-8px', top: '28%', width: '40%', height: '45%', opacity: 0.18 }}>
      <circle cx="40" cy="40" r="12" fill="none" stroke="#0EA5E9" strokeWidth="1.3" />
      <line x1="40" y1="22" x2="40" y2="15" stroke="#0EA5E9" strokeWidth="1.5" />
      <line x1="40" y1="58" x2="40" y2="65" stroke="#0EA5E9" strokeWidth="1.5" />
      <line x1="22" y1="40" x2="15" y2="40" stroke="#0EA5E9" strokeWidth="1.5" />
      <line x1="58" y1="40" x2="65" y2="40" stroke="#0EA5E9" strokeWidth="1.5" />
    </svg></div>
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
    leadsActivos: 0, viajesActivos: 0, clientes: 0,
    segmentosDedicados: 0, cuentasCxc: 0, unidadesGps: 0,
    alertasHoy: 0, formatosActivos: 0, leadsPipeline: 0,
    tractosTotal: 0, cajasTotal: 0,
  })

  const fetchKpis = useCallback(async () => {
    try {
      const [
        { count: leads }, { count: viajes }, { count: clientes },
        { count: dedicados }, { count: cxc }, { count: gps },
        { count: formatosActivos }, { count: viajesRiesgo },
        { count: notifUnread }, { count: tractos }, { count: cajas },
      ] = await Promise.all([
        supabase.from('leads').select('*', { count: 'exact', head: true }).is('deleted_at', null),
        supabase.from('viajes').select('*', { count: 'exact', head: true }).in('estado', ['asignado', 'en_transito', 'en_curso', 'programado']),
        supabase.from('clientes').select('*', { count: 'exact', head: true }).is('deleted_at', null),
        supabase.from('formatos_venta').select('*', { count: 'exact', head: true }).eq('tipo_servicio', 'DEDICADO'),
        supabase.from('cxc_cartera').select('*', { count: 'exact', head: true }),
        supabase.from('gps_tracking').select('*', { count: 'exact', head: true }),
        supabase.from('formatos_venta').select('*', { count: 'exact', head: true }).eq('activo', true),
        supabase.from('viajes').select('*', { count: 'exact', head: true }).in('estado', ['en_riesgo', 'retrasado']),
        supabase.from('notificaciones').select('*', { count: 'exact', head: true }).eq('leida', false).is('deleted_at', null),
        supabase.from('tractos').select('*', { count: 'exact', head: true }).eq('activo', true),
        supabase.from('cajas').select('*', { count: 'exact', head: true }).eq('activo', true),
      ])
      const totalAlertas = (viajesRiesgo ?? 0) + (notifUnread ?? 0)
      setKpis({
        leadsActivos: leads ?? 0, viajesActivos: viajes ?? 0,
        clientes: clientes ?? 0, segmentosDedicados: dedicados ?? 0,
        cuentasCxc: cxc ?? 0, unidadesGps: gps ?? 0,
        alertasHoy: totalAlertas, formatosActivos: formatosActivos ?? 0,
        leadsPipeline: leads ?? 0, tractosTotal: tractos ?? 0,
        cajasTotal: cajas ?? 0,
      })
    } catch (err) {
      console.error('Error fetching KPIs:', err)
    }
  }, [])

  useEffect(() => {
    fetchKpis()
    const interval = setInterval(fetchKpis, 60000)
    return () => clearInterval(interval)
  }, [fetchKpis])

  // ——— 8 CARD DEFINITIONS ———————————————————————————
  const mainCards: CardConfig[] = [
    {
      id: 'oportunidades', label: 'Oportunidades',
      route: '/oportunidades/mis-leads',
      kpiValue: kpis.leadsActivos, kpiLabel: 'leads',
      statusDot: 'green', statusText: 'Pipeline activo',
      geo: <GeoOportunidades />,
    },
    {
      id: 'comercial', label: 'Comercial',
      route: '/comercial',
      kpiValue: kpis.formatosActivos.toLocaleString(), kpiLabel: 'formatos',
      statusDot: 'green', statusText: '11 submódulos',
      geo: <GeoComercial />,
    },
    {
      id: 'servicio-clientes', label: 'Servicio a Clientes',
      route: '/servicio-clientes',
      kpiValue: kpis.clientes.toLocaleString(), kpiLabel: 'clientes',
      statusDot: 'green', statusText: '3 submódulos',
      geo: <GeoServicio />,
    },
    {
      id: 'despacho', label: 'Despacho Inteligente',
      route: '/despacho-inteligente',
      kpiValue: kpis.viajesActivos, kpiLabel: 'viajes',
      statusDot: kpis.viajesActivos > 0 ? 'green' : 'gray',
      statusText: kpis.viajesActivos > 0 ? 'Operando' : 'Sin viajes',
      geo: <GeoDespacho />,
    },
    {
      id: 'comunicaciones', label: 'Comunicaciones',
      route: '/servicio/whatsapp',
      kpiValue: '3', kpiLabel: 'canales',
      statusDot: 'green', statusText: 'Activo',
      geo: <GeoComunicaciones />,
    },
    {
      id: 'cotizaciones', label: 'Cotizaciones',
      route: '/cotizador/nueva',
      kpiValue: '\u2014', kpiLabel: 'pendientes',
      statusDot: 'gray', statusText: 'Próximamente',
      geo: <GeoCotizaciones />,
    },
    {
      id: 'plantillas', label: 'Plantillas',
      route: '/plantillas',
      kpiValue: '\u2014', kpiLabel: 'plantillas',
      statusDot: 'gray', statusText: 'Próximamente',
      geo: <GeoPlantillas />,
    },
  ]

  const configCard: CardConfig = {
    id: 'config', label: 'Config',
    route: '/admin/configuracion',
    kpiValue: '\u2699\uFE0F', kpiLabel: 'admin',
    statusDot: 'gray', statusText: 'Sistema',
    geo: <GeoConfig />,
  }

  // ——— CARD STYLE ——————————————————————————————————
  const getCardStyle = (isHovered: boolean): React.CSSProperties => ({
    aspectRatio: '1 / 0.65',
    borderRadius: DASH.cardRadius,
    padding: DASH.cardPadding,
    background: DASH.cardBg,
    border: DASH.cardBorder,
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

  // ——— RENDER CARD ——————————————————————————————————
  const renderCard = (card: CardConfig) => {
    const isHovered = hoveredCard === card.id
    return (
      <div
        key={card.id}
        onClick={() => navigate(card.route)}
        onMouseEnter={() => setHoveredCard(card.id)}
        onMouseLeave={() => setHoveredCard(null)}
        style={getCardStyle(isHovered)}
      >
        {/* 3D Geometric background — moves on hover */}
        <div style={{
          ...geoStyle,
          transform: isHovered ? 'translate(4px, -4px) scale(1.05)' : 'translate(0,0) scale(1)',
        }}>
          {card.geo}
        </div>

        {/* Status dot */}
        <div style={{
          position: 'absolute', top: '14px', right: '14px',
          width: DASH.dotSize, height: DASH.dotSize, borderRadius: '50%',
          backgroundColor: DOT_COLORS[card.statusDot] || DOT_COLORS.gray,
        }} />

        {/* Module name — BIG, no icon */}
        <div style={{
          fontFamily: DASH.fontFamily,
          fontSize: DASH.titleSize,
          fontWeight: DASH.titleWeight,
          color: DASH.titleColor,
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
          color: DASH.kpiColor,
          lineHeight: 1,
          marginTop: '6px',
          position: 'relative',
          zIndex: 1,
        }}>
          {card.kpiValue}
        </div>

        {/* Subtitle */}
        <div style={{
          fontFamily: DASH.fontBody,
          fontSize: DASH.subSize,
          fontWeight: DASH.subWeight,
          color: DASH.subColor,
          marginTop: '3px',
          position: 'relative',
          zIndex: 1,
        }}>
          {card.statusText}
        </div>
      </div>
    )
  }

  // ——— RENDER ————————————————————————————————————————
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
      {/* CSS for hover geo animation */}
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=Montserrat:wght@500;600;700;800&display=swap');
      `}</style>

      {/* Zona 1 — AppHeader */}
      <AppHeader
        onLogout={handleLogout}
        userName={formatName(user?.email)}
        userRole={user?.rol || 'admin'}
        userEmail={user?.email}
      />

      {/* Zona 2 — Métricas */}
      <div style={{
        padding: DASH.metricsPadding,
        background: DASH.metricsBg,
        borderBottom: DASH.metricsBorder,
        display: 'flex',
        justifyContent: 'space-around',
        alignItems: 'center',
      }}>
        {[
          { label: 'Viajes Activos', value: kpis.viajesActivos },
          { label: 'Unidades GPS', value: kpis.unidadesGps },
          { label: 'Alertas Hoy', value: kpis.alertasHoy },
          { label: 'Formatos Activos', value: kpis.formatosActivos.toLocaleString() },
          { label: 'Leads Pipeline', value: kpis.leadsPipeline },
        ].map((m) => (
          <div key={m.label} style={{ textAlign: 'center' }}>
            <div style={{
              fontFamily: DASH.fontFamily, fontSize: '22px',
              fontWeight: 700, color: '#0F172A', lineHeight: 1.2,
            }}>{m.value}</div>
            <div style={{
              fontFamily: DASH.fontBody, fontSize: '10px',
              fontWeight: 500, color: '#64748B',
              letterSpacing: '0.4px', marginTop: '3px',
              textTransform: 'uppercase',
            }}>{m.label}</div>
          </div>
        ))}
      </div>

      {/* Zona 3 — Grid de Cards */}
      <div style={{
        flex: '0 0 auto',
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

        {/* Fila 2: Config alineado a la derecha */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(7, 1fr)',
          gap: DASH.gridGap,
        }}>
          <div style={{ gridColumn: '7 / 8' }}>
            {renderCard(configCard)}
          </div>
        </div>
      </div>
    </div>
  )
}
