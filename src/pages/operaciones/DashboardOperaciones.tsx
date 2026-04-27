import { supabase } from '../../lib/supabase'
import { ModuleDashboardGrid } from '../../components/dashboard/ModuleDashboardGrid'
import type { CardDef } from '../../components/dashboard/ModuleDashboardGrid'

/* âââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââ
   OPERACIONES â Landing Page V4.1
   9 cards: eliminados Cajas (â Control Equipo), Dedicados, Cruce,
   Temp., Oferta, Rentabilidad (â Comercial).
   âââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââ */

const CARDS: CardDef[] = [
  { id: 'despachos',      label: 'Despachos',         route: '/operaciones/despachos',              kpiLabel: 'Asignaciones',   iconSet: 'hugeicons', iconName: 'delivery-truck-01' },
  // V51 26/Abr/2026 — Torre de Control eliminada de aquí. Acceso único vía Servicio → Despacho IA (decisión JJ)
  { id: 'mapa_gps',       label: 'Mapa GPS',          route: '/operaciones/mapa',                   kpiLabel: 'Unidades',       iconSet: 'hugeicons', iconName: 'maps-location-01' },
  { id: 'tractos',        label: 'Control Tractos',   route: '/operaciones/tractos',                kpiLabel: 'Activos',        iconSet: 'hugeicons', iconName: 'delivery-truck-02' },
  { id: 'cajas',          label: 'Control Cajas',     route: '/operaciones/cajas',                  kpiLabel: 'Activas',        iconSet: 'hugeicons', iconName: 'package-receive' },
  { id: 'disponibilidad', label: 'Disponibilidad',    route: '/operaciones/disponibilidad',         kpiLabel: 'Equipo',         iconSet: 'hugeicons', iconName: 'checkmark-circle-01' },
  { id: 'planeacion',     label: 'Planeacion Flota',  route: '/operaciones/planeacion-flota',       kpiLabel: 'Unidades',       iconSet: 'hugeicons', iconName: 'route-01' },
  { id: 'prog_impex',     label: 'Prog. IMPEX',       route: '/operaciones/programacion-impex',     kpiLabel: 'Programados',    iconSet: 'hugeicons', iconName: 'cargo-ship' },
  { id: 'prog_dedicados', label: 'Prog. Dedicados',   route: '/operaciones/programacion-dedicados', kpiLabel: 'Programados',    iconSet: 'hugeicons', iconName: 'calendar-04' },
  { id: 'documentos',     label: 'Documentos',        route: '/documentos',                         kpiLabel: 'Repositorio',    iconSet: 'hugeicons', iconName: 'file-empty-02' },
  { id: 'war_room',       label: 'War Room',          route: '/war-room',                           kpiLabel: 'Alertas',        iconSet: 'hugeicons', iconName: 'alert-diamond' },
]

async function fallbackFetch(): Promise<Record<string, number>> {
  // V54 (28/Abr/2026) — Usar viajes_anodos (136K registros) para datos reales
  const desde7d = new Date(Date.now() - 7 * 86400000).toISOString()
  const [viajesAnodos, tractos, cajas] = await Promise.all([
    supabase.from('viajes_anodos').select('*', { count: 'exact', head: true })
      .gte('inicia_viaje', desde7d)
      .neq('tipo', 'VACIO'),
    supabase.from('tractos').select('*', { count: 'exact', head: true }).eq('activo', true),
    supabase.from('cajas').select('*', { count: 'exact', head: true }),
  ])
  const out: Record<string, number> = {}
  CARDS.forEach(c => { out[c.id] = 0 })
  out.despachos = viajesAnodos.count ?? 0
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
