// ╔══════════════════════════════════════════════════════════════════════════════╗
// ║ 🛡️  BLINDAJE DASHBOARD V27f — ARCHIVO PROTEGIDO                           ║
// ║                                                                            ║
// ║  ESTILO: M1 REFINADO + 3D GEOMETRIC PREMIUM — Aprobado JJ 3/Abr/2026     ║
// ║    • 9 cards (7+2): white + dual SVG layers (geometric + colorful)        ║
// ║    • NO icons — solo nombre grande + figuras geométricas flotantes        ║
// ║    • Hover: movimiento sutil de geometría en 2 capas                       ║
// ║    • Fila 1: 7 cards | Fila 2: Comunicaciones + Config a la derecha       ║
// ║    • Sin barra KPIs — eliminada por JJ 3/Abr/2026                         ║
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
  geo2?: React.ReactNode
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
  gridGap: '14px',
  gridPadding: '16px 28px',
  titleSize: '20px',
  titleWeight: 800,
  titleColor: '#1E293B',
  kpiSize: '28px',
  kpiWeight: 600,
  kpiColor: '#0F172A',
  subSize: '9px',
  subWeight: 400,
  subColor: '#94A3B8',
  dotSize: '6px',
} as const

const DOT_COLORS: Record<string, string> = {
  green: '#10B981', yellow: '#F59E0B', red: '#EF4444', gray: '#CBD5E1',
}

// ============================================================================
// 3D GEOMETRIC SVG PATTERNS — blue + orange mixed strokes
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

// Oportunidades — ascending chevrons (blue + orange)
const GeoOportunidades = () => (
  <div style={geoStyle} className="geo-inner">
    <svg viewBox="0 0 200 140" style={{ position: 'absolute', right: '-10px', bottom: '-10px', width: '65%', height: '75%', opacity: 0.15 }}>
      <polygon points="100,20 140,60 120,60 120,100 80,100 80,60 60,60" fill="none" stroke="#3B82F6" strokeWidth="1.5" transform="translate(20,0)" />
      <polygon points="100,35 130,65 115,65 115,95 85,95 85,65 70,65" fill="none" stroke="#F59E0B" strokeWidth="1" transform="translate(40,20)" />
      <polygon points="100,50 125,75 113,75 113,100 87,100 87,75 75,75" fill="none" stroke="#3B82F6" strokeWidth="0.8" transform="translate(60,10)" />
    </svg>
  </div>
)

// Comercial — overlapping hexagons (blue + orange)
const GeoComercial = () => (
  <div style={geoStyle} className="geo-inner">
    <svg viewBox="0 0 200 140" style={{ position: 'absolute', right: '-5px', bottom: '-5px', width: '70%', height: '80%', opacity: 0.15 }}>
      <polygon points="50,0 93.3,25 93.3,75 50,100 6.7,75 6.7,25" fill="none" stroke="#3B82F6" strokeWidth="1.5" transform="translate(60,15) scale(0.7)" />
      <polygon points="50,0 93.3,25 93.3,75 50,100 6.7,75 6.7,25" fill="none" stroke="#F59E0B" strokeWidth="1.2" transform="translate(90,35) scale(0.6)" />
      <polygon points="50,0 93.3,25 93.3,75 50,100 6.7,75 6.7,25" fill="none" stroke="#3B82F6" strokeWidth="1" transform="translate(40,50) scale(0.5)" />
      <polygon points="50,0 93.3,25 93.3,75 50,100 6.7,75 6.7,25" fill="none" stroke="#F59E0B" strokeWidth="0.8" transform="translate(110,10) scale(0.45)" />
    </svg>
  </div>
)

// Servicio a Clientes — concentric arcs (blue + orange)
const GeoServicio = () => (
  <div style={geoStyle} className="geo-inner">
    <svg viewBox="0 0 200 140" style={{ position: 'absolute', right: '-10px', bottom: '-15px', width: '65%', height: '75%', opacity: 0.15 }}>
      <circle cx="130" cy="90" r="60" fill="none" stroke="#3B82F6" strokeWidth="1.5" />
      <circle cx="130" cy="90" r="45" fill="none" stroke="#F59E0B" strokeWidth="1.2" />
      <circle cx="130" cy="90" r="30" fill="none" stroke="#3B82F6" strokeWidth="1" />
      <circle cx="130" cy="90" r="15" fill="none" stroke="#F59E0B" strokeWidth="0.8" />
    </svg>
  </div>
)

