'use client'


import { useEffect, useState, useRef } from 'react'
import { Upload, Zap, ChevronDown, Loader } from 'lucide-react'
import { ModuleLayout } from '../../components/layout/ModuleLayout'
import { Card } from '../../components/ui/Card'
import { KPICard } from '../../components/ui/KPICard'
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
  estado: string
  ejecutivo_id: string
  ejecutivo_nombre: string
  valor_estimado: number
  probabilidad: number
  fuente: string
  notas: string
  cotizacion_url: string | null
  viajes_mes: number
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
  { id: 'Nuevo', label: 'Nuevo', probability: 10, color: 'bg-blue-500' },
  { id: 'Contactado', label: 'Contactado', probability: 25, color: 'bg-yellow-500' },
  { id: 'Cotizado', label: 'Cotizado', probability: 50, color: 'bg-orange-500' },
  { id: 'Negociacion', label: 'Negociacion', probability: 75, color: 'bg-purple-500' },
  { id: 'Cerrado Ganado', label: 'Cerrado Ganado', probability: 100, color: 'bg-green-500' },
  { id: 'Cerrado Perdido', label: 'Cerrado Perdido', probability: 0, color: 'bg-red-500' },
]

export default function MisLeads() {
  const auth = useAuthContext()
  const [leads, setLeads] = useState<Lead[]>([])
  const [loading, setLoading] = useState(true)
  const [filteredEjecutivoId, setFilteredEjecutivoId] = useState<string>('')
  const [ejecutivos, setEjecutivos] = useState<{ id: string; nombre: string }[]>([])
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null)
  const [aiModalOpen, setAiModalOpen] = useState(false)
  const [aiLoading, setAiLoading] = useState(false)
  const [aiResult, setAiResult] = useState<AIAnalysisResult | null>(null)
  const [uploading, setUploading] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    fetchLeads()
  }, [auth.user?.id])

  const fetchLeads = async () => {
    try {
      setLoading(true)
      let query = supabase.from('leads').select('*')
      if (auth.user?.rol === 'ventas' && auth.user?.id) {
        query = query.eq('ejecutivo_id', auth.user.id)
      }
      const { data, error } = await query
      if (error) {
        console.error('Error fetching leads:', error)
        setLeads([])
        return
      }
      setLeads(data || [])
      const uniqueEjecutivos = Array.from(
        new Map(
          (data || [])
            .filter((lead: Lead) => lead.ejecutivo_id && lead.ejecutivo_nombre)
            .map((lead: Lead) => [lead.ejecutivo_id, { id: lead.ejecutivo_id, nombre: lead.ejecutivo_nombre }])
        ).values()
      )
      setEjecutivos(uniqueEjecutivos)
    } catch (err) {
      console.error('Unexpected error:', err)
      setLeads([])
    } finally {
      setLoading(false)
    }
  }

  const visibleLeads = filteredEjecutivoId
    ? leads.filter((lead) => lead.ejecutivo_id === filteredEjecutivoId)
    : leads

  const calculateDaysSinceActivity = (fechaUltimoMov: string): number => {
    const lastDate = new Date(fechaUltimoMov)
    const today = new Date()
    const diffTime = Math.abs(today.getTime() - lastDate.getTime())
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
    return diffDays
  }

  const formatCurrency = (value: number): string => {
    return new Intl.NumberFormat('es-MX', {
      style: 'currency',
      currency: 'MXN',
    }).format(value)
  }

  const leadsPerStage = PIPELINE_STAGES.map((stage) => ({
    ...stage,
    count: visibleLeads.filter((lead) => lead.estado === stage.id).length,
  }))

  const totalLeads = visibleLeads.length
  const totalPipelineValue = visibleLeads.reduce(
    (sum, lead) => sum + lead.valor_estimado * (lead.probabilidad / 100),
    0
  )

  const handleChangeStage = async (lead: Lead, newStageId: string) => {
    const newStage = PIPELINE_STAGES.find((s) => s.id === newStageId)
    if (!newStage) return
    try {
      const { error } = await supabase
        .from('leads')
        .update({
          estado: newStageId,
          probabilidad: newStage.probability,
          fecha_ultimo_mov: new Date().toISOString(),
        })
        .eq('id', lead.id)
      if (error) throw error
      setLeads(
        leads.map((l) =>
          l.id === lead.id
            ? { ...l, estado: newStageId, probabilidad: newStage.probability, fecha_ultimo_mov: new Date().toISOString() }
            : l
        )
      )
    } catch (err) {
      console.error('Error updating lead stage:', err)
    }
  }

  const handleAIAnalysis = async (lead: Lead) => {
    setSelectedLead(lead)
    setAiModalOpen(true)
    setAiLoading(true)
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
    } catch (err) {
      console.error('Error calling AI analysis:', err)
      setAiResult(null)
    } finally {
      setAiLoading(false)
    }
  }

  const handleUploadCotizacion = async (lead: Lead, file: File) => {
    if (!file) return
    try {
      setUploading(true)
      const fileName = `${lead.id}-${Date.now()}.pdf`
      const { data, error } = await supabase.storage
        .from('cotizaciones')
        .upload(fileName, file, { upsert: true })
      if (error) throw error
      const { data: { publicUrl } } = supabase.storage.from('cotizaciones').getPublicUrl(fileName)
      const { error: updateError } = await supabase
        .from('leads')
        .update({ cotizacion_url: publicUrl, fecha_ultimo_mov: new Date().toISOString() })
        .eq('id', lead.id)
      if (updateError) throw updateError
      setLeads(leads.map((l) => l.id === lead.id ? { ...l, cotizacion_url: publicUrl } : l))
    } catch (err) {
      console.error('Error uploading cotizacion:', err)
    } finally {
      setUploading(false)
      if (fileInputRef.current) fileInputRef.current.value = ''
    }
  }

  const LeadCard = ({ lead }: { lead: Lead }) => {
    const daysSinceActivity = calculateDaysSinceActivity(lead.fecha_ultimo_mov)
    return (
      <div className="bg-white rounded-lg border p-4 mb-3 shadow-sm hover:shadow-md transition-shadow" style={{ borderColor: tokens.colors.border }}>
        <div className="flex items-start justify-between mb-3">
          <div className="flex-1">
            <h4 className="font-semibold text-sm" style={{ color: tokens.colors.textPrimary }}>{lead.empresa}</h4>
            <p className="text-xs" style={{ color: tokens.colors.textSecondary }}>{lead.contacto}</p>
          </div>
          <select value={lead.estado} onChange={(e) => handleChangeStage(lead, e.target.value)} className="text-xs px-2 py-1 rounded border cursor-pointer" style={{ borderColor: tokens.colors.border }}>
            {PIPELINE_STAGES.map((stage) => (<option key={stage.id} value={stage.id}>{stage.label}</option>))}
          </select>
        </div>
        <div className="grid grid-cols-2 gap-2 text-xs mb-3">
          <div><p style={{ color: tokens.colors.textSecondary }}>Valor</p><p className="font-semibold" style={{ color: tokens.colors.textPrimary }}>{formatCurrency(lead.valor_estimado)}</p></div>
          <div><p style={{ color: tokens.colors.textSecondary }}>Probabilidad</p><p className="font-semibold" style={{ color: tokens.colors.textPrimary }}>{lead.probabilidad}%</p></div>
          <div><p style={{ color: tokens.colors.textSecondary }}>D\u00edas sin actividad</p><p className="font-semibold" style={{ color: tokens.colors.textPrimary }}>{daysSinceActivity}</p></div>
          <div><p style={{ color: tokens.colors.textSecondary }}>Ejecutivo</p><p className="font-semibold text-xs" style={{ color: tokens.colors.textPrimary }}>{lead.ejecutivo_nombre}</p></div>
        </div>
        <div className="flex gap-2">
          {(lead.estado === 'Cotizado' || lead.estado === 'Negociacion' || lead.estado === 'Cerrado Ganado' || lead.estado === 'Cerrado Perdido') && (
            <button onClick={() => { if (fileInputRef.current) { fileInputRef.current.dataset.leadId = lead.id; fileInputRef.current.click() } }} disabled={uploading}
              className="flex-1 flex items-center justify-center gap-2 text-xs py-2 px-3 rounded border hover:bg-gray-50 disabled:opacity-50"
              style={{ borderColor: tokens.colors.border }}
            >
              <Upload size={14} />
              {uploading ? 'Subiendo...' : 'Cotizaci\u00f3n'}
            </button>
          )}
          <button
            onClick={() => handleAIAnalysis(lead)}
            className="flex-1 flex items-center justify-center gap-2 text-xs py-2 px-3 rounded border hover:bg-gray-50"
            style={{ borderColor: tokens.colors.border }}
          >
            <Zap size={14} />
            IA
          </button>
        </div>
      </div>
    )
  }

  return (
    <ModuleLayout
      titulo="Mis Leads"
      subtitulo="Pipeline de Ventas"
      acciones={
        auth.user?.rol === 'admin' || auth.user?.rol === 'superadmin' ? (
          <div style={{ minWidth: '200px' }}>
            <select value={filteredEjecutivoId} onChange={(e) => setFilteredEjecutivoId(e.target.value)} className="w-full px-3 py-2 text-sm rounded border" style={{ borderColor: tokens.colors.border }}>
              <option value="">Todos los ejecutivos</option>
              {ejecutivos.map((exec) => (<option key={exec.id} value={exec.id}>{exec.nombre}</option>))}
            </select>
          </div>
        ) : null
      }
    >
      <input ref={fileInputRef} type="file" accept=".pdf" onChange={(e) => { const file = e.target.files?.[0]; const leadId = fileInputRef.current?.dataset.leadId; if (file && leadId) { const lead = leads.find((l) => l.id === leadId); if (lead) handleUploadCotizacion(lead, file) } }} className="hidden" />

      <div className="space-y-6">
        {!loading && (
          <div className="grid grid-cols-4 gap-4">
            <KPICard titulo="Total Leads" valor={totalLeads.toString()} color="primary" />
            <KPICard titulo="Valor Pipeline" valor={formatCurrency(totalPipelineValue)} color="green" />
            {leadsPerStage.slice(0, 2).map((stage) => (<KPICard key={stage.id} titulo={stage.label} valor={stage.count.toString()} color="blue" />))}
          </div>
        )}

        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader className="animate-spin" size={32} style={{ color: tokens.colors.textSecondary }} />
          </div>
        ) : visibleLeads.length === 0 ? (
          <Card>
            <div className="text-center py-12">
              <p className="text-lg font-medium" style={{ color: tokens.colors.textSecondary }}>No hay leads activos.</p>
              <p className="text-sm mt-2" style={{ color: tokens.colors.textSecondary }}>Los leads aparecerán aquí cuando se registren en el sistema.</p>
            </div>
          </Card>
        ) : (
          <div className="grid grid-cols-6 gap-4 auto-cols-fr">
            {PIPELINE_STAGES.map((stage) => {
              const stageLeads = visibleLeads.filter((lead) => lead.estado === stage.id)
              return (
                <Card key={stage.id} className="h-fit">
                  <div className={`${stage.color} h-1 -mx-6 -mt-6 mb-4 rounded-t-lg`} />
                  <div className="mb-4">
                    <h3 className="font-semibold text-sm" style={{ color: tokens.colors.textPrimary }}>{stage.label}</h3>
                    <p className="text-xs" style={{ color: tokens.colors.textSecondary }}>{stageLeads.length} leads \u2022 {stage.probability}%</p>
                  </div>
                  <div className="space-y-2">
                    {stageLeads.length === 0 ? (
                      <p className="text-xs text-center py-4" style={{ color: tokens.colors.textSecondary }}>Sin leads</p>
                    ) : (
                      stageLeads.map((lead) => <LeadCard key={lead.id} lead={lead} />)
                    )}
                  </div>
                </Card>
              )
            })}
          </div>
        )}
      </div>

      {aiModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <Card className="max-w-2xl w-full mx-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold" style={{ color: tokens.colors.textPrimary }}>An\u00e1lisis IA - {selectedLead?.empresa}</h3>
              <button onClick={() => { setAiModalOpen(false); setAiResult(null) }} className="text-xl leading-none">\u00d7</button>
            </div>
            {aiLoading ? (
              <div className="flex items-center justify-center py-12"><Loader className="animate-spin" size={32} style={{ color: tokens.colors.textSecondary }} /></div>
            ) : aiResult ? (
              <div className="space-y-4">
                <div>
                  <h4 className="font-semibold text-sm mb-2" style={{ color: tokens.colors.textPrimary }}>Pr\u00f3ximos Pasos</h4>
                  <ul className="list-disc list-inside text-sm space-y-1" style={{ color: tokens.colors.textSecondary }}>
                    {aiResult.next_steps.map((step, idx) => (<li key={idx}>{step}</li>))}
                  </ul>
                </div>
                <div>
                  <h4 className="font-semibold text-sm mb-2" style={{ color: tokens.colors.textPrimary }}>Probabilidad Ajustada: {aiResult.adjusted_probability}%</h4>
                </div>
                <div>
                  <h4 className="font-semibold text-sm mb-2" style={{ color: tokens.colors.textPrimary }}>         Objeciones Probables
                  </h4>
                  <ul className="list-disc list-inside text-sm space-y-1" style={{ color: tokens.colors.textSecondary }}>
                    {aiResult.likely_objections.map((obj, idx) => (<li key={idx}>{obj}</li>))}
                  </ul>
                </div>
                <div>
                  <h4 className="font-semibold text-sm mb-2" style={{ color: tokens.colors.textPrimary }}>Argumentos de Venta</h4>
                  <ul className="list-disc list-inside text-sm space-y-1" style={{ color: tokens.colors.textSecondary }}>
                    {aiResult.sales_arguments.map((arg, idx) => (<li key={idx}>{arg}</li>))}
                  </ul>
                </div>
              </div>
            ) : (
              <p style={{ color: tokens.colors.textSecondary }}>Error al cargar el an\u00e1lisis</p>
            )}
            <div className="mt-6 flex justify-end">
              <button onClick={() => { setAiModalOpen(false); setAiResult(null) }} className="px-4 py-2 text-sm rounded border hover:bg-gray-50" style={{ borderColor: tokens.colors.border }}>Cerrar</button>
            </div>
          </Card>
        </div>
      )}
    </ModuleLayout>
  )
}
