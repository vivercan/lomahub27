import { useState, useEffect } from 'react'
import {
  DollarSign, TrendingUp, TrendingDown, AlertTriangle, RefreshCw,
  Download, Target, BarChart3
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

// Ã¢ÂÂÃ¢ÂÂÃ¢ÂÂ Types Ã¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂ
interface ClientePresupuesto {
  cliente_id: string
  razon_social: string
  empresa: string
  presupuesto: number
  real: number
  diferencia: number
  cumplimiento_pct: number
  viajes_presupuesto: number
  viajes_real: number
  tendencia: 'alza' | 'baja' | 'estable'
}

interface PresupuestoResponse {
  ok: boolean
  mes: string
  anio: number
  resumen: {
    totalClientes: number
    presupuestoTotal: number
    realTotal: number
    cumplimientoPct: number
    superavit: number
    clientesBajoCumplimiento: number
  }
  detalle: ClientePresupuesto[]
  mensaje?: string
}

// Ã¢ÂÂÃ¢ÂÂÃ¢ÂÂ Helpers Ã¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂ
function formatCurrency(n: number): string {
  return new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN', minimumFractionDigits: 0 }).format(n)
}

function formatPct(n: number): string {
  return `${n.toFixed(1)}%`
}

function getSemaforo(pct: number): SemaforoEstado {
  if (pct >= 95) return 'verde'
  if (pct >= 80) return 'amarillo'
  if (pct >= 60) return 'naranja'
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

export default function PresupuestoMensual() {
  const [loading, setLoading] = useState(false)
  const [data, setData] = useState<PresupuestoResponse | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [empresa, setEmpresa] = useState('')

  const now = new Date()
  const [mes, setMes] = useState(`${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`)

  const mesOptions = getMonthOptions()
  const empresaOptions = [
    { value: '', label: 'Todas las empresas' },
    { value: 'TROB', label: 'TROB' },
    { value: 'Carroll', label: 'Carroll' },
  ]

  const fetchData = async () => {
    setLoading(true)
    setError(null)
    try {
      const [anio, mesNum] = mes.split('-')
      const mesInt = parseInt(mesNum)
      const anioInt = parseInt(anio)

      // Query presupuestos and viajes directly
      const startDate = `${anio}-${mesNum}-01T00:00:00`
      const endDate = new Date(anioInt, mesInt, 0)
      const endDateStr = `${anio}-${mesNum}-${String(endDate.getDate()).padStart(2, '0')}T23:59:59`

      const { data: viajes } = await supabase
        .from('viajes')
        .select('id, cliente_id, created_at')
        .gte('created_at', startDate)
        .lte('created_at', endDateStr)

      const { data: clientes } = await supabase
        .from('clientes')
        .select('id, razon_social, empresa')

      // Build empty response if no data
      const clienteMap = new Map((clientes || []).map(c => [c.id, c]))
      const clienteViajes = new Map<string, number>()
      ;(viajes || []).forEach(v => {
        if (v.cliente_id) clienteViajes.set(v.cliente_id, (clienteViajes.get(v.cliente_id) || 0) + 1)
      })

      const detalle: ClientePresupuesto[] = Array.from(clienteViajes.entries()).map(([cid, count]) => {
        const cli = clienteMap.get(cid)
        return {
          cliente_id: cid,
          razon_social: cli?.razon_social || cid,
          empresa: cli?.empresa || '',
          presupuesto: 0,
          real: 0,
          diferencia: 0,
          cumplimiento_pct: 0,
          viajes_presupuesto: 0,
          viajes_real: count,
          tendencia: 'estable' as const,
        }
      })

      setData({
        ok: true,
        mes: mesNum,
        anio: anioInt,
        resumen: {
          totalClientes: clienteViajes.size,
          presupuestoTotal: 0,
          realTotal: 0,
          cumplimientoPct: 0,
          superavit: 0,
          clientesBajoCumplimiento: 0,
        },
        detalle,
      })
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
    (c) => !empresa || c.empresa === empresa
  ) ?? []

  // Ã¢ÂÂÃ¢ÂÂÃ¢ÂÂ Table columns Ã¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂ
  const columns: Column<ClientePresupuesto>[] = [
    {
      key: 'semaforo',
      label: '',
      width: '40px',
      render: (row) => <Semaforo estado={getSemaforo(row.cumplimiento_pct)} size="sm" />,
    },
    {
      key: 'razon_social',
      label: 'Cliente',
      render: (row) => (
        <div>
          <span className="text-sm font-semibold" style={{ color: tokens.colors.textPrimary }}>
            {row.razon_social}
          </span>
          <span className="text-xs ml-2" style={{ color: tokens.colors.textMuted }}>
            {row.empresa}
          </span>
        </div>
      ),
    },
    {
      key: 'presupuesto',
      label: 'Presupuesto',
      align: 'right',
      render: (row) => (
        <span className="text-sm" style={{ color: tokens.colors.textSecondary }}>
          {formatCurrency(row.presupuesto)}
        </span>
      ),
    },
    {
      key: 'real',
      label: 'Real',
      align: 'right',
      render: (row) => (
        <span className="text-sm font-semibold" style={{ color: tokens.colors.primary }}>
          {formatCurrency(row.real)}
        </span>
      ),
    },
    {
      key: 'diferencia',
      label: 'Diferencia',
      align: 'right',
      render: (row) => (
        <span
          className="text-sm font-semibold"
          style={{ color: row.diferencia >= 0 ? tokens.colors.green : tokens.colors.red }}
        >
          {row.diferencia >= 0 ? '+' : ''}{formatCurrency(row.diferencia)}
        </span>
      ),
    },
    {
      key: 'cumplimiento_pct',
      label: 'Cumplimiento',
      align: 'center',
      render: (row) => {
        const pct = row.cumplimiento_pct
        return (
          <div className="flex items-center gap-2">
            <div className="flex-1 h-2 rounded-full" style={{ background: tokens.colors.bgHover, minWidth: '60px' }}>
              <div
                className="h-full rounded-full transition-all"
                style={{
                  width: `${Math.min(pct, 100)}%`,
                  background: pct >= 95 ? tokens.colors.green : pct >= 80 ? tokens.colors.yellow : tokens.colors.red,
                }}
              />
            </div>
            <Badge color={pct >= 95 ? 'green' : pct >= 80 ? 'yellow' : pct >= 60 ? 'orange' : 'red'}>
              {formatPct(pct)}
            </Badge>
          </div>
        )
      },
    },
    {
      key: 'viajes',
      label: 'Viajes (P/R)',
      align: 'center',
      render: (row) => (
        <span className="text-sm" style={{ color: tokens.colors.textSecondary }}>
          {row.viajes_presupuesto} / <span style={{ color: tokens.colors.textPrimary, fontWeight: 600 }}>{row.viajes_real}</span>
        </span>
      ),
    },
    {
      key: 'tendencia',
      label: 'Tendencia',
      align: 'center',
      render: (row) => {
        if (row.tendencia === 'alza') return <TrendingUp size={16} style={{ color: tokens.colors.green }} />
        if (row.tendencia === 'baja') return <TrendingDown size={16} style={{ color: tokens.colors.red }} />
        return <span style={{ color: tokens.colors.gray }}>Ã¢ÂÂ</span>
      },
    },
  ]

  // Ã¢ÂÂÃ¢ÂÂÃ¢ÂÂ CSV Export Ã¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂ
  const handleExportCSV = () => {
    if (!filteredDetalle.length) return
    const header = 'Cliente,Empresa,Presupuesto,Real,Diferencia,Cumplimiento %,Viajes Pres,Viajes Real,Tendencia\n'
    const rows = filteredDetalle.map(r =>
      `"${r.razon_social}",${r.empresa},${r.presupuesto},${r.real},${r.diferencia},${r.cumplimiento_pct},${r.viajes_presupuesto},${r.viajes_real},${r.tendencia}`
    ).join('\n')
    const blob = new Blob([header + rows], { type: 'text/csv;charset=utf-8;' })
    const link = document.createElement('a')
    link.href = URL.createObjectURL(blob)
    link.download = `presupuesto_${mes}.csv`
    link.click()
  }

  const cumplColor = data?.resumen
    ? data.resumen.cumplimientoPct >= 95 ? tokens.colors.green
      : data.resumen.cumplimientoPct >= 80 ? tokens.colors.yellow
      : tokens.colors.red
    : tokens.colors.gray

  return (
    <ModuleLayout
      titulo="Presupuesto Mensual"
      subtitulo="Presupuesto vs real por cliente Ã¢ÂÂ facturaciÃÂ³n y viajes"
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
        <div style={{ minWidth: '200px' }}>
          <Select
            label="Mes"
            options={mesOptions}
            value={mes}
            onChange={(e) => setMes(e.target.value)}
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
          <div className="flex items-center gap-3">
            <AlertTriangle size={20} style={{ color: tokens.colors.red }} />
            <p className="text-sm" style={{ color: tokens.colors.red, fontFamily: tokens.fonts.body }}>
              {error}
            </p>
          </div>
        </Card>
      )}

      {/* KPIs */}
      {data?.resumen && (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-6">
          <KPICard
            titulo="Clientes"
            valor={data.resumen.totalClientes}
            color="blue"
            icono={<BarChart3 size={18} />}
          />
          <KPICard
            titulo="Presupuesto"
            valor={formatCurrency(data.resumen.presupuestoTotal)}
            color="gray"
            icono={<Target size={18} />}
          />
          <KPICard
            titulo="Real"
            valor={formatCurrency(data.resumen.realTotal)}
            color="primary"
            icono={<DollarSign size={18} />}
          />
          <KPICard
            titulo="Cumplimiento"
            valor={formatPct(data.resumen.cumplimientoPct)}
            color={data.resumen.cumplimientoPct >= 95 ? 'green' : data.resumen.cumplimientoPct >= 80 ? 'yellow' : 'red'}
            icono={<TrendingUp size={18} />}
          />
          <KPICard
            titulo="SuperÃÂ¡vit/DÃÂ©ficit"
            valor={formatCurrency(data.resumen.superavit)}
            color={data.resumen.superavit >= 0 ? 'green' : 'red'}
            icono={<DollarSign size={18} />}
          />
          <KPICard
            titulo="Bajo Meta"
            valor={data.resumen.clientesBajoCumplimiento}
            subtitulo="clientes < 80%"
            color={data.resumen.clientesBajoCumplimiento > 0 ? 'red' : 'green'}
            icono={<AlertTriangle size={18} />}
          />
        </div>
      )}

      {/* Overall cumplimiento gauge */}
      {data?.resumen && (
        <Card className="mb-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs uppercase tracking-wider" style={{ color: tokens.colors.textMuted, fontFamily: tokens.fonts.body }}>
                Cumplimiento Global
              </p>
              <p className="text-3xl font-bold mt-1" style={{ color: cumplColor, fontFamily: tokens.fonts.heading }}>
                {formatPct(data.resumen.cumplimientoPct)}
              </p>
              <p className="text-sm mt-1" style={{ color: tokens.colors.textSecondary, fontFamily: tokens.fonts.body }}>
                {formatCurrency(data.resumen.realTotal)} de {formatCurrency(data.resumen.presupuestoTotal)} presupuestados
              </p>
            </div>
            <div className="w-24 h-24 relative">
              <svg viewBox="0 0 36 36" className="w-full h-full">
                <path
                  d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                  fill="none"
                  stroke={tokens.colors.bgHover}
                  strokeWidth="3"
                />
                <path
                  d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                  fill="none"
                  stroke={cumplColor}
                  strokeWidth="3"
                  strokeDasharray={`${Math.min(data.resumen.cumplimientoPct, 100)}, 100`}
                  strokeLinecap="round"
                />
              </svg>
              <div className="absolute inset-0 flex items-center justify-center">
                <Target size={20} style={{ color: cumplColor }} />
              </div>
            </div>
          </div>
        </Card>
      )}

      {/* Tabla */}
      <Card noPadding>
        <DataTable
          columns={columns}
          data={filteredDetalle}
          loading={loading}
          emptyMessage="No hay datos de presupuesto para este mes"
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
