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
  subSize: '9px',
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

const ICO_OPACITY = 0.20
const SW = 0.8  // ultra-thin stroke

/* Shared wrapper for all icons */
const IcoWrap = ({ children }: { children: React.ReactNode }) => (
  <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none', opacity: ICO_OPACITY }}>
    <svg viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,1)" strokeWidth={SW} strokeLinecap="round" strokeLinejoin="round"
      style={{ position: 'absolute', right: '-2%', bottom: '-2%', width: '70%', height: '70%' }}>
      {children}
    </svg>
  </div>
)

/* Tickets → Headset / soporte al cliente */
const IconTickets = () => (
  <IcoWrap>
    <path d="M4 15v-3a8 8 0 0 1 16 0v3" />
    <path d="M2 15.5a1.5 1.5 0 0 1 1.5-1.5H5v5H3.5A1.5 1.5 0 0 1 2 17.5v-2z" />
    <path d="M22 15.5a1.5 1.5 0 0 0-1.5-1.5H19v5h1.5a1.5 1.5 0 0 0 1.5-1.5v-2z" />
    <path d="M19 19v1a2 2 0 0 1-2 2h-4" />
    <circle cx="12" cy="22" r="1" />
  </IcoWrap>
)

/* Clientes Activos → Grupo elegante con nodo de red */
const IconClientes = () => (
  <IcoWrap>
    <circle cx="12" cy="7" r="3" />
    <path d="M5 21v-1.5a4.5 4.5 0 0 1 4.5-4.5h5a4.5 4.5 0 0 1 4.5 4.5V21" />
    <circle cx="5" cy="9" r="2" />
    <path d="M5 13c-2 0-3.5 1.2-3.5 3v1" />
    <circle cx="19" cy="9" r="2" />
    <path d="M19 13c2 0 3.5 1.2 3.5 3v1" />
  </IcoWrap>
)

/* Importación → flecha arriba + contenedor */
const IconImpo = () => (
  <IcoWrap>
    <path d="M3 15v4a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-4" />
    <polyline points="8,8 12,3 16,8" />
    <line x1="12" y1="3" x2="12" y2="16" />
  </IcoWrap>
)

/* Exportación → flecha abajo + contenedor */
const IconExpo = () => (
  <IcoWrap>
    <path d="M3 15v4a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-4" />
    <polyline points="8,10 12,16 16,10" />
    <line x1="12" y1="2" x2="12" y2="16" />
  </IcoWrap>
)

/* Despacho IA → Camión con cerebro/circuito IA */
const IconDespachoIA = () => (
  <IcoWrap>
    {/* Camión body */}
    <rect x="1" y="12" width="14" height="7" rx="1" />
    <path d="M15 15h4l2 2v2h-6v-4z" />
    <circle cx="6" cy="21" r="1.5" />
    <circle cx="18" cy="21" r="1.5" />
    {/* Cerebro IA — nodos + conexiones arriba del camión */}
    <circle cx="5" cy="6" r="1.2" />
    <circle cx="11" cy="4" r="1.2" />
    <circle cx="8" cy="9" r="1.2" />
    <line x1="5" y1="6" x2="11" y2="4" />
    <line x1="5" y1="6" x2="8" y2="9" />
    <line x1="11" y1="4" x2="8" y2="9" />
    <circle cx="14" cy="7" r="0.8" />
    <line x1="11" y1="4" x2="14" y2="7" />
    <line x1="8" y1="9" x2="14" y2="7" />
  </IcoWrap>
)

/* Métricas → Speedometer / gauge elegante */
const IconMetricas = () => (
  <IcoWrap>
    {/* Arco de gauge */}
    <path d="M4.93 4.93A10 10 0 0 1 12 2a10 10 0 0 1 7.07 2.93" />
    <path d="M2 12a10 10 0 0 0 2.93 7.07" />
    <path d="M22 12a10 10 0 0 1-2.93 7.07" />
    {/* Aguja apuntando arriba-derecha (buen rendimiento) */}
    <line x1="12" y1="12" x2="16.5" y2="6" />
    <circle cx="12" cy="12" r="1.5" />
    {/* Marcas de escala */}
    <line x1="12" y1="2.5" x2="12" y2="4" />
    <line x1="4.5" y1="12" x2="3" y2="12" />
    <line x1="21" y1="12" x2="19.5" y2="12" />
    {/* Línea base */}
    <line x1="5" y1="20" x2="19" y2="20" />
  </IcoWrap>
)

/* Actividades → Clipboard con checks */
const IconActividades = () => (
  <IcoWrap>
    <rect x="4" y="3" width="16" height="18" rx="2" />
    <path d="M9 1h6v3a1 1 0 0 1-1 1h-4a1 1 0 0 1-1-1V1z" />
    <path d="M8 10l2 2 4-4" />
    <line x1="8" y1="16" x2="16" y2="16" />
  </IcoWrap>
)

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
