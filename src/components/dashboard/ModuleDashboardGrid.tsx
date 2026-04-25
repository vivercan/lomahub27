import { useState, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { ModuleLayout } from '../layout/ModuleLayout'
import { supabase } from '../../lib/supabase'
import { tokens } from '../../lib/tokens'

/* ———————————————————————————————————————————————————————————————
   MODULE DASHBOARD GRID — DNA V4.0 (Catálogos pattern, 25/Abr/2026)
   Card rectangular horizontal, icono glassmórfico arriba-izq,
   KPI compacto arriba-der, título + subtítulo abajo.
   Patrón único para TODOS los sub-dashboards (excepto HomeDashboard).
   ——————————————————————————————————————————————————————————————— */

export interface CardDef {
  id: string
  label: string
  route: string
  kpiLabel: string
  iconSet: string
  iconName: string
  subtitle?: string  // descripción corta opcional (fallback: kpiLabel)
}

const D = {
  bg: '#E8EBF0',
  font: tokens.fonts.heading,
  fontBody: tokens.fonts.body,
} as const

/* ── Icon V4.0 — mask-image, tamaño Catálogos (22px en caja 40x40) ── */
const STROKE_SCALE = 0.85
const IcoBox = ({ set, name, hovered }: { set: string; name: string; hovered?: boolean }) => {
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
        background: 'rgba(255,255,255,0.08)',
        borderRadius: 10,
        padding: 9,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        border: '1px solid rgba(255,255,255,0.10)',
        width: 40,
        height: 40,
        boxSizing: 'border-box',
        flexShrink: 0,
      }}
    >
      <div
        style={{
          width: 22,
          height: 22,
          backgroundColor: hovered ? 'rgba(240,160,80,1)' : 'rgba(255,255,255,0.9)',
          WebkitMaskImage: `url("${maskUrl}")`,
          maskImage: `url("${maskUrl}")`,
          WebkitMaskRepeat: 'no-repeat',
          maskRepeat: 'no-repeat',
          WebkitMaskPosition: 'center',
          maskPosition: 'center',
          WebkitMaskSize: 'contain',
          maskSize: 'contain',
          transition: 'background-color 0.3s ease',
        }}
      />
    </div>
  )
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
  const [kpis, setKpis] = useState<Record<string, number>>(() => {
    const init: Record<string, number> = {}
    cards.forEach(c => { init[c.id] = 0 })
    return init
  })
  const [loading, setLoading] = useState(true)

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
      <div style={{ background: D.bg, minHeight: 'calc(100vh - 120px)', padding: '32px 40px' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 20 }}>
          {cards.map(card => {
            const isH = hovered === card.id
            const bgNormal =
              'linear-gradient(155deg, rgba(18,32,58,0.96) 0%, rgba(12,22,42,0.98) 35%, rgba(8,16,32,1) 70%, rgba(6,12,24,1) 100%), ' +
              'linear-gradient(135deg, rgba(180,100,50,0.28) 0%, rgba(60,90,140,0.25) 50%, rgba(180,100,50,0.28) 100%)'
            const bgHover =
              'linear-gradient(155deg, rgba(28,48,82,1) 0%, rgba(20,35,62,1) 35%, rgba(14,24,45,1) 70%, rgba(10,18,35,1) 100%), ' +
              'linear-gradient(135deg, rgba(240,160,80,0.65) 0%, rgba(220,140,70,0.6) 25%, rgba(70,110,170,0.4) 50%, rgba(220,140,70,0.6) 75%, rgba(240,160,80,0.65) 100%)'
            return (
              <button
                key={card.id}
                onClick={() => navigate(card.route)}
                onMouseEnter={() => setHovered(card.id)}
                onMouseLeave={() => setHovered(null)}
                style={{
                  minHeight: 100,
                  borderRadius: 10,
                  padding: '14px 16px',
                  backgroundImage: isH ? bgHover : bgNormal,
                  backgroundOrigin: 'border-box',
                  backgroundClip: 'padding-box, border-box',
                  border: '2px solid transparent',
                  cursor: 'pointer',
                  textAlign: 'left',
                  position: 'relative',
                  overflow: 'hidden',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between',
                  gap: 12,
                  transition: 'all 0.3s ease',
                  transform: isH ? 'translateY(-4px)' : 'none',
                  boxShadow: isH
                    ? '0 4px 8px rgba(0,0,0,0.4), 0 10px 24px rgba(0,0,0,0.6), 0 0 30px rgba(240,160,80,0.15), inset 0 1px 0 rgba(255,255,255,0.05)'
                    : '0 2px 4px rgba(0,0,0,0.3), 0 6px 16px rgba(0,0,0,0.5), inset -2px -2px 4px rgba(0,0,0,0.2)',
                  fontFamily: D.font,
                }}
              >
                {/* Top shine */}
                <div style={{
                  position: 'absolute', top: 0, left: 0, right: 0, height: '45%',
                  background: 'linear-gradient(180deg, rgba(255,255,255,0.12) 0%, transparent 100%)',
                  borderTopLeftRadius: 10, borderTopRightRadius: 10,
                  pointerEvents: 'none', opacity: isH ? 0.5 : 0.3,
                  transition: 'opacity 0.3s ease',
                }} />

                {/* Top row: icono + KPI */}
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', position: 'relative', zIndex: 1 }}>
                  <IcoBox set={card.iconSet} name={card.iconName} hovered={isH} />
                  <span style={{
                    fontFamily: D.font,
                    fontSize: 26, fontWeight: 700,
                    color: isH ? 'rgba(240,160,80,1)' : 'rgba(255,255,255,0.95)',
                    transition: 'color 0.3s ease',
                    fontVariantNumeric: 'tabular-nums',
                  }}>
                    {loading ? '…' : (kpis[card.id] ?? 0).toLocaleString()}
                  </span>
                </div>

                {/* Bottom row: título + subtítulo */}
                <div style={{ position: 'relative', zIndex: 1 }}>
                  <h3 style={{
                    fontFamily: D.font,
                    fontSize: 15, fontWeight: 700,
                    color: '#ffffff', margin: 0,
                    letterSpacing: '0.02em',
                    lineHeight: 1.2,
                  }}>
                    {card.label}
                  </h3>
                  <p style={{
                    fontFamily: D.fontBody,
                    fontSize: 11, fontWeight: 500,
                    color: 'rgba(255,255,255,0.55)',
                    margin: '4px 0 0',
                    letterSpacing: '0.02em',
                    lineHeight: 1.3,
                  }}>
                    {card.subtitle || card.kpiLabel}
                  </p>
                </div>
              </button>
            )
          })}
        </div>
      </div>
    </ModuleLayout>
  )
}
