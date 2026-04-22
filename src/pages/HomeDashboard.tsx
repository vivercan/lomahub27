// HomeDashboard V32 - Refinement premium polish sobre V31 (no redesign)
// Cambios sobre V31 autorizados por JJ 21/Abr/2026 noche:
//   - Shadows más limpias (less cloudy), edges más precisos
//   - Upper-left ambient light sutil (radial gradient 180° top-left)
//   - Orange Ventas shift a copper/amber más ejecutivo #C77A22 → #7A3F0E
//   - Graphite Config más noble #3F4856 → #0F1620
//   - Gold dot más controlado (6px, top 18px right 18px, glow restrained)
//   - Typography: title letter-spacing -0.02em (menos compressed), subtitle 0.70 más quiet
//   - Spacing: padding contenedor 36/32, gap 16, card padding 28 — más intencional
//   - Hover: translateY(-3px) + icon reveal a 0.10, sin scale
//   - Background page radial sutil
//   - Planos geométricos consolidados 2 por card, opacity 0.04-0.05 uniforme
// Distribución 6 azul + 1 naranja (Ventas) + 1 grafito (Configuración) — inmutable
// AppHeader, layout 7+2, KPIs, rutas = INTACTO
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

const CARD_STATUS_PADDING_RIGHT = '110px'

const DOT_COLORS: Record<string, string> = {
  green: '#D6A84F', yellow: '#D6A84F', red: '#D6A84F', gray: '#D6A84F',
}

