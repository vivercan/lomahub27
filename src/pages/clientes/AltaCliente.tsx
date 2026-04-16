import type { ReactElement } from 'react'
import { useState, useEffect, useCallback } from 'react'
import { Plus, Search, Building2, User, Mail, X, CheckCircle, AlertCircle, Send, Eye, ChevronRight, Globe, Truck } from 'lucide-react'
import { ModuleLayout } from '../../components/layout/ModuleLayout'
import { tokens } from '../../lib/tokens'
import { supabase } from '../../lib/supabase'
import { useAuthContext } from '../../hooks/AuthContext'
import { useNavigate } from 'react-router-dom'

/* ───────────────────────────────────────────────────────────────
   ALTA DE CLIENTES — Entrada del vendedor (Paso 1 del flujo F01)
   Solo el vendedor usa el sistema. Todo lo demás es por email.
   1. Vendedor selecciona empresa destino + datos básicos → envía
   2. Cliente recibe email → llena formulario público + sube docs
   3. Claudia Verde recibe email → asigna CSR (página pública)
   4. CxC recibe email → asigna ejecutivo + crédito (página pública)
   5. Pricing confirma → emails a todos
   ─────────────────────────────────────────────────────────────── */

interface AltaRecord {
  id: string
  token: string
  estado: string
  razon_social: string | null
  rfc: string | null
  empresa_destino: string | null
  tipo_empresa: string | null
  contacto_nombre: string | null
  contacto_email: string | null
  csr_asignada: string | null
  cxc_asignado: string | null
  created_at: string
}

const EMPRESAS_DESTINO = [
  { value: 'TROB_MX', label: 'TROB MX', desc: 'Transporte nacional México' },
  { value: 'TROB_USA', label: 'TROB USA', desc: 'Operaciones Estados Unidos' },
  { value: 'WEXPRESS', label: 'WExpress', desc: 'Servicios express' },
  { value: 'SPEDHAULK', label: 'SpedHaulk', desc: 'Spedition & Haulage' },
]

const ESTADO_COLORS: Record<string, { color: string; bg: string; label: string }> = {
  ENVIADA: { color: tokens.colors.blue, bg: tokens.colors.blueBg, label: 'Enviada' },
  PENDIENTE_DOCS: { color: '#D97706', bg: '#FEF3C7', label: 'Pend. Docs' },
  PENDIENTE_CSR: { color: tokens.colors.yellow, bg: tokens.colors.yellowBg, label: 'Pend. CSR' },
  PENDIENTE_CXC: { color: tokens.colors.orange, bg: tokens.colors.orangeLight, label: 'Pend. CxC' },
  PENDIENTE_CONFIRMACION: { color: '#8B5CF6', bg: '#EDE9FE', label: 'Por Confirmar' },
  COMPLETADA: { color: tokens.colors.green, bg: tokens.colors.greenBg, label: 'Completada' },
  RECHAZADA: { color: tokens.colors.red, bg: tokens.colors.redBg, label: 'Rechazada' },
}

