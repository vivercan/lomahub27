import { useState, useEffect, useCallback } from 'react'
import type { CSSProperties } from 'react'
import { useNavigate } from 'react-router-dom'
import { ModuleLayout } from '../layout/ModuleLayout'
import { supabase } from '../../lib/supabase'
import { tokens } from '../../lib/tokens'

/* ———————————————————————————————————————————————————————————————
   MODULE DASHBOARD GRID — DNA V3.7 (shared)
   Componente compartido: todos los dashboards de módulo lo usan para
   garantizar DNA visual + snapshot pattern idénticos.
   Cada dashboard solo declara sus CARDS[] y su módulo.
   ——————————————————————————————————————————————————————————————— */

export interface CardDef {
  id: string
  label: string
  route: string
  kpiLabel: string
  iconSet: string
  iconName: string
}

const D = {
  bg: '#E8EBF0',
  font: tokens.fonts.heading,
  fontBody: tokens.fonts.body,
} as const

/* ── Icon V3.3 — mask-image approach para 100% uniformidad monocroma ── */
const STROKE_SCALE = 0.75
const IcoCenter = ({ set, name, hovered }: { set: string; name: string; hovered?: boolean }) => {
  const [maskUrl, setMaskUrl] = useState(`https://api.iconify.design/${set}:${name}.svg`)
  useEffect(() => {
    const thinify = (raw: string) =>
      raw.replace(/stroke-width="([^"]+)"/g, (_, w) =>
        `stroke-width="${(parseFloat(w) * STROKE_SCALE).toFixed(2)}"`)
    fetch(`https://api.iconify.design/${set}:${name}.svg`)
      .then(r => r.text())
      .then(raw => setMaskUrl(`data:image/svg+xml,${encodeURIComponent(thinify(raw))}`))
      .catch(() => {})
  }, [set, name])
  return (
    <div
      style={{
        width: '58px',
        height: '58px',
        backgroundColor: hovered ? '#ff9940' : '#ffffff',
        WebkitMaskImage: `url("${maskUrl}")`,
        maskImage: `url("${maskUrl}")`,
        WebkitMaskRepeat: 'no-repeat',
        maskRepeat: 'no-repeat',
        WebkitMaskPosition: 'center',
        maskPosition: 'center',
        WebkitMaskSize: 'contain',
        maskSize: 'contain',
        opacity: hovered ? 0.95 : 0.88,
        filter: 'drop-shadow(0 1px 2px rgba(0,0,0,0.35))',
        transition: 'opacity 0.3s ease, background-color 0.3s ease',
      }}
    />
  )
}

/* ── Sweep params 100% aleatorios (V3.2) ── */
type SweepParams = {
  angleRad: number
  duration: number
  skew: number
  peakAlpha: number
  peripheryAlpha: number
  beamWidth: number
  travelDistance: number
}
function randomSweepParams(): SweepParams {
  return {
    angleRad: Math.random() * Math.PI * 2,
    duration: 9 + Math.random() * 4,
    skew: (Math.random() - 0.5) * 50,
    peakAlpha: 0.06 + Math.random() * 0.06,
    peripheryAlpha: 0.02 + Math.random() * 0.03,
    beamWidth: 14 + Math.random() * 14,
    travelDistance: 280 + Math.random() * 80,
  }
}
function sweepStyleFromParams(p: SweepParams): CSSProperties {
  const cosA = Math.cos(p.angleRad)
  const sinA = Math.sin(p.angleRad)
  const half = p.travelDistance / 2
  const startX = -cosA * half
  const startY = -sinA * half
  const endX = cosA * half
  const endY = sinA * half
  const gradientAngle = ((p.angleRad * 180 / Math.PI) + 90) % 360
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
    top: '-50%', bottom: '-50%', left: '-50%', right: '-50%',
    background: `linear-gradient(${gradientAngle}deg, transparent ${s1}%, rgba(255,255,255,${peri}) ${s2}%, rgba(255,255,255,${peak}) 50%, rgba(255,255,255,${peri}) ${s3}%, transparent ${s4}%)`,
    transform: `translate(var(--sx), var(--sy)) rotate(var(--rot))`,
    pointerEvents: 'none',
    zIndex: 1,
    opacity: 0,
  }
}

interface Props {
  titulo: string
  modulo: string        // key usado para leer kpis_snapshot.modulo
  cards: CardDef[]
  fallbackFetch?: () => Promise<Record<string, number>>  // opcional, si snapshot no existe
}

