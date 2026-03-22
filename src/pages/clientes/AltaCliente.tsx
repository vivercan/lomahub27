import { useState, useEffect } from 'react'
import { Copy, Check, Upload, FileText, AlertTriangle, Shield, ChevronDown, ChevronUp, Loader, User, Building2, CreditCard, FileCheck, Zap, ArrowLeft, ArrowRight } from 'lucide-react'
import { ModuleLayout } from '../../components/layout/ModuleLayout'
import { Card } from '../../components/ui/Card'
import { Button } from '../../components/ui/Button'
import { Input } from '../../components/ui/Input'
import { Select } from '../../components/ui/Select'
import { Badge } from '../../components/ui/Badge'
import { tokens } from '../../lib/tokens'
import { supabase } from '../../lib/supabase'
import { useAuthContext } from '../../hooks/AuthContext'

interface AnalisisContrato {
  resumen: string
  partes: { nombre: string; rol: string }[]
  vigencia: { inicio: string; fin: string; renovacion_automatica: boolean }
  obligaciones_clave: string[]
  clausulas_riesgo: { clausula: string; riesgo: string; severidad: string }[]
  penalizaciones: string[]
  tarifas_detectadas: { concepto: string; monto: string }[]
  alertas: string[]
  score_riesgo: number
  recomendacion_general: string
}

interface Ejecutivo { id: string; nombre: string; email: string; rol: string }

const ESTADOS_ALTA = [
  { id: 'DATOS_COMERCIALES', label: 'Datos Comerciales', icon: Building2, color: tokens.colors.primary },
  { id: 'DOCUMENTOS', label: 'Documentos', icon: FileText, color: tokens.colors.orange },
  { id: 'ASIGNACION_CSR', label: 'Asignar CSR', icon: User, color: tokens.colors.blue },
  { id: 'ASIGNACION_CXC', label: 'Asignar CxC', icon: CreditCard, color: tokens.colors.green },
  { id: 'CONTRATO_IA', label: 'Contrato IA', icon: Shield, color: '#A855F7' },
  { id: 'CONFIRMACION', label: 'Confirmar', icon: FileCheck, color: tokens.colors.green },
] as const

