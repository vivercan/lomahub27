// PresupuestoMensual.tsx – V2 – Real revenue from viajes_anodos + tarifas
// Shows per-client monthly revenue with estimated income from ANODOS data
import { useState, useEffect } from 'react'
import {
  DollarSign, TrendingUp, TrendingDown, AlertTriangle, RefreshCw,
  Download, Target, BarChart3, Award
} from 'lucide-react'
import { ModuleLayout } from '../../components/layout/ModuleLayout'
import { Card } from '../../components/ui/Card'
import { KPICard } from '../../components/ui/KPICard'
import { Button } from '../../components/ui/Button'
import { Select } from '../../components/ui/Select'
import { DataTable } from '../../components/ui/DataTable'
import type { Column } from '../../components/ui/DataTable'
import { Badge } from '../../components/ui/Badge'
import { Semaforo } from '../../components/ui/Semaforo'
import { tokens } from '../../lib/tokens'
import { supabase } from '../../lib/supabase'
import type { SemaforoEstado } from '../../lib/tokens'

/* ––– Types ––––––––––––––––––––––––––––––––––––––– */

interface TarifaMX { rango_km_min: number; rango_km_max: number; tarifa_por_km: number; tipo_equipo: string }
interface TarifaUSA { rango_millas_min: number; rango_millas_max: number; tarifa_por_milla: number; tipo_equipo: string }

interface ClientePresupuesto {
  cliente: string
  ingresoEstimado: number
  costoEstimado: number
  margenPct: number
  viajes: number
  kmTotal: number
  monedaMix: string
  tendencia: 'alza' | 'baja' | 'estable'
}

interface Resumen {
  totalClientes: number
  ingresoTotal: number
  costoTotal: number
  margenPct: number
  totalViajes: number
  totalKm: number
  clienteTop: string
}

/* ––– Helpers ––––––––––––––––––––––––––––––––––––– */

function formatCurrency(n: number): string {
  return new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN', minimumFractionDigits: 0 }).format(n)
}

function formatPct(n: number): string {
  return `${n.toFixed(1)}%`
}

function formatNumber(n: number): string {
  return new Intl.NumberFormat('es-MX', { maximumFractionDigits: 0 }).format(n)
}

