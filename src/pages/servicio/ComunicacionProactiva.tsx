import type { ReactElement } from 'react'
import { useState, useEffect, Fragment } from 'react'
import { ModuleLayout } from '../../components/layout/ModuleLayout'
import { Card } from '../../components/ui/Card'
import { KPICard } from '../../components/ui/KPICard'
import { tokens } from '../../lib/tokens'
import { supabase } from '../../lib/supabase'
import {
  MessageSquare,
  Clock,
  AlertTriangle,
  CheckCircle2,
  Send,
  Phone,
  Mail,
  Bell,
  MapPin,
  Truck,
  Calendar,
  RefreshCw,
  Search,
  Filter,
  ChevronDown,
  ChevronRight,
  Zap,
  Eye,
} from 'lucide-react'

/* ─── types ─── */
interface AlertaProactiva {
  id: string
  viaje_id: string
  cliente_id: string
  cliente_nombre: string
  contacto_nombre: string
  contacto_telefono: string
  contacto_email: string
  origen: string
  destino: string
  cita_descarga: string
  eta_actual: string
  diferencia_min: number
  riesgo: 'sin_riesgo' | 'riesgo_leve' | 'riesgo_alto' | 'retraso_confirmado'
  notificado: boolean
  canal_notificacion: 'whatsapp' | 'email' | 'sms' | null
  fecha_notificacion: string | null
  tracto_numero: string
  operador: string
  notas_automaticas: string
}

