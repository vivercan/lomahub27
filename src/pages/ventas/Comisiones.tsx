import { useState, useEffect } from 'react'
import {
  DollarSign, TrendingUp, Users, Truck, RefreshCw, Download, Award, Target, Percent
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
interface EjecutivoComision {
  posicion: number
  ejecutivo_id: string
  nombre: string
  email: string
  empresa: string
  rol: string
  viajes: number
  clientes: number
  clientes_nuevos: number
  ingreso: number
  costo: number
  margen: number
  base_comision: number
  pct_aplicado: number
  pct_nuevos: number
  comision: number
}

interface ComisionesResponse {
  ok: boolean
  mes: string
  config: {
    comision_pct_default: number
    comision_pct_nuevo_cliente: number
    comision_sobre: string
  }
  resumen: {
    totalEjecutivos: number
    totalViajes: number
    totalIngreso: number
    totalComisiones: number
    comisionPromedio: number
  }
  detalle: EjecutivoComision[]
  mensaje?: string
}

// Ã¢ÂÂÃ¢ÂÂÃ¢ÂÂ Helpers Ã¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂ
function formatCurrency(n: number): string {
  return new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN', minimumFractionDigits: 0 }).format(n)
}

function formatPct(n: number): string {
  return `${n.toFixed(1)}%`
}

function getMedalColor(pos: number): string {
  if (pos === 1) return '#FFD700'
  if (pos === 2) return '#C0C0C0'
  if (pos === 3) return '#CD7F32'
  return tokens.colors.textMuted
}

function getComisionSemaforo(comision: number, promedio: number): SemaforoEstado {
  if (comision >= promedio * 1.5) return 'verde'
  if (comision >= promedio) return 'amarillo'
  if (comision >= promedio * 0.5) return 'naranja'
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

export default function Comisiones() {
  const [loading, setLoading] = useState(false)
  const [data, setData] = useState<ComisionesResponse | null>(null)
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
      const mesStart = `${anio}-${mesNum}-01`
      const lastDay = new Date(parseInt(anio), parseInt(mesNum), 0).getDate()
      const mesEnd = `${anio}-${mesNum}-${String(lastDay).padStart(2, '0')}`

      const { data: viajes, error: vErr } = await supabase
        .from('viajes')
        .select('id, cliente_id, origen, destino, created_at')
        .gte('created_at', `${mesStart}T00:00:00`)
        .lte('created_at', `${mesEnd}T23:59:59`)
      if (vErr) throw new Error(vErr.message)

      const { data: _clientes } = await supabase.from('clientes').select('id, razon_social')
      void _clientes // available for future use
      const totalViajes = viajes?.length || 0
      const uniqueClientes = new Set((viajes || []).map(v => v.cliente_id).filter(Boolean))

      const detalle: EjecutivoComision[] = totalViajes > 0 ? [{
        posicion: 1, ejecutivo_id: 'agg', nombre: 'Todos los ejecutivos',
        email: '', empresa: 'TROB', rol: 'ventas',
        viajes: totalViajes, clientes: uniqueClientes.size, clientes_nuevos: 0,
        ingreso: 0, costo: 0, margen: 0,
        base_comision: 0, pct_aplicado: 0, pct_nuevos: 0, comision: 0,
      }] : []

      setData({
        ok: true,
        mes: `${anio}-${mesNum}`,
        config: { comision_pct_default: 3, comision_pct_nuevo_cliente: 5, comision_sobre: 'margen' },
        resumen: {
          totalEjecutivos: detalle.length, totalViajes: totalViajes,
          totalIngreso: 0, totalComisiones: 0, comisionPromedio: 0,
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

  const promedio = data?.resumen?.comisionPromedio || 0

  // Ã¢ÂÂÃ¢ÂÂÃ¢ÂÂ Table columns Ã¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂ
  const columns: Column<EjecutivoComision>[] = [
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
      key: 'semaforo',
      label: '',
      width: '40px',
      render: (row) => <Semaforo estado={getComisionSemaforo(row.comision, promedio)} size="sm" />,
    },
    {
      key: 'nombre',
      label: 'Ejecutivo',
      render: (row) => (
        <div>
          <span className="text-sm font-semibold" style={{ color: tokens.colors.textPrimary }}>
            {row.nombre}
          </span>
          <span className="text-xs ml-2" style={{ color: tokens.colors.textMuted }}>
            {row.empresa}
          </span>
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
      key: 'clientes',
      label: 'Clientes',
      align: 'center',
      render: (row) => (
        <div className="flex items-center justify-center gap-1">
          <span className="text-sm" style={{ color: tokens.colors.textSecondary }}>{row.clientes}</span>
          {row.clientes_nuevos > 0 && (
            <Badge color="green">+{row.clientes_nuevos} nuevos</Badge>
          )}
        </div>
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
          {formatPct(row.margen)}
        </Badge>
      ),
    },
    {
      key: 'base_comision',
      label: 'Base',
      align: 'right',
      render: (row) => (
        <span className="text-sm" style={{ color: tokens.colors.textMuted }}>
          {formatCurrency(row.base_comision)}
        </span>
      ),
    },
    {
      key: 'comision',
      label: 'ComisiÃÂ³n',
      align: 'right',
      render: (row) => (
        <span className="text-sm font-bold" style={{ color: tokens.colors.green }}>
          {formatCurrency(row.comision)}
        </span>
      ),
    },
  ]

  // Ã¢ÂÂÃ¢ÂÂÃ¢ÂÂ CSV Export Ã¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂ
  const handleExportCSV = () => {
    if (!filteredDetalle.length) return
    const header = 'Pos,Ejecutivo,Empresa,Viajes,Clientes,Nuevos,Ingreso,Costo,Margen %,Base ComisiÃÂ³n,% Aplicado,ComisiÃÂ³n\n'
    const rows = filteredDetalle.map(r =>
      `${r.posicion},"${r.nombre}",${r.empresa},${r.viajes},${r.clientes},${r.clientes_nuevos},${r.ingreso},${r.costo},${r.margen.toFixed(1)},${r.base_comision},${r.pct_aplicado},${r.comision}`
    ).join('\n')
    const blob = new Blob([header + rows], { type: 'text/csv;charset=utf-8;' })
    const link = document.createElement('a')
    link.href = URL.createObjectURL(blob)
    link.download = `comisiones_${mes}.csv`
    link.click()
  }

  return (
    <ModuleLayout
      titulo="Comisiones por Ejecutivo"
      subtitulo="CÃÂ¡lculo automÃÂ¡tico de comisiones sobre viajes facturados"
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
            <Target size={20} style={{ color: tokens.colors.red }} />
            <p className="text-sm" style={{ color: tokens.colors.red, fontFamily: tokens.fonts.body }}>
              {error}
            </p>
          </div>
        </Card>
      )}

      {/* KPIs */}
      {data?.resumen && (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4 mb-6">
          <KPICard
            titulo="Ejecutivos"
            valor={data.resumen.totalEjecutivos}
            color="blue"
            icono={<Users size={18} />}
          />
          <KPICard
            titulo="Viajes"
            valor={data.resumen.totalViajes}
            color="gray"
            icono={<Truck size={18} />}
          />
          <KPICard
            titulo="Ingreso Total"
            valor={formatCurrency(data.resumen.totalIngreso)}
            color="primary"
            icono={<DollarSign size={18} />}
          />
          <KPICard
            titulo="Total Comisiones"
            valor={formatCurrency(data.resumen.totalComisiones)}
            color="green"
            icono={<Award size={18} />}
          />
          <KPICard
            titulo="ComisiÃÂ³n Promedio"
            valor={formatCurrency(data.resumen.comisionPromedio)}
            color="yellow"
            icono={<TrendingUp size={18} />}
          />
        </div>
      )}

      {/* Config info */}
      {data?.config && (
        <Card className="mb-6">
          <div className="flex items-center gap-6 flex-wrap">
            <div className="flex items-center gap-2">
              <Percent size={16} style={{ color: tokens.colors.textMuted }} />
              <span className="text-xs" style={{ color: tokens.colors.textMuted, fontFamily: tokens.fonts.body }}>
                ComisiÃÂ³n estÃÂ¡ndar:
              </span>
              <span className="text-sm font-semibold" style={{ color: tokens.colors.primary }}>
                {data.config.comision_pct_default}%
              </span>
            </div>
            <div className="flex items-center gap-2">
              <TrendingUp size={16} style={{ color: tokens.colors.green }} />
              <span className="text-xs" style={{ color: tokens.colors.textMuted, fontFamily: tokens.fonts.body }}>
                Clientes nuevos:
              </span>
              <span className="text-sm font-semibold" style={{ color: tokens.colors.green }}>
                {data.config.comision_pct_nuevo_cliente}%
              </span>
            </div>
            <div className="flex items-center gap-2">
              <DollarSign size={16} style={{ color: tokens.colors.textMuted }} />
              <span className="text-xs" style={{ color: tokens.colors.textMuted, fontFamily: tokens.fonts.body }}>
                Calcula sobre:
              </span>
              <Badge color="blue">
                {data.config.comision_sobre === 'margen' ? 'Margen' : 'Ingreso'}
              </Badge>
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
          emptyMessage="No hay datos de comisiones para este mes"
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
