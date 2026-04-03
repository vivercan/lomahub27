// ╔══════════════════════════════════════════════════════════════════════════════╗
// ║ 🛡️  BLINDAJE DASHBOARD V27f — ARCHIVO PROTEGIDO                           ║
// ║                                                                            ║
// ║  REGLA: Este archivo NO se puede modificar sin autorización EXPLÍCITA      ║
// ║  de JJ (Juan Viveros). Consultar página 34 Notion antes de cualquier      ║
// ║  cambio. Requiere tag [DASHBOARD-APPROVED] en commit message.             ║
// ║                                                                            ║
// ║  ESTILO: M1 REFINADO — Aprobado por JJ 3/Abr/2026                        ║
// ║    • 14 tarjetas LANDSCAPE en grid 7×2, aspect-ratio 1/0.65              ║
// ║    • Background: #E8EBF0 | Cards: #FFFFFF | Font: Montserrat + Inter     ║
// ║    • Icon pills 40×28 tintados 6% | Status dots | Left-aligned           ║
// ║    • Row labels: FILA 1 · COMANDO / FILA 2 · SOPORTE                     ║
// ║    • SIN sidebar — navegación directa al hacer click en tarjeta           ║
// ║                                                                            ║
// ║  ÚLTIMA ACTUALIZACIÓN: 3/Abr/2026 — M1 REFINADO visual overhaul          ║
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
// M1 REFINADO — VISUAL CONSTANTS
// ============================================================================

const DASH = {
  bg: '#E8EBF0',
  headerBg: '#FFFFFF',
  fontFamily: "'Montserrat', sans-serif",
  fontBody: "'Inter', sans-serif",

  // Card — white solid
  cardBg: '#FFFFFF',
  cardBorder: '1px solid #E8EBF0',
  cardRadius: '14px',
  cardPadding: '18px',
  cardShadow: '0 1px 2px rgba(0,0,0,0.04), 0 2px 8px rgba(0,0,0,0.03), 0 4px 16px rgba(0,0,0,0.02)',
  cardHoverShadow: '0 2px 4px rgba(0,0,0,0.06), 0 4px 16px rgba(0,0,0,0.06), 0 8px 32px rgba(0,0,0,0.04)',

  // Grid
  gridGap: '16px',
  gridPadding: '16px 28px',

  // Icon pill — 40×28, tinted bg 6%
  pillWidth: '40px',
  pillHeight: '28px',
  pillRadius: '8px',
  pillIconSize: 15,
  pillStroke: 1.5,

  // Title — Montserrat 700 / 11px
  titleSize: '11px',
  titleWeight: 700,
  titleColor: '#1E293B',

  // KPI number — Montserrat 600 / 28px
  kpiSize: '28px',
  kpiWeight: 600,
  kpiColor: '#0F172A',

  // Subtitle — Inter 400 / 9px
  subSize: '9px',
  subWeight: 400,
  subColor: '#94A3B8',

  // Status dot
  dotSize: '6px',

  // Row label
  rowLabelSize: '9px',
  rowLabelWeight: 700,
  rowLabelColor: '#94A3B8',
  rowLabelSpacing: '3px',

  // Metrics bar
  metricsMarginTop: '0px',
  metricsMarginBottom: '0px',
  metricsPadding: '12px 28px',
  metricsBg: 'rgba(255,255,255,0.6)',
  metricsBorder: '1px solid #D1D5DB',
} as const

// ============================================================================
// PILL COLORS — per module, tinted 6% background + stroke color
// ============================================================================

