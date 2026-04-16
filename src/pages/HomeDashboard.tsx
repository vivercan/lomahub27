// HomeDashboard V27k - Intense gradients, integrated text, small icons
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
  green: '#FF7A00', yellow: '#FF7A00', red: '#FF7A00', gray: '#FF7A00',
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
    { id: 'oportunidades', label: 'Oportunidades', route: '/ventas/mis-leads', bgColor: '#1B4DB5', gradient: 'linear-gradient(138deg, #1B4DB5 0%, #143A8E 40%, #0B2157 100%)', decorType: 'silk', decorColor: 'rgba(255,255,255,0.10)', iconFile: 'oportunidades.svg', iconOpacity: 0.24, kpiValue: kpis.leadsActivos, kpiLabel: 'leads', statusDot: 'green', statusText: 'Pipeline activo', gridColumn: '1 / 2', gridRow: '1 / 2' },
    { id: 'servicio-clientes', label: 'Servicio al Cliente', route: '/servicio/dashboard', bgColor: '#0D2B52', gradient: 'linear-gradient(142deg, #133667 0%, #0D2B52 40%, #04101F 100%)', decorType: 'silk', decorColor: 'rgba(255,255,255,0.07)', iconFile: 'servicio-al-cliente.svg', iconOpacity: 0.24, kpiValue: kpis.clientes.toLocaleString(), kpiLabel: 'clientes', statusDot: 'green', statusText: '3 submódulos', gridColumn: '2 / 4', gridRow: '1 / 2' },
    { id: 'comercial', label: 'Comercial', route: '/ventas/dashboard', bgColor: '#2458A8', gradient: 'linear-gradient(145deg, #2E6ABF 0%, #1C4F96 40%, #0E2D5C 100%)', decorType: 'silk', decorColor: 'rgba(255,255,255,0.10)', iconFile: 'comercial.svg', iconOpacity: 0.24, kpiValue: kpis.formatosActivos.toLocaleString(), kpiLabel: 'formatos', statusDot: 'green', statusText: '11 submódulos', gridColumn: '4 / 5', gridRow: '1 / 3' },
    { id: 'operaciones', label: 'Operaciones', route: '/operaciones/dashboard', bgColor: '#2B6FD4', gradient: 'linear-gradient(136deg, #3580E8 0%, #2260B8 40%, #143D78 100%)', decorType: 'silk', decorColor: 'rgba(255,255,255,0.16)', iconFile: 'camion-contenedor-v2.svg', iconOpacity: 0.24, kpiValue: kpis.viajesActivos, kpiLabel: 'viajes', statusDot: kpis.viajesActivos > 0 ? 'green' : 'gray', statusText: kpis.viajesActivos > 0 ? 'Operando' : 'Sin viajes', gridColumn: '1 / 2', gridRow: '2 / 3' },
    { id: 'ventas', label: 'Ventas', route: '/ventas/analytics', bgColor: '#1E5CB0', gradient: 'linear-gradient(140deg, #2868C4 0%, #1B4FA0 40%, #0F3268 100%)', decorType: 'silk', decorColor: 'rgba(255,255,255,0.10)', iconFile: 'ingresos.svg', iconOpacity: 0.24, kpiValue: kpis.formatosActivos.toLocaleString(), kpiLabel: 'formatos', statusDot: 'green', statusText: 'Pipeline activo', gridColumn: '2 / 3', gridRow: '2 / 3' },
    { id: 'comunicaciones', label: 'Comunicaciones', route: '/comunicaciones/dashboard', bgColor: '#3A6A9E', gradient: 'linear-gradient(148deg, #3D72AE 0%, #2A5585 40%, #152B45 100%)', decorType: 'silk', decorColor: 'rgba(255,255,255,0.10)', iconFile: 'comunicaciones.svg', iconOpacity: 0.24, kpiValue: '5', kpiLabel: 'canales', statusDot: 'green', statusText: 'Activo', gridColumn: '3 / 4', gridRow: '2 / 4' },
    { id: 'autofomento', label: 'Control de equipo', route: '/control-equipo', bgColor: '#184A80', gradient: 'linear-gradient(152deg, #1E5694 0%, #14406E 40%, #091E38 100%)', decorType: 'silk', decorColor: 'rgba(255,255,255,0.07)', iconFile: 'gps.svg', iconOpacity: 0.24, kpiValue: '', kpiLabel: '', statusDot: kpis.cajasGPS > 0 || kpis.thermosGPS > 0 ? 'green' : 'gray', statusText: `Cajas ${kpis.cajasGPS} · Thermos ${kpis.thermosGPS}`, gridColumn: '1 / 3', gridRow: '3 / 4' },
    { id: 'config', label: 'Configuración', route: '/admin/configuracion', bgColor: '#080F1C', gradient: 'linear-gradient(144deg, #0C1628 0%, #080F1C 40%, #1A3A6A 100%)', decorType: 'silk', decorColor: 'rgba(255,255,255,0.07)', iconFile: 'configuracion.svg', iconOpacity: 0.24, kpiValue: '', kpiLabel: 'admin', statusDot: 'gray', statusText: 'Sistema', gridColumn: '4 / 5', gridRow: '3 / 4' },
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
      border: 'none',
      outline: isHovered
        ? '1.5px solid rgba(255,140,0,0.60)'
        : '1.5px solid rgba(255,122,0,0.22)',
      outlineOffset: '-1px',
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
          0 0 12px rgba(255,122,0,0.12),
          0 3px 5px -1px rgba(0,0,0,0.70),
          0 14px 26px -8px rgba(0,0,0,0.48),
          0 38px 76px -20px rgba(0,0,0,0.58),
          inset 2px 2px 0 rgba(255,255,255,0.14),
          inset -2px -2px 0 rgba(0,0,0,0.22),
          inset 0 0 24px rgba(0,0,0,0.18)
        `
        : `0 18px 34px rgba(0,0,0,0.24), 0 6px 12px rgba(0,0,0,0.14), inset 0 1px 0 rgba(255,255,255,0.12), inset 0 18px 28px rgba(255,255,255,0.025), inset 0 -14px 20px rgba(0,0,0,0.12)${extraShadow}`,
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

    // Icono repujado/emboss — efecto 3D como empujado desde atrás (letterpress)
    // Per-card size overrides para presencia uniforme del relieve
    const iconSize = (() => {
      switch (card.id) {
        case 'operaciones': return 140
        case 'comunicaciones': return 138
        case 'servicio-clientes': return 126
        case 'config': return 115
        default: return 110
      }
    })()
    const iconScale = isHovered ? 1.06 : 1
    const iconBottom = (() => {
      switch (card.id) {
        case 'operaciones': return '-14px'
        case 'comunicaciones': return '-8px'
        case 'servicio-clientes': return '-4px'
        case 'config': return '-2px'
        default: return '0px'
      }
    })()
    const iconRight = (() => {
      switch (card.id) {
        case 'operaciones': return '2px'
        case 'comunicaciones': return '4px'
        case 'servicio-clientes': return '4px'
        default: return '8px'
      }
    })()
    // Blind emboss con filtro SVG: solo bordes iluminados/sombreados.
    // CERO relleno, cero color. Solo relieve de bordes.
    const iconSrc = card.iconFile ? `/icons/dashboard/${card.iconFile}` : null
    const icon = iconSrc ? (
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
          src={iconSrc}
          alt=""
          style={{
            width: '100%',
            height: '100%',
            objectFit: 'contain',
            objectPosition: 'center center',
            filter: 'url(#blind-emboss)',
            opacity: 0.95,
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
    // Paleta tipográfica — colores integrados al material de la card
    const textColor = 'rgba(255,255,255,0.95)'
    const kpiColor = '#FFFFFF'
    const mutedColor = 'rgba(255,255,255,0.55)'
    const labelColor = 'rgba(255,255,255,0.40)'
    return (
      <div
        key={card.id}
        onClick={() => navigate(card.route)}
        onMouseEnter={() => setHoveredCard(card.id)}
        onMouseLeave={() => setHoveredCard(null)}
        style={getCardStyle(isHovered, card)}
      >
        {renderDecor(card, isHovered)}
        {/* Specular highlight — brillo de luz superior para profundidad */}
        <div style={{
          position: 'absolute',
          left: 0, top: 0,
          width: '100%', height: '45%',
          background: 'linear-gradient(180deg, rgba(255,255,255,0.07) 0%, rgba(255,255,255,0) 100%)',
          pointerEvents: 'none',
          borderRadius: 'inherit',
          zIndex: 1,
        }} />
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
          backgroundColor: '#FF7A00',
          boxShadow: '0 0 10px rgba(255,122,0,0.50)',
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
            textShadow: '0 2px 8px rgba(0,0,0,0.35), 0 0 20px rgba(255,255,255,0.06)',
          }}>
            {card.kpiValue}
            {card.kpiLabel && (
              <span style={{
                fontSize: '15px',
                fontWeight: 600,
                color: 'rgba(255,255,255,0.50)',
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
          color: 'rgba(255,255,255,0.50)',
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
      background: '#F4F5F8', // fondo ligeramente más claro — premium light
      fontFamily: "'Montserrat', sans-serif",
      color: '#1E293B',
    }}>
      <style>{`@import url('https://fonts.googleapis.com/css2?family=Montserrat:wght@400;500;600;700;800&display=swap');`}</style>
      {/* Filtro SVG blind emboss 90° — luz arriba+izquierda, sombra abajo+derecha */}
      <svg style={{ position: 'absolute', width: 0, height: 0, overflow: 'hidden' }} aria-hidden="true">
        <defs>
          <filter id="blind-emboss" x="-30%" y="-30%" width="160%" height="160%" colorInterpolationFilters="sRGB">
            <feGaussianBlur in="SourceAlpha" stdDeviation="0.8" result="tight"/>

            {/* === LUZ SUPERIOR (borde top) === */}
            <feOffset in="tight" dx="0" dy="3" result="shDown"/>
            <feComposite in="SourceAlpha" in2="shDown" operator="out" result="topEdge"/>
            <feFlood floodColor="white" floodOpacity="0.55" result="wT"/>
            <feComposite in="wT" in2="topEdge" operator="in" result="lightTop"/>

            {/* === LUZ IZQUIERDA (borde left) === */}
            <feOffset in="tight" dx="3" dy="0" result="shRight"/>
            <feComposite in="SourceAlpha" in2="shRight" operator="out" result="leftEdge"/>
            <feFlood floodColor="white" floodOpacity="0.45" result="wL"/>
            <feComposite in="wL" in2="leftEdge" operator="in" result="lightLeft"/>

            {/* === SOMBRA INFERIOR (borde bottom) === */}
            <feOffset in="tight" dx="0" dy="-3" result="shUp"/>
            <feComposite in="SourceAlpha" in2="shUp" operator="out" result="bottomEdge"/>
            <feFlood floodColor="black" floodOpacity="0.60" result="bB"/>
            <feComposite in="bB" in2="bottomEdge" operator="in" result="darkBottom"/>

            {/* === SOMBRA DERECHA (borde right) === */}
            <feOffset in="tight" dx="-3" dy="0" result="shLeft"/>
            <feComposite in="SourceAlpha" in2="shLeft" operator="out" result="rightEdge"/>
            <feFlood floodColor="black" floodOpacity="0.50" result="bR"/>
            <feComposite in="bR" in2="rightEdge" operator="in" result="darkRight"/>

            {/* === HALO PROFUNDIDAD (suave, detrás de bordes duros) === */}
            <feGaussianBlur in="SourceAlpha" stdDeviation="2.8" result="wide"/>
            <feOffset in="wide" dx="0" dy="4" result="haloDown"/>
            <feComposite in="SourceAlpha" in2="haloDown" operator="out" result="haloTopEdge"/>
            <feFlood floodColor="white" floodOpacity="0.14" result="wH"/>
            <feComposite in="wH" in2="haloTopEdge" operator="in" result="haloLT"/>
            <feGaussianBlur in="haloLT" stdDeviation="1.8" result="haloLightSoft"/>

            <feOffset in="wide" dx="0" dy="-4" result="haloUp"/>
            <feComposite in="SourceAlpha" in2="haloUp" operator="out" result="haloBotEdge"/>
            <feFlood floodColor="black" floodOpacity="0.18" result="bH"/>
            <feComposite in="bH" in2="haloBotEdge" operator="in" result="haloDB"/>
            <feGaussianBlur in="haloDB" stdDeviation="1.8" result="haloDarkSoft"/>

            {/* === RELLENO SUTIL === */}
            <feFlood floodColor="white" floodOpacity="0.04" result="fill"/>
            <feComposite in="fill" in2="SourceAlpha" operator="in" result="subtleFill"/>

            {/* === MERGE: sombras → relleno → highlights === */}
            <feMerge>
              <feMergeNode in="haloDarkSoft"/>
              <feMergeNode in="darkBottom"/>
              <feMergeNode in="darkRight"/>
              <feMergeNode in="subtleFill"/>
              <feMergeNode in="lightTop"/>
              <feMergeNode in="lightLeft"/>
              <feMergeNode in="haloLightSoft"/>
            </feMerge>
          </filter>
        </defs>
      </svg>
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
          radial-gradient(ellipse 75% 65% at 50% 40%, transparent 55%, rgba(0,0,0,0.14) 100%),
          linear-gradient(180deg, transparent 55%, rgba(0,0,0,0.06) 82%, rgba(0,0,0,0.12) 100%),
          radial-gradient(ellipse 100% 80% at 50% 38%,
            #F2F3F6 0%,
            #E8E9ED 20%,
            #D6D8DE 45%,
            #C0C2C9 70%,
            #AAACB4 92%,
            #9FA1A9 100%
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












