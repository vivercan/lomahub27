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

// Espacio reservado a la derecha del texto de status para no chocar con el icono de la card
// (icon 83px + margen derecho 18px + padding ~9px → 110px)
const CARD_STATUS_PADDING_RIGHT = '110px'

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

  const mainCards: CardConfig[] = [
    { id: 'oportunidades', label: 'Oportunidades', route: '/ventas/mis-leads', bgColor: '#204C8C', gradient: 'linear-gradient(135deg, #204C8C 0%, #204C8C 18%, #163459 100%)', decorType: 'silk', decorColor: 'rgba(255,255,255,0.08)', iconFile: 'oportunidades.svg', iconOpacity: 0.24, kpiValue: kpis.leadsActivos, kpiLabel: 'leads', statusDot: 'green', statusText: 'Pipeline activo', gridColumn: '1 / 2', gridRow: '1 / 2' },
    { id: 'servicio-clientes', label: 'Servicio al Cliente', route: '/servicio/dashboard', bgColor: '#163459', gradient: 'linear-gradient(130deg, #163459 0%, #163459 18%, #08111D 100%)', decorType: 'silk', decorColor: 'rgba(255,255,255,0.04)', iconFile: 'servicio-al-cliente.svg', iconOpacity: 0.24, kpiValue: kpis.clientes.toLocaleString(), kpiLabel: 'clientes', statusDot: 'green', statusText: '3 submódulos', gridColumn: '2 / 4', gridRow: '1 / 2' },
    { id: 'comercial', label: 'Comercial', route: '/ventas/dashboard', bgColor: '#355D8A', gradient: 'linear-gradient(145deg, #355D8A 0%, #355D8A 18%, #10263F 100%)', decorType: 'silk', decorColor: 'rgba(255,255,255,0.05)', iconFile: 'comercial.svg', iconOpacity: 0.24, kpiValue: kpis.formatosActivos.toLocaleString(), kpiLabel: 'formatos', statusDot: 'green', statusText: '11 submódulos', gridColumn: '4 / 5', gridRow: '1 / 3' },
    { id: 'operaciones', label: 'Operaciones', route: '/operaciones/dashboard', bgColor: '#3B74CC', gradient: 'linear-gradient(140deg, #3B74CC 0%, #3B74CC 18%, #1B3F73 100%)', decorType: 'silk', decorColor: 'rgba(255,255,255,0.14)', iconFile: 'camion-contenedor-v2.svg', iconOpacity: 0.24, kpiValue: kpis.viajesActivos, kpiLabel: 'viajes', statusDot: kpis.viajesActivos > 0 ? 'green' : 'gray', statusText: kpis.viajesActivos > 0 ? 'Operando' : 'Sin viajes', gridColumn: '1 / 2', gridRow: '2 / 3' },
    { id: 'ventas', label: 'Ventas', route: '/ventas/analytics', bgColor: '#2F67B7', gradient: 'linear-gradient(138deg, #2F67B7 0%, #2F67B7 18%, #163459 100%)', decorType: 'silk', decorColor: 'rgba(255,255,255,0.07)', iconFile: 'ingresos.svg', iconOpacity: 0.24, kpiValue: kpis.formatosActivos.toLocaleString(), kpiLabel: 'formatos', statusDot: 'green', statusText: 'Pipeline activo', gridColumn: '2 / 3', gridRow: '2 / 3' },
    { id: 'comunicaciones', label: 'Comunicaciones', route: '/comunicaciones/dashboard', bgColor: '#446B97', gradient: 'linear-gradient(152deg, #446B97 0%, #446B97 18%, #08111D 100%)', decorType: 'silk', decorColor: 'rgba(255,255,255,0.05)', iconFile: 'comunicaciones.svg', iconOpacity: 0.24, kpiValue: '5', kpiLabel: 'canales', statusDot: 'green', statusText: 'Activo', gridColumn: '3 / 4', gridRow: '2 / 4' },
    { id: 'autofomento', label: 'Control de equipo', route: '/control-equipo', bgColor: '#10263F', gradient: 'linear-gradient(160deg, #10263F 0%, #10263F 18%, #05070D 100%)', decorType: 'silk', decorColor: 'rgba(255,255,255,0.03)', iconFile: 'gps.svg', iconOpacity: 0.24, kpiValue: '', kpiLabel: '', statusDot: kpis.cajasGPS > 0 || kpis.thermosGPS > 0 ? 'green' : 'gray', statusText: `Cajas ${kpis.cajasGPS} · Thermos ${kpis.thermosGPS}`, gridColumn: '1 / 3', gridRow: '3 / 4' },
    { id: 'config', label: 'Configuración', route: '/admin/configuracion', bgColor: '#08111D', gradient: 'linear-gradient(148deg, #08111D 0%, #08111D 18%, #163459 100%)', decorType: 'silk', decorColor: 'rgba(255,255,255,0.05)', iconFile: 'configuracion.svg', iconOpacity: 0.24, kpiValue: '', kpiLabel: 'admin', statusDot: 'gray', statusText: 'Sistema', gridColumn: '4 / 5', gridRow: '3 / 4' },
  ]

  // (helper hexToRgba eliminado — fue dead code tras el rediseño premium)

  const getCardStyle = (isHovered: boolean, card: CardConfig): React.CSSProperties => {
    // Comunicaciones: spec 6 → sombra interna extra solo lado derecho
    const extraShadow = card.id === 'comunicaciones'
      ? ', inset -24px 0 40px rgba(0,0,0,0.10)'
      : ''
    return ({
      gridColumn: card.gridColumn,
      gridRow: card.gridRow,
      minHeight: 0,
      borderRadius: '22px',
      padding: '26px',
      background: card.gradient,
      border: '1px solid rgba(255,255,255,0.10)',
      cursor: 'pointer',
      position: 'relative',
      overflow: 'hidden',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'flex-start',
      justifyContent: 'flex-start',
      transition: 'transform 0.55s cubic-bezier(0.16,1,0.3,1), box-shadow 0.55s cubic-bezier(0.16,1,0.3,1), border-color 0.3s ease',
      transform: isHovered
        ? 'translateY(-10px) scale(1.012)'
        : 'translateY(0) scale(1)',
      // HOVER INTACTO — tokens de hover preservados sin cambios.
      boxShadow: isHovered
        ? `
          0 3px 5px -1px rgba(0,0,0,0.70),
          0 14px 26px -8px rgba(0,0,0,0.48),
          0 38px 76px -20px rgba(0,0,0,0.58),
          inset 2px 2px 0 rgba(255,255,255,0.14),
          inset -2px -2px 0 rgba(0,0,0,0.22),
          inset 0 0 24px rgba(0,0,0,0.18)
        `
        // Spec 8 — materialidad común AAA
        : `0 14px 36px rgba(0,0,0,0.22), inset 0 1px 0 rgba(255,255,255,0.08)${extraShadow}`,
    })
  }

  // renderDecor — geometría EXACTA por card según spec numérico.
  // Cada card tiene su combinación única (ver validación spec 10).
  const renderDecor = (card: CardConfig, isHovered: boolean) => {
    const baseTransition = 'transform 1s cubic-bezier(0.16,1,0.3,1), opacity 0.6s ease'

    // Geometría exacta por card
    const geometry = (() => {
      switch (card.id) {
        // CARD 1 — Oportunidades: 3 líneas diagonales 48° + patrón de puntos 5×6
        case 'oportunidades':
          return (
            <>
              {[0, 1, 2].map(i => (
                <div key={`opp-line-${i}`} style={{
                  position: 'absolute',
                  right: '42%', top: '60%',
                  width: '62%', height: '3px',
                  background: 'rgba(255,255,255,0.08)',
                  transformOrigin: '100% 50%',
                  transform: `rotate(-48deg) translateY(${-i * 24}px)`,
                  pointerEvents: 'none',
                }} />
              ))}
              <div style={{
                position: 'absolute',
                right: '26px', bottom: '24px',
                width: '43px', height: '53px',
                backgroundImage: 'radial-gradient(circle, rgba(255,255,255,0.10) 1.5px, transparent 1.6px)',
                backgroundSize: '10px 10px',
                backgroundPosition: '0 0',
                pointerEvents: 'none',
              }} />
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
              {/* brillo superior — color spec rgba(255,255,255,0.10) */}
              <div style={{
                position: 'absolute',
                left: 0, top: 0,
                width: '100%', height: '30%',
                background: 'linear-gradient(180deg, rgba(255,255,255,0.10) 0%, rgba(255,255,255,0) 100%)',
                pointerEvents: 'none',
              }} />
            </>
          )
        // CARD 3 — Comercial: 2 planos facetados 18° + bloque facetado superior-derecho
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
              {/* Bloque facetado superior-derecho — reflejo lateral rgba(255,255,255,0.07) */}
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
        // CARD 4 — Operaciones: franja luminosa diagonal 34° + plano secundario 22°
        case 'operaciones':
          return (
            <>
              {/* Plano secundario detrás del camión (zona inferior-derecha), 26% ancho, 22° */}
              <div style={{
                position: 'absolute',
                right: '-4%', top: '10%',
                width: '26%', height: '140%',
                background: 'rgba(255,255,255,0.06)',
                transform: 'rotate(22deg)',
                transformOrigin: 'center center',
                pointerEvents: 'none',
              }} />
              {/* Franja luminosa principal — 16% ancho, 34°, centro x=34% */}
              <div style={{
                position: 'absolute',
                left: 'calc(34% - 8%)', top: '-30%',
                width: '16%', height: '160%',
                background: 'rgba(255,255,255,0.14)',
                transform: 'rotate(34deg)',
                transformOrigin: 'center center',
                pointerEvents: 'none',
              }} />
            </>
          )
        // CARD 5 — Ventas: 2 planos angulares + brillo circular focal 120px
        case 'ventas':
          return (
            <>
              <div style={{
                position: 'absolute',
                left: '52%', top: '-30%',
                width: '31%', height: '160%',
                background: 'rgba(255,255,255,0.07)',
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
              {/* Brillo circular focal — 120px, centro x=60%, y=18% */}
              <div style={{
                position: 'absolute',
                left: '60%', top: '18%',
                width: '120px', height: '120px',
                transform: 'translate(-50%, -50%)',
                background: 'radial-gradient(circle, rgba(255,255,255,0.12) 0%, rgba(255,255,255,0) 70%)',
                pointerEvents: 'none',
              }} />
            </>
          )
        // CARD 6 — Comunicaciones: 2 planos largos superpuestos (sombra interna extra va en getCardStyle)
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
        // CARD 7 — Control de equipo: 2 planos cruzados + brillo horizontal superior largo
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
              {/* Brillo horizontal superior — ancho 46%, alto 18%, centrado */}
              <div style={{
                position: 'absolute',
                left: '27%', top: 0,
                width: '46%', height: '18%',
                background: 'radial-gradient(ellipse at center top, rgba(255,255,255,0.08) 0%, rgba(255,255,255,0) 80%)',
                pointerEvents: 'none',
              }} />
            </>
          )
        // CARD 8 — Configuración: 1 plano diagonal 30° + 1 plano delgado 33° + brillo puntual 90px
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
              {/* Brillo puntual pequeño — 90px, centro x=76%, y=20% */}
              <div style={{
                position: 'absolute',
                left: '76%', top: '20%',
                width: '90px', height: '90px',
                transform: 'translate(-50%, -50%)',
                background: 'radial-gradient(circle, rgba(255,255,255,0.09) 0%, rgba(255,255,255,0) 70%)',
                pointerEvents: 'none',
              }} />
            </>
          )
        default:
          return null
      }
    })()

    // Icono común — color rgba(245,247,250,0.24). Operaciones camión +20% (spec 6 excepción).
    const iconSize = 95
    const iconVisualScale = card.id === 'operaciones' ? 1.20 : 1
    const iconScale = (isHovered ? 1.04 : 1) * iconVisualScale
    const icon = card.iconFile ? (
      <div
        style={{
          position: 'absolute',
          right: '18px',
          bottom: '10px',
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
            opacity: 0.24,
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
    // Paleta tipográfica obligatoria
    const textColor = '#F5F7FA'
    const mutedColor = 'rgba(245,247,250,0.78)'
    return (
      <div
        key={card.id}
        onClick={() => navigate(card.route)}
        onMouseEnter={() => setHoveredCard(card.id)}
        onMouseLeave={() => setHoveredCard(null)}
        style={getCardStyle(isHovered, card)}
      >
        {renderDecor(card, isHovered)}
        {/* Sheen sweep — banda de luz diagonal solo visible en hover (HOVER INTACTO) */}
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
            background: 'linear-gradient(115deg, rgba(255,255,255,0) 0%, rgba(255,255,255,0.08) 40%, rgba(255,255,255,0.22) 50%, rgba(255,255,255,0.08) 60%, rgba(255,255,255,0) 100%)',
            transform: isHovered ? 'translateX(360%) skewX(-14deg)' : 'translateX(0%) skewX(-14deg)',
            opacity: isHovered ? 1 : 0,
            transition: isHovered
              ? 'transform 1.44s cubic-bezier(0.22,1,0.36,1), opacity 0.25s ease'
              : 'transform 0s, opacity 0.25s ease',
            mixBlendMode: 'overlay',
            filter: 'blur(0.5px)',
          }} />
        </div>
        <div
          className={card.statusDot === 'green' ? 'status-dot-pulse-green' : undefined}
          style={{
          position: 'absolute', top: '16px', right: '16px',
          width: '7px', height: '7px', borderRadius: '50%',
          backgroundColor: DOT_COLORS[card.statusDot] || DOT_COLORS.gray,
          boxShadow: card.statusDot === 'green'
            ? undefined
            : `0 0 0 2px rgba(255,255,255,0.04), 0 0 8px ${DOT_COLORS[card.statusDot] || DOT_COLORS.gray}66`,
          zIndex: 3,
        }} />
        <div style={{
          fontFamily: "'Montserrat', sans-serif",
          fontSize: '28px',
          fontWeight: 700,
          color: textColor,
          letterSpacing: '-0.4px',
          lineHeight: 1.15,
          marginBottom: 'auto',
          textAlign: 'left', width: '100%',
          textShadow: '0 1px 2px rgba(0,0,0,0.35)',
          position: 'relative',
          zIndex: 2,
        }}>
          {card.label}
        </div>
        {card.kpiValue !== '' && (
          <div
            className="kpi-value-num"
            style={{
            fontFamily: "'Montserrat', sans-serif",
            fontSize: '42px',
            fontWeight: 800,
            color: textColor,
            letterSpacing: '-1.2px',
            textAlign: 'left', width: '100%', lineHeight: 1,
            marginTop: '6px',
            position: 'relative',
            zIndex: 2,
            textShadow: '0 1px 2px rgba(0,0,0,0.35)',
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
          zIndex: 3,
          paddingRight: CARD_STATUS_PADDING_RIGHT,
          whiteSpace: 'nowrap',
          overflow: 'hidden',
          textOverflow: 'ellipsis',
          boxSizing: 'border-box',
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
      background: '#F1F2F5', // fondo ligeramente gris para que las sombras se lean mejor
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
        background: `
          radial-gradient(ellipse 75% 65% at 50% 40%, transparent 55%, rgba(0,0,0,0.22) 100%),
          linear-gradient(180deg, transparent 55%, rgba(0,0,0,0.10) 82%, rgba(0,0,0,0.20) 100%),
          radial-gradient(ellipse 100% 80% at 50% 38%,
            #ECECEC 0%,
            #DEDEDE 20%,
            #C8C8C8 45%,
            #AEAEAE 70%,
            #959595 92%,
            #888888 100%
          )
        `,
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












