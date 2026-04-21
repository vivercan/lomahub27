import React, { useState, useEffect, useMemo, useCallback } from 'react'
import { supabase } from '../../lib/supabase'
import {
  Plus,
  Search,
  Edit2,
  Trash2,
  ChevronDown,
  ChevronUp,
  X,
  AlertCircle,
  CheckCircle,
  Loader,
} from 'lucide-react'

const tokens = {
  primary: '#3B6CE7',
  primaryLight: '#EBF0FD',
  bgMain: '#F7F8FA',
  bgCard: '#FFFFFF',
  textPrimary: '#1A1A2E',
  textSecondary: '#6B7280',
  border: '#E5E7EB',
  borderRadius: '12px',
  fontFamily: "'Montserrat', sans-serif",
  shadow: '0 1px 3px rgba(0,0,0,0.08)',
  shadowMd: '0 4px 12px rgba(0,0,0,0.1)',
  green: '#10B981',
  yellow: '#F59E0B',
  orange: '#F97316',
  red: '#EF4444',
  blue: '#3B82F6',
  gray: '#6B7280',
}

type EstadoOperativo = 'disponible' | 'en_viaje' | 'taller' | 'siniestro' | 'baja'

// Normaliza estado_operativo de BD (puede ser ACTIVO, MTTO, TALLER, S/OP, etc.) al enum canonico
const normalizarEstado = (e?: string | null): EstadoOperativo | '' => {
  if (!e) return ''
  const lower = String(e).toLowerCase().trim()
  if (lower === 'activo' || lower === 'disponible') return 'disponible'
  if (lower.includes('viaje')) return 'en_viaje'
  if (lower.includes('mmto') || lower.includes('mtto') || lower.includes('taller')) return 'taller'
  if (lower.includes('siniestro')) return 'siniestro'
  if (lower.includes('baja') || lower === 's/op') return 'baja'
  return ''
}

interface Tracto {
  id: string
  numero_economico: string
  placas: string
  marca: string
  modelo: string
  estado_operativo: EstadoOperativo
  viaje_actual?: string | null
  operador_asignado?: string | null
  horas_ociosas: number
  km_acumulados: number
  empresa: 'trob' | 'wexpress' | 'speedyhaul'
  activo: boolean
  created_at: string
  updated_at: string
}

interface SummaryCard {
  label: string
  value: string | number
  color: string
  icon: React.ReactNode
}

