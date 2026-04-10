import type { ReactElement } from 'react'
import { useState, useEffect, Fragment } from 'react'
import { ModuleLayout } from '../../components/layout/ModuleLayout'
import { Card } from '../../components/Card'
import { KPICard } from '../../components/KPICard'
import { tokens } from '../../lib/tokens'
import { supabase } from '../../lib/supabase'
import { useAuthContext } from '../../hooks/AuthContext'
import {
  FileText,
  CheckCircle2,
  XCircle,
  Clock,
  AlertTriangle,
  Search,
  ChevronDown,
  ChevronRight,
  UserCheck,
  Shield,
  Upload,
  Eye,
  RefreshCw,
  ArrowRight,
  Ban,
  Users,
  Building2,
  FileCheck,
} from 'lucide-react'

/* ─── types ─── */
interface AltaCliente {
  id: string
  token: string
  lead_id: string | null
  cliente_id: string | null
  estado: 'ENVIADA' | 'PENDIENTE_CSR' | 'PENDIENTE_CXC' | 'PENDIENTE_CONFIRMACION' | 'COMPLETADA' | 'RECHAZADA'
  razon_social: string | null
  rfc: string | null
  direccion_fiscal: string | null
  regimen_fiscal: string | null
  constancia_fiscal_url: string | null
  constancia_fiscal_valida: boolean | null
  ine_url: string | null
  ine_valida: boolean | null
  acta_constitutiva_url: string | null
  acta_valida: boolean | null
  caratula_bancaria_url: string | null
  caratula_valida: boolean | null
  csr_asignada: string | null
  cxc_asignado: string | null
  vendedor_id: string | null
  firma_ip: string | null
  firma_hash: string | null
  firma_timestamp: string | null
  firma_user_agent: string | null
  notas_rechazo: string | null
  created_at: string
  updated_at: string
}

type Estado = AltaCliente['estado']

const ESTADOS: { key: Estado; label: string; color: string; bg: string; icon: ReactElement }[] = [
  { key: 'ENVIADA', label: 'Enviada', color: tokens.colors.blue, bg: tokens.colors.blueBg, icon: <FileText size={14} /> },
  { key: 'PENDIENTE_CSR', label: 'Pendiente CSR', color: tokens.colors.yellow, bg: tokens.colors.yellowBg, icon: <UserCheck size={14} /> },
  { key: 'PENDIENTE_CXC', label: 'Pendiente CxC', color: tokens.colors.orange, bg: tokens.colors.orangeLight, icon: <Shield size={14} /> },
  { key: 'PENDIENTE_CONFIRMACION', label: 'Por Confirmar', color: '#8B5CF6', bg: '#EDE9FE', icon: <Clock size={14} /> },
  { key: 'COMPLETADA', label: 'Completada', color: tokens.colors.green, bg: tokens.colors.greenBg, icon: <CheckCircle2 size={14} /> },
  { key: 'RECHAZADA', label: 'Rechazada', color: tokens.colors.red, bg: tokens.colors.redBg, icon: <XCircle size={14} /> },
]

