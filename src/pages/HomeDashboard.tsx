// HomeDashboard V27j - Solo cards modificados: iconos SVG blancos
// AppHeader, banner, layout 7+2, KPIs, rutas = INTACTO
import React, { useState, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import AppHeader from '../components/layout/AppHeader'
import { useAuthContext } from '../hooks/AuthContext'

interface CardConfig {
  id: string
  label: string
  route: string
  bgColor: string
  gradient: string
  decorType: 'silk' | 'ring' | 'gear'
  decorColor: string
  decorSecondary?: string
  iconFile: string
  kpiValue: number | string
  kpiLabel: string
  statusDot: 'green' | 'yellow' | 'red' | 'gray'
  statusText: string
  iconOpacity: number
  gridColumn: string
  gridRow: string
}

const DOT_COLORS: Record<string, string> = {
  green: '#10B981', yellow: '#F59E0B', red: '#EF4444', gray: '#CBD5E1',
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

  const mainCards: CardConfig[] = [
    { id: 'oportunidades', label: 'Oportunidades', route: '/ventas/mis-leads', bgColor: '#0D1220', gradient: 'linear-gradient(135deg, #0B0F1A 0%, #161C2C 100%)', decorType: 'silk', decorColor: 'rgba(255,255,255,0.08)', iconFile: 'oportunidades.svg', iconOpacity: 0.18, kpiValue: kpis.leadsActivos, kpiLabel: 'leads', statusDot: 'green', statusText: 'Pipeline activo', gridColumn: '1 / 2', gridRow: '1 / 2' },
    { id: 'servicio-clientes', label: 'Servicio al Cliente', route: '/servicio/dashboard', bgColor: '#172554', gradient: 'linear-gradient(135deg, #0B1226 0%, #13204A 50%, #1E3A8A 100%)', decorType: 'silk', decorColor: 'rgba(255,255,255,0.14)', iconFile: 'servicio-al-cliente.svg', iconOpacity: 0.14, kpiValue: kpis.clientes.toLocaleString(), kpiLabel: 'clientes', statusDot: 'green', statusText: '3 submódulos', gridColumn: '2 / 4', gridRow: '1 / 2' },
    { id: 'comercial', label: 'Comercial', route: '/ventas/dashboard', bgColor: '#172554', gradient: 'linear-gradient(135deg, #0A0F22 0%, #131C3E 50%, #1E3072 100%)', decorType: 'silk', decorColor: 'rgba(255,255,255,0.12)', iconFile: 'comercial.svg', iconOpacity: 0.15, kpiValue: kpis.formatosActivos.toLocaleString(), kpiLabel: 'formatos', statusDot: 'green', statusText: '11 submódulos', gridColumn: '4 / 5', gridRow: '1 / 3' },
    { id: 'operaciones', label: 'Operaciones', route: '/operaciones/dashboard', bgColor: '#0D1220', gradient: 'linear-gradient(135deg, #0B0F1A 0%, #181E2E 100%)', decorType: 'silk', decorColor: 'rgba(255,255,255,0.09)', iconFile: 'Despacho inteligente.svg', iconOpacity: 0.18, kpiValue: kpis.viajesActivos, kpiLabel: 'viajes', statusDot: kpis.viajesActivos > 0 ? 'green' : 'gray', statusText: kpis.viajesActivos > 0 ? 'Operando' : 'Sin viajes', gridColumn: '1 / 2', gridRow: '2 / 3' },
    { id: 'ventas', label: 'Ventas', route: '/ventas/analytics', bgColor: '#2563EB', gradient: 'linear-gradient(135deg, #1D4ED8 0%, #2563EB 45%, #3B82F6 100%)', decorType: 'silk', decorColor: 'rgba(255,255,255,0.22)', iconFile: 'Ventas.svg', iconOpacity: 0.13, kpiValue: kpis.formatosActivos.toLocaleString(), kpiLabel: 'formatos', statusDot: 'green', statusText: 'Pipeline activo', gridColumn: '2 / 3', gridRow: '2 / 3' },
    { id: 'comunicaciones', label: 'Comunicaciones', route: '/comunicaciones/dashboard', bgColor: '#0D1220', gradient: 'linear-gradient(135deg, #0A0E18 0%, #161C2A 100%)', decorType: 'gear', decorColor: 'rgba(255,255,255,0.08)', iconFile: 'comunicaciones.svg', iconOpacity: 0.18, kpiValue: '5', kpiLabel: 'canales', statusDot: 'green', statusText: 'Activo', gridColumn: '3 / 4', gridRow: '2 / 4' },
    { id: 'autofomento', label: 'Auto Fomento SEAT', route: '/', bgColor: '#2E3138', gradient: 'linear-gradient(135deg, #22252B 0%, #2E3138 45%, #3A3E46 100%)', decorType: 'silk', decorColor: 'rgba(255,255,255,0.12)', iconFile: 'comercial.svg', iconOpacity: 0.16, kpiValue: '', kpiLabel: '', statusDot: 'gray', statusText: 'Próximamente', gridColumn: '1 / 3', gridRow: '3 / 4' },
    { id: 'config', label: 'Configuración', route: '/admin/configuracion', bgColor: '#3F444D', gradient: 'linear-gradient(135deg, #2D3138 0%, #3F444D 55%, #4B515A 100%)', decorType: 'gear', decorColor: 'rgba(255,255,255,0.10)', iconFile: 'configuracion.svg', iconOpacity: 0.22, kpiValue: '', kpiLabel: 'admin', statusDot: 'gray', statusText: 'Sistema', gridColumn: '4 / 5', gridRow: '3 / 4' },
  ]

  const getCardStyle = (isHovered: boolean, card: CardConfig): React.CSSProperties => ({
    gridColumn: card.gridColumn,
    gridRow: card.gridRow,
    minHeight: 0,
    borderRadius: '26px',
    padding: '28px',
    // Fondo del card: solo gradient base (la composición abstracta va encima en SVG)
    background: card.gradient,
    border: '1px solid rgba(255,255,255,0.04)',
    cursor: 'pointer',
    position: 'relative',
    overflow: 'hidden',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'flex-start',
    justifyContent: 'flex-start',
    transition: 'transform 0.5s cubic-bezier(0.16,1,0.3,1), box-shadow 0.5s cubic-bezier(0.16,1,0.3,1), border-color 0.3s ease',
    transform: isHovered
      ? 'translateY(-6px)'
      : 'translateY(0)',
    // Sombras en dos capas + doble highlight interno (top + bottom) para acabado premium "cristal corporativo"
    boxShadow: isHovered
      ? `
        0 26px 50px -20px rgba(0,0,0,0.50),
        0 14px 28px -12px rgba(0,0,0,0.32),
        inset 0 1px 0 rgba(255,255,255,0.09),
        inset 0 0 0 1px rgba(255,255,255,0.03),
        inset 0 -1px 0 rgba(0,0,0,0.18)
      `
      : `
        0 14px 30px -14px rgba(0,0,0,0.38),
        0 7px 15px -7px rgba(0,0,0,0.24),
        inset 0 1px 0 rgba(255,255,255,0.06),
        inset 0 0 0 1px rgba(255,255,255,0.025),
        inset 0 -1px 0 rgba(0,0,0,0.15)
      `,
  })

  // Familia iconográfica unificada: todos con stroke 1.5, white, rounded caps/joins, sin fill
  // Derivados del engrane: misma gramática visual (circle + teeth + inner circle)
  const UnifiedIcon = ({ id, opacity }: { id: string; opacity: number }) => {
    const sp = {
      width: '100%', height: '100%', viewBox: '0 0 48 48',
      fill: 'none', stroke: '#FFFFFF', strokeWidth: 1.5,
      strokeLinecap: 'round' as const, strokeLinejoin: 'round' as const,
      style: { opacity },
    }
    switch (id) {
      case 'oportunidades':
        return (
          <svg {...sp}>
            {/* Embudo de oportunidades: diagonales tensas, minimalista */}
            <path d="M6 10 L42 10 L28 24 L28 40 L20 40 L20 24 Z" />
            <line x1="14" y1="16" x2="34" y2="16" />
          </svg>
        )
      case 'servicio-clientes':
        return (
          <svg {...sp}>
            {/* Headset: arco + dos earcups */}
            <path d="M10 28 Q10 8 24 8 Q38 8 38 28" />
            <path d="M6 28 L6 36 Q6 38 8 38 L12 38 L12 28 Z" />
            <path d="M42 28 L42 36 Q42 38 40 38 L36 38 L36 28 Z" />
            <path d="M36 38 Q36 44 30 44 L26 44" />
          </svg>
        )
      case 'comercial':
        return (
          <svg {...sp}>
            {/* Maletín ejecutivo */}
            <rect x="6" y="16" width="36" height="24" rx="2" />
            <path d="M18 16 L18 12 Q18 10 20 10 L28 10 Q30 10 30 12 L30 16" />
            <line x1="6" y1="26" x2="42" y2="26" />
          </svg>
        )
      case 'operaciones':
        return (
          <svg {...sp}>
            {/* Tractor-caja: volumen operativo */}
            <rect x="4" y="16" width="22" height="16" rx="1" />
            <path d="M26 20 L34 20 L38 24 L38 32 L26 32 Z" />
            <circle cx="12" cy="36" r="3" />
            <circle cx="32" cy="36" r="3" />
          </svg>
        )
      case 'ventas':
        return (
          <svg {...sp}>
            {/* Gráfica ascendente con flecha (crecimiento) */}
            <line x1="6" y1="40" x2="42" y2="40" />
            <path d="M10 34 L18 24 L24 30 L36 12" />
            <path d="M30 12 L36 12 L36 18" />
          </svg>
        )
      case 'comunicaciones':
        return (
          <svg {...sp}>
            {/* Dos burbujas de diálogo superpuestas */}
            <path d="M8 12 L26 12 Q30 12 30 16 L30 22 Q30 26 26 26 L16 26 L10 30 L10 26 Q8 26 8 24 Z" />
            <path d="M20 30 L36 30 Q40 30 40 34 L40 38 Q40 42 36 42 L30 42 L26 46 L26 42 Q20 42 20 40 Z" />
          </svg>
        )
      case 'autofomento':
        return (
          <svg {...sp}>
            {/* Silueta de auto corporativo */}
            <path d="M6 30 L10 22 Q12 18 16 18 L32 18 Q36 18 38 22 L42 30 L42 34 L6 34 Z" />
            <line x1="14" y1="22" x2="34" y2="22" />
            <circle cx="14" cy="34" r="3" />
            <circle cx="34" cy="34" r="3" />
          </svg>
        )
      case 'config':
      default:
        return (
          <svg {...sp}>
            {/* Engrane referencia: circle exterior + interior + 8 dientes */}
            <circle cx="24" cy="24" r="10" />
            <circle cx="24" cy="24" r="4" />
            <line x1="24" y1="6" x2="24" y2="11" />
            <line x1="24" y1="37" x2="24" y2="42" />
            <line x1="6" y1="24" x2="11" y2="24" />
            <line x1="37" y1="24" x2="42" y2="24" />
            <line x1="11.3" y1="11.3" x2="14.8" y2="14.8" />
            <line x1="33.2" y1="33.2" x2="36.7" y2="36.7" />
            <line x1="36.7" y1="11.3" x2="33.2" y2="14.8" />
            <line x1="14.8" y1="33.2" x2="11.3" y2="36.7" />
          </svg>
        )
    }
  }

  // Composiciones abstractas: diagonales amplias + curvas tensas + capas oscuras translúcidas
  // NADA de hairlines random, NADA de círculos, NADA de wireframes
  const renderDecor = (card: CardConfig, isHovered: boolean) => {
    const baseTransition = 'transform 1s cubic-bezier(0.16,1,0.3,1), opacity 0.6s ease'
    const intensity =
      card.id === 'ventas' ? 1.0
      : card.id === 'servicio-clientes' || card.id === 'comercial' ? 0.80
      : card.id === 'autofomento' ? 0.60
      : 0.68

    // Composición abstracta por card: 2 formas rellenas (diagonal amplia + capa oscura)
    type Recipe = { sweep: string; shadow: string }
    const recipes: Record<string, Recipe> = {
      'oportunidades': {
        sweep: 'M -50 180 Q 120 40 280 100 T 460 40 L 460 240 L -50 240 Z',
        shadow: 'M -30 220 Q 180 140 380 200 L 460 220 L 460 240 L -30 240 Z',
      },
      'servicio-clientes': {
        sweep: 'M -50 160 Q 140 40 300 90 T 460 50 L 460 240 L -50 240 Z',
        shadow: 'M -30 200 Q 200 130 400 180 L 460 200 L 460 240 L -30 240 Z',
      },
      'comercial': {
        sweep: 'M -50 80 Q 140 180 300 110 T 460 190 L 460 240 L -50 240 Z',
        shadow: 'M -30 150 Q 180 230 380 200 L 460 220 L 460 240 L -30 240 Z',
      },
      'operaciones': {
        sweep: 'M -50 140 Q 120 60 260 120 Q 380 170 460 100 L 460 240 L -50 240 Z',
        shadow: 'M -30 200 Q 160 160 340 210 L 460 220 L 460 240 L -30 240 Z',
      },
      'ventas': {
        sweep: 'M -50 200 Q 140 60 300 140 T 460 80 L 460 240 L -50 240 Z',
        shadow: 'M -30 220 Q 200 160 400 200 L 460 220 L 460 240 L -30 240 Z',
      },
      'autofomento': {
        sweep: 'M -50 170 Q 200 100 460 150 L 460 240 L -50 240 Z',
        shadow: 'M -30 210 Q 220 170 460 200 L 460 240 L -30 240 Z',
      },
      'comunicaciones': {
        sweep: 'M -50 100 Q 160 200 300 120 T 460 160 L 460 240 L -50 240 Z',
        shadow: 'M -30 190 Q 180 230 380 210 L 460 220 L 460 240 L -30 240 Z',
      },
      'config': {
        sweep: 'M -50 120 Q 140 200 300 130 T 460 180 L 460 240 L -50 240 Z',
        shadow: 'M -30 200 Q 180 230 380 210 L 460 220 L 460 240 L -30 240 Z',
      },
    }
    const r = recipes[card.id] || recipes['oportunidades']

    return (
      <>
        <svg
          viewBox="0 0 400 240"
          preserveAspectRatio="none"
          style={{
            position: 'absolute', inset: 0,
            width: '100%', height: '100%',
            pointerEvents: 'none',
            transition: baseTransition,
            transform: isHovered ? 'scale(1.015)' : 'scale(1)',
          }}
        >
          <defs>
            {/* Sweep: barrido de luz amplio, diagonal, muy suave */}
            <linearGradient id={`sweep-${card.id}`} x1="0%" y1="0%" x2="100%" y2="80%">
              <stop offset="0%" stopColor="#FFFFFF" stopOpacity="0" />
              <stop offset="45%" stopColor="#FFFFFF" stopOpacity={0.10 * intensity} />
              <stop offset="70%" stopColor="#FFFFFF" stopOpacity={0.04 * intensity} />
              <stop offset="100%" stopColor="#FFFFFF" stopOpacity="0" />
            </linearGradient>
            {/* Shadow: capa oscura translúcida para profundidad (no viñeta dura) */}
            <linearGradient id={`shadow-${card.id}`} x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#000000" stopOpacity="0" />
              <stop offset="100%" stopColor="#000000" stopOpacity="0.22" />
            </linearGradient>
          </defs>
          {/* Capa 1: barrido de luz diagonal amplio (forma rellena, no stroke) */}
          <path d={r.sweep} fill={`url(#sweep-${card.id})`} />
          {/* Capa 2: sombra inferior translúcida (apoya la base del card) */}
          <path d={r.shadow} fill={`url(#shadow-${card.id})`} />
        </svg>
        {/* Icono unificado — misma caja, misma gramática visual derivada del engrane */}
        {card.iconOpacity > 0 && (
          <div
            style={{
              position: 'absolute',
              right: '22px', bottom: '22px',
              width: '80px',
              height: '80px',
              pointerEvents: 'none',
              transition: baseTransition,
              transform: isHovered ? 'scale(1.04)' : 'scale(1)',
            }}
          >
            <UnifiedIcon id={card.id} opacity={card.iconOpacity} />
          </div>
        )}
      </>
    )
  }

  const renderCard = (card: CardConfig) => {
    const isHovered = hoveredCard === card.id
    // Todos los cards son dark premium → texto blanco
    const textColor = '#FFFFFF'
    const mutedColor = 'rgba(255,255,255,0.72)'
    return (
      <div
        key={card.id}
        onClick={() => navigate(card.route)}
        onMouseEnter={() => setHoveredCard(card.id)}
        onMouseLeave={() => setHoveredCard(null)}
        style={getCardStyle(isHovered, card)}
      >
        {renderDecor(card, isHovered)}
        <div style={{
          position: 'absolute', top: '16px', right: '16px',
          width: '7px', height: '7px', borderRadius: '50%',
          backgroundColor: DOT_COLORS[card.statusDot] || DOT_COLORS.gray,
          boxShadow: `0 0 0 2px rgba(255,255,255,0.04), 0 0 8px ${DOT_COLORS[card.statusDot] || DOT_COLORS.gray}66`,
          zIndex: 3,
        }} />
        <div style={{
          fontFamily: "'Montserrat', sans-serif",
          fontSize: '28px',
          fontWeight: 800,
          color: textColor,
          letterSpacing: '-0.5px',
          lineHeight: 1.1,
          marginBottom: 'auto',
          textAlign: 'left', width: '100%',
          // Tipografía limpia: sin glow, sin efectos teatrales. Solo una sombra sutil de asentamiento.
          textShadow: '0 1px 2px rgba(0,0,0,0.28)',
          position: 'relative',
          zIndex: 2,
        }}>
          {card.label}
        </div>
        {card.kpiValue !== '' && (
          <div style={{
            fontFamily: "'Montserrat', sans-serif",
            fontSize: '39px',
            fontWeight: 800,
            color: textColor,
            letterSpacing: '-1.2px',
            textAlign: 'left', width: '100%', lineHeight: 1,
            marginTop: '6px',
            position: 'relative',
            zIndex: 2,
            textShadow: '0 1px 2px rgba(0,0,0,0.25)',
          }}>
            {card.kpiValue}
          </div>
        )}
        <div style={{
          fontFamily: "'Montserrat', sans-serif",
          fontSize: '12px',
          fontWeight: 500,
          color: mutedColor,
          letterSpacing: '0.2px',
          textAlign: 'left', width: '100%',
          marginTop: '6px',
          position: 'relative',
          zIndex: 2,
        }}>
          {card.statusText}
        </div>
      </div>
    )
  }

  return (
    <div style={{
      height: '100vh',
      overflow: 'hidden',
      display: 'flex',
      flexDirection: 'column',
      background: 'radial-gradient(circle at top, #dfe4ec 0%, #cfd5de 45%, #c7ced8 100%)',
      fontFamily: "'Montserrat', sans-serif",
      color: '#1E293B',
    }}>
      <style>{`@import url('https://fonts.googleapis.com/css2?family=Montserrat:wght@400;500;600;700;800&display=swap');`}</style>
      <AppHeader
        onLogout={handleLogout}
        userName={formatName(user?.email)}
        userRole={user?.rol || 'admin'}
        userEmail={user?.email}
      />
      <div style={{
        flex: '1 1 auto',
        padding: '33px 28px',
        display: 'flex',
        flexDirection: 'column',
        gap: '14px',
        overflow: 'hidden',
      }}>
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(4, 1fr)',
          gridTemplateRows: 'repeat(3, 1fr)',
          gap: '14px',
          flex: '0 0 70%',
          minHeight: 0,
        }}>
          {mainCards.map(renderCard)}
        </div>
      </div>
    </div>
  )
}












