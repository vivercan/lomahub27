import type { ReactElement } from 'react'
import { useState, useEffect, useRef } from 'react'
import { ModuleLayout } from '../../components/layout/ModuleLayout'
import { Card } from '../../components/Card'
import { KPICard } from '../../components/KPICard'
import { tokens } from '../../lib/tokens'
import { supabase } from '../../lib/supabase'
import {
  PenTool,
  FileText,
  CheckCircle2,
  Clock,
  XCircle,
  Search,
  RefreshCw,
  Download,
  Eye,
  Send,
  Shield,
  Hash,
  Calendar,
  User,
  Mail,
  Globe,
  AlertTriangle,
} from 'lucide-react'

/* ─── types ─── */
interface CotizacionFirma {
  id: string
  cotizacion_id: string
  folio: string
  cliente_nombre: string
  cliente_email: string
  monto_total: number
  moneda: 'USD' | 'MXN'
  estado_firma: 'pendiente' | 'enviada' | 'firmada' | 'rechazada' | 'vencida'
  firmante_nombre: string | null
  firmante_ip: string | null
  firma_hash_sha256: string | null
  firma_timestamp: string | null
  user_agent: string | null
  token_firma: string
  fecha_envio: string | null
  fecha_vencimiento: string | null
  created_at: string
}

