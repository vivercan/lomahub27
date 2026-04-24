import { supabase } from '../../lib/supabase'
import { ModuleDashboardGrid } from '../../components/dashboard/ModuleDashboardGrid'
import type { CardDef } from '../../components/dashboard/ModuleDashboardGrid'

/* ———————————————————————————————————————————————————————————————
   CONFIGURACIÓN — Landing Page V4.0 (usa ModuleDashboardGrid compartido)
   DNA V3.7 idéntico al resto. 8 cards.
   ——————————————————————————————————————————————————————————————— */

const CARDS: CardDef[] = [
  { id: 'usuarios',      label: 'Usuarios',          route: '/admin/configuracion/usuarios',      kpiLabel: 'Autorizados',  iconSet: 'hugeicons', iconName: 'user-multiple-03' },
  { id: 'catalogos',     label: 'Catálogos',         route: '/admin/configuracion/catalogos',     kpiLabel: 'Tipos',        iconSet: 'hugeicons', iconName: 'grid-view' },
  { id: 'parametros',    label: 'Parámetros',        route: '/admin/configuracion/parametros',    kpiLabel: 'Configurados', iconSet: 'hugeicons', iconName: 'settings-02' },
  { id: 'integraciones', label: 'Integraciones',     route: '/admin/configuracion/integraciones', kpiLabel: 'Activas',      iconSet: 'hugeicons', iconName: 'plug-socket' },
  { id: 'auditoria',     label: 'Auditoría',         route: '/admin/configuracion/auditoria',     kpiLabel: 'Eventos 7d',   iconSet: 'hugeicons', iconName: 'file-search' },
  { id: 'plantillas',    label: 'Plantillas',        route: '/admin/configuracion/plantillas',    kpiLabel: 'Activas',      iconSet: 'hugeicons', iconName: 'file-edit' },
  { id: 'documentos',    label: 'Documentos',        route: '/admin/configuracion/documentos',    kpiLabel: 'Legales',      iconSet: 'hugeicons', iconName: 'file-01' },
  { id: 'cerebro',       label: 'Cerebro Tarifario', route: '/pricing/cerebro-tarifario',         kpiLabel: 'Reglas',       iconSet: 'hugeicons', iconName: 'brain' },
]

async function fallbackFetch(): Promise<Record<string, number>> {
  const [usuarios, parametros, auditoria] = await Promise.all([
    supabase.from('usuarios_autorizados').select('*', { count: 'exact', head: true }),
    supabase.from('parametros_sistema').select('*', { count: 'exact', head: true }),
    supabase.from('auditoria_log').select('*', { count: 'exact', head: true }).gte('created_at', new Date(Date.now() - 7 * 86400000).toISOString()),
  ])
  const out: Record<string, number> = {}
  CARDS.forEach(c => { out[c.id] = 0 })
  out.usuarios = usuarios.count ?? 0
  out.parametros = parametros.count ?? 0
  out.auditoria = auditoria.count ?? 0
  out.integraciones = 7  // Supabase, GPS, WA, Resend, Anthropic, Maps, ANODOS
  return out
}

export default function Configuracion() {
  return (
    <ModuleDashboardGrid
      titulo="Configuración"
      modulo="configuracion"
      cards={CARDS}
      fallbackFetch={fallbackFetch}
    />
  )
}
