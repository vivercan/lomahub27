import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import {
  DollarSign, TrendingUp, TrendingDown, Truck, BarChart3, FileText,
  RefreshCw, ArrowLeft, Shield, AlertTriangle, Calendar, Target,
  Percent, Map, ChevronDown, ChevronUp
} from 'lucide-react'
import { ModuleLayout } from '../../components/layout/ModuleLayout'
import { Card } from '../../components/ui/Card'
import { KPICard } from '../../components/ui/KPICard'
import { Button } from '../../components/ui/Button'
import { DataTable } from '../../components/ui/DataTable'
import type { Column } from '../../components/ui/DataTable'
import { Badge } from '../../components/ui/Badge'
import { tokens } from '../../lib/tokens'
import { supabase } from '../../lib/supabase'

// âââ Types âââââââââââââââââââââââââââââââââââââââââââ
interface MesData {
  mes: string
  label: string
  viajes: number
  ingreso: number
  costo: number
  margen: number
  presupuesto: number
  cumplimiento: number
}

interface RutaData {
  ruta: string
  viajes: number
  ingreso: number
  margen: number
}

interface RadiografiaResponse {
  ok: boolean
  cliente: {
    id: string
    razon_social: string
    rfc: string
    tipo: string
    segmento: string
    prioridad: string
    empresa: string
    antiguedad_meses: number
  }
  kpis: {
    totalViajes: number
    totalIngreso: number
    totalCosto: number
    margenGlobal: number
    ticketPromedio: number
    viajesPromMensual: number
    tendencia: number
    periodoMeses: number
  }
  cartera: {
    saldoTotal: number
    saldoVencido: number
    diasCreditoPactados: number
    diasPromedioPago: number
    totalFacturado: number
    totalVigente: number
    totalVencido: number
    totalPagado: number
    facturasVigentes: number
    facturasVencidas: number
  }
  contrato: {
    fechaInicio: string
    fechaFin: string
    estado: string
  } | null
  riesgo: {
    score: number
    label: string
  }
  serieMensual: MesData[]
  topRutas: RutaData[]
  mensaje?: string
}

// âââ Helpers âââââââââââââââââââââââââââââââââââââââââ
function formatCurrency(n: number): string {
  return new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN', minimumFractionDigits: 0 }).format(n)
}

function getRiskColor(score: number): string {
  if (score <= 3) return tokens.colors.green
  if (score <= 6) return tokens.colors.yellow
  return tokens.colors.red
}

function getTendenciaIcon(t: number) {
  if (t > 5) return <TrendingUp size={16} style={{ color: tokens.colors.green }} />
  if (t < -5) return <TrendingDown size={16} style={{ color: tokens.colors.red }} />
  return <BarChart3 size={16} style={{ color: tokens.colors.yellow }} />
}

