import { useState, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { ModuleLayout } from '../../components/layout/ModuleLayout'
import { supabase } from '../../lib/supabase'

/* ââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââ
SERVICIO A CLIENTES â Landing Page (alineada a plantilla madre)
4 cards: Tickets, Clientes Activos, Importacion, Exportacion
KPIs reales: tickets + clientes de Supabase, IMPO/EXPO de viajes_anodos
Icono Ãºnico white-stroke: principal 12% | secondary 8%
ââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââ */

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

const ICO_OPACITY = 0.22

const ico = (path: string, style: React.CSSProperties) => (
  <img src={`https://api.iconify.design/${path}.svg?color=%23ffffff`} alt="" style={style} />
)

const compose = (main: string, sat: string, accent: string) => () => (
  <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none', opacity: ICO_OPACITY }}>
    {ico(sat, { position: 'absolute', right: '46%', bottom: '40%', width: '24%', height: '24%' })}
    {ico(accent, { position: 'absolute', right: '-2%', bottom: '-4%', width: '38%', height: '38%' })}
    {ico(main, { position: 'absolute', right: '-18%', bottom: '-26%', width: '88%', height: '120%' })}
  </div>
)

const IconTickets = compose('hugeicons:ticket-01', 'hugeicons:alert-circle', 'hugeicons:checkmark-circle-01')
const IconClientes = compose('hugeicons:user-multiple', 'hugeicons:user-circle', 'hugeicons:star')
const IconImpo = compose('hugeicons:package-moving', 'hugeicons:arrow-down-01', 'hugeicons:ship-02')
const IconExpo = compose('hugeicons:package-delivered', 'hugeicons:arrow-up-01', 'hugeicons:airplane-take-off-01')

/* ââ Card Config ââ */
interface LandingCard {
  id: string
  label: string
  route: string
  kpiLabel: string
  icon: React.ReactNode
  accent: string
}

const CARDS: LandingCard[] = [
  { id: 'tickets', label: 'Tickets', route: '/servicio/tickets', kpiLabel: 'Activos', icon: <IconTickets />, accent: '#2563EB' },
  { id: 'clientes', label: 'Clientes Activos', route: '/clientes/corporativos', kpiLabel: 'Clientes', icon: <IconClientes />, accent: '#059669' },
  { id: 'impo', label: 'ImportaciÃ³n', route: '/servicio/importacion', kpiLabel: 'Viajes IMPO (30d)', icon: <IconImpo />, accent: '#7C3AED' },
  { id: 'expo', label: 'ExportaciÃ³n', route: '/servicio/exportacion', kpiLabel: 'Viajes EXPO (30d)', icon: <IconExpo />, accent: '#D97706' },
]

/* ââ Helper: count viajes_anodos by tipo with pagination ââ */
async function countViajesAnodosByTipo(tipoViaje: number): Promise<number> {
  const hace30d = new Date()
  hace30d.setDate(hace30d.getDate() - 30)
  const desde = hace30d.toISOString()

  // Try inicia_viaje first
  const { count, error } = await supabase
    .from('viajes_anodos')
    .select('*', { count: 'exact', head: true })
    .eq('tipo_viaje', tipoViaje)
    .gte('inicia_viaje', desde)

  if (error) {
    console.error(`viajes_anodos tipo ${tipoViaje}:`, error)
    return 0
  }

  if (count && count > 0) return count

  // Fallback to fecha_crea
  const { count: c2, error: e2 } = await supabase
    .from('viajes_anodos')
    .select('*', { count: 'exact', head: true })
    .eq('tipo_viaje', tipoViaje)
    .gte('fecha_crea', desde)

  if (e2) { console.error(`viajes_anodos tipo ${tipoViaje} fallback:`, e2); return 0 }
  return c2 || 0
}

/* ââ Component ââ */
export default function DashboardCS() {
  const navigate = useNavigate()
  const [hovered, setHovered] = useState<string | null>(null)
  const [kpis, setKpis] = useState<Record<string, number>>({
    tickets: 0,
    clientes: 0,
    impo: 0,
    expo: 0,
  })

  const fetchKpis = useCallback(async () => {
    try {
      // Tickets y clientes desde tablas directas
      const [tix, cli] = await Promise.all([
        supabase.from('tickets').select('*', { count: 'exact', head: true }).is('deleted_at', null).in('estado', ['abierto', 'en_proceso']),
        supabase.from('clientes').select('*', { count: 'exact', head: true }).is('deleted_at', null),
      ])

      // IMPO y EXPO desde viajes_anodos (datos reales ANODOS)
      // TipoViaje mapping: 2=EXPO, 3=IMPO, 4=NAC, 7=VACIO
      const [impoCount, expoCount] = await Promise.all([
        countViajesAnodosByTipo(3), // IMPO
        countViajesAnodosByTipo(2), // EXPO
      ])

      setKpis({
        tickets: tix.count ?? 0,
        clientes: cli.count ?? 0,
        impo: impoCount,
        expo: expoCount,
      })
    } catch (e) {
      console.error('KPI fetch error:', e)
    }
  }, [])

  useEffect(() => {
    fetchKpis()
  }, [fetchKpis])

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
                <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none', overflow: 'hidden', borderRadius: '14px', transition: 'transform 0.6s cubic-bezier(0.23,1,0.32,1)', transform: isH ? 'translate(4px,-4px) scale(1.05)' : 'none' }}>
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
