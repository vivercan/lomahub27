import { useState, useEffect } from 'react'
import {
  BarChart3, TrendingUp, Users, Truck, Map, RefreshCw, Download,
  Target, Percent, Award, ChevronDown, ChevronUp
} from 'lucide-react'
import { ModuleLayout } from '../../components/layout/ModuleLayout'
import { Card } from '../../components/ui/Card'
import { KPICard } from '../../components/ui/KPICard'
import { Button } from '../../components/ui/Button'
import { Select } from '../../components/ui/Select'
import { DataTable } from '../../components/ui/DataTable'
import type { Column } from '../../components/ui/DataTable'
import { Badge } from '../../components/ui/Badge'
import { tokens } from '../../lib/tokens'
import { supabase } from '../../lib/supabase'

// âââ Types âââââââââââââââââââââââââââââââââââââââââââ
interface ParetoItem {
  posicion: number
  id: string
  label: string
  sublabel: string
  ingreso: number
  costo: number
  margen: number
  viajes: number
  pct_del_total: number
  pct_acumulado: number
  zona: 'A' | 'B' | 'C'
}

interface ParetoResult {
  totalItems: number
  totalIngreso: number
  totalCosto: number
  totalViajes: number
  margenGlobal: number
  items80pct: number
  concentracion: number
  detalle: ParetoItem[]
}

interface AnalisisResponse {
  ok: boolean
  mes: string
  clientes?: ParetoResult
  tractos?: ParetoResult
  rutas?: ParetoResult
  mensaje?: string
}

type Dimension = 'clientes' | 'tractos' | 'rutas'

// âââ Helpers âââââââââââââââââââââââââââââââââââââââââ
function formatCurrency(n: number): string {
  return new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN', minimumFractionDigits: 0 }).format(n)
}

function getZonaColor(zona: string): 'green' | 'yellow' | 'red' {
  if (zona === 'A') return 'green'
  if (zona === 'B') return 'yellow'
  return 'red'
}

function getZonaLabel(zona: string): string {
  if (zona === 'A') return 'A (80%)'
  if (zona === 'B') return 'B (95%)'
  return 'C (cola)'
}

function getMedalColor(pos: number): string {
  if (pos === 1) return '#FFD700'
  if (pos === 2) return '#C0C0C0'
  if (pos === 3) return '#CD7F32'
  return tokens.colors.textMuted
}

function getMonthOptions() {
  const options = []
  const now = new Date()
  for (let i = 0; i < 12; i++) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1)
    const value = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
    const label = d.toLocaleDateString('es-MX', { month: 'long', year: 'numeric' })
    options.push({ value, label: label.charAt(0).toUpperCase() + label.slice(1) })
  }
  return options
}

function getDimensionIcon(dim: Dimension) {
  if (dim === 'clientes') return <Users size={18} />
  if (dim === 'tractos') return <Truck size={18} />
  return <Map size={18} />
}

function getDimensionLabel(dim: Dimension) {
  if (dim === 'clientes') return 'Clientes'
  if (dim === 'tractos') return 'Tractos'
  return 'Rutas'
}

