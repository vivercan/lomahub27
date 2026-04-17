import { useState, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { ModuleLayout } from '../../components/layout/ModuleLayout'
import { supabase } from '../../lib/supabase'
import { tokens } from '../../lib/tokens'

/* ———————————————————————————————————————————————————————————————
SERVICIO A CLIENTES — Landing Page
Dark glass cards with amber hover glow — premium AAA style
—————————————————————————————————————————————————————————————— */

const D = {
  bg: '#E8EBF0',
  font: tokens.fonts.heading,
  fontBody: tokens.fonts.body,
} as const

/* ── Amber glow color for hover ── */
const AMBER = '218,140,28'

/* ── Icon component — centered, prominent, thin-stroke ── */
const STROKE_SCALE = 0.75

const IcoCenter = ({ set, name }: { set: string; name: string }) => {
  const [src, setSrc] = useState(`https://api.iconify.design/${set}:${name}.svg?color=%23ffffff`)
  useEffect(() => {
    fetch(`https://api.iconify.design/${set}:${name}.svg?color=%23ffffff`)
      .then(r => r.text())
      .then(raw => {
        const thin = raw.replace(/stroke-width="([^"]+)"/g, (_, w) =>
          `stroke-width="${(parseFloat(w) * STROKE_SCALE).toFixed(2)}"`)
        setSrc(`data:image/svg+xml,${encodeURIComponent(thin)}`)
      })
      .catch(() => {})
  }, [set, name])
  return (
    <img src={src} alt=""
      style={{ width: '79px', height: '79px', opacity: 0.90, filter: 'drop-shadow(0 1px 2px rgba(0,0,0,0.3))' }} />
  )
}

/* ── Card config ── */
interface CardDef {
  id: string
  label: string
  route: string
  kpiLabel: string
  iconSet: string
  iconName: string
}

const CARDS: CardDef[] = [
  { id: 'tickets',      label: 'Tickets',           route: '/servicio/tickets',         kpiLabel: 'Activos',         iconSet: 'bi',        iconName: 'ticket-perforated' },
  { id: 'clientes',     label: 'Clientes Activos',  route: '/clientes/corporativos',    kpiLabel: 'Clientes',        iconSet: 'gridicons',  iconName: 'multiple-users' },
  { id: 'impo',         label: 'Importación',       route: '/servicio/importacion',     kpiLabel: 'Viajes IMPO (30d)', iconSet: 'ion',      iconName: 'cloud-download' },
  { id: 'expo',         label: 'Exportación',       route: '/servicio/exportacion',     kpiLabel: 'Viajes EXPO (30d)', iconSet: 'ion',      iconName: 'cloud-upload' },
  { id: 'despacho_ia',  label: 'Despacho IA',       route: '/operaciones/torre-control', kpiLabel: 'Viajes activos',  iconSet: 'bi',         iconName: 'cpu' },
  { id: 'metricas',     label: 'Métricas Servicio', route: '/servicio/metricas',        kpiLabel: 'Dashboard',       iconSet: 'bi',        iconName: 'graph-up' },
  { id: 'actividades',  label: 'Actividades',       route: '/actividades',              kpiLabel: 'Pendientes',      iconSet: 'bi',        iconName: 'list-check' },
]

/* ── Supabase helpers ── */
async function countViajesAnodosByTipo(tipoViaje: number): Promise<number> {
  const hace30d = new Date()
  hace30d.setDate(hace30d.getDate() - 30)
  const desde = hace30d.toISOString()

  const { count, error } = await supabase
    .from('viajes_anodos')
    .select('*', { count: 'exact', head: true })
    .eq('tipo_viaje', tipoViaje)
    .gte('inicia_viaje', desde)

  if (error) { console.error(`viajes_anodos tipo ${tipoViaje}:`, error); return 0 }
  if (count && count > 0) return count

  const { count: c2, error: e2 } = await supabase
    .from('viajes_anodos')
    .select('*', { count: 'exact', head: true })
    .eq('tipo_viaje', tipoViaje)
    .gte('fecha_crea', desde)

  if (e2) { console.error(`viajes_anodos tipo ${tipoViaje} fallback:`, e2); return 0 }
  return c2 || 0
}

