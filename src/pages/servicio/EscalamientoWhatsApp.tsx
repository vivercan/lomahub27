import type { ReactElement } from 'react'
import { useState, useEffect, Fragment } from 'react'
import { ModuleLayout } from '../../components/layout/ModuleLayout'
import { Card } from '../../components/Card'
import { KPICard } from '../../components/KPICard'
import { tokens } from '../../lib/tokens'
import { supabase } from '../../lib/supabase'
import {
  MessageSquare,
  ArrowUpRight,
  Clock,
  CheckCircle2,
  AlertTriangle,
  Users,
  Phone,
  Mail,
  Shield,
  Search,
  RefreshCw,
  ChevronDown,
  ChevronRight,
  Send,
  UserCheck,
  XCircle,
  Filter,
  Zap,
} from 'lucide-react'

/* ─── types ─── */
interface Escalamiento {
  id: string
  ticket_id: string | null
  viaje_id: string | null
  cliente_id: string
  cliente_nombre: string
  contacto_nombre: string
  contacto_telefono: string
  canal_origen: 'whatsapp' | 'email' | 'telefono'
  motivo: string
  descripcion: string
  nivel_escalamiento: 1 | 2 | 3
  nivel_label: string
  estado: 'pendiente' | 'asignado' | 'en_proceso' | 'resuelto' | 'cerrado'
  asignado_a: string | null
  asignado_nombre: string | null
  prioridad: 'baja' | 'media' | 'alta' | 'urgente'
  tiempo_respuesta_min: number | null
  resolucion: string | null
  created_at: string
  updated_at: string
}

