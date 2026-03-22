import { useState, useEffect } from 'react'
import { Truck, Calendar, Users, ChevronLeft, ChevronRight, MapPin, Clock, Plus } from 'lucide-react'
import { ModuleLayout } from '../../components/layout/ModuleLayout'
import { Card } from '../../components/ui/Card'
import { Button } from '../../components/ui/Button'
import { Badge } from '../../components/ui/Badge'
import { KPICard } from '../../components/ui/KPICard'
import { DataTable, type Column } from '../../components/ui/DataTable'
import { tokens } from '../../lib/tokens'
import { supabase } from '../../lib/supabase'

interface Asignacion {
  id: string
  tracto: string
  operador: string
  cliente: string
  ruta: string
  fecha_inicio: string
  fecha_fin: string
  estado: 'activa' | 'pendiente' | 'completada' | 'cancelada'
  turno: 'matutino' | 'vespertino' | 'nocturno' | 'completo'
  viajes_semana: number
}

const estadoColores: Record<string, 'green' | 'yellow' | 'red' | 'gray' | 'blue' | 'primary'> = {
  activa: 'green',
  pendiente: 'yellow',
  completada: 'blue',
  cancelada: 'red',
}

const turnoColores: Record<string, 'primary' | 'yellow' | 'blue' | 'orange'> = {
  matutino: 'yellow',
  vespertino: 'orange',
  nocturno: 'blue',
  completo: 'primary',
}

