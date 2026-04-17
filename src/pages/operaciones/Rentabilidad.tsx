// Rentabilidad.tsx — V2 — Real financial data from viajes_anodos + tarifas
// Calculates estimated revenue per tracto using km × tarifa lookup
// Source: viajes_anodos (ANODOS sync), formatos_venta (km/equipo), tarifas_mx/tarifas_usa
import { useState, useEffect } from 'react'
import { DollarSign, TrendingUp, TrendingDown, Truck, RefreshCw, Download } from 'lucide-react'
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

interface TarifaMX {
  rango_km_min: number
  rango_km_max: number
  tarifa_por_km: number
  tipo_equipo: string
}
interface TarifaUSA {
  rango_millas_min: number
  rango_millas_max: number
  tarifa_por_milla: number
  tipo_equipo: string
}

interface TractoDetalle {
  tracto: string
  empresa: string
  viajes: number
  kmTotal: number
  ingresoEstimado: number
  costoEstimado: number
  margen: number
  margenPct: number
  utilizacion: number
  monedaMix: string
}

interface Resumen {
  totalTractos: number
  totalViajes: number
  ingresoTotal: number
  costoTotal: number
  margenTotal: number
  margenPct: number
  kmTotal: number
}

/* ─── Helpers ───────────────────────────────────── */

function getMargenColor(pct: number): string {
  if (pct >= 25) return tokens.colors.green
  if (pct >= 15) return tokens.colors.yellow
  if (pct >= 5) return tokens.colors.orange
  return tokens.colors.red
}