/* ─── component ─── */
export default function EscalamientoWhatsApp(): ReactElement {
  const [escalamientos, setEscalamientos] = useState<Escalamiento[]>([])
  const [loading, setLoading] = useState(true)
  const [filtroEstado, setFiltroEstado] = useState<string>('todos')
  const [filtroNivel, setFiltroNivel] = useState<string>('todos')
  const [filtroPrioridad, setFiltroPrioridad] = useState<string>('todos')
  const [searchQ, setSearchQ] = useState('')
  const [expandedId, setExpandedId] = useState<string | null>(null)
  const [escalando, setEscalando] = useState<string | null>(null)

  useEffect(() => { fetchData() }, [])

  async function fetchData() {
    setLoading(true)
    try {
      const { data, error } = await supabase
        .from('escalamientos_whatsapp')
        .select('*')
        .is('deleted_at', null)
        .order('created_at', { ascending: false })
        .limit(200)

      if (error) { console.error('escalamientos_whatsapp:', error); setEscalamientos([]); return }

      setEscalamientos((data || []).map((d: any) => ({
        ...d,
        nivel_label: d.nivel_escalamiento === 1 ? 'Supervisor' : d.nivel_escalamiento === 2 ? 'Gerencia' : 'Dirección',
      })))
    } finally { setLoading(false) }
  }

  async function handleEscalar(esc: Escalamiento, nuevoNivel: number) {
    setEscalando(esc.id)
    try {
      const { error } = await supabase.functions.invoke('escalamiento-whatsapp', {
        body: { escalamiento_id: esc.id, accion: 'escalar', nivel: nuevoNivel },
      })
      if (error) { console.error('escalar:', error); return }
      await fetchData()
    } finally { setEscalando(null) }
  }

  async function handleResolver(esc: Escalamiento) {
    setEscalando(esc.id)
    try {
      const { error } = await supabase
        .from('escalamientos_whatsapp')
        .update({ estado: 'resuelto', updated_at: new Date().toISOString() })
        .eq('id', esc.id)
      if (error) { console.error('resolver:', error); return }
      await fetchData()
    } finally { setEscalando(null) }
  }

  const stats = {
    total: escalamientos.length,
    pendientes: escalamientos.filter(e => e.estado === 'pendiente' || e.estado === 'asignado').length,
    enProceso: escalamientos.filter(e => e.estado === 'en_proceso').length,
    resueltos: escalamientos.filter(e => e.estado === 'resuelto' || e.estado === 'cerrado').length,
    urgentes: escalamientos.filter(e => e.prioridad === 'urgente' || e.prioridad === 'alta').length,
  }

  const filtered = escalamientos.filter(e => {
    if (filtroEstado !== 'todos' && e.estado !== filtroEstado) return false
    if (filtroNivel !== 'todos' && String(e.nivel_escalamiento) !== filtroNivel) return false
    if (filtroPrioridad !== 'todos' && e.prioridad !== filtroPrioridad) return false
    if (searchQ) {
      const q = searchQ.toLowerCase()
      if (!e.cliente_nombre.toLowerCase().includes(q) &&
          !e.motivo.toLowerCase().includes(q) &&
          !e.contacto_nombre.toLowerCase().includes(q)) return false
    }
    return true
  })

  const estadoStyle = (estado: string) => {
    if (estado === 'pendiente') return { bg: tokens.colors.yellowBg, color: tokens.colors.yellow, label: 'Pendiente', icon: <Clock size={14} /> }
    if (estado === 'asignado') return { bg: tokens.colors.blueBg, color: tokens.colors.blue, label: 'Asignado', icon: <UserCheck size={14} /> }
    if (estado === 'en_proceso') return { bg: tokens.colors.blueBg, color: tokens.colors.primary, label: 'En Proceso', icon: <Zap size={14} /> }
    if (estado === 'resuelto') return { bg: tokens.colors.greenBg, color: tokens.colors.green, label: 'Resuelto', icon: <CheckCircle2 size={14} /> }
    return { bg: tokens.colors.greenBg, color: tokens.colors.green, label: 'Cerrado', icon: <CheckCircle2 size={14} /> }
  }

  const prioridadStyle = (p: string) => {
    if (p === 'urgente') return { bg: tokens.colors.redBg, color: tokens.colors.red }
    if (p === 'alta') return { bg: tokens.colors.redBg, color: tokens.colors.red }
    if (p === 'media') return { bg: tokens.colors.yellowBg, color: tokens.colors.yellow }
    return { bg: tokens.colors.greenBg, color: tokens.colors.green }
  }

  const nivelStyle = (n: number) => {
    if (n === 3) return { bg: tokens.colors.redBg, color: tokens.colors.red, label: 'Dirección' }
    if (n === 2) return { bg: tokens.colors.yellowBg, color: tokens.colors.yellow, label: 'Gerencia' }
    return { bg: tokens.colors.blueBg, color: tokens.colors.blue, label: 'Supervisor' }
  }

  const formatTime = (min: number | null) => {
    if (min === null) return '—'
    if (min < 60) return `${min}m`
    const h = Math.floor(min / 60)
    const m = min % 60
    return m > 0 ? `${h}h ${m}m` : `${h}h`
  }

  return (
    <ModuleLayout titulo="Escalamiento WhatsApp — Supervisión y Gerencia">
      <div style={{ padding: tokens.spacing.lg, minHeight: '100vh', background: tokens.colors.bgMain }}>

        {/* KPIs */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: tokens.spacing.md, marginBottom: tokens.spacing.lg }}>
          <KPICard icon={<ArrowUpRight size={20} />} label="Total Escalamientos" value={stats.total} />
          <KPICard icon={<Clock size={20} />} label="Pendientes" value={stats.pendientes} />
          <KPICard icon={<Zap size={20} />} label="En Proceso" value={stats.enProceso} />
          <KPICard icon={<CheckCircle2 size={20} />} label="Resueltos" value={stats.resueltos} />
          <KPICard icon={<AlertTriangle size={20} />} label="Alta/Urgente" value={stats.urgentes} />
        </div>

        {/* Filters */}
        <div style={{ display: 'flex', gap: tokens.spacing.sm, marginBottom: tokens.spacing.md, alignItems: 'center', flexWrap: 'wrap' }}>
          <div style={{ position: 'relative', flex: 1, maxWidth: 300 }}>
            <Search size={16} color={tokens.colors.textMuted} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)' }} />
            <input
              type="text"
              value={searchQ}
              onChange={e => setSearchQ(e.target.value)}
              placeholder="Cliente, motivo, contacto..."
              style={{
                width: '100%', background: tokens.colors.bgCard, color: tokens.colors.textPrimary,
                border: `1px solid ${tokens.colors.border}`, borderRadius: tokens.radius.md,
                padding: `${tokens.spacing.sm} ${tokens.spacing.md} ${tokens.spacing.sm} 36px`,
                fontFamily: tokens.fonts.body, fontSize: '14px', outline: 'none',
              }}
            />
          </div>
          {[
            { val: filtroEstado, set: setFiltroEstado, opts: [['todos', 'Estado: Todos'], ['pendiente', 'Pendiente'], ['asignado', 'Asignado'], ['en_proceso', 'En Proceso'], ['resuelto', 'Resuelto']] },
            { val: filtroNivel, set: setFiltroNivel, opts: [['todos', 'Nivel: Todos'], ['1', 'Supervisor'], ['2', 'Gerencia'], ['3', 'Dirección']] },
            { val: filtroPrioridad, set: setFiltroPrioridad, opts: [['todos', 'Prioridad: Todos'], ['urgente', 'Urgente'], ['alta', 'Alta'], ['media', 'Media'], ['baja', 'Baja']] },
          ].map((f, i) => (
            <select key={i} value={f.val} onChange={e => f.set(e.target.value)} style={selStyle}>
              {f.opts.map(([v, l]) => <option key={v} value={v}>{l}</option>)}
            </select>
          ))}
          <button onClick={fetchData} style={{ ...selStyle, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px' }}>
            <RefreshCw size={14} /> Actualizar
          </button>
        </div>

        {/* Table */}
        <Card style={{ padding: 0, overflow: 'hidden' }}>
          {loading ? (
            <div style={{ padding: tokens.spacing.xxl, textAlign: 'center', color: tokens.colors.textMuted }}>
              <RefreshCw size={24} style={{ animation: 'spin 1s linear infinite' }} />
              <p style={{ marginTop: tokens.spacing.sm }}>Cargando escalamientos...</p>
            </div>
          ) : filtered.length === 0 ? (
            <div style={{ padding: tokens.spacing.xxl, textAlign: 'center' }}>
              <MessageSquare size={48} color={tokens.colors.textMuted} style={{ marginBottom: tokens.spacing.md }} />
              <p style={{ fontFamily: tokens.fonts.heading, fontSize: '16px', fontWeight: 700, color: tokens.colors.textPrimary }}>
                Sin escalamientos registrados
              </p>
              <p style={{ fontSize: '14px', color: tokens.colors.textMuted, marginTop: tokens.spacing.xs }}>
                Ejecutar migración 013 en Supabase para habilitar tabla escalamientos_whatsapp
              </p>
            </div>
          ) : (
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ background: tokens.colors.bgHover }}>
                  {['', 'Cliente', 'Motivo', 'Nivel', 'Prioridad', 'Estado', 'Asignado', 'Tiempo', 'Fecha'].map(h => (
                    <th key={h} style={thStyle}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.map(e => {
                  const es = estadoStyle(e.estado)
                  const ps = prioridadStyle(e.prioridad)
                  const ns = nivelStyle(e.nivel_escalamiento)
                  const isOpen = expandedId === e.id
                  return (
                    <Fragment key={e.id}>
                      <tr
                        style={{ borderBottom: `1px solid ${tokens.colors.border}`, cursor: 'pointer' }}
                        onClick={() => setExpandedId(isOpen ? null : e.id)}
                      >
                        <td style={tdStyle}>{isOpen ? <ChevronDown size={14} /> : <ChevronRight size={14} />}</td>
                        <td style={tdStyle}>
                          <span style={{ fontWeight: 600, color: tokens.colors.textPrimary, fontSize: '13px' }}>{e.cliente_nombre}</span>
                        </td>
                        <td style={tdStyle}>
                          <span style={{ fontSize: '13px', maxWidth: 200, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', display: 'inline-block' }}>
                            {e.motivo}
                          </span>
                        </td>
                        <td style={tdStyle}>
                          <span style={{
                            display: 'inline-flex', alignItems: 'center', gap: '4px', fontSize: '12px', fontWeight: 600,
                            padding: '2px 8px', borderRadius: tokens.radius.sm, background: ns.bg, color: ns.color,
                          }}>
                            <Shield size={12} /> {ns.label}
                          </span>
                        </td>
                        <td style={tdStyle}>
                          <span style={{
                            fontSize: '12px', fontWeight: 600, padding: '2px 8px', borderRadius: tokens.radius.sm,
                            background: ps.bg, color: ps.color, textTransform: 'uppercase',
                          }}>
                            {e.prioridad}
                          </span>
                        </td>
                        <td style={tdStyle}>
                          <span style={{
                            display: 'inline-flex', alignItems: 'center', gap: '4px', fontSize: '12px', fontWeight: 600,
                            padding: '2px 8px', borderRadius: tokens.radius.sm, background: es.bg, color: es.color,
                          }}>
                            {es.icon} {es.label}
                          </span>
                        </td>
                        <td style={tdStyle}>
                          <span style={{ fontSize: '13px', color: e.asignado_nombre ? tokens.colors.textPrimary : tokens.colors.textMuted }}>
                            {e.asignado_nombre || 'Sin asignar'}
                          </span>
                        </td>
                        <td style={tdStyle}>
                          <span style={{
                            fontSize: '12px', fontWeight: 600,
                            color: (e.tiempo_respuesta_min || 0) > 60 ? tokens.colors.red : (e.tiempo_respuesta_min || 0) > 30 ? tokens.colors.yellow : tokens.colors.green,
                          }}>
                            {formatTime(e.tiempo_respuesta_min)}
                          </span>
                        </td>
                        <td style={tdStyle}>
                          <span style={{ fontSize: '12px', color: tokens.colors.textMuted }}>
                            {new Date(e.created_at).toLocaleDateString('es-MX', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                          </span>
                        </td>
                      </tr>
                      {isOpen && (
                        <tr key={`${e.id}-detail`}>
                          <td colSpan={9} style={{ padding: tokens.spacing.md, background: tokens.colors.bgHover }}>
                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: tokens.spacing.lg }}>
                              <div>
                                <p style={detailLabel}>Contacto</p>
                                <div style={detailText}>
                                  <div><strong>{e.contacto_nombre}</strong></div>
                                  <div><Phone size={12} style={{ marginRight: 4 }} />{e.contacto_telefono || '—'}</div>
                                  <div><MessageSquare size={12} style={{ marginRight: 4 }} />Canal: {e.canal_origen}</div>
                                </div>
                              </div>
                              <div>
                                <p style={detailLabel}>Descripción</p>
                                <p style={{ fontSize: '13px', color: tokens.colors.textSecondary, lineHeight: 1.6 }}>
                                  {e.descripcion || 'Sin descripción detallada.'}
                                </p>
                                {e.resolucion && (
                                  <>
                                    <p style={{ ...detailLabel, marginTop: tokens.spacing.sm }}>Resolución</p>
                                    <p style={{ fontSize: '13px', color: tokens.colors.green, lineHeight: 1.6 }}>
                                      {e.resolucion}
                                    </p>
                                  </>
                                )}
                              </div>
                              <div>
                                <p style={detailLabel}>Acciones</p>
                                <div style={{ display: 'flex', flexDirection: 'column', gap: tokens.spacing.sm }}>
                                  {e.estado !== 'resuelto' && e.estado !== 'cerrado' && (
                                    <>
                                      {e.nivel_escalamiento < 2 && (
                                        <button
                                          onClick={(ev) => { ev.stopPropagation(); handleEscalar(e, 2) }}
                                          disabled={escalando === e.id}
                                          style={actionBtnStyle}
                                        >
                                          <ArrowUpRight size={14} color={tokens.colors.yellow} />
                                          <span>Escalar a Gerencia</span>
                                        </button>
                                      )}
                                      {e.nivel_escalamiento < 3 && (
                                        <button
                                          onClick={(ev) => { ev.stopPropagation(); handleEscalar(e, 3) }}
                                          disabled={escalando === e.id}
                                          style={actionBtnStyle}
                                        >
                                          <ArrowUpRight size={14} color={tokens.colors.red} />
                                          <span>Escalar a Dirección</span>
                                        </button>
                                      )}
                                      <button
                                        onClick={(ev) => { ev.stopPropagation(); handleResolver(e) }}
                                        disabled={escalando === e.id}
                                        style={actionBtnStyle}
                                      >
                                        <CheckCircle2 size={14} color={tokens.colors.green} />
                                        <span>Marcar Resuelto</span>
                                      </button>
                                    </>
                                  )}
                                  {(e.estado === 'resuelto' || e.estado === 'cerrado') && (
                                    <span style={{ fontSize: '13px', color: tokens.colors.green }}>
                                      <CheckCircle2 size={14} style={{ marginRight: 4 }} />Caso cerrado
                                    </span>
                                  )}
                                </div>
                              </div>
                            </div>
                          </td>
                        </tr>
                      )}
                    </Fragment>
                  )
                })}
              </tbody>
            </table>
          )}
        </Card>
      </div>
    </ModuleLayout>
  )
}

/* ─── styles ─── */
const thStyle: React.CSSProperties = {
  padding: `${tokens.spacing.sm} ${tokens.spacing.md}`,
  textAlign: 'left', fontSize: '12px', fontWeight: 600,
  color: tokens.colors.textMuted, fontFamily: tokens.fonts.heading,
  textTransform: 'uppercase', letterSpacing: '0.5px',
}

const tdStyle: React.CSSProperties = {
  padding: `${tokens.spacing.sm} ${tokens.spacing.md}`,
  fontSize: '14px', fontFamily: tokens.fonts.body,
  color: tokens.colors.textSecondary, verticalAlign: 'middle',
}

const selStyle: React.CSSProperties = {
  background: tokens.colors.bgCard, color: tokens.colors.textPrimary,
  border: `1px solid ${tokens.colors.border}`, borderRadius: tokens.radius.md,
  padding: `${tokens.spacing.xs} ${tokens.spacing.md}`,
  fontFamily: tokens.fonts.body, fontSize: '13px',
}

const actionBtnStyle: React.CSSProperties = {
  background: 'linear-gradient(180deg, #FFFFFF 0%, #F3F4F6 100%)', border: `1px solid ${tokens.colors.border}`,
  borderRadius: tokens.radius.sm, padding: `${tokens.spacing.xs} ${tokens.spacing.sm}`,
  cursor: 'pointer', display: 'flex', alignItems: 'center', gap: tokens.spacing.xs,
  color: tokens.colors.textPrimary, fontFamily: tokens.fonts.body, fontSize: '13px',
  transition: 'all 0.18s ease',
  boxShadow: '0 1px 3px rgba(0,0,0,0.10), inset 0 1px 0 rgba(255,255,255,0.80), inset 0 -1px 0 rgba(0,0,0,0.05)',
}

const detailLabel: React.CSSProperties = {
  fontSize: '12px', fontWeight: 700, color: tokens.colors.textMuted,
  marginBottom: tokens.spacing.sm, textTransform: 'uppercase',
}

const detailText: React.CSSProperties = {
  fontSize: '13px', color: tokens.colors.textSecondary, lineHeight: 1.8,
}
