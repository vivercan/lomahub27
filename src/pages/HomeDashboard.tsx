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
    { id: 'oportunidades', label: 'Oportunidades', route: '/ventas/mis-leads', bgColor: '#234B7A', gradient: 'linear-gradient(135deg, #234B7A 0%, #17365C 100%)', decorType: 'silk', decorColor: 'rgba(255,255,255,0.08)', iconFile: 'oportunidades.svg', iconOpacity: 0.22, kpiValue: kpis.leadsActivos, kpiLabel: 'leads', statusDot: 'green', statusText: 'Pipeline activo', gridColumn: '1 / 2', gridRow: '1 / 2' },
    { id: 'servicio-clientes', label: 'Servicio al Cliente', route: '/servicio/dashboard', bgColor: '#17365C', gradient: 'linear-gradient(135deg, #17365C 0%, #10263F 100%)', decorType: 'silk', decorColor: 'rgba(255,255,255,0.08)', iconFile: 'servicio-al-cliente.svg', iconOpacity: 0.22, kpiValue: kpis.clientes.toLocaleString(), kpiLabel: 'clientes', statusDot: 'green', statusText: '3 submódulos', gridColumn: '2 / 4', gridRow: '1 / 2' },
    { id: 'comercial', label: 'Comercial', route: '/ventas/dashboard', bgColor: '#445468', gradient: 'linear-gradient(135deg, #445468 0%, #17365C 100%)', decorType: 'silk', decorColor: 'rgba(255,255,255,0.08)', iconFile: 'comercial.svg', iconOpacity: 0.22, kpiValue: kpis.formatosActivos.toLocaleString(), kpiLabel: 'formatos', statusDot: 'green', statusText: '11 submódulos', gridColumn: '4 / 5', gridRow: '1 / 3' },
    { id: 'operaciones', label: 'Operaciones', route: '/operaciones/dashboard', bgColor: '#4F7FB8', gradient: 'linear-gradient(135deg, #4F7FB8 0%, #315F96 100%)', decorType: 'silk', decorColor: 'rgba(255,255,255,0.08)', iconFile: 'camion-contenedor-v2.svg', iconOpacity: 0.22, kpiValue: kpis.viajesActivos, kpiLabel: 'viajes', statusDot: kpis.viajesActivos > 0 ? 'green' : 'gray', statusText: kpis.viajesActivos > 0 ? 'Operando' : 'Sin viajes', gridColumn: '1 / 2', gridRow: '2 / 3' },
    { id: 'ventas', label: 'Ventas', route: '/ventas/analytics', bgColor: '#315F96', gradient: 'linear-gradient(135deg, #315F96 0%, #234B7A 100%)', decorType: 'silk', decorColor: 'rgba(255,255,255,0.08)', iconFile: 'ingresos.svg', iconOpacity: 0.22, kpiValue: kpis.formatosActivos.toLocaleString(), kpiLabel: 'formatos', statusDot: 'green', statusText: 'Pipeline activo', gridColumn: '2 / 3', gridRow: '2 / 3' },
    { id: 'comunicaciones', label: 'Comunicaciones', route: '/comunicaciones/dashboard', bgColor: '#17365C', gradient: 'linear-gradient(135deg, #17365C 0%, #445468 100%)', decorType: 'silk', decorColor: 'rgba(255,255,255,0.08)', iconFile: 'comunicaciones.svg', iconOpacity: 0.22, kpiValue: '5', kpiLabel: 'canales', statusDot: 'green', statusText: 'Activo', gridColumn: '3 / 4', gridRow: '2 / 4' },
    { id: 'autofomento', label: 'Control de equipo', route: '/control-equipo', bgColor: '#10263F', gradient: 'linear-gradient(135deg, #10263F 0%, #0C1118 100%)', decorType: 'silk', decorColor: 'rgba(255,255,255,0.08)', iconFile: 'gps.svg', iconOpacity: 0.22, kpiValue: '', kpiLabel: '', statusDot: kpis.cajasGPS > 0 || kpis.thermosGPS > 0 ? 'green' : 'gray', statusText: `Cajas ${kpis.cajasGPS} · Thermos ${kpis.thermosGPS}`, gridColumn: '1 / 3', gridRow: '3 / 4' },
    { id: 'config', label: 'Configuración', route: '/admin/configuracion', bgColor: '#0C1118', gradient: 'linear-gradient(135deg, #0C1118 0%, #10263F 100%)', decorType: 'silk', decorColor: 'rgba(255,255,255,0.08)', iconFile: 'configuracion.svg', iconOpacity: 0.22, kpiValue: '', kpiLabel: 'admin', statusDot: 'gray', statusText: 'Sistema', gridColumn: '4 / 5', gridRow: '3 / 4' },
  ]

  // (helper hexToRgba eliminado — fue dead code tras el rediseño premium)

  const getCardStyle = (isHovered: boolean, card: CardConfig): React.CSSProperties => ({
    gridColumn: card.gridColumn,
    gridRow: card.gridRow,
    minHeight: 0,
    borderRadius: '22px',
    padding: '26px',
    // Capa 1 (base): un solo gradiente diagonal top-left → bottom-right (ya en card.gradient)
    // Capa 2 (luz superior): brillo suave tercio superior, opacidad baja.
    background: `
      linear-gradient(180deg, rgba(255,255,255,0.08) 0%, rgba(255,255,255,0) 42%),
      ${card.gradient}
    `,
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
    // HOVER INTACTO — mismos tokens que antes en hover; base ajustada a la familia spec.
    boxShadow: isHovered
      ? `
        0 3px 5px -1px rgba(0,0,0,0.70),
        0 14px 26px -8px rgba(0,0,0,0.48),
        0 38px 76px -20px rgba(0,0,0,0.58),
        inset 2px 2px 0 rgba(255,255,255,0.14),
        inset -2px -2px 0 rgba(0,0,0,0.22),
        inset 0 0 24px rgba(0,0,0,0.18)
      `
      : `
        0 14px 36px rgba(0,0,0,0.22),
        inset 0 1px 0 rgba(255,255,255,0.08)
      `,
  })

  // renderDecor — UNIFICADO. Misma gramática visual en los 8 cards:
  //   · 2 planos geométricos suaves (mismos ángulos) en opacidad baja
  //   · icono outline con color rgba(245,247,250,0.22), misma escala, misma posición bottom-right
  const renderDecor = (card: CardConfig, isHovered: boolean) => {
    const baseTransition = 'transform 1s cubic-bezier(0.16,1,0.3,1), opacity 0.6s ease'

    // 2 planos geométricos mínimos — misma familia angular para todos los cards.
    const geometry = (
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
          <linearGradient id={`plane1-${card.id}`} x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#FFFFFF" stopOpacity="0.08" />
            <stop offset="100%" stopColor="#FFFFFF" stopOpacity="0" />
          </linearGradient>
          <linearGradient id={`plane2-${card.id}`} x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#000000" stopOpacity="0.22" />
            <stop offset="100%" stopColor="#000000" stopOpacity="0" />
          </linearGradient>
        </defs>
        {/* Plano 1: reflejo superior izquierdo */}
        <polygon points="0,0 260,0 120,240 0,240" fill={`url(#plane1-${card.id})`} />
        {/* Plano 2: sombra inferior derecha */}
        <polygon points="400,40 400,240 180,240 300,80" fill={`url(#plane2-${card.id})`} />
      </svg>
    )

    // Icono unificado — color rgba(245,247,250,0.22), misma escala, bottom-right, outline filter
    const iconSize = 95
    const iconScale = isHovered ? 1.04 : 1
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
            // Tinte #F5F7FA a 22% — brightness(0) invert(1) = blanco puro, opacity 0.22 = rgba(245,247,250,0.22) visual
            filter: 'brightness(0) invert(1)',
            opacity: 0.22,
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
          textShadow: '0 1px 2px rgba(0,0,0,0.28)',
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












