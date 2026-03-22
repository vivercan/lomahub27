import type { ReactElement } from 'react'
import { useEffect, useState, useRef } from 'react'
import {
  Upload, Zap, Loader, Search, X, Phone, Mail, MapPin,
  FileText, ChevronRight, Plus, LayoutGrid, List, Pencil, Trash2,
} from 'lucide-react'
import type { Column } from '../../components/ui/DataTable'
import { ModuleLayout } from '../../components/layout/ModuleLayout'
import { Card } from '../../components/ui/Card'
import { KPICard } from '../../components/ui/KPICard'
import { DataTable } from '../../components/ui/DataTable'
import { Badge } from '../../components/ui/Badge'
import { tokens } from '../../lib/tokens'
import { supabase } from '../../lib/supabase'
import { useAuthContext } from '../../hooks/AuthContext'
import AddLeadModal from './AddLeadModal'

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
  prioridad: string
  proximos_pasos: string
  fecha_creacion: string
  fecha_ultimo_mov: string
}

interface AIAnalysisResult {
  next_steps: string[]
  adjusted_probability: number
  likely_objections: string[]
  sales_arguments: string[]
}

const PIPELINE_STAGES = [
  { id: 'Nuevo', label: 'Nuevo', probability: 10, color: tokens.colors.blue },
  { id: 'Contactado', label: 'Contactado', probability: 25, color: tokens.colors.yellow },
  { id: 'Cotizado', label: 'Cotizado', probability: 50, color: tokens.colors.orange },
  { id: 'Negociacion', label: 'Negociación', probability: 75, color: '#8B5CF6' },
  { id: 'Cerrado Ganado', label: 'Ganado', probability: 100, color: tokens.colors.green },
  { id: 'Cerrado Perdido', label: 'Perdido', probability: 0, color: tokens.colors.red },
]

const ETAPA_BADGE_COLOR: Record<string, 'blue' | 'yellow' | 'orange' | 'green' | 'red' | 'gray'> = {
  'Nuevo': 'blue',
  'Contactado': 'yellow',
  'Cotizado': 'orange',
  'Negociacion': 'primary' as 'blue',
  'Cerrado Ganado': 'green',
  'Cerrado Perdido': 'red',
}

