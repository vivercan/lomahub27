import { useState, useEffect, useCallback } from 'react'
import { useParams } from 'react-router-dom'
import { supabase } from '../../lib/supabase'
import { CheckCircle, AlertCircle, Loader2, Eye, UserCheck, CreditCard, Ban, FileText, Shield, ExternalLink } from 'lucide-react'

/* ───────────────────────────────────────────────────────────────
   PORTAL DE REVIEW — Página pública para Claudia Verde / CxC
   Acceso por admin_token via email. No requiere login.

   Claudia Verde → asigna CSR → estado pasa a PENDIENTE_CXC
   CxC → asigna ejecutivo + días crédito → PENDIENTE_CONFIRMACION
   Pricing / JJ → confirma → COMPLETADA → emails a todos
   ─────────────────────────────────────────────────────────────── */

const C = {
  bg: '#F7F8FA', card: '#FFFFFF', border: 'rgba(15,23,42,0.08)',
  primary: '#C27803', blue: '#3B6CE7', green: '#0D9668', greenBg: 'rgba(13,150,104,0.08)',
  red: '#DC2626', redBg: 'rgba(220,38,38,0.08)', purple: '#8B5CF6', purpleBg: '#EDE9FE',
  text: '#0F172A', textSec: '#64748B', textMuted: '#94A3B8', radius: '12px',
}

const CSR_CATALOG = [
  { nombre: 'Eli Pasillas', email: 'eli@trob.com.mx', clientes: 65 },
  { nombre: 'Liz Garcia', email: 'liz@trob.com.mx', clientes: 58 },
]

const CXC_CATALOG = [
  { nombre: 'Martha Lopez', email: 'martha.lopez@trob.com.mx' },
  { nombre: 'Carlos Mendez', email: 'carlos.mendez@trob.com.mx' },
  { nombre: 'Ana Torres', email: 'ana.torres@trob.com.mx' },
  { nombre: 'Roberto Garza', email: 'roberto.garza@trob.com.mx' },
  { nombre: 'Lucia Ramos', email: 'lucia.ramos@trob.com.mx' },
  { nombre: 'Eduardo Solis', email: 'eduardo.solis@trob.com.mx' },
  { nombre: 'Patricia Vega', email: 'patricia.vega@trob.com.mx' },
]

const DIAS_OPTIONS = [0, 7, 15, 30, 45, 60, 90]
const CC_ALWAYS = 'juan.viveros@trob.com.mx'

interface AltaData {
  id: string; token: string; admin_token: string; estado: string
  empresa_destino: string | null; tipo_empresa: string | null
  razon_social: string | null; rfc: string | null
  contacto_nombre: string | null; contacto_email: string | null
  vendedor_nombre: string | null; vendedor_email: string | null
  csr_asignada: string | null; cxc_asignado: string | null; dias_credito: number | null
  datos_empresa: Record<string, any> | null
  documentos_urls: Record<string, string> | null
  referencias: any[] | null
  firma_hash: string | null; firma_timestamp: string | null; firmante_nombre: string | null
  notas_rechazo: string | null
  created_at: string; updated_at: string
}

