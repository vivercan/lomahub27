import { useState, useEffect, useCallback } from 'react'
import { useParams } from 'react-router-dom'
import { supabase } from '../../lib/supabase'
import { Upload, CheckCircle, AlertCircle, FileText, Shield, Loader2, X } from 'lucide-react'

/* ───────────────────────────────────────────────────────────────
   PORTAL PÚBLICO DE ALTA — Acceso por token UUID (sin login)
   Paso 2 del flujo F01: El cliente sube sus documentos y firma

   Docs requeridos: Constancia Fiscal, INE, Acta Constitutiva, Carátula Bancaria
   Firma digital: SHA-256 hash + IP + timestamp + user_agent
   Al completar: cambia estado a PENDIENTE_CSR y envía email a Claudia Verde
   ─────────────────────────────────────────────────────────────── */

const BRAND = {
  bg: '#F7F8FA',
  card: '#FFFFFF',
  border: 'rgba(15,23,42,0.08)',
  primary: '#3B6CE7',
  green: '#0D9668',
  greenBg: 'rgba(13,150,104,0.08)',
  red: '#DC2626',
  redBg: 'rgba(220,38,38,0.08)',
  text: '#0F172A',
  textSec: '#64748B',
  textMuted: '#94A3B8',
  radius: '12px',
}

interface AltaData {
  id: string
  token: string
  estado: string
  razon_social: string | null
  rfc: string | null
  contacto_nombre: string | null
  constancia_fiscal_url: string | null
  constancia_fiscal_valida: boolean | null
  ine_url: string | null
  ine_valida: boolean | null
  acta_constitutiva_url: string | null
  acta_valida: boolean | null
  caratula_bancaria_url: string | null
  caratula_valida: boolean | null
  firma_hash: string | null
  firma_ip: string | null
  firma_timestamp: string | null
  direccion_fiscal: string | null
  regimen_fiscal: string | null
  vendedor_nombre: string | null
  vendedor_email: string | null
}

interface DocConfig {
  key: 'constancia_fiscal' | 'ine' | 'acta_constitutiva' | 'caratula_bancaria'
  label: string
  description: string
  urlField: keyof AltaData
  validField: keyof AltaData
}

const DOCS: DocConfig[] = [
  { key: 'constancia_fiscal', label: 'Constancia de Situación Fiscal', description: 'Documento emitido por el SAT con datos fiscales vigentes', urlField: 'constancia_fiscal_url', validField: 'constancia_fiscal_valida' },
  { key: 'ine', label: 'INE del Representante Legal', description: 'Identificación oficial vigente del representante legal', urlField: 'ine_url', validField: 'ine_valida' },
  { key: 'acta_constitutiva', label: 'Acta Constitutiva', description: 'Documento notarial de constitución de la empresa', urlField: 'acta_constitutiva_url', validField: 'acta_valida' },
  { key: 'caratula_bancaria', label: 'Carátula Bancaria', description: 'Estado de cuenta o carátula con datos bancarios para pagos', urlField: 'caratula_bancaria_url', validField: 'caratula_valida' },
]

const MAX_FILE_SIZE = 10 * 1024 * 1024 // 10MB
const ACCEPTED_TYPES = ['application/pdf', 'image/jpeg', 'image/jpg', 'image/png', 'image/webp']

