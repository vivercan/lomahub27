import type { ReactElement } from 'react'
import { useState, useEffect, Fragment } from 'react'
import { ModuleLayout } from '../../components/layout/ModuleLayout'
import { Card } from '../../components/ui/Card'
import { KPICard } from '../../components/ui/KPICard'
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
  Eye,
  RefreshCw,
  ArrowRight,
  Ban,
  Building2,
  FileCheck,
  Send,
  CreditCard,
  User,
} from 'lucide-react'

/* ─────────────────────────────────────────────────────────────
   ALTA DE CLIENTES — Workflow Dashboard (F01)
   5-state workflow: ENVIADA → PENDIENTE_CSR → PENDIENTE_CXC →
   PENDIENTE_CONFIRMACION → COMPLETADA (or RECHAZADA)

   CSR Catalog: Eli Pasillas (eli@trob.com.mx), Liz Garcia (liz@trob.com.mx)
   CXC Catalog: 7 executives (loaded from params or hardcoded)
   juan.viveros@trob.com.mx ALWAYS in CC for all emails
   ───────────────────────────────────────────────────────────── */

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
  contacto_nombre: string | null
  contacto_email: string | null
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
  dias_credito: number | null
  vendedor_id: string | null
  vendedor_nombre: string | null
  vendedor_email: string | null
  firma_ip: string | null
  firma_hash: string | null
  firma_timestamp: string | null
  firma_user_agent: string | null
  firmante_nombre: string | null
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

/* ─── Catalogs — loaded from DB ─── */
interface CatalogEntry { nombre: string; email: string; clientes_asignados?: number }

const DIAS_CREDITO_OPTIONS = [0, 7, 15, 30, 45, 60, 90]