// Despacho Inteligente — isometric cubes (blue + orange)
const GeoDespacho = () => (
  <div style={geoStyle} className="geo-inner">
    <svg viewBox="0 0 200 140" style={{ position: 'absolute', right: '-5px', bottom: '-5px', width: '70%', height: '80%', opacity: 0.15 }}>
      <g transform="translate(80,30)">
        <polygon points="30,0 60,17 30,34 0,17" fill="none" stroke="#3B82F6" strokeWidth="1.2" />
        <polygon points="0,17 30,34 30,64 0,47" fill="none" stroke="#F59E0B" strokeWidth="1.2" />
        <polygon points="60,17 30,34 30,64 60,47" fill="none" stroke="#3B82F6" strokeWidth="1.2" />
      </g>
      <g transform="translate(110,50)">
        <polygon points="25,0 50,14 25,28 0,14" fill="none" stroke="#F59E0B" strokeWidth="1" />
        <polygon points="0,14 25,28 25,53 0,39" fill="none" stroke="#3B82F6" strokeWidth="1" />
        <polygon points="50,14 25,28 25,53 50,39" fill="none" stroke="#F59E0B" strokeWidth="1" />
      </g>
      <g transform="translate(60,60)">
        <polygon points="20,0 40,11 20,22 0,11" fill="none" stroke="#3B82F6" strokeWidth="0.8" />
        <polygon points="0,11 20,22 20,42 0,31" fill="none" stroke="#F59E0B" strokeWidth="0.8" />
        <polygon points="40,11 20,22 20,42 40,31" fill="none" stroke="#3B82F6" strokeWidth="0.8" />
      </g>
    </svg>
  </div>
)

// Ventas — rising bar chart (blue + orange) — NEW
const GeoVentas = () => (
  <div style={geoStyle} className="geo-inner">
    <svg viewBox="0 0 200 140" style={{ position: 'absolute', right: '-5px', bottom: '-5px', width: '65%', height: '75%', opacity: 0.15 }}>
      <rect x="60" y="80" width="18" height="40" rx="2" fill="none" stroke="#3B82F6" strokeWidth="1.5" />
      <rect x="85" y="60" width="18" height="60" rx="2" fill="none" stroke="#F59E0B" strokeWidth="1.3" />
      <rect x="110" y="40" width="18" height="80" rx="2" fill="none" stroke="#3B82F6" strokeWidth="1.1" />
      <rect x="135" y="20" width="18" height="100" rx="2" fill="none" stroke="#F59E0B" strokeWidth="1" />
      <path d="M68 78 L93 58 L118 38 L143 18" fill="none" stroke="#3B82F6" strokeWidth="1" strokeDasharray="4 3" />
    </svg>
  </div>
)

// Comunicaciones — radiating waves (blue + orange)
const GeoComunicaciones = () => (
  <div style={geoStyle} className="geo-inner">
    <svg viewBox="0 0 200 140" style={{ position: 'absolute', right: '-10px', bottom: '-10px', width: '65%', height: '75%', opacity: 0.15 }}>
      <path d="M140,100 Q140,60 170,40" fill="none" stroke="#3B82F6" strokeWidth="1.5" />
      <path d="M130,100 Q130,55 165,30" fill="none" stroke="#F59E0B" strokeWidth="1.2" />
      <path d="M120,100 Q120,50 160,20" fill="none" stroke="#3B82F6" strokeWidth="1" />
      <path d="M110,100 Q110,50 155,15" fill="none" stroke="#F59E0B" strokeWidth="0.8" />
      <circle cx="145" cy="105" r="4" fill="none" stroke="#3B82F6" strokeWidth="1.2" />
    </svg>
  </div>
)

// Cotizaciones — diamond cluster (blue + orange)
const GeoCotizaciones = () => (
  <div style={geoStyle} className="geo-inner">
    <svg viewBox="0 0 200 140" style={{ position: 'absolute', right: '-5px', bottom: '-5px', width: '65%', height: '80%', opacity: 0.15 }}>
      <rect x="90" y="30" width="40" height="40" rx="2" fill="none" stroke="#3B82F6" strokeWidth="1.5" transform="rotate(45,110,50)" />
      <rect x="110" y="50" width="30" height="30" rx="2" fill="none" stroke="#F59E0B" strokeWidth="1.2" transform="rotate(45,125,65)" />
      <rect x="75" y="55" width="25" height="25" rx="2" fill="none" stroke="#3B82F6" strokeWidth="1" transform="rotate(45,87.5,67.5)" />
      <rect x="105" y="75" width="20" height="20" rx="2" fill="none" stroke="#F59E0B" strokeWidth="0.8" transform="rotate(45,115,85)" />
    </svg>
  </div>
)

