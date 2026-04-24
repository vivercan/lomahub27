import { supabase } from '../../lib/supabase'
import { ModuleDashboardGrid } from '../../components/dashboard/ModuleDashboardGrid'
import type { CardDef } from '../../components/dashboard/ModuleDashboardGrid'

/* ———————————————————————————————————————————————————————————————
   COMERCIAL — Landing Page V4.0 (usa ModuleDashboardGrid compartido)
   DNA V3.7 idéntico a DashboardCS: snapshot-first, mask-image icons,
   jerarquía título-dominante, sweep random direction, infladito colchón.
   ——————————————————————————————————————————————————————————————— */

const CARDS: CardDef[] = [
  { id: 'cotizador',        label: 'Cotizador',         route: '/cotizador/nueva',               kpiLabel: 'Pendientes', iconSet: 'hugeicons', iconName: 'invoice-03' },
  { id: 'mis_cotizaciones', label: 'Mis Cotizaciones',  route: '/cotizador/mis-cotizaciones',    kpiLabel: 'Total',      iconSet: 'hugeicons', iconName: 'file-management' },
  { id: 'programa',         label: 'Programa Semanal',  route: '/ventas/programa-semanal',       kpiLabel: 'Esta semana', iconSet: 'hugeicons', iconName: 'calendar-03' },
  { id: 'alta_clientes',    label: 'Alta de Clientes',  route: '/clientes/alta',                 kpiLabel: 'Formulario',  iconSet: 'hugeicons', iconName: 'user-add-01' },
  { id: 'inteligencia',     label: 'Inteligencia',      route: '/inteligencia',                  kpiLabel: 'Rankings',    iconSet: 'hugeicons', iconName: 'analytics-01' },
  { id: 'presupuesto',      label: 'Presupuesto',       route: '/inteligencia/presupuesto',      kpiLabel: 'Mensual',     iconSet: 'hugeicons', iconName: 'money-bag-02' },
  { id: 'pareto',           label: 'Análisis 80/20',    route: '/inteligencia/pareto',           kpiLabel: 'Pareto',      iconSet: 'hugeicons', iconName: 'chart-bar-line' },
  { id: 'cxc_cartera',      label: 'CXC Cartera',       route: '/cxc/cartera',                   kpiLabel: 'Cuentas',     iconSet: 'hugeicons', iconName: 'wallet-02' },
  { id: 'cxc_acciones',     label: 'Acciones Cobro',    route: '/cxc/acciones',                  kpiLabel: 'Pendientes',  iconSet: 'hugeicons', iconName: 'alert-circle' },
  { id: 'chief_of_staff',   label: 'Chief of Staff',    route: '/comunicaciones/chief-of-staff', kpiLabel: 'AI Briefing', iconSet: 'hugeicons', iconName: 'artificial-intelligence-04' },
]

async function fallbackFetch(): Promise<Record<string, number>> {
  const hace7d = new Date(Date.now() - 7 * 86400000).toISOString()
  const [cots, prog, leads, altas, cxcCuentas] = await Promise.all([
    supabase.from('cotizaciones').select('*', { count: 'exact', head: true }).is('deleted_at', null).eq('estado', 'pendiente'),
    supabase.from('leads').select('*', { count: 'exact', head: true }).is('deleted_at', null).gte('created_at', hace7d),
    supabase.from('leads').select('*', { count: 'exact', head: true }).is('deleted_at', null),
    supabase.from('alta_clientes').select('*', { count: 'exact', head: true }).not('estado', 'eq', 'COMPLETADA'),
    supabase.from('cxc_cartera').select('*', { count: 'exact', head: true }),
  ])
  return {
    cotizador: cots.count ?? 0,
    mis_cotizaciones: leads.count ?? 0,
    programa: prog.count ?? 0,
    alta_clientes: altas.count ?? 0,
    inteligencia: 0,
    presupuesto: 0,
    pareto: 0,
    cxc_cartera: cxcCuentas.count ?? 0,
    cxc_acciones: 0,
    chief_of_staff: 0,
  }
}

export default function DashboardVentas() {
  return (
    <ModuleDashboardGrid
      titulo="Comercial"
      modulo="comercial"
      cards={CARDS}
      fallbackFetch={fallbackFetch}
    />
  )
}
