// HomeDashboard V27m - Orange borders, big icons, mini charts fintech
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
  green: '#FF7A00', yellow: '#FF7A00', red: '#FF7A00', gray: '#FF7A00',
}

// ─── Mini bar chart (CSS-only) ───
const MiniBarChart = ({ data, color = '#3B82F6', height = 32 }: { data: number[], color?: string, height?: number }) => {
  const max = Math.max(...data, 1)
  return (
    <div style={{ display: 'flex', alignItems: 'flex-end', gap: '3px', height: `${height}px`, width: '100%' }}>
      {data.map((v, i) => (
        <div key={i} style={{
          flex: 1,
          height: `${Math.max((v / max) * 100, 8)}%`,
          background: `linear-gradient(180deg, ${color} 0%, ${color}88 100%)`,
          borderRadius: '3px 3px 1px 1px',
          opacity: i === data.length - 1 ? 1 : 0.65,
          transition: 'height 0.4s ease',
        }} />
      ))}
    </div>
  )
}

// ─── Progress bar ───
const MiniProgress = ({ pct, color = '#FF7A00', label }: { pct: number, color?: string, label?: string }) => (
  <div style={{ width: '100%' }}>
    {label && <div style={{ fontSize: '10px', color: 'rgba(255,255,255,0.45)', marginBottom: '4px', letterSpacing: '0.3px' }}>{label}</div>}
    <div style={{ width: '100%', height: '6px', background: 'rgba(255,255,255,0.08)', borderRadius: '3px', overflow: 'hidden' }}>
      <div style={{ width: `${Math.min(pct, 100)}%`, height: '100%', background: `linear-gradient(90deg, ${color}, ${color}CC)`, borderRadius: '3px', transition: 'width 0.6s ease' }} />
    </div>
  </div>
)

// ─── Donut / arc indicator ───
const MiniDonut = ({ pct, size = 48, color = '#3B82F6' }: { pct: number, size?: number, color?: string }) => {
  const r = (size - 6) / 2
  const circ = 2 * Math.PI * r
  const offset = circ - (pct / 100) * circ
  return (
    <svg width={size} height={size} style={{ transform: 'rotate(-90deg)' }}>
      <circle cx={size/2} cy={size/2} r={r} fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth={5} />
      <circle cx={size/2} cy={size/2} r={r} fill="none" stroke={color} strokeWidth={5}
        strokeDasharray={circ} strokeDashoffset={offset} strokeLinecap="round"
        style={{ transition: 'stroke-dashoffset 0.6s ease' }} />
    </svg>
  )
}

