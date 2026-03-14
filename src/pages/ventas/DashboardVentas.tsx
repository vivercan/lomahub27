import { BarChart3, TrendingUp } from 'lucide-react'
import { ModuleLayout } from '../../components/layout/ModuleLayout'
import { Card } from '../../components/ui/Card'
import { KPICard } from '../../components/ui/KPICard'
import { DataTable } from '../../components/ui/DataTable'
import { tokens } from '../../lib/tokens'
import type { Column } from '../../components/ui/DataTable'

interface FunnelStage {
  etapa: string
  cantidad: number
  monto: string
}

interface Vendedor {
  puesto: number
  nombre: string
  ventas: string
  meta: string
  avance: string
}

export default function DashboardVentas() {
  const kpis = [
    { titulo: 'Pipeline Total', valor: '$4.2M', color: 'primary' as const },
    { titulo: 'Leads Nuevos Semana', valor: '12', color: 'green' as const },
    { titulo: 'Conversión', valor: '23%', color: 'blue' as const },
    { titulo: 'Cotizaciones Sin Resp.', valor: '5', color: 'orange' as const },
  ]

  const funnelData: FunnelStage[] = [
    { etapa: 'Nuevo', cantidad: 45, monto: '$1.2M' },
    { etapa: 'Contactado', cantidad: 32, monto: '$1.8M' },
    { etapa: 'Cotización', cantidad: 18, monto: '$1.1M' },
    { etapa: 'Negociación', cantidad: 8, monto: '$1.0M' },
  ]

  const vendedores: Vendedor[] = [
    { puesto: 1, nombre: 'Carlos López', ventas: '$285K', meta: '$300K', avance: '95%' },
    { puesto: 2, nombre: 'María García', ventas: '$195K', meta: '$250K', avance: '78%' },
    { puesto: 3, nombre: 'Jorge Ruiz', ventas: '$165K', meta: '$250K', avance: '66%' },
  ]

  const funnelColumns: Column<FunnelStage>[] = [
    { key: 'etapa', label: 'Etapa', width: '25%' },
    { key: 'cantidad', label: 'Cantidad', width: '25%', align: 'center' },
    { key: 'monto', label: 'Monto', width: '25%', align: 'right' },
    {
      key: 'porcentaje',
      label: '% Total',
      width: '25%',
      align: 'center',
      render: () => <span style={{ color: tokens.colors.green }}>27%</span>,
    },
  ]

  const vendedorColumns: Column<Vendedor>[] = [
    { key: 'puesto', label: '#', width: '10%', align: 'center' },
    { key: 'nombre', label: 'Vendedor', width: '30%' },
    { key: 'ventas', label: 'Ventas', width: '20%', align: 'right' },
    { key: 'meta', label: 'Meta', width: '20%', align: 'right' },
    { key: 'avance', label: 'Avance', width: '20%', align: 'right' },
  ]

  return (
    <ModuleLayout
      titulo="Dashboard Comercial"
      subtitulo="Gerente Comercial — Semana en curso"
    >
      <div className="space-y-6">
        {/* KPIs */}
        <div className="grid grid-cols-4 gap-4">
          {kpis.map((kpi) => (
            <KPICard
              key={kpi.titulo}
              titulo={kpi.titulo}
              valor={kpi.valor}
              color={kpi.color}
            />
          ))}
        </div>

        {/* Funnel de Ventas */}
        <Card>
          <div className="mb-4 flex items-center gap-2">
            <BarChart3
              className="w-5 h-5"
              style={{ color: tokens.colors.primary }}
            />
            <h2
              className="text-lg font-bold"
              style={{
                color: tokens.colors.textPrimary,
                fontFamily: tokens.fonts.heading,
              }}
            >
              Funnel de Ventas
            </h2>
          </div>
          <DataTable columns={funnelColumns} data={funnelData} />
        </Card>

        {/* Ranking de Vendedores */}
        <Card>
          <div className="mb-4 flex items-center gap-2">
            <TrendingUp
              className="w-5 h-5"
              style={{ color: tokens.colors.green }}
            />
            <h2
              className="text-lg font-bold"
              style={{
                color: tokens.colors.textPrimary,
                fontFamily: tokens.fonts.heading,
              }}
            >
              Top Vendedores
            </h2>
          </div>
          <DataTable columns={vendedorColumns} data={vendedores} />
        </Card>
      </div>
    </ModuleLayout>
  )
}
