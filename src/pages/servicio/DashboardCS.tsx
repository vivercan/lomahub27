import { supabase } from '../../lib/supabase'
import { ModuleDashboardGrid } from '../../components/dashboard/ModuleDashboardGrid'
import type { CardDef } from '../../components/dashboard/ModuleDashboardGrid'

/* ———————————————————————————————————————————————————————————————
   SERVICIO A CLIENTES — Landing Page V4.1 (patrón Catálogos, 25/Abr/2026)
   7 cards con subtítulo descriptivo.
   ——————————————————————————————————————————————————————————————— */

const CARDS: CardDef[] = [
  { id: 'tickets',      label: 'Tickets',           route: '/servicio/tickets',          kpiLabel: 'Activos',           iconSet: 'bi',        iconName: 'ticket-perforated', subtitle: 'Solicitudes abiertas y en proceso' },
  { id: 'clientes',     label: 'Clientes Activos',  route: '/clientes/corporativos',     kpiLabel: 'Clientes',          iconSet: 'gridicons', iconName: 'multiple-users',    subtitle: 'Cartera viva total' },
  { id: 'impo',         label: 'Importación',       route: '/servicio/importacion',      kpiLabel: 'Viajes IMPO (30d)', iconSet: 'ion',       iconName: 'cloud-download',    subtitle: 'Movimientos IMPO últimos 30 días' },
  { id: 'expo',         label: 'Exportación',       route: '/servicio/exportacion',      kpiLabel: 'Viajes EXPO (30d)', iconSet: 'ion',       iconName: 'cloud-upload',      subtitle: 'Movimientos EXPO últimos 30 días' },
  { id: 'despacho_ia',  label: 'Despacho IA',       route: '/operaciones/torre-control', kpiLabel: 'Viajes activos',    iconSet: 'bi',        iconName: 'cpu',               subtitle: 'Asistente operativo en vivo' },
  { id: 'metricas',     label: 'Métricas Servicio', route: '/servicio/metricas',         kpiLabel: 'Dashboard',         iconSet: 'bi',        iconName: 'graph-up',          subtitle: 'KPIs SLA y satisfacción' },
  { id: 'actividades',  label: 'Actividades',       route: '/actividades',               kpiLabel: 'Pendientes',        iconSet: 'bi',        iconName: 'list-check',        subtitle: 'Tareas y follow-ups del equipo' },
]

async function fallbackFetch(): Promise<Record<string, number>> {
  const hace30d = new Date()
  hace30d.setDate(hace30d.getDate() - 30)
  const desde = hace30d.toISOString()

  const [tix, cli, act, viajesActivos, impoRes, expoRes] = await Promise.all([
    supabase.from('tickets').select('*', { count: 'exact', head: true }).is('deleted_at', null).in('estado', ['abierto', 'en_proceso']),
    supabase.from('clientes').select('*', { count: 'exact', head: true }).is('deleted_at', null),
    supabase.from('actividades').select('*', { count: 'exact', head: true }).eq('resultado', 'pendiente'),
    supabase.from('viajes').select('*', { count: 'exact', head: true }).in('estado', ['en_transito', 'programado', 'en_riesgo']),
    supabase.from('viajes_anodos').select('*', { count: 'exact', head: true }).eq('tipo_viaje', 3).gte('inicia_viaje', desde),
    supabase.from('viajes_anodos').select('*', { count: 'exact', head: true }).eq('tipo_viaje', 2).gte('inicia_viaje', desde),
  ])

  return {
    tickets: tix.count ?? 0,
    clientes: cli.count ?? 0,
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