export default function HomeDashboard() {
  const navigate = useNavigate()
  const { user, logout } = useAuthContext()
  const [hoveredCard, setHoveredCard] = useState<string | null>(null)
  const [pressedCard, setPressedCard] = useState<string | null>(null)

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
    cajasGPS: 0, thermosGPS: 0,
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
      const totalGps = gps ?? 0
      const thermosGPS = Math.floor(totalGps * 0.3)
      const cajasGPS = totalGps - thermosGPS
      setKpis({
        leadsActivos: leads ?? 0, viajesActivos: viajes ?? 0,
        clientes: clientes ?? 0, segmentosDedicados: dedicados ?? 0,
        cuentasCxc: cxc ?? 0, unidadesGps: totalGps,
        alertasHoy: totalAlertas, formatosActivos: formatosActivos ?? 0,
        leadsPipeline: leads ?? 0, tractosTotal: tractos ?? 0,
        cajasTotal: cajas ?? 0,
        cajasGPS, thermosGPS,
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

  // V32 gradients refinados — orange copper/amber ejecutivo, graphite más noble
  const mainCards: CardConfig[] = [
    { id: 'oportunidades', label: 'Oportunidades', route: '/ventas/mis-leads', bgColor: '#2763C4', gradient: 'linear-gradient(135deg, #2763C4 0%, #0A2D6F 100%)', decorType: 'silk', decorColor: 'rgba(255,255,255,0.05)', iconFile: 'oportunidades.svg', iconOpacity: 0.07, kpiValue: '', kpiLabel: '', statusDot: 'green', statusText: 'Mis Leads · Funnel · Oportunidades', gridColumn: '1 / 2', gridRow: '1 / 2' },
    { id: 'servicio-clientes', label: 'Servicio al Cliente', route: '/servicio/dashboard', bgColor: '#2B5FB5', gradient: 'linear-gradient(135deg, #2B5FB5 0%, #0B2E68 100%)', decorType: 'silk', decorColor: 'rgba(255,255,255,0.05)', iconFile: 'servicio-al-cliente.svg', iconOpacity: 0.07, kpiValue: '', kpiLabel: '', statusDot: 'green', statusText: 'Tickets · KPIs · Programación', gridColumn: '2 / 4', gridRow: '1 / 2' },
    { id: 'comercial', label: 'Comercial', route: '/ventas/dashboard', bgColor: '#2557A8', gradient: 'linear-gradient(135deg, #2557A8 0%, #082552 100%)', decorType: 'silk', decorColor: 'rgba(255,255,255,0.05)', iconFile: 'comercial.svg', iconOpacity: 0.07, kpiValue: '', kpiLabel: '', statusDot: 'green', statusText: 'Formatos · Cotizaciones · Analytics', gridColumn: '4 / 5', gridRow: '1 / 3' },
    { id: 'operaciones', label: 'Operaciones', route: '/operaciones/dashboard', bgColor: '#3D78D6', gradient: 'linear-gradient(135deg, #3D78D6 0%, #134287 100%)', decorType: 'silk', decorColor: 'rgba(255,255,255,0.06)', iconFile: 'camion-contenedor-v2.svg', iconOpacity: 0.07, kpiValue: '', kpiLabel: '', statusDot: 'green', statusText: 'Despachos · Seguimiento', gridColumn: '1 / 2', gridRow: '2 / 3' },
    // V32 Ventas — copper/amber ejecutivo (de #D7872E→#8C4710 a #C77A22→#7A3F0E, más copper, menos saturado)
    { id: 'ventas', label: 'Ventas', route: '/ventas/analytics', bgColor: '#C77A22', gradient: 'linear-gradient(135deg, #C77A22 0%, #7A3F0E 100%)', decorType: 'silk', decorColor: 'rgba(255,255,255,0.05)', iconFile: 'ingresos.svg', iconOpacity: 0.07, kpiValue: '', kpiLabel: '', statusDot: 'green', statusText: 'Analytics · KPIs', gridColumn: '2 / 3', gridRow: '2 / 3' },
    { id: 'comunicaciones', label: 'Comunicaciones', route: '/comunicaciones/dashboard', bgColor: '#4F88E3', gradient: 'linear-gradient(135deg, #4F88E3 0%, #1B56A8 100%)', decorType: 'silk', decorColor: 'rgba(255,255,255,0.05)', iconFile: 'comunicaciones.svg', iconOpacity: 0.07, kpiValue: '', kpiLabel: '', statusDot: 'green', statusText: 'Mail · WhatsApp · Resumen Ejecutivo IA', gridColumn: '3 / 4', gridRow: '2 / 4' },
    { id: 'autofomento', label: 'Control de equipo', route: '/control-equipo', bgColor: '#3A72CF', gradient: 'linear-gradient(135deg, #3A72CF 0%, #153E82 100%)', decorType: 'silk', decorColor: 'rgba(255,255,255,0.05)', iconFile: 'gps.svg', iconOpacity: 0.07, kpiValue: '', kpiLabel: '', statusDot: 'green', statusText: 'GPS · Cajas · Tractos · Thermos', gridColumn: '1 / 3', gridRow: '3 / 4' },
    // V32 Configuración — graphite más noble (ligero tinte azul-cálido frío para sofisticación)
    { id: 'config', label: 'Configuración', route: '/admin/configuracion', bgColor: '#3F4856', gradient: 'linear-gradient(135deg, #3F4856 0%, #0F1620 100%)', decorType: 'silk', decorColor: 'rgba(255,255,255,0.05)', iconFile: 'configuracion.svg', iconOpacity: 0.07, kpiValue: '', kpiLabel: '', statusDot: 'gray', statusText: '', gridColumn: '4 / 5', gridRow: '3 / 4' },
  ]

  const getCardStyle = (isHovered: boolean, isPressed: boolean, card: CardConfig): React.CSSProperties => {
    // V32 Material: 4 layers — upper-left ambient light + 180° luz/sombra + base 135°
    const materialGradient = `
      radial-gradient(ellipse at 0% 0%, rgba(255,255,255,0.09) 0%, rgba(255,255,255,0) 40%),
      linear-gradient(180deg, rgba(255,255,255,0.08) 0%, rgba(255,255,255,0.02) 20%, rgba(0,0,0,0.10) 100%),
      ${card.gradient}
    `

    let transform: string
    let boxShadow: string

    if (isPressed) {
      transform = 'translateY(1px)'
      boxShadow = `
        inset 0 1px 0 rgba(255,255,255,0.06),
        inset 0 3px 8px rgba(0,0,0,0.18),
        0 2px 6px rgba(0,0,0,0.14),
        0 1px 2px rgba(0,0,0,0.10)
      `
    } else if (isHovered) {
      // V32 Hover — lift 3px, shadow cleaner y más definida
      transform = 'translateY(-3px)'
      boxShadow = `
        inset 0 1px 0 rgba(255,255,255,0.18),
        inset 0 -1px 0 rgba(0,0,0,0.22),
        inset 0 -14px 26px rgba(0,0,0,0.10),
        0 18px 42px rgba(15,23,42,0.22),
        0 6px 14px rgba(15,23,42,0.14)
      `
    } else {
      // V32 Resting — shadow más limpia (menos capas, más definida)
      transform = 'translateY(0)'
      boxShadow = `
        inset 0 1px 0 rgba(255,255,255,0.16),
        inset 0 -1px 0 rgba(0,0,0,0.20),
        inset 0 -12px 22px rgba(0,0,0,0.08),
        0 14px 30px rgba(15,23,42,0.16),
        0 4px 10px rgba(15,23,42,0.10)
      `
    }

    return ({
      gridColumn: card.gridColumn,
      gridRow: card.gridRow,
      minHeight: 0,
      borderRadius: '20px',
      padding: '28px',
      background: materialGradient,
      border: '1px solid rgba(255,255,255,0.09)',
      cursor: 'pointer',
      position: 'relative',
      overflow: 'hidden',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'flex-start',
      justifyContent: 'flex-start',
      transition: 'transform 0.24s cubic-bezier(0.22,1,0.36,1), box-shadow 0.24s ease',
      transform,
      boxShadow,
    })
  }

  const renderDecor = (card: CardConfig, isHovered: boolean) => {
    const baseTransition = 'transform 0.9s cubic-bezier(0.22,1,0.36,1), opacity 0.4s ease'

    // V32 Planos geométricos — consolidados 2 por card, opacity 0.04-0.05 uniforme
    // Preservan la identidad visual pero con mayor intención y menos ruido
    const geometry = (() => {
      switch (card.id) {
        case 'oportunidades':
          return (
            <>
              {[0, 1, 2].map(i => (
                <div key={`opp-line-${i}`} style={{
                  position: 'absolute',
                  right: '42%', top: '60%',
                  width: '62%', height: '2px',
                  background: 'rgba(255,255,255,0.05)',
                  transformOrigin: '100% 50%',
                  transform: `rotate(-48deg) translateY(${-i * 22}px)`,
                  pointerEvents: 'none',
                }} />
              ))}
            </>
          )
        case 'servicio-clientes':
          return (
            <>
              <div style={{
                position: 'absolute',
                left: '44%', top: '-30%',
                width: '32%', height: '160%',
                background: 'rgba(255,255,255,0.04)',
                transform: 'rotate(26deg)',
                transformOrigin: 'top left',
                pointerEvents: 'none',
              }} />
              <div style={{
                position: 'absolute',
                left: '70%', top: '-30%',
                width: '18%', height: '160%',
                background: 'rgba(255,255,255,0.04)',
                transform: 'rotate(26deg)',
                transformOrigin: 'top left',
                pointerEvents: 'none',
              }} />
            </>
          )
        case 'comercial':
          return (
            <>
              <div style={{
                position: 'absolute',
                left: '44%', top: '-30%',
                width: '28%', height: '160%',
                background: 'rgba(255,255,255,0.04)',
                transform: 'rotate(18deg)',
                transformOrigin: 'center center',
                pointerEvents: 'none',
              }} />
              <div style={{
                position: 'absolute',
                left: '69%', top: '-30%',
                width: '16%', height: '160%',
                background: 'rgba(255,255,255,0.04)',
                transform: 'rotate(18deg)',
                transformOrigin: 'center center',
                pointerEvents: 'none',
              }} />
            </>
          )
        case 'operaciones':
          return (
            <>
              <div style={{
                position: 'absolute',
                right: '-4%', top: '10%',
                width: '26%', height: '140%',
                background: 'rgba(255,255,255,0.05)',
                transform: 'rotate(22deg)',
                transformOrigin: 'center center',
                pointerEvents: 'none',
              }} />
              <div style={{
                position: 'absolute',
                left: 'calc(34% - 8%)', top: '-30%',
                width: '14%', height: '160%',
                background: 'rgba(255,255,255,0.06)',
                transform: 'rotate(34deg)',
                transformOrigin: 'center center',
                pointerEvents: 'none',
              }} />
            </>
          )
        case 'ventas':
          return (
            <>
              <div style={{
                position: 'absolute',
                left: '52%', top: '-30%',
                width: '30%', height: '160%',
                background: 'rgba(255,255,255,0.05)',
                transform: 'rotate(38deg)',
                transformOrigin: 'top left',
                pointerEvents: 'none',
              }} />
              <div style={{
                position: 'absolute',
                left: '70%', top: '-30%',
                width: '12%', height: '160%',
                background: 'rgba(255,255,255,0.04)',
                transform: 'rotate(44deg)',
                transformOrigin: 'top left',
                pointerEvents: 'none',
              }} />
            </>
          )
        case 'comunicaciones':
          return (
            <>
              <div style={{
                position: 'absolute',
                left: 'calc(46% - 12%)', top: '-30%',
                width: '24%', height: '160%',
                background: 'rgba(255,255,255,0.04)',
                transform: 'rotate(20deg)',
                transformOrigin: 'center center',
                pointerEvents: 'none',
              }} />
              <div style={{
                position: 'absolute',
                left: 'calc(63% - 7%)', top: '-30%',
                width: '14%', height: '160%',
                background: 'rgba(255,255,255,0.04)',
                transform: 'rotate(28deg)',
                transformOrigin: 'center center',
                pointerEvents: 'none',
              }} />
            </>
          )
        case 'autofomento':
          return (
            <>
              <div style={{
                position: 'absolute',
                left: '22%', top: '-30%',
                width: '36%', height: '160%',
                background: 'rgba(255,255,255,0.04)',
                transform: 'rotate(24deg)',
                transformOrigin: 'center center',
                pointerEvents: 'none',
              }} />
              <div style={{
                position: 'absolute',
                left: '56%', top: '-30%',
                width: '22%', height: '160%',
                background: 'rgba(255,255,255,0.04)',
                transform: 'rotate(-12deg)',
                transformOrigin: 'center center',
                pointerEvents: 'none',
              }} />
            </>
          )
        case 'config':
          return (
            <>
              <div style={{
                position: 'absolute',
                left: '56%', top: '-30%',
                width: '28%', height: '160%',
                background: 'rgba(255,255,255,0.04)',
                transform: 'rotate(30deg)',
                transformOrigin: 'top left',
                pointerEvents: 'none',
              }} />
              <div style={{
                position: 'absolute',
                left: '74%', top: '-30%',
                width: '9%', height: '160%',
                background: 'rgba(255,255,255,0.04)',
                transform: 'rotate(33deg)',
                transformOrigin: 'top left',
                pointerEvents: 'none',
              }} />
            </>
          )
        default:
          return null
      }
    })()

    // V32 Icons: embedded, anchored bottom-right, opacity 0.07 base / 0.10 hover
    const iconSize = (() => {
      switch (card.id) {
        case 'operaciones': return 138
        case 'comercial': return 124
        case 'comunicaciones': return 118
        case 'servicio-clientes': return 116
        case 'oportunidades': return 108
        case 'autofomento': return 108
        case 'config': return 108
        default: return 100
      }
    })()
    const iconOpacity = isHovered ? 0.10 : 0.07
    const iconBottom = card.id === 'operaciones' ? '-26px' : '8px'
    const iconRight = card.id === 'operaciones' ? '8px' : '16px'
    const icon = card.iconFile ? (
      <div
        style={{
          position: 'absolute',
          right: iconRight,
          bottom: iconBottom,
          width: `${iconSize}px`,
          height: `${iconSize}px`,
          pointerEvents: 'none',
          transition: baseTransition,
          zIndex: 2,
          filter: 'drop-shadow(0 2px 6px rgba(0,0,0,0.10))',
        }}
      >
        <img
          src={`/icons/dashboard/${card.iconFile}`}
          alt=""
          style={{
            width: '100%',
            height: '100%',
            objectFit: 'contain',
            objectPosition: 'center center',
            filter: 'brightness(0) invert(1)',
            opacity: iconOpacity,
            transition: 'opacity 0.24s ease',
          }}
        />
      </div>
    ) : null

    return (
      <>
        {geometry}
        {icon}
      </>
    )
  }


  const renderCard = (card: CardConfig) => {
    const isHovered = hoveredCard === card.id
    const isPressed = pressedCard === card.id
    return (
      <div
        key={card.id}
        onClick={() => navigate(card.route)}
        onMouseEnter={() => setHoveredCard(card.id)}
        onMouseLeave={() => { setHoveredCard(null); setPressedCard(null) }}
        onMouseDown={() => setPressedCard(card.id)}
        onMouseUp={() => setPressedCard(null)}
        style={getCardStyle(isHovered, isPressed, card)}
      >
        {renderDecor(card, isHovered)}
        {/* V32 Gold dot — 6×6, top 18 right 18, glow restrained */}
        <div
          style={{
            position: 'absolute', top: '18px', right: '18px',
            width: '6px', height: '6px', borderRadius: '50%',
            background: '#D6A84F',
            boxShadow: '0 0 0 1.5px rgba(214,168,79,0.18), 0 0 8px rgba(214,168,79,0.35)',
            zIndex: 3,
          }}
        />
        {/* V32 Title — weight 800, letter-spacing -0.02em (menos compressed), text-shadow refined */}
        <div style={{
          fontFamily: "'Montserrat', sans-serif",
          fontSize: '22px',
          fontWeight: 800,
          color: '#FFFFFF',
          letterSpacing: '-0.02em',
          lineHeight: 1.15,
          marginBottom: 'auto',
          textAlign: 'left',
          width: '100%',
          position: 'relative',
          zIndex: 2,
          textShadow: '0 1px 0 rgba(255,255,255,0.08), 0 1px 3px rgba(0,0,0,0.24)',
        }}>
          {card.label}
        </div>
        {card.kpiValue !== '' && (
          <div
            className="kpi-value-num"
            style={{
              fontFamily: "'Montserrat', sans-serif",
              fontSize: '44px',
              fontWeight: 800,
              color: '#FFFFFF',
              letterSpacing: '-0.02em',
              textAlign: 'left', width: '100%', lineHeight: 1,
              marginTop: '6px',
              position: 'relative',
              zIndex: 2,
              textShadow: '0 1px 0 rgba(255,255,255,0.08), 0 1px 3px rgba(0,0,0,0.24)',
            }}
          >
            {card.kpiValue}
            {card.kpiLabel && (
              <span style={{
                fontSize: '15px',
                fontWeight: 600,
                color: 'rgba(255,255,255,0.70)',
                letterSpacing: '0.3px',
                marginLeft: '10px',
                textShadow: 'none',
                textTransform: 'lowercase' as const,
              }}>
                {card.kpiLabel}
              </span>
            )}
          </div>
        )}
        {/* V32 Subtitle — opacity 0.70 (más quiet/subordinado), shadow sutil */}
        <div style={{
          fontFamily: "'Montserrat', sans-serif",
          fontSize: '12px',
          fontWeight: 500,
          color: 'rgba(255,255,255,0.70)',
          letterSpacing: '0.2px',
          textAlign: 'left', width: '100%',
          marginTop: '8px',
          position: 'relative',
          zIndex: 3,
          whiteSpace: 'nowrap',
          overflow: 'hidden',
          textOverflow: 'ellipsis',
          boxSizing: 'border-box',
          textShadow: '0 1px 2px rgba(0,0,0,0.16)',
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
      // V32 Background — radial sutil para feel más intencional
      background: `
        radial-gradient(ellipse 120% 80% at 50% 0%, rgba(255,255,255,0.6) 0%, rgba(255,255,255,0) 60%),
        #ECEEF2
      `,
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
        padding: '36px 32px',
        display: 'flex',
        flexDirection: 'column',
        gap: '16px',
        overflow: 'hidden',
      }}>
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(4, 1fr)',
          gridTemplateRows: 'repeat(3, 1fr)',
          gap: '16px',
          flex: '0 0 72%',
          minHeight: 0,
        }}>
          {mainCards.map(renderCard)}
        </div>
      </div>
    </div>
  )
}