/* ─── component ─── */
export default function FirmaDigital(): ReactElement {
  const [firmas, setFirmas] = useState<CotizacionFirma[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQ, setSearchQ] = useState('')
  const [filtroEstado, setFiltroEstado] = useState<string>('todos')
  const [detailId, setDetailId] = useState<string | null>(null)
  const [enviando, setEnviando] = useState<string | null>(null)

  useEffect(() => { fetchData() }, [])

  async function fetchData() {
    setLoading(true)
    try {
      const { data, error } = await supabase
        .from('cotizacion_firmas')
        .select('*')
        .is('deleted_at', null)
        .order('created_at', { ascending: false })
        .limit(200)

      if (error) { console.error('cotizacion_firmas:', error); setFirmas([]); return }
      setFirmas((data || []) as CotizacionFirma[])
    } finally { setLoading(false) }
  }

  async function handleEnviarFirma(id: string) {
    setEnviando(id)
    try {
      const { error } = await supabase.functions.invoke('firma-digital-enviar', {
        body: { firma_id: id },
      })
      if (error) { console.error('enviar firma:', error); return }
      await fetchData()
    } finally { setEnviando(null) }
  }

  async function handleReenviar(id: string) {
    setEnviando(id)
    try {
      const { error } = await supabase.functions.invoke('firma-digital-reenviar', {
        body: { firma_id: id },
      })
      if (error) console.error('reenviar:', error)
      await fetchData()
    } finally { setEnviando(null) }
  }

  const stats = {
    total: firmas.length,
    pendientes: firmas.filter(f => f.estado_firma === 'pendiente' || f.estado_firma === 'enviada').length,
    firmadas: firmas.filter(f => f.estado_firma === 'firmada').length,
    rechazadas: firmas.filter(f => f.estado_firma === 'rechazada').length,
    vencidas: firmas.filter(f => f.estado_firma === 'vencida').length,
  }

  const estadoStyle = (e: string) => {
    if (e === 'pendiente') return { bg: tokens.colors.bgHover, color: tokens.colors.textMuted, label: 'Pendiente', icon: <Clock size={14} /> }
    if (e === 'enviada') return { bg: tokens.colors.blueBg, color: tokens.colors.blue, label: 'Enviada', icon: <Send size={14} /> }
    if (e === 'firmada') return { bg: tokens.colors.greenBg, color: tokens.colors.green, label: 'Firmada', icon: <CheckCircle2 size={14} /> }
    if (e === 'rechazada') return { bg: tokens.colors.redBg, color: tokens.colors.red, label: 'Rechazada', icon: <XCircle size={14} /> }
    return { bg: tokens.colors.yellowBg, color: tokens.colors.yellow, label: 'Vencida', icon: <AlertTriangle size={14} /> }
  }

  const filtered = firmas.filter(f => {
    if (filtroEstado !== 'todos' && f.estado_firma !== filtroEstado) return false
    if (searchQ) {
      const q = searchQ.toLowerCase()
      if (!f.folio.toLowerCase().includes(q) && !f.cliente_nombre.toLowerCase().includes(q)) return false
    }
    return true
  })

  const detail = detailId ? firmas.find(f => f.id === detailId) : null

  const fmtMoney = (n: number, m: string) => new Intl.NumberFormat('es-MX', { style: 'currency', currency: m }).format(n)

  return (
    <ModuleLayout titulo="Firma Digital — Cotizaciones">
      <div style={{ padding: tokens.spacing.lg, minHeight: '100vh', background: tokens.colors.bgMain }}>
        {/* KPIs */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: tokens.spacing.md, marginBottom: tokens.spacing.lg }}>
          <KPICard icon={<FileText size={20} />} label="Total Cotizaciones" value={stats.total} />
          <KPICard icon={<Clock size={20} />} label="Pendientes / Enviadas" value={stats.pendientes} />
          <KPICard icon={<CheckCircle2 size={20} />} label="Firmadas" value={stats.firmadas} />
          <KPICard icon={<XCircle size={20} />} label="Rechazadas" value={stats.rechazadas} />
          <KPICard icon={<AlertTriangle size={20} />} label="Vencidas" value={stats.vencidas} />
        </div>

        <div style={{ display: 'flex', gap: tokens.spacing.lg }}>
          {/* Left: Table */}
          <div style={{ flex: 1 }}>
            {/* Filters */}
            <div style={{ display: 'flex', gap: tokens.spacing.sm, marginBottom: tokens.spacing.md, alignItems: 'center' }}>
              <div style={{ position: 'relative', flex: 1, maxWidth: 280 }}>
                <Search size={16} color={tokens.colors.textMuted} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)' }} />
                <input type="text" value={searchQ} onChange={e => setSearchQ(e.target.value)}
                  placeholder="Folio, cliente..."
                  style={{
                    width: '100%', background: tokens.colors.bgCard, color: tokens.colors.textPrimary,
                    border: `1px solid ${tokens.colors.border}`, borderRadius: tokens.radius.md,
                    padding: `${tokens.spacing.sm} ${tokens.spacing.md} ${tokens.spacing.sm} 36px`,
                    fontFamily: tokens.fonts.body, fontSize: '14px', outline: 'none',
                  }}
                />
              </div>
              <select value={filtroEstado} onChange={e => setFiltroEstado(e.target.value)} style={selStyle}>
                <option value="todos">Todos los estados</option>
                <option value="pendiente">Pendiente</option>
                <option value="enviada">Enviada</option>
                <option value="firmada">Firmada</option>
                <option value="rechazada">Rechazada</option>
                <option value="vencida">Vencida</option>
              </select>
            </div>

            <Card style={{ padding: 0, overflow: 'hidden' }}>
              {loading ? (
                <div style={{ padding: tokens.spacing.xxl, textAlign: 'center', color: tokens.colors.textMuted }}>
                  <RefreshCw size={24} style={{ animation: 'spin 1s linear infinite' }} />
                  <p style={{ marginTop: tokens.spacing.sm }}>Cargando firmas...</p>
                </div>
              ) : filtered.length === 0 ? (
                <div style={{ padding: tokens.spacing.xxl, textAlign: 'center' }}>
                  <PenTool size={48} color={tokens.colors.textMuted} style={{ marginBottom: tokens.spacing.md }} />
                  <p style={{ fontFamily: tokens.fonts.heading, fontSize: '16px', fontWeight: 700, color: tokens.colors.textPrimary }}>
                    Sin cotizaciones con firma digital
                  </p>
                  <p style={{ fontSize: '14px', color: tokens.colors.textMuted, marginTop: tokens.spacing.xs }}>
                    Crea una cotización y envíala a firma para comenzar
                  </p>
                </div>
              ) : (
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                  <thead>
                    <tr style={{ background: tokens.colors.bgHover }}>
                      {['Folio', 'Cliente', 'Monto', 'Estado', 'Acciones'].map(h => (
                        <th key={h} style={thStyle}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {filtered.map(f => {
                      const es = estadoStyle(f.estado_firma)
                      return (
                        <tr key={f.id}
                          style={{
                            borderBottom: `1px solid ${tokens.colors.border}`, cursor: 'pointer',
                            background: detailId === f.id ? tokens.colors.bgHover : 'transparent',
                          }}
                          onClick={() => setDetailId(f.id)}>
                          <td style={tdStyle}><span style={{ fontWeight: 600, color: tokens.colors.textPrimary }}>{f.folio}</span></td>
                          <td style={tdStyle}><span style={{ fontSize: '13px' }}>{f.cliente_nombre}</span></td>
                          <td style={tdStyle}><span style={{ fontWeight: 600, fontSize: '13px', color: tokens.colors.textPrimary }}>{fmtMoney(f.monto_total, f.moneda)}</span></td>
                          <td style={tdStyle}>
                            <span style={{
                              display: 'inline-flex', alignItems: 'center', gap: '4px',
                              fontSize: '12px', fontWeight: 600, padding: '2px 8px',
                              borderRadius: tokens.radius.sm, background: es.bg, color: es.color,
                            }}>
                              {es.icon} {es.label}
                            </span>
                          </td>
                          <td style={tdStyle} onClick={e => e.stopPropagation()}>
                            <div style={{ display: 'flex', gap: tokens.spacing.xs }}>
                              {f.estado_firma === 'pendiente' && (
                                <button onClick={() => handleEnviarFirma(f.id)} disabled={enviando === f.id} style={actionBtn} title="Enviar para firma">
                                  <Send size={14} color={tokens.colors.primary} />
                                </button>
                              )}
                              {(f.estado_firma === 'enviada' || f.estado_firma === 'vencida') && (
                                <button onClick={() => handleReenviar(f.id)} disabled={enviando === f.id} style={actionBtn} title="Reenviar">
                                  <RefreshCw size={14} color={tokens.colors.orange} />
                                </button>
                              )}
                            </div>
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              )}
            </Card>
          </div>

          {/* Right: Detail Panel */}
          {detail && (
            <div style={{ width: 360 }}>
              <Card style={{ padding: tokens.spacing.lg, position: 'sticky', top: tokens.spacing.lg }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: tokens.spacing.sm, marginBottom: tokens.spacing.lg }}>
                  <Shield size={20} color={tokens.colors.primary} />
                  <span style={{ fontFamily: tokens.fonts.heading, fontSize: '16px', fontWeight: 700, color: tokens.colors.textPrimary }}>
                    Detalle de Firma
                  </span>
                </div>

                {[
                  { icon: <FileText size={14} />, label: 'Folio', val: detail.folio },
                  { icon: <User size={14} />, label: 'Cliente', val: detail.cliente_nombre },
                  { icon: <Mail size={14} />, label: 'Email', val: detail.cliente_email },
                  { icon: <Calendar size={14} />, label: 'Creada', val: new Date(detail.created_at).toLocaleDateString('es-MX') },
                  { icon: <Calendar size={14} />, label: 'Enviada', val: detail.fecha_envio ? new Date(detail.fecha_envio).toLocaleDateString('es-MX') : '—' },
                  { icon: <Calendar size={14} />, label: 'Vence', val: detail.fecha_vencimiento ? new Date(detail.fecha_vencimiento).toLocaleDateString('es-MX') : '—' },
                ].map(r => (
                  <div key={r.label} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: `${tokens.spacing.xs} 0`, borderBottom: `1px solid ${tokens.colors.border}` }}>
                    <span style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px', color: tokens.colors.textMuted }}>
                      {r.icon} {r.label}
                    </span>
                    <span style={{ fontSize: '13px', color: tokens.colors.textPrimary, fontWeight: 500 }}>{r.val}</span>
                  </div>
                ))}

                {detail.estado_firma === 'firmada' && (
                  <div style={{ marginTop: tokens.spacing.lg, background: tokens.colors.greenBg, borderRadius: tokens.radius.md, padding: tokens.spacing.md }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: tokens.spacing.sm, marginBottom: tokens.spacing.sm }}>
                      <CheckCircle2 size={16} color={tokens.colors.green} />
                      <span style={{ fontFamily: tokens.fonts.heading, fontSize: '14px', fontWeight: 700, color: tokens.colors.green }}>
                        Firma Validada
                      </span>
                    </div>
                    {[
                      { label: 'Firmante', val: detail.firmante_nombre || '—' },
                      { label: 'IP', val: detail.firmante_ip || '—' },
                      { label: 'Fecha/Hora', val: detail.firma_timestamp ? new Date(detail.firma_timestamp).toLocaleString('es-MX') : '—' },
                      { label: 'SHA-256', val: detail.firma_hash_sha256 ? `${detail.firma_hash_sha256.slice(0, 16)}...` : '—' },
                    ].map(r => (
                      <div key={r.label} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', padding: '2px 0' }}>
                        <span style={{ color: tokens.colors.textMuted }}>{r.label}</span>
                        <span style={{ color: tokens.colors.textPrimary, fontFamily: 'monospace', fontSize: '11px' }}>{r.val}</span>
                      </div>
                    ))}
                  </div>
                )}
              </Card>
            </div>
          )}
        </div>
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
  background: 'transparent', border: `1px solid ${tokens.colors.border}`,
  borderRadius: tokens.radius.sm, padding: '6px', cursor: 'pointer',
  display: 'flex', alignItems: 'center', justifyContent: 'center',
}
