import { useState, useEffect } from 'react'
import { BarChart3, TrendingUp } from 'lucide-react'
import { ModuleLayout } from '../../components/layout/ModuleLayout'
import { Card } from '../../components/ui/Card'
import { KPICard } from '../../components/ui/KPICard'
import { DataTable } from '../../components/ui/DataTable'
import { tokens } from '../../lib/tokens'
import { supabase } from '../../lib/supabase'
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
  const [kpis, setKpis] = useState([
    { titulo: 'Pipeline Total', valor: '0', color: 'primary' as const },
    { titulo: 'Leads Nuevos Semana', valor: '0', color: 'green' as const },
    { titulo: 'Conversión', valor: '0%', color: 'blue' as const },
    { titulo: 'Cotizaciones Sin Resp.', valor: '0', color: 'orange' as const },
  ])
  const [funnelData, setFunnelData] = useState<FunnelStage[]>([])
  const [vendedores, setVendedores] = useState<Vendedor[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        const { count: clientesCount } = await supabase
          .from('clientes')
          .select('*', { count: 'exact', head: true })

        const { count: viagesCount } = await supabase
          .from('viajes')
          .select('*', { count: 'exact', head: true })

        setKpis([
          { titulo: 'Pipeline Total', valor: clientesCount?.toString() || '0', color: 'primary' as const },
          { titulo: 'Leads Nuevos Semana', valor: (viagesCount || 0).toString(), color: 'green' as const },
          { titulo: 'Conversión', valor: '0%', color: 'blue' as const },
          { titulo: 'Cotizaciones Sin Resp.', valor: '0', color: 'orange' as const },
        ])

        setFunnelData([])
        setVendedores([])
      } catch (err) {
        console.error('Error fetching dashboard data:', err)
        setKpis([
          { titulo: 'Pipeline Total', valor: '0', color: 'primary' as const },
          { titulo: 'Leads Nuevos Semana', valor: '0', color: 'green' as const },
          { titulo: 'Conversión', valor: '0%', color: 'blue' as const },
          { titulo: 'Cotizaciones Sin Resp.', valor: '0', color: 'orange' as const },
        ])
      } finally {
        setLoading(false)
      }
    }

    fetchDashboardData()
  }, [])

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
          {loading ? (
            <div style={{ textAlign: 'center', padding: '48px 16px', color: tokens.colors.textMuted }}>
              <p>Cargando...</p>
            </div>
          ) : funnelData.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '48px 16px', color: tokens.colors.textMuted }}>
              <p style={{ fontSize: '18px', fontWeight: 500, margin: 0 }}>Sin datos</p>
              <p style={{ fontSize: '14px', marginTop: '8px' }}>Los datos se cargarán cuando estén disponibles en el sistema</p>
            </div>
          ) : (
            <DataTable columns={funnelColumns} data={funnelData} />
          )}
        </Card>

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
          {loading ? (
            <div style={{ textAlign: 'center', padding: '48px 16px', color: tokens.colors.textMuted }}>
              <p>Cargando...</p>
            </div>
          ) : vendedores.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '48px 16px', color: tokens.colors.textMuted }}>
              <p style={{ fontSize: '18px', fontWeight: 500, margin: 0 }}>Sin datos</p>
              <p style={{ fontSize: '14px', marginTop: '8px' }}>Los datos se cargarán cuando estén disponibles en el sistema</p>
            </div>
          ) : (
            <DataTable columns={vendedorColumns} data={vendedores} />
          )}
        </Card>
      </div>
    </ModuleLayout>
  )
}