/* ─── component ─── */
export default function AltaClienteWorkflow(): ReactElement {
  const { user } = useAuthContext()
  const [records, setRecords] = useState<AltaCliente[]>([])
  const [loading, setLoading] = useState(true)
  const [filtroEstado, setFiltroEstado] = useState<string>('todos')
  const [searchQ, setSearchQ] = useState('')
  const [expandedId, setExpandedId] = useState<string | null>(null)
  const [transitioning, setTransitioning] = useState<string | null>(null)
  const [rejectNotes, setRejectNotes] = useState('')
  const [showRejectModal, setShowRejectModal] = useState<string | null>(null)

  useEffect(() => { fetchData() }, [])

  async function fetchData() {
    setLoading(true)
    try {
      const { data, error } = await supabase
        .from('alta_clientes')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(500)
      if (error) { console.error('alta_clientes:', error); setRecords([]); return }
      setRecords(data || [])
    } finally { setLoading(false) }
  }

  /* ─── stats ─── */
  const stats = {
    total: records.length,
    enviada: records.filter(r => r.estado === 'ENVIADA').length,
    pendienteCSR: records.filter(r => r.estado === 'PENDIENTE_CSR').length,
    pendienteCXC: records.filter(r => r.estado === 'PENDIENTE_CXC').length,
    porConfirmar: records.filter(r => r.estado === 'PENDIENTE_CONFIRMACION').length,
    completada: records.filter(r => r.estado === 'COMPLETADA').length,
    rechazada: records.filter(r => r.estado === 'RECHAZADA').length,
  }

  /* ─── filter ─── */
  const filtered = records.filter(r => {
    if (filtroEstado !== 'todos' && r.estado !== filtroEstado) return false
    if (searchQ) {
      const q = searchQ.toLowerCase()
      if (
        !(r.razon_social || '').toLowerCase().includes(q) &&
        !(r.rfc || '').toLowerCase().includes(q)
      ) return false
    }
    return true
  })

  /* ─── state transition ─── */
  async function transitionState(id: string, newEstado: Estado, notas?: string) {
    setTransitioning(id)
    try {
      const updates: Record<string, unknown> = { estado: newEstado, updated_at: new Date().toISOString() }
      if (notas) updates.notas_rechazo = notas
      const { error } = await supabase.from('alta_clientes').update(updates).eq('id', id)
      if (error) { console.error('transition error:', error); return }
      setRecords(prev => prev.map(r => r.id === id ? { ...r, ...updates } as AltaCliente : r))
      setShowRejectModal(null)
      setRejectNotes('')
    } finally { setTransitioning(null) }
  }

  /* ─── doc checker ─── */
  const docStatus = (url: string | null, valid: boolean | null, label: string) => (
    <div style={{ display: 'flex', alignItems: 'center', gap: tokens.spacing.xs, padding: `${tokens.spacing.xs} 0` }}>
      {url ? (
        valid === true ? <CheckCircle2 size={14} color={tokens.colors.green} />
          : valid === false ? <XCircle size={14} color={tokens.colors.red} />
          : <Clock size={14} color={tokens.colors.yellow} />
      ) : <AlertTriangle size={14} color={tokens.colors.gray} />}
      <span style={{ fontSize: '13px', color: url ? tokens.colors.textPrimary : tokens.colors.textMuted }}>{label}</span>
      {url && (
        <a href={url} target="_blank" rel="noreferrer" style={{ marginLeft: 'auto', color: tokens.colors.blue, fontSize: '12px' }}>
          <Eye size={12} /> Ver
        </a>
      )}
    </div>
  )

  /* ─── get next actions based on state ─── */
  function getActions(r: AltaCliente) {
    const isTransitioning = transitioning === r.id
    const btnStyle = (color: string, bg: string): React.CSSProperties => ({
      display: 'inline-flex', alignItems: 'center', gap: '6px',
      padding: `${tokens.spacing.xs} ${tokens.spacing.md}`,
      background: bg, color, border: `1px solid ${color}`,
      borderRadius: tokens.radius.md, fontSize: '12px', fontWeight: 600,
      fontFamily: tokens.fonts.body, cursor: isTransitioning ? 'wait' : 'pointer',
      opacity: isTransitioning ? 0.6 : 1,
    })

    switch (r.estado) {
      case 'ENVIADA':
        return (
          <div style={{ display: 'flex', gap: tokens.spacing.sm }}>
            <button style={btnStyle(tokens.colors.blue, tokens.colors.blueBg)}
              onClick={() => transitionState(r.id, 'PENDIENTE_CSR')} disabled={isTransitioning}>
              <ArrowRight size={14} /> Asignar a CSR
            </button>
          </div>
        )
      case 'PENDIENTE_CSR':
        return (
          <div style={{ display: 'flex', gap: tokens.spacing.sm }}>
            <button style={btnStyle(tokens.colors.green, tokens.colors.greenBg)}
              onClick={() => transitionState(r.id, 'PENDIENTE_CXC')} disabled={isTransitioning}>
              <CheckCircle2 size={14} /> Aprobar → CxC
            </button>
            <button style={btnStyle(tokens.colors.red, tokens.colors.redBg)}
              onClick={() => setShowRejectModal(r.id)} disabled={isTransitioning}>
              <Ban size={14} /> Rechazar
            </button>
          </div>
        )
      case 'PENDIENTE_CXC':
        return (
          <div style={{ display: 'flex', gap: tokens.spacing.sm }}>
            <button style={btnStyle('#8B5CF6', '#EDE9FE')}
              onClick={() => transitionState(r.id, 'PENDIENTE_CONFIRMACION')} disabled={isTransitioning}>
              <CheckCircle2 size={14} /> Aprobar → Confirmación
            </button>
            <button style={btnStyle(tokens.colors.red, tokens.colors.redBg)}
              onClick={() => setShowRejectModal(r.id)} disabled={isTransitioning}>
              <Ban size={14} /> Rechazar
            </button>
          </div>
        )
      case 'PENDIENTE_CONFIRMACION':
        return (
          <div style={{ display: 'flex', gap: tokens.spacing.sm }}>
            <button style={btnStyle(tokens.colors.green, tokens.colors.greenBg)}
              onClick={() => transitionState(r.id, 'COMPLETADA')} disabled={isTransitioning}>
              <CheckCircle2 size={14} /> Completar Alta
            </button>
            <button style={btnStyle(tokens.colors.red, tokens.colors.redBg)}
              onClick={() => setShowRejectModal(r.id)} disabled={isTransitioning}>
              <Ban size={14} /> Rechazar
            </button>
          </div>
        )
      default:
        return null
    }
  }

  /* ─── estado badge ─── */
  function estadoBadge(estado: Estado) {
    const cfg = ESTADOS.find(e => e.key === estado) || ESTADOS[0]
    return (
      <span style={{
        display: 'inline-flex', alignItems: 'center', gap: '4px',
        fontSize: '12px', fontWeight: 600, padding: '2px 10px',
        borderRadius: tokens.radius.sm, background: cfg.bg, color: cfg.color,
      }}>
        {cfg.icon} {cfg.label}
      </span>
    )
  }

  return (
    <ModuleLayout titulo="Alta de Clientes — Workflow" moduloPadre={{ nombre: 'Comercial', ruta: '/ventas/dashboard' }}>
      <div style={{ padding: tokens.spacing.lg, minHeight: '100vh', background: tokens.colors.bgMain }}>
        {/* KPIs */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: tokens.spacing.md, marginBottom: tokens.spacing.lg }}>
          <KPICard icon={<FileText size={20} />} label="Total Solicitudes" value={stats.total} color="blue" />
          <KPICard icon={<UserCheck size={20} />} label="Pendiente CSR" value={stats.pendienteCSR} color="yellow" />
          <KPICard icon={<Shield size={20} />} label="Pendiente CxC" value={stats.pendienteCXC} color="orange" />
          <KPICard icon={<CheckCircle2 size={20} />} label="Completadas" value={stats.completada} color="green" />
          <KPICard icon={<XCircle size={20} />} label="Rechazadas" value={stats.rechazada} color="red" />
        </div>

        {/* Pipeline visual */}
        <Card style={{ padding: tokens.spacing.md, marginBottom: tokens.spacing.lg }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: tokens.spacing.xs }}>
            {ESTADOS.filter(e => e.key !== 'RECHAZADA').map((e, i) => (
              <Fragment key={e.key}>
                <div
                  onClick={() => setFiltroEstado(filtroEstado === e.key ? 'todos' : e.key)}
                  style={{
                    flex: 1, textAlign: 'center', padding: tokens.spacing.sm,
                    borderRadius: tokens.radius.md, cursor: 'pointer',
                    background: filtroEstado === e.key ? e.bg : 'transparent',
                    border: `1px solid ${filtroEstado === e.key ? e.color : tokens.colors.border}`,
                    transition: 'all 0.2s',
                  }}
                >
                  <div style={{ fontSize: '20px', fontWeight: 700, color: e.color, fontFamily: tokens.fonts.heading }}>
                    {records.filter(r => r.estado === e.key).length}
                  </div>
                  <div style={{ fontSize: '11px', color: tokens.colors.textMuted, marginTop: '2px' }}>{e.label}</div>
                </div>
                {i < 4 && <ArrowRight size={16} color={tokens.colors.textMuted} style={{ flexShrink: 0 }} />}
              </Fragment>
            ))}
          </div>
        </Card>

        {/* Filters */}
        <div style={{ display: 'flex', gap: tokens.spacing.sm, marginBottom: tokens.spacing.md, alignItems: 'center' }}>
          <div style={{ position: 'relative', flex: 1, maxWidth: 350 }}>
            <Search size={16} color={tokens.colors.textMuted} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)' }} />
            <input
              type="text" value={searchQ} onChange={e => setSearchQ(e.target.value)}
              placeholder="Razón social, RFC..."
              style={{
                width: '100%', background: tokens.colors.bgCard, color: tokens.colors.textPrimary,
                border: `1px solid ${tokens.colors.border}`, borderRadius: tokens.radius.md,
                padding: `${tokens.spacing.sm} ${tokens.spacing.md} ${tokens.spacing.sm} 36px`,
                fontFamily: tokens.fonts.body, fontSize: '14px', outline: 'none',
              }}
            />
          </div>
          <select value={filtroEstado} onChange={e => setFiltroEstado(e.target.value)} style={selectStyle}>
            <option value="todos">Estado: Todos</option>
            {ESTADOS.map(e => <option key={e.key} value={e.key}>{e.label}</option>)}
          </select>
          <button onClick={fetchData} style={{
            display: 'flex', alignItems: 'center', gap: '6px',
            padding: `${tokens.spacing.sm} ${tokens.spacing.md}`,
            background: tokens.colors.bgCard, color: tokens.colors.textPrimary,
            border: `1px solid ${tokens.colors.border}`, borderRadius: tokens.radius.md,
            fontFamily: tokens.fonts.body, fontSize: '13px', cursor: 'pointer',
          }}>
            <RefreshCw size={14} /> Actualizar
          </button>
        </div>

        {/* Table */}
        <Card style={{ padding: 0, overflow: 'hidden' }}>
          {loading ? (
            <div style={{ padding: tokens.spacing.xxl, textAlign: 'center', color: tokens.colors.textMuted }}>
              <RefreshCw size={24} style={{ animation: 'spin 1s linear infinite' }} />
              <p style={{ marginTop: tokens.spacing.sm }}>Cargando solicitudes...</p>
            </div>
          ) : filtered.length === 0 ? (
            <div style={{ padding: tokens.spacing.xxl, textAlign: 'center' }}>
              <Building2 size={48} color={tokens.colors.textMuted} style={{ marginBottom: tokens.spacing.md }} />
              <p style={{ fontFamily: tokens.fonts.heading, fontSize: '16px', fontWeight: 700, color: tokens.colors.textPrimary }}>
                Sin solicitudes de alta
              </p>
              <p style={{ fontSize: '14px', color: tokens.colors.textMuted, marginTop: tokens.spacing.xs }}>
                Las solicitudes aparecerán aquí conforme los clientes envíen sus datos
              </p>
            </div>
          ) : (
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ background: tokens.colors.bgHover }}>
                  {['', 'Razón Social', 'RFC', 'Estado', 'Documentos', 'Firma', 'Fecha', 'Acciones'].map(h => (
                    <th key={h} style={thStyle}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.map(r => {
                  const isOpen = expandedId === r.id
                  const docsCount = [r.constancia_fiscal_url, r.ine_url, r.acta_constitutiva_url, r.caratula_bancaria_url].filter(Boolean).length
                  const docsValid = [r.constancia_fiscal_valida, r.ine_valida, r.acta_valida, r.caratula_valida].filter(v => v === true).length
                  const hasFirma = !!r.firma_hash

                  return (
                    <Fragment key={r.id}>
                      <tr
                        style={{ borderBottom: `1px solid ${tokens.colors.border}`, cursor: 'pointer' }}
                        onClick={() => setExpandedId(isOpen ? null : r.id)}
                      >
                        <td style={tdStyle}>{isOpen ? <ChevronDown size={14} /> : <ChevronRight size={14} />}</td>
                        <td style={tdStyle}>
                          <span style={{ fontWeight: 600, color: tokens.colors.textPrimary }}>
                            {r.razon_social || '—'}
                          </span>
                        </td>
                        <td style={tdStyle}><span style={{ fontSize: '13px', fontFamily: 'monospace' }}>{r.rfc || '—'}</span></td>
                        <td style={tdStyle}>{estadoBadge(r.estado)}</td>
                        <td style={tdStyle}>
                          <span style={{
                            fontSize: '12px', fontWeight: 600,
                            color: docsCount === 4 && docsValid === 4 ? tokens.colors.green
                              : docsCount > 0 ? tokens.colors.yellow : tokens.colors.textMuted,
                          }}>
                            <FileCheck size={14} style={{ verticalAlign: 'middle', marginRight: '4px' }} />
                            {docsValid}/{docsCount} de 4
                          </span>
                        </td>
                        <td style={tdStyle}>
                          {hasFirma ? (
                            <span style={{ fontSize: '12px', color: tokens.colors.green }}>
                              <CheckCircle2 size={14} style={{ verticalAlign: 'middle', marginRight: '4px' }} /> Firmado
                            </span>
                          ) : (
                            <span style={{ fontSize: '12px', color: tokens.colors.textMuted }}>Pendiente</span>
                          )}
                        </td>
                        <td style={tdStyle}>
                          <span style={{ fontSize: '12px', color: tokens.colors.textMuted }}>
                            {new Date(r.created_at).toLocaleDateString('es-MX')}
                          </span>
                        </td>
                        <td style={tdStyle} onClick={e => e.stopPropagation()}>
                          {getActions(r)}
                        </td>
                      </tr>

                      {isOpen && (
                        <tr key={`${r.id}-detail`}>
                          <td colSpan={8} style={{ padding: tokens.spacing.md, background: tokens.colors.bgHover }}>
                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: tokens.spacing.lg }}>
                              {/* Col 1: Datos empresa */}
                              <div>
                                <p style={sectionTitle}>Datos de la Empresa</p>
                                <div style={detailGrid}>
                                  <div><strong>Razón Social:</strong> {r.razon_social || '—'}</div>
                                  <div><strong>RFC:</strong> {r.rfc || '—'}</div>
                                  <div><strong>Dirección Fiscal:</strong> {r.direccion_fiscal || '—'}</div>
                                  <div><strong>Régimen Fiscal:</strong> {r.regimen_fiscal || '—'}</div>
                                </div>
                              </div>

                              {/* Col 2: Documentos */}
                              <div>
                                <p style={sectionTitle}>Documentos Requeridos</p>
                                {docStatus(r.constancia_fiscal_url, r.constancia_fiscal_valida, 'Constancia Fiscal')}
                                {docStatus(r.ine_url, r.ine_valida, 'INE Representante')}
                                {docStatus(r.acta_constitutiva_url, r.acta_valida, 'Acta Constitutiva')}
                                {docStatus(r.caratula_bancaria_url, r.caratula_valida, 'Carátula Bancaria')}
                              </div>

                              {/* Col 3: Firma + notas */}
                              <div>
                                <p style={sectionTitle}>Firma Digital</p>
                                {r.firma_hash ? (
                                  <div style={detailGrid}>
                                    <div><strong>Hash SHA-256:</strong> <span style={{ fontFamily: 'monospace', fontSize: '11px', wordBreak: 'break-all' }}>{r.firma_hash}</span></div>
                                    <div><strong>IP:</strong> {r.firma_ip || '—'}</div>
                                    <div><strong>Fecha:</strong> {r.firma_timestamp ? new Date(r.firma_timestamp).toLocaleString('es-MX') : '—'}</div>
                                    <div><strong>User Agent:</strong> <span style={{ fontSize: '11px' }}>{r.firma_user_agent || '—'}</span></div>
                                  </div>
                                ) : (
                                  <p style={{ fontSize: '13px', color: tokens.colors.textMuted }}>Firma digital pendiente</p>
                                )}

                                {r.notas_rechazo && (
                                  <div style={{ marginTop: tokens.spacing.md }}>
                                    <p style={sectionTitle}>Motivo de Rechazo</p>
                                    <p style={{ fontSize: '13px', color: tokens.colors.red, background: tokens.colors.redBg, padding: tokens.spacing.sm, borderRadius: tokens.radius.sm }}>
                                      {r.notas_rechazo}
                                    </p>
                                  </div>
                                )}

                                <div style={{ marginTop: tokens.spacing.md }}>
                                  <p style={{ fontSize: '11px', color: tokens.colors.textMuted }}>
                                    Token: <span style={{ fontFamily: 'monospace' }}>{r.token}</span>
                                  </p>
                                  <p style={{ fontSize: '11px', color: tokens.colors.textMuted }}>
                                    Última actualización: {new Date(r.updated_at).toLocaleString('es-MX')}
                                  </p>
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

        {/* Reject Modal */}
        {showRejectModal && (
          <div style={{
            position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)',
            display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999,
          }} onClick={() => setShowRejectModal(null)}>
            <div style={{
              background: tokens.colors.bgCard, borderRadius: tokens.radius.lg,
              padding: tokens.spacing.xl, width: 480, maxWidth: '90vw',
              border: `1px solid ${tokens.colors.border}`,
            }} onClick={e => e.stopPropagation()}>
              <h3 style={{ fontFamily: tokens.fonts.heading, fontSize: '18px', fontWeight: 700, color: tokens.colors.textPrimary, marginBottom: tokens.spacing.md }}>
                Rechazar Solicitud
              </h3>
              <p style={{ fontSize: '14px', color: tokens.colors.textSecondary, marginBottom: tokens.spacing.md }}>
                Ingresa el motivo del rechazo. El solicitante recibirá esta información.
              </p>
              <textarea
                value={rejectNotes}
                onChange={e => setRejectNotes(e.target.value)}
                placeholder="Motivo del rechazo..."
                rows={4}
                style={{
                  width: '100%', background: tokens.colors.bgMain, color: tokens.colors.textPrimary,
                  border: `1px solid ${tokens.colors.border}`, borderRadius: tokens.radius.md,
                  padding: tokens.spacing.sm, fontFamily: tokens.fonts.body, fontSize: '14px',
                  resize: 'vertical', outline: 'none', marginBottom: tokens.spacing.md,
                }}
              />
              <div style={{ display: 'flex', gap: tokens.spacing.sm, justifyContent: 'flex-end' }}>
                <button
                  onClick={() => { setShowRejectModal(null); setRejectNotes('') }}
                  style={{
                    padding: `${tokens.spacing.sm} ${tokens.spacing.lg}`,
                    background: 'transparent', color: tokens.colors.textSecondary,
                    border: `1px solid ${tokens.colors.border}`, borderRadius: tokens.radius.md,
                    fontFamily: tokens.fonts.body, fontSize: '14px', cursor: 'pointer',
                  }}
                >
                  Cancelar
                </button>
                <button
                  onClick={() => {
                    if (!rejectNotes.trim()) return
                    transitionState(showRejectModal, 'RECHAZADA', rejectNotes.trim())
                  }}
                  disabled={!rejectNotes.trim() || transitioning === showRejectModal}
                  style={{
                    padding: `${tokens.spacing.sm} ${tokens.spacing.lg}`,
                    background: tokens.colors.red, color: '#fff',
                    border: 'none', borderRadius: tokens.radius.md,
                    fontFamily: tokens.fonts.body, fontSize: '14px', fontWeight: 600,
                    cursor: rejectNotes.trim() ? 'pointer' : 'not-allowed',
                    opacity: rejectNotes.trim() ? 1 : 0.5,
                  }}
                >
                  <Ban size={14} style={{ verticalAlign: 'middle', marginRight: '6px' }} />
                  Confirmar Rechazo
                </button>
              </div>
            </div>
          </div>
        )}
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
const selectStyle: React.CSSProperties = {
  background: tokens.colors.bgCard, color: tokens.colors.textPrimary,
  border: `1px solid ${tokens.colors.border}`, borderRadius: tokens.radius.md,
  padding: `${tokens.spacing.xs} ${tokens.spacing.md}`, fontFamily: tokens.fonts.body, fontSize: '13px',
}
const sectionTitle: React.CSSProperties = {
  fontSize: '12px', fontWeight: 700, color: tokens.colors.textMuted,
  marginBottom: tokens.spacing.sm, textTransform: 'uppercase', letterSpacing: '0.5px',
}
const detailGrid: React.CSSProperties = {
  fontSize: '13px', color: tokens.colors.textSecondary, lineHeight: 1.8,
}
