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
    { id: 'oportunidades', label: 'Oportunidades', route: '/ventas/mis-leads', bgColor: '#0D1220', gradient: 'linear-gradient(135deg, #0B0F1A 0%, #161C2C 100%)', decorType: 'silk', decorColor: 'rgba(255,255,255,0.08)', iconFile: 'oportunidades.svg', iconOpacity: 0, kpiValue: kpis.leadsActivos, kpiLabel: 'leads', statusDot: 'green', statusText: 'Pipeline activo', gridColumn: '1 / 2', gridRow: '1 / 2' },
    { id: 'servicio-clientes', label: 'Servicio al Cliente', route: '/servicio/dashboard', bgColor: '#172554', gradient: 'linear-gradient(135deg, #0B1226 0%, #13204A 50%, #1E3A8A 100%)', decorType: 'silk', decorColor: 'rgba(255,255,255,0.14)', iconFile: 'servicio-al-cliente.svg', iconOpacity: 0, kpiValue: kpis.clientes.toLocaleString(), kpiLabel: 'clientes', statusDot: 'green', statusText: '3 submódulos', gridColumn: '2 / 4', gridRow: '1 / 2' },
    { id: 'comercial', label: 'Comercial', route: '/ventas/dashboard', bgColor: '#172554', gradient: 'linear-gradient(135deg, #0A0F22 0%, #131C3E 50%, #1E3072 100%)', decorType: 'silk', decorColor: 'rgba(255,255,255,0.12)', iconFile: 'comercial.svg', iconOpacity: 0, kpiValue: kpis.formatosActivos.toLocaleString(), kpiLabel: 'formatos', statusDot: 'green', statusText: '11 submódulos', gridColumn: '4 / 5', gridRow: '1 / 3' },
    { id: 'operaciones', label: 'Operaciones', route: '/operaciones/dashboard', bgColor: '#0D1220', gradient: 'linear-gradient(135deg, #0B0F1A 0%, #181E2E 100%)', decorType: 'silk', decorColor: 'rgba(255,255,255,0.09)', iconFile: 'Despacho inteligente.svg', iconOpacity: 0, kpiValue: kpis.viajesActivos, kpiLabel: 'viajes', statusDot: kpis.viajesActivos > 0 ? 'green' : 'gray', statusText: kpis.viajesActivos > 0 ? 'Operando' : 'Sin viajes', gridColumn: '1 / 2', gridRow: '2 / 3' },
    { id: 'ventas', label: 'Ventas', route: '/ventas/analytics', bgColor: '#2563EB', gradient: 'linear-gradient(135deg, #1D4ED8 0%, #2563EB 45%, #3B82F6 100%)', decorType: 'silk', decorColor: 'rgba(255,255,255,0.22)', iconFile: 'Ventas.svg', iconOpacity: 0, kpiValue: kpis.formatosActivos.toLocaleString(), kpiLabel: 'formatos', statusDot: 'green', statusText: 'Pipeline activo', gridColumn: '2 / 3', gridRow: '2 / 3' },
    { id: 'comunicaciones', label: 'Comunicaciones', route: '/comunicaciones/dashboard', bgColor: '#0D1220', gradient: 'linear-gradient(135deg, #0A0E18 0%, #161C2A 100%)', decorType: 'ring', decorColor: 'rgba(255,255,255,0.08)', iconFile: 'comunicaciones.svg', iconOpacity: 0, kpiValue: '5', kpiLabel: 'canales', statusDot: 'green', statusText: 'Activo', gridColumn: '3 / 4', gridRow: '2 / 4' },
    { id: 'autofomento', label: 'Auto Fomento SEAT', route: '/', bgColor: '#2E3138', gradient: 'linear-gradient(135deg, #22252B 0%, #2E3138 45%, #3A3E46 100%)', decorType: 'silk', decorColor: 'rgba(255,255,255,0.12)', iconFile: 'configuracion.svg', iconOpacity: 0, kpiValue: '', kpiLabel: '', statusDot: 'gray', statusText: 'Próximamente', gridColumn: '1 / 3', gridRow: '3 / 4' },
    { id: 'config', label: 'Configuración', route: '/admin/configuracion', bgColor: '#0D1220', gradient: 'linear-gradient(135deg, #0B0F1A 0%, #181E2E 100%)', decorType: 'gear', decorColor: 'rgba(255,255,255,0.10)', iconFile: 'configuracion.svg', iconOpacity: 0.16, kpiValue: '', kpiLabel: 'admin', statusDot: 'gray', statusText: 'Sistema', gridColumn: '4 / 5', gridRow: '3 / 4' },
  ]

  // Helper: convierte hex a rgba con alpha, para sombras teñidas del color del card
  const hexToRgba = (hex: string, alpha: number): string => {
    const h = hex.replace('#', '')
    const r = parseInt(h.substring(0, 2), 16)
    const g = parseInt(h.substring(2, 4), 16)
    const b = parseInt(h.substring(4, 6), 16)
    return `rgba(${r},${g},${b},${alpha})`
  }

  const getCardStyle = (isHovered: boolean, card: CardConfig): React.CSSProperties => ({
    gridColumn: card.gridColumn,
    gridRow: card.gridRow,
    minHeight: 0,
    borderRadius: '20px',
    padding: '26px',
    // Fondo sobrio: gradiente base + viñeta muy sutil para profundidad premium
    background: `
      radial-gradient(ellipse at 20% 0%, rgba(255,255,255,0.06) 0%, transparent 55%),
      ${card.gradient}
    `,
    border: '1px solid rgba(255,255,255,0.06)',
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
    boxShadow: isHovered
      ? `
        0 22px 44px -18px rgba(0,0,0,0.45),
        0 12px 24px -10px rgba(0,0,0,0.30),
        inset 0 1px 0 rgba(255,255,255,0.10)
      `
      : `
        0 12px 28px -14px rgba(0,0,0,0.35),
        0 6px 14px -6px rgba(0,0,0,0.22),
        inset 0 1px 0 rgba(255,255,255,0.06)
      `,
  })

  // Superficies curvas con efecto chrome-fold (sombra + brillo) estilo master Tesla
  const renderDecor = (card: CardConfig, isHovered: boolean) => {
    const baseTransition = 'transform 1s cubic-bezier(0.16,1,0.3,1), opacity 0.6s ease'
    // Intensidad del highlight según el card
    const intensity =
      card.id === 'ventas' ? 1.5
      : card.id === 'servicio-clientes' || card.id === 'comercial' ? 1.15
      : card.id === 'autofomento' ? 0.9
      : 1.0
    // Offset por card para que no sean idénticos
    const offsets: Record<string, { a: number; b: number; c: number }> = {
      'oportunidades': { a: 0, b: 0, c: 0 },
      'servicio-clientes': { a: -10, b: 6, c: -4 },
      'comercial': { a: 8, b: -8, c: 4 },
      'operaciones': { a: -4, b: 4, c: -2 },
      'ventas': { a: 4, b: -6, c: 6 },
      'autofomento': { a: 12, b: -10, c: 8 },
      'comunicaciones': { a: -6, b: 8, c: -4 },
      'config': { a: 10, b: -6, c: 2 },
    }
    const o = offsets[card.id] || { a: 0, b: 0, c: 0 }

    const chromeFolds = (
      <svg
        viewBox="0 0 400 240"
        preserveAspectRatio="none"
        style={{
          position: 'absolute', inset: 0,
          width: '100%', height: '100%',
          pointerEvents: 'none',
          transition: baseTransition,
          transform: isHovered ? 'scale(1.02)' : 'scale(1)',
        }}
      >
        <defs>
          {/* Fold gradient principal: sombra arriba → brillo medio → sombra abajo (efecto superficie curvada) */}
          <linearGradient id={`fold1-${card.id}`} x1="50%" y1="0%" x2="50%" y2="100%">
            <stop offset="0%" stopColor="#000000" stopOpacity={0.35} />
            <stop offset="28%" stopColor="#000000" stopOpacity={0.08} />
            <stop offset="52%" stopColor="#FFFFFF" stopOpacity={0.26 * intensity} />
            <stop offset="68%" stopColor="#FFFFFF" stopOpacity={0.04} />
            <stop offset="100%" stopColor="#000000" stopOpacity={0.20} />
          </linearGradient>
          {/* Fold secundario */}
          <linearGradient id={`fold2-${card.id}`} x1="50%" y1="0%" x2="50%" y2="100%">
            <stop offset="0%" stopColor="#000000" stopOpacity={0.22} />
            <stop offset="50%" stopColor="#FFFFFF" stopOpacity={0.14 * intensity} />
            <stop offset="100%" stopColor="#000000" stopOpacity={0.10} />
          </linearGradient>
          {/* Viñeta superior izquierda */}
          <radialGradient id={`vignette-${card.id}`} cx="0%" cy="0%" r="100%">
            <stop offset="0%" stopColor="#000000" stopOpacity={0.30} />
            <stop offset="50%" stopColor="#000000" stopOpacity="0" />
          </radialGradient>
          {/* Hairline brillante */}
          <linearGradient id={`hair-${card.id}`} x1="0%" y1="50%" x2="100%" y2="50%">
            <stop offset="0%" stopColor="#FFFFFF" stopOpacity="0" />
            <stop offset="45%" stopColor="#FFFFFF" stopOpacity={0.55 * intensity} />
            <stop offset="100%" stopColor="#FFFFFF" stopOpacity="0" />
          </linearGradient>
        </defs>
        {/* Capa 0: viñeta superior-izquierda (profundidad) */}
        <rect width="400" height="240" fill={`url(#vignette-${card.id})`} />
        {/* Capa 1: ribbon principal grande (superficie curvada diagonal) */}
        <path
          d={`M -40 ${60 + o.a} Q 100 ${20 + o.b} 250 ${70 + o.c} T 460 ${40 + o.a}
              L 460 ${170 + o.b} Q 300 ${210 - o.c} 140 ${170 + o.a} T -40 ${210 + o.b} Z`}
          fill={`url(#fold1-${card.id})`}
        />
        {/* Capa 2: ribbon secundario inferior */}
        <path
          d={`M -30 ${180 + o.b} Q 140 ${110 - o.c} 300 ${150 + o.a} T 460 ${110 + o.c}
              L 460 ${235} Q 300 ${255} 140 ${225 + o.b} T -30 ${255} Z`}
          fill={`url(#fold2-${card.id})`}
        />
        {/* Capa 3: hairline brillante nítido sobre el pliegue */}
        <path
          d={`M -10 ${125 + o.a} Q 130 ${55 + o.b} 270 ${100 + o.c} T 430 ${65 + o.a}`}
          stroke={`url(#hair-${card.id})`}
          strokeWidth="1.1"
          fill="none"
        />
        {/* Capa 4: hairline tenue paralelo */}
        <path
          d={`M 10 ${155 + o.c} Q 150 ${85 + o.a} 290 ${130 + o.b} T 440 ${95 + o.c}`}
          stroke="#FFFFFF"
          strokeOpacity={0.18 * intensity}
          strokeWidth="0.8"
          fill="none"
        />
      </svg>
    )

    if (card.decorType === 'silk') {
      return chromeFolds
    }
    if (card.decorType === 'ring') {
      return (
        <>
          {chromeFolds}
          <svg
            viewBox="0 0 400 400"
            preserveAspectRatio="xMidYMid meet"
            style={{
              position: 'absolute',
              right: '-18%', bottom: '-22%',
              width: '92%', height: '92%',
              pointerEvents: 'none',
              transition: baseTransition,
              transform: isHovered ? 'scale(1.04)' : 'scale(1)',
            }}
          >
            <defs>
              <radialGradient id={`ringGlow-${card.id}`} cx="50%" cy="50%" r="50%">
                <stop offset="60%" stopColor="rgba(255,255,255,0)" />
                <stop offset="82%" stopColor="rgba(255,255,255,0.18)" />
                <stop offset="100%" stopColor="rgba(255,255,255,0)" />
              </radialGradient>
            </defs>
            <circle cx="200" cy="200" r="180" fill={`url(#ringGlow-${card.id})`} />
            <circle cx="200" cy="200" r="180" fill="none" stroke="rgba(255,255,255,0.28)" strokeWidth="1.5" />
            <circle cx="200" cy="200" r="155" fill="none" stroke="rgba(255,255,255,0.12)" strokeWidth="1" />
            <circle cx="200" cy="200" r="128" fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="1" />
          </svg>
        </>
      )
    }
    if (card.decorType === 'gear') {
      return (
        <>
          {chromeFolds}
          <img
            src={`/icons/dashboard/${card.iconFile}`}
            alt=""
            style={{
              position: 'absolute',
              right: '-10%', bottom: '-14%',
              width: '70%', height: '70%',
              opacity: 0.25,
              filter: 'brightness(0) invert(1) drop-shadow(0 3px 10px rgba(0,0,0,0.5))',
              transform: isHovered ? 'rotate(18deg) scale(1.04)' : 'rotate(12deg) scale(1)',
              transition: baseTransition, pointerEvents: 'none',
            }}
          />
        </>
      )
    }
    return null
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
          position: 'absolute', top: '14px', right: '14px',
          width: '8px', height: '8px', borderRadius: '50%',
          backgroundColor: DOT_COLORS[card.statusDot] || DOT_COLORS.gray,
          boxShadow: `0 0 10px ${DOT_COLORS[card.statusDot] || DOT_COLORS.gray}`,
          zIndex: 3,
        }} />
        <div style={{
          fontFamily: "'Montserrat', sans-serif",
          fontSize: '32px',
          fontWeight: 800,
          color: textColor,
          letterSpacing: '-0.5px',
          lineHeight: 1.1,
          marginBottom: 'auto',
          textAlign: 'left', width: '100%',
          textShadow: '0 2px 6px rgba(0,0,0,0.35)',
          position: 'relative',
          zIndex: 2,
        }}>
          {card.label}
        </div>
        {card.kpiValue !== '' && (
          <div style={{
            fontFamily: "'Montserrat', sans-serif",
            fontSize: '46px',
            fontWeight: 800,
            color: textColor,
            letterSpacing: '-1.5px',
            textAlign: 'left', width: '100%', lineHeight: 1,
            marginTop: '6px',
            position: 'relative',
            zIndex: 2,
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
      background: 'radial-gradient(ellipse at 50% 0%, #EEF1F5 0%, #DFE3EA 60%, #D3D8E0 100%)',
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












