import { useState, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { ModuleLayout } from '../../components/layout/ModuleLayout'
import { supabase } from '../../lib/supabase'

/* âââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââ
   VENTAS â Landing Page (estilo Dashboard V27f)
   4 cards: Oportunidades, Cotizaciones, Comisiones, Programa
   âââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââ */

const D = {
  bg: '#F7F8FA',
  font: "'Montserrat', sans-serif",
  fontBody: "'Inter', sans-serif",
  cardBg: '#FFFFFF',
  cardBorder: '1px solid rgba(15,23,42,0.06)',
  cardRadius: '14px',
  cardShadow: '0 1px 2px rgba(0,0,0,0.04), 0 4px 16px rgba(0,0,0,0.06)',
  cardHover: '0 2px 4px rgba(0,0,0,0.05), 0 8px 24px rgba(0,0,0,0.09)',
  titleSize: '17px',
  titleWeight: 800,
  titleColor: '#1E3A8A',
  kpiSize: '38px',
  kpiWeight: 600,
  kpiColor: '#0F172A',
  subSize: '12px',
  subColor: '#64748B',
  dotSize: '8px',
} as const

const DOT: Record<string, string> = { green: '#10B981', yellow: '#F59E0B', red: '#EF4444', gray: '#CBD5E1' }

/* ââ Geometric SVGs ââ */
const geoBase: React.CSSProperties = {
  position: 'absolute', top: 0, right: 0, width: '100%', height: '100%',
  pointerEvents: 'none', overflow: 'hidden', borderRadius: '14px',
  transition: 'transform 0.6s cubic-bezier(0.23,1,0.32,1)',
}

const GeoOportunidades = () => (
  <div style={geoBase}>
    <svg viewBox="0 0 200 140" style={{ position: 'absolute', right: '-10px', bottom: '-10px', width: '65%', height: '75%', opacity: 0.25 }}>
      <polygon points="100,15 130,55 170,60 140,90 148,130 100,108 52,130 60,90 30,60 70,55" fill="none" stroke="#3B82F6" strokeWidth="1.2" />
      <polygon points="100,35 118,58 145,62 125,82 130,108 100,95 70,108 75,82 55,62 82,58" fill="none" stroke="#3B82F6" strokeWidth="0.8" />
    </svg>
  </div>
)

const GeoCotizaciones = () => (
  <div style={geoBase}>
    <svg viewBox="0 0 200 140" style={{ position: 'absolute', right: '-10px', bottom: '-10px', width: '65%', height: '75%', opacity: 0.25 }}>
      <rect x="55" y="20" width="90" height="65" rx="4" fill="none" stroke="#10B981" strokeWidth="1.2" />
      <line x1="70" y1="38" x2="130" y2="38" stroke="#10B981" strokeWidth="0.8" />
      <line x1="70" y1="50" x2="120" y2="50" stroke="#10B981" strokeWidth="0.8" />
      <line x1="70" y1="62" x2="110" y2="62" stroke="#10B981" strokeWidth="0.8" />
      <text x="125" y="78" fontSize="18" fill="none" stroke="#10B981" strokeWidth="0.8" fontFamily="sans-serif">$</text>
    </svg>
  </div>
)

const GeoComisiones = () => (
  <div style={geoBase}>
    <svg viewBox="0 0 200 140" style={{ position: 'absolute', right: '-10px', bottom: '-10px', width: '65%', height: '75%', opacity: 0.25 }}>
      <circle cx="100" cy="65" r="40" fill="none" stroke="#8B5CF6" strokeWidth="1.2" />
      <circle cx="100" cy="65" r="28" fill="none" stroke="#8B5CF6" strokeWidth="0.8" />
      <text x="88" y="73" fontSize="24" fill="none" stroke="#8B5CF6" strokeWidth="1" fontFamily="sans-serif">%</text>
    </svg>
  </div>
)

const GeoPrograma = () => (
  <div style={geoBase}>
    <svg viewBox="0 0 200 140" style={{ position: 'absolute', right: '-10px', bottom: '-10px', width: '65%', height: '75%', opacity: 0.25 }}>
      <rect x="50" y="25" width="100" height="80" rx="6" fill="none" stroke="#F59E0B" strokeWidth="1.2" />
      <line x1="50" y1="45" x2="150" y2="45" stroke="#F59E0B" strokeWidth="1" />
      <line x1="83" y1="25" x2="83" y2="105" stroke="#F59E0B" strokeWidth="0.6" />
      <line x1="116" y1="25" x2="116" y2="105" stroke="#F59E0B" strokeWidth="0.6" />
      <line x1="50" y1="65" x2="150" y2="65" stroke="#F59E0B" strokeWidth="0.6" />
      <line x1="50" y1="85" x2="150" y2="85" stroke="#F59E0B" strokeWidth="0.6" />
    </svg>
  </div>
)

/* ââ Card Config ââ */
interface LandingCard {
  id: string; label: string; route: string; kpiLabel: string; geo: React.ReactNode; accent: string
}

const CARDS: LandingCard[] = [
  { id: 'oportunidades', label: 'Oportunidades', route: '/ventas/leads', kpiLabel: 'Pipeline activo', geo: <GeoOportunidades />, accent: '#3B82F6' },
  { id: 'cotizaciones', label: 'Cotizaciones', route: '/cotizador/nueva', kpiLabel: 'Pendientes', geo: <GeoCotizaciones />, accent: '#10B981' },
  { id: 'comisiones', label: 'Comisiones', route: '/ventas/comisiones', kpiLabel: 'Vendedores', geo: <GeoComisiones />, accent: '#8B5CF6' },
  { id: 'programa', label: 'Programa Semanal', route: '/ventas/programa', kpiLabel: 'Esta semana', geo: <GeoPrograma />, accent: '#F59E0B' },
]

/* ââ Component ââ */
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
    } catch (e) { console.error('KPI fetch error:', e) }
  }, [])

  useEffect(() => { fetchKpis() }, [fetchKpis])

  const getCardStyle = (isH: boolean, accent: string): React.CSSProperties => ({
    aspectRatio: '1 / 0.7',
    borderRadius: D.cardRadius,
    padding: '22px',
    background: 'linear-gradient(180deg, #FFFFFF 0%, #FAFBFC 100%)',
    border: D.cardBorder,
    cursor: 'pointer',
    position: 'relative',
    overflow: 'hidden',
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'space-between',
    transition: 'transform 0.4s cubic-bezier(0.23,1,0.32,1), box-shadow 0.4s cubic-bezier(0.23,1,0.32,1)',
    transform: isH ? 'translateY(-3px)' : 'none',
    boxShadow: (isH ? D.cardHover : D.cardShadow) + `, inset 0 -1px 0 ${accent}33`,
  })

  return (
    <ModuleLayout titulo="Ventas" moduloPadre={{ nombre: 'Dashboard', ruta: '/dashboard' }}>
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
                <div style={{ position: 'absolute', top: 14, right: 14, width: D.dotSize, height: D.dotSize, borderRadius: '50%', backgroundColor: kpis[card.id] > 0 ? DOT.green : DOT.gray, boxShadow: `0 0 4px ${kpis[card.id] > 0 ? DOT.green : DOT.gray}59` }} />
                <div style={{ fontFamily: D.font, fontSize: D.titleSize, fontWeight: D.titleWeight, color: D.titleColor, lineHeight: 1.2, position: 'relative', zIndex: 1 }}>
                  {card.label}
                </div>
                <div>
                  <div style={{ fontFamily: D.font, fontSize: D.kpiSize, fontWeight: D.kpiWeight, color: D.kpiColor, lineHeight: 1, position: 'relative', zIndex: 1 }}>
                    {(kpis[card.id] ?? 0).toLocaleString()}
                  </div>
                  <div style={{ fontFamily: D.fontBody, fontSize: D.subSize, color: D.subColor, marginTop: 3, position: 'relative', zIndex: 1 }}>
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