export default function RadiografiaFinanciera() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const [loading, setLoading] = useState(false)
  const [data, setData] = useState<RadiografiaResponse| null>(null)
  const [error, setError] = useState<string | null>(null)
  const [showChart, setShowChart] = useState(true)

  const fetchData = async () => {
    if (!id) return
    setLoading(true)
    setError(null)
    try {
      const { data: sessionData } = await supabase.auth.getSession()
      const token = sessionData.session?.access_token
      if (!token) throw new Error('SesiÃ³n expirada')

      const res = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/radiografia-financiera`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ cliente_id: id, meses_historico: 12 }),
        }
      )
      const json: RadiografiaResponse = await res.json()
      if (!json.ok) throw new Error(json.mensaje || 'Error al obtener radiografÃ­a')
      setData(json)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error desconocido')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchData()
  }, [id])

  // âââ Revenue chart (SVG) ââââââââââââââââââââââââââ
  function RevenueChart({ series }: { series: MesData[] }) {
    if (!series.length) return null
    const maxVal = Math.max(...series.map(s => Math.max(s.ingreso, s.presupuesto)), 1)
    const chartWidth = Math.max(600, series.length * 60)
    const chartHeight = 180
    const barWidth = 22

    return (
      <div className="overflow-x-auto">
        <svg width={chartWidth} height={chartHeight + 40} style={{ minWidth: '100%' }}>
          {series.map((item, i) => {
            const x = i * 60 + 20
            const ingresoH = (item.ingreso / maxVal) * chartHeight
            const presupH = (item.presupuesto / maxVal) * chartHeight

            return (
              <g key={item.mes}>
                {/* Presupuesto bar (background) */}
                {item.presupuesto > 0 && (
                  <rect
                    x={x} y={chartHeight - presupH}
                    width={barWidth * 2} height={presupH}
                    fill={tokens.colors.border} rx={3} opacity={0.4}
                  />
                )}
                {/* Ingreso bar */}
                <rect
                  x={x + 4} y={chartHeight - ingresoH}
                  width={barWidth} height={ingresoH}
                  fill={item.margen >= 20 ? tokens.colors.green : item.margen >= 10 ? tokens.colors.yellow : tokens.colors.red}
                  rx={3} opacity={0.85}
                />
                {/* Month label */}
                <text
                  x={x + barWidth / 2 + 4} y={chartHeight + 16}
                  textAnchor="middle" fontSize={10}
                  fill={tokens.colors.textMuted} fontFamily={tokens.fonts.body}
                >
                  {item.label}
                </text>
                {/* Margen % */}
                {item.ingreso > 0 && (
                  <text
                    x={x + barWidth / 2 + 4} y={chartHeight - ingresoH - 4}
                    textAnchor="middle" fontSize={9}
                    fill={tokens.colors.textMuted} fontFamily={tokens.fonts.body}
                  >
                    {item.margen}%
                  </text>
                )}
              </g>
            )
          })}
          {/* Trend line */}
          <polyline
            points={series.map((item, i) => {
              const x = i * 60 + 20 + barWidth / 2 + 4
              const y = chartHeight - (item.ingreso / maxVal) * chartHeight
              return `${x},${y}`
            }).join(' ')}
            fill="none"
            stroke={tokens.colors.primary}
            strokeWidth={2}
            opacity={0.6}
          />
        </svg>
      </div>
    )
  }

  // âââ Risk gauge SVG ââââââââââââââââââââââââââââââââ
  function RiskGauge({ score, label }: { score: number; label: string }) {
    const angle = (score / 10) * 360
    const r = 50
    const cx = 60
    const cy = 60

    function polarToCartesian(cx: number, cy: number, r: number, angleDeg: number) {
      const rad = ((angleDeg - 90) * Math.PI) / 180
      return { x: cx + r * Math.cos(rad), y: cy + r * Math.sin(rad) }
    }

    const start = polarToCartesian(cx, cy, r, 0)
    const end = polarToCartesian(cx, cy, r, Math.min(angle, 359.99))
    const largeArc = angle > 180 ? 1 : 0

    return (
      <div className="flex flex-col items-center">
        <svg width={120} height={120}>
          <circle cx={cx} cy={cy} r={r} fill="none" stroke={tokens.colors.border} strokeWidth={10} />
          <path
            d={`M ${start.x} ${start.y} A ${r} ${r} 0 ${largeArc} 1 ${end.x} ${end.y}`}
            fill="none"
            stroke={getRiskColor(score)}
            strokeWidth={10}
            strokeLinecap="round"
          />
          <text x={cx} y={cy - 4} textAnchor="middle" fontSize={24} fontWeight="bold"
            fill={getRiskColor(score)} fontFamily={"'Courier New', monospace"}>
            {score}
          </text>
          <text x={cx} y={cy + 14} textAnchor="middle" fontSize={11}
            fill={tokens.colors.textMuted} fontFamily={tokens.fonts.body}>
            /10
          </text>
        </svg>
        <Badge color={score <= 3 ? 'green' : score <= 6 ? 'yellow' : 'red'}>
          Riesgo {label}
        </Badge>
      </div>
    )
  }

  // âââ Top Routes table columns ââââââââââââââââââââââ
  const rutasColumns: Column<RutaData>[] = [
    {
      key: 'ruta',
      label: 'Ruta',
      render: (row) => (
        <div className="flex items-center gap-2">
          <Map size={14} style={{ color: tokens.colors.textMuted }} />
          <span className="text-sm font-medium" style={{ color: tokens.colors.textPrimary }}>
            {row.ruta}
          </span>
        </div>
      ),
    },
    {
      key: 'viajes',
      label: 'Viajes',
      align: 'center',
      render: (row) => (
        <span className="text-sm" style={{ color: tokens.colors.textSecondary }}>{row.viajes}</span>
      ),
    },
    {
      key: 'ingreso',
      label: 'Ingreso',
      align: 'right',
      render: (row) => (
        <span className="text-sm font-medium" style={{ color: tokens.colors.textPrimary }}>
          {formatCurrency(row.ingreso)}
        </span>
      ),
    },
    {
      key: 'margen',
      label: 'Margen',
      align: 'center',
      render: (row) => (
        <Badge color={row.margen >= 25 ? 'green' : row.margen >= 15 ? 'yellow' : 'red'}>
          {row.margen}%
        </Badge>
      ),
    },
  ]

  // âââ Monthly series table columns ââââââââââââââââââ
  const mesColumns: Column<MesData>[] = [
    {
      key: 'label',
      label: 'Mes',
      render: (row) => (
        <span className="text-sm font-medium" style={{ color: tokens.colors.textPrimary }}>{row.label}</span>
      ),
    },
    {
      key: 'viajes',
      label: 'Viajes',
      align: 'center',
      render: (row) => (
        <span className="text-sm" style={{ color: tokens.colors.textSecondary }}>{row.viajes}</span>
      ),
    },
    {
      key: 'ingreso',
      label: 'Ingreso',
      align: 'right',
      render: (row) => (
        <span className="text-sm" style={{ color: tokens.colors.textPrimary }}>{formatCurrency(row.ingreso)}</span>
      ),
    },
    {
      key: 'margen',
      label: 'Margen',
      align: 'center',
      render: (row) => (
        <Badge color={row.margen >= 25 ? 'green' : row.margen >= 15 ? 'yellow' : 'red'}>
          {row.margen}%
        </Badge>
      ),
    },
    {
      key: 'presupuesto',
      label: 'Presupuesto',
      align: 'right',
      render: (row) => (
        <span className="text-sm" style={{ color: tokens.colors.textMuted }}>
          {row.presupuesto > 0 ? formatCurrency(row.presupuesto) : 'â'}
        </span>
      ),
    },
    {
      key: 'cumplimiento',
      label: 'Cumpl.',
      align: 'center',
      render: (row) => (
        row.presupuesto > 0 ? (
          <Badge color={row.cumplimiento >= 100 ? 'green' : row.cumplimiento >= 80 ? 'yellow' : 'red'}>
            {row.cumplimiento}%
          </Badge>
        ) : (
          <span className="text-xs" style={{ color: tokens.colors.textMuted }}>â</span>
        )
      ),
    },
  ]

  return (
    <ModuleLayout
      titulo={data ? `RadiografÃ­a â ${data.cliente.razon_social}` : 'RadiografÃ­a Financiera'}
      subtitulo="Perfil financiero 360Â° del cliente"
      acciones={
        <div className="flex items-center gap-2">
          <button
            onClick={() => navigate(-1)}
            style={{
              display: 'flex', alignItems: 'center', gap: '6px',
              padding: '6px 14px', borderRadius: '8px',
              border: '1px solid #D97706', background: '#F59E0B',
              color: '#FFFFFF', fontSize: '13px', fontWeight: 600,
              fontFamily: tokens.fonts.body, cursor: 'pointer',
              transition: 'all 0.15s',
            }}
            onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.background = '#D97706' }}
            onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.background = '#F59E0B' }}
          >
            <ArrowLeft size={16} />
            Volver
          </button>
          <Button variant="secondary" size="sm" onClick={fetchData} loading={loading}>
            <RefreshCw size={16} />
            Actualizar
          </Button>
        </div>
      }
    >
      {/* Error */}
      {error && (
        <Card glow="red" className="mb-6">
          <div className="flex items-center gap-3">
            <AlertTriangle size={20} style={{ color: tokens.colors.red }} />
            <p className="text-sm" style={{ color: tokens.colors.red, fontFamily: tokens.fonts.body }}>
              {error}
            </p>
          </div>
        </Card>
      )}

      {data && (
        <>
          {/* Client header card */}
          <Card className="mb-6">
            <div className="flex items-start justify-between flex-wrap gap-4">
              <div>
                <h2 className="text-lg font-bold" style={{ color: tokens.colors.textPrimary, fontFamily: tokens.fonts.heading }}>
                  {data.cliente.razon_social}
                </h2>
                <div className="flex items-center gap-3 mt-1 flex-wrap">
                  <span className="text-xs" style={{ color: tokens.colors.textMuted }}>{data.cliente.rfc}</span>
                  <Badge color="blue">{data.cliente.tipo}</Badge>
                  {data.cliente.segmento && <Badge color="gray">{data.cliente.segmento}</Badge>}
                  <Badge color={data.cliente.prioridad === 'estrategica' ? 'green' : data.cliente.prioridad === 'alta' ? 'yellow' : 'gray'}>
                    {data.cliente.prioridad}
                  </Badge>
                  <span className="text-xs" style={{ color: tokens.colors.textMuted }}>
                    {data.cliente.empresa} Â· {data.cliente.antiguedad_meses} meses
                  </span>
                </div>
              </div>
              <RiskGauge score={data.riesgo.score} label={data.riesgo.label} />
            </div>
          </Card>

          {/* KPIs */}
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-8 gap-3 mb-6">
            <KPICard titulo="Viajes" valor={data.kpis.totalViajes} color="blue" icono={<Truck size={16} />} />
            <KPICard titulo="Ingreso" valor={formatCurrency(data.kpis.totalIngreso)} color="primary" icono={<DollarSign size={16} />} />
            <KPICard titulo="Margen" valor={`${data.kpis.margenGlobal}%`} color={data.kpis.margenGlobal >= 20 ? 'green' : 'yellow'} icono={<Percent size={16} />} />
            <KPICard titulo="Ticket Prom." valor={formatCurrency(data.kpis.ticketPromedio)} color="gray" icono={<BarChart3 size={16} />} />
            <KPICard titulo="Viajes/Mes" valor={data.kpis.viajesPromMensual} color="blue" icono={<Calendar size={16} />} />
            <KPICard titulo="Tendencia" valor={`${data.kpis.tendencia > 0 ? '+' : ''}${data.kpis.tendencia}%`} color={data.kpis.tendencia >= 0 ? 'green' : 'red'} icono={getTendenciaIcon(data.kpis.tendencia)} />
            <KPICard titulo="Saldo Vencido" valor={formatCurrency(data.cartera.saldoVencido)} color={data.cartera.saldoVencido > 0 ? 'red' : 'green'} icono={<AlertTriangle size={16} />} />
            <KPICard titulo="DÃ­as Pago" valor={data.cartera.diasPromedioPago} color={data.cartera.diasPromedioPago > data.cartera.diasCreditoPactados ? 'red' : 'green'} icono={<Calendar size={16} />} />
          </div>

          {/* Revenue chart + Cartera */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-6">
            <Card className="lg:col-span-2">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-sm font-semibold" style={{ color: tokens.colors.textPrimary, fontFamily: tokens.fonts.heading }}>
                  FacturaciÃ³n Mensual (Ãºltimos {data.kpis.periodoMeses} meses)
                </h3>
                <button onClick={() => setShowChart(!showChart)} className="p-1" style={{ color: tokens.colors.textMuted }}>
                  {showChart ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                </button>
              </div>
              {showChart && <RevenueChart series={data.serieMensual} />}
              <div className="flex items-center gap-4 mt-2">
                <div className="flex items-center gap-1">
                  <div className="w-3 h-3 rounded" style={{ background: tokens.colors.green }} />
                  <span className="text-xs" style={{ color: tokens.colors.textMuted }}>Margen â¥20%</span>
                </div>
                <div className="flex items-center gap-1">
                  <div className="w-3 h-3 rounded" style={{ background: tokens.colors.yellow }} />
                  <span className="text-xs" style={{ color: tokens.colors.textMuted }}>Margen 10-20%</span>
                </div>
                <div className="flex items-center gap-1">
                  <div className="w-3 h-3 rounded" style={{ background: tokens.colors.red }} />
                  <span className="text-xs" style={{ color: tokens.colors.textMuted }}>Margen &lt;10%</span>
                </div>
                <div className="flex items-center gap-1">
                  <div className="w-3 h-3 rounded" style={{ background: tokens.colors.border, opacity: 0.4 }} />
                  <span className="text-xs" style={{ color: tokens.colors.textMuted }}>Presupuesto</span>
                </div>
              </div>
            </Card>

            {/* Cartera card */}
            <Card>
              <h3 className="text-sm font-semibold mb-4" style={{ color: tokens.colors.textPrimary, fontFamily: tokens.fonts.heading }}>
                <Shield size={16} className="inline mr-2" style={{ color: tokens.colors.primary }} />
                Cartera y Cobranza
              </h3>
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-xs" style={{ color: tokens.colors.textMuted }}>Total Facturado</span>
                  <span className="text-sm font-semibold" style={{ color: tokens.colors.textPrimary }}>{formatCurrency(data.cartera.totalFacturado)}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-xs" style={{ color: tokens.colors.textMuted }}>Pagado</span>
                  <span className="text-sm" style={{ color: tokens.colors.green }}>{formatCurrency(data.cartera.totalPagado)}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-xs" style={{ color: tokens.colors.textMuted }}>Vigente</span>
                  <span className="text-sm" style={{ color: tokens.colors.yellow }}>{formatCurrency(data.cartera.totalVigente)}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-xs" style={{ color: tokens.colors.textMuted }}>Vencido</span>
                  <span className="text-sm font-bold" style={{ color: data.cartera.totalVencido > 0 ? tokens.colors.red : tokens.colors.green }}>
                    {formatCurrency(data.cartera.totalVencido)}
                  </span>
                </div>
                <div className="border-t pt-2" style={{ borderColor: tokens.colors.border }}>
                  <div className="flex justify-between items-center">
                    <span className="text-xs" style={{ color: tokens.colors.textMuted }}>CrÃ©dito pactado</span>
                    <span className="text-sm" style={{ color: tokens.colors.textSecondary }}>{data.cartera.diasCreditoPactados} dÃ­as</span>
                  </div>
                  <div className="flex justify-between items-center mt-1">
                    <span className="text-xs" style={{ color: tokens.colors.textMuted }}>Promedio pago</span>
                    <span className="text-sm font-medium" style={{
                      color: data.cartera.diasPromedioPago > data.cartera.diasCreditoPactados ? tokens.colors.red : tokens.colors.green
                    }}>
                      {data.cartera.diasPromedioPago} dÃ­as
                    </span>
                  </div>
                </div>
                {data.contrato && (
                  <div className="border-t pt-2" style={{ borderColor: tokens.colors.border }}>
                    <div className="flex items-center gap-2 mb-1">
                      <FileText size={14} style={{ color: tokens.colors.primary }} />
                      <span className="text-xs font-semibold" style={{ color: tokens.colors.textPrimary }}>Contrato Activo</span>
                    </div>
                    <span className="text-xs" style={{ color: tokens.colors.textMuted }}>
                      {data.contrato.fechaInicio} â {data.contrato.fechaFin}
                    </span>
                  </div>
                )}
                {!data.contrato && (
                  <div className="border-t pt-2" style={{ borderColor: tokens.colors.border }}>
                    <div className="flex items-center gap-2">
                      <AlertTriangle size={14} style={{ color: tokens.colors.red }} />
                      <span className="text-xs" style={{ color: tokens.colors.red }}>Sin contrato vigente</span>
                    </div>
                  </div>
                )}
              </div>
            </Card>
          </div>

          {/* Insight card */}
          <Card glow="primary" className="mb-6">
            <div className="flex items-start gap-3">
              <Target size={20} style={{ color: tokens.colors.primary, marginTop: 2 }} />
              <div>
                <p className="text-sm font-semibold mb-1" style={{ color: tokens.colors.textPrimary, fontFamily: tokens.fonts.heading }}>
                  Insight Financiero
                </p>
                <p className="text-sm" style={{ color: tokens.colors.textSecondary, fontFamily: tokens.fonts.body }}>
                  {data.cliente.razon_social} genera {formatCurrency(data.kpis.totalIngreso)} en {data.kpis.periodoMeses} meses
                  con margen de {data.kpis.margenGlobal}% y ticket promedio de {formatCurrency(data.kpis.ticketPromedio)}.
                  {data.kpis.tendencia > 10 ? ' Tendencia al alza â cliente en crecimiento.' :
                   data.kpis.tendencia < -10 ? ' Tendencia a la baja â requiere atenciÃ³n comercial.' :
                   ' FacturaciÃ³n estable.'}
                  {data.cartera.saldoVencido > 0 ? ` Alerta: ${formatCurrency(data.cartera.saldoVencido)} vencido.` : ''}
                  {data.riesgo.score >= 7 ? ' Riesgo alto â revisar condiciones.' : ''}
                </p>
              </div>
            </div>
          </Card>

          {/* Top routes + Monthly detail */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-6">
            <Card noPadding>
              <div className="px-4 py-3 border-b" style={{ borderColor: tokens.colors.border }}>
                <h3 className="text-sm font-semibold" style={{ color: tokens.colors.textPrimary, fontFamily: tokens.fonts.heading }}>
                  Top Rutas
                </h3>
              </div>
              <DataTable
                columns={rutasColumns}
                data={data.topRutas}
                loading={false}
                emptyMessage="Sin rutas en el perÃ­odo"
              />
            </Card>

            <Card noPadding>
              <div className="px-4 py-3 border-b" style={{ borderColor: tokens.colors.border }}>
                <h3 className="text-sm font-semibold" style={{ color: tokens.colors.textPrimary, fontFamily: tokens.fonts.heading }}>
                  Detalle Mensual
                </h3>
              </div>
              <DataTable
                columns={mesColumns}
                data={[...data.serieMensual].reverse()}
                loading={false}
                emptyMessage="Sin datos"
              />
            </Card>
          </div>
        </>
      )}

      {/* Loading state */}
      {loading && !data && (
        <div className="flex items-center justify-center py-20">
          <div
            className="w-8 h-8 border-3 border-t-transparent rounded-full animate-spin"
            style={{ borderColor: tokens.colors.primary, borderTopColor: 'transparent' }}
          />
        </div>
      )}
    </ModuleLayout>
  )
}

