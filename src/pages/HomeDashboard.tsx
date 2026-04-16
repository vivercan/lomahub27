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

// Fintech dark theme — all dots are orange phosphorescent
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

  // Fintech identical — uniform dark card color, same as reference images
  const CARD_BG = '#1A2035'
  const mainCards: CardConfig[] = [
    { id: 'oportunidades', label: 'Oportunidades', route: '/ventas/mis-leads', bgColor: CARD_BG, gradient: CARD_BG, decorType: 'silk', decorColor: 'rgba(255,255,255,0.10)', iconFile: 'oportunidades.svg', iconOpacity: 0.24, kpiValue: kpis.leadsActivos, kpiLabel: 'leads', statusDot: 'green', statusText: 'Pipeline activo', gridColumn: '1 / 2', gridRow: '1 / 2' },
    { id: 'servicio-clientes', label: 'Servicio al Cliente', route: '/servicio/dashboard', bgColor: CARD_BG, gradient: CARD_BG, decorType: 'silk', decorColor: 'rgba(255,255,255,0.07)', iconFile: 'servicio-al-cliente.svg', iconOpacity: 0.24, kpiValue: kpis.clientes.toLocaleString(), kpiLabel: 'clientes', statusDot: 'green', statusText: '3 submódulos', gridColumn: '2 / 4', gridRow: '1 / 2' },
    { id: 'comercial', label: 'Comercial', route: '/ventas/dashboard', bgColor: CARD_BG, gradient: CARD_BG, decorType: 'silk', decorColor: 'rgba(255,255,255,0.10)', iconFile: 'comercial.svg', iconOpacity: 0.24, kpiValue: kpis.formatosActivos.toLocaleString(), kpiLabel: 'formatos', statusDot: 'green', statusText: '11 submódulos', gridColumn: '4 / 5', gridRow: '1 / 3' },
    { id: 'operaciones', label: 'Operaciones', route: '/operaciones/dashboard', bgColor: CARD_BG, gradient: CARD_BG, decorType: 'silk', decorColor: 'rgba(255,255,255,0.16)', iconFile: 'camion-contenedor-v2.svg', iconOpacity: 0.24, kpiValue: kpis.viajesActivos, kpiLabel: 'viajes', statusDot: kpis.viajesActivos > 0 ? 'green' : 'gray', statusText: kpis.viajesActivos > 0 ? 'Operando' : 'Sin viajes', gridColumn: '1 / 2', gridRow: '2 / 3' },
    { id: 'ventas', label: 'Ventas', route: '/ventas/analytics', bgColor: CARD_BG, gradient: CARD_BG, decorType: 'silk', decorColor: 'rgba(255,255,255,0.10)', iconFile: 'ingresos.svg', iconOpacity: 0.24, kpiValue: kpis.formatosActivos.toLocaleString(), kpiLabel: 'formatos', statusDot: 'green', statusText: 'Pipeline activo', gridColumn: '2 / 3', gridRow: '2 / 3' },
    { id: 'comunicaciones', label: 'Comunicaciones', route: '/comunicaciones/dashboard', bgColor: CARD_BG, gradient: CARD_BG, decorType: 'silk', decorColor: 'rgba(255,255,255,0.10)', iconFile: 'comunicaciones.svg', iconOpacity: 0.24, kpiValue: '5', kpiLabel: 'canales', statusDot: 'green', statusText: 'Activo', gridColumn: '3 / 4', gridRow: '2 / 4' },
    { id: 'autofomento', label: 'Control de equipo', route: '/control-equipo', bgColor: CARD_BG, gradient: CARD_BG, decorType: 'silk', decorColor: 'rgba(255,255,255,0.07)', iconFile: 'gps.svg', iconOpacity: 0.24, kpiValue: '', kpiLabel: '', statusDot: kpis.cajasGPS > 0 || kpis.thermosGPS > 0 ? 'green' : 'gray', statusText: `Cajas ${kpis.cajasGPS} · Thermos ${kpis.thermosGPS}`, gridColumn: '1 / 3', gridRow: '3 / 4' },
    { id: 'config', label: 'Configuración', route: '/admin/configuracion', bgColor: CARD_BG, gradient: CARD_BG, decorType: 'silk', decorColor: 'rgba(255,255,255,0.07)', iconFile: 'configuracion.svg', iconOpacity: 0.24, kpiValue: '', kpiLabel: 'admin', statusDot: 'gray', statusText: 'Sistema', gridColumn: '4 / 5', gridRow: '3 / 4' },
  ]


  const getCardStyle = (isHovered: boolean, card: CardConfig): React.CSSProperties => {
    return ({
      gridColumn: card.gridColumn,
      gridRow: card.gridRow,
      minHeight: 0,
      borderRadius: '16px',
      padding: '24px',
      background: card.gradient,
      // Visible blue-gray border like fintech reference
      border: isHovered
        ? '1px solid rgba(100,140,200,0.35)'
        : '1px solid rgba(80,110,160,0.22)',
      cursor: 'pointer',
      position: 'relative',
      overflow: 'hidden',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'flex-start',
      justifyContent: 'flex-start',
      transition: 'transform 0.45s cubic-bezier(0.16,1,0.3,1), box-shadow 0.45s cubic-bezier(0.16,1,0.3,1), border-color 0.3s ease',
      transform: isHovered
        ? 'translateY(-6px) scale(1.005)'
        : 'translateY(0) scale(1)',
      boxShadow: isHovered
        ? '0 8px 32px rgba(0,0,0,0.45), 0 2px 8px rgba(0,0,0,0.30)'
        : '0 2px 8px rgba(0,0,0,0.20)',
    })
  }

  // Clean fintech — no geometric decorations, just clean card surface


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
            background: 'linear-gradient(115deg, rgba(255,255,255,0) 0%, rgba(255,255,255,0.04) 40%, rgba(255,255,255,0.10) 50%, rgba(255,255,255,0.04) 60%, rgba(255,255,255,0) 100%)',
            transform: isHovered ? 'translateX(360%) skewX(-14deg)' : 'translateX(0%) skewX(-14deg)',
            opacity: isHovered ? 1 : 0,
            transition: isHovered
              ? 'transform 1.44s cubic-bezier(0.22,1,0.36,1), opacity 0.25s ease'
              : 'transform 0s, opacity 0.25s ease',
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
          {/* Icon badge — 40px, dark glass, fintech logo style */}
          <div style={{
            width: '40px', height: '40px',
            borderRadius: '12px',
            background: 'rgba(255,255,255,0.05)',
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
                width: '22px', height: '22px',
                objectFit: 'contain',
                filter: 'brightness(0) invert(1)',
                opacity: 0.80,
              }}
            />
          </div>
          <span style={{
            fontFamily: "'Montserrat', sans-serif",
            fontSize: '14px',
            fontWeight: 700,
            color: 'rgba(255,255,255,0.85)',
            letterSpacing: '1px',
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
                fontSize: '15px',
                fontWeight: 500,
                color: 'rgba(255,255,255,0.40)',
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
          color: 'rgba(255,255,255,0.35)',
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
      background: '#0B0F19', // fondo dark fintech — idéntico a referencias
      fontFamily: "'Montserrat', sans-serif",
      color: '#E2E8F0',
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
        background: '#0B0F19',
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












