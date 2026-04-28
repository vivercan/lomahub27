import { supabase } from '../../lib/supabase'
import { ModuleDashboardGrid } from '../../components/dashboard/ModuleDashboardGrid'
import type { CardDef } from '../../components/dashboard/ModuleDashboardGrid'

/* âââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââ
   OPERACIONES â Landing Page V4.1
   9 cards: eliminados Cajas (â Control Equipo), Dedicados, Cruce,
   Temp., Oferta, Rentabilidad (â Comercial).
   âââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââ */

// V62 (28/Abr/2026) — JJ: TODO se unifica en Despacho IA (Servicio Clientes).
// Eliminadas: War Room, Mapa GPS, Control Tractos, Control Cajas, Planeacion Flota.
// (Despacho IA ya consolida torre control + tractos en vivo.
//  Control Equipo es el master de cajas + tractos en el dashboard principal.)
const CARDS: CardDef[] = [
  { id: 'despachos',      label: 'Despachos',         route: '/operaciones/despachos',              kpiLabel: 'Asignaciones',   iconSet: 'hugeicons', iconName: 'delivery-truck-01' },
  { id: 'disponibilidad', label: 'Disponibilidad',    route: '/operaciones/disponibilidad',         kpiLabel: 'Equipo',         iconSet: 'hugeicons', iconName: 'checkmark-circle-01' },
  { id: 'prog_impex',     label: 'Prog. IMPEX',       route: '/operaciones/programacion-impex',     kpiLabel: 'Programados',    iconSet: 'hugeicons', iconName: 'cargo-ship' },
  { id: 'prog_dedicados', label: 'Prog. Dedicados',   route: '/operaciones/programacion-dedicados', kpiLabel: 'Programados',    iconSet: 'hugeicons', iconName: 'calendar-04' },
  { id: 'documentos',     label: 'Documentos',        route: '/documentos',                         kpiLabel: 'Repositorio',    iconSet: 'hugeicons', iconName: 'file-empty-02' },
]

async function fallbackFetch(): Promise<Record<string, number>> {
  // V62 — solo Despachos cuenta viajes_anodos últimos 7d
  const desde7d = new Date(Date.now() - 7 * 86400000).toISOString()
  const viajesAnodos = await supabase.from('viajes_anodos')
    .select('*', { count: 'exact', head: true })
    .gte('inicia_viaje', desde7d)
    .neq('tipo', 'VACIO')
  const out: Record<string, number> = {}
  CARDS.forEach(c => { out[c.id] = 0 })
  out.despachos = viajesAnodos.count ?? 0
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
