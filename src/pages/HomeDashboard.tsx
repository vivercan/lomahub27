// HomeDashboard V30 - Distribución estricta 6 azul + 1 naranja (Ventas) + 1 grafito (Configuración)
// Cambios sobre V29 autorizados por JJ 21/Abr/2026 noche (spec literal, no interpretación):
//   - Ventas cambia de azul → naranja ejecutivo quemado #E08A2E → #9A4E12
//   - Comunicaciones azul reajustado #5A92EC → #1F57A5
//   - Control de equipo azul reajustado #3D73D1 → #163E84
//   - Material dual: gradient blanco/negro 180° sobrepuesto sobre gradient base 135°
//   - Box-shadow spec literal (inset highlight + inset shadow + drop shadow doble)
//   - Dot estático con box-shadow dual (sin pulse animation — sobrio enterprise)
//   - Title weight 800 + letter-spacing -0.02em + text-shadow dual
//   - Subtitle opacity 0.70 + text-shadow
//   - Icons opacity 0.08 + drop-shadow filter
//   - Overlays/patterns max 0.07
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

const CARD_STATUS_PADDING_RIGHT = '110px'

// V30: Dot estático dorado — sin pulse animation (sobrio enterprise)
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

  // V30 Distribución estricta: 6 azul + 1 naranja (Ventas) + 1 grafito (Configuración)
  // Gradient base 135° se combina en getCardStyle con capa material 180° (luz/sombra)
  const mainCards: CardConfig[] = [
    { id: 'oportunidades', label: 'Oportunidades', route: '/ventas/mis-leads', bgColor: '#1E5BB8', gradient: 'linear-gradient(135deg, #1E5BB8 0%, #0A2A66 100%)', decorType: 'silk', decorColor: 'rgba(255,255,255,0.05)', iconFile: 'oportunidades.svg', iconOpacity: 0.08, kpiValue: '', kpiLabel: '', statusDot: 'green', statusText: 'Mis Leads · Funnel · Oportunidades', gridColumn: '1 / 2', gridRow: '1 / 2' },
    { id: 'servicio-clientes', label: 'Servicio al Cliente', route: '/servicio/dashboard', bgColor: '#2A5DB0', gradient: 'linear-gradient(135deg, #2A5DB0 0%, #0C2A5A 100%)', decorType: 'silk', decorColor: 'rgba(255,255,255,0.05)', iconFile: 'servicio-al-cliente.svg', iconOpacity: 0.08, kpiValue: '', kpiLabel: '', statusDot: 'green', statusText: 'Tickets · KPIs · Programación', gridColumn: '2 / 4', gridRow: '1 / 2' },
    { id: 'comercial', label: 'Comercial', route: '/ventas/dashboard', bgColor: '#1F57A5', gradient: 'linear-gradient(135deg, #1F57A5 0%, #092555 100%)', decorType: 'silk', decorColor: 'rgba(255,255,255,0.05)', iconFile: 'comercial.svg', iconOpacity: 0.08, kpiValue: '', kpiLabel: '', statusDot: 'green', statusText: 'Formatos · Cotizaciones · Analytics', gridColumn: '4 / 5', gridRow: '1 / 3' },
    { id: 'operaciones', label: 'Operaciones', route: '/operaciones/dashboard', bgColor: '#2F6CD1', gradient: 'linear-gradient(135deg, #2F6CD1 0%, #123A78 100%)', decorType: 'silk', decorColor: 'rgba(255,255,255,0.07)', iconFile: 'camion-contenedor-v2.svg', iconOpacity: 0.08, kpiValue: '', kpiLabel: '', statusDot: 'green', statusText: 'Despachos · Seguimiento', gridColumn: '1 / 2', gridRow: '2 / 3' },
    { id: 'ventas', label: 'Ventas', route: '/ventas/analytics', bgColor: '#E08A2E', gradient: 'linear-gradient(135deg, #E08A2E 0%, #9A4E12 100%)', decorType: 'silk', decorColor: 'rgba(255,255,255,0.05)', iconFile: 'ingresos.svg', iconOpacity: 0.08, kpiValue: '', kpiLabel: '', statusDot: 'green', statusText: 'Analytics · KPIs', gridColumn: '2 / 3', gridRow: '2 / 3' },
    { id: 'comunicaciones', label: 'Comunicaciones', route: '/comunicaciones/dashboard', bgColor: '#5A92EC', gradient: 'linear-gradient(135deg, #5A92EC 0%, #1F57A5 100%)', decorType: 'silk', decorColor: 'rgba(255,255,255,0.05)', iconFile: 'comunicaciones.svg', iconOpacity: 0.08, kpiValue: '', kpiLabel: '', statusDot: 'green', statusText: 'Mail · WhatsApp · Resumen Ejecutivo IA', gridColumn: '3 / 4', gridRow: '2 / 4' },
    { id: 'autofomento', label: 'Control de equipo', route: '/control-equipo', bgColor: '#3D73D1', gradient: 'linear-gradient(135deg, #3D73D1 0%, #163E84 100%)', decorType: 'silk', decorColor: 'rgba(255,255,255,0.05)', iconFile: 'gps.svg', iconOpacity: 0.08, kpiValue: '', kpiLabel: '', statusDot: 'green', statusText: 'GPS · Cajas · Tractos · Thermos', gridColumn: '1 / 3', gridRow: '3 / 4' },
    { id: 'config', label: 'Configuración', route: '/admin/configuracion', bgColor: '#374151', gradient: 'linear-gradient(135deg, #374151 0%, #111827 100%)', decorType: 'silk', decorColor: 'rgba(255,255,255,0.05)', iconFile: 'configuracion.svg', iconOpacity: 0.08, kpiValue: '', kpiLabel: '', statusDot: 'gray', statusText: '', gridColumn: '4 / 5', gridRow: '3 / 4' },
  ]

  const getCardStyle = (isHovered: boolean, isPressed: boolean, card: CardConfig): React.CSSProperties => {
    // Material V30: capa de luz/sombra 180° superpuesta sobre gradient base 135°
    const materialGradient = `linear-gradient(180deg, rgba(255,255,255,0.05), rgba(0,0,0,0.08)), ${card.gradient}`

    let transform: string
    let boxShadow: string

    if (isPressed) {
      transform = 'translateY(2px) scale(0.985)'
      boxShadow = `
        inset 0 1px 0 rgba(255,255,255,0.06),
        inset 0 3px 8px rgba(0,0,0,0.18),
        0 2px 6px rgba(0,0,0,0.14),
        0 1px 2px rgba(0,0,0,0.12)
      `
    } else if (isHovered) {
      transform = 'translateY(-6px) scale(1.01)'
      boxShadow = `
        inset 0 1px 0 rgba(255,255,255,0.14),
        inset 0 -10px 20px rgba(0,0,0,0.08),
        0 20px 48px rgba(0,0,0,0.28),
        0 6px 14px rgba(0,0,0,0.18),
        0 12px 32px rgba(214,168,79,0.18)
      `
    } else {
      // Resting — spec literal JJ
      transform = 'translateY(0) scale(1)'
      boxShadow = `
        inset 0 1px 0 rgba(255,255,255,0.10),
        inset 0 -10px 20px rgba(0,0,0,0.08),
        0 10px 30px rgba(0,0,0,0.18),
        0 3px 8px rgba(0,0,0,0.12)
      `
    }

    return ({
      gridColumn: card.gridColumn,
      gridRow: card.gridRow,
      minHeight: 0,
      borderRadius: '22px',
      padding: '26px',
      background: materialGradient,
      border: '1px solid rgba(255,255,255,0.08)',
      cursor: 'pointer',
      position: 'relative',
      overflow: 'hidden',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'flex-start',
      justifyContent: 'flex-start',
      transition: 'transform 0.3s ease, box-shadow 0.3s ease, border-color 0.3s ease',
      transform,
      boxShadow,
    })
  }

  const renderDecor = (card: CardConfig, isHovered: boolean) => {
    const baseTransition = 'transform 1s cubic-bezier(0.16,1,0.3,1), opacity 0.6s ease'

    // V30: overlays blancos rango 0.05–0.07 MAX
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
                background: 'rgba(255,255,255,0.05)',
                transform: 'rotate(26deg)',
                transformOrigin: 'top left',
                pointerEvents: 'none',
              }} />
              <div style={{
                position: 'absolute',
                left: '69%', top: '-30%',
                width: '22%', height: '160%',
                background: 'rgba(255,255,255,0.05)',
                transform: 'rotate(26deg)',
                transformOrigin: 'top left',
                pointerEvents: 'none',
              }} />
              <div style={{
                position: 'absolute',
                left: 0, top: 0,
                width: '100%', height: '30%',
                background: 'linear-gradient(180deg, rgba(255,255,255,0.07) 0%, rgba(255,255,255,0) 100%)',
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
                background: 'rgba(255,255,255,0.05)',
                transform: 'rotate(18deg)',
                transformOrigin: 'center center',
                pointerEvents: 'none',
              }} />
              <div style={{
                position: 'absolute',
                left: 'calc(78% - 9%)', top: '-30%',
                width: '18%', height: '160%',
                background: 'rgba(255,255,255,0.05)',
                transform: 'rotate(18deg)',
                transformOrigin: 'center center',
                pointerEvents: 'none',
              }} />
              <div style={{
                position: 'absolute',
                right: 0, top: 0,
                width: '16%', height: '18%',
                background: 'rgba(255,255,255,0.07)',
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
                background: 'rgba(255,255,255,0.06)',
                transform: 'rotate(22deg)',
                transformOrigin: 'center center',
                pointerEvents: 'none',
              }} />
              <div style={{
                position: 'absolute',
                left: 'calc(34% - 8%)', top: '-30%',
                width: '16%', height: '160%',
                background: 'rgba(255,255,255,0.07)',
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
                background: 'rgba(255,255,255,0.06)',
                transform: 'rotate(38deg)',
                transformOrigin: 'top left',
                pointerEvents: 'none',
              }} />
              <div style={{
                position: 'absolute',
                left: '70%', top: '-30%',
                width: '14%', height: '160%',
                background: 'rgba(255,255,255,0.05)',
                transform: 'rotate(44deg)',
                transformOrigin: 'top left',
                pointerEvents: 'none',
              }} />
              <div style={{
                position: 'absolute',
                left: '60%', top: '18%',
                width: '120px', height: '120px',
                transform: 'translate(-50%, -50%)',
                background: 'radial-gradient(circle, rgba(255,255,255,0.07) 0%, rgba(255,255,255,0) 70%)',
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
                background: 'rgba(255,255,255,0.05)',
                transform: 'rotate(20deg)',
                transformOrigin: 'center center',
                pointerEvents: 'none',
              }} />
              <div style={{
                position: 'absolute',
                left: 'calc(63% - 7%)', top: '-30%',
                width: '14%', height: '160%',
                background: 'rgba(255,255,255,0.05)',
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
                background: 'rgba(255,255,255,0.05)',
                transform: 'rotate(24deg)',
                transformOrigin: 'center center',
                pointerEvents: 'none',
              }} />
              <div style={{
                position: 'absolute',
                left: '55%', top: '-30%',
                width: '24%', height: '160%',
                background: 'rgba(255,255,255,0.05)',
                transform: 'rotate(-12deg)',
                transformOrigin: 'center center',
                pointerEvents: 'none',
              }} />
              <div style={{
                position: 'absolute',
                left: '27%', top: 0,
                width: '46%', height: '18%',
                background: 'radial-gradient(ellipse at center top, rgba(255,255,255,0.07) 0%, rgba(255,255,255,0) 80%)',
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
                background: 'rgba(255,255,255,0.05)',
                transform: 'rotate(30deg)',
                transformOrigin: 'top left',
                pointerEvents: 'none',
              }} />
              <div style={{
                position: 'absolute',
                left: '73%', top: '-30%',
                width: '10%', height: '160%',
                background: 'rgba(255,255,255,0.05)',
                transform: 'rotate(33deg)',
                transformOrigin: 'top left',
                pointerEvents: 'none',
              }} />
              <div style={{
                position: 'absolute',
                left: '76%', top: '20%',
                width: '90px', height: '90px',
                transform: 'translate(-50%, -50%)',
                background: 'radial-gradient(circle, rgba(255,255,255,0.07) 0%, rgba(255,255,255,0) 70%)',
                pointerEvents: 'none',
              }} />
            </>
          )
        default:
          return null
      }
    })()

    // V30 Icons: opacity 0.08 + drop-shadow filter
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
    const iconScale = isHovered ? 1.05 : 1
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
            opacity: 0.08,
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
        {/* Status dot V30 — dorado estático, spec literal */}
        <div
          style={{
            position: 'absolute', top: '16px', right: '16px',
            width: '7px', height: '7px', borderRadius: '50%',
            background: '#D6A84F',
            boxShadow: '0 0 6px rgba(214,168,79,0.55), 0 0 12px rgba(214,168,79,0.22)',
            zIndex: 3,
          }}
        />
        {/* Title V30 — weight 800, letter-spacing -0.02em, text-shadow dual */}
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
          textShadow: '0 1px 0 rgba(255,255,255,0.06), 0 2px 5px rgba(0,0,0,0.22)',
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
              textShadow: '0 1px 0 rgba(255,255,255,0.06), 0 2px 5px rgba(0,0,0,0.22)',
            }}
          >
            {card.kpiValue}
            {card.kpiLabel && (
              <span style={{
                fontSize: '15px',
                fontWeight: 600,
                color: 'rgba(255,255,255,0.70)',
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
        {/* Subtitle V30 — opacity 0.70 + text-shadow */}
        <div style={{
          fontFamily: "'Montserrat', sans-serif",
          fontSize: '12px',
          fontWeight: 600,
          color: 'rgba(255,255,255,0.70)',
          letterSpacing: '0.3px',
          textAlign: 'left', width: '100%',
          marginTop: '6px',
          position: 'relative',
          zIndex: 3,
          whiteSpace: 'nowrap',
          overflow: 'hidden',
          textOverflow: 'ellipsis',
          boxSizing: 'border-box',
          textShadow: '0 1px 2px rgba(0,0,0,0.14)',
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
