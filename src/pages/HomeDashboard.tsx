// HomeDashboard V31 - Depth premium enterprise (spec literal, zero interpretation)
// Cambios sobre V30 autorizados por JJ 21/Abr/2026 noche tarde:
//   - Material dual 3-stops (luz 10% → luz 3% → sombra 10%) más dimensional
//   - Gradients más oscuros y contrastados (ventas naranja quemado profundo, grafito más carbón)
//   - Box-shadow pesado (inset -14px 26px + drop 16px 34px + drop 4px 10px)
//   - Border 1px blanco 10% + outline 1px negro 8%
//   - Title text-shadow triple (highlight top + shadow mid + soft drop)
//   - Subtitle 0.74 + shadow reforzada
//   - Hover controlado: translateY(-2px) sin scale, shadow reforzada
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

  // V31 Gradients base 135° — tonos más oscuros y contrastados para depth premium
  const mainCards: CardConfig[] = [
    { id: 'oportunidades', label: 'Oportunidades', route: '/ventas/mis-leads', bgColor: '#2763C4', gradient: 'linear-gradient(135deg, #2763C4 0%, #0A2D6F 100%)', decorType: 'silk', decorColor: 'rgba(255,255,255,0.05)', iconFile: 'oportunidades.svg', iconOpacity: 0.07, kpiValue: '', kpiLabel: '', statusDot: 'green', statusText: 'Mis Leads · Funnel · Oportunidades', gridColumn: '1 / 2', gridRow: '1 / 2' },
    { id: 'servicio-clientes', label: 'Servicio al Cliente', route: '/servicio/dashboard', bgColor: '#2B5FB5', gradient: 'linear-gradient(135deg, #2B5FB5 0%, #0B2E68 100%)', decorType: 'silk', decorColor: 'rgba(255,255,255,0.05)', iconFile: 'servicio-al-cliente.svg', iconOpacity: 0.07, kpiValue: '', kpiLabel: '', statusDot: 'green', statusText: 'Tickets · KPIs · Programación', gridColumn: '2 / 4', gridRow: '1 / 2' },
    { id: 'comercial', label: 'Comercial', route: '/ventas/dashboard', bgColor: '#2557A8', gradient: 'linear-gradient(135deg, #2557A8 0%, #082552 100%)', decorType: 'silk', decorColor: 'rgba(255,255,255,0.05)', iconFile: 'comercial.svg', iconOpacity: 0.07, kpiValue: '', kpiLabel: '', statusDot: 'green', statusText: 'Formatos · Cotizaciones · Analytics', gridColumn: '4 / 5', gridRow: '1 / 3' },
    { id: 'operaciones', label: 'Operaciones', route: '/operaciones/dashboard', bgColor: '#3D78D6', gradient: 'linear-gradient(135deg, #3D78D6 0%, #134287 100%)', decorType: 'silk', decorColor: 'rgba(255,255,255,0.06)', iconFile: 'camion-contenedor-v2.svg', iconOpacity: 0.07, kpiValue: '', kpiLabel: '', statusDot: 'green', statusText: 'Despachos · Seguimiento', gridColumn: '1 / 2', gridRow: '2 / 3' },
    { id: 'ventas', label: 'Ventas', route: '/ventas/analytics', bgColor: '#D7872E', gradient: 'linear-gradient(135deg, #D7872E 0%, #8C4710 100%)', decorType: 'silk', decorColor: 'rgba(255,255,255,0.05)', iconFile: 'ingresos.svg', iconOpacity: 0.07, kpiValue: '', kpiLabel: '', statusDot: 'green', statusText: 'Analytics · KPIs', gridColumn: '2 / 3', gridRow: '2 / 3' },
    { id: 'comunicaciones', label: 'Comunicaciones', route: '/comunicaciones/dashboard', bgColor: '#4F88E3', gradient: 'linear-gradient(135deg, #4F88E3 0%, #1B56A8 100%)', decorType: 'silk', decorColor: 'rgba(255,255,255,0.05)', iconFile: 'comunicaciones.svg', iconOpacity: 0.07, kpiValue: '', kpiLabel: '', statusDot: 'green', statusText: 'Mail · WhatsApp · Resumen Ejecutivo IA', gridColumn: '3 / 4', gridRow: '2 / 4' },
    { id: 'autofomento', label: 'Control de equipo', route: '/control-equipo', bgColor: '#3A72CF', gradient: 'linear-gradient(135deg, #3A72CF 0%, #153E82 100%)', decorType: 'silk', decorColor: 'rgba(255,255,255,0.05)', iconFile: 'gps.svg', iconOpacity: 0.07, kpiValue: '', kpiLabel: '', statusDot: 'green', statusText: 'GPS · Cajas · Tractos · Thermos', gridColumn: '1 / 3', gridRow: '3 / 4' },
    { id: 'config', label: 'Configuración', route: '/admin/configuracion', bgColor: '#434C59', gradient: 'linear-gradient(135deg, #434C59 0%, #101722 100%)', decorType: 'silk', decorColor: 'rgba(255,255,255,0.05)', iconFile: 'configuracion.svg', iconOpacity: 0.07, kpiValue: '', kpiLabel: '', statusDot: 'gray', statusText: '', gridColumn: '4 / 5', gridRow: '3 / 4' },
  ]

  const getCardStyle = (isHovered: boolean, isPressed: boolean, card: CardConfig): React.CSSProperties => {
    // V31 Material dual 3-stops: luz 10% → luz 3% @ 18% → sombra 10%
    const materialGradient = `linear-gradient(180deg, rgba(255,255,255,0.10) 0%, rgba(255,255,255,0.03) 18%, rgba(0,0,0,0.10) 100%), ${card.gradient}`

    let transform: string
    let boxShadow: string

    if (isPressed) {
      transform = 'translateY(1px) scale(0.995)'
      boxShadow = `
        inset 0 1px 0 rgba(255,255,255,0.08),
        inset 0 4px 10px rgba(0,0,0,0.22),
        0 3px 8px rgba(0,0,0,0.16),
        0 1px 3px rgba(0,0,0,0.12)
      `
    } else if (isHovered) {
      // V31 Hover: translateY(-2px) sin scale, shadow reforzada
      transform = 'translateY(-2px)'
      boxShadow = `
        inset 0 1px 0 rgba(255,255,255,0.14),
        inset 0 -14px 26px rgba(0,0,0,0.14),
        0 20px 40px rgba(0,0,0,0.24),
        0 6px 14px rgba(0,0,0,0.16)
      `
    } else {
      // V31 Resting — spec literal
      transform = 'translateY(0)'
      boxShadow = `
        inset 0 1px 0 rgba(255,255,255,0.14),
        inset 0 -14px 26px rgba(0,0,0,0.14),
        0 16px 34px rgba(0,0,0,0.22),
        0 4px 10px rgba(0,0,0,0.14)
      `
    }

    return ({
      gridColumn: card.gridColumn,
      gridRow: card.gridRow,
      minHeight: 0,
      borderRadius: '22px',
      padding: '26px',
      background: materialGradient,
      border: '1px solid rgba(255,255,255,0.10)',
      outline: '1px solid rgba(0,0,0,0.08)',
      outlineOffset: '-1px',
      cursor: 'pointer',
      position: 'relative',
      overflow: 'hidden',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'flex-start',
      justifyContent: 'flex-start',
      transition: 'transform 0.22s ease, box-shadow 0.22s ease',
      transform,
      boxShadow,
    })
  }

  const renderDecor = (card: CardConfig, isHovered: boolean) => {
    const baseTransition = 'transform 1s cubic-bezier(0.16,1,0.3,1), opacity 0.6s ease'

    // V31: overlays/patterns opacity max 0.06
    const geometry = (() => {
      switch (card.id) {
        case 'oportunidades':
          return (
            <>
              {[0, 1, 2].map(i => (
                <div key={`opp-line-${i}`} style={{
                  position: 'absolute',
                  right: '42%', top: '60%',
                  width: '62%', height: '3px',
                  background: 'rgba(255,255,255,0.05)',
                  transformOrigin: '100% 50%',
                  transform: `rotate(-48deg) translateY(${-i * 24}px)`,
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
                left: '42%', top: '-30%',
                width: '34%', height: '160%',
                background: 'rgba(255,255,255,0.04)',
                transform: 'rotate(26deg)',
                transformOrigin: 'top left',
                pointerEvents: 'none',
              }} />
              <div style={{
                position: 'absolute',
                left: '69%', top: '-30%',
                width: '22%', height: '160%',
                background: 'rgba(255,255,255,0.04)',
                transform: 'rotate(26deg)',
                transformOrigin: 'top left',
                pointerEvents: 'none',
              }} />
              <div style={{
                position: 'absolute',
                left: 0, top: 0,
                width: '100%', height: '30%',
                background: 'linear-gradient(180deg, rgba(255,255,255,0.06) 0%, rgba(255,255,255,0) 100%)',
                pointerEvents: 'none',
              }} />
            </>
          )
        case 'comercial':
          return (
            <>
              <div style={{
                position: 'absolute',
                left: 'calc(58% - 14%)', top: '-30%',
                width: '28%', height: '160%',
                background: 'rgba(255,255,255,0.04)',
                transform: 'rotate(18deg)',
                transformOrigin: 'center center',
                pointerEvents: 'none',
              }} />
              <div style={{
                position: 'absolute',
                left: 'calc(78% - 9%)', top: '-30%',
                width: '18%', height: '160%',
                background: 'rgba(255,255,255,0.04)',
                transform: 'rotate(18deg)',
                transformOrigin: 'center center',
                pointerEvents: 'none',
              }} />
              <div style={{
                position: 'absolute',
                right: 0, top: 0,
                width: '16%', height: '18%',
                background: 'rgba(255,255,255,0.06)',
                clipPath: 'polygon(28% 0%, 100% 0%, 100% 72%, 0% 100%)',
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
                width: '16%', height: '160%',
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
                width: '31%', height: '160%',
                background: 'rgba(255,255,255,0.05)',
                transform: 'rotate(38deg)',
                transformOrigin: 'top left',
                pointerEvents: 'none',
              }} />
              <div style={{
                position: 'absolute',
                left: '70%', top: '-30%',
                width: '14%', height: '160%',
                background: 'rgba(255,255,255,0.04)',
                transform: 'rotate(44deg)',
                transformOrigin: 'top left',
                pointerEvents: 'none',
              }} />
              <div style={{
                position: 'absolute',
                left: '60%', top: '18%',
                width: '120px', height: '120px',
                transform: 'translate(-50%, -50%)',
                background: 'radial-gradient(circle, rgba(255,255,255,0.06) 0%, rgba(255,255,255,0) 70%)',
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
                left: '20%', top: '-30%',
                width: '38%', height: '160%',
                background: 'rgba(255,255,255,0.04)',
                transform: 'rotate(24deg)',
                transformOrigin: 'center center',
                pointerEvents: 'none',
              }} />
              <div style={{
                position: 'absolute',
                left: '55%', top: '-30%',
                width: '24%', height: '160%',
                background: 'rgba(255,255,255,0.04)',
                transform: 'rotate(-12deg)',
                transformOrigin: 'center center',
                pointerEvents: 'none',
              }} />
              <div style={{
                position: 'absolute',
                left: '27%', top: 0,
                width: '46%', height: '18%',
                background: 'radial-gradient(ellipse at center top, rgba(255,255,255,0.06) 0%, rgba(255,255,255,0) 80%)',
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
                width: '29%', height: '160%',
                background: 'rgba(255,255,255,0.04)',
                transform: 'rotate(30deg)',
                transformOrigin: 'top left',
                pointerEvents: 'none',
              }} />
              <div style={{
                position: 'absolute',
                left: '73%', top: '-30%',
                width: '10%', height: '160%',
                background: 'rgba(255,255,255,0.04)',
                transform: 'rotate(33deg)',
                transformOrigin: 'top left',
                pointerEvents: 'none',
              }} />
              <div style={{
                position: 'absolute',
                left: '76%', top: '20%',
                width: '90px', height: '90px',
                transform: 'translate(-50%, -50%)',
                background: 'radial-gradient(circle, rgba(255,255,255,0.06) 0%, rgba(255,255,255,0) 70%)',
                pointerEvents: 'none',
              }} />
            </>
          )
        default:
          return null
      }
    })()

    // V31 Icons: opacity 0.07 + drop-shadow filter
    const iconSize = (() => {
      switch (card.id) {
        case 'operaciones': return 143
        case 'comercial': return 127
        case 'comunicaciones': return 120
        case 'servicio-clientes': return 118
        case 'oportunidades': return 110
        case 'autofomento': return 110
        case 'config': return 110
        default: return 100
      }
    })()
    const iconScale = isHovered ? 1.03 : 1
    const iconBottom = card.id === 'operaciones' ? '-28px' : '6px'
    const iconRight = card.id === 'operaciones' ? '6px' : '14px'
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
          transform: `scale(${iconScale})`,
          transformOrigin: 'bottom right',
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
            opacity: 0.07,
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
        {/* Status dot V31 — dorado estático spec literal */}
        <div
          style={{
            position: 'absolute', top: '16px', right: '16px',
            width: '7px', height: '7px', borderRadius: '50%',
            background: '#D6A84F',
            boxShadow: '0 0 6px rgba(214,168,79,0.55), 0 0 12px rgba(214,168,79,0.22)',
            zIndex: 3,
          }}
        />
        {/* Title V31 — weight 800, letter-spacing -0.025em, text-shadow TRIPLE */}
        <div style={{
          fontFamily: "'Montserrat', sans-serif",
          fontSize: '22px',
          fontWeight: 800,
          color: '#FFFFFF',
          letterSpacing: '-0.025em',
          lineHeight: 1.15,
          marginBottom: 'auto',
          textAlign: 'left',
          width: '100%',
          position: 'relative',
          zIndex: 2,
          textShadow: '0 1px 0 rgba(255,255,255,0.08), 0 2px 4px rgba(0,0,0,0.24), 0 6px 14px rgba(0,0,0,0.10)',
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
              letterSpacing: '-1.6px',
              textAlign: 'left', width: '100%', lineHeight: 1,
              marginTop: '6px',
              position: 'relative',
              zIndex: 2,
              textShadow: '0 1px 0 rgba(255,255,255,0.08), 0 2px 4px rgba(0,0,0,0.24), 0 6px 14px rgba(0,0,0,0.10)',
            }}
          >
            {card.kpiValue}
            {card.kpiLabel && (
              <span style={{
                fontSize: '15px',
                fontWeight: 600,
                color: 'rgba(255,255,255,0.74)',
                letterSpacing: '0.4px',
                marginLeft: '10px',
                textShadow: 'none',
                textTransform: 'lowercase' as const,
              }}>
                {card.kpiLabel}
              </span>
            )}
          </div>
        )}
        {/* Subtitle V31 — opacity 0.74 + text-shadow 0.18 */}
        <div style={{
          fontFamily: "'Montserrat', sans-serif",
          fontSize: '12px',
          fontWeight: 600,
          color: 'rgba(255,255,255,0.74)',
          letterSpacing: '0.3px',
          textAlign: 'left', width: '100%',
          marginTop: '6px',
          position: 'relative',
          zIndex: 3,
          whiteSpace: 'nowrap',
          overflow: 'hidden',
          textOverflow: 'ellipsis',
          boxSizing: 'border-box',
          textShadow: '0 1px 2px rgba(0,0,0,0.18)',
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
      background: '#ECEEF2',
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
        background: '#ECEEF2',
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
