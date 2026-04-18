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
  { id: 'Negociacion', label: 'Negociación', color: '#A855F7' },
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
  const [toast, setToast] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const showToast = (msg: string) => {
    setToast(msg)
    setTimeout(() => setToast(null), 4000)
  }

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
    if (!confirm('¿Convertir este lead a Cliente (Cerrado Ganado)?')) return
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
    if (!lead?.telefono) { alert('Este lead no tiene teléfono registrado.'); return }
    const phone = lead.telefono.replace(/\\D/g, '')
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
          if (error) { console.error(error); alert('Error al analizar la cotización.'); return }
          if (data) { alert(`Cotización analizada: ${data.resumen || 'OK'}`); }
        } catch (err) { console.error(err); alert('Error al analizar la cotización.') }
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
      padding: '7px 14px',
      borderRadius: tokens.radius.md,
      border: '1px solid #B03000',
      background: 'linear-gradient(180deg, #FF5C1A 0%, #FF4500 50%, #CC3700 100%)',
      color: '#FFFFFF',
      fontSize: '13px',
      fontWeight: 600,
      fontFamily: tokens.fonts.body,
      cursor: 'pointer',
      boxShadow: '0 2px 4px rgba(255,69,0,0.30), 0 6px 14px -3px rgba(255,69,0,0.25), 0 10px 24px -6px rgba(0,0,0,0.20), inset 0 1px 0 rgba(255,255,255,0.28), inset 0 -1px 0 rgba(0,0,0,0.20)',
      textShadow: '0 1px 2px rgba(0,0,0,0.25)',
      transition: 'all 0.18s ease',
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
      background: 'linear-gradient(180deg, #FFFFFF 0%, #F3F4F6 100%)',
      color: tokens.colors.textSecondary,
      fontSize: '13px',
      fontFamily: tokens.fonts.body,
      cursor: 'pointer',
      transition: 'all 0.18s ease',
      boxShadow: '0 2px 4px rgba(0,0,0,0.12), 0 4px 10px -2px rgba(0,0,0,0.10), inset 0 1px 0 rgba(255,255,255,0.90), inset 0 -2px 0 rgba(0,0,0,0.06)',
    },
    primaryBtn: {
      display: 'flex',
      alignItems: 'center',
      gap: '6px',
      padding: '9px 18px',
      borderRadius: tokens.radius.md,
      border: 'none',
      background: `linear-gradient(180deg, #4A7AF0 0%, ${tokens.colors.primary} 50%, #2F5BC4 100%)`,
      color: '#FFF',
      fontSize: '13px',
      fontWeight: 600,
      fontFamily: tokens.fonts.body,
      cursor: 'pointer',
      transition: 'all 0.18s ease',
      boxShadow: '0 2px 4px rgba(59,108,231,0.30), 0 6px 14px -3px rgba(59,108,231,0.25), inset 0 1px 0 rgba(255,255,255,0.28), inset 0 -1px 0 rgba(0,0,0,0.18)',
      textShadow: '0 1px 2px rgba(0,0,0,0.20)',
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
      background: active
        ? `linear-gradient(180deg, ${color} 0%, ${color}CC 100%)`
        : 'linear-gradient(180deg, #FFFFFF 0%, #F3F4F6 100%)',
      color: active ? '#FFF' : tokens.colors.textMuted,
      border: `2px solid ${active ? color : tokens.colors.border}`,
      transition: 'all 0.2s',
      boxShadow: active
        ? `0 2px 6px rgba(0,0,0,0.20), inset 0 1px 0 rgba(255,255,255,0.30), inset 0 -1px 0 rgba(0,0,0,0.15)`
        : '0 1px 3px rgba(0,0,0,0.08), inset 0 1px 0 rgba(255,255,255,0.80), inset 0 -1px 0 rgba(0,0,0,0.04)',
      textShadow: active ? '0 1px 1px rgba(0,0,0,0.20)' : 'none',
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
      <ModuleLayout titulo="Lead" moduloPadre={{ nombre: 'Comercial', ruta: '/ventas/dashboard' }}>
        <div style={{ textAlign: 'center', padding: '60px', color: tokens.colors.textMuted }}>
          <p style={{ fontFamily: tokens.fonts.body }}>Cargando...</p>
        </div>
      </ModuleLayout>
    )
  }

  if (notFound || !lead) {
    return (
      <ModuleLayout titulo="Lead" moduloPadre={{ nombre: 'Comercial', ruta: '/ventas/dashboard' }}>
        <div style={{ textAlign: 'center', padding: '60px', color: tokens.colors.textMuted }}>
          <p style={{ fontSize: '18px', fontWeight: 500, margin: 0, fontFamily: tokens.fonts.heading }}>Lead no encontrado</p>
          <p style={{ fontSize: '14px', marginTop: '8px', fontFamily: tokens.fonts.body }}>No hay información disponible para este lead</p>
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
      titulo={`Lead — ${lead.empresa}`}
      moduloPadre={{ nombre: 'Comercial', ruta: '/ventas/dashboard' }}
      acciones={
        <button
          style={s.backBtn}
          onClick={() => navigate('/ventas/mis-leads')}
          onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.background = 'linear-gradient(180deg, #FF4500 0%, #CC3700 100%)' }}
          onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.background = 'linear-gradient(180deg, #FF5C1A 0%, #FF4500 50%, #CC3700 100%)' }}
        >
          <ArrowLeft size={14} /> Volver
        </button>
      }
    >
      {/* Hidden file input */}
      <input ref={fileInputRef} type="file" accept=".pdf" style={{ display: "none" }} onChange={handleFileSelected} />
      <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', height: '100%', overflow: 'hidden' }}>
        {/* ââ PIPELINE ââ */}
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

        {/* ââ BODY: 2 columns ââ */}
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
                      <p style={s.label}>Teléfono</p>
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
              <p style={s.sectionTitle}>Información Comercial</p>
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
                    <p style={s.label}>Último Movimiento</p>
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
              <button style={s.primaryBtn}
                onClick={() => showToast('Módulo de actividades en desarrollo. Próximamente podrás registrar llamadas, visitas y seguimientos aquí.')}>
                <Plus size={14} /> Registrar Actividad
              </button>
              <button style={s.actionBtn}
                onClick={() => navigate(`/cotizador/nueva?lead_id=${lead.id}&empresa=${encodeURIComponent(lead.empresa || '')}`)}>
                <FileText size={14} /> Crear Cotización
              </button>
              <button style={s.actionBtn}
                onClick={handleConvertToClient}
                disabled={converting || lead.estado === 'Cerrado Ganado'}>
                <UserCheck size={14} /> {lead.estado === 'Cerrado Ganado' ? 'Ya es Cliente' : converting ? 'Convirtiendo...' : 'Convertir a Cliente'}
              </button>
              <button style={s.actionBtn}
                onClick={() => navigate(`/ventas/leads/nuevo?edit=${lead.id}`)}>
                <Edit3 size={14} /> Editar Lead
              </button>
              <button style={s.actionBtn}
                onClick={handleWhatsApp}>
                <MessageSquare size={14} /> WhatsApp
              </button>
            </div>

            {/* Toast notification */}
            {toast && (
              <div style={{
                position: 'fixed', bottom: '24px', left: '50%', transform: 'translateX(-50%)',
                background: 'linear-gradient(180deg, #1E293B 0%, #0F172A 100%)',
                color: '#fff', padding: '12px 24px', borderRadius: '12px', fontSize: '13px',
                fontFamily: tokens.fonts.body, zIndex: 9999, maxWidth: '480px', textAlign: 'center',
                boxShadow: '0 4px 12px rgba(0,0,0,0.30), 0 12px 32px -4px rgba(0,0,0,0.25), inset 0 1px 0 rgba(255,255,255,0.10)',
                animation: 'fadeSlideUp 0.3s ease',
                display: 'flex', alignItems: 'center', gap: '10px',
              }}>
                <span style={{ color: '#FBBF24', fontSize: '16px' }}>⚠</span>
                {toast}
              </div>
            )}
          </div>
        </div>
      </div>
    </ModuleLayout>
  )
}
