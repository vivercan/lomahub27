// src/pages/HomeDashboard.tsx
// Dashboard V28 â 9 MÃ³dulos con submÃ³dulos expandibles
// Estilo visual: V27f BLINDADO (pÃ¡gina 34 Notion)
// Background: #2a2a36 | Font: Montserrat | Cards: gradient 180deg, 1:1, 20px radius
// Grid: Fila 1 (5 mÃ³dulos), Fila 2 (4 mÃ³dulos), gap 10px
// NO TOCAR sin autorizaciÃ³n de JJ

import React, { useState, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Briefcase,
  Truck,
  HeadphonesIcon,
  Container,
  DollarSign,
  MessageSquare,
  Settings,
  CalendarCheck,
  FileText,
} from 'lucide-react'
import { supabase } from '../lib/supabase'
import AppHeader from '../components/layout/AppHeader'
import { useAuthContext } from '../hooks/AuthContext'

// ============================================================================
// TYPES
// ============================================================================

interface ModuleConfig {
  id: string
  label: string
  icon: React.ReactNode
  priority: 'HIGH' | 'MID' | 'LOW' | 'FASE2'
  kpiValue: number | string
  kpiLabel: string
  statusDot?: 'green' | 'yellow' | 'red' | 'gray'
  statusText?: string
  submods: SubModule[]
}

interface SubModule {
  label: string
  route: string
}

