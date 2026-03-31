// ╔══════════════════════════════════════════════════════════════════════════════╗
// ║  🛡️  BLINDAJE DASHBOARD V27f — ARCHIVO PROTEGIDO                          ║
// ║                                                                            ║
// ║  REGLA: Este archivo NO se puede modificar sin autorización EXPLÍCITA      ║
// ║  de JJ (Juan Viveros). Consultar página 34 Notion antes de cualquier      ║
// ║  cambio. Requiere tag [DASHBOARD-APPROVED] en commit message.             ║
// ║                                                                            ║
// ║  ESTILO: V27f BLINDADO — página 34 Notion                                ║
// ║  • 14 tarjetas CUADRADAS (aspect-ratio 1:1) en grid 7×2                  ║
// ║  • Background: #2a2a36 | Font: Montserrat (NUNCA Orbitron)                ║
// ║  • Cards: gradient 180deg, border-radius 20px, sombras 3 capas           ║
// ║  • SIN sidebar — navegación directa al hacer click en tarjeta             ║
// ║                                                                            ║
// ║  ÚLTIMA ACTUALIZACIÓN: 29/Mar/2026 — Fix rutas, Flota activo filter, header logo              ║
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
// DASHBOARD VISUAL CONSTANTS — EXACTO de página 34 Notion
// ============================================================================
const DASH = {
  bg: '#FFFFFF',
  fontFamily: "'Montserrat', sans-serif",

  // Card gradients
  cardGradient:
    'linear-gradient(180deg, rgba(54,54,67,1) 0%, rgba(42,42,54,1) 50%, rgba(33,33,43,1) 100%)',
  cardGradientWar:
    'linear-gradient(180deg, rgba(56,50,56,1) 0%, rgba(42,38,48,1) 50%, rgba(31,30,40,1) 100%)',

  // Card styles — página 34 sección 4
  cardRadius: '20px',
  cardPadding: '20px 14px 18px',
  cardGap: '10px',
  gridPadding: '4px 20px',

  // Borders biselados — página 34 sección 4
  borderTop: 'rgba(155,168,195,0.18)',
  borderTopHigh: 'rgba(155,168,195,0.28)',
  borderBottom: 'rgba(0,0,0,0.42)',
  borderRight: 'rgba(0,0,0,0.32)',

  // Shadows 3 capas — página 34 sección 4
  cardShadow:
    '0 10px 24px rgba(0,0,0,0.28), 0 2px 6px rgba(0,0,0,0.28)',
  cardShadowInset:
    'inset 0 1px 0 rgba(200,210,225,0.06), inset 0 -1px 0 rgba(0,0,0,0.14)',
  cardHoverShadow:
    '0 14px 32px rgba(0,0,0,0.35), 0 4px 10px rgba(0,0,0,0.30)',

  // KPI — página 34 sección 6: 30px, 800
  kpiFontSize: '30px',
  kpiFontWeight: 800,
  kpiColorHigh: 'rgba(255,255,255,0.72)',
  kpiColorMid: 'rgba(255,255,255,0.58)',
  kpiColorHover: 'rgba(255,255,255,0.92)',

  // Title — página 34 sección 3: 14px, 600
  titleFontSize: '14px',
  titleFontWeight: 600,
  titleLetterSpacing: '0.3px',

  // Subtitle — página 34 sección 7: 11.5px, 500
  subFontSize: '11.5px',
  subFontWeight: 500,
  subColor: 'rgba(255,255,255,0.28)',
  subColorHover: 'rgba(255,255,255,0.48)',

  // Icons — página 34 sección 5: 55px standard, 58-60px boosted
  iconSize: 55,
  iconSizeBoosted: 58,
  iconStroke: 2.1,
  iconStrokeBoosted: 2.3,
  iconContainerHeight: '55px',

  // Metrics bar — página 34 sección 2
  metricsMarginTop: '14px',
  metricsMarginBottom: '10px',
  metricsPadding: '14px 28px',
  metricsBg: 'rgba(0,0,0,0.03)',
  metricsBorder: '1px solid rgba(0,0,0,0.06)',

  // Status dots — página 34 sección 7
  dotSize: '3px',

  // Accent line
  accentGradient:
    'linear-gradient(90deg, rgba(194,120,3,0.25) 0%, rgba(59,108,231,0.15) 50%, transparent 100%)',
  accentGradientHigh:
    'linear-gradient(90deg, rgba(194,120,3,0.5) 0%, rgba(59,108,231,0.35) 50%, transparent 100%)',
} as const

