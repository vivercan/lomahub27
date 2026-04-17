import { useState, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { ModuleLayout } from '../../components/layout/ModuleLayout'
import { supabase } from '../../lib/supabase'
import { tokens } from '../../lib/tokens'

/* ———————————————————————————————————————————————————————————————
SERVICIO A CLIENTES — Landing Page (alineada a plantilla madre)
4 cards: Tickets, Clientes Activos, Importacion, Exportacion
KPIs reales: tickets + clientes de Supabase, IMPO/EXPO de viajes_anodos
Icono único white-stroke: principal 12% | secondary 8%
—————————————————————————————————————————————————————————————— */

const D = {
  bg: '#E8EBF0',
  font: tokens.fonts.heading,
  fontBody: tokens.fonts.body,
  cardRadius: '14px',
  titleSize: '20px',
  titleWeight: 800,
  kpiSize: '28px',
  kpiWeight: 600,
  subSize: '11px',
  dotSize: '6px',
} as const

/* Darken/lighten a hex color by amount */
function adjustColor(hex: string, amount: number): string {
  const h = hex.replace('#', '')
  const r = Math.max(0, Math.min(255, parseInt(h.substring(0, 2), 16) + amount))
  const g = Math.max(0, Math.min(255, parseInt(h.substring(2, 4), 16) + amount))
  const b = Math.max(0, Math.min(255, parseInt(h.substring(4, 6), 16) + amount))
  return `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`
}

const ICO_OPACITY = 0.22
const STROKE_SCALE = 0.8  // 20% thinner lines

/* Iconify API — fetches SVG, reduces stroke-width 20%, same icon size */
const IcoImg = ({ set, name }: { set: string; name: string }) => {
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
    <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none', opacity: ICO_OPACITY }}>
      <img src={src} alt="" style={{ position: 'absolute', right: '-2%', bottom: '-2%', width: '70%', height: '70%' }} />
    </div>
  )
}

const IconTickets     = () => <IcoImg set="bi" name="ticket-perforated" />
const IconClientes    = () => <IcoImg set="gridicons" name="multiple-users" />
const IconImpo        = () => <IcoImg set="ion" name="cloud-upload" />
const IconExpo        = () => <IcoImg set="ion" name="cloud-download" />
const IconDespachoIA  = () => <IcoImg set="ion" name="hardware-chip" />
const IconMetricas    = () => <IcoImg set="ion" name="stats-chart" />
const IconActividades = () => <IcoImg set="bi" name="list-check" />

/* —— Card Config —— */
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
  { id: 'impo', label: 'Importación', route: '/servicio/importacion', kpiLabel: 'Viajes IMPO (30d)', icon: <IconImpo />, accent: '#7C3AED' },
  { id: 'expo', label: 'Exportación', route: '/servicio/exportacion', kpiLabel: 'Viajes EXPO (30d)', icon: <IconExpo />, accent: '#D97706' },
  { id: 'despacho_ia', label: 'Despacho IA', route: '/operaciones/torre-control', kpiLabel: 'Viajes activos', icon: <IconDespachoIA />, accent: '#15803D' },
  { id: 'metricas', label: 'Métricas Servicio', route: '/servicio/metricas', kpiLabel: 'Dashboard', icon: <IconMetricas />, accent: '#6366F1' },
  { id: 'actividades', label: 'Actividades', route: '/actividades', kpiLabel: 'Pendientes', icon: <IconActividades />, accent: '#0891B2' },
]

/* —— Helper: count viajes_anodos by tipo with pagination —— */
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

/* —— Component —— */
export default function DashboardCS() {
  const navigate = useNavigate()
  const [hovered, setHovered] = useState<string | null>(null)
  const [kpis, setKpis] = useState<Record<string, number>>({
    tickets: 0,
    clientes: 0,
    impo: 0,
    expo: 0,
  })
  const [loading, setLoading] = useState(true)

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
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchKpis()
  }, [fetchKpis])

  const getCardStyle = (isH: boolean, accent: string): React.CSSProperties => ({
    aspectRatio: '1 / 0.75',
    borderRadius: D.cardRadius,
    padding: '22px',
    background: `linear-gradient(155deg, ${adjustColor(accent, 12)} 0%, ${accent} 35%, ${adjustColor(accent, -35)} 100%)`,
    border: 'none',
    cursor: 'pointer',
    position: 'relative',
    overflow: 'hidden',
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'space-between',
    transition: 'transform 0.4s cubic-bezier(0.23,1,0.32,1), box-shadow 0.4s cubic-bezier(0.23,1,0.32,1)',
    transform: isH ? 'translateY(-4px)' : 'none',
    boxShadow: isH
      ? `0 12px 24px rgba(0,0,0,0.25), 0 24px 48px rgba(0,0,0,0.18), 0 2px 4px rgba(0,0,0,0.20), inset 0 1px 0 rgba(255,255,255,0.25), inset 0 -2px 0 rgba(0,0,0,0.20)`
      : `0 6px 14px rgba(0,0,0,0.20), 0 14px 36px rgba(0,0,0,0.14), 0 1px 3px rgba(0,0,0,0.18), inset 0 1px 0 rgba(255,255,255,0.22), inset 0 -2px 0 rgba(0,0,0,0.15)`,
  })

  return (
    <ModuleLayout titulo="Servicio a Clientes" moduloPadre={{ nombre: 'Dashboard', ruta: '/dashboard' }}>
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
                {/* Top-edge light catch for 3D depth */}
                <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none', borderRadius: '14px', background: 'linear-gradient(180deg, rgba(255,255,255,0.18) 0%, transparent 35%, rgba(0,0,0,0.12) 100%)' }} />
                <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none', overflow: 'hidden', borderRadius: '14px', transition: 'transform 0.6s cubic-bezier(0.23,1,0.32,1)', transform: isH ? 'translate(4px,-4px) scale(1.05)' : 'none' }}>
                  {card.icon}
                </div>
                <div style={{ position: 'absolute', top: 14, right: 14, width: D.dotSize, height: D.dotSize, borderRadius: '50%', backgroundColor: 'rgba(255,255,255,0.35)' }} />
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
