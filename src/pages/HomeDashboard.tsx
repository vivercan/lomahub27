// HomeDashboard — Receta ARIA (ejecutor ciego)
// Mismo sistema, mismos módulos, mismos iconos, mismas rutas, mismos handlers.
// Solo se aplica paleta + tipografía + bordes + sombras + tokens.
import React, { useState, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import AppHeader from '../components/layout/AppHeader'
import { useAuthContext } from '../hooks/AuthContext'

// -------------- ARIA TOKENS --------------
const ARIA = {
  canvasStart: '#0E223D',
  canvasEnd: '#132B49',
  cardBg1: '#112640',
  cardBg2: '#10233A',
  cardBorder: 'rgba(255,255,255,0.06)',
  cardBorderHover: 'rgba(255,255,255,0.10)',
  textPrimary: '#F5F8FF',
  textSecondary: '#A7B7CD',
  textMuted: '#7F91AB',
  divider: 'rgba(255,255,255,0.06)',
  hoverOverlay: 'rgba(255,255,255,0.025)',
  shadow: '0 10px 30px rgba(0,0,0,0.18)',
  shadowHover: '0 14px 36px rgba(0,0,0,0.22)',
  activeBlue: '#2F5FE8',
  activeBlueSoft: 'rgba(47,95,232,0.16)',
  statusGreen: '#18C29C',
  statusGreenSoft: 'rgba(24,194,156,0.16)',
}

interface CardConfig {
  id: string
  label: string
  route: string
  iconId: string
  kpiValue: number | string
  kpiLabel: string
  statusDot: 'green' | 'yellow' | 'red' | 'gray'
  statusText: string
  gridColumn: string
  gridRow: string
}

const DOT_COLORS: Record<string, string> = {
  green: ARIA.statusGreen,
  yellow: '#F59E0B',
  red: '#EF4444',
  gray: '#7F91AB',
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

  // MISMOS módulos, MISMAS rutas, MISMO orden, MISMA posición en grid.
  const mainCards: CardConfig[] = [
    { id: 'oportunidades',     label: 'Oportunidades',      route: '/ventas/mis-leads',          iconId: 'oportunidades',     kpiValue: kpis.leadsActivos,                    kpiLabel: 'leads',    statusDot: 'green', statusText: 'Pipeline activo',                       gridColumn: '1 / 2', gridRow: '1 / 2' },
    { id: 'servicio-clientes', label: 'Servicio al Cliente', route: '/servicio/dashboard',       iconId: 'servicio-clientes', kpiValue: kpis.clientes.toLocaleString(),       kpiLabel: 'clientes', statusDot: 'green', statusText: '3 submódulos',                          gridColumn: '2 / 4', gridRow: '1 / 2' },
    { id: 'comercial',         label: 'Comercial',           route: '/ventas/dashboard',          iconId: 'comercial',         kpiValue: kpis.formatosActivos.toLocaleString(), kpiLabel: 'formatos', statusDot: 'green', statusText: '11 submódulos',                         gridColumn: '4 / 5', gridRow: '1 / 3' },
    { id: 'operaciones',       label: 'Operaciones',         route: '/operaciones/dashboard',     iconId: 'operaciones',       kpiValue: kpis.viajesActivos,                   kpiLabel: 'viajes',   statusDot: kpis.viajesActivos > 0 ? 'green' : 'gray', statusText: kpis.viajesActivos > 0 ? 'Operando' : 'Sin viajes', gridColumn: '1 / 2', gridRow: '2 / 3' },
    { id: 'ventas',            label: 'Ventas',              route: '/ventas/analytics',          iconId: 'ventas',            kpiValue: kpis.formatosActivos.toLocaleString(), kpiLabel: 'formatos', statusDot: 'green', statusText: 'Pipeline activo',                       gridColumn: '2 / 3', gridRow: '2 / 3' },
    { id: 'comunicaciones',    label: 'Comunicaciones',      route: '/comunicaciones/dashboard',  iconId: 'comunicaciones',    kpiValue: '5',                                  kpiLabel: 'canales',  statusDot: 'green', statusText: 'Activo',                                gridColumn: '3 / 4', gridRow: '2 / 4' },
    { id: 'autofomento',       label: 'Auto Fomento SEAT',   route: '/',                          iconId: 'autofomento',       kpiValue: '',                                   kpiLabel: '',         statusDot: 'gray',  statusText: 'Próximamente',                          gridColumn: '1 / 3', gridRow: '3 / 4' },
    { id: 'config',            label: 'Configuración',       route: '/admin/configuracion',       iconId: 'config',            kpiValue: '',                                   kpiLabel: 'admin',    statusDot: 'gray',  statusText: 'Sistema',                               gridColumn: '4 / 5', gridRow: '3 / 4' },
  ]

  // MISMOS iconos (misma gramática visual, misma posición, mismo glyph).
  // stroke 1.5 → 1.65 solo para legibilidad; sin cambiar la forma.
  const UnifiedIcon = ({ id }: { id: string }) => {
    const sp = {
      width: '100%', height: '100%', viewBox: '0 0 48 48',
      fill: 'none', stroke: ARIA.textPrimary, strokeWidth: 1.65,
      strokeLinecap: 'round' as const, strokeLinejoin: 'round' as const,
      style: { opacity: 0.92 },
    }
    switch (id) {
      case 'oportunidades':
        return (
          <svg {...sp}>
            <path d="M6 10 L42 10 L28 24 L28 40 L20 40 L20 24 Z" />
            <line x1="14" y1="16" x2="34" y2="16" />
          </svg>
        )
      case 'servicio-clientes':
        return (
          <svg {...sp}>
            <path d="M10 28 Q10 8 24 8 Q38 8 38 28" />
            <path d="M6 28 L6 36 Q6 38 8 38 L12 38 L12 28 Z" />
            <path d="M42 28 L42 36 Q42 38 40 38 L36 38 L36 28 Z" />
            <path d="M36 38 Q36 44 30 44 L26 44" />
          </svg>
        )
      case 'comercial':
        return (
          <svg {...sp}>
            <rect x="6" y="16" width="36" height="24" rx="2" />
            <path d="M18 16 L18 12 Q18 10 20 10 L28 10 Q30 10 30 12 L30 16" />
            <line x1="6" y1="26" x2="42" y2="26" />
          </svg>
        )
      case 'operaciones':
        return (
          <svg {...sp}>
            <rect x="4" y="16" width="22" height="16" rx="1" />
            <path d="M26 20 L34 20 L38 24 L38 32 L26 32 Z" />
            <circle cx="12" cy="36" r="3" />
            <circle cx="32" cy="36" r="3" />
          </svg>
        )
      case 'ventas':
        return (
          <svg {...sp}>
            <line x1="6" y1="40" x2="42" y2="40" />
            <path d="M10 34 L18 24 L24 30 L36 12" />
            <path d="M30 12 L36 12 L36 18" />
          </svg>
        )
      case 'comunicaciones':
        return (
          <svg {...sp}>
            <path d="M8 12 L26 12 Q30 12 30 16 L30 22 Q30 26 26 26 L16 26 L10 30 L10 26 Q8 26 8 24 Z" />
            <path d="M20 30 L36 30 Q40 30 40 34 L40 38 Q40 42 36 42 L30 42 L26 46 L26 42 Q20 42 20 40 Z" />
          </svg>
        )
      case 'autofomento':
        return (
          <svg {...sp}>
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

  // Receta Aria exacta: background, border, shadow, hover. NADA MÁS.
  const getCardStyle = (isHovered: boolean, card: CardConfig): React.CSSProperties => ({
    gridColumn: card.gridColumn,
    gridRow: card.gridRow,
    minHeight: 0,
    borderRadius: '16px',
    padding: '22px',
    background: `linear-gradient(180deg, ${ARIA.cardBg1} 0%, ${ARIA.cardBg2} 100%)`,
    border: `1px solid ${isHovered ? ARIA.cardBorderHover : ARIA.cardBorder}`,
    cursor: 'pointer',
    position: 'relative',
    overflow: 'hidden',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'flex-start',
    justifyContent: 'flex-start',
    transition: 'background 180ms ease, border-color 180ms ease, box-shadow 180ms ease',
    boxShadow: isHovered ? ARIA.shadowHover : ARIA.shadow,
  })

  const renderCard = (card: CardConfig) => {
    const isHovered = hoveredCard === card.id
    return (
      <div
        key={card.id}
        onClick={() => navigate(card.route)}
        onMouseEnter={() => setHoveredCard(card.id)}
        onMouseLeave={() => setHoveredCard(null)}
        style={getCardStyle(isHovered, card)}
      >
        {/* Hover overlay sutil (solo refinamiento visual, sin mover nada) */}
        {isHovered && (
          <div style={{
            position: 'absolute', inset: 0,
            background: ARIA.hoverOverlay,
            pointerEvents: 'none',
          }} />
        )}

        {/* Status dot — misma posición, mismo comportamiento */}
        <div style={{
          position: 'absolute', top: '14px', right: '14px',
          width: '8px', height: '8px', borderRadius: '50%',
          backgroundColor: DOT_COLORS[card.statusDot] || DOT_COLORS.gray,
          zIndex: 3,
        }} />

        {/* Label — token text primary, peso 700, limpio */}
        <div style={{
          fontFamily: "'Montserrat', sans-serif",
          fontSize: '20px',
          fontWeight: 700,
          color: ARIA.textPrimary,
          letterSpacing: '-0.3px',
          lineHeight: 1.15,
          marginBottom: 'auto',
          textAlign: 'left', width: '100%',
          position: 'relative',
          zIndex: 2,
        }}>
          {card.label}
        </div>

        {/* KPI — número grande, peso 800, token primary */}
        {card.kpiValue !== '' && (
          <div style={{
            fontFamily: "'Montserrat', sans-serif",
            fontSize: '34px',
            fontWeight: 800,
            color: ARIA.textPrimary,
            letterSpacing: '-1px',
            textAlign: 'left', width: '100%', lineHeight: 1,
            marginTop: '6px',
            position: 'relative',
            zIndex: 2,
          }}>
            {card.kpiValue}
          </div>
        )}

        {/* Status/subtítulo — token secondary */}
        <div style={{
          fontFamily: "'Montserrat', sans-serif",
          fontSize: '12px',
          fontWeight: 500,
          color: ARIA.textSecondary,
          letterSpacing: '0.2px',
          textAlign: 'left', width: '100%',
          marginTop: '6px',
          position: 'relative',
          zIndex: 2,
        }}>
          {card.statusText}
        </div>

        {/* Icono — MISMO glyph, +10% vs versión previa. Posición intacta. */}
        <div
          style={{
            position: 'absolute',
            right: '20px', bottom: '20px',
            width: '56px',
            height: '56px',
            pointerEvents: 'none',
            opacity: isHovered ? 0.95 : 0.85,
            transition: 'opacity 180ms ease',
            zIndex: 2,
          }}
        >
          <UnifiedIcon id={card.iconId} />
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
      background: `linear-gradient(180deg, ${ARIA.canvasStart} 0%, ${ARIA.canvasEnd} 100%)`,
      fontFamily: "'Montserrat', sans-serif",
      color: ARIA.textPrimary,
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
        padding: '28px 24px',
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
