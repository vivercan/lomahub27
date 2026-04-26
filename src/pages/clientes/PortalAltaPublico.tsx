import { useState, useEffect, useCallback } from 'react'
import { useParams } from 'react-router-dom'
import { supabase } from '../../lib/supabase'
import { Upload, CheckCircle, AlertCircle, FileText, Shield, Loader2, ChevronRight, ChevronLeft, Building2, Users, Globe } from 'lucide-react'

/* ───────────────────────────────────────────────────────────────
   PORTAL PÚBLICO — Solicitud de Alta (Sin login, acceso por token)
   Replica el formato PDF "ALTA DE CLIENTE MX-USA 2025" de Grupo Loma

   Wizard de 5 pasos:
   1. Tipo de empresa (Mexicana / USA-Canadá)
   2. Datos de la empresa + Contactos (Pagos, Facturas, Operativo)
   3. Documentos (diferentes según MX vs USA)
   4. Referencias comerciales (3 transportistas)
   5. Declaración + Firma digital SHA-256
   ─────────────────────────────────────────────────────────────── */

const C = {
  bg: '#F7F8FA', card: '#FFFFFF', border: 'rgba(15,23,42,0.08)', borderDark: 'rgba(15,23,42,0.12)',
  primary: '#C27803', primaryBg: 'rgba(194,120,3,0.08)', blue: '#3B6CE7', blueBg: 'rgba(59,108,231,0.08)',
  green: '#0D9668', greenBg: 'rgba(13,150,104,0.08)',
  red: '#DC2626', redBg: 'rgba(220,38,38,0.08)',
  text: '#0F172A', textSec: '#64748B', textMuted: '#94A3B8',
  radius: '12px', headerBg: '#C27803',
}

const DOCS_MX = [
  { key: 'caratula_bancaria', label: 'Carátula Edo. de Cuenta' },
  { key: 'constancia_fiscal', label: 'Constancia de Situación Fiscal' },
  { key: 'comprobante_domicilio', label: 'Comprobante de Domicilio' },
  { key: 'acta_constitutiva', label: 'Acta Constitutiva' },
  { key: 'ine', label: 'INE del Representante Legal' },
  { key: 'poder_notarial', label: 'Poder Notarial' },
  { key: 'auditoria_ctpat', label: 'Auditoría CTPAT' },
  { key: 'acuerdo_accesoriales', label: 'Acuerdo de Accesoriales' },
]

const DOCS_USA = [
  { key: 'bank_statement', label: 'Bank Statement' },
  { key: 'mc_number', label: 'MC# (Motor Carrier Number)' },
  { key: 'w9', label: 'W-9 Form' },
  { key: 'void_check', label: 'Void Check' },
]

interface AltaData {
  id: string; token: string; estado: string; empresa_destino: string | null
  razon_social: string | null; rfc: string | null; tipo_empresa: string | null
  contacto_nombre: string | null; contacto_email: string | null
  vendedor_nombre: string | null; vendedor_email: string | null
  firma_hash: string | null; firma_timestamp: string | null
  documentos_urls: Record<string, string> | null
  datos_empresa: Record<string, any> | null
  contactos: Record<string, any> | null
  referencias: Record<string, any> | null
}

const MAX_FILE = 10 * 1024 * 1024
const ACCEPTED = '.pdf,.jpg,.jpeg,.png,.webp'

