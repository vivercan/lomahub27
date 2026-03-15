import { useState, useEffect } from 'react'
import {
  BarChart3, TrendingUp, TrendingDown, Truck, Users, MapPin,
  RefreshCw, Download, Trophy, AlertTriangle
} from 'lucide-react'
import { ModuleLayout } from '../components/layout/ModuleLayout'
import { Card } from '../components/ui/Card'
import { KPICard } from '../components/ui/KPICard'
import { Button } from '../components/ui/Button'
import { Select } from '../components/ui/Select'
import { DataTable } from '../components/ui/DataTable'
import type { Column } from '../components/ui/DataTable'
import { Badge } from '../components/ui/Badge'
import { Semaforo } from '../components/ui/Semaforo'
import { tokens } from '../lib/tokens'
import { supabase } from '../lib/supabase'
import type { SemaforoEstado } from '../lib/tokens'

// âââ Types âââââââââââââââââââââââââââââââââââââââââââ
interface RankingItem {
  id: string
  nombre: string
  empresa?: string
  valor_principal: number
  valor_secundario: number
  label_principal: string
  label_secundario: string
  cambio_pct: number
  posicion: number
}

interface RankingsResponse {
  ok: boolean
  periodo: { inicio: string; fin: string }
  resumen: {
    totalClientes: number
    totalTractos: number
    totalRutas: number
    viajesTotal: number
    facturacionTotal: number
    margenPromedio: number
  }
  rankings: {
    clientes_top: RankingItem[]
    clientes_bottom: RankingItem[]
    tractos_top: RankingItem[]
    tractos_bottom: RankingItem[]
    rutas_top: RankingItem[]
    rutas_bottom: RankingItem[]
  }
  mensaje?: string
}

// âââ Helpers âââââââââââââââââââââââââââââââââââââââââ
function formatCurrency(n: number): string {
  return new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN', minimumFractionDigits: 0 }).format(n)
}

function formatPct(n: number): string {
  return `${n.toFixed(1)}%`
}

function getSemaforo(pct: number): SemaforoEstado {
  if (pct >= 20) return 'verde'
  if (pct >= 10) return 'amarillo'
  if (pct >= 0) return 'naranja'
  return 'rojo'
}

type Categoria = 'clientes' | 'tractos' | 'rutas'