const PILL_COLORS: Record<string, { bg: string; stroke: string }> = {
  'war-room':       { bg: 'rgba(239,68,68,0.06)',   stroke: '#EF4444' },
  'ventas':         { bg: 'rgba(16,185,129,0.06)',   stroke: '#10B981' },
  'clientes':       { bg: 'rgba(59,130,246,0.06)',   stroke: '#3B82F6' },
  'servicio':       { bg: 'rgba(100,116,139,0.06)',  stroke: '#64748B' },
  'torre-control':  { bg: 'rgba(245,158,11,0.06)',   stroke: '#F59E0B' },
  'mapa-gps':       { bg: 'rgba(244,63,94,0.06)',    stroke: '#F43F5E' },
  'flota':          { bg: 'rgba(99,102,241,0.06)',    stroke: '#6366F1' },
  'dedicados':      { bg: 'rgba(5,150,105,0.06)',     stroke: '#059669' },
  'cobranza':       { bg: 'rgba(249,115,22,0.06)',    stroke: '#F97316' },
  'indicadores':    { bg: 'rgba(37,99,235,0.06)',     stroke: '#2563EB' },
  'rentabilidad':   { bg: 'rgba(16,185,129,0.06)',    stroke: '#10B981' },
  'comunicaciones': { bg: 'rgba(6,182,212,0.06)',     stroke: '#06B6D4' },
  'reportes':       { bg: 'rgba(99,102,241,0.06)',    stroke: '#6366F1' },
  'config':         { bg: 'rgba(148,163,184,0.06)',   stroke: '#94A3B8' },
}

// ============================================================================
// STATUS DOT COLORS — premium tones
// ============================================================================