const CC_ALWAYS = 'juan.viveros@trob.com.mx'

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

  // Catalogs from DB
  const [csrCatalog, setCsrCatalog] = useState<CatalogEntry[]>([])
  const [cxcCatalog, setCxcCatalog] = useState<CatalogEntry[]>([])

  // Assignment modals
  const [showCSRModal, setShowCSRModal] = useState<string | null>(null)
  const [selectedCSR, setSelectedCSR] = useState('')
  const [showCXCModal, setShowCXCModal] = useState<string | null>(null)
  const [selectedCXC, setSelectedCXC] = useState('')
  const [selectedDiasCredito, setSelectedDiasCredito] = useState(30)

  useEffect(() => {
    fetchData()
    // Load catalogs from DB
    ;(async () => {
      const { data: csrs } = await supabase.from('catalogo_csr').select('nombre, email, clientes_asignados').eq('activo', true).order('nombre')
      if (csrs) setCsrCatalog(csrs)
      const { data: cxcs } = await supabase.from('catalogo_cxc').select('nombre, email, clientes_asignados').eq('activo', true).order('nombre')
      if (cxcs) setCxcCatalog(cxcs)
    })()
  }, [])

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
      if (!(r.razon_social || '').toLowerCase().includes(q) && !(r.rfc || '').toLowerCase().includes(q)) return false
    }
    return true
  })

  /* ─── state transition with email ─── */
  async function transitionState(id: string, newEstado: Estado, extraUpdates?: Record<string, unknown>, notas?: string) {
    setTransitioning(id)
    try {
      const updates: Record<string, unknown> = { estado: newEstado, updated_at: new Date().toISOString(), ...extraUpdates }
      if (notas) updates.notas_rechazo = notas

      const { error } = await supabase.from('alta_clientes').update(updates).eq('id', id)
      if (error) { console.error('transition error:', error); return }

      const record = records.find(r => r.id === id)
      setRecords(prev => prev.map(r => r.id === id ? { ...r, ...updates } as AltaCliente : r))

      // Send email notifications based on new state
      if (record) {
        await sendTransitionEmail(record, newEstado, extraUpdates)
      }

      setShowRejectModal(null)
      setShowCSRModal(null)
      setShowCXCModal(null)
      setRejectNotes('')
    } finally { setTransitioning(null) }
  }

  /* ─── email sender ─── */
  async function sendTransitionEmail(record: AltaCliente, newEstado: Estado, extras?: Record<string, unknown>) {
    const razon = record.razon_social || 'Sin nombre'

    try {
      switch (newEstado) {
        case 'PENDIENTE_CSR': {
          // Notify CS admin team
          await supabase.functions.invoke('enviar-correo', {
            body: {
              to: csrCatalog.map(c => c.email),
              cc: [CC_ALWAYS],
              subject: `Nueva Alta Pendiente CSR — ${razon}`,
              html: buildWorkflowEmailHTML(razon, 'Pendiente Asignación CSR', 'Se han recibido los documentos del cliente. Favor de revisar y asignar ejecutivo de servicio.'),
              tipo: 'alta_pendiente_csr',
            },
          })
          break
        }
        case 'PENDIENTE_CXC': {
          // Notify CXC team
          const csrNombre = (extras?.csr_asignada as string) || 'Sin asignar'
          await supabase.functions.invoke('enviar-correo', {
            body: {
              to: cxcCatalog.slice(0, 3).map(c => c.email),
              cc: [CC_ALWAYS],
              subject: `Alta Pendiente CxC — ${razon} | CSR: ${csrNombre}`,
              html: buildWorkflowEmailHTML(razon, 'Pendiente Asignación CxC', `CSR asignada: ${csrNombre}. Favor de asignar ejecutivo de cobranza y días de crédito.`),
              tipo: 'alta_pendiente_cxc',
            },
          })
          break
        }
        case 'PENDIENTE_CONFIRMACION': {
          // Notify pricing/admin for final confirmation
          const cxcNombre = (extras?.cxc_asignado as string) || 'Sin asignar'
          const dias = (extras?.dias_credito as number) || 0
          await supabase.functions.invoke('enviar-correo', {
            body: {
              to: [CC_ALWAYS],
              subject: `Alta Pendiente Confirmación — ${razon} | ${dias} días crédito`,
              html: buildWorkflowEmailHTML(razon, 'Pendiente Confirmación Final', `CxC asignado: ${cxcNombre}. Días de crédito: ${dias}. Favor de confirmar alta.`),
              tipo: 'alta_pendiente_confirmacion',
            },
          })
          break
        }
        case 'COMPLETADA': {
          // Notify everyone: vendedor, CSR, CXC, client
          const allRecipients = [CC_ALWAYS]
          if (record.vendedor_email) allRecipients.push(record.vendedor_email)
          if (record.contacto_email) allRecipients.push(record.contacto_email)
          // Add CSR email
          const csrEntry = csrCatalog.find(c => c.nombre === record.csr_asignada)
          if (csrEntry) allRecipients.push(csrEntry.email)
          // Add CXC email
          const cxcEntry = cxcCatalog.find(c => c.nombre === record.cxc_asignado)
          if (cxcEntry) allRecipients.push(cxcEntry.email)

          await supabase.functions.invoke('enviar-correo', {
            body: {
              to: [...new Set(allRecipients)],
              subject: `Alta Completada — ${razon} | TROB Logistics`,
              html: buildWorkflowEmailHTML(razon, 'Alta Completada', `La empresa ${razon} ha sido dada de alta exitosamente en el sistema. CSR: ${record.csr_asignada || 'N/A'}, CxC: ${record.cxc_asignado || 'N/A'}.`),
              tipo: 'alta_completada',
            },
          })
          break
        }
        case 'RECHAZADA': {
          // Notify vendedor and client
          const recipients = [CC_ALWAYS]
          if (record.vendedor_email) recipients.push(record.vendedor_email)
          if (record.contacto_email) recipients.push(record.contacto_email)

          await supabase.functions.invoke('enviar-correo', {
            body: {
              to: [...new Set(recipients)],
              subject: `Alta Rechazada — ${razon}`,
              html: buildWorkflowEmailHTML(razon, 'Alta Rechazada', `La solicitud de alta ha sido rechazada. Motivo: ${record.notas_rechazo || 'No especificado'}.`),
              tipo: 'alta_rechazada',
            },
          })
          break
        }
      }
    } catch (e) {
      console.error('Email notification error:', e)
    }
  }

  /* ─── CSR assignment handler ─── */
  function handleAssignCSR() {
    if (!showCSRModal || !selectedCSR) return
    transitionState(showCSRModal, 'PENDIENTE_CXC', { csr_asignada: selectedCSR })
  }

  /* ─── CXC assignment handler ─── */
  function handleAssignCXC() {
    if (!showCXCModal || !selectedCXC) return
    transitionState(showCXCModal, 'PENDIENTE_CONFIRMACION', {
      cxc_asignado: selectedCXC,
      dias_credito: selectedDiasCredito,
    })
  }

  /* ─── doc checker ─── */
  const docStatus = (url: string | null, valid: boolean | null, label: string) => (
    <div style={{ display: 'flex', alignItems: 'center', gap: tokens.spacing.xs, padding: `${tokens.spacing.xs} 0` }}>
      {url ? (
        valid === true ? <CheckCircle2 size={14} color={tokens.colors.green} />
          : valid === false ? <XCircle size={14} color={tokens.colors.red} />
          : <Clock size={14} color={tokens.colors.yellow} />
      ) : <AlertTriangle size={14} color={tokens.colors.textMuted} />}
      <span style={{ fontSize: '13px', color: url ? tokens.colors.textPrimary : tokens.colors.textMuted }}>{label}</span>
      {url && (
        <a href={url} target="_blank" rel="noreferrer" style={{ marginLeft: 'auto', color: tokens.colors.blue, fontSize: '12px', display: 'flex', alignItems: 'center', gap: 4 }}>
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
      transition: 'all 0.18s ease',
      boxShadow: '0 2px 4px rgba(0,0,0,0.12), 0 4px 8px -2px rgba(0,0,0,0.08), inset 0 1px 0 rgba(255,255,255,0.50), inset 0 -1px 0 rgba(0,0,0,0.06)',
    })

    switch (r.estado) {
      case 'ENVIADA':
        return (
          <div style={{ display: 'flex', gap: tokens.spacing.sm }}>
            <button style={btnStyle(tokens.colors.blue, tokens.colors.blueBg)}
              onClick={() => transitionState(r.id, 'PENDIENTE_CSR')} disabled={isTransitioning}>
              <ArrowRight size={14} /> Docs Recibidos
            </button>
          </div>
        )
      case 'PENDIENTE_CSR':
        return (
          <div style={{ display: 'flex', gap: tokens.spacing.sm }}>
            <button style={btnStyle(tokens.colors.green, tokens.colors.greenBg)}
              onClick={() => { setSelectedCSR(''); setShowCSRModal(r.id) }} disabled={isTransitioning}>
              <UserCheck size={14} /> Asignar CSR
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
              onClick={() => { setSelectedCXC(''); setSelectedDiasCredito(30); setShowCXCModal(r.id) }} disabled={isTransitioning}>
              <CreditCard size={14} /> Asignar CxC
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
              <style>{`@keyframes spin { to { transform: rotate(360deg) } }`}</style>
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
                  {['', 'Razón Social', 'RFC', 'Estado', 'Docs', 'Firma', 'CSR / CxC', 'Fecha', 'Acciones'].map(h => (
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
                          <span style={{ fontWeight: 600, color: tokens.colors.textPrimary }}>{r.razon_social || '—'}</span>
                          {r.contacto_nombre && <span style={{ display: 'block', fontSize: '11px', color: tokens.colors.textMuted }}>{r.contacto_nombre}</span>}
                        </td>
                        <td style={tdStyle}><span style={{ fontSize: '13px', fontFamily: 'monospace' }}>{r.rfc || '—'}</span></td>
                        <td style={tdStyle}>{estadoBadge(r.estado)}</td>
                        <td style={tdStyle}>
                          <span style={{
                            fontSize: '12px', fontWeight: 600,
                            color: docsCount === 4 ? tokens.colors.green : docsCount > 0 ? tokens.colors.yellow : tokens.colors.textMuted,
                          }}>
                            <FileCheck size={14} style={{ verticalAlign: 'middle', marginRight: '4px' }} />
                            {docsCount}/4
                          </span>
                        </td>
                        <td style={tdStyle}>
                          {hasFirma ? (
                            <span style={{ fontSize: '12px', color: tokens.colors.green }}>
                              <CheckCircle2 size={14} style={{ verticalAlign: 'middle', marginRight: '4px' }} /> Si
                            </span>
                          ) : (
                            <span style={{ fontSize: '12px', color: tokens.colors.textMuted }}>No</span>
                          )}
                        </td>
                        <td style={tdStyle}>
                          <div style={{ fontSize: '11px', lineHeight: 1.5 }}>
                            {r.csr_asignada ? (
                              <span style={{ color: tokens.colors.green }}><User size={10} style={{ verticalAlign: 'middle' }} /> {r.csr_asignada}</span>
                            ) : (
                              <span style={{ color: tokens.colors.textMuted }}>—</span>
                            )}
                            {r.cxc_asignado && (
                              <span style={{ display: 'block', color: tokens.colors.blue }}>
                                <CreditCard size={10} style={{ verticalAlign: 'middle' }} /> {r.cxc_asignado}
                                {r.dias_credito != null && ` (${r.dias_credito}d)`}
                              </span>
                            )}
                          </div>
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
                          <td colSpan={9} style={{ padding: tokens.spacing.md, background: tokens.colors.bgHover }}>
                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: tokens.spacing.lg }}>
                              {/* Col 1: Datos empresa */}
                              <div>
                                <p style={sectionTitle}>Datos de la Empresa</p>
                                <div style={detailGrid}>
                                  <div><strong>Razón Social:</strong> {r.razon_social || '—'}</div>
                                  <div><strong>RFC:</strong> {r.rfc || '—'}</div>
                                  <div><strong>Dirección Fiscal:</strong> {r.direccion_fiscal || '—'}</div>
                                  <div><strong>Régimen Fiscal:</strong> {r.regimen_fiscal || '—'}</div>
                                  <div><strong>Contacto:</strong> {r.contacto_nombre || '—'}</div>
                                  <div><strong>Email:</strong> {r.contacto_email || '—'}</div>
                                  <div><strong>Vendedor:</strong> {r.vendedor_nombre || '—'}</div>
                                </div>

                                <p style={{ ...sectionTitle, marginTop: tokens.spacing.md }}>Asignaciones</p>
                                <div style={detailGrid}>
                                  <div><strong>CSR:</strong> {r.csr_asignada || 'Sin asignar'}</div>
                                  <div><strong>CxC:</strong> {r.cxc_asignado || 'Sin asignar'}</div>
                                  <div><strong>Días Crédito:</strong> {r.dias_credito != null ? r.dias_credito : 'N/A'}</div>
                                </div>
                              </div>

                              {/* Col 2: Documentos */}
                              <div>
                                <p style={sectionTitle}>Documentos Requeridos</p>
                                {docStatus(r.constancia_fiscal_url, r.constancia_fiscal_valida, 'Constancia Fiscal')}
                                {docStatus(r.ine_url, r.ine_valida, 'INE Representante')}
                                {docStatus(r.acta_constitutiva_url, r.acta_valida, 'Acta Constitutiva')}
                                {docStatus(r.caratula_bancaria_url, r.caratula_valida, 'Carátula Bancaria')}

                                {/* Portal link */}
                                <div style={{ marginTop: tokens.spacing.md }}>
                                  <a
                                    href={`${window.location.origin}/alta/portal/${r.token}`}
                                    target="_blank"
                                    rel="noreferrer"
                                    style={{ fontSize: '12px', color: tokens.colors.blue, textDecoration: 'none', fontWeight: 600, display: 'flex', alignItems: 'center', gap: 4 }}
                                  >
                                    <Send size={12} /> Enlace del portal público
                                  </a>
                                </div>
                              </div>

                              {/* Col 3: Firma + notas */}
                              <div>
                                <p style={sectionTitle}>Firma Digital</p>
                                {r.firma_hash ? (
                                  <div style={detailGrid}>
                                    <div><strong>Firmante:</strong> {r.firmante_nombre || '—'}</div>
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

        {/* ─── CSR Assignment Modal ─── */}
        {showCSRModal && (
          <div style={modalOverlay} onClick={() => setShowCSRModal(null)}>
            <div style={modalCard} onClick={e => e.stopPropagation()}>
              <h3 style={{ fontFamily: tokens.fonts.heading, fontSize: '18px', fontWeight: 700, color: tokens.colors.textPrimary, marginBottom: tokens.spacing.md }}>
                <UserCheck size={20} style={{ verticalAlign: 'middle', marginRight: 8, color: tokens.colors.green }} />
                Asignar Ejecutivo CSR
              </h3>
              <p style={{ fontSize: '14px', color: tokens.colors.textSecondary, marginBottom: tokens.spacing.md }}>
                Selecciona la ejecutiva de Servicio a Clientes que atenderá este alta.
              </p>
              <div style={{ display: 'grid', gap: tokens.spacing.sm, marginBottom: tokens.spacing.lg }}>
                {csrCatalog.map(csr => (
                  <label key={csr.email} style={{
                    display: 'flex', alignItems: 'center', gap: 12,
                    padding: '12px 16px', borderRadius: tokens.radius.md, cursor: 'pointer',
                    border: `1px solid ${selectedCSR === csr.nombre ? tokens.colors.green : tokens.colors.border}`,
                    background: selectedCSR === csr.nombre ? tokens.colors.greenBg : 'transparent',
                    transition: 'all 0.2s',
                  }}>
                    <input type="radio" name="csr" value={csr.nombre} checked={selectedCSR === csr.nombre}
                      onChange={() => setSelectedCSR(csr.nombre)} style={{ accentColor: tokens.colors.green }} />
                    <div>
                      <p style={{ margin: 0, fontSize: '14px', fontWeight: 600, color: tokens.colors.textPrimary }}>{csr.nombre}</p>
                      <p style={{ margin: 0, fontSize: '12px', color: tokens.colors.textMuted }}>{csr.email}</p>
                    </div>
                  </label>
                ))}
              </div>
              <div style={{ display: 'flex', gap: tokens.spacing.sm, justifyContent: 'flex-end' }}>
                <button onClick={() => setShowCSRModal(null)} style={cancelBtnStyle}>Cancelar</button>
                <button onClick={handleAssignCSR} disabled={!selectedCSR || !!transitioning} style={{
                  ...confirmBtnStyle, background: selectedCSR ? tokens.colors.green : tokens.colors.textMuted,
                  cursor: selectedCSR ? 'pointer' : 'not-allowed', opacity: selectedCSR ? 1 : 0.5,
                }}>
                  <UserCheck size={14} style={{ verticalAlign: 'middle', marginRight: 6 }} />
                  Asignar CSR
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ─── CXC Assignment Modal ─── */}
        {showCXCModal && (
          <div style={modalOverlay} onClick={() => setShowCXCModal(null)}>
            <div style={{ ...modalCard, maxHeight: '85vh', overflow: 'auto' }} onClick={e => e.stopPropagation()}>
              <h3 style={{ fontFamily: tokens.fonts.heading, fontSize: '18px', fontWeight: 700, color: tokens.colors.textPrimary, marginBottom: tokens.spacing.md }}>
                <CreditCard size={20} style={{ verticalAlign: 'middle', marginRight: 8, color: '#8B5CF6' }} />
                Asignar Ejecutivo CxC y Crédito
              </h3>

              <p style={{ fontSize: '13px', fontWeight: 600, color: tokens.colors.textSecondary, marginBottom: tokens.spacing.sm, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                Ejecutivo de Cobranza
              </p>
              <div style={{ display: 'grid', gap: tokens.spacing.xs, marginBottom: tokens.spacing.lg, maxHeight: 220, overflow: 'auto' }}>
                {cxcCatalog.map(cxc => (
                  <label key={cxc.email} style={{
                    display: 'flex', alignItems: 'center', gap: 12,
                    padding: '10px 14px', borderRadius: tokens.radius.md, cursor: 'pointer',
                    border: `1px solid ${selectedCXC === cxc.nombre ? '#8B5CF6' : tokens.colors.border}`,
                    background: selectedCXC === cxc.nombre ? '#EDE9FE' : 'transparent',
                    transition: 'all 0.2s',
                  }}>
                    <input type="radio" name="cxc" value={cxc.nombre} checked={selectedCXC === cxc.nombre}
                      onChange={() => setSelectedCXC(cxc.nombre)} style={{ accentColor: '#8B5CF6' }} />
                    <div>
                      <p style={{ margin: 0, fontSize: '13px', fontWeight: 600, color: tokens.colors.textPrimary }}>{cxc.nombre}</p>
                      <p style={{ margin: 0, fontSize: '11px', color: tokens.colors.textMuted }}>{cxc.email}</p>
                    </div>
                  </label>
                ))}
              </div>

              <p style={{ fontSize: '13px', fontWeight: 600, color: tokens.colors.textSecondary, marginBottom: tokens.spacing.sm, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                Días de Crédito
              </p>
              <div style={{ display: 'flex', gap: tokens.spacing.sm, flexWrap: 'wrap', marginBottom: tokens.spacing.lg }}>
                {DIAS_CREDITO_OPTIONS.map(d => (
                  <button key={d} onClick={() => setSelectedDiasCredito(d)} style={{
                    padding: '8px 16px', fontSize: '13px', fontWeight: 600,
                    borderRadius: tokens.radius.md, cursor: 'pointer',
                    color: selectedDiasCredito === d ? '#fff' : tokens.colors.textSecondary,
                    background: selectedDiasCredito === d ? '#8B5CF6' : 'transparent',
                    border: `1px solid ${selectedDiasCredito === d ? '#8B5CF6' : tokens.colors.border}`,
                  }}>
                    {d === 0 ? 'Contado' : `${d} días`}
                  </button>
                ))}
              </div>

              <div style={{ display: 'flex', gap: tokens.spacing.sm, justifyContent: 'flex-end' }}>
                <button onClick={() => setShowCXCModal(null)} style={cancelBtnStyle}>Cancelar</button>
                <button onClick={handleAssignCXC} disabled={!selectedCXC || !!transitioning} style={{
                  ...confirmBtnStyle, background: selectedCXC ? '#8B5CF6' : tokens.colors.textMuted,
                  cursor: selectedCXC ? 'pointer' : 'not-allowed', opacity: selectedCXC ? 1 : 0.5,
                }}>
                  <CreditCard size={14} style={{ verticalAlign: 'middle', marginRight: 6 }} />
                  Asignar CxC ({selectedDiasCredito === 0 ? 'Contado' : `${selectedDiasCredito}d`})
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ─── Reject Modal ─── */}
        {showRejectModal && (
          <div style={modalOverlay} onClick={() => setShowRejectModal(null)}>
            <div style={modalCard} onClick={e => e.stopPropagation()}>
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
                <button onClick={() => { setShowRejectModal(null); setRejectNotes('') }} style={cancelBtnStyle}>
                  Cancelar
                </button>
                <button
                  onClick={() => {
                    if (!rejectNotes.trim()) return
                    transitionState(showRejectModal, 'RECHAZADA', undefined, rejectNotes.trim())
                  }}
                  disabled={!rejectNotes.trim() || transitioning === showRejectModal}
                  style={{
                    ...confirmBtnStyle, background: rejectNotes.trim() ? tokens.colors.red : tokens.colors.textMuted,
                    cursor: rejectNotes.trim() ? 'pointer' : 'not-allowed', opacity: rejectNotes.trim() ? 1 : 0.5,
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
const modalOverlay: React.CSSProperties = {
  position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)',
  display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999,
}
const modalCard: React.CSSProperties = {
  background: tokens.colors.bgCard, borderRadius: tokens.radius.lg,
  padding: tokens.spacing.xl, width: 520, maxWidth: '90vw',
  border: `1px solid ${tokens.colors.border}`, boxShadow: '0 24px 64px rgba(0,0,0,0.15)',
}
const cancelBtnStyle: React.CSSProperties = {
  padding: `${tokens.spacing.sm} ${tokens.spacing.lg}`,
  background: 'linear-gradient(180deg, #FFFFFF 0%, #F3F4F6 100%)', color: tokens.colors.textSecondary,
  border: `1px solid ${tokens.colors.border}`, borderRadius: tokens.radius.md,
  fontFamily: tokens.fonts.body, fontSize: '14px', cursor: 'pointer',
  transition: 'all 0.18s ease',
  boxShadow: '0 1px 3px rgba(0,0,0,0.10), inset 0 1px 0 rgba(255,255,255,0.80), inset 0 -1px 0 rgba(0,0,0,0.05)',
}
const confirmBtnStyle: React.CSSProperties = {
  padding: `${tokens.spacing.sm} ${tokens.spacing.lg}`,
  color: '#fff', border: 'none', borderRadius: tokens.radius.md,
  fontFamily: tokens.fonts.body, fontSize: '14px', fontWeight: 600,
  transition: 'all 0.18s ease',
  boxShadow: '0 2px 4px rgba(0,0,0,0.20), 0 6px 14px -3px rgba(0,0,0,0.15), inset 0 1px 0 rgba(255,255,255,0.25), inset 0 -1px 0 rgba(0,0,0,0.18)',
  textShadow: '0 1px 2px rgba(0,0,0,0.20)',
}

/* ── Workflow notification email HTML ── */
function buildWorkflowEmailHTML(razonSocial: string, statusLabel: string, message: string): string {
  return `<!DOCTYPE html>
<html lang="es">
<head><meta charset="UTF-8"></head>
<body style="margin:0;padding:0;background:#F7F8FA;font-family:'Montserrat',Helvetica,Arial,sans-serif;">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#F7F8FA;">
<tr><td align="center" style="padding:32px 16px;">
<table role="presentation" width="520" cellpadding="0" cellspacing="0" style="background:#FFFFFF;border-radius:12px;border:1px solid rgba(15,23,42,0.08);box-shadow:0 4px 24px rgba(0,0,0,0.06);">
<tr><td style="padding:24px 32px;border-bottom:1px solid rgba(15,23,42,0.06);">
<span style="font-size:18px;font-weight:800;color:#0F172A;">LomaHUB27</span>
<span style="font-size:10px;color:#94A3B8;margin-left:8px;text-transform:uppercase;">Alta de Cliente</span>
</td></tr>
<tr><td style="padding:24px 32px;">
<div style="display:inline-block;padding:4px 12px;border-radius:6px;background:#3B6CE710;font-size:12px;font-weight:600;color:#3B6CE7;margin-bottom:12px;">${statusLabel}</div>
<h2 style="margin:0 0 12px;font-size:18px;font-weight:700;color:#0F172A;">${razonSocial}</h2>
<p style="margin:0;font-size:14px;color:#64748B;line-height:1.6;">${message}</p>
<p style="margin:16px 0 0;font-size:13px;">
<a href="https://v2.jjcrm27.com/clientes/workflow-alta" style="display:inline-block;padding:10px 24px;background:#3B6CE7;color:#fff;text-decoration:none;border-radius:8px;font-weight:600;font-size:13px;">Ver en LomaHUB27</a>
</p>
</td></tr>
<tr><td style="padding:16px 32px;border-top:1px solid rgba(15,23,42,0.06);">
<p style="margin:0;font-size:11px;color:#94A3B8;text-align:center;">TROB Logistics &middot; Transporte de carga nacional e internacional</p>
</td></tr>
</table>
</td></tr>
</table>
</body></html>`
}
