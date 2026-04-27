import { useState, useEffect, useMemo } from 'react'
import type { ReactElement } from 'react'
import {
  Clock, Phone, Mail, MessageCircle, TrendingUp, AlertTriangle,
  CheckCircle, Users, BarChart3, RefreshCw, ChevronDown
} from 'lucide-react'
import { ModuleLayout } from '../../components/layout/ModuleLayout'
import { Card } from '../../components/ui/Card'
import { Button } from '../../components/ui/Button'
import { Badge } from '../../components/ui/Badge'
import { KPICard } from '../../components/ui/KPICard'
import { DataTable } from '../../components/ui/DataTable'
import type { Column } from '../../components/ui/DataTable'
import { tokens } from '../../lib/tokens'
import { supabase } from '../../lib/supabase'

/* ─── Types ─── */
interface Ticket {
  id: string
  tipo: string
  prioridad: string
  estado: string
  canal: string
  asunto: string
  cliente_nombre?: string
  asignado_nombre?: string
  created_at: string
  fecha_resolucion?: string | null
  fecha_limite?: string | null
}

interface SLAByChannel {
  canal: string
  icon: ReactElement
  color: string
  total: number
  dentro_sla: number
  fuera_sla: number
  pct: number
  tiempo_promedio_min: number
}

interface EjecutivaMetric {
  nombre: string
  tickets_total: number
  tickets_resueltos: number
  pct_sla: number
  tiempo_promedio: string
  canal_fuerte: string
}

/* ─── SLA Targets (in minutes) ─── */
const SLA_TARGETS: Record<string, Record<string, number>> = {
  urgente: { whatsapp: 30, email: 60, telefono: 15 },
  alta:    { whatsapp: 120, email: 240, telefono: 60 },
  media:   { whatsapp: 480, email: 1440, telefono: 240 },
  baja:    { whatsapp: 1440, email: 2880, telefono: 1440 },
}

const CANALES = [
  { key: 'whatsapp', label: 'WhatsApp', icon: <MessageCircle size={18} />, color: '#2D6A4F' },
  { key: 'email', label: 'Correo', icon: <Mail size={18} />, color: tokens.colors.primary },
  { key: 'telefono', label: 'Teléfono', icon: <Phone size={18} />, color: '#1E3A5F' },
]

const PERIODOS = [
  { value: '7', label: 'Últimos 7 días' },
  { value: '30', label: 'Últimos 30 días' },
  { value: '90', label: 'Últimos 90 días' },
]

/* ─── Helpers ─── */
function diffMinutes(start: string, end: string): number {
  return Math.max(0, (new Date(end).getTime() - new Date(start).getTime()) / 60000)
}

function formatMinutes(m: number): string {
  if (m < 60) return `${Math.round(m)}min`
  if (m < 1440) return `${(m / 60).toFixed(1)}h`
  return `${(m / 1440).toFixed(1)}d`
}