export default function AltaCliente(): ReactElement {
  const { user } = useAuthContext()
  const navigate = useNavigate()

  const [records, setRecords] = useState<AltaRecord[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')

  // Modal
  const [showModal, setShowModal] = useState(false)
  const [step, setStep] = useState(1)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)

  // Form
  const [empresaDestino, setEmpresaDestino] = useState('')
  const [razonSocial, setRazonSocial] = useState('')
  const [contactoNombre, setContactoNombre] = useState('')
  const [contactoEmail, setContactoEmail] = useState('')
  const [emailsAdicionales, setEmailsAdicionales] = useState('')

  const fetchRecords = useCallback(async () => {
    const { data } = await supabase
      .from('alta_clientes')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(200)
    setRecords(data || [])
    setLoading(false)
  }, [])

  useEffect(() => { fetchRecords() }, [fetchRecords])

  const generateToken = () =>
    'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, c => {
      const r = Math.random() * 16 | 0
      return (c === 'x' ? r : (r & 0x3 | 0x8)).toString(16)
    })

  const handleSave = async () => {
    if (!empresaDestino) { setError('Selecciona la empresa destino'); return }
    if (!razonSocial.trim()) { setError('Razón social es requerida'); return }
    if (!contactoEmail.trim()) { setError('Email del contacto es requerido'); return }
    setSaving(true)
    setError('')

    const token = generateToken()
    const adminToken = generateToken()
    const portalUrl = `${window.location.origin}/alta/portal/${token}`

    const vendedorNombre = user?.email?.split('@')[0]?.split('.').map((p: string) =>
      p.charAt(0).toUpperCase() + p.slice(1)).join(' ') || 'Ejecutivo Comercial'

    const { data: altaData, error: altaErr } = await supabase.from('alta_clientes').insert({
      token,
      admin_token: adminToken,
      estado: 'ENVIADA',
      empresa_destino: empresaDestino,
      razon_social: razonSocial.trim(),
      contacto_nombre: contactoNombre.trim() || null,
      contacto_email: contactoEmail.trim().toLowerCase(),
      emails_adicionales: emailsAdicionales.trim() || null,
      vendedor_id: user?.id || null,
      vendedor_nombre: vendedorNombre,
      vendedor_email: user?.email || null,
    }).select().single()

    if (altaErr) { setSaving(false); setError(altaErr.message); return }

    // Send email to client
    try {
      const allRecipients = [contactoEmail.trim().toLowerCase()]
      if (emailsAdicionales.trim()) {
        emailsAdicionales.split(',').forEach(e => {
          const t = e.trim().toLowerCase()
          if (t && t.includes('@')) allRecipients.push(t)
        })
      }

      const empresaLabel = EMPRESAS_DESTINO.find(e => e.value === empresaDestino)?.label || empresaDestino

      await supabase.functions.invoke('enviar-correo', {
        body: {
          to: allRecipients,
          cc: ['juan.viveros@trob.com.mx'],
          subject: `Solicitud de Alta de Cliente — ${razonSocial.trim()} | ${empresaLabel}`,
          html: buildClientEmailHTML({
            razonSocial: razonSocial.trim(),
            contactoNombre: contactoNombre.trim() || 'Estimado cliente',
            vendedorNombre,
            vendedorEmail: user?.email || '',
            portalUrl,
            empresaLabel,
          }),
          tipo: 'alta_cliente_invitacion',
          cliente_id: altaData?.id,
        },
      })
    } catch (e) { console.error('Email error:', e) }

    setSaving(false)
    setSuccess(true)
    setTimeout(() => {
      setShowModal(false); setSuccess(false); setStep(1)
      resetForm(); fetchRecords()
    }, 2000)
  }

  const resetForm = () => {
    setEmpresaDestino(''); setRazonSocial(''); setContactoNombre('')
    setContactoEmail(''); setEmailsAdicionales(''); setError('')
  }

  const filtered = records.filter(r => {
    if (!search) return true
    const q = search.toLowerCase()
    return (r.razon_social || '').toLowerCase().includes(q) || (r.rfc || '').toLowerCase().includes(q)
  })

  const estadoBadge = (estado: string) => {
    const cfg = ESTADO_COLORS[estado] || { color: tokens.colors.textMuted, bg: 'transparent', label: estado }
    return <span style={{ display: 'inline-block', padding: '3px 12px', borderRadius: tokens.radius.full, fontSize: '11px', fontWeight: 600, color: cfg.color, background: cfg.bg, boxShadow: '0 1px 3px rgba(0,0,0,0.10), 0 2px 6px -1px rgba(0,0,0,0.06), inset 0 1px 0 rgba(255,255,255,0.50), inset 0 -1px 0 rgba(0,0,0,0.04)' }}>{cfg.label}</span>
  }

  const ps = {
    section: { background: tokens.colors.bgCard, borderRadius: tokens.radius.lg, border: '1px solid ' + tokens.colors.border, boxShadow: tokens.effects.cardShadow } as React.CSSProperties,
    input: { width: '100%', padding: '9px 12px', fontSize: '13px', background: tokens.colors.bgMain, border: '1px solid ' + tokens.colors.border, borderRadius: tokens.radius.md, color: tokens.colors.textPrimary, fontFamily: tokens.fonts.body, outline: 'none', boxShadow: 'inset 0 1px 3px rgba(0,0,0,0.06)' } as React.CSSProperties,
    label: { display: 'block', fontSize: '11px', fontWeight: 600, color: tokens.colors.textSecondary, marginBottom: '4px', textTransform: 'uppercase' as const, letterSpacing: '0.5px' } as React.CSSProperties,
    th: { padding: '10px 14px', fontSize: '11px', fontWeight: 700, color: tokens.colors.textMuted, textTransform: 'uppercase' as const, letterSpacing: '0.5px', textAlign: 'left' as const, borderBottom: '1px solid ' + tokens.colors.border, fontFamily: tokens.fonts.heading } as React.CSSProperties,
    td: { padding: '10px 14px', fontSize: '13px', color: tokens.colors.textPrimary, borderBottom: '1px solid ' + tokens.colors.border } as React.CSSProperties,
    tdMuted: { padding: '10px 14px', fontSize: '12px', color: tokens.colors.textSecondary, borderBottom: '1px solid ' + tokens.colors.border } as React.CSSProperties,
  }

  return (
    <ModuleLayout titulo="Alta de Clientes" moduloPadre={{ nombre: 'Comercial', ruta: '/ventas/dashboard' }}>
      <div style={{ padding: '8px 16px', height: 'calc(100vh - 140px)', display: 'flex', flexDirection: 'column', gap: '12px', overflow: 'hidden' }}>

        {/* Toolbar */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{ position: 'relative' }}>
              <Search size={14} style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: tokens.colors.textMuted }} />
              <input style={{ ...ps.input, paddingLeft: '32px', width: '280px' }} placeholder="Buscar por razón social, RFC..."
                value={search} onChange={e => setSearch(e.target.value)} />
            </div>
            <span style={{ fontSize: '12px', color: tokens.colors.textMuted }}>{filtered.length} solicitudes</span>
          </div>
          <div style={{ display: 'flex', gap: '10px' }}>
            <button onClick={() => navigate('/clientes/workflow-alta')} style={{
              display: 'flex', alignItems: 'center', gap: '6px', padding: '8px 16px',
              fontSize: '13px', fontWeight: 600, color: tokens.colors.primary, background: 'transparent',
              border: '1px solid ' + tokens.colors.primary, borderRadius: tokens.radius.md, cursor: 'pointer', fontFamily: tokens.fonts.heading,
            }}><Eye size={14} /> Ver Workflow</button>
            <button onClick={() => { resetForm(); setStep(1); setShowModal(true) }} style={{
              display: 'flex', alignItems: 'center', gap: '6px', padding: '8px 16px',
              fontSize: '13px', fontWeight: 600, color: '#fff', background: tokens.colors.primary,
              border: 'none', borderRadius: tokens.radius.md, cursor: 'pointer', fontFamily: tokens.fonts.heading, boxShadow: tokens.effects.glowPrimary,
            }}><Plus size={14} /> Nueva Alta</button>
          </div>
        </div>

        {/* Table */}
        <div style={{ ...ps.section, flex: 1, overflow: 'auto', scrollbarWidth: 'none' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ position: 'sticky', top: 0, background: tokens.colors.bgCard, zIndex: 1 }}>
                <th style={ps.th}>Razón Social</th>
                <th style={ps.th}>Empresa</th>
                <th style={ps.th}>Tipo</th>
                <th style={ps.th}>Estado</th>
                <th style={ps.th}>Contacto</th>
                <th style={ps.th}>CSR / CxC</th>
                <th style={ps.th}>Fecha</th>
                <th style={ps.th}></th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr><td colSpan={8} style={{ ...ps.td, textAlign: 'center', color: tokens.colors.textMuted, padding: '40px' }}>{loading ? 'Cargando...' : 'Sin solicitudes'}</td></tr>
              ) : filtered.map(r => (
                <tr key={r.id} style={{ cursor: 'pointer', transition: 'background 0.1s' }}
                  onMouseEnter={e => (e.currentTarget.style.background = tokens.colors.bgHover)}
                  onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
                  onClick={() => navigate('/clientes/workflow-alta')}>
                  <td style={{ ...ps.td, fontWeight: 600 }}>{r.razon_social || '\u2014'}</td>
                  <td style={ps.tdMuted}>{EMPRESAS_DESTINO.find(e => e.value === r.empresa_destino)?.label || r.empresa_destino || '\u2014'}</td>
                  <td style={ps.tdMuted}>
                    {r.tipo_empresa === 'MEXICANA' ? <span style={{ fontSize: '11px' }}>🇲🇽 MX</span>
                      : r.tipo_empresa === 'USA_CANADA' ? <span style={{ fontSize: '11px' }}>🇺🇸 USA</span>
                      : '\u2014'}
                  </td>
                  <td style={ps.td}>{estadoBadge(r.estado)}</td>
                  <td style={ps.td}>{r.contacto_nombre || '\u2014'}<br /><span style={{ fontSize: '11px', color: tokens.colors.textMuted }}>{r.contacto_email || ''}</span></td>
                  <td style={ps.tdMuted}>
                    {r.csr_asignada || '\u2014'}
                    {r.cxc_asignado && <span style={{ display: 'block', fontSize: '11px' }}>{r.cxc_asignado}</span>}
                  </td>
                  <td style={ps.tdMuted}>{new Date(r.created_at).toLocaleDateString('es-MX', { day: '2-digit', month: 'short' })}</td>
                  <td style={ps.td}><ChevronRight size={14} color={tokens.colors.textMuted} /></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* ── MODAL: Nueva Alta (2 pasos) ── */}
      {showModal && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)' }}
          onClick={() => setShowModal(false)}>
          <div style={{ width: '580px', maxHeight: '85vh', background: tokens.colors.bgCard, borderRadius: tokens.radius.lg, border: '1px solid ' + tokens.colors.border, boxShadow: '0 24px 64px rgba(0,0,0,0.2)', overflow: 'auto', scrollbarWidth: 'none' }}
            onClick={e => e.stopPropagation()}>

            {/* Header */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px 20px', borderBottom: '1px solid ' + tokens.colors.border }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <Building2 size={18} style={{ color: tokens.colors.primary }} />
                <span style={{ fontSize: '15px', fontWeight: 700, color: tokens.colors.textPrimary, fontFamily: tokens.fonts.heading }}>
                  {step === 1 ? 'Paso 1 — Empresa Destino' : 'Paso 2 — Datos del Cliente'}
                </span>
              </div>
              <button onClick={() => setShowModal(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: tokens.colors.textMuted, padding: '4px' }}><X size={18} /></button>
            </div>

            <div style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '14px' }}>

              {step === 1 ? (
                <>
                  <p style={{ margin: 0, fontSize: '13px', color: tokens.colors.textSecondary }}>
                    ¿A qué empresa de Grupo Loma se dará de alta este cliente?
                  </p>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                    {EMPRESAS_DESTINO.map(emp => (
                      <div key={emp.value} onClick={() => setEmpresaDestino(emp.value)} style={{
                        padding: '16px', borderRadius: tokens.radius.md, cursor: 'pointer',
                        border: `2px solid ${empresaDestino === emp.value ? tokens.colors.primary : tokens.colors.border}`,
                        background: empresaDestino === emp.value ? tokens.colors.blueBg : 'transparent',
                        transition: 'all 0.2s',
                      }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                          <Truck size={16} color={empresaDestino === emp.value ? tokens.colors.primary : tokens.colors.textMuted} />
                          <span style={{ fontSize: '14px', fontWeight: 700, color: tokens.colors.textPrimary }}>{emp.label}</span>
                        </div>
                        <span style={{ fontSize: '11px', color: tokens.colors.textMuted }}>{emp.desc}</span>
                      </div>
                    ))}
                  </div>
                </>
              ) : (
                <>
                  {/* Info banner */}
                  <div style={{ padding: '12px 16px', background: tokens.colors.blueBg, borderRadius: tokens.radius.md }}>
                    <p style={{ margin: 0, fontSize: '12px', color: tokens.colors.blue, lineHeight: 1.5 }}>
                      <strong>{EMPRESAS_DESTINO.find(e => e.value === empresaDestino)?.label}</strong> — Al enviar, el cliente recibirá un correo con el enlace para completar su solicitud, subir documentos y firmar digitalmente. Nadie más necesita entrar al sistema.
                    </p>
                  </div>

                  <div>
                    <label style={ps.label}>Razón Social del Cliente *</label>
                    <input style={ps.input} value={razonSocial} onChange={e => setRazonSocial(e.target.value)} placeholder="Ej: Grupo Industrial del Norte SA de CV" />
                  </div>

                  <div style={{ borderTop: '1px solid ' + tokens.colors.border, paddingTop: '14px', display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '-4px' }}>
                    <User size={14} style={{ color: tokens.colors.primary }} />
                    <span style={{ fontSize: '12px', fontWeight: 700, color: tokens.colors.textSecondary, fontFamily: tokens.fonts.heading }}>CONTACTO PRINCIPAL</span>
                  </div>
                  <div>
                    <label style={ps.label}>Nombre</label>
                    <input style={ps.input} value={contactoNombre} onChange={e => setContactoNombre(e.target.value)} placeholder="Nombre del representante legal" />
                  </div>
                  <div>
                    <label style={ps.label}>Email *</label>
                    <input style={ps.input} value={contactoEmail} onChange={e => setContactoEmail(e.target.value)} placeholder="correo@empresa.com" type="email" />
                  </div>

                  <div style={{ borderTop: '1px solid ' + tokens.colors.border, paddingTop: '14px', display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '-4px' }}>
                    <Mail size={14} style={{ color: tokens.colors.primary }} />
                    <span style={{ fontSize: '12px', fontWeight: 700, color: tokens.colors.textSecondary, fontFamily: tokens.fonts.heading }}>CORREOS ADICIONALES (OPCIONAL)</span>
                  </div>
                  <div>
                    <input style={ps.input} value={emailsAdicionales} onChange={e => setEmailsAdicionales(e.target.value)} placeholder="admin@empresa.com, finanzas@empresa.com" />
                    <span style={{ fontSize: '10px', color: tokens.colors.textMuted, marginTop: '4px', display: 'block' }}>Separados por coma. También recibirán el enlace.</span>
                  </div>
                </>
              )}

              {error && (
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '10px', background: tokens.colors.redBg, borderRadius: tokens.radius.md }}>
                  <AlertCircle size={14} style={{ color: tokens.colors.red }} />
                  <span style={{ fontSize: '12px', color: tokens.colors.red }}>{error}</span>
                </div>
              )}
              {success && (
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '10px', background: tokens.colors.greenBg, borderRadius: tokens.radius.md }}>
                  <CheckCircle size={14} style={{ color: tokens.colors.green }} />
                  <span style={{ fontSize: '12px', color: tokens.colors.green }}>Solicitud enviada al cliente</span>
                </div>
              )}
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', padding: '16px 20px', borderTop: '1px solid ' + tokens.colors.border }}>
              {step === 2 && (
                <button onClick={() => setStep(1)} style={{
                  padding: '8px 18px', fontSize: '13px', fontWeight: 600,
                  color: tokens.colors.textSecondary, background: 'transparent',
                  border: '1px solid ' + tokens.colors.border, borderRadius: tokens.radius.md, cursor: 'pointer',
                }}>Atrás</button>
              )}
              <button onClick={() => setShowModal(false)} style={{
                padding: '8px 18px', fontSize: '13px', fontWeight: 600,
                color: tokens.colors.textSecondary, background: 'transparent',
                border: '1px solid ' + tokens.colors.border, borderRadius: tokens.radius.md, cursor: 'pointer',
              }}>Cancelar</button>

              {step === 1 ? (
                <button onClick={() => { if (!empresaDestino) { setError('Selecciona una empresa'); return }; setError(''); setStep(2) }} style={{
                  padding: '8px 24px', fontSize: '13px', fontWeight: 700, color: '#fff',
                  background: empresaDestino ? tokens.colors.primary : tokens.colors.textMuted,
                  border: 'none', borderRadius: tokens.radius.md,
                  cursor: empresaDestino ? 'pointer' : 'not-allowed', fontFamily: tokens.fonts.heading,
                }}>Siguiente</button>
              ) : (
                <button onClick={handleSave} disabled={saving || success} style={{
                  display: 'flex', alignItems: 'center', gap: '6px',
                  padding: '8px 24px', fontSize: '13px', fontWeight: 700, color: '#fff',
                  background: saving || success ? tokens.colors.textMuted : tokens.colors.primary,
                  border: 'none', borderRadius: tokens.radius.md,
                  cursor: saving ? 'default' : 'pointer', fontFamily: tokens.fonts.heading, boxShadow: tokens.effects.glowPrimary,
                  opacity: saving || success ? 0.6 : 1,
                }}><Send size={14} />{saving ? 'Enviando...' : 'Enviar al Cliente'}</button>
              )}
            </div>
          </div>
        </div>
      )}
    </ModuleLayout>
  )
}

