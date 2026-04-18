// Analisis8020.tsx — V2 — Real financial data from viajes_anodos + tarifas
// Pareto analysis with actual estimated revenue per cliente/tracto/ruta
import { useState, useEffect } from 'react'
import {
  BarChart3, TrendingUp, Users, Truck, Map as MapIcon, RefreshCw, Download,
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

/* ─── Types ─────────────────────────────────────── */

interface TarifaMX { rango_km_min: number; rango_km_max: number; tarifa_por_km: number; tipo_equipo: string }
interface TarifaUSA { rango_millas_min: number; rango_millas_max: number; tarifa_por_milla: number; tipo_equipo: string }

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

type Dimension = 'clientes' | 'tractos' | 'rutas'

/* ─── Helpers ───────────────────────────────────── */

function formatCurrency(n: number): string {
  return new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN', minimumFractionDigits: 0 }).format(n)
}

function formatNumber(n: number): string {
  return new Intl.NumberFormat('es-MX', { maximumFractionDigits: 0 }).format(n)
}

function getZonaColor(zona: string): 'green' | 'yellow' | 'red' {
  if (zona === 'A') return 'green'
  if (zona === 'B') return 'yellow'
  return 'red'
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
  return <MapIcon size={18} />
}

function getDimensionLabel(dim: Dimension) {
  if (dim === 'clientes') return 'Clientes'
  if (dim === 'tractos') return 'Tractos'
  return 'Rutas'
}

function lookupTarifaMX(km: number, equipo: string, tarifas: TarifaMX[]): number {
  const match = tarifas.find(t => km >= t.rango_km_min && km <= t.rango_km_max && t.tipo_equipo === equipo)
  if (match) return km * match.tarifa_por_km
  const fallback = tarifas.find(t => km >= t.rango_km_min && km <= t.rango_km_max)
  return fallback ? km * fallback.tarifa_por_km : 0
}

function lookupTarifaUSA(km: number, equipo: string, tarifas: TarifaUSA[]): number {
  const millas = km / 1.609
  const match = tarifas.find(t => millas >= t.rango_millas_min && millas <= t.rango_millas_max && t.tipo_equipo === equipo)
  if (match) return millas * match.tarifa_por_milla
  const fallback = tarifas.find(t => millas >= t.rango_millas_min && millas <= t.rango_millas_max)
  return fallback ? millas * fallback.tarifa_por_milla : 0
}

/* ─── Component ─────────────────────────────────── */

export default function Analisis8020() {
  const [loading, setLoading] = useState(false)
  const [data, setData] = useState<{ clientes?: ParetoResult; tractos?: ParetoResult; rutas?: ParetoResult } | null>(null)
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
      const [anio, mesNum] = mes.split('-')
      const lastDay = new Date(parseInt(anio), parseInt(mesNum), 0).getDate()
      const mesStart = `${anio}-${mesNum}-01T00:00:00`
      const mesEnd = `${anio}-${mesNum}-${String(lastDay).padStart(2, '0')}T23:59:59`

      // 1. Load tarifas
      const [{ data: tarifasMX }, { data: tarifasUSA }] = await Promise.all([
        supabase.from('tarifas_mx').select('*'),
        supabase.from('tarifas_usa').select('*'),
      ])

      // 2. Load formatos_venta for km + equipo
      const formatoMap = new Map<number, { km: number; equipo: string; moneda: string; sueldo: number }>()
      let fOff = 0
      while (true) {
        const { data: fc } = await supabase
          .from('formatos_venta')
          .select('anodos_id, km_total, refrigerado, moneda, sueldo_operador')
          .not('anodos_id', 'is', null)
          .range(fOff, fOff + 999)
        if (!fc || fc.length === 0) break
        for (const f of fc) {
          formatoMap.set(f.anodos_id, {
            km: f.km_total || 0,
            equipo: f.refrigerado ? 'refrigerado' : 'seco',
            moneda: f.moneda || 'MXN',
            sueldo: f.sueldo_operador || 0,
          })
        }
        if (fc.length < 1000) break
        fOff += 1000
      }

      // 3. Load viajes_anodos in period (paginated)
      interface ViajeRow {
        tracto: string | null; kms_viaje: number | null; moneda: string
        id_formato_venta: number | null; cliente: string | null
        origen: string | null; destino: string | null
      }
      const allViajes: ViajeRow[] = []
      let vOff = 0
      while (true) {
        const { data: vc, error: vErr } = await supabase
          .from('viajes_anodos')
          .select('tracto, kms_viaje, moneda, id_formato_venta, cliente, origen, destino')
          .gte('inicia_viaje', mesStart)
          .lte('inicia_viaje', mesEnd)
          .range(vOff, vOff + 999)
        if (vErr) throw new Error(vErr.message)
        if (!vc || vc.length === 0) break
        allViajes.push(...vc)
        if (vc.length < 1000) break
        vOff += 1000
      }

      // Fallback to fecha_crea if no inicia_viaje results
      if (allViajes.length === 0) {
        let vOff2 = 0
        while (true) {
          const { data: vc2 } = await supabase
            .from('viajes_anodos')
            .select('tracto, kms_viaje, moneda, id_formato_venta, cliente, origen, destino')
            .gte('fecha_crea', mesStart)
            .lte('fecha_crea', mesEnd)
            .range(vOff2, vOff2 + 999)
          if (!vc2 || vc2.length === 0) break
          allViajes.push(...vc2)
          if (vc2.length < 1000) break
          vOff2 += 1000
        }
      }

      // 4. Calculate per-viaje financials and aggregate by 3 dimensions
      interface Agg { viajes: number; ingreso: number; costo: number }
      const clienteAgg = new Map<string, Agg>()
      const tractoAgg = new Map<string, Agg>()
      const rutaAgg = new Map<string, Agg>()

      for (const v of allViajes) {
        const fmt = v.id_formato_venta ? formatoMap.get(v.id_formato_venta) : null
        const km = v.kms_viaje || fmt?.km || 0
        const equipo = fmt?.equipo || 'seco'
        const moneda = v.moneda || fmt?.moneda || 'MXN'

        let ingreso = 0
        if (moneda === 'USD' && tarifasUSA) {
          ingreso = lookupTarifaUSA(km, equipo, tarifasUSA as TarifaUSA[])
        } else if (tarifasMX) {
          ingreso = lookupTarifaMX(km, equipo, tarifasMX as TarifaMX[])
        }
        const sueldoPorViaje = fmt?.sueldo ? fmt.sueldo / 4 : 0
        const costo = sueldoPorViaje + km * 8

        // Cliente
        const cKey = v.cliente || 'SIN CLIENTE'
        const cA = clienteAgg.get(cKey) || { viajes: 0, ingreso: 0, costo: 0 }
        cA.viajes++; cA.ingreso += ingreso; cA.costo += costo
        clienteAgg.set(cKey, cA)

        // Tracto
        const tKey = v.tracto || 'SIN TRACTO'
        const tA = tractoAgg.get(tKey) || { viajes: 0, ingreso: 0, costo: 0 }
        tA.viajes++; tA.ingreso += ingreso; tA.costo += costo
        tractoAgg.set(tKey, tA)

        // Ruta
        const rKey = `${v.origen || '?'} → ${v.destino || '?'}`
        const rA = rutaAgg.get(rKey) || { viajes: 0, ingreso: 0, costo: 0 }
        rA.viajes++; rA.ingreso += ingreso; rA.costo += costo
        rutaAgg.set(rKey, rA)
      }

      // 5. Build Pareto lists
      const buildPareto = (agg: Map<string, Agg>): ParetoItem[] => {
        const totalIngreso = Array.from(agg.values()).reduce((s, a) => s + a.ingreso, 0)
        const sorted = Array.from(agg.entries()).sort((a, b) => b[1].ingreso - a[1].ingreso)
        let acum = 0
        return sorted.map(([key, a], idx) => {
          const pct = totalIngreso > 0 ? (a.ingreso / totalIngreso) * 100 : 0
          acum += pct
          const margenPct = a.ingreso > 0 ? ((a.ingreso - a.costo) / a.ingreso) * 100 : 0
          return {
            posicion: idx + 1,
            id: key,
            label: key,
            sublabel: '',
            ingreso: Math.round(a.ingreso),
            costo: Math.round(a.costo),
            margen: Math.round(margenPct * 10) / 10,
            viajes: a.viajes,
            pct_del_total: Math.round(pct * 10) / 10,
            pct_acumulado: Math.round(acum * 10) / 10,
            zona: (acum <= 80 ? 'A' : acum <= 95 ? 'B' : 'C') as 'A' | 'B' | 'C',
          }
        })
      }

      const buildResult = (items: ParetoItem[]): ParetoResult => {
        const totalIngreso = items.reduce((s, i) => s + i.ingreso, 0)
        const totalCosto = items.reduce((s, i) => s + i.costo, 0)
        const items80 = items.filter(x => x.zona === 'A').length
        const top20Count = Math.max(1, Math.ceil(items.length * 0.2))
        const concentracion = items.slice(0, top20Count).reduce((s, i) => s + i.pct_del_total, 0)
        const margenGlobal = totalIngreso > 0 ? Math.round(((totalIngreso - totalCosto) / totalIngreso) * 1000) / 10 : 0
        return {
          totalItems: items.length,
          totalIngreso: Math.round(totalIngreso),
          totalCosto: Math.round(totalCosto),
          totalViajes: allViajes.length,
          margenGlobal,
          items80pct: items80,
          concentracion: Math.round(concentracion * 10) / 10,
          detalle: items,
        }
      }

      setData({
        clientes: buildResult(buildPareto(clienteAgg)),
        tractos: buildResult(buildPareto(tractoAgg)),
        rutas: buildResult(buildPareto(rutaAgg)),
      })
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error desconocido')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { fetchData() }, [])

  const current: ParetoResult | null = data?.[dimension] ?? null

  /* ─── Pareto bar chart (SVG) ──────────────────── */

  function ParetoChart({ items }: { items: ParetoItem[] }) {
    if (!items.length) return null
    const maxIngreso = items[0]?.ingreso || 1
    const barWidth = Math.max(8, Math.min(40, 600 / items.length))
    const chartWidth = Math.max(600, items.length * (barWidth + 4))
    const chartHeight = 200

    return (
      <div className="overflow-x-auto mb-4">
        <svg width={chartWidth} height={chartHeight + 30} style={{ minWidth: '100%' }}>
          {items.map((item, i) => {
            const barH = maxIngreso > 0 ? (item.ingreso / maxIngreso) * (chartHeight - 20) : 0
            const x = i * (barWidth + 4) + 4
            const y = chartHeight - barH
            const color = item.zona === 'A' ? tokens.colors.green : item.zona === 'B' ? tokens.colors.yellow : tokens.colors.red
            return (
              <g key={item.id}>
                <rect x={x} y={y} width={barWidth} height={barH} fill={color} rx={2} opacity={0.85} />
                {item.posicion <= 5 && (
                  <text x={x + barWidth / 2} y={chartHeight + 14} textAnchor="middle" fontSize={9}
                    fill={tokens.colors.textMuted} fontFamily={tokens.fonts.body}>
                    {item.posicion}
                  </text>
                )}
              </g>
            )
          })}
          {(() => {
            const idx80 = items.findIndex(i => i.pct_acumulado >= 80)
            if (idx80 < 0) return null
            const x = (idx80 + 1) * (barWidth + 4) + 2
            return (
              <g>
                <line x1={x} y1={0} x2={x} y2={chartHeight} stroke={tokens.colors.primary} strokeWidth={2} strokeDasharray="6,3" />
                <text x={x + 6} y={14} fontSize={11} fill={tokens.colors.primary} fontFamily={tokens.fonts.body} fontWeight="600">80%</text>
              </g>
            )
          })()}
          <polyline
            points={items.map((item, i) => {
              const x = i * (barWidth + 4) + 4 + barWidth / 2
              const y = chartHeight - (item.pct_acumulado / 100) * (chartHeight - 20)
              return `${x},${y}`
            }).join(' ')}
            fill="none" stroke={tokens.colors.textPrimary} strokeWidth={2} opacity={0.6}
          />
        </svg>
      </div>
    )
  }

  /* ─── Concentration gauge SVG ─────────────────── */

  function ConcentrationGauge({ items80: count, total, pct }: { items80: number; total: number; pct: number }) {
    const angle = (pct / 100) * 360
    const r = 60, cx = 70, cy = 70
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
            strokeWidth={12} strokeLinecap="round"
          />
          <text x={cx} y={cy - 6} textAnchor="middle" fontSize={22} fontWeight="bold"
            fill={tokens.colors.textPrimary} fontFamily={"'Courier New', monospace"}>
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

  /* ─── Table columns ───────────────────────────── */

  const columns: Column<ParetoItem>[] = [
    {
      key: 'posicion', label: '#', width: '50px', align: 'center',
      render: (row) => (
        <div className="flex items-center justify-center">
          {row.posicion <= 3 ? <Award size={18} style={{ color: getMedalColor(row.posicion) }} />
            : <span className="text-sm" style={{ color: tokens.colors.textMuted }}>{row.posicion}</span>}
        </div>
      ),
    },
    {
      key: 'zona', label: 'Zona', width: '70px', align: 'center',
      render: (row) => <Badge color={getZonaColor(row.zona)}>{row.zona}</Badge>,
    },
    {
      key: 'label', label: getDimensionLabel(dimension),
      render: (row) => (
        <span className="text-sm font-semibold" style={{ color: tokens.colors.textPrimary }}>{row.label}</span>
      ),
    },
    {
      key: 'viajes', label: 'Viajes', align: 'center',
      render: (row) => <span className="text-sm font-medium" style={{ color: tokens.colors.textPrimary }}>{row.viajes}</span>,
    },
    {
      key: 'ingreso', label: 'Ingreso Est.', align: 'right',
      render: (row) => <span className="text-sm" style={{ color: tokens.colors.green }}>{formatCurrency(row.ingreso)}</span>,
    },
    {
      key: 'margen', label: '% Margen', align: 'center',
      render: (row) => (
        <Badge color={row.margen >= 25 ? 'green' : row.margen >= 15 ? 'yellow' : 'red'}>
          {row.margen.toFixed(1)}%
        </Badge>
      ),
    },
    {
      key: 'pct_del_total', label: '% Total', align: 'center',
      render: (row) => (
        <div className="flex items-center gap-2">
          <div className="flex-1 h-2 rounded-full overflow-hidden" style={{ background: tokens.colors.border, minWidth: '60px' }}>
            <div className="h-full rounded-full transition-all" style={{
              width: `${Math.min(row.pct_del_total, 100)}%`,
              background: row.zona === 'A' ? tokens.colors.green : row.zona === 'B' ? tokens.colors.yellow : tokens.colors.red,
            }} />
          </div>
          <span className="text-xs font-medium" style={{ color: tokens.colors.textMuted, minWidth: '36px' }}>
            {row.pct_del_total}%
          </span>
        </div>
      ),
    },
    {
      key: 'pct_acumulado', label: '% Acum.', align: 'right',
      render: (row) => (
        <span className="text-sm font-medium" style={{
          color: row.pct_acumulado <= 80 ? tokens.colors.green : row.pct_acumulado <= 95 ? tokens.colors.yellow : tokens.colors.red,
          fontFamily: "'Courier New', monospace",
        }}>
          {row.pct_acumulado}%
        </span>
      ),
    },
  ]

  /* ─── CSV Export ──────────────────────────────── */

  const handleExportCSV = () => {
    if (!current?.detalle?.length) return
    const header = `Pos,${getDimensionLabel(dimension)},Viajes,Ingreso,Costo,Margen %,% Total,% Acumulado,Zona\n`
    const rows = current.detalle.map(r =>
      `${r.posicion},"${r.label}",${r.viajes},${r.ingreso},${r.costo},${r.margen},${r.pct_del_total},${r.pct_acumulado},${r.zona}`
    ).join('\n')
    const blob = new Blob([header + rows], { type: 'text/csv;charset=utf-8;' })
    const link = document.createElement('a')
    link.href = URL.createObjectURL(blob)
    link.download = `pareto_${dimension}_${mes}.csv`
    link.click()
  }

  /* ─── Render ──────────────────────────────────── */

  return (
    <ModuleLayout
      titulo="Análisis 80/20 (Pareto)"
      subtitulo="Identifica qué 20% genera el 80% de tus ingresos — datos ANODOS en tiempo real"
      moduloPadre={{ nombre: 'Comercial', ruta: '/ventas/dashboard' }}
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
          <Select label="Mes" options={mesOptions} value={mes} onChange={(e) => setMes(e.target.value)} />
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
            {data?.[dim] && <span className="text-xs opacity-70">({data[dim]!.totalItems})</span>}
          </button>
        ))}
      </div>

      {/* Error */}
      {error && (
        <Card glow="red" className="mb-6">
          <div className="flex items-center gap-3">
            <Target size={20} style={{ color: tokens.colors.red }} />
            <p className="text-sm" style={{ color: tokens.colors.red, fontFamily: tokens.fonts.body }}>{error}</p>
          </div>
        </Card>
      )}

      {/* KPIs */}
      {current && (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-6">
          <KPICard titulo={getDimensionLabel(dimension)} valor={current.totalItems} color="blue" icono={getDimensionIcon(dimension)} />
          <KPICard titulo="Viajes" valor={formatNumber(current.totalViajes)} color="gray" icono={<Truck size={18} />} />
          <KPICard titulo="Ingreso Est." valor={formatCurrency(current.totalIngreso)} color="primary" icono={<BarChart3 size={18} />} />
          <KPICard titulo="Margen" valor={`${current.margenGlobal}%`} color={current.margenGlobal >= 20 ? 'green' : 'yellow'} icono={<Percent size={18} />} />
          <KPICard titulo="Generan 80%" valor={current.items80pct} color="green" icono={<Award size={18} />} />
          <KPICard titulo="Concentración" valor={`${current.concentracion}%`}
            color={current.concentracion <= 30 ? 'green' : current.concentracion <= 50 ? 'yellow' : 'red'} icono={<Target size={18} />} />
        </div>
      )}

      {/* Pareto chart + Gauge */}
      {current && current.detalle.length > 0 && (
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-4 mb-6">
          <Card className="lg:col-span-3">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-semibold" style={{ color: tokens.colors.textPrimary, fontFamily: tokens.fonts.heading }}>
                Distribución Pareto — {getDimensionLabel(dimension)}
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
                <span className="text-xs" style={{ color: tokens.colors.textMuted }}>Línea 80%</span>
              </div>
            </div>
          </Card>
          <Card className="flex items-center justify-center">
            <ConcentrationGauge items80={current.items80pct} total={current.totalItems} pct={current.concentracion} />
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
                generan el 80% del ingreso estimado ({formatCurrency(current.totalIngreso * 0.8)}).
                Margen global: {current.margenGlobal}%.
                {current.concentracion <= 25
                  ? ' Alta concentración — riesgo de dependencia de pocos clientes.'
                  : current.concentracion <= 40
                  ? ' Concentración moderada — buen balance.'
                  : ' Distribución equilibrada — ingresos bien diversificados.'}
              </p>
            </div>
          </div>
        </Card>
      )}

      {/* Tabla */}
      <Card noPadding>
        <DataTable columns={columns} data={current?.detalle ?? []} loading={loading} emptyMessage="No hay datos para este mes" />
      </Card>
    </ModuleLayout>
  )
}
