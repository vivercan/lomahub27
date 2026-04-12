import { useState, useEffect, useRef } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { Phone, Mail, MapPin, Building2, TrendingUp, User, Calendar, ArrowLeft, Plus, FileText, UserCheck, Edit3, Truck, DollarSign, Target, MessageSquare, Upload, Loader, X } from 'lucide-react'
import { ModuleLayout } from '../../components/layout/ModuleLayout'
import { tokens } from '../../lib/tokens'
import { supabase } from '../../lib/supabase'

interface Lead {
  id: string
  empresa: string
  contacto: string
  email: string
  telefono: string
  ciudad: string
  ruta_interes: string
  tipo_carga: string
  tipo_viaje: string
  estado: string
  ejecutivo_id: string
  ejecutivo_nombre: string
  valor_estimado: number
  probabilidad: number
  fuente: string
  notas: string
  cotizacion_url: string | null
  viajes_mes: number
  tarifa: number
  proyectado_usd: number
  fecha_creacion: string
  fecha_ultimo_mov: string
  eliminado?: boolean
}

const PIPELINE_STAGES = [
  { id: 'Nuevo', label: 'Nuevo', color: tokens.colors.blue },
  { id: 'Contactado', label: 'Contactado', color: tokens.colors.yellow },
  { id: 'Cotizado', label: 'Cotizado', color: tokens.colors.orange },
  { id: 'Negociacion', label: 'NegociaciÃ³n', color: '#A855F7' },
  { id: 'Cerrado Ganado', label: 'Cerrado Ganado', color: tokens.colors.green },
  { id: 'Cerrado Perdido', label: 'Cerrado Perdido', color: tokens.colors.red },
]

const formatCurrency = (v: number): string => {
  if (!v) return '$0'
  return new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(v)
}

const formatDate = (d: string): string => {
  if (!d) return '\u2014'
  const date = new Date(d)
  return date.toLocaleDateString('es-MX', { day: '2-digit', month: 'short', year: '2-digit' })
}

