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
    { id: 'servicio-clientes', label: 'Servicio al Cliente', route: '/servicio/dashboard', bgColor: '#1E3A8A', gradient: 'linear-gradient(135deg, #172554 0%, #1E3A8A 45%, #2E5AD6 100%)', decorType: 'silk', decorColor: 'rgba(255,255,255,0.14)', iconFile: 'servicio-al-cliente.svg', iconOpacity: 0, kpiValue: kpis.clientes.toLocaleString(), kpiLabel: 'clientes', statusDot: 'green', statusText: '3 submódulos', gridColumn: '2 / 4', gridRow: '1 / 2' },
    { id: 'comercial', label: 'Comercial', route: '/ventas/dashboard', bgColor: '#1E3A8A', gradient: 'linear-gradient(135deg, #0F1936 0%, #1E3A8A 55%, #2A4FB8 100%)', decorType: 'silk', decorColor: 'rgba(255,255,255,0.12)', iconFile: 'comercial.svg', iconOpacity: 0, kpiValue: kpis.formatosActivos.toLocaleString(), kpiLabel: 'formatos', statusDot: 'green', statusText: '11 submódulos', gridColumn: '4 / 5', gridRow: '1 / 3' },
    { id: 'operaciones', label: 'Operaciones', route: '/operaciones/dashboard', bgColor: '#0D1220', gradient: 'linear-gradient(135deg, #0B0F1A 0%, #181E2E 100%)', decorType: 'silk', decorColor: 'rgba(255,255,255,0.09)', iconFile: 'Despacho inteligente.svg', iconOpacity: 0, kpiValue: kpis.viajesActivos, kpiLabel: 'viajes', statusDot: kpis.viajesActivos > 0 ? 'green' : 'gray', statusText: kpis.viajesActivos > 0 ? 'Operando' : 'Sin viajes', gridColumn: '1 / 2', gridRow: '2 / 3' },
    { id: 'ventas', label: 'Ventas', route: '/ventas/analytics', bgColor: '#1E40AF', gradient: 'linear-gradient(135deg, #1E3A8A 0%, #2563EB 60%, #3B82F6 100%)', decorType: 'silk', decorColor: 'rgba(255,255,255,0.15)', iconFile: 'Ventas.svg', iconOpacity: 0, kpiValue: kpis.formatosActivos.toLocaleString(), kpiLabel: 'formatos', statusDot: 'green', statusText: 'Pipeline activo', gridColumn: '2 / 3', gridRow: '2 / 3' },
    { id: 'comunicaciones', label: 'Comunicaciones', route: '/comunicaciones/dashboard', bgColor: '#0D1220', gradient: 'linear-gradient(135deg, #0A0E18 0%, #161C2A 100%)', decorType: 'ring', decorColor: 'rgba(255,255,255,0.08)', iconFile: 'comunicaciones.svg', iconOpacity: 0, kpiValue: '5', kpiLabel: 'canales', statusDot: 'green', statusText: 'Activo', gridColumn: '3 / 4', gridRow: '2 / 4' },
    { id: 'jj', label: 'JJ', route: '/', bgColor: '#0D1220', gradient: 'linear-gradient(135deg, #0A0E18 0%, #14192A 50%, #1C2236 100%)', decorType: 'silk', decorColor: 'rgba(255,255,255,0.10)', iconFile: 'configuracion.svg', iconOpacity: 0, kpiValue: '', kpiLabel: '', statusDot: 'gray', statusText: 'Placeholder', gridColumn: '1 / 3', gridRow: '3 / 4' },
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

  // Renderiza decoración abstracta integrada (estilo premium dark, no elementos sueltos)
  const renderDecor = (card: CardConfig, isHovered: boolean) => {
    const baseTransition = 'transform 0.8s cubic-bezier(0.16,1,0.3,1), opacity 0.6s ease'
    if (card.decorType === 'silk') {
      // Franja diagonal de luz satinada integrada al fondo (no pegote)
      return (
        <>
          <div style={{
            position: 'absolute', inset: 0,
            background: `linear-gradient(108deg, transparent 38%, ${card.decorColor} 52%, transparent 66%)`,
            transform: isHovered ? 'translateX(3%)' : 'translateX(0)',
            transition: baseTransition, pointerEvents: 'none',
            filter: 'blur(0.5px)',
          }} />
          <div style={{
            position: 'absolute', inset: 0,
            background: `linear-gradient(82deg, transparent 62%, rgba(255,255,255,0.035) 78%, transparent 92%)`,
            pointerEvents: 'none',
          }} />
        </>
      )
    }
    if (card.decorType === 'ring') {
      // Anillos sutiles concéntricos, esquina inferior derecha
      return (
        <>
          <div style={{
            position: 'absolute', right: '-22%', bottom: '-30%',
            width: '85%', aspectRatio: '1 / 1',
            borderRadius: '50%',
            border: `1px solid ${card.decorColor}`,
            transform: isHovered ? 'scale(1.04)' : 'scale(1)',
            transition: baseTransition, pointerEvents: 'none',
          }} />
          <div style={{
            position: 'absolute', right: '-8%', bottom: '-16%',
            width: '55%', aspectRatio: '1 / 1',
            borderRadius: '50%',
            border: `1px solid rgba(255,255,255,0.05)`,
            pointerEvents: 'none',
          }} />
          <div style={{
            position: 'absolute', inset: 0,
            background: `linear-gradient(112deg, transparent 55%, rgba(255,255,255,0.05) 72%, transparent 85%)`,
            pointerEvents: 'none',
          }} />
        </>
      )
    }
    if (card.decorType === 'gear') {
      // Ícono engrane sutil + franja de luz
      return (
        <>
          <div style={{
            position: 'absolute', inset: 0,
            background: `linear-gradient(108deg, transparent 42%, ${card.decorColor} 56%, transparent 70%)`,
            pointerEvents: 'none',
          }} />
          <img
            src={`/icons/dashboard/${card.iconFile}`}
            alt=""
            style={{
              position: 'absolute',
              right: '-12%', bottom: '-18%',
              width: '62%', height: '62%',
              opacity: card.iconOpacity,
              filter: 'brightness(0) invert(1)',
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
      background: 'radial-gradient(ellipse at 30% 10%, #E3E7ED 0%, #C9CFD8 55%, #B8BFC9 100%)',
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