export default function PortalAltaPublico() {
  const { token } = useParams<{ token: string }>()
  const [alta, setAlta] = useState<AltaData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [uploading, setUploading] = useState<string | null>(null)
  const [uploadSuccess, setUploadSuccess] = useState<string | null>(null)

  // Firma digital state
  const [showFirma, setShowFirma] = useState(false)
  const [firmaNombre, setFirmaNombre] = useState('')
  const [firmaAcepto, setFirmaAcepto] = useState(false)
  const [signing, setSigning] = useState(false)
  const [signed, setSigned] = useState(false)

  // Additional form fields
  const [direccionFiscal, setDireccionFiscal] = useState('')
  const [regimenFiscal, setRegimenFiscal] = useState('')

  const fetchAlta = useCallback(async () => {
    if (!token) { setError('Token inválido'); setLoading(false); return }

    const { data, error: err } = await supabase
      .from('alta_clientes')
      .select('*')
      .eq('token', token)
      .single()

    if (err || !data) {
      setError('Solicitud no encontrada o enlace inválido')
      setLoading(false)
      return
    }

    setAlta(data)
    setDireccionFiscal(data.direccion_fiscal || '')
    setRegimenFiscal(data.regimen_fiscal || '')
    setSigned(!!data.firma_hash)
    setLoading(false)
  }, [token])

  useEffect(() => { fetchAlta() }, [fetchAlta])

  const handleUpload = async (doc: DocConfig, file: File) => {
    if (!alta) return

    if (file.size > MAX_FILE_SIZE) {
      alert('El archivo excede el límite de 10MB')
      return
    }
    if (!ACCEPTED_TYPES.includes(file.type)) {
      alert('Formato no aceptado. Use PDF, JPG, PNG o WebP')
      return
    }

    setUploading(doc.key)
    setUploadSuccess(null)

    try {
      const ext = file.name.split('.').pop() || 'pdf'
      const path = `alta/${alta.id}/${doc.key}.${ext}`

      // Upload to Supabase Storage
      const { error: uploadErr } = await supabase.storage
        .from('documentos_onboarding')
        .upload(path, file, { cacheControl: '3600', upsert: true })

      if (uploadErr) {
        console.error('Upload error:', uploadErr)
        alert('Error al subir el archivo: ' + uploadErr.message)
        setUploading(null)
        return
      }

      // Get public URL
      const { data: urlData } = supabase.storage
        .from('documentos_onboarding')
        .getPublicUrl(path)

      // Update alta_clientes record
      const updates: Record<string, unknown> = {
        [doc.urlField]: urlData.publicUrl,
        updated_at: new Date().toISOString(),
      }

      const { error: updateErr } = await supabase
        .from('alta_clientes')
        .update(updates)
        .eq('id', alta.id)

      if (updateErr) {
        console.error('Update error:', updateErr)
        alert('Error al registrar documento')
      } else {
        setAlta(prev => prev ? { ...prev, [doc.urlField]: urlData.publicUrl } : null)
        setUploadSuccess(doc.key)
        setTimeout(() => setUploadSuccess(null), 3000)
      }
    } catch (e) {
      console.error('Upload exception:', e)
      alert('Error inesperado al subir archivo')
    } finally {
      setUploading(null)
    }
  }

  const handleSaveExtraFields = async () => {
    if (!alta) return
    await supabase.from('alta_clientes').update({
      direccion_fiscal: direccionFiscal.trim() || null,
      regimen_fiscal: regimenFiscal.trim() || null,
      updated_at: new Date().toISOString(),
    }).eq('id', alta.id)
  }

  const handleFirma = async () => {
    if (!alta || !firmaNombre.trim() || !firmaAcepto) return
    setSigning(true)

    try {
      // Get client IP
      let clientIP = 'unknown'
      try {
        const res = await fetch('https://api.ipify.org?format=json')
        const data = await res.json()
        clientIP = data.ip || 'unknown'
      } catch { /* fallback */ }

      const timestamp = new Date().toISOString()
      const userAgent = navigator.userAgent

      // Generate SHA-256 hash
      const payload = `${alta.id}|${firmaNombre.trim()}|${clientIP}|${timestamp}|${userAgent}`
      const encoder = new TextEncoder()
      const hashBuffer = await crypto.subtle.digest('SHA-256', encoder.encode(payload))
      const hashArray = Array.from(new Uint8Array(hashBuffer))
      const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('')

      // Save extra fields too
      const updates: Record<string, unknown> = {
        firma_hash: hashHex,
        firma_ip: clientIP,
        firma_timestamp: timestamp,
        firma_user_agent: userAgent,
        firmante_nombre: firmaNombre.trim(),
        direccion_fiscal: direccionFiscal.trim() || null,
        regimen_fiscal: regimenFiscal.trim() || null,
        updated_at: timestamp,
      }

      // Check if all 4 docs are uploaded — if so, transition to PENDIENTE_CSR
      const allDocsUploaded = DOCS.every(d => alta[d.urlField])
      if (allDocsUploaded) {
        updates.estado = 'PENDIENTE_CSR'
      }

      const { error: updateErr } = await supabase
        .from('alta_clientes')
        .update(updates)
        .eq('id', alta.id)

      if (updateErr) {
        alert('Error al registrar firma: ' + updateErr.message)
      } else {
        setSigned(true)
        setAlta(prev => prev ? { ...prev, ...updates } as AltaData : null)

        // Send notification email to CS admin
        if (allDocsUploaded) {
          try {
            await supabase.functions.invoke('enviar-correo', {
              body: {
                to: ['eli@trob.com.mx', 'liz@trob.com.mx'],
                cc: ['juan.viveros@trob.com.mx'],
                subject: `Alta Completada por Cliente — ${alta.razon_social} | Pendiente Asignación CSR`,
                html: buildNotificationHTML(alta.razon_social || 'Sin nombre', 'Los documentos han sido subidos y la firma digital completada. Favor de asignar ejecutivo CSR.'),
                tipo: 'alta_pendiente_csr',
              },
            })
          } catch (e) { console.error('Notification email error:', e) }
        }
      }
    } catch (e) {
      console.error('Firma error:', e)
      alert('Error al procesar la firma digital')
    } finally {
      setSigning(false)
    }
  }

  const docsUploaded = alta ? DOCS.filter(d => alta[d.urlField]).length : 0
  const allDone = docsUploaded === 4 && signed
  const isCompleted = alta?.estado === 'COMPLETADA'
  const isPastEnviada = alta && alta.estado !== 'ENVIADA'

  // ─── RENDER ───

  if (loading) {
    return (
      <div style={{ minHeight: '100vh', background: BRAND.bg, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <Loader2 size={32} color={BRAND.primary} style={{ animation: 'spin 1s linear infinite' }} />
        <style>{`@keyframes spin { to { transform: rotate(360deg) } }`}</style>
      </div>
    )
  }

  if (error || !alta) {
    return (
      <div style={{ minHeight: '100vh', background: BRAND.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: "'Montserrat',sans-serif" }}>
        <div style={{ background: BRAND.card, borderRadius: BRAND.radius, padding: '48px', textAlign: 'center', maxWidth: 420, border: `1px solid ${BRAND.border}` }}>
          <AlertCircle size={48} color={BRAND.red} style={{ marginBottom: 16 }} />
          <h2 style={{ margin: '0 0 8px', fontSize: '20px', fontWeight: 700, color: BRAND.text }}>Enlace inválido</h2>
          <p style={{ margin: 0, fontSize: '14px', color: BRAND.textSec, lineHeight: 1.6 }}>{error || 'No se encontró la solicitud de alta.'}</p>
        </div>
      </div>
    )
  }

  return (
    <div style={{ minHeight: '100vh', background: BRAND.bg, fontFamily: "'Montserrat',Helvetica,Arial,sans-serif", color: BRAND.text }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Montserrat:wght@400;500;600;700;800&display=swap');
        @keyframes spin { to { transform: rotate(360deg) } }
        * { box-sizing: border-box; }
      `}</style>

      {/* Header */}
      <div style={{ background: BRAND.card, borderBottom: `1px solid ${BRAND.border}`, padding: '20px 0' }}>
        <div style={{ maxWidth: 720, margin: '0 auto', padding: '0 24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div>
            <span style={{ fontSize: '20px', fontWeight: 800, color: BRAND.text, letterSpacing: '-0.5px' }}>LomaHUB27</span>
            <span style={{ fontSize: '11px', color: BRAND.textMuted, marginLeft: 8, textTransform: 'uppercase', letterSpacing: '1px' }}>TROB Logistics</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <div style={{ width: 8, height: 8, borderRadius: '50%', background: isCompleted ? BRAND.green : BRAND.primary }} />
            <span style={{ fontSize: '12px', fontWeight: 600, color: isCompleted ? BRAND.green : BRAND.primary }}>
              {isCompleted ? 'Alta Completada' : 'Alta en Proceso'}
            </span>
          </div>
        </div>
      </div>

      {/* Content */}
      <div style={{ maxWidth: 720, margin: '0 auto', padding: '32px 24px' }}>

        {/* Welcome */}
        <div style={{ marginBottom: 32 }}>
          <h1 style={{ margin: '0 0 8px', fontSize: '24px', fontWeight: 800, color: BRAND.text }}>
            Alta de Cliente
          </h1>
          <p style={{ margin: 0, fontSize: '15px', color: BRAND.textSec, lineHeight: 1.6 }}>
            <strong style={{ color: BRAND.text }}>{alta.razon_social}</strong> {alta.rfc ? `(${alta.rfc})` : ''}
          </p>
          {alta.contacto_nombre && (
            <p style={{ margin: '4px 0 0', fontSize: '13px', color: BRAND.textMuted }}>
              Contacto: {alta.contacto_nombre}
            </p>
          )}
        </div>

        {/* Progress */}
        <div style={{ background: BRAND.card, borderRadius: BRAND.radius, border: `1px solid ${BRAND.border}`, padding: '20px 24px', marginBottom: 24 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
            <span style={{ fontSize: '13px', fontWeight: 700, color: BRAND.text }}>Progreso</span>
            <span style={{ fontSize: '13px', fontWeight: 600, color: BRAND.primary }}>{docsUploaded}/4 documentos {signed ? '+ Firma' : ''}</span>
          </div>
          <div style={{ height: 6, borderRadius: 3, background: '#E2E8F0', overflow: 'hidden' }}>
            <div style={{
              height: '100%', borderRadius: 3, background: allDone ? BRAND.green : BRAND.primary,
              width: `${((docsUploaded + (signed ? 1 : 0)) / 5) * 100}%`,
              transition: 'width 0.5s ease',
            }} />
          </div>
        </div>

        {/* Completion banner */}
        {isCompleted && (
          <div style={{ background: BRAND.greenBg, border: `1px solid ${BRAND.green}30`, borderRadius: BRAND.radius, padding: '20px 24px', marginBottom: 24, display: 'flex', alignItems: 'center', gap: 12 }}>
            <CheckCircle size={24} color={BRAND.green} />
            <div>
              <p style={{ margin: 0, fontSize: '14px', fontWeight: 700, color: BRAND.green }}>Alta completada exitosamente</p>
              <p style={{ margin: '4px 0 0', fontSize: '13px', color: BRAND.textSec }}>Su empresa ha sido dada de alta. Su ejecutivo se pondrá en contacto con usted.</p>
            </div>
          </div>
        )}

        {/* Extra fields */}
        {!isPastEnviada && (
          <div style={{ background: BRAND.card, borderRadius: BRAND.radius, border: `1px solid ${BRAND.border}`, padding: '24px', marginBottom: 24 }}>
            <h3 style={{ margin: '0 0 16px', fontSize: '14px', fontWeight: 700, color: BRAND.text, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
              Datos Fiscales Adicionales
            </h3>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              <div>
                <label style={{ display: 'block', fontSize: '11px', fontWeight: 600, color: BRAND.textSec, marginBottom: 4, textTransform: 'uppercase', letterSpacing: '0.5px' }}>Dirección Fiscal</label>
                <input
                  value={direccionFiscal}
                  onChange={e => setDireccionFiscal(e.target.value)}
                  onBlur={handleSaveExtraFields}
                  placeholder="Calle, número, colonia, CP, ciudad, estado"
                  style={{ width: '100%', padding: '9px 12px', fontSize: '13px', background: BRAND.bg, border: `1px solid ${BRAND.border}`, borderRadius: '8px', color: BRAND.text, outline: 'none' }}
                />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '11px', fontWeight: 600, color: BRAND.textSec, marginBottom: 4, textTransform: 'uppercase', letterSpacing: '0.5px' }}>Régimen Fiscal</label>
                <input
                  value={regimenFiscal}
                  onChange={e => setRegimenFiscal(e.target.value)}
                  onBlur={handleSaveExtraFields}
                  placeholder="Ej: 601 - General de Ley"
                  style={{ width: '100%', padding: '9px 12px', fontSize: '13px', background: BRAND.bg, border: `1px solid ${BRAND.border}`, borderRadius: '8px', color: BRAND.text, outline: 'none' }}
                />
              </div>
            </div>
          </div>
        )}

        {/* Document upload cards */}
        <div style={{ display: 'grid', gap: 16, marginBottom: 32 }}>
          {DOCS.map(doc => {
            const url = alta[doc.urlField] as string | null
            const isUploading = uploading === doc.key
            const justUploaded = uploadSuccess === doc.key

            return (
              <div key={doc.key} style={{
                background: BRAND.card, borderRadius: BRAND.radius,
                border: `1px solid ${url ? BRAND.green + '40' : BRAND.border}`,
                padding: '20px 24px',
                transition: 'border-color 0.3s',
              }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    {url ? (
                      <div style={{ width: 36, height: 36, borderRadius: '50%', background: BRAND.greenBg, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <CheckCircle size={18} color={BRAND.green} />
                      </div>
                    ) : (
                      <div style={{ width: 36, height: 36, borderRadius: '50%', background: '#F1F5F9', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <FileText size={18} color={BRAND.textMuted} />
                      </div>
                    )}
                    <div>
                      <p style={{ margin: 0, fontSize: '14px', fontWeight: 600, color: BRAND.text }}>{doc.label}</p>
                      <p style={{ margin: '2px 0 0', fontSize: '12px', color: BRAND.textMuted }}>{doc.description}</p>
                    </div>
                  </div>

                  <div>
                    {justUploaded ? (
                      <span style={{ fontSize: '12px', fontWeight: 600, color: BRAND.green }}>Subido</span>
                    ) : isUploading ? (
                      <Loader2 size={18} color={BRAND.primary} style={{ animation: 'spin 1s linear infinite' }} />
                    ) : (
                      <label style={{
                        display: 'inline-flex', alignItems: 'center', gap: 6,
                        padding: '8px 16px', fontSize: '12px', fontWeight: 600,
                        color: url ? BRAND.textSec : '#fff',
                        background: url ? 'transparent' : BRAND.primary,
                        border: url ? `1px solid ${BRAND.border}` : 'none',
                        borderRadius: '8px', cursor: 'pointer',
                      }}>
                        <Upload size={14} />
                        {url ? 'Reemplazar' : 'Subir'}
                        <input
                          type="file"
                          accept=".pdf,.jpg,.jpeg,.png,.webp"
                          style={{ display: 'none' }}
                          onChange={e => {
                            const f = e.target.files?.[0]
                            if (f) handleUpload(doc, f)
                            e.target.value = ''
                          }}
                        />
                      </label>
                    )}
                  </div>
                </div>
              </div>
            )
          })}
        </div>

        {/* Digital Signature */}
        {!signed ? (
          <div style={{ background: BRAND.card, borderRadius: BRAND.radius, border: `1px solid ${BRAND.border}`, padding: '24px', marginBottom: 32 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
              <Shield size={20} color={BRAND.primary} />
              <h3 style={{ margin: 0, fontSize: '16px', fontWeight: 700, color: BRAND.text }}>Firma Digital</h3>
            </div>

            {docsUploaded < 4 ? (
              <p style={{ margin: 0, fontSize: '13px', color: BRAND.textMuted }}>
                Suba los 4 documentos requeridos para habilitar la firma digital.
              </p>
            ) : !showFirma ? (
              <div>
                <p style={{ margin: '0 0 16px', fontSize: '13px', color: BRAND.textSec, lineHeight: 1.6 }}>
                  Todos los documentos han sido recibidos. Para finalizar el proceso, debe completar su firma digital.
                </p>
                <button onClick={() => setShowFirma(true)} style={{
                  padding: '10px 24px', fontSize: '14px', fontWeight: 700,
                  color: '#fff', background: BRAND.primary, border: 'none',
                  borderRadius: '8px', cursor: 'pointer',
                }}>
                  Firmar Digitalmente
                </button>
              </div>
            ) : (
              <div>
                <div style={{ marginBottom: 16 }}>
                  <label style={{ display: 'block', fontSize: '11px', fontWeight: 600, color: BRAND.textSec, marginBottom: 4, textTransform: 'uppercase' }}>Nombre completo del firmante</label>
                  <input
                    value={firmaNombre}
                    onChange={e => setFirmaNombre(e.target.value)}
                    placeholder="Como aparece en su identificación"
                    style={{ width: '100%', padding: '10px 12px', fontSize: '14px', background: BRAND.bg, border: `1px solid ${BRAND.border}`, borderRadius: '8px', color: BRAND.text, outline: 'none' }}
                  />
                </div>

                <label style={{ display: 'flex', alignItems: 'flex-start', gap: 10, cursor: 'pointer', marginBottom: 16 }}>
                  <input
                    type="checkbox"
                    checked={firmaAcepto}
                    onChange={e => setFirmaAcepto(e.target.checked)}
                    style={{ marginTop: 3, accentColor: BRAND.primary }}
                  />
                  <span style={{ fontSize: '13px', color: BRAND.textSec, lineHeight: 1.5 }}>
                    Declaro bajo protesta de decir verdad que la información y documentos proporcionados son verídicos y que estoy autorizado para representar a <strong>{alta.razon_social}</strong> en este trámite.
                  </span>
                </label>

                <div style={{ padding: '12px 16px', background: '#F1F5F9', borderRadius: '8px', marginBottom: 16 }}>
                  <p style={{ margin: 0, fontSize: '11px', color: BRAND.textMuted, lineHeight: 1.5 }}>
                    Su firma digital incluirá: hash SHA-256 del documento, dirección IP, marca de tiempo y agente del navegador. Esta información se almacena de forma segura como evidencia legal del consentimiento.
                  </p>
                </div>

                <div style={{ display: 'flex', gap: 10 }}>
                  <button onClick={() => setShowFirma(false)} style={{
                    padding: '10px 20px', fontSize: '13px', fontWeight: 600,
                    color: BRAND.textSec, background: 'transparent',
                    border: `1px solid ${BRAND.border}`, borderRadius: '8px', cursor: 'pointer',
                  }}>
                    Cancelar
                  </button>
                  <button
                    onClick={handleFirma}
                    disabled={!firmaNombre.trim() || !firmaAcepto || signing}
                    style={{
                      padding: '10px 24px', fontSize: '14px', fontWeight: 700,
                      color: '#fff', background: (!firmaNombre.trim() || !firmaAcepto) ? BRAND.textMuted : BRAND.green,
                      border: 'none', borderRadius: '8px',
                      cursor: (!firmaNombre.trim() || !firmaAcepto || signing) ? 'not-allowed' : 'pointer',
                      opacity: (!firmaNombre.trim() || !firmaAcepto) ? 0.5 : 1,
                    }}
                  >
                    {signing ? 'Procesando...' : 'Confirmar Firma Digital'}
                  </button>
                </div>
              </div>
            )}
          </div>
        ) : (
          <div style={{ background: BRAND.greenBg, border: `1px solid ${BRAND.green}30`, borderRadius: BRAND.radius, padding: '20px 24px', marginBottom: 32, display: 'flex', alignItems: 'center', gap: 12 }}>
            <Shield size={20} color={BRAND.green} />
            <div>
              <p style={{ margin: 0, fontSize: '14px', fontWeight: 700, color: BRAND.green }}>Firma digital completada</p>
              <p style={{ margin: '4px 0 0', fontSize: '12px', color: BRAND.textSec }}>
                Hash: {alta.firma_hash ? alta.firma_hash.substring(0, 16) + '...' : 'N/A'}
                {alta.firma_timestamp ? ` | ${new Date(alta.firma_timestamp).toLocaleString('es-MX')}` : ''}
              </p>
            </div>
          </div>
        )}

        {/* All done banner */}
        {allDone && !isCompleted && (
          <div style={{ background: '#EDE9FE', border: '1px solid #8B5CF630', borderRadius: BRAND.radius, padding: '20px 24px', textAlign: 'center' }}>
            <CheckCircle size={32} color="#8B5CF6" style={{ marginBottom: 8 }} />
            <p style={{ margin: 0, fontSize: '16px', fontWeight: 700, color: '#5B21B6' }}>Documentación completa</p>
            <p style={{ margin: '8px 0 0', fontSize: '13px', color: BRAND.textSec, lineHeight: 1.6 }}>
              Su documentación ha sido recibida y está siendo revisada por nuestro equipo. Le notificaremos por correo electrónico cuando el proceso de alta se complete.
            </p>
          </div>
        )}

        {/* Footer */}
        <div style={{ marginTop: 48, paddingTop: 24, borderTop: `1px solid ${BRAND.border}`, textAlign: 'center' }}>
          <p style={{ margin: 0, fontSize: '11px', color: BRAND.textMuted }}>
            TROB Logistics &middot; Transporte de carga nacional e internacional
          </p>
          <p style={{ margin: '4px 0 0', fontSize: '11px', color: BRAND.textMuted }}>
            {alta.vendedor_nombre && `Su ejecutivo: ${alta.vendedor_nombre}`}
            {alta.vendedor_email && ` — ${alta.vendedor_email}`}
          </p>
        </div>
      </div>
    </div>
  )
}

/* ── Notification email HTML ── */
function buildNotificationHTML(razonSocial: string, message: string): string {
  return `<!DOCTYPE html>
<html lang="es">
<head><meta charset="UTF-8"></head>
<body style="margin:0;padding:0;background:#F7F8FA;font-family:'Montserrat',Helvetica,Arial,sans-serif;">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#F7F8FA;">
<tr><td align="center" style="padding:32px 16px;">
<table role="presentation" width="520" cellpadding="0" cellspacing="0" style="background:#FFFFFF;border-radius:12px;border:1px solid rgba(15,23,42,0.08);">
<tr><td style="padding:24px 32px;border-bottom:1px solid rgba(15,23,42,0.06);">
<span style="font-size:18px;font-weight:800;color:#0F172A;">LomaHUB27</span>
<span style="font-size:10px;color:#94A3B8;margin-left:8px;text-transform:uppercase;">Notificación</span>
</td></tr>
<tr><td style="padding:24px 32px;">
<h2 style="margin:0 0 12px;font-size:18px;font-weight:700;color:#0F172A;">Alta de Cliente: ${razonSocial}</h2>
<p style="margin:0;font-size:14px;color:#64748B;line-height:1.6;">${message}</p>
<p style="margin:16px 0 0;font-size:13px;">
<a href="https://v2.jjcrm27.com/clientes/workflow-alta" style="color:#3B6CE7;text-decoration:none;font-weight:600;">Ver en LomaHUB27 →</a>
</p>
</td></tr>
<tr><td style="padding:16px 32px;border-top:1px solid rgba(15,23,42,0.06);">
<p style="margin:0;font-size:11px;color:#94A3B8;text-align:center;">TROB Logistics</p>
</td></tr>
</table>
</td></tr>
</table>
</body></html>`
}