// ============================================================================
// STATUS DOT COLORS — tonos premium, NO neon
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
    formatosActivos: 0,
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
          .eq('activo', true),
        supabase
          .from('cajas')
          .select('*', { count: 'exact', head: true })
          .eq('activo', true),
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
        formatosActivos: formatosActivos ?? 0,
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

  // ——— 14 CARD DEFINITIONS (V27f — grid 7×2, cuadradas) ——————————
  const cards: CardConfig[] = [
    // ═══ FILA 1 ═══
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
      kpiLabel: 'leads',
      statusDot: 'green',
      statusText: 'Pipeline activo',
    },
    {
      id: 'clientes',
      label: 'Clientes',
      icon: <Users size={DASH.iconSizeBoosted} strokeWidth={DASH.iconStrokeBoosted} />,
      route: '/clientes/corporativos',
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
      kpiLabel: 'viajes',
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
      kpiValue: (kpis.tractosTotal + kpis.cajasTotal) > 0 ? (kpis.tractosTotal + kpis.cajasTotal) : '—',
      kpiLabel: 'unidades',
      statusDot: 'green',
      statusText: 'Inventario',
    },
    // ═══ FILA 2 ═══
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
      icon: <BarChart3 size={DASH.iconSizeBoosted} strokeWidth={DASH.iconStrokeBoosted} />,
      route: '/inteligencia/pareto',
      priority: 'MID',
      kpiValue: '80/20',
      kpiLabel: 'análisis',
      statusDot: 'green',
      statusText: 'Disponible',
    },
    {
      id: 'rentabilidad',
      label: 'Rentabilidad',
      icon: <TrendingUp size={DASH.iconSizeBoosted} strokeWidth={DASH.iconStrokeBoosted} />,
      route: '/operaciones/rentabilidad',
      priority: 'MID',
      kpiValue: kpis.formatosActivos.toLocaleString(),
      kpiLabel: 'formatos',
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
      icon: <FileBarChart size={DASH.iconSizeBoosted} strokeWidth={DASH.iconStrokeBoosted} />,
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
      aspectRatio: '1 / 1',
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
      gap: '6px',
      transition: 'all 0.16s ease',
      transform: isHovered ? 'translateY(-2px)' : 'translateY(0)',

      // Borders biselados
      borderTop: `1px solid ${isHigh ? DASH.borderTopHigh : DASH.borderTop}`,
      borderLeft: `1px solid ${isHigh ? DASH.borderTopHigh : DASH.borderTop}`,
      borderBottom: `1px solid ${DASH.borderBottom}`,
      borderRight: `1px solid ${DASH.borderRight}`,

      // Shadows 3 capas
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
          height: DASH.iconContainerHeight,
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
        color: '#1E293B',
      }}
    >
      {/* Zona 1 — AppHeader */}
      <AppHeader
        onLogout={handleLogout}
        userName={formatName(user?.email)}
        userRole={user?.rol || 'admin'}
        userEmail={user?.email}
      />


      {/* Zona 2 — Franja de Métricas — página 34 sección 2 */}
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
          { label: 'Viajes Activos', value: kpis.viajesActivos },
          { label: 'Unidades GPS', value: kpis.unidadesGps },
          { label: 'Alertas Hoy', value: kpis.alertasHoy },
          { label: 'Formatos Activos', value: kpis.formatosActivos.toLocaleString() },
          { label: 'Leads Pipeline', value: kpis.leadsPipeline },
        ].map((metric) => (
          <div key={metric.label} style={{ textAlign: 'center' }}>
            <div
              style={{
                fontSize: '22px',
                fontWeight: 700,
                color: 'rgba(0,0,0,0.72)',
                lineHeight: 1.2,
              }}
            >
              {metric.value}
            </div>
            <div
              style={{
                fontSize: '10.5px',
                fontWeight: 500,
                color: 'rgba(0,0,0,0.45)',
                letterSpacing: '0.4px',
                marginTop: '3px',
                textTransform: 'uppercase',
              }}
            >
              {metric.label}
            </div>
          </div>
        ))}
      </div>

      {/* Zona 3 — Grid de 14 Tarjetas CUADRADAS (7×2) */}
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