export default function Inteligencia() {
  const [loading, setLoading] = useState(false)
  const [data, setData] = useState<RankingsResponse | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [categoria, setCategoria] = useState<Categoria>('clientes')
  const [vista, setVista] = useState<'top' | 'bottom'>('top')

  // Period defaults: current month
  const [periodoInicio, setPeriodoInicio] = useState(() => {
    const d = new Date()
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-01`
  })
  const [periodoFin, setPeriodoFin] = useState(() => {
    const d = new Date()
    const last = new Date(d.getFullYear(), d.getMonth() + 1, 0)
    return `${last.getFullYear()}-${String(last.getMonth() + 1).padStart(2, '0')}-${String(last.getDate()).padStart(2, '0')}`
  })

  const fetchData = async () => {
    setLoading(true)
    setError(null)
    try {
      const { data: sessionData } = await supabase.auth.getSession()
      const token = sessionData.session?.access_token
      if (!token) throw new Error('SesiÃ³n expirada')

      const res = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/rankings-automaticos`,
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
      const json: RankingsResponse = await res.json()
      if (!json.ok) throw new Error(json.mensaje || 'Error al obtener rankings')
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

  // âââ Current ranking data ââââââââââââââââââââââââââ
  const currentKey = `${categoria}_${vista}` as keyof RankingsResponse['rankings']
  const currentData = data?.rankings?.[currentKey] ?? []

  // âââ Category options ââââââââââââââââââââââââââââââ
  const categoriaOptions = [
    { value: 'clientes', label: 'Clientes' },
    { value: 'tractos', label: 'Tractos' },
    { value: 'rutas', label: 'Rutas' },
  ]

  const categoriaIcon = {
    clientes: <Users size={18} />,
    tractos: <Truck size={18} />,
    rutas: <MapPin size={18} />,
  }

  // âââ Table columns ââââââââââââââââââââââââââââââââ
  const columns: Column<RankingItem>[] = [
    {
      key: 'posicion',
      label: '#',
      width: '50px',
      align: 'center',
      render: (row) => {
        const isTop = vista === 'top'
        const medalColors = ['#FFD700', '#C0C0C0', '#CD7F32']
        const pos = row.posicion
        return (
          <div className="flex items-center justify-center">
            {isTop && pos <= 3 ? (
              <div
                className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold"
                style={{ background: `${medalColors[pos - 1]}33`, color: medalColors[pos - 1] }}
              >
                {pos}
              </div>
            ) : (
              <span className="text-sm font-medium" style={{ color: tokens.colors.textSecondary }}>
                {pos}
              </span>
            )}
          </div>
        )
      },
    },
    {
      key: 'semaforo',
      label: '',
      width: '40px',
      render: (row) => <Semaforo estado={getSemaforo(row.cambio_pct)} size="sm" />,
    },
    {
      key: 'nombre',
      label: categoria === 'clientes' ? 'Cliente' : categoria === 'tractos' ? 'Tracto' : 'Ruta',
      render: (row) => (
        <div>
          <span className="text-sm font-semibold" style={{ color: tokens.colors.textPrimary }}>
            {row.nombre}
          </span>
          {row.empresa && (
            <span className="text-xs ml-2" style={{ color: tokens.colors.textMuted }}>
              {row.empresa}
            </span>
          )}
        </div>
      ),
    },
    {
      key: 'valor_principal',
      label: currentData[0]?.label_principal || 'MÃ©trica Principal',
      align: 'right',
      render: (row) => (
        <span className="text-sm font-semibold" style={{ color: tokens.colors.primary }}>
          {row.label_principal.includes('$') || row.label_principal.includes('Ingreso') || row.label_principal.includes('FacturaciÃ³n')
            ? formatCurrency(row.valor_principal)
            : row.valor_principal.toLocaleString('es-MX')}
        </span>
      ),
    },
    {
      key: 'valor_secundario',
      label: currentData[0]?.label_secundario || 'MÃ©trica Secundaria',
      align: 'right',
      render: (row) => (
        <span className="text-sm" style={{ color: tokens.colors.textSecondary }}>
          {row.label_secundario.includes('%')
            ? formatPct(row.valor_secundario)
            : row.valor_secundario.toLocaleString('es-MX')}
        </span>
      ),
    },
    {
      key: 'cambio_pct',
      label: 'Cambio',
      align: 'center',
      render: (row) => {
        const isPositive = row.cambio_pct >= 0
        return (
          <div className="flex items-center justify-center gap-1">
            {isPositive ? (
              <TrendingUp size={14} style={{ color: tokens.colors.green }} />
            ) : (
              <TrendingDown size={14} style={{ color: tokens.colors.red }} />
            )}
            <Badge color={isPositive ? 'green' : 'red'}>
              {isPositive ? '+' : ''}{formatPct(row.cambio_pct)}
            </Badge>
          </div>
        )
      },
    },
  ]

  // âââ CSV Export ââââââââââââââââââââââââââââââââââââ
  const handleExportCSV = () => {
    if (!currentData.length) return
    const header = 'PosiciÃ³n,Nombre,Empresa,Valor Principal,Valor Secundario,Cambio %\n'
    const rows = currentData.map(r =>
      `${r.posicion},${r.nombre},${r.empresa || ''},${r.valor_principal},${r.valor_secundario},${r.cambio_pct}`
    ).join('\n')
    const blob = new Blob([header + rows], { type: 'text/csv;charset=utf-8;' })
    const link = document.createElement('a')
    link.href = URL.createObjectURL(blob)
    link.download = `rankings_${categoria}_${vista}_${periodoInicio}.csv`
    link.click()
  }

  return (
    <ModuleLayout
      titulo="Rankings e Inteligencia"
      subtitulo="Top y Bottom de clientes, tractos y rutas"
      acciones={
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="sm" onClick={handleExportCSV} disabled={!currentData.length}>
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
        <div style={{ minWidth: '160px' }}>
          <Select
            label="CategorÃ­a"
            options={categoriaOptions}
            value={categoria}
            onChange={(e) => setCategoria(e.target.value as Categoria)}
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
            icono={<Users size={18} />}
          />
          <KPICard
            titulo="Tractos"
            valor={data.resumen.totalTractos}
            color="primary"
            icono={<Truck size={18} />}
          />
          <KPICard
            titulo="Rutas"
            valor={data.resumen.totalRutas}
            color="gray"
            icono={<MapPin size={18} />}
          />
          <KPICard
            titulo="Viajes"
            valor={data.resumen.viajesTotal}
            color="green"
            icono={<TrendingUp size={18} />}
          />
          <KPICard
            titulo="FacturaciÃ³n"
            valor={formatCurrency(data.resumen.facturacionTotal)}
            color="green"
            icono={<BarChart3 size={18} />}
          />
          <KPICard
            titulo="Margen Prom."
            valor={formatPct(data.resumen.margenPromedio)}
            color={data.resumen.margenPromedio >= 15 ? 'green' : 'red'}
            icono={<Trophy size={18} />}
          />
        </div>
      )}

      {/* Toggle Top / Bottom */}
      <div className="flex items-center gap-2 mb-4">
        <div
          className="inline-flex rounded-lg overflow-hidden border"
          style={{ borderColor: tokens.colors.border }}
        >
          <button
            onClick={() => setVista('top')}
            className="px-4 py-2 text-sm font-medium transition-colors flex items-center gap-2"
            style={{
              background: vista === 'top' ? tokens.colors.primary : tokens.colors.bgCard,
              color: vista === 'top' ? '#fff' : tokens.colors.textSecondary,
              fontFamily: tokens.fonts.body,
            }}
          >
            <TrendingUp size={14} />
            Top 5
          </button>
          <button
            onClick={() => setVista('bottom')}
            className="px-4 py-2 text-sm font-medium transition-colors flex items-center gap-2"
            style={{
              background: vista === 'bottom' ? tokens.colors.red : tokens.colors.bgCard,
              color: vista === 'bottom' ? '#fff' : tokens.colors.textSecondary,
              fontFamily: tokens.fonts.body,
            }}
          >
            <TrendingDown size={14} />
            Bottom 5
          </button>
        </div>

        {/* Category pills */}
        <div className="flex items-center gap-2 ml-4">
          {categoriaOptions.map((opt) => (
            <button
              key={opt.value}
              onClick={() => setCategoria(opt.value as Categoria)}
              className="px-3 py-1.5 rounded-full text-xs font-medium transition-all flex items-center gap-1.5"
              style={{
                background: categoria === opt.value ? `${tokens.colors.primary}22` : tokens.colors.bgHover,
                color: categoria === opt.value ? tokens.colors.primary : tokens.colors.textMuted,
                border: `1px solid ${categoria === opt.value ? `${tokens.colors.primary}44` : tokens.colors.border}`,
                fontFamily: tokens.fonts.body,
              }}
            >
              {categoriaIcon[opt.value as Categoria]}
              {opt.label}
            </button>
          ))}
        </div>
      </div>

      {/* Ranking title */}
      <div className="flex items-center gap-3 mb-3">
        {vista === 'top' ? (
          <Trophy size={20} style={{ color: '#FFD700' }} />
        ) : (
          <AlertTriangle size={20} style={{ color: tokens.colors.red }} />
        )}
        <h3
          className="text-lg font-bold"
          style={{ color: tokens.colors.textPrimary, fontFamily: tokens.fonts.heading, margin: 0 }}
        >
          {vista === 'top' ? 'Top 5' : 'Bottom 5'} â {
            categoria === 'clientes' ? 'Clientes' :
            categoria === 'tractos' ? 'Tractos' : 'Rutas'
          }
        </h3>
      </div>

      {/* Tabla */}
      <Card noPadding>
        <DataTable
          columns={columns}
          data={currentData}
          loading={loading}
          emptyMessage={`No hay datos de ${categoria} para este perÃ­odo`}
        />
      </Card>

      {/* Visual bar chart for top items */}
      {currentData.length > 0 && (
        <Card className="mt-6">
          <h4
            className="text-sm font-medium mb-4"
            style={{ color: tokens.colors.textSecondary, fontFamily: tokens.fonts.body }}
          >
            DistribuciÃ³n â {currentData[0]?.label_principal || 'Valor'}
          </h4>
          <div className="space-y-3">
            {currentData.map((item) => {
              const maxVal = Math.max(...currentData.map(i => i.valor_principal))
              const pct = maxVal > 0 ? (item.valor_principal / maxVal) * 100 : 0
              return (
                <div key={item.id} className="flex items-center gap-3">
                  <span
                    className="text-xs font-medium w-32 truncate text-right"
                    style={{ color: tokens.colors.textSecondary, fontFamily: tokens.fonts.body }}
                  >
                    {item.nombre}
                  </span>
                  <div className="flex-1 h-6 rounded" style={{ background: tokens.colors.bgHover }}>
                    <div
                      className="h-full rounded transition-all flex items-center justify-end pr-2"
                      style={{
                        width: `${Math.max(pct, 5)}%`,
                        background: vista === 'top'
                          ? `linear-gradient(90deg, ${tokens.colors.primary}88, ${tokens.colors.primary})`
                          : `linear-gradient(90deg, ${tokens.colors.red}88, ${tokens.colors.red})`,
                      }}
                    >
                      <span className="text-xs font-bold" style={{ color: '#fff', fontFamily: tokens.fonts.body }}>
                        {item.label_principal.includes('$') || item.label_principal.includes('Ingreso')
                          ? formatCurrency(item.valor_principal)
                          : item.valor_principal.toLocaleString('es-MX')}
                      </span>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        </Card>
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
