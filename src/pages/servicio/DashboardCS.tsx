import { useState, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { ModuleLayout } from '../../components/layout/ModuleLayout'
import { supabase } from '../../lib/supabase'
import { tokens } from '../../lib/tokens'
/* ———————————————————————————————————————————————————————————————
SERVICIO A CLIENTES — Landing Page V2.4
Base V2.3 preservada + 3 enhancements:
  (1) Pressed más apachurrable (scale 0.94 + translateY 6px + cavity 0.72)
  (2) "Infladito colchón": radial-gradient overlay + inset ambient edge-darken
  (3) Ráfaga de luz al hover: light sweep diagonal 105deg translateX -120→220
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
      style={{ width: '79px', height: '79px', opacity: hovered ? 0.55 : 0.90, filter: 'drop-shadow(0 1px 2px rgba(0,0,0,0.3))', transition: 'opacity 0.3s ease' }} />
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
      <div style={{ background: D.bg, minHeight: 'calc(100vh - 120px)', padding: '32px 40px' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '20px' }}>
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
                style={{
                  aspectRatio: '1 / 0.9',
                  borderRadius: '10px',
                  padding: '24px 20px',
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
                  transition: 'transform 0.14s cubic-bezier(0.22,1,0.36,1), box-shadow 0.26s ease, outline 0.18s ease',
                  /* V2.4 FIX 1 — pressed más marcado: scale 0.94, translateY 6px */
                  transform: isP
                    ? 'translateY(6px) scale(0.94)'
                    : isH
                    ? 'translateY(-6px)'
                    : 'translateY(0)',
                  /* V2.3 outline rim blanco */
                  outline: isH
                    ? '1px solid rgba(255,255,255,0.28)'
                    : '1px solid rgba(255,255,255,0.18)',
                  outlineOffset: '-1px',
                  /* V2.4 FIX 1 — pressed cavity más profunda 0.72 (era 0.60) */
                  boxShadow: isP
                    ? 'inset 0 5px 16px rgba(0,0,0,0.72), inset 0 2px 6px rgba(0,0,0,0.48), inset 0 -1px 0 rgba(255,255,255,0.04), inset 1px 0 0 rgba(0,0,0,0.30), inset -1px 0 0 rgba(0,0,0,0.30), 0 0 0 rgba(0,0,0,0), 0 1px 2px rgba(0,0,0,0.32)'
                    : isH
                    ? 'inset 1px 0 0 rgba(255,255,255,0.18), inset -1px 0 0 rgba(255,255,255,0.12), inset 0 4px 0 rgba(255,255,255,0.52), inset 0 -4px 0 rgba(0,0,0,0.46), inset 0 -24px 42px rgba(0,0,0,0.22), inset 0 0 60px rgba(0,0,0,0.18), 0 6px 10px rgba(0,0,0,0.26), 0 26px 44px rgba(0,0,0,0.40), 0 52px 80px -12px rgba(0,0,0,0.48), 0 0 36px rgba(240,160,80,0.26)'
                    : 'inset 1px 0 0 rgba(255,255,255,0.16), inset -1px 0 0 rgba(255,255,255,0.10), inset 0 4px 0 rgba(255,255,255,0.44), inset 0 -4px 0 rgba(0,0,0,0.42), inset 0 -22px 40px rgba(0,0,0,0.20), inset 0 0 50px rgba(0,0,0,0.15), 0 3px 6px rgba(0,0,0,0.22), 0 18px 30px rgba(0,0,0,0.32), 0 38px 60px -8px rgba(0,0,0,0.40), 0 64px 90px -14px rgba(0,0,0,0.36)',
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

                {/* V2.4 FIX 2 — "Infladito colchón": radial-gradient centro-brillante + edges oscuros = surface bulge */}
                <div style={{
                  position: 'absolute', inset: 0,
                  background: 'radial-gradient(ellipse 85% 70% at 50% 42%, rgba(255,255,255,0.06) 0%, rgba(255,255,255,0.02) 40%, rgba(0,0,0,0.10) 85%, rgba(0,0,0,0.16) 100%)',
                  pointerEvents: 'none',
                  borderRadius: 'inherit',
                  opacity: isH ? 0.85 : 1,
                  transition: 'opacity 0.3s ease',
                  zIndex: 0,
                }} />

                {/* V2.4 FIX 3 — Ráfaga de luz al hover: franja diagonal que barre izq→der en 900ms */}
                <div style={{
                  position: 'absolute',
                  top: '-20%', bottom: '-20%',
                  left: '-50%',
                  width: '45%',
                  background: 'linear-gradient(105deg, transparent 35%, rgba(255,255,255,0.22) 50%, rgba(255,255,255,0.10) 55%, transparent 70%)',
                  transform: isH ? 'translateX(420%) skewX(-18deg)' : 'translateX(-20%) skewX(-18deg)',
                  transition: isH ? 'transform 0.9s cubic-bezier(0.22,1,0.36,1)' : 'none',
                  pointerEvents: 'none',
                  opacity: isH ? 1 : 0,
                  zIndex: 1,
                }} />

                {/* Label — TOP */}
                <div style={{
                  fontFamily: D.font, fontSize: '17px', fontWeight: 600, color: '#ffffff',
                  textAlign: 'center', position: 'relative', zIndex: 2, letterSpacing: '0.02em',
                  lineHeight: 1.2, paddingTop: '2px',
                }}>
                  {card.label}
                </div>

                {/* Icon — centered */}
                <div style={{ position: 'relative', zIndex: 2, transition: 'transform 0.3s ease', transform: isH ? 'scale(1.05)' : 'none' }}>
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