export default function PortalAltaReview() {
  const { adminToken } = useParams<{ adminToken: string }>()
  const [alta, setAlta] = useState<AltaData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [acting, setActing] = useState(false)
  const [actionDone, setActionDone] = useState('')

  // CSR assignment
  const [selectedCSR, setSelectedCSR] = useState('')
  // CXC assignment
  const [selectedCXC, setSelectedCXC] = useState('')
  const [diasCredito, setDiasCredito] = useState(30)
  const [divisa, setDivisa] = useState('MXN')
  const [limiteCredito, setLimiteCredito] = useState('')
  // Reject
  const [showReject, setShowReject] = useState(false)
  const [rejectNotes, setRejectNotes] = useState('')

  const fetchAlta = useCallback(async () => {
    if (!adminToken) { setError('Token inválido'); setLoading(false); return }
    const { data, error: err } = await supabase.from('alta_clientes').select('*').eq('admin_token', adminToken).single()
    if (err || !data) { setError('Solicitud no encontrada'); setLoading(false); return }
    setAlta(data)
    setLoading(false)
  }, [adminToken])

  useEffect(() => { fetchAlta() }, [fetchAlta])

  const sendEmail = async (to: string[], subject: string, message: string, reviewUrl?: string) => {
    try {
      await supabase.functions.invoke('enviar-correo', {
        body: {
          to, cc: [CC_ALWAYS], subject,
          html: buildEmailHTML(alta?.razon_social || '', message, reviewUrl),
          tipo: 'alta_workflow',
        },
      })
    } catch (e) { console.error('Email error:', e) }
  }

  // ── Assign CSR ──
  const handleAssignCSR = async () => {
    if (!alta || !selectedCSR) return
    setActing(true)
    const csrEntry = CSR_CATALOG.find(c => c.nombre === selectedCSR)
    await supabase.from('alta_clientes').update({ csr_asignada: selectedCSR, estado: 'PENDIENTE_CXC', updated_at: new Date().toISOString() }).eq('id', alta.id)

    // Email to CXC team
    const reviewUrl = `${window.location.origin}/alta/review/${adminToken}`
    await sendEmail(
      CXC_CATALOG.slice(0, 3).map(c => c.email),
      `Alta Pendiente CxC — ${alta.razon_social} | CSR: ${selectedCSR}`,
      `Se ha asignado CSR: ${selectedCSR} (${csrEntry?.email}). Favor de asignar ejecutivo de cobranza y condiciones de crédito.`,
      reviewUrl,
    )

    setActing(false)
    setActionDone(`CSR asignada: ${selectedCSR}. Correo enviado a CxC.`)
    fetchAlta()
  }

  // ── Assign CXC ──
  const handleAssignCXC = async () => {
    if (!alta || !selectedCXC) return
    setActing(true)
    await supabase.from('alta_clientes').update({
      cxc_asignado: selectedCXC, dias_credito: diasCredito,
      estado: 'PENDIENTE_CONFIRMACION', updated_at: new Date().toISOString(),
    }).eq('id', alta.id)

    const reviewUrl = `${window.location.origin}/alta/review/${adminToken}`
    await sendEmail(
      [CC_ALWAYS],
      `Alta Pendiente Confirmación — ${alta.razon_social} | ${diasCredito} días crédito`,
      `CxC: ${selectedCXC}. Días crédito: ${diasCredito}. Divisa: ${divisa}. Límite: ${limiteCredito || 'N/A'}. Favor de confirmar alta.`,
      reviewUrl,
    )

    setActing(false)
    setActionDone(`CxC asignado: ${selectedCXC}, ${diasCredito} días. Correo enviado para confirmación.`)
    fetchAlta()
  }

  // ── Confirm / Complete ──
  const handleComplete = async () => {
    if (!alta) return
    setActing(true)
    await supabase.from('alta_clientes').update({ estado: 'COMPLETADA', updated_at: new Date().toISOString() }).eq('id', alta.id)

    // Email to EVERYONE
    const all = new Set([CC_ALWAYS])
    if (alta.vendedor_email) all.add(alta.vendedor_email)
    if (alta.contacto_email) all.add(alta.contacto_email)
    const csrEntry = CSR_CATALOG.find(c => c.nombre === alta.csr_asignada)
    if (csrEntry) all.add(csrEntry.email)
    const cxcEntry = CXC_CATALOG.find(c => c.nombre === alta.cxc_asignado)
    if (cxcEntry) all.add(cxcEntry.email)

    await sendEmail(
      [...all],
      `Alta Completada — ${alta.razon_social} | GRUPO LOMA`,
      `La empresa ${alta.razon_social} ha sido dada de alta exitosamente. CSR: ${alta.csr_asignada || 'N/A'}. CxC: ${alta.cxc_asignado || 'N/A'}. Días crédito: ${alta.dias_credito ?? 'N/A'}.`,
    )

    setActing(false)
    setActionDone('Alta completada. Correo enviado a todo el equipo y al cliente.')
    fetchAlta()
  }

  // ── Reject ──
  const handleReject = async () => {
    if (!alta || !rejectNotes.trim()) return
    setActing(true)
    await supabase.from('alta_clientes').update({ estado: 'RECHAZADA', notas_rechazo: rejectNotes.trim(), updated_at: new Date().toISOString() }).eq('id', alta.id)

    const recipients = new Set([CC_ALWAYS])
    if (alta.vendedor_email) recipients.add(alta.vendedor_email)
    if (alta.contacto_email) recipients.add(alta.contacto_email)

    await sendEmail([...recipients], `Alta Rechazada — ${alta.razon_social}`, `Motivo: ${rejectNotes.trim()}`)

    setActing(false)
    setShowReject(false)
    setActionDone('Solicitud rechazada.')
    fetchAlta()
  }

  // ── RENDER ──
  if (loading) return <div style={{ minHeight: '100vh', background: C.bg, display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Loader2 size={32} color={C.primary} style={{ animation: 'spin 1s linear infinite' }} /><style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style></div>
  if (error || !alta) return <div style={{ minHeight: '100vh', background: C.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: "'Montserrat',sans-serif" }}><div style={{ background: C.card, borderRadius: C.radius, padding: 48, textAlign: 'center', maxWidth: 420 }}><AlertCircle size={48} color={C.red} /><h2 style={{ margin: '16px 0 8px', color: C.text }}>{error}</h2></div></div>

  const d = alta.datos_empresa || {} as any
  const docs = alta.documentos_urls || {}
  const refsList = (alta.referencias || []) as any[]
  const isCSR = alta.estado === 'PENDIENTE_CSR'
  const isCXC = alta.estado === 'PENDIENTE_CXC'
  const isConfirm = alta.estado === 'PENDIENTE_CONFIRMACION'
  const isDone = alta.estado === 'COMPLETADA'
  const isRejected = alta.estado === 'RECHAZADA'

  const infoRow = (label: string, value: any) => value ? <div style={{ display: 'flex', gap: 8, padding: '4px 0', fontSize: 13 }}><span style={{ color: C.textMuted, minWidth: 120, fontWeight: 600, fontSize: 11, textTransform: 'uppercase' }}>{label}</span><span style={{ color: C.text }}>{value}</span></div> : null

  return (
    <div style={{ minHeight: '100vh', background: C.bg, fontFamily: "'Montserrat',Helvetica,sans-serif" }}>
      <style>{`@import url('https://fonts.googleapis.com/css2?family=Montserrat:wght@400;500;600;700;800&display=swap');@keyframes spin{to{transform:rotate(360deg)}}*{box-sizing:border-box;}`}</style>

      {/* Header */}
      <div style={{ background: '#fff', borderBottom: `3px solid ${C.primary}`, padding: '16px 0' }}>
        <div style={{ maxWidth: 900, margin: '0 auto', padding: '0 24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div><span style={{ fontSize: 22, fontWeight: 800, color: C.text }}>GRUPO LOMA</span><span style={{ fontSize: 12, fontWeight: 700, color: C.primary, marginLeft: 12 }}>REVIEW ALTA</span></div>
          <div style={{ padding: '4px 14px', borderRadius: 6, fontSize: 12, fontWeight: 700, background: isDone ? C.greenBg : isRejected ? C.redBg : C.purpleBg, color: isDone ? C.green : isRejected ? C.red : C.purple }}>
            {alta.estado.replace(/_/g, ' ')}
          </div>
        </div>
      </div>

      <div style={{ maxWidth: 900, margin: '0 auto', padding: '24px' }}>

        {/* Action done banner */}
        {actionDone && <div style={{ padding: '14px 20px', background: C.greenBg, border: `1px solid ${C.green}30`, borderRadius: C.radius, marginBottom: 20, display: 'flex', alignItems: 'center', gap: 10 }}><CheckCircle size={18} color={C.green} /><span style={{ fontSize: 14, fontWeight: 600, color: C.green }}>{actionDone}</span></div>}

        {/* Company header */}
        <div style={{ background: C.card, borderRadius: C.radius, border: `1px solid ${C.border}`, padding: 24, marginBottom: 20 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
            <h1 style={{ margin: 0, fontSize: 22, fontWeight: 800, color: C.text }}>{alta.razon_social || 'Sin nombre'}</h1>
            <span style={{ fontSize: 12, fontWeight: 600, color: C.primary }}>{alta.empresa_destino?.replace('_', ' ')}</span>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16 }}>
            <div>{infoRow('RFC/MC', alta.rfc || d.rfc_mc)}{infoRow('Tipo', alta.tipo_empresa === 'MEXICANA' ? '🇲🇽 Mexicana' : '🇺🇸 USA/Canada')}{infoRow('Giro', d.giro)}</div>
            <div>{infoRow('Dirección', d.direccion)}{infoRow('Tel', d.tel_oficina)}{infoRow('WhatsApp', d.whatsapp)}</div>
            <div>{infoRow('Contacto', alta.contacto_nombre)}{infoRow('Email', alta.contacto_email)}{infoRow('Vendedor', alta.vendedor_nombre)}</div>
          </div>
        </div>

        {/* 3-column layout: Contactos | Docs | Referencias */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 20, marginBottom: 20 }}>
          {/* Contactos */}
          <div style={{ background: C.card, borderRadius: C.radius, border: `1px solid ${C.border}`, padding: 20 }}>
            <h3 style={{ margin: '0 0 12px', fontSize: 13, fontWeight: 700, color: C.primary, textTransform: 'uppercase' }}>Contactos</h3>
            {d.contacto_pagos?.nombre && <div style={{ marginBottom: 12 }}><p style={{ margin: 0, fontSize: 11, fontWeight: 700, color: C.textMuted }}>PAGOS</p><p style={{ margin: 0, fontSize: 13, color: C.text }}>{d.contacto_pagos.nombre}</p><p style={{ margin: 0, fontSize: 12, color: C.textSec }}>{d.contacto_pagos.email} &middot; {d.contacto_pagos.banco}</p><p style={{ margin: 0, fontSize: 11, color: C.textMuted }}>CLABE: {d.contacto_pagos.clabe_routing} &middot; {d.contacto_pagos.forma_pago}</p></div>}
            {d.contacto_facturas?.nombre && <div style={{ marginBottom: 12 }}><p style={{ margin: 0, fontSize: 11, fontWeight: 700, color: C.textMuted }}>FACTURAS</p><p style={{ margin: 0, fontSize: 13, color: C.text }}>{d.contacto_facturas.nombre}</p><p style={{ margin: 0, fontSize: 12, color: C.textSec }}>{d.contacto_facturas.email}</p></div>}
            {d.contacto_operativo?.nombre && <div><p style={{ margin: 0, fontSize: 11, fontWeight: 700, color: C.textMuted }}>OPERATIVO</p><p style={{ margin: 0, fontSize: 13, color: C.text }}>{d.contacto_operativo.nombre}</p><p style={{ margin: 0, fontSize: 12, color: C.textSec }}>{d.contacto_operativo.email}</p></div>}
          </div>

          {/* Documentos */}
          <div style={{ background: C.card, borderRadius: C.radius, border: `1px solid ${C.border}`, padding: 20 }}>
            <h3 style={{ margin: '0 0 12px', fontSize: 13, fontWeight: 700, color: C.primary, textTransform: 'uppercase' }}>Documentos ({Object.keys(docs).length})</h3>
            {Object.entries(docs).map(([key, url]) => (
              <div key={key} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '6px 0', borderBottom: `1px solid ${C.border}` }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}><FileText size={14} color={C.green} /><span style={{ fontSize: 12, color: C.text }}>{key.replace(/_/g, ' ')}</span></div>
                <a href={url} target="_blank" rel="noreferrer" style={{ fontSize: 11, color: C.blue, display: 'flex', alignItems: 'center', gap: 4 }}><Eye size={12} />Ver</a>
              </div>
            ))}
            {Object.keys(docs).length === 0 && <p style={{ fontSize: 13, color: C.textMuted }}>Sin documentos</p>}
          </div>

          {/* Referencias + Firma */}
          <div style={{ background: C.card, borderRadius: C.radius, border: `1px solid ${C.border}`, padding: 20 }}>
            <h3 style={{ margin: '0 0 12px', fontSize: 13, fontWeight: 700, color: C.primary, textTransform: 'uppercase' }}>Referencias</h3>
            {refsList.filter(r => r.razon_social).map((r, i) => (
              <div key={i} style={{ marginBottom: 10 }}>
                <p style={{ margin: 0, fontSize: 13, fontWeight: 600, color: C.text }}>{r.razon_social}</p>
                <p style={{ margin: 0, fontSize: 11, color: C.textSec }}>{r.contacto} &middot; {r.tel} &middot; {r.tiempo}</p>
              </div>
            ))}
            <div style={{ marginTop: 16, padding: '10px 14px', background: alta.firma_hash ? C.greenBg : C.redBg, borderRadius: 8 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <Shield size={14} color={alta.firma_hash ? C.green : C.red} />
                <span style={{ fontSize: 12, fontWeight: 600, color: alta.firma_hash ? C.green : C.red }}>{alta.firma_hash ? 'Firmado digitalmente' : 'Sin firma'}</span>
              </div>
              {alta.firmante_nombre && <p style={{ margin: '4px 0 0', fontSize: 11, color: C.textSec }}>{alta.firmante_nombre} — {alta.firma_timestamp ? new Date(alta.firma_timestamp).toLocaleString('es-MX') : ''}</p>}
            </div>
            {/* Assignments so far */}
            <div style={{ marginTop: 12 }}>
              {alta.csr_asignada && <p style={{ margin: '4px 0', fontSize: 12, color: C.green }}><UserCheck size={12} style={{ verticalAlign: 'middle' }} /> CSR: {alta.csr_asignada}</p>}
              {alta.cxc_asignado && <p style={{ margin: '4px 0', fontSize: 12, color: C.purple }}><CreditCard size={12} style={{ verticalAlign: 'middle' }} /> CxC: {alta.cxc_asignado} ({alta.dias_credito}d)</p>}
            </div>
          </div>
        </div>

        {/* ── ACTION PANEL ── */}
        {!isDone && !isRejected && !actionDone && (
          <div style={{ background: C.card, borderRadius: C.radius, border: `2px solid ${C.primary}`, padding: 28 }}>

            {/* PENDIENTE_CSR → Claudia Verde assigns CSR */}
            {isCSR && (
              <div>
                <h3 style={{ margin: '0 0 4px', fontSize: 16, fontWeight: 700, color: C.text }}><UserCheck size={20} style={{ verticalAlign: 'middle', marginRight: 8, color: C.green }} />Asignar Ejecutivo CSR</h3>
                <p style={{ margin: '0 0 16px', fontSize: 13, color: C.textSec }}>Selecciona la ejecutiva de Servicio a Clientes para este alta.</p>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 20 }}>
                  {CSR_CATALOG.map(csr => (
                    <label key={csr.email} onClick={() => setSelectedCSR(csr.nombre)} style={{
                      display: 'flex', alignItems: 'center', gap: 12, padding: 16, borderRadius: 10, cursor: 'pointer',
                      border: `2px solid ${selectedCSR === csr.nombre ? C.green : C.border}`,
                      background: selectedCSR === csr.nombre ? C.greenBg : 'transparent',
                    }}>
                      <input type="radio" checked={selectedCSR === csr.nombre} readOnly style={{ accentColor: C.green }} />
                      <div><p style={{ margin: 0, fontSize: 14, fontWeight: 600, color: C.text }}>{csr.nombre}</p><p style={{ margin: 0, fontSize: 12, color: C.textMuted }}>{csr.email} &middot; {csr.clientes} clientes</p></div>
                    </label>
                  ))}
                </div>
                <div style={{ display: 'flex', gap: 10 }}>
                  <button onClick={handleAssignCSR} disabled={!selectedCSR || acting} style={{ padding: '10px 28px', fontSize: 14, fontWeight: 700, color: '#fff', background: selectedCSR ? C.green : C.textMuted, border: 'none', borderRadius: 8, cursor: selectedCSR ? 'pointer' : 'not-allowed' }}>Asignar CSR</button>
                  <button onClick={() => setShowReject(true)} style={{ padding: '10px 20px', fontSize: 13, fontWeight: 600, color: C.red, background: 'transparent', border: `1px solid ${C.red}`, borderRadius: 8, cursor: 'pointer' }}><Ban size={14} style={{ verticalAlign: 'middle', marginRight: 4 }} />Rechazar</button>
                </div>
              </div>
            )}

            {/* PENDIENTE_CXC → CxC assigns ejecutivo + credit */}
            {isCXC && (
              <div>
                <h3 style={{ margin: '0 0 4px', fontSize: 16, fontWeight: 700, color: C.text }}><CreditCard size={20} style={{ verticalAlign: 'middle', marginRight: 8, color: C.purple }} />Condiciones de Pago</h3>
                <p style={{ margin: '0 0 16px', fontSize: 13, color: C.textSec }}>CSR asignada: <strong>{alta.csr_asignada}</strong>. Asigna ejecutivo de cobranza y condiciones de crédito.</p>

                <p style={{ margin: '0 0 8px', fontSize: 12, fontWeight: 700, color: C.textMuted, textTransform: 'uppercase' }}>Ejecutivo de Cobranza</p>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8, marginBottom: 20 }}>
                  {CXC_CATALOG.map(cxc => (
                    <label key={cxc.email} onClick={() => setSelectedCXC(cxc.nombre)} style={{
                      display: 'flex', alignItems: 'center', gap: 8, padding: '10px 12px', borderRadius: 8, cursor: 'pointer', fontSize: 12,
                      border: `1px solid ${selectedCXC === cxc.nombre ? C.purple : C.border}`,
                      background: selectedCXC === cxc.nombre ? C.purpleBg : 'transparent',
                    }}>
                      <input type="radio" checked={selectedCXC === cxc.nombre} readOnly style={{ accentColor: C.purple }} />
                      <span style={{ fontWeight: 600, color: C.text }}>{cxc.nombre}</span>
                    </label>
                  ))}
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 16, marginBottom: 20 }}>
                  <div>
                    <p style={{ margin: '0 0 8px', fontSize: 12, fontWeight: 700, color: C.textMuted, textTransform: 'uppercase' }}>Días Crédito</p>
                    <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                      {DIAS_OPTIONS.map(d => (
                        <button key={d} onClick={() => setDiasCredito(d)} style={{
                          padding: '6px 14px', fontSize: 12, fontWeight: 600, borderRadius: 6, cursor: 'pointer',
                          color: diasCredito === d ? '#fff' : C.textSec,
                          background: diasCredito === d ? C.purple : 'transparent',
                          border: `1px solid ${diasCredito === d ? C.purple : C.border}`,
                        }}>{d === 0 ? 'Contado' : `${d}d`}</button>
                      ))}
                    </div>
                  </div>
                  <div>
                    <p style={{ margin: '0 0 8px', fontSize: 12, fontWeight: 700, color: C.textMuted, textTransform: 'uppercase' }}>Divisa</p>
                    <div style={{ display: 'flex', gap: 6 }}>
                      {['MXN', 'USD'].map(dv => (
                        <button key={dv} onClick={() => setDivisa(dv)} style={{
                          padding: '6px 16px', fontSize: 12, fontWeight: 600, borderRadius: 6, cursor: 'pointer',
                          color: divisa === dv ? '#fff' : C.textSec,
                          background: divisa === dv ? C.purple : 'transparent',
                          border: `1px solid ${divisa === dv ? C.purple : C.border}`,
                        }}>{dv}</button>
                      ))}
                    </div>
                  </div>
                  <div>
                    <p style={{ margin: '0 0 8px', fontSize: 12, fontWeight: 700, color: C.textMuted, textTransform: 'uppercase' }}>Límite Crédito</p>
                    <input value={limiteCredito} onChange={e => setLimiteCredito(e.target.value)} placeholder="$500,000" style={{ width: '100%', padding: '6px 12px', fontSize: 13, border: `1px solid ${C.border}`, borderRadius: 6, color: C.text, outline: 'none', background: C.bg }} />
                  </div>
                </div>

                <div style={{ display: 'flex', gap: 10 }}>
                  <button onClick={handleAssignCXC} disabled={!selectedCXC || acting} style={{ padding: '10px 28px', fontSize: 14, fontWeight: 700, color: '#fff', background: selectedCXC ? C.purple : C.textMuted, border: 'none', borderRadius: 8, cursor: selectedCXC ? 'pointer' : 'not-allowed' }}>Asignar CxC ({diasCredito === 0 ? 'Contado' : `${diasCredito}d ${divisa}`})</button>
                  <button onClick={() => setShowReject(true)} style={{ padding: '10px 20px', fontSize: 13, fontWeight: 600, color: C.red, background: 'transparent', border: `1px solid ${C.red}`, borderRadius: 8, cursor: 'pointer' }}><Ban size={14} style={{ verticalAlign: 'middle', marginRight: 4 }} />Rechazar</button>
                </div>
              </div>
            )}

            {/* PENDIENTE_CONFIRMACION → Final confirm */}
            {isConfirm && (
              <div>
                <h3 style={{ margin: '0 0 4px', fontSize: 16, fontWeight: 700, color: C.text }}><CheckCircle size={20} style={{ verticalAlign: 'middle', marginRight: 8, color: C.green }} />Confirmación Final</h3>
                <p style={{ margin: '0 0 16px', fontSize: 14, color: C.textSec }}>
                  CSR: <strong>{alta.csr_asignada}</strong> &middot; CxC: <strong>{alta.cxc_asignado}</strong> &middot; Crédito: <strong>{alta.dias_credito} días</strong>
                </p>
                <p style={{ margin: '0 0 20px', fontSize: 13, color: C.textSec }}>Al confirmar, se enviará correo a todo el equipo y al cliente notificando que el alta está completa.</p>
                <div style={{ display: 'flex', gap: 10 }}>
                  <button onClick={handleComplete} disabled={acting} style={{ padding: '12px 32px', fontSize: 14, fontWeight: 700, color: '#fff', background: C.green, border: 'none', borderRadius: 8, cursor: 'pointer' }}>Completar Alta</button>
                  <button onClick={() => setShowReject(true)} style={{ padding: '10px 20px', fontSize: 13, fontWeight: 600, color: C.red, background: 'transparent', border: `1px solid ${C.red}`, borderRadius: 8, cursor: 'pointer' }}>Rechazar</button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Reject modal */}
        {showReject && (
          <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999 }} onClick={() => setShowReject(false)}>
            <div style={{ background: C.card, borderRadius: C.radius, padding: 28, width: 480, maxWidth: '90vw' }} onClick={e => e.stopPropagation()}>
              <h3 style={{ margin: '0 0 12px', fontSize: 16, fontWeight: 700, color: C.text }}>Rechazar Solicitud</h3>
              <textarea value={rejectNotes} onChange={e => setRejectNotes(e.target.value)} rows={4} placeholder="Motivo del rechazo..." style={{ width: '100%', padding: 12, fontSize: 14, border: `1px solid ${C.border}`, borderRadius: 8, resize: 'vertical', outline: 'none', color: C.text, background: C.bg, marginBottom: 16 }} />
              <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
                <button onClick={() => setShowReject(false)} style={{ padding: '8px 20px', fontSize: 13, color: C.textSec, background: 'transparent', border: `1px solid ${C.border}`, borderRadius: 8, cursor: 'pointer' }}>Cancelar</button>
                <button onClick={handleReject} disabled={!rejectNotes.trim() || acting} style={{ padding: '8px 24px', fontSize: 13, fontWeight: 700, color: '#fff', background: rejectNotes.trim() ? C.red : C.textMuted, border: 'none', borderRadius: 8, cursor: rejectNotes.trim() ? 'pointer' : 'not-allowed' }}>Confirmar Rechazo</button>
              </div>
            </div>
          </div>
        )}

        <div style={{ marginTop: 40, textAlign: 'center' }}>
          <p style={{ fontSize: 11, color: C.textMuted }}>GRUPO LOMA | TROB TRANSPORTES &middot; Panel de Review</p>
        </div>
      </div>
    </div>
  )
}