export default function FichaLead() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const [lead, setLead] = useState<Lead | null>(null)
  const [loading, setLoading] = useState(true)
  const [notFound, setNotFound] = useState(false)
  const [converting, setConverting] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    const fetchLead = async () => {
      try {
        if (!id) {
          setNotFound(true)
          setLoading(false)
          return
        }
        const { data, error } = await supabase
          .from('leads')
          .select('*')
          .eq('id', id)
          .single()

        if (error || !data) {
          setNotFound(true)
        } else {
          setLead(data)
        }
      } catch (err) {
        console.error('Error fetching lead:', err)
        setNotFound(true)
      } finally {
        setLoading(false)
      }
    }
    fetchLead()
  }, [id])

  const handleConvertToClient = async () => {
    if (!lead || converting) return
    if (!confirm('Â¿Convertir este lead a Cliente (Cerrado Ganado)?')) return
    try {
      setConverting(true)
      const { error } = await supabase
        .from('leads')
        .update({ estado: 'Cerrado Ganado', fecha_ultimo_mov: new Date().toISOString() })
        .eq('id', lead.id)
      if (error) throw error
      setLead({ ...lead, estado: 'Cerrado Ganado', fecha_ultimo_mov: new Date().toISOString() })
    } catch (err) {
      console.error('Error converting lead:', err)
      alert('Error al convertir el lead.')
    } finally {
      setConverting(false)
    }
  }

  const handleWhatsApp = () => {
    if (!lead?.telefono) { alert('Este lead no tiene telÃ©fono registrado.'); return }
    const phone = lead.telefono.replace(/\D/g, '')
    const msg = encodeURIComponent(`Hola, me comunico de parte de LOMA respecto a ${lead.empresa || 'su empresa'}.`)
    window.open(`https://wa.me/${phone}?text=${msg}`, '_blank')
  }

  const handleAttachQuotation = () => {
    fileInputRef.current?.click()
  }

  const handleFileSelected = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file || !lead) return
    if (file.type !== 'application/pdf') { alert('Por favor selecciona un archivo PDF'); return }
    try {
      const reader = new FileReader()
      reader.onload = async (e) => {
        const base64Content = (e.target?.result as string)?.split(',')[1] || ''
        try {
          const { data, error } = await supabase.functions.invoke('analisis-cotizacion', {
            body: { file_base64: base64Content, filename: file.name, lead_id: lead.id, lead_empresa: lead.empresa }
          })
          if (error) { console.error(error); alert('Error al analizar la cotizaciÃ³n.'); return }
          if (data) { alert(`CotizaciÃ³n analizada: ${data.resumen || 'OK'}`); }
        } catch (err) { console.error(err); alert('Error al analizar la cotizaciÃ³n.') }
      }
      reader.readAsDataURL(file)
    } catch (err) { console.error(err); alert('Error al leer el archivo.') }
    if (fileInputRef.current) fileInputRef.current.value = ''
  }

  const currentStageIdx = lead ? PIPELINE_STAGES.findIndex(s => s.id === lead.estado) : -1

  const s = {
    backBtn: {
      display: 'flex',
      alignItems: 'center',
      gap: '6px',
      padding: '6px 12px',
      borderRadius: tokens.radius.md,
      border: '1px solid #CC3700',
      background: '#FF4500',
      color: '#FFFFFF',
      fontSize: '13px',
      fontWeight: 600,
      fontFamily: tokens.fonts.body,
      cursor: 'pointer',
      transition: 'all 0.15s',
    },
    card: {
      background: tokens.colors.bgCard,
      border: `1px solid ${tokens.colors.border}`,
      borderRadius: tokens.radius.lg,
      padding: '20px',
    },
    label: {
      fontSize: '11px',
      fontWeight: 600,
      color: tokens.colors.textMuted,
      textTransform: 'uppercase' as const,
      letterSpacing: '0.06em',
      fontFamily: tokens.fonts.body,
      marginBottom: '4px',
    },
    value: {
      fontSize: '14px',
      color: tokens.colors.textPrimary,
      fontFamily: tokens.fonts.body,
    },
    valueMuted: {
      fontSize: '14px',
      color: tokens.colors.textSecondary,
      fontFamily: tokens.fonts.body,
    },
    sectionTitle: {
      fontFamily: tokens.fonts.heading,
      fontSize: '14px',
      fontWeight: 700,
      color: tokens.colors.textPrimary,
      letterSpacing: '0.04em',
      textTransform: 'uppercase' as const,
      marginBottom: '16px',
    },
    actionBtn: {
      display: 'flex',
      alignItems: 'center',
      gap: '6px',
      padding: '8px 16px',
      borderRadius: tokens.radius.md,
      border: `1px solid ${tokens.colors.border}`,
      background: tokens.colors.bgHover,
      color: tokens.colors.textSecondary,
      fontSize: '13px',
      fontFamily: tokens.fonts.body,
      cursor: 'pointer',
      transition: 'all 0.15s',
    },
    primaryBtn: {
      display: 'flex',
      alignItems: 'center',
      gap: '6px',
      padding: '8px 16px',
      borderRadius: tokens.radius.md,
      border: 'none',
      background: tokens.colors.primary,
      color: '#FFF',
      fontSize: '13px',
      fontWeight: 600,
      fontFamily: tokens.fonts.body,
      cursor: 'pointer',
      transition: 'all 0.15s',
    },
    stageDot: (active: boolean, color: string) => ({
      width: '36px',
      height: '36px',
      borderRadius: '50%',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      fontSize: '12px',
      fontWeight: 700,
      fontFamily: tokens.fonts.body,
      background: active ? color : tokens.colors.bgHover,
      color: active ? '#FFF' : tokens.colors.textMuted,
      border: `2px solid ${active ? color : tokens.colors.border}`,
      transition: 'all 0.2s',
    }),
    stageLine: (active: boolean, color: string) => ({
      flex: 1,
      height: '2px',
      background: active ? color : tokens.colors.border,
      transition: 'all 0.2s',
    }),
    infoRow: {
      display: 'flex',
      alignItems: 'center',
      gap: '10px',
      padding: '8px 0',
    },
    kpiCard: {
      background: tokens.colors.bgHover,
      border: `1px solid ${tokens.colors.border}`,
      borderRadius: tokens.radius.md,
      padding: '16px',
      textAlign: 'center' as const,
    },
  }

  if (loading) {
    return (
      <ModuleLayout titulo="Lead">
        <div style={{ textAlign: 'center', padding: '60px', color: tokens.colors.textMuted }}>
          <p style={{ fontFamily: tokens.fonts.body }}>Cargando...</p>
        </div>
      </ModuleLayout>
    )
  }

  if (notFound || !lead) {
    return (
      <ModuleLayout titulo="Lead">
        <div style={{ textAlign: 'center', padding: '60px', color: tokens.colors.textMuted }}>
          <p style={{ fontSize: '18px', fontWeight: 500, margin: 0, fontFamily: tokens.fonts.heading }}>Lead no encontrado</p>
          <p style={{ fontSize: '14px', marginTop: '8px', fontFamily: tokens.fonts.body }}>No hay informaciÃ³n disponible para este lead</p>
          <button style={{ ...s.actionBtn, marginTop: '16px', display: 'inline-flex' }} onClick={() => navigate('/ventas/mis-leads')}>
            <ArrowLeft size={14} /> Volver al Panel
          </button>
        </div>
      </ModuleLayout>
    )
  }

  const stageInfo = PIPELINE_STAGES.find(st => st.id === lead.estado)

  return (
    <ModuleLayout
      titulo={`Lead â ${lead.empresa}`}
      acciones={
        <button
          style={s.backBtn}
          onClick={() => navigate('/ventas/mis-leads')}
          onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.background = '#CC3700' }}
          onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.background = '#FF4500' }}
        >
          <ArrowLeft size={14} /> Volver
        </button>
      }
    >
      <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', height: '100%', overflow: 'hidden' }}>
      {/* Hidden file input for cotizaciÃ³n PDF */}
      <input ref={fileInputRef} type="file" accept=".pdf" style={{ display: 'none' }} onChange={handleFileSelected} />

        {/* Ã¢ÂÂÃ¢ÂÂ PIPELINE Ã¢ÂÂÃ¢ÂÂ */}
        <div style={s.card}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            {PIPELINE_STAGES.map((stage, idx) => {
              const isActive = idx <= currentStageIdx
              const color = isActive ? (stage.color || tokens.colors.primary) : tokens.colors.border
              return (
                <div key={stage.id} style={{ display: 'flex', alignItems: 'center', flex: idx < PIPELINE_STAGES.length - 1 ? 1 : undefined, gap: '0' }}>
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px', minWidth: '60px' }}>
                    <div style={s.stageDot(isActive, stage.color)}>
                      {idx + 1}
                    </div>
                    <span style={{ fontSize: '10px', color: isActive ? stage.color : tokens.colors.textMuted, fontFamily: tokens.fonts.body, fontWeight: isActive ? 600 : 400, textAlign: 'center', whiteSpace: 'nowrap' }}>
                      {stage.label}
                    </span>
                  </div>
                  {idx < PIPELINE_STAGES.length - 1 && (
                    <div style={s.stageLine(isActive && idx < currentStageIdx, stage.color)} />
                  )}
                </div>
              )
            })}
          </div>
        </div>

        {/* Ã¢ÂÂÃ¢ÂÂ BODY: 2 columns Ã¢ÂÂÃ¢ÂÂ */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '20px', flex: 1, minHeight: 0, overflow: 'auto' }}>

          {/* LEFT: Info del lead */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {/* Datos de contacto */}
            <div style={s.card}>
              <p style={s.sectionTitle}>Datos de Contacto</p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                <div style={s.infoRow}>
                  <Building2 size={15} style={{ color: tokens.colors.primary, flexShrink: 0 }} />
                  <div>
                    <p style={s.label}>Empresa</p>
                    <p style={{ ...s.value, fontWeight: 600, fontSize: '16px' }}>{lead.empresa || '\u2014'}</p>
                  </div>
                </div>
                <div style={s.infoRow}>
                  <User size={15} style={{ color: tokens.colors.primary, flexShrink: 0 }} />
                  <div>
                    <p style={s.label}>Contacto</p>
                    <p style={s.value}>{lead.contacto || '\u2014'}</p>
                  </div>
                </div>
                {lead.telefono && (
                  <div style={s.infoRow}>
                    <Phone size={15} style={{ color: tokens.colors.primary, flexShrink: 0 }} />
                    <div>
                      <p style={s.label}>TelÃ©fono</p>
                      <p style={s.value}>{lead.telefono}</p>
                    </div>
                  </div>
                )}
                {lead.email && (
                  <div style={s.infoRow}>
                    <Mail size={15} style={{ color: tokens.colors.primary, flexShrink: 0 }} />
                    <div>
                      <p style={s.label}>Email</p>
                      <p style={s.value}>{lead.email}</p>
                    </div>
                  </div>
                )}
                {lead.ciudad && (
                  <div style={s.infoRow}>
                    <MapPin size={15} style={{ color: tokens.colors.primary, flexShrink: 0 }} />
                    <div>
                      <p style={s.label}>Ciudad</p>
                      <p style={s.value}>{lead.ciudad}</p>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Info comercial */}
            <div style={s.card}>
              <p style={s.sectionTitle}>InformaciÃ³n Comercial</p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                {lead.ruta_interes && (
                  <div style={s.infoRow}>
                    <Truck size={15} style={{ color: tokens.colors.primary, flexShrink: 0 }} />
                    <div>
                      <p style={s.label}>Ruta</p>
                      <p style={s.value}>{lead.ruta_interes}</p>
                    </div>
                  </div>
                )}
                {lead.tipo_carga && (
                  <div style={s.infoRow}>
                    <FileText size={15} style={{ color: tokens.colors.primary, flexShrink: 0 }} />
                    <div>
                      <p style={s.label}>Tipo Servicio</p>
                      <p style={s.value}>{lead.tipo_carga}</p>
                    </div>
                  </div>
                )}
                {lead.tipo_viaje && (
                  <div style={s.infoRow}>
                    <Target size={15} style={{ color: tokens.colors.primary, flexShrink: 0 }} />
                    <div>
                      <p style={s.label}>Tipo Viaje</p>
                      <p style={s.value}>{lead.tipo_viaje}</p>
                    </div>
                  </div>
                )}
                {lead.fuente && (
                  <div style={s.infoRow}>
                    <TrendingUp size={15} style={{ color: tokens.colors.primary, flexShrink: 0 }} />
                    <div>
                      <p style={s.label}>Fuente</p>
                      <p style={s.value}>{lead.fuente}</p>
                    </div>
                  </div>
                )}
                <div style={s.infoRow}>
                  <User size={15} style={{ color: tokens.colors.primary, flexShrink: 0 }} />
                  <div>
                    <p style={s.label}>Ejecutivo</p>
                    <p style={s.value}>{lead.ejecutivo_nombre || '\u2014'}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* RIGHT: KPIs + Notas + Acciones */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {/* KPI Cards */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '12px' }}>
              <div style={s.kpiCard}>
                <p style={s.label}>Valor Estimado</p>
                <p style={{ fontSize: '18px', fontWeight: 700, color: tokens.colors.green, fontFamily: tokens.fonts.heading }}>
                  {formatCurrency(lead.valor_estimado || 0)}
                </p>
              </div>
              <div style={s.kpiCard}>
                <p style={s.label}>Proyectado USD</p>
                <p style={{ fontSize: '18px', fontWeight: 700, color: tokens.colors.primary, fontFamily: tokens.fonts.heading }}>
                  {formatCurrency(lead.proyectado_usd || 0)}
                </p>
              </div>
              <div style={s.kpiCard}>
                <p style={s.label}>Viajes / Mes</p>
                <p style={{ fontSize: '18px', fontWeight: 700, color: tokens.colors.textPrimary, fontFamily: tokens.fonts.heading }}>
                  {lead.viajes_mes || 0}
                </p>
              </div>
              <div style={s.kpiCard}>
                <p style={s.label}>Probabilidad</p>
                <p style={{ fontSize: '18px', fontWeight: 700, color: tokens.colors.yellow, fontFamily: tokens.fonts.heading }}>
                  {lead.probabilidad || 0}%
                </p>
              </div>
            </div>

            {/* Fechas */}
            <div style={s.card}>
              <div style={{ display: 'flex', gap: '24px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <Calendar size={15} style={{ color: tokens.colors.primary }} />
                  <div>
                    <p style={s.label}>Creado</p>
                    <p style={s.value}>{formatDate(lead.fecha_creacion)}</p>
                  </div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <Calendar size={15} style={{ color: tokens.colors.yellow }} />
                  <div>
                    <p style={s.label}>Ãltimo Movimiento</p>
                    <p style={s.value}>{formatDate(lead.fecha_ultimo_mov)}</p>
                  </div>
                </div>
                {stageInfo && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: stageInfo.color }} />
                    <div>
                      <p style={s.label}>Etapa Actual</p>
                      <p style={{ ...s.value, color: stageInfo.color, fontWeight: 600 }}>{stageInfo.label}</p>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Notas */}
            <div style={s.card}>
              <p style={s.sectionTitle}>Notas</p>
              <p style={{ ...s.valueMuted, whiteSpace: 'pre-wrap', minHeight: '40px' }}>
                {lead.notas || 'Sin notas registradas'}
              </p>
            </div>

            {/* Acciones */}
            <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
              <button style={s.primaryBtn} onClick={() => alert('MÃ³dulo de actividades prÃ³ximamente')}>
                <Plus size={14} /> Registrar Actividad
              </button>
              <button style={s.actionBtn} onClick={handleAttachQuotation}>
                <Upload size={14} /> Crear CotizaciÃ³n
              </button>
              <button
                style={{ ...s.actionBtn, ...(converting ? { opacity: 0.6, cursor: 'wait' } : {}) }}
                onClick={handleConvertToClient}
                disabled={converting}
              >
                <UserCheck size={14} /> {converting ? 'Convirtiendo...' : 'Convertir a Cliente'}
              </button>
              <button style={s.actionBtn} onClick={() => navigate(`/ventas/leads/${id}/editar`)}>
                <Edit3 size={14} /> Editar Lead
              </button>
              <button style={s.actionBtn} onClick={handleWhatsApp}>
                <MessageSquare size={14} /> WhatsApp
              </button>
            </div>
          </div>
        </div>
      </div>
    </ModuleLayout>
  )
}
