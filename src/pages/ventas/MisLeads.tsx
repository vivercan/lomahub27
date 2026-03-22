import { useEffect, useState, useRef } from 'react'
import { Upload, Zap, Loader, Search, X, Phone, Mail, MapPin, FileText, ChevronRight, Plus } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { ModuleLayout } from '../../components/layout/ModuleLayout'
import { Card } from '../../components/ui/Card'
import { KPICard } from '../../components/ui/KPICard'
import { Button } from '../../components/ui/Button'
import { Badge } from '../../components/ui/Badge'
import { tokens } from '../../lib/tokens'
import { supabase } from '../../lib/supabase'
import { useAuthContext } from '../../hooks/AuthContext'

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

export default function MisLeads() {
  const auth = useAuthContext()
  const navigate = useNavigate()
  const [leads, setLeads] = useState<Lead[]>([])
  const [loading, setLoading] = useState(true)
  const [filteredEjecutivoId, setFilteredEjecutivoId] = useState<string>('')
  const [ejecutivos, setEjecutivos] = useState<{ id: string; nombre: string }[]>([])
  const [searchTerm, setSearchTerm] = useState('')
  const [sidebarLead, setSidebarLead] = useState<Lead | null>(null)
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

  const fmtUSD = (v: number) => v ? `$${v.toLocaleString('en-US', { minimumFractionDigits: 0 })}` : '$0'

  const leadsPerStage = PIPELINE_STAGES.map((s) => ({
    ...s,
    count: visibleLeads.filter((l) => l.estado === s.id).length,
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
      const fileName = `${lead.id}-${Date.now()}.pdf`
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

  const prioridadBadge = (p: string) => {
    const map: Record<string, 'red' | 'yellow' | 'green' | 'gray'> = { alta: 'red', media: 'yellow', baja: 'green' }
    return p ? <Badge color={map[p] || 'gray'}>{p.charAt(0).toUpperCase() + p.slice(1)}</Badge> : null
  }

  const LeadCard = ({ lead }: { lead: Lead }) => {
    const days = daysSince(lead.fecha_ultimo_mov)
    const stageColor = PIPELINE_STAGES.find((s) => s.id === lead.estado)?.color || tokens.colors.gray
    return (
      <div
        onClick={() => setSidebarLead(lead)}
        className="rounded-lg p-3 mb-2 cursor-pointer transition-all hover:scale-[1.02]"
        style={{
          background: tokens.colors.bgHover,
          border: `1px solid ${sidebarLead?.id === lead.id ? tokens.colors.primary : tokens.colors.border}`,
          boxShadow: sidebarLead?.id === lead.id ? tokens.effects.glowPrimary : 'none',
        }}
      >
        <div className="flex items-start justify-between mb-2">
          <div className="flex-1 min-w-0">
            <p className="font-bold text-xs truncate" style={{ color: tokens.colors.textPrimary, fontFamily: tokens.fonts.heading }}>
              {lead.empresa}
            </p>
            <p className="text-[11px] truncate" style={{ color: tokens.colors.textSecondary }}>{lead.contacto || '—'}</p>
          </div>
          <ChevronRight size={14} style={{ color: tokens.colors.textMuted, flexShrink: 0, marginTop: 2 }} />
        </div>
        <div className="flex items-center justify-between">
          <p className="text-xs font-semibold" style={{ color: stageColor }}>{fmtUSD(lead.valor_estimado)}</p>
          {days > 7 && (
            <span className="text-[10px] px-1.5 py-0.5 rounded" style={{ background: tokens.colors.redBg, color: tokens.colors.red }}>
              {days}d
            </span>
          )}
          {lead.prioridad && days <= 7 && prioridadBadge(lead.prioridad)}
        </div>
      </div>
    )
  }

  return (
    <ModuleLayout
      titulo="Panel de Oportunidades"
      subtitulo="Pipeline de Ventas"
      acciones={
        <div className="flex items-center gap-3">
          <div className="relative">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: tokens.colors.textMuted }} />
            <input
              type="text" placeholder="Buscar lead..."
              value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-8 pr-3 py-1.5 text-xs rounded-lg outline-none"
              style={{
                background: tokens.colors.bgHover, border: `1px solid ${tokens.colors.border}`,
                color: tokens.colors.textPrimary, fontFamily: tokens.fonts.body, width: 200,
              }}
            />
          </div>
          {(auth.user?.rol === 'admin' || auth.user?.rol === 'superadmin') && (
            <select value={filteredEjecutivoId} onChange={(e) => setFilteredEjecutivoId(e.target.value)}
              className="px-3 py-1.5 text-xs rounded-lg border outline-none"
              style={{ background: tokens.colors.bgHover, borderColor: tokens.colors.border, color: tokens.colors.textPrimary }}>
              <option value="">Todos</option>
              {ejecutivos.map((e) => <option key={e.id} value={e.id}>{e.nombre}</option>)}
            </select>
          )}
          <Button variant="primary" onClick={() => navigate('/ventas/nuevo-lead')}>
            <Plus size={14} /> Nuevo Lead
          </Button>
        </div>
      }
    >
      <input ref={fileInputRef} type="file" accept=".pdf" onChange={(e) => {
        const file = e.target.files?.[0]
        const leadId = fileInputRef.current?.dataset.leadId
        if (file && leadId) { const lead = leads.find((l) => l.id === leadId); if (lead) handleUploadCotizacion(lead, file) }
      }} className="hidden" />

      {/* KPIs */}
      {!loading && (
        <div className="grid grid-cols-4 gap-3 mb-4">
          <KPICard titulo="Total Leads" valor={totalLeads.toString()} color="primary" />
          <KPICard titulo="Valor Pipeline" valor={fmtUSD(totalPipelineValue)} color="green" />
          <KPICard titulo="Win Rate" valor={`${winRate}%`} color="blue" />
          <KPICard titulo="Ganados" valor={wonLeads.toString()} color="green" />
        </div>
      )}

      {/* KANBAN + SIDEBAR */}
      <div className="flex gap-4" style={{ minHeight: 0 }}>
        {/* KANBAN COLUMNS */}
        <div className={`flex-1 grid gap-3 transition-all ${sidebarLead ? 'grid-cols-4' : 'grid-cols-6'}`}>
          {loading ? (
            <div className="col-span-6 flex items-center justify-center py-12">
              <Loader className="animate-spin" size={32} style={{ color: tokens.colors.textSecondary }} />
            </div>
          ) : visibleLeads.length === 0 ? (
            <div className="col-span-6">
              <Card>
                <div className="text-center py-12">
                  <p className="text-lg font-medium" style={{ color: tokens.colors.textSecondary }}>No hay leads.</p>
                  <p className="text-sm mt-2" style={{ color: tokens.colors.textMuted }}>Agrega un nuevo lead para comenzar.</p>
                </div>
              </Card>
            </div>
          ) : (
            (sidebarLead ? PIPELINE_STAGES.slice(0, 4) : PIPELINE_STAGES).map((stage) => {
              const stageLeads = visibleLeads.filter((l) => l.estado === stage.id)
              return (
                <div key={stage.id}>
                  <div className="flex items-center gap-2 mb-3 px-1">
                    <div className="w-2.5 h-2.5 rounded-full" style={{ background: stage.color }} />
                    <p className="text-xs font-bold uppercase tracking-wider" style={{ color: tokens.colors.textSecondary, fontFamily: tokens.fonts.heading }}>
                      {stage.label}
                    </p>
                    <span className="text-[10px] px-1.5 py-0.5 rounded-full ml-auto" style={{ background: tokens.colors.bgHover, color: tokens.colors.textMuted }}>
                      {stageLeads.length}
                    </span>
                  </div>
                  <div className="space-y-0">
                    {stageLeads.length === 0 ? (
                      <p className="text-[11px] text-center py-6" style={{ color: tokens.colors.textMuted }}>Sin leads</p>
                    ) : (
                      stageLeads.map((lead) => <LeadCard key={lead.id} lead={lead} />)
                    )}
                  </div>
                </div>
              )
            })
          )}
        </div>

        {/* SIDEBAR SLIDE-IN */}
        {sidebarLead && (
          <div
            className="rounded-xl overflow-hidden flex-shrink-0"
            style={{
              width: 360,
              background: tokens.colors.bgCard,
              border: `1px solid ${tokens.colors.border}`,
              boxShadow: tokens.effects.cardShadow,
            }}
          >
            {/* Header */}
            <div className="p-4 flex items-start justify-between" style={{ borderBottom: `1px solid ${tokens.colors.border}` }}>
              <div className="flex-1 min-w-0">
                <p className="font-bold text-base truncate" style={{ color: tokens.colors.textPrimary, fontFamily: tokens.fonts.heading }}>
                  {sidebarLead.empresa}
                </p>
                <p className="text-xs mt-0.5" style={{ color: tokens.colors.textSecondary }}>{sidebarLead.contacto || '—'}</p>
              </div>
              <button onClick={() => setSidebarLead(null)} className="p-1 rounded hover:bg-opacity-20" style={{ color: tokens.colors.textMuted }}>
                <X size={16} />
              </button>
            </div>

            {/* Body */}
            <div className="p-4 space-y-4">
              {/* Stage selector */}
              <div>
                <p className="text-[10px] uppercase tracking-widest font-bold mb-2" style={{ color: tokens.colors.orange, fontFamily: tokens.fonts.heading }}>
                  Etapa
                </p>
                <div className="flex flex-wrap gap-1.5">
                  {PIPELINE_STAGES.map((s) => (
                    <button key={s.id} onClick={() => handleChangeStage(sidebarLead, s.id)}
                      className="px-2.5 py-1 rounded-full text-[11px] font-medium transition-all"
                      style={{
                        background: sidebarLead.estado === s.id ? s.color : tokens.colors.bgHover,
                        color: sidebarLead.estado === s.id ? '#fff' : tokens.colors.textSecondary,
                        border: `1px solid ${sidebarLead.estado === s.id ? s.color : tokens.colors.border}`,
                      }}>
                      {s.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Contact info */}
              <div className="space-y-2">
                {sidebarLead.telefono && (
                  <div className="flex items-center gap-2">
                    <Phone size={12} style={{ color: tokens.colors.primary }} />
                    <p className="text-xs" style={{ color: tokens.colors.textSecondary }}>{sidebarLead.telefono}</p>
                  </div>
                )}
                {sidebarLead.email && (
                  <div className="flex items-center gap-2">
                    <Mail size={12} style={{ color: tokens.colors.primary }} />
                    <p className="text-xs" style={{ color: tokens.colors.textSecondary }}>{sidebarLead.email}</p>
                  </div>
                )}
                {sidebarLead.ciudad && (
                  <div className="flex items-center gap-2">
                    <MapPin size={12} style={{ color: tokens.colors.primary }} />
                    <p className="text-xs" style={{ color: tokens.colors.textSecondary }}>{sidebarLead.ciudad}</p>
                  </div>
                )}
              </div>

              {/* Financial info */}
              <div className="grid grid-cols-2 gap-2">
                <div className="p-2.5 rounded-lg" style={{ background: tokens.colors.bgHover }}>
                  <p className="text-[10px] uppercase" style={{ color: tokens.colors.textMuted }}>Valor</p>
                  <p className="text-sm font-bold" style={{ color: tokens.colors.green, fontFamily: tokens.fonts.heading }}>
                    {fmtUSD(sidebarLead.valor_estimado)}
                  </p>
                </div>
                <div className="p-2.5 rounded-lg" style={{ background: tokens.colors.bgHover }}>
                  <p className="text-[10px] uppercase" style={{ color: tokens.colors.textMuted }}>Probabilidad</p>
                  <p className="text-sm font-bold" style={{ color: tokens.colors.blue, fontFamily: tokens.fonts.heading }}>
                    {sidebarLead.probabilidad}%
                  </p>
                </div>
                {sidebarLead.viajes_mes > 0 && (
                  <div className="p-2.5 rounded-lg" style={{ background: tokens.colors.bgHover }}>
                    <p className="text-[10px] uppercase" style={{ color: tokens.colors.textMuted }}>Viajes/Mes</p>
                    <p className="text-sm font-bold" style={{ color: tokens.colors.textPrimary, fontFamily: tokens.fonts.heading }}>
                      {sidebarLead.viajes_mes}
                    </p>
                  </div>
                )}
                {sidebarLead.tarifa > 0 && (
                  <div className="p-2.5 rounded-lg" style={{ background: tokens.colors.bgHover }}>
                    <p className="text-[10px] uppercase" style={{ color: tokens.colors.textMuted }}>Tarifa USD</p>
                    <p className="text-sm font-bold" style={{ color: tokens.colors.textPrimary, fontFamily: tokens.fonts.heading }}>
                      {fmtUSD(sidebarLead.tarifa)}
                    </p>
                  </div>
                )}
              </div>

              {/* Details */}
              <div className="space-y-2">
                {sidebarLead.ruta_interes && (
                  <div>
                    <p className="text-[10px] uppercase" style={{ color: tokens.colors.textMuted }}>Ruta</p>
                    <p className="text-xs" style={{ color: tokens.colors.textSecondary }}>{sidebarLead.ruta_interes}</p>
                  </div>
                )}
                {sidebarLead.tipo_carga && (
                  <div>
                    <p className="text-[10px] uppercase" style={{ color: tokens.colors.textMuted }}>Tipo Carga</p>
                    <p className="text-xs" style={{ color: tokens.colors.textSecondary }}>{sidebarLead.tipo_carga}</p>
                  </div>
                )}
                {sidebarLead.fuente && (
                  <div>
                    <p className="text-[10px] uppercase" style={{ color: tokens.colors.textMuted }}>Fuente</p>
                    <Badge>{sidebarLead.fuente}</Badge>
                  </div>
                )}
                {sidebarLead.ejecutivo_nombre && (
                  <div>
                    <p className="text-[10px] uppercase" style={{ color: tokens.colors.textMuted }}>Ejecutivo</p>
                    <p className="text-xs" style={{ color: tokens.colors.textSecondary }}>{sidebarLead.ejecutivo_nombre}</p>
                  </div>
                )}
              </div>

              {/* Notes */}
              {sidebarLead.notas && (
                <div>
                  <p className="text-[10px] uppercase" style={{ color: tokens.colors.textMuted }}>Notas</p>
                  <p className="text-xs mt-1 p-2 rounded-lg" style={{ color: tokens.colors.textSecondary, background: tokens.colors.bgHover }}>
                    {sidebarLead.notas}
                  </p>
                </div>
              )}

              {sidebarLead.proximos_pasos && (
                <div>
                  <p className="text-[10px] uppercase" style={{ color: tokens.colors.textMuted }}>Próximos Pasos</p>
                  <p className="text-xs mt-1 p-2 rounded-lg" style={{ color: tokens.colors.textSecondary, background: tokens.colors.bgHover }}>
                    {sidebarLead.proximos_pasos}
                  </p>
                </div>
              )}

              {/* Cotización link */}
              {sidebarLead.cotizacion_url && (
                <a href={sidebarLead.cotizacion_url} target="_blank" rel="noopener noreferrer"
                  className="flex items-center gap-2 p-2 rounded-lg transition-colors"
                  style={{ background: tokens.colors.blueBg, border: `1px solid ${tokens.colors.blue}33` }}>
                  <FileText size={14} style={{ color: tokens.colors.blue }} />
                  <p className="text-xs font-medium" style={{ color: tokens.colors.blue }}>Ver Cotización PDF</p>
                </a>
              )}

              {/* Actions */}
              <div className="flex gap-2 pt-2">
                <button
                  onClick={() => { if (fileInputRef.current) { fileInputRef.current.dataset.leadId = sidebarLead.id; fileInputRef.current.click() } }}
                  disabled={uploading}
                  className="flex-1 flex items-center justify-center gap-2 text-xs py-2 rounded-lg transition-colors"
                  style={{ background: tokens.colors.bgHover, border: `1px solid ${tokens.colors.border}`, color: tokens.colors.textSecondary }}>
                  <Upload size={13} />
                  {uploading ? 'Subiendo...' : 'Cotización'}
                </button>
                <button
                  onClick={() => handleAIAnalysis(sidebarLead)}
                  className="flex-1 flex items-center justify-center gap-2 text-xs py-2 rounded-lg transition-colors"
                  style={{ background: tokens.colors.primaryGlow, border: `1px solid ${tokens.colors.primary}`, color: tokens.colors.primary }}>
                  <Zap size={13} />
                  Análisis IA
                </button>
              </div>

              {/* Timestamps */}
              <div className="flex justify-between pt-1">
                <p className="text-[10px]" style={{ color: tokens.colors.textMuted }}>
                  Creado: {sidebarLead.fecha_creacion ? new Date(sidebarLead.fecha_creacion).toLocaleDateString('es-MX') : '—'}
                </p>
                <p className="text-[10px]" style={{ color: tokens.colors.textMuted }}>
                  Últ. mov: {sidebarLead.fecha_ultimo_mov ? new Date(sidebarLead.fecha_ultimo_mov).toLocaleDateString('es-MX') : '—'}
                </p>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* AI Modal */}
      {aiModalOpen && (
        <div className="fixed inset-0 flex items-center justify-center z-50" style={{ background: 'rgba(0,0,0,0.6)' }}>
          <div className="max-w-2xl w-full mx-4 rounded-xl p-6" style={{ background: tokens.colors.bgCard, border: `1px solid ${tokens.colors.border}`, boxShadow: tokens.effects.cardShadow }}>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold" style={{ color: tokens.colors.textPrimary, fontFamily: tokens.fonts.heading }}>Análisis IA</h3>
              <button onClick={() => { setAiModalOpen(false); setAiResult(null) }} className="p-1 rounded" style={{ color: tokens.colors.textMuted }}>
                <X size={18} />
              </button>
            </div>
            {aiLoading ? (
              <div className="flex items-center justify-center py-12">
                <Loader className="animate-spin" size={32} style={{ color: tokens.colors.primary }} />
              </div>
            ) : aiResult ? (
              <div className="space-y-4">
                <div>
                  <p className="text-xs font-bold uppercase tracking-wider mb-2" style={{ color: tokens.colors.orange }}>Próximos Pasos</p>
                  {aiResult.next_steps.map((s, i) => (
                    <p key={i} className="text-sm mb-1 pl-3" style={{ color: tokens.colors.textSecondary, borderLeft: `2px solid ${tokens.colors.primary}` }}>{s}</p>
                  ))}
                </div>
                <div className="p-3 rounded-lg" style={{ background: tokens.colors.blueBg }}>
                  <p className="text-xs" style={{ color: tokens.colors.textMuted }}>Probabilidad Ajustada</p>
                  <p className="text-2xl font-bold" style={{ color: tokens.colors.blue, fontFamily: tokens.fonts.heading }}>{aiResult.adjusted_probability}%</p>
                </div>
                <div>
                  <p className="text-xs font-bold uppercase tracking-wider mb-2" style={{ color: tokens.colors.red }}>Objeciones Probables</p>
                  {aiResult.likely_objections.map((o, i) => (
                    <p key={i} className="text-sm mb-1 pl-3" style={{ color: tokens.colors.textSecondary, borderLeft: `2px solid ${tokens.colors.red}` }}>{o}</p>
                  ))}
                </div>
                <div>
                  <p className="text-xs font-bold uppercase tracking-wider mb-2" style={{ color: tokens.colors.green }}>Argumentos de Venta</p>
                  {aiResult.sales_arguments.map((a, i) => (
                    <p key={i} className="text-sm mb-1 pl-3" style={{ color: tokens.colors.textSecondary, borderLeft: `2px solid ${tokens.colors.green}` }}>{a}</p>
                  ))}
                </div>
              </div>
            ) : (
              <p style={{ color: tokens.colors.textSecondary }}>Error al cargar el análisis.</p>
            )}
            <div className="mt-6 flex justify-end">
              <Button variant="secondary" onClick={() => { setAiModalOpen(false); setAiResult(null) }}>Cerrar</Button>
            </div>
          </div>
        </div>
      )}
    </ModuleLayout>
  )
}