export default function Analisis8020() {
  const [loading, setLoading] = useState(false)
  const [data, setData] = useState<AnalisisResponse | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [dimension, setDimension] = useState<Dimension>('clientes')
  const [showGauge, setShowGauge] = useState(true)

  const now = new Date()
  const [mes, setMes] = useState(`${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`)

  const mesOptions = getMonthOptions()

  const fetchData = async () => {
    setLoading(true)
    setError(null)
    try {
      const { data: sessionData } = await supabase.auth.getSession()
      const token = sessionData.session?.access_token
      if (!token) throw new Error('SesiÃ³n expirada')

      const [anio, mesNum] = mes.split('-')
      const res = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/analisis-8020`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ mes: parseInt(mesNum), anio: parseInt(anio), dimension: 'todos' }),
        }
      )
      const json: AnalisisResponse = await res.json()
      if (!json.ok) throw new Error(json.mensaje || 'Error al obtener anÃ¡lisis')
      setData(json)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error desconocido')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchData()
  }, [])

  const current: ParetoResult | null = data?.[dimension] ?? null

  // âââ Pareto bar chart (SVG) ââââââââââââââââââââââââ
  function ParetoChart({ items }: { items: ParetoItem[] }) {
    if (!items.length) return null
    const maxIngreso = items[0]?.ingreso || 1
    const barWidth = Math.max(8, Math.min(40, 600 / items.length))
    const chartWidth = Math.max(600, items.length * (barWidth + 4))
    const chartHeight = 200

    return (
      <div className="overflow-x-auto mb-4">
        <svg width={chartWidth} height={chartHeight + 30} style={{ minWidth: '100%' }}>
          {/* Bars */}
          {items.map((item, i) => {
            const barH = (item.ingreso / maxIngreso) * (chartHeight - 20)
            const x = i * (barWidth + 4) + 4
            const y = chartHeight - barH
            const color = item.zona === 'A' ? tokens.colors.green
              : item.zona === 'B' ? tokens.colors.yellow
              : tokens.colors.red
            return (
              <g key={item.id}>
                <rect
                  x={x} y={y} width={barWidth} height={barH}
                  fill={color} rx={2} opacity={0.85}
                />
                {item.posicion <= 5 && (
                  <text
                    x={x + barWidth / 2} y={chartHeight + 14}
                    textAnchor="middle" fontSize={9}
                    fill={tokens.colors.textMuted}
                    fontFamily={tokens.fonts.body}
                  >
                    {item.posicion}
                  </text>
                )}
              </g>
            )
          })}
          {/* 80% line */}
          {(() => {
            const idx80 = items.findIndex(i => i.pct_acumulado >= 80)
            if (idx80 < 0) return null
            const x = (idx80 + 1) * (barWidth + 4) + 2
            return (
              <g>
                <line x1={x} y1={0} x2={x} y2={chartHeight} stroke={tokens.colors.primary} strokeWidth={2} strokeDasharray="6,3" />
                <text x={x + 6} y={14} fontSize={11} fill={tokens.colors.primary} fontFamily={tokens.fonts.body} fontWeight="600">
                  80%
                </text>
              </g>
            )
          })()}
          {/* Pareto curve */}
          <polyline
            points={items.map((item, i) => {
              const x = i * (barWidth + 4) + 4 + barWidth / 2
              const y = chartHeight - (item.pct_acumulado / 100) * (chartHeight - 20)
              return `${x},${y}`
            }).join(' ')}
            fill="none"
            stroke={tokens.colors.textPrimary}
            strokeWidth={2}
            opacity={0.6}
          />
        </svg>
      </div>
    )
  }

  // âââ Concentration gauge SVG âââââââââââââââââââââââ
  function ConcentrationGauge({ items80: count, total, pct }: { items80: number; total: number; pct: number }) {
    const angle = (pct / 100) * 360
    const r = 60
    const cx = 70
    const cy = 70

    function polarToCartesian(cx: number, cy: number, r: number, angleDeg: number) {
      const rad = ((angleDeg - 90) * Math.PI) / 180
      return { x: cx + r * Math.cos(rad), y: cy + r * Math.sin(rad) }
    }

    const start = polarToCartesian(cx, cy, r, 0)
    const end = polarToCartesian(cx, cy, r, Math.min(angle, 359.99))
    const largeArc = angle > 180 ? 1 : 0

    return (
      <div className="flex flex-col items-center">
        <svg width={140} height={140}>
          <circle cx={cx} cy={cy} r={r} fill="none" stroke={tokens.colors.border} strokeWidth={12} />
          <path
            d={`M ${start.x} ${start.y} A ${r} ${r} 0 ${largeArc} 1 ${end.x} ${end.y}`}
            fill="none"
            stroke={pct <= 30 ? tokens.colors.green : pct <= 50 ? tokens.colors.yellow : tokens.colors.red}
            strokeWidth={12}
            strokeLinecap="round"
          />
          <text x={cx} y={cy - 6} textAnchor="middle" fontSize={22} fontWeight="bold"
            fill={tokens.colors.textPrimary} fontFamily={tokens.fonts.mono}>
            {count}
          </text>
          <text x={cx} y={cy + 14} textAnchor="middle" fontSize={11}
            fill={tokens.colors.textMuted} fontFamily={tokens.fonts.body}>
            de {total}
          </text>
        </svg>
        <span className="text-xs mt-1" style={{ color: tokens.colors.textMuted, fontFamily: tokens.fonts.body }}>
          {pct}% genera el 80% del ingreso
        </span>
      </div>
    )
  }

  // âââ Table columns âââââââââââââââââââââââââââââââââ
  const columns: Column<ParetoItem>[] = [
    {
      key: 'posicion',
      label: '#',
      width: '50px',
      align: 'center',
      render: (row) => (
        <div className="flex items-center justify-center">
          {row.posicion <= 3 ? (
            <Award size={18} style={{ color: getMedalColor(row.posicion) }} />
          ) : (
            <span className="text-sm" style={{ color: tokens.colors.textMuted }}>{row.posicion}</span>
          )}
        </div>
      ),
    },
    {
      key: 'zona',
      label: 'Zona',
      width: '70px',
      align: 'center',
      render: (row) => <Badge color={getZonaColor(row.zona)}>{row.zona}</Badge>,
    },
    {
      key: 'label',
      label: getDimensionLabel(dimension),
      render: (row) => (
        <div>
          <span className="text-sm font-semibold" style={{ color: tokens.colors.textPrimary }}>
            {row.label}
          </span>
          {row.sublabel && (
            <span className="text-xs ml-2" style={{ color: tokens.colors.textMuted }}>
              {row.sublabel}
            </span>
          )}
        </div>
      ),
    },
    {
      key: 'viajes',
      label: 'Viajes',
      align: 'center',
      render: (row) => (
        <span className="text-sm font-medium" style={{ color: tokens.colors.textPrimary }}>
          {row.viajes}
        </span>
      ),
    },
    {
      key: 'ingreso',
      label: 'Ingreso',
      align: 'right',
      render: (row) => (
        <span className="text-sm" style={{ color: tokens.colors.textSecondary }}>
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
          {row.margen.toFixed(1)}%
        </Badge>
      ),
    },
    {
      key: 'pct_del_total',
      label: '% Total',
      align: 'center',
      render: (row) => (
        <div className="flex items-center gap-2">
          <div className="flex-1 h-2 rounded-full overflow-hidden" style={{ background: tokens.colors.border, minWidth: '60px' }}>
            <div
              className="h-full rounded-full transition-all"
              style={{
                width: `${Math.min(row.pct_del_total, 100)}%`,
                background: row.zona === 'A' ? tokens.colors.green : row.zona === 'B' ? tokens.colors.yellow : tokens.colors.red,
              }}
            />
          </div>
          <span className="text-xs font-medium" style={{ color: tokens.colors.textMuted, minWidth: '36px' }}>
            {row.pct_del_total}%
          </span>
        </div>
      ),
    },
    {
      key: 'pct_acumulado',
      label: '% Acum.',
      align: 'right',
      render: (row) => (
        <span className="text-sm font-medium" style={{
          color: row.pct_acumulado <= 80 ? tokens.colors.green : row.pct_acumulado <= 95 ? tokens.colors.yellow : tokens.colors.red,
          fontFamily: tokens.fonts.mono,
        }}>
          {row.pct_acumulado}%
        </span>
      ),
    },
  ]

  // âââ CSV Export ââââââââââââââââââââââââââââââââââââ
  const handleExportCSV = () => {
    if (!current?.detalle?.length) return
    const header = `Pos,${getDimensionLabel(dimension)},SubLabel,Viajes,Ingreso,Costo,Margen %,% Total,% Acumulado,Zona\n`
    const rows = current.detalle.map(r =>
      `${r.posicion},"${r.label}","${r.sublabel}",${r.viajes},${r.ingreso},${r.costo},${r.margen},${r.pct_del_total},${r.pct_acumulado},${r.zona}`
    ).join('\n')
    const blob = new Blob([header + rows], { type: 'text/csv;charset=utf-8;' })
    const link = document.createElement('a')
    link.href = URL.createObjectURL(blob)
    link.download = `pareto_${dimension}_${mes}.csv`
    link.click()
  }

  return (
    <ModuleLayout
      titulo="AnÃ¡lisis 80/20 (Pareto)"
      subtitulo="Identifica quÃ© 20% genera el 80% de tus ingresos"
      acciones={
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="sm" onClick={handleExportCSV} disabled={!current?.detalle?.length}>
            <Download size={16} />
            CSV
          </Button>
          <Button variant="secondary" size="sm" onClick={fetchData} loading={loading}>
            <RefreshCw size={16} />
            Actualizar
          </Button>
        </div>
      }
    >
      {/* Filtros */}
      <div className="flex flex-wrap gap-4 mb-6 items-end">
        <div style={{ minWidth: '200px' }}>
          <Select
            label="Mes"
            options={mesOptions}
            value={mes}
            onChange={(e) => setMes(e.target.value)}
          />
        </div>
        <Button variant="primary" size="md" onClick={fetchData} loading={loading}>
          Consultar
        </Button>
      </div>

      {/* Dimension pills */}
      <div className="flex gap-2 mb-6">
        {(['clientes', 'tractos', 'rutas'] as Dimension[]).map(dim => (
          <button
            key={dim}
            onClick={() => setDimension(dim)}
            className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all"
            style={{
              background: dimension === dim ? `${tokens.colors.primary}22` : tokens.colors.bgCard,
              color: dimension === dim ? tokens.colors.primary : tokens.colors.textSecondary,
              border: `1px solid ${dimension === dim ? tokens.colors.primary : tokens.colors.border}`,
              fontFamily: tokens.fonts.body,
            }}
          >
            {getDimensionIcon(dim)}
            {getDimensionLabel(dim)}
            {data?.[dim] && (
              <span className="text-xs opacity-70">({data[dim]!.totalItems})</span>
            )}
          </button>
        ))}
      </div>

      {/* Error */}
      {error && (
        <Card glow="red" className="mb-6">
          <div className="flex items-center gap-3">
            <Target size={20} style={{ color: tokens.colors.red }} />
            <p className="text-sm" style={{ color: tokens.colors.red, fontFamily: tokens.fonts.body }}>
              {error}
            </p>
          </div>
        </Card>
      )}

      {/* KPIs */}
      {current && (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-6">
          <KPICard
            titulo={getDimensionLabel(dimension)}
            valor={current.totalItems}
            color="blue"
            icono={getDimensionIcon(dimension)}
          />
          <KPICard
            titulo="Viajes"
            valor={current.totalViajes}
            color="gray"
            icono={<Truck size={18} />}
          />
          <KPICard
            titulo="Ingreso"
            valor={formatCurrency(current.totalIngreso)}
            color="primary"
            icono={<BarChart3 size={18} />}
          />
          <KPICard
            titulo="Margen"
            valor={`${current.margenGlobal}%`}
            color={current.margenGlobal >= 20 ? 'green' : 'yellow'}
            icono={<Percent size={18} />}
          />
          <KPICard
            titulo="Generan 80%"
            valor={current.items80pct}
            color="green"
            icono={<Award size={18} />}
          />
          <KPICard
            titulo="ConcentraciÃ³n"
            valor={`${current.concentracion}%`}
            color={current.concentracion <= 30 ? 'green' : current.concentracion <= 50 ? 'yellow' : 'red'}
            icono={<Target size={18} />}
          />
        </div>
      )}

      {/* Pareto chart + Gauge */}
      {current && current.detalle.length > 0 && (
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-4 mb-6">
          <Card className="lg:col-span-3">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-semibold" style={{ color: tokens.colors.textPrimary, fontFamily: tokens.fonts.heading }}>
                DistribuciÃ³n Pareto â {getDimensionLabel(dimension)}
              </h3>
              <button onClick={() => setShowGauge(!showGauge)} className="p-1" style={{ color: tokens.colors.textMuted }}>
                {showGauge ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
              </button>
            </div>
            {showGauge && <ParetoChart items={current.detalle} />}
            <div className="flex items-center gap-4 mt-2">
              <div className="flex items-center gap-1">
                <div className="w-3 h-3 rounded" style={{ background: tokens.colors.green }} />
                <span className="text-xs" style={{ color: tokens.colors.textMuted }}>Zona A (80%)</span>
              </div>
              <div className="flex items-center gap-1">
                <div className="w-3 h-3 rounded" style={{ background: tokens.colors.yellow }} />
                <span className="text-xs" style={{ color: tokens.colors.textMuted }}>Zona B (95%)</span>
              </div>
              <div className="flex items-center gap-1">
                <div className="w-3 h-3 rounded" style={{ background: tokens.colors.red }} />
                <span className="text-xs" style={{ color: tokens.colors.textMuted }}>Zona C (cola)</span>
              </div>
              <div className="flex items-center gap-1">
                <div className="w-6 h-0.5" style={{ borderTop: `2px dashed ${tokens.colors.primary}` }} />
                <span className="text-xs" style={{ color: tokens.colors.textMuted }}>LÃ­nea 80%</span>
              </div>
            </div>
          </Card>

          <Card className="flex items-center justify-center">
            <ConcentrationGauge
              items80={current.items80pct}
              total={current.totalItems}
              pct={current.concentracion}
            />
          </Card>
        </div>
      )}

      {/* Summary insight */}
      {current && current.detalle.length > 0 && (
        <Card glow="primary" className="mb-6">
          <div className="flex items-start gap-3">
            <TrendingUp size={20} style={{ color: tokens.colors.primary, marginTop: 2 }} />
            <div>
              <p className="text-sm font-semibold mb-1" style={{ color: tokens.colors.textPrimary, fontFamily: tokens.fonts.heading }}>
                Insight Pareto
              </p>
              <p className="text-sm" style={{ color: tokens.colors.textSecondary, fontFamily: tokens.fonts.body }}>
                {current.items80pct} {getDimensionLabel(dimension).toLowerCase()} ({current.concentracion}% del total)
                generan el 80% del ingreso ({formatCurrency(current.totalIngreso * 0.8)}).
                {current.concentracion <= 25
                  ? ' Alta concentraciÃ³n â riesgo de dependencia de pocos clientes.'
                  : current.concentracion <= 40
                  ? ' ConcentraciÃ³n moderada â buen balance.'
                  : ' DistribuciÃ³n equilibrada â ingresos bien diversificados.'}
              </p>
            </div>
          </div>
        </Card>
      )}

      {/* Tabla */}
      <Card noPadding>
        <DataTable
          columns={columns}
          data={current?.detalle ?? []}
          loading={loading}
          emptyMessage="No hay datos para este mes"
        />
      </Card>

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
