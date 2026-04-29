import { useState, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { ModuleLayout } from '../../components/layout/ModuleLayout'
import { Card } from '../../components/ui/Card'
import { KPICard } from '../../components/ui/KPICard'
import { DataTable } from '../../components/ui/DataTable'
import { Badge } from '../../components/ui/Badge'
import { tokens } from '../../lib/tokens'
import { supabase } from '../../lib/supabase'
import { CloudDownload, Package, Clock, CheckCircle2, AlertTriangle } from 'lucide-react'

/* ── Types ── */
interface ViajeImpo {
  id: string
  viaje: number
  folio: string
  cliente: string
  origen: string
  destino: string
  tracto: string
  estado: string
  inicia_viaje: string
  fecha_crea: string
  kms_viaje: number
  tipo: string
  origen_ciudad?: string
  destino_ciudad?: string
}

/* ── Estado badge colors ── */
const estadoColor = (e: string) => {
  switch (e?.toLowerCase()) {
    case 'en_transito': case 'en transito': return 'blue'
    case 'entregado': case 'completado': return 'green'
    case 'programado': return 'default'
    case 'en_riesgo': case 'retrasado': return 'red'
    case 'cancelado': return 'gray'
    default: return 'default'
  }
}

const estadoLabel = (e: string) => {
  switch (e?.toLowerCase()) {
    case 'en_transito': return 'En Tránsito'
    case 'entregado': return 'Entregado'
    case 'programado': return 'Programado'
    case 'en_riesgo': return 'En Riesgo'
    case 'retrasado': return 'Retrasado'
    case 'cancelado': return 'Cancelado'
    default: return e || 'Sin estado'
  }
}

/* ── Component ── */
export default function ViajesImpo() {
  const navigate = useNavigate()
  const [viajes, setViajes] = useState<ViajeImpo[]>([])
  const [loading, setLoading] = useState(true)
  const [periodo, setPeriodo] = useState(30)

  const fetchViajes = useCallback(async () => {
    setLoading(true)
    try {
      const desde = new Date()
      desde.setDate(desde.getDate() - periodo)
      const desdeISO = desde.toISOString()

      /* Try inicia_viaje first, fallback to fecha_crea */
      let { data, error } = await supabase
        .from('viajes_anodos')
        .select('*')
        .eq('tipo', 'IMPO')
        .gte('inicia_viaje', desdeISO)
        .order('inicia_viaje', { ascending: false })
        .limit(500)

      if (error || !data || data.length === 0) {
        const res = await supabase
          .from('viajes_anodos')
          .select('*')
          .eq('tipo', 'IMPO')
          .gte('fecha_crea', desdeISO)
          .order('fecha_crea', { ascending: false })
          .limit(500)
        data = res.data
        error = res.error
      }

      if (error) { console.error('Error fetching IMPO viajes:', error); return }
      setViajes(data || [])
    } catch (e) { console.error('IMPO fetch error:', e) }
    finally { setLoading(false) }
  }, [periodo])

  useEffect(() => { fetchViajes() }, [fetchViajes])

  /* ── KPIs ── */
  const total = viajes.length
  const enTransito = viajes.filter(v => ['en_transito', 'en transito'].includes(v.estado?.toLowerCase())).length
  const entregados = viajes.filter(v => ['entregado', 'completado'].includes(v.estado?.toLowerCase())).length
  const enRiesgo = viajes.filter(v => ['en_riesgo', 'retrasado'].includes(v.estado?.toLowerCase())).length

  /* ── Table columns ── */
  const columns = [
    { key: 'folio', label: 'Folio', width: '100px', render: (v: any) => v.viaje ? '#' + v.viaje : (v.folio || '—') },
    { key: 'cliente', label: 'Cliente', width: '180px' },
    { key: 'origen_ciudad', label: 'Origen', width: '130px', render: (v: ViajeImpo) => v.origen_ciudad || v.origen || '—' },
    { key: 'destino_ciudad', label: 'Destino', width: '130px', render: (v: ViajeImpo) => v.destino_ciudad || v.destino || '—' },
    { key: 'tracto', label: 'Tracto', width: '100px' },
    { key: 'kms_viaje', label: 'Km', width: '80px', render: (v: ViajeImpo) => v.kms_viaje ? v.kms_viaje.toLocaleString() : '—' },
    { key: 'estado', label: 'Estado', width: '120px', render: (v: ViajeImpo) => <Badge color={estadoColor(v.estado)}>{estadoLabel(v.estado)}</Badge> },
    { key: 'inicia_viaje', label: 'Fecha Inicio', width: '120px', render: (v: ViajeImpo) => {
      const d = v.inicia_viaje || v.fecha_crea
      return d ? new Date(d).toLocaleDateString('es-MX', { day: '2-digit', month: 'short', year: 'numeric' }) : '—'
    }},
  ]

  /* ── Period selector ── */
  const periodoAcciones = (
    <div style={{ display: 'flex', gap: '6px' }}>
      {[7, 30, 60, 90].map(d => (
        <button key={d} onClick={() => setPeriodo(d)} style={{
          padding: '6px 14px', borderRadius: tokens.radius.md,
          background: periodo === d ? tokens.colors.primary : tokens.colors.bgSecondary,
          color: periodo === d ? '#fff' : tokens.colors.textSecondary,
          border: 'none', cursor: 'pointer', fontSize: '13px', fontWeight: 600,
          fontFamily: tokens.fonts.body, transition: 'all 0.2s ease',
        }}>
          {d}d
        </button>
      ))}
    </div>
  )

  return (
    <ModuleLayout
      titulo="Importación — Viajes IMPO"
      subtitulo={`Últimos ${periodo} días`}
      acciones={periodoAcciones}
    >
      {/* KPIs */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: tokens.spacing.md, marginBottom: tokens.spacing.lg }}>
        <KPICard titulo="Total Viajes" valor={String(total)} color="primary" icono={<CloudDownload size={20} />} />
        <KPICard titulo="En Tránsito" valor={String(enTransito)} color="blue" icono={<Package size={20} />} />
        <KPICard titulo="Entregados" valor={String(entregados)} color="green" icono={<CheckCircle2 size={20} />} />
        <KPICard titulo="En Riesgo" valor={String(enRiesgo)} color="red" icono={<AlertTriangle size={20} />} />
      </div>

      {/* Table */}
      <Card>
        <DataTable
          data={viajes}
          columns={columns}
          loading={loading}
          onRowClick={(row: any) => navigate(`/operaciones/viajes/${row.id}`)}
          emptyMessage="No hay viajes de importación en este periodo"
          maxHeight="calc(100vh - 340px)"
        />
      </Card>
    </ModuleLayout>
  )
}