export default function ProgramacionDedicados() {
  const [asignaciones, setAsignaciones] = useState<Asignacion[]>([])
  const [loading, setLoading] = useState(true)
  const [semanaOffset, setSemanaOffset] = useState(0)

  useEffect(() => {
    fetchAsignaciones()
  }, [])

  async function fetchAsignaciones() {
    setLoading(true)
    const { data, error } = await supabase
      .from('dedicados_programacion')
      .select('*')
      .order('fecha_inicio', { ascending: false })
      .limit(200)
    if (!error && data) setAsignaciones(data)
    setLoading(false)
  }

  const getWeekDates = (offset: number) => {
    const now = new Date()
    const monday = new Date(now)
    monday.setDate(now.getDate() - now.getDay() + 1 + offset * 7)
    const sunday = new Date(monday)
    sunday.setDate(monday.getDate() + 6)
    return { monday, sunday }
  }

  const { monday, sunday } = getWeekDates(semanaOffset)
  const fmtShort = (d: Date) => d.toLocaleDateString('es-MX', { day: 'numeric', month: 'short' })

  const weekAsignaciones = asignaciones.filter(a => {
    const ini = new Date(a.fecha_inicio)
    const fin = new Date(a.fecha_fin)
    return ini <= sunday && fin >= monday
  })

  const totalActivas = asignaciones.filter(a => a.estado === 'activa').length
  const tractosAsignados = new Set(asignaciones.filter(a => a.estado === 'activa').map(a => a.tracto)).size
  const clientesDedicados = new Set(asignaciones.filter(a => a.estado === 'activa').map(a => a.cliente)).size
  const viajesSemana = weekAsignaciones.reduce((s, a) => s + (a.viajes_semana || 0), 0)

  const diasSemana = ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom']

  const columns: Column<Asignacion>[] = [
    {
      key: 'tracto', label: 'Tracto', width: '100px',
      render: (row) => (
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <Truck size={14} style={{ color: tokens.colors.primary }} />
          <span style={{ color: tokens.colors.textPrimary, fontFamily: tokens.fonts.body, fontWeight: 700, fontSize: '13px' }}>
            {row.tracto}
          </span>
        </div>
      )
    },
    { key: 'operador', label: 'Operador' },
    {
      key: 'cliente', label: 'Cliente',
      render: (row) => (
        <span style={{ color: tokens.colors.textPrimary, fontFamily: tokens.fonts.body, fontWeight: 600, fontSize: '13px' }}>
          {row.cliente}
        </span>
      )
    },
    {
      key: 'ruta', label: 'Ruta',
      render: (row) => (
        <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
          <MapPin size={12} style={{ color: tokens.colors.textMuted }} />
          <span style={{ color: tokens.colors.textSecondary, fontFamily: tokens.fonts.body, fontSize: '12px' }}>
            {row.ruta}
          </span>
        </div>
      )
    },
    {
      key: 'turno', label: 'Turno', width: '100px',
      render: (row) => <Badge color={turnoColores[row.turno] || 'primary'}>{row.turno}</Badge>
    },
    {
      key: 'viajes_semana', label: 'Viajes/Sem', width: '90px', align: 'center',
      render: (row) => (
        <span style={{ color: tokens.colors.green, fontFamily: tokens.fonts.body, fontWeight: 700 }}>
          {row.viajes_semana}
        </span>
      )
    },
    {
      key: 'estado', label: 'Estado', width: '110px',
      render: (row) => <Badge color={estadoColores[row.estado] || 'gray'}>{row.estado}</Badge>
    },
  ]

  return (
    <ModuleLayout
      titulo="Programación Dedicados"
      subtitulo="Asignación semanal de tractos a clientes dedicados"
      acciones={<Button size="sm"><Plus size={16} /> Nueva Asignación</Button>}
    >
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: tokens.spacing.md, marginBottom: tokens.spacing.lg }}>
        <KPICard titulo="Asignaciones Activas" valor={totalActivas} subtitulo={`de ${asignaciones.length} total`} color="green" icono={<Calendar size={20} />} />
        <KPICard titulo="Tractos Asignados" valor={tractosAsignados} subtitulo="en servicio dedicado" color="primary" icono={<Truck size={20} />} />
        <KPICard titulo="Clientes Dedicados" valor={clientesDedicados} subtitulo="con tracto asignado" color="blue" icono={<Users size={20} />} />
        <KPICard titulo="Viajes Semana" valor={viajesSemana} subtitulo="programados" color="yellow" icono={<Clock size={20} />} />
      </div>

      <Card>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: tokens.spacing.md }}>
          <button
            onClick={() => setSemanaOffset(semanaOffset - 1)}
            style={{ background: tokens.colors.bgHover, border: 'none', borderRadius: tokens.radius.md, padding: '8px', cursor: 'pointer', color: tokens.colors.textSecondary }}
          >
            <ChevronLeft size={20} />
          </button>
          <span style={{ color: tokens.colors.textPrimary, fontFamily: tokens.fonts.heading, fontWeight: 700, fontSize: '15px' }}>
            Semana del {fmtShort(monday)} al {fmtShort(sunday)} {sunday.getFullYear()}
          </span>
          <button
            onClick={() => setSemanaOffset(semanaOffset + 1)}
            style={{ background: tokens.colors.bgHover, border: 'none', borderRadius: tokens.radius.md, padding: '8px', cursor: 'pointer', color: tokens.colors.textSecondary }}
          >
            <ChevronRight size={20} />
          </button>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '4px', marginBottom: tokens.spacing.lg }}>
          {diasSemana.map((dia, i) => {
            const fecha = new Date(monday)
            fecha.setDate(monday.getDate() + i)
            const diaStr = fecha.toISOString().split('T')[0]
            const count = asignaciones.filter(a => a.fecha_inicio <= diaStr && a.fecha_fin >= diaStr && a.estado === 'activa').length
            return (
              <div
                key={dia}
                style={{
                  background: tokens.colors.bgCard, borderRadius: tokens.radius.md,
                  border: `1px solid ${tokens.colors.border}`, padding: '12px 8px', textAlign: 'center',
                }}
              >
                <div style={{ color: tokens.colors.textMuted, fontFamily: tokens.fonts.body, fontSize: '11px', fontWeight: 600, marginBottom: '4px' }}>
                  {dia}
                </div>
                <div style={{ color: tokens.colors.textSecondary, fontFamily: tokens.fonts.body, fontSize: '11px', marginBottom: '8px' }}>
                  {fecha.getDate()}/{fecha.getMonth() + 1}
                </div>
                <div style={{
                  color: count > 0 ? tokens.colors.green : tokens.colors.textMuted,
                  fontFamily: tokens.fonts.heading, fontSize: '18px', fontWeight: 700,
                }}>
                  {count}
                </div>
                <div style={{ color: tokens.colors.textMuted, fontFamily: tokens.fonts.body, fontSize: '10px' }}>
                  {count > 0 ? 'tractos' : 'Sin asig.'}
                </div>
              </div>
            )
          })}
        </div>
      </Card>

      <Card>
        <h3 style={{
          color: tokens.colors.textPrimary, fontFamily: tokens.fonts.heading,
          fontSize: '14px', fontWeight: 700, margin: `0 0 ${tokens.spacing.md} 0`,
        }}>
          Asignaciones de la Semana
        </h3>
        <DataTable
          columns={columns}
          data={weekAsignaciones}
          loading={loading}
          emptyMessage="No hay asignaciones programadas para esta semana"
        />
      </Card>
    </ModuleLayout>
  )
}
