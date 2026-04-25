import { supabase } from '../../lib/supabase'
import { ModuleDashboardGrid } from '../../components/dashboard/ModuleDashboardGrid'
import type { CardDef } from '../../components/dashboard/ModuleDashboardGrid'

/* ———————————————————————————————————————————————————————————————
   OPERACIONES — Landing Page V4.2 (patrón Catálogos, 25/Abr/2026)
   9 cards con subtítulo descriptivo + mojibake header limpiado.
   ——————————————————————————————————————————————————————————————— */

const CARDS: CardDef[] = [
  { id: 'despachos',      label: 'Despachos',         route: '/operaciones/despachos',              kpiLabel: 'Asignaciones',   iconSet: 'hugeicons', iconName: 'delivery-truck-01',  subtitle: 'Asignación de equipo a viajes' },
  { id: 'torre_control',  label: 'Torre de Control',  route: '/operaciones/torre-control',          kpiLabel: 'Viajes activos', iconSet: 'hugeicons', iconName: 'satellite-02',       subtitle: 'Seguimiento en vivo' },
  { id: 'mapa_gps',       label: 'Mapa GPS',          route: '/operaciones/mapa',                   kpiLabel: 'Unidades',       iconSet: 'hugeicons', iconName: 'maps-location-01',   subtitle: 'Posición en tiempo real' },
  { id: 'tractos',        label: 'Control Tractos',   route: '/operaciones/tractos',                kpiLabel: 'Activos',        iconSet: 'hugeicons', iconName: 'truck-01',           subtitle: 'Estado y disponibilidad de tractos' },
  { id: 'disponibilidad', label: 'Disponibilidad',    route: '/operaciones/disponibilidad',         kpiLabel: 'Equipo',         iconSet: 'hugeicons', iconName: 'checkmark-circle-01', subtitle: 'Equipo libre por terminal' },
  { id: 'planeacion',     label: 'Planeación Flota',  route: '/operaciones/planeacion-flota',       kpiLabel: 'Unidades',       iconSet: 'hugeicons', iconName: 'route-01',           subtitle: 'Ruteo y asignación de flota' },
  { id: 'prog_impex',     label: 'Prog. IMPEX',       route: '/operaciones/programacion-impex',     kpiLabel: 'Programados',    iconSet: 'hugeicons', iconName: 'ship-02',            subtitle: 'Cruces y citas IMPO/EXPO' },
  { id: 'prog_dedicados', label: 'Prog. Dedicados',   route: '/operaciones/programacion-dedicados', kpiLabel: 'Programados',    iconSet: 'hugeicons', iconName: 'calendar-check-01',  subtitle: 'Rutas dedicadas semana' },
  { id: 'war_room',       label: 'War Room',          route: '/war-room',                           kpiLabel: 'Alertas',        iconSet: 'hugeicons', iconName: 'alert-diamond',      subtitle: 'Alertas críticas en vivo' },
]

async function fallbackFetch(): Promise<Record<string, number>> {
  const [viajes, tractos] = await Promise.all([
    supabase.from('viajes').select('*', { count: 'exact', head: true }).in('estado', ['asignado', 'en_transito', 'en_curso', 'programado']),
    supabase.from('tractos').select('*', { count: 'exact', head: true }).eq('activo', true),
  ])
  const out: Record<string, number> = {}
  CARDS.forEach(c => { out[c.id] = 0 })
  out.despachos = viajes.count ?? 0
  out.torre_control = viajes.count ?? 0
  out.mapa_gps = tractos.count ?? 0
  out.tractos = tractos.count ?? 0
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