export default function MisLeads(): ReactElement {
  const auth = useAuthContext()
  const [leads, setLeads] = useState<Lead[]>([])
  const [loading, setLoading] = useState(true)
  const [filteredEjecutivoId, setFilteredEjecutivoId] = useState('')
  const [ejecutivos, setEjecutivos] = useState<{ id: string; nombre: string }[]>([])
  const [searchTerm, setSearchTerm] = useState('')
  const [viewMode, setViewMode] = useState<'kanban' | 'tabla'>('kanban')
  const [sidebarLead, setSidebarLead] = useState<Lead | null>(null)
  const [addLeadOpen, setAddLeadOpen] = useState(false)
  const [aiModalOpen, setAiModalOpen] = useState(false)
  const [aiLoading, setAiLoading] = useState(false)
  const [aiResult, setAiResult] = useState<AIAnalysisResult | null>(null)
  const [uploading, setUploading] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => { fetchLeads() }, [auth.user?.id])

  const fetchLeads = async () => {
    try {
      setLoading(true)
      let query = supabase.from('leads').select('*')
      if (auth.user?.rol === 'ventas' && auth.user?.id) {
        query = query.eq('ejecutivo_id', auth.user.id)
      }
      const { data, error } = await query
      if (error) { console.error('Error fetching leads:', error); setLeads([]); return }
      setLeads(data || [])
      const uniqueEjecutivos = Array.from(
        new Map(
          (data || [])
            .filter((l: Lead) => l.ejecutivo_id && l.ejecutivo_nombre)
            .map((l: Lead) => [l.ejecutivo_id, { id: l.ejecutivo_id, nombre: l.ejecutivo_nombre }])
        ).values()
      )
      setEjecutivos(uniqueEjecutivos)
    } catch (err) { console.error('Unexpected error:', err); setLeads([]) }
    finally { setLoading(false) }
  }

  const visibleLeads = leads
    .filter((l) => !filteredEjecutivoId || l.ejecutivo_id === filteredEjecutivoId)
    .filter((l) => {
      if (!searchTerm) return true
      const term = searchTerm.toLowerCase()
      return (
        l.empresa?.toLowerCase().includes(term) ||
        l.contacto?.toLowerCase().includes(term) ||
        l.ciudad?.toLowerCase().includes(term) ||
        l.ruta_interes?.toLowerCase().includes(term) ||
        l.ejecutivo_nombre?.toLowerCase().includes(term)
      )
    })

  const daysSince = (d: string) => {
    if (!d) return 0
    return Math.ceil(Math.abs(new Date().getTime() - new Date(d).getTime()) / (1000 * 60 * 60 * 24))
  }

  const fmtUSD = (v: number) => v ? '$' + v.toLocaleString('en-US', { minimumFractionDigits: 0 }) : '$0'

  const leadsPerStage = PIPELINE_STAGES.map((s) => ({
    ...s,
    count: visibleLeads.filter((l) => l.estado === s.id).length,
    totalValue: visibleLeads.filter((l) => l.estado === s.id).reduce((sum, l) => sum + (l.valor_estimado || 0), 0),
  }))

  const totalLeads = visibleLeads.length
  const totalPipelineValue = visibleLeads.reduce((sum, l) => sum + (l.valor_estimado || 0) * ((l.probabilidad || 0) / 100), 0)
  const wonLeads = visibleLeads.filter((l) => l.estado === 'Cerrado Ganado').length
  const winRate = totalLeads > 0 ? Math.round((wonLeads / totalLeads) * 100) : 0

  const handleChangeStage = async (lead: Lead, newStageId: string) => {
    const newStage = PIPELINE_STAGES.find((s) => s.id === newStageId)
    if (!newStage) return
    try {
      const { error } = await supabase
        .from('leads')
        .update({ estado: newStageId, probabilidad: newStage.probability, fecha_ultimo_mov: new Date().toISOString() })
        .eq('id', lead.id)
      if (error) throw error
      const updated = leads.map((l) =>
        l.id === lead.id ? { ...l, estado: newStageId, probabilidad: newStage.probability, fecha_ultimo_mov: new Date().toISOString() } : l
      )
      setLeads(updated)
      if (sidebarLead?.id === lead.id) setSidebarLead({ ...lead, estado: newStageId, probabilidad: newStage.probability })
    } catch (err) { console.error('Error updating lead stage:', err) }
  }

  const handleAIAnalysis = async (lead: Lead) => {
    setSidebarLead(null)
    setAiModalOpen(true)
    setAiLoading(true)
    setAiResult(null)
    try {
      const response = await supabase.functions.invoke('analisis-leads', {
        body: {
          lead: {
            id: lead.id, empresa: lead.empresa, contacto: lead.contacto,
            email: lead.email, telefono: lead.telefono, ciudad: lead.ciudad,
            ruta_interes: lead.ruta_interes, tipo_carga: lead.tipo_carga,
            estado: lead.estado, valor_estimado: lead.valor_estimado,
            probabilidad: lead.probabilidad, notas: lead.notas,
          },
        },
      })
      if (response.error) throw response.error
      setAiResult(response.data)
    } catch (err) { console.error('Error calling AI analysis:', err); setAiResult(null) }
    finally { setAiLoading(false) }
  }

  const handleUploadCotizacion = async (lead: Lead, file: File) => {
    if (!file) return
    try {
      setUploading(true)
      const fileName = lead.id + '-' + Date.now() + '.pdf'
      const { error } = await supabase.storage.from('cotizaciones').upload(fileName, file, { upsert: true })
      if (error) throw error
      const { data: { publicUrl } } = supabase.storage.from('cotizaciones').getPublicUrl(fileName)
      const { error: updateError } = await supabase
        .from('leads')
        .update({ cotizacion_url: publicUrl, fecha_ultimo_mov: new Date().toISOString() })
        .eq('id', lead.id)
      if (updateError) throw updateError
      setLeads(leads.map((l) => l.id === lead.id ? { ...l, cotizacion_url: publicUrl } : l))
      if (sidebarLead?.id === lead.id) setSidebarLead({ ...lead, cotizacion_url: publicUrl })
    } catch (err) { console.error('Error uploading cotizacion:', err) }
    finally { setUploading(false); if (fileInputRef.current) fileInputRef.current.value = '' }
  }

  const handleDeleteLead = async (lead: Lead) => {
    try {
      const { error } = await supabase.from('leads').delete().eq('id', lead.id)
      if (error) throw error
      setLeads(leads.filter((l) => l.id !== lead.id))
      if (sidebarLead?.id === lead.id) setSidebarLead(null)
    } catch (err) { console.error('Error deleting lead:', err) }
  }

  // ─── Styles ───────────────────────────────────────────
  const toggleBtnStyle = (active: boolean): React.CSSProperties => ({
    padding: '6px 10px', borderRadius: tokens.radius.md, cursor: 'pointer',
    background: active ? tokens.colors.primary : 'transparent',
    color: active ? '#fff' : tokens.colors.textMuted,
    border: '1px solid ' + (active ? tokens.colors.primary : tokens.colors.border),
    display: 'inline-flex', alignItems: 'center', gap: '4px',
    fontSize: '12px', fontWeight: 500, transition: 'all 0.15s ease',
    fontFamily: tokens.fonts.body,
  })

  const searchBoxStyle: React.CSSProperties = {
    position: 'relative', display: 'inline-flex', alignItems: 'center',
  }

  const searchIconStyle: React.CSSProperties = {
    position: 'absolute', left: '10px', color: tokens.colors.textMuted, pointerEvents: 'none',
  }

  const searchInputStyle: React.CSSProperties = {
    paddingLeft: '32px', paddingRight: '12px', paddingTop: '6px', paddingBottom: '6px',
    fontSize: '12px', borderRadius: tokens.radius.md, outline: 'none', width: '200px',
    background: tokens.colors.bgHover, border: '1px solid ' + tokens.colors.border,
    color: tokens.colors.textPrimary, fontFamily: tokens.fonts.body,
  }

  const filterSelectStyle: React.CSSProperties = {
    padding: '6px 12px', fontSize: '12px', borderRadius: tokens.radius.md, outline: 'none',
    background: tokens.colors.bgHover, border: '1px solid ' + tokens.colors.border,
    color: tokens.colors.textPrimary, fontFamily: tokens.fonts.body,
  }

  const addBtnStyle: React.CSSProperties = {
    padding: '7px 16px', borderRadius: tokens.radius.md, cursor: 'pointer',
    background: tokens.colors.primary, color: '#fff', border: 'none',
    fontSize: '12px', fontWeight: 600, fontFamily: tokens.fonts.body,
    display: 'inline-flex', alignItems: 'center', gap: '6px',
    boxShadow: tokens.effects.glowPrimary, transition: 'all 0.15s ease',
  }

  // ─── FUNNEL CARDS ─────────────────────────────────────
  const renderFunnel = () => (
    <div style={{
      display: 'grid', gridTemplateColumns: 'repeat(6, 1fr)',
      gap: tokens.spacing.sm, marginBottom: tokens.spacing.md,
    }}>
      {leadsPerStage.map((stage) => (
        <div key={stage.id} style={{
          background: tokens.colors.bgCard,
          border: '1px solid ' + tokens.colors.border,
          borderRadius: tokens.radius.lg,
          padding: '14px 16px',
          borderTop: '3px solid ' + stage.color,
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '8px' }}>
            <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: stage.color }} />
            <span style={{
              fontSize: '11px', fontWeight: 600, textTransform: 'uppercase',
              letterSpacing: '0.05em', color: tokens.colors.textSecondary,
              fontFamily: tokens.fonts.heading,
            }}>{stage.label}</span>
          </div>
          <div style={{ fontSize: '24px', fontWeight: 800, color: stage.color, fontFamily: tokens.fonts.heading }}>
            {stage.count}
          </div>
          <div style={{ fontSize: '11px', color: tokens.colors.textMuted, marginTop: '2px' }}>
            {fmtUSD(stage.totalValue)}
          </div>
        </div>
      ))}
    </div>
  )

  // ─── TABLE VIEW ───────────────────────────────────────
  const tableColumns: Column<Lead>[] = [
    {
      key: 'empresa',
      label: 'Empresa',
      render: (row: Lead) => (
        <span style={{ fontWeight: 700, color: tokens.colors.textPrimary, fontFamily: tokens.fonts.heading, fontSize: '13px' }}>
          {row.empresa}
        </span>
      ),
    },
    {
      key: 'estado',
      label: 'Etapa',
      align: 'center',
      render: (row: Lead) => {
        const badgeColor = ETAPA_BADGE_COLOR[row.estado] || 'gray'
        const stageLabel = PIPELINE_STAGES.find((s) => s.id === row.estado)?.label || row.estado
        return <Badge color={badgeColor}>{stageLabel}</Badge>
      },
    },
    {
      key: 'valor_estimado',
      label: 'Potencial',
      align: 'right',
      render: (row: Lead) => (
        <span style={{ fontWeight: 600, color: tokens.colors.green, fontFamily: tokens.fonts.heading, fontSize: '13px' }}>
          {fmtUSD(row.valor_estimado)}
        </span>
      ),
    },
    {
      key: 'tipo_carga',
      label: 'Tipo Servicio',
      render: (row: Lead) => (
        <span style={{ fontSize: '12px', color: tokens.colors.textSecondary }}>
          {row.tipo_carga || '—'}
        </span>
      ),
    },
    {
      key: 'ejecutivo_nombre',
      label: 'Responsable',
      render: (row: Lead) => (
        <span style={{ fontSize: '12px', color: tokens.colors.textSecondary }}>
          {row.ejecutivo_nombre || '—'}
        </span>
      ),
    },
    {
      key: 'fecha_creacion',
      label: 'Fecha',
      render: (row: Lead) => (
        <span style={{ fontSize: '12px', color: tokens.colors.textMuted }}>
          {row.fecha_creacion ? new Date(row.fecha_creacion).toLocaleDateString('es-MX') : '—'}
        </span>
      ),
    },
    {
      key: 'acciones',
      label: 'Acciones',
      align: 'center',
      width: '100px',
      render: (row: Lead) => (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}>
          <button
            onClick={(e) => { e.stopPropagation(); setSidebarLead(row) }}
            style={{
              padding: '4px 8px', borderRadius: tokens.radius.sm, cursor: 'pointer',
              background: 'transparent', border: '1px solid ' + tokens.colors.border,
              color: tokens.colors.yellow, transition: 'all 0.15s ease',
              display: 'inline-flex', alignItems: 'center',
            }}
            onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.background = tokens.colors.yellowBg }}
            onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.background = 'transparent' }}
          >
            <Pencil size={13} />
          </button>
          <button
            onClick={(e) => { e.stopPropagation(); handleDeleteLead(row) }}
            style={{
              padding: '4px 8px', borderRadius: tokens.radius.sm, cursor: 'pointer',
              background: 'transparent', border: '1px solid ' + tokens.colors.border,
              color: tokens.colors.red, transition: 'all 0.15s ease',
              display: 'inline-flex', alignItems: 'center',
            }}
            onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.background = tokens.colors.redBg }}
            onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.background = 'transparent' }}
          >
            <Trash2 size={13} />
          </button>
        </div>
      ),
    },
  ]

  // ─── KANBAN CARD ──────────────────────────────────────
  const LeadCard = ({ lead }: { lead: Lead }) => {
    const days = daysSince(lead.fecha_ultimo_mov)
    const stageColor = PIPELINE_STAGES.find((s) => s.id === lead.estado)?.color || tokens.colors.gray
    return (
      <div
        onClick={() => setSidebarLead(lead)}
        style={{
          borderRadius: tokens.radius.md, padding: '12px', marginBottom: '8px', cursor: 'pointer',
          background: tokens.colors.bgHover,
          border: '1px solid ' + (sidebarLead?.id === lead.id ? tokens.colors.primary : tokens.colors.border),
          boxShadow: sidebarLead?.id === lead.id ? tokens.effects.glowPrimary : 'none',
          transition: 'all 0.15s ease',
        }}
        onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.transform = 'scale(1.02)' }}
        onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.transform = 'scale(1)' }}
      >
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '8px' }}>
          <div style={{ flex: 1, minWidth: 0 }}>
            <p style={{ fontWeight: 700, fontSize: '12px', color: tokens.colors.textPrimary, fontFamily: tokens.fonts.heading, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', margin: 0 }}>
              {lead.empresa}
            </p>
            <p style={{ fontSize: '11px', color: tokens.colors.textSecondary, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', margin: '2px 0 0 0' }}>
              {lead.contacto || '—'}
            </p>
          </div>
          <ChevronRight size={14} style={{ color: tokens.colors.textMuted, flexShrink: 0, marginTop: 2 }} />
        </div>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <span style={{ fontSize: '12px', fontWeight: 600, color: stageColor }}>{fmtUSD(lead.valor_estimado)}</span>
          {days > 7 && (
            <span style={{
              fontSize: '10px', padding: '2px 6px', borderRadius: tokens.radius.sm,
              background: tokens.colors.redBg, color: tokens.colors.red,
            }}>{days}d</span>
          )}
          {lead.prioridad && days <= 7 && (
            <Badge color={lead.prioridad === 'alta' ? 'red' : lead.prioridad === 'media' ? 'yellow' : 'green'}>
              {lead.prioridad.charAt(0).toUpperCase() + lead.prioridad.slice(1)}
            </Badge>
          )}
        </div>
      </div>
    )
  }

  // ─── SIDEBAR ──────────────────────────────────────────
  const renderSidebar = () => {
    if (!sidebarLead) return null
    return (
      <div style={{
        width: 360, flexShrink: 0, borderRadius: tokens.radius.lg,
        overflow: 'hidden',
        background: tokens.colors.bgCard,
        border: '1px solid ' + tokens.colors.border,
        boxShadow: tokens.effects.cardShadow,
      }}>
        {/* Header */}
        <div style={{
          padding: tokens.spacing.md,
          display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between',
          borderBottom: '1px solid ' + tokens.colors.border,
        }}>
          <div style={{ flex: 1, minWidth: 0 }}>
            <p style={{ fontWeight: 700, fontSize: '16px', color: tokens.colors.textPrimary, fontFamily: tokens.fonts.heading, margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {sidebarLead.empresa}
            </p>
            <p style={{ fontSize: '12px', color: tokens.colors.textSecondary, margin: '2px 0 0' }}>
              {sidebarLead.contacto || '—'}
            </p>
          </div>
          <button onClick={() => setSidebarLead(null)} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '4px', color: tokens.colors.textMuted }}>
            <X size={16} />
          </button>
        </div>

        {/* Body */}
        <div style={{ padding: tokens.spacing.md }}>
          {/* Stage selector */}
          <div style={{ marginBottom: tokens.spacing.md }}>
            <p style={{
              fontSize: '10px', textTransform: 'uppercase', letterSpacing: '0.12em',
              fontWeight: 700, color: tokens.colors.orange, fontFamily: tokens.fonts.heading,
              marginBottom: '8px',
            }}>Etapa</p>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
              {PIPELINE_STAGES.map((s) => (
                <button key={s.id} onClick={() => handleChangeStage(sidebarLead, s.id)}
                  style={{
                    padding: '5px 10px', borderRadius: tokens.radius.full,
                    fontSize: '11px', fontWeight: 500, cursor: 'pointer',
                    background: sidebarLead.estado === s.id ? s.color : tokens.colors.bgHover,
                    color: sidebarLead.estado === s.id ? '#fff' : tokens.colors.textSecondary,
                    border: '1px solid ' + (sidebarLead.estado === s.id ? s.color : tokens.colors.border),
                    transition: 'all 0.15s ease', fontFamily: tokens.fonts.body,
                  }}>
                  {s.label}
                </button>
              ))}
            </div>
          </div>

          {/* Contact info */}
          <div style={{ marginBottom: tokens.spacing.md }}>
            {sidebarLead.telefono && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
                <Phone size={12} style={{ color: tokens.colors.primary }} />
                <span style={{ fontSize: '12px', color: tokens.colors.textSecondary }}>{sidebarLead.telefono}</span>
              </div>
            )}
            {sidebarLead.email && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
                <Mail size={12} style={{ color: tokens.colors.primary }} />
                <span style={{ fontSize: '12px', color: tokens.colors.textSecondary }}>{sidebarLead.email}</span>
              </div>
            )}
            {sidebarLead.ciudad && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
                <MapPin size={12} style={{ color: tokens.colors.primary }} />
                <span style={{ fontSize: '12px', color: tokens.colors.textSecondary }}>{sidebarLead.ciudad}</span>
              </div>
            )}
          </div>

          {/* Financial info */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', marginBottom: tokens.spacing.md }}>
            <div style={{ padding: '10px', borderRadius: tokens.radius.md, background: tokens.colors.bgHover }}>
              <p style={{ fontSize: '10px', textTransform: 'uppercase', color: tokens.colors.textMuted, margin: 0 }}>Valor</p>
              <p style={{ fontSize: '14px', fontWeight: 700, color: tokens.colors.green, fontFamily: tokens.fonts.heading, margin: '2px 0 0' }}>
                {fmtUSD(sidebarLead.valor_estimado)}
              </p>
            </div>
            <div style={{ padding: '10px', borderRadius: tokens.radius.md, background: tokens.colors.bgHover }}>
              <p style={{ fontSize: '10px', textTransform: 'uppercase', color: tokens.colors.textMuted, margin: 0 }}>Probabilidad</p>
              <p style={{ fontSize: '14px', fontWeight: 700, color: tokens.colors.blue, fontFamily: tokens.fonts.heading, margin: '2px 0 0' }}>
                {sidebarLead.probabilidad}%
              </p>
            </div>
            {sidebarLead.viajes_mes > 0 && (
              <div style={{ padding: '10px', borderRadius: tokens.radius.md, background: tokens.colors.bgHover }}>
                <p style={{ fontSize: '10px', textTransform: 'uppercase', color: tokens.colors.textMuted, margin: 0 }}>Viajes/Mes</p>
                <p style={{ fontSize: '14px', fontWeight: 700, color: tokens.colors.textPrimary, fontFamily: tokens.fonts.heading, margin: '2px 0 0' }}>
                  {sidebarLead.viajes_mes}
                </p>
              </div>
            )}
            {sidebarLead.tarifa > 0 && (
              <div style={{ padding: '10px', borderRadius: tokens.radius.md, background: tokens.colors.bgHover }}>
                <p style={{ fontSize: '10px', textTransform: 'uppercase', color: tokens.colors.textMuted, margin: 0 }}>Tarifa USD</p>
                <p style={{ fontSize: '14px', fontWeight: 700, color: tokens.colors.textPrimary, fontFamily: tokens.fonts.heading, margin: '2px 0 0' }}>
                  {fmtUSD(sidebarLead.tarifa)}
                </p>
              </div>
            )}
          </div>

          {/* Details */}
          <div style={{ marginBottom: tokens.spacing.md }}>
            {sidebarLead.ruta_interes && (
              <div style={{ marginBottom: '8px' }}>
                <p style={{ fontSize: '10px', textTransform: 'uppercase', color: tokens.colors.textMuted, margin: 0 }}>Ruta</p>
                <p style={{ fontSize: '12px', color: tokens.colors.textSecondary, margin: '2px 0 0' }}>{sidebarLead.ruta_interes}</p>
              </div>
            )}
            {sidebarLead.tipo_carga && (
              <div style={{ marginBottom: '8px' }}>
                <p style={{ fontSize: '10px', textTransform: 'uppercase', color: tokens.colors.textMuted, margin: 0 }}>Tipo Carga</p>
                <p style={{ fontSize: '12px', color: tokens.colors.textSecondary, margin: '2px 0 0' }}>{sidebarLead.tipo_carga}</p>
              </div>
            )}
            {sidebarLead.fuente && (
              <div style={{ marginBottom: '8px' }}>
                <p style={{ fontSize: '10px', textTransform: 'uppercase', color: tokens.colors.textMuted, margin: 0 }}>Fuente</p>
                <Badge>{sidebarLead.fuente}</Badge>
              </div>
            )}
            {sidebarLead.ejecutivo_nombre && (
              <div style={{ marginBottom: '8px' }}>
                <p style={{ fontSize: '10px', textTransform: 'uppercase', color: tokens.colors.textMuted, margin: 0 }}>Ejecutivo</p>
                <p style={{ fontSize: '12px', color: tokens.colors.textSecondary, margin: '2px 0 0' }}>{sidebarLead.ejecutivo_nombre}</p>
              </div>
            )}
          </div>

          {/* Notes */}
          {sidebarLead.notas && (
            <div style={{ marginBottom: tokens.spacing.sm }}>
              <p style={{ fontSize: '10px', textTransform: 'uppercase', color: tokens.colors.textMuted, margin: 0 }}>Notas</p>
              <p style={{
                fontSize: '12px', color: tokens.colors.textSecondary,
                marginTop: '4px', padding: '8px', borderRadius: tokens.radius.md,
                background: tokens.colors.bgHover,
              }}>{sidebarLead.notas}</p>
            </div>
          )}

          {sidebarLead.proximos_pasos && (
            <div style={{ marginBottom: tokens.spacing.sm }}>
              <p style={{ fontSize: '10px', textTransform: 'uppercase', color: tokens.colors.textMuted, margin: 0 }}>Próximos Pasos</p>
              <p style={{
                fontSize: '12px', color: tokens.colors.textSecondary,
                marginTop: '4px', padding: '8px', borderRadius: tokens.radius.md,
                background: tokens.colors.bgHover,
              }}>{sidebarLead.proximos_pasos}</p>
            </div>
          )}

          {/* Cotización link */}
          {sidebarLead.cotizacion_url && (
            <a href={sidebarLead.cotizacion_url} target="_blank" rel="noopener noreferrer"
              style={{
                display: 'flex', alignItems: 'center', gap: '8px',
                padding: '8px', borderRadius: tokens.radius.md,
                background: tokens.colors.blueBg, border: '1px solid rgba(59,130,246,0.2)',
                textDecoration: 'none', marginBottom: tokens.spacing.sm,
              }}>
              <FileText size={14} style={{ color: tokens.colors.blue }} />
              <span style={{ fontSize: '12px', fontWeight: 500, color: tokens.colors.blue }}>Ver Cotización PDF</span>
            </a>
          )}

          {/* Actions */}
          <div style={{ display: 'flex', gap: '8px', paddingTop: '8px' }}>
            <button
              onClick={() => {
                if (fileInputRef.current) {
                  fileInputRef.current.dataset.leadId = sidebarLead.id
                  fileInputRef.current.click()
                }
              }}
              disabled={uploading}
              style={{
                flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px',
                fontSize: '12px', padding: '8px', borderRadius: tokens.radius.md, cursor: 'pointer',
                background: tokens.colors.bgHover, border: '1px solid ' + tokens.colors.border,
                color: tokens.colors.textSecondary, fontFamily: tokens.fonts.body,
              }}>
              <Upload size={13} />
              {uploading ? 'Subiendo...' : 'Cotización'}
            </button>
            <button
              onClick={() => handleAIAnalysis(sidebarLead)}
              style={{
                flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px',
                fontSize: '12px', padding: '8px', borderRadius: tokens.radius.md, cursor: 'pointer',
                background: tokens.colors.primaryGlow, border: '1px solid ' + tokens.colors.primary,
                color: tokens.colors.primary, fontFamily: tokens.fonts.body,
              }}>
              <Zap size={13} />
              Análisis IA
            </button>
          </div>

          {/* Timestamps */}
          <div style={{ display: 'flex', justifyContent: 'space-between', paddingTop: '8px' }}>
            <span style={{ fontSize: '10px', color: tokens.colors.textMuted }}>
              Creado: {sidebarLead.fecha_creacion ? new Date(sidebarLead.fecha_creacion).toLocaleDateString('es-MX') : '—'}
            </span>
            <span style={{ fontSize: '10px', color: tokens.colors.textMuted }}>
              Últ. mov: {sidebarLead.fecha_ultimo_mov ? new Date(sidebarLead.fecha_ultimo_mov).toLocaleDateString('es-MX') : '—'}
            </span>
          </div>
        </div>
      </div>
    )
  }

  // ─── RENDER ───────────────────────────────────────────
  return (
    <ModuleLayout
      titulo="Panel de Oportunidades"
      subtitulo="Pipeline de Ventas"
      acciones={
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          {/* View toggle */}
          <div style={{ display: 'flex', gap: '4px' }}>
            <button style={toggleBtnStyle(viewMode === 'kanban')} onClick={() => setViewMode('kanban')}>
              <LayoutGrid size={14} /> Kanban
            </button>
            <button style={toggleBtnStyle(viewMode === 'tabla')} onClick={() => setViewMode('tabla')}>
              <List size={14} /> Tabla
            </button>
          </div>

          {/* Separator */}
          <div style={{ width: '1px', height: '24px', background: tokens.colors.border }} />

          {/* Search */}
          <div style={searchBoxStyle}>
            <Search size={14} style={searchIconStyle} />
            <input
              type="text" placeholder="Buscar lead..."
              value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)}
              style={searchInputStyle}
            />
          </div>

          {/* Filter */}
          {(auth.user?.rol === 'admin' || auth.user?.rol === 'superadmin') && (
            <select value={filteredEjecutivoId} onChange={(e) => setFilteredEjecutivoId(e.target.value)}
              style={filterSelectStyle}>
              <option value="">Todos</option>
              {ejecutivos.map((e) => <option key={e.id} value={e.id}>{e.nombre}</option>)}
            </select>
          )}

          {/* Add Lead Button */}
          <button style={addBtnStyle} onClick={() => setAddLeadOpen(true)}>
            <Plus size={14} /> Nuevo Lead
          </button>
        </div>
      }
    >
      <input ref={fileInputRef} type="file" accept=".pdf"
        onChange={(e) => {
          const file = e.target.files?.[0]
          const leadId = fileInputRef.current?.dataset.leadId
          if (file && leadId) {
            const lead = leads.find((l) => l.id === leadId)
            if (lead) handleUploadCotizacion(lead, file)
          }
        }}
        style={{ display: 'none' }} />

      {/* KPIs */}
      {!loading && (
        <div style={{
          display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)',
          gap: tokens.spacing.sm, marginBottom: tokens.spacing.md,
        }}>
          <KPICard titulo="Total Leads" valor={totalLeads.toString()} color="primary" />
          <KPICard titulo="Valor Pipeline" valor={fmtUSD(totalPipelineValue)} color="green" />
          <KPICard titulo="Win Rate" valor={winRate + '%'} color="blue" />
          <KPICard titulo="Ganados" valor={wonLeads.toString()} color="green" />
        </div>
      )}

      {/* FUNNEL VISUAL */}
      {!loading && renderFunnel()}

      {/* MAIN CONTENT + SIDEBAR */}
      <div style={{ display: 'flex', gap: tokens.spacing.md, minHeight: 0 }}>

        {/* CONTENT AREA */}
        <div style={{ flex: 1, minWidth: 0 }}>
          {loading ? (
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '48px 0' }}>
              <Loader size={32} style={{ color: tokens.colors.textSecondary, animation: 'spin 1s linear infinite' }} />
            </div>
          ) : visibleLeads.length === 0 ? (
            <Card>
              <div style={{ textAlign: 'center', padding: '48px 0' }}>
                <p style={{ fontSize: '18px', fontWeight: 500, color: tokens.colors.textSecondary, margin: 0 }}>No hay leads.</p>
                <p style={{ fontSize: '13px', color: tokens.colors.textMuted, marginTop: '8px' }}>Agrega un nuevo lead para comenzar.</p>
              </div>
            </Card>
          ) : viewMode === 'tabla' ? (
            /* ─── TABLE VIEW ─── */
            <Card noPadding>
              <DataTable
                columns={tableColumns}
                data={visibleLeads}
                onRowClick={(row: Lead) => setSidebarLead(row)}
                emptyMessage="No hay leads con estos filtros"
              />
            </Card>
          ) : (
            /* ─── KANBAN VIEW ─── */
            <div style={{
              display: 'grid',
              gridTemplateColumns: sidebarLead ? 'repeat(4, 1fr)' : 'repeat(6, 1fr)',
              gap: tokens.spacing.sm,
              transition: 'all 0.2s ease',
            }}>
              {(sidebarLead ? PIPELINE_STAGES.slice(0, 4) : PIPELINE_STAGES).map((stage) => {
                const stageLeads = visibleLeads.filter((l) => l.estado === stage.id)
                return (
                  <div key={stage.id}>
                    <div style={{
                      display: 'flex', alignItems: 'center', gap: '8px',
                      marginBottom: '12px', paddingLeft: '4px',
                    }}>
                      <div style={{ width: '10px', height: '10px', borderRadius: '50%', background: stage.color }} />
                      <span style={{
                        fontSize: '11px', fontWeight: 700, textTransform: 'uppercase',
                        letterSpacing: '0.08em', color: tokens.colors.textSecondary,
                        fontFamily: tokens.fonts.heading,
                      }}>{stage.label}</span>
                      <span style={{
                        fontSize: '10px', padding: '2px 8px', borderRadius: tokens.radius.full,
                        background: tokens.colors.bgHover, color: tokens.colors.textMuted, marginLeft: 'auto',
                      }}>{stageLeads.length}</span>
                    </div>
                    <div>
                      {stageLeads.length === 0 ? (
                        <p style={{
                          fontSize: '11px', textAlign: 'center', padding: '24px 0',
                          color: tokens.colors.textMuted,
                        }}>Sin leads</p>
                      ) : (
                        stageLeads.map((lead) => <LeadCard key={lead.id} lead={lead} />)
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>

        {/* SIDEBAR */}
        {renderSidebar()}
      </div>

      {/* ADD LEAD MODAL */}
      <AddLeadModal
        open={addLeadOpen}
        onClose={() => setAddLeadOpen(false)}
        onSaved={() => { setAddLeadOpen(false); fetchLeads() }}
      />

      {/* AI Modal */}
      {aiModalOpen && (
        <div style={{
          position: 'fixed', inset: 0, zIndex: 50,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          background: 'rgba(0,0,0,0.6)',
        }}>
          <div style={{
            maxWidth: '640px', width: '100%', margin: '0 16px',
            borderRadius: tokens.radius.xl, padding: '24px',
            background: tokens.colors.bgCard,
            border: '1px solid ' + tokens.colors.border,
            boxShadow: tokens.effects.cardShadow,
          }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: tokens.spacing.md }}>
              <h3 style={{ margin: 0, fontSize: '18px', fontWeight: 700, color: tokens.colors.textPrimary, fontFamily: tokens.fonts.heading }}>
                Análisis IA
              </h3>
              <button onClick={() => { setAiModalOpen(false); setAiResult(null) }}
                style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '4px', color: tokens.colors.textMuted }}>
                <X size={18} />
              </button>
            </div>
            {aiLoading ? (
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '48px 0' }}>
                <Loader size={32} style={{ color: tokens.colors.primary, animation: 'spin 1s linear infinite' }} />
              </div>
            ) : aiResult ? (
              <div>
                <div style={{ marginBottom: tokens.spacing.md }}>
                  <p style={{ fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: tokens.colors.orange, marginBottom: '8px' }}>
                    Próximos Pasos
                  </p>
                  {aiResult.next_steps.map((s, i) => (
                    <p key={i} style={{ fontSize: '13px', color: tokens.colors.textSecondary, marginBottom: '4px', paddingLeft: '12px', borderLeft: '2px solid ' + tokens.colors.primary }}>
                      {s}
                    </p>
                  ))}
                </div>
                <div style={{ padding: '12px', borderRadius: tokens.radius.md, background: tokens.colors.blueBg, marginBottom: tokens.spacing.md }}>
                  <p style={{ fontSize: '11px', color: tokens.colors.textMuted, margin: 0 }}>Probabilidad Ajustada</p>
                  <p style={{ fontSize: '24px', fontWeight: 700, color: tokens.colors.blue, fontFamily: tokens.fonts.heading, margin: '2px 0 0' }}>
                    {aiResult.adjusted_probability}%
                  </p>
                </div>
                <div style={{ marginBottom: tokens.spacing.md }}>
                  <p style={{ fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: tokens.colors.red, marginBottom: '8px' }}>
                    Objeciones Probables
                  </p>
                  {aiResult.likely_objections.map((o, i) => (
                    <p key={i} style={{ fontSize: '13px', color: tokens.colors.textSecondary, marginBottom: '4px', paddingLeft: '12px', borderLeft: '2px solid ' + tokens.colors.red }}>
                      {o}
                    </p>
                  ))}
                </div>
                <div>
                  <p style={{ fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: tokens.colors.green, marginBottom: '8px' }}>
                    Argumentos de Venta
                  </p>
                  {aiResult.sales_arguments.map((a, i) => (
                    <p key={i} style={{ fontSize: '13px', color: tokens.colors.textSecondary, marginBottom: '4px', paddingLeft: '12px', borderLeft: '2px solid ' + tokens.colors.green }}>
                      {a}
                    </p>
                  ))}
                </div>
              </div>
            ) : (
              <p style={{ color: tokens.colors.textSecondary }}>Error al cargar el análisis.</p>
            )}
            <div style={{ marginTop: '24px', display: 'flex', justifyContent: 'flex-end' }}>
              <button
                onClick={() => { setAiModalOpen(false); setAiResult(null) }}
                style={{
                  padding: '8px 20px', borderRadius: tokens.radius.md,
                  background: 'transparent', color: tokens.colors.textPrimary,
                  border: '1px solid ' + tokens.colors.border, cursor: 'pointer',
                  fontSize: '13px', fontWeight: 500, fontFamily: tokens.fonts.body,
                }}>
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Spin animation */}
      <style>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
    </ModuleLayout>
  )
}
