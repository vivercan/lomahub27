import { useState, useEffect } from 'react'
import { Phone, MapPin, Mail, Calendar, Clock, CheckCircle, Plus } from 'lucide-react'
import { ModuleLayout } from '../../components/layout/ModuleLayout'
import { Card } from '../../components/ui/Card'
import { Button } from '../../components/ui/Button'
import { Badge } from '../../components/ui/Badge'
import { KPICard } from '../../components/ui/KPICard'
import { DataTable, type Column } from '../../components/ui/DataTable'
import { tokens } from '../../lib/tokens'
import { supabase } from '../../lib/supabase'

interface Actividad {
  id: string
  tipo: 'llamada' | 'visita' | 'email' | 'seguimiento' | 'reunion'
  cliente: string
  ejecutivo: string
  fecha: string
  hora: string
  duracion_min?: number
  notas?: string
  estado: 'programada' | 'completada' | 'cancelada' | 'pendiente'
  resultado?: string
}

const tipoIconos: Record<string, React.ReactNode> = {
  llamada: <Phone size={14} />,
  visita: <MapPin size={14} />,
  email: <Mail size={14} />,
  seguimiento: <Clock size={14} />,
  reunion: <Calendar size={14} />,
}

const tipoColores: Record<string, 'primary' | 'green' | 'yellow' | 'red' | 'blue' | 'orange'> = {
  llamada: 'primary',
  visita: 'green',
  email: 'blue',
  seguimiento: 'yellow',
  reunion: 'orange',
}

const estadoColores: Record<string, 'green' | 'yellow' | 'red' | 'gray' | 'primary' | 'blue'> = {
  programada: 'blue',
  completada: 'green',
  cancelada: 'red',
  pendiente: 'yellow',
}

export default function Actividades() {
  const [actividades, setActividades] = useState<Actividad[]>([])
  const [loading, setLoading] = useState(true)
  const [filtroTipo, setFiltroTipo] = useState<string | null>(null)
  const [filtroEstado, setFiltroEstado] = useState<string | null>(null)

  useEffect(() => {
    fetchActividades()
  }, [])

  async function fetchActividades() {
    setLoading(true)
    const { data, error } = await supabase
      .from('actividades')
      .select('*')
      .order('fecha', { ascending: false })
      .limit(200)
    if (!error && data) setActividades(data)
    setLoading(false)
  }

  const filtered = actividades.filter(a => {
    if (filtroTipo && a.tipo !== filtroTipo) return false
    if (filtroEstado && a.estado !== filtroEstado) return false
    return true
  })

  const totalHoy = actividades.filter(a => a.fecha === new Date().toISOString().split('T')[0]).length
  const completadas = actividades.filter(a => a.estado === 'completada').length
  const pendientes = actividades.filter(a => a.estado === 'pendiente' || a.estado === 'programada').length
  const tasaCumplimiento = actividades.length > 0 ? Math.round((completadas / actividades.length) * 100) : 0

  const columns: Column<Actividad>[] = [
    {
      key: 'tipo', label: 'Tipo', width: '100px',
      render: (row) => (
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <span style={{ color: tokens.colors[tipoColores[row.tipo] || 'primary'] }}>
            {tipoIconos[row.tipo]}
          </span>
          <Badge color={tipoColores[row.tipo]}>{row.tipo}</Badge>
        </div>
      )
    },
    { key: 'cliente', label: 'Cliente' },
    { key: 'ejecutivo', label: 'Ejecutivo' },
    {
      key: 'fecha', label: 'Fecha', width: '120px',
      render: (row) => (
        <span style={{ color: tokens.colors.textSecondary, fontFamily: tokens.fonts.body, fontSize: '13px' }}>
          {row.fecha} {row.hora || ''}
        </span>
      )
    },
    {
      key: 'duracion_min', label: 'Duración', width: '80px', align: 'center',
      render: (row) => (
        <span style={{ color: tokens.colors.textSecondary, fontFamily: tokens.fonts.body }}>
          {row.duracion_min ? `${row.duracion_min} min` : '—'}
        </span>
      )
    },
    {
      key: 'estado', label: 'Estado', width: '110px',
      render: (row) => <Badge color={estadoColores[row.estado] || 'gray'}>{row.estado}</Badge>
    },
    {
      key: 'notas', label: 'Notas',
      render: (row) => (
        <span style={{
          color: tokens.colors.textMuted, fontFamily: tokens.fonts.body, fontSize: '12px',
          maxWidth: '200px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', display: 'block'
        }}>
          {row.notas || '—'}
        </span>
      )
    },
  ]

  const tipos = ['llamada', 'visita', 'email', 'seguimiento', 'reunion']
  const estados = ['programada', 'completada', 'cancelada', 'pendiente']

  return (
    <ModuleLayout
      titulo="Actividades"
      subtitulo="Bitácora de llamadas, visitas, emails y seguimientos"
      moduloPadre={{ nombre: 'Servicio', ruta: '/servicio/dashboard' }}
      acciones={<Button size="sm"><Plus size={16} /> Nueva Actividad</Button>}
    >
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: tokens.spacing.md, marginBottom: tokens.spacing.lg }}>
        <KPICard titulo="Actividades Hoy" valor={totalHoy} subtitulo={`de ${actividades.length} total`} color="primary" icono={<Calendar size={20} />} />
        <KPICard titulo="Completadas" valor={completadas} subtitulo={`${tasaCumplimiento}% cumplimiento`} color="green" icono={<CheckCircle size={20} />} />
        <KPICard titulo="Pendientes" valor={pendientes} subtitulo="requieren atención" color="yellow" icono={<Clock size={20} />} />
        <KPICard titulo="Llamadas" valor={actividades.filter(a => a.tipo === 'llamada').length} subtitulo="del total" color="blue" icono={<Phone size={20} />} />
      </div>

      <Card>
        <div style={{ display: 'flex', alignItems: 'center', gap: tokens.spacing.md, marginBottom: tokens.spacing.md, flexWrap: 'wrap' }}>
          <span style={{ color: tokens.colors.textMuted, fontFamily: tokens.fonts.body, fontSize: '13px', fontWeight: 600 }}>Tipo:</span>
          {tipos.map(t => (
            <button
              key={t}
              onClick={() => setFiltroTipo(filtroTipo === t ? null : t)}
              style={{
                padding: '4px 12px', borderRadius: tokens.radius.full, fontSize: '12px',
                fontFamily: tokens.fonts.body, fontWeight: 500, border: 'none', cursor: 'pointer',
                background: filtroTipo === t ? tokens.colors.primary : tokens.colors.bgHover,
                color: filtroTipo === t ? '#fff' : tokens.colors.textSecondary,
              }}
            >
              {t}
            </button>
          ))}
          <span style={{ color: tokens.colors.textMuted, fontFamily: tokens.fonts.body, fontSize: '13px', fontWeight: 600, marginLeft: tokens.spacing.md }}>Estado:</span>
          {estados.map(e => (
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
