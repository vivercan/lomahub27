import type { ReactElement } from 'react'
import { useState, useEffect, useCallback } from 'react'
import { Plus, Search, Building2, User, Phone, Mail, MapPin, X, CheckCircle, AlertCircle, Clock, Send, Eye, ChevronRight } from 'lucide-react'
import { ModuleLayout } from '../../components/layout/ModuleLayout'
import { tokens } from '../../lib/tokens'
import { supabase } from '../../lib/supabase'
import { useAuthContext } from '../../hooks/AuthContext'
import { useNavigate } from 'react-router-dom'

/* ───────────────────────────────────────────────────────────────
   ALTA DE CLIENTES — Entrada del vendedor (Paso 1 del flujo F01)
   El vendedor crea la solicitud de alta → se genera token UUID →
   se envia correo al cliente con link al portal público →
   el cliente sube docs → AI valida → Claudia Verde asigna CSR →
   CXC asigna cobranza → Pricing confirma → emails a todo el equipo
   ─────────────────────────────────────────────────────────────── */

interface AltaRecord {
  id: string
  token: string
  estado: string
  razon_social: string | null
  rfc: string | null
  created_at: string
  updated_at: string
  contacto_nombre?: string | null
  contacto_email?: string | null
  contacto_telefono?: string | null
  vendedor_id?: string | null
  csr_asignada?: string | null
  cxc_asignado?: string | null
}

