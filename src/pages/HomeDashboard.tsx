// HomeDashboard V27L - Dark fintech cards, light gray background
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

  // Dark fintech palette — near-black with subtle navy undertones per card
  const mainCards: CardConfig[] = [
    { id: 'oportunidades', label: 'Oportunidades', route: '/ventas/mis-leads', bgColor: '#111827', gradient: 'linear-gradient(145deg, #171F2E 0%, #111827 50%, #0C1220 100%)', decorType: 'silk', decorColor: 'rgba(255,255,255,0.10)', iconFile: 'oportunidades.svg', iconOpacity: 0.24, kpiValue: kpis.leadsActivos, kpiLabel: 'leads', statusDot: 'green', statusText: 'Pipeline activo', gridColumn: '1 / 2', gridRow: '1 / 2' },
    { id: 'servicio-clientes', label: 'Servicio al Cliente', route: '/servicio/dashboard', bgColor: '#0F1726', gradient: 'linear-gradient(142deg, #151D2E 0%, #0F1726 50%, #0A1019 100%)', decorType: 'silk', decorColor: 'rgba(255,255,255,0.07)', iconFile: 'servicio-al-cliente.svg', iconOpacity: 0.24, kpiValue: kpis.clientes.toLocaleString(), kpiLabel: 'clientes', statusDot: 'green', statusText: '3 submódulos', gridColumn: '2 / 4', gridRow: '1 / 2' },
    { id: 'comercial', label: 'Comercial', route: '/ventas/dashboard', bgColor: '#131B2A', gradient: 'linear-gradient(145deg, #192233 0%, #131B2A 50%, #0D1420 100%)', decorType: 'silk', decorColor: 'rgba(255,255,255,0.10)', iconFile: 'comercial.svg', iconOpacity: 0.24, kpiValue: kpis.formatosActivos.toLocaleString(), kpiLabel: 'formatos', statusDot: 'green', statusText: '11 submódulos', gridColumn: '4 / 5', gridRow: '1 / 3' },
    { id: 'operaciones', label: 'Operaciones', route: '/operaciones/dashboard', bgColor: '#10192A', gradient: 'linear-gradient(136deg, #162136 0%, #10192A 50%, #0B1220 100%)', decorType: 'silk', decorColor: 'rgba(255,255,255,0.16)', iconFile: 'camion-contenedor-v2.svg', iconOpacity: 0.24, kpiValue: kpis.viajesActivos, kpiLabel: 'viajes', statusDot: kpis.viajesActivos > 0 ? 'green' : 'gray', statusText: kpis.viajesActivos > 0 ? 'Operando' : 'Sin viajes', gridColumn: '1 / 2', gridRow: '2 / 3' },
    { id: 'ventas', label: 'Ventas', route: '/ventas/analytics', bgColor: '#121A28', gradient: 'linear-gradient(140deg, #182232 0%, #121A28 50%, #0C131E 100%)', decorType: 'silk', decorColor: 'rgba(255,255,255,0.10)', iconFile: 'ingresos.svg', iconOpacity: 0.24, kpiValue: kpis.formatosActivos.toLocaleString(), kpiLabel: 'formatos', statusDot: 'green', statusText: 'Pipeline activo', gridColumn: '2 / 3', gridRow: '2 / 3' },
    { id: 'comunicaciones', label: 'Comunicaciones', route: '/comunicaciones/dashboard', bgColor: '#141C2B', gradient: 'linear-gradient(148deg, #1A2435 0%, #141C2B 50%, #0E1520 100%)', decorType: 'silk', decorColor: 'rgba(255,255,255,0.10)', iconFile: 'comunicaciones.svg', iconOpacity: 0.24, kpiValue: '5', kpiLabel: 'canales', statusDot: 'green', statusText: 'Activo', gridColumn: '3 / 4', gridRow: '2 / 4' },
    { id: 'autofomento', label: 'Control de equipo', route: '/control-equipo', bgColor: '#0F1825', gradient: 'linear-gradient(152deg, #151F30 0%, #0F1825 50%, #0A111C 100%)', decorType: 'silk', decorColor: 'rgba(255,255,255,0.07)', iconFile: 'gps.svg', iconOpacity: 0.24, kpiValue: '', kpiLabel: '', statusDot: kpis.cajasGPS > 0 || kpis.thermosGPS > 0 ? 'green' : 'gray', statusText: `Cajas ${kpis.cajasGPS} · Thermos ${kpis.thermosGPS}`, gridColumn: '1 / 3', gridRow: '3 / 4' },
    { id: 'config', label: 'Configuración', route: '/admin/configuracion', bgColor: '#0B1018', gradient: 'linear-gradient(144deg, #111823 0%, #0B1018 50%, #070C12 100%)', decorType: 'silk', decorColor: 'rgba(255,255,255,0.07)', iconFile: 'configuracion.svg', iconOpacity: 0.24, kpiValue: '', kpiLabel: 'admin', statusDot: 'gray', statusText: 'Sistema', gridColumn: '4 / 5', gridRow: '3 / 4' },
  ]

  // (helper hexToRgba eliminado — fue dead code tras el rediseño premium)

  const getCardStyle = (isHovered: boolean, card: CardConfig): React.CSSProperties => {
    return ({
      gridColumn: card.gridColumn,
      gridRow: card.gridRow,
      minHeight: 0,
      borderRadius: '18px',
      padding: '24px',
      background: card.gradient,
      border: '1px solid rgba(255,255,255,0.06)',
      cursor: 'pointer',
      position: 'relative',
      overflow: 'hidden',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'flex-start',
      justifyContent: 'flex-start',
      transition: 'transform 0.55s cubic-bezier(0.16,1,0.3,1), box-shadow 0.55s cubic-bezier(0.16,1,0.3,1), border-color 0.3s ease',
      transform: isHovered
        ? 'translateY(-8px) scale(1.008)'
        : 'translateY(0) scale(1)',
      boxShadow: isHovered
        ? `
          0 4px 8px -2px rgba(0,0,0,0.50),
          0 16px 32px -8px rgba(0,0,0,0.40),
          0 32px 64px -16px rgba(0,0,0,0.35),
          inset 0 1px 0 rgba(255,255,255,0.08),
          inset 0 0 20px rgba(255,255,255,0.03)
        `
        : `0 8px 24px rgba(0,0,0,0.28), 0 3px 8px rgba(0,0,0,0.18), inset 0 1px 0 rgba(255,255,255,0.05)`,
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
            filter: 'brightness(0) invert(1) drop-shadow(0 0 8px rgba(255,122,0,0.28)) drop-shadow(0 0 18px rgba(255,122,0,0.15))',
            opacity: 0.30,
          }}
        />
      </div>
    ) : null

    return (
      <>
        {geometry}
      </>
    )
  }


  const renderCard = (card: CardConfig) => {
    const isHovered = hoveredCard === card.id
    // Paleta tipográfica — dark fintech: pure white on near-black
    return (
      <div
        key={card.id}
        onClick={() => navigate(card.route)}
        onMouseEnter={() => setHoveredCard(card.id)}
        onMouseLeave={() => setHoveredCard(null)}
        style={getCardStyle(isHovered, card)}
      >
        {renderDecor(card, isHovered)}
        {/* Specular highlight — very subtle top edge light */}
        <div style={{
          position: 'absolute',
          left: 0, top: 0,
          width: '100%', height: '35%',
          background: 'linear-gradient(180deg, rgba(255,255,255,0.04) 0%, rgba(255,255,255,0) 100%)',
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
        {/* Title row with fintech-style icon */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '12px',
          marginBottom: 'auto',
          width: '100%',
          position: 'relative',
          zIndex: 2,
        }}>
          {/* Icon badge — 36px, dark glass, like fintech logos */}
          <div style={{
            width: '36px', height: '36px',
            borderRadius: '10px',
            background: 'rgba(255,255,255,0.06)',
            border: '1px solid rgba(255,255,255,0.08)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0,
          }}>
            <img
              src={`/icons/dashboard/${card.iconFile}`}
              alt=""
              style={{
                width: '20px', height: '20px',
                objectFit: 'contain',
                filter: 'brightness(0) invert(1)',
                opacity: 0.75,
              }}
            />
          </div>
          <span style={{
            fontFamily: "'Montserrat', sans-serif",
            fontSize: '13px',
            fontWeight: 600,
            color: 'rgba(255,255,255,0.60)',
            letterSpacing: '1.2px',
            lineHeight: 1.2,
            textShadow: 'none',
            textTransform: 'uppercase' as const,
          }}>
            {card.label}
          </span>
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
            marginTop: '4px',
            position: 'relative',
            zIndex: 2,
            textShadow: 'none',
          }}>
            {card.kpiValue}
            {card.kpiLabel && (
              <span style={{
                fontSize: '14px',
                fontWeight: 500,
                color: 'rgba(255,255,255,0.35)',
                letterSpacing: '0.3px',
                marginLeft: '10px',
                textTransform: 'lowercase' as const,
              }}>
                {card.kpiLabel}
              </span>
            )}
          </div>
        )}
        <div style={{
          fontFamily: "'Montserrat', sans-serif",
          fontSize: '11px',
          fontWeight: 500,
          color: 'rgba(255,255,255,0.30)',
          letterSpacing: '0.3px',
          textAlign: 'left', width: '100%',
          marginTop: '8px',
          position: 'relative',
          zIndex: 3,
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
      background: '#F5F6F9', // fondo claro premium — contraste máximo con dark cards
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
          radial-gradient(ellipse 75% 65% at 50% 40%, transparent 55%, rgba(0,0,0,0.08) 100%),
          linear-gradient(180deg, transparent 55%, rgba(0,0,0,0.03) 82%, rgba(0,0,0,0.06) 100%),
          radial-gradient(ellipse 100% 80% at 50% 38%,
            #F5F6F9 0%,
            #EEEFF3 20%,
            #E2E4E9 45%,
            #D4D6DC 70%,
            #C4C6CD 92%,
            #BABCC3 100%
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