/* ─── component ─── */
export default function ComunicacionProactiva(): ReactElement {
  const [alertas, setAlertas] = useState<AlertaProactiva[]>([])
  const [loading, setLoading] = useState(true)
  const [filtroRiesgo, setFiltroRiesgo] = useState<string>('todos')
  const [filtroNotificado, setFiltroNotificado] = useState<string>('todos')
  const [searchQ, setSearchQ] = useState('')
  const [expandedId, setExpandedId] = useState<string | null>(null)
  const [enviando, setEnviando] = useState<string | null>(null)

  useEffect(() => { fetchData() }, [])

  async function fetchData() {
    setLoading(true)
    try {
      const { data, error } = await supabase
        .from('alertas_proactivas')
        .select('*')
        .is('deleted_at', null)
        .order('cita_descarga', { ascending: true })
        .limit(200)

      if (error) { console.error('alertas_proactivas:', error); setAlertas([]); return }
      setAlertas((data || []) as AlertaProactiva[])
    } finally { setLoading(false) }
  }

  async function handleNotificar(alerta: AlertaProactiva, canal: 'whatsapp' | 'email') {
    setEnviando(alerta.id)
    try {
      const { error } = await supabase.functions.invoke('comunicacion-proactiva', {
        body: { alerta_id: alerta.id, canal, viaje_id: alerta.viaje_id },
      })
      if (error) { console.error('notificar:', error); return }
      await supabase.from('alertas_proactivas').update({
        notificado: true, canal_notificacion: canal, fecha_notificacion: new Date().toISOString(),
      }).eq('id', alerta.id)
      await fetchData()
    } finally { setEnviando(null) }
  }

  const stats = {
    total: alertas.length,
    sinRiesgo: alertas.filter(a => a.riesgo === 'sin_riesgo').length,
    conRiesgo: alertas.filter(a => a.riesgo === 'riesgo_leve' || a.riesgo === 'riesgo_alto').length,
    retrasados: alertas.filter(a => a.riesgo === 'retraso_confirmado').length,
    notificados: alertas.filter(a => a.notificado).length,
  }

  const riesgoStyle = (r: string) => {
    if (r === 'sin_riesgo') return { bg: tokens.colors.greenBg, color: tokens.colors.green, label: 'Sin Riesgo', icon: <CheckCircle2 size={14} /> }
    if (r === 'riesgo_leve') return { bg: tokens.colors.yellowBg, color: tokens.colors.yellow, label: 'Riesgo Leve', icon: <Clock size={14} /> }
    if (r === 'riesgo_alto') return { bg: tokens.colors.redBg, color: tokens.colors.red, label: 'Riesgo Alto', icon: <AlertTriangle size={14} /> }
    return { bg: tokens.colors.redBg, color: tokens.colors.red, label: 'Retraso', icon: <AlertTriangle size={14} /> }
  }

  const filtered = alertas.filter(a => {
    if (filtroRiesgo !== 'todos' && a.riesgo !== filtroRiesgo) return false
    if (filtroNotificado === 'si' && !a.notificado) return false
    if (filtroNotificado === 'no' && a.notificado) return false
    if (searchQ) {
      const q = searchQ.toLowerCase()
      if (!a.cliente_nombre.toLowerCase().includes(q) && !a.destino.toLowerCase().includes(q) && !a.tracto_numero.toLowerCase().includes(q)) return false
    }
    return true
  })

  const formatDiff = (min: number) => {
    if (min === 0) return 'A tiempo'
    const abs = Math.abs(min)
    const h = Math.floor(abs / 60)
    const m = abs % 60
    const txt = h > 0 ? `${h}h ${m}m` : `${m}m`
    return min > 0 ? `+${txt} tarde` : `${txt} antes`
  }

  return (
    <ModuleLayout titulo="Comunicación Proactiva — Alertas Pre-Cita" moduloPadre={{ nombre: 'Servicio', ruta: '/servicio/dashboard' }}>
      <div style={{ padding: tokens.spacing.lg, minHeight: '100vh', background: tokens.colors.bgMain }}>
        {/* KPIs */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: tokens.spacing.md, marginBottom: tokens.spacing.lg }}>
          <KPICard icon={<Bell size={20} />} label="Viajes Monitoreados" value={stats.total} />
          <KPICard icon={<CheckCircle2 size={20} />} label="Sin Riesgo" value={stats.sinRiesgo} />
          <KPICard icon={<AlertTriangle size={20} />} label="Con Riesgo" value={stats.conRiesgo} />
          <KPICard icon={<Clock size={20} />} label="Retrasados" value={stats.retrasados} />
          <KPICard icon={<Send size={20} />} label="Ya Notificados" value={stats.notificados} />
        </div>

        {/* Filters */}
        <div style={{ display: 'flex', gap: tokens.spacing.sm, marginBottom: tokens.spacing.md, alignItems: 'center', flexWrap: 'wrap' }}>
          <div style={{ position: 'relative', flex: 1, maxWidth: 300 }}>
            <Search size={16} color={tokens.colors.textMuted} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)' }} />
            <input type="text" value={searchQ} onChange={e => setSearchQ(e.target.value)}
              placeholder="Cliente, destino, tracto..."
              style={{
                width: '100%', background: tokens.colors.bgCard, color: tokens.colors.textPrimary,
                border: `1px solid ${tokens.colors.border}`, borderRadius: tokens.radius.md,
                padding: `${tokens.spacing.sm} ${tokens.spacing.md} ${tokens.spacing.sm} 36px`,
                fontFamily: tokens.fonts.body, fontSize: '14px', outline: 'none',
              }}
            />
          </div>
          {[
            { val: filtroRiesgo, set: setFiltroRiesgo, opts: [['todos', 'Riesgo: Todos'], ['sin_riesgo', 'Sin Riesgo'], ['riesgo_leve', 'Leve'], ['riesgo_alto', 'Alto'], ['retraso_confirmado', 'Retraso']] },
            { val: filtroNotificado, set: setFiltroNotificado, opts: [['todos', 'Notificación: Todos'], ['si', 'Notificados'], ['no', 'Pendientes']] },
          ].map((f, i) => (
            <select key={i} value={f.val} onChange={e => f.set(e.target.value)} style={selStyle}>
              {f.opts.map(([v, l]) => <option key={v} value={v}>{l}</option>)}
            </select>
          ))}
          <button onClick={fetchData} style={{ ...selStyle, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px' }}>
            <RefreshCw size={14} /> Actualizar
          </button>
        </div>

        {/* Alerts table */}
        <Card style={{ padding: 0, overflow: 'hidden' }}>
          {loading ? (
            <div style={{ padding: tokens.spacing.xxl, textAlign: 'center', color: tokens.colors.textMuted }}>
              <RefreshCw size={24} style={{ animation: 'spin 1s linear infinite' }} />
              <p style={{ marginTop: tokens.spacing.sm }}>Cargando alertas...</p>
            </div>
          ) : filtered.length === 0 ? (
            <div style={{ padding: tokens.spacing.xxl, textAlign: 'center' }}>
              <MessageSquare size={48} color={tokens.colors.textMuted} style={{ marginBottom: tokens.spacing.md }} />
              <p style={{ fontFamily: tokens.fonts.heading, fontSize: '16px', fontWeight: 700, color: tokens.colors.textPrimary }}>
                Sin alertas proactivas
              </p>
              <p style={{ fontSize: '14px', color: tokens.colors.textMuted, marginTop: tokens.spacing.xs }}>
                Las alertas proactivas se generan automáticamente cuando hay viajes activos
              </p>
            </div>
          ) : (
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ background: tokens.colors.bgHover }}>
                  {['', 'Cliente', 'Destino', 'Cita', 'ETA', 'Diferencia', 'Riesgo', 'Notificado', 'Acciones'].map(h => (
                    <th key={h} style={thStyle}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.map(a => {
                  const rs = riesgoStyle(a.riesgo)
                  const isOpen = expandedId === a.id
                  return (
                    <Fragment key={a.id}>
                      <tr style={{ borderBottom: `1px solid ${tokens.colors.border}`, cursor: 'pointer' }}
                        onClick={() => setExpandedId(isOpen ? null : a.id)}>
                        <td style={tdStyle}>{isOpen ? <ChevronDown size={14} /> : <ChevronRight size={14} />}</td>
                        <td style={tdStyle}><span style={{ fontWeight: 600, color: tokens.colors.textPrimary, fontSize: '13px' }}>{a.cliente_nombre}</span></td>
                        <td style={tdStyle}><span style={{ fontSize: '13px' }}><MapPin size={12} style={{ marginRight: 4 }} />{a.destino}</span></td>
                        <td style={tdStyle}><span style={{ fontSize: '12px' }}>{new Date(a.cita_descarga).toLocaleString('es-MX', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}</span></td>
                        <td style={tdStyle}><span style={{ fontSize: '12px' }}>{new Date(a.eta_actual).toLocaleString('es-MX', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}</span></td>
                        <td style={tdStyle}>
                          <span style={{
                            fontWeight: 700, fontSize: '13px',
                            color: a.diferencia_min <= 0 ? tokens.colors.green : a.diferencia_min <= 30 ? tokens.colors.yellow : tokens.colors.red,
                          }}>
                            {formatDiff(a.diferencia_min)}
                          </span>
                        </td>
                        <td style={tdStyle}>
                          <span style={{
                            display: 'inline-flex', alignItems: 'center', gap: '4px',
                            fontSize: '12px', fontWeight: 600, padding: '2px 8px',
                            borderRadius: tokens.radius.sm, background: rs.bg, color: rs.color,
                          }}>
                            {rs.icon} {rs.label}
                          </span>
                        </td>
                        <td style={tdStyle}>
                          {a.notificado ? (
                            <span style={{ fontSize: '12px', color: tokens.colors.green }}>
                              <CheckCircle2 size={12} style={{ marginRight: 4 }} />{a.canal_notificacion}
                            </span>
                          ) : (
                            <span style={{ fontSize: '12px', color: tokens.colors.textMuted }}>Pendiente</span>
                          )}
                        </td>
                        <td style={tdStyle} onClick={e => e.stopPropagation()}>
                          {!a.notificado && (a.riesgo === 'riesgo_leve' || a.riesgo === 'riesgo_alto' || a.riesgo === 'retraso_confirmado') && (
                            <div style={{ display: 'flex', gap: tokens.spacing.xs }}>
                              <button onClick={() => handleNotificar(a, 'whatsapp')} disabled={enviando === a.id}
                                style={actionBtn} title="Notificar por WhatsApp">
                                <MessageSquare size={14} color={tokens.colors.green} />
                              </button>
                              <button onClick={() => handleNotificar(a, 'email')} disabled={enviando === a.id}
                                style={actionBtn} title="Notificar por Email">
                                <Mail size={14} color={tokens.colors.primary} />
                              </button>
                            </div>
                          )}
                        </td>
                      </tr>
                      {isOpen && (
                        <tr key={`${a.id}-detail`}>
                          <td colSpan={9} style={{ padding: tokens.spacing.md, background: tokens.colors.bgHover }}>
                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: tokens.spacing.lg }}>
                              <div>
                                <p style={detailLabel}>Contacto</p>
                                <div style={detailText}>
                                  <div><strong>{a.contacto_nombre}</strong></div>
                                  <div><Phone size={12} style={{ marginRight: 4 }} />{a.contacto_telefono || '—'}</div>
                                  <div><Mail size={12} style={{ marginRight: 4 }} />{a.contacto_email || '—'}</div>
                                </div>
                              </div>
                              <div>
                                <p style={detailLabel}>Viaje</p>
                                <div style={detailText}>
                                  <div><strong>Tracto:</strong> {a.tracto_numero}</div>
                                  <div><strong>Operador:</strong> {a.operador}</div>
                                  <div><strong>Ruta:</strong> {a.origen} → {a.destino}</div>
                                </div>
                              </div>
                              <div>
                                <p style={detailLabel}>Notas Automáticas</p>
                                <p style={{ fontSize: '13px', color: tokens.colors.textSecondary, lineHeight: 1.6 }}>
                                  {a.notas_automaticas || 'Sin notas generadas.'}
                                </p>
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
  padding: `${tokens.spacing.sm} ${tokens.spacing.md}`, textAlign: 'left',
  fontSize: '12px', fontWeight: 600, color: tokens.colors.textMuted,
  fontFamily: tokens.fonts.heading, textTransform: 'uppercase', letterSpacing: '0.5px',
}
const tdStyle: React.CSSProperties = {
  padding: `${tokens.spacing.sm} ${tokens.spacing.md}`, fontSize: '14px',
  fontFamily: tokens.fonts.body, color: tokens.colors.textSecondary, verticalAlign: 'middle',
}
const selStyle: React.CSSProperties = {
  background: tokens.colors.bgCard, color: tokens.colors.textPrimary,
  border: `1px solid ${tokens.colors.border}`, borderRadius: tokens.radius.md,
  padding: `${tokens.spacing.xs} ${tokens.spacing.md}`, fontFamily: tokens.fonts.body, fontSize: '13px',
}
const actionBtn: React.CSSProperties = {
  background: 'linear-gradient(180deg, #FFFFFF 0%, #F3F4F6 100%)', border: `1px solid ${tokens.colors.border}`,
  borderRadius: tokens.radius.sm, padding: '6px', cursor: 'pointer',
  display: 'flex', alignItems: 'center', justifyContent: 'center',
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
