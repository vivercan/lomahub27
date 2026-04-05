import { useState, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { ModuleLayout } from '../../components/layout/ModuleLayout'
import { supabase } from '../../lib/supabase'

/* ———————————————————————————————————————————————————————————————
   SERVICIO A CLIENTES — Landing Page (estilo Dashboard V27f)
   4 cards: Tickets, Clientes Activos, Importación, Exportación
   ——————————————————————————————————————————————————————————————— */

const D = {
  bg: '#F7F8FA',
  font: "'Montserrat', sans-serif",
  fontBody: "'Montserrat', sans-serif",
  cardBg: 'linear-gradient(180deg, #FFFFFF 0%, #F6F7FA 100%)',
  cardBorder: '1px solid #CDD5E1',
  cardRadius: '14px',
  cardShadow: '0 2px 4px rgba(0,0,0,0.06), 0 4px 12px rgba(0,0,0,0.05), 0 8px 24px rgba(0,0,0,0.04), inset 0 1px 0 rgba(255,255,255,0.9)',
  cardHover: '0 4px 8px rgba(0,0,0,0.08), 0 8px 24px rgba(0,0,0,0.08), 0 16px 48px rgba(0,0,0,0.06), inset 0 1px 0 rgba(255,255,255,0.95)',
  titleSize: '17px',
  titleWeight: 800,
  titleColor: '#0F172A',
  kpiSize: '38px',
  kpiWeight: 600,
  kpiColor: '#0F172A',
  subSize: '12px',
  subColor: '#64748B',
  dotSize: '8px',
} as const

const DOT: Record<string, string> = { green: '#0D9668', yellow: '#B8860B', red: '#C53030', gray: '#CBD5E1' }

/* —— Geometric SVGs —— */
const geoBase: React.CSSProperties = {
  position: 'absolute', top: 0, right: 0, width: '100%', height: '100%',
  pointerEvents: 'none', overflow: 'hidden', borderRadius: '14px',
  transition: 'transform 0.6s cubic-bezier(0.23,1,0.32,1)',
}

const GeoTickets = () => (
  <div style={geoBase}>
    <svg viewBox="0 0 200 140" style={{ position: 'absolute', right: '-10px', bottom: '-10px', width: '65%', height: '75%', opacity: 0.25 }}>
      <rect x="60" y="20" width="70" height="50" rx="6" fill="none" stroke="rgba(255,255,255,0.5)" strokeWidth="1.2" />
      <rect x="75" y="35" width="70" height="50" rx="6" fill="none" stroke="rgba(255,255,255,0.5)" strokeWidth="1" />
      <rect x="90" y="50" width="70" height="50" rx="6" fill="none" stroke="rgba(255,255,255,0.5)" strokeWidth="0.8" />
    </svg>
  </div>
)

const GeoClientes = () => (
  <div style={geoBase}>
    <svg viewBox="0 0 200 140" style={{ position: 'absolute', right: '-10px', bottom: '-10px', width: '65%', height: '75%', opacity: 0.25 }}>
      <circle cx="100" cy="50" r="25" fill="none" stroke="rgba(255,255,255,0.5)" strokeWidth="1.2" />
      <circle cx="130" cy="70" r="20" fill="none" stroke="rgba(255,255,255,0.5)" strokeWidth="1" />
      <circle cx="75" cy="75" r="18" fill="none" stroke="rgba(255,255,255,0.5)" strokeWidth="0.8" />
      <circle cx="110" cy="95" r="15" fill="none" stroke="rgba(255,255,255,0.5)" strokeWidth="0.8" />
    </svg>
  </div>
)

const GeoImpo = () => (
  <div style={geoBase}>
    <svg viewBox="0 0 200 140" style={{ position: 'absolute', right: '-10px', bottom: '-10px', width: '65%', height: '75%', opacity: 0.25 }}>
      <path d="M80,90 L120,30 L160,90 Z" fill="none" stroke="rgba(255,255,255,0.5)" strokeWidth="1.2" />
      <path d="M90,90 L120,45 L150,90 Z" fill="none" stroke="rgba(255,255,255,0.5)" strokeWidth="1" />
      <line x1="120" y1="30" x2="120" y2="90" stroke="rgba(255,255,255,0.5)" strokeWidth="0.8" />
      <polygon points="115,35 120,25 125,35" fill="none" stroke="rgba(255,255,255,0.5)" strokeWidth="1" />
    </svg>
  </div>
)

const GeoExpo = () => (
  <div style={geoBase}>
    <svg viewBox="0 0 200 140" style={{ position: 'absolute', right: '-10px', bottom: '-10px', width: '65%', height: '75%', opacity: 0.25 }}>
      <path d="M70,40 Q120,20 170,40 Q120,60 70,40" fill="none" stroke="rgba(255,255,255,0.5)" strokeWidth="1.2" />
      <path d="M70,65 Q120,45 170,65 Q120,85 70,65" fill="none" stroke="rgba(255,255,255,0.5)" strokeWidth="1" />
      <path d="M70,90 Q120,70 170,90 Q120,110 70,90" fill="none" stroke="rgba(255,255,255,0.5)" strokeWidth="0.8" />
      <line x1="120" y1="25" x2="120" y2="110" stroke="rgba(255,255,255,0.5)" strokeWidth="0.8" strokeDasharray="4 3" />
    </svg>
  </div>
)

/* —— Colorful Module SVGs (Propuesta 12 — Logística Colorida) —— */
const colorSvg: React.CSSProperties = {
  position: 'absolute', bottom: '-8px', left: '-8px',
  width: '50%', height: '55%', opacity: 0.22,
}

const ColorTickets = () => (
  <div style={geoBase}>
    <svg viewBox="0 0 54 54" style={colorSvg} xmlns="http://www.w3.org/2000/svg">
      <circle cx="27" cy="16" r="8" stroke="rgba(255,255,255,0.5)" strokeWidth="1.5" fill="none" opacity=".4"/>
      <path d="M23 14L26 18L32 12" stroke="rgba(255,255,255,0.5)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" opacity=".5"/>
      <rect x="14" y="30" width="26" height="14" rx="3" fill="rgba(255,255,255,0.3)" opacity=".15"/>
      <rect x="18" y="34" width="18" height="2.5" rx="1" fill="rgba(255,255,255,0.3)" opacity=".25"/>
      <rect x="18" y="39" width="12" height="2.5" rx="1" fill="rgba(255,255,255,0.3)" opacity=".25"/>
    </svg>
  </div>
)

const ColorClientes = () => (
  <div style={geoBase}>
    <svg viewBox="0 0 54 54" style={colorSvg} xmlns="http://www.w3.org/2000/svg">
      <circle cx="18" cy="16" r="7" fill="rgba(255,255,255,0.3)" opacity=".2"/>
      <circle cx="36" cy="16" r="7" fill="rgba(255,255,255,0.3)" opacity=".2"/>
      <path d="M8 40C8 32 16 28 27 28C38 28 46 32 46 40" fill="rgba(255,255,255,0.3)" opacity=".12"/>
      <path d="M20 22L27 18L34 22" stroke="rgba(255,255,255,0.5)" strokeWidth="2" strokeLinecap="round" opacity=".4"/>
    </svg>
  </div>
)

const ColorImpo = () => (
  <div style={geoBase}>
    <svg viewBox="0 0 54 54" style={colorSvg} xmlns="http://www.w3.org/2000/svg">
      <rect x="8" y="18" width="22" height="16" rx="2" fill="rgba(255,255,255,0.3)" opacity=".15"/>
      <rect x="12" y="22" width="14" height="8" rx="1" fill="rgba(255,255,255,0.3)" opacity=".12"/>
      <path d="M36 18L36 34" stroke="rgba(255,255,255,0.5)" strokeWidth="2" strokeLinecap="round" opacity=".35"/>
      <polygon points="36,14 40,20 32,20" fill="rgba(255,255,255,0.3)" opacity=".3"/>
      <circle cx="42" cy="40" r="6" fill="rgba(255,255,255,0.3)" opacity=".15"/>
      <path d="M40 40L42 42L45 38" stroke="rgba(255,255,255,0.5)" strokeWidth="1.5" strokeLinecap="round" opacity=".4"/>
    </svg>
  </div>
)

const ColorExpo = () => (
  <div style={geoBase}>
    <svg viewBox="0 0 54 54" style={colorSvg} xmlns="http://www.w3.org/2000/svg">
      <rect x="8" y="18" width="22" height="16" rx="2" fill="rgba(255,255,255,0.3)" opacity=".15"/>
      <rect x="12" y="22" width="14" height="8" rx="1" fill="rgba(255,255,255,0.3)" opacity=".12"/>
      <path d="M36 34L36 18" stroke="rgba(255,255,255,0.5)" strokeWidth="2" strokeLinecap="round" opacity=".35"/>
      <polygon points="36,38 40,32 32,32" fill="rgba(255,255,255,0.3)" opacity=".3"/>
      <circle cx="42" cy="10" r="6" fill="rgba(255,255,255,0.3)" opacity=".15"/>
      <path d="M39 10L42 7L45 10" stroke="rgba(255,255,255,0.5)" strokeWidth="1.5" strokeLinecap="round" opacity=".4"/>
    </svg>
  </div>
)

/* —— Card Config —— */
interface LandingCard {
  id: string; label: string; route: string; kpiLabel: string; geo: React.ReactNode; geo2?: React.ReactNode; accent: string
}

const CARDS: LandingCard[] = [
  { id: 'tickets', label: 'Tickets', route: '/servicio/tickets', kpiLabel: 'Activos', geo: <GeoTickets />, geo2: <ColorTickets />, accent: '#2563EB' },
  { id: 'clientes', label: 'Clientes Activos', route: '/clientes/ficha', kpiLabel: 'Clientes', geo: <GeoClientes />, geo2: <ColorClientes />, accent: '#059669' },
  { id: 'impo', label: 'Importación', route: '/servicio/importacion', kpiLabel: 'Viajes IMPO', geo: <GeoImpo />, geo2: <ColorImpo />, accent: '#7C3AED' },
  { id: 'expo', label: 'Exportación', route: '/servicio/exportacion', kpiLabel: 'Viajes EXPO', geo: <GeoExpo />, geo2: <ColorExpo />, accent: '#D97706' },
]

/* —— Component —— */
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
      setKpis({ tickets: tix.count ?? 0, clientes: cli.count ?? 0, impo: impo.count ?? 0, expo: expo.count ?? 0 })
    } catch (e) { console.error('KPI fetch error:', e) }
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
                <div style={{ ...geoBase, transform: isH ? 'translate(4px,-4px) scale(1.05)' : 'none' }}>
                  {card.geo}
                </div>
                {card.geo2 && (
                  <div style={{ ...geoBase, transform: isH ? 'translate(-3px,3px) scale(1.03)' : 'none' }}>
                    {card.geo2}
                  </div>
                )}
                <div style={{ position: 'absolute', top: 14, right: 14, width: D.dotSize, height: D.dotSize, borderRadius: '50%', backgroundColor: kpis[card.id] > 0 ? DOT.green : DOT.gray, boxShadow: `0 0 4px ${kpis[card.id] > 0 ? DOT.green : DOT.gray}59` }} />
                <div style={{ fontFamily: D.font, fontSize: D.titleSize, fontWeight: D.titleWeight, color: '#FFFFFF', lineHeight: 1.2, position: 'relative', zIndex: 1 }}>
                  {card.label}
                </div>
                <div>
                  <div style={{ fontFamily: D.font, fontSize: D.kpiSize, fontWeight: D.kpiWeight, color: '#FFFFFF', lineHeight: 1, position: 'relative', zIndex: 1 }}>
                    {(kpis[card.id] ?? 0).toLocaleString()}
                  </div>
                  <div style={{ fontFamily: D.fontBody, fontSize: D.subSize, color: 'rgba(255,255,255,0.7)', marginTop: 3, position: 'relative', zIndex: 1 }}>
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
