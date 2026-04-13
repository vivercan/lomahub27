import { useState, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { ModuleLayout } from '../../components/layout/ModuleLayout'
import { supabase } from '../../lib/supabase'
import { tokens } from '../../lib/tokens'

/* ———————————————————————————————————————————————————————————————
   OPERACIONES — Landing Page (14 cards + War Room)
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

const ICO_OPACITY = 0.20
const ico = (path: string, style: React.CSSProperties) => (
  <img src={`https://api.iconify.design/${path}.svg?color=%23ffffff`} alt="" style={style} />
)
const compose = (main: string) => () => (
  <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none', opacity: ICO_OPACITY }}>
    {ico(main, { position: 'absolute', right: '-2%', bottom: '-2%', width: '70%', height: '70%' })}
  </div>
)

const CARDS = [
  { id: 'despachos',      label: 'Despachos',              route: '/operaciones/despachos',              kpiLabel: 'Asignaciones',   icon: compose('hugeicons:delivery-truck-01'),      accent: '#2563EB' },
  { id: 'torre_control',  label: 'Torre de Control',       route: '/operaciones/torre-control',          kpiLabel: 'Viajes activos', icon: compose('hugeicons:satellite-02'),            accent: '#15803D' },
  { id: 'mapa_gps',       label: 'Mapa GPS',               route: '/operaciones/mapa',                   kpiLabel: 'Unidades',       icon: compose('hugeicons:maps-location-01'),        accent: '#059669' },
  { id: 'dedicados',      label: 'Dedicados',              route: '/operaciones/dedicados',               kpiLabel: 'Contratos',      icon: compose('hugeicons:truck-delivery'),           accent: '#0891B2' },
  { id: 'cajas',          label: 'Control Cajas',          route: '/operaciones/cajas',                   kpiLabel: 'Activas',        icon: compose('hugeicons:container-truck-02'),       accent: '#D97706' },
  { id: 'tractos',        label: 'Control Tractos',        route: '/operaciones/tractos',                 kpiLabel: 'Activos',        icon: compose('hugeicons:truck-01'),                 accent: '#EA580C' },
  { id: 'disponibilidad', label: 'Disponibilidad',         route: '/operaciones/disponibilidad',          kpiLabel: 'Equipo',         icon: compose('hugeicons:checkmark-circle-01'),      accent: '#7C3AED' },
  { id: 'cruce',          label: 'Cruce Fronterizo',       route: '/operaciones/cruce-fronterizo',        kpiLabel: 'Cruces',         icon: compose('hugeicons:flag-01'),                  accent: '#DC2626' },
  { id: 'temperatura',    label: 'Control Temp.',          route: '/operaciones/control-temperatura',     kpiLabel: 'Monitoreados',   icon: compose('hugeicons:thermometer'),               accent: '#0D9488' },
  { id: 'oferta',         label: 'Oferta Equipo',          route: '/operaciones/oferta-equipo',            kpiLabel: 'Disponible',     icon: compose('hugeicons:package-open'),              accent: '#6366F1' },
  { id: 'planeacion',     label: 'Planeación Flota',       route: '/operaciones/planeacion-flota',         kpiLabel: 'Unidades',       icon: compose('hugeicons:route-01'),                 accent: '#1D4ED8' },
  { id: 'rentabilidad',   label: 'Rentabilidad',           route: '/operaciones/rentabilidad',              kpiLabel: 'Por tracto',     icon: compose('hugeicons:chart-increase'),            accent: '#16A34A' },
  { id: 'prog_impex',     label: 'Prog. IMPEX',            route: '/operaciones/programacion-impex',        kpiLabel: 'Programados',    icon: compose('hugeicons:ship-02'),                  accent: '#9333EA' },
  { id: 'prog_dedicados', label: 'Prog. Dedicados',        route: '/operaciones/programacion-dedicados',    kpiLabel: 'Programados',    icon: compose('hugeicons:calendar-check-01'),         accent: '#B45309' },
  { id: 'war_room',       label: 'War Room',               route: '/war-room',                              kpiLabel: 'Alertas',        icon: compose('hugeicons:alert-diamond'),             accent: '#BE123C' },
]

export default function DashboardOperaciones() {
  const navigate = useNavigate()
  const [hovered, setHovered] = useState<string | null>(null)
  const [kpis, setKpis] = useState<Record<string, number>>({})
  const [loading, setLoading] = useState(true)

  const fetchKpis = useCallback(async () => {
    try {
      const [viajes, tractos, cajas] = await Promise.all([
        supabase.from('viajes').select('*', { count: 'exact', head: true }).in('estado', ['asignado', 'en_transito', 'en_curso', 'programado']),
        supabase.from('tractos').select('*', { count: 'exact', head: true }).eq('activo', true),
        supabase.from('cajas').select('*', { count: 'exact', head: true }).eq('activo', true),
      ])
      setKpis({
        torre_control: viajes.count ?? 0,
        tractos: tractos.count ?? 0,
        cajas: cajas.count ?? 0,
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
    <ModuleLayout titulo="Operaciones" moduloPadre={{ nombre: 'Dashboard', ruta: '/dashboard' }}>
      <div style={{ background: D.bg, minHeight: 'calc(100vh - 120px)', padding: '32px 40px' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '14px' }}>
          {CARDS.map(card => {
            const isH = hovered === card.id
            const Icon = card.icon
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
                  <Icon />
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
