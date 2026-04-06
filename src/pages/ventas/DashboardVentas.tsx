import { useState, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { ModuleLayout } from '../../components/layout/ModuleLayout'
import { supabase } from '../../lib/supabase'

/* ———————————————————————————————————————————————————————————————
   COMERCIAL — Landing Page (alineada a plantilla madre del dashboard)
   4 cards: Oportunidades, Cotizaciones, Comisiones, Programa Semanal
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

const P = 'rgba(255,255,255,0.13)'
const S = 'rgba(255,255,255,0.09)'

const iconWrap: React.CSSProperties = {
  position: 'absolute',
  top: 0, right: 0, width: '100%', height: '100%',
  pointerEvents: 'none', overflow: 'hidden',
  borderRadius: '14px',
  transition: 'transform 0.6s cubic-bezier(0.23,1,0.32,1)',
}

const svgPos: React.CSSProperties = {
  position: 'absolute', right: 0, bottom: 0,
  width: '100%', height: '100%',
  transform: 'scale(2.1)',
  transformOrigin: '100% 100%',
}

/* 1. Oportunidades — Funnel/Pipeline ascending */
const IconOportunidades = () => (
  <svg viewBox="0 0 200 140" style={svgPos}>
    <polygon points="55,25 145,25 125,65 75,65" fill="none" stroke={P} strokeWidth="2.5" strokeLinejoin="round" />
    <rect x="75" y="65" width="50" height="45" rx="3" fill="none" stroke={P} strokeWidth="2.5" />
    <line x1="75" y1="85" x2="125" y2="85" stroke={S} strokeWidth="1.5" />
    <path d="M100,58 L100,32" stroke={P} strokeWidth="2" strokeLinecap="round" />
    <path d="M92,40 L100,32 L108,40" fill="none" stroke={P} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
)

/* 2. Cotizaciones — Document with $ */
const IconCotizaciones = () => (
  <svg viewBox="0 0 200 140" style={svgPos}>
    <rect x="58" y="12" width="75" height="100" rx="6" fill="none" stroke={P} strokeWidth="2.5" />
    <line x1="74" y1="38" x2="118" y2="38" stroke={S} strokeWidth="1.5" strokeLinecap="round" />
    <line x1="74" y1="52" x2="108" y2="52" stroke={S} strokeWidth="1.5" strokeLinecap="round" />
    <line x1="74" y1="66" x2="98" y2="66" stroke={S} strokeWidth="1.5" strokeLinecap="round" />
    <text x="112" y="92" fontSize="28" fontFamily="Montserrat" fontWeight="700" fill="none" stroke={P} strokeWidth="1.5">$</text>
  </svg>
)

/* 3. Comisiones — Circle with % */
const IconComisiones = () => (
  <svg viewBox="0 0 200 140" style={svgPos}>
    <circle cx="100" cy="68" r="38" fill="none" stroke={P} strokeWidth="2.5" />
    <circle cx="100" cy="68" r="26" fill="none" stroke={S} strokeWidth="1.5" />
    <circle cx="85" cy="55" r="6" fill="none" stroke={P} strokeWidth="2" />
    <circle cx="115" cy="82" r="6" fill="none" stroke={P} strokeWidth="2" />
    <line x1="120" y1="48" x2="82" y2="90" stroke={P} strokeWidth="2.5" strokeLinecap="round" />
  </svg>
)

/* 4. Programa Semanal — Calendar grid */
const IconPrograma = () => (
  <svg viewBox="0 0 200 140" style={svgPos}>
    <rect x="40" y="22" width="120" height="90" rx="6" fill="none" stroke={P} strokeWidth="2.5" />
    <line x1="40" y1="44" x2="160" y2="44" stroke={P} strokeWidth="2" />
    <line x1="70" y1="22" x2="70" y2="112" stroke={S} strokeWidth="1.2" />
    <line x1="100" y1="22" x2="100" y2="112" stroke={S} strokeWidth="1.2" />
    <line x1="130" y1="22" x2="130" y2="112" stroke={S} strokeWidth="1.2" />
    <line x1="40" y1="66" x2="160" y2="66" stroke={S} strokeWidth="1.2" />
    <line x1="40" y1="88" x2="160" y2="88" stroke={S} strokeWidth="1.2" />
    <rect x="56" y="14" width="6" height="16" rx="1.5" fill={P} />
    <rect x="138" y="14" width="6" height="16" rx="1.5" fill={P} />
    <rect x="104" y="70" width="22" height="14" rx="2" fill={S} stroke={P} strokeWidth="1.5" />
  </svg>
)

/* —— Card Config —— */
interface LandingCard {
  id: string; label: string; route: string; kpiLabel: string;
  icon: React.ReactNode; accent: string
}

const CARDS: LandingCard[] = [
  { id: 'oportunidades', label: 'Oportunidades', route: '/ventas/mis-leads', kpiLabel: 'Pipeline activo', icon: <IconOportunidades />, accent: '#2563EB' },
  { id: 'cotizaciones',  label: 'Cotizaciones',  route: '/cotizador/nueva',  kpiLabel: 'Pendientes',     icon: <IconCotizaciones />,  accent: '#059669' },
  { id: 'comisiones',    label: 'Comisiones',    route: '/ventas/comisiones', kpiLabel: 'Vendedores',    icon: <IconComisiones />,    accent: '#7C3AED' },
  { id: 'programa',      label: 'Programa Semanal', route: '/ventas/programa-semanal', kpiLabel: 'Esta semana', icon: <IconPrograma />, accent: '#D97706' },
]

/* —— Component —— */
export default function DashboardVentas() {
  const navigate = useNavigate()
  const [hovered, setHovered] = useState<string | null>(null)
  const [kpis, setKpis] = useState<Record<string, number>>({ oportunidades: 0, cotizaciones: 0, comisiones: 0, programa: 0 })

  const fetchKpis = useCallback(async () => {
    try {
      const [leads, cots, vendedores, prog] = await Promise.all([
        supabase.from('leads').select('*', { count: 'exact', head: true }).is('deleted_at', null).not('estado', 'in', '("Cerrado Ganado","Cerrado Perdido")'),
        supabase.from('cotizaciones').select('*', { count: 'exact', head: true }).is('deleted_at', null).eq('estado', 'pendiente'),
        supabase.from('usuarios_autorizados').select('*', { count: 'exact', head: true }).eq('rol', 'ventas'),
        supabase.from('leads').select('*', { count: 'exact', head: true }).is('deleted_at', null).gte('created_at', new Date(Date.now() - 7 * 86400000).toISOString()),
      ])
      setKpis({
        oportunidades: leads.count ?? 0,
        cotizaciones: cots.count ?? 0,
        comisiones: vendedores.count ?? 0,
        programa: prog.count ?? 0,
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
    <ModuleLayout titulo="Comercial" moduloPadre={{ nombre: 'Dashboard', ruta: '/dashboard' }}>
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
