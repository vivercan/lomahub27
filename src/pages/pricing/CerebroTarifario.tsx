import { useState, useEffect } from 'react'
import { DollarSign, TrendingUp, Percent, Route, Search, Plus, RefreshCw } from 'lucide-react'
import { ModuleLayout } from '../../components/layout/ModuleLayout'
import { Card } from '../../components/ui/Card'
import { Button } from '../../components/ui/Button'
import { Badge } from '../../components/ui/Badge'
import { KPICard } from '../../components/ui/KPICard'
import { DataTable, type Column } from '../../components/ui/DataTable'
import { tokens } from '../../lib/tokens'
import { supabase } from '../../lib/supabase'

interface Tarifa {
  id: string
  origen: string
  destino: string
  cliente?: string
  tipo_equipo: 'caja_seca' | 'refrigerado' | 'plataforma' | 'tolva' | 'full'
  tarifa_venta: number
  costo_flete: number
  margen_pct: number
  vigencia_inicio: string
  vigencia_fin: string
  estado: 'vigente' | 'vencida' | 'pendiente'
  moneda: 'MXN' | 'USD'
  actualizado_por?: string
}

const estadoColores: Record<string, 'green' | 'yellow' | 'red' | 'gray'> = {
  vigente: 'green',
  vencida: 'red',
  pendiente: 'yellow',
}

const equipoColores: Record<string, 'primary' | 'green' | 'blue' | 'orange' | 'yellow'> = {
  caja_seca: 'primary',
  refrigerado: 'blue',
  plataforma: 'green',
  tolva: 'orange',
  full: 'yellow',
}

