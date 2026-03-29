// ╔══════════════════════════════════════════════════════════════════════════════╗
// ║  🛡️  BLINDAJE DASHBOARD V27f — ARCHIVO PROTEGIDO                          ║
// ║                                                                            ║
// ║  REGLA: Este archivo NO se puede modificar sin autorización EXPLÍCITA      ║
// ║  de JJ (Juan Viveros). Cualquier sesión de IA, desarrollador o proceso     ║
// ║  automatizado que intente cambiar este archivo DEBE:                        ║
// ║                                                                            ║
// ║  1. Leer página 34 de Notion (ID: 32a9d35958f1812c9276f833d0018b1e)       ║
// ║  2. Verificar sección 10 — "Blindaje" con las reglas exactas              ║
// ║  3. Obtener confirmación ESCRITA de JJ antes de cualquier cambio          ║
// ║  4. Si no hay confirmación → NO TOCAR                                     ║
// ║                                                                            ║
// ║  ESTILO: V27f BLINDADO                                                     ║
// ║  • 14 tarjetas en grid 7×2 (alargadas, NO cuadradas)                     ║
// ║  • Background: #2a2a36 | Font: Montserrat (NUNCA Orbitron)                ║
// ║  • Cards: gradient 180deg, border-radius 20px, sombras 3 capas           ║
// ║  • SIN sidebar — navegación directa al hacer click en tarjeta             ║
// ║  • SIN submódulos expandibles — cada tarjeta = 1 ruta                     ║
// ║                                                                            ║
// ║  ÚLTIMA RESTAURACIÓN: 28/Mar/2026 — Sesión 45                            ║
// ║  MOTIVO: JJ rechazó V28 (9 módulos cuadrados con sidebar)                 ║
// ╚══════════════════════════════════════════════════════════════════════════════╝

import React, { useState, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Swords,
  Briefcase,
  Users,
  HeadphonesIcon,
  Radio,
  MapPin,
  Truck,
  Container,
  DollarSign,
  BarChart3,
  TrendingUp,
  MessageSquare,
  FileBarChart,
  Settings,
} from 'lucide-react'
import { supabase } from '../lib/supabase'
import AppHeader from '../components/layout/AppHeader'
import { useAuthContext } from '../hooks/AuthContext'

// ============================================================================
// TYPES
// ============================================================================
interface CardConfig {
  id: string
  label: string
  icon: React.ReactNode
  route: string
  priority: 'HIGH' | 'MID' | 'LOW'
  kpiValue: number | string
  kpiLabel: string
  statusDot: 'green' | 'yellow' | 'red' | 'gray'
  statusText: string
}

// ============================================================================
// DASHBOARD VISUAL CONSTANTS (V27f BLINDADO — página 34 Notion)
// ============================================================================
const DASH = {
  bg: '#2a2a36',
  fontFamily: "'Montserrat', sans-serif",

  // Card gradients
  cardGradient:
    'linear-gradient(180deg, rgba(54,54,67,1) 0%, rgba(42,42,54,1) 50%, rgba(33,33,43,1) 100%)',
  cardGradientWar:
    'linear-gradient(180deg, rgba(56,50,56,1) 0%, rgba(42,38,48,1) 50%, rgba(31,30,40,1) 100%)',

  // Card styles
  cardRadius: '20px',
  cardPadding: '18px 12px 14px',
  cardGap: '10px',
  gridPadding: '4px 20px',

  // Borders biselados
  borderTop: 'rgba(155,168,195,0.18)',
  borderTopHigh: 'rgba(155,168,195,0.28)',
  borderBottom: 'rgba(0,0,0,0.42)',
  borderRight: 'rgba(0,0,0,0.32)',

  // Shadows 3 capas
  cardShadow:
    '0 10px 24px rgba(0,0,0,0.28), 0 2px 6px rgba(0,0,0,0.28)',
  cardShadowInset:
    'inset 0 1px 0 rgba(200,210,225,0.06), inset 0 -1px 0 rgba(0,0,0,0.14)',
  cardHoverShadow:
    '0 14px 32px rgba(0,0,0,0.35), 0 4px 10px rgba(0,0,0,0.30)',

  // KPI
  kpiFontSize: '26px',
  kpiFontWeight: 800,
  kpiColorHigh: 'rgba(255,255,255,0.72)',
  kpiColorMid: 'rgba(255,255,255,0.58)',
  kpiColorHover: 'rgba(255,255,255,0.92)',

  // Title
  titleFontSize: '13px',
  titleFontWeight: 600,
  titleLetterSpacing: '0.3px',

  // Subtitle
  subFontSize: '10.5px',
  subFontWeight: 500,
  subColor: 'rgba(255,255,255,0.28)',
  subColorHover: 'rgba(255,255,255,0.48)',

  // Icons
  iconSize: 42,
  iconSizeBoosted: 46,
  iconStroke: 2.1,
  iconStrokeBoosted: 2.2,

  // Metrics bar
  metricsMarginTop: '10px',
  metricsMarginBottom: '8px',
  metricsPadding: '12px 28px',
  metricsBg: 'rgba(255,255,255,0.025)',
  metricsBorder: '1px solid rgba(255,255,255,0.05)',

  // Status dots
  dotSize: '3px',

  // Accent line
  accentGradient:
    'linear-gradient(90deg, rgba(194,120,3,0.3) 0%, rgba(59,108,231,0.2) 50%, transparent 100%)',
  accentGradientHigh:
    'linear-gradient(90deg, rgba(194,120,3,0.5) 0%, rgba(59,108,231,0.35) 50%, transparent 100%)',
} as const

