import type { ReactElement } from 'react'
import { useState, useEffect, useRef } from 'react'
import { ModuleLayout } from '../../components/layout/ModuleLayout'
import { Card } from '../../components/ui/Card'
import { KPICard } from '../../components/ui/KPICard'
import { DataTable } from '../../components/ui/DataTable'
import { Select } from '../../components/ui/Select'
import { Semaforo } from '../../components/ui/Semaforo'
import type { SemaforoEstado } from '../../lib/tokens'
import { tokens } from '../../lib/tokens'
import { supabase } from '../../lib/supabase'
import { Truck, AlertTriangle, Clock, CheckCircle2, BarChart3, X, Search } from 'lucide-react'

/* ──── types ──── */
interface Viaje {
  folio: string
  cliente: string
  ruta: string
  tracto: string
  eta: string
  cita: string
  diferencia: number
  estadoViaje: string
  semaforo: SemaforoEstado
  kmRuta: number
  viajesHistoricos: number
  origen?: string
  destino?: string
  clienteId?: string
}

interface CSUser {
  id: string
  nombre_completo: string
  email: string
}

interface RutaStats {
  ruta: string
  totalViajes: number
  avgKm: number
}

/* ──── helpers ──── */
const estadoToSemaforo = (estado: string): SemaforoEstado => {
  switch (estado) {
    case 'en_transito': return 'verde'
    case 'programado': return 'azul'
    case 'en_riesgo': return 'amarillo'
    case 'retrasado': return 'rojo'
    case 'entregado': return 'gris'
    default: return 'azul'
  }
}

const estadoLabel = (estado: string): string => {
  switch (estado) {
    case 'en_transito': return 'En Tránsito'
    case 'programado': return 'Programado'
    case 'en_riesgo': return 'En Riesgo'
    case 'retrasado': return 'Retrasado'
    case 'entregado': return 'Entregado'
    default: return estado || 'Sin estado'
  }
}

/* Fetch route statistics from viajes_anodos (last 90 days) */
async function fetchRutaStats(): Promise<Map<string, RutaStats>> {
  const hace90d = new Date()
  hace90d.setDate(hace90d.getDate() - 90)
  const desde = hace90d.toISOString()

  const rutaMap = new Map<string, { total: number; kmSum: number }>()
  let offset = 0
  const PAGE = 1000

  while (true) {
    const { data, error } = await supabase
      .from('viajes_anodos')
      .select('origen_ciudad, destino_ciudad, km_total')
      .gte('inicia_viaje', desde)
      .range(offset, offset + PAGE - 1)

    if (error) { console.error('ruta stats:', error); break }
    if (!data || data.length === 0) break

    for (const row of data) {
      const ruta = `${row.origen_ciudad || '?'} → ${row.destino_ciudad || '?'}`
      const prev = rutaMap.get(ruta) || { total: 0, kmSum: 0 }
      prev.total += 1
      prev.kmSum += Number(row.km_total) || 0
      rutaMap.set(ruta, prev)
    }

    if (data.length < PAGE) break
    offset += PAGE
  }

  // Fallback to fecha_crea if no results
  if (rutaMap.size === 0) {
    offset = 0
    while (true) {
      const { data, error } = await supabase
        .from('viajes_anodos')
        .select('origen_ciudad, destino_ciudad, km_total')
        .gte('fecha_crea', desde)
        .range(offset, offset + PAGE - 1)

      if (error) break
      if (!data || data.length === 0) break

      for (const row of data) {
        const ruta = `${row.origen_ciudad || '?'} → ${row.destino_ciudad || '?'}`
        const prev = rutaMap.get(ruta) || { total: 0, kmSum: 0 }
        prev.total += 1
        prev.kmSum += Number(row.km_total) || 0
        rutaMap.set(ruta, prev)
      }

      if (data.length < PAGE) break
      offset += PAGE
    }
  }

  const result = new Map<string, RutaStats>()
  rutaMap.forEach((v, ruta) => {
    result.set(ruta, { ruta, totalViajes: v.total, avgKm: v.total > 0 ? Math.round(v.kmSum / v.total) : 0 })
  })
  return result
}

