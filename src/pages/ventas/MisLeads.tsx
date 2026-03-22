import type { ReactElement } from 'react'
import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Search, ChevronDown, Trash2, Filter, Download, Plus, MoreHorizontal,
  Loader, Eye, Edit3, Zap, Upload, ArrowUpDown, X, RotateCcw
} from 'lucide-react'
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

const STAGE_MAP = Object.fromEntries(PIPELINE_STAGES.map(s => [s.id, s]))

export default function MisLeads() {
  const navigate = useNavigate()
  const { user } = useAuthContext()
  const [leads, setLeads] = useState<Lead[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [filteredEjecutivo, setFilteredEjecutivo] = useState('')
  const [ejecutivos, setEjecutivos] = useState<{ id: string; nombre: string }[]>([])
  const [showDeleted, setShowDeleted] = useState(false)
  const [showFunnel, setShowFunnel] = useState(false)
  const [sortField, setSortField] = useState<string>('fecha_creacion')
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('desc')
  const [actionsOpen, setActionsOpen] = useState<string | null>(null)
  const [selectedLeads, setSelectedLeads] = useState<Set<string>>(new Set())
  const fileInputRef = useRef<HTMLInputElement>(null)

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
      const uniqueEjecutivos = Array.from(
        new Map(
          (data || [])
            .filter((l: Lead) => l.ejecutivo_id && l.ejecutivo_nombre)
            .map((l: Lead) => [l.ejecutivo_id, { id: l.ejecutivo_id, nombre: l.ejecutivo_nombre }])
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

  const formatCurrency = (v: number): string => {
    if (!v) return '$0'
    return new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(v)
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
  if (filteredEjecutivo) {
    filteredLeads = filteredLeads.filter(l => l.ejecutivo_id === filteredEjecutivo)
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

  // Funnel stats
  const funnelData = PIPELINE_STAGES.map(s => ({
    ...s,
    count: leads.filter(l => !l.eliminado && l.estado === s.id).length,
    value: leads.filter(l => !l.eliminado && l.estado === s.id).reduce((sum, l) => sum + (l.proyectado_usd || l.valor_estimado || 0), 0),
  }))
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
      color: color,
      background: `${color}1a`,
      border: `1px solid ${color}33`,
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
      minWidth: '160px',
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
      textAlign: 'left' as const,
      transition: 'background 0.15s',
    },
    funnelOverlay: {
      position: 'fixed' as const,
      inset: 0,
      background: 'rgba(0,0,0,0.6)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 100,
    },
    funnelCard: {
      background: tokens.colors.bgCard,
      border: `1px solid ${tokens.colors.border}`,
      borderRadius: tokens.radius.lg,
      padding: '24px',
      width: '500px',
      maxWidth: '90vw',
      boxShadow: tokens.effects.cardShadow,
    },
    funnelTitle: {
      fontFamily: tokens.fonts.heading,
      fontSize: '16px',
      fontWeight: 700,
      color: tokens.colors.textPrimary,
      marginBottom: '16px',
      letterSpacing: '0.04em',
      textTransform: 'uppercase' as const,
    },
    funnelRow: {
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      padding: '10px 0',
      borderBottom: `1px solid ${tokens.colors.border}`,
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
  }

  return (
    <div style={s.page}>
      {/* ── HEADER ── */}
      <div style={s.header}>
        <div>
          <div style={s.title}>Panel de Oportunidades</div>
          <div style={s.subtitle}>{totalActive} oportunidades activas &bull; {formatCurrency(totalValue)} en pipeline</div>
        </div>
        <button
          style={s.addBtn}
          onClick={() => navigate('/ventas/leads/nuevo')}
          onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.background = tokens.colors.primaryHover }}
          onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.background = tokens.colors.primary }}
        >
          <Plus size={15} />
          Agregar Lead
        </button>
      </div>

      {/* ── TOOLBAR ── */}
      <div style={s.toolbar}>
        {/* Search */}
        <div style={s.searchBox}>
          <Search size={15} style={{ color: tokens.colors.textMuted, flexShrink: 0 }} />
          <input
            style={s.searchInput}
            placeholder="Buscar empresa, contacto, ciudad..."
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
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
          <select
            style={s.selectDropdown}
            value={filteredEjecutivo}
            onChange={e => setFilteredEjecutivo(e.target.value)}
          >
            <option value="">Todos los vendedores</option>
            {ejecutivos.map(ej => (
              <option key={ej.id} value={ej.id}>{ej.nombre}</option>
            ))}
          </select>
          <ChevronDown
            size={14}
            style={{
              position: 'absolute',
              right: '10px',
              top: '50%',
              transform: 'translateY(-50%)',
              color: tokens.colors.textMuted,
              pointerEvents: 'none',
            }}
          />
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
          style={showFunnel ? s.toolbarBtnActive : s.toolbarBtn}
          onClick={() => setShowFunnel(!showFunnel)}
        >
          <Filter size={14} />
          Funnel
        </button>

        {/* Exportar */}
        <button style={s.toolbarBtn} onClick={handleExportCSV}>
          <Download size={14} />
          Exportar
        </button>
      </div>

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
                    <td style={{ ...s.tdMuted, textAlign: 'center' as const, width: '50px' }}>{idx + 1}</td>
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
                              <Eye size={14} />
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
                            <Eye size={13} /> Ver Ficha
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

      {/* ── FOOTER ── */}
      <div style={s.footer}>
        <span style={s.footerText}>
          Mostrando {filteredLeads.length} de {leads.filter(l => showDeleted ? l.eliminado : !l.eliminado).length} oportunidades
        </span>
        <span style={s.footerText}>
          Pipeline total: <span style={{ color: tokens.colors.green, fontWeight: 600 }}>{formatCurrency(totalValue)}</span>
        </span>
      </div>

      {/* ── FUNNEL MODAL ── */}
      {showFunnel && (
        <div
          style={s.funnelOverlay}
          onClick={() => setShowFunnel(false)}
        >
          <div style={s.funnelCard} onClick={e => e.stopPropagation()}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
              <span style={s.funnelTitle}>Funnel de Ventas</span>
              <button
                style={{ background: 'none', border: 'none', cursor: 'pointer', color: tokens.colors.textMuted }}
                onClick={() => setShowFunnel(false)}
              >
                <X size={18} />
              </button>
            </div>
            {funnelData.map((st, i) => {
              const pct = totalActive > 0 ? Math.round((st.count / totalActive) * 100) : 0
              return (
                <div key={st.id} style={s.funnelRow}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flex: 1 }}>
                    <span style={s.dot(st.color)} />
                    <span style={{ color: tokens.colors.textPrimary, fontSize: '13px', fontFamily: tokens.fonts.body, fontWeight: 500 }}>
                      {st.label}
                    </span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                    <div style={{ width: '120px', height: '6px', borderRadius: '3px', background: tokens.colors.bgHover, overflow: 'hidden' }}>
                      <div style={{ width: `${pct}%`, height: '100%', borderRadius: '3px', background: st.color, transition: 'width 0.3s' }} />
                    </div>
                    <span style={{ color: tokens.colors.textSecondary, fontSize: '12px', fontFamily: tokens.fonts.body, minWidth: '30px', textAlign: 'right' as const }}>
                      {st.count}
                    </span>
                    <span style={{ color: tokens.colors.green, fontSize: '12px', fontWeight: 600, fontFamily: tokens.fonts.body, minWidth: '80px', textAlign: 'right' as const }}>
                      {formatCurrency(st.value)}
                    </span>
                  </div>
                </div>
              )
            })}
            <div style={{ ...s.funnelRow, borderBottom: 'none', marginTop: '8px' }}>
              <span style={{ color: tokens.colors.textPrimary, fontSize: '13px', fontWeight: 700, fontFamily: tokens.fonts.body }}>TOTAL</span>
              <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                <div style={{ width: '120px' }} />
                <span style={{ color: tokens.colors.textPrimary, fontSize: '12px', fontWeight: 700, fontFamily: tokens.fonts.body, minWidth: '30px', textAlign: 'right' as const }}>
                  {totalActive}
                </span>
                <span style={{ color: tokens.colors.green, fontSize: '12px', fontWeight: 700, fontFamily: tokens.fonts.body, minWidth: '80px', textAlign: 'right' as const }}>
                  {formatCurrency(totalValue)}
                </span>
              </div>
            </div>
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
  )
}
