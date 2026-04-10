import type { ReactElement } from 'react'
import { useState, useEffect } from 'react'
import { ModuleLayout } from '../../components/layout/ModuleLayout'
import { Card } from '../../components/ui/Card'
import { KPICard } from '../../components/ui/KPICard'
import { DataTable } from '../../components/ui/DataTable'
import { Select } from '../../components/ui/Select'
import { Semaforo } from '../../components/ui/Semaforo'
import type { SemaforoEstado } from '../../lib/tokens'
import { tokens } from '../../lib/tokens'
import { supabase } from '../../lib/supabase'
import { Truck, AlertTriangle, Clock, CheckCircle2, BarChart3 } from 'lucide-react'

/* ──── types ──── */
interface Viaje {
  folio: string
  cliente: string
  ruta: string
  tracto: string
  eta: string
  cita: string
  diferencia: number
  estadoViaje: string
  semaforo: SemaforoEstado
  kmRuta: number
  viajesHistoricos: number
}

interface RutaStats {
  ruta: string
  totalViajes: number
  avgKm: number
}

/* ──── helpers ──── */
const estadoToSemaforo = (estado: string): SemaforoEstado => {
  switch (estado) {
    case 'en_transito': return 'verde'
    case 'programado': return 'azul'
    case 'en_riesgo': return 'amarillo'
    case 'retrasado': return 'rojo'
    case 'entregado': return 'gris'
    default: return 'azul'
  }
}

const estadoLabel = (estado: string): string => {
  switch (estado) {
    case 'en_transito': return 'En Tránsito'
    case 'programado': return 'Programado'
    case 'en_riesgo': return 'En Riesgo'
    case 'retrasado': return 'Retrasado'
    case 'entregado': return 'Entregado'
    default: return estado || 'Sin estado'
  }
}

/* Fetch route statistics from viajes_anodos (last 90 days) */
async function fetchRutaStats(): Promise<Map<string, RutaStats>> {
  const hace90d = new Date()
  hace90d.setDate(hace90d.getDate() - 90)
  const desde = hace90d.toISOString()

  const rutaMap = new Map<string, { total: number; kmSum: number }>()
  let offset = 0
  const PAGE = 1000

  while (true) {
    const { data, error } = await supabase
      .from('viajes_anodos')
      .select('origen_ciudad, destino_ciudad, km_total')
      .gte('inicia_viaje', desde)
      .range(offset, offset + PAGE - 1)

    if (error) { console.error('ruta stats:', error); break }
    if (!data || data.length === 0) break

    for (const row of data) {
      const ruta = `${row.origen_ciudad || '?'} → ${row.destino_ciudad || '?'}`
      const prev = rutaMap.get(ruta) || { total: 0, kmSum: 0 }
      prev.total += 1
      prev.kmSum += Number(row.km_total) || 0
      rutaMap.set(ruta, prev)
    }

    if (data.length < PAGE) break
    offset += PAGE
  }

  // Fallback to fecha_crea if no results
  if (rutaMap.size === 0) {
    offset = 0
    while (true) {
      const { data, error } = await supabase
        .from('viajes_anodos')
        .select('origen_ciudad, destino_ciudad, km_total')
        .gte('fecha_crea', desde)
        .range(offset, offset + PAGE - 1)

      if (error) break
      if (!data || data.length === 0) break

      for (const row of data) {
        const ruta = `${row.origen_ciudad || '?'} → ${row.destino_ciudad || '?'}`
        const prev = rutaMap.get(ruta) || { total: 0, kmSum: 0 }
        prev.total += 1
        prev.kmSum += Number(row.km_total) || 0
        rutaMap.set(ruta, prev)
      }

      if (data.length < PAGE) break
      offset += PAGE
    }
  }

  const result = new Map<string, RutaStats>()
  rutaMap.forEach((v, ruta) => {
    result.set(ruta, { ruta, totalViajes: v.total, avgKm: v.total > 0 ? Math.round(v.kmSum / v.total) : 0 })
  })
  return result
}

