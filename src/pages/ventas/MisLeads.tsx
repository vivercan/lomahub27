import type { ReactElement } from 'react'
import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Search, ChevronDown, Trash2, Filter, Download, Plus, MoreHorizontal,
  Loader, ExternalLink, Edit3, Zap, Upload, ArrowUpDown, X, RotateCcw, FileText, LayoutGrid, List
} from 'lucide-react'
import { tokens } from '../../lib/tokens'
import { ModuleLayout } from '../../components/layout/ModuleLayout'
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
  fecha_creacion: string
  fecha_ultimo_mov: string
  eliminado?: boolean
}

interface AnalysisResult {
  resumen: string
  monto_detectado: number
  moneda: string
  vigencia: string
  etapa_sugerida: string
  confianza: number
  notas: string
}

const PIPELINE_STAGES = [
  { id: 'Nuevo', label: 'Nuevo', color: tokens.colors.blue },
  { id: 'Contactado', label: 'Contactado', color: tokens.colors.yellow },
  { id: 'Cotizado', label: 'Cotizado', color: tokens.colors.orange },
  { id: 'Negociacion', label: 'Negociación', color: '#A855F7' },
  { id: 'Cerrado Ganado', label: 'Cerrado Ganado', color: tokens.colors.green },
  { id: 'Cerrado Perdido', label: 'Cerrado Perdido', color: tokens.colors.red },
]

const STAGE_MAP = Object.fromEntries(PIPELINE_STAGES.map(s => [s.id, s]))

