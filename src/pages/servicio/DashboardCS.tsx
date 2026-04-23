// DashboardCS V2 — V43 DNA (P20 Rubber Salidos + Títulos Blancos Hundidos)
//
// Aplica el mismo lenguaje visual del HomeDashboard V43 al submódulo
// Servicio a Clientes:
//   • Cards con gradient 135° (no flat dark)
//   • Títulos casi blancos 0.94 con rubber deboss crisp
//   • Iconos monocroma tint por card (75% white + 25% card color) via CSS mask
//   • 3D laser-cut en iconos (capas shadow + highlight + base)
//   • KPI values reales desde Supabase (no "—")
//   • Subtítulos negros rubber deboss
//   • Dot verde pulse por card (excepto Config si aplica)
//   • Hover lift + parallax sutil ±2°

import { useState, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../../lib/supabase'
import AppHeader from '../../components/layout/AppHeader'

interface KpiCard {
  id: string
  label: string
  route: string
  gradient: string
  iconColor: string
  iconBg: string
  iconKey: 'tickets' | 'clientes' | 'impo' | 'expo' | 'despacho' | 'metricas' | 'actividades'
  subtitle: string
}

const CARDS: KpiCard[] = [
  {
    id: 'tickets',
    label: 'Tickets',
    route: '/servicio/tickets',
    gradient: 'linear-gradient(135deg, #2763C4 0%, #0A2D6F 100%)',
    iconColor: '#C9D8F0',
    iconBg: '#2763C4',
    iconKey: 'tickets',
    subtitle: 'Activos · Pendientes · SLA',
  },
  {
    id: 'clientes',
    label: 'Clientes Activos',
    route: '/clientes/corporativos',
    gradient: 'linear-gradient(135deg, #2B5FB5 0%, #0B2E68 100%)',
    iconColor: '#CAD7EC',
    iconBg: '#2B5FB5',
    iconKey: 'clientes',
    subtitle: 'Corporativos · Estratégicos',
  },
  {
    id: 'impo',
    label: 'Importación',
    route: '/servicio/importacion',
    gradient: 'linear-gradient(135deg, #224CA0 0%, #062348 100%)',
    iconColor: '#C8D2E8',
    iconBg: '#224CA0',
    iconKey: 'impo',
    subtitle: 'Viajes IMPO últimos 30 días',
  },
  {
    id: 'expo',
    label: 'Exportación',
    route: '/servicio/exportacion',
    gradient: 'linear-gradient(135deg, #3D78D6 0%, #134287 100%)',
    iconColor: '#CFDDF3',
    iconBg: '#3D78D6',
    iconKey: 'expo',
    subtitle: 'Viajes EXPO últimos 30 días',
  },
  {
    id: 'despacho',
    label: 'Despacho IA',
    route: '/servicio/despacho-ia',
    gradient: 'linear-gradient(135deg, #F09830 0%, #9A4E0E 100%)',
    iconColor: '#FADFC6',
    iconBg: '#F09830',
    iconKey: 'despacho',
    subtitle: 'Viajes activos · Optimización IA',
  },
  {
    id: 'metricas',
    label: 'Métricas Servicio',
    route: '/servicio/metricas',
    gradient: 'linear-gradient(135deg, #4078D0 0%, #153E88 100%)',
    iconColor: '#CFDDEF',
    iconBg: '#4078D0',
    iconKey: 'metricas',
    subtitle: 'Dashboard analítico',
  },
  {
    id: 'actividades',
    label: 'Actividades',
    route: '/servicio/actividades',
    gradient: 'linear-gradient(135deg, #3A72CF 0%, #153E82 100%)',
    iconColor: '#CEDCEF',
    iconBg: '#3A72CF',
    iconKey: 'actividades',
    subtitle: 'Pendientes · Seguimientos',
  },
]

// Iconos inline (SVG path-based, clean outline style como HomeDashboard V43)
const ICON_SVGS: Record<string, string> = {
  tickets: `<svg viewBox='0 0 100 100' xmlns='http://www.w3.org/2000/svg'><path fill='%23000' d='M18 34h64c2 0 4 2 4 4v10c-4 1-7 5-7 10s3 9 7 10v10c0 2-2 4-4 4H18c-2 0-4-2-4-4V68c4-1 7-5 7-10s-3-9-7-10V38c0-2 2-4 4-4zm19 12l-8 8 5 5 11-11-8-8-5 5 5 5-5 5zm24-6h15v3H61v-3zm0 8h20v3H61v-3zm0 8h18v3H61v-3z'/></svg>`,
  clientes: `<svg viewBox='0 0 100 100' xmlns='http://www.w3.org/2000/svg'><path fill='%23000' d='M50 18a12 12 0 110 24 12 12 0 010-24zm-24 8a10 10 0 110 20 10 10 0 010-20zm48 0a10 10 0 110 20 10 10 0 010-20zM50 46c12 0 20 6 20 16v18H30V62c0-10 8-16 20-16zm-24 4c2 0 4 0 6 1-1 2-2 5-2 8v17H12V66c0-8 6-16 14-16zm48 0c8 0 14 8 14 16v10H70V59c0-3-1-6-2-8 2-1 4-1 6-1z'/></svg>`,
  impo: `<svg viewBox='0 0 100 100' xmlns='http://www.w3.org/2000/svg'><path fill='%23000' d='M70 38a18 18 0 00-35-4 14 14 0 00-2 28h37a12 12 0 000-24zM50 76V56l-10 10 4 4 4-4v10h4zm0 0v-10l4 4 4-4-10-10v20h2z'/></svg>`,
  expo: `<svg viewBox='0 0 100 100' xmlns='http://www.w3.org/2000/svg'><path fill='%23000' d='M70 42a18 18 0 00-35-4 14 14 0 00-2 28h37a12 12 0 000-24zM50 48l-8 8 4 4 2-2v12h4V58l2 2 4-4-8-8z'/></svg>`,
  despacho: `<svg viewBox='0 0 100 100' xmlns='http://www.w3.org/2000/svg'><path fill='%23000' d='M30 30h40v40H30V30zm4 4v32h32V34H34zm8 8h16v16H42V42zm-10-16h4v6h-4v-6zm12 0h4v6h-4v-6zm12 0h4v6h-4v-6zm12 0h4v6h-4v-6zM32 74h4v6h-4v-6zm12 0h4v6h-4v-6zm12 0h4v6h-4v-6zm12 0h4v6h-4v-6zM22 38h6v4h-6v-4zm0 10h6v4h-6v-4zm0 10h6v4h-6v-4zm0 10h6v4h-6v-4zM72 38h6v4h-6v-4zm0 10h6v4h-6v-4zm0 10h6v4h-6v-4zm0 10h6v4h-6v-4z'/></svg>`,
  metricas: `<svg viewBox='0 0 100 100' xmlns='http://www.w3.org/2000/svg'><path fill='%23000' d='M18 74V26h4v44h60v4H18zm14-8V44h4v22h-4zm12 0V36h4v30h-4zm12 0V48h4v18h-4zm12 0V28h4v38h-4z'/></svg>`,
  actividades: `<svg viewBox='0 0 100 100' xmlns='http://www.w3.org/2000/svg'><path fill='%23000' d='M18 30l6 6 10-10 3 3-13 13-9-9 3-3zM42 32h42v4H42v-4zm-24 20l6 6 10-10 3 3-13 13-9-9 3-3zM42 54h42v4H42v-4zm-24 20l6 6 10-10 3 3-13 13-9-9 3-3zM42 76h42v4H42v-4z'/></svg>`,
}

export default function DashboardCS() {
  const navigate = useNavigate()
  const [hoveredCard, setHoveredCard] = useState<string | null>(null)
  const [kpis, setKpis] = useState<Record<string, number>>({})
  const [loading, setLoading] = useState(true)

  const fetchKpis = useCallback(async () => {
    setLoading(true)
    try {
      const now = new Date()
      const thirty = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000).toISOString()
      const [tix, cli, impo, expo, despActivos, actPend] = await Promise.all([
        supabase.from('tickets').select('*', { count: 'exact', head: true }).is('deleted_at', null).in('estado', ['abierto', 'en_proceso']),
        supabase.from('clientes').select('*', { count: 'exact', head: true }).is('deleted_at', null),
        supabase.from('viajes').select('*', { count: 'exact', head: true }).eq('tipo', 'IMPO').gte('created_at', thirty),
        supabase.from('viajes').select('*', { count: 'exact', head: true }).eq('tipo', 'EXPO').gte('created_at', thirty),
        supabase.from('viajes').select('*', { count: 'exact', head: true }).in('estado', ['en_transito', 'programado']),
        supabase.from('tickets').select('*', { count: 'exact', head: true }).is('deleted_at', null).eq('estado', 'pendiente'),
      ])
      setKpis({
        tickets: tix.count ?? 0,
        clientes: cli.count ?? 0,
        impo: impo.count ?? 0,
        expo: expo.count ?? 0,
        despacho: despActivos.count ?? 0,
        metricas: 0,
        actividades: actPend.count ?? 0,
      })
    } catch (e) {
      console.error('[DashboardCS] fetchKpis error:', e)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchKpis()
    const interval = setInterval(fetchKpis, 60000)
    return () => clearInterval(interval)
  }, [fetchKpis])

  const renderCard = (card: KpiCard) => {
    const isHovered = hoveredCard === card.id
    const iconOpacity = isHovered ? 0.95 : 0.90
    const kpiValue = kpis[card.id]

    return (
      <div
        key={card.id}
        onClick={() => navigate(card.route)}
        onMouseEnter={() => setHoveredCard(card.id)}
        onMouseLeave={() => setHoveredCard(null)}
        style={{
          position: 'relative',
          borderRadius: '20px',
          padding: '24px 26px',
          background: `radial-gradient(ellipse at 0% 0%, rgba(255,255,255,0.13) 0%, rgba(255,255,255,0) 45%), linear-gradient(180deg, rgba(255,255,255,0.09) 0%, rgba(255,255,255,0.02) 22%, rgba(0,0,0,0.13) 100%), ${card.gradient}`,
          minHeight: '180px',
          cursor: 'pointer',
          overflow: 'hidden',
          isolation: 'isolate',
          boxShadow: isHovered
            ? 'inset 1px 0 0 rgba(255,255,255,0.12), inset -1px 0 0 rgba(255,255,255,0.08), inset 0 3px 0 rgba(255,255,255,0.30), inset 0 -3px 0 rgba(0,0,0,0.42), inset 0 -22px 38px rgba(0,0,0,0.18), 0 4px 8px rgba(0,0,0,0.22), 0 20px 36px rgba(0,0,0,0.34), 0 44px 72px -10px rgba(0,0,0,0.42)'
            : 'inset 1px 0 0 rgba(255,255,255,0.10), inset -1px 0 0 rgba(255,255,255,0.06), inset 0 3px 0 rgba(255,255,255,0.24), inset 0 -3px 0 rgba(0,0,0,0.38), inset 0 -20px 36px rgba(0,0,0,0.18), 0 2px 4px rgba(0,0,0,0.18), 0 14px 24px rgba(0,0,0,0.28), 0 32px 52px -8px rgba(0,0,0,0.36)',
          transform: isHovered ? 'translateY(-4px)' : 'translateY(0)',
          outline: '1px solid rgba(0,0,0,0.08)',
          outlineOffset: '-1px',
          transition: 'transform 0.3s cubic-bezier(0.22,1,0.36,1), box-shadow 0.3s ease',
        }}
      >
        {/* Dot pulse verde */}
        <div style={{ position: 'absolute', top: '14px', right: '14px', width: '14px', height: '14px', pointerEvents: 'none', zIndex: 3 }}>
          <div style={{ position: 'absolute', top: '50%', left: '50%', width: '14px', height: '14px', borderRadius: '50%', border: '1.5px solid rgba(16,185,129,0.75)', transform: 'translate(-50%, -50%)', animation: 'lhDotPulse 2.2s ease-in-out infinite', pointerEvents: 'none' }} />
          <div style={{ position: 'absolute', top: '50%', left: '50%', width: '6px', height: '6px', borderRadius: '50%', background: 'radial-gradient(circle at 35% 30%, #34D399 0%, #10B981 65%, #047857 100%)', boxShadow: '0 0 0 1px rgba(255,255,255,0.14), 0 0 10px rgba(16,185,129,0.62)', transform: 'translate(-50%, -50%)', pointerEvents: 'none' }} />
        </div>

        {/* Título + subtítulo wrapper */}
        <div style={{ position: 'relative', zIndex: 2, width: '100%' }}>
          <div style={{
            fontFamily: "'Montserrat', sans-serif",
            fontSize: '22px',
            fontWeight: 900,
            color: 'rgba(255,255,255,0.94)',
            letterSpacing: '-0.024em',
            lineHeight: 1.12,
            textShadow: '0 -1.5px 0 rgba(0,0,0,0.92), 0 1.5px 0 rgba(255,255,255,0.32), 0 2px 3px rgba(0,0,0,0.52), 0 4px 7px rgba(0,0,0,0.30)',
            pointerEvents: 'none',
          }}>
            {card.label}
          </div>

          {/* KPI value grande */}
          <div style={{
            fontFamily: "'Montserrat', sans-serif",
            fontSize: '42px',
            fontWeight: 800,
            color: 'rgba(255,255,255,0.98)',
            letterSpacing: '-0.02em',
            lineHeight: 1,
            marginTop: '16px',
            textShadow: '0 2px 4px rgba(0,0,0,0.42)',
            pointerEvents: 'none',
          }}>
            {loading ? '—' : (kpiValue ?? 0).toLocaleString()}
          </div>

          {/* Subtítulo */}
          <div style={{
            fontFamily: "'Montserrat', sans-serif",
            fontSize: '12px',
            fontWeight: 600,
            color: 'rgba(0,0,0,0.48)',
            letterSpacing: '0.015em',
            marginTop: '8px',
            whiteSpace: 'nowrap',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            textShadow: '0 -1px 0 rgba(0,0,0,0.82), 0 1px 0 rgba(255,255,255,0.26)',
            pointerEvents: 'none',
          }}>
            {card.subtitle}
          </div>
        </div>

        {/* Icono 3D laser-cut layered — capa shadow + highlight + base monocroma */}
        <div style={{
          position: 'absolute',
          right: '-6px',
          bottom: '-10px',
          width: '96px',
          height: '96px',
          pointerEvents: 'none',
          zIndex: 2,
          overflow: 'visible',
          isolation: 'isolate',
          transform: 'translateZ(0)',
          filter: 'drop-shadow(0 8px 12px rgba(0,0,0,0.68)) drop-shadow(0 3px 5px rgba(0,0,0,0.48))',
        }}>
          {/* Shadow layer (negro, offset +2/+2) */}
          <div style={{ position: 'absolute', top: '2px', left: '2px', width: '100%', height: '100%', backgroundColor: '#000000', maskImage: `url("data:image/svg+xml;utf8,${ICON_SVGS[card.iconKey]}")`, WebkitMaskImage: `url("data:image/svg+xml;utf8,${ICON_SVGS[card.iconKey]}")`, maskRepeat: 'no-repeat', WebkitMaskRepeat: 'no-repeat', maskPosition: 'center', WebkitMaskPosition: 'center', maskSize: 'contain', WebkitMaskSize: 'contain', opacity: 0.62 }} />
          {/* Highlight layer (blanco, offset -1.5/-1.5) */}
          <div style={{ position: 'absolute', top: '-1.5px', left: '-1.5px', width: '100%', height: '100%', backgroundColor: '#FFFFFF', maskImage: `url("data:image/svg+xml;utf8,${ICON_SVGS[card.iconKey]}")`, WebkitMaskImage: `url("data:image/svg+xml;utf8,${ICON_SVGS[card.iconKey]}")`, maskRepeat: 'no-repeat', WebkitMaskRepeat: 'no-repeat', maskPosition: 'center', WebkitMaskPosition: 'center', maskSize: 'contain', WebkitMaskSize: 'contain', opacity: 0.48 }} />
          {/* Base monocroma (tint por card) */}
          <div style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', backgroundColor: card.iconColor, maskImage: `url("data:image/svg+xml;utf8,${ICON_SVGS[card.iconKey]}")`, WebkitMaskImage: `url("data:image/svg+xml;utf8,${ICON_SVGS[card.iconKey]}")`, maskRepeat: 'no-repeat', WebkitMaskRepeat: 'no-repeat', maskPosition: 'center', WebkitMaskPosition: 'center', maskSize: 'contain', WebkitMaskSize: 'contain', opacity: iconOpacity, transition: 'opacity 0.24s ease' }} />
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
      background: 'radial-gradient(ellipse 100% 70% at 50% 35%, #B0B6C0 0%, #9199A3 50%, #747A85 100%)',
      fontFamily: "'Montserrat', sans-serif",
    }}>
      <style>{`
        @keyframes lhDotPulse {
          0% { transform: translate(-50%,-50%) scale(1); opacity: 0.70; }
          80% { transform: translate(-50%,-50%) scale(2.2); opacity: 0; }
          100% { transform: translate(-50%,-50%) scale(2.2); opacity: 0; }
        }
      `}</style>

      <AppHeader />

      {/* Toolbar — back button + título */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: '18px',
        padding: '16px 32px 0',
        flexShrink: 0,
      }}>
        <button
          onClick={() => navigate('/dashboard')}
          style={{
            background: 'linear-gradient(135deg, #F09830 0%, #9A4E0E 100%)',
            color: '#FFFFFF',
            border: 'none',
            borderRadius: '10px',
            padding: '10px 18px',
            fontFamily: "'Montserrat', sans-serif",
            fontSize: '13px',
            fontWeight: 700,
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            boxShadow: '0 2px 6px rgba(0,0,0,0.22), inset 0 1px 0 rgba(255,255,255,0.20), inset 0 -1px 0 rgba(0,0,0,0.18)',
            transition: 'transform 0.2s ease',
          }}
        >
          ← Dashboard
        </button>
        <h1 style={{
          fontFamily: "'Montserrat', sans-serif",
          fontSize: '20px',
          fontWeight: 800,
          color: '#0F172A',
          letterSpacing: '-0.018em',
          margin: 0,
        }}>
          Servicio a Clientes
        </h1>
      </div>

      {/* Grid de cards */}
      <div style={{
        flex: 1,
        padding: '20px 32px 32px',
        overflow: 'hidden',
        display: 'grid',
        gridTemplateColumns: 'repeat(4, 1fr)',
        gridTemplateRows: 'repeat(2, 1fr)',
        gap: '18px',
      }}>
        {CARDS.map(renderCard)}
        {/* Slot libre para futura expansión (quick-view actividades / tickets urgentes) */}
        <div style={{
          borderRadius: '20px',
          background: 'radial-gradient(ellipse at 0% 0%, rgba(255,255,255,0.08) 0%, rgba(255,255,255,0) 45%), linear-gradient(135deg, #3F4856 0%, #0F1620 100%)',
          padding: '20px',
          fontFamily: "'Montserrat', sans-serif",
          fontSize: '12px',
          fontWeight: 600,
          color: 'rgba(255,255,255,0.54)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          outline: '1px solid rgba(0,0,0,0.08)',
          outlineOffset: '-1px',
          boxShadow: 'inset 0 3px 0 rgba(255,255,255,0.14), inset 0 -3px 0 rgba(0,0,0,0.30), 0 14px 24px rgba(0,0,0,0.22)',
          letterSpacing: '0.1em',
          textTransform: 'uppercase',
        }}>
          Próximamente
        </div>
      </div>
    </div>
  )
}
