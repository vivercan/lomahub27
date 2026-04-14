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
  decorType: 'circle' | 'square' | 'chevron' | 'multi' | 'wave'
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
    { id: 'oportunidades', label: 'Oportunidades', route: '/ventas/mis-leads', bgColor: '#F97316', gradient: 'linear-gradient(135deg, #F97316 0%, #FBBF24 100%)', decorType: 'circle', decorColor: 'rgba(253,191,36,0.85)', iconFile: 'oportunidades.svg', iconOpacity: 0.07, kpiValue: kpis.leadsActivos, kpiLabel: 'leads', statusDot: 'green', statusText: 'Pipeline activo', gridColumn: '1 / 2', gridRow: '1 / 2' },
    { id: 'servicio-clientes', label: 'Servicio al Cliente', route: '/servicio/dashboard', bgColor: '#3B82F6', gradient: 'linear-gradient(135deg, #2563EB 0%, #38BDF8 100%)', decorType: 'chevron', decorColor: 'rgba(14,165,233,0.9)', decorSecondary: 'rgba(125,211,252,0.6)', iconFile: 'servicio-al-cliente.svg', iconOpacity: 0.07, kpiValue: kpis.clientes.toLocaleString(), kpiLabel: 'clientes', statusDot: 'green', statusText: '3 subm\u00f3dulos', gridColumn: '2 / 4', gridRow: '1 / 2' },
    { id: 'comercial', label: 'Comercial', route: '/ventas/dashboard', bgColor: '#A855F7', gradient: 'linear-gradient(160deg, #A855F7 0%, #EC4899 100%)', decorType: 'square', decorColor: 'rgba(236,72,153,0.8)', decorSecondary: 'rgba(192,132,252,0.6)', iconFile: 'comercial.svg', iconOpacity: 0.07, kpiValue: kpis.formatosActivos.toLocaleString(), kpiLabel: 'formatos', statusDot: 'green', statusText: '11 subm\u00f3dulos', gridColumn: '4 / 5', gridRow: '1 / 3' },
    { id: 'operaciones', label: 'Operaciones', route: '/operaciones/dashboard', bgColor: '#0F172A', gradient: 'linear-gradient(140deg, #0F172A 0%, #1E293B 100%)', decorType: 'multi', decorColor: '#F97316', decorSecondary: '#A855F7', iconFile: 'Despacho inteligente.svg', iconOpacity: 0.07, kpiValue: kpis.viajesActivos, kpiLabel: 'viajes', statusDot: kpis.viajesActivos > 0 ? 'green' : 'gray', statusText: kpis.viajesActivos > 0 ? 'Operando' : 'Sin viajes', gridColumn: '1 / 2', gridRow: '2 / 3' },
    { id: 'ventas', label: 'Ventas', route: '/ventas/analytics', bgColor: '#EC4899', gradient: 'linear-gradient(135deg, #F43F5E 0%, #EC4899 100%)', decorType: 'square', decorColor: 'rgba(251,207,232,0.85)', decorSecondary: 'rgba(252,165,165,0.55)', iconFile: 'Ventas.svg', iconOpacity: 0.07, kpiValue: kpis.formatosActivos.toLocaleString(), kpiLabel: 'formatos', statusDot: 'green', statusText: 'Pipeline activo', gridColumn: '2 / 3', gridRow: '2 / 3' },
    { id: 'comunicaciones', label: 'Comunicaciones', route: '/comunicaciones/dashboard', bgColor: '#FAFAFA', gradient: 'linear-gradient(165deg, #FAFAFA 0%, #F3F4F6 100%)', decorType: 'multi', decorColor: '#F97316', decorSecondary: '#3B82F6', iconFile: 'comunicaciones.svg', iconOpacity: 0.25, kpiValue: '5', kpiLabel: 'canales', statusDot: 'green', statusText: 'Activo', gridColumn: '3 / 4', gridRow: '2 / 4' },
    { id: 'jj', label: 'JJ', route: '/', bgColor: '#0F172A', gradient: 'linear-gradient(135deg, #0F172A 0%, #312E81 50%, #7C3AED 100%)', decorType: 'wave', decorColor: 'rgba(249,115,22,0.8)', decorSecondary: 'rgba(168,85,247,0.7)', iconFile: 'configuracion.svg', iconOpacity: 0.07, kpiValue: '', kpiLabel: '', statusDot: 'gray', statusText: 'Placeholder', gridColumn: '1 / 3', gridRow: '3 / 4' },
    { id: 'config', label: 'Configuración', route: '/admin/configuracion', bgColor: '#6366F1', gradient: 'linear-gradient(150deg, #6366F1 0%, #8B5CF6 100%)', decorType: 'square', decorColor: 'rgba(196,181,253,0.65)', decorSecondary: 'rgba(99,102,241,0.4)', iconFile: 'configuracion.svg', iconOpacity: 0.07, kpiValue: '', kpiLabel: 'admin', statusDot: 'gray', statusText: 'Sistema', gridColumn: '4 / 5', gridRow: '3 / 4' },
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
    borderRadius: '22px',
    padding: '26px',
    background: card.gradient,
    border: 'none',
    cursor: 'pointer',
    position: 'relative',
    overflow: 'hidden',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'flex-start',
    justifyContent: 'flex-start',
    transition: 'transform 0.5s cubic-bezier(0.16,1,0.3,1), box-shadow 0.5s cubic-bezier(0.16,1,0.3,1)',
    transform: isHovered ? 'translateY(-8px)' : 'translateY(0)',
    boxShadow: isHovered
      ? `0 30px 60px -16px ${hexToRgba(card.bgColor, 0.55)}, 0 18px 36px -12px rgba(0,0,0,0.25)`
      : `0 14px 28px -14px ${hexToRgba(card.bgColor, 0.45)}, 0 6px 14px -6px rgba(0,0,0,0.14)`,
  })

  // Renderiza formas geométricas decorativas según el tipo
  const renderDecor = (card: CardConfig, isHovered: boolean) => {
    const baseTransition = 'transform 0.7s cubic-bezier(0.16,1,0.3,1), opacity 0.5s ease'
    if (card.decorType === 'circle') {
      return (
        <div style={{
          position: 'absolute', right: '-20%', bottom: '-30%',
          width: '100%', aspectRatio: '1 / 1',
          borderRadius: '50%', background: card.decorColor,
          transition: baseTransition, pointerEvents: 'none',
          transform: isHovered ? 'translate(-6%,-6%) scale(1.08)' : 'scale(1)',
          boxShadow: `0 0 60px ${card.decorColor}`,
        }} />
      )
    }
    if (card.decorType === 'square') {
      return (
        <>
          {card.decorSecondary && (
            <div style={{
              position: 'absolute', right: '-18%', bottom: '-22%',
              width: '75%', aspectRatio: '1 / 1',
              borderRadius: '28px', background: card.decorSecondary,
              transform: isHovered ? 'rotate(-24deg) scale(1.05)' : 'rotate(-18deg) scale(1)',
              transition: baseTransition, pointerEvents: 'none',
            }} />
          )}
          <div style={{
            position: 'absolute', right: '-8%', bottom: '-12%',
            width: '62%', aspectRatio: '1 / 1',
            borderRadius: '24px', background: card.decorColor,
            transform: isHovered ? 'rotate(18deg) scale(1.08)' : 'rotate(12deg) scale(1)',
            transition: baseTransition, pointerEvents: 'none',
            boxShadow: `0 10px 30px ${card.decorColor}`,
          }} />
        </>
      )
    }
    if (card.decorType === 'chevron') {
      return (
        <>
          <div style={{
            position: 'absolute', right: '-5%', top: '-20%',
            width: '40%', height: '140%',
            background: card.decorColor,
            clipPath: 'polygon(0 50%, 45% 0, 100% 0, 55% 50%, 100% 100%, 45% 100%)',
            transform: isHovered ? 'translateX(-10px) scale(1.05)' : 'translateX(0) scale(1)',
            transition: baseTransition, pointerEvents: 'none',
          }} />
          {card.decorSecondary && (
            <div style={{
              position: 'absolute', right: '15%', top: '-20%',
              width: '35%', height: '140%',
              background: card.decorSecondary,
              clipPath: 'polygon(0 50%, 45% 0, 100% 0, 55% 50%, 100% 100%, 45% 100%)',
              transform: isHovered ? 'translateX(-6px) scale(1.03)' : 'translateX(0) scale(1)',
              transition: baseTransition, pointerEvents: 'none',
              opacity: 0.85,
            }} />
          )}
        </>
      )
    }
    if (card.decorType === 'multi') {
      return (
        <>
          <div style={{
            position: 'absolute', right: '8%', bottom: '-10%',
            width: '55%', aspectRatio: '1 / 1',
            borderRadius: '50%',
            background: `radial-gradient(circle at 30% 30%, ${card.decorColor}, ${card.decorColor} 60%, transparent 100%)`,
            transform: isHovered ? 'translate(-10px,-10px) scale(1.1)' : 'scale(1)',
            transition: baseTransition, pointerEvents: 'none',
            filter: `drop-shadow(0 8px 24px ${card.decorColor})`,
          }} />
          {card.decorSecondary && (
            <div style={{
              position: 'absolute', right: '42%', bottom: '20%',
              width: '30%', aspectRatio: '1 / 1',
              borderRadius: '50%',
              background: `radial-gradient(circle at 30% 30%, ${card.decorSecondary}, ${card.decorSecondary} 60%, transparent 100%)`,
              transform: isHovered ? 'translate(6px,-6px) scale(1.12)' : 'scale(1)',
              transition: baseTransition, pointerEvents: 'none',
              filter: `drop-shadow(0 6px 18px ${card.decorSecondary})`,
            }} />
          )}
        </>
      )
    }
    if (card.decorType === 'wave') {
      return (
        <>
          <div style={{
            position: 'absolute', right: '-5%', bottom: '-20%',
            width: '45%', aspectRatio: '1 / 1',
            borderRadius: '50%', background: card.decorColor,
            transform: isHovered ? 'translate(-10px,-10px) scale(1.1)' : 'scale(1)',
            transition: baseTransition, pointerEvents: 'none',
            filter: `drop-shadow(0 10px 30px ${card.decorColor})`,
          }} />
          {card.decorSecondary && (
            <div style={{
              position: 'absolute', right: '28%', bottom: '-5%',
              width: '28%', aspectRatio: '1 / 1',
              borderRadius: '50%', background: card.decorSecondary,
              transform: isHovered ? 'translate(4px,-8px) scale(1.1)' : 'scale(1)',
              transition: baseTransition, pointerEvents: 'none',
              filter: `drop-shadow(0 8px 22px ${card.decorSecondary})`,
            }} />
          )}
        </>
      )
    }
    return null
  }

  const renderCard = (card: CardConfig) => {
    const isHovered = hoveredCard === card.id
    // Card clara (comunicaciones) usa texto oscuro, el resto blanco
    const isLight = card.id === 'comunicaciones'
    const textColor = isLight ? '#0F172A' : '#FFFFFF'
    const mutedColor = isLight ? 'rgba(15,23,42,0.65)' : 'rgba(255,255,255,0.85)'
    const eyebrow = isLight ? 'rgba(15,23,42,0.55)' : 'rgba(255,255,255,0.75)'
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
          fontSize: '11px',
          fontWeight: 700,
          color: eyebrow,
          letterSpacing: '1.8px',
          textTransform: 'uppercase',
          position: 'relative',
          zIndex: 2,
        }}>
          {card.kpiLabel || 'Módulo'}
        </div>
        <div style={{
          fontFamily: "'Montserrat', sans-serif",
          fontSize: '30px',
          fontWeight: 800,
          color: textColor,
          letterSpacing: '-0.5px',
          lineHeight: 1.1,
          marginTop: '8px',
          marginBottom: 'auto',
          textAlign: 'left', width: '100%',
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
      backgroundColor: '#E8EBF0',
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












