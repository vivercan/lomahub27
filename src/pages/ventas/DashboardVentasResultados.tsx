import { ModuleDashboardGrid } from '../../components/dashboard/ModuleDashboardGrid'
import type { CardDef } from '../../components/dashboard/ModuleDashboardGrid'

/* ───────────────────────────────────────────────────────────────
   VENTAS RESULTADOS — Sub-dashboard V53 (27/Abr/2026)
   Tarea #10: card "Ventas" del dashboard principal abre acá
   (no directo a Analytics). Espacio para crecer con: Comparativos,
   Rankings, Forecast, etc.
   ─────────────────────────────────────────────────────────────── */

const CARDS: CardDef[] = [
  { id: 'analytics', label: 'Analytics', route: '/ventas/analytics', kpiLabel: 'KPIs', iconSet: 'hugeicons', iconName: 'analytics-up' },
]

async function fallbackFetch(): Promise<Record<string, number>> {
  return { analytics: 0 }
}

export default function DashboardVentasResultados() {
  return (
    <ModuleDashboardGrid
      titulo="Ventas — Resultados"
      modulo="ventas-resultados"
      cards={CARDS}
      fallbackFetch={fallbackFetch}
    />
  )
}