// Plantillas — layered offset rectangles (blue + orange)
const GeoPlantillas = () => (
  <div style={geoStyle} className="geo-inner">
    <svg viewBox="0 0 200 140" style={{ position: 'absolute', right: '-5px', bottom: '-10px', width: '65%', height: '75%', opacity: 0.15 }}>
      <rect x="70" y="20" width="60" height="80" rx="4" fill="none" stroke="#3B82F6" strokeWidth="1.5" />
      <rect x="82" y="30" width="60" height="80" rx="4" fill="none" stroke="#F59E0B" strokeWidth="1.2" />
      <rect x="94" y="40" width="60" height="80" rx="4" fill="none" stroke="#3B82F6" strokeWidth="1" />
    </svg>
  </div>
)

// Config — interlocking gear polygon (blue + orange)
const GeoConfig = () => (
  <div style={geoStyle} className="geo-inner">
    <svg viewBox="0 0 200 140" style={{ position: 'absolute', right: '-5px', bottom: '-5px', width: '60%', height: '70%', opacity: 0.15 }}>
      <polygon points="100,15 108,35 130,35 113,48 119,68 100,56 81,68 87,48 70,35 92,35" fill="none" stroke="#3B82F6" strokeWidth="1.5" transform="translate(20,10)" />
      <polygon points="100,25 106,38 122,38 109,47 114,62 100,53 86,62 91,47 78,38 94,38" fill="none" stroke="#F59E0B" strokeWidth="1" transform="translate(40,30) scale(0.7)" />
    </svg>
  </div>
)

// ============================================================================
// COLORFUL MODULE-SPECIFIC SVGs (Propuesta 12 — Logística Colorida)
// Positioned bottom-left — 20% bigger + more color saturation
// ============================================================================

const colorStyle: React.CSSProperties = {
  position: 'absolute', bottom: '-8px', left: '-8px',
  width: '60%', height: '66%', opacity: 0.30,
}

const ColorOportunidades = () => (
  <div style={geoStyle} className="color-inner">
    <svg viewBox="0 0 54 54" style={colorStyle} xmlns="http://www.w3.org/2000/svg">
      <rect x="6" y="32" width="10" height="14" rx="2" fill="#3B82F6" opacity=".35"/>
      <rect x="18" y="24" width="10" height="22" rx="2" fill="#8B5CF6" opacity=".35"/>
      <rect x="30" y="16" width="10" height="30" rx="2" fill="#10B981" opacity=".35"/>
      <rect x="42" y="8" width="8" height="38" rx="2" fill="#F59E0B" opacity=".35"/>
      <path d="M11 30L23 22L35 14L46 6" stroke="#1E293B" strokeWidth="1.5" strokeLinecap="round" opacity=".4"/>
    </svg>
  </div>
)

const ColorComercial = () => (
  <div style={geoStyle} className="color-inner">
    <svg viewBox="0 0 54 54" style={colorStyle} xmlns="http://www.w3.org/2000/svg">
      <circle cx="18" cy="16" r="7" fill="#8B5CF6" opacity=".25"/>
      <circle cx="36" cy="16" r="7" fill="#3B82F6" opacity=".25"/>
      <path d="M8 40C8 32 16 28 27 28C38 28 46 32 46 40" fill="#10B981" opacity=".15"/>
      <path d="M20 22L27 18L34 22" stroke="#F59E0B" strokeWidth="2" strokeLinecap="round" opacity=".45"/>
    </svg>
  </div>
)

const ColorServicio = () => (
  <div style={geoStyle} className="color-inner">
    <svg viewBox="0 0 54 54" style={colorStyle} xmlns="http://www.w3.org/2000/svg">
      <path d="M14 28V18C14 11 20 6 27 6C34 6 40 11 40 18V28" stroke="#8B5CF6" strokeWidth="2" fill="none" opacity=".45"/>
      <rect x="8" y="28" width="12" height="14" rx="4" fill="#3B82F6" opacity=".30"/>
      <rect x="34" y="28" width="12" height="14" rx="4" fill="#10B981" opacity=".30"/>
      <rect x="22" y="44" width="10" height="5" rx="2.5" fill="#F59E0B" opacity=".35"/>
    </svg>
  </div>
)