// ============================================================================
// STATUS DOT COLORS
// ============================================================================
const DOT_COLORS: Record<string, string> = {
  green: '#0D9668',
  yellow: '#B8860B',
  red: '#C53030',
  gray: '#6B6B7A',
}

// ============================================================================
// COMPONENT
// ============================================================================
export default function HomeDashboard() {
  const navigate = useNavigate()
  const { user, logout } = useAuthContext()
  const [hoveredCard, setHoveredCard] = useState<string | null>(null)

  // Format user name from email
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

  // KPI state — datos reales de Supabase
  const [kpis, setKpis] = useState({
    leadsActivos: 0,
    viajesActivos: 0,
    clientes: 0,
    segmentosDedicados: 0,
    cuentasCxc: 0,
    unidadesGps: 0,
    alertasHoy: 0,
    facturadoHoy: '$0',
    leadsPipeline: 0,
    tractosTotal: 0,
    cajasTotal: 0,
  })

  // ——— FETCH KPIs REALES ———————————————————————————
  const fetchKpis = useCallback(async () => {
    try {
      const [
        { count: leads },
        { count: viajes },
        { count: clientes },
        { count: dedicados },
        { count: cxc },
        { count: gps },
        { count: formatosActivos },
        { count: viajesRiesgo },
        { count: notifUnread },
        { count: tractos },
        { count: cajas },
      ] = await Promise.all([
        supabase
          .from('leads')
          .select('*', { count: 'exact', head: true })
          .is('deleted_at', null),
        supabase
          .from('viajes')
          .select('*', { count: 'exact', head: true })
          .in('estado', ['asignado', 'en_transito', 'en_curso', 'programado']),
        supabase
          .from('clientes')
          .select('*', { count: 'exact', head: true })
          .is('deleted_at', null),
        supabase
          .from('formatos_venta')
          .select('*', { count: 'exact', head: true })
          .eq('tipo_servicio', 'DEDICADO'),
        supabase
          .from('cxc_cartera')
          .select('*', { count: 'exact', head: true }),
        supabase
          .from('gps_tracking')
          .select('*', { count: 'exact', head: true }),
        supabase
          .from('formatos_venta')
          .select('*', { count: 'exact', head: true })
          .eq('activo', true),
        supabase
          .from('viajes')
          .select('*', { count: 'exact', head: true })
          .in('estado', ['en_riesgo', 'retrasado']),
        supabase
          .from('notificaciones')
          .select('*', { count: 'exact', head: true })
          .eq('leida', false)
          .is('deleted_at', null),
        supabase
          .from('tractos')
          .select('*', { count: 'exact', head: true })
          .is('deleted_at', null),
        supabase
          .from('cajas')
          .select('*', { count: 'exact', head: true })
          .is('deleted_at', null),
      ])

      const totalAlertas = (viajesRiesgo ?? 0) + (notifUnread ?? 0)

      setKpis({
        leadsActivos: leads ?? 0,
        viajesActivos: viajes ?? 0,
        clientes: clientes ?? 0,
        segmentosDedicados: dedicados ?? 0,
        cuentasCxc: cxc ?? 0,
        unidadesGps: gps ?? 0,
        alertasHoy: totalAlertas,
        facturadoHoy: (formatosActivos ?? 0).toLocaleString(),
        leadsPipeline: leads ?? 0,
        tractosTotal: tractos ?? 0,
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

  // ——— 14 CARD DEFINITIONS (V27f — grid 7×2) ——————————
  const cards: CardConfig[] = [
    // ═══ FILA 1: War Room, Ventas, Clientes, Servicio, Torre Control, Mapa GPS, Flota ═══
    {
      id: 'war-room',
      label: 'War Room',
      icon: <Swords size={DASH.iconSizeBoosted} strokeWidth={DASH.iconStrokeBoosted} />,
      route: '/war-room',
      priority: 'HIGH',
      kpiValue: kpis.alertasHoy,
      kpiLabel: 'alertas',
      statusDot: kpis.alertasHoy > 0 ? 'red' : 'green',
      statusText: kpis.alertasHoy > 0 ? 'Alertas activas' : 'Sin alertas',
    },
    {
      id: 'ventas',
      label: 'Ventas',
      icon: <Briefcase size={DASH.iconSizeBoosted} strokeWidth={DASH.iconStrokeBoosted} />,
      route: '/ventas/mis-leads',
      priority: 'HIGH',
      kpiValue: kpis.leadsActivos,
      kpiLabel: 'leads activos',
      statusDot: 'green',
      statusText: 'Pipeline activo',
    },
    {
      id: 'clientes',
      label: 'Clientes',
      icon: <Users size={DASH.iconSizeBoosted} strokeWidth={DASH.iconStrokeBoosted} />,
      route: '/clientes',
      priority: 'HIGH',
      kpiValue: kpis.clientes.toLocaleString(),
      kpiLabel: 'clientes',
      statusDot: 'green',
      statusText: 'Base activa',
    },
    {
      id: 'servicio',
      label: 'Servicio',
      icon: <HeadphonesIcon size={DASH.iconSize} strokeWidth={DASH.iconStroke} />,
      route: '/servicio/dashboard',
      priority: 'HIGH',
      kpiValue: kpis.clientes.toLocaleString(),
      kpiLabel: 'clientes',
      statusDot: 'green',
      statusText: 'Operando',
    },
    {
      id: 'torre-control',
      label: 'Torre Control',
      icon: <Radio size={DASH.iconSizeBoosted} strokeWidth={DASH.iconStrokeBoosted} />,
      route: '/operaciones/torre-control',
      priority: 'HIGH',
      kpiValue: kpis.viajesActivos,
      kpiLabel: 'viajes activos',
      statusDot: kpis.viajesActivos > 0 ? 'green' : 'gray',
      statusText: kpis.viajesActivos > 0 ? 'En operación' : 'Sin viajes',
    },
    {
      id: 'mapa-gps',
      label: 'Mapa GPS',
      icon: <MapPin size={DASH.iconSizeBoosted} strokeWidth={DASH.iconStrokeBoosted} />,
      route: '/operaciones/mapa',
      priority: 'HIGH',
      kpiValue: kpis.unidadesGps,
      kpiLabel: 'posiciones',
      statusDot: kpis.unidadesGps > 0 ? 'green' : 'gray',
      statusText: kpis.unidadesGps > 0 ? 'Tracking activo' : 'Sin datos',
    },
    {
      id: 'flota',
      label: 'Flota',
      icon: <Truck size={DASH.iconSize} strokeWidth={DASH.iconStroke} />,
      route: '/operaciones/disponibilidad',
      priority: 'MID',
      kpiValue: kpis.tractosTotal + kpis.cajasTotal,
      kpiLabel: 'unidades',
      statusDot: 'green',
      statusText: 'Inventario',
    },
    // ═══ FILA 2: Dedicados, Cobranza, Indicadores, Rentabilidad, Comunicaciones, Reportes, Config ═══
    {
      id: 'dedicados',
      label: 'Dedicados',
      icon: <Container size={DASH.iconSizeBoosted} strokeWidth={DASH.iconStrokeBoosted} />,
      route: '/operaciones/dedicados',
      priority: 'MID',
      kpiValue: kpis.segmentosDedicados,
      kpiLabel: 'segmentos',
      statusDot: 'green',
      statusText: 'Activo',
    },
    {
      id: 'cobranza',
      label: 'Cobranza',
      icon: <DollarSign size={DASH.iconSizeBoosted} strokeWidth={DASH.iconStrokeBoosted} />,
      route: '/cxc/cartera',
      priority: 'MID',
      kpiValue: kpis.cuentasCxc,
      kpiLabel: 'cuentas CxC',
      statusDot: kpis.cuentasCxc > 15 ? 'yellow' : 'green',
      statusText: kpis.cuentasCxc > 15 ? 'Revisión' : 'Al corriente',
    },
    {
      id: 'indicadores',
      label: 'Indicadores',
      icon: <BarChart3 size={DASH.iconSize} strokeWidth={DASH.iconStroke} />,
      route: '/inteligencia/analisis-8020',
      priority: 'MID',
      kpiValue: '80/20',
      kpiLabel: 'análisis',
      statusDot: 'green',
      statusText: 'Disponible',
    },
    {
      id: 'rentabilidad',
      label: 'Rentabilidad',
      icon: <TrendingUp size={DASH.iconSize} strokeWidth={DASH.iconStroke} />,
      route: '/operaciones/rentabilidad',
      priority: 'MID',
      kpiValue: kpis.facturadoHoy,
      kpiLabel: 'formatos activos',
      statusDot: 'green',
      statusText: 'Calculando',
    },
    {
      id: 'comunicaciones',
      label: 'Comunicaciones',
      icon: <MessageSquare size={DASH.iconSizeBoosted} strokeWidth={DASH.iconStrokeBoosted} />,
      route: '/servicio/whatsapp',
      priority: 'MID',
      kpiValue: '3',
      kpiLabel: 'canales',
      statusDot: 'green',
      statusText: 'Activo',
    },
    {
      id: 'reportes',
      label: 'Reportes',
      icon: <FileBarChart size={DASH.iconSize} strokeWidth={DASH.iconStroke} />,
      route: '/servicio/metricas',
      priority: 'LOW',
      kpiValue: '\u2014',
      kpiLabel: 'métricas',
      statusDot: 'gray',
      statusText: 'Disponible',
    },
    {
      id: 'config',
      label: 'Config',
      icon: <Settings size={DASH.iconSize} strokeWidth={DASH.iconStroke} />,
      route: '/admin/configuracion',
      priority: 'LOW',
      kpiValue: '\u2699\uFE0F',
      kpiLabel: 'admin',
      statusDot: 'gray',
      statusText: 'Sistema',
    },
  ]

  const fila1 = cards.slice(0, 7)
  const fila2 = cards.slice(7)

  // ——— CARD STYLE BUILDER ——————————————————————————
  const getCardStyle = (
    card: CardConfig,
    isHovered: boolean
  ): React.CSSProperties => {
    const isHigh = card.priority === 'HIGH'
    return {
      borderRadius: DASH.cardRadius,
      padding: DASH.cardPadding,
      background:
        card.id === 'war-room' ? DASH.cardGradientWar : DASH.cardGradient,
      cursor: 'pointer',
      position: 'relative',
      overflow: 'hidden',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      gap: '4px',
      transition: 'all 0.16s ease',
      transform: isHovered ? 'translateY(-2px)' : 'translateY(0)',

      // Borders biselados
      borderTop: `1px solid ${isHigh ? DASH.borderTopHigh : DASH.borderTop}`,
      borderLeft: `1px solid ${isHigh ? DASH.borderTopHigh : DASH.borderTop}`,
      borderBottom: `1px solid ${DASH.borderBottom}`,
      borderRight: `1px solid ${DASH.borderRight}`,

      // Shadows
      boxShadow: isHovered
        ? `${DASH.cardHoverShadow}, ${DASH.cardShadowInset}`
        : `${DASH.cardShadow}, ${DASH.cardShadowInset}`,
    }
  }

  // ——— RENDER CARD ——————————————————————————————————
  const renderCard = (card: CardConfig) => (
    <div
      key={card.id}
      onClick={() => navigate(card.route)}
      onMouseEnter={() => setHoveredCard(card.id)}
      onMouseLeave={() => setHoveredCard(null)}
      style={getCardStyle(card, hoveredCard === card.id)}
    >
      {/* Top accent line */}
      <div
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          height: '2px',
          background:
            card.priority === 'HIGH'
              ? DASH.accentGradientHigh
              : DASH.accentGradient,
          borderRadius: `${DASH.cardRadius} ${DASH.cardRadius} 0 0`,
        }}
      />

      {/* Icon */}
      <div
        style={{
          height: '46px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: 'rgba(200,210,225,0.7)',
          transition: 'filter 0.16s ease',
          filter:
            hoveredCard === card.id ? 'brightness(1.18)' : 'brightness(1)',
        }}
      >
        {card.icon}
      </div>

      {/* KPI Number */}
      <div
        style={{
          fontSize: DASH.kpiFontSize,
          fontWeight: DASH.kpiFontWeight,
          color:
            hoveredCard === card.id
              ? DASH.kpiColorHover
              : card.priority === 'HIGH'
                ? DASH.kpiColorHigh
                : DASH.kpiColorMid,
          lineHeight: 1.1,
          transition: 'color 0.16s ease',
        }}
      >
        {card.kpiValue}
      </div>

      {/* Title */}
      <div
        style={{
          fontSize: DASH.titleFontSize,
          fontWeight: DASH.titleFontWeight,
          letterSpacing: DASH.titleLetterSpacing,
          color: 'rgba(255,255,255,0.78)',
          textAlign: 'center',
        }}
      >
        {card.label}
      </div>

      {/* Subtitle + Status Dot */}
      <div
        style={{
          fontSize: DASH.subFontSize,
          fontWeight: DASH.subFontWeight,
          color:
            hoveredCard === card.id ? DASH.subColorHover : DASH.subColor,
          letterSpacing: '0.3px',
          display: 'flex',
          alignItems: 'center',
          gap: '5px',
          transition: 'color 0.16s ease',
        }}
      >
        <span
          style={{
            width: DASH.dotSize,
            height: DASH.dotSize,
            borderRadius: '50%',
            backgroundColor: DOT_COLORS[card.statusDot] || DOT_COLORS.gray,
            boxShadow: `0 0 4px ${DOT_COLORS[card.statusDot] || DOT_COLORS.gray}40`,
            display: 'inline-block',
          }}
        />
        {card.statusText}
      </div>
    </div>
  )

  // ——— RENDER ————————————————————————————————————————
  return (
    <div
      style={{
        height: '100vh',
        overflow: 'hidden',
        display: 'flex',
        flexDirection: 'column',
        backgroundColor: DASH.bg,
        fontFamily: DASH.fontFamily,
        color: '#E8E8ED',
      }}
    >
      {/* Zona 1 — AppHeader */}
      <AppHeader
        onLogout={handleLogout}
        userName={formatName(user?.email)}
        userRole={user?.rol || 'admin'}
        userEmail={user?.email}
      />

      {/* Línea divisoria naranja */}
      <div
        style={{
          height: '2px',
          background:
            'linear-gradient(90deg, #C27803 0%, rgba(194,120,3,0.3) 60%, transparent 100%)',
        }}
      />

      {/* Zona 2 — Franja de Métricas */}
      <div
        style={{
          marginTop: DASH.metricsMarginTop,
          marginBottom: DASH.metricsMarginBottom,
          padding: DASH.metricsPadding,
          background: DASH.metricsBg,
          border: DASH.metricsBorder,
          borderRadius: '0',
          display: 'flex',
          justifyContent: 'space-around',
          alignItems: 'center',
        }}
      >
        {[
          { label: 'Viajes Activos', value: kpis.viajesActivos, color: '#0D9668' },
          { label: 'Unidades GPS', value: kpis.unidadesGps, color: '#3B6CE7' },
          {
            label: 'Alertas Hoy',
            value: kpis.alertasHoy,
            color: kpis.alertasHoy > 0 ? '#C53030' : '#6B6B7A',
          },
          { label: 'Formatos Activos', value: kpis.facturadoHoy, color: '#B8860B' },
          { label: 'Leads Pipeline', value: kpis.leadsPipeline, color: '#C27803' },
        ].map((metric) => (
          <div key={metric.label} style={{ textAlign: 'center' }}>
            <div
              style={{
                fontSize: '20px',
                fontWeight: 700,
                color: metric.color,
                lineHeight: 1.2,
              }}
            >
              {metric.value}
            </div>
            <div
              style={{
                fontSize: '10.5px',
                fontWeight: 500,
                color: 'rgba(255,255,255,0.38)',
                letterSpacing: '0.3px',
                marginTop: '2px',
              }}
            >
              {metric.label}
            </div>
          </div>
        ))}
      </div>

      {/* Zona 3 — Grid de 14 Tarjetas (7×2) */}
      <div
        style={{
          flex: 1,
          padding: DASH.gridPadding,
          display: 'flex',
          flexDirection: 'column',
          gap: DASH.cardGap,
          overflow: 'hidden',
        }}
      >
        {/* Fila 1: 7 tarjetas */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(7, 1fr)',
            gap: DASH.cardGap,
            flex: 1,
          }}
        >
          {fila1.map(renderCard)}
        </div>

        {/* Fila 2: 7 tarjetas */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(7, 1fr)',
            gap: DASH.cardGap,
            flex: 1,
          }}
        >
          {fila2.map(renderCard)}
        </div>
      </div>
    </div>
  )
}