function formatCurrency(n: number): string {
  return new Intl.NumberFormat('es-MX', {
    style: 'currency',
    currency: 'MXN',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(n)
}

function formatPct(n: number): string {
  return `${n.toFixed(1)}%`
}

function formatNumber(n: number): string {
  return new Intl.NumberFormat('es-MX', { maximumFractionDigits: 0 }).format(n)
}

function lookupTarifaMX(km: number, equipo: string, tarifas: TarifaMX[]): number {
  const match = tarifas.find(
    (t) => km >= t.rango_km_min && km <= t.rango_km_max && t.tipo_equipo === equipo
  )
  if (match) return km * match.tarifa_por_km
  // Fallback: try without equipo match
  const fallback = tarifas.find((t) => km >= t.rango_km_min && km <= t.rango_km_max)
  return fallback ? km * fallback.tarifa_por_km : 0
}

function lookupTarifaUSA(km: number, equipo: string, tarifas: TarifaUSA[]): number {
  const millas = km / 1.609
  const match = tarifas.find(
    (t) => millas >= t.rango_millas_min && millas <= t.rango_millas_max && t.tipo_equipo === equipo
  )
  if (match) return millas * match.tarifa_por_milla
  const fallback = tarifas.find((t) => millas >= t.rango_millas_min && millas <= t.rango_millas_max)
  return fallback ? millas * fallback.tarifa_por_milla : 0
}

/* ─── Component ─────────────────────────────────── */

export default function Rentabilidad() {
  const [loading, setLoading] = useState(false)
  const [resumen, setResumen] = useState<Resumen | null>(null)
  const [detalle, setDetalle] = useState<TractoDetalle[]>([])
  const [error, setError] = useState<string | null>(null)

  // Filters
  const [empresa, setEmpresa] = useState('')
  const [periodoInicio, setPeriodoInicio] = useState(() => {
    const d = new Date()
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-01`
  })
  const [periodoFin, setPeriodoFin] = useState(() => {
    const d = new Date()
    const last = new Date(d.getFullYear(), d.getMonth() + 1, 0)
    return `${last.getFullYear()}-${String(last.getMonth() + 1).padStart(2, '0')}-${String(last.getDate()).padStart(2, '0')}`
  })

  const empresaOptions = [
    { value: '', label: 'Todas las empresas' },
    { value: 'TROB', label: 'TROB' },
    { value: 'WEXPRESS', label: 'WExpress' },
    { value: 'SHI', label: 'SpeedyHaul' },
    { value: 'TROB USA', label: 'TROB USA' },
  ]

  const fetchData = async () => {
    setLoading(true)
    setError(null)
    try {
      // 1. Load tarifas (small tables, load once)
      const [{ data: tarifasMX }, { data: tarifasUSA }] = await Promise.all([
        supabase.from('tarifas_mx').select('*'),
        supabase.from('tarifas_usa').select('*'),
      ])

      // 2. Load formatos_venta for km + equipo lookup (keyed by anodos_id)
      const formatoMap = new Map<number, { km: number; equipo: string; moneda: string; sueldo: number }>()
      let fOffset = 0
      while (true) {
        const { data: fChunk } = await supabase
          .from('formatos_venta')
          .select('anodos_id, km_total, refrigerado, moneda, sueldo_operador')
          .not('anodos_id', 'is', null)
          .range(fOffset, fOffset + 999)
        if (!fChunk || fChunk.length === 0) break
        for (const f of fChunk) {
          formatoMap.set(f.anodos_id, {
            km: f.km_total || 0,
            equipo: f.refrigerado ? 'refrigerado' : 'seco',
            moneda: f.moneda || 'MXN',
            sueldo: f.sueldo_operador || 0,
          })
        }
        if (fChunk.length < 1000) break
        fOffset += 1000
      }

      // 3. Load viajes_anodos in period (paginated)
      const allViajes: {
        tracto: string | null
        kms_viaje: number | null
        moneda: string
        id_formato_venta: number | null
        tipo: string | null
        cliente: string | null
      }[] = []
      let vOffset = 0
      while (true) {
        const { data: vChunk, error: vErr } = await supabase
          .from('viajes_anodos')
          .select('tracto, kms_viaje, moneda, id_formato_venta, tipo, cliente')
          .gte('inicia_viaje', `${periodoInicio}T00:00:00`)
          .lte('inicia_viaje', `${periodoFin}T23:59:59`)
          .range(vOffset, vOffset + 999)
        if (vErr) throw new Error(vErr.message)
        if (!vChunk || vChunk.length === 0) break
        allViajes.push(...vChunk)
        if (vChunk.length < 1000) break
        vOffset += 1000
      }

      if (allViajes.length === 0) {
        // Try fecha_crea as fallback (some viajes may not have inicia_viaje)
        let vOffset2 = 0
        while (true) {
          const { data: vChunk2 } = await supabase
            .from('viajes_anodos')
            .select('tracto, kms_viaje, moneda, id_formato_venta, tipo, cliente')
            .gte('fecha_crea', `${periodoInicio}T00:00:00`)
            .lte('fecha_crea', `${periodoFin}T23:59:59`)
            .range(vOffset2, vOffset2 + 999)
          if (!vChunk2 || vChunk2.length === 0) break
          allViajes.push(...vChunk2)
          if (vChunk2.length < 1000) break
          vOffset2 += 1000
        }
      }

      // 4. Group by tracto and calculate financials
      const tractoAgg = new Map<string, {
        viajes: number; kmTotal: number; ingreso: number; costo: number; monedas: Set<string>
      }>()

      for (const v of allViajes) {
        const tKey = v.tracto || 'SIN TRACTO'
        if (!tractoAgg.has(tKey)) {
          tractoAgg.set(tKey, { viajes: 0, kmTotal: 0, ingreso: 0, costo: 0, monedas: new Set() })
        }
        const agg = tractoAgg.get(tKey)!
        agg.viajes++

        // Get km: prefer viaje.kms_viaje, fallback to formato.km
        const fmt = v.id_formato_venta ? formatoMap.get(v.id_formato_venta) : null
        const km = v.kms_viaje || fmt?.km || 0
        const equipo = fmt?.equipo || 'seco'
        const moneda = v.moneda || fmt?.moneda || 'MXN'
        agg.kmTotal += km
        agg.monedas.add(moneda)

        // Calculate estimated revenue
        if (moneda === 'USD' && tarifasUSA) {
          agg.ingreso += lookupTarifaUSA(km, equipo, tarifasUSA as TarifaUSA[])
        } else if (tarifasMX) {
          agg.ingreso += lookupTarifaMX(km, equipo, tarifasMX as TarifaMX[])
        }

        // Cost estimate: sueldo operador (from formato) + diesel rough estimate ($8/km MXN)
        const sueldoPorViaje = fmt?.sueldo ? fmt.sueldo / 4 : 0
        const dieselEstimate = km * 8
        agg.costo += sueldoPorViaje + dieselEstimate
      }

      // 5. Build detalle array
      const daysInPeriod = Math.max(1, Math.ceil(
        (new Date(periodoFin).getTime() - new Date(periodoInicio).getTime()) / 86400000
      ) + 1)

      const detalleArr: TractoDetalle[] = Array.from(tractoAgg.entries())
        .map(([tKey, agg]) => {
          const margen = agg.ingreso - agg.costo
          const margenPct = agg.ingreso > 0 ? (margen / agg.ingreso) * 100 : 0
          return {
            tracto: tKey,
            empresa: '',
            viajes: agg.viajes,
            kmTotal: agg.kmTotal,
            ingresoEstimado: Math.round(agg.ingreso),
            costoEstimado: Math.round(agg.costo),
            margen: Math.round(margen),
            margenPct: Math.round(margenPct * 10) / 10,
            utilizacion: Math.min(100, (agg.viajes / daysInPeriod) * 100),
            monedaMix: Array.from(agg.monedas).join('/'),
          }
        })
        .sort((a, b) => b.ingresoEstimado - a.ingresoEstimado)

      // Enrich empresa from tractos table
      const { data: tractosDB } = await supabase
        .from('tractos')
        .select('numero_economico, empresa')
      if (tractosDB) {
        const empresaMap = new Map<string, string>()
        for (const t of tractosDB) {
          empresaMap.set(t.numero_economico, t.empresa || '')
        }
        for (const d of detalleArr) {
          d.empresa = empresaMap.get(d.tracto) || ''
        }
      }

      // 6. Compute resumen
      const totalIngreso = detalleArr.reduce((s, d) => s + d.ingresoEstimado, 0)
      const totalCosto = detalleArr.reduce((s, d) => s + d.costoEstimado, 0)
      const totalKm = detalleArr.reduce((s, d) => s + d.kmTotal, 0)
      const totalMargen = totalIngreso - totalCosto
      const totalMargenPct = totalIngreso > 0 ? (totalMargen / totalIngreso) * 100 : 0

      setResumen({
        totalTractos: detalleArr.length,
        totalViajes: allViajes.length,
        ingresoTotal: totalIngreso,
        costoTotal: totalCosto,
        margenTotal: totalMargen,
        margenPct: Math.round(totalMargenPct * 10) / 10,
        kmTotal: totalKm,
      })
      setDetalle(detalleArr)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error desconocido')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchData()
  }, [])

  const filteredDetalle = detalle.filter(
    (t) => !empresa || t.empresa === empresa
  )

  /* ─── Table Columns ───────────────────────────── */

  const columns: Column<TractoDetalle>[] = [
    {
      key: 'semaforo',
      label: '',
      width: '40px',
      render: (row) => (
        <span
          style={{
            display: 'inline-block', width: 10, height: 10, borderRadius: '50%',
            backgroundColor: getMargenColor(row.margenPct),
          }}
        />
      ),
    },
    {
      key: 'tracto',
      label: 'Tracto',
      render: (row) => (
        <span style={{ color: tokens.colors.textPrimary, fontWeight: 600 }}>
          {row.tracto}
        </span>
      ),
    },
    {
      key: 'empresa',
      label: 'Empresa',
      render: (row) => (
        <Badge color="blue">{row.empresa || '—'}</Badge>
      ),
    },
    {
      key: 'viajes',
      label: 'Viajes',
      align: 'center',
      render: (row) => (
        <span style={{ color: tokens.colors.textPrimary }}>{row.viajes}</span>
      ),
    },
    {
      key: 'kmTotal',
      label: 'Km',
      align: 'right',
      render: (row) => (
        <span style={{ color: tokens.colors.textSecondary }}>{formatNumber(row.kmTotal)}</span>
      ),
    },
    {
      key: 'ingresoEstimado',
      label: 'Ingreso Est.',
      align: 'right',
      render: (row) => (
        <span style={{ color: tokens.colors.green }}>{formatCurrency(row.ingresoEstimado)}</span>
      ),
    },
    {
      key: 'costoEstimado',
      label: 'Costo Est.',
      align: 'right',
      render: (row) => (
        <span style={{ color: tokens.colors.red }}>{formatCurrency(row.costoEstimado)}</span>
      ),
    },
    {
      key: 'margen',
      label: 'Margen',
      align: 'right',
      render: (row) => (
        <span style={{ color: row.margen >= 0 ? tokens.colors.green : tokens.colors.red, fontWeight: 600 }}>
          {formatCurrency(row.margen)}
        </span>
      ),
    },
    {
      key: 'margenPct',
      label: '% Margen',
      align: 'center',
      render: (row) => (
        <Badge color={row.margenPct >= 25 ? 'green' : row.margenPct >= 15 ? 'yellow' : row.margenPct >= 5 ? 'orange' : 'red'}>
          {formatPct(row.margenPct)}
        </Badge>
      ),
    },
    {
      key: 'utilizacion',
      label: 'Utilización',
      align: 'center',
      render: (row) => {
        const pct = row.utilizacion
        return (
          <div className="flex items-center gap-2">
            <div className="flex-1 h-2 rounded-full" style={{ background: tokens.colors.bgHover, minWidth: '60px' }}>
              <div
                className="h-full rounded-full transition-all"
                style={{
                  width: `${Math.min(pct, 100)}%`,
                  background: pct >= 70 ? tokens.colors.green : pct >= 40 ? tokens.colors.yellow : tokens.colors.red,
                }}
              />
            </div>
            <span className="text-xs" style={{ color: tokens.colors.textSecondary, minWidth: '36px', textAlign: 'right' }}>
              {formatPct(pct)}
            </span>
          </div>
        )
      },
    },
    {
      key: 'monedaMix',
      label: 'Moneda',
      align: 'center',
      render: (row) => (
        <span style={{ color: tokens.colors.textMuted, fontSize: '0.75rem' }}>{row.monedaMix || '—'}</span>
      ),
    },
  ]

  /* ─── Export CSV ───────────────────────────────── */

  const handleExportCSV = () => {
    if (!filteredDetalle.length) return
    const header = 'Tracto,Empresa,Viajes,Km,Ingreso,Costo,Margen,%Margen,Utilización,Moneda\n'
    const rows = filteredDetalle.map((r) =>
      `${r.tracto},${r.empresa},${r.viajes},${r.kmTotal},${r.ingresoEstimado},${r.costoEstimado},${r.margen},${r.margenPct},${r.utilizacion.toFixed(1)},${r.monedaMix}`
    ).join('\n')
    const blob = new Blob([header + rows], { type: 'text/csv;charset=utf-8;' })
    const link = document.createElement('a')
    link.href = URL.createObjectURL(blob)
    link.download = `rentabilidad_${periodoInicio}_${periodoFin}.csv`
    link.click()
  }

  /* ─── Render ──────────────────────────────────── */

  return (
    <ModuleLayout
      titulo="Rentabilidad por Tracto"
      moduloPadre={{ nombre: 'Operaciones', ruta: '/operaciones/dashboard' }}
      subtitulo="Ingreso estimado, costo y margen por unidad — datos ANODOS en tiempo real"
      acciones={
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="sm" onClick={handleExportCSV} disabled={!filteredDetalle.length}>
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
        <div>
          <label className="text-xs block mb-1" style={{ color: tokens.colors.textMuted, fontFamily: tokens.fonts.body }}>
            Período inicio
          </label>
          <input
            type="date"
            value={periodoInicio}
            onChange={(e) => setPeriodoInicio(e.target.value)}
            className="rounded-lg px-3 py-2 text-sm outline-none"
            style={{
              background: tokens.colors.bgHover,
              border: `1px solid ${tokens.colors.border}`,
              color: tokens.colors.textPrimary,
              fontFamily: tokens.fonts.body,
            }}
          />
        </div>
        <div>
          <label className="text-xs block mb-1" style={{ color: tokens.colors.textMuted, fontFamily: tokens.fonts.body }}>
            Período fin
          </label>
          <input
            type="date"
            value={periodoFin}
            onChange={(e) => setPeriodoFin(e.target.value)}
            className="rounded-lg px-3 py-2 text-sm outline-none"
            style={{
              background: tokens.colors.bgHover,
              border: `1px solid ${tokens.colors.border}`,
              color: tokens.colors.textPrimary,
              fontFamily: tokens.fonts.body,
            }}
          />
        </div>
        <div style={{ minWidth: '180px' }}>
          <Select
            label="Empresa"
            options={empresaOptions}
            value={empresa}
            onChange={(e) => setEmpresa(e.target.value)}
          />
        </div>
        <Button variant="primary" size="md" onClick={fetchData} loading={loading}>
          Consultar
        </Button>
      </div>

      {/* Error */}
      {error && (
        <Card glow="red" className="mb-6">
          <p className="text-sm" style={{ color: tokens.colors.red, fontFamily: tokens.fonts.body }}>
            {error}
          </p>
        </Card>
      )}

      {/* KPIs */}
      {resumen && (
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-4 mb-6">
          <KPICard titulo="Tractos" valor={resumen.totalTractos} color="blue" icono={<Truck size={18} />} />
          <KPICard titulo="Viajes" valor={formatNumber(resumen.totalViajes)} color="primary" icono={<TrendingUp size={18} />} />
          <KPICard titulo="Km Totales" valor={formatNumber(resumen.kmTotal)} color="blue" />
          <KPICard titulo="Ingreso Est." valor={formatCurrency(resumen.ingresoTotal)} color="green" icono={<DollarSign size={18} />} />
          <KPICard titulo="Costo Est." valor={formatCurrency(resumen.costoTotal)} color="red" icono={<TrendingDown size={18} />} />
          <KPICard
            titulo="Margen"
            valor={formatCurrency(resumen.margenTotal)}
            color={resumen.margenPct >= 15 ? 'green' : 'red'}
            icono={<DollarSign size={18} />}
          />
          <KPICard
            titulo="% Margen"
            valor={formatPct(resumen.margenPct)}
            color={resumen.margenPct >= 25 ? 'green' : resumen.margenPct >= 15 ? 'yellow' : 'red'}
          />
        </div>
      )}

      {/* Tabla */}
      <Card noPadding>
        <DataTable
          columns={columns}
          data={filteredDetalle}
          loading={loading}
          emptyMessage="No hay viajes con tracto asignado en este período"
        />
      </Card>
    </ModuleLayout>
  )
}
