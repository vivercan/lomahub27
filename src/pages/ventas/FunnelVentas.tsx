import { useState, useEffect } from 'react'
import { TrendingUp, ArrowRight } from 'lucide-react'
import { ModuleLayout } from '../../components/layout/ModuleLayout'
import { Card } from '../../components/ui/Card'
import { KPICard } from '../../components/ui/KPICard'
import { DataTable, Column } from '../../components/ui/DataTable'
import { Badge } from '../../components/ui/Badge'
import { tokens } from '../../lib/tokens'
import { supabase } from '../../lib/supabase'

interface Lead {
  id: string
  empresa: string
  contacto: string | null
  estado: string
  valor_estimado: number | null
  ejecutivo_nombre: string | null
}

interface FunnelStage {
  id: string
  nombre: string
  probabilidad: number
  color: string
  count: number
  valor: number
  porcentaje: number
}

interface ConversionRate {
  from: string
  to: string
  rate: number
}

interface TopLead {
  id: string
  empresa: string
  contacto: string
  estado: string
  valor_estimado: number
  ejecutivo_nombre: string
}

const STAGES = [
  { id: 'Nuevo', nombre: 'Nuevo', probabilidad: 10, color: tokens.colors.blue },
  { id: 'Contactado', nombre: 'Contactado', probabilidad: 25, color: tokens.colors.yellow },
  { id: 'Cotizado', nombre: 'Cotizado', probabilidad: 50, color: tokens.colors.orange },
  { id: 'Negociacion', nombre: 'Negociación', probabilidad: 75, color: '#8B5CF6' },
  { id: 'Cerrado Ganado', nombre: 'Cerrado Ganado', probabilidad: 100, color: tokens.colors.green },
  { id: 'Cerrado Perdido', nombre: 'Cerrado Perdido', probabilidad: 0, color: tokens.colors.red },
]