/* ──── MultiSelectDropdown Component ──── */
interface MultiSelectProps {
  label: string
  options: { value: string; label: string }[]
  selectedValues: string[]
  onChange: (values: string[]) => void
  placeholder?: string
  searchPlaceholder?: string
}

function MultiSelectDropdown({
  label,
  options,
  selectedValues,
  onChange,
  placeholder = 'Seleccionar...',
  searchPlaceholder = 'Buscar...',
}: MultiSelectProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const dropdownRef = useRef<HTMLDivElement>(null)

  // Handle click outside to close dropdown
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const filteredOptions = options.filter(opt =>
    opt.label.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const handleToggle = (value: string) => {
    if (selectedValues.includes(value)) {
      onChange(selectedValues.filter(v => v !== value))
    } else {
      onChange([...selectedValues, value])
    }
  }

  const displayLabel = selectedValues.length === 0
    ? placeholder
    : selectedValues.length === 1
      ? options.find(o => o.value === selectedValues[0])?.label || placeholder
      : `${selectedValues.length} seleccionado${selectedValues.length !== 1 ? 's' : ''}`

  return (
    <div ref={dropdownRef} style={{ position: 'relative', width: '100%' }}>
      <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, marginBottom: '6px', color: tokens.colors.textSecondary }}>
        {label}
      </label>
      <button
        onClick={() => setIsOpen(!isOpen)}
        style={{
          width: '100%',
          padding: '10px 12px',
          border: `1px solid ${tokens.colors.border}`,
          borderRadius: tokens.radius.md,
          backgroundColor: tokens.colors.bg,
          color: tokens.colors.text,
          cursor: 'pointer',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          fontSize: '14px',
          transition: 'all 0.2s',
        }}
        onMouseEnter={(e) => {
          if (!isOpen) (e.currentTarget as HTMLElement).style.borderColor = tokens.colors.blue
        }}
        onMouseLeave={(e) => {
          if (!isOpen) (e.currentTarget as HTMLElement).style.borderColor = tokens.colors.border
        }}
      >
        <span>{displayLabel}</span>
        <span style={{ fontSize: '12px' }}>{isOpen ? '▲' : '▼'}</span>
      </button>

      {isOpen && (
        <div
          style={{
            position: 'absolute',
            top: '100%',
            left: 0,
            right: 0,
            marginTop: '4px',
            backgroundColor: tokens.colors.bg,
            border: `1px solid ${tokens.colors.border}`,
            borderRadius: tokens.radius.md,
            boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
            zIndex: 1000,
            maxHeight: '300px',
            overflowY: 'auto',
          }}
        >
          {/* Search Input */}
          <div style={{ padding: '8px', borderBottom: `1px solid ${tokens.colors.border}`, position: 'sticky', top: 0, backgroundColor: tokens.colors.bg }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '8px 12px', backgroundColor: tokens.colors.bgSecondary, borderRadius: tokens.radius.sm }}>
              <Search size={14} color={tokens.colors.textSecondary} />
              <input
                type="text"
                placeholder={searchPlaceholder}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                style={{
                  flex: 1,
                  border: 'none',
                  backgroundColor: 'transparent',
                  color: tokens.colors.text,
                  fontSize: '13px',
                  outline: 'none',
                }}
              />
            </div>
          </div>

          {/* Options */}
          {filteredOptions.length === 0 ? (
            <div style={{ padding: '12px', textAlign: 'center', color: tokens.colors.textSecondary, fontSize: '13px' }}>
              Sin resultados
            </div>
          ) : (
            filteredOptions.map(opt => (
              <label
                key={opt.value}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '10px',
                  padding: '10px 12px',
                  cursor: 'pointer',
                  backgroundColor: selectedValues.includes(opt.value) ? tokens.colors.bgSecondary : 'transparent',
                  borderLeft: selectedValues.includes(opt.value) ? `3px solid ${tokens.colors.blue}` : '3px solid transparent',
                  transition: 'all 0.2s',
                }}
                onMouseEnter={(e) => {
                  if (!selectedValues.includes(opt.value)) {
                    (e.currentTarget as HTMLElement).style.backgroundColor = tokens.colors.bgSecondary
                  }
                }}
                onMouseLeave={(e) => {
                  if (!selectedValues.includes(opt.value)) {
                    (e.currentTarget as HTMLElement).style.backgroundColor = 'transparent'
                  }
                }}
              >
                <input
                  type="checkbox"
                  checked={selectedValues.includes(opt.value)}
                  onChange={() => handleToggle(opt.value)}
                  style={{
                    cursor: 'pointer',
                    width: '16px',
                    height: '16px',
                    accentColor: tokens.colors.blue,
                  }}
                />
                <span style={{ fontSize: '13px', flex: 1 }}>{opt.label}</span>
              </label>
            ))
          )}
        </div>
      )}
    </div>
  )
}

