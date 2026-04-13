import { useState, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { ModuleLayout } from '../../components/layout/ModuleLayout'
import { supabase } from '../../lib/supabase'
// Loader2 removed — cards render instantly, KPIs load in background
import { tokens } from '../../lib/tokens'

/* ———————————————————————————————————————————————————————————————
   COMERCIAL — Landing Page (alineada al dashboard principal)
   3 cards reales: Oportunidades, Cotizaciones, Programa Semanal
   Iconos Hugeicons watermark anclados bottom-right (mismo patron
   que HomeDashboard / card Configuracion validado por JJ)
   ——————————————————————————————————————————————————————————————— */

const D = {
  bg: '#E8EBF0',
  font: tokens.fonts.heading,
  cardRadius: '14px',
  titleSize: '20px',
  titleWeight: 800,
  kpiSize: '28px',
  kpiWeight: 600,
  subSize: '9px',
} as const

// ICON SYSTEM — Hugeicons via Iconify CDN (mismo patron HomeDashboard)
const ICO_OPACITY = 0.20
const ico = (path: string, style: React.CSSProperties) => (
  <img src={`https://api.iconify.design/${path}.svg?color=%23ffffff`} alt="" style={style} />
)
const compose = (main: string, sat: string, accent: string) => () => (
  <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none', opacity: ICO_OPACITY }}>
    {ico(sat,    { position: 'absolute', right: '8%',  bottom: '38%', width: '19%', height: '19%' })}
    {ico(accent, { position: 'absolute', right: '2%',  bottom: '4%',  width: '30%', height: '30%' })}
    {ico(main,   { position: 'absolute', right: '-2%', bottom: '-2%', width: '70%', height: '70%' })}
  </div>
)

const IconOportunidades = compose('hugeicons:filter',     'hugeicons:search-01',          'hugeicons:arrow-up-right-01')
const IconCotizaciones  = compose('hugeicons:invoice-03', 'hugeicons:calculator-01',      'hugeicons:checkmark-circle-01')
const IconPrograma      = compose('hugeicons:calendar-03','hugeicons:clock-01',           'hugeicons:checkmark-circle-01')

interface LandingCard {
  id: string; label: string; route: string; kpiLabel: string;
  icon: React.ReactNode; accent: string
}

const CARDS: LandingCard[] = [
  { id: 'cotizaciones',  label: 'Cotizaciones',     route: '/cotizador/nueva',          kpiLabel: 'Pendientes',      icon: <IconCotizaciones />,  accent: '#D97706' },
  { id: 'programa',      label: 'Programa Semanal', route: '/ventas/programa-semanal',  kpiLabel: 'Esta semana',     icon: <IconPrograma />,      accent: '#0891B2' },
]

export default function DashboardVentas() {
  const navigate = useNavigate()
  const [hovered, setHovered] = useState<string | null>(null)
  const [kpis, setKpis] = useState<Record<string, number>>({ cotizaciones: 0, programa: 0 })
  const [loading, setLoading] = useState(true)

  const fetchKpis = useCallback(async () => {
    try {
      const [cots, prog] = await Promise.all([
        supabase.from('cotizaciones').select('*', { count: 'exact', head: true }).is('deleted_at', null).eq('estado', 'pendiente'),
        supabase.from('leads').select('*', { count: 'exact', head: true }).is('deleted_at', null).gte('created_at', new Date(Date.now() - 7 * 86400000).toISOString()),
      ])
      setKpis({
        cotizaciones: cots.count ?? 0,
        programa: prog.count ?? 0,
      })
    } catch (e) {
      console.error('KPI fetch error:', e)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { fetchKpis() }, [fetchKpis])

  const getCardStyle = (isH: boolean, accent: string): React.CSSProperties => ({
    aspectRatio: '1 / 0.75',
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
    transition: 'transform 0.25s ease, box-shadow 0.25s ease',
    transform: isH ? 'translateY(-3px)' : 'none',
    boxShadow: isH ? '0 6px 12px rgba(0,0,0,0.15), 0 12px 32px rgba(0,0,0,0.1)' : '0 2px 4px rgba(0,0,0,0.08), 0 4px 12px rgba(0,0,0,0.06)',
  })

  return (
    <ModuleLayout titulo="Comercial" moduloPadre={{ nombre: 'Dashboard', ruta: '/dashboard' }}>
      <div style={{ background: D.bg, minHeight: 'calc(100vh - 120px)', padding: '32px 40px' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '14px' }}>
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
                <div style={{
                  position: 'absolute', inset: 0, pointerEvents: 'none', overflow: 'hidden', borderRadius: '14px',
                  transition: 'transform 0.6s cubic-bezier(0.23,1,0.32,1)',
                  transform: isH ? 'translate(4px,-4px) scale(1.05)' : 'none',
                }}>
                  {card.icon}
                </div>
                <div style={{ position: 'absolute', top: 14, right: 14, width: 6, height: 6, borderRadius: '50%', backgroundColor: 'rgba(255,255,255,0.35)' }} />
                <div style={{ fontFamily: D.font, fontSize: D.titleSize, fontWeight: D.titleWeight, color: '#FFFFFF', lineHeight: 1.2, position: 'relative', zIndex: 1, textAlign: 'center' }}>
                  {card.label}
                </div>
                <div>
                  <div style={{ fontFamily: D.font, fontSize: D.kpiSize, fontWeight: D.kpiWeight, color: '#FFFFFF', lineHeight: 1, position: 'relative', zIndex: 1 }}>
                    {loading ? '—' : (kpis[card.id] ?? 0).toLocaleString()}
                  </div>
                  <div style={{ fontFamily: D.font, fontSize: D.subSize, color: 'rgba(255,255,255,0.7)', marginTop: 3, position: 'relative', zIndex: 1 }}>
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
