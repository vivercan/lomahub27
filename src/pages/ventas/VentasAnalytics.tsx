import { useState, useEffect, useRef } from 'react'
import {
  Search, ChevronDown, ChevronLeft, ChevronRight, Filter, Download, X, ArrowUpDown, Loader
} from 'lucide-react'
import { ModuleLayout } from '../../components/layout/ModuleLayout'
import { supabase } from '../../lib/supabase'
import { tokens } from '../../lib/tokens'
import type { Column } from '../../components/ui/DataTable'

interface Venta {
  id: string
  empresa: string
  contacto: string
  tipo_operacion: string
  tipo_equipo: string
  ruta_interes: string
  valor_estimado: number
  ejecutivo_nombre: string
  cs_asignada: string | null
  fecha_ultimo_mov: string
  estado: string
}

interface FilterState {
  empresas: string[]
  tiposOperacion: string[]
  tiposEquipo: string[]
  vendedor: string
  csAsignada: string
  fechaDesde: string
  fechaHasta: string
}

const TIPO_OPERACION_OPTIONS = ['Impo', 'Expo', 'Nacional', 'DTD']
const TIPO_EQUIPO_OPTIONS = ['Refrigerada', 'Seca']

function formatCurrency(value: number): string {
  return new Intl.NumberFormat('es-MX', {
    style: 'currency',
    currency: 'MXN',
    minimumFractionDigits: 0,
  }).format(value)
}

function formatNumber(value: number): string {
  return new Intl.NumberFormat('es-MX', { maximumFractionDigits: 0 }).format(value)
}

