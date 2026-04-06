import { useState, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { ModuleLayout } from '../../components/layout/ModuleLayout'
import { supabase } from '../../lib/supabase'

/* ———————————————————————————————————————————————————————————————
   SERVICIO A CLIENTES — Landing Page (alineada a plantilla madre)
   4 cards: Tickets, Clientes Activos, Importacion, Exportacion
   Icono único white-stroke: principal 12% | secondary 8%
   ——————————————————————————————————————————————————————————————— */

const D = {
  bg: '#F7F8FA',
  font: "'Montserrat', sans-serif",
  fontBody: "'Montserrat', sans-serif",
  cardRadius: '14px',
  titleSize: '17px',
  titleWeight: 800,
  kpiSize: '38px',
  kpiWeight: 600,
  subSize: '12px',
  dotSize: '8px',
} as const

const DOT: Record<string, string> = { green: '#0D9668', gray: '#CBD5E1' }

const P = 'rgba(255,255,255,0.12)'
const S = 'rgba(255,255,255,0.08)'

const iconWrap: React.CSSProperties = {
  position: 'absolute',
  top: 0, right: 0, width: '100%', height: '100%',
  pointerEvents: 'none', overflow: 'hidden',
  borderRadius: '14px',
  transition: 'transform 0.6s cubic-bezier(0.23,1,0.32,1)',
}

const svgPos: React.CSSProperties = {
  position: 'absolute', right: '-18%', bottom: '-16%',
  width: '95%', height: '112%',
}

/* 1. Tickets — Ticket with checkmark */
const IconTickets = () => (
  <svg viewBox="0 0 200 140" style={svgPos}>
    <path d="M45,40 L155,40 L155,70 Q145,70 145,80 Q145,90 155,90 L155,115 L45,115 L45,90 Q55,90 55,80 Q55,70 45,70 Z" fill="none" stroke={P} strokeWidth="2.5" strokeLinejoin="round" />
    <line x1="100" y1="40" x2="100" y2="115" stroke={S} strokeWidth="1.5" strokeDasharray="4 3" />
    <path d="M70,78 L82,90 L105,64" fill="none" stroke={P} strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
    <line x1="115" y1="70" x2="140" y2="70" stroke={S} strokeWidth="1.5" />
    <line x1="115" y1="82" x2="135" y2="82" stroke={S} strokeWidth="1.5" />
  </svg>
)

/* 2. Clientes Activos — Three figures / team */
const IconClientes = () => (
  <svg viewBox="0 0 200 140" style={svgPos}>
    <circle cx="100" cy="42" r="14" fill="none" stroke={P} strokeWidth="2.5" />
    <path d="M78,90 Q78,66 100,66 Q122,66 122,90 L122,100 L78,100 Z" fill="none" stroke={P} strokeWidth="2.5" strokeLinejoin="round" />
    <circle cx="62" cy="55" r="10" fill="none" stroke={P} strokeWidth="2" />
    <path d="M46,95 Q46,76 62,76 Q72,76 77,83" fill="none" stroke={P} strokeWidth="2" strokeLinejoin="round" />
    <circle cx="138" cy="55" r="10" fill="none" stroke={P} strokeWidth="2" />
    <path d="M154,95 Q154,76 138,76 Q128,76 123,83" fill="none" stroke={P} strokeWidth="2" strokeLinejoin="round" />
  </svg>
)

/* 3. Importación — Inbound arrow into container */
const IconImpo = () => (
  <svg viewBox="0 0 200 140" style={svgPos}>
    <rect x="40" y="55" width="85" height="55" rx="4" fill="none" stroke={P} strokeWidth="2.5" />
    <line x1="58" y1="70" x2="58" y2="110" stroke={S} strokeWidth="1.2" />
    <line x1="80" y1="70" x2="80" y2="110" stroke={S} strokeWidth="1.2" />
    <line x1="102" y1="70" x2="102" y2="110" stroke={S} strokeWidth="1.2" />
    <line x1="125" y1="82" x2="168" y2="82" stroke={P} strokeWidth="2.5" strokeLinecap="round" />
    <path d="M135,72 L125,82 L135,92" fill="none" stroke={P} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
    <circle cx="168" cy="82" r="4" fill={S} />
  </svg>
)

/* 4. Exportación — Outbound arrow from container */
const IconExpo = () => (
  <svg viewBox="0 0 200 140" style={svgPos}>
    <rect x="30" y="55" width="85" height="55" rx="4" fill="none" stroke={P} strokeWidth="2.5" />
    <line x1="48" y1="70" x2="48" y2="110" stroke={S} strokeWidth="1.2" />
    <line x1="70" y1="70" x2="70" y2="110" stroke={S} strokeWidth="1.2" />
    <line x1="92" y1="70" x2="92" y2="110" stroke={S} strokeWidth="1.2" />
    <line x1="115" y1="82" x2="168" y2="82" stroke={P} strokeWidth="2.5" strokeLinecap="round" />
    <path d="M158,72 L168,82 L158,92" fill="none" stroke={P} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
    <circle cx="115" cy="82" r="4" fill={S} />
  </svg>
)

/* —— Card Config —— */
interface LandingCard {
  id: string; label: string; route: string; kpiLabel: string;
  icon: React.ReactNode; accent: string
}

const CARDS: LandingCard[] = [
  { id: 'tickets',  label: 'Tickets',          route: '/servicio/tickets',      kpiLabel: 'Activos',     icon: <IconTickets />,  accent: '#2563EB' },
  { id: 'clientes', label: 'Clientes Activos', route: '/clientes/corporativos', kpiLabel: 'Clientes',    icon: <IconClientes />, accent: '#059669' },
  { id: 'impo',     label: 'Importacion',      route: '/servicio/importacion',  kpiLabel: 'Viajes IMPO', icon: <IconImpo />,     accent: '#7C3AED' },
  { id: 'expo',     label: 'Exportacion',      route: '/servicio/exportacion',  kpiLabel: 'Viajes EXPO', icon: <IconExpo />,     accent: '#D97706' },
]

/* —— Component —— */
export default function DashboardCS() {
  const navigate = useNavigate()
  const [hovered, setHovered] = useState<string | null>(null)
  const [kpis, setKpis] = useState<Record<string, number>>({ tickets: 0, clientes: 0, impo: 0, expo: 0 })

  const fetchKpis = useCallback(async () => {
    try {
      const [tix, cli, impo, expo] = await Promise.all([
        supabase.from('tickets').select('*', { count: 'exact', head: true }).is('deleted_at', null).in('estado', ['abierto', 'en_proceso']),
        supabase.from('clientes').select('*', { count: 'exact', head: true }).is('deleted_at', null),
        supabase.from('viajes').select('*', { count: 'exact', head: true }).eq('tipo', 'IMPO').in('estado', ['en_transito', 'programado']),
        supabase.from('viajes').select('*', { count: 'exact', head: true }).eq('tipo', 'EXPO').in('estado', ['en_transito', 'programado']),
      ])
      setKpis({
        tickets: tix.count ?? 0,
        clientes: cli.count ?? 0,
        impo: impo.count ?? 0,
        expo: expo.count ?? 0,
      })
    } catch (e) {
      console.error('KPI fetch error:', e)
    }
  }, [])

  useEffect(() => { fetchKpis() }, [fetchKpis])

  const getCardStyle = (isH: boolean, accent: string): React.CSSProperties => ({
    aspectRatio: '1 / 0.7',
    borderRadius: D.cardRadius,
    padding: '22px',
    background: accent,
    border: 'none',
    cursor: 'pointer',
    position: 'relative',
    overflow: 'hidden',
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'space-between',
    transition: 'transform 0.4s cubic-bezier(0.23,1,0.32,1), box-shadow 0.4s cubic-bezier(0.23,1,0.32,1)',
    transform: isH ? 'translateY(-3px)' : 'none',
    boxShadow: isH ? '0 6px 20px rgba(0,0,0,0.25)' : '0 2px 8px rgba(0,0,0,0.15)',
  })

  return (
    <ModuleLayout titulo="Servicio a Clientes" moduloPadre={{ nombre: 'Dashboard', ruta: '/dashboard' }}>
      <div style={{ background: D.bg, minHeight: 'calc(100vh - 120px)', padding: '32px 40px' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '20px', maxWidth: '1200px', margin: '0 auto' }}>
          {CARDS.map(card => {
            const isH = hovered === card.id
            return (
              <div
                key={card.id}
                style={getCardStyle(isH, card.accent)}
                onMouseEnter={() => setHovered(card.id)}
                onMouseLeave={() => setHovered(null)}
                onClick={() => navigate(card.route)}
              >
                <div style={{ ...iconWrap, transform: isH ? 'translate(4px,-4px) scale(1.05)' : 'none' }}>
                  {card.icon}
                </div>
                <div style={{ position: 'absolute', top: 14, right: 14, width: 6, height: 6, borderRadius: '50%', backgroundColor: 'rgba(255,255,255,0.35)' }} />
                <div style={{ fontFamily: D.font, fontSize: D.titleSize, fontWeight: D.titleWeight, color: '#FFFFFF', lineHeight: 1.2, position: 'relative', zIndex: 1 }}>
                  {card.label}
                </div>
                <div>
                  <div style={{ fontFamily: D.font, fontSize: D.kpiSize, fontWeight: D.kpiWeight, color: '#FFFFFF', lineHeight: 1, position: 'relative', zIndex: 1 }}>
                    {(kpis[card.id] ?? 0).toLocaleString()}
                  </div>
                  <div style={{ fontFamily: D.fontBody, fontSize: D.subSize, color: 'rgba(255,255,255,0.8)', marginTop: 3, position: 'relative', zIndex: 1 }}>
                    {card.kpiLabel}
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </ModuleLayout>
  )
}