const ControlTractos: React.FC = () => {
  const [tractos, setTractos] = useState<Tracto[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [filterEmpresa, setFilterEmpresa] = useState<string>('')
  const [filterEstado, setFilterEstado] = useState<string>('')
  const [sortColumn, setSortColumn] = useState<keyof Tracto>('numero_economico')
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc')
  const [showModal, setShowModal] = useState(false)
  const [editingTracto, setEditingTracto] = useState<Tracto | null>(null)
  const [formData, setFormData] = useState<Partial<Tracto>>({})
  const [submitting, setSubmitting] = useState(false)

  const IDLE_COST_PER_HOUR = 150 // USD per hour
  const empresas = ['trob', 'wexpress', 'speedyhaul']
  const estados: EstadoOperativo[] = ['disponible', 'en_viaje', 'taller', 'siniestro', 'baja']

  useEffect(() => {
    fetchTractos()
  }, [])

  const fetchTractos = async () => {
    try {
      setLoading(true)
      setError(null)
      const { data, error: fetchError } = await supabase
        .from('tractos')
        .select('*')
        .order('numero_economico', { ascending: true })

      if (fetchError) throw fetchError
      setTractos(data || [])
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error cargando tractos')
      console.error('Error fetching tractos:', err)
    } finally {
      setLoading(false)
    }
  }

  const getRowColor = (tracto: Tracto): string => {
    if (!tracto.activo) return '#F3F4F6'

    switch (tracto.estado_operativo) {
      case 'baja':
        return '#F3F4F6'
      case 'siniestro':
        return '#FEE2E2'
      case 'taller':
        return '#F3F4F6'
      case 'en_viaje':
        return '#EFF6FF'
      case 'disponible': {
        const hours = tracto.horas_ociosas || 0
        if (hours < 3) return '#F0FDF4'
        if (hours < 5) return '#FFFBEB'
        if (hours < 12) return '#FFF7ED'
        return '#FEE2E2'
      }
      default:
        return tokens.bgCard
    }
  }

  const getStatusDot = (tracto: Tracto): string => {
    if (!tracto.activo) return tokens.gray

    switch (tracto.estado_operativo) {
      case 'baja':
      case 'taller':
        return tokens.gray
      case 'siniestro':
        return tokens.red
      case 'en_viaje':
        return tokens.blue
      case 'disponible': {
        const hours = tracto.horas_ociosas || 0
        if (hours < 3) return tokens.green
        if (hours < 5) return tokens.yellow
        if (hours < 12) return tokens.orange
        return tokens.red
      }
      default:
        return tokens.gray
    }
  }

  const filteredTractos = useMemo(() => {
    return tractos.filter((tracto) => {
      const matchesSearch =
        (tracto.numero_economico ?? '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        (tracto.placas ?? '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        (tracto.operador_asignado?.toLowerCase().includes(searchTerm.toLowerCase()) ?? false)

      const matchesEmpresa = !filterEmpresa || tracto.empresa === filterEmpresa
      const matchesEstado = !filterEstado || tracto.estado_operativo === filterEstado

      return matchesSearch && matchesEmpresa && matchesEstado
    })
  }, [tractos, searchTerm, filterEmpresa, filterEstado])

  const sortedTractos = useMemo(() => {
    const sorted = [...filteredTractos].sort((a, b) => {
      const aVal = a[sortColumn]
      const bVal = b[sortColumn]

      if (aVal === null || aVal === undefined) return 1
      if (bVal === null || bVal === undefined) return -1

      if (typeof aVal === 'string') {
        return sortDirection === 'asc'
          ? aVal.localeCompare(bVal as string)
          : (bVal as string).localeCompare(aVal)
      }

      return sortDirection === 'asc' ? (aVal as number) - (bVal as number) : (bVal as number) - (aVal as number)
    })

    return sorted
  }, [filteredTractos, sortColumn, sortDirection])

  const summary = useMemo(() => {
    const activos = tractos.filter((t) => t.activo).length
    const enViaje = tractos.filter((t) => t.activo && normalizarEstado(t.estado_operativo) === 'en_viaje').length
    const disponibles = tractos.filter((t) => t.activo && normalizarEstado(t.estado_operativo) === 'disponible').length
    const enTaller = tractos.filter((t) => t.activo && normalizarEstado(t.estado_operativo) === 'taller').length

    const costOciosoTotal = tractos
      .filter((t) => t.activo && normalizarEstado(t.estado_operativo) === 'disponible')
      .reduce((sum, t) => sum + (t.horas_ociosas || 0) * IDLE_COST_PER_HOUR, 0)

    return {
      activos,
      enViaje,
      disponibles,
      enTaller,
      costOciosoTotal,
    }
  }, [tractos])

  const openAddModal = () => {
    setEditingTracto(null)
    setFormData({
      estado_operativo: 'disponible',
      empresa: 'trob',
      activo: true,
      horas_ociosas: 0,
      km_acumulados: 0,
    })
    setShowModal(true)
  }

  const openEditModal = (tracto: Tracto) => {
    setEditingTracto(tracto)
    setFormData(tracto)
    setShowModal(true)
  }

  const closeModal = () => {
    setShowModal(false)
    setEditingTracto(null)
    setFormData({})
  }

  const handleInputChange = (field: keyof Tracto, value: any) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }))
  }

  const validateForm = (): string | null => {
    if (!formData.numero_economico?.trim()) return 'El número económico es requerido'
    if (!formData.placas?.trim()) return 'Las placas son requeridas'
    if (!formData.marca?.trim()) return 'La marca es requerida'
    if (!formData.modelo?.trim()) return 'El modelo es requerido'
    if (!formData.empresa) return 'La empresa es requerida'
    if (!formData.estado_operativo) return 'El estado operativo es requerido'
    return null
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    const validationError = validateForm()
    if (validationError) {
      setError(validationError)
      return
    }

    try {
      setSubmitting(true)
      setError(null)

      if (editingTracto) {
        const { error: updateError } = await supabase
          .from('tractos')
          .update({
            numero_economico: formData.numero_economico,
            placas: formData.placas,
            marca: formData.marca,
            modelo: formData.modelo,
            estado_operativo: formData.estado_operativo,
            viaje_actual: formData.viaje_actual,
            operador_asignado: formData.operador_asignado,
            horas_ociosas: formData.horas_ociosas || 0,
            km_acumulados: formData.km_acumulados || 0,
            empresa: formData.empresa,
            activo: formData.activo,
            updated_at: new Date().toISOString(),
          })
          .eq('id', editingTracto.id)

        if (updateError) throw updateError
      } else {
        const { error: insertError } = await supabase.from('tractos').insert({
          numero_economico: formData.numero_economico,
          placas: formData.placas,
          marca: formData.marca,
          modelo: formData.modelo,
          estado_operativo: formData.estado_operativo || 'disponible',
          viaje_actual: formData.viaje_actual || null,
          operador_asignado: formData.operador_asignado || null,
          horas_ociosas: formData.horas_ociosas || 0,
          km_acumulados: formData.km_acumulados || 0,
          empresa: formData.empresa || 'trob',
          activo: formData.activo !== false,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })

        if (insertError) throw insertError
      }

      await fetchTractos()
      closeModal()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al guardar tracto')
      console.error('Error submitting form:', err)
    } finally {
      setSubmitting(false)
    }
  }

  const handleToggleActivo = async (tracto: Tracto) => {
    try {
      setError(null)
      const { error: updateError } = await supabase
        .from('tractos')
        .update({
          activo: !tracto.activo,
          updated_at: new Date().toISOString(),
        })
        .eq('id', tracto.id)

      if (updateError) throw updateError
      await fetchTractos()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al actualizar tracto')
      console.error('Error toggling activo:', err)
    }
  }

  const handleSort = (column: keyof Tracto) => {
    if (sortColumn === column) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc')
    } else {
      setSortColumn(column)
      setSortDirection('asc')
    }
  }

  const SortIcon: React.FC<{ column: keyof Tracto }> = ({ column }) => {
    if (sortColumn !== column) {
      return <ChevronDown size={16} style={{ opacity: 0.3 }} />
    }
    return sortDirection === 'asc' ? (
      <ChevronUp size={16} style={{ color: tokens.primary }} />
    ) : (
      <ChevronDown size={16} style={{ color: tokens.primary }} />
    )
  }

  const summaryCards: SummaryCard[] = [
    {
      label: 'Total Activos',
      value: summary.activos,
      color: tokens.primary,
      icon: <CheckCircle size={20} style={{ color: tokens.primary }} />,
    },
    {
      label: 'En Viaje',
      value: summary.enViaje,
      color: tokens.blue,
      icon: <CheckCircle size={20} style={{ color: tokens.blue }} />,
    },
    {
      label: 'Disponibles',
      value: summary.disponibles,
      color: tokens.green,
      icon: <CheckCircle size={20} style={{ color: tokens.green }} />,
    },
    {
      label: 'En Taller',
      value: summary.enTaller,
      color: tokens.gray,
      icon: <CheckCircle size={20} style={{ color: tokens.gray }} />,
    },
    {
      label: 'Costo Ocioso del Día',
      value: `$${summary.costOciosoTotal.toLocaleString('en-US', { maximumFractionDigits: 2 })}`,
      color: tokens.red,
      icon: <AlertCircle size={20} style={{ color: tokens.red }} />,
    },
  ]

  return (
    <div style={{ fontFamily: tokens.fontFamily }}>
      {/* Header */}
      <div style={{ marginBottom: '2rem' }}>
        <h1
          style={{
            fontSize: '2rem',
            fontWeight: 700,
            color: tokens.textPrimary,
            marginBottom: '0.5rem',
          }}
        >
          Control de Tractos
        </h1>
        <p style={{ fontSize: '0.95rem', color: tokens.textSecondary }}>
          Gestión y monitoreo de tractocamiones de la flota
        </p>
      </div>

      {/* Summary Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '1rem', marginBottom: '2rem' }}>
        {summaryCards.map((card, idx) => (
          <div
            key={idx}
            style={{
              background: tokens.bgCard,
              border: `1px solid ${tokens.border}`,
              borderRadius: tokens.borderRadius,
              padding: '1.25rem',
              boxShadow: tokens.shadow,
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.75rem' }}>
              <span style={{ fontSize: '0.85rem', color: tokens.textSecondary, fontWeight: 500 }}>
                {card.label}
              </span>
              {card.icon}
            </div>
            <div style={{ fontSize: '1.75rem', fontWeight: 700, color: card.color }}>
              {card.value}
            </div>
          </div>
        ))}
      </div>

      {/* Error Alert */}
      {error && (
        <div
          style={{
            background: '#FEE2E2',
            border: `1px solid ${tokens.red}`,
            borderRadius: tokens.borderRadius,
            padding: '1rem',
            marginBottom: '1.5rem',
            display: 'flex',
            alignItems: 'center',
            gap: '0.75rem',
          }}
        >
          <AlertCircle size={20} style={{ color: tokens.red, flexShrink: 0 }} />
          <span style={{ color: tokens.red, fontSize: '0.95rem' }}>{error}</span>
          <button
            onClick={() => setError(null)}
            style={{
              marginLeft: 'auto',
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              color: tokens.red,
              padding: '0.25rem',
            }}
          >
            <X size={18} />
          </button>
        </div>
      )}

      {/* Controls */}
      <div
        style={{
          background: tokens.bgCard,
          border: `1px solid ${tokens.border}`,
          borderRadius: tokens.borderRadius,
          padding: '1.5rem',
          marginBottom: '1.5rem',
          boxShadow: tokens.shadow,
        }}
      >
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem', marginBottom: '1rem' }}>
          {/* Search Input */}
          <div style={{ position: 'relative' }}>
            <Search
              size={18}
              style={{
                position: 'absolute',
                left: '0.75rem',
                top: '50%',
                transform: 'translateY(-50%)',
                color: tokens.textSecondary,
              }}
            />
            <input
              type="text"
              placeholder="Buscar por número, placas u operador..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              style={{
                width: '100%',
                padding: '0.75rem 1rem 0.75rem 2.5rem',
                border: `1px solid ${tokens.border}`,
                borderRadius: '0.5rem',
                fontSize: '0.95rem',
                fontFamily: tokens.fontFamily,
                color: tokens.textPrimary,
              }}
            />
          </div>

          {/* Empresa Filter */}
          <select
            value={filterEmpresa}
            onChange={(e) => setFilterEmpresa(e.target.value)}
            style={{
              padding: '0.75rem',
              border: `1px solid ${tokens.border}`,
              borderRadius: '0.5rem',
              fontSize: '0.95rem',
              fontFamily: tokens.fontFamily,
              color: tokens.textPrimary,
              backgroundColor: tokens.bgCard,
            }}
          >
            <option value="">Todas las empresas</option>
            {empresas.map((empresa) => (
              <option key={empresa} value={empresa}>
                {empresa.toUpperCase()}
              </option>
            ))}
          </select>

          {/* Estado Filter */}
          <select
            value={filterEstado}
            onChange={(e) => setFilterEstado(e.target.value)}
            style={{
              padding: '0.75rem',
              border: `1px solid ${tokens.border}`,
              borderRadius: '0.5rem',
              fontSize: '0.95rem',
              fontFamily: tokens.fontFamily,
              color: tokens.textPrimary,
              backgroundColor: tokens.bgCard,
            }}
          >
            <option value="">Todos los estados</option>
            {estados.map((estado) => (
              <option key={estado} value={estado}>
                {estado?.replace(/_/g, ' ').toUpperCase() ?? '—'}
              </option>
            ))}
          </select>
        </div>

        {/* Add Button */}
        <button
          onClick={openAddModal}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
            padding: '0.75rem 1.25rem',
            background: tokens.primary,
            color: 'white',
            border: 'none',
            borderRadius: '0.5rem',
            fontSize: '0.95rem',
            fontWeight: 600,
            cursor: 'pointer',
            fontFamily: tokens.fontFamily,
          }}
        >
          <Plus size={18} />
          Agregar Tracto
        </button>
      </div>

      {/* Table */}
      <div
        style={{
          background: tokens.bgCard,
          border: `1px solid ${tokens.border}`,
          borderRadius: tokens.borderRadius,
          overflow: 'hidden',
          boxShadow: tokens.shadowMd,
        }}
      >
        {loading ? (
          <div
            style={{
              padding: '3rem',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '1rem',
              color: tokens.textSecondary,
            }}
          >
            <Loader size={20} style={{ animation: 'spin 1s linear infinite' }} />
            <span>Cargando tractos...</span>
          </div>
        ) : sortedTractos.length === 0 ? (
          <div
            style={{
              padding: '3rem',
              textAlign: 'center',
              color: tokens.textSecondary,
            }}
          >
            <p style={{ fontSize: '1rem', marginBottom: '0.5rem' }}>No hay tractos para mostrar</p>
            <p style={{ fontSize: '0.9rem' }}>Intenta ajustar los filtros o agregar un nuevo tracto</p>
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table
              style={{
                width: '100%',
                borderCollapse: 'collapse',
                fontSize: '0.95rem',
              }}
            >
              <thead>
                <tr style={{ borderBottom: `2px solid ${tokens.border}`, backgroundColor: '#F9FAFB' }}>
                  <th style={headerCellStyle('numero_economico')}>
                    <button
                      onClick={() => handleSort('numero_economico')}
                      style={sortButtonStyle}
                    >
                      Número Económico
                      <SortIcon column="numero_economico" />
                    </button>
                  </th>
                  <th style={headerCellStyle('placas')}>
                    <button onClick={() => handleSort('placas')} style={sortButtonStyle}>
                      Placas
                      <SortIcon column="placas" />
                    </button>
                  </th>
                  <th style={headerCellStyle('marca')}>
                    <button onClick={() => handleSort('marca')} style={sortButtonStyle}>
                      Marca
                      <SortIcon column="marca" />
                    </button>
                  </th>
                  <th style={headerCellStyle('modelo')}>
                    <button onClick={() => handleSort('modelo')} style={sortButtonStyle}>
                      Modelo
                      <SortIcon column="modelo" />
                    </button>
                  </th>
                  <th style={headerCellStyle('estado_operativo')}>
                    <button
                      onClick={() => handleSort('estado_operativo')}
                      style={sortButtonStyle}
                    >
                      Estado Operativo
                      <SortIcon column="estado_operativo" />
                    </button>
                  </th>
                  <th style={headerCellStyle('viaje_actual')}>Viaje Actual</th>
                  <th style={headerCellStyle('operador_asignado')}>Operador Asignado</th>
                  <th style={headerCellStyle('horas_ociosas')}>
                    <button
                      onClick={() => handleSort('horas_ociosas')}
                      style={sortButtonStyle}
                    >
                      Horas Ociosas
                      <SortIcon column="horas_ociosas" />
                    </button>
                  </th>
                  <th style={headerCellStyle('km_acumulados')}>
                    <button
                      onClick={() => handleSort('km_acumulados')}
                      style={sortButtonStyle}
                    >
                      Km Acumulados
                      <SortIcon column="km_acumulados" />
                    </button>
                  </th>
                  <th style={headerCellStyle('empresa')}>
                    <button onClick={() => handleSort('empresa')} style={sortButtonStyle}>
                      Empresa
                      <SortIcon column="empresa" />
                    </button>
                  </th>
                  <th style={headerCellStyle('activo')}>Activo</th>
                  <th style={headerCellStyle('id')}>Acciones</th>
                </tr>
              </thead>
              <tbody>
                {sortedTractos.map((tracto) => (
                  <tr
                    key={tracto.id}
                    style={{
                      borderBottom: `1px solid ${tokens.border}`,
                      backgroundColor: getRowColor(tracto),
                      transition: 'background-color 0.2s',
                      opacity: tracto.activo ? 1 : 0.6,
                    }}
                  >
                    <td style={cellStyle}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <div
                          style={{
                            width: '10px',
                            height: '10px',
                            borderRadius: '50%',
                            backgroundColor: getStatusDot(tracto),
                            flexShrink: 0,
                          }}
                        />
                        <span style={{ fontWeight: 600, color: tokens.textPrimary }}>
                          {tracto.numero_economico}
                        </span>
                      </div>
                    </td>
                    <td style={cellStyle}>{tracto.placas}</td>
                    <td style={cellStyle}>{tracto.marca}</td>
                    <td style={cellStyle}>{tracto.modelo}</td>
                    <td style={cellStyle}>
                      <span
                        style={{
                          display: 'inline-block',
                          padding: '0.25rem 0.75rem',
                          backgroundColor:
                            normalizarEstado(tracto.estado_operativo) === 'disponible'
                              ? '#F0FDF4'
                              : tracto.estado_operativo === 'en_viaje'
                                ? '#EFF6FF'
                                : tracto.estado_operativo === 'taller'
                                  ? '#F3F4F6'
                                  : '#FEE2E2',
                          color:
                            normalizarEstado(tracto.estado_operativo) === 'disponible'
                              ? tokens.green
                              : tracto.estado_operativo === 'en_viaje'
                                ? tokens.blue
                                : tracto.estado_operativo === 'taller'
                                  ? tokens.gray
                                  : tokens.red,
                          borderRadius: '0.375rem',
                          fontSize: '0.85rem',
                          fontWeight: 600,
                          textTransform: 'capitalize',
                        }}
                      >
                        {tracto.estado_operativo?.replace(/_/g, ' ') ?? '—'}
                      </span>
                    </td>
                    <td style={cellStyle}>
                      {tracto.viaje_actual ? (
                        <span
                          style={{
                            fontSize: '0.85rem',
                            color: tokens.primary,
                            fontWeight: 500,
                          }}
                        >
                          {tracto.viaje_actual}
                        </span>
                      ) : (
                        <span style={{ fontSize: '0.85rem', color: tokens.textSecondary }}>—</span>
                      )}
                    </td>
                    <td style={cellStyle}>
                      {tracto.operador_asignado ? (
                        <span style={{ fontSize: '0.95rem', color: tokens.textPrimary }}>
                          {tracto.operador_asignado}
                        </span>
                      ) : (
                        <span style={{ fontSize: '0.85rem', color: tokens.textSecondary }}>—</span>
                      )}
                    </td>
                    <td style={cellStyle}>
                      <span
                        style={{
                          fontSize: '0.95rem',
                          fontWeight: 500,
                          color:
                            tracto.horas_ociosas >= 12
                              ? tokens.red
                              : tracto.horas_ociosas >= 5
                                ? tokens.orange
                                : tracto.horas_ociosas >= 3
                                  ? tokens.yellow
                                  : tokens.green,
                        }}
                      >
                        {(tracto.horas_ociosas ?? 0).toFixed(1)}h
                      </span>
                    </td>
                    <td style={cellStyle}>
                      <span style={{ fontSize: '0.95rem', color: tokens.textPrimary }}>
                        {tracto.km_acumulados.toLocaleString('es-MX')}
                      </span>
                    </td>
                    <td style={cellStyle}>
                      <span
                        style={{
                          display: 'inline-block',
                          padding: '0.25rem 0.75rem',
                          backgroundColor: tokens.primaryLight,
                          color: tokens.primary,
                          borderRadius: '0.375rem',
                          fontSize: '0.85rem',
                          fontWeight: 600,
                          textTransform: 'uppercase',
                        }}
                      >
                        {tracto.empresa}
                      </span>
                    </td>
                    <td style={cellStyle}>
                      <button
                        onClick={() => handleToggleActivo(tracto)}
                        style={{
                          padding: '0.5rem 0.75rem',
                          border: `1px solid ${tracto.activo ? tokens.green : tokens.gray}`,
                          borderRadius: '0.375rem',
                          backgroundColor: tracto.activo ? '#F0FDF4' : '#F3F4F6',
                          color: tracto.activo ? tokens.green : tokens.gray,
                          fontSize: '0.85rem',
                          fontWeight: 600,
                          cursor: 'pointer',
                          fontFamily: tokens.fontFamily,
                        }}
                      >
                        {tracto.activo ? 'Activo' : 'Inactivo'}
                      </button>
                    </td>
                    <td style={cellStyle}>
                      <div style={{ display: 'flex', gap: '0.5rem' }}>
                        <button
                          onClick={() => openEditModal(tracto)}
                          style={{
                            padding: '0.5rem',
                            background: 'none',
                            border: 'none',
                            color: tokens.primary,
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            borderRadius: '0.375rem',
                            transition: 'background-color 0.2s',
                          }}
                          onMouseEnter={(e) => {
                            ;(e.currentTarget as HTMLElement).style.backgroundColor = tokens.primaryLight
                          }}
                          onMouseLeave={(e) => {
                            ;(e.currentTarget as HTMLElement).style.backgroundColor = 'transparent'
                          }}
                        >
                          <Edit2 size={18} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modal */}
      {showModal && (
        <Modal
          isOpen={showModal}
          onClose={closeModal}
          title={editingTracto ? 'Editar Tracto' : 'Agregar Nuevo Tracto'}
          onSubmit={handleSubmit}
          submitting={submitting}
        >
          <FormFields
            formData={formData}
            onInputChange={handleInputChange}
            empresas={empresas}
            estados={estados}
            editingTracto={editingTracto}
          />
        </Modal>
      )}

      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Montserrat:wght@400;500;600;700&display=swap');

        @keyframes spin {
          to {
            transform: rotate(360deg);
          }
        }
      `}</style>
    </div>
  )
}

interface ModalProps {
  isOpen: boolean
  onClose: () => void
  title: string
  onSubmit: (e: React.FormEvent) => void
  submitting: boolean
  children: React.ReactNode
}

const Modal: React.FC<ModalProps> = ({ isOpen, onClose, title, onSubmit, submitting, children }) => {
  if (!isOpen) return null

  return (
    <>
      <div
        onClick={onClose}
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.5)',
          zIndex: 40,
        }}
      />
      <div
        style={{
          position: 'fixed',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          backgroundColor: tokens.bgCard,
          borderRadius: tokens.borderRadius,
          padding: '2rem',
          maxWidth: '600px',
          width: '90%',
          maxHeight: '90vh',
          overflowY: 'auto',
          boxShadow: tokens.shadowMd,
          zIndex: 50,
          fontFamily: tokens.fontFamily,
        }}
      >
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            marginBottom: '1.5rem',
          }}
        >
          <h2
            style={{
              fontSize: '1.5rem',
              fontWeight: 700,
              color: tokens.textPrimary,
            }}
          >
            {title}
          </h2>
          <button
            onClick={onClose}
            style={{
              background: 'none',
              border: 'none',
              fontSize: '1.5rem',
              cursor: 'pointer',
              color: tokens.textSecondary,
              padding: '0',
            }}
          >
            <X size={24} />
          </button>
        </div>

        <form onSubmit={onSubmit}>
          {children}

          <div
            style={{
              display: 'flex',
              gap: '1rem',
              marginTop: '2rem',
              justifyContent: 'flex-end',
            }}
          >
            <button
              type="button"
              onClick={onClose}
              disabled={submitting}
              style={{
                padding: '0.75rem 1.5rem',
                backgroundColor: tokens.bgMain,
                color: tokens.textPrimary,
                border: `1px solid ${tokens.border}`,
                borderRadius: '0.5rem',
                fontSize: '0.95rem',
                fontWeight: 600,
                cursor: submitting ? 'not-allowed' : 'pointer',
                fontFamily: tokens.fontFamily,
                opacity: submitting ? 0.5 : 1,
              }}
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={submitting}
              style={{
                padding: '0.75rem 1.5rem',
                backgroundColor: tokens.primary,
                color: 'white',
                border: 'none',
                borderRadius: '0.5rem',
                fontSize: '0.95rem',
                fontWeight: 600,
                cursor: submitting ? 'not-allowed' : 'pointer',
                fontFamily: tokens.fontFamily,
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
                opacity: submitting ? 0.7 : 1,
              }}
            >
              {submitting ? <Loader size={18} style={{ animation: 'spin 1s linear infinite' }} /> : null}
              {submitting ? 'Guardando...' : 'Guardar'}
            </button>
          </div>
        </form>
      </div>
    </>
  )
}

interface FormFieldsProps {
  formData: Partial<Tracto>
  onInputChange: (field: keyof Tracto, value: any) => void
  empresas: string[]
  estados: EstadoOperativo[]
  editingTracto: Tracto | null
}

const FormFields: React.FC<FormFieldsProps> = ({
  formData,
  onInputChange,
  empresas,
  estados,
  editingTracto,
}) => {
  return (
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: '1fr 1fr',
        gap: '1.25rem',
      }}
    >
      {/* Número Económico */}
      <div style={{ gridColumn: '1 / -1' }}>
        <label style={labelStyle}>Número Económico *</label>
        <input
          type="text"
          value={formData.numero_economico || ''}
          onChange={(e) => onInputChange('numero_economico', e.target.value)}
          disabled={!!editingTracto}
          style={{
            ...inputStyle,
            opacity: editingTracto ? 0.6 : 1,
            cursor: editingTracto ? 'not-allowed' : 'text',
          }}
        />
      </div>

      {/* Placas */}
      <div>
        <label style={labelStyle}>Placas *</label>
        <input
          type="text"
          value={formData.placas || ''}
          onChange={(e) => onInputChange('placas', e.target.value)}
          style={inputStyle}
        />
      </div>

      {/* Marca */}
      <div>
        <label style={labelStyle}>Marca *</label>
        <input
          type="text"
          value={formData.marca || ''}
          onChange={(e) => onInputChange('marca', e.target.value)}
          style={inputStyle}
        />
      </div>

      {/* Modelo */}
      <div>
        <label style={labelStyle}>Modelo *</label>
        <input
          type="text"
          value={formData.modelo || ''}
          onChange={(e) => onInputChange('modelo', e.target.value)}
          style={inputStyle}
        />
      </div>

      {/* Estado Operativo */}
      <div>
        <label style={labelStyle}>Estado Operativo *</label>
        <select
          value={formData.estado_operativo || ''}
          onChange={(e) => onInputChange('estado_operativo', e.target.value as EstadoOperativo)}
          style={inputStyle}
        >
          <option value="">Seleccionar estado</option>
          {estados.map((estado) => (
            <option key={estado} value={estado}>
              {estado?.replace(/_/g, ' ').toUpperCase() ?? '—'}
            </option>
          ))}
        </select>
      </div>

      {/* Empresa */}
      <div>
        <label style={labelStyle}>Empresa *</label>
        <select
          value={formData.empresa || ''}
          onChange={(e) => onInputChange('empresa', e.target.value)}
          style={inputStyle}
        >
          <option value="">Seleccionar empresa</option>
          {empresas.map((empresa) => (
            <option key={empresa} value={empresa}>
              {empresa.toUpperCase()}
            </option>
          ))}
        </select>
      </div>

      {/* Viaje Actual */}
      <div>
        <label style={labelStyle}>Viaje Actual</label>
        <input
          type="text"
          value={formData.viaje_actual || ''}
          onChange={(e) => onInputChange('viaje_actual', e.target.value)}
          placeholder="ID del viaje o destino"
          style={inputStyle}
        />
      </div>

      {/* Operador Asignado */}
      <div>
        <label style={labelStyle}>Operador Asignado</label>
        <input
          type="text"
          value={formData.operador_asignado || ''}
          onChange={(e) => onInputChange('operador_asignado', e.target.value)}
          placeholder="Nombre del operador"
          style={inputStyle}
        />
      </div>

      {/* Horas Ociosas */}
      <div>
        <label style={labelStyle}>Horas Ociosas</label>
        <input
          type="number"
          value={formData.horas_ociosas || 0}
          onChange={(e) => onInputChange('horas_ociosas', parseFloat(e.target.value) || 0)}
          min="0"
          step="0.1"
          style={inputStyle}
        />
      </div>

      {/* Km Acumulados */}
      <div>
        <label style={labelStyle}>Km Acumulados</label>
        <input
          type="number"
          value={formData.km_acumulados || 0}
          onChange={(e) => onInputChange('km_acumulados', parseInt(e.target.value) || 0)}
          min="0"
          step="1"
          style={inputStyle}
        />
      </div>

      {/* Activo */}
      <div style={{ gridColumn: '1 / -1' }}>
        <label style={{ ...labelStyle, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <input
            type="checkbox"
            checked={formData.activo !== false}
            onChange={(e) => onInputChange('activo', e.target.checked)}
            style={{ width: '18px', height: '18px', cursor: 'pointer' }}
          />
          Tracto Activo
        </label>
      </div>
    </div>
  )
}

const headerCellStyle = (column: string): React.CSSProperties => ({
  padding: '1rem',
  textAlign: 'left',
  fontWeight: 600,
  color: tokens.textPrimary,
  fontSize: '0.9rem',
  textTransform: 'uppercase',
  letterSpacing: '0.5px',
  whiteSpace: 'nowrap',
})

const cellStyle: React.CSSProperties = {
  padding: '1rem',
  color: tokens.textPrimary,
  fontSize: '0.95rem',
  whiteSpace: 'nowrap',
}

const sortButtonStyle: React.CSSProperties = {
  background: 'none',
  border: 'none',
  cursor: 'pointer',
  color: tokens.textPrimary,
  display: 'flex',
  alignItems: 'center',
  gap: '0.5rem',
  padding: '0',
  fontFamily: tokens.fontFamily,
  fontWeight: 600,
  fontSize: 'inherit',
  textTransform: 'inherit',
  letterSpacing: 'inherit',
  whiteSpace: 'inherit',
}

const labelStyle: React.CSSProperties = {
  display: 'block',
  marginBottom: '0.5rem',
  fontSize: '0.95rem',
  fontWeight: 600,
  color: tokens.textPrimary,
}

const inputStyle: React.CSSProperties = {
  width: '100%',
  padding: '0.75rem',
  border: `1px solid ${tokens.border}`,
  borderRadius: '0.5rem',
  fontSize: '0.95rem',
  fontFamily: tokens.fontFamily,
  color: tokens.textPrimary,
  backgroundColor: tokens.bgCard,
  boxSizing: 'border-box',
}

export default ControlTractos