export default function PortalAltaPublico() {
  const { token } = useParams<{ token: string }>()
  const [alta, setAlta] = useState<AltaData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [step, setStep] = useState(1)
  const [saving, setSaving] = useState(false)
  const [saveMsg, setSaveMsg] = useState('')
  const [csrEmails, setCsrEmails] = useState<string[]>([])

  // Step 1
  const [tipoEmpresa, setTipoEmpresa] = useState<'MEXICANA' | 'USA_CANADA' | ''>('')

  // Step 2: Datos empresa
  const [empresa, setEmpresa] = useState({
    razon_social: '', rfc_mc: '', giro: '', sitio_web: '', direccion: '',
    gmaps_oficina: '', gmaps_planta: '', tel_oficina: '', tel_directo: '', whatsapp: '',
  })
  // Contactos
  const [ctoPagos, setCtoPagos] = useState({ nombre: '', depto: '', email: '', tel: '', banco: '', clabe_routing: '', forma_pago: '', proceso_facturacion: '' })
  const [ctoFacturas, setCtoFacturas] = useState({ nombre: '', depto: '', email: '', tel: '' })
  const [ctoOperativo, setCtoOperativo] = useState({ nombre: '', depto: '', email: '', tel: '' })

  // Step 3: Documentos
  const [docUrls, setDocUrls] = useState<Record<string, string>>({})
  const [uploading, setUploading] = useState<string | null>(null)

  // Step 4: Referencias
  const [refs, setRefs] = useState([
    { razon_social: '', contacto: '', tel: '', cel: '', tiempo: '' },
    { razon_social: '', contacto: '', tel: '', cel: '', tiempo: '' },
    { razon_social: '', contacto: '', tel: '', cel: '', tiempo: '' },
  ])

  // Step 5: Firma
  const [firmaNombre, setFirmaNombre] = useState('')
  const [firmaAcepto, setFirmaAcepto] = useState(false)
  const [signing, setSigning] = useState(false)
  const [signed, setSigned] = useState(false)

  const fetchAlta = useCallback(async () => {
    if (!token) { setError('Token inválido'); setLoading(false); return }
    const { data, error: err } = await supabase.from('alta_clientes').select('*').eq('token', token).single()
    if (err || !data) { setError('Solicitud no encontrada o enlace inválido'); setLoading(false); return }
    // V50 26/Abr/2026 BUG-026 — validar TTL del token (default 14 días desde creación)
    if ((data as any).token_expira_at && new Date((data as any).token_expira_at) < new Date()) {
      setError('Este enlace expiró. Solicita uno nuevo a tu ejecutivo de cuenta.')
      setLoading(false)
      return
    }
    setAlta(data)
    // Restore saved data
    if (data.tipo_empresa) setTipoEmpresa(data.tipo_empresa as any)
    if (data.datos_empresa) {
      setEmpresa(prev => ({ ...prev, ...data.datos_empresa, razon_social: data.datos_empresa?.razon_social || data.razon_social || '' }))
      if (data.datos_empresa.contacto_pagos) setCtoPagos(prev => ({ ...prev, ...data.datos_empresa.contacto_pagos }))
      if (data.datos_empresa.contacto_facturas) setCtoFacturas(prev => ({ ...prev, ...data.datos_empresa.contacto_facturas }))
      if (data.datos_empresa.contacto_operativo) setCtoOperativo(prev => ({ ...prev, ...data.datos_empresa.contacto_operativo }))
    } else if (data.razon_social) {
      setEmpresa(prev => ({ ...prev, razon_social: data.razon_social || '' }))
    }
    if (data.documentos_urls) setDocUrls(data.documentos_urls)
    if (data.referencias) setRefs(data.referencias as any)
    if (data.firma_hash) setSigned(true)
    setLoading(false)
  }, [token])

  useEffect(() => { fetchAlta() }, [fetchAlta])

  // Load CSR emails from DB for notification
  useEffect(() => {
    (async () => {
      const { data } = await supabase.from('catalogo_csr').select('email').eq('activo', true)
      if (data && data.length > 0) setCsrEmails(data.map(c => c.email))
    })()
  }, [])

  // Auto-save on step change
  const saveProgress = async () => {
    if (!alta) return
    setSaving(true)
    const updates: Record<string, unknown> = {
      tipo_empresa: tipoEmpresa || null,
      razon_social: empresa.razon_social || alta.razon_social,
      rfc: empresa.rfc_mc || null,
      datos_empresa: { ...empresa, contacto_pagos: ctoPagos, contacto_facturas: ctoFacturas, contacto_operativo: ctoOperativo },
      documentos_urls: docUrls,
      referencias: refs,
      updated_at: new Date().toISOString(),
    }
    await supabase.from('alta_clientes').update(updates).eq('id', alta.id)
    setSaving(false)
    setSaveMsg('Guardado')
    setTimeout(() => setSaveMsg(''), 2000)
  }

  const handleUpload = async (docKey: string, file: File) => {
    if (!alta) return
    if (file.size > MAX_FILE) { alert('Archivo excede 10MB'); return }
    setUploading(docKey)
    try {
      const ext = file.name.split('.').pop() || 'pdf'
      const path = `alta/${alta.id}/${docKey}.${ext}`
      const { error: upErr } = await supabase.storage.from('documentos_onboarding').upload(path, file, { cacheControl: '3600', upsert: true })
      if (upErr) { alert('Error: ' + upErr.message); setUploading(null); return }
      const { data: urlData } = supabase.storage.from('documentos_onboarding').getPublicUrl(path)
      const newUrls = { ...docUrls, [docKey]: urlData.publicUrl }
      setDocUrls(newUrls)
      await supabase.from('alta_clientes').update({ documentos_urls: newUrls, updated_at: new Date().toISOString() }).eq('id', alta.id)
    } catch (e) { alert('Error inesperado') }
    setUploading(null)
  }

  const handleFirma = async () => {
    if (!alta || !firmaNombre.trim() || !firmaAcepto) return
    setSigning(true)
    try {
      let clientIP = 'unknown'
      try { const r = await fetch('https://api.ipify.org?format=json'); clientIP = (await r.json()).ip || 'unknown' } catch {}
      const ts = new Date().toISOString()
      const ua = navigator.userAgent
      const payload = `${alta.id}|${firmaNombre.trim()}|${clientIP}|${ts}|${ua}`
      const buf = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(payload))
      const hash = Array.from(new Uint8Array(buf)).map(b => b.toString(16).padStart(2, '0')).join('')

      // Save everything
      await saveProgress()
      const docs = tipoEmpresa === 'USA_CANADA' ? DOCS_USA : DOCS_MX
      const allDocsUploaded = docs.every(d => docUrls[d.key])

      const updates: Record<string, unknown> = {
        firma_hash: hash, firma_ip: clientIP, firma_timestamp: ts, firma_user_agent: ua,
        firmante_nombre: firmaNombre.trim(),
        estado: allDocsUploaded ? 'PENDIENTE_CSR' : 'PENDIENTE_DOCS',
        updated_at: ts,
      }
      await supabase.from('alta_clientes').update(updates).eq('id', alta.id)
      setSigned(true)

      // Notify CS admin (Claudia Verde / Eli / Liz)
      if (allDocsUploaded) {
        const reviewUrl = `${window.location.origin}/alta/review/${alta.admin_token || alta.token}`
        await supabase.functions.invoke('enviar-correo', {
          body: {
            to: csrEmails,
            cc: ['juan.viveros@trob.com.mx'],
            subject: `Alta Completada por Cliente — ${alta.razon_social || empresa.razon_social} | Asignar CSR`,
            html: buildAdminEmailHTML(alta.razon_social || empresa.razon_social || 'Sin nombre',
              'El cliente ha completado su solicitud de alta, subido documentos y firmado digitalmente. Favor de revisar y asignar ejecutivo CSR.',
              reviewUrl),
            tipo: 'alta_pendiente_csr',
          },
        })
      }
    } catch (e) { alert('Error al firmar') }
    setSigning(false)
  }

  const nextStep = () => { saveProgress(); setStep(s => Math.min(s + 1, 5)) }
  const prevStep = () => { saveProgress(); setStep(s => Math.max(s - 1, 1)) }

  const docs = tipoEmpresa === 'USA_CANADA' ? DOCS_USA : DOCS_MX
  const docsUploaded = docs.filter(d => docUrls[d.key]).length

  // ─── RENDER ───
  if (loading) return (
    <div style={{ minHeight: '100vh', background: C.bg, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <Loader2 size={32} color={C.primary} style={{ animation: 'spin 1s linear infinite' }} />
      <style>{`@keyframes spin { to { transform: rotate(360deg) } }`}</style>
    </div>
  )

  if (error || !alta) return (
    <div style={{ minHeight: '100vh', background: C.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: "'Montserrat',sans-serif" }}>
      <div style={{ background: C.card, borderRadius: C.radius, padding: 48, textAlign: 'center', maxWidth: 420, border: `1px solid ${C.border}` }}>
        <AlertCircle size={48} color={C.red} style={{ marginBottom: 16 }} />
        <h2 style={{ margin: '0 0 8px', fontSize: 20, fontWeight: 700, color: C.text }}>Enlace inválido</h2>
        <p style={{ margin: 0, fontSize: 14, color: C.textSec }}>{error}</p>
      </div>
    </div>
  )

  const inputStyle = (w?: string): React.CSSProperties => ({ width: w || '100%', padding: '8px 12px', fontSize: 13, background: C.bg, border: `1px solid ${C.border}`, borderRadius: 8, color: C.text, outline: 'none', fontFamily: "'Montserrat',sans-serif" })
  const labelStyle: React.CSSProperties = { display: 'block', fontSize: 11, fontWeight: 600, color: C.textSec, marginBottom: 3, textTransform: 'uppercase', letterSpacing: '0.5px' }
  const sectionHeader = (title: string, color?: string) => (
    <div style={{ background: color || C.headerBg, color: '#fff', padding: '8px 16px', borderRadius: 8, marginBottom: 16, fontSize: 13, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.5px' }}>{title}</div>
  )

  return (
    <div style={{ minHeight: '100vh', background: C.bg, fontFamily: "'Montserrat',Helvetica,sans-serif", color: C.text }}>
      <style>{`@import url('https://fonts.googleapis.com/css2?family=Montserrat:wght@400;500;600;700;800&display=swap');@keyframes spin{to{transform:rotate(360deg)}}*{box-sizing:border-box;}`}</style>

      {/* Header */}
      <div style={{ background: '#fff', borderBottom: `3px solid ${C.headerBg}`, padding: '16px 0' }}>
        <div style={{ maxWidth: 800, margin: '0 auto', padding: '0 24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div>
            <span style={{ fontSize: 22, fontWeight: 800, color: C.text }}>GRUPO LOMA</span>
            <span style={{ fontSize: 14, fontWeight: 700, color: C.headerBg, marginLeft: 12 }}>ALTA DE CLIENTE</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            {saving && <Loader2 size={14} color={C.primary} style={{ animation: 'spin 1s linear infinite' }} />}
            {saveMsg && <span style={{ fontSize: 12, color: C.green, fontWeight: 600 }}>{saveMsg}</span>}
          </div>
        </div>
      </div>

      {/* Progress steps */}
      <div style={{ maxWidth: 800, margin: '0 auto', padding: '20px 24px 0' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 4, marginBottom: 24 }}>
          {['Tipo', 'Datos', 'Documentos', 'Referencias', 'Firma'].map((s, i) => (
            <div key={i} style={{ flex: 1 }}>
              <div style={{ height: 4, borderRadius: 2, background: step > i + 1 ? C.green : step === i + 1 ? C.primary : '#E2E8F0', transition: 'background 0.3s' }} />
              <p style={{ margin: '4px 0 0', fontSize: 10, fontWeight: 600, color: step >= i + 1 ? C.text : C.textMuted, textAlign: 'center' }}>{s}</p>
            </div>
          ))}
        </div>

        {/* Company info bar */}
        <div style={{ fontSize: 14, color: C.textSec, marginBottom: 16 }}>
          <strong style={{ color: C.text }}>{alta.razon_social || empresa.razon_social || 'Nueva solicitud'}</strong>
          {alta.empresa_destino && <span style={{ marginLeft: 8, fontSize: 12, color: C.primary, fontWeight: 600 }}>→ {alta.empresa_destino.replace('_', ' ')}</span>}
          {tipoEmpresa && <span style={{ marginLeft: 8, fontSize: 11, padding: '2px 8px', borderRadius: 4, background: tipoEmpresa === 'MEXICANA' ? '#FEF3C7' : '#DBEAFE', color: tipoEmpresa === 'MEXICANA' ? '#92400E' : '#1E40AF', fontWeight: 600 }}>
            {tipoEmpresa === 'MEXICANA' ? '🇲🇽 Mexicana' : '🇺🇸 USA/Canadá'}
          </span>}
        </div>
      </div>

      {/* Content */}
      <div style={{ maxWidth: 800, margin: '0 auto', padding: '0 24px 48px' }}>
        <div style={{ background: C.card, borderRadius: C.radius, border: `1px solid ${C.border}`, padding: 28 }}>

          {/* ── STEP 1: Tipo Empresa ── */}
          {step === 1 && (
            <div>
              <h2 style={{ margin: '0 0 8px', fontSize: 20, fontWeight: 800 }}>Tipo de Empresa</h2>
              <p style={{ margin: '0 0 24px', fontSize: 14, color: C.textSec }}>Seleccione el país de constitución de su empresa. Los documentos requeridos varían.</p>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                {([['MEXICANA', '🇲🇽', 'Empresa Mexicana', 'Documentos: CSF, INE, Acta Constitutiva, Carátula Bancaria, Comprobante Domicilio, Poder Notarial, CTPAT, Acuerdo Accesoriales'],
                  ['USA_CANADA', '🇺🇸', 'USA / Canadá', 'Documents: Bank Statement, MC#, W-9, Void Check']] as const).map(([val, flag, label, desc]) => (
                  <div key={val} onClick={() => setTipoEmpresa(val)} style={{
                    padding: 24, borderRadius: C.radius, cursor: 'pointer', textAlign: 'center',
                    border: `2px solid ${tipoEmpresa === val ? C.primary : C.border}`,
                    background: tipoEmpresa === val ? C.primaryBg : 'transparent',
                    transition: 'all 0.2s',
                  }}>
                    <span style={{ fontSize: 48 }}>{flag}</span>
                    <p style={{ margin: '12px 0 4px', fontSize: 16, fontWeight: 700, color: C.text }}>{label}</p>
                    <p style={{ margin: 0, fontSize: 11, color: C.textMuted, lineHeight: 1.5 }}>{desc}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ── STEP 2: Datos Empresa + Contactos ── */}
          {step === 2 && (
            <div>
              {sectionHeader('Datos de la Empresa')}
              <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 12, marginBottom: 16 }}>
                <div><label style={labelStyle}>Nombre / Razón Social</label><input style={inputStyle()} value={empresa.razon_social} onChange={e => setEmpresa(p => ({ ...p, razon_social: e.target.value }))} placeholder="Grupo Industrial del Norte SA de CV" /></div>
                <div><label style={labelStyle}>{tipoEmpresa === 'USA_CANADA' ? 'MC#' : 'RFC'}</label><input style={inputStyle()} value={empresa.rfc_mc} onChange={e => setEmpresa(p => ({ ...p, rfc_mc: e.target.value }))} placeholder={tipoEmpresa === 'USA_CANADA' ? 'MC-123456' : 'XAXX010101000'} /></div>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 16 }}>
                <div><label style={labelStyle}>Giro</label><input style={inputStyle()} value={empresa.giro} onChange={e => setEmpresa(p => ({ ...p, giro: e.target.value }))} /></div>
                <div><label style={labelStyle}>Sitio Web</label><input style={inputStyle()} value={empresa.sitio_web} onChange={e => setEmpresa(p => ({ ...p, sitio_web: e.target.value }))} /></div>
              </div>
              <div style={{ marginBottom: 16 }}><label style={labelStyle}>Dirección Completa</label><input style={inputStyle()} value={empresa.direccion} onChange={e => setEmpresa(p => ({ ...p, direccion: e.target.value }))} placeholder="Calle, número, colonia, CP, ciudad, estado, país" /></div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 16 }}>
                <div><label style={labelStyle}>Google Maps Oficina</label><input style={inputStyle()} value={empresa.gmaps_oficina} onChange={e => setEmpresa(p => ({ ...p, gmaps_oficina: e.target.value }))} placeholder="Link de Google Maps" /></div>
                <div><label style={labelStyle}>Google Maps Planta</label><input style={inputStyle()} value={empresa.gmaps_planta} onChange={e => setEmpresa(p => ({ ...p, gmaps_planta: e.target.value }))} /></div>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12, marginBottom: 24 }}>
                <div><label style={labelStyle}>Tel Oficina</label><input style={inputStyle()} value={empresa.tel_oficina} onChange={e => setEmpresa(p => ({ ...p, tel_oficina: e.target.value }))} /></div>
                <div><label style={labelStyle}>Tel Directo</label><input style={inputStyle()} value={empresa.tel_directo} onChange={e => setEmpresa(p => ({ ...p, tel_directo: e.target.value }))} /></div>
                <div><label style={labelStyle}>WhatsApp</label><input style={inputStyle()} value={empresa.whatsapp} onChange={e => setEmpresa(p => ({ ...p, whatsapp: e.target.value }))} /></div>
              </div>

              {/* Contacto Pagos */}
              {sectionHeader('Contacto Administrativo (Pagos)')}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 12 }}>
                <div><label style={labelStyle}>Nombre</label><input style={inputStyle()} value={ctoPagos.nombre} onChange={e => setCtoPagos(p => ({ ...p, nombre: e.target.value }))} /></div>
                <div><label style={labelStyle}>Departamento</label><input style={inputStyle()} value={ctoPagos.depto} onChange={e => setCtoPagos(p => ({ ...p, depto: e.target.value }))} /></div>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 12 }}>
                <div><label style={labelStyle}>Email</label><input style={inputStyle()} value={ctoPagos.email} onChange={e => setCtoPagos(p => ({ ...p, email: e.target.value }))} type="email" /></div>
                <div><label style={labelStyle}>Tel/Ext</label><input style={inputStyle()} value={ctoPagos.tel} onChange={e => setCtoPagos(p => ({ ...p, tel: e.target.value }))} /></div>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 12 }}>
                <div><label style={labelStyle}>Banco</label><input style={inputStyle()} value={ctoPagos.banco} onChange={e => setCtoPagos(p => ({ ...p, banco: e.target.value }))} /></div>
                <div><label style={labelStyle}>CLABE / Routing</label><input style={inputStyle()} value={ctoPagos.clabe_routing} onChange={e => setCtoPagos(p => ({ ...p, clabe_routing: e.target.value }))} /></div>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 24 }}>
                <div>
                  <label style={labelStyle}>Forma de Pago</label>
                  <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
                    {['Transferencia', 'Cheque', 'Depósito', 'Portal'].map(fp => (
                      <label key={fp} style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 13, cursor: 'pointer', color: C.textSec }}>
                        <input type="radio" name="forma_pago" value={fp} checked={ctoPagos.forma_pago === fp} onChange={e => setCtoPagos(p => ({ ...p, forma_pago: e.target.value }))} style={{ accentColor: C.primary }} /> {fp}
                      </label>
                    ))}
                  </div>
                </div>
                <div><label style={labelStyle}>Proceso Facturación/Pago</label><input style={inputStyle()} value={ctoPagos.proceso_facturacion} onChange={e => setCtoPagos(p => ({ ...p, proceso_facturacion: e.target.value }))} /></div>
              </div>

              {/* Contacto Facturas */}
              {sectionHeader('Contacto (Envío de Facturas)')}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 12 }}>
                <div><label style={labelStyle}>Nombre</label><input style={inputStyle()} value={ctoFacturas.nombre} onChange={e => setCtoFacturas(p => ({ ...p, nombre: e.target.value }))} /></div>
                <div><label style={labelStyle}>Departamento</label><input style={inputStyle()} value={ctoFacturas.depto} onChange={e => setCtoFacturas(p => ({ ...p, depto: e.target.value }))} /></div>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 24 }}>
                <div><label style={labelStyle}>Email Facturas</label><input style={inputStyle()} value={ctoFacturas.email} onChange={e => setCtoFacturas(p => ({ ...p, email: e.target.value }))} type="email" /></div>
                <div><label style={labelStyle}>Tel/Ext</label><input style={inputStyle()} value={ctoFacturas.tel} onChange={e => setCtoFacturas(p => ({ ...p, tel: e.target.value }))} /></div>
              </div>

              {/* Contacto Operativo */}
              {sectionHeader('Contacto Operativo (Embarques)')}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 12 }}>
                <div><label style={labelStyle}>Nombre</label><input style={inputStyle()} value={ctoOperativo.nombre} onChange={e => setCtoOperativo(p => ({ ...p, nombre: e.target.value }))} /></div>
                <div><label style={labelStyle}>Departamento</label><input style={inputStyle()} value={ctoOperativo.depto} onChange={e => setCtoOperativo(p => ({ ...p, depto: e.target.value }))} /></div>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <div><label style={labelStyle}>Email</label><input style={inputStyle()} value={ctoOperativo.email} onChange={e => setCtoOperativo(p => ({ ...p, email: e.target.value }))} type="email" /></div>
                <div><label style={labelStyle}>Tel/Cel</label><input style={inputStyle()} value={ctoOperativo.tel} onChange={e => setCtoOperativo(p => ({ ...p, tel: e.target.value }))} /></div>
              </div>
            </div>
          )}

          {/* ── STEP 3: Documentos ── */}
          {step === 3 && (
            <div>
              <h2 style={{ margin: '0 0 4px', fontSize: 18, fontWeight: 800 }}>Documentos Requeridos</h2>
              <p style={{ margin: '0 0 8px', fontSize: 13, color: C.textSec }}>
                {tipoEmpresa === 'USA_CANADA' ? 'USA/Canada: Bank Statement, MC#, W-9, Void Check' : 'México: Carátula, CSF, Comprobante Domicilio, Acta, INE, Poder Notarial, CTPAT, Acuerdo Accesoriales'}
              </p>
              <div style={{ padding: '8px 16px', background: C.blueBg, borderRadius: 8, marginBottom: 20, fontSize: 12, color: C.blue }}>
                Formatos aceptados: PDF, JPG, PNG, WebP. Máximo 10 MB por archivo. Los documentos pueden variar — suba lo que tenga disponible.
              </div>
              <div style={{ display: 'grid', gap: 12 }}>
                {docs.map(doc => {
                  const url = docUrls[doc.key]
                  const isUp = uploading === doc.key
                  return (
                    <div key={doc.key} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 18px', borderRadius: 10, border: `1px solid ${url ? C.green + '40' : C.border}`, background: url ? C.greenBg : 'transparent' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        {url ? <CheckCircle size={18} color={C.green} /> : <FileText size={18} color={C.textMuted} />}
                        <span style={{ fontSize: 14, fontWeight: 600, color: C.text }}>{doc.label}</span>
                      </div>
                      {isUp ? <Loader2 size={18} color={C.primary} style={{ animation: 'spin 1s linear infinite' }} /> : (
                        <label style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '6px 14px', fontSize: 12, fontWeight: 600, color: url ? C.textSec : '#fff', background: url ? 'transparent' : C.primary, border: url ? `1px solid ${C.border}` : 'none', borderRadius: 8, cursor: 'pointer' }}>
                          <Upload size={14} />{url ? 'Reemplazar' : 'Subir'}
                          <input type="file" accept={ACCEPTED} style={{ display: 'none' }} onChange={e => { const f = e.target.files?.[0]; if (f) handleUpload(doc.key, f); e.target.value = '' }} />
                        </label>
                      )}
                    </div>
                  )
                })}
              </div>
              <p style={{ margin: '16px 0 0', fontSize: 13, fontWeight: 600, color: C.primary }}>{docsUploaded}/{docs.length} documentos subidos</p>
            </div>
          )}

          {/* ── STEP 4: Referencias ── */}
          {step === 4 && (
            <div>
              {sectionHeader('Referencias Comerciales (Transportistas)')}
              <p style={{ margin: '0 0 20px', fontSize: 13, color: C.textSec }}>Proporcione 3 referencias de transportistas con los que haya trabajado.</p>
              {refs.map((ref, i) => (
                <div key={i} style={{ marginBottom: 20, padding: 16, borderRadius: 10, border: `1px solid ${C.border}`, background: i % 2 === 0 ? 'transparent' : C.bg }}>
                  <p style={{ margin: '0 0 10px', fontSize: 13, fontWeight: 700, color: C.primary }}>REFERENCIA {i + 1}</p>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                    <div><label style={labelStyle}>Razón Social</label><input style={inputStyle()} value={ref.razon_social} onChange={e => { const n = [...refs]; n[i] = { ...n[i], razon_social: e.target.value }; setRefs(n) }} /></div>
                    <div><label style={labelStyle}>Contacto</label><input style={inputStyle()} value={ref.contacto} onChange={e => { const n = [...refs]; n[i] = { ...n[i], contacto: e.target.value }; setRefs(n) }} /></div>
                    <div><label style={labelStyle}>Teléfono</label><input style={inputStyle()} value={ref.tel} onChange={e => { const n = [...refs]; n[i] = { ...n[i], tel: e.target.value }; setRefs(n) }} /></div>
                    <div><label style={labelStyle}>Celular</label><input style={inputStyle()} value={ref.cel} onChange={e => { const n = [...refs]; n[i] = { ...n[i], cel: e.target.value }; setRefs(n) }} /></div>
                    <div><label style={labelStyle}>Tiempo de Relación</label><input style={inputStyle()} value={ref.tiempo} onChange={e => { const n = [...refs]; n[i] = { ...n[i], tiempo: e.target.value }; setRefs(n) }} placeholder="Ej: 3 años" /></div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* ── STEP 5: Firma ── */}
          {step === 5 && (
            <div>
              {sectionHeader('Declaración y Compromiso del Cliente')}

              <div style={{ padding: 20, background: C.bg, borderRadius: 10, marginBottom: 20, fontSize: 13, color: C.textSec, lineHeight: 1.8 }}>
                <p style={{ margin: '0 0 8px' }}>Al completar esta solicitud, el cliente declara que toda la información es verdadera y precisa.</p>
                <p style={{ margin: '0 0 8px' }}>El cliente autoriza a GRUPO LOMA | TROB TRANSPORTES a verificar la información proporcionada.</p>
                <p style={{ margin: '0 0 8px' }}>El cliente se compromete a cumplir con los términos y condiciones de servicio establecidos.</p>
                <p style={{ margin: 0 }}>Al firmar, el Cliente acepta los TÉRMINOS Y CONDICIONES (incluidos en la solicitud).</p>
              </div>

              {!signed ? (
                <div>
                  <div style={{ marginBottom: 16 }}>
                    <label style={labelStyle}>Nombre del Representante Legal</label>
                    <input style={inputStyle()} value={firmaNombre} onChange={e => setFirmaNombre(e.target.value)} placeholder="Como aparece en su identificación" />
                  </div>
                  <label style={{ display: 'flex', alignItems: 'flex-start', gap: 10, cursor: 'pointer', marginBottom: 20 }}>
                    <input type="checkbox" checked={firmaAcepto} onChange={e => setFirmaAcepto(e.target.checked)} style={{ marginTop: 3, accentColor: C.primary }} />
                    <span style={{ fontSize: 13, color: C.textSec, lineHeight: 1.5 }}>
                      Declaro bajo protesta de decir verdad que la información y documentos proporcionados son verídicos y que estoy autorizado para representar a <strong>{empresa.razon_social || alta.razon_social}</strong> en este trámite. Acepto los Términos y Condiciones.
                    </span>
                  </label>
                  <div style={{ padding: '10px 14px', background: '#F1F5F9', borderRadius: 8, marginBottom: 20, fontSize: 11, color: C.textMuted }}>
                    Su firma incluirá: hash SHA-256, dirección IP, marca de tiempo y agente de navegador como evidencia legal.
                  </div>
                  <button onClick={handleFirma} disabled={!firmaNombre.trim() || !firmaAcepto || signing} style={{
                    padding: '12px 32px', fontSize: 14, fontWeight: 700, color: '#fff',
                    background: (!firmaNombre.trim() || !firmaAcepto) ? C.textMuted : C.green,
                    border: 'none', borderRadius: 8, cursor: (!firmaNombre.trim() || !firmaAcepto) ? 'not-allowed' : 'pointer',
                    opacity: (!firmaNombre.trim() || !firmaAcepto) ? 0.5 : 1, width: '100%',
                  }}>{signing ? 'Procesando firma...' : 'Firmar Digitalmente y Enviar Solicitud'}</button>
                </div>
              ) : (
                <div style={{ padding: 20, background: C.greenBg, borderRadius: 10, textAlign: 'center' }}>
                  <CheckCircle size={40} color={C.green} style={{ marginBottom: 12 }} />
                  <p style={{ margin: 0, fontSize: 18, fontWeight: 700, color: C.green }}>Solicitud firmada y enviada</p>
                  <p style={{ margin: '8px 0 0', fontSize: 13, color: C.textSec }}>Su documentación está siendo revisada. Le notificaremos por correo cuando el alta se complete.</p>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Navigation buttons */}
        {!signed && (
          <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 20 }}>
            <button onClick={prevStep} disabled={step === 1} style={{
              display: 'flex', alignItems: 'center', gap: 6, padding: '10px 20px', fontSize: 13, fontWeight: 600,
              color: step === 1 ? C.textMuted : C.textSec, background: 'transparent',
              border: `1px solid ${step === 1 ? C.border : C.borderDark}`, borderRadius: 8,
              cursor: step === 1 ? 'not-allowed' : 'pointer', opacity: step === 1 ? 0.5 : 1,
            }}><ChevronLeft size={16} /> Anterior</button>

            {step < 5 && (
              <button onClick={nextStep} disabled={step === 1 && !tipoEmpresa} style={{
                display: 'flex', alignItems: 'center', gap: 6, padding: '10px 24px', fontSize: 13, fontWeight: 700,
                color: '#fff', background: (step === 1 && !tipoEmpresa) ? C.textMuted : C.primary,
                border: 'none', borderRadius: 8,
                cursor: (step === 1 && !tipoEmpresa) ? 'not-allowed' : 'pointer',
                opacity: (step === 1 && !tipoEmpresa) ? 0.5 : 1,
              }}>Siguiente <ChevronRight size={16} /></button>
            )}
          </div>
        )}

        {/* Footer */}
        <div style={{ marginTop: 40, paddingTop: 20, borderTop: `1px solid ${C.border}`, textAlign: 'center' }}>
          <p style={{ margin: 0, fontSize: 11, color: C.textMuted }}>GRUPO LOMA | TROB TRANSPORTES &middot; www.trob.com.mx</p>
          {alta.vendedor_nombre && <p style={{ margin: '4px 0 0', fontSize: 11, color: C.textMuted }}>Su ejecutivo: {alta.vendedor_nombre} — {alta.vendedor_email}</p>}
        </div>
      </div>
    </div>
  )
}

function buildAdminEmailHTML(razonSocial: string, message: string, reviewUrl: string): string {
  return `<!DOCTYPE html><html lang="es"><head><meta charset="UTF-8"></head>
<body style="margin:0;padding:0;background:#F7F8FA;font-family:'Montserrat',sans-serif;">
<table width="100%" cellpadding="0" cellspacing="0" style="background:#F7F8FA;">
<tr><td align="center" style="padding:32px 16px;">
<table width="520" cellpadding="0" cellspacing="0" style="background:#fff;border-radius:12px;border:1px solid rgba(15,23,42,0.08);">
<tr><td style="padding:24px 32px;border-bottom:1px solid rgba(15,23,42,0.06);">
<span style="font-size:18px;font-weight:800;color:#0F172A;">GRUPO LOMA</span>
<span style="font-size:10px;color:#94A3B8;margin-left:8px;text-transform:uppercase;">Alta de Cliente</span>
</td></tr>
<tr><td style="padding:24px 32px;">
<h2 style="margin:0 0 12px;font-size:18px;font-weight:700;color:#0F172A;">${razonSocial}</h2>
<p style="margin:0 0 20px;font-size:14px;color:#64748B;line-height:1.6;">${message}</p>
<a href="${reviewUrl}" style="display:inline-block;padding:12px 32px;background:#C27803;color:#fff;text-decoration:none;border-radius:8px;font-weight:700;font-size:14px;">Revisar y Asignar</a>
</td></tr>
<tr><td style="padding:16px 32px;border-top:1px solid rgba(15,23,42,0.06);">
<p style="margin:0;font-size:11px;color:#94A3B8;text-align:center;">GRUPO LOMA | TROB TRANSPORTES</p>
</td></tr>
</table></td></tr></table></body></html>`
}