/* ──── MapModal Component ──── */
interface MapModalProps {
  viaje: Viaje | null
  onClose: () => void
}

function MapModal({ viaje, onClose }: MapModalProps) {
  if (!viaje) return null

  const [mapUrl, setMapUrl] = useState('')

  useEffect(() => {
    // Create a simple OpenStreetMap embed URL using the route
    // Since we don't have exact GPS coordinates, we'll use a generic map view
    // In production, you'd want to geocode origen and destino
    const encodedRoute = encodeURIComponent(`${viaje.origen || 'Origen'}, Mexico to ${viaje.destino || 'Destino'}, Mexico`)
    setMapUrl(`https://www.openstreetmap.org/export/embed.html?bbox=-120,15,-85,35&layer=mapnik`)
  }, [viaje])

  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 2000,
      }}
      onClick={onClose}
    >
      <Card
        style={{
          width: '90%',
          maxWidth: '800px',
          maxHeight: '90vh',
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
          position: 'relative',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            paddingBottom: tokens.spacing.md,
            borderBottom: `1px solid ${tokens.colors.border}`,
          }}
        >
          <h2 style={{ margin: 0, fontSize: '18px', fontWeight: 600 }}>Ruta: {viaje.folio}</h2>
          <button
            onClick={onClose}
            style={{
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              padding: '4px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: tokens.colors.textSecondary,
            }}
          >
            <X size={20} />
          </button>
        </div>

        {/* Content */}
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: tokens.spacing.md, paddingTop: tokens.spacing.md, overflowY: 'auto' }}>
          {/* Trip Details */}
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(2, 1fr)',
              gap: tokens.spacing.md,
              padding: tokens.spacing.md,
              backgroundColor: tokens.colors.bgSecondary,
              borderRadius: tokens.radius.md,
            }}
          >
            <div>
              <span style={{ fontSize: '12px', color: tokens.colors.textSecondary }}>Cliente</span>
              <p style={{ margin: '4px 0 0', fontSize: '14px', fontWeight: 500 }}>{viaje.cliente}</p>
            </div>
            <div>
              <span style={{ fontSize: '12px', color: tokens.colors.textSecondary }}>Tracto</span>
              <p style={{ margin: '4px 0 0', fontSize: '14px', fontWeight: 500 }}>{viaje.tracto}</p>
            </div>
            <div>
              <span style={{ fontSize: '12px', color: tokens.colors.textSecondary }}>Origen</span>
              <p style={{ margin: '4px 0 0', fontSize: '14px', fontWeight: 500 }}>{viaje.origen || '—'}</p>
            </div>
            <div>
              <span style={{ fontSize: '12px', color: tokens.colors.textSecondary }}>Destino</span>
              <p style={{ margin: '4px 0 0', fontSize: '14px', fontWeight: 500 }}>{viaje.destino || '—'}</p>
            </div>
            <div>
              <span style={{ fontSize: '12px', color: tokens.colors.textSecondary }}>ETA</span>
              <p style={{ margin: '4px 0 0', fontSize: '14px', fontWeight: 500 }}>{viaje.eta}</p>
            </div>
            <div>
              <span style={{ fontSize: '12px', color: tokens.colors.textSecondary }}>Cita</span>
              <p style={{ margin: '4px 0 0', fontSize: '14px', fontWeight: 500 }}>{viaje.cita}</p>
            </div>
          </div>

          {/* Map */}
          <div
            style={{
              width: '100%',
              height: '400px',
              borderRadius: tokens.radius.md,
              overflow: 'hidden',
              border: `1px solid ${tokens.colors.border}`,
              backgroundColor: tokens.colors.bgSecondary,
            }}
          >
            {mapUrl ? (
              <iframe
                src={mapUrl}
                style={{
                  width: '100%',
                  height: '100%',
                  border: 'none',
                }}
                allowFullScreen={true}
                loading="lazy"
              />
            ) : (
              <div
                style={{
                  width: '100%',
                  height: '100%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: tokens.colors.textSecondary,
                }}
              >
                Cargando mapa...
              </div>
            )}
          </div>
        </div>
      </Card>
    </div>
  )
}

