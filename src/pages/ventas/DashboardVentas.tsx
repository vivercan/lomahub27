import { supabase } from '../../lib/supabase'
import { ModuleDashboardGrid } from '../../components/dashboard/ModuleDashboardGrid'
import type { CardDef } from '../../components/dashboard/ModuleDashboardGrid'

/* ───────────────────────────────────────────────────────────────
   COMERCIAL — Landing Page V4.2
   10 cards: CXC Cartera + Acciones Cobro unificados en Cartera 360.
   ─────────────────────────────────────────────────────────────── */

const CARDS: CardDef[] = [
  { id: 'cotizador',        label: 'Cotizador',         route: '/cotizador/nueva',               kpiLabel: 'Pendientes',  iconSet: 'hugeicons', iconName: 'invoice-03' },
  { id: 'mis_cotizaciones', label: 'Mis Cotizaciones',  route: '/cotizador/mis-cotizaciones',    kpiLabel: 'Total',       iconSet: 'hugeicons', iconName: 'file-management' },
  { id: 'programa',         label: 'Programa Semanal',  route: '/ventas/programa-semanal',       kpiLabel: 'Esta semana', iconSet: 'hugeicons', iconName: 'calendar-03' },
  { id: 'alta_clientes',    label: 'Alta de Clientes',  route: '/clientes/alta',                 kpiLabel: 'Formulario',  iconSet: 'hugeicons', iconName: 'user-add-01' },
  { id: 'inteligencia',     label: 'Inteligencia',      route: '/inteligencia',                  kpiLabel: 'Rankings',    iconSet: 'hugeicons', iconName: 'analytics-01' },
  { id: 'presupuesto',      label: 'Presupuesto',       route: '/inteligencia/presupuesto',      kpiLabel: 'Mensual',     iconSet: 'hugeicons', iconName: 'money-bag-02' },
  { id: 'pareto',           label: 'Análisis 80/20',  route: '/inteligencia/pareto',        kpiLabel: 'Pareto',      iconSet: 'hugeicons', iconName: 'chart-bar-line' },
  { id: 'rentabilidad',     label: 'Rentabilidad',      route: '/operaciones/rentabilidad',      kpiLabel: 'Por tracto',  iconSet: 'hugeicons', iconName: 'chart-increase' },
  { id: 'cartera_360',      label: 'Cartera 360',       route: '/cxc/cartera',                   kpiLabel: 'Cuentas',     iconSet: 'hugeicons', iconName: 'wallet-done-01' },
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
    rentabilidad: 0,
    cartera_360: cxcCuentas.count ?? 0,
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
