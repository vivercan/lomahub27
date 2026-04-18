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

// ─── Types ───────────────────────────────────────────
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

// ─── Helpers ─────────────────────────────────────────
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
      // Query viajes directly from Supabase (replaces Edge Function call)
      const { data: viajes, error: vErr } = await supabase
        .from('viajes')
        .select('id, cliente_id, tracto_id, origen, destino, created_at')
        .gte('created_at', `${periodoInicio}T00:00:00`)
        .lte('created_at', `${periodoFin}T23:59:59`)

      if (vErr) throw new Error(vErr.message)

      // Empty period — show empty state gracefully
      if (!viajes || viajes.length === 0) {
        setData({
          ok: true,
          periodo: { inicio: periodoInicio, fin: periodoFin },
          resumen: { totalClientes: 0, totalTractos: 0, totalRutas: 0, viajesTotal: 0, facturacionTotal: 0, margenPromedio: 0 },
          rankings: { clientes_top: [], clientes_bottom: [], tractos_top: [], tractos_bottom: [], rutas_top: [], rutas_bottom: [] },
        })
        return
      }

      // Fetch client and tracto names
      const clienteIds = [...new Set(viajes.map(v => v.cliente_id).filter(Boolean))]
      const tractoIds = [...new Set(viajes.map(v => v.tracto_id).filter(Boolean))]

      const { data: clientes } = clienteIds.length > 0
        ? await supabase.from('clientes').select('id, razon_social, empresa').in('id', clienteIds)
        : { data: [] }
      const { data: tractos } = tractoIds.length > 0
        ? await supabase.from('tractos').select('id, numero_economico, empresa').in('id', tractoIds)
        : { data: [] }

      const clienteMap = new Map((clientes || []).map(c => [c.id, c]))
      const tractoMap = new Map((tractos || []).map(t => [t.id, t]))

      // Aggregate by dimension
      const agg = (key: (v: any) => string) => {
        const map = new Map<string, number>()
        viajes.forEach(v => {
          const k = key(v)
          if (k) map.set(k, (map.get(k) || 0) + 1)
        })
        return map
      }

      const clienteAgg = agg(v => v.cliente_id)
      const tractoAgg = agg(v => v.tracto_id)
      const rutaAgg = agg(v => `${v.origen || '?'} → ${v.destino || '?'}`)

      // Build ranking items
      const buildRanking = (
        entries: [string, number][],
        getName: (id: string) => { nombre: string; empresa?: string },
        label: string,
      ): RankingItem[] =>
        entries
          .sort((a, b) => b[1] - a[1])
          .map(([id, count], i) => {
            const info = getName(id)
            return {
              id,
              nombre: info.nombre,
              empresa: info.empresa,
              valor_principal: count,
              valor_secundario: 0,
              label_principal: label,
              label_secundario: 'Margen %',
              cambio_pct: 0,
              posicion: i + 1,
            }
          })

      const clienteRanking = buildRanking(
        Array.from(clienteAgg.entries()),
        id => ({ nombre: clienteMap.get(id)?.razon_social || id, empresa: clienteMap.get(id)?.empresa }),
        'Viajes',
      )
      const tractoRanking = buildRanking(
        Array.from(tractoAgg.entries()),
        id => ({ nombre: tractoMap.get(id)?.numero_economico || id, empresa: tractoMap.get(id)?.empresa }),
        'Viajes',
      )
      const rutaRanking = buildRanking(
        Array.from(rutaAgg.entries()),
        id => ({ nombre: id }),
        'Frecuencia',
      )

      const top5 = (arr: RankingItem[]) => arr.slice(0, 5).map((x, i) => ({ ...x, posicion: i + 1 }))
      const bot5 = (arr: RankingItem[]) =>
        arr.length > 5
          ? arr.slice(-5).reverse().map((x, i) => ({ ...x, posicion: i + 1 }))
          : []

      setData({
        ok: true,
        periodo: { inicio: periodoInicio, fin: periodoFin },
        resumen: {
          totalClientes: clienteAgg.size,
          totalTractos: tractoAgg.size,
          totalRutas: rutaAgg.size,
          viajesTotal: viajes.length,
          facturacionTotal: 0,
          margenPromedio: 0,
        },
        rankings: {
          clientes_top: top5(clienteRanking),
          clientes_bottom: bot5(clienteRanking),
          tractos_top: top5(tractoRanking),
          tractos_bottom: bot5(tractoRanking),
          rutas_top: top5(rutaRanking),
          rutas_bottom: bot5(rutaRanking),
        },
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

  // ─── Current ranking data ──────────────────────────
  const currentKey = `${categoria}_${vista}` as keyof RankingsResponse['rankings']
  const currentData = data?.rankings?.[currentKey] ?? []

  // ─── Category options ──────────────────────────────
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

  // ─── Table columns ────────────────────────────────
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
      label: currentData[0]?.label_principal || 'Métrica Principal',
      align: 'right',
      render: (row) => (
        <span className="text-sm font-semibold" style={{ color: tokens.colors.primary }}>
          {row.label_principal.includes('$') || row.label_principal.includes('Ingreso') || row.label_principal.includes('Facturación')
            ? formatCurrency(row.valor_principal)
            : row.valor_principal.toLocaleString('es-MX')}
        </span>
      ),
    },
    {
      key: 'valor_secundario',
      label: currentData[0]?.label_secundario || 'Métrica Secundaria',
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

  // ─── CSV Export ────────────────────────────────────
  const handleExportCSV = () => {
    if (!currentData.length) return
    const header = 'Posición,Nombre,Empresa,Valor Principal,Valor Secundario,Cambio %\n'
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
      moduloPadre={{ nombre: 'Comercial', ruta: '/ventas/dashboard' }}
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
        <div style={{ minWidth: '160px' }}>
          <Select
            label="Categoría"
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
            titulo="Facturación"
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
          {vista === 'top' ? 'Top 5' : 'Bottom 5'} — {
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
          emptyMessage={`No hay datos de ${categoria} para este período`}
        />
      </Card>

      {/* Visual bar chart for top items */}
      {currentData.length > 0 && (
        <Card className="mt-6">
          <h4
            className="text-sm font-medium mb-4"
            style={{ color: tokens.colors.textSecondary, fontFamily: tokens.fonts.body }}
          >
            Distribución — {currentData[0]?.label_principal || 'Valor'}
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