export default function VentasAnalytics() {
  const [ventas, setVentas] = useState<Venta[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [currentPage, setCurrentPage] = useState(1)
  const [rowsPerPage, setRowsPerPage] = useState(11)
  const [sortField, setSortField] = useState<keyof Venta>('fecha_ultimo_mov')
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('desc')

  // Dropdowns and multiselects
  const [showFilters, setShowFilters] = useState(false)
  const [empresas, setEmpresas] = useState<string[]>([])
  const [vendedores, setVendedores] = useState<{ id: string; nombre: string }[]>([])
  const [csTeam, setCsTeam] = useState<{ id: string; nombre: string }[]>([])
  const [showEmpresasDropdown, setShowEmpresasDropdown] = useState(false)
  const [showVendedoresDropdown, setShowVendedoresDropdown] = useState(false)
  const [showCsDropdown, setShowCsDropdown] = useState(false)

  const [filters, setFilters] = useState<FilterState>({
    empresas: [],
    tiposOperacion: [],
    tiposEquipo: [],
    vendedor: '',
    csAsignada: '',
    fechaDesde: '',
    fechaHasta: '',
  })

  const empresasRef = useRef<HTMLDivElement>(null)
  const vendedoresRef = useRef<HTMLDivElement>(null)
  const csRef = useRef<HTMLDivElement>(null)

  // Close dropdowns on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (empresasRef.current && !empresasRef.current.contains(e.target as Node)) {
        setShowEmpresasDropdown(false)
      }
      if (vendedoresRef.current && !vendedoresRef.current.contains(e.target as Node)) {
        setShowVendedoresDropdown(false)
      }
      if (csRef.current && !csRef.current.contains(e.target as Node)) {
        setShowCsDropdown(false)
      }
    }
    if (showEmpresasDropdown || showVendedoresDropdown || showCsDropdown) {
      document.addEventListener('mousedown', handleClickOutside)
    }
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [showEmpresasDropdown, showVendedoresDropdown, showCsDropdown])

  // Fetch data
  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    setLoading(true)
    setError(null)
    try {
      // Fetch closed-won leads (ventas)
      const { data: ventasData, error: ventasError } = await supabase
        .from('leads')
        .select('*')
        .eq('estado', 'Cerrado Ganado')
        .is('deleted_at', null)
        .order('fecha_ultimo_mov', { ascending: false })

      if (ventasError) throw ventasError

      // Fetch unique empresas/clientes
      const { data: clientesData } = await supabase
        .from('clientes')
        .select('nombre')
        .is('deleted_at', null)

      // Fetch vendedores
      const { data: vendedoresData } = await supabase
        .from('usuarios')
        .select('id, nombre')
        .eq('rol', 'ventas')

      // Fetch CS team
      const { data: csData } = await supabase
        .from('usuarios')
        .select('id, nombre')
        .eq('rol', 'cs')

      if (ventasData) {
        setVentas(ventasData as Venta[])
        // Extract unique empresas from data
        const uniqueEmpresas = [...new Set((ventasData as Venta[]).map(v => v.empresa))].filter(Boolean).sort()
        setEmpresas(uniqueEmpresas)
      }

      if (vendedoresData) setVendedores(vendedoresData as any)
      if (csData) setCsTeam(csData as any)
    } catch (err) {
      console.error('Error fetching data:', err)
      setError('Error al cargar los datos')
    } finally {
      setLoading(false)
    }
  }

  // Filter and search
  const filteredVentas = ventas.filter(venta => {
    // Search by empresa or contacto
    if (searchTerm && !venta.empresa.toLowerCase().includes(searchTerm.toLowerCase()) &&
        !venta.contacto.toLowerCase().includes(searchTerm.toLowerCase())) {
      return false
    }

    // Filter by empresas
    if (filters.empresas.length > 0 && !filters.empresas.includes(venta.empresa)) {
      return false
    }

    // Filter by tipo operacion
    if (filters.tiposOperacion.length > 0 && !filters.tiposOperacion.includes(venta.tipo_operacion)) {
      return false
    }

    // Filter by tipo equipo
    if (filters.tiposEquipo.length > 0 && !filters.tiposEquipo.includes(venta.tipo_equipo)) {
      return false
    }

    // Filter by vendedor
    if (filters.vendedor && venta.ejecutivo_nombre !== filters.vendedor) {
      return false
    }

    // Filter by CS
    if (filters.csAsignada && venta.cs_asignada !== filters.csAsignada) {
      return false
    }

    // Filter by date range
    if (filters.fechaDesde) {
      const ventaDate = new Date(venta.fecha_ultimo_mov)
      const desdeDate = new Date(filters.fechaDesde)
      if (ventaDate < desdeDate) return false
    }
    if (filters.fechaHasta) {
      const ventaDate = new Date(venta.fecha_ultimo_mov)
      const hastaDate = new Date(filters.fechaHasta)
      if (ventaDate > hastaDate) return false
    }

    return true
  })

  // Sort
  const sortedVentas = [...filteredVentas].sort((a, b) => {
    let aVal = a[sortField]
    let bVal = b[sortField]

    if (sortField === 'valor_estimado') {
      aVal = (a.valor_estimado || 0) as any
      bVal = (b.valor_estimado || 0) as any
    }

    if (typeof aVal === 'string') aVal = aVal.toLowerCase()
    if (typeof bVal === 'string') bVal = bVal.toLowerCase()

    if (aVal < bVal) return sortDir === 'asc' ? -1 : 1
    if (aVal > bVal) return sortDir === 'asc' ? 1 : -1
    return 0
  })

  // Pagination
  const totalPages = Math.ceil(sortedVentas.length / rowsPerPage)
  const paginatedVentas = sortedVentas.slice(
    (currentPage - 1) * rowsPerPage,
    currentPage * rowsPerPage
  )

  // KPI Calculations
  const totalVentas = filteredVentas.reduce((sum, v) => sum + (v.valor_estimado || 0), 0)
  const numOperaciones = filteredVentas.length
  const ticketPromedio = numOperaciones > 0 ? totalVentas / numOperaciones : 0
  const clientesActivos = [...new Set(filteredVentas.map(v => v.empresa))].length

  // Conversion rate (assumes all "Cerrado Ganado" came from pipeline)
  const { data: totalLeads } = supabase.from('leads').select('*', { count: 'exact', head: true }).is('deleted_at', null) as any
  const conversionRate = totalLeads && totalLeads.count > 0 ? (numOperaciones / totalLeads.count) * 100 : 0

  const handleSort = (field: keyof Venta) => {
    if (sortField === field) {
      setSortDir(sortDir === 'asc' ? 'desc' : 'asc')
    } else {
      setSortField(field)
      setSortDir('asc')
    }
  }

  const toggleEmpresa = (empresa: string) => {
    setFilters(prev => ({
      ...prev,
      empresas: prev.empresas.includes(empresa)
        ? prev.empresas.filter(e => e !== empresa)
        : [...prev.empresas, empresa]
    }))
  }

  const toggleTipoOperacion = (tipo: string) => {
    setFilters(prev => ({
      ...prev,
      tiposOperacion: prev.tiposOperacion.includes(tipo)
        ? prev.tiposOperacion.filter(t => t !== tipo)
        : [...prev.tiposOperacion, tipo]
    }))
  }

  const toggleTipoEquipo = (tipo: string) => {
    setFilters(prev => ({
      ...prev,
      tiposEquipo: prev.tiposEquipo.includes(tipo)
        ? prev.tiposEquipo.filter(t => t !== tipo)
        : [...prev.tiposEquipo, tipo]
    }))
  }

  const resetFilters = () => {
    setFilters({
      empresas: [],
      tiposOperacion: [],
      tiposEquipo: [],
      vendedor: '',
      csAsignada: '',
      fechaDesde: '',
      fechaHasta: '',
    })
    setSearchTerm('')
    setCurrentPage(1)
  }

  const headerStyle: React.CSSProperties = {
    fontFamily: tokens.fonts.body,
    fontSize: '13px',
    fontWeight: 600,
    color: tokens.colors.textSecondary,
    paddingLeft: '12px',
    paddingRight: '12px',
    paddingTop: '8px',
    paddingBottom: '8px',
    borderBottom: `1px solid ${tokens.colors.border}`,
    backgroundColor: '#F5F7FA',
    textTransform: 'uppercase',
    letterSpacing: '0.3px',
  }

  const cellStyle: React.CSSProperties = {
    fontFamily: tokens.fonts.body,
    fontSize: '13px',
    padding: '12px',
    borderBottom: `1px solid ${tokens.colors.border}`,
    color: tokens.colors.text,
  }

  return (
    <ModuleLayout
      titulo="Ventas"
      subtitulo="Analytics de operaciones cerradas"
      moduloPadre={{ nombre: 'Dashboard', ruta: '/dashboard' }}
    >
      <style>{`@import url('https://fonts.googleapis.com/css2?family=Montserrat:wght@400;500;600;700;800&display=swap');`}</style>

      <div style={{
        flex: 1,
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
        background: tokens.colors.bgMain,
        padding: '20px 24px',
        gap: '16px',
      }}>

        {/* Filters Bar */}
        <div style={{
          display: 'flex',
          gap: '12px',
          alignItems: 'center',
          flexWrap: 'wrap',
          padding: '14px 16px',
          background: '#FFFFFF',
          border: `1px solid ${tokens.colors.border}`,
          borderRadius: '8px',
        }}>
          <input
            type="text"
            placeholder="Buscar cliente..."
            value={searchTerm}
            onChange={(e) => {
              setSearchTerm(e.target.value)
              setCurrentPage(1)
            }}
            style={{
              flex: 1,
              minWidth: '180px',
              padding: '8px 12px',
              border: `1px solid ${tokens.colors.border}`,
              borderRadius: '6px',
              fontFamily: tokens.fonts.body,
              fontSize: '13px',
            }}
          />

          {/* Empresa/Cliente filter */}
          <div style={{ position: 'relative' }} ref={empresasRef}>
            <button
              onClick={() => setShowEmpresasDropdown(!showEmpresasDropdown)}
              style={{
                padding: '8px 12px',
                border: `1px solid ${tokens.colors.border}`,
                borderRadius: '6px',
                background: filters.empresas.length > 0 ? tokens.colors.primary : '#FFFFFF',
                color: filters.empresas.length > 0 ? '#FFFFFF' : tokens.colors.text,
                fontSize: '13px',
                fontFamily: tokens.fonts.body,
                fontWeight: 500,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
              }}
            >
              Empresa {filters.empresas.length > 0 && `(${filters.empresas.length})`}
              <ChevronDown size={14} />
            </button>
            {showEmpresasDropdown && (
              <div style={{
                position: 'absolute',
                top: '100%',
                left: 0,
                marginTop: '4px',
                background: '#FFFFFF',
                border: `1px solid ${tokens.colors.border}`,
                borderRadius: '6px',
                boxShadow: tokens.shadows.md,
                zIndex: 1000,
                minWidth: '200px',
                maxHeight: '300px',
                overflowY: 'auto',
              }}>
                {empresas.map(empresa => (
                  <label key={empresa} style={{
                    display: 'flex',
                    alignItems: 'center',
                    padding: '10px 12px',
                    cursor: 'pointer',
                    borderBottom: `1px solid ${tokens.colors.border}`,
                    fontFamily: tokens.fonts.body,
                    fontSize: '13px',
                  }}>
                    <input
                      type="checkbox"
                      checked={filters.empresas.includes(empresa)}
                      onChange={() => toggleEmpresa(empresa)}
                      style={{ marginRight: '8px', cursor: 'pointer' }}
                    />
                    {empresa}
                  </label>
                ))}
              </div>
            )}
          </div>

          {/* Date range filters */}
          <input
            type="date"
            value={filters.fechaDesde}
            onChange={(e) => {
              setFilters(prev => ({ ...prev, fechaDesde: e.target.value }))
              setCurrentPage(1)
            }}
            style={{
              padding: '8px 12px',
              border: `1px solid ${tokens.colors.border}`,
              borderRadius: '6px',
              fontFamily: tokens.fonts.body,
              fontSize: '13px',
            }}
          />
          <span style={{ color: tokens.colors.textMuted }}>–</span>
          <input
            type="date"
            value={filters.fechaHasta}
            onChange={(e) => {
              setFilters(prev => ({ ...prev, fechaHasta: e.target.value }))
              setCurrentPage(1)
            }}
            style={{
              padding: '8px 12px',
              border: `1px solid ${tokens.colors.border}`,
              borderRadius: '6px',
              fontFamily: tokens.fonts.body,
              fontSize: '13px',
            }}
          />

          {/* Tipo Operación */}
          <div style={{ display: 'flex', gap: '4px', alignItems: 'center' }}>
            {TIPO_OPERACION_OPTIONS.map(tipo => (
              <label key={tipo} style={{
                display: 'flex',
                alignItems: 'center',
                padding: '6px 10px',
                border: `1px solid ${tokens.colors.border}`,
                borderRadius: '6px',
                background: filters.tiposOperacion.includes(tipo) ? tokens.colors.primary : '#FFFFFF',
                color: filters.tiposOperacion.includes(tipo) ? '#FFFFFF' : tokens.colors.text,
                cursor: 'pointer',
                fontFamily: tokens.fonts.body,
                fontSize: '12px',
                fontWeight: 500,
              }}>
                <input
                  type="checkbox"
                  checked={filters.tiposOperacion.includes(tipo)}
                  onChange={() => {
                    toggleTipoOperacion(tipo)
                    setCurrentPage(1)
                  }}
                  style={{ marginRight: '4px', cursor: 'pointer' }}
                />
                {tipo}
              </label>
            ))}
          </div>

          {/* Tipo Equipo */}
          <div style={{ display: 'flex', gap: '4px', alignItems: 'center' }}>
            {TIPO_EQUIPO_OPTIONS.map(tipo => (
              <label key={tipo} style={{
                display: 'flex',
                alignItems: 'center',
                padding: '6px 10px',
                border: `1px solid ${tokens.colors.border}`,
                borderRadius: '6px',
                background: filters.tiposEquipo.includes(tipo) ? tokens.colors.primary : '#FFFFFF',
                color: filters.tiposEquipo.includes(tipo) ? '#FFFFFF' : tokens.colors.text,
                cursor: 'pointer',
                fontFamily: tokens.fonts.body,
                fontSize: '12px',
                fontWeight: 500,
              }}>
                <input
                  type="checkbox"
                  checked={filters.tiposEquipo.includes(tipo)}
                  onChange={() => {
                    toggleTipoEquipo(tipo)
                    setCurrentPage(1)
                  }}
                  style={{ marginRight: '4px', cursor: 'pointer' }}
                />
                {tipo}
              </label>
            ))}
          </div>

          {/* Vendedor */}
          <div style={{ position: 'relative' }} ref={vendedoresRef}>
            <button
              onClick={() => setShowVendedoresDropdown(!showVendedoresDropdown)}
              style={{
                padding: '8px 12px',
                border: `1px solid ${tokens.colors.border}`,
                borderRadius: '6px',
                background: filters.vendedor ? tokens.colors.primary : '#FFFFFF',
                color: filters.vendedor ? '#FFFFFF' : tokens.colors.text,
                fontSize: '13px',
                fontFamily: tokens.fonts.body,
                fontWeight: 500,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
              }}
            >
              Vendedor
              <ChevronDown size={14} />
            </button>
            {showVendedoresDropdown && (
              <div style={{
                position: 'absolute',
                top: '100%',
                left: 0,
                marginTop: '4px',
                background: '#FFFFFF',
                border: `1px solid ${tokens.colors.border}`,
                borderRadius: '6px',
                boxShadow: tokens.shadows.md,
                zIndex: 1000,
                minWidth: '180px',
                maxHeight: '300px',
                overflowY: 'auto',
              }}>
                <button
                  onClick={() => {
                    setFilters(prev => ({ ...prev, vendedor: '' }))
                    setShowVendedoresDropdown(false)
                    setCurrentPage(1)
                  }}
                  style={{
                    width: '100%',
                    padding: '10px 12px',
                    border: 'none',
                    background: 'transparent',
                    textAlign: 'left',
                    cursor: 'pointer',
                    fontFamily: tokens.fonts.body,
                    fontSize: '13px',
                    color: tokens.colors.textMuted,
                    borderBottom: `1px solid ${tokens.colors.border}`,
                  }}
                >
                  Todos
                </button>
                {vendedores.map(v => (
                  <button
                    key={v.id}
                    onClick={() => {
                      setFilters(prev => ({ ...prev, vendedor: v.nombre }))
                      setShowVendedoresDropdown(false)
                      setCurrentPage(1)
                    }}
                    style={{
                      width: '100%',
                      padding: '10px 12px',
                      border: 'none',
                      background: filters.vendedor === v.nombre ? '#EFF6FF' : 'transparent',
                      textAlign: 'left',
                      cursor: 'pointer',
                      fontFamily: tokens.fonts.body,
                      fontSize: '13px',
                      color: tokens.colors.text,
                      borderBottom: `1px solid ${tokens.colors.border}`,
                    }}
                  >
                    {v.nombre}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* CS Asignada */}
          <div style={{ position: 'relative' }} ref={csRef}>
            <button
              onClick={() => setShowCsDropdown(!showCsDropdown)}
              style={{
                padding: '8px 12px',
                border: `1px solid ${tokens.colors.border}`,
                borderRadius: '6px',
                background: filters.csAsignada ? tokens.colors.primary : '#FFFFFF',
                color: filters.csAsignada ? '#FFFFFF' : tokens.colors.text,
                fontSize: '13px',
                fontFamily: tokens.fonts.body,
                fontWeight: 500,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
              }}
            >
              CS Asignada
              <ChevronDown size={14} />
            </button>
            {showCsDropdown && (
              <div style={{
                position: 'absolute',
                top: '100%',
                left: 0,
                marginTop: '4px',
                background: '#FFFFFF',
                border: `1px solid ${tokens.colors.border}`,
                borderRadius: '6px',
                boxShadow: tokens.shadows.md,
                zIndex: 1000,
                minWidth: '180px',
                maxHeight: '300px',
                overflowY: 'auto',
              }}>
                <button
                  onClick={() => {
                    setFilters(prev => ({ ...prev, csAsignada: '' }))
                    setShowCsDropdown(false)
                    setCurrentPage(1)
                  }}
                  style={{
                    width: '100%',
                    padding: '10px 12px',
                    border: 'none',
                    background: 'transparent',
                    textAlign: 'left',
                    cursor: 'pointer',
                    fontFamily: tokens.fonts.body,
                    fontSize: '13px',
                    color: tokens.colors.textMuted,
                    borderBottom: `1px solid ${tokens.colors.border}`,
                  }}
                >
                  Todos
                </button>
                {csTeam.map(cs => (
                  <button
                    key={cs.id}
                    onClick={() => {
                      setFilters(prev => ({ ...prev, csAsignada: cs.nombre }))
                      setShowCsDropdown(false)
                      setCurrentPage(1)
                    }}
                    style={{
                      width: '100%',
                      padding: '10px 12px',
                      border: 'none',
                      background: filters.csAsignada === cs.nombre ? '#EFF6FF' : 'transparent',
                      textAlign: 'left',
                      cursor: 'pointer',
                      fontFamily: tokens.fonts.body,
                      fontSize: '13px',
                      color: tokens.colors.text,
                      borderBottom: `1px solid ${tokens.colors.border}`,
                    }}
                  >
                    {cs.nombre}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Reset button */}
          {(filters.empresas.length > 0 || filters.tiposOperacion.length > 0 || filters.tiposEquipo.length > 0 ||
            filters.vendedor || filters.csAsignada || filters.fechaDesde || filters.fechaHasta || searchTerm) && (
            <button
              onClick={resetFilters}
              style={{
                padding: '8px 12px',
                border: `1px solid ${tokens.colors.border}`,
                borderRadius: '6px',
                background: '#FEE2E2',
                color: '#DC2626',
                fontSize: '13px',
                fontFamily: tokens.fonts.body,
                fontWeight: 500,
                cursor: 'pointer',
              }}
            >
              Limpiar
            </button>
          )}
        </div>

        {/* KPI Cards */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
          gap: '12px',
        }}>
          <div style={{
            background: '#FFFFFF',
            border: `1px solid ${tokens.colors.border}`,
            borderRadius: '8px',
            padding: '16px',
            display: 'flex',
            flexDirection: 'column',
          }}>
            <div style={{
              fontSize: '12px',
              fontWeight: 500,
              color: tokens.colors.textSecondary,
              marginBottom: '8px',
              fontFamily: tokens.fonts.body,
            }}>Total ventas</div>
            <div style={{
              fontSize: '24px',
              fontWeight: 700,
              color: tokens.colors.primary,
              fontFamily: tokens.fonts.body,
            }}>{formatCurrency(totalVentas)}</div>
          </div>

          <div style={{
            background: '#FFFFFF',
            border: `1px solid ${tokens.colors.border}`,
            borderRadius: '8px',
            padding: '16px',
            display: 'flex',
            flexDirection: 'column',
          }}>
            <div style={{
              fontSize: '12px',
              fontWeight: 500,
              color: tokens.colors.textSecondary,
              marginBottom: '8px',
              fontFamily: tokens.fonts.body,
            }}>Operaciones</div>
            <div style={{
              fontSize: '24px',
              fontWeight: 700,
              color: tokens.colors.primary,
              fontFamily: tokens.fonts.body,
            }}>{formatNumber(numOperaciones)}</div>
          </div>

          <div style={{
            background: '#FFFFFF',
            border: `1px solid ${tokens.colors.border}`,
            borderRadius: '8px',
            padding: '16px',
            display: 'flex',
            flexDirection: 'column',
          }}>
            <div style={{
              fontSize: '12px',
              fontWeight: 500,
              color: tokens.colors.textSecondary,
              marginBottom: '8px',
              fontFamily: tokens.fonts.body,
            }}>Ticket promedio</div>
            <div style={{
              fontSize: '24px',
              fontWeight: 700,
              color: tokens.colors.primary,
              fontFamily: tokens.fonts.body,
            }}>{formatCurrency(ticketPromedio)}</div>
          </div>

          <div style={{
            background: '#FFFFFF',
            border: `1px solid ${tokens.colors.border}`,
            borderRadius: '8px',
            padding: '16px',
            display: 'flex',
            flexDirection: 'column',
          }}>
            <div style={{
              fontSize: '12px',
              fontWeight: 500,
              color: tokens.colors.textSecondary,
              marginBottom: '8px',
              fontFamily: tokens.fonts.body,
            }}>Clientes activos</div>
            <div style={{
              fontSize: '24px',
              fontWeight: 700,
              color: tokens.colors.primary,
              fontFamily: tokens.fonts.body,
            }}>{formatNumber(clientesActivos)}</div>
          </div>

          <div style={{
            background: '#FFFFFF',
            border: `1px solid ${tokens.colors.border}`,
            borderRadius: '8px',
            padding: '16px',
            display: 'flex',
            flexDirection: 'column',
          }}>
            <div style={{
              fontSize: '12px',
              fontWeight: 500,
              color: tokens.colors.textSecondary,
              marginBottom: '8px',
              fontFamily: tokens.fonts.body,
            }}>Conversión</div>
            <div style={{
              fontSize: '24px',
              fontWeight: 700,
              color: tokens.colors.primary,
              fontFamily: tokens.fonts.body,
            }}>{conversionRate.toFixed(1)}%</div>
          </div>
        </div>

        {/* Data Table */}
        <div style={{
          flex: 1,
          background: '#FFFFFF',
          border: `1px solid ${tokens.colors.border}`,
          borderRadius: '8px',
          overflow: 'hidden',
          display: 'flex',
          flexDirection: 'column',
        }}>
          {loading ? (
            <div style={{
              flex: 1,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px',
              color: tokens.colors.textMuted,
            }}>
              <Loader size={18} className="animate-spin" />
              Cargando...
            </div>
          ) : error ? (
            <div style={{
              flex: 1,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: tokens.colors.error,
            }}>
              {error}
            </div>
          ) : paginatedVentas.length === 0 ? (
            <div style={{
              flex: 1,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: tokens.colors.textMuted,
            }}>
              Sin resultados
            </div>
          ) : (
            <>
              <table style={{ width: '100%', borderCollapse: 'collapse', tableLayout: 'fixed' }}>
                <thead>
                  <tr style={{ background: '#F5F7FA', borderBottom: `1px solid ${tokens.colors.border}` }}>
                    <th style={{ ...headerStyle, width: '40px', textAlign: 'center' }}>#</th>
                    <th style={{ ...headerStyle, width: '120px', cursor: 'pointer' }} onClick={() => handleSort('empresa')}>
                      Cliente {sortField === 'empresa' && (sortDir === 'asc' ? '↑' : '↓')}
                    </th>
                    <th style={{ ...headerStyle, width: '80px', cursor: 'pointer' }} onClick={() => handleSort('tipo_operacion')}>
                      Tipo Op {sortField === 'tipo_operacion' && (sortDir === 'asc' ? '↑' : '↓')}
                    </th>
                    <th style={{ ...headerStyle, width: '80px', cursor: 'pointer' }} onClick={() => handleSort('tipo_equipo')}>
                      Equipo {sortField === 'tipo_equipo' && (sortDir === 'asc' ? '↑' : '↓')}
                    </th>
                    <th style={{ ...headerStyle, width: '80px', cursor: 'pointer' }} onClick={() => handleSort('ruta_interes')}>
                      Ruta {sortField === 'ruta_interes' && (sortDir === 'asc' ? '↑' : '↓')}
                    </th>
                    <th style={{ ...headerStyle, width: '100px', textAlign: 'right', cursor: 'pointer' }} onClick={() => handleSort('valor_estimado')}>
                      Valor (MXN) {sortField === 'valor_estimado' && (sortDir === 'asc' ? '↑' : '↓')}
                    </th>
                    <th style={{ ...headerStyle, width: '80px', cursor: 'pointer' }} onClick={() => handleSort('ejecutivo_nombre')}>
                      Vendedor {sortField === 'ejecutivo_nombre' && (sortDir === 'asc' ? '↑' : '↓')}
                    </th>
                    <th style={{ ...headerStyle, width: '80px', cursor: 'pointer' }} onClick={() => handleSort('cs_asignada')}>
                      CS {sortField === 'cs_asignada' && (sortDir === 'asc' ? '↑' : '↓')}
                    </th>
                    <th style={{ ...headerStyle, width: '90px', cursor: 'pointer' }} onClick={() => handleSort('fecha_ultimo_mov')}>
                      Fecha Cierre {sortField === 'fecha_ultimo_mov' && (sortDir === 'asc' ? '↑' : '↓')}
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {paginatedVentas.map((venta, idx) => (
                    <tr key={venta.id} style={{ borderBottom: `1px solid ${tokens.colors.border}`, background: idx % 2 === 0 ? '#FFFFFF' : '#F9FAFB' }}>
                      <td style={{ ...cellStyle, textAlign: 'center', color: tokens.colors.textMuted }}>
                        {(currentPage - 1) * rowsPerPage + idx + 1}
                      </td>
                      <td style={cellStyle}>{venta.empresa}</td>
                      <td style={cellStyle}>{venta.tipo_operacion}</td>
                      <td style={cellStyle}>{venta.tipo_equipo}</td>
                      <td style={cellStyle}>{venta.ruta_interes}</td>
                      <td style={{ ...cellStyle, textAlign: 'right', fontWeight: 500, color: tokens.colors.primary }}>
                        {formatCurrency(venta.valor_estimado || 0)}
                      </td>
                      <td style={cellStyle}>{venta.ejecutivo_nombre}</td>
                      <td style={cellStyle}>{venta.cs_asignada || '-'}</td>
                      <td style={cellStyle}>
                        {new Date(venta.fecha_ultimo_mov).toLocaleDateString('es-MX')}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>

              {/* Pagination */}
              <div style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '12px 16px',
                borderTop: `1px solid ${tokens.colors.border}`,
                background: '#F9FAFB',
                fontFamily: tokens.fonts.body,
                fontSize: '13px',
              }}>
                <div style={{ color: tokens.colors.textMuted }}>
                  {sortedVentas.length > 0
                    ? `${(currentPage - 1) * rowsPerPage + 1}–${Math.min(currentPage * rowsPerPage, sortedVentas.length)} de ${sortedVentas.length}`
                    : 'Sin resultados'}
                </div>
                <div style={{ display: 'flex', gap: '6px' }}>
                  <button
                    onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                    disabled={currentPage === 1}
                    style={{
                      padding: '6px 10px',
                      border: `1px solid ${tokens.colors.border}`,
                      borderRadius: '6px',
                      background: currentPage === 1 ? '#F3F4F6' : '#FFFFFF',
                      color: currentPage === 1 ? tokens.colors.textMuted : tokens.colors.text,
                      cursor: currentPage === 1 ? 'not-allowed' : 'pointer',
                      fontFamily: tokens.fonts.body,
                    }}
                  >
                    <ChevronLeft size={14} />
                  </button>
                  {Array.from({ length: Math.min(5, totalPages) }).map((_, i) => {
                    const pageNum = currentPage <= 3 ? i + 1 : currentPage - 2 + i
                    return (
                      <button
                        key={pageNum}
                        onClick={() => setCurrentPage(pageNum)}
                        style={{
                          width: '28px',
                          height: '28px',
                          border: `1px solid ${tokens.colors.border}`,
                          borderRadius: '6px',
                          background: pageNum === currentPage ? tokens.colors.primary : '#FFFFFF',
                          color: pageNum === currentPage ? '#FFFFFF' : tokens.colors.text,
                          cursor: 'pointer',
                          fontFamily: tokens.fonts.body,
                          fontSize: '12px',
                          fontWeight: 500,
                        }}
                      >
                        {pageNum}
                      </button>
                    )
                  })}
                  <button
                    onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                    disabled={currentPage === totalPages}
                    style={{
                      padding: '6px 10px',
                      border: `1px solid ${tokens.colors.border}`,
                      borderRadius: '6px',
                      background: currentPage === totalPages ? '#F3F4F6' : '#FFFFFF',
                      color: currentPage === totalPages ? tokens.colors.textMuted : tokens.colors.text,
                      cursor: currentPage === totalPages ? 'not-allowed' : 'pointer',
                      fontFamily: tokens.fonts.body,
                    }}
                  >
                    <ChevronRight size={14} />
                  </button>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </ModuleLayout>
  )
}
