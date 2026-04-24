import { supabase } from '../../lib/supabase'
import { ModuleDashboardGrid } from '../../components/dashboard/ModuleDashboardGrid'
import type { CardDef } from '../../components/dashboard/ModuleDashboardGrid'

/* ———————————————————————————————————————————————————————————————
   OPERACIONES — Landing Page V4.0 (usa ModuleDashboardGrid compartido)
   DNA V3.7 idéntico. 15 cards en grid 5 cols (3 filas).
   ——————————————————————————————————————————————————————————————— */

const CARDS: CardDef[] = [
  { id: 'despachos',      label: 'Despachos',         route: '/operaciones/despachos',              kpiLabel: 'Asignaciones',   iconSet: 'hugeicons', iconName: 'delivery-truck-01' },
  { id: 'torre_control',  label: 'Torre de Control',  route: '/operaciones/torre-control',          kpiLabel: 'Viajes activos', iconSet: 'hugeicons', iconName: 'satellite-02' },
  { id: 'mapa_gps',       label: 'Mapa GPS',          route: '/operaciones/mapa',                   kpiLabel: 'Unidades',       iconSet: 'hugeicons', iconName: 'maps-location-01' },
  { id: 'dedicados',      label: 'Dedicados',         route: '/operaciones/dedicados',              kpiLabel: 'Contratos',      iconSet: 'hugeicons', iconName: 'truck-delivery' },
  { id: 'cajas',          label: 'Control Cajas',     route: '/operaciones/cajas',                  kpiLabel: 'Activas',        iconSet: 'hugeicons', iconName: 'container-truck-02' },
  { id: 'tractos',        label: 'Control Tractos',   route: '/operaciones/tractos',                kpiLabel: 'Activos',        iconSet: 'hugeicons', iconName: 'truck-01' },
  { id: 'disponibilidad', label: 'Disponibilidad',    route: '/operaciones/disponibilidad',         kpiLabel: 'Equipo',         iconSet: 'hugeicons', iconName: 'checkmark-circle-01' },
  { id: 'cruce',          label: 'Cruce Fronterizo',  route: '/operaciones/cruce-fronterizo',       kpiLabel: 'Cruces',         iconSet: 'hugeicons', iconName: 'flag-01' },
  { id: 'temperatura',    label: 'Control Temp.',     route: '/operaciones/control-temperatura',    kpiLabel: 'Monitoreados',   iconSet: 'hugeicons', iconName: 'thermometer' },
  { id: 'oferta',         label: 'Oferta Equipo',     route: '/operaciones/oferta-equipo',          kpiLabel: 'Disponible',     iconSet: 'hugeicons', iconName: 'package-open' },
  { id: 'planeacion',     label: 'Planeacion Flota',  route: '/operaciones/planeacion-flota',       kpiLabel: 'Unidades',       iconSet: 'hugeicons', iconName: 'route-01' },
  { id: 'rentabilidad',   label: 'Rentabilidad',      route: '/operaciones/rentabilidad',           kpiLabel: 'Por tracto',     iconSet: 'hugeicons', iconName: 'chart-increase' },
  { id: 'prog_impex',     label: 'Prog. IMPEX',       route: '/operaciones/programacion-impex',     kpiLabel: 'Programados',    iconSet: 'hugeicons', iconName: 'ship-02' },
  { id: 'prog_dedicados', label: 'Prog. Dedicados',   route: '/operaciones/programacion-dedicados', kpiLabel: 'Programados',    iconSet: 'hugeicons', iconName: 'calendar-check-01' },
  { id: 'war_room',       label: 'War Room',          route: '/war-room',                           kpiLabel: 'Alertas',        iconSet: 'hugeicons', iconName: 'alert-diamond' },
]

async function fallbackFetch(): Promise<Record<string, number>> {
  const [viajes, tractos, cajas] = await Promise.all([
    supabase.from('viajes').select('*', { count: 'exact', head: true }).in('estado', ['asignado', 'en_transito', 'en_curso', 'programado']),
    supabase.from('tractos').select('*', { count: 'exact', head: true }).eq('activo', true),
    supabase.from('cajas').select('*', { count: 'exact', head: true }).eq('activo', true),
  ])
  const out: Record<string, number> = {}
  CARDS.forEach(c => { out[c.id] = 0 })
  out.despachos = viajes.count ?? 0
  out.torre_control = viajes.count ?? 0
  out.mapa_gps = tractos.count ?? 0
  out.tractos = tractos.count ?? 0
  out.cajas = cajas.count ?? 0
  return out
}

export default function DashboardOperaciones() {
  return (
    <ModuleDashboardGrid
      titulo="Operaciones"
      modulo="operaciones"
      cards={CARDS}
      fallbackFetch={fallbackFetch}
    />
  )
}