export default function CerebroTarifario() {
  const [tarifas, setTarifas] = useState<Tarifa[]>([])
  const [loading, setLoading] = useState(true)
  const [busqueda, setBusqueda] = useState('')
  const [filtroEstado, setFiltroEstado] = useState<string | null>(null)

  useEffect(() => {
    fetchTarifas()
  }, [])

  async function fetchTarifas() {
    setLoading(true)
    const { data, error } = await supabase
      .from('tarifas')
      .select('*')
      .order('vigencia_fin', { ascending: false })
      .limit(300)
    if (!error && data) setTarifas(data)
    setLoading(false)
  }

  const filtered = tarifas.filter(t => {
    if (filtroEstado && t.estado !== filtroEstado) return false
    if (busqueda) {
      const q = busqueda.toLowerCase()
      return t.origen.toLowerCase().includes(q) || t.destino.toLowerCase().includes(q) || (t.cliente || '').toLowerCase().includes(q)
    }
    return true
  })

  const totalTarifas = tarifas.length
  const vigentes = tarifas.filter(t => t.estado === 'vigente').length
  const margenPromedio = tarifas.length > 0 ? (tarifas.reduce((s, t) => s + (t.margen_pct || 0), 0) / tarifas.length).toFixed(1) : '0'
  const rutasUnicas = new Set(tarifas.map(t => `${t.origen}-${t.destino}`)).size

  const fmt = (n: number, mon: string) => {
    const prefix = mon === 'USD' ? 'US$' : '$'
    return `${prefix}${n.toLocaleString('es-MX', { minimumFractionDigits: 0 })}`
  }

  const columns: Column<Tarifa>[] = [
    {
      key: 'ruta', label: 'Ruta',
      render: (row) => (
        <div>
          <div style={{ color: tokens.colors.textPrimary, fontFamily: tokens.fonts.body, fontSize: '13px', fontWeight: 600 }}>
            {row.origen} → {row.destino}
          </div>
          {row.cliente && (
            <div style={{ color: tokens.colors.textMuted, fontFamily: tokens.fonts.body, fontSize: '11px' }}>{row.cliente}</div>
          )}
        </div>
      )
    },
    {
      key: 'tipo_equipo', label: 'Equipo', width: '120px',
      render: (row) => <Badge color={equipoColores[row.tipo_equipo] || 'gray'}>{row.tipo_equipo.replace('_', ' ')}</Badge>
    },
    {
      key: 'tarifa_venta', label: 'Venta', width: '110px', align: 'right',
      render: (row) => (
        <span style={{ color: tokens.colors.green, fontFamily: tokens.fonts.body, fontWeight: 700, fontSize: '13px' }}>
          {fmt(row.tarifa_venta, row.moneda)}
        </span>
      )
    },
    {
      key: 'costo_flete', label: 'Costo', width: '110px', align: 'right',
      render: (row) => (
        <span style={{ color: tokens.colors.textSecondary, fontFamily: tokens.fonts.body, fontSize: '13px' }}>
          {fmt(row.costo_flete, row.moneda)}
        </span>
      )
    },
    {
      key: 'margen_pct', label: 'Margen', width: '90px', align: 'center',
      render: (row) => {
        const color = row.margen_pct >= 25 ? 'green' : row.margen_pct >= 15 ? 'yellow' : 'red'
        return <Badge color={color}>{row.margen_pct.toFixed(1)}%</Badge>
      }
    },
    {
      key: 'vigencia_fin', label: 'Vigencia', width: '100px',
      render: (row) => (
        <span style={{ color: tokens.colors.textMuted, fontFamily: tokens.fonts.body, fontSize: '12px' }}>
          {row.vigencia_fin}
        </span>
      )
    },
    {
      key: 'estado', label: 'Estado', width: '100px',
      render: (row) => <Badge color={estadoColores[row.estado] || 'gray'}>{row.estado}</Badge>
    },
  ]

  return (
    <ModuleLayout
      titulo="Cerebro Tarifario"
      subtitulo="Motor de pricing — tarifas, márgenes y costos por ruta"
      acciones={
        <div style={{ display: 'flex', gap: tokens.spacing.sm }}>
          <Button size="sm" variant="secondary" onClick={fetchTarifas}><RefreshCw size={16} /> Actualizar</Button>
          <Button size="sm"><Plus size={16} /> Nueva Tarifa</Button>
        </div>
      }
    >
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: tokens.spacing.md, marginBottom: tokens.spacing.lg }}>
        <KPICard titulo="Total Tarifas" valor={totalTarifas} subtitulo="en el sistema" color="primary" icono={<DollarSign size={20} />} />
        <KPICard titulo="Vigentes" valor={vigentes} subtitulo="tarifas activas" color="green" icono={<TrendingUp size={20} />} />
        <KPICard titulo="Margen Promedio" valor={`${margenPromedio}%`} subtitulo="sobre todas las rutas" color="yellow" icono={<Percent size={20} />} />
        <KPICard titulo="Rutas Únicas" valor={rutasUnicas} subtitulo="origen-destino" color="blue" icono={<Route size={20} />} />
      </div>

      <Card>
        <div style={{ display: 'flex', alignItems: 'center', gap: tokens.spacing.md, marginBottom: tokens.spacing.md, flexWrap: 'wrap' }}>
          <div style={{
            display: 'flex', alignItems: 'center', gap: '8px',
            background: tokens.colors.bgHover, borderRadius: tokens.radius.md, padding: '6px 12px', flex: '0 0 260px'
          }}>
            <Search size={14} style={{ color: tokens.colors.textMuted }} />
            <input
              value={busqueda}
              onChange={e => setBusqueda(e.target.value)}
              placeholder="Buscar ruta o cliente..."
              style={{
                background: 'transparent', border: 'none', outline: 'none',
                color: tokens.colors.textPrimary, fontFamily: tokens.fonts.body, fontSize: '13px', width: '100%',
              }}
            />
          </div>

          <span style={{ color: tokens.colors.textMuted, fontFamily: tokens.fonts.body, fontSize: '13px', fontWeight: 600 }}>Estado:</span>
          {['vigente', 'vencida', 'pendiente'].map(e => (
            <button
              key={e}
              onClick={() => setFiltroEstado(filtroEstado === e ? null : e)}
              style={{
                padding: '4px 12px', borderRadius: tokens.radius.full, fontSize: '12px',
                fontFamily: tokens.fonts.body, fontWeight: 500, border: 'none', cursor: 'pointer',
                background: filtroEstado === e ? tokens.colors.primary : tokens.colors.bgHover,
                color: filtroEstado === e ? '#fff' : tokens.colors.textSecondary,
              }}
            >
              {e}
            </button>
          ))}
        </div>

        <DataTable
          columns={columns}
          data={filtered}
          loading={loading}
          emptyMessage="Sin datos • Tabla vacía en Supabase"
        />
      </Card>
    </ModuleLayout>
  )
}