const ColorDespacho = () => (
  <div style={geoStyle} className="color-inner">
    <svg viewBox="0 0 54 54" style={colorStyle} xmlns="http://www.w3.org/2000/svg">
      <rect x="2" y="16" width="30" height="20" rx="3" fill="#3B82F6" opacity=".20"/>
      <path d="M32 22H44L50 30V36H32" fill="#10B981" opacity=".25"/>
      <circle cx="12" cy="38" r="5" fill="#F59E0B" opacity=".35"/>
      <circle cx="42" cy="38" r="5" fill="#F59E0B" opacity=".35"/>
      <rect x="6" y="20" width="22" height="3" rx="1.5" fill="#8B5CF6" opacity=".25"/>
    </svg>
  </div>
)

// Ventas — money + trend (NEW)
const ColorVentas = () => (
  <div style={geoStyle} className="color-inner">
    <svg viewBox="0 0 54 54" style={colorStyle} xmlns="http://www.w3.org/2000/svg">
      <circle cx="20" cy="30" r="14" fill="#10B981" opacity=".15"/>
      <text x="20" y="35" textAnchor="middle" fontFamily="Montserrat" fontWeight="700" fontSize="14" fill="#10B981" opacity=".5">$</text>
      <path d="M32 40L38 28L44 32L50 18" stroke="#F59E0B" strokeWidth="2" strokeLinecap="round" fill="none" opacity=".4"/>
      <circle cx="50" cy="18" r="2.5" fill="#F59E0B" opacity=".4"/>
      <rect x="6" y="44" width="42" height="3" rx="1.5" fill="#3B82F6" opacity=".2"/>
    </svg>
  </div>
)

const ColorComunicaciones = () => (
  <div style={geoStyle} className="color-inner">
    <svg viewBox="0 0 54 54" style={colorStyle} xmlns="http://www.w3.org/2000/svg">
      <rect x="4" y="6" width="28" height="20" rx="6" fill="#EC4899" opacity=".18"/>
      <rect x="22" y="24" width="28" height="16" rx="6" fill="#3B82F6" opacity=".22"/>
      <circle cx="14" cy="15" r="2.5" fill="#F59E0B" opacity=".45"/>
      <circle cx="20" cy="15" r="2.5" fill="#10B981" opacity=".45"/>
      <circle cx="26" cy="15" r="2.5" fill="#8B5CF6" opacity=".45"/>
    </svg>
  </div>
)

const ColorCotizaciones = () => (
  <div style={geoStyle} className="color-inner">
    <svg viewBox="0 0 54 54" style={colorStyle} xmlns="http://www.w3.org/2000/svg">
      <rect x="6" y="4" width="28" height="36" rx="4" fill="#3B82F6" opacity=".12"/>
      <rect x="12" y="12" width="16" height="3" rx="1.5" fill="#8B5CF6" opacity=".30"/>
      <rect x="12" y="18" width="12" height="3" rx="1.5" fill="#10B981" opacity=".30"/>
      <rect x="12" y="24" width="8" height="3" rx="1.5" fill="#F59E0B" opacity=".30"/>
      <circle cx="42" cy="40" r="10" fill="#10B981" opacity=".18"/>
      <text x="42" y="44" textAnchor="middle" fontFamily="Montserrat" fontWeight="700" fontSize="12" fill="#10B981" opacity=".55">$</text>
    </svg>
  </div>
)

const ColorPlantillas = () => (
  <div style={geoStyle} className="color-inner">
    <svg viewBox="0 0 54 54" style={colorStyle} xmlns="http://www.w3.org/2000/svg">
      <rect x="18" y="2" width="20" height="26" rx="3" fill="#3B82F6" opacity=".15"/>
      <rect x="14" y="8" width="20" height="26" rx="3" fill="#8B5CF6" opacity=".18"/>
      <rect x="10" y="14" width="20" height="26" rx="3" fill="#F97316" opacity=".22"/>
      <rect x="6" y="20" width="20" height="26" rx="3" fill="#10B981" opacity=".15"/>
    </svg>
  </div>
)

