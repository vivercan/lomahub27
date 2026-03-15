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
import { Semaforo } from '../../components/ui/Semaforo'
import { tokens } from '../../lib/tokens'
import { supabase } from '../../lib/supabase'
import type { SemaforoEstado } from '../../lib/tokens'

interface TractoDetalle {
  tracto_id: string
  numero_economico: string
  empresa: string
  viajes: number
  ingresoEstimado: number
  costoEstimado: number
  margen: number
  margenPct: number
  utilizacion: number
}

interface RentabilidadResponse {
  ok: boolean
  periodo: { inicio: string; fin: string }
  resumen: {
    totalTractos: number
    totalViajes: number
    ingresoTotal: number
    costoTotal: number
    margenTotal: number
    margenPct: number
  }
  detalle: TractoDetalle[]
  mensaje?: string
}

function getSemaforoFromMargen(pct: number): SemaforoEstado {
  if (pct >= 25) return 'verde'
  if (pct >= 15) return 'amarillo'
  if (pct >= 5) return 'naranja'
  return 'rojo'
}

function formatCurrency(n: number): string {
  return new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN', minimumFractionDigits: 0 }).format(n)
}

function formatPct(n: number): string {
  return `${n.toFixed(1)}%`
}

export default function Rentabilidad() {
  const [loading, setLoading] = useState(false)
  const [data, setData] = useState<RentabilidadResponse | null>(null)
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
    { value: 'Carroll', label: 'Carroll' },
  ]

  const fetchData = async () => {
    setLoading(true)
    setError(null)
    try {
      const { data: sessionData } = await supabase.auth.getSession()
      const token = sessionData.session?.access_token
      if (!token) throw new Error('SesiÃ³n expirada')

      const res = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/rentabilidad-tracto`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            periodo_inicio: periodoInicio,
            periodo_fin: periodoFin,
          }),
        }
      )
      const json: RentabilidadResponse = await res.json()
      if (!json.ok) throw new Error(json.mensaje || 'Error al obtener datos')
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

  const filteredDetalle = data?.detalle?.filter(
    (t) => !empresa || t.empresa === empresa
  ) ?? []

  const columns: Column<TractoDetalle>[] = [
    {
      key: 'semaforo',
      label: '',
      width: '40px',
      render: (row) => <Semaforo estado={getSemaforoFromMargen(row.margenPct)} size="sm" />,
    },
    {
      key: 'numero_economico',
      label: 'Tracto',
      render: (row) => (
        <span style={{ color: tokens.colors.textPrimary, fontWeight: 600 }}>
          {row.numero_economico}
        </span>
      ),
    },
    {
      key: 'empresa',
      label: 'Empresa',
      render: (row) => <Badge color="blue">{row.empresa}</Badge>,
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
      key: 'ingresoEstimado',
      label: 'Ingreso',
      align: 'right',
      render: (row) => (
        <span style={{ color: tokens.colors.green }}>{formatCurrency(row.ingresoEstimado)}</span>
      ),
    },
    {
      key: 'costoEstimado',
      label: 'Costo',
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
      label: 'UtilizaciÃ³n',
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
  ]

  const handleExportCSV = () => {
    if (!filteredDetalle.length) return
    const header = 'Tracto,Empresa,Viajes,Ingreso,Costo,Margen,% Margen,UtilizaciÃ³n\n'
    const rows = filteredDetalle.map(r =>
      `${r.numero_economico},${r.empresa},${r.viajes},${r.ingresoEstimado},${r.costoEstimado},${r.margen},${r.margenPct},${r.utilizacion}`
    ).join('\n')
    const blob = new Blob([header + rows], { type: 'text/csv;charset=utf-8;' })
    const link = document.createElement('a')
    link.href = URL.createObjectURL(blob)
    link.download = `rentabilidad_${periodoInicio}_${periodoFin}.csv`
    link.click()
  }

  return (
    <ModuleLayout
      titulo="Rentabilidad por Tracto"
      subtitulo="Ingreso, costo, margen y utilizaciÃ³n por unidad"
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
            PerÃ­odo inicio
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
            PerÃ­odo fin
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
      {data?.resumen && (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-6">
          <KPICard
            titulo="Tractos"
            valor={data.resumen.totalTractos}
            color="blue"
            icono={<Truck size={18} />}
          />
          <KPICard
            titulo="Viajes"
            valor={data.resumen.totalViajes}
            color="primary"
            icono={<TrendingUp size={18} />}
          />
          <KPICard
            titulo="Ingreso"
            valor={formatCurrency(data.resumen.ingresoTotal)}
            color="green"
            icono={<DollarSign size={18} />}
          />
          <KPICard
            titulo="Costo"
            valor={formatCurrency(data.resumen.costoTotal)}
            color="red"
            icono={<TrendingDown size={18} />}
          />
          <KPICard
            titulo="Margen"
            valor={formatCurrency(data.resumen.margenTotal)}
            color={data.resumen.margenPct >= 15 ? 'green' : 'red'}
            icono={<DollarSign size={18} />}
          />
          <KPICard
            titulo="% Margen"
            valor={formatPct(data.resumen.margenPct)}
            color={data.resumen.margenPct >= 25 ? 'green' : data.resumen.margenPct >= 15 ? 'yellow' : 'red'}
          />
        </div>
      )}

      {/* Tabla */}
      <Card noPadding>
        <DataTable
          columns={columns}
          data={filteredDetalle}
          loading={loading}
          emptyMessage="No hay tractos con datos en este perÃ­odo"
        />
      </Card>
    </ModuleLayout>
  )
}
