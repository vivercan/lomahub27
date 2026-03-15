import { useState } from 'react'
import { Copy, Check, Upload, FileText, AlertTriangle, Shield, ChevronDown, ChevronUp } from 'lucide-react'
import { ModuleLayout } from '../../components/layout/ModuleLayout'
import { Card } from '../../components/ui/Card'
import { Button } from '../../components/ui/Button'
import { Input } from '../../components/ui/Input'
import { Select } from '../../components/ui/Select'
import { Badge } from '../../components/ui/Badge'
import { tokens } from '../../lib/tokens'
import { supabase } from '../../lib/supabase'

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

export default function AltaCliente() {
  const [paso, setPaso] = useState(1)
  const [copied, setCopied] = useState(false)
  const [formData, setFormData] = useState({
    razonSocial: '',
    rfc: '',
    tipo: '',
    segmento: '',
    ciudad: '',
    contactoPrincipal: '',
    telefono: '',
    email: '',
  })

  // Contract analysis state
  const [contratoFile, setContratoFile] = useState<File | null>(null)
  const [analizando, setAnalizando] = useState(false)
  const [analisis, setAnalisis] = useState<AnalisisContrato | null>(null)
  const [analisisError, setAnalisisError] = useState<string | null>(null)
  const [seccionesAbiertas, setSeccionesAbiertas] = useState<Record<string, boolean>>({
    clausulas: true,
    penalizaciones: false,
    tarifas: false,
    obligaciones: false,
  })

  const pasos = [
    { numero: 1, nombre: 'Comercial' },
    { numero: 2, nombre: 'CS' },
    { numero: 3, nombre: 'CXC' },
    { numero: 4, nombre: 'Cobranza' },
    { numero: 5, nombre: 'Pricing' },
    { numero: 6, nombre: 'Contrato IA' },
  ]

  const tipoOptions = [
    { value: '', label: 'Seleccionar tipo...' },
    { value: 'pf', label: 'Persona FÃ­sica' },
    { value: 'pm', label: 'Persona Moral' },
  ]

  const segmentoOptions = [
    { value: '', label: 'Seleccionar segmento...' },
    { value: 'grande', label: 'Empresa Grande' },
    { value: 'mediana', label: 'Empresa Mediana' },
    { value: 'pequeÃ±a', label: 'Empresa PequeÃ±a' },
  ]

  const publicLinkUrl = 'https://lomahub.app/public/cliente/QTZx9mK2L'

  const handleInputChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
  }

  const handleCopyLink = () => {
    navigator.clipboard.writeText(publicLinkUrl)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const handleSiguiente = () => {
    if (paso < 6) {
      setPaso(paso + 1)
    }
  }

  const handleAnterior = () => {
    if (paso > 1) {
      setPaso(paso - 1)
    }
  }

  const toggleSeccion = (key: string) => {
    setSeccionesAbiertas((prev) => ({ ...prev, [key]: !prev[key] }))
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      const validTypes = [
        'application/pdf',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        'text/plain',
      ]
      if (!validTypes.includes(file.type)) {
        setAnalisisError('Solo se aceptan archivos PDF, DOCX o TXT')
        return
      }
      if (file.size > 10 * 1024 * 1024) {
        setAnalisisError('El archivo no debe superar 10 MB')
        return
      }
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
      if (!token) throw new Error('SesiÃ³n expirada')

      // Read file as text
      const text = await contratoFile.text()

      const res = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/analisis-contratos`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            texto_contrato: text,
            nombre_archivo: contratoFile.name,
          }),
        }
      )

      if (!res.ok) throw new Error(`Error ${res.status}: ${res.statusText}`)

      const json = await res.json()
      if (!json.ok) throw new Error(json.mensaje || 'Error en el anÃ¡lisis')

      setAnalisis(json.analisis)
    } catch (err) {
      setAnalisisError(err instanceof Error ? err.message : 'Error desconocido')
    } finally {
      setAnalizando(false)
    }
  }

  const scoreColor = (score: number) => {
    if (score <= 3) return tokens.colors.green
    if (score <= 5) return tokens.colors.yellow
    if (score <= 7) return tokens.colors.orange2
    return tokens.colors.red
  }

  const scoreBadgeColor = (score: number): 'green' | 'yellow' | 'orange' | 'red' => {
    if (score <= 3) return 'green'
    if (score <= 5) return 'yellow'
    if (score <= 7) return 'orange'
    return 'red'
  }

  const severidadColor = (sev: string): 'green' | 'yellow' | 'orange' | 'red' => {
    const s = sev.toLowerCase()
    if (s === 'baja' || s === 'bajo') return 'green'
    if (s === 'media' || s === 'medio') return 'yellow'
    if (s === 'alta' || s === 'alto') return 'orange'
    return 'red'
  }

  return (
    <ModuleLayout titulo="Alta de Cliente" subtitulo="Registro de nuevo cliente en el sistema">
      <div className="space-y-6 max-w-3xl">
        {/* Stepper */}
        <div className="flex gap-4 items-center flex-wrap">
          {pasos.map((p, idx) => (
            <div key={p.numero} className="flex items-center">
              <div
                className="w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold border transition-all cursor-pointer"
                style={{
                  background: paso >= p.numero ? tokens.colors.primary : tokens.colors.bgHover,
                  borderColor: paso >= p.numero ? tokens.colors.primary : tokens.colors.border,
                  color: paso >= p.numero ? '#fff' : tokens.colors.textSecondary,
                }}
                onClick={() => setPaso(p.numero)}
              >
                {p.numero}
              </div>
              <div className="ml-2">
                <p
                  className="text-xs uppercase tracking-wider"
                  style={{
                    color: paso >= p.numero ? tokens.colors.primary : tokens.colors.textMuted,
                    fontFamily: tokens.fonts.body,
                  }}
                >
                  {p.nombre}
                </p>
              </div>

              {idx < pasos.length - 1 && (
                <div
                  className="w-8 h-0.5 ml-4"
                  style={{
                    background: paso > p.numero ? tokens.colors.primary : tokens.colors.border,
                  }}
                />
              )}
            </div>
          ))}
        </div>

        {/* Formulario Paso 1 */}
        <Card>
          <form className="space-y-4">
            <div>
              <p
                className="text-xs uppercase tracking-wider mb-4"
                style={{
                  color: tokens.colors.textMuted,
                  fontFamily: tokens.fonts.body,
                }}
              >
                Paso {paso}: {pasos.find((p) => p.numero === paso)?.nombre}
              </p>
            </div>

            {paso === 1 && (
              <>
                <Input
                  label="RazÃ³n Social *"
                  placeholder="Nombre legal de la empresa"
                  value={formData.razonSocial}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => handleInputChange('razonSocial', e.target.value)}
                  required
                />
                <Input
                  label="RFC *"
                  placeholder="RFC de la empresa"
                  value={formData.rfc}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => handleInputChange('rfc', e.target.value)}
                  required
                />
                <div className="grid grid-cols-2 gap-4">
                  <Select
                    label="Tipo"
                    options={tipoOptions}
                    value={formData.tipo}
                    onChange={(e: React.ChangeEvent<HTMLSelectElement>) => handleInputChange('tipo', e.target.value)}
                  />
                  <Select
                    label="Segmento"
                    options={segmentoOptions}
                    value={formData.segmento}
                    onChange={(e: React.ChangeEvent<HTMLSelectElement>) => handleInputChange('segmento', e.target.value)}
                  />
                </div>
                <Input
                  label="Ciudad"
                  placeholder="Ciudad principal"
                  value={formData.ciudad}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => handleInputChange('ciudad', e.target.value)}
                />
                <Input
                  label="Contacto Principal"
                  placeholder="Nombre del contacto"
                  value={formData.contactoPrincipal}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => handleInputChange('contactoPrincipal', e.target.value)}
                />
                <Input
                  label="TelÃ©fono"
                  placeholder="+52 1234567890"
                  value={formData.telefono}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => handleInputChange('telefono', e.target.value)}
                />
                <Input
                  label="Email"
                  type="email"
                  placeholder="contacto@empresa.com"
                  value={formData.email}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => handleInputChange('email', e.target.value)}
                />
              </>
            )}

            {paso > 1 && paso <= 5 && (
              <div
                className="p-6 rounded-lg text-center"
                style={{
                  background: tokens.colors.bgHover,
                  border: `1px dashed ${tokens.colors.border}`,
                }}
              >
                <p
                  style={{
                    color: tokens.colors.textSecondary,
                    fontFamily: tokens.fonts.body,
                  }}
                >
                  Contenido del paso {paso} â IntegraciÃ³n con mÃ³dulos especÃ­ficos
                </p>
              </div>
            )}

            {/* âââ PASO 6: AnÃ¡lisis de Contratos con IA âââ */}
            {paso === 6 && (
              <div className="space-y-4">
                {/* Upload area */}
                <div
                  className="p-6 rounded-lg text-center border-2 border-dashed transition-colors"
                  style={{
                    borderColor: contratoFile ? tokens.colors.primary : tokens.colors.border,
                    background: contratoFile ? `${tokens.colors.primary}0a` : tokens.colors.bgHover,
                  }}
                >
                  {contratoFile ? (
                    <div className="flex items-center justify-center gap-3">
                      <FileText size={24} style={{ color: tokens.colors.primary }} />
                      <div className="text-left">
                        <p className="text-sm font-medium" style={{ color: tokens.colors.textPrimary, fontFamily: tokens.fonts.body }}>
                          {contratoFile.name}
                        </p>
                        <p className="text-xs" style={{ color: tokens.colors.textMuted, fontFamily: tokens.fonts.body }}>
                          {(contratoFile.size / 1024).toFixed(0)} KB
                        </p>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => { setContratoFile(null); setAnalisis(null); setAnalisisError(null) }}
                      >
                        Cambiar
                      </Button>
                    </div>
                  ) : (
                    <label className="cursor-pointer block">
                      <Upload size={32} style={{ color: tokens.colors.textMuted, margin: '0 auto 8px' }} />
                      <p className="text-sm mb-1" style={{ color: tokens.colors.textSecondary, fontFamily: tokens.fonts.body }}>
                        Arrastra tu contrato aquÃ­ o haz clic para seleccionar
                      </p>
                      <p className="text-xs" style={{ color: tokens.colors.textMuted, fontFamily: tokens.fonts.body }}>
                        PDF, DOCX o TXT â mÃ¡ximo 10 MB
                      </p>
                      <input
                        type="file"
                        accept=".pdf,.docx,.txt"
                        onChange={handleFileChange}
                        className="hidden"
                      />
                    </label>
                  )}
                </div>

                {/* Analyze button */}
                {contratoFile && !analisis && (
                  <Button
                    variant="primary"
                    className="w-full"
                    onClick={handleAnalizarContrato}
                    loading={analizando}
                    disabled={analizando}
                  >
                    <Shield size={18} />
                    {analizando ? 'Analizando con IA...' : 'Analizar Contrato con IA'}
                  </Button>
                )}

                {/* Error */}
                {analisisError && (
                  <div
                    className="p-3 rounded-lg flex items-center gap-2"
                    style={{ background: tokens.colors.redBg }}
                  >
                    <AlertTriangle size={16} style={{ color: tokens.colors.red }} />
                    <p className="text-sm" style={{ color: tokens.colors.red, fontFamily: tokens.fonts.body }}>
                      {analisisError}
                    </p>
                  </div>
                )}

                {/* Loading state */}
                {analizando && (
                  <Card>
                    <div className="flex items-center justify-center gap-3 py-8">
                      <div className="w-6 h-6 border-2 border-t-transparent rounded-full animate-spin" style={{ borderColor: tokens.colors.primary, borderTopColor: 'transparent' }} />
                      <p className="text-sm" style={{ color: tokens.colors.textSecondary, fontFamily: tokens.fonts.body }}>
                        Claude estÃ¡ analizando el contrato... esto puede tomar 15-30 segundos
                      </p>
                    </div>
                  </Card>
                )}

                {/* Results */}
                {analisis && (
                  <div className="space-y-4">
                    {/* Score de riesgo */}
                    <Card>
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-xs uppercase tracking-wider" style={{ color: tokens.colors.textMuted, fontFamily: tokens.fonts.body }}>
                            Score de Riesgo
                          </p>
                          <p className="text-3xl font-bold mt-1" style={{ color: scoreColor(analisis.score_riesgo), fontFamily: tokens.fonts.heading }}>
                            {analisis.score_riesgo}/10
                          </p>
                          <Badge color={scoreBadgeColor(analisis.score_riesgo)}>
                            {analisis.score_riesgo <= 3 ? 'Bajo Riesgo' : analisis.score_riesgo <= 5 ? 'Riesgo Moderado' : analisis.score_riesgo <= 7 ? 'Riesgo Alto' : 'Riesgo CrÃ­tico'}
                          </Badge>
                        </div>
                        <div
                          className="w-20 h-20 rounded-full flex items-center justify-center"
                          style={{
                            background: `conic-gradient(${scoreColor(analisis.score_riesgo)} ${analisis.score_riesgo * 10}%, ${tokens.colors.bgHover} 0%)`,
                          }}
                        >
                          <div
                            className="w-14 h-14 rounded-full flex items-center justify-center"
                            style={{ background: tokens.colors.bgCard }}
                          >
                            <Shield size={24} style={{ color: scoreColor(analisis.score_riesgo) }} />
                          </div>
                        </div>
                      </div>
                    </Card>

                    {/* Resumen */}
                    <Card>
                      <p className="text-xs uppercase tracking-wider mb-2" style={{ color: tokens.colors.textMuted, fontFamily: tokens.fonts.body }}>
                        Resumen
                      </p>
                      <p className="text-sm leading-relaxed" style={{ color: tokens.colors.textPrimary, fontFamily: tokens.fonts.body }}>
                        {analisis.resumen}
                      </p>
                    </Card>

                    {/* Vigencia */}
                    {analisis.vigencia && (
                      <Card>
                        <p className="text-xs uppercase tracking-wider mb-2" style={{ color: tokens.colors.textMuted, fontFamily: tokens.fonts.body }}>
                          Vigencia
                        </p>
                        <div className="flex gap-6">
                          <div>
                            <p className="text-xs" style={{ color: tokens.colors.textMuted }}>Inicio</p>
                            <p className="text-sm font-medium" style={{ color: tokens.colors.textPrimary, fontFamily: tokens.fonts.body }}>{analisis.vigencia.inicio || 'â'}</p>
                          </div>
                          <div>
                            <p className="text-xs" style={{ color: tokens.colors.textMuted }}>Fin</p>
                            <p className="text-sm font-medium" style={{ color: tokens.colors.textPrimary, fontFamily: tokens.fonts.body }}>{analisis.vigencia.fin || 'â'}</p>
                          </div>
                          <div>
                            <p className="text-xs" style={{ color: tokens.colors.textMuted }}>RenovaciÃ³n</p>
                            <Badge color={analisis.vigencia.renovacion_automatica ? 'green' : 'gray'}>
                              {analisis.vigencia.renovacion_automatica ? 'AutomÃ¡tica' : 'Manual'}
                            </Badge>
                          </div>
                        </div>
                      </Card>
                    )}

                    {/* Alertas */}
                    {analisis.alertas && analisis.alertas.length > 0 && (
                      <Card glow="red">
                        <div className="flex items-center gap-2 mb-3">
                          <AlertTriangle size={16} style={{ color: tokens.colors.red }} />
                          <p className="text-xs uppercase tracking-wider font-bold" style={{ color: tokens.colors.red, fontFamily: tokens.fonts.body }}>
                            Alertas ({analisis.alertas.length})
                          </p>
                        </div>
                        <div className="space-y-2">
                          {analisis.alertas.map((alerta, i) => (
                            <div key={i} className="flex items-start gap-2">
                              <span className="mt-1.5 w-1.5 h-1.5 rounded-full shrink-0" style={{ background: tokens.colors.red }} />
                              <p className="text-sm" style={{ color: tokens.colors.textPrimary, fontFamily: tokens.fonts.body }}>{alerta}</p>
                            </div>
                          ))}
                        </div>
                      </Card>
                    )}

                    {/* ClÃ¡usulas de riesgo (collapsible) */}
                    {analisis.clausulas_riesgo && analisis.clausulas_riesgo.length > 0 && (
                      <Card>
                        <button
                          className="w-full flex items-center justify-between"
                          onClick={() => toggleSeccion('clausulas')}
                        >
                          <p className="text-xs uppercase tracking-wider font-bold" style={{ color: tokens.colors.orange, fontFamily: tokens.fonts.body }}>
                            ClÃ¡usulas de Riesgo ({analisis.clausulas_riesgo.length})
                          </p>
                          {seccionesAbiertas.clausulas ? <ChevronUp size={16} style={{ color: tokens.colors.textMuted }} /> : <ChevronDown size={16} style={{ color: tokens.colors.textMuted }} />}
                        </button>
                        {seccionesAbiertas.clausulas && (
                          <div className="mt-3 space-y-3">
                            {analisis.clausulas_riesgo.map((cl, i) => (
                              <div key={i} className="p-3 rounded-lg" style={{ background: tokens.colors.bgHover }}>
                                <div className="flex items-center gap-2 mb-1">
                                  <Badge color={severidadColor(cl.severidad)}>{cl.severidad}</Badge>
                                </div>
                                <p className="text-sm font-medium" style={{ color: tokens.colors.textPrimary, fontFamily: tokens.fonts.body }}>{cl.clausula}</p>
                                <p className="text-xs mt-1" style={{ color: tokens.colors.textSecondary, fontFamily: tokens.fonts.body }}>{cl.riesgo}</p>
                              </div>
                            ))}
                          </div>
                        )}
                      </Card>
                    )}

                    {/* Penalizaciones (collapsible) */}
                    {analisis.penalizaciones && analisis.penalizaciones.length > 0 && (
                      <Card>
                        <button
                          className="w-full flex items-center justify-between"
                          onClick={() => toggleSeccion('penalizaciones')}
                        >
                          <p className="text-xs uppercase tracking-wider font-bold" style={{ color: tokens.colors.red, fontFamily: tokens.fonts.body }}>
                            Penalizaciones ({analisis.penalizaciones.length})
                          </p>
                          {seccionesAbiertas.penalizaciones ? <ChevronUp size={16} style={{ color: tokens.colors.textMuted }} /> : <ChevronDown size={16} style={{ color: tokens.colors.textMuted }} />}
                        </button>
                        {seccionesAbiertas.penalizaciones && (
                          <div className="mt-3 space-y-2">
                            {analisis.penalizaciones.map((pen, i) => (
                              <div key={i} className="flex items-start gap-2">
                                <span className="mt-1.5 w-1.5 h-1.5 rounded-full shrink-0" style={{ background: tokens.colors.red }} />
                                <p className="text-sm" style={{ color: tokens.colors.textPrimary, fontFamily: tokens.fonts.body }}>{pen}</p>
                              </div>
                            ))}
                          </div>
                        )}
                      </Card>
                    )}

                    {/* Tarifas (collapsible) */}
                    {analisis.tarifas_detectadas && analisis.tarifas_detectadas.length > 0 && (
                      <Card>
                        <button
                          className="w-full flex items-center justify-between"
                          onClick={() => toggleSeccion('tarifas')}
                        >
                          <p className="text-xs uppercase tracking-wider font-bold" style={{ color: tokens.colors.blue, fontFamily: tokens.fonts.body }}>
                            Tarifas Detectadas ({analisis.tarifas_detectadas.length})
                          </p>
                          {seccionesAbiertas.tarifas ? <ChevronUp size={16} style={{ color: tokens.colors.textMuted }} /> : <ChevronDown size={16} style={{ color: tokens.colors.textMuted }} />}
                        </button>
                        {seccionesAbiertas.tarifas && (
                          <div className="mt-3">
                            <div className="space-y-2">
                              {analisis.tarifas_detectadas.map((t, i) => (
                                <div key={i} className="flex items-center justify-between p-2 rounded" style={{ background: tokens.colors.bgHover }}>
                                  <p className="text-sm" style={{ color: tokens.colors.textPrimary, fontFamily: tokens.fonts.body }}>{t.concepto}</p>
                                  <p className="text-sm font-bold" style={{ color: tokens.colors.green, fontFamily: tokens.fonts.body }}>{t.monto}</p>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                      </Card>
                    )}

                    {/* Obligaciones (collapsible) */}
                    {analisis.obligaciones_clave && analisis.obligaciones_clave.length > 0 && (
                      <Card>
                        <button
                          className="w-full flex items-center justify-between"
                          onClick={() => toggleSeccion('obligaciones')}
                        >
                          <p className="text-xs uppercase tracking-wider font-bold" style={{ color: tokens.colors.textSecondary, fontFamily: tokens.fonts.body }}>
                            Obligaciones Clave ({analisis.obligaciones_clave.length})
                          </p>
                          {seccionesAbiertas.obligaciones ? <ChevronUp size={16} style={{ color: tokens.colors.textMuted }} /> : <ChevronDown size={16} style={{ color: tokens.colors.textMuted }} />}
                        </button>
                        {seccionesAbiertas.obligaciones && (
                          <div className="mt-3 space-y-2">
                            {analisis.obligaciones_clave.map((ob, i) => (
                              <div key={i} className="flex items-start gap-2">
                                <span className="mt-1.5 w-1.5 h-1.5 rounded-full shrink-0" style={{ background: tokens.colors.primary }} />
                                <p className="text-sm" style={{ color: tokens.colors.textPrimary, fontFamily: tokens.fonts.body }}>{ob}</p>
                              </div>
                            ))}
                          </div>
                        )}
                      </Card>
                    )}

                    {/* RecomendaciÃ³n general */}
                    <Card glow="primary">
                      <p className="text-xs uppercase tracking-wider mb-2" style={{ color: tokens.colors.primary, fontFamily: tokens.fonts.body }}>
                        RecomendaciÃ³n General
                      </p>
                      <p className="text-sm leading-relaxed" style={{ color: tokens.colors.textPrimary, fontFamily: tokens.fonts.body }}>
                        {analisis.recomendacion_general}
                      </p>
                    </Card>

                    {/* Re-analyze */}
                    <Button
                      variant="secondary"
                      className="w-full"
                      onClick={() => { setAnalisis(null); setContratoFile(null) }}
                    >
                      Analizar Otro Contrato
                    </Button>
                  </div>
                )}
              </div>
            )}

            {/* Public Link Section */}
            {paso === 1 && (
              <div
                className="p-4 rounded-lg border"
                style={{
                  background: `${tokens.colors.blue}1a`,
                  borderColor: `${tokens.colors.blue}33`,
                }}
              >
                <p
                  className="text-xs uppercase tracking-wider mb-2"
                  style={{
                    color: tokens.colors.textMuted,
                    fontFamily: tokens.fonts.body,
                  }}
                >
                  Link PÃºblico
                </p>
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    value={publicLinkUrl}
                    readOnly
                    className="flex-1 px-3 py-2 rounded text-xs"
                    style={{
                      background: tokens.colors.bgHover,
                      border: `1px solid ${tokens.colors.border}`,
                      color: tokens.colors.textSecondary,
                      fontFamily: tokens.fonts.body,
                    }}
                  />
                  <Button
                    size="sm"
                    variant="secondary"
                    onClick={handleCopyLink}
                    className="gap-2"
                  >
                    {copied ? (
                      <>
                        <Check className="w-4 h-4" />
                        Copiado
                      </>
                    ) : (
                      <>
                        <Copy className="w-4 h-4" />
                        Copiar
                      </>
                    )}
                  </Button>
                </div>
              </div>
            )}
          </form>
        </Card>

        {/* Botones de NavegaciÃ³n */}
        <div className="flex gap-2 justify-between">
          <Button
            variant="secondary"
            onClick={handleAnterior}
            disabled={paso === 1}
          >
            Anterior
          </Button>

          <Button variant="primary" onClick={handleSiguiente} disabled={paso === 6}>
            Siguiente
          </Button>
        </div>

        {paso === 1 && (
          <Button variant="secondary" className="w-full">
            Generar Link PÃºblico
          </Button>
        )}
      </div>
    </ModuleLayout>
  )
}
