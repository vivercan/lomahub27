import { useState, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { ModuleLayout } from '../../components/layout/ModuleLayout'
import { supabase } from '../../lib/supabase'
import { CARD_ICON_POS, CARD_ICON_P, CARD_ICON_S } from '../../lib/cardIconStyle'
import { Ticket, Users, ArrowDownToLine, ArrowUpFromLine } from 'lucide-react'

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

const P = CARD_ICON_P
const S = CARD_ICON_S

const iconWrap: React.CSSProperties = {
  position: 'absolute',
  top: 0, right: 0, width: '100%', height: '100%',
  pointerEvents: 'none', overflow: 'hidden',
  borderRadius: '14px',
  transition: 'transform 0.6s cubic-bezier(0.23,1,0.32,1)',
}

const svgPos: React.CSSProperties = CARD_ICON_POS

// Lucide premium outline family — single visual family via cardIconStyle.ts
const lucideStyle = { ...svgPos, color: P } as React.CSSProperties
const IconTickets = () => (<Ticket style={lucideStyle} strokeWidth={1.5} absoluteStrokeWidth />)
const IconClientes = () => (<Users style={lucideStyle} strokeWidth={1.5} absoluteStrokeWidth />)
const IconImpo = () => (<ArrowDownToLine style={lucideStyle} strokeWidth={1.5} absoluteStrokeWidth />)
const IconExpo = () => (<ArrowUpFromLine style={lucideStyle} strokeWidth={1.5} absoluteStrokeWidth />)

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
