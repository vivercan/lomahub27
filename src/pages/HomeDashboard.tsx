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
    { id: 'oportunidades', label: 'Oportunidades', route: '/ventas/mis-leads', bgColor: '#1E3A8A', iconFile: 'oportunidades.svg', iconOpacity: 0.07, kpiValue: kpis.leadsActivos, kpiLabel: 'leads', statusDot: 'green', statusText: 'Pipeline activo', gridColumn: '1 / 2', gridRow: '1 / 2' },
    { id: 'servicio-clientes', label: 'Servicio al Cliente', route: '/servicio/dashboard', bgColor: '#1E40AF', iconFile: 'servicio-al-cliente.svg', iconOpacity: 0.07, kpiValue: kpis.clientes.toLocaleString(), kpiLabel: 'clientes', statusDot: 'green', statusText: '3 subm\u00f3dulos', gridColumn: '2 / 4', gridRow: '1 / 2' },
    { id: 'comercial', label: 'Comercial', route: '/ventas/dashboard', bgColor: '#1D4ED8', iconFile: 'comercial.svg', iconOpacity: 0.07, kpiValue: kpis.formatosActivos.toLocaleString(), kpiLabel: 'formatos', statusDot: 'green', statusText: '11 subm\u00f3dulos', gridColumn: '4 / 5', gridRow: '1 / 3' },
    { id: 'operaciones', label: 'Operaciones', route: '/operaciones/dashboard', bgColor: '#2563EB', iconFile: 'Despacho inteligente.svg', iconOpacity: 0.07, kpiValue: kpis.viajesActivos, kpiLabel: 'viajes', statusDot: kpis.viajesActivos > 0 ? 'green' : 'gray', statusText: kpis.viajesActivos > 0 ? 'Operando' : 'Sin viajes', gridColumn: '1 / 2', gridRow: '2 / 3' },
    { id: 'ventas', label: 'Ventas', route: '/ventas/analytics', bgColor: '#3B82F6', iconFile: 'Ventas.svg', iconOpacity: 0.07, kpiValue: kpis.formatosActivos.toLocaleString(), kpiLabel: 'formatos', statusDot: 'green', statusText: 'Pipeline activo', gridColumn: '2 / 3', gridRow: '2 / 3' },
    { id: 'comunicaciones', label: 'Comunicaciones', route: '/comunicaciones/dashboard', bgColor: '#2563EB', iconFile: 'comunicaciones.svg', iconOpacity: 0.25, kpiValue: '5', kpiLabel: 'canales', statusDot: 'green', statusText: 'Activo', gridColumn: '3 / 4', gridRow: '2 / 4' },
    { id: 'jj', label: 'JJ', route: '/', bgColor: '#1E293B', iconFile: 'configuracion.svg', iconOpacity: 0.07, kpiValue: '', kpiLabel: '', statusDot: 'gray', statusText: 'Placeholder', gridColumn: '1 / 3', gridRow: '3 / 4' },
    { id: 'config', label: 'Configuración', route: '/admin/configuracion', bgColor: '#334155', iconFile: 'configuracion.svg', iconOpacity: 0.07, kpiValue: '', kpiLabel: 'admin', statusDot: 'gray', statusText: 'Sistema', gridColumn: '4 / 5', gridRow: '3 / 4' },
  ]

  // Helper: convierte hex a rgba con alpha, para sombras teñidas del color del card
  const hexToRgba = (hex: string, alpha: number): string => {
    const h = hex.replace('#', '')
    const r = parseInt(h.substring(0, 2), 16)
    const g = parseInt(h.substring(2, 4), 16)
    const b = parseInt(h.substring(4, 6), 16)
    return `rgba(${r},${g},${b},${alpha})`
  }

  const getCardStyle = (isHovered: boolean, bgColor: string, gridColumn: string, gridRow: string): React.CSSProperties => ({
    gridColumn,
    gridRow,
    minHeight: 0,
    borderRadius: '20px',
    padding: '28px',
    // Volumen real sin parecer cristal: arriba el color base un poco aclarado, abajo oscurecido
    background: `linear-gradient(180deg, ${hexToRgba('#FFFFFF', 0.12)} 0%, rgba(255,255,255,0) 35%, rgba(0,0,0,0) 65%, ${hexToRgba('#000000', 0.28)} 100%), ${bgColor}`,
    border: 'none',
    cursor: 'pointer',
    position: 'relative',
    overflow: 'hidden',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'flex-start',
    transition: 'transform 0.45s cubic-bezier(0.16,1,0.3,1), box-shadow 0.45s cubic-bezier(0.16,1,0.3,1)',
    transform: isHovered ? 'translateY(-14px) scale(1.04)' : 'translateY(0) scale(1)',
    boxShadow: isHovered
      ? `
        0 0 0 3px ${hexToRgba(bgColor, 0.35)},
        0 0 50px 6px ${hexToRgba(bgColor, 0.7)},
        0 45px 90px -16px ${hexToRgba(bgColor, 0.9)},
        0 28px 56px -10px ${hexToRgba(bgColor, 0.65)},
        0 14px 28px -6px rgba(0,0,0,0.4),
        inset 0 3px 0 rgba(255,255,255,0.55),
        inset 0 1px 0 rgba(255,255,255,0.9),
        inset 2px 0 4px rgba(255,255,255,0.15),
        inset -2px 0 4px rgba(0,0,0,0.18),
        inset 0 -4px 0 rgba(0,0,0,0.35),
        inset 0 -8px 20px rgba(0,0,0,0.25)
      `
      : `
        0 26px 50px -14px ${hexToRgba(bgColor, 0.65)},
        0 14px 26px -8px ${hexToRgba(bgColor, 0.45)},
        0 5px 10px -2px rgba(0,0,0,0.22),
        inset 0 2px 0 rgba(255,255,255,0.38),
        inset 0 1px 0 rgba(255,255,255,0.7),
        inset 2px 0 3px rgba(255,255,255,0.10),
        inset -2px 0 3px rgba(0,0,0,0.14),
        inset 0 -3px 0 rgba(0,0,0,0.28),
        inset 0 -8px 18px rgba(0,0,0,0.22)
      `,
  })

  const renderCard = (card: CardConfig) => {
    const isHovered = hoveredCard === card.id
    return (
      <div
        key={card.id}
        onClick={() => navigate(card.route)}
        onMouseEnter={() => setHoveredCard(card.id)}
        onMouseLeave={() => setHoveredCard(null)}
        style={getCardStyle(isHovered, card.bgColor, card.gridColumn, card.gridRow)}
      >
        <div style={{
          position: 'absolute', top: '14px', right: '14px',
          width: '8px', height: '8px', borderRadius: '50%',
          backgroundColor: DOT_COLORS[card.statusDot] || DOT_COLORS.gray,
          boxShadow: `0 0 8px ${DOT_COLORS[card.statusDot] || DOT_COLORS.gray}, inset 0 1px 0 rgba(255,255,255,0.5)`,
          zIndex: 2,
        }} />
        <img
          src={`/icons/dashboard/${card.iconFile}`}
          alt=""
          style={{
            position: 'absolute',
            right: '-5%',
            bottom: '-8%',
            width: '70%',
            height: '70%',
            objectFit: 'contain',
            pointerEvents: 'none',
            opacity: isHovered ? Math.min(card.iconOpacity * 2.2, 0.35) : card.iconOpacity,
            filter: 'brightness(0) invert(1)',
            transition: 'transform 0.6s cubic-bezier(0.16,1,0.3,1), opacity 0.4s ease',
            transform: isHovered ? 'translate(8px,-8px) scale(1.15) rotate(-3deg)' : 'translate(0,0) scale(1) rotate(0deg)',
          }}
        />
        <div style={{
          fontFamily: "'Montserrat', sans-serif",
          fontSize: '32px',
          fontWeight: 800,
          color: '#FFFFFF',
          letterSpacing: '-0.5px',
          lineHeight: 1.15,
          marginBottom: 'auto',
          whiteSpace: 'nowrap', textAlign: 'center',
          textShadow: '0 2px 4px rgba(0,0,0,0.35), 0 4px 12px rgba(0,0,0,0.22)',
          position: 'relative',
          zIndex: 1,
        }}>
          {card.label}
        </div>
        <div style={{
          fontFamily: "'Montserrat', sans-serif",
          fontSize: '44px',
          fontWeight: 700,
          color: '#FFFFFF',
          letterSpacing: '-1px',
          textAlign: 'left', width: '100%', lineHeight: 1,
          marginTop: '6px',
          textShadow: '0 2px 4px rgba(0,0,0,0.25), 0 4px 12px rgba(0,0,0,0.15)',
          position: 'relative',
          zIndex: 1,
        }}>
          {card.kpiValue}
        </div>
        <div style={{
          fontFamily: "'Montserrat', sans-serif",
          fontSize: '12px',
          fontWeight: 500,
          color: 'rgba(255,255,255,0.85)',
          letterSpacing: '0.2px',
          textAlign: 'left', width: '100%',
          marginTop: '4px',
          textShadow: '0 1px 2px rgba(0,0,0,0.2)',
          position: 'relative',
          zIndex: 1,
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












