import { useState, useEffect } from 'react'
import { AlertTriangle, Clock, CheckCircle, Plus, Filter } from 'lucide-react'
import { ModuleLayout } from '../../components/layout/ModuleLayout'
import { Card } from '../../components/ui/Card'
import { Button } from '../../components/ui/Button'
import { Badge } from '../../components/ui/Badge'
import { KPICard } from '../../components/ui/KPICard'
import { DataTable, type Column } from '../../components/ui/DataTable'
import { tokens } from '../../lib/tokens'
import { supabase } from '../../lib/supabase'

interface Ticket {
  id: string
  numero: string
  cliente: string
  tipo: 'queja' | 'solicitud' | 'incidencia' | 'reclamo'
  prioridad: 'alta' | 'media' | 'baja'
  estado: 'abierto' | 'en_proceso' | 'resuelto' | 'cerrado'
  created_at: string
  asignado_a?: string
  sla_horas?: number
}

interface KPIStats {
  totalAbiertos: number
  slaCumplido: number
  tiempoPromedio: string
  criticosPorcentaje: number
  totalTickets: number
}

export default function TicketsQuejas() {
  const [tickets, setTickets] = useState<Ticket[]>([])
  const [loading, setLoading] = useState(true)
  const [stats, setStats] = useState<KPIStats>({
    totalAbiertos: 0,
    slaCumplido: 0,
    tiempoPromedio: '—',
    criticosPorcentaje: 0,
    totalTickets: 0,
  })
  const [filtroEstado, setFiltroEstado] = useState<string>('')
  const [filtroPrioridad, setFiltroPrioridad] = useState<string>('')

  // Cargar tickets desde Supabase
  useEffect(() => {
    const fetchTickets = async () => {
      try {
        setLoading(true)
        const { data, error } = await supabase
          .from('tickets')
          .select('*')
          .is('deleted_at', null)  // V52 FIX M02-01: respetar soft delete
          .order('created_at', { ascending: false })

        if (error) {
          console.warn('Tabla tickets no existe o error:', error.message)
          setTickets([])
        } else {
          setTickets(data || [])
          calculateStats(data || [])
        }
      } catch (err) {
        console.error('Error fetching tickets:', err)
        setTickets([])
      } finally {
        setLoading(false)
      }
    }

    fetchTickets()
  }, [])

  // Calcular estadísticas
  const calculateStats = (allTickets: Ticket[]) => {
    const abiertos = allTickets.filter(t => t.estado === 'abierto').length
    const total = allTickets.length
    const criticos = allTickets.filter(t => t.prioridad === 'alta').length

    let slaCumplidoCount = 0
    let sumaHoras = 0

    allTickets.forEach(ticket => {
      const horasTranscurridas = calcularSLA(ticket.created_at).horasTranscurridas
      sumaHoras += horasTranscurridas

      const slaTarget = getSLATarget(ticket.prioridad)
      if (horasTranscurridas <= slaTarget) {
        slaCumplidoCount++
      }
    })

    const slaCumplidoPct = total > 0 ? Math.round((slaCumplidoCount / total) * 100) : 0
    const tiempoPromedio = total > 0 ? `${Math.round(sumaHoras / total)}h` : '—'

    setStats({
      totalAbiertos: abiertos,
      slaCumplido: slaCumplidoPct,
      tiempoPromedio,
      criticosPorcentaje: total > 0 ? Math.round((criticos / total) * 100) : 0,
      totalTickets: total,
    })
  }

  // Obtener target SLA en horas según prioridad
  const getSLATarget = (prioridad: 'alta' | 'media' | 'baja'): number => {
    const targets = { alta: 4, media: 24, baja: 72 }
    return targets[prioridad]
  }

  // Calcular SLA
  const calcularSLA = (fechaCreacion: string) => {
    const ahora = new Date()
    const creacion = new Date(fechaCreacion)
    const horasTranscurridas = (ahora.getTime() - creacion.getTime()) / (1000 * 60 * 60)
    return { horasTranscurridas }
  }

  // Obtener estado SLA (verde, amarillo, rojo)
  const getStatusSLA = (ticket: Ticket) => {
    const slaTarget = getSLATarget(ticket.prioridad)
    const { horasTranscurridas } = calcularSLA(ticket.created_at)
    const porcentajeUsado = (horasTranscurridas / slaTarget) * 100

    if (horasTranscurridas > slaTarget) return 'red'
    if (porcentajeUsado > 75) return 'yellow'
    return 'green'
  }

  // Filtrar tickets
  const ticketsFiltered = tickets.filter(t => {
    if (filtroEstado && t.estado !== filtroEstado) return false
    if (filtroPrioridad && t.prioridad !== filtroPrioridad) return false
    return true
  })

  // Columnas de la tabla
  const columns: Column<Ticket>[] = [
    {
      key: 'numero',
      label: '#',
      width: '60px',
      render: (row) => (
        <span style={{ fontWeight: 600, color: tokens.colors.primary }}>
          {row.numero || row.id.slice(0, 8)}
        </span>
      ),
    },
    {
      key: 'cliente',
      label: 'Cliente',
      width: '140px',
    },
    {
      key: 'tipo',
      label: 'Tipo',
      width: '100px',
      render: (row) => (
        <span style={{ textTransform: 'capitalize', color: tokens.colors.textSecondary }}>
          {row.tipo}
        </span>
      ),
    },
    {
      key: 'prioridad',
      label: 'Prioridad',
      width: '100px',
      render: (row) => {
        const colorMap = {
          alta: 'red',
          media: 'yellow',
          baja: 'green',
        }
        return (
          <Badge color={colorMap[row.prioridad] as any}>
            {row.prioridad.charAt(0).toUpperCase() + row.prioridad.slice(1)}
          </Badge>
        )
      },
    },
    {
      key: 'estado',
      label: 'Estado',
      width: '100px',
      render: (row) => {
        const colorMap = {
          abierto: 'red',
          en_proceso: 'yellow',
          resuelto: 'green',
          cerrado: 'gray',
        }
        const labelMap = {
          abierto: 'Abierto',
          en_proceso: 'En proceso',
          resuelto: 'Resuelto',
          cerrado: 'Cerrado',
        }
        return (
          <Badge color={colorMap[row.estado] as any}>
            {labelMap[row.estado]}
          </Badge>
        )
      },
    },
    {
      key: 'sla',
      label: 'SLA',
      width: '80px',
      render: (row) => {
        const slaStatus = getStatusSLA(row)
        const { horasTranscurridas } = calcularSLA(row.created_at)
        const slaTarget = getSLATarget(row.prioridad)
        const hrsRemaining = Math.max(0, slaTarget - horasTranscurridas)

        return (
          <div style={{ display: 'flex', alignItems: 'center', gap: tokens.spacing.xs }}>
            <Badge color={slaStatus === 'green' ? 'green' : slaStatus === 'yellow' ? 'yellow' : 'red'}>
              {slaStatus === 'red' ? 'Vencido' : `${hrsRemaining.toFixed(1)}h`}
            </Badge>
          </div>
        )
      },
    },
    {
      key: 'asignado_a',
      label: 'Asignado',
      width: '120px',
      render: (row) => (
        <span style={{ color: tokens.colors.textSecondary }}>
          {row.asignado_a || '—'}
        </span>
      ),
    },
    {
      key: 'created_at',
      label: 'Fecha',
      width: '100px',
      render: (row) => {
        const fecha = new Date(row.created_at)
        return (
          <span style={{ color: tokens.colors.textSecondary, fontSize: '12px' }}>
            {fecha.toLocaleDateString('es-ES')}
          </span>
        )
      },
    },
    {
      key: 'acciones',
      label: 'Acciones',
      width: '80px',
      render: () => (
        <Button
          variant="secondary"
          size="sm"
          onClick={(e) => {
            e.stopPropagation()
          }}
        >
          Ver
        </Button>
      ),
    },
  ]

  return (
    <ModuleLayout
      titulo="Tickets & Quejas"
      subtitulo="Gestión de reclamos y solicitudes de clientes"
      moduloPadre={{ nombre: 'Servicio', ruta: '/servicio/dashboard' }}
      acciones={
        <Button variant="primary" size="md">
          <Plus size={18} />
          Nuevo Ticket
        </Button>
      }
    >
      <div style={{ display: 'flex', flexDirection: 'column', gap: tokens.spacing.lg, height: '100%' }}>
        {/* KPI Cards Row */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(4, 1fr)',
            gap: tokens.spacing.lg,
            flexShrink: 0,
          }}
        >
          <KPICard
            titulo="Tickets Abiertos"
            valor={stats.totalAbiertos}
            icono={<AlertTriangle size={20} />}
            color="red"
            subtitulo={`de ${stats.totalTickets} total`}
          />
          <KPICard
            titulo="SLA Cumplido"
            valor={`${stats.slaCumplido}%`}
            icono={<CheckCircle size={20} />}
            color="green"
            subtitulo="del total de tickets"
          />
          <KPICard
            titulo="Tiempo Promedio"
            valor={stats.tiempoPromedio}
            icono={<Clock size={20} />}
            color="blue"
            subtitulo="resolución"
          />
          <KPICard
            titulo="Críticos"
            valor={`${stats.criticosPorcentaje}%`}
            icono={<AlertTriangle size={20} />}
            color="orange"
            subtitulo="de prioridad alta"
          />
        </div>

        {/* Filters Row */}
        <div
          style={{
            display: 'flex',
            gap: tokens.spacing.md,
            alignItems: 'center',
            flexShrink: 0,
            paddingBottom: tokens.spacing.md,
            borderBottom: `1px solid ${tokens.colors.border}`,
          }}
        >
          <div
            style={{
              display: 'flex',
              gap: tokens.spacing.sm,
              alignItems: 'center',
            }}
          >
            <Filter size={16} style={{ color: tokens.colors.textSecondary }} />
            <span style={{ color: tokens.colors.textSecondary, fontSize: '13px', fontFamily: tokens.fonts.body }}>
              Estado:
            </span>
            {['abierto', 'en_proceso', 'resuelto', 'cerrado'].map(estado => (
              <button
                key={estado}
                onClick={() => setFiltroEstado(filtroEstado === estado ? '' : estado)}
                style={{
                  padding: `${tokens.spacing.xs} ${tokens.spacing.sm}`,
                  border: `1px solid ${filtroEstado === estado ? tokens.colors.primary : tokens.colors.border}`,
                  borderRadius: tokens.radius.md,
                  background: filtroEstado === estado ? 'rgba(30, 102, 245, 0.15)' : 'transparent',
                  color: filtroEstado === estado ? tokens.colors.primary : tokens.colors.textSecondary,
                  fontFamily: tokens.fonts.body,
                  fontSize: '12px',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease',
                  textTransform: 'capitalize',
                }}
              >
                {estado.replace('_', ' ')}
              </button>
            ))}
          </div>

          <div
            style={{
              display: 'flex',
              gap: tokens.spacing.sm,
              alignItems: 'center',
              marginLeft: tokens.spacing.lg,
            }}
          >
            <span style={{ color: tokens.colors.textSecondary, fontSize: '13px', fontFamily: tokens.fonts.body }}>
              Prioridad:
            </span>
            {['alta', 'media', 'baja'].map(prioridad => (
              <button
                key={prioridad}
                onClick={() => setFiltroPrioridad(filtroPrioridad === prioridad ? '' : prioridad)}
                style={{
                  padding: `${tokens.spacing.xs} ${tokens.spacing.sm}`,
                  border: `1px solid ${filtroPrioridad === prioridad ? tokens.colors.primary : tokens.colors.border}`,
                  borderRadius: tokens.radius.md,
                  background: filtroPrioridad === prioridad ? 'rgba(30, 102, 245, 0.15)' : 'transparent',
                  color: filtroPrioridad === prioridad ? tokens.colors.primary : tokens.colors.textSecondary,
                  fontFamily: tokens.fonts.body,
                  fontSize: '12px',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease',
                  textTransform: 'capitalize',
                }}
              >
                {prioridad}
              </button>
            ))}
          </div>
        </div>

        {/* Data Table */}
        <Card style={{ flex: 1, overflow: 'auto', display: 'flex', flexDirection: 'column' }}>
          <div style={{ flex: 1, overflow: 'auto' }}>
            <DataTable<Ticket>
              columns={columns}
              data={ticketsFiltered}
              loading={loading}
              emptyMessage={tickets.length === 0 ? 'Aún no hay registros' : 'Sin resultados para los filtros seleccionados'}
            />
          </div>
        </Card>
      </div>
    </ModuleLayout>
  )
}