export default function AltaCliente() {
  const auth = useAuthContext()
  const [paso, setPaso] = useState(0)
  const [saving, setSaving] = useState(false)
  const [saveError, setSaveError] = useState<string | null>(null)
  const [saveSuccess, setSaveSuccess] = useState(false)

  // Step 1: Datos comerciales
  const [formData, setFormData] = useState({
    razonSocial: '', rfc: '', tipo: '', segmento: '',
    ciudad: '', estado_mx: '', direccion: '',
    contactoPrincipal: '', telefono: '', email: '',
    web: '', giro: '', notas: '',
  })

  // Step 2: Documentos
  const [docs, setDocs] = useState<{ name: string; file: File; status: 'pending' | 'uploading' | 'ok' | 'error'; url?: string }[]>([])
  const [docValidating, setDocValidating] = useState(false)
  const [docValidation, setDocValidation] = useState<{ valido: boolean; errores: string[] } | null>(null)

  // Step 3: CSR Assignment
  const [ejecutivosCS, setEjecutivosCS] = useState<Ejecutivo[]>([])
  const [selectedCSR, setSelectedCSR] = useState('')

  // Step 4: CxC Assignment
  const [ejecutivosCXC, setEjecutivosCXC] = useState<Ejecutivo[]>([])
  const [selectedCXC, setSelectedCXC] = useState('')

  // Step 5: Contract analysis
  const [contratoFile, setContratoFile] = useState<File | null>(null)
  const [analizando, setAnalizando] = useState(false)
  const [analisis, setAnalisis] = useState<AnalisisContrato | null>(null)
  const [analisisError, setAnalisisError] = useState<string | null>(null)
  const [seccionesAbiertas, setSeccionesAbiertas] = useState<Record<string, boolean>>({
    clausulas: true, penalizaciones: false, tarifas: false, obligaciones: false,
  })

  // Copy link
  const [copied, setCopied] = useState(false)
  const publicLinkUrl = 'https://lomahub.app/public/cliente/QTZx9mK2L'

  // Load ejecutivos for CSR/CXC
  useEffect(() => {
    const loadEjecutivos = async () => {
      const { data } = await supabase.from('sc_contactos_clientes').select('id, nombre, email, rol').order('nombre')
      if (data) {
        setEjecutivosCS(data.filter((e) => e.rol === 'cs' || e.rol === 'supervisor_cs'))
        setEjecutivosCXC(data.filter((e) => e.rol === 'cxc'))
      }
    }
    loadEjecutivos()
  }, [])

  const tipoOptions = [
    { value: '', label: 'Seleccionar tipo...' },
    { value: 'prospecto', label: 'Prospecto' },
    { value: 'activo', label: 'Activo' },
    { value: 'corporativo', label: 'Corporativo' },
    { value: 'estrategico', label: 'Estratégico' },
  ]

  const segmentoOptions = [
    { value: '', label: 'Seleccionar segmento...' },
    { value: 'grande', label: 'Empresa Grande' },
    { value: 'mediana', label: 'Empresa Mediana' },
    { value: 'pequeña', label: 'Empresa Pequeña' },
  ]

  const estadosMX = [
    { value: '', label: 'Estado...' },
    ...['AGS','BC','BCS','CAM','CHIS','CHIH','CDMX','COAH','COL','DGO','GTO','GRO','HGO','JAL','MEX','MICH','MOR','NAY','NL','OAX','PUE','QRO','QROO','SLP','SIN','SON','TAB','TAM','TLAX','VER','YUC','ZAC'].map(s => ({ value: s, label: s })),
  ]

  const handleInputChange = (field: string, value: string) => {
    if (field === 'razonSocial') value = value.toUpperCase()
    if (field === 'contactoPrincipal') value = value.replace(/\b\w/g, (c) => c.toUpperCase())
    setFormData((prev) => ({ ...prev, [field]: value }))
  }

  const handleCopyLink = () => {
    navigator.clipboard.writeText(publicLinkUrl)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  // Document handling
  const handleDocUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (!files) return
    const newDocs = Array.from(files).map((f) => ({ name: f.name, file: f, status: 'pending' as const }))
    setDocs((prev) => [...prev, ...newDocs])
  }

  const handleValidateDocs = async () => {
    if (docs.length === 0) return
    setDocValidating(true)
    setDocValidation(null)
    // Upload all pending docs
    const updated = [...docs]
    for (let i = 0; i < updated.length; i++) {
      if (updated[i].status === 'pending') {
        updated[i].status = 'uploading'
        setDocs([...updated])
        try {
          const path = `altas/${Date.now()}_${updated[i].name}`
          const { error } = await supabase.storage.from('documentos').upload(path, updated[i].file)
          if (error) throw error
          const { data: urlData } = supabase.storage.from('documentos').getPublicUrl(path)
          updated[i].status = 'ok'
          updated[i].url = urlData.publicUrl
        } catch {
          updated[i].status = 'error'
        }
        setDocs([...updated])
      }
    }
    // Validate via edge function
    try {
      const { data: sessionData } = await supabase.auth.getSession()
      const token = sessionData.session?.access_token
      if (token) {
        const res = await fetch(
          `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/validar-documentos-alta`,
          {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
            body: JSON.stringify({ documentos: updated.filter(d => d.status === 'ok').map(d => d.name) }),
          }
        )
        if (res.ok) {
          const json = await res.json()
          setDocValidation(json)
        }
      }
    } catch { /* silently fail validation */ }
    setDocValidating(false)
  }

  // Contract analysis
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      const validTypes = ['application/pdf', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'text/plain']
      if (!validTypes.includes(file.type)) { setAnalisisError('Solo se aceptan archivos PDF, DOCX o TXT'); return }
      if (file.size > 10 * 1024 * 1024) { setAnalisisError('El archivo no debe superar 10 MB'); return }
      setContratoFile(file)
      setAnalisisError(null)
      setAnalisis(null)
    }
  }

  const handleAnalizarContrato = async () => {
    if (!contratoFile) return
    setAnalizando(true)
    setAnalisisError(null)
    setAnalisis(null)
    try {
      const { data: sessionData } = await supabase.auth.getSession()
      const token = sessionData.session?.access_token
      if (!token) throw new Error('Sesión expirada')
      const text = await contratoFile.text()
      const res = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/analisis-contratos`,
        { method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` }, body: JSON.stringify({ texto_contrato: text, nombre_archivo: contratoFile.name }) }
      )
      if (!res.ok) throw new Error(`Error ${res.status}: ${res.statusText}`)
      const json = await res.json()
      if (!json.ok) throw new Error(json.mensaje || 'Error en el análisis')
      setAnalisis(json.analisis)
    } catch (err) {
      setAnalisisError(err instanceof Error ? err.message : 'Error desconocido')
    } finally { setAnalizando(false) }
  }

  // Final: save client
  const handleGuardarCliente = async () => {
    if (!formData.razonSocial.trim()) { setSaveError('La razón social es obligatoria'); return }
    setSaving(true)
    setSaveError(null)
    try {
      const { error: insertError } = await supabase.from('clientes').insert([{
        razon_social: formData.razonSocial.trim(),
        rfc: formData.rfc.trim() || null,
        tipo: formData.tipo || 'prospecto',
        segmento: formData.segmento || null,
        notas: JSON.stringify({
          ciudad: formData.ciudad, estado: formData.estado_mx, direccion: formData.direccion,
          contacto: formData.contactoPrincipal, telefono: formData.telefono, email: formData.email,
          web: formData.web, giro: formData.giro, notas: formData.notas,
          csr_asignado: selectedCSR || null, cxc_asignado: selectedCXC || null,
          documentos: docs.filter(d => d.status === 'ok').map(d => ({ name: d.name, url: d.url })),
          contrato_analisis: analisis ? { score: analisis.score_riesgo, resumen: analisis.resumen } : null,
          alta_by: auth.user?.id, alta_date: new Date().toISOString(),
        }),
        activo: true,
      }])
      if (insertError) throw insertError
      // Send email notification
      try {
        const { data: sessionData } = await supabase.auth.getSession()
        const token = sessionData.session?.access_token
        if (token) {
          await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/enviar-correo-alta`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
            body: JSON.stringify({ razon_social: formData.razonSocial, rfc: formData.rfc, email: formData.email }),
          })
        }
      } catch { /* email is best-effort */ }
      setSaveSuccess(true)
    } catch (err: any) {
      setSaveError(err.message || 'Error al guardar el cliente')
    } finally { setSaving(false) }
  }

  const toggleSeccion = (key: string) => setSeccionesAbiertas((prev) => ({ ...prev, [key]: !prev[key] }))

  const scoreColor = (score: number) => {
    if (score <= 3) return tokens.colors.green
    if (score <= 5) return tokens.colors.yellow
    if (score <= 7) return tokens.colors.orange2
    return tokens.colors.red
  }
  const scoreBadgeColor = (score: number): 'green' | 'yellow' | 'orange' | 'red' => {
    if (score <= 3) return 'green'; if (score <= 5) return 'yellow'; if (score <= 7) return 'orange'; return 'red'
  }
  const severidadColor = (sev: string): 'green' | 'yellow' | 'orange' | 'red' => {
    const s = sev.toLowerCase()
    if (s === 'baja' || s === 'bajo') return 'green'; if (s === 'media' || s === 'medio') return 'yellow'
    if (s === 'alta' || s === 'alto') return 'orange'; return 'red'
  }

  const canAdvance = () => {
    if (paso === 0) return !!formData.razonSocial.trim()
    return true
  }

  return (
    <ModuleLayout titulo="Alta de Cliente" subtitulo="Registro completo con validación multi-área">
      {/* STEPPER */}
      <div className="flex items-center gap-1 mb-6 flex-wrap">
        {ESTADOS_ALTA.map((e, idx) => {
          const Icon = e.icon
          const isActive = idx === paso
          const isDone = idx < paso
          return (
            <div key={e.id} className="flex items-center">
              <button
                onClick={() => idx <= paso && setPaso(idx)}
                className="flex items-center gap-2 px-3 py-2 rounded-lg transition-all"
                style={{
                  background: isActive ? `${e.color}22` : isDone ? `${tokens.colors.green}15` : 'transparent',
                  border: `1px solid ${isActive ? e.color : isDone ? tokens.colors.green : tokens.colors.border}`,
                  cursor: idx <= paso ? 'pointer' : 'default',
                  opacity: idx > paso ? 0.4 : 1,
                }}
              >
                <div className="w-7 h-7 rounded-full flex items-center justify-center" style={{
                  background: isDone ? tokens.colors.green : isActive ? e.color : tokens.colors.bgHover,
                }}>
                  {isDone ? <Check size={14} color="#fff" /> : <Icon size={14} color={isActive ? '#fff' : tokens.colors.textMuted} />}
                </div>
                <span className="text-[11px] font-semibold uppercase tracking-wider hidden lg:inline" style={{
                  color: isActive ? e.color : isDone ? tokens.colors.green : tokens.colors.textMuted,
                  fontFamily: tokens.fonts.heading,
                }}>{e.label}</span>
              </button>
              {idx < ESTADOS_ALTA.length - 1 && (
                <div className="w-4 h-0.5 mx-0.5" style={{ background: isDone ? tokens.colors.green : tokens.colors.border }} />
              )}
            </div>
          )
        })}
      </div>

      <div className="grid grid-cols-3 gap-4" style={{ minHeight: 0 }}>
        {/* MAIN CONTENT — 2 columns */}
        <div className="col-span-2">
          <Card>
            <div className="mb-4">
              <p className="text-[10px] uppercase tracking-widest font-bold" style={{ color: ESTADOS_ALTA[paso].color, fontFamily: tokens.fonts.heading }}>
                Paso {paso + 1} de {ESTADOS_ALTA.length} — {ESTADOS_ALTA[paso].label}
              </p>
            </div>

            {/* ─── PASO 1: DATOS COMERCIALES ─── */}
            {paso === 0 && (
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-3">
                  <Input label="Razón Social *" placeholder="NOMBRE LEGAL DE LA EMPRESA" value={formData.razonSocial}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => handleInputChange('razonSocial', e.target.value)} required />
                  <Input label="RFC" placeholder="RFC de la empresa" value={formData.rfc}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => handleInputChange('rfc', e.target.value)} />
                </div>
                <div className="grid grid-cols-3 gap-3">
                  <Select label="Tipo" options={tipoOptions} value={formData.tipo}
                    onChange={(e: React.ChangeEvent<HTMLSelectElement>) => handleInputChange('tipo', e.target.value)} />
                  <Select label="Segmento" options={segmentoOptions} value={formData.segmento}
                    onChange={(e: React.ChangeEvent<HTMLSelectElement>) => handleInputChange('segmento', e.target.value)} />
                  <Input label="Giro" placeholder="Manufactura, Retail..." value={formData.giro}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => handleInputChange('giro', e.target.value)} />
                </div>
                <div className="grid grid-cols-3 gap-3">
                  <Input label="Ciudad" placeholder="Ciudad" value={formData.ciudad}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => handleInputChange('ciudad', e.target.value)} />
                  <Select label="Estado" options={estadosMX} value={formData.estado_mx}
                    onChange={(e: React.ChangeEvent<HTMLSelectElement>) => handleInputChange('estado_mx', e.target.value)} />
                  <Input label="Web" placeholder="www.empresa.com" value={formData.web}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => handleInputChange('web', e.target.value)} />
                </div>
                <Input label="Dirección" placeholder="Dirección completa" value={formData.direccion}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => handleInputChange('direccion', e.target.value)} />
                <div className="grid grid-cols-3 gap-3">
                  <Input label="Contacto Principal" placeholder="Nombre Completo" value={formData.contactoPrincipal}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => handleInputChange('contactoPrincipal', e.target.value)} />
                  <Input label="Teléfono" placeholder="+52 1234567890" value={formData.telefono}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => handleInputChange('telefono', e.target.value)} />
                  <Input label="Email" type="email" placeholder="contacto@empresa.com" value={formData.email}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => handleInputChange('email', e.target.value)} />
                </div>
                <div>
                  <label className="text-[10px] uppercase tracking-wider font-semibold mb-1 block" style={{ color: tokens.colors.textMuted, fontFamily: tokens.fonts.body }}>Notas</label>
                  <textarea rows={2} placeholder="Observaciones adicionales..." value={formData.notas}
                    onChange={(e) => handleInputChange('notas', e.target.value)}
                    className="w-full px-3 py-2 rounded-lg text-sm outline-none resize-none"
                    style={{ background: tokens.colors.bgHover, border: `1px solid ${tokens.colors.border}`, color: tokens.colors.textPrimary, fontFamily: tokens.fonts.body }} />
                </div>
              </div>
            )}

            {/* ─── PASO 2: DOCUMENTOS ─── */}
            {paso === 1 && (
              <div className="space-y-4">
                <p className="text-xs" style={{ color: tokens.colors.textSecondary }}>
                  Sube los documentos requeridos: Constancia Fiscal, Comprobante de Domicilio, INE del representante legal, Carta de encomienda.
                </p>
                <div className="p-4 rounded-lg text-center border-2 border-dashed" style={{
                  borderColor: docs.length > 0 ? tokens.colors.primary : tokens.colors.border,
                  background: docs.length > 0 ? `${tokens.colors.primary}0a` : tokens.colors.bgHover,
                }}>
                  <label className="cursor-pointer block">
                    <Upload size={28} style={{ color: tokens.colors.textMuted, margin: '0 auto 8px' }} />
                    <p className="text-sm" style={{ color: tokens.colors.textSecondary }}>Arrastra archivos o haz clic para seleccionar</p>
                    <p className="text-xs mt-1" style={{ color: tokens.colors.textMuted }}>PDF, JPG, PNG — máximo 10 MB c/u</p>
                    <input type="file" accept=".pdf,.jpg,.jpeg,.png" multiple onChange={handleDocUpload} className="hidden" />
                  </label>
                </div>
                {docs.length > 0 && (
                  <div className="space-y-2">
                    {docs.map((d, i) => (
                      <div key={i} className="flex items-center gap-3 p-2.5 rounded-lg" style={{ background: tokens.colors.bgHover }}>
                        <FileText size={16} style={{ color: d.status === 'ok' ? tokens.colors.green : d.status === 'error' ? tokens.colors.red : tokens.colors.textMuted }} />
                        <p className="text-xs flex-1 truncate" style={{ color: tokens.colors.textPrimary }}>{d.name}</p>
                        <Badge color={d.status === 'ok' ? 'green' : d.status === 'error' ? 'red' : d.status === 'uploading' ? 'yellow' : 'gray'}>
                          {d.status === 'ok' ? 'Subido' : d.status === 'error' ? 'Error' : d.status === 'uploading' ? 'Subiendo...' : 'Pendiente'}
                        </Badge>
                        <button onClick={() => setDocs(prev => prev.filter((_, j) => j !== i))} className="text-xs px-2 py-0.5 rounded" style={{ color: tokens.colors.red }}>x</button>
                      </div>
                    ))}
                  </div>
                )}
                {docs.length > 0 && (
                  <Button variant="primary" onClick={handleValidateDocs} disabled={docValidating}>
                    <Zap size={14} /> {docValidating ? 'Validando con IA...' : 'Subir y Validar Documentos'}
                  </Button>
                )}
                {docValidation && (
                  <div className="p-3 rounded-lg" style={{ background: docValidation.valido ? tokens.colors.greenBg : tokens.colors.redBg }}>
                    <p className="text-sm font-semibold" style={{ color: docValidation.valido ? tokens.colors.green : tokens.colors.red }}>
                      {docValidation.valido ? 'Documentos validados correctamente' : 'Faltan documentos o hay errores'}
                    </p>
                    {docValidation.errores?.map((err, i) => (
                      <p key={i} className="text-xs mt-1" style={{ color: tokens.colors.textSecondary }}>{err}</p>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* ─── PASO 3: ASIGNACIÓN CSR ─── */}
            {paso === 2 && (
              <div className="space-y-4">
                <p className="text-xs" style={{ color: tokens.colors.textSecondary }}>
                  Selecciona el ejecutivo de Customer Success que atenderá a este cliente.
                </p>
                {ejecutivosCS.length === 0 ? (
                  <div className="p-6 text-center rounded-lg" style={{ background: tokens.colors.bgHover }}>
                    <p className="text-sm" style={{ color: tokens.colors.textMuted }}>No hay ejecutivos CS registrados. Se puede asignar después.</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-2 gap-3">
                    {ejecutivosCS.map((ej) => (
                      <button key={ej.id} onClick={() => setSelectedCSR(ej.id)}
                        className="p-4 rounded-lg text-left transition-all"
                        style={{
                          background: selectedCSR === ej.id ? `${tokens.colors.blue}22` : tokens.colors.bgHover,
                          border: `1px solid ${selectedCSR === ej.id ? tokens.colors.blue : tokens.colors.border}`,
                        }}>
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full flex items-center justify-center" style={{ background: tokens.colors.primary + '33' }}>
                            <User size={18} style={{ color: tokens.colors.primary }} />
                          </div>
                          <div>
                            <p className="text-sm font-semibold" style={{ color: tokens.colors.textPrimary }}>{ej.nombre}</p>
                            <p className="text-[10px]" style={{ color: tokens.colors.textMuted }}>{ej.email}</p>
                          </div>
                          {selectedCSR === ej.id && <Check size={18} style={{ color: tokens.colors.blue, marginLeft: 'auto' }} />}
                        </div>
                      </button>
                    ))}
                  </div>
                )}
                {selectedCSR && (
                  <div className="p-3 rounded-lg flex items-center gap-2" style={{ background: tokens.colors.blueBg }}>
                    <Check size={14} style={{ color: tokens.colors.blue }} />
                    <p className="text-xs" style={{ color: tokens.colors.blue }}>CSR asignado: {ejecutivosCS.find(e => e.id === selectedCSR)?.nombre}</p>
                  </div>
                )}
              </div>
            )}

            {/* ─── PASO 4: ASIGNACIÓN CXC ─── */}
            {paso === 3 && (
              <div className="space-y-4">
                <p className="text-xs" style={{ color: tokens.colors.textSecondary }}>
                  Selecciona el ejecutivo de Cobranza (CxC) para este cliente.
                </p>
                {ejecutivosCXC.length === 0 ? (
                  <div className="p-6 text-center rounded-lg" style={{ background: tokens.colors.bgHover }}>
                    <p className="text-sm" style={{ color: tokens.colors.textMuted }}>No hay ejecutivos CxC registrados. Se puede asignar después.</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-2 gap-3">
                    {ejecutivosCXC.map((ej) => (
                      <button key={ej.id} onClick={() => setSelectedCXC(ej.id)}
                        className="p-4 rounded-lg text-left transition-all"
                        style={{
                          background: selectedCXC === ej.id ? `${tokens.colors.green}22` : tokens.colors.bgHover,
                          border: `1px solid ${selectedCXC === ej.id ? tokens.colors.green : tokens.colors.border}`,
                        }}>
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full flex items-center justify-center" style={{ background: tokens.colors.green + '33' }}>
                            <CreditCard size={18} style={{ color: tokens.colors.green }} />
                          </div>
                          <div>
                            <p className="text-sm font-semibold" style={{ color: tokens.colors.textPrimary }}>{ej.nombre}</p>
                            <p className="text-[10px]" style={{ color: tokens.colors.textMuted }}>{ej.email}</p>
                          </div>
                          {selectedCXC === ej.id && <Check size={18} style={{ color: tokens.colors.green, marginLeft: 'auto' }} />}
                        </div>
                      </button>
                    ))}
                  </div>
                )}
                {selectedCXC && (
                  <div className="p-3 rounded-lg flex items-center gap-2" style={{ background: tokens.colors.greenBg }}>
                    <Check size={14} style={{ color: tokens.colors.green }} />
                    <p className="text-xs" style={{ color: tokens.colors.green }}>CxC asignado: {ejecutivosCXC.find(e => e.id === selectedCXC)?.nombre}</p>
                  </div>
                )}
              </div>
            )}

            {/* ─── PASO 5: CONTRATO IA ─── */}
            {paso === 4 && (
              <div className="space-y-4">
                <div className="p-4 rounded-lg text-center border-2 border-dashed transition-colors" style={{
                  borderColor: contratoFile ? tokens.colors.primary : tokens.colors.border,
                  background: contratoFile ? `${tokens.colors.primary}0a` : tokens.colors.bgHover,
                }}>
                  {contratoFile ? (
                    <div className="flex items-center justify-center gap-3">
                      <FileText size={24} style={{ color: tokens.colors.primary }} />
                      <div className="text-left">
                        <p className="text-sm font-medium" style={{ color: tokens.colors.textPrimary }}>{contratoFile.name}</p>
                        <p className="text-xs" style={{ color: tokens.colors.textMuted }}>{(contratoFile.size / 1024).toFixed(0)} KB</p>
                      </div>
                      <Button variant="ghost" size="sm" onClick={() => { setContratoFile(null); setAnalisis(null); setAnalisisError(null) }}>Cambiar</Button>
                    </div>
                  ) : (
                    <label className="cursor-pointer block">
                      <Upload size={28} style={{ color: tokens.colors.textMuted, margin: '0 auto 8px' }} />
                      <p className="text-sm" style={{ color: tokens.colors.textSecondary }}>Arrastra tu contrato o haz clic</p>
                      <p className="text-xs mt-1" style={{ color: tokens.colors.textMuted }}>PDF, DOCX o TXT — máximo 10 MB</p>
                      <input type="file" accept=".pdf,.docx,.txt" onChange={handleFileChange} className="hidden" />
                    </label>
                  )}
                </div>

                {contratoFile && !analisis && (
                  <Button variant="primary" className="w-full" onClick={handleAnalizarContrato} loading={analizando} disabled={analizando}>
                    <Shield size={18} /> {analizando ? 'Analizando con IA...' : 'Analizar Contrato con IA'}
                  </Button>
                )}

                {analisisError && (
                  <div className="p-3 rounded-lg flex items-center gap-2" style={{ background: tokens.colors.redBg }}>
                    <AlertTriangle size={16} style={{ color: tokens.colors.red }} />
                    <p className="text-sm" style={{ color: tokens.colors.red }}>{analisisError}</p>
                  </div>
                )}

                {analizando && (
                  <div className="flex items-center justify-center gap-3 py-8">
                    <Loader className="animate-spin" size={24} style={{ color: tokens.colors.primary }} />
                    <p className="text-sm" style={{ color: tokens.colors.textSecondary }}>Claude analizando contrato... 15-30 seg</p>
                  </div>
                )}

                {analisis && (
                  <div className="space-y-3">
                    {/* Risk Score */}
                    <div className="flex items-center justify-between p-4 rounded-lg" style={{ background: tokens.colors.bgHover }}>
                      <div>
                        <p className="text-[10px] uppercase" style={{ color: tokens.colors.textMuted }}>Score de Riesgo</p>
                        <p className="text-2xl font-bold" style={{ color: scoreColor(analisis.score_riesgo), fontFamily: tokens.fonts.heading }}>
                          {analisis.score_riesgo}/10
                        </p>
                        <Badge color={scoreBadgeColor(analisis.score_riesgo)}>
                          {analisis.score_riesgo <= 3 ? 'Bajo Riesgo' : analisis.score_riesgo <= 5 ? 'Riesgo Moderado' : analisis.score_riesgo <= 7 ? 'Riesgo Alto' : 'Riesgo Crítico'}
                        </Badge>
                      </div>
                      <div className="w-16 h-16 rounded-full flex items-center justify-center"
                        style={{ background: `conic-gradient(${scoreColor(analisis.score_riesgo)} ${analisis.score_riesgo * 10}%, ${tokens.colors.bgHover} 0%)` }}>
                        <div className="w-11 h-11 rounded-full flex items-center justify-center" style={{ background: tokens.colors.bgCard }}>
                          <Shield size={20} style={{ color: scoreColor(analisis.score_riesgo) }} />
                        </div>
                      </div>
                    </div>
                    <p className="text-sm" style={{ color: tokens.colors.textPrimary }}>{analisis.resumen}</p>

                    {analisis.alertas?.length > 0 && (
                      <div className="p-3 rounded-lg" style={{ background: tokens.colors.redBg }}>
                        <p className="text-[10px] uppercase font-bold mb-1" style={{ color: tokens.colors.red }}>Alertas ({analisis.alertas.length})</p>
                        {analisis.alertas.map((a, i) => (
                          <p key={i} className="text-xs pl-3" style={{ color: tokens.colors.textSecondary, borderLeft: `2px solid ${tokens.colors.red}` }}>{a}</p>
                        ))}
                      </div>
                    )}

                    {analisis.clausulas_riesgo?.length > 0 && (
                      <div>
                        <button className="w-full flex items-center justify-between py-1" onClick={() => toggleSeccion('clausulas')}>
                          <p className="text-[10px] uppercase font-bold" style={{ color: tokens.colors.orange }}>Cláusulas de Riesgo ({analisis.clausulas_riesgo.length})</p>
                          {seccionesAbiertas.clausulas ? <ChevronUp size={14} style={{ color: tokens.colors.textMuted }} /> : <ChevronDown size={14} style={{ color: tokens.colors.textMuted }} />}
                        </button>
                        {seccionesAbiertas.clausulas && analisis.clausulas_riesgo.map((cl, i) => (
                          <div key={i} className="p-2 rounded mb-1" style={{ background: tokens.colors.bgHover }}>
                            <Badge color={severidadColor(cl.severidad)}>{cl.severidad}</Badge>
                            <p className="text-xs mt-1" style={{ color: tokens.colors.textPrimary }}>{cl.clausula}</p>
                            <p className="text-[10px]" style={{ color: tokens.colors.textMuted }}>{cl.riesgo}</p>
                          </div>
                        ))}
                      </div>
                    )}

                    {analisis.recomendacion_general && (
                      <div className="p-3 rounded-lg" style={{ background: `${tokens.colors.primary}15`, border: `1px solid ${tokens.colors.primary}33` }}>
                        <p className="text-[10px] uppercase font-bold" style={{ color: tokens.colors.primary }}>Recomendación</p>
                        <p className="text-xs mt-1" style={{ color: tokens.colors.textSecondary }}>{analisis.recomendacion_general}</p>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}

            {/* ─── PASO 6: CONFIRMACIÓN ─── */}
            {paso === 5 && (
              <div className="space-y-4">
                <p className="text-xs mb-3" style={{ color: tokens.colors.textSecondary }}>
                  Revisa el resumen antes de registrar al cliente en el sistema.
                </p>

                {/* Summary grid */}
                <div className="grid grid-cols-2 gap-3">
                  <div className="p-3 rounded-lg" style={{ background: tokens.colors.bgHover }}>
                    <p className="text-[10px] uppercase" style={{ color: tokens.colors.textMuted }}>Razón Social</p>
                    <p className="text-sm font-bold" style={{ color: tokens.colors.textPrimary }}>{formData.razonSocial || '—'}</p>
                  </div>
                  <div className="p-3 rounded-lg" style={{ background: tokens.colors.bgHover }}>
                    <p className="text-[10px] uppercase" style={{ color: tokens.colors.textMuted }}>RFC</p>
                    <p className="text-sm font-bold" style={{ color: tokens.colors.textPrimary }}>{formData.rfc || '—'}</p>
                  </div>
                  <div className="p-3 rounded-lg" style={{ background: tokens.colors.bgHover }}>
                    <p className="text-[10px] uppercase" style={{ color: tokens.colors.textMuted }}>Tipo / Segmento</p>
                    <p className="text-sm" style={{ color: tokens.colors.textPrimary }}>{formData.tipo || '—'} / {formData.segmento || '—'}</p>
                  </div>
                  <div className="p-3 rounded-lg" style={{ background: tokens.colors.bgHover }}>
                    <p className="text-[10px] uppercase" style={{ color: tokens.colors.textMuted }}>Ciudad</p>
                    <p className="text-sm" style={{ color: tokens.colors.textPrimary }}>{formData.ciudad || '—'}, {formData.estado_mx || '—'}</p>
                  </div>
                  <div className="p-3 rounded-lg" style={{ background: tokens.colors.bgHover }}>
                    <p className="text-[10px] uppercase" style={{ color: tokens.colors.textMuted }}>Contacto</p>
                    <p className="text-sm" style={{ color: tokens.colors.textPrimary }}>{formData.contactoPrincipal || '—'}</p>
                    <p className="text-[10px]" style={{ color: tokens.colors.textMuted }}>{formData.email} | {formData.telefono}</p>
                  </div>
                  <div className="p-3 rounded-lg" style={{ background: tokens.colors.bgHover }}>
                    <p className="text-[10px] uppercase" style={{ color: tokens.colors.textMuted }}>Documentos</p>
                    <p className="text-sm" style={{ color: docs.filter(d => d.status === 'ok').length > 0 ? tokens.colors.green : tokens.colors.textMuted }}>
                      {docs.filter(d => d.status === 'ok').length} subidos
                    </p>
                  </div>
                  <div className="p-3 rounded-lg" style={{ background: tokens.colors.bgHover }}>
                    <p className="text-[10px] uppercase" style={{ color: tokens.colors.textMuted }}>CSR Asignado</p>
                    <p className="text-sm" style={{ color: selectedCSR ? tokens.colors.blue : tokens.colors.textMuted }}>
                      {selectedCSR ? ejecutivosCS.find(e => e.id === selectedCSR)?.nombre : 'Sin asignar'}
                    </p>
                  </div>
                  <div className="p-3 rounded-lg" style={{ background: tokens.colors.bgHover }}>
                    <p className="text-[10px] uppercase" style={{ color: tokens.colors.textMuted }}>CxC Asignado</p>
                    <p className="text-sm" style={{ color: selectedCXC ? tokens.colors.green : tokens.colors.textMuted }}>
                      {selectedCXC ? ejecutivosCXC.find(e => e.id === selectedCXC)?.nombre : 'Sin asignar'}
                    </p>
                  </div>
                </div>

                {analisis && (
                  <div className="p-3 rounded-lg flex items-center gap-3" style={{ background: tokens.colors.bgHover }}>
                    <Shield size={20} style={{ color: scoreColor(analisis.score_riesgo) }} />
                    <div>
                      <p className="text-[10px] uppercase" style={{ color: tokens.colors.textMuted }}>Contrato — Score de Riesgo</p>
                      <p className="text-sm font-bold" style={{ color: scoreColor(analisis.score_riesgo) }}>{analisis.score_riesgo}/10</p>
                    </div>
                  </div>
                )}

                {/* Public link */}
                <div className="p-3 rounded-lg" style={{ background: `${tokens.colors.blue}1a`, border: `1px solid ${tokens.colors.blue}33` }}>
                  <p className="text-[10px] uppercase tracking-wider mb-2" style={{ color: tokens.colors.textMuted }}>Link Público</p>
                  <div className="flex items-center gap-2">
                    <input type="text" value={publicLinkUrl} readOnly className="flex-1 px-3 py-1.5 rounded text-xs"
                      style={{ background: tokens.colors.bgHover, border: `1px solid ${tokens.colors.border}`, color: tokens.colors.textSecondary }} />
                    <Button size="sm" variant="secondary" onClick={handleCopyLink}>
                      {copied ? <><Check className="w-3 h-3" /> Copiado</> : <><Copy className="w-3 h-3" /> Copiar</>}
                    </Button>
                  </div>
                </div>

                {/* Save button */}
                <Button variant="primary" className="w-full" onClick={handleGuardarCliente} disabled={saving || saveSuccess}>
                  {saving ? <><Loader className="animate-spin" size={16} /> Guardando...</> : saveSuccess ? <><Check size={16} /> Cliente Registrado</> : 'Registrar Cliente en Sistema'}
                </Button>

                {saveError && (
                  <div className="p-3 rounded-lg flex items-center gap-2" style={{ background: tokens.colors.redBg }}>
                    <AlertTriangle size={14} style={{ color: tokens.colors.red }} />
                    <p className="text-sm" style={{ color: tokens.colors.red }}>{saveError}</p>
                  </div>
                )}
                {saveSuccess && (
                  <div className="p-3 rounded-lg flex items-center gap-2" style={{ background: tokens.colors.greenBg }}>
                    <Check size={14} style={{ color: tokens.colors.green }} />
                    <p className="text-sm" style={{ color: tokens.colors.green }}>Cliente registrado exitosamente. Se notificó por correo al equipo.</p>
                  </div>
                )}
              </div>
            )}
          </Card>

          {/* Navigation buttons */}
          <div className="flex gap-3 mt-4 justify-between">
            <Button variant="secondary" onClick={() => setPaso(Math.max(0, paso - 1))} disabled={paso === 0}>
              <ArrowLeft size={14} /> Anterior
            </Button>
            <Button variant="primary" onClick={() => setPaso(Math.min(ESTADOS_ALTA.length - 1, paso + 1))} disabled={paso === ESTADOS_ALTA.length - 1 || !canAdvance()}>
              Siguiente <ArrowRight size={14} />
            </Button>
          </div>
        </div>

        {/* SIDEBAR — right column */}
        <div className="space-y-4">
          {/* Progress card */}
          <Card>
            <p className="text-[10px] uppercase tracking-widest font-bold mb-3" style={{ color: tokens.colors.orange, fontFamily: tokens.fonts.heading }}>Progreso</p>
            <div className="space-y-2">
              {ESTADOS_ALTA.map((e, idx) => {
                const isDone = idx < paso
                const isCurrent = idx === paso
                return (
                  <div key={e.id} className="flex items-center gap-2">
                    <div className="w-5 h-5 rounded-full flex items-center justify-center" style={{
                      background: isDone ? tokens.colors.green : isCurrent ? e.color : tokens.colors.bgHover,
                      border: `1px solid ${isDone ? tokens.colors.green : isCurrent ? e.color : tokens.colors.border}`,
                    }}>
                      {isDone ? <Check size={10} color="#fff" /> : <span className="text-[8px] font-bold" style={{ color: isCurrent ? '#fff' : tokens.colors.textMuted }}>{idx + 1}</span>}
                    </div>
                    <p className="text-[11px]" style={{ color: isDone ? tokens.colors.green : isCurrent ? tokens.colors.textPrimary : tokens.colors.textMuted }}>{e.label}</p>
                  </div>
                )
              })}
            </div>
            <div className="mt-3 h-1.5 rounded-full" style={{ background: tokens.colors.bgHover }}>
              <div className="h-full rounded-full transition-all" style={{ width: `${((paso) / (ESTADOS_ALTA.length - 1)) * 100}%`, background: tokens.colors.green }} />
            </div>
          </Card>

          {/* Quick info */}
          {formData.razonSocial && (
            <Card>
              <p className="text-[10px] uppercase tracking-widest font-bold mb-2" style={{ color: tokens.colors.primary, fontFamily: tokens.fonts.heading }}>Cliente</p>
              <p className="text-sm font-bold truncate" style={{ color: tokens.colors.textPrimary }}>{formData.razonSocial}</p>
              {formData.rfc && <p className="text-xs" style={{ color: tokens.colors.textMuted }}>{formData.rfc}</p>}
              {formData.contactoPrincipal && <p className="text-xs mt-1" style={{ color: tokens.colors.textSecondary }}>{formData.contactoPrincipal}</p>}
              {formData.email && <p className="text-[10px]" style={{ color: tokens.colors.textMuted }}>{formData.email}</p>}
            </Card>
          )}

          {/* Tips */}
          <Card>
            <p className="text-[10px] uppercase tracking-widest font-bold mb-2" style={{ color: tokens.colors.textMuted }}>Tips</p>
            <p className="text-xs leading-relaxed" style={{ color: tokens.colors.textSecondary }}>
              {paso === 0 && 'La razón social se convierte a MAYÚSCULAS automáticamente. El RFC se valida contra el SAT.'}
              {paso === 1 && 'Sube constancia fiscal, comprobante de domicilio e INE. La IA validará que estén completos.'}
              {paso === 2 && 'El CSR será el responsable de la cuenta desde el primer servicio.'}
              {paso === 3 && 'El ejecutivo CxC gestionará la facturación y cobranza del cliente.'}
              {paso === 4 && 'Claude analiza el contrato buscando cláusulas de riesgo, penalizaciones y tarifas.'}
              {paso === 5 && 'Revisa toda la información antes de confirmar. Se enviará notificación al equipo.'}
            </p>
          </Card>
        </div>
      </div>
    </ModuleLayout>
  )
}