export function ModuleDashboardGrid({ titulo, modulo, cards, fallbackFetch }: Props) {
  const navigate = useNavigate()
  const [hovered, setHovered] = useState<string | null>(null)
  const [pressed, setPressed] = useState<string | null>(null)
  const [kpis, setKpis] = useState<Record<string, number>>(() => {
    const init: Record<string, number> = {}
    cards.forEach(c => { init[c.id] = 0 })
    return init
  })
  const [loading, setLoading] = useState(true)
  const [sweepMap] = useState<Record<string, SweepParams>>(() => {
    const map: Record<string, SweepParams> = {}
    cards.forEach(c => { map[c.id] = randomSweepParams() })
    return map
  })

  const fetchKpis = useCallback(async () => {
    try {
      // 1) Snapshot first — instant
      const { data, error } = await supabase
        .from('kpis_snapshot')
        .select('data')
        .eq('modulo', modulo)
        .maybeSingle()
      if (!error && data?.data) {
        const d = data.data as Record<string, number>
        const merged: Record<string, number> = {}
        cards.forEach(c => { merged[c.id] = d[c.id] ?? 0 })
        setKpis(merged)
        setLoading(false)
        return
      }
      // 2) Fallback
      if (fallbackFetch) {
        const direct = await fallbackFetch()
        setKpis(direct)
      }
    } catch (e) {
      console.error(`[${modulo}] KPI fetch error:`, e)
    } finally {
      setLoading(false)
    }
  }, [modulo, cards, fallbackFetch])

  useEffect(() => { fetchKpis() }, [fetchKpis])

  return (
    <ModuleLayout titulo={titulo}>
      <style>{`
        @keyframes csSweepRand {
          0%   { transform: translate(var(--sx), var(--sy)) rotate(var(--rot)); opacity: 0; }
          2%   { opacity: 1; }
          97%  { opacity: 1; }
          100% { transform: translate(var(--ex), var(--ey)) rotate(var(--rot)); opacity: 0; }
        }
        .cs-card:hover .cs-sweep {
          animation: csSweepRand var(--dur) cubic-bezier(0.4,0,0.6,1) forwards;
        }
      `}</style>
      <div style={{ background: D.bg, minHeight: 'calc(100vh - 120px)', padding: '32px 40px' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '20px', justifyContent: 'start' }}>
          {cards.map(card => {
            const isH = hovered === card.id
            const isP = pressed === card.id
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
                  padding: '18px 20px',
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
                  transform: isP
                    ? 'translateY(9px) scale(0.92)'
                    : isH
                    ? 'translateY(-7px) scale(1.03)'
                    : 'translateY(0)',
                  outline: isH
                    ? '1px solid rgba(255,255,255,0.28)'
                    : '1px solid rgba(255,255,255,0.18)',
                  outlineOffset: '-1px',
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
                {/* Top shine */}
                <div style={{
                  position: 'absolute', top: 0, left: 0, right: 0, height: '60%',
                  background: 'linear-gradient(180deg, rgba(255,255,255,0.14) 0%, rgba(255,255,255,0.04) 30%, rgba(255,255,255,0.01) 60%, transparent 100%)',
                  borderTopLeftRadius: '10px', borderTopRightRadius: '10px',
                  pointerEvents: 'none', opacity: isH ? 0.95 : 0.80,
                  transition: 'opacity 0.3s ease',
                  zIndex: 0,
                }} />
                {/* Infladito colchón */}
                <div style={{
                  position: 'absolute', inset: 0,
                  background: 'radial-gradient(ellipse 80% 65% at 50% 40%, rgba(255,255,255,0.14) 0%, rgba(255,255,255,0.05) 35%, rgba(0,0,0,0.20) 78%, rgba(0,0,0,0.32) 100%)',
                  pointerEvents: 'none',
                  borderRadius: 'inherit',
                  opacity: isH ? 0.75 : 1,
                  transition: 'opacity 0.3s ease',
                  zIndex: 0,
                }} />
                {/* Ráfaga random */}
                <div className="cs-sweep" style={sweepStyleFromParams(sweepMap[card.id])} />
                {/* Título HERO */}
                <div style={{
                  fontFamily: D.font, fontSize: '28px', fontWeight: 600,
                  color: isH ? 'rgba(255,255,255,1)' : 'rgba(255,255,255,0.95)',
                  textAlign: 'center', position: 'relative', zIndex: 2, letterSpacing: '0.005em',
                  lineHeight: 1.1,
                  whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
                  maxWidth: '100%',
                  transition: 'color 0.3s ease',
                }}>
                  {card.label}
                </div>
                {/* Icono */}
                <div style={{ position: 'relative', zIndex: 2, transition: 'transform 0.3s ease', transform: isH ? 'scale(1.08)' : 'none' }}>
                  <IcoCenter set={card.iconSet} name={card.iconName} hovered={isH} />
                </div>
                {/* KPI + sublabel */}
                <div style={{ textAlign: 'center', position: 'relative', zIndex: 2 }}>
                  <div style={{
                    fontFamily: D.font, fontSize: '20px', fontWeight: 600,
                    color: isH ? 'rgba(240,160,80,1)' : 'rgba(255,255,255,0.98)',
                    lineHeight: 1, letterSpacing: '-0.01em',
                    fontVariantNumeric: 'tabular-nums',
                    transition: 'color 0.3s ease',
                  }}>
                    {loading ? '—' : (kpis[card.id] ?? 0).toLocaleString()}
                  </div>
                  <div style={{
                    fontFamily: D.font, fontSize: '10px', fontWeight: 500,
                    color: 'rgba(255,255,255,0.45)', marginTop: 5, letterSpacing: '0.08em',
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
