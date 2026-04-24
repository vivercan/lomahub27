import { useState, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { ModuleLayout } from '../../components/layout/ModuleLayout'
import { supabase } from '../../lib/supabase'
import { tokens } from '../../lib/tokens'
import {
  Ticket, Users, CloudDownload, CloudUpload,
  Cpu, LineChart, ListChecks,
} from 'lucide-react'

/* ———————————————————————————————————————————————————————————————
   SERVICIO A CLIENTES — Card block V3
   Full premium redesign — AAA enterprise executive discipline
   • Lucide consistent outline icon family
   • Tier hierarchy (primary / secondary / support) via material + shadow
   • Layered premium shadows (14px + 4px base per spec)
   • Deep navy palette with restrained tonal gradients
   • Typography hierarchy: label → icon → KPI → sublabel
   • Premium status dot + subtle inner top highlight
   • Refined hover lift (transform + shadow)
   • ModuleLayout header + back button preserved intactos
   • Lower reserved area intocada
——————————————————————————————————————————————————————————————— */

const D = {
  bg: '#E8EBF0',
  font: tokens.fonts.heading,
  fontBody: tokens.fonts.body,
} as const

type Tier = 'primary' | 'secondary' | 'support'

interface CardDef {
  id: string
  label: string
  route: string
  kpiLabel: string
  Icon: typeof Ticket
  tier: Tier
}

const CARDS: CardDef[] = [
  { id: 'tickets',      label: 'Tickets',           route: '/servicio/tickets',          kpiLabel: 'Activos',             Icon: Ticket,         tier: 'primary'   },
  { id: 'clientes',     label: 'Clientes Activos',  route: '/clientes/corporativos',     kpiLabel: 'Clientes',            Icon: Users,          tier: 'secondary' },
  { id: 'impo',         label: 'Importación',       route: '/servicio/importacion',      kpiLabel: 'Viajes IMPO · 30 D',  Icon: CloudDownload,  tier: 'support'   },
  { id: 'expo',         label: 'Exportación',       route: '/servicio/exportacion',      kpiLabel: 'Viajes EXPO · 30 D',  Icon: CloudUpload,    tier: 'support'   },
  { id: 'despacho_ia',  label: 'Despacho IA',       route: '/operaciones/torre-control', kpiLabel: 'Viajes activos',      Icon: Cpu,            tier: 'secondary' },
  { id: 'metricas',     label: 'Métricas Servicio', route: '/servicio/metricas',         kpiLabel: 'Dashboard',           Icon: LineChart,      tier: 'primary'   },
  { id: 'actividades',  label: 'Actividades',       route: '/actividades',               kpiLabel: 'Pendientes',          Icon: ListChecks,     tier: 'secondary' },
]

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

/* Material por tier — primary más rico, support más restrained */
const tierBG = (tier: Tier) => {
  switch (tier) {
    case 'primary':
      return 'linear-gradient(155deg, #112245 0%, #0B1835 55%, #070F22 100%)'
    case 'secondary':
      return 'linear-gradient(155deg, #152A57 0%, #0E1F44 55%, #08132E 100%)'
    case 'support':
      return 'linear-gradient(155deg, #1A3163 0%, #122750 55%, #0B1A38 100%)'
  }
}

const tierShadow = (tier: Tier, isH: boolean, isP: boolean) => {
  if (isP) {
    return '0 2px 6px rgba(8,20,45,0.22), inset 0 2px 8px rgba(0,0,0,0.28), inset 0 1px 0 rgba(255,255,255,0.06)'
  }
  if (isH) {
    if (tier === 'primary') {
      return '0 26px 52px rgba(8,20,45,0.36), 0 10px 20px rgba(8,20,45,0.20), inset 0 1px 0 rgba(255,255,255,0.12)'
    }
    if (tier === 'secondary') {
      return '0 22px 44px rgba(8,20,45,0.30), 0 8px 16px rgba(8,20,45,0.16), inset 0 1px 0 rgba(255,255,255,0.11)'
    }
    return '0 18px 36px rgba(8,20,45,0.24), 0 6px 12px rgba(8,20,45,0.12), inset 0 1px 0 rgba(255,255,255,0.09)'
  }
  // resting
  if (tier === 'primary') {
    return '0 18px 40px rgba(8,20,45,0.28), 0 6px 14px rgba(8,20,45,0.16), inset 0 1px 0 rgba(255,255,255,0.10)'
  }
  if (tier === 'secondary') {
    return '0 14px 34px rgba(8,20,45,0.22), 0 4px 10px rgba(8,20,45,0.12), inset 0 1px 0 rgba(255,255,255,0.09)'
  }
  return '0 10px 26px rgba(8,20,45,0.16), 0 3px 8px rgba(8,20,45,0.08), inset 0 1px 0 rgba(255,255,255,0.08)'
}

export default function DashboardCS() {
  const navigate = useNavigate()
  const [hovered, setHovered] = useState<string | null>(null)
  const [pressed, setPressed] = useState<string | null>(null)
  const [kpis, setKpis] = useState<Record<string, number>>({ tickets: 0, clientes: 0, impo: 0, expo: 0, despacho_ia: 0, metricas: 0, actividades: 0 })
  const [loading, setLoading] = useState(true)

  const fetchKpis = useCallback(async () => {
    try {
      const [tix, cli, act, viajesActivos] = await Promise.all([
        supabase.from('tickets').select('*', { count: 'exact', head: true }).is('deleted_at', null).in('estado', ['abierto', 'en_proceso']),
        supabase.from('clientes').select('*', { count: 'exact', head: true }).is('deleted_at', null),
        supabase.from('actividades').select('*', { count: 'exact', head: true }).eq('estado', 'pendiente'),
        supabase.from('viajes').select('*', { count: 'exact', head: true }).in('estado', ['en_transito', 'programado', 'en_riesgo']),
      ])
      const [impoCount, expoCount] = await Promise.all([
        countViajesAnodosByTipo(3),
        countViajesAnodosByTipo(2),
      ])
      setKpis({
        tickets: tix.count ?? 0,
        clientes: cli.count ?? 0,
        impo: impoCount,
        expo: expoCount,
        despacho_ia: viajesActivos.count ?? 0,
        metricas: tix.count ?? 0,
        actividades: act.count ?? 0,
      })
    } catch (e) { console.error('KPI fetch error:', e) }
    finally { setLoading(false) }
  }, [])

  useEffect(() => { fetchKpis() }, [fetchKpis])

  return (
    <ModuleLayout titulo="Servicio a Clientes">
      <div style={{
        background: 'linear-gradient(180deg, #EBEEF3 0%, #E3E7EE 55%, #DADFE7 100%)',
        minHeight: 'calc(100vh - 120px)',
        padding: '28px 32px',
        fontFamily: D.font,
      }}>
        {/* Card block — refined 7-card grid */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(7, 1fr)',
          gap: '16px',
          maxWidth: '100%',
        }}>
          {CARDS.map(card => {
            const { Icon } = card
            const isH = hovered === card.id
            const isP = pressed === card.id
            const kpiValue = kpis[card.id] ?? 0
            const iconSize = card.tier === 'primary' ? 32 : card.tier === 'secondary' ? 30 : 28
            const kpiSize = card.tier === 'primary' ? '28px' : card.tier === 'secondary' ? '26px' : '24px'
            const labelWeight = card.tier === 'primary' ? 700 : 600
            const iconOpacity = isH ? 0.92 : 0.78

            return (
              <div
                key={card.id}
                onMouseEnter={() => setHovered(card.id)}
                onMouseLeave={() => { setHovered(null); setPressed(null) }}
                onMouseDown={() => setPressed(card.id)}
                onMouseUp={() => setPressed(null)}
                onClick={() => navigate(card.route)}
                style={{
                  aspectRatio: '1 / 1.12',
                  borderRadius: '20px',
                  padding: '16px 16px 18px',
                  background: tierBG(card.tier),
                  border: `1px solid ${isH ? 'rgba(255,255,255,0.16)' : 'rgba(255,255,255,0.11)'}`,
                  boxShadow: tierShadow(card.tier, isH, isP),
                  cursor: 'pointer',
                  position: 'relative',
                  overflow: 'hidden',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between',
                  transition: 'transform 0.26s cubic-bezier(0.22,1,0.36,1), box-shadow 0.26s ease, border-color 0.26s ease',
                  transform: isP
                    ? 'translateY(1px) scale(0.992)'
                    : isH
                    ? 'translateY(-3px)'
                    : 'translateY(0)',
                }}
              >
                {/* Top subtle inner highlight — premium material */}
                <div style={{
                  position: 'absolute',
                  top: 0, left: 0, right: 0, height: '45%',
                  background: 'linear-gradient(180deg, rgba(255,255,255,0.06) 0%, rgba(255,255,255,0.015) 50%, rgba(255,255,255,0) 100%)',
                  borderTopLeftRadius: '20px',
                  borderTopRightRadius: '20px',
                  pointerEvents: 'none',
                  opacity: isH ? 1 : 0.88,
                  transition: 'opacity 0.26s ease',
                }} />

                {/* Status dot top-right — refined premium */}
                <div style={{
                  position: 'absolute',
                  top: 12, right: 12,
                  width: 6, height: 6,
                  borderRadius: '50%',
                  background: 'radial-gradient(circle at 35% 30%, #2DD4BF 0%, #10B981 65%, #065F46 100%)',
                  boxShadow: '0 0 0 1px rgba(255,255,255,0.10), 0 0 5px rgba(16,185,129,0.36)',
                  zIndex: 2,
                }} />

                {/* Label top-left */}
                <div style={{
                  fontFamily: D.font,
                  fontSize: '13px',
                  fontWeight: labelWeight,
                  color: 'rgba(255,255,255,0.96)',
                  letterSpacing: '-0.004em',
                  lineHeight: 1.18,
                  position: 'relative',
                  zIndex: 1,
                  paddingRight: '14px',
                  minHeight: '32px',
                }}>
                  {card.label}
                </div>

                {/* Icon center */}
                <div style={{
                  position: 'relative',
                  zIndex: 1,
                  display: 'flex',
                  justifyContent: 'center',
                  alignItems: 'center',
                  flex: '1',
                  paddingTop: '4px',
                  paddingBottom: '4px',
                  transition: 'opacity 0.26s ease',
                }}>
                  <Icon
                    size={iconSize}
                    strokeWidth={1.5}
                    color={`rgba(255,255,255,${iconOpacity})`}
                    style={{
                      filter: 'drop-shadow(0 1px 2px rgba(0,0,0,0.22))',
                      transition: 'color 0.26s ease',
                    }}
                  />
                </div>

                {/* KPI + sublabel bottom */}
                <div style={{ textAlign: 'left', position: 'relative', zIndex: 1 }}>
                  <div style={{
                    fontFamily: D.font,
                    fontSize: kpiSize,
                    fontWeight: 700,
                    color: 'rgba(255,255,255,0.98)',
                    letterSpacing: '-0.022em',
                    lineHeight: 1,
                    marginBottom: 5,
                  }}>
                    {loading ? '—' : kpiValue.toLocaleString()}
                  </div>
                  <div style={{
                    fontFamily: D.font,
                    fontSize: '9.5px',
                    fontWeight: 600,
                    color: 'rgba(170,190,220,0.60)',
                    letterSpacing: '0.09em',
                    textTransform: 'uppercase',
                    whiteSpace: 'nowrap',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
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