const DOT_COLORS: Record<string, string> = {
  green: '#10B981',
  yellow: '#F59E0B',
  red: '#EF4444',
  gray: '#CBD5E1',
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

  // ——— 14 CARD DEFINITIONS (grid 7×2) ——————————————————
  const cards: CardConfig[] = [
    // ═══ FILA 1 · COMANDO ═══
    {
      id: 'war-room',
      label: 'War Room',
      icon: <Swords size={DASH.pillIconSize} strokeWidth={DASH.pillStroke} />,
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
      icon: <Briefcase size={DASH.pillIconSize} strokeWidth={DASH.pillStroke} />,
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
      icon: <Users size={DASH.pillIconSize} strokeWidth={DASH.pillStroke} />,
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
      icon: <HeadphonesIcon size={DASH.pillIconSize} strokeWidth={DASH.pillStroke} />,
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
      icon: <Radio size={DASH.pillIconSize} strokeWidth={DASH.pillStroke} />,
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
      icon: <MapPin size={DASH.pillIconSize} strokeWidth={DASH.pillStroke} />,
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
      icon: <Truck size={DASH.pillIconSize} strokeWidth={DASH.pillStroke} />,
      route: '/operaciones/disponibilidad',
      priority: 'MID',
      kpiValue: (kpis.tractosTotal + kpis.cajasTotal) > 0
        ? (kpis.tractosTotal + kpis.cajasTotal)
        : '\u2014',
      kpiLabel: 'unidades',
      statusDot: 'green',
      statusText: 'Inventario',
    },
    // ═══ FILA 2 · SOPORTE ═══
    {
      id: 'dedicados',
      label: 'Dedicados',
      icon: <Container size={DASH.pillIconSize} strokeWidth={DASH.pillStroke} />,
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
      icon: <DollarSign size={DASH.pillIconSize} strokeWidth={DASH.pillStroke} />,
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
      icon: <BarChart3 size={DASH.pillIconSize} strokeWidth={DASH.pillStroke} />,
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
      icon: <TrendingUp size={DASH.pillIconSize} strokeWidth={DASH.pillStroke} />,
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
      icon: <MessageSquare size={DASH.pillIconSize} strokeWidth={DASH.pillStroke} />,
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
      icon: <FileBarChart size={DASH.pillIconSize} strokeWidth={DASH.pillStroke} />,
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
      icon: <Settings size={DASH.pillIconSize} strokeWidth={DASH.pillStroke} />,
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

  // ——— CARD STYLE BUILDER — M1 REFINADO ——————————————
  const getCardStyle = (
    _card: CardConfig,
    isHovered: boolean
  ): React.CSSProperties => ({
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

  // ——— RENDER CARD — M1 REFINADO ————————————————————
  const renderCard = (card: CardConfig) => {
    const pill = PILL_COLORS[card.id] || { bg: 'rgba(148,163,184,0.06)', stroke: '#94A3B8' }
    const isHovered = hoveredCard === card.id

    return (
      <div
        key={card.id}
        onClick={() => navigate(card.route)}
        onMouseEnter={() => setHoveredCard(card.id)}
        onMouseLeave={() => setHoveredCard(null)}
        style={getCardStyle(card, isHovered)}
      >
        {/* Status dot — top right */}
        <div
          style={{
            position: 'absolute',
            top: '14px',
            right: '14px',
            width: DASH.dotSize,
            height: DASH.dotSize,
            borderRadius: '50%',
            backgroundColor: DOT_COLORS[card.statusDot] || DOT_COLORS.gray,
          }}
        />

        {/* Icon pill — 40×28, tinted 6% */}
        <div
          style={{
            width: DASH.pillWidth,
            height: DASH.pillHeight,
            minHeight: DASH.pillHeight,
            borderRadius: DASH.pillRadius,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            background: pill.bg,
            color: pill.stroke,
            marginBottom: '10px',
            flexShrink: 0,
          }}
        >
          {card.icon}
        </div>

        {/* Title — Montserrat 700 / 11px */}
        <div
          style={{
            fontFamily: DASH.fontFamily,
            fontSize: DASH.titleSize,
            fontWeight: DASH.titleWeight,
            color: DASH.titleColor,
            lineHeight: 1.2,
            marginBottom: 'auto',
          }}
        >
          {card.label}
        </div>

        {/* KPI number — Montserrat 600 / 28px */}
        <div
          style={{
            fontFamily: DASH.fontFamily,
            fontSize: DASH.kpiSize,
            fontWeight: DASH.kpiWeight,
            color: DASH.kpiColor,
            lineHeight: 1,
            marginTop: '6px',
          }}
        >
          {card.kpiValue}
        </div>

        {/* Subtitle — Inter 400 / 9px */}
        <div
          style={{
            fontFamily: DASH.fontBody,
            fontSize: DASH.subSize,
            fontWeight: DASH.subWeight,
            color: DASH.subColor,
            marginTop: '3px',
          }}
        >
          {card.statusText}
        </div>
      </div>
    )
  }

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

      {/* Zona 2 — Franja de Métricas */}
      <div
        style={{
          marginTop: DASH.metricsMarginTop,
          marginBottom: DASH.metricsMarginBottom,
          padding: DASH.metricsPadding,
          background: DASH.metricsBg,
          borderBottom: DASH.metricsBorder,
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
                fontFamily: DASH.fontFamily,
                fontSize: '22px',
                fontWeight: 700,
                color: '#0F172A',
                lineHeight: 1.2,
              }}
            >
              {metric.value}
            </div>
            <div
              style={{
                fontFamily: DASH.fontBody,
                fontSize: '10px',
                fontWeight: 500,
                color: '#64748B',
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

      {/* Zona 3 — Grid de 14 Tarjetas M1 REFINADO (7×2) */}
      <div
        style={{
          flex: '0 0 auto',
          padding: DASH.gridPadding,
          display: 'flex',
          flexDirection: 'column',
          gap: '12px',
          overflow: 'hidden',
        }}
      >
        {/* Row label — Fila 1 */}
        <div
          style={{
            fontFamily: DASH.fontFamily,
            fontSize: DASH.rowLabelSize,
            fontWeight: DASH.rowLabelWeight,
            color: DASH.rowLabelColor,
            textTransform: 'uppercase',
            letterSpacing: DASH.rowLabelSpacing,
            marginBottom: '-4px',
          }}
        >
          FILA 1 &middot; COMANDO
        </div>

        {/* Fila 1: 7 tarjetas */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(7, 1fr)',
            gap: DASH.gridGap,
          }}
        >
          {fila1.map(renderCard)}
        </div>

        {/* Row label — Fila 2 */}
        <div
          style={{
            fontFamily: DASH.fontFamily,
            fontSize: DASH.rowLabelSize,
            fontWeight: DASH.rowLabelWeight,
            color: DASH.rowLabelColor,
            textTransform: 'uppercase',
            letterSpacing: DASH.rowLabelSpacing,
            marginBottom: '-4px',
          }}
        >
          FILA 2 &middot; SOPORTE
        </div>

        {/* Fila 2: 7 tarjetas */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(7, 1fr)',
            gap: DASH.gridGap,
          }}
        >
          {fila2.map(renderCard)}
        </div>
      </div>
    </div>
  )
}