// ============================================================================
// DASHBOARD VISUAL CONSTANTS (V27f BLINDADO â pÃ¡gina 34)
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
  cardPadding: '20px 14px 18px',
  cardGap: '10px',
  gridPadding: '4px 20px',

  // Borders biselados
  borderTop: 'rgba(155,168,195,0.18)',
  borderTopHigh: 'rgba(155,168,195,0.28)',
  borderBottom: 'rgba(0,0,0,0.42)',
  borderRight: 'rgba(0,0,0,0.32)',

  // Shadows 3 capas
  cardShadow: '0 10px 24px rgba(0,0,0,0.28), 0 2px 6px rgba(0,0,0,0.28)',
  cardShadowInset:
    'inset 0 1px 0 rgba(200,210,225,0.06), inset 0 -1px 0 rgba(0,0,0,0.14)',
  cardHoverShadow:
    '0 14px 32px rgba(0,0,0,0.35), 0 4px 10px rgba(0,0,0,0.30)',

  // KPI
  kpiFontSize: '30px',
  kpiFontWeight: 800,
  kpiColorHigh: 'rgba(255,255,255,0.72)',
  kpiColorMid: 'rgba(255,255,255,0.58)',
  kpiColorHover: 'rgba(255,255,255,0.92)',

  // Title
  titleFontSize: '14px',
  titleFontWeight: 600,
  titleLetterSpacing: '0.3px',

  // Subtitle
  subFontSize: '11.5px',
  subFontWeight: 500,
  subColor: 'rgba(255,255,255,0.28)',
  subColorHover: 'rgba(255,255,255,0.48)',

  // Icons
  iconSize: 55,
  iconSizeBoosted: 58,
  iconStroke: 2.1,
  iconStrokeBoosted: 2.2,

  // Metrics bar
  metricsMarginTop: '14px',
  metricsMarginBottom: '10px',
  metricsPadding: '14px 28px',
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
  const [expandedModule, setExpandedModule] = useState<string | null>(null)

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

  // KPI state â datos reales de Supabase
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
  })

  // âââ FETCH KPIs REALES âââââââââââââââââââââââââââââââ
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
      })
    } catch (err) {
      console.error('Error fetching KPIs:', err)
    }
  }, [])

  useEffect(() => {
    fetchKpis()
    const interval = setInterval(fetchKpis, 60000) // refresh cada 60s
    return () => clearInterval(interval)
  }, [fetchKpis])

  // âââ MODULE DEFINITIONS (V28 â 9 mÃ³dulos) âââââââââââ
  const modules: ModuleConfig[] = [
    // Fila 1: 5 mÃ³dulos
    {
      id: 'comercial',
      label: 'Comercial',
      icon: (
        <Briefcase
          size={DASH.iconSizeBoosted}
          strokeWidth={DASH.iconStrokeBoosted}
        />
      ),
      priority: 'HIGH',
      kpiValue: kpis.leadsActivos,
      kpiLabel: 'leads activos',
      statusDot: 'green',
      statusText: 'Pipeline activo',
      submods: [
        { label: 'Panel de Oportunidades', route: '/ventas/mis-leads' },
        { label: 'Nuevo Lead', route: '/ventas/leads/nuevo' },
        { label: 'Dashboard Ventas', route: '/ventas/dashboard' },
        { label: 'Funnel de Ventas', route: '/ventas/funnel' },
        { label: 'Programa Semanal', route: '/ventas/programa-semanal' },
        { label: 'Comisiones', route: '/ventas/comisiones' },
      ],
    },
    {
      id: 'operaciones',
      label: 'Operaciones',
      icon: (
        <Truck
          size={DASH.iconSizeBoosted}
          strokeWidth={DASH.iconStrokeBoosted}
        />
      ),
      priority: 'HIGH',
      kpiValue: kpis.viajesActivos,
      kpiLabel: 'viajes activos',
      statusDot: kpis.viajesActivos > 0 ? 'green' : 'gray',
      statusText: kpis.viajesActivos > 0 ? 'En operaciÃ³n' : 'Sin viajes',
      submods: [
        { label: 'War Room', route: '/war-room' },
        { label: 'Torre de Control', route: '/operaciones/torre-control' },
        { label: 'Mapa GPS', route: '/operaciones/mapa' },
        { label: 'Despachos', route: '/operaciones/despachos' },
        { label: 'Control Tractos', route: '/operaciones/tractos' },
        { label: 'Control Cajas', route: '/operaciones/cajas' },
        { label: 'Cruce Fronterizo', route: '/operaciones/cruce-fronterizo' },
      ],
    },
    {
      id: 'servicio',
      label: 'Servicio',
      icon: (
        <HeadphonesIcon
          size={DASH.iconSize}
          strokeWidth={DASH.iconStroke}
        />
      ),
      priority: 'HIGH',
      kpiValue: kpis.clientes.toLocaleString(),
      kpiLabel: 'clientes',
      statusDot: 'green',
      statusText: 'Operando',
      submods: [
        { label: 'Dashboard CS', route: '/servicio/dashboard' },
        { label: 'MÃ©tricas SLA', route: '/servicio/metricas' },
        { label: 'WhatsApp', route: '/servicio/whatsapp' },
      ],
    },
    {
      id: 'dedicados',
      label: 'Dedicados',
      icon: (
        <Container
          size={DASH.iconSizeBoosted}
          strokeWidth={DASH.iconStrokeBoosted}
        />
      ),
      priority: 'MID',
      kpiValue: kpis.segmentosDedicados,
      kpiLabel: 'segmentos',
      statusDot: 'green',
      statusText: 'Activo',
      submods: [
        { label: 'Dedicados', route: '/operaciones/dedicados' },
        { label: 'Disponibilidad', route: '/operaciones/disponibilidad' },
      ],
    },
    {
      id: 'cobranza',
      label: 'Cobranza',
      icon: (
        <DollarSign
          size={DASH.iconSizeBoosted}
          strokeWidth={DASH.iconStrokeBoosted}
        />
      ),
      priority: 'MID',
      kpiValue: kpis.cuentasCxc,
      kpiLabel: 'cuentas CxC',
      statusDot: kpis.cuentasCxc > 15 ? 'yellow' : 'green',
      statusText: kpis.cuentasCxc > 15 ? 'RevisiÃ³n' : 'Al corriente',
      submods: [
        { label: 'Cartera', route: '/cxc/cartera' },
        { label: 'Aging Report', route: '/cxc/aging' },
        { label: 'Acciones de Cobro', route: '/cxc/acciones' },
      ],
    },
    // Fila 2: 4 mÃ³dulos
    {
      id: 'comunicaciones',
      label: 'Comunicaciones',
      icon: (
        <MessageSquare
          size={DASH.iconSizeBoosted}
          strokeWidth={DASH.iconStrokeBoosted}
        />
      ),
      priority: 'MID',
      kpiValue: '3',
      kpiLabel: 'canales',
      statusDot: 'green',
      statusText: 'Activo',
      submods: [
        { label: 'Correos', route: '/comunicaciones/correos' },
        { label: 'Notificaciones', route: '/comunicaciones/notificaciones' },
        { label: 'AI Chief of Staff', route: '/comunicaciones/chief-of-staff' },
      ],
    },
    {
      id: 'configuracion',
      label: 'ConfiguraciÃ³n',
      icon: (
        <Settings size={DASH.iconSize} strokeWidth={DASH.iconStroke} />
      ),
      priority: 'LOW',
      kpiValue: '\u2699\uFE0F',
      kpiLabel: 'admin',
      statusDot: 'gray',
      statusText: 'Sistema',
      submods: [
        { label: 'Config General', route: '/admin/configuracion' },
      ],
    },
    {
      id: 'actividades',
      label: 'Actividades',
      icon: (
        <CalendarCheck
          size={DASH.iconSize}
          strokeWidth={DASH.iconStroke}
        />
      ),
      priority: 'LOW',
      kpiValue: '\u2014',
      kpiLabel: 'tareas',
      statusDot: 'gray',
      statusText: 'Disponible',
      submods: [
        { label: 'Actividades', route: '/actividades' },
      ],
    },
    {
      id: 'documentos',
      label: 'Documentos',
      icon: (
        <FileText size={DASH.iconSize} strokeWidth={DASH.iconStroke} />
      ),
      priority: 'LOW',
      kpiValue: '\u2014',
      kpiLabel: 'portal',
      statusDot: 'gray',
      statusText: 'Disponible',
      submods: [
        { label: 'Portal Documentos', route: '/portal/documentos' },
        { label: 'Documentos', route: '/documentos' },
      ],
    },
  ]

  const fila1 = modules.slice(0, 5)
  const fila2 = modules.slice(5)

  // âââ HANDLERS ââââââââââââââââââââââââââââââââââââââââ
  const handleCardClick = (mod: ModuleConfig) => {
    if (mod.priority === 'FASE2') return
    if (mod.submods.length === 1) {
      navigate(mod.submods[0].route)
      return
    }
    setExpandedModule(expandedModule === mod.id ? null : mod.id)
  }

  const handleSubmodClick = (route: string, e: React.MouseEvent) => {
    e.stopPropagation()
    navigate(route)
  }

  // âââ CARD STYLE BUILDER ââââââââââââââââââââââââââââââ
  const getCardStyle = (
    mod: ModuleConfig,
    isHovered: boolean
  ): React.CSSProperties => {
    const isHigh = mod.priority === 'HIGH'
    const isFase2 = mod.priority === 'FASE2'

    return {
      aspectRatio: '1 / 1',
      borderRadius: DASH.cardRadius,
      padding: DASH.cardPadding,
      background:
        mod.id === 'comercial' ? DASH.cardGradientWar : DASH.cardGradient,
      cursor: isFase2 ? 'default' : 'pointer',
      opacity: isFase2 ? 0.5 : 1,
      position: 'relative',
      overflow: 'hidden',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      gap: '6px',
      transition: 'all 0.16s ease',
      transform:
        isHovered && !isFase2 ? 'translateY(-2px)' : 'translateY(0)',
      // Borders biselados
      borderTop: `1px solid ${isHigh ? DASH.borderTopHigh : DASH.borderTop}`,
      borderLeft: `1px solid ${isHigh ? DASH.borderTopHigh : DASH.borderTop}`,
      borderBottom: `1px solid ${DASH.borderBottom}`,
      borderRight: `1px solid ${DASH.borderRight}`,
      // Shadows
      boxShadow:
        isHovered && !isFase2
          ? `${DASH.cardHoverShadow}, ${DASH.cardShadowInset}`
          : `${DASH.cardShadow}, ${DASH.cardShadowInset}`,
    }
  }

  // âââ RENDER CARD (shared between fila1 and fila2) ââââ
  const renderCard = (mod: ModuleConfig) => (
    <div
      key={mod.id}
      style={{
        position: 'relative',
        zIndex: expandedModule === mod.id ? 45 : 'auto',
      }}
    >
      <div
        onClick={() => handleCardClick(mod)}
        onMouseEnter={() => setHoveredCard(mod.id)}
        onMouseLeave={() => setHoveredCard(null)}
        style={getCardStyle(mod, hoveredCard === mod.id)}
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
              mod.priority === 'HIGH'
                ? DASH.accentGradientHigh
                : DASH.accentGradient,
            borderRadius: `${DASH.cardRadius} ${DASH.cardRadius} 0 0`,
          }}
        />

        {/* Icon */}
        <div
          style={{
            height: '55px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: 'rgba(200,210,225,0.7)',
            transition: 'filter 0.16s ease',
            filter:
              hoveredCard === mod.id
                ? 'brightness(1.18)'
                : 'brightness(1)',
          }}
        >
          {mod.icon}
        </div>

        {/* KPI Number */}
        <div
          style={{
            fontSize: DASH.kpiFontSize,
            fontWeight: DASH.kpiFontWeight,
            color:
              hoveredCard === mod.id
                ? DASH.kpiColorHover
                : mod.priority === 'HIGH'
                  ? DASH.kpiColorHigh
                  : DASH.kpiColorMid,
            lineHeight: 1.1,
            transition: 'color 0.16s ease',
          }}
        >
          {mod.kpiValue}
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
          {mod.label}
        </div>

        {/* Subtitle + Status Dot */}
        <div
          style={{
            fontSize: DASH.subFontSize,
            fontWeight: DASH.subFontWeight,
            color:
              hoveredCard === mod.id
                ? DASH.subColorHover
                : DASH.subColor,
            letterSpacing: '0.3px',
            display: 'flex',
            alignItems: 'center',
            gap: '5px',
            transition: 'color 0.16s ease',
          }}
        >
          {mod.statusDot && (
            <span
              style={{
                width: DASH.dotSize,
                height: DASH.dotSize,
                borderRadius: '50%',
                backgroundColor:
                  DOT_COLORS[mod.statusDot] || DOT_COLORS.gray,
                boxShadow: `0 0 4px ${DOT_COLORS[mod.statusDot] || DOT_COLORS.gray}40`,
                display: 'inline-block',
              }}
            />
          )}
          {mod.statusText}
        </div>
      </div>

      {/* Expanded submods overlay */}
      {expandedModule === mod.id && mod.submods.length > 1 && (
        <div
          style={{
            position: 'absolute',
            top: '100%',
            left: 0,
            right: 0,
            zIndex: 50,
            marginTop: '4px',
            background: 'rgba(30,30,42,0.97)',
            backdropFilter: 'blur(16px)',
            border: '1px solid rgba(155,168,195,0.15)',
            borderRadius: '12px',
            padding: '8px',
            boxShadow: '0 12px 40px rgba(0,0,0,0.45)',
            display: 'flex',
            flexDirection: 'column',
            gap: '2px',
          }}
        >
          {mod.submods.map((sub) => (
            <button
              key={sub.route}
              onClick={(e) => handleSubmodClick(sub.route, e)}
              style={{
                background: 'transparent',
                border: 'none',
                color: 'rgba(255,255,255,0.72)',
                fontFamily: DASH.fontFamily,
                fontSize: '12.5px',
                fontWeight: 500,
                padding: '8px 12px',
                borderRadius: '8px',
                cursor: 'pointer',
                textAlign: 'left',
                transition: 'all 0.12s ease',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = 'rgba(59,108,231,0.12)'
                e.currentTarget.style.color = 'rgba(255,255,255,0.92)'
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = 'transparent'
                e.currentTarget.style.color = 'rgba(255,255,255,0.72)'
              }}
            >
              {sub.label}
            </button>
          ))}
        </div>
      )}
    </div>
  )

  // âââ RENDER ââââââââââââââââââââââââââââââââââââââââââ
  return (
    <div
      style={{
        width: '100vw',
        height: '100vh',
        backgroundColor: DASH.bg,
        fontFamily: DASH.fontFamily,
        color: '#E8E8ED',
        overflow: 'hidden',
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      {/* Zona 1 â AppHeader */}
      <AppHeader
        onLogout={handleLogout}
        userName={formatName(user?.email)}
        userRole={user?.rol || 'admin'}
        userEmail={user?.email}
      />

      {/* LÃ­nea divisoria naranja */}
      <div
        style={{
          height: '2px',
          background:
            'linear-gradient(90deg, #C27803 0%, rgba(194,120,3,0.3) 60%, transparent 100%)',
        }}
      />

      {/* Zona 2 â Franja de MÃ©tricas */}
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
          {
            label: 'Viajes Activos',
            value: kpis.viajesActivos,
            color: '#0D9668',
          },
          {
            label: 'Unidades GPS',
            value: kpis.unidadesGps,
            color: '#3B6CE7',
          },
          {
            label: 'Alertas Hoy',
            value: kpis.alertasHoy,
            color: kpis.alertasHoy > 0 ? '#C53030' : '#6B6B7A',
          },
          {
            label: 'Formatos Activos',
            value: kpis.facturadoHoy,
            color: '#B8860B',
          },
          {
            label: 'Leads Pipeline',
            value: kpis.leadsPipeline,
            color: '#C27803',
          },
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

      {/* Zona 3 â Grid de MÃ³dulos */}
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
        {/* Fila 1: 5 mÃ³dulos */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(5, 1fr)',
            gap: DASH.cardGap,
            flex: 1,
          }}
        >
          {fila1.map(renderCard)}
        </div>

        {/* Fila 2: 4 mÃ³dulos */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(4, 1fr)',
            gap: DASH.cardGap,
            flex: 1,
          }}
        >
          {fila2.map(renderCard)}
        </div>
      </div>

      {/* Click outside to close expanded module */}
      {expandedModule && (
        <div
          onClick={() => setExpandedModule(null)}
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 40,
            background: 'transparent',
          }}
        />
      )}
    </div>
  )
}