/* ── Component ── */
export default function DashboardCS() {
  const navigate = useNavigate()
  const [hovered, setHovered] = useState<string | null>(null)
  const [kpis, setKpis] = useState<Record<string, number>>({ tickets: 0, clientes: 0, impo: 0, expo: 0 })
  const [loading, setLoading] = useState(true)

  const fetchKpis = useCallback(async () => {
    try {
      const [tix, cli] = await Promise.all([
        supabase.from('tickets').select('*', { count: 'exact', head: true }).is('deleted_at', null).in('estado', ['abierto', 'en_proceso']),
        supabase.from('clientes').select('*', { count: 'exact', head: true }).is('deleted_at', null),
      ])
      const [impoCount, expoCount] = await Promise.all([
        countViajesAnodosByTipo(3),
        countViajesAnodosByTipo(2),
      ])
      setKpis({ tickets: tix.count ?? 0, clientes: cli.count ?? 0, impo: impoCount, expo: expoCount })
    } catch (e) { console.error('KPI fetch error:', e) }
    finally { setLoading(false) }
  }, [])

  useEffect(() => { fetchKpis() }, [fetchKpis])

  return (
    <ModuleLayout titulo="Servicio a Clientes" moduloPadre={{ nombre: 'Dashboard', ruta: '/dashboard' }}>
      <div style={{ background: D.bg, minHeight: 'calc(100vh - 120px)', padding: '32px 40px' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '16px' }}>
          {CARDS.map(card => {
            const isH = hovered === card.id
            return (
              <div
                key={card.id}
                style={{
                  aspectRatio: '1 / 1',
                  borderRadius: '16px',
                  padding: '20px',
                  /* Dark glass background */
                  background: isH
                    ? 'linear-gradient(160deg, rgba(30,38,58,0.97) 0%, rgba(18,24,42,0.99) 100%)'
                    : 'linear-gradient(160deg, rgba(24,32,52,0.95) 0%, rgba(14,20,36,0.98) 100%)',
                  /* Glass border — amber glow on hover */
                  border: isH
                    ? `1px solid rgba(${AMBER},0.50)`
                    : '1px solid rgba(255,255,255,0.07)',
                  cursor: 'pointer',
                  position: 'relative',
                  overflow: 'hidden',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  gap: '0px',
                  transition: 'all 0.4s cubic-bezier(0.23,1,0.32,1)',
                  transform: isH ? 'translateY(-4px)' : 'none',
                  boxShadow: isH
                    ? `0 0 20px rgba(${AMBER},0.15), 0 0 40px rgba(${AMBER},0.08), 0 8px 24px rgba(0,0,0,0.40), 0 16px 48px rgba(0,0,0,0.25), inset 0 1px 0 rgba(255,255,255,0.08)`
                    : `0 4px 12px rgba(0,0,0,0.25), 0 8px 32px rgba(0,0,0,0.15), inset 0 1px 0 rgba(255,255,255,0.06)`,
                }}
                onMouseEnter={() => setHovered(card.id)}
                onMouseLeave={() => setHovered(null)}
                onClick={() => navigate(card.route)}
              >
                {/* Top amber glow line on hover */}
                <div style={{
                  position: 'absolute', top: 0, left: '15%', right: '15%', height: '2px',
                  background: isH ? `linear-gradient(90deg, transparent, rgba(${AMBER},0.70), transparent)` : 'transparent',
                  transition: 'background 0.4s ease',
                  borderRadius: '0 0 2px 2px',
                  filter: isH ? `drop-shadow(0 0 6px rgba(${AMBER},0.50))` : 'none',
                }} />

                {/* Subtle glass reflection */}
                <div style={{
                  position: 'absolute', inset: 0, pointerEvents: 'none', borderRadius: '16px',
                  background: 'linear-gradient(180deg, rgba(255,255,255,0.04) 0%, transparent 40%)',
                }} />

                {/* Label — at TOP */}
                <div style={{
                  fontFamily: D.font, fontSize: '17px', fontWeight: 700, color: 'rgba(255,255,255,0.88)',
                  textAlign: 'center', position: 'relative', zIndex: 1, letterSpacing: '-0.01em',
                  lineHeight: 1.2, paddingTop: '4px',
                }}>
                  {card.label}
                </div>

                {/* Icon — centered, prominent */}
                <div style={{ position: 'relative', zIndex: 1, transition: 'transform 0.4s ease', transform: isH ? 'scale(1.08)' : 'none' }}>
                  <IcoCenter set={card.iconSet} name={card.iconName} />
                </div>

                {/* KPI + sublabel */}
                <div style={{ textAlign: 'center', position: 'relative', zIndex: 1 }}>
                  <div style={{
                    fontFamily: D.font, fontSize: '22px', fontWeight: 600,
                    color: isH ? `rgba(${AMBER},1)` : 'rgba(255,255,255,0.95)',
                    lineHeight: 1, transition: 'color 0.3s ease',
                  }}>
                    {loading ? '—' : (kpis[card.id] ?? 0).toLocaleString()}
                  </div>
                  <div style={{
                    fontFamily: D.font, fontSize: '10px', fontWeight: 500,
                    color: 'rgba(255,255,255,0.45)', marginTop: 3, letterSpacing: '0.03em',
                    textTransform: 'uppercase',
                  }}>
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