// ─── Sparkline (mini line chart) ───
const MiniSparkline = ({ data, color = '#FF7A00', height = 28 }: { data: number[], color?: string, height?: number }) => {
  const max = Math.max(...data, 1)
  const min = Math.min(...data, 0)
  const range = max - min || 1
  const w = 100
  const pts = data.map((v, i) => `${(i / (data.length - 1)) * w},${height - ((v - min) / range) * (height - 4) - 2}`).join(' ')
  return (
    <svg width="100%" height={height} viewBox={`0 0 ${w} ${height}`} preserveAspectRatio="none" style={{ display: 'block' }}>
      <polyline points={pts} fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      <polyline points={`0,${height} ${pts} ${w},${height}`} fill={`${color}15`} stroke="none" />
    </svg>
  )
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
    cajasGPS: 0, thermosGPS: 0,
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

  const getCardStyle = (isHovered: boolean, card: CardConfig): React.CSSProperties => ({
    gridColumn: card.gridColumn,
    gridRow: card.gridRow,
    minHeight: 0,
    borderRadius: '18px',
    padding: '22px',
    background: card.gradient,
    // Orange contrasting border
    border: isHovered
      ? '1.5px solid rgba(255,122,0,0.55)'
      : '1.5px solid rgba(255,122,0,0.25)',
    cursor: 'pointer',
    position: 'relative',
    overflow: 'hidden',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'flex-start',
    justifyContent: 'flex-start',
    transition: 'transform 0.55s cubic-bezier(0.16,1,0.3,1), box-shadow 0.55s cubic-bezier(0.16,1,0.3,1), border-color 0.3s ease',
    transform: isHovered ? 'translateY(-8px) scale(1.008)' : 'translateY(0) scale(1)',
    boxShadow: isHovered
      ? '0 4px 12px rgba(255,122,0,0.15), 0 14px 28px -8px rgba(0,0,0,0.45), 0 38px 70px -20px rgba(0,0,0,0.50), inset 0 1px 0 rgba(255,255,255,0.10)'
      : '0 8px 24px rgba(0,0,0,0.22), 0 3px 8px rgba(0,0,0,0.14), inset 0 1px 0 rgba(255,255,255,0.08)',
  })

  // ─── Per-card mini chart ───
  const renderMiniChart = (card: CardConfig) => {
    const chartStyle: React.CSSProperties = {
      position: 'relative', zIndex: 2, width: '100%', marginTop: '6px',
    }
    switch (card.id) {
      case 'oportunidades':
        // Bar chart — simulated weekly leads
        return <div style={chartStyle}><MiniBarChart data={[12, 18, 9, 22, 15, 8, kpis.leadsActivos > 20 ? 20 : kpis.leadsActivos || 14]} color="#FF7A00" height={30} /></div>
      case 'servicio-clientes':
        // Sparkline — client growth
        return <div style={chartStyle}><MiniSparkline data={[280, 340, 310, 420, 390, 480, 520]} color="#3B9EFF" height={28} /></div>
      case 'comercial':
        // Donut + progress — formatos completion
        return (
          <div style={{ ...chartStyle, display: 'flex', alignItems: 'center', gap: '12px' }}>
            <MiniDonut pct={72} size={44} color="#FF7A00" />
            <div style={{ flex: 1 }}>
              <MiniProgress pct={72} color="#FF7A00" label="Cierre mensual" />
            </div>
          </div>
        )
      case 'operaciones':
        // Bar chart — viajes por día
        return <div style={chartStyle}><MiniBarChart data={[3, 5, 2, 7, 4, 6, kpis.viajesActivos || 3]} color="#4DA6FF" height={28} /></div>
      case 'ventas':
        // Sparkline — revenue trend
        return <div style={chartStyle}><MiniSparkline data={[120, 180, 150, 220, 190, 260, 310]} color="#FF7A00" height={26} /></div>
      case 'comunicaciones':
        // Stacked progress bars per channel
        return (
          <div style={{ ...chartStyle, display: 'flex', flexDirection: 'column', gap: '5px' }}>
            <MiniProgress pct={85} color="#3B9EFF" label="WhatsApp" />
            <MiniProgress pct={60} color="#FF7A00" label="Email" />
            <MiniProgress pct={40} color="#8B5CF6" label="Portal" />
          </div>
        )
      case 'autofomento':
        // Dual bar chart — cajas vs thermos
        return (
          <div style={{ ...chartStyle, display: 'flex', gap: '16px' }}>
            <div style={{ flex: 1 }}>
              <MiniProgress pct={kpis.cajasGPS > 0 ? Math.min((kpis.cajasGPS / (kpis.cajasGPS + kpis.thermosGPS || 1)) * 100, 100) : 70} color="#3B9EFF" label={`Cajas GPS · ${kpis.cajasGPS}`} />
            </div>
            <div style={{ flex: 1 }}>
              <MiniProgress pct={kpis.thermosGPS > 0 ? Math.min((kpis.thermosGPS / (kpis.cajasGPS + kpis.thermosGPS || 1)) * 100, 100) : 30} color="#FF7A00" label={`Thermos · ${kpis.thermosGPS}`} />
            </div>
          </div>
        )
      case 'config':
        // Simple status dots
        return (
          <div style={{ ...chartStyle, display: 'flex', gap: '8px', alignItems: 'center' }}>
            {['DB', 'API', 'GPS', 'Auth'].map((s, i) => (
              <div key={s} style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: i < 3 ? '#22C55E' : '#FF7A00' }} />
                <span style={{ fontSize: '9px', color: 'rgba(255,255,255,0.40)', letterSpacing: '0.3px' }}>{s}</span>
              </div>
            ))}
          </div>
        )
      default:
        return null
    }
  }

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
        {/* Sheen sweep on hover */}
        <div style={{
          position: 'absolute', inset: 0, pointerEvents: 'none',
          overflow: 'hidden', borderRadius: 'inherit', zIndex: 4,
        }}>
          <div style={{
            position: 'absolute', top: '-60%', left: '-90%',
            width: '55%', height: '220%',
            background: 'linear-gradient(115deg, rgba(255,255,255,0) 0%, rgba(255,255,255,0.06) 40%, rgba(255,255,255,0.16) 50%, rgba(255,255,255,0.06) 60%, rgba(255,255,255,0) 100%)',
            transform: isHovered ? 'translateX(360%) skewX(-14deg)' : 'translateX(0%) skewX(-14deg)',
            opacity: isHovered ? 1 : 0,
            transition: isHovered
              ? 'transform 1.44s cubic-bezier(0.22,1,0.36,1), opacity 0.25s ease'
              : 'transform 0s, opacity 0.25s ease',
            filter: 'blur(0.5px)',
          }} />
        </div>

        {/* Orange dot */}
        <div
          className={card.statusDot === 'green' ? 'status-dot-pulse-green' : undefined}
          style={{
            position: 'absolute', top: '14px', right: '14px',
            width: '7px', height: '7px', borderRadius: '50%',
            backgroundColor: '#FF7A00',
            boxShadow: '0 0 10px rgba(255,122,0,0.50)',
            zIndex: 3,
          }}
        />

        {/* Title row with 48px icon */}
        <div style={{
          display: 'flex', alignItems: 'center', gap: '14px',
          width: '100%', position: 'relative', zIndex: 2,
        }}>
          <div style={{
            width: '48px', height: '48px',
            borderRadius: '14px',
            background: 'rgba(255,255,255,0.07)',
            border: '1px solid rgba(255,255,255,0.10)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            flexShrink: 0,
          }}>
            <img
              src={`/icons/dashboard/${card.iconFile}`}
              alt=""
              style={{
                width: '26px', height: '26px',
                objectFit: 'contain',
                filter: 'brightness(0) invert(1)',
                opacity: 0.85,
              }}
            />
          </div>
          <span style={{
            fontFamily: "'Montserrat', sans-serif",
            fontSize: '14px', fontWeight: 700,
            color: 'rgba(255,255,255,0.90)',
            letterSpacing: '0.8px', lineHeight: 1.2,
            textTransform: 'uppercase' as const,
          }}>
            {card.label}
          </span>
        </div>

        {/* KPI number + label */}
        {card.kpiValue !== '' && (
          <div className="kpi-value-num" style={{
            fontFamily: "'Montserrat', sans-serif",
            fontSize: '40px', fontWeight: 800,
            color: '#FFFFFF',
            letterSpacing: '-1.4px',
            textAlign: 'left', width: '100%', lineHeight: 1,
            marginTop: '8px',
            position: 'relative', zIndex: 2,
          }}>
            {card.kpiValue}
            {card.kpiLabel && (
              <span style={{
                fontSize: '14px', fontWeight: 500,
                color: 'rgba(255,255,255,0.40)',
                letterSpacing: '0.3px', marginLeft: '10px',
                textTransform: 'lowercase' as const,
              }}>
                {card.kpiLabel}
              </span>
            )}
          </div>
        )}

        {/* Mini chart visualization */}
        {renderMiniChart(card)}

        {/* Status text */}
        <div style={{
          fontFamily: "'Montserrat', sans-serif",
          fontSize: '11px', fontWeight: 500,
          color: 'rgba(255,255,255,0.40)',
          letterSpacing: '0.3px',
          textAlign: 'left', width: '100%',
          marginTop: 'auto',
          paddingTop: '4px',
          position: 'relative', zIndex: 3,
          whiteSpace: 'nowrap', overflow: 'hidden',
          textOverflow: 'ellipsis',
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
      background: '#F4F5F8',
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
