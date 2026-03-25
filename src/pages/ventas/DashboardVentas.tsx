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
  porcentaje: string
}

interface Vendedor {
  puesto: number
  nombre: string
  leads: number
  monto: string
  cerrados: number
}

const PIPELINE_STAGES = [
  'Nuevo',
  'Contactado',
  'Cotizado',
  'Negociacion',
  'Cerrado Ganado',
  'Cerrado Perdido',
]

function formatCurrency(amount: number): string {
  if (amount >= 1_000_000) {
    return `$${(amount / 1_000_000).toFixed(1)}M`
  }
  if (amount >= 1_000) {
    return `$${(amount / 1_000).toFixed(0)}K`
  }
  return `$${amount.toFixed(0)}`
}

function getWeekStart(): string {
  const now = new Date()
  const day = now.getDay()
  const diff = now.getDate() - day + (day === 0 ? -6 : 1)
  const monday = new Date(now.setDate(diff))
  monday.setHours(0, 0, 0, 0)
  return monday.toISOString()
}

export default function DashboardVentas() {
  const [kpis, setKpis] = useState([
    { titulo: 'Pipeline Total', valor: '$0', color: 'primary' as const },
    { titulo: 'Leads Nuevos Semana', valor: '0', color: 'green' as const },
    { titulo: 'ConversiÃ³n', valor: '0%', color: 'blue' as const },
    { titulo: 'Cotizaciones Sin Resp.', valor: '0', color: 'orange' as const },
  ])
  const [funnelData, setFunnelData] = useState<FunnelStage[]>([])
  const [vendedores, setVendedores] = useState<Vendedor[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        // 1. Fetch ALL leads (excluding Cerrado Perdido for pipeline)
        const { data: allLeads } = await supabase
          .from('leads')
          .select('id, estado, monto_estimado, ejecutivo_id, created_at')

        if (!allLeads || allLeads.length === 0) {
          setLoading(false)
          return
        }

        // 2. Pipeline Total â sum monto_estimado excluding Cerrado Perdido
        const activeLeads = allLeads.filter(
          (l) => l.estado !== 'Cerrado Perdido'
        )
        const pipelineTotal = activeLeads.reduce(
          (sum, l) => sum + (l.monto_estimado || 0),
          0
        )

        // 3. Leads nuevos esta semana
        const weekStart = getWeekStart()
        const leadsThisWeek = allLeads.filter(
          (l) => l.created_at >= weekStart
        ).length

        // 4. Tasa de conversiÃ³n
        const cerradosGanados = allLeads.filter(
          (l) => l.estado === 'Cerrado Ganado'
        ).length
        const totalLeads = allLeads.length
        const conversionRate =
          totalLeads > 0
            ? ((cerradosGanados / totalLeads) * 100).toFixed(1)
            : '0'

        // 5. Cotizaciones sin respuesta (Cotizado que no han avanzado)
        const cotizadosSinResp = allLeads.filter(
          (l) => l.estado === 'Cotizado'
        ).length

        setKpis([
          {
            titulo: 'Pipeline Total',
            valor: formatCurrency(pipelineTotal),
            color: 'primary' as const,
          },
          {
            titulo: 'Leads Nuevos Semana',
            valor: leadsThisWeek.toString(),
            color: 'green' as const,
          },
          {
            titulo: 'ConversiÃ³n',
            valor: `${conversionRate}%`,
            color: 'blue' as const,
          },
          {
            titulo: 'Cotizaciones Sin Resp.',
            valor: cotizadosSinResp.toString(),
            color: 'orange' as const,
          },
        ])

        // 6. Funnel de Ventas â agrupado por estado
        const stageMap = new Map<string, { count: number; monto: number }>()
        allLeads.forEach((lead) => {
          const existing = stageMap.get(lead.estado) || {
            count: 0,
            monto: 0,
          }
          existing.count++
          existing.monto += lead.monto_estimado || 0
          stageMap.set(lead.estado, existing)
        })

        const funnel: FunnelStage[] = PIPELINE_STAGES.filter((stage) =>
          stageMap.has(stage)
        ).map((stage) => {
          const data = stageMap.get(stage)!
          const pct =
            totalLeads > 0
              ? ((data.count / totalLeads) * 100).toFixed(0)
              : '0'
          return {
            etapa: stage,
            cantidad: data.count,
            monto: formatCurrency(data.monto),
            porcentaje: `${pct}%`,
          }
        })
        setFunnelData(funnel)

        // 7. Top Vendedores â agrupado por ejecutivo_id
        const vendedorMap = new Map<
          string,
          { leads: number; monto: number; cerrados: number }
        >()
        allLeads.forEach((lead) => {
          const eid = lead.ejecutivo_id || 'sin-asignar'
          const existing = vendedorMap.get(eid) || {
            leads: 0,
            monto: 0,
            cerrados: 0,
          }
          existing.leads++
          existing.monto += lead.monto_estimado || 0
          if (lead.estado === 'Cerrado Ganado') existing.cerrados++
          vendedorMap.set(eid, existing)
        })

        // Fetch ejecutivo names
        const ejecutivoIds = Array.from(vendedorMap.keys()).filter(
          (id) => id !== 'sin-asignar'
        )
        let nombreMap = new Map<string, string>()
        if (ejecutivoIds.length > 0) {
          const { data: usuarios } = await supabase
            .from('usuarios_autorizados')
            .select('id, nombre')
            .in('id', ejecutivoIds)
          if (usuarios) {
            usuarios.forEach((u) => nombreMap.set(u.id, u.nombre))
          }
        }

        const topVendedores: Vendedor[] = Array.from(vendedorMap.entries())
          .map(([id, data]) => ({
            puesto: 0,
            nombre: nombreMap.get(id) || (id === 'sin-asignar' ? 'Sin asignar' : id.slice(0, 8)),
            leads: data.leads,
            monto: formatCurrency(data.monto),
            cerrados: data.cerrados,
          }))
          .sort((a, b) => b.leads - a.leads)
          .slice(0, 10)
          .map((v, i) => ({ ...v, puesto: i + 1 }))

        setVendedores(topVendedores)
      } catch (err) {
        console.error('Error fetching dashboard data:', err)
      } finally {
        setLoading(false)
      }
    }

    fetchDashboardData()
  }, [])

  const funnelColumns: Column<FunnelStage>[] = [
    { key: 'etapa', label: 'Etapa', width: '30%' },
    { key: 'cantidad', label: 'Leads', width: '20%', align: 'center' },
    { key: 'monto', label: 'Monto', width: '25%', align: 'right' },
    {
      key: 'porcentaje',
      label: '% Total',
      width: '25%',
      align: 'center',
      render: (row: FunnelStage) => (
        <span style={{ color: tokens.colors.green }}>{row.porcentaje}</span>
      ),
    },
  ]

  const vendedorColumns: Column<Vendedor>[] = [
    { key: 'puesto', label: '#', width: '8%', align: 'center' },
    { key: 'nombre', label: 'Vendedor', width: '30%' },
    {
      key: 'leads',
      label: 'Leads',
      width: '17%',
      align: 'center',
    },
    { key: 'monto', label: 'Pipeline', width: '25%', align: 'right' },
    {
      key: 'cerrados',
      label: 'Ganados',
      width: '20%',
      align: 'center',
      render: (row: Vendedor) => (
        <span
          style={{
            color:
              row.cerrados > 0 ? tokens.colors.green : tokens.colors.textMuted,
          }}
        >
          {row.cerrados}
        </span>
      ),
    },
  ]

  return (
    <ModuleLayout
      titulo="Dashboard Comercial"
      subtitulo="Gerente Comercial â Semana en curso"
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
            <div
              style={{
                textAlign: 'center',
                padding: '48px 16px',
                color: tokens.colors.textMuted,
              }}
            >
              <p>Cargando...</p>
            </div>
          ) : funnelData.length === 0 ? (
            <div
              style={{
                textAlign: 'center',
                padding: '48px 16px',
                color: tokens.colors.textMuted,
              }}
            >
              <p style={{ fontSize: '18px', fontWeight: 500, margin: 0 }}>
                Sin datos
              </p>
              <p style={{ fontSize: '14px', marginTop: '8px' }}>
                Los datos se cargarÃ¡n cuando estÃ©n disponibles en el sistema
              </p>
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
            <div
              style={{
                textAlign: 'center',
                padding: '48px 16px',
                color: tokens.colors.textMuted,
              }}
            >
              <p>Cargando...</p>
            </div>
          ) : vendedores.length === 0 ? (
            <div
              style={{
                textAlign: 'center',
                padding: '48px 16px',
                color: tokens.colors.textMuted,
              }}
            >
              <p style={{ fontSize: '18px', fontWeight: 500, margin: 0 }}>
                Sin datos
              </p>
              <p style={{ fontSize: '14px', marginTop: '8px' }}>
                Los datos se cargarÃ¡n cuando estÃ©n disponibles en el sistema
              </p>
            </div>
          ) : (
            <DataTable columns={vendedorColumns} data={vendedores} />
          )}
        </Card>
      </div>
    </ModuleLayout>
  )
}