/* ── Email HTML ── */
function buildClientEmailHTML(p: {
  razonSocial: string; contactoNombre: string; vendedorNombre: string; vendedorEmail: string; portalUrl: string; empresaLabel: string
}): string {
  return `<!DOCTYPE html>
<html lang="es"><head><meta charset="UTF-8"></head>
<body style="margin:0;padding:0;background:#F7F8FA;font-family:'Montserrat',Helvetica,Arial,sans-serif;">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#F7F8FA;">
<tr><td align="center" style="padding:32px 16px;">
<table role="presentation" width="560" cellpadding="0" cellspacing="0" style="background:#FFFFFF;border-radius:16px;border:1px solid rgba(15,23,42,0.08);box-shadow:0 4px 24px rgba(0,0,0,0.06);">
<tr><td style="padding:28px 32px 20px;border-bottom:1px solid rgba(15,23,42,0.06);">
<span style="font-size:20px;font-weight:800;color:#0F172A;">GRUPO LOMA</span>
<span style="font-size:11px;color:#94A3B8;margin-left:8px;text-transform:uppercase;letter-spacing:1px;">${p.empresaLabel}</span>
</td></tr>
<tr><td style="padding:28px 32px 8px;">
<h1 style="margin:0 0 8px;font-size:22px;font-weight:700;color:#0F172A;">Hola, ${p.contactoNombre}</h1>
<p style="margin:0;font-size:14px;color:#64748B;line-height:1.6;">
Le informamos que <strong style="color:#0F172A;">${p.razonSocial}</strong> ha iniciado el proceso de alta como cliente en <strong>${p.empresaLabel}</strong>. Para continuar, necesitamos que complete la solicitud y suba la documentación requerida.
</p>
</td></tr>
<tr><td style="padding:20px 32px;">
<table role="presentation" width="100%" style="background:#F7F8FA;border-radius:12px;border:1px solid rgba(15,23,42,0.06);">
<tr><td style="padding:20px 24px;">
<p style="margin:0 0 12px;font-size:13px;font-weight:700;color:#0F172A;text-transform:uppercase;">Pasos a seguir</p>
<table role="presentation" width="100%">
<tr><td style="padding:6px 0;font-size:13px;color:#64748B;"><span style="color:#3B6CE7;font-weight:700;margin-right:8px;">1.</span> Seleccione tipo de empresa (Mexicana / USA-Canadá)</td></tr>
<tr><td style="padding:6px 0;font-size:13px;color:#64748B;"><span style="color:#3B6CE7;font-weight:700;margin-right:8px;">2.</span> Complete los datos de empresa, contactos y referencias</td></tr>
<tr><td style="padding:6px 0;font-size:13px;color:#64748B;"><span style="color:#3B6CE7;font-weight:700;margin-right:8px;">3.</span> Suba la documentación requerida según su país</td></tr>
<tr><td style="padding:6px 0;font-size:13px;color:#64748B;"><span style="color:#3B6CE7;font-weight:700;margin-right:8px;">4.</span> Firme digitalmente la declaración</td></tr>
</table>
</td></tr></table>
</td></tr>
<tr><td align="center" style="padding:8px 32px 20px;">
<a href="${p.portalUrl}" style="display:inline-block;padding:14px 40px;font-size:14px;font-weight:700;color:#fff;background:#C27803;border-radius:8px;text-decoration:none;box-shadow:0 4px 16px rgba(194,120,3,0.2);">
Completar Solicitud de Alta
</a>
<p style="margin:8px 0 0;font-size:11px;color:#94A3B8;">Este enlace es único y seguro para su empresa</p>
</td></tr>
<tr><td style="padding:8px 32px 24px;">
<table role="presentation" width="100%" style="background:#F7F8FA;border-radius:12px;">
<tr><td style="padding:16px 24px;">
<p style="margin:0 0 4px;font-size:11px;font-weight:700;color:#94A3B8;text-transform:uppercase;">Su ejecutivo comercial</p>
<p style="margin:0 0 4px;font-size:14px;font-weight:600;color:#0F172A;">${p.vendedorNombre}</p>
<p style="margin:0;font-size:13px;"><a href="mailto:${p.vendedorEmail}" style="color:#3B6CE7;text-decoration:none;">${p.vendedorEmail}</a></p>
</td></tr></table>
</td></tr>
<tr><td style="padding:20px 32px;border-top:1px solid rgba(15,23,42,0.06);">
<p style="margin:0;font-size:11px;color:#94A3B8;text-align:center;">GRUPO LOMA | TROB TRANSPORTES &middot; www.trob.com.mx</p>
</td></tr>
</table></td></tr></table></body></html>`
}