/* ──── component ──── */
export default function TorreControl(): ReactElement {
  const [viajes, setViajes] = useState<Viaje[]>([])
  const [loading, setLoading] = useState(true)
  const [filtroEmpresa, setFiltroEmpresa] = useState('')
  const [filtroEstado, setFiltroEstado] = useState('')
  const [totalViajesMes, setTotalViajesMes] = useState(0)

  useEffect(() => {
    const fetchViajes = async () => {
      try {
        setLoading(true)

        // Fetch active viajes + route stats in parallel
        const [viajesResp, rutaStats, mesCount] = await Promise.all([
          supabase
            .from('viajes')
            .select('*, clientes(razon_social), tractos(numero_economico)')
            .not('estado', 'eq', 'cancelado')
            .order('created_at', { ascending: false }),
          fetchRutaStats(),
          supabase
            .from('viajes_anodos')
            .select('*', { count: 'exact', head: true })
            .gte('inicia_viaje', new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString()),
        ])

        if (viajesResp.error) {
          console.error('Error fetching viajes:', viajesResp.error)
          setViajes([])
          return
        }

        setTotalViajesMes(mesCount.count || 0)

        const formattedViajes = (viajesResp.data || []).map((viaje: any) => {
          const eta = viaje.eta_calculado ? new Date(viaje.eta_calculado) : null
          const cita = viaje.cita_descarga ? new Date(viaje.cita_descarga) : null
          const diffMin = eta && cita ? Math.round((eta.getTime() - cita.getTime()) / 60000) : 0
          const ruta = `${viaje.origen || '?'} → ${viaje.destino || '?'}`
          const stats = rutaStats.get(ruta)

          return {
            folio: viaje.folio || viaje.id?.substring(0, 8)?.toUpperCase() || '—',
            cliente: viaje.clientes?.razon_social || viaje.cliente_nombre || '—',
            ruta,
            tracto: viaje.tractos?.numero_economico || viaje.tracto_numero || '—',
            eta: eta ? eta.toLocaleString('es-MX', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }) : '—',
            cita: cita ? cita.toLocaleString('es-MX', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }) : '—',
            diferencia: diffMin,
            estadoViaje: viaje.estado || 'programado',
            semaforo: estadoToSemaforo(viaje.estado || 'programado'),
            kmRuta: stats?.avgKm || 0,
            viajesHistoricos: stats?.totalViajes || 0,
          }
        })

        setViajes(formattedViajes)
      } catch (err) {
        console.error('Unexpected error:', err)
        setViajes([])
      } finally {
        setLoading(false)
      }
    }

    fetchViajes()
  }, [])

  const getDiferenciaColor = (diferencia: number) => {
    if (diferencia <= 0) return tokens.colors.green
    if (diferencia <= 60) return tokens.colors.yellow
    return tokens.colors.red
  }

  // Apply filters
  const filteredViajes = viajes.filter(v => {
    if (filtroEstado && v.estadoViaje !== filtroEstado) return false
    if (filtroEmpresa && !v.cliente.toLowerCase().includes(filtroEmpresa.toLowerCase())) return false
    return true
  })

  // Compute KPIs from all viajes
  const enTransito = viajes.filter(v => v.estadoViaje === 'en_transito').length
  const enRiesgo = viajes.filter(v => v.estadoViaje === 'en_riesgo').length
  const retrasados = viajes.filter(v => v.estadoViaje === 'retrasado').length
  const programados = viajes.filter(v => v.estadoViaje === 'programado').length

  const viajesColumns = [
    { key: 'folio', label: 'Folio' },
    { key: 'cliente', label: 'Cliente' },
    { key: 'ruta', label: 'Origen → Destino' },
    { key: 'tracto', label: 'Tracto' },
    { key: 'eta', label: 'ETA' },
    { key: 'cita', label: 'Cita' },
    {
      key: 'diferencia',
      label: 'Diferencia',
      render: (row: Viaje) => (
        <span style={{ color: getDiferenciaColor(row.diferencia), fontWeight: 600 }}>
          {row.diferencia > 0 ? '+' : ''}{row.diferencia} min
        </span>
      ),
    },
    {
      key: 'kmRuta',
      label: 'Km Ruta',
      align: 'center' as const,
      render: (row: Viaje) => (
        <span style={{ color: tokens.colors.textSecondary, fontSize: '13px' }}>
          {row.kmRuta > 0 ? `${row.kmRuta.toLocaleString()} km` : '—'}
        </span>
      ),
    },
    {
      key: 'viajesHistoricos',
      label: 'Hist 90d',
      align: 'center' as const,
      render: (row: Viaje) => (
        <span style={{
          color: row.viajesHistoricos > 20 ? tokens.colors.green : row.viajesHistoricos > 5 ? tokens.colors.blue : tokens.colors.textMuted,
          fontSize: '13px', fontWeight: 600,
        }}>
          {row.viajesHistoricos > 0 ? row.viajesHistoricos : '—'}
        </span>
      ),
    },
    {
      key: 'estadoViaje',
      label: 'Estado',
      render: (row: Viaje) => (
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Semaforo estado={row.semaforo} />
          <span>{estadoLabel(row.estadoViaje)}</span>
        </div>
      ),
    },
  ]

  // Extract unique empresas for filter
  const empresasUnicas = [...new Set(viajes.map(v => v.cliente).filter(c => c !== '—'))]

  return (
    <ModuleLayout titulo="Torre de Control">
      {/* KPIs */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: tokens.spacing.md, marginBottom: tokens.spacing.lg }}>
        <KPICard titulo="En Tránsito" valor={enTransito} color="green" icono={<Truck size={18} />} />
        <KPICard titulo="En Riesgo" valor={enRiesgo} color="yellow" icono={<AlertTriangle size={18} />} />
        <KPICard titulo="Retrasados" valor={retrasados} color="red" icono={<Clock size={18} />} />
        <KPICard titulo="Programados" valor={programados} color="primary" icono={<CheckCircle2 size={18} />} />
        <KPICard titulo="Viajes del Mes" valor={totalViajesMes.toLocaleString()} color="blue" icono={<BarChart3 size={18} />} />
      </div>

      {/* Filtros */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: tokens.spacing.md, marginBottom: tokens.spacing.lg }}>
        <Select
          label="Empresa"
          placeholder="Todas las empresas"
          value={filtroEmpresa}
          onChange={(val) => setFiltroEmpresa(val)}
          options={empresasUnicas.map(e => ({ value: e, label: e }))}
        />
        <Select label="CS Asignada" placeholder="Todos los CS" options={[]} />
        <Select
          label="Estado"
          placeholder="Todos los estados"
          value={filtroEstado}
          onChange={(val) => setFiltroEstado(val)}
          options={[
            { value: 'en_transito', label: 'En Tránsito' },
            { value: 'en_riesgo', label: 'En Riesgo' },
            { value: 'retrasado', label: 'Retrasado' },
            { value: 'programado', label: 'Programado' },
          ]}
        />
      </div>

      {/* Viajes DataTable */}
      <Card>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: tokens.spacing.md }}>
          <h3 style={{ margin: 0 }}>Monitoreo de Viajes</h3>
          {!loading && viajes.length > 0 && (
            <span style={{ fontSize: '13px', color: tokens.colors.textSecondary }}>
              {filteredViajes.length} de {viajes.length} viajes
            </span>
          )}
        </div>

        {loading ? (
          <div style={{ textAlign: 'center', padding: '48px 0', color: tokens.colors.textSecondary }}>
            <p>Cargando viajes...</p>
          </div>
        ) : filteredViajes.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '48px 0', color: tokens.colors.textSecondary }}>
            <p style={{ fontSize: '18px', fontWeight: 500, margin: 0 }}>Sin datos</p>
            <p style={{ fontSize: '14px', marginTop: '4px' }}>
              {viajes.length > 0 ? 'No hay viajes que coincidan con los filtros' : 'Los datos se cargarán cuando estén disponibles en el sistema'}
            </p>
          </div>
        ) : (
          <DataTable columns={viajesColumns} data={filteredViajes} />
        )}
      </Card>
    </ModuleLayout>
  )
}
