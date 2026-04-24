import { useState, useEffect, useCallback } from 'react'
import type { CSSProperties } from 'react'
import { useNavigate } from 'react-router-dom'
import { ModuleLayout } from '../../components/layout/ModuleLayout'
import { supabase } from '../../lib/supabase'
import { tokens } from '../../lib/tokens'
/* ———————————————————————————————————————————————————————————————
SERVICIO A CLIENTES — Landing Page V3.1
V3.1 ajustes JJ 23/Abr:
  Título 17→26px, icono 79→54px, padding vertical 24→28px
  — iconos respiran (~44px aire arriba/abajo), títulos más presentes
  — whiteSpace nowrap + ellipsis para safety (no se salen del card)
V3.0 ajustes JJ 23/Abr:
  (I) Sweep 50% más rápido — duración base 11s (±2s variación aleatoria, 9-13s)
  (II) Sweep params 100% random por card: dirección (0-360°) + skew (±25°)
       + alpha (0.08-0.18) + ancho (32-55%) + travel (280-360%)
       = efectivamente infinitas variaciones, cada refresh reordena
  (III) Hover card scale(1.03) + translateY(-7px) + icono scale(1.08)
        — sensación de "agrandarse al pasar" mucho más marcada
V2.9 ajuste JJ 23/Abr:
  aspectRatio 1/0.612 (−20% altura desde V2.8 0.765)
V2.8 ajustes JJ 23/Abr:
  (A) aspectRatio 1/0.765 (ajuste +25% menos reducido vs V2.7 0.72 — compromise)
  (B) sweep 50% más tenue (alpha pico 0.28→0.14 y periferia 0.10→0.05)
  (C) sweep 6 direcciones aleatorias por card: LR, RL, TB, BT, DNE, DNW
      — asignación random al mount (useState init), duración 16.5s preservada
  (D) Grid fijo 5 cols: 2-3 cards se quedan a la izquierda, mismo tamaño
Base V2.3 preservada + enhancements V2.4-V2.6:
  (1) Pressed apachurrable (scale 0.92 + translateY 9px + cavity 0.85)
  (2) "Infladito colchón": radial-gradient overlay + inset ambient edge-darken
  (3) Ráfaga de luz al hover (single-pass via CSS @keyframes)
  (4) Grid 5 columnas (fila 1: 5 cards; fila 2: 2 cards mismo tamaño)
Preservado: Iconify icons + double-gradient border + amber hover glow + outline.
—————————————————————————————————————————————————————————————— */
const D = {
  bg: '#E8EBF0',
  font: tokens.fonts.heading,
  fontBody: tokens.fonts.body,
} as const
const AMBER = '255,120,0'
/* ── Icon component — centered, prominent, thin-stroke ── */
const STROKE_SCALE = 0.75
const IcoCenter = ({ set, name, hovered }: { set: string; name: string; hovered?: boolean }) => {
  const [srcWhite, setSrcWhite] = useState(`https://api.iconify.design/${set}:${name}.svg?color=%23ffffff`)
  const [srcOrange, setSrcOrange] = useState(`https://api.iconify.design/${set}:${name}.svg?color=%23ff7800`)
  useEffect(() => {
    const thinify = (raw: string) =>
      raw.replace(/stroke-width="([^"]+)"/g, (_, w) =>
        `stroke-width="${(parseFloat(w) * STROKE_SCALE).toFixed(2)}"`)
    fetch(`https://api.iconify.design/${set}:${name}.svg?color=%23ffffff`)
      .then(r => r.text())
      .then(raw => setSrcWhite(`data:image/svg+xml,${encodeURIComponent(thinify(raw))}`))
      .catch(() => {})
    fetch(`https://api.iconify.design/${set}:${name}.svg?color=%23ff9940`)
      .then(r => r.text())
      .then(raw => setSrcOrange(`data:image/svg+xml,${encodeURIComponent(thinify(raw))}`))
      .catch(() => {})
  }, [set, name])
  return (
    <img src={hovered ? srcOrange : srcWhite} alt=""
      style={{ width: '54px', height: '54px', opacity: hovered ? 0.55 : 0.90, filter: 'drop-shadow(0 1px 2px rgba(0,0,0,0.3))', transition: 'opacity 0.3s ease' }} />
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
/* ── V3.0 — Sweep params 100% aleatorios (efectivamente infinitas variaciones) ── */
type SweepParams = {
  angleRad: number      // dirección del movimiento 0-2π
  duration: number      // 9-13s (50% más rápido vs V2.9 16.5s; avg 11s)
  skew: number          // -25 a +25 deg
  peakAlpha: number     // 0.08-0.18
  peripheryAlpha: number // 0.03-0.08
  beamWidth: number     // 32-55%
  travelDistance: number // 280-360% (cuánto recorre la ráfaga)
}
function randomSweepParams(): SweepParams {
  return {
    angleRad: Math.random() * Math.PI * 2,
    duration: 9 + Math.random() * 4,
    skew: (Math.random() - 0.5) * 50,
    peakAlpha: 0.08 + Math.random() * 0.10,
    peripheryAlpha: 0.03 + Math.random() * 0.05,
    beamWidth: 32 + Math.random() * 23,
    travelDistance: 280 + Math.random() * 80,
  }
}
function sweepStyleFromParams(p: SweepParams): CSSProperties {
  const cosA = Math.cos(p.angleRad)
  const sinA = Math.sin(p.angleRad)
  const half = p.travelDistance / 2
  const startX = -cosA * half
  const startY = -sinA * half
  const endX   =  cosA * half
  const endY   =  sinA * half
  /* Ángulo del gradient: perpendicular al movimiento para que el haz cruce la card */
  const gradientAngle = ((p.angleRad * 180 / Math.PI) + 90) % 360
  /* Beam thickness: beamWidth en % del div contenedor (32-55) — más ancho = más soft */
  const spread = p.beamWidth / 2
  const s1 = (50 - spread).toFixed(1)
  const s2 = (50 - spread / 2).toFixed(1)
  const s3 = (50 + spread / 2).toFixed(1)
  const s4 = (50 + spread).toFixed(1)
  const peri = p.peripheryAlpha.toFixed(3)
  const peak = p.peakAlpha.toFixed(3)
  return {
    ['--sx' as any]: `${startX}%`,
    ['--sy' as any]: `${startY}%`,
    ['--ex' as any]: `${endX}%`,
    ['--ey' as any]: `${endY}%`,
    ['--rot' as any]: `${p.skew}deg`,
    ['--dur' as any]: `${p.duration.toFixed(2)}s`,
    position: 'absolute',
    /* Oversized 200% × 200% (inset -50%) para que la rotación no deje huecos visibles */
    top: '-50%', bottom: '-50%', left: '-50%', right: '-50%',
    background: `linear-gradient(${gradientAngle}deg, transparent ${s1}%, rgba(255,255,255,${peri}) ${s2}%, rgba(255,255,255,${peak}) 50%, rgba(255,255,255,${peri}) ${s3}%, transparent ${s4}%)`,
    transform: `translate(var(--sx), var(--sy)) rotate(var(--rot))`,
    pointerEvents: 'none',
    zIndex: 1,
    opacity: 0,
  }
}
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
  const [pressed, setPressed] = useState<string | null>(null)
  const [kpis, setKpis] = useState<Record<string, number>>({ tickets: 0, clientes: 0, impo: 0, expo: 0, despacho_ia: 0, metricas: 0, actividades: 0 })
  const [loading, setLoading] = useState(true)
  /* V3.0 — Params aleatorios por card (dirección, duración, skew, alpha, ancho) — fijados al mount */
  const [sweepMap] = useState<Record<string, SweepParams>>(() => {
    const map: Record<string, SweepParams> = {}
    CARDS.forEach(c => { map[c.id] = randomSweepParams() })
    return map
  })
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
      {/* V3.0 — Keyframe único parametrizado con CSS vars (cada card trae sus propias vars) */}
      <style>{`
        @keyframes csSweepRand {
          0%   { transform: translate(var(--sx), var(--sy)) rotate(var(--rot)); opacity: 0; }
          10%  { opacity: 1; }
          90%  { opacity: 1; }
          100% { transform: translate(var(--ex), var(--ey)) rotate(var(--rot)); opacity: 0; }
        }
        .cs-card:hover .cs-sweep {
          animation: csSweepRand var(--dur) cubic-bezier(0.22,1,0.36,1) forwards;
        }
      `}</style>
      <div style={{ background: D.bg, minHeight: 'calc(100vh - 120px)', padding: '32px 40px' }}>
        {/* V2.8 — Grid 5 cols FIJO: si hay 2-3 cards mantienen 1/5 del ancho, alineados a la izquierda (como fila 2 de 2 cards) */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '20px', justifyContent: 'start' }}>
          {CARDS.map(card => {
            const isH = hovered === card.id
            const isP = pressed === card.id
            /* ── Double-layer gradient (V2.3 preserved) ── */
            const bgNormal =
              'linear-gradient(155deg, rgba(18,32,58,0.96) 0%, rgba(12,22,42,0.98) 35%, rgba(8,16,32,1) 70%, rgba(6,12,24,1) 100%), ' +
              'linear-gradient(135deg, rgba(180,100,50,0.28) 0%, rgba(60,90,140,0.25) 50%, rgba(180,100,50,0.28) 100%)'
            const bgHover =
              'linear-gradient(155deg, rgba(28,48,82,1) 0%, rgba(20,35,62,1) 35%, rgba(14,24,45,1) 70%, rgba(10,18,35,1) 100%), ' +
              'linear-gradient(135deg, rgba(240,160,80,0.65) 0%, rgba(220,140,70,0.6) 25%, rgba(70,110,170,0.4) 50%, rgba(220,140,70,0.6) 75%, rgba(240,160,80,0.65) 100%)'
            return (
              <div
                key={card.id}
                className="cs-card"
                style={{
                  aspectRatio: '1 / 0.612',
                  borderRadius: '10px',
                  padding: '28px 20px',
                  backgroundImage: isH ? bgHover : bgNormal,
                  backgroundOrigin: 'border-box',
                  backgroundClip: 'padding-box, border-box',
                  border: '2px solid transparent',
                  cursor: 'pointer',
                  position: 'relative',
                  overflow: 'hidden',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  gap: '0px',
                  transition: isP
                    ? 'transform 0.08s cubic-bezier(0.4,0,0.6,1), box-shadow 0.08s ease'
                    : 'transform 0.24s cubic-bezier(0.22,1,0.36,1), box-shadow 0.3s ease, outline 0.18s ease',
                  /* V3.0 — pressed + hover ahora CON scale(1.03) para sensación de "agrandarse" */
                  transform: isP
                    ? 'translateY(9px) scale(0.92)'
                    : isH
                    ? 'translateY(-7px) scale(1.03)'
                    : 'translateY(0)',
                  /* V2.3 outline rim blanco */
                  outline: isH
                    ? '1px solid rgba(255,255,255,0.28)'
                    : '1px solid rgba(255,255,255,0.18)',
                  outlineOffset: '-1px',
                  /* V2.5 FIX — pressed cavity extrema 0.85 + infladito edge-darken 80px ambient */
                  boxShadow: isP
                    ? 'inset 0 8px 24px rgba(0,0,0,0.85), inset 0 3px 10px rgba(0,0,0,0.58), inset 0 -1px 0 rgba(255,255,255,0.04), inset 2px 0 0 rgba(0,0,0,0.36), inset -2px 0 0 rgba(0,0,0,0.36), 0 0 0 rgba(0,0,0,0), 0 1px 2px rgba(0,0,0,0.30)'
                    : isH
                    ? 'inset 1px 0 0 rgba(255,255,255,0.20), inset -1px 0 0 rgba(255,255,255,0.14), inset 0 4px 0 rgba(255,255,255,0.58), inset 0 -4px 0 rgba(0,0,0,0.50), inset 0 -30px 52px rgba(0,0,0,0.30), inset 0 0 90px rgba(0,0,0,0.32), 0 8px 14px rgba(0,0,0,0.30), 0 30px 52px rgba(0,0,0,0.44), 0 60px 92px -12px rgba(0,0,0,0.52), 0 0 40px rgba(240,160,80,0.30)'
                    : 'inset 1px 0 0 rgba(255,255,255,0.18), inset -1px 0 0 rgba(255,255,255,0.12), inset 0 4px 0 rgba(255,255,255,0.50), inset 0 -4px 0 rgba(0,0,0,0.46), inset 0 -26px 46px rgba(0,0,0,0.26), inset 0 0 80px rgba(0,0,0,0.28), 0 4px 8px rgba(0,0,0,0.24), 0 22px 36px rgba(0,0,0,0.36), 0 44px 70px -8px rgba(0,0,0,0.44), 0 72px 100px -14px rgba(0,0,0,0.38)',
                  fontFamily: D.font,
                }}
                onMouseEnter={() => setHovered(card.id)}
                onMouseLeave={() => { setHovered(null); setPressed(null) }}
                onMouseDown={() => setPressed(card.id)}
                onMouseUp={() => setPressed(null)}
                onClick={() => navigate(card.route)}
              >
                {/* V2.3 — Top shine soft (blend progresivo 60%) */}
                <div style={{
                  position: 'absolute', top: 0, left: 0, right: 0, height: '60%',
                  background: 'linear-gradient(180deg, rgba(255,255,255,0.14) 0%, rgba(255,255,255,0.04) 30%, rgba(255,255,255,0.01) 60%, transparent 100%)',
                  borderTopLeftRadius: '10px', borderTopRightRadius: '10px',
                  pointerEvents: 'none', opacity: isH ? 0.95 : 0.80,
                  transition: 'opacity 0.3s ease',
                  zIndex: 0,
                }} />

                {/* V2.5 FIX 2 — "Infladito colchón" REFORZADO: centro bright 0.14 → edges dark 0.32 */}
                <div style={{
                  position: 'absolute', inset: 0,
                  background: 'radial-gradient(ellipse 80% 65% at 50% 40%, rgba(255,255,255,0.14) 0%, rgba(255,255,255,0.05) 35%, rgba(0,0,0,0.20) 78%, rgba(0,0,0,0.32) 100%)',
                  pointerEvents: 'none',
                  borderRadius: 'inherit',
                  opacity: isH ? 0.75 : 1,
                  transition: 'opacity 0.3s ease',
                  zIndex: 0,
                }} />

                {/* V3.0 — Ráfaga con parámetros 100% aleatorios por card (dirección/duración/skew/alpha) */}
                <div
                  className="cs-sweep"
                  style={sweepStyleFromParams(sweepMap[card.id])}
                />

                {/* Label — TOP (V3.1: 26px, tamaño máximo que cabe sin overflow) */}
                <div style={{
                  fontFamily: D.font, fontSize: '26px', fontWeight: 600, color: '#ffffff',
                  textAlign: 'center', position: 'relative', zIndex: 2, letterSpacing: '0.01em',
                  lineHeight: 1.15, paddingTop: '2px',
                  whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
                  maxWidth: '100%',
                }}>
                  {card.label}
                </div>

                {/* Icon — centered */}
                <div style={{ position: 'relative', zIndex: 2, transition: 'transform 0.3s ease', transform: isH ? 'scale(1.08)' : 'none' }}>
                  <IcoCenter set={card.iconSet} name={card.iconName} hovered={isH} />
                </div>

                {/* KPI + sublabel */}
                <div style={{ textAlign: 'center', position: 'relative', zIndex: 2 }}>
                  <div style={{
                    fontFamily: D.font, fontSize: '22px', fontWeight: 600,
                    color: isH ? 'rgba(240,160,80,1)' : 'rgba(255,255,255,0.95)',
                    lineHeight: 1, transition: 'color 0.3s ease',
                  }}>
                    {loading ? '—' : (kpis[card.id] ?? 0).toLocaleString()}
                  </div>
                  <div style={{
                    fontFamily: D.font, fontSize: '10px', fontWeight: 500,
                    color: 'rgba(255,255,255,0.50)', marginTop: 3, letterSpacing: '0.03em',
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