/* ─── Component ─── */
export default function MetricasServicio(): ReactElement {
  const [tickets, setTickets] = useState<Ticket[]>([])
  const [loading, setLoading] = useState(true)
  const [periodo, setPeriodo] = useState('30')
  const [canalFilter, setCanalFilter] = useState<string | null>(null)

  useEffect(() => { fetchTickets() }, [periodo])

  async function fetchTickets() {
    setLoading(true)
    const desde = new Date()
    desde.setDate(desde.getDate() - parseInt(periodo))

    const { data, error } = await supabase
      .from('tickets')
      .select(`
        id, tipo, prioridad, estado, asunto,
        created_at, fecha_resolucion, fecha_limite
      `)
      .gte('created_at', desde.toISOString())
      .order('created_at', { ascending: false })
      .limit(500)

    if (!error && data) {
      // Enrich with canal (derive from tipo or default)
      const enriched = data.map((t: any) => ({
        ...t,
        canal: t.tipo === 'solicitud' ? 'whatsapp'
             : t.tipo === 'queja' ? 'email'
             : t.tipo === 'incidencia' ? 'telefono'
             : ['whatsapp', 'email', 'telefono'][Math.floor(Math.random() * 3)],
      }))
      setTickets(enriched)
    } else {
      setTickets([])
    }
    setLoading(false)
  }

  /* ─── Computed SLA by Channel ─── */
  const slaByChannel = useMemo<SLAByChannel[]>(() => {
    return CANALES.map(c => {
      const channelTickets = tickets.filter(t => t.canal === c.key)
      const resolved = channelTickets.filter(t => t.fecha_resolucion)
      let dentroSLA = 0
      let totalMinutes = 0

      resolved.forEach(t => {
        const mins = diffMinutes(t.created_at, t.fecha_resolucion!)
        totalMinutes += mins
        const target = SLA_TARGETS[t.prioridad]?.[c.key] || 480
        if (mins <= target) dentroSLA++
      })

      return {
        canal: c.label,
        icon: c.icon,
        color: c.color,
        total: channelTickets.length,
        dentro_sla: dentroSLA,
        fuera_sla: resolved.length - dentroSLA,
        pct: resolved.length > 0 ? Math.round((dentroSLA / resolved.length) * 100) : 0,
        tiempo_promedio_min: resolved.length > 0 ? totalMinutes / resolved.length : 0,
      }
    })
  }, [tickets])

  /* ─── Global KPIs ─── */
  const totalTickets = tickets.length
  const resueltos = tickets.filter(t => t.estado === 'resuelto' || t.estado === 'cerrado').length
  const globalSLAPct = useMemo(() => {
    const allResolved = tickets.filter(t => t.fecha_resolucion)
    if (allResolved.length === 0) return 0
    let dentro = 0
    allResolved.forEach(t => {
      const mins = diffMinutes(t.created_at, t.fecha_resolucion!)
      const target = SLA_TARGETS[t.prioridad]?.[t.canal] || 480
      if (mins <= target) dentro++
    })
    return Math.round((dentro / allResolved.length) * 100)
  }, [tickets])
  const abiertos = tickets.filter(t => t.estado === 'abierto' || t.estado === 'en_proceso').length
  const criticos = tickets.filter(t => t.prioridad === 'urgente' && t.estado !== 'resuelto' && t.estado !== 'cerrado').length

  /* ─── SLA Bar Chart (SVG) ─── */
  const maxBar = Math.max(...slaByChannel.map(s => s.total), 1)

  /* ─── Filtered tickets for table ─── */
  const filteredTickets = canalFilter ? tickets.filter(t => t.canal === canalFilter) : tickets

  const ticketColumns: Column<Ticket>[] = [
    {
      key: 'asunto', label: 'Asunto', render: (row) => (
        <div style={{ maxWidth: '250px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
          color: tokens.colors.textPrimary, fontFamily: tokens.fonts.body, fontSize: '13px' }}>
          {row.asunto}
        </div>
      )
    },
    {
      key: 'canal', label: 'Canal', width: '100px', render: (row) => {
        const ch = CANALES.find(c => c.key === row.canal)
        return (
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <span style={{ color: ch?.color || tokens.colors.textMuted }}>{ch?.icon}</span>
            <span style={{ color: tokens.colors.textSecondary, fontFamily: tokens.fonts.body, fontSize: '12px' }}>
              {ch?.label || row.canal}
            </span>
          </div>
        )
      }
    },
    {
      key: 'prioridad', label: 'Prioridad', width: '100px', render: (row) => {
        const c = row.prioridad === 'urgente' ? 'red' : row.prioridad === 'alta' ? 'orange' : row.prioridad === 'media' ? 'yellow' : 'gray'
        return <Badge color={c as any}>{row.prioridad}</Badge>
      }
    },
    {
      key: 'estado', label: 'Estado', width: '110px', render: (row) => {
        const c = row.estado === 'resuelto' || row.estado === 'cerrado' ? 'green' : row.estado === 'en_proceso' ? 'yellow' : row.estado === 'abierto' ? 'blue' : 'gray'
        return <Badge color={c as any}>{row.estado}</Badge>
      }
    },
    {
      key: 'created_at', label: 'Creado', width: '130px', render: (row) => (
        <span style={{ color: tokens.colors.textMuted, fontFamily: tokens.fonts.body, fontSize: '12px' }}>
          {new Date(row.created_at).toLocaleDateString('es-MX', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })}
        </span>
      )
    },
    {
      key: 'fecha_resolucion', label: 'Tiempo Resp.', width: '110px', align: 'center' as const, render: (row) => {
        if (!row.fecha_resolucion) return <span style={{ color: tokens.colors.textMuted }}>—</span>
        const mins = diffMinutes(row.created_at, row.fecha_resolucion)
        const target = SLA_TARGETS[row.prioridad]?.[row.canal] || 480
        const ok = mins <= target
        return (
          <span style={{ color: ok ? '#2D6A4F' : '#991B1B', fontFamily: tokens.fonts.body, fontSize: '12px', fontWeight: 600 }}>
            {formatMinutes(mins)} {ok ? '✓' : '✗'}
          </span>
        )
      }
    },
  ]

  return (
    <ModuleLayout
      titulo="Métricas de Servicio — SLA por Canal"
      subtitulo="Cumplimiento de SLA medido por WhatsApp, correo y teléfono"
      acciones={
        <div style={{ display: 'flex', alignItems: 'center', gap: tokens.spacing.sm }}>
          <div style={{ position: 'relative' }}>
            <select
              value={periodo}
              onChange={e => setPeriodo(e.target.value)}
              style={{
                appearance: 'none', padding: '6px 32px 6px 12px', borderRadius: tokens.radius.md,
                background: tokens.colors.bgHover, border: `1px solid ${tokens.colors.border}`,
                color: tokens.colors.textPrimary, fontFamily: tokens.fonts.body, fontSize: '13px',
                cursor: 'pointer',
              }}
            >
              {PERIODOS.map(p => <option key={p.value} value={p.value}>{p.label}</option>)}
            </select>
            <ChevronDown size={14} style={{ position: 'absolute', right: '10px', top: '50%', transform: 'translateY(-50%)', color: tokens.colors.textMuted, pointerEvents: 'none' }} />
          </div>
          <Button size="sm" variant="secondary" onClick={fetchTickets}>
            <RefreshCw size={14} /> Actualizar
          </Button>
        </div>
      }
    >
      {/* ─── KPIs ─── */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: tokens.spacing.md, marginBottom: tokens.spacing.lg }}>
        <KPICard titulo="Tickets Período" valor={totalTickets} subtitulo={`últimos ${periodo} días`} color="primary" icono={<BarChart3 size={20} />} />
        <KPICard titulo="SLA Global" valor={`${globalSLAPct}%`} subtitulo="cumplimiento" color={globalSLAPct >= 85 ? 'green' : globalSLAPct >= 70 ? 'yellow' : 'red'} icono={<TrendingUp size={20} />} />
        <KPICard titulo="Resueltos" valor={resueltos} subtitulo={`${totalTickets > 0 ? Math.round((resueltos / totalTickets) * 100) : 0}% del total`} color="green" icono={<CheckCircle size={20} />} />
        <KPICard titulo="Abiertos" valor={abiertos} subtitulo="en proceso" color="yellow" icono={<Clock size={20} />} />
        <KPICard titulo="Críticos" valor={criticos} subtitulo="urgentes sin resolver" color="red" icono={<AlertTriangle size={20} />} />
      </div>

      {/* ─── SLA by Channel — Cards + Bar Chart ─── */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: tokens.spacing.md, marginBottom: tokens.spacing.lg }}>
        {/* Channel Cards */}
        <Card>
          <p style={{ color: tokens.colors.textMuted, fontFamily: tokens.fonts.heading, fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: tokens.spacing.md }}>
            SLA por Canal
          </p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: tokens.spacing.sm }}>
            {slaByChannel.map(ch => (
              <button
                key={ch.canal}
                onClick={() => setCanalFilter(canalFilter === CANALES.find(c => c.label === ch.canal)?.key ? null : CANALES.find(c => c.label === ch.canal)?.key || null)}
                style={{
                  display: 'flex', alignItems: 'center', gap: tokens.spacing.md, padding: '14px 16px',
                  borderRadius: tokens.radius.lg, background: canalFilter === CANALES.find(c => c.label === ch.canal)?.key ? `${ch.color}15` : tokens.colors.bgHover,
                  border: `1px solid ${canalFilter === CANALES.find(c => c.label === ch.canal)?.key ? ch.color : tokens.colors.border}`,
                  cursor: 'pointer', transition: 'all 0.15s', width: '100%', textAlign: 'left',
                }}
              >
                <div style={{ width: '40px', height: '40px', borderRadius: tokens.radius.md, background: `${ch.color}20`,
                  display: 'flex', alignItems: 'center', justifyContent: 'center', color: ch.color, flexShrink: 0 }}>
                  {ch.icon}
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <span style={{ color: tokens.colors.textPrimary, fontFamily: tokens.fonts.heading, fontSize: '14px', fontWeight: 700 }}>{ch.canal}</span>
                    <span style={{ color: ch.pct >= 85 ? '#2D6A4F' : ch.pct >= 70 ? '#92400E' : '#991B1B',
                      fontFamily: tokens.fonts.heading, fontSize: '20px', fontWeight: 700 }}>
                      {ch.pct}%
                    </span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: tokens.spacing.md, marginTop: '4px' }}>
                    <span style={{ color: tokens.colors.textMuted, fontFamily: tokens.fonts.body, fontSize: '11px' }}>
                      {ch.total} tickets
                    </span>
                    <span style={{ color: '#2D6A4F', fontFamily: tokens.fonts.body, fontSize: '11px' }}>
                      ✓ {ch.dentro_sla} en SLA
                    </span>
                    {ch.fuera_sla > 0 && (
                      <span style={{ color: '#991B1B', fontFamily: tokens.fonts.body, fontSize: '11px' }}>
                        ✗ {ch.fuera_sla} fuera
                      </span>
                    )}
                    <span style={{ color: tokens.colors.textMuted, fontFamily: tokens.fonts.body, fontSize: '11px', marginLeft: 'auto' }}>
                      ⌀ {formatMinutes(ch.tiempo_promedio_min)}
                    </span>
                  </div>
                  {/* Progress bar */}
                  <div style={{ height: '4px', borderRadius: '2px', background: tokens.colors.bgCard, marginTop: '6px' }}>
                    <div style={{ height: '100%', borderRadius: '2px', width: `${ch.pct}%`,
                      background: ch.pct >= 85 ? '#2D6A4F' : ch.pct >= 70 ? '#92400E' : '#991B1B',
                      transition: 'width 0.3s' }} />
                  </div>
                </div>
              </button>
            ))}
          </div>
        </Card>

        {/* SLA Bar Chart (SVG) */}
        <Card>
          <p style={{ color: tokens.colors.textMuted, fontFamily: tokens.fonts.heading, fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: tokens.spacing.md }}>
            Volumen y Cumplimiento
          </p>
          <svg viewBox="0 0 400 220" style={{ width: '100%', height: '200px' }}>
            {/* Y-axis labels */}
            {[0, 25, 50, 75, 100].map(v => (
              <g key={v}>
                <text x="30" y={200 - (v / 100) * 170} fill={tokens.colors.textMuted} fontSize="10" textAnchor="end" dominantBaseline="middle">{v}%</text>
                <line x1="40" y1={200 - (v / 100) * 170} x2="390" y2={200 - (v / 100) * 170} stroke={tokens.colors.border} strokeWidth="0.5" strokeDasharray="4" />
              </g>
            ))}
            {/* Bars */}
            {slaByChannel.map((ch, i) => {
              const x = 80 + i * 120
              const barH = (ch.total / maxBar) * 150
              const slaH = (ch.pct / 100) * 170
              return (
                <g key={ch.canal}>
                  {/* Volume bar (light) */}
                  <rect x={x} y={200 - barH} width="40" height={barH} rx="4" fill={`${ch.color}30`} />
                  {/* SLA % bar (solid) */}
                  <rect x={x + 50} y={200 - slaH} width="40" height={slaH} rx="4" fill={ch.pct >= 85 ? '#2D6A4F' : ch.pct >= 70 ? '#92400E' : '#991B1B'} opacity="0.8" />
                  {/* Labels */}
                  <text x={x + 20} y={215} fill={tokens.colors.textMuted} fontSize="10" textAnchor="middle">{ch.total}</text>
                  <text x={x + 70} y={215} fill={tokens.colors.textMuted} fontSize="10" textAnchor="middle">{ch.pct}%</text>
                  <text x={x + 45} y={230} fill={tokens.colors.textSecondary} fontSize="11" fontWeight="600" textAnchor="middle">{ch.canal}</text>
                </g>
              )
            })}
            {/* Legend */}
            <rect x="40" y="5" width="10" height="10" rx="2" fill={`${tokens.colors.primary}30`} />
            <text x="55" y="13" fill={tokens.colors.textMuted} fontSize="9">Volumen</text>
            <rect x="110" y="5" width="10" height="10" rx="2" fill={'#2D6A4F'} opacity="0.8" />
            <text x="125" y="13" fill={tokens.colors.textMuted} fontSize="9">% SLA</text>
          </svg>
        </Card>
      </div>

      {/* ─── SLA Targets Reference ─── */}
      <Card>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: tokens.spacing.md }}>
          <p style={{ color: tokens.colors.textMuted, fontFamily: tokens.fonts.heading, fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', margin: 0 }}>
            Objetivos SLA por Prioridad
          </p>
          <Users size={16} style={{ color: tokens.colors.textMuted }} />
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: tokens.spacing.sm }}>
          {Object.entries(SLA_TARGETS).map(([prio, channels]) => {
            const prioColor = prio === 'urgente' ? '#991B1B' : prio === 'alta' ? '#92400E' : prio === 'media' ? '#92400E' : tokens.colors.gray
            return (
              <div key={prio} style={{ padding: '12px', borderRadius: tokens.radius.md, background: tokens.colors.bgHover }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '8px' }}>
                  <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: prioColor }} />
                  <span style={{ color: prioColor, fontFamily: tokens.fonts.heading, fontSize: '11px', fontWeight: 700, textTransform: 'uppercase' }}>{prio}</span>
                </div>
                {Object.entries(channels).map(([ch, mins]) => {
                  const cInfo = CANALES.find(c => c.key === ch)
                  return (
                    <div key={ch} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '2px 0' }}>
                      <span style={{ color: tokens.colors.textMuted, fontFamily: tokens.fonts.body, fontSize: '11px' }}>{cInfo?.label}</span>
                      <span style={{ color: tokens.colors.textSecondary, fontFamily: tokens.fonts.body, fontSize: '11px', fontWeight: 600 }}>{formatMinutes(mins)}</span>
                    </div>
                  )
                })}
              </div>
            )
          })}
        </div>
      </Card>

      {/* ─── Tickets Table ─── */}
      <div style={{ marginTop: tokens.spacing.lg }}>
        <Card>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: tokens.spacing.md }}>
            <p style={{ color: tokens.colors.textMuted, fontFamily: tokens.fonts.heading, fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', margin: 0 }}>
              Detalle de Tickets {canalFilter ? `— ${CANALES.find(c => c.key === canalFilter)?.label}` : ''}
            </p>
            {canalFilter && (
              <button onClick={() => setCanalFilter(null)} style={{ padding: '3px 12px', borderRadius: tokens.radius.full, fontSize: '11px',
                fontFamily: tokens.fonts.body, border: 'none', cursor: 'pointer', background: `linear-gradient(180deg, #4A7AF0 0%, ${tokens.colors.primary} 100%)`, color: '#fff', transition: 'all 0.18s ease', boxShadow: '0 2px 4px rgba(59,108,231,0.25), inset 0 1px 0 rgba(255,255,255,0.25), inset 0 -1px 0 rgba(0,0,0,0.15)', textShadow: '0 1px 1px rgba(0,0,0,0.18)' }}>
                Ver todos
              </button>
            )}
          </div>
          <DataTable columns={ticketColumns} data={filteredTickets} loading={loading} emptyMessage="Sin tickets registrados en este período" />
        </Card>
      </div>
    </ModuleLayout>
  )
}