function buildEmailHTML(razonSocial: string, message: string, reviewUrl?: string): string {
  return `<!DOCTYPE html><html lang="es"><head><meta charset="UTF-8"></head>
<body style="margin:0;padding:0;background:#F7F8FA;font-family:'Montserrat',sans-serif;">
<table width="100%" cellpadding="0" cellspacing="0" style="background:#F7F8FA;"><tr><td align="center" style="padding:32px 16px;">
<table width="520" cellpadding="0" cellspacing="0" style="background:#fff;border-radius:12px;border:1px solid rgba(15,23,42,0.08);">
<tr><td style="padding:24px 32px;border-bottom:1px solid rgba(15,23,42,0.06);"><span style="font-size:18px;font-weight:800;color:#0F172A;">GRUPO LOMA</span></td></tr>
<tr><td style="padding:24px 32px;">
<h2 style="margin:0 0 12px;font-size:18px;font-weight:700;color:#0F172A;">${razonSocial}</h2>
<p style="margin:0 0 20px;font-size:14px;color:#64748B;line-height:1.6;">${message}</p>
${reviewUrl ? `<a href="${reviewUrl}" style="display:inline-block;padding:12px 32px;background:#C27803;color:#fff;text-decoration:none;border-radius:8px;font-weight:700;">Revisar Solicitud</a>` : ''}
</td></tr>
<tr><td style="padding:16px 32px;border-top:1px solid rgba(15,23,42,0.06);"><p style="margin:0;font-size:11px;color:#94A3B8;text-align:center;">GRUPO LOMA | TROB TRANSPORTES</p></td></tr>
</table></td></tr></table></body></html>`
}