export default function FunnelVentas() {
  const [leads, setLeads] = useState<Lead[]>([])
  const [loading, setLoading] = useState(true)
  const [funnelData, setFunnelData] = useState<FunnelStage[]>([])
  const [conversionRates, setConversionRates] = useState<ConversionRate[]>([])
  const [topLeads, setTopLeads] = useState<TopLead[]>([])

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    try {
      setLoading(true)
      const { data, error } = await supabase.from('leads').select('*')
      if (error) {
        console.error('Error fetching leads:', error)
        setLeads([])
        return
      }
      setLeads(data || [])
      processLeadsData(data || [])
    } catch (err) {
      console.error('Unexpected error:', err)
      setLeads([])
    } finally {
      setLoading(false)
    }
  }

  const processLeadsData = (leadsData: Lead[]) => {
    // Build funnel data
    const funnel: Record<string, FunnelStage> = {}
    let totalValue = 0

    STAGES.forEach((stage) => {
      const stageLeads = leadsData.filter((l) => l.estado === stage.id)
      const stageValue = stageLeads.reduce((sum, l) => sum + (l.valor_estimado || 0), 0)
      totalValue += stageValue
      funnel[stage.id] = {
        id: stage.id,
        nombre: stage.nombre,
        probabilidad: stage.probabilidad,
        color: stage.color,
        count: stageLeads.length,
        valor: stageValue,
        porcentaje: 0,
      }
    })

    // Calculate percentages
    Object.values(funnel).forEach((stage) => {
      stage.porcentaje = totalValue > 0 ? Math.round((stage.valor / totalValue) * 100) : 0
    })

    const funnelArray = STAGES.map((s) => funnel[s.id])
    setFunnelData(funnelArray)

    // Calculate conversion rates
    const rates: ConversionRate[] = []
    for (let i = 0; i < funnelArray.length - 1; i++) {
      const current = funnelArray[i]
      const next = funnelArray[i + 1]
      const rate = current.count > 0 ? Math.round((next.count / current.count) * 100) : 0
      rates.push({
        from: current.nombre,
        to: next.nombre,
        rate: rate,
      })
    }
    setConversionRates(rates)

    // Top 10 leads by valor_estimado
    const sorted = [...leadsData]
      .sort((a, b) => (b.valor_estimado || 0) - (a.valor_estimado || 0))
      .slice(0, 10)
      .map((l) => ({
        id: l.id,
        empresa: l.empresa,
        contacto: l.contacto || '-',
        estado: l.estado,
        valor_estimado: l.valor_estimado || 0,
        ejecutivo_nombre: l.ejecutivo_nombre || '-',
      }))
    setTopLeads(sorted)
  }

  const totalLeads = leads.length
  const totalPipeline = funnelData.reduce((sum, s) => sum + s.valor, 0)
  const ganados = funnelData.find((s) => s.id === 'Cerrado Ganado') || { count: 0 }
  const winRate = totalLeads > 0 ? Math.round((ganados.count / totalLeads) * 100) : 0
  const avgTicket = totalLeads > 0 ? Math.round(totalPipeline / totalLeads) : 0

  const fmtUSD = (v: number) => `$${v.toLocaleString('en-US', { maximumFractionDigits: 0 })}`

  const getStageColor = (estado: string): 'blue' | 'yellow' | 'orange' | 'green' | 'red' | 'primary' => {
    const stage = STAGES.find((s) => s.id === estado)
    switch (stage?.color) {
      case tokens.colors.blue:
        return 'blue'
      case tokens.colors.yellow:
        return 'yellow'
      case tokens.colors.orange:
        return 'orange'
      case tokens.colors.green:
        return 'green'
      case tokens.colors.red:
        return 'red'
      default:
        return 'primary'
    }
  }

  const topLeadsColumns: Column<TopLead>[] = [
    { key: 'empresa', label: 'Empresa', width: '25%' },
    { key: 'contacto', label: 'Contacto', width: '20%' },
    {
      key: 'estado',
      label: 'Estado',
      width: '15%',
      render: (row) => <Badge color={getStageColor(row.estado)}>{row.estado}</Badge>,
    },
    {
      key: 'valor_estimado',
      label: 'Valor',
      width: '20%',
      align: 'right',
      render: (row) => <span style={{ color: tokens.colors.green, fontWeight: 'bold' }}>{fmtUSD(row.valor_estimado)}</span>,
    },
    { key: 'ejecutivo_nombre', label: 'Ejecutivo', width: '20%' },
  ]

  return (
    <ModuleLayout titulo="Embudo de Ventas" subtitulo="Análisis completo del pipeline de leads">
      <div className="flex flex-col gap-6 h-full" style={{ fontFamily: tokens.fonts.heading }}>
        {/* KPI Cards */}
        <div className="grid grid-cols-4 gap-4">
          <KPICard titulo="Total Leads" valor={totalLeads} color="primary" icono={<TrendingUp size={20} />} />
          <KPICard titulo="Valor Pipeline" valor={fmtUSD(totalPipeline)} color="blue" />
          <KPICard titulo="Tasa Conversión" valor={`${winRate}%`} color="green" />
          <KPICard titulo="Ticket Promedio" valor={fmtUSD(avgTicket)} color="orange" />
        </div>

        {/* Main Funnel & Conversion Rates */}
        <div className="grid grid-cols-3 gap-6">
          {/* Visual Funnel */}
          <div className="col-span-2">
            <Card>
              <div className="p-6">
                <h3 className="text-sm font-bold mb-6" style={{ color: tokens.colors.textPrimary, fontFamily: tokens.fonts.heading }}>
                  Embudo Visual
                </h3>
                <div className="space-y-3">
                  {funnelData.map((stage, idx) => {
                    const maxWidth = 100
                    const widthPercent = idx === 0 ? maxWidth : (maxWidth * (stage.count / (funnelData[0]?.count || 1)))
                    return (
                      <div key={stage.id} className="flex flex-col gap-2">
                        <div
                          className="rounded-lg p-4 border-l-4 transition-all hover:shadow-lg"
                          style={{
                            width: `${widthPercent}%`,
                            background: stage.color + '15',
                            borderLeftColor: stage.color,
                            borderColor: tokens.colors.border,
                          }}
                        >
                          <div className="flex justify-between items-center">
                            <div>
                              <p className="text-xs font-bold" style={{ color: tokens.colors.textMuted }}>
                                {stage.nombre}
                              </p>
                              <p className="text-lg font-bold" style={{ color: stage.color }}>
                                {stage.count} leads
                              </p>
                            </div>
                            <div className="text-right">
                              <p className="text-xs" style={{ color: tokens.colors.textMuted }}>
                                {stage.porcentaje}%
                              </p>
                              <p className="text-sm font-bold" style={{ color: tokens.colors.green }}>
                                {fmtUSD(stage.valor)}
                              </p>
                            </div>
                          </div>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>
            </Card>
          </div>

          {/* Conversion Rates */}
          <div>
            <Card>
              <div className="p-6">
                <h3 className="text-sm font-bold mb-6" style={{ color: tokens.colors.textPrimary, fontFamily: tokens.fonts.heading }}>
                  Tasas de Conversión
                </h3>
                <div className="space-y-4">
                  {conversionRates.map((rate, idx) => (
                    <div key={idx} className="flex flex-col gap-2">
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex-1">
                          <p className="text-xs" style={{ color: tokens.colors.textMuted }}>
                            {rate.from}
                          </p>
                          <p className="text-xs" style={{ color: tokens.colors.textMuted }}>
                            hacia
                          </p>
                          <p className="text-xs" style={{ color: tokens.colors.textMuted }}>
                            {rate.to}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="text-xl font-bold" style={{ color: rate.rate >= 50 ? tokens.colors.green : rate.rate >= 25 ? tokens.colors.yellow : tokens.colors.red }}>
                            {rate.rate}%
                          </p>
                        </div>
                      </div>
                      <div
                        className="h-1 rounded-full"
                        style={{
                          background: tokens.colors.border,
                          width: '100%',
                        }}
                      >
                        <div
                          className="h-1 rounded-full"
                          style={{
                            background: rate.rate >= 50 ? tokens.colors.green : rate.rate >= 25 ? tokens.colors.yellow : tokens.colors.red,
                            width: `${rate.rate}%`,
                          }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </Card>
          </div>
        </div>

        {/* Top Leads Table */}
        <Card>
          <div className="p-6">
            <h3 className="text-sm font-bold mb-4" style={{ color: tokens.colors.textPrimary, fontFamily: tokens.fonts.heading }}>
              Top 10 Leads por Valor Estimado
            </h3>
            <DataTable columns={topLeadsColumns} data={topLeads} loading={loading} />
          </div>
        </Card>
      </div>
    </ModuleLayout>
  )
}
