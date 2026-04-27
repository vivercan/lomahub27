import type { ReactElement } from 'react'
import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Search, ChevronDown, ChevronLeft, ChevronRight, Trash2, Filter, Download, Plus, MoreHorizontal,
  Loader, Eye, Edit3, Zap, Upload, ArrowUpDown, X, RotateCcw, FileText, LayoutGrid, List, FolderOpen
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
  deleted_at?: string | null  // V50 26/Abr/2026 — schema fix: tabla leads usa deleted_at, no `eliminado`
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

// V52 26/Abr/2026 (FIX 28) — Helper estancados (>5 dias sin mov)
const DIAS_ESTANCADO_THRESHOLD = 5
function diasSinMovimiento(fecha?: string | null): number {
  if (!fecha) return 0
  const ms = Date.now() - new Date(fecha).getTime()
  return Math.max(0, Math.floor(ms / 86400000))
}
function esEstancado(lead: { fecha_ultimo_mov?: string; estado: string }): boolean {
  if (lead.estado === 'Cerrado Ganado' || lead.estado === 'Cerrado Perdido') return false
  return diasSinMovimiento(lead.fecha_ultimo_mov) >= DIAS_ESTANCADO_THRESHOLD
}

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
  const [currentPage, setCurrentPage] = useState(1)
  const [rowsPerPage, setRowsPerPage] = useState(11)
  const ROW_HEIGHT = 56
  const tableContainerRef = useRef<HTMLDivElement>(null)
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

  // Dynamic rows per page calculation
  useEffect(() => {
    const calcRows = () => {
      const el = tableContainerRef.current
      if (!el) return
      const containerH = el.clientHeight
      const thead = el.querySelector('thead')
      const theadH = thead ? thead.getBoundingClientRect().height : 40
      const available = containerH - theadH
      const rows = Math.max(1, Math.floor(available / ROW_HEIGHT))
      if (rows !== rowsPerPage) setRowsPerPage(rows)
    }
    const timer = setTimeout(calcRows, 50)
    window.addEventListener('resize', calcRows)
    return () => { clearTimeout(timer); window.removeEventListener('resize', calcRows) }
  }, [loading])

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
      // V50 26/Abr/2026 — schema fix: usar deleted_at (no `eliminado` que no existe)
      const nowIso = new Date().toISOString()
      const { error } = await supabase.from('leads').update({ deleted_at: nowIso }).eq('id', lead.id)
      if (error) throw error
      setLeads(leads.map(l => l.id === lead.id ? { ...l, deleted_at: nowIso } : l))
    } catch (err) {
      console.error('Error deleting lead:', err)
    }
    setActionsOpen(null)
  }

  const handleRestore = async (lead: Lead) => {
    try {
      const { error } = await supabase.from('leads').update({ deleted_at: null }).eq('id', lead.id)
      if (error) throw error
      setLeads(leads.map(l => l.id === lead.id ? { ...l, deleted_at: null } : l))
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
      // V52 26/Abr/2026 (FIX 28) — análisis IA va a `notas` con prefijo, no en cotizacion_url.
      // cotizacion_url se reserva para URL real del PDF (cuando se conecte Supabase Storage).
      const fechaCorta = new Date().toLocaleDateString('es-MX', { day: '2-digit', month: 'short', year: 'numeric' })
      const iaPrefix = `\n\n[IA cotizacion ${fechaCorta}]:\n${analysisResult.resumen || 'Sin resumen'}`
      const notasNuevas = (analyzingLead.notas || '') + iaPrefix
      const { error } = await supabase
        .from('leads')
        .update({
          estado: analysisResult.etapa_sugerida,
          notas: notasNuevas,
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
              notas: notasNuevas,
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

  // Filter logic — V50 26/Abr/2026: usar deleted_at en vez de eliminado
  let filteredLeads = leads.filter(l => showDeleted ? l.deleted_at != null : l.deleted_at == null)
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

  // Pagination
  const totalFiltered = filteredLeads.length
  const totalPages = Math.ceil(totalFiltered / rowsPerPage)
  const safeCurrentPage = Math.min(currentPage, Math.max(1, totalPages))
  const paginatedLeads = filteredLeads.slice((safeCurrentPage - 1) * rowsPerPage, safeCurrentPage * rowsPerPage)

  const totalActive = leads.filter(l => l.deleted_at == null).length
  const totalValue = leads.filter(l => l.deleted_at == null).reduce((sum, l) => sum + (l.proyectado_usd || l.valor_estimado || 0), 0)
  const isSuperAdmin = user?.rol === 'superadmin'

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
      background: `linear-gradient(180deg, #FFFFFF 0%, ${tokens.colors.bgHover} 100%)`,
      color: tokens.colors.textSecondary,
      fontSize: '13px',
      fontFamily: tokens.fonts.body,
      cursor: 'pointer',
      transition: 'all 0.18s ease',
      whiteSpace: 'nowrap' as const,
      boxShadow: `
        0 2px 4px rgba(0,0,0,0.14),
        0 4px 10px -2px rgba(0,0,0,0.12),
        inset 0 1px 0 rgba(255,255,255,0.90),
        inset 0 -2px 0 rgba(0,0,0,0.08)
      `,
    },
    toolbarBtnActive: {
      display: 'flex',
      alignItems: 'center',
      gap: '6px',
      padding: '8px 14px',
      borderRadius: tokens.radius.md,
      border: `1px solid ${tokens.colors.primary}`,
      background: `linear-gradient(180deg, ${tokens.colors.primary}33 0%, ${tokens.colors.primary}22 100%)`,
      color: tokens.colors.primary,
      fontSize: '13px',
      fontFamily: tokens.fonts.body,
      cursor: 'pointer',
      transition: 'all 0.18s ease',
      whiteSpace: 'nowrap' as const,
      boxShadow: `
        0 1px 3px rgba(59,108,231,0.15),
        0 3px 8px -2px rgba(59,108,231,0.10),
        inset 0 1px 0 rgba(255,255,255,0.60),
        inset 0 -1px 0 rgba(59,108,231,0.12)
      `,
    },
    addBtn: {
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
      boxShadow: `
        0 2px 4px rgba(59,108,231,0.30),
        0 6px 14px -3px rgba(59,108,231,0.25),
        0 10px 24px -6px rgba(0,0,0,0.20),
        inset 0 1px 0 rgba(255,255,255,0.28),
        inset 0 -1px 0 rgba(0,0,0,0.18)
      `,
      textShadow: '0 1px 2px rgba(0,0,0,0.20)',
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
      height: '100%',
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
      height: `${ROW_HEIGHT}px`,
    },
    stageBadge: (color: string) => ({
      display: 'inline-flex',
      alignItems: 'center',
      justifyContent: 'center',
      gap: '6px',
      padding: '4px 12px',
      borderRadius: tokens.radius.full,
      fontSize: '11px',
      fontWeight: 600,
      fontFamily: tokens.fonts.body,
      color: '#fff',
      background: `linear-gradient(180deg, ${color} 0%, ${color}CC 100%)`,
      border: 'none',
      whiteSpace: 'nowrap' as const,
      boxShadow: `
        0 2px 5px rgba(0,0,0,0.30),
        0 5px 10px -2px rgba(0,0,0,0.22),
        inset 0 1px 0 rgba(255,255,255,0.35),
        inset 0 -2px 0 rgba(0,0,0,0.25)
      `,
      textShadow: '0 1px 2px rgba(0,0,0,0.25)',
      transition: 'all 0.15s ease',
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
        subtitulo={`${totalActive} oportunidades activas \u2022 ${formatCurrency(totalValue)} en pipeline`}
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
      <div style={{ display: 'flex', flexDirection: 'column' as const, height: '100%', overflow: 'hidden' }}>
      {/* Hidden file input for quotation PDF */}
      <input
        ref={fileInputRef}
        type="file"
        accept=".pdf"
        style={{ display: 'none' }}
        onChange={handleFileSelected}
      />

      {/* —— TOOLBAR —— */}
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

        {/* Vendedores dropdown - solo superadmin */}
        {isSuperAdmin && <div style={{ position: 'relative' }}>
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
        </div>}

        {/* Ver eliminados - solo superadmin */}
        {isSuperAdmin && (
          <button
            style={showDeleted ? s.toolbarBtnActive : s.toolbarBtn}
            onClick={() => { setShowDeleted(!showDeleted); setCurrentPage(1) }}
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
        )}

        {/* Funnel */}
        <button
          style={s.toolbarBtn}
          onClick={() => navigate('/ventas/funnel')}
        >
          <Filter size={14} />
          Funnel
        </button>

        {/* View Toggle */}
          <div style={{ display: 'flex', borderRadius: '8px', overflow: 'hidden', border: '1px solid ' + tokens.colors.border, boxShadow: '0 1px 3px rgba(0,0,0,0.10), 0 3px 8px -2px rgba(0,0,0,0.08)' }}>
            <button onClick={() => setViewMode('table')} style={{
              ...s.toolbarBtn,
              background: viewMode === 'table'
                ? `linear-gradient(180deg, #4A7AF0 0%, ${tokens.colors.primary} 50%, #2F5BC4 100%)`
                : 'linear-gradient(180deg, #FFFFFF 0%, #F5F5F5 100%)',
              color: viewMode === 'table' ? '#fff' : tokens.colors.textSecondary,
              borderRadius: 0, border: 'none', padding: '6px 10px',
              boxShadow: viewMode === 'table'
                ? 'inset 0 1px 0 rgba(255,255,255,0.25), inset 0 -1px 0 rgba(0,0,0,0.18)'
                : 'inset 0 1px 0 rgba(255,255,255,0.80), inset 0 -1px 0 rgba(0,0,0,0.06)',
            }}><List size={14} /></button>
            <button onClick={() => setViewMode('kanban')} style={{
              ...s.toolbarBtn,
              background: viewMode === 'kanban'
                ? `linear-gradient(180deg, #4A7AF0 0%, ${tokens.colors.primary} 50%, #2F5BC4 100%)`
                : 'linear-gradient(180deg, #FFFFFF 0%, #F5F5F5 100%)',
              color: viewMode === 'kanban' ? '#fff' : tokens.colors.textSecondary,
              borderRadius: 0, border: 'none', padding: '6px 10px',
              boxShadow: viewMode === 'kanban'
                ? 'inset 0 1px 0 rgba(255,255,255,0.25), inset 0 -1px 0 rgba(0,0,0,0.18)'
                : 'inset 0 1px 0 rgba(255,255,255,0.80), inset 0 -1px 0 rgba(0,0,0,0.06)',
            }}><LayoutGrid size={14} /></button>
          </div>
          {/* Exportar */}
        <button style={s.toolbarBtn} onClick={handleExportCSV}>
          <Download size={14} />
          Exportar
        </button>
      </div>

      {/* V52 (FIX 30) — Banner conteo estancados — version corregida fuera del ternario interno */}
      {(() => {
        const estancadosCount = filteredLeads.filter(l => esEstancado(l)).length
        if (estancadosCount === 0) return null
        return (
          <div style={{
            margin: '0 0 12px 0', padding: '10px 14px', borderRadius: 10,
            background: 'linear-gradient(180deg, rgba(245,158,11,0.12) 0%, rgba(217,119,6,0.06) 100%)',
            border: '1px solid rgba(217,119,6,0.32)', display: 'flex', alignItems: 'center', gap: 10,
            fontSize: 13, color: '#92400E', fontWeight: 600,
          }}>
            <span style={{ fontSize: 16 }}>{'⚠'}</span>
            <span>{estancadosCount === 1 ? '1 lead estancado' : `${estancadosCount} leads estancados`} (sin movimiento +5 dias) - atender prioritario.</span>
          </div>
        )
      })()}

      {viewMode === 'table' ? (
          <>
          {/* ── TABLE ── */}
      <div ref={tableContainerRef} style={{ position: 'relative', flex: 1, overflow: 'hidden' }}>
      <div style={{ ...s.tableWrap, height: '100%', paddingBottom: '0px', scrollbarWidth: 'none', overflow: 'hidden' }}>
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
                <th style={{ ...s.th, minWidth: '220px' }} onClick={() => handleSort('empresa')}>
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
                <th style={{ ...s.th, width: '70px', textAlign: 'center' as const }}>ACCIONES</th>
              </tr>
            </thead>
            <tbody>
              {paginatedLeads.map((lead, idx) => {
                const stage = STAGE_MAP[lead.estado] || { label: lead.estado, color: tokens.colors.gray }
                const rowNum = (safeCurrentPage - 1) * rowsPerPage + idx + 1
                return (
                  <tr
                    key={lead.id}
                    style={{ ...s.row, cursor: 'pointer' }}
                    onClick={(e) => {
                      const target = e.target as HTMLElement;
                      if (target.closest('button, svg, a, [role="button"], input, select, textarea')) return;
                      navigate(`/ventas/leads/${lead.id}`);
                    }}
                    onMouseEnter={e => { (e.currentTarget as HTMLTableRowElement).style.background = tokens.colors.bgHover }}
                    onMouseLeave={e => { (e.currentTarget as HTMLTableRowElement).style.background = 'transparent' }}
                  >
                    <td style={{ ...s.tdMuted, textAlign: 'center' as const, width: '50px' }}>{rowNum}</td>
                    <td style={{ ...s.td, height: `${ROW_HEIGHT}px`, padding: '6px 14px', verticalAlign: 'middle' as const }}>
                      <div style={{ overflow: 'hidden', maxHeight: `${ROW_HEIGHT - 12}px` }}>
                        <div
                          style={{ fontWeight: 600, color: tokens.colors.textPrimary, cursor: 'pointer', lineHeight: '1.3' }}
                          onClick={() => navigate(`/ventas/leads/${lead.id}`)}
                        >
                          {lead.empresa || '—'}
                        </div>
                        {lead.ciudad && (
                          <div style={{ fontSize: '11px', color: tokens.colors.textMuted, marginTop: '1px', lineHeight: '1.2' }}>{lead.ciudad}</div>
                        )}
                      </div>
                    </td>
                    <td style={{ ...s.td, textAlign: 'center' as const }}>
                      <span style={s.stageBadge(stage.color)}>
                        {stage.label}
                      </span>
                      {/* V52 (FIX 28) — Badge ESTANCADO si >5 dias sin mov */}
                      {esEstancado(lead) && (
                        <span style={{
                          display: 'inline-block', marginLeft: 6, padding: '2px 7px',
                          borderRadius: 6, fontSize: 10, fontWeight: 700,
                          background: 'linear-gradient(180deg, #F59E0B 0%, #D97706 100%)',
                          color: '#FFFFFF', boxShadow: '0 1px 2px rgba(217,119,6,0.30)',
                          letterSpacing: '0.02em',
                        }}>
                          ESTANCADO {diasSinMovimiento(lead.fecha_ultimo_mov)}d
                        </span>
                      )}
                    </td>
                    <td style={{ ...s.td, height: `${ROW_HEIGHT}px`, padding: '6px 14px', verticalAlign: 'middle' as const }}>
                      <div style={{ color: tokens.colors.textPrimary }}>{lead.contacto || '—'}</div>
                    </td>
                    <td style={s.tdMuted}>{lead.tipo_carga || '—'}</td>
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
                    <td style={{ ...s.td, textAlign: 'center' as const, width: '70px', position: 'relative' as const }}>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4px' }}>
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
                              style={{ ...s.actionBtn, color: '#2563EB' }}
                              title="Abrir expediente"
                              onClick={e => { e.stopPropagation(); navigate(`/ventas/leads/${lead.id}`) }}
                              onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.background = tokens.colors.bgHover }}
                              onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.background = 'transparent' }}
                            >
                              <FolderOpen size={15} />
                            </button>
                            <button
                              style={{ ...s.actionBtn, color: '#DC2626', position: 'relative' }}
                              title="Subir Cotización PDF"
                              onClick={e => { e.stopPropagation(); handleAttachQuotation(lead) }}
                            >
                              {/* Solid PDF-style icon */}
                              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                <path d="M6 2C4.9 2 4 2.9 4 4V20C4 21.1 4.9 22 6 22H18C19.1 22 20 21.1 20 20V8L14 2H6Z" fill="#DC2626" />
                                <path d="M14 2V8H20" fill="#B91C1C" />
                                <path d="M14 2L20 8H14V2Z" fill="#EF4444" />
                                <text x="12" y="17" textAnchor="middle" fill="white" fontSize="6" fontWeight="bold" fontFamily="Arial">PDF</text>
                              </svg>
                            </button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        )}
      </div>
      </div>
          </>
        ) : (
          /* —— KANBAN VIEW —— */
          <div style={{ display: 'flex', gap: '12px', height: 'calc(100vh - 280px)', overflowX: 'auto', scrollbarWidth: 'none', padding: '4px 0' }}>
            {PIPELINE_STAGES.map(stage => {
              const stageLeads = filteredLeads.filter(l => l.estado === stage.id) /* Use all filteredLeads, not paginatedLeads, for kanban */
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
                      <div key={lead.id} onClick={() => navigate('/ventas/leads/' + lead.id)} style={{ padding: '12px', background: tokens.colors.bgHover, borderRadius: tokens.radius.md, cursor: 'pointer', border: '1px solid transparent', transition: 'all 0.15s ease' }}
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
      <div style={{ ...s.footer, justifyContent: 'space-between' }}>
            <span style={s.footerText}>{totalFiltered} oportunidades</span>
            {totalPages > 1 && viewMode === 'table' && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <button
                  onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                  disabled={safeCurrentPage <= 1}
                  style={{ padding: '6px 10px', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '1px solid ' + tokens.colors.border, borderRadius: '6px', background: safeCurrentPage <= 1 ? 'transparent' : tokens.colors.bgCard, color: safeCurrentPage <= 1 ? tokens.colors.textMuted : '#F59E0B', cursor: safeCurrentPage <= 1 ? 'default' : 'pointer' }}
                ><ChevronLeft size={16} strokeWidth={2.5} /></button>
                <span style={{ fontSize: '12px', color: tokens.colors.textSecondary, fontFamily: tokens.fonts.body }}>
                  {safeCurrentPage} / {totalPages}
                </span>
                <button
                  onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                  disabled={safeCurrentPage >= totalPages}
                  style={{ padding: '6px 10px', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '1px solid ' + tokens.colors.border, borderRadius: '6px', background: safeCurrentPage >= totalPages ? 'transparent' : tokens.colors.bgCard, color: safeCurrentPage >= totalPages ? tokens.colors.textMuted : '#F59E0B', cursor: safeCurrentPage >= totalPages ? 'default' : 'pointer' }}
                ><ChevronRight size={16} strokeWidth={2.5} /></button>
              </div>
            )}
            <span style={{ fontSize: '13px', fontWeight: 700, color: tokens.colors.primary, fontFamily: tokens.fonts.heading }}>
              Pipeline: {filteredLeads.reduce((sum, l) => sum + (l.proyectado_usd || l.valor_estimado || 0), 0).toLocaleString('es-MX', { style: 'currency', currency: 'MXN', maximumFractionDigits: 0 })} MXN
            </span>
          </div>

      {/* —— FUNNEL MODAL —— */}

      {/* —— QUOTATION ANALYSIS MODAL —— */}
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
      </div>
    </ModuleLayout>
  )
}