const ESTADO_COLORS: Record<string, { color: string; bg: string; label: string }> = {
  ENVIADA: { color: tokens.colors.blue, bg: tokens.colors.blueBg, label: 'Enviada' },
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

  // Modal state
  const [showModal, setShowModal] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)
  const [emailSent, setEmailSent] = useState(false)

  // Form fields
  const [razonSocial, setRazonSocial] = useState('')
  const [rfc, setRfc] = useState('')
  const [contactoNombre, setContactoNombre] = useState('')
  const [contactoEmail, setContactoEmail] = useState('')
  const [contactoTelefono, setContactoTelefono] = useState('')
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

  const generateToken = () => {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, c => {
      const r = Math.random() * 16 | 0
      return (c === 'x' ? r : (r & 0x3 | 0x8)).toString(16)
    })
  }

  const handleSave = async () => {
    if (!razonSocial.trim()) { setError('Razón social es requerida'); return }
    if (!contactoEmail.trim()) { setError('Email del contacto es requerido para enviar la solicitud'); return }
    setSaving(true)
    setError('')

    const token = generateToken()
    const portalUrl = `${window.location.origin}/alta/portal/${token}`

    // 1. Create alta_clientes record
    const { data: altaData, error: altaErr } = await supabase.from('alta_clientes').insert({
      token,
      estado: 'ENVIADA',
      razon_social: razonSocial.trim(),
      rfc: rfc.trim().toUpperCase() || null,
      contacto_nombre: contactoNombre.trim() || null,
      contacto_email: contactoEmail.trim().toLowerCase(),
      contacto_telefono: contactoTelefono.trim() || null,
      emails_adicionales: emailsAdicionales.trim() || null,
      vendedor_id: user?.id || null,
      vendedor_nombre: user?.email?.split('@')[0]?.split('.').map((p: string) => p.charAt(0).toUpperCase() + p.slice(1)).join(' ') || 'Ejecutivo Comercial',
      vendedor_email: user?.email || null,
    }).select().single()

    if (altaErr) {
      setSaving(false)
      setError(altaErr.message)
      return
    }

    // 2. Send email to client via edge function
    try {
      const vendedorNombre = user?.email?.split('@')[0]?.split('.').map((p: string) => p.charAt(0).toUpperCase() + p.slice(1)).join(' ') || 'Ejecutivo Comercial'

      const allRecipients = [contactoEmail.trim().toLowerCase()]
      if (emailsAdicionales.trim()) {
        emailsAdicionales.split(',').forEach(e => {
          const trimmed = e.trim().toLowerCase()
          if (trimmed && trimmed.includes('@')) allRecipients.push(trimmed)
        })
      }

      const { error: emailErr } = await supabase.functions.invoke('enviar-correo', {
        body: {
          to: allRecipients,
          subject: `Alta de Cliente — ${razonSocial.trim()} | TROB Logistics`,
          html: buildAltaEmailHTML({
            razonSocial: razonSocial.trim(),
            contactoNombre: contactoNombre.trim() || 'Estimado cliente',
            vendedorNombre,
            vendedorEmail: user?.email || '',
            portalUrl,
          }),
          cc: ['juan.viveros@trob.com.mx'],
          tipo: 'alta_cliente',
          cliente_id: altaData?.id,
        },
      })
      if (emailErr) console.error('Email send error:', emailErr)
      else setEmailSent(true)
    } catch (e) {
      console.error('Email invoke error:', e)
    }

    setSaving(false)
    setSuccess(true)
    setTimeout(() => {
      setShowModal(false)
      setSuccess(false)
      setEmailSent(false)
      resetForm()
      fetchRecords()
    }, 2000)
  }

  const resetForm = () => {
    setRazonSocial('')
    setRfc('')
    setContactoNombre('')
    setContactoEmail('')
    setContactoTelefono('')
    setEmailsAdicionales('')
    setError('')
  }

  const filtered = records.filter(r => {
    if (!search) return true
    const q = search.toLowerCase()
    return (r.razon_social || '').toLowerCase().includes(q) || (r.rfc || '').toLowerCase().includes(q)
  })

  const formatDate = (d: string) => {
    if (!d) return '\u2014'
    return new Date(d).toLocaleDateString('es-MX', { day: '2-digit', month: 'short', year: 'numeric' })
  }

  const estadoBadge = (estado: string) => {
    const cfg = ESTADO_COLORS[estado] || { color: tokens.colors.textMuted, bg: 'transparent', label: estado }
    return (
      <span style={{
        display: 'inline-block', padding: '2px 10px', borderRadius: tokens.radius.full,
        fontSize: '11px', fontWeight: 600, color: cfg.color, background: cfg.bg,
      }}>
        {cfg.label}
      </span>
    )
  }

  // Styles
  const ps = {
    section: { background: tokens.colors.bgCard, borderRadius: tokens.radius.lg, border: '1px solid ' + tokens.colors.border, boxShadow: tokens.effects.cardShadow } as React.CSSProperties,
    input: { width: '100%', padding: '9px 12px', fontSize: '13px', background: tokens.colors.bgMain, border: '1px solid ' + tokens.colors.border, borderRadius: tokens.radius.md, color: tokens.colors.textPrimary, fontFamily: tokens.fonts.body, outline: 'none', boxShadow: 'inset 0 1px 3px rgba(0,0,0,0.06)', transition: 'border-color 0.15s' } as React.CSSProperties,
    label: { display: 'block', fontSize: '11px', fontWeight: 600, color: tokens.colors.textSecondary, marginBottom: '4px', textTransform: 'uppercase' as const, letterSpacing: '0.5px' } as React.CSSProperties,
    row: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' } as React.CSSProperties,
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
              <input
                style={{ ...ps.input, paddingLeft: '32px', width: '280px' }}
                placeholder="Buscar por razón social, RFC..."
                value={search}
                onChange={e => setSearch(e.target.value)}
              />
            </div>
            <span style={{ fontSize: '12px', color: tokens.colors.textMuted }}>{filtered.length} solicitudes</span>
          </div>
          <div style={{ display: 'flex', gap: '10px' }}>
            <button onClick={() => navigate('/clientes/workflow-alta')} style={{
              display: 'flex', alignItems: 'center', gap: '6px', padding: '8px 16px',
              fontSize: '13px', fontWeight: 600, color: tokens.colors.primary, background: 'transparent',
              border: '1px solid ' + tokens.colors.primary, borderRadius: tokens.radius.md, cursor: 'pointer',
              fontFamily: tokens.fonts.heading,
            }}>
              <Eye size={14} /> Ver Workflow
            </button>
            <button onClick={() => { resetForm(); setShowModal(true) }} style={{
              display: 'flex', alignItems: 'center', gap: '6px', padding: '8px 16px',
              fontSize: '13px', fontWeight: 600, color: '#fff', background: tokens.colors.primary,
              border: 'none', borderRadius: tokens.radius.md, cursor: 'pointer',
              fontFamily: tokens.fonts.heading, boxShadow: tokens.effects.glowPrimary,
            }}>
              <Plus size={14} /> Nueva Alta
            </button>
          </div>
        </div>

        {/* Table */}
        <div style={{ ...ps.section, flex: 1, overflow: 'auto', scrollbarWidth: 'none' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ position: 'sticky', top: 0, background: tokens.colors.bgCard, zIndex: 1 }}>
                <th style={ps.th}>Razón Social</th>
                <th style={ps.th}>RFC</th>
                <th style={ps.th}>Estado</th>
                <th style={ps.th}>Contacto</th>
                <th style={ps.th}>Email</th>
                <th style={ps.th}>CSR</th>
                <th style={ps.th}>Fecha</th>
                <th style={ps.th}></th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr><td colSpan={8} style={{ ...ps.td, textAlign: 'center', color: tokens.colors.textMuted, padding: '40px' }}>
                  {loading ? 'Cargando...' : 'Sin solicitudes de alta'}
                </td></tr>
              ) : filtered.map(r => (
                <tr key={r.id} style={{ cursor: 'pointer', transition: 'background 0.1s' }}
                  onMouseEnter={e => (e.currentTarget.style.background = tokens.colors.bgHover)}
                  onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
                  onClick={() => navigate('/clientes/workflow-alta')}>
                  <td style={{ ...ps.td, fontWeight: 600 }}>{r.razon_social || '\u2014'}</td>
                  <td style={ps.tdMuted}>{r.rfc || '\u2014'}</td>
                  <td style={ps.td}>{estadoBadge(r.estado)}</td>
                  <td style={ps.td}>{(r as any).contacto_nombre || '\u2014'}</td>
                  <td style={ps.tdMuted}>{(r as any).contacto_email || '\u2014'}</td>
                  <td style={ps.tdMuted}>{r.csr_asignada || '\u2014'}</td>
                  <td style={ps.tdMuted}>{formatDate(r.created_at)}</td>
                  <td style={ps.td}><ChevronRight size={14} color={tokens.colors.textMuted} /></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal: Nueva Alta */}
      {showModal && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)' }}
          onClick={() => setShowModal(false)}>
          <div style={{ width: '560px', maxHeight: '85vh', background: tokens.colors.bgCard, borderRadius: tokens.radius.lg, border: '1px solid ' + tokens.colors.border, boxShadow: '0 24px 64px rgba(0,0,0,0.2)', overflow: 'auto', scrollbarWidth: 'none' }}
            onClick={e => e.stopPropagation()}>

            {/* Header */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px 20px', borderBottom: '1px solid ' + tokens.colors.border }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <Building2 size={18} style={{ color: tokens.colors.primary }} />
                <span style={{ fontSize: '15px', fontWeight: 700, color: tokens.colors.textPrimary, fontFamily: tokens.fonts.heading }}>Nueva Solicitud de Alta</span>
              </div>
              <button onClick={() => setShowModal(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: tokens.colors.textMuted, padding: '4px' }}>
                <X size={18} />
              </button>
            </div>

            {/* Form */}
            <div style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '14px' }}>
              {/* Info banner */}
              <div style={{ padding: '12px 16px', background: tokens.colors.blueBg, borderRadius: tokens.radius.md, border: `1px solid ${tokens.colors.blue}20` }}>
                <p style={{ margin: 0, fontSize: '12px', color: tokens.colors.blue, lineHeight: 1.5 }}>
                  Al registrar la solicitud, se enviará un correo al cliente con un enlace para subir su documentación fiscal. El proceso continúa automáticamente.
                </p>
              </div>

              {/* Empresa */}
              <div>
                <label style={ps.label}>Razón Social *</label>
                <input style={ps.input} value={razonSocial} onChange={e => setRazonSocial(e.target.value)} placeholder="Ej: Grupo Industrial del Norte SA de CV"
                  onFocus={e => { e.target.style.borderColor = tokens.colors.primary }}
                  onBlur={e => { e.target.style.borderColor = tokens.colors.border as string }} />
              </div>

              <div>
                <label style={ps.label}>RFC</label>
                <input style={ps.input} value={rfc} onChange={e => setRfc(e.target.value)} placeholder="XAXX010101000" maxLength={13} />
              </div>

              {/* Contacto */}
              <div style={{ borderTop: '1px solid ' + tokens.colors.border, paddingTop: '14px', display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '-4px' }}>
                <User size={14} style={{ color: tokens.colors.primary }} />
                <span style={{ fontSize: '12px', fontWeight: 700, color: tokens.colors.textSecondary, fontFamily: tokens.fonts.heading }}>REPRESENTANTE LEGAL / CONTACTO</span>
              </div>
              <div>
                <label style={ps.label}>Nombre del contacto</label>
                <input style={ps.input} value={contactoNombre} onChange={e => setContactoNombre(e.target.value)} placeholder="Nombre completo del representante legal" />
              </div>
              <div style={ps.row}>
                <div>
                  <label style={ps.label}>Email del contacto *</label>
                  <input style={ps.input} value={contactoEmail} onChange={e => setContactoEmail(e.target.value)} placeholder="correo@empresa.com" type="email" />
                </div>
                <div>
                  <label style={ps.label}>Teléfono</label>
                  <input style={ps.input} value={contactoTelefono} onChange={e => setContactoTelefono(e.target.value)} placeholder="+52 81 1234 5678" />
                </div>
              </div>

              {/* Emails adicionales */}
              <div style={{ borderTop: '1px solid ' + tokens.colors.border, paddingTop: '14px', display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '-4px' }}>
                <Mail size={14} style={{ color: tokens.colors.primary }} />
                <span style={{ fontSize: '12px', fontWeight: 700, color: tokens.colors.textSecondary, fontFamily: tokens.fonts.heading }}>CORREOS ADICIONALES (OPCIONAL)</span>
              </div>
              <div>
                <label style={ps.label}>Emails adicionales (separados por coma)</label>
                <input style={ps.input} value={emailsAdicionales} onChange={e => setEmailsAdicionales(e.target.value)} placeholder="admin@empresa.com, finanzas@empresa.com" />
                <span style={{ fontSize: '10px', color: tokens.colors.textMuted, marginTop: '4px', display: 'block' }}>
                  Estas personas también recibirán el enlace para subir documentación
                </span>
              </div>

              {/* Error / Success */}
              {error && (
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '10px', background: tokens.colors.redBg, borderRadius: tokens.radius.md }}>
                  <AlertCircle size={14} style={{ color: tokens.colors.red }} />
                  <span style={{ fontSize: '12px', color: tokens.colors.red }}>{error}</span>
                </div>
              )}
              {success && (
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '10px', background: tokens.colors.greenBg, borderRadius: tokens.radius.md }}>
                  <CheckCircle size={14} style={{ color: tokens.colors.green }} />
                  <span style={{ fontSize: '12px', color: tokens.colors.green }}>
                    Solicitud registrada{emailSent ? ' y correo enviado al cliente' : ''}
                  </span>
                </div>
              )}
            </div>

            {/* Footer */}
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', padding: '16px 20px', borderTop: '1px solid ' + tokens.colors.border }}>
              <button onClick={() => setShowModal(false)} style={{
                padding: '8px 18px', fontSize: '13px', fontWeight: 600,
                color: tokens.colors.textSecondary, background: 'transparent',
                border: '1px solid ' + tokens.colors.border, borderRadius: tokens.radius.md, cursor: 'pointer',
              }}>Cancelar</button>
              <button onClick={handleSave} disabled={saving || success} style={{
                display: 'flex', alignItems: 'center', gap: '6px',
                padding: '8px 24px', fontSize: '13px', fontWeight: 700,
                color: '#fff', background: saving || success ? tokens.colors.textMuted : tokens.colors.primary,
                border: 'none', borderRadius: tokens.radius.md, cursor: saving ? 'default' : 'pointer',
                fontFamily: tokens.fonts.heading, boxShadow: tokens.effects.glowPrimary,
                opacity: saving || success ? 0.6 : 1,
              }}>
                <Send size={14} />
                {saving ? 'Enviando...' : 'Enviar Solicitud'}
              </button>
            </div>
          </div>
        </div>
      )}
    </ModuleLayout>
  )
}

