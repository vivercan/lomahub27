import { supabase } from '../../lib/supabase'
import { ModuleDashboardGrid } from '../../components/dashboard/ModuleDashboardGrid'
import type { CardDef } from '../../components/dashboard/ModuleDashboardGrid'

/* âââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââ
   CONFIGURACIÃN â Landing Page V4.1
   6 cards: AuditorÃ­a eliminada, ParÃ¡metros + Cerebro Tarifario
   fusionados en "TARIFAS IA".
   âââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââ */

const CARDS: CardDef[] = [
  { id: 'usuarios',      label: 'Usuarios',      route: '/admin/configuracion/usuarios',      kpiLabel: 'Autorizados',  iconSet: 'hugeicons', iconName: 'user-multiple-03' },
  { id: 'catalogos',     label: 'CatÃ¡logos',     route: '/admin/configuracion/catalogos',     kpiLabel: 'Tipos',        iconSet: 'hugeicons', iconName: 'grid-view' },
  { id: 'tarifas_ia',    label: 'TARIFAS IA',    route: '/admin/configuracion/tarifas-ia',    kpiLabel: 'Reglas',       iconSet: 'hugeicons', iconName: 'brain' },
  { id: 'integraciones', label: 'Integraciones', route: '/admin/configuracion/integraciones', kpiLabel: 'Activas',      iconSet: 'hugeicons', iconName: 'plug-socket' },
  { id: 'plantillas',    label: 'Plantillas',    route: '/admin/configuracion/plantillas',    kpiLabel: 'Activas',      iconSet: 'hugeicons', iconName: 'file-edit' },
  { id: 'documentos',    label: 'Documentos',    route: '/admin/configuracion/documentos',    kpiLabel: 'Legales',      iconSet: 'hugeicons', iconName: 'file-01' },
]

async function fallbackFetch(): Promise<Record<string, number>> {
  const [usuarios, parametros] = await Promise.all([
    supabase.from('usuarios_autorizados').select('*', { count: 'exact', head: true }),
    supabase.from('parametros_sistema').select('*', { count: 'exact', head: true }),
  ])
  const out: Record<string, number> = {}
  CARDS.forEach(c => { out[c.id] = 0 })
  out.usuarios = usuarios.count ?? 0
  out.tarifas_ia = parametros.count ?? 0
  out.integraciones = 7  // Supabase, GPS, WA, Resend, Anthropic, Maps, ANODOS
  return out
}

export default function Configuracion() {
  return (
    <ModuleDashboardGrid
      titulo="ConfiguraciÃ³n"
      modulo="configuracion"
      cards={CARDS}
      fallbackFetch={fallbackFetch}
    />
  )
}
