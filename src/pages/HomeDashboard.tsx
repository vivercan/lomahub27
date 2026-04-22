// HomeDashboard V29 - Paleta azul unificada premium + acento dorado #D6A84F
// Cambios sobre V28 autorizados por JJ 21/Abr/2026 noche (refresh premium enterprise):
//   - ELIMINADO cualquier naranja y cualquier verde fosforescente
//   - 8 cards con gradientes diagonales 135° azules (Configuración gris oscuro)
//   - Acento global único: dorado #D6A84F (dots, outline, hover glow)
//   - Estética sobria, corporativa, plataforma enterprise de alto nivel
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

// Espacio reservado a la derecha del texto de status para no chocar con el icono de la card
// (icon 83px + margen derecho 18px + padding ~9px → 110px)
const CARD_STATUS_PADDING_RIGHT = '110px'

// Acento dorado unificado — reemplaza verde/naranja de versiones previas
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
    cajasGPS: 0, thermosGPS: 0, // unidades reportando posición vía WidgeTech
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
      // TODO WidgeTech: reemplazar por conteo real desde endpoint de GPS.
      // Por ahora distribuimos el total de unidades_gps en dos categorías
      // asumiendo que el ~30% son thermos y el ~70% cajas secas (calibrar con datos reales)
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

  // V29 Paleta azul premium unificada — todos los cards con gradient 135° top-left → bottom-right
  const mainCards: CardConfig[] = [
    { id: 'oportunidades', label: 'Oportunidades', route: '/ventas/mis-leads', bgColor: '#1E5BB8', gradient: 'linear-gradient(135deg, #1E5BB8 0%, #0A2A66 100%)', decorType: 'silk', decorColor: 'rgba(255,255,255,0.06)', iconFile: 'oportunidades.svg', iconOpacity: 0.12, kpiValue: '', kpiLabel: '', statusDot: 'green', statusText: 'Mis Leads · Funnel · Oportunidades', gridColumn: '1 / 2', gridRow: '1 / 2' },
    { id: 'servicio-clientes', label: 'Servicio al Cliente', route: '/servicio/dashboard', bgColor: '#2A5DB0', gradient: 'linear-gradient(135deg, #2A5DB0 0%, #0C2A5A 100%)', decorType: 'silk', decorColor: 'rgba(255,255,255,0.06)', iconFile: 'servicio-al-cliente.svg', iconOpacity: 0.12, kpiValue: '', kpiLabel: '', statusDot: 'green', statusText: 'Tickets · KPIs · Programación', gridColumn: '2 / 4', gridRow: '1 / 2' },
    { id: 'comercial', label: 'Comercial', route: '/ventas/dashboard', bgColor: '#1F57A5', gradient: 'linear-gradient(135deg, #1F57A5 0%, #092555 100%)', decorType: 'silk', decorColor: 'rgba(255,255,255,0.06)', iconFile: 'comercial.svg', iconOpacity: 0.12, kpiValue: '', kpiLabel: '', statusDot: 'green', statusText: 'Formatos · Cotizaciones · Analytics', gridColumn: '4 / 5', gridRow: '1 / 3' },
    { id: 'operaciones', label: 'Operaciones', route: '/operaciones/dashboard', bgColor: '#2F6CD1', gradient: 'linear-gradient(135deg, #2F6CD1 0%, #123A78 100%)', decorType: 'silk', decorColor: 'rgba(255,255,255,0.08)', iconFile: 'camion-contenedor-v2.svg', iconOpacity: 0.12, kpiValue: '', kpiLabel: '', statusDot: 'green', statusText: 'Despachos · Seguimiento', gridColumn: '1 / 2', gridRow: '2 / 3' },
    { id: 'ventas', label: 'Ventas', route: '/ventas/analytics', bgColor: '#2C6FE0', gradient: 'linear-gradient(135deg, #2C6FE0 0%, #102F6A 100%)', decorType: 'silk', decorColor: 'rgba(255,255,255,0.06)', iconFile: 'ingresos.svg', iconOpacity: 0.12, kpiValue: '', kpiLabel: '', statusDot: 'green', statusText: 'Analytics · KPIs', gridColumn: '2 / 3', gridRow: '2 / 3' },
    { id: 'comunicaciones', label: 'Comunicaciones', route: '/comunicaciones/dashboard', bgColor: '#3A7AE0', gradient: 'linear-gradient(135deg, #3A7AE0 0%, #12366F 100%)', decorType: 'silk', decorColor: 'rgba(255,255,255,0.06)', iconFile: 'comunicaciones.svg', iconOpacity: 0.12, kpiValue: '', kpiLabel: '', statusDot: 'green', statusText: 'Mail · WhatsApp · Resumen Ejecutivo IA', gridColumn: '3 / 4', gridRow: '2 / 4' },
    { id: 'autofomento', label: 'Control de equipo', route: '/control-equipo', bgColor: '#2D68C2', gradient: 'linear-gradient(135deg, #2D68C2 0%, #0F2E63 100%)', decorType: 'silk', decorColor: 'rgba(255,255,255,0.06)', iconFile: 'gps.svg', iconOpacity: 0.12, kpiValue: '', kpiLabel: '', statusDot: 'green', statusText: 'GPS · Cajas · Tractos · Thermos', gridColumn: '1 / 3', gridRow: '3 / 4' },
    { id: 'config', label: 'Configuración', route: '/admin/configuracion', bgColor: '#374151', gradient: 'linear-gradient(135deg, #374151 0%, #111827 100%)', decorType: 'silk', decorColor: 'rgba(255,255,255,0.06)', iconFile: 'configuracion.svg', iconOpacity: 0.12, kpiValue: '', kpiLabel: '', statusDot: 'gray', statusText: '', gridColumn: '4 / 5', gridRow: '3 / 4' },
  ]

  // (helper hexToRgba eliminado — fue dead code tras el rediseño premium)

  const getCardStyle = (isHovered: boolean, isPressed: boolean, card: CardConfig): React.CSSProperties => {
    // Comunicaciones: spec 6 → sombra interna extra solo lado derecho
    const extraShadow = card.id === 'comunicaciones'
      ? ', inset -24px 0 40px rgba(0,0,0,0.10)'
      : ''

    // Determinar transform y boxShadow según estado: pressed > hovered > resting
    let transform: string
    let boxShadow: string

    if (isPressed) {
      // PRESSED — card se hunde, sombras mínimas, bisel invertido
      transform = 'translateY(3px) scale(0.982)'
      boxShadow = `
        0 1px 2px rgba(0,0,0,0.50),
        0 2px 6px rgba(0,0,0,0.40),
        0 4px 12px -2px rgba(0,0,0,0.35),
        inset 0 -1px 0 rgba(255,255,255,0.18),
        inset -1px 0 0 rgba(255,255,255,0.06),
        inset 0 3px 6px rgba(0,0,0,0.55),
        inset 2px 0 0 rgba(0,0,0,0.15),
        inset 0 8px 20px rgba(0,0,0,0.18)
      `
    } else if (isHovered) {
      transform = 'translateY(-10px) scale(1.012)'
      boxShadow = `
        0 12px 32px rgba(214,168,79,0.18),
        0 4px 8px rgba(0,0,0,0.80),
        0 18px 36px -6px rgba(0,0,0,0.60),
        0 50px 90px -16px rgba(0,0,0,0.65),
        inset 0 2px 0 rgba(255,255,255,0.35),
        inset 2px 0 0 rgba(255,255,255,0.12),
        inset 0 -2px 0 rgba(0,0,0,0.50),
        inset -2px 0 0 rgba(0,0,0,0.25),
        inset 0 0 30px rgba(0,0,0,0.20)
      `
    } else {
      transform = 'translateY(0) scale(1)'
      boxShadow = `
        0 3px 6px rgba(0,0,0,0.40),
        0 10px 20px rgba(0,0,0,0.30),
        0 24px 48px -6px rgba(0,0,0,0.35),
        0 48px 80px -16px rgba(0,0,0,0.25),
        inset 0 2px 0 rgba(255,255,255,0.30),
        inset 2px 0 0 rgba(255,255,255,0.10),
        inset 0 -2px 0 rgba(0,0,0,0.45),
        inset -2px 0 0 rgba(0,0,0,0.20),
        inset 0 24px 40px rgba(255,255,255,0.05),
        inset 0 -20px 30px rgba(0,0,0,0.22)${extraShadow}
      `
    }

    return ({
      gridColumn: card.gridColumn,
      gridRow: card.gridRow,
      minHeight: 0,
      borderRadius: '22px',
      padding: '26px',
      background: card.gradient,
      border: 'none',
      outline: isHovered || isPressed
        ? '1.5px solid rgba(214,168,79,0.60)'
        : '1.5px solid rgba(255,255,255,0.08)',
      outlineOffset: '-1px',
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

  // renderDecor — geometría EXACTA por card según spec numérico.
  // V29: overlays blanco reducidos a opacity máximo 0.10 (spec JJ)
  const renderDecor = (card: CardConfig, isHovered: boolean) => {
    const baseTransition = 'transform 1s cubic-bezier(0.16,1,0.3,1), opacity 0.6s ease'

    // Geometría exacta por card
    const geometry = (() => {
      switch (card.id) {
        // CARD 1 — Oportunidades: 3 líneas diagonales 48°
        case 'oportunidades':
          return (
            <>
              {[0, 1, 2].map(i => (
                <div key={`opp-line-${i}`} style={{
                  position: 'absolute',
                  right: '42%', top: '60%',
                  width: '62%', height: '3px',
                  background: 'rgba(255,255,255,0.06)',
                  transformOrigin: '100% 50%',
                  transform: `rotate(-48deg) translateY(${-i * 24}px)`,
                  pointerEvents: 'none',
                }} />
              ))}
            </>
          )
        // CARD 2 — Servicio al Cliente: 2 planos diagonales grandes, 26°
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
                background: 'linear-gradient(180deg, rgba(255,255,255,0.08) 0%, rgba(255,255,255,0) 100%)',
                pointerEvents: 'none',
              }} />
            </>
          )
        // CARD 3 — Comercial: 2 planos facetados 18°
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
        // CARD 4 — Operaciones: franja luminosa diagonal 34° + plano secundario 22°
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
                background: 'rgba(255,255,255,0.10)',
                transform: 'rotate(34deg)',
                transformOrigin: 'center center',
                pointerEvents: 'none',
              }} />
            </>
          )
        // CARD 5 — Ventas: 2 planos angulares + brillo focal 120px
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
                background: 'radial-gradient(circle, rgba(255,255,255,0.10) 0%, rgba(255,255,255,0) 70%)',
                pointerEvents: 'none',
              }} />
            </>
          )
        // CARD 6 — Comunicaciones: 2 planos largos
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
        // CARD 7 — Control de equipo: 2 planos cruzados + brillo superior
        case 'autofomento':
          return (
            <>
              <div style={{
                position: 'absolute',
                left: '20%', top: '-30%',
                width: '38%', height: '160%',
                background: 'rgba(255,255,255,0.03)',
                transform: 'rotate(24deg)',
                transformOrigin: 'center center',
                pointerEvents: 'none',
              }} />
              <div style={{
                position: 'absolute',
                left: '55%', top: '-30%',
                width: '24%', height: '160%',
                background: 'rgba(255,255,255,0.03)',
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
        // CARD 8 — Configuración: 1 plano 30° + 1 plano 33° + brillo 90px
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
                background: 'radial-gradient(circle, rgba(255,255,255,0.08) 0%, rgba(255,255,255,0) 70%)',
                pointerEvents: 'none',
              }} />
            </>
          )
        default:
          return null
      }
    })()

    // Íconos planos, integrados al material del card — V29 opacity 0.12 sobrio
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
            opacity: 0.12,
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
        {/* Filo de luz superior — 2px brillante */}
        <div style={{
          position: 'absolute',
          left: '2px', top: 0, right: '2px',
          height: '2px',
          background: 'linear-gradient(90deg, rgba(255,255,255,0) 0%, rgba(255,255,255,0.45) 15%, rgba(255,255,255,0.55) 50%, rgba(255,255,255,0.45) 85%, rgba(255,255,255,0) 100%)',
          pointerEvents: 'none',
          borderRadius: '22px 22px 0 0',
          zIndex: 5,
        }} />
        {/* Filo de luz izquierdo — sutil, completa el bisel */}
        <div style={{
          position: 'absolute',
          left: 0, top: '2px', bottom: '2px',
          width: '1px',
          background: 'linear-gradient(180deg, rgba(255,255,255,0) 0%, rgba(255,255,255,0.18) 15%, rgba(255,255,255,0.14) 50%, rgba(255,255,255,0.10) 85%, rgba(255,255,255,0) 100%)',
          pointerEvents: 'none',
          zIndex: 5,
        }} />
        {/* Specular highlight superior */}
        <div style={{
          position: 'absolute',
          left: 0, top: 0,
          width: '100%', height: '55%',
          background: 'linear-gradient(180deg, rgba(255,255,255,0.12) 0%, rgba(255,255,255,0.04) 25%, rgba(255,255,255,0) 100%)',
          pointerEvents: 'none',
          borderRadius: 'inherit',
          zIndex: 1,
        }} />
        {/* Oscurecimiento inferior */}
        <div style={{
          position: 'absolute',
          left: 0, bottom: 0,
          width: '100%', height: '40%',
          background: 'linear-gradient(0deg, rgba(0,0,0,0.18) 0%, rgba(0,0,0,0.06) 40%, rgba(0,0,0,0) 100%)',
          pointerEvents: 'none',
          borderRadius: 'inherit',
          zIndex: 1,
        }} />
        {/* Sheen sweep — banda de luz diagonal solo visible en hover */}
        <div style={{
          position: 'absolute',
          inset: 0,
          pointerEvents: 'none',
          overflow: 'hidden',
          borderRadius: 'inherit',
          zIndex: 4,
        }}>
          <div style={{
            position: 'absolute',
            top: '-60%',
            left: '-90%',
            width: '55%',
            height: '220%',
            background: 'linear-gradient(115deg, rgba(255,255,255,0) 0%, rgba(255,255,255,0.06) 40%, rgba(255,255,255,0.18) 50%, rgba(255,255,255,0.06) 60%, rgba(255,255,255,0) 100%)',
            transform: isHovered ? 'translateX(360%) skewX(-14deg)' : 'translateX(0%) skewX(-14deg)',
            opacity: isHovered ? 1 : 0,
            transition: isHovered
              ? 'transform 1.44s cubic-bezier(0.22,1,0.36,1), opacity 0.25s ease'
              : 'transform 0s, opacity 0.25s ease',
            mixBlendMode: 'overlay',
            filter: 'blur(0.5px)',
          }} />
        </div>
        {/* Status dot V29 — dorado #D6A84F */}
        <div
          className={card.statusDot === 'green' ? 'status-dot-pulse-green' : undefined}
          style={{
          position: 'absolute', top: '16px', right: '16px',
          width: '7px', height: '7px', borderRadius: '50%',
          backgroundColor: '#D6A84F',
          boxShadow: '0 0 8px rgba(214,168,79,0.6)',
          zIndex: 3,
        }} />
        {/* Title */}
        <div style={{
          fontFamily: "'Montserrat', sans-serif",
          fontSize: '22px',
          fontWeight: 700,
          color: '#FFFFFF',
          letterSpacing: '-0.2px',
          lineHeight: 1.15,
          marginBottom: 'auto',
          textAlign: 'left',
          width: '100%',
          position: 'relative',
          zIndex: 2,
          textShadow: '0 2px 6px rgba(0,0,0,0.35)',
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
            textShadow: '0 2px 8px rgba(0,0,0,0.35)',
          }}>
            {card.kpiValue}
            {card.kpiLabel && (
              <span style={{
                fontSize: '15px',
                fontWeight: 600,
                color: 'rgba(255,255,255,0.72)',
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
        <div style={{
          fontFamily: "'Montserrat', sans-serif",
          fontSize: '12px',
          fontWeight: 600,
          color: 'rgba(255,255,255,0.72)',
          letterSpacing: '0.3px',
          textAlign: 'left', width: '100%',
          marginTop: '6px',
          position: 'relative',
          zIndex: 3,
          whiteSpace: 'nowrap',
          overflow: 'hidden',
          textOverflow: 'ellipsis',
          boxSizing: 'border-box',
          textShadow: 'none',
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
      background: '#ECEEF2', // V29 fondo gris premium uniforme
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
