import { supabase } from '../../lib/supabase'
import { ModuleDashboardGrid } from '../../components/dashboard/ModuleDashboardGrid'
import type { CardDef } from '../../components/dashboard/ModuleDashboardGrid'

/* ———————————————————————————————————————————————————————————————
   SERVICIO A CLIENTES — Landing Page V4.1 (28/Abr/2026)
   Card "Clientes Activos" ahora muestra clientes con VENTAS REALES 30d
   (RPC count_clientes_activos_30d que hace COUNT DISTINCT en viajes_anodos)
   en lugar de 879 registrados (que era engañoso).
   ——————————————————————————————————————————————————————————————— */

const CARDS: CardDef[] = [
  { id: 'tickets',      label: 'Tickets',           route: '/servicio/tickets',         kpiLabel: 'Activos',           iconSet: 'bi',        iconName: 'ticket-perforated' },
  { id: 'clientes',     label: 'Clientes Activos',  route: '/clientes/corporativos',    kpiLabel: 'Con ventas 30d',    iconSet: 'gridicons', iconName: 'multiple-users' },
  { id: 'impo',         label: 'Importación',       route: '/servicio/importacion',     kpiLabel: 'Viajes IMPO (30d)', iconSet: 'ion',       iconName: 'cloud-download' },
  { id: 'expo',         label: 'Exportación',       route: '/servicio/exportacion',     kpiLabel: 'Viajes EXPO (30d)', iconSet: 'ion',       iconName: 'cloud-upload' },
  { id: 'escalamiento_wa', label: 'Escalamiento WA', route: '/servicio/escalamiento-whatsapp', kpiLabel: 'Pendientes', iconSet: 'bi', iconName: 'arrow-up-right-square' },
  { id: 'despacho_ia',  label: 'Despacho IA',       route: '/servicio/despacho-ia', kpiLabel: 'Viajes activos',   iconSet: 'bi',        iconName: 'cpu' },
  { id: 'metricas',     label: 'Métricas Servicio', route: '/servicio/metricas',        kpiLabel: 'Dashboard',         iconSet: 'bi',        iconName: 'graph-up' },
  { id: 'actividades',  label: 'Actividades',       route: '/actividades',              kpiLabel: 'Pendientes',        iconSet: 'bi',        iconName: 'list-check' },
]

async function fallbackFetch(): Promise<Record<string, number>> {
  const hace30d = new Date()
  hace30d.setDate(hace30d.getDate() - 30)
  const desde = hace30d.toISOString()

  const [tix, cli, act, viajesActivos, impoRes, expoRes] = await Promise.all([
    supabase.from('tickets').select('*', { count: 'exact', head: true }).is('deleted_at', null).in('estado', ['abierto', 'en_proceso']),
    // Clientes con ventas REALES últimos 30d (RPC SQL count distinct)
    supabase.rpc('count_clientes_activos_30d'),
    supabase.from('actividades').select('*', { count: 'exact', head: true }).eq('resultado', 'pendiente'),
    supabase.from('viajes_anodos').select('*', { count: 'exact', head: true }).is('llega_destino', null).neq('tipo', 'VACIO').gte('inicia_viaje', new Date(Date.now() - 7 * 86400000).toISOString()),
    supabase.from('viajes_anodos').select('*', { count: 'exact', head: true }).eq('tipo', 'IMPO').gte('inicia_viaje', desde),
    supabase.from('viajes_anodos').select('*', { count: 'exact', head: true }).eq('tipo', 'EXPO').gte('inicia_viaje', desde),
  ])

  // RPC devuelve {data, error}; los demás devuelven {count}
  const cliCount = typeof (cli as any).data === 'number' ? (cli as any).data : 0
  return {
    tickets: tix.count ?? 0,
    clientes: cliCount,
    impo: impoRes.count ?? 0,
    expo: expoRes.count ?? 0,
    despacho_ia: viajesActivos.count ?? 0,
    metricas: tix.count ?? 0,
    actividades: act.count ?? 0,
  }
}

export default function DashboardCS() {
  return (
    <ModuleDashboardGrid
      titulo="Servicio a Clientes"
      modulo="servicio_cs"
      cards={CARDS}
      fallbackFetch={fallbackFetch}
    />
  )
}