export default function MisLeads() {
  const navigate = useNavigate()
  const { user } = useAuthContext()
  const [leads, setLeads] = useState<Lead[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [filteredEjecutivo, setFilteredEjecutivo] = useState<string[]>([])
  const [showEjDropdown, setShowEjDropdown] = useState(false)
  const [viewMode, setViewMode] = useState<'table' | 'kanban'>('table')
  const [ejecutivos, setEjecutivos] = useState<{ id: string; nombre: string }[]>([])
  const [showDeleted, setShowDeleted] = useState(false)
    const [sortField, setSortField] = useState<string>('fecha_creacion')
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('desc')
  const [actionsOpen, setActionsOpen] = useState<string | null>(null)
  const [selectedLeads, setSelectedLeads] = useState<Set<string>>(new Set())
  const fileInputRef = useRef<HTMLInputElement>(null)
  const ejDropdownRef = useRef<HTMLDivElement>(null)

  // New state for quotation analysis
  const [analyzingLead, setAnalyzingLead] = useState<Lead | null>(null)
  const [analyzing, setAnalyzing] = useState(false)
  const [analysisResult, setAnalysisResult] = useState<AnalysisResult | null>(null)

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (ejDropdownRef.current && !ejDropdownRef.current.contains(e.target as Node)) {
        setShowEjDropdown(false)
      }
    }
    if (showEjDropdown) {
      document.addEventListener('mousedown', handleClickOutside)
    }
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [showEjDropdown])

  useEffect(() => {
    fetchLeads()
  }, [user?.id])

  const fetchLeads = async () => {
    try {
      setLoading(true)
      let query = supabase.from('leads').select('*')
      if (user?.rol === 'ventas' && user?.id) {
        query = query.eq('ejecutivo_id', user.id)
      }
      const { data, error } = await query
      if (error) { console.error('Error fetching leads:', error); setLeads([]); return }
      setLeads(data || [])
      // Fetch vendedores desde usuarios_autorizados
      const { data: usuariosData } = await supabase
        .from('usuarios_autorizados')
        .select('id, nombre, email, rol')
        .eq('activo', true)
        .in('rol', ['ventas', 'superadmin'])
        .order('nombre', { ascending: true })
      setEjecutivos((usuariosData || []).map((u: any) => ({ id: u.id, nombre: u.nombre && u.nombre.trim() ? u.nombre : (u.email ? u.email.split('@')[0].split(/[._-]/).map((w: string) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase()).join(' ') : 'Sin nombre') })))
    } catch (err) {
      console.error('Unexpected error:', err)
      setLeads([])
    } finally {
      setLoading(false)
    }
  }

  const formatCurrency = (v: number): string => {
    if (!v) return '$0'
    return new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN', maximumFractionDigits: 0 }).format(v)
  }

  const formatDate = (d: string): string => {
    if (!d) return '—'
    const date = new Date(d)
    return date.toLocaleDateString('es-MX', { day: '2-digit', month: 'short', year: '2-digit' })
  }

  const handleSort = (field: string) => {
    if (sortField === field) {
      setSortDir(sortDir === 'asc' ? 'desc' : 'asc')
    } else {
      setSortField(field)
      setSortDir('asc')
    }
  }

  const handleSoftDelete = async (lead: Lead) => {
    try {
      const { error } = await supabase.from('leads').update({ eliminado: true }).eq('id', lead.id)
      if (error) throw error
      setLeads(leads.map(l => l.id === lead.id ? { ...l, eliminado: true } : l))
    } catch (err) {
      console.error('Error deleting lead:', err)
    }
    setActionsOpen(null)
  }

  const handleRestore = async (lead: Lead) => {
    try {
      const { error } = await supabase.from('leads').update({ eliminado: false }).eq('id', lead.id)
      if (error) throw error
      setLeads(leads.map(l => l.id === lead.id ? { ...l, eliminado: false } : l))
    } catch (err) {
      console.error('Error restoring lead:', err)
    }
    setActionsOpen(null)
  }

  const handleChangeStage = async (lead: Lead, newStageId: string) => {
    try {
      const { error } = await supabase
        .from('leads')
        .update({ estado: newStageId, fecha_ultimo_mov: new Date().toISOString() })
        .eq('id', lead.id)
      if (error) throw error
      setLeads(leads.map(l => l.id === lead.id ? { ...l, estado: newStageId, fecha_ultimo_mov: new Date().toISOString() } : l))
    } catch (err) {
      console.error('Error updating lead stage:', err)
    }
  }

  const handleAttachQuotation = (lead: Lead) => {
    setAnalyzingLead(lead)
    fileInputRef.current?.click()
    setActionsOpen(null)
  }

  const handleFileSelected = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file || !analyzingLead) {
      setAnalyzingLead(null)
      return
    }

    if (file.type !== 'application/pdf') {
      alert('Por favor selecciona un archivo PDF')
      setAnalyzingLead(null)
      return
    }

    try {
      setAnalyzing(true)
      setAnalysisResult(null)

      // Read file as base64
      const reader = new FileReader()
      reader.onload = async (e) => {
        const base64Content = (e.target?.result as string)?.split(',')[1] || ''

        try {
          // Call Supabase Edge Function
          const { data, error } = await supabase.functions.invoke('analisis-cotizacion', {
            body: {
              file_base64: base64Content,
              filename: file.name,
              lead_id: analyzingLead.id,
              lead_empresa: analyzingLead.empresa,
            },
          })

          if (error) {
            console.error('Error invoking analysis function:', error)
            alert('Error al analizar la cotización. Intenta de nuevo.')
            setAnalyzing(false)
            setAnalyzingLead(null)
            return
          }

          if (data) {
            setAnalysisResult(data)
          }
        } catch (err) {
          console.error('Error calling analysis function:', err)
          alert('Error al analizar la cotización.')
          setAnalyzing(false)
          setAnalyzingLead(null)
        } finally {
          setAnalyzing(false)
        }
      }

      reader.readAsDataURL(file)
    } catch (err) {
      console.error('Error reading file:', err)
      alert('Error al leer el archivo.')
      setAnalyzing(false)
      setAnalyzingLead(null)
    }

    // Reset input
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  const handleAcceptAnalysis = async () => {
    if (!analyzingLead || !analysisResult) return

    try {
      const timestamp = new Date().toISOString()
      const { error } = await supabase
        .from('leads')
        .update({
          estado: analysisResult.etapa_sugerida,
          cotizacion_url: analysisResult.resumen, // Store summary or use a filename if available
          fecha_ultimo_mov: timestamp,
        })
        .eq('id', analyzingLead.id)

      if (error) throw error

      // Update local state
      setLeads(leads.map(l =>
        l.id === analyzingLead.id
          ? {
              ...l,
              estado: analysisResult.etapa_sugerida,
              cotizacion_url: analysisResult.resumen,
              fecha_ultimo_mov: timestamp,
            }
          : l
      ))

      // Close modal
      setAnalyzingLead(null)
      setAnalysisResult(null)
    } catch (err) {
      console.error('Error accepting analysis:', err)
      alert('Error al actualizar el lead.')
    }
  }

  const handleCloseAnalysis = () => {
    setAnalyzingLead(null)
    setAnalysisResult(null)
  }

  const handleExportCSV = () => {
    const headers = ['#', 'Empresa', 'Etapa', 'Contacto', 'Servicio', 'Viaje', '$ Potencial', 'Vendedor', 'Creado']
    const rows = filteredLeads.map((l, i) => [
      i + 1, l.empresa, l.estado, l.contacto, l.tipo_carga || '', l.tipo_viaje || '',
      l.proyectado_usd || l.valor_estimado || 0, l.ejecutivo_nombre, formatDate(l.fecha_creacion)
    ])
    const csv = [headers.join(','), ...rows.map(r => r.map(c => `"${c}"`).join(','))].join('\n')
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `panel_oportunidades_${new Date().toISOString().slice(0, 10)}.csv`
    a.click()
    URL.revokeObjectURL(url)
  }

  // Filter logic
  let filteredLeads = leads.filter(l => showDeleted ? l.eliminado === true : !l.eliminado)
  if (searchTerm) {
    const term = searchTerm.toLowerCase()
    filteredLeads = filteredLeads.filter(l =>
      l.empresa?.toLowerCase().includes(term) ||
      l.contacto?.toLowerCase().includes(term) ||
      l.ejecutivo_nombre?.toLowerCase().includes(term) ||
      l.ciudad?.toLowerCase().includes(term)
    )
  }
  if (filteredEjecutivo.length > 0) {
    filteredLeads = filteredLeads.filter(l => filteredEjecutivo.includes(l.ejecutivo_nombre))
  }

  // Sort
  filteredLeads = [...filteredLeads].sort((a, b) => {
    let aVal: any = (a as any)[sortField]
    let bVal: any = (b as any)[sortField]
    if (sortField === 'fecha_creacion') {
      aVal = new Date(aVal || 0).getTime()
      bVal = new Date(bVal || 0).getTime()
    }
    if (typeof aVal === 'string') aVal = aVal.toLowerCase()
    if (typeof bVal === 'string') bVal = bVal.toLowerCase()
    if (aVal < bVal) return sortDir === 'asc' ? -1 : 1
    if (aVal > bVal) return sortDir === 'asc' ? 1 : -1
    return 0
  })
  const totalActive = leads.filter(l => !l.eliminado).length
  const totalValue = leads.filter(l => !l.eliminado).reduce((sum, l) => sum + (l.proyectado_usd || l.valor_estimado || 0), 0)

  // Styles
  const s = {
    page: {
      display: 'flex',
      flexDirection: 'column' as const,
      height: '100vh',
      background: tokens.colors.bgMain,
      fontFamily: tokens.fonts.body,
      overflow: 'hidden',
    },
    header: {
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      padding: '16px 24px',
      borderBottom: `1px solid ${tokens.colors.border}`,
      background: tokens.colors.bgCard,
      flexShrink: 0,
    },
    title: {
      fontFamily: tokens.fonts.heading,
      fontSize: '18px',
      fontWeight: 700,
      color: tokens.colors.textPrimary,
      letterSpacing: '0.05em',
      textTransform: 'uppercase' as const,
    },
    subtitle: {
      fontSize: '12px',
      color: tokens.colors.textMuted,
      fontFamily: tokens.fonts.body,
      marginTop: '2px',
    },
    toolbar: {
      display: 'flex',
      alignItems: 'center',
      gap: '10px',
      padding: '12px 24px',
      borderBottom: `1px solid ${tokens.colors.border}`,
      background: tokens.colors.bgCard,
      flexShrink: 0,
    },
    searchBox: {
      display: 'flex',
      alignItems: 'center',
      gap: '8px',
      padding: '8px 12px',
      borderRadius: tokens.radius.md,
      border: `1px solid ${tokens.colors.border}`,
      background: tokens.colors.bgHover,
      flex: 1,
      maxWidth: '320px',
    },
    searchInput: {
      background: 'transparent',
      border: 'none',
      outline: 'none',
      color: tokens.colors.textPrimary,
      fontSize: '13px',
      fontFamily: tokens.fonts.body,
      width: '100%',
    },
    toolbarBtn: {
      display: 'flex',
      alignItems: 'center',
      gap: '6px',
      padding: '8px 14px',
      borderRadius: tokens.radius.md,
      border: `1px solid ${tokens.colors.border}`,
      background: tokens.colors.bgHover,
      color: tokens.colors.textSecondary,
      fontSize: '13px',
      fontFamily: tokens.fonts.body,
      cursor: 'pointer',
      transition: 'all 0.15s',
      whiteSpace: 'nowrap' as const,
    },
    toolbarBtnActive: {
      display: 'flex',
      alignItems: 'center',
      gap: '6px',
      padding: '8px 14px',
      borderRadius: tokens.radius.md,
      border: `1px solid ${tokens.colors.primary}`,
      background: `${tokens.colors.primary}22`,
      color: tokens.colors.primary,
      fontSize: '13px',
      fontFamily: tokens.fonts.body,
      cursor: 'pointer',
      transition: 'all 0.15s',
      whiteSpace: 'nowrap' as const,
    },
    addBtn: {
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
    selectDropdown: {
      padding: '8px 12px',
      borderRadius: tokens.radius.md,
      border: `1px solid ${tokens.colors.border}`,
      background: tokens.colors.bgHover,
      color: tokens.colors.textSecondary,
      fontSize: '13px',
      fontFamily: tokens.fonts.body,
      cursor: 'pointer',
      outline: 'none',
      appearance: 'none' as const,
      minWidth: '160px',
    },
    tableWrap: {
      flex: 1,
      overflow: 'auto',
      padding: '0',
    },
    table: {
      width: '100%',
      borderCollapse: 'collapse' as const,
      minWidth: '1100px',
    },
    th: {
      padding: '10px 14px',
      textAlign: 'left' as const,
      fontSize: '11px',
      fontWeight: 700,
      color: tokens.colors.textMuted,
      textTransform: 'uppercase' as const,
      letterSpacing: '0.06em',
      fontFamily: tokens.fonts.body,
      borderBottom: `1px solid ${tokens.colors.border}`,
      background: tokens.colors.bgCard,
      position: 'sticky' as const,
      top: 0,
      zIndex: 10,
      cursor: 'pointer',
      userSelect: 'none' as const,
      whiteSpace: 'nowrap' as const,
    },
    td: {
      padding: '10px 14px',
      fontSize: '13px',
      color: tokens.colors.textPrimary,
      fontFamily: tokens.fonts.body,
      borderBottom: `1px solid ${tokens.colors.border}`,
      whiteSpace: 'nowrap' as const,
      overflow: 'hidden',
      textOverflow: 'ellipsis',
      maxWidth: '200px',
    },
    tdMuted: {
      padding: '10px 14px',
      fontSize: '13px',
      color: tokens.colors.textSecondary,
      fontFamily: tokens.fonts.body,
      borderBottom: `1px solid ${tokens.colors.border}`,
      whiteSpace: 'nowrap' as const,
    },
    row: {
      transition: 'background 0.15s',
      cursor: 'pointer',
    },
    stageBadge: (color: string) => ({
      display: 'inline-flex',
      alignItems: 'center',
      gap: '6px',
      padding: '3px 10px',
      borderRadius: tokens.radius.full,
      fontSize: '11px',
      fontWeight: 600,
      fontFamily: tokens.fonts.body,
      color: '#fff',
      background: color,
      border: 'none',
      whiteSpace: 'nowrap' as const,
    }),
    dot: (color: string) => ({
      width: '6px',
      height: '6px',
      borderRadius: '50%',
      background: color,
      flexShrink: 0,
    }),
    actionBtn: {
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      width: '28px',
      height: '28px',
      borderRadius: tokens.radius.sm,
      border: 'none',
      background: 'transparent',
      color: tokens.colors.textMuted,
      cursor: 'pointer',
      transition: 'all 0.15s',
    },
    actionsMenu: {
      position: 'absolute' as const,
      right: '14px',
      top: '100%',
      marginTop: '4px',
      background: tokens.colors.bgCard,
      border: `1px solid ${tokens.colors.border}`,
      borderRadius: tokens.radius.md,
      boxShadow: tokens.effects.cardShadow,
      zIndex: 50,
      minWidth: '180px',
      overflow: 'hidden',
    },
    actionsMenuItem: {
      display: 'flex',
      alignItems: 'center',
      gap: '8px',
      width: '100%',
      padding: '8px 14px',
      border: 'none',
      background: 'transparent',
      color: tokens.colors.textSecondary,
      fontSize: '12px',
      fontFamily: tokens.fonts.body,
      cursor: 'pointer',
    },
    footer: {
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      padding: '10px 24px',
      borderTop: `1px solid ${tokens.colors.border}`,
      background: tokens.colors.bgCard,
      flexShrink: 0,
    },
    footerText: {
      fontSize: '12px',
      color: tokens.colors.textMuted,
      fontFamily: tokens.fonts.body,
    },
    analysisOverlay: {
      position: 'fixed' as const,
      inset: 0,
      background: 'rgba(0,0,0,0.6)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 100,
    },
    analysisCard: {
      background: tokens.colors.bgCard,
      border: `1px solid ${tokens.colors.border}`,
      borderRadius: tokens.radius.lg,
      padding: '28px',
      width: '540px',
      maxWidth: '90vw',
      boxShadow: tokens.effects.cardShadow,
    },
    analysisTitle: {
      fontFamily: tokens.fonts.heading,
      fontSize: '16px',
      fontWeight: 700,
      color: tokens.colors.textPrimary,
      letterSpacing: '0.04em',
      textTransform: 'uppercase' as const,
      marginBottom: '4px',
    },
    analysisDivider: {
      height: '1px',
      background: tokens.colors.border,
      margin: '12px 0 20px 0',
    },
    analysisGrid: {
      display: 'grid',
      gridTemplateColumns: '1fr 1fr',
      gap: '16px',
      marginBottom: '20px',
    },
    analysisField: {
      display: 'flex',
      flexDirection: 'column' as const,
      gap: '4px',
    },
    analysisLabel: {
      fontSize: '11px',
      fontWeight: 700,
      color: tokens.colors.textMuted,
      textTransform: 'uppercase' as const,
      letterSpacing: '0.06em',
      fontFamily: tokens.fonts.body,
    },
    analysisValue: {
      fontSize: '14px',
      fontWeight: 600,
      color: tokens.colors.textPrimary,
      fontFamily: tokens.fonts.body,
    },
    analysisNotesBox: {
      background: tokens.colors.bgHover,
      border: `1px solid ${tokens.colors.border}`,
      borderRadius: tokens.radius.md,
      padding: '12px',
      marginBottom: '20px',
    },
    analysisNotesLabel: {
      fontSize: '11px',
      fontWeight: 700,
      color: tokens.colors.textMuted,
      textTransform: 'uppercase' as const,
      letterSpacing: '0.06em',
      fontFamily: tokens.fonts.body,
      marginBottom: '6px',
    },
    analysisNotesText: {
      fontSize: '13px',
      color: tokens.colors.textSecondary,
      fontFamily: tokens.fonts.body,
      lineHeight: '1.4',
    },
    progressBar: {
      width: '100%',
      height: '6px',
      borderRadius: '3px',
      background: tokens.colors.bgHover,
      overflow: 'hidden',
      marginTop: '6px',
    },
    progressFill: (pct: number) => ({
      height: '100%',
      width: `${pct}%`,
      background: pct >= 70 ? tokens.colors.green : pct >= 40 ? tokens.colors.orange : tokens.colors.red,
      transition: 'width 0.3s',
    }),
    confidenceText: {
      fontSize: '12px',
      fontWeight: 600,
      color: tokens.colors.textPrimary,
      marginTop: '4px',
      fontFamily: tokens.fonts.body,
    },
    analysisButtons: {
      display: 'flex',
      gap: '12px',
      justifyContent: 'flex-end',
    },
    acceptBtn: {
      display: 'flex',
      alignItems: 'center',
      gap: '6px',
      padding: '10px 16px',
      borderRadius: tokens.radius.md,
      border: 'none',
      background: tokens.colors.green,
      color: '#FFF',
      fontSize: '13px',
      fontWeight: 600,
      fontFamily: tokens.fonts.body,
      cursor: 'pointer',
      transition: 'all 0.15s',
    },
    closeBtn: {
      padding: '10px 16px',
      borderRadius: tokens.radius.md,
      border: `1px solid ${tokens.colors.border}`,
      background: tokens.colors.bgHover,
      color: tokens.colors.textSecondary,
      fontSize: '13px',
      fontWeight: 600,
      fontFamily: tokens.fonts.body,
      cursor: 'pointer',
      transition: 'all 0.15s',
    },
    loadingBox: {
      display: 'flex',
      flexDirection: 'column' as const,
      alignItems: 'center',
      justifyContent: 'center',
      gap: '12px',
      padding: '40px 20px',
    },
    loadingText: {
      fontSize: '14px',
      color: tokens.colors.textSecondary,
      fontFamily: tokens.fonts.body,
    },
  }

  return (
    <ModuleLayout
        titulo="Panel de Oportunidades"
        subtitulo={`${totalActive} oportunidades activas • ${formatCurrency(totalValue)} en pipeline`}
        acciones={
          <button
            style={s.addBtn}
            onClick={() => navigate('/ventas/leads/nuevo')}
            onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.background = tokens.colors.primaryHover }}
            onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.background = tokens.colors.primary }}
          >
            <Plus size={15} /> Agregar Lead
          </button>
        }
      >
      {/* Hidden file input for quotation PDF */}
      <input
        ref={fileInputRef}
        type="file"
        accept=".pdf"
        style={{ display: 'none' }}
        onChange={handleFileSelected}
      />

      {/* ── TOOLBAR ── */}
      <div style={s.toolbar}>
        {/* Search */}
        <div style={s.searchBox}>
          <Search size={15} style={{ color: tokens.colors.textMuted, flexShrink: 0 }} />
          <input
            style={s.searchInput}
            placeholder="Buscar empresa, contacto, ciudad..."
            value={searchTerm}
            onChange={e => { setSearchTerm(e.target.value); setCurrentPage(1) }}
          />
          {searchTerm && (
            <button
              style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}
              onClick={() => setSearchTerm('')}
            >
              <X size={14} style={{ color: tokens.colors.textMuted }} />
            </button>
          )}
        </div>

        {/* Vendedores dropdown */}
        <div style={{ position: 'relative' }}>
          <button
            style={{ ...s.selectDropdown, textAlign: 'left', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}
            onClick={() => setShowEjDropdown(!showEjDropdown)}
          >
            <span>{filteredEjecutivo.length === 0 ? 'Todos los vendedores' : filteredEjecutivo.length === 1 ? filteredEjecutivo[0] || '1 vendedor' : filteredEjecutivo.length + ' vendedores'}</span>
            <ChevronDown size={14} style={{ color: tokens.colors.textMuted }} />
          </button>
          {showEjDropdown && (
            <div ref={ejDropdownRef} onClick={e => e.stopPropagation()} style={{ position: 'absolute', top: '100%', left: 0, right: 0, zIndex: 50, background: tokens.colors.bgCard, border: '1px solid ' + tokens.colors.border, borderRadius: '8px', marginTop: '4px', maxHeight: '240px', overflowY: 'auto', padding: '4px 0' }}>
              <button
                style={{ width: '100%', padding: '8px 12px', background: 'transparent', border: 'none', color: tokens.colors.textSecondary, fontSize: '12px', textAlign: 'left', cursor: 'pointer' }}
                onClick={() => { setFilteredEjecutivo([]) }}
              >Todos los vendedores</button>
              {ejecutivos.map(ej => (
                <label key={ej.id} style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '8px 12px', cursor: 'pointer', color: tokens.colors.textPrimary, fontSize: '13px' }}
                  onMouseEnter={e => { (e.currentTarget as HTMLLabelElement).style.background = tokens.colors.bgHover }}
                  onMouseLeave={e => { (e.currentTarget as HTMLLabelElement).style.background = 'transparent' }}
                >
                  <input
                    type="checkbox"
                    checked={filteredEjecutivo.includes(ej.nombre)}
                    onChange={() => {
                      setFilteredEjecutivo(prev =>
                        prev.includes(ej.nombre) ? prev.filter(n => n !== ej.nombre) : [...prev, ej.nombre]
                      )
                    }}
                    style={{ accentColor: tokens.colors.primary }}
                  />
                  {ej.nombre}
                </label>
              ))}
            </div>
          )}
        </div>

        {/* Ver eliminados */}
        <button
          style={showDeleted ? s.toolbarBtnActive : s.toolbarBtn}
          onClick={() => setShowDeleted(!showDeleted)}
          onMouseEnter={e => {
            if (!showDeleted) (e.currentTarget as HTMLButtonElement).style.background = `${tokens.colors.bgHover}`
          }}
          onMouseLeave={e => {
            if (!showDeleted) (e.currentTarget as HTMLButtonElement).style.background = tokens.colors.bgHover
          }}
        >
          <Trash2 size={14} />
          Ver eliminados
        </button>

        {/* Funnel */}
        <button
          style={s.toolbarBtn}
          onClick={() => navigate('/ventas/funnel')}
        >
          <Filter size={14} />
          Funnel
        </button>

        {/* View Toggle */}
          <div style={{ display: 'flex', borderRadius: '8px', overflow: 'hidden', border: '1px solid ' + tokens.colors.border }}>
            <button onClick={() => setViewMode('table')} style={{
              ...s.toolbarBtn,
              background: viewMode === 'table' ? tokens.colors.primary : 'transparent',
              color: viewMode === 'table' ? '#fff' : tokens.colors.textSecondary,
              borderRadius: 0, border: 'none', padding: '6px 10px'
            }}><List size={14} /></button>
            <button onClick={() => setViewMode('kanban')} style={{
              ...s.toolbarBtn,
              background: viewMode === 'kanban' ? tokens.colors.primary : 'transparent',
              color: viewMode === 'kanban' ? '#fff' : tokens.colors.textSecondary,
              borderRadius: 0, border: 'none', padding: '6px 10px'
            }}><LayoutGrid size={14} /></button>
          </div>
          {/* Exportar */}
        <button style={s.toolbarBtn} onClick={handleExportCSV}>
          <Download size={14} />
          Exportar
        </button>
      </div>

      {viewMode === 'table' ? (
          <>
          {/* ── TABLE ── */}
      <div style={s.tableWrap}>
        {loading ? (
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '200px' }}>
            <Loader size={28} style={{ color: tokens.colors.textMuted, animation: 'spin 1s linear infinite' }} />
          </div>
        ) : filteredLeads.length === 0 ? (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '200px', gap: '8px' }}>
            <Search size={32} style={{ color: tokens.colors.textMuted }} />
            <span style={{ color: tokens.colors.textMuted, fontSize: '14px', fontFamily: tokens.fonts.body }}>
              {showDeleted ? 'No hay leads eliminados' : 'No se encontraron oportunidades'}
            </span>
          </div>
        ) : (
          <table style={s.table}>
            <thead>
              <tr>
                <th style={{ ...s.th, width: '50px', textAlign: 'center' as const }}>#</th>
                <th style={s.th} onClick={() => handleSort('empresa')}>
                  <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                    EMPRESA
                    <ArrowUpDown size={12} style={{ color: sortField === 'empresa' ? tokens.colors.primary : tokens.colors.textMuted }} />
                  </span>
                </th>
                <th style={s.th} onClick={() => handleSort('estado')}>
                  <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                    ETAPA
                    <ArrowUpDown size={12} style={{ color: sortField === 'estado' ? tokens.colors.primary : tokens.colors.textMuted }} />
                  </span>
                </th>
                <th style={s.th}>CONTACTO</th>
                <th style={s.th}>SERVICIO</th>
                <th style={s.th}>EMAIL</th>
                <th style={s.th}>VIAJE</th>
                <th style={s.th} onClick={() => handleSort('proyectado_usd')}>
                  <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                    $ POTENCIAL
                    <ArrowUpDown size={12} style={{ color: sortField === 'proyectado_usd' ? tokens.colors.primary : tokens.colors.textMuted }} />
                  </span>
                </th>
                <th style={s.th}>VENDEDOR</th>
                <th style={s.th} onClick={() => handleSort('fecha_creacion')}>
                  <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                    CREADO
                    <ArrowUpDown size={12} style={{ color: sortField === 'fecha_creacion' ? tokens.colors.primary : tokens.colors.textMuted }} />
                  </span>
                </th>
                <th style={s.th}>ACTUALIZADO</th>
                <th style={{ ...s.th, width: '80px', textAlign: 'center' as const }}>ACCIONES</th>
              </tr>
            </thead>
            <tbody>
              {filteredLeads.map((lead, idx) => {
                const stage = STAGE_MAP[lead.estado] || { label: lead.estado, color: tokens.colors.gray }
                return (
                  <tr
                    key={lead.id}
                    style={s.row}
                    onMouseEnter={e => { (e.currentTarget as HTMLTableRowElement).style.background = tokens.colors.bgHover }}
                    onMouseLeave={e => { (e.currentTarget as HTMLTableRowElement).style.background = 'transparent' }}
                  >
                    <td style={{ ...s.tdMuted, textAlign: 'center' as const, width: '50px' }}>{rowNum}</td>
                    <td style={s.td}>
                      <div
                        style={{ fontWeight: 600, color: tokens.colors.textPrimary, cursor: 'pointer' }}
                        onClick={() => navigate(`/ventas/leads/${lead.id}`)}
                      >
                        {lead.empresa || '—'}
                      </div>
                      {lead.ciudad && (
                        <div style={{ fontSize: '11px', color: tokens.colors.textMuted, marginTop: '2px' }}>{lead.ciudad}</div>
                      )}
                    </td>
                    <td style={s.td}>
                      <span style={s.stageBadge(stage.color)}>
                        <span style={s.dot(stage.color)} />
                        {stage.label}
                      </span>
                    </td>
                    <td style={s.td}>
                      <div style={{ color: tokens.colors.textPrimary }}>{lead.contacto || '—'}</div>
                      {lead.telefono && (
                        <div style={{ fontSize: '11px', color: tokens.colors.textMuted, marginTop: '1px' }}>{lead.telefono}</div>
                      )}
                    </td>
                    <td style={s.tdMuted}>{lead.tipo_carga || '—'}</td>
                    <td style={s.tdMuted}>{lead.email || '—'}</td>
                    <td style={s.tdMuted}>{lead.tipo_viaje || '—'}</td>
                    <td style={{ ...s.td, fontWeight: 600, color: tokens.colors.green }}>
                      {formatCurrency(lead.proyectado_usd || lead.valor_estimado || 0)}
                    </td>
                    <td style={s.tdMuted}>
                      <div style={{ maxWidth: '120px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {lead.ejecutivo_nombre || '—'}
                      </div>
                    </td>
                    <td style={s.tdMuted}>{formatDate(lead.fecha_creacion)}</td>
              <td style={s.td}>{lead.updated_at ? formatDate(lead.updated_at) : '—'}</td>
                    <td style={{ ...s.td, textAlign: 'center' as const, width: '80px', position: 'relative' as const }}>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '2px' }}>
                        {showDeleted ? (
                          <button
                            style={s.actionBtn}
                            title="Restaurar"
                            onClick={e => { e.stopPropagation(); handleRestore(lead) }}
                            onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.background = tokens.colors.bgHover }}
                            onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.background = 'transparent' }}
                          >
                            <RotateCcw size={14} />
                          </button>
                        ) : (
                          <>
                            <button
                              style={s.actionBtn}
                              title="Ver ficha"
                              onClick={e => { e.stopPropagation(); navigate(`/ventas/leads/${lead.id}`) }}
                              onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.background = tokens.colors.bgHover }}
                              onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.background = 'transparent' }}
                            >
                              <ExternalLink size={14} />
                            </button>
                            <button
                              style={{ ...s.actionBtn, color: tokens.colors.primary }}
                              title="Adjuntar Cotización PDF"
                              onClick={() => handleAttachQuotation(lead)}
                            >
                              <Upload size={15} />
                            </button>
                            <button
                              style={s.actionBtn}
                              title="Más acciones"
                              onClick={e => { e.stopPropagation(); setActionsOpen(actionsOpen === lead.id ? null : lead.id) }}
                              onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.background = tokens.colors.bgHover }}
                              onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.background = 'transparent' }}
                            >
                              <MoreHorizontal size={14} />
                            </button>
                          </>
                        )}
                      </div>
                      {/* Actions dropdown */}
                      {actionsOpen === lead.id && !showDeleted && (
                        <div style={s.actionsMenu}>
                          <button
                            style={s.actionsMenuItem}
                            onClick={e => { e.stopPropagation(); navigate(`/ventas/leads/${lead.id}`) }}
                            onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.background = tokens.colors.bgHover }}
                            onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.background = 'transparent' }}
                          >
                            <ExternalLink size={13} /> Ver Ficha
                          </button>
                          <button
                            style={s.actionsMenuItem}
                            onClick={e => { e.stopPropagation(); handleAttachQuotation(lead) }}
                            onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.background = tokens.colors.bgHover }}
                            onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.background = 'transparent' }}
                          >
                            <Upload size={13} style={{ color: tokens.colors.primary }} />
                            <span style={{ color: tokens.colors.primary }}>Adjuntar Cotización</span>
                          </button>
                          <button
                            style={s.actionsMenuItem}
                            onClick={e => { e.stopPropagation(); handleSoftDelete(lead) }}
                            onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.background = tokens.colors.bgHover }}
                            onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.background = 'transparent' }}
                          >
                            <Trash2 size={13} style={{ color: tokens.colors.red }} />
                            <span style={{ color: tokens.colors.red }}>Eliminar</span>
                          </button>
                        </div>
                      )}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        )}
      </div>
          </>
        ) : (
          /* ── KANBAN VIEW ── */
          <div style={{ display: 'flex', gap: '12px', height: 'calc(100vh - 280px)', overflowX: 'auto', scrollbarWidth: 'none', padding: '4px 0' }}>
            {PIPELINE_STAGES.map(stage => {
              const stageLeads = filteredLeads.filter(l => l.estado === stage.id)
              return (
                <div key={stage.id} style={{ minWidth: '220px', flex: 1, display: 'flex', flexDirection: 'column', background: tokens.colors.bgCard, borderRadius: tokens.radius.lg, border: '1px solid ' + tokens.colors.border, overflow: 'hidden' }}>
                  <div style={{ padding: '12px 14px', borderBottom: '1px solid ' + tokens.colors.border, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: stage.color }} />
                      <span style={{ fontSize: '13px', fontWeight: 600, color: tokens.colors.textPrimary, fontFamily: tokens.fonts.heading }}>{stage.label}</span>
                    </div>
                    <span style={{ fontSize: '11px', color: tokens.colors.textMuted, background: tokens.colors.bgHover, padding: '2px 8px', borderRadius: tokens.radius.full }}>{stageLeads.length}</span>
                  </div>
                  <div style={{ flex: 1, overflow: 'auto', padding: '8px', display: 'flex', flexDirection: 'column', gap: '8px', scrollbarWidth: 'none' }}>
                    {stageLeads.map(lead => (
                      <div key={lead.id} onClick={() => navigate('/ventas/lead/' + lead.id)} style={{ padding: '12px', background: tokens.colors.bgHover, borderRadius: tokens.radius.md, cursor: 'pointer', border: '1px solid transparent', transition: 'all 0.15s ease' }}
                        onMouseEnter={e => { e.currentTarget.style.borderColor = stage.color + '44'; e.currentTarget.style.transform = 'translateY(-1px)' }}
                        onMouseLeave={e => { e.currentTarget.style.borderColor = 'transparent'; e.currentTarget.style.transform = 'none' }}>
                        <div style={{ fontSize: '13px', fontWeight: 600, color: tokens.colors.textPrimary, marginBottom: '4px' }}>{lead.empresa}</div>
                        <div style={{ fontSize: '11px', color: tokens.colors.textSecondary, marginBottom: '6px' }}>{lead.contacto_nombre || ''}</div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <span style={{ fontSize: '11px', color: tokens.colors.textMuted }}>{lead.tipo_servicio || ''}</span>
                          <span style={{ fontSize: '12px', fontWeight: 600, color: tokens.colors.primary }}>{(lead.proyectado_usd || lead.valor_estimado || 0).toLocaleString('es-MX', { style: 'currency', currency: 'MXN', maximumFractionDigits: 0 })}</span>
                        </div>
                      </div>
                    ))}
                    {stageLeads.length === 0 && (
                      <div style={{ padding: '20px', textAlign: 'center', color: tokens.colors.textMuted, fontSize: '12px' }}>Sin oportunidades</div>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        )}

      {/* ── FOOTER ── */}
      <div style={s.footer}>
            <span style={s.footerText}>{filteredLeads.length} oportunidades</span>
            <span style={{ fontSize: '13px', fontWeight: 700, color: tokens.colors.primary, fontFamily: tokens.fonts.heading }}>
              Pipeline: {filteredLeads.reduce((sum, l) => sum + (l.proyectado_usd || l.valor_estimado || 0), 0).toLocaleString('es-MX', { style: 'currency', currency: 'MXN', maximumFractionDigits: 0 })} MXN
            </span>
          </div>

      {/* ── FUNNEL MODAL ── */}

      {/* ── QUOTATION ANALYSIS MODAL ── */}
      {(analyzingLead && (analyzing || analysisResult)) && (
        <div
          style={s.analysisOverlay}
          onClick={analyzing ? undefined : handleCloseAnalysis}
        >
          <div style={s.analysisCard} onClick={e => e.stopPropagation()}>
            {analyzing ? (
              <div style={s.loadingBox}>
                <Loader size={32} style={{ color: tokens.colors.primary, animation: 'spin 1s linear infinite' }} />
                <span style={s.loadingText}>Analizando cotización con IA...</span>
              </div>
            ) : analysisResult ? (
              <>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
                  <div>
                    <div style={s.analysisTitle}>
                      Análisis de Cotización
                    </div>
                    <div style={{ fontSize: '12px', color: tokens.colors.textSecondary, fontFamily: tokens.fonts.body }}>
                      {analyzingLead.empresa}
                    </div>
                  </div>
                  <button
                    style={{ background: 'none', border: 'none', cursor: 'pointer', color: tokens.colors.textMuted, padding: 0 }}
                    onClick={handleCloseAnalysis}
                  >
                    <X size={20} />
                  </button>
                </div>
                <div style={s.analysisDivider} />

                {/* Results Grid */}
                <div style={s.analysisGrid}>
                  <div style={s.analysisField}>
                    <span style={s.analysisLabel}>Monto Detectado</span>
                    <span style={{ ...s.analysisValue, color: tokens.colors.green }}>
                      {analysisResult.moneda} {formatCurrency(analysisResult.monto_detectado)}
                    </span>
                  </div>
                  <div style={s.analysisField}>
                    <span style={s.analysisLabel}>Moneda</span>
                    <span style={s.analysisValue}>{analysisResult.moneda}</span>
                  </div>
                  <div style={s.analysisField}>
                    <span style={s.analysisLabel}>Vigencia</span>
                    <span style={s.analysisValue}>{analysisResult.vigencia || '—'}</span>
                  </div>
                  <div style={s.analysisField}>
                    <span style={s.analysisLabel}>Etapa Sugerida</span>
                    <div style={{ marginTop: '2px' }}>
                      <span style={{
                        ...s.stageBadge(STAGE_MAP[analysisResult.etapa_sugerida]?.color || tokens.colors.gray)
                      }}>
                        <span style={s.dot(STAGE_MAP[analysisResult.etapa_sugerida]?.color || tokens.colors.gray)} />
                        {STAGE_MAP[analysisResult.etapa_sugerida]?.label || analysisResult.etapa_sugerida}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Confidence */}
                <div style={{ marginBottom: '20px' }}>
                  <div style={s.analysisLabel}>Confianza del Análisis</div>
                  <div style={s.progressBar}>
                    <div style={s.progressFill(analysisResult.confianza)} />
                  </div>
                  <div style={s.confidenceText}>{analysisResult.confianza}%</div>
                </div>

                {/* Resumen / Notas */}
                <div style={s.analysisNotesBox}>
                  <div style={s.analysisNotesLabel}>Resumen & Análisis</div>
                  <div style={s.analysisNotesText}>{analysisResult.resumen}</div>
                </div>

                {analysisResult.notas && (
                  <div style={s.analysisNotesBox}>
                    <div style={s.analysisNotesLabel}>Notas Adicionales</div>
                    <div style={s.analysisNotesText}>{analysisResult.notas}</div>
                  </div>
                )}

                {/* Buttons */}
                <div style={s.analysisButtons}>
                  <button
                    style={s.closeBtn}
                    onClick={handleCloseAnalysis}
                    onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.background = tokens.colors.bgCard }}
                    onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.background = tokens.colors.bgHover }}
                  >
                    Cerrar
                  </button>
                  <button
                    style={s.acceptBtn}
                    onClick={handleAcceptAnalysis}
                    onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.background = '#0B9566' }}
                    onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.background = tokens.colors.green }}
                  >
                    <FileText size={14} />
                    Aceptar y Mover a {STAGE_MAP[analysisResult.etapa_sugerida]?.label || analysisResult.etapa_sugerida}
                  </button>
                </div>
              </>
            ) : null}
          </div>
        </div>
      )}

      {/* Close actions menu on outside click */}
      {actionsOpen && (
        <div
          style={{ position: 'fixed', inset: 0, zIndex: 40 }}
          onClick={() => setActionsOpen(null)}
        />
      )}

      {/* CSS for spinner animation */}
      <style>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
    </ModuleLayout>
  )
}



