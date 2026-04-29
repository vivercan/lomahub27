import { supabase } from '../../lib/supabase'
import { ModuleDashboardGrid } from '../../components/dashboard/ModuleDashboardGrid'
import type { CardDef } from '../../components/dashboard/ModuleDashboardGrid'

/* ———————————————————————————————————————————————————————————————
   COMUNICACIONES — Landing Page V2.0 (patrón Catálogos, 25/Abr/2026)
   3 cards con subtítulo descriptivo. Migrado a ModuleDashboardGrid.
   ——————————————————————————————————————————————————————————————— */

const CARDS: CardDef[] = [
  { id: 'correos',         label: 'Correos Automáticos', route: '/comunicaciones/correos',        kpiLabel: 'Templates', iconSet: 'hugeicons', iconName: 'mail-send-02',               subtitle: 'Plantillas y envíos transaccionales' },
  { id: 'chief_of_staff',  label: 'Chief of Staff IA',   route: '/comunicaciones/chief-of-staff', kpiLabel: 'Briefings', iconSet: 'hugeicons', iconName: 'artificial-intelligence-04', subtitle: 'Resumen ejecutivo diario con IA' },
  { id: 'notificaciones',  label: 'Notificaciones',      route: '/comunicaciones/notificaciones', kpiLabel: 'Centro',    iconSet: 'hugeicons', iconName: 'notification-02',            subtitle: 'Centro de avisos y alertas' },
  { id: 'whatsapp',              label: 'WhatsApp',              route: '/comunicaciones/whatsapp',  kpiLabel: 'Conversaciones', iconSet: 'hugeicons', iconName: 'whatsapp' },
]

async function fallbackFetch(): Promise<Record<string, number>> {
  const [briefings, notifs] = await Promise.all([
    supabase.from('briefings').select('*', { count: 'exact', head: true }).is('deleted_at', null),
    supabase.from('notificaciones').select('*', { count: 'exact', head: true }).is('leida', false),
  ])
  return {
    correos: 0,
    chief_of_staff: briefings.count ?? 0,
    notificaciones: notifs.count ?? 0,
  }
}

export default function DashboardComunicaciones() {
  return (
    <ModuleDashboardGrid
      titulo="Comunicaciones"
      modulo="comunicaciones"
      cards={CARDS}
      fallbackFetch={fallbackFetch}
    />
  )
}