/* ──── component ──── */
export default function TorreControl(): ReactElement {
  const [viajes, setViajes] = useState<Viaje[]>([])
  const [loading, setLoading] = useState(true)
  const [filtroEmpresas, setFiltroEmpresas] = useState<string[]>([])
  const [filtroCS, setFiltroCS] = useState<string[]>([])
  const [filtroEstado, setFiltroEstado] = useState('')
  const [totalViajesMes, setTotalViajesMes] = useState(0)
  const [csUsers, setCSUsers] = useState<CSUser[]>([])
  const [selectedViaje, setSelectedViaje] = useState<Viaje | null>(null)

  useEffect(() => {
    const fetchViajes = async () => {
      try {
        setLoading(true)

        // Fetch active viajes + route stats + CS users in parallel
        const [viajesResp, rutaStats, mesCount, csResp] = await Promise.all([
          supabase
            .from('viajes')
            .select('*, clientes(razon_social), tractos(numero_economico)')
            .not('estado', 'eq', 'cancelado')
            .order('created_at', { ascending: false }),
          fetchRutaStats(),
          supabase
            .from('viajes_anodos')
            .select('*', { count: 'exact', head: true })
            .gte('inicia_viaje', new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString()),
          supabase
            .from('usuarios')
            .select('id, nombre_completo, email')
            .eq('rol', 'cs')
            .order('nombre_completo', { ascending: true }),
        ])

        if (viajesResp.error) {
          console.error('Error fetching viajes:', viajesResp.error)
          setViajes([])
          return
        }

        // Set CS users
        if (csResp.data) {
          setCSUsers(csResp.data)
        }

        setTotalViajesMes(mesCount.count || 0)

        const formattedViajes = (viajesResp.data || []).map((viaje: any) => {
          const eta = viaje.eta_calculado ? new Date(viaje.eta_calculado) : null
          const cita = viaje.cita_descarga ? new Date(viaje.cita_descarga) : null
          const diffMin = eta && cita ? Math.round((eta.getTime() - cita.getTime()) / 60000) : 0
          const ruta = `${viaje.origen || '?'} → ${viaje.destino || '?'}`
          const stats = rutaStats.get(ruta)

          return {
            folio: viaje.folio || viaje.id?.substring(0, 8)?.toUpperCase() || '—',
            cliente: viaje.clientes?.razon_social || viaje.cliente_nombre || '—',
            ruta,
            tracto: viaje.tractos?.numero_economico || viaje.tracto_numero || '—',
            eta: eta ? eta.toLocaleString('es-MX', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }) : '—',
            cita: cita ? cita.toLocaleString('es-MX', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }) : '—',
            diferencia: diffMin,
            estadoViaje: viaje.estado || 'programado',
            semaforo: estadoToSemaforo(viaje.estado || 'programado'),
            kmRuta: stats?.avgKm || 0,
            viajesHistoricos: stats?.totalViajes || 0,
            origen: viaje.origen,
            destino: viaje.destino,
            clienteId: viaje.cliente_id,
          }
        })

        setViajes(formattedViajes)
      } catch (err) {
        console.error('Unexpected error:', err)
        setViajes([])
      } finally {
        setLoading(false)
      }
    }

    fetchViajes()
  }, [])

  const getDiferenciaColor = (diferencia: number) => {
    if (diferencia <= 0) return tokens.colors.green
    if (diferencia <= 60) return tokens.colors.yellow
    return tokens.colors.red
  }

  // Apply filters
  const filteredViajes = viajes.filter(v => {
    if (filtroEstado && v.estadoViaje !== filtroEstado) return false
    if (filtroEmpresas.length > 0 && !filtroEmpresas.includes(v.cliente)) return false
    // CS filter would be applied if we had CS info in viaje data
    // For now, we'll skip CS filtering since it's not in the viaje schema
    return true
  })

  // Compute KPIs from all viajes
  const enTransito = viajes.filter(v => v.estadoViaje === 'en_transito').length
  const enRiesgo = viajes.filter(v => v.estadoViaje === 'en_riesgo').length
  const retrasados = viajes.filter(v => v.estadoViaje === 'retrasado').length
  const programados = viajes.filter(v => v.estadoViaje === 'programado').length

  const viajesColumns = [
    { key: 'folio', label: 'Folio' },
    { key: 'cliente', label: 'Cliente' },
    { key: 'ruta', label: 'Origen → Destino' },
    { key: 'tracto', label: 'Tracto' },
    { key: 'eta', label: 'ETA' },
    { key: 'cita', label: 'Cita' },
    {
      key: 'diferencia',
      label: 'Diferencia',
      render: (row: Viaje) => (
        <span style={{ color: getDiferenciaColor(row.diferencia), fontWeight: 600 }}>
          {row.diferencia > 0 ? '+' : ''}{row.diferencia} min
        </span>
      ),
    },
    {
      key: 'kmRuta',
      label: 'Km Ruta',
      align: 'center' as const,
      render: (row: Viaje) => (
        <span style={{ color: tokens.colors.textSecondary, fontSize: '13px' }}>
          {row.kmRuta > 0 ? `${row.kmRuta.toLocaleString()} km` : '—'}
        </span>
      ),
    },
    {
      key: 'viajesHistoricos',
      label: 'Hist 90d',
      align: 'center' as const,
      render: (row: Viaje) => (
        <span style={{
          color: row.viajesHistoricos > 20 ? tokens.colors.green : row.viajesHistoricos > 5 ? tokens.colors.blue : tokens.colors.textMuted,
          fontSize: '13px', fontWeight: 600,
        }}>
          {row.viajesHistoricos > 0 ? row.viajesHistoricos : '—'}
        </span>
      ),
    },
    {
      key: 'estadoViaje',
      label: 'Estado',
      render: (row: Viaje) => (
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Semaforo estado={row.semaforo} />
          <span>{estadoLabel(row.estadoViaje)}</span>
        </div>
      ),
    },
  ]

  // Function to make DataTable rows clickable for map
  const handleRowClick = (row: Viaje) => {
    setSelectedViaje(row)
  }

  // Extract unique empresas for filter
  const empresasUnicas = [...new Set(viajes.map(v => v.cliente).filter(c => c !== '—'))]

  // Prepare CS options for filter
  const csOptions = [
    { value: 'sin_asignar', label: 'Sin asignar' },
    ...csUsers.map(cs => ({ value: cs.id, label: cs.nombre_completo })),
  ]

  return (
    <>
      <MapModal viaje={selectedViaje} onClose={() => setSelectedViaje(null)} />
      <ModuleLayout titulo="Torre de Control" moduloPadre={{ nombre: 'Operaciones', ruta: '/operaciones/dashboard' }}>
      {/* KPIs */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: tokens.spacing.md, marginBottom: tokens.spacing.lg }}>
        <KPICard titulo="En Tránsito" valor={enTransito} color="green" icono={<Truck size={18} />} />
        <KPICard titulo="En Riesgo" valor={enRiesgo} color="yellow" icono={<AlertTriangle size={18} />} />
        <KPICard titulo="Retrasados" valor={retrasados} color="red" icono={<Clock size={18} />} />
        <KPICard titulo="Programados" valor={programados} color="primary" icono={<CheckCircle2 size={18} />} />
        <KPICard titulo="Viajes del Mes" valor={totalViajesMes.toLocaleString()} color="blue" icono={<BarChart3 size={18} />} />
      </div>

      {/* Filtros */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: tokens.spacing.md, marginBottom: tokens.spacing.lg }}>
        <MultiSelectDropdown
          label="Empresa"
          placeholder="Todas las empresas"
          options={empresasUnicas.map(e => ({ value: e, label: e }))}
          selectedValues={filtroEmpresas}
          onChange={(vals) => setFiltroEmpresas(vals)}
          searchPlaceholder="Buscar empresa..."
        />
        <MultiSelectDropdown
          label="CS Asignada"
          placeholder="Todos los CS"
          options={csOptions}
          selectedValues={filtroCS}
          onChange={(vals) => setFiltroCS(vals)}
          searchPlaceholder="Buscar CS..."
        />
        <Select
          label="Estado"
          placeholder="Todos los estados"
          value={filtroEstado}
          onChange={(val) => setFiltroEstado(val)}
          options={[
            { value: 'en_transito', label: 'En Tránsito' },
            { value: 'en_riesgo', label: 'En Riesgo' },
            { value: 'retrasado', label: 'Retrasado' },
            { value: 'programado', label: 'Programado' },
          ]}
        />
      </div>

      {/* Viajes DataTable */}
      <Card>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: tokens.spacing.md }}>
          <h3 style={{ margin: 0 }}>Monitoreo de Viajes</h3>
          {!loading && viajes.length > 0 && (
            <span style={{ fontSize: '13px', color: tokens.colors.textSecondary }}>
              {filteredViajes.length} de {viajes.length} viajes
            </span>
          )}
        </div>

        {loading ? (
          <div style={{ textAlign: 'center', padding: '48px 0', color: tokens.colors.textSecondary }}>
            <p>Cargando viajes...</p>
          </div>
        ) : filteredViajes.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '48px 0', color: tokens.colors.textSecondary }}>
            <p style={{ fontSize: '18px', fontWeight: 500, margin: 0 }}>Sin datos</p>
            <p style={{ fontSize: '14px', marginTop: '4px' }}>
              {viajes.length > 0 ? 'No hay viajes que coincidan con los filtros' : 'Los datos se cargarán cuando estén disponibles en el sistema'}
            </p>
          </div>
        ) : (
          <div
            style={{
              overflowX: 'auto',
            }}
          >
            <table
              style={{
                width: '100%',
                borderCollapse: 'collapse',
                fontSize: '13px',
              }}
            >
              <thead>
                <tr
                  style={{
                    borderBottom: `1px solid ${tokens.colors.border}`,
                    backgroundColor: tokens.colors.bgSecondary,
                  }}
                >
                  {viajesColumns.map(col => (
                    <th
                      key={col.key}
                      style={{
                        padding: '12px',
                        textAlign: (col.align as 'left' | 'center' | 'right') || 'left',
                        fontWeight: 600,
                        color: tokens.colors.textSecondary,
                      }}
                    >
                      {col.label}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filteredViajes.map((row, idx) => (
                  <tr
                    key={idx}
                    onClick={() => handleRowClick(row)}
                    style={{
                      borderBottom: `1px solid ${tokens.colors.border}`,
                      cursor: 'pointer',
                      transition: 'all 0.2s',
                      backgroundColor: 'transparent',
                    }}
                    onMouseEnter={(e) => {
                      (e.currentTarget as HTMLElement).style.backgroundColor = tokens.colors.bgSecondary
                    }}
                    onMouseLeave={(e) => {
                      (e.currentTarget as HTMLElement).style.backgroundColor = 'transparent'
                    }}
                  >
                    {viajesColumns.map(col => (
                      <td
                        key={col.key}
                        style={{
                          padding: '12px',
                          textAlign: (col.align as 'left' | 'center' | 'right') || 'left',
                          color: tokens.colors.text,
                        }}
                      >
                        {col.render ? col.render(row) : (row as any)[col.key]}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </ModuleLayout>
    </>
  )
}