const ColorConfig = () => (
  <div style={geoStyle} className="color-inner">
    <svg viewBox="0 0 54 54" style={colorStyle} xmlns="http://www.w3.org/2000/svg">
      <circle cx="27" cy="27" r="16" fill="#6366F1" opacity=".08"/>
      <circle cx="27" cy="27" r="10" fill="#3B82F6" opacity=".12"/>
      <circle cx="27" cy="27" r="5" fill="#10B981" opacity=".25"/>
      <rect x="25" y="4" width="4" height="8" rx="2" fill="#F59E0B" opacity=".30"/>
      <rect x="25" y="42" width="4" height="8" rx="2" fill="#F59E0B" opacity=".30"/>
      <rect x="4" y="25" width="8" height="4" rx="2" fill="#EC4899" opacity=".30"/>
      <rect x="42" y="25" width="8" height="4" rx="2" fill="#EC4899" opacity=".30"/>
    </svg>
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

  // KPI state — kept for card values, bar removed
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

  // ——— 9 CARD DEFINITIONS ———————————————————————————
  // Fila 1: Oportunidades, Comercial, Servicio, Despacho, Ventas, Cotizaciones, Plantillas
  // Fila 2: Comunicaciones (col 6) + Config (col 7)
  const mainCards: CardConfig[] = [
    {
      id: 'oportunidades', label: 'Oportunidades',
      route: '/ventas/mis-leads',
      kpiValue: kpis.leadsActivos, kpiLabel: 'leads',
      statusDot: 'green', statusText: 'Pipeline activo',
      geo: <GeoOportunidades />,
      geo2: <ColorOportunidades />,
    },
    {
      id: 'comercial', label: 'Comercial',
      route: '/ventas/dashboard',
      kpiValue: kpis.formatosActivos.toLocaleString(), kpiLabel: 'formatos',
      statusDot: 'green', statusText: '11 submódulos',
      geo: <GeoComercial />,
      geo2: <ColorComercial />,
    },
    {
      id: 'servicio-clientes', label: 'Servicio a Clientes',
      route: '/servicio/dashboard',
      kpiValue: kpis.clientes.toLocaleString(), kpiLabel: 'clientes',
      statusDot: 'green', statusText: '3 submódulos',
      geo: <GeoServicio />,
      geo2: <ColorServicio />,
    },
    {
      id: 'despacho', label: 'Despacho Inteligente',
      route: '/operaciones/torre-control',
      kpiValue: kpis.viajesActivos, kpiLabel: 'viajes',
      statusDot: kpis.viajesActivos > 0 ? 'green' : 'gray',
      statusText: kpis.viajesActivos > 0 ? 'Operando' : 'Sin viajes',
      geo: <GeoDespacho />,
      geo2: <ColorDespacho />,
    },
    {
      id: 'ventas', label: 'Ventas',
      route: '/ventas/dashboard',
      kpiValue: kpis.formatosActivos.toLocaleString(), kpiLabel: 'formatos',
      statusDot: 'green', statusText: 'Dashboard',
      geo: <GeoVentas />,
      geo2: <ColorVentas />,
    },
    {
      id: 'cotizaciones', label: 'Cotizaciones',
      route: '/cotizador/nueva',
      kpiValue: '\u2014', kpiLabel: 'pendientes',
      statusDot: 'gray', statusText: 'Próximamente',
      geo: <GeoCotizaciones />,
      geo2: <ColorCotizaciones />,
    },
    {
      id: 'plantillas', label: 'Plantillas',
      route: '/documentos',
      kpiValue: '\u2014', kpiLabel: 'plantillas',
      statusDot: 'gray', statusText: 'Próximamente',
      geo: <GeoPlantillas />,
      geo2: <ColorPlantillas />,
    },
  ]

  const row2Cards: CardConfig[] = [
    {
      id: 'comunicaciones', label: 'Comunicaciones',
      route: '/comunicaciones/correos',
      kpiValue: '3', kpiLabel: 'canales',
      statusDot: 'green', statusText: 'Activo',
      geo: <GeoComunicaciones />,
      geo2: <ColorComunicaciones />,
    },
    {
      id: 'config', label: 'Config',
      route: '/admin/configuracion',
      kpiValue: '\u2699\uFE0F', kpiLabel: 'admin',
      statusDot: 'gray', statusText: 'Sistema',
      geo: <GeoConfig />,
      geo2: <ColorConfig />,
    },
  ]

  // ——— CARD STYLE ——————————————————————————————————
  const getCardStyle = (isHovered: boolean): React.CSSProperties => ({
    aspectRatio: '1 / 0.75',
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

        {/* Colorful module SVG — moves opposite direction on hover */}
        {card.geo2 && (
          <div style={{
            ...geoStyle,
            transform: isHovered ? 'translate(-3px, 3px) scale(1.03)' : 'translate(0,0) scale(1)',
          }}>
            {card.geo2}
          </div>
        )}

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

      {/* Zona 2 — Grid de Cards (sin barra KPIs) */}
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