function getSemaforo(margenPct: number): SemaforoEstado {
  if (margenPct >= 25) return 'verde'
  if (margenPct >= 15) return 'amarillo'
  if (margenPct >= 5) return 'naranja'
  return 'rojo'
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

/* ––– Component ––––––––––––––––––––––––––––––––––– */

export default function PresupuestoMensual() {
  const [loading, setLoading] = useState(false)
  const [resumen, setResumen] = useState<Resumen | null>(null)
  const [detalle, setDetalle] = useState<ClientePresupuesto[]>([])
  const [error, setError] = useState<string | null>(null)

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

      // 2. Load formatos_venta
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

      // 3. Load viajes_anodos in period
      interface ViajeRow {
        cliente: string | null; kms_viaje: number | null; moneda: string
        id_formato_venta: number | null
      }
      const allViajes: ViajeRow[] = []
      let vOff = 0
      while (true) {
        const { data: vc, error: vErr } = await supabase
          .from('viajes_anodos')
          .select('cliente, kms_viaje, moneda, id_formato_venta')
          .gte('inicia_viaje', mesStart)
          .lte('inicia_viaje', mesEnd)
          .range(vOff, vOff + 999)
        if (vErr) throw new Error(vErr.message)
        if (!vc || vc.length === 0) break
        allViajes.push(...vc)
        if (vc.length < 1000) break
        vOff += 1000
      }

      // Fallback to fecha_crea
      if (allViajes.length === 0) {
        let vOff2 = 0
        while (true) {
          const { data: vc2 } = await supabase
            .from('viajes_anodos')
            .select('cliente, kms_viaje, moneda, id_formato_venta')
            .gte('fecha_crea', mesStart)
            .lte('fecha_crea', mesEnd)
            .range(vOff2, vOff2 + 999)
          if (!vc2 || vc2.length === 0) break
          allViajes.push(...vc2)
          if (vc2.length < 1000) break
          vOff2 += 1000
        }
      }

      // 4. Also load previous month for trend comparison
      const prevMonth = parseInt(mesNum) === 1
        ? `${parseInt(anio) - 1}-12`
        : `${anio}-${String(parseInt(mesNum) - 1).padStart(2, '0')}`
      const [pAnio, pMes] = prevMonth.split('-')
      const pLastDay = new Date(parseInt(pAnio), parseInt(pMes), 0).getDate()
      const pStart = `${pAnio}-${pMes}-01T00:00:00`
      const pEnd = `${pAnio}-${pMes}-${String(pLastDay).padStart(2, '0')}T23:59:59`

      const prevClienteViajes = new Map<string, number>()
      let pOff = 0
      while (true) {
        const { data: pc } = await supabase
          .from('viajes_anodos')
          .select('cliente')
          .gte('inicia_viaje', pStart)
          .lte('inicia_viaje', pEnd)
          .range(pOff, pOff + 999)
        if (!pc || pc.length === 0) break
        for (const p of pc) {
          const c = p.cliente || 'SIN CLIENTE'
          prevClienteViajes.set(c, (prevClienteViajes.get(c) || 0) + 1)
        }
        if (pc.length < 1000) break
        pOff += 1000
      }

      // 5. Aggregate by cliente
      interface Agg { viajes: number; km: number; ingreso: number; costo: number; monedas: Set<string> }
      const clienteAgg = new Map<string, Agg>()

      for (const v of allViajes) {
        const cKey = v.cliente || 'SIN CLIENTE'
        if (!clienteAgg.has(cKey)) {
          clienteAgg.set(cKey, { viajes: 0, km: 0, ingreso: 0, costo: 0, monedas: new Set() })
        }
        const agg = clienteAgg.get(cKey)!
        agg.viajes++

        const fmt = v.id_formato_venta ? formatoMap.get(v.id_formato_venta) : null
        const km = v.kms_viaje || fmt?.km || 0
        const equipo = fmt?.equipo || 'seco'
        const moneda = v.moneda || fmt?.moneda || 'MXN'
        agg.km += km
        agg.monedas.add(moneda)

        if (moneda === 'USD' && tarifasUSA) {
          agg.ingreso += lookupTarifaUSA(km, equipo, tarifasUSA as TarifaUSA[])
        } else if (tarifasMX) {
          agg.ingreso += lookupTarifaMX(km, equipo, tarifasMX as TarifaMX[])
        }
        const sueldoPorViaje = fmt?.sueldo ? fmt.sueldo / 4 : 0
        agg.costo += sueldoPorViaje + km * 8
      }

      // 6. Build detalle
      const detalleArr: ClientePresupuesto[] = Array.from(clienteAgg.entries())
        .map(([cKey, agg]) => {
          const margenPct = agg.ingreso > 0 ? ((agg.ingreso - agg.costo) / agg.ingreso) * 100 : 0
          const prevViajes = prevClienteViajes.get(cKey) || 0
          let tendencia: 'alza' | 'baja' | 'estable' = 'estable'
          if (agg.viajes > prevViajes * 1.1) tendencia = 'alza'
          else if (agg.viajes < prevViajes * 0.9) tendencia = 'baja'

          return {
            cliente: cKey,
            ingresoEstimado: Math.round(agg.ingreso),
            costoEstimado: Math.round(agg.costo),
            margenPct: Math.round(margenPct * 10) / 10,
            viajes: agg.viajes,
            kmTotal: agg.km,
            monedaMix: Array.from(agg.monedas).join('/'),
            tendencia,
          }
        })
        .sort((a, b) => b.ingresoEstimado - a.ingresoEstimado)

      // 7. Resumen
      const totalIngreso = detalleArr.reduce((s, d) => s + d.ingresoEstimado, 0)
      const totalCosto = detalleArr.reduce((s, d) => s + d.costoEstimado, 0)
      const totalKm = detalleArr.reduce((s, d) => s + d.kmTotal, 0)
      const totalMargenPct = totalIngreso > 0 ? ((totalIngreso - totalCosto) / totalIngreso) * 100 : 0

      setResumen({
        totalClientes: detalleArr.length,
        ingresoTotal: totalIngreso,
        costoTotal: totalCosto,
        margenPct: Math.round(totalMargenPct * 10) / 10,
        totalViajes: allViajes.length,
        totalKm: totalKm,
        clienteTop: detalleArr[0]?.cliente || '–',
      })
      setDetalle(detalleArr)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error desconocido')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { fetchData() }, [])

  /* ––– Table columns ––––––––––––––––––––––––––––– */

  const columns: Column<ClientePresupuesto>[] = [
    {
      key: 'semaforo', label: '', width: '40px',
      render: (row) => <Semaforo estado={getSemaforo(row.margenPct)} size="sm" />,
    },
    {
      key: 'cliente', label: 'Cliente',
      render: (row) => (
        <span className="text-sm font-semibold" style={{ color: tokens.colors.textPrimary }}>
          {row.cliente}
        </span>
      ),
    },
    {
      key: 'viajes', label: 'Viajes', align: 'center',
      render: (row) => <span className="text-sm" style={{ color: tokens.colors.textPrimary }}>{row.viajes}</span>,
    },
    {
      key: 'kmTotal', label: 'Km', align: 'right',
      render: (row) => <span className="text-sm" style={{ color: tokens.colors.textSecondary }}>{formatNumber(row.kmTotal)}</span>,
    },
    {
      key: 'ingresoEstimado', label: 'Ingreso Est.', align: 'right',
      render: (row) => <span className="text-sm font-semibold" style={{ color: tokens.colors.green }}>{formatCurrency(row.ingresoEstimado)}</span>,
    },
    {
      key: 'costoEstimado', label: 'Costo Est.', align: 'right',
      render: (row) => <span className="text-sm" style={{ color: tokens.colors.red }}>{formatCurrency(row.costoEstimado)}</span>,
    },
    {
      key: 'margenPct', label: '% Margen', align: 'center',
      render: (row) => (
        <Badge color={row.margenPct >= 25 ? 'green' : row.margenPct >= 15 ? 'yellow' : row.margenPct >= 5 ? 'orange' : 'red'}>
          {formatPct(row.margenPct)}
        </Badge>
      ),
    },
    {
      key: 'monedaMix', label: 'Moneda', align: 'center',
      render: (row) => <span className="text-xs" style={{ color: tokens.colors.textMuted }}>{row.monedaMix}</span>,
    },
    {
      key: 'tendencia', label: 'Tendencia', align: 'center',
      render: (row) => {
        if (row.tendencia === 'alza') return <TrendingUp size={16} style={{ color: tokens.colors.green }} />
        if (row.tendencia === 'baja') return <TrendingDown size={16} style={{ color: tokens.colors.red }} />
        return <span style={{ color: tokens.colors.gray }}>–</span>
      },
    },
  ]

  /* ––– CSV Export –––––––––––––––––––––––––––––––– */

  const handleExportCSV = () => {
    if (!detalle.length) return
    const header = 'Cliente,Viajes,Km,Ingreso,Costo,%Margen,Moneda,Tendencia\n'
    const rows = detalle.map(r =>
      `"${r.cliente}",${r.viajes},${r.kmTotal},${r.ingresoEstimado},${r.costoEstimado},${r.margenPct},${r.monedaMix},${r.tendencia}`
    ).join('\n')
    const blob = new Blob([header + rows], { type: 'text/csv;charset=utf-8;' })
    const link = document.createElement('a')
    link.href = URL.createObjectURL(blob)
    link.download = `ingreso_mensual_${mes}.csv`
    link.click()
  }

  /* ––– Render –––––––––––––––––––––––––––––––––––– */

  return (
    <ModuleLayout
      titulo="Ingreso Mensual por Cliente"
      subtitulo="Ingreso estimado, costo y margen por cliente – datos ANODOS en tiempo real"
      acciones={
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="sm" onClick={handleExportCSV} disabled={!detalle.length}>
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

      {/* Error */}
      {error && (
        <Card glow="red" className="mb-6">
          <div className="flex items-center gap-3">
            <AlertTriangle size={20} style={{ color: tokens.colors.red }} />
            <p className="text-sm" style={{ color: tokens.colors.red, fontFamily: tokens.fonts.body }}>{error}</p>
          </div>
        </Card>
      )}

      {/* KPIs */}
      {resumen && (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-7 gap-4 mb-6">
          <KPICard titulo="Clientes" valor={resumen.totalClientes} color="blue" icono={<BarChart3 size={18} />} />
          <KPICard titulo="Viajes" valor={formatNumber(resumen.totalViajes)} color="primary" icono={<TrendingUp size={18} />} />
          <KPICard titulo="Km Totales" valor={formatNumber(resumen.totalKm)} color="blue" />
          <KPICard titulo="Ingreso Est." valor={formatCurrency(resumen.ingresoTotal)} color="green" icono={<DollarSign size={18} />} />
          <KPICard titulo="Costo Est." valor={formatCurrency(resumen.costoTotal)} color="red" icono={<TrendingDown size={18} />} />
          <KPICard
            titulo="% Margen"
            valor={formatPct(resumen.margenPct)}
            color={resumen.margenPct >= 25 ? 'green' : resumen.margenPct >= 15 ? 'yellow' : 'red'}
            icono={<Target size={18} />}
          />
          <KPICard titulo="Top Cliente" valor={resumen.clienteTop} color="primary" icono={<Award size={18} />} />
        </div>
      )}

      {/* Gauge */}
      {resumen && (
        <Card className="mb-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs uppercase tracking-wider" style={{ color: tokens.colors.textMuted, fontFamily: tokens.fonts.body }}>
                Ingreso Total del Mes
              </p>
              <p className="text-3xl font-bold mt-1" style={{
                color: resumen.margenPct >= 15 ? tokens.colors.green : tokens.colors.red,
                fontFamily: tokens.fonts.heading,
              }}>
                {formatCurrency(resumen.ingresoTotal)}
              </p>
              <p className="text-sm mt-1" style={{ color: tokens.colors.textSecondary, fontFamily: tokens.fonts.body }}>
                Margen: {formatCurrency(resumen.ingresoTotal - resumen.costoTotal)} ({formatPct(resumen.margenPct)})
              </p>
            </div>
            <div className="w-24 h-24 relative">
              <svg viewBox="0 0 36 36" className="w-full h-full">
                <path
                  d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                  fill="none" stroke={tokens.colors.bgHover} strokeWidth="3"
                />
                <path
                  d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                  fill="none"
                  stroke={resumen.margenPct >= 25 ? tokens.colors.green : resumen.margenPct >= 15 ? tokens.colors.yellow : tokens.colors.red}
                  strokeWidth="3"
                  strokeDasharray={`${Math.min(resumen.margenPct, 100)}, 100`}
                  strokeLinecap="round"
                />
              </svg>
              <div className="absolute inset-0 flex items-center justify-center">
                <Target size={20} style={{ color: resumen.margenPct >= 15 ? tokens.colors.green : tokens.colors.red }} />
              </div>
            </div>
          </div>
        </Card>
      )}

      {/* Tabla */}
      <Card noPadding>
        <DataTable columns={columns} data={detalle} loading={loading} emptyMessage="No hay viajes para este mes" />
      </Card>
    </ModuleLayout>
  )
}