/* ── Email HTML builder ── */
function buildAltaEmailHTML(p: {
  razonSocial: string; contactoNombre: string; vendedorNombre: string; vendedorEmail: string; portalUrl: string
}): string {
  return `<!DOCTYPE html>
<html lang="es">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1.0"></head>
<body style="margin:0;padding:0;background:#F7F8FA;font-family:'Montserrat',Helvetica,Arial,sans-serif;">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#F7F8FA;">
<tr><td align="center" style="padding:32px 16px;">
<table role="presentation" width="560" cellpadding="0" cellspacing="0" style="background:#FFFFFF;border-radius:16px;border:1px solid rgba(15,23,42,0.08);box-shadow:0 4px 24px rgba(0,0,0,0.06);">

<!-- Header -->
<tr><td style="padding:28px 32px 20px;border-bottom:1px solid rgba(15,23,42,0.06);">
<span style="font-size:20px;font-weight:800;color:#0F172A;letter-spacing:-0.5px;">LomaHUB27</span>
<span style="font-size:11px;color:#94A3B8;margin-left:8px;text-transform:uppercase;letter-spacing:1px;">TROB Logistics</span>
</td></tr>

<!-- Welcome -->
<tr><td style="padding:28px 32px 8px;">
<h1 style="margin:0 0 8px;font-size:22px;font-weight:700;color:#0F172A;line-height:1.3;">
Hola, ${p.contactoNombre}
</h1>
<p style="margin:0;font-size:14px;color:#64748B;line-height:1.6;">
Le informamos que <strong style="color:#0F172A;">${p.razonSocial}</strong> ha iniciado el proceso de alta como cliente en TROB Logistics. Para continuar, necesitamos que suba la siguiente documentación.
</p>
</td></tr>

<!-- Documents needed -->
<tr><td style="padding:20px 32px;">
<table role="presentation" width="100%" style="background:#F7F8FA;border-radius:12px;border:1px solid rgba(15,23,42,0.06);">
<tr><td style="padding:20px 24px;">
<p style="margin:0 0 12px;font-size:13px;font-weight:700;color:#0F172A;text-transform:uppercase;letter-spacing:0.5px;">Documentos requeridos</p>
<table role="presentation" width="100%">
<tr><td style="padding:6px 0;font-size:13px;color:#64748B;"><span style="color:#3B6CE7;font-weight:700;margin-right:8px;">1.</span> Constancia de Situación Fiscal (CSF)</td></tr>
<tr><td style="padding:6px 0;font-size:13px;color:#64748B;"><span style="color:#3B6CE7;font-weight:700;margin-right:8px;">2.</span> INE del Representante Legal</td></tr>
<tr><td style="padding:6px 0;font-size:13px;color:#64748B;"><span style="color:#3B6CE7;font-weight:700;margin-right:8px;">3.</span> Acta Constitutiva</td></tr>
<tr><td style="padding:6px 0;font-size:13px;color:#64748B;"><span style="color:#3B6CE7;font-weight:700;margin-right:8px;">4.</span> Carátula Bancaria</td></tr>
</table>
</td></tr>
</table>
</td></tr>

<!-- Upload Button -->
<tr><td align="center" style="padding:8px 32px 20px;">
<a href="${p.portalUrl}" style="display:inline-block;padding:14px 40px;font-size:14px;font-weight:700;color:#fff;background:#3B6CE7;border-radius:8px;text-decoration:none;letter-spacing:0.5px;box-shadow:0 4px 16px rgba(59,108,231,0.2);">
Subir Documentación
</a>
<p style="margin:8px 0 0;font-size:11px;color:#94A3B8;">Este enlace es único y seguro para su empresa</p>
</td></tr>

<!-- Contact Card -->
<tr><td style="padding:8px 32px 24px;">
<table role="presentation" width="100%" style="background:#F7F8FA;border-radius:12px;border:1px solid rgba(15,23,42,0.06);">
<tr><td style="padding:16px 24px;">
<p style="margin:0 0 8px;font-size:11px;font-weight:700;color:#94A3B8;text-transform:uppercase;letter-spacing:1px;">Su ejecutivo comercial</p>
<p style="margin:0 0 4px;font-size:14px;font-weight:600;color:#0F172A;">${p.vendedorNombre}</p>
<p style="margin:0;font-size:13px;color:#64748B;"><a href="mailto:${p.vendedorEmail}" style="color:#3B6CE7;text-decoration:none;">${p.vendedorEmail}</a></p>
</td></tr>
</table>
</td></tr>

<!-- Footer -->
<tr><td style="padding:20px 32px;border-top:1px solid rgba(15,23,42,0.06);">
<p style="margin:0;font-size:11px;color:#94A3B8;text-align:center;">TROB Logistics &middot; Transporte de carga nacional e internacional</p>
</td></tr>

</table>
</td></tr>
</table>
</body></html>`
}
