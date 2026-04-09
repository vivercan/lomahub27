// OfertaEquipo.tsx â V2 â Real last-trip data from viajes_anodos
// Shows clients with their most recent trip info for equipment offers
import { useState, useEffect } from 'react'
import { ModuleLayout } from '../../components/layout/ModuleLayout'
import { Card } from '../../components/ui/Card'
import { Button } from '../../components/ui/Button'
import { Select } from '../../components/ui/Select'
import { DataTable } from '../../components/ui/DataTable'
import type { Column } from '../../components/ui/DataTable'
import { MessageSquare, RefreshCw, Truck, Users } from 'lucide-react'
import { KPICard } from '../../components/ui/KPICard'
import { tokens } from '../../lib/tokens'
import { supabase } from '../../lib/supabase'

/* âââ Types âââââââââââââââââââââââââââââââââââââââ */

interface ClienteRow {
  id: string
  cliente: string
  ultimaCarga: string
  rutaHabitual: string
  totalViajes: number
  ultimoTracto: string
}

/* âââ Component âââââââââââââââââââââââââââââââââââ */

export default function OfertaEquipo() {
  const [plaza, setPlaza] = useState<string>('')
  const [tipoEquipo, setTipoEquipo] = useState<string>('')
  const [selectedClientes, setSelectedClientes] = useState<Set<string>>(new Set())
  const [clientes, setClientes] = useState<ClienteRow[]>([])
  const [loading, setLoading] = useState(true)

  const fetchClientes = async () => {
    setLoading(true)
    try {
      // 1. Get last 90 days of viajes from ANODOS (paginated)
      const since = new Date()
      since.setDate(since.getDate() - 90)
      const sinceISO = since.toISOString()

      interface ViajeRow {
        cliente: string | null; tracto: string | null
        origen: string | null; destino: string | null
        inicia_viaje: string | null; fecha_crea: string | null
      }
      const allViajes: ViajeRow[] = []
      let offset = 0
      while (true) {
        const { data: vc } = await supabase
          .from('viajes_anodos')
          .select('cliente, tracto, origen, destino, inicia_viaje, fecha_crea')
          .gte('fecha_crea', sinceISO)
          .order('fecha_crea', { ascending: false })
          .range(offset, offset + 999)
        if (!vc || vc.length === 0) break
        allViajes.push(...vc)
        if (vc.length < 1000) break
        offset += 1000
      }

      // 2. Aggregate by cliente
      const clienteMap = new Map<string, {
        viajes: number
        lastDate: string
        lastOrigen: string
        lastDestino: string
        lastTracto: string
        rutas: Map<string, number>
      }>()

      for (const v of allViajes) {
        const cKey = v.cliente || 'SIN CLIENTE'
        if (!clienteMap.has(cKey)) {
          clienteMap.set(cKey, {
            viajes: 0,
            lastDate: v.inicia_viaje || v.fecha_crea || '',
            lastOrigen: v.origen || '?',
            lastDestino: v.destino || '?',
            lastTracto: v.tracto || 'â',
            rutas: new Map(),
          })
        }
        const cm = clienteMap.get(cKey)!
        cm.viajes++

        // Track most frequent route
        const rKey = `${v.origen || '?'} â ${v.destino || '?'}`
        cm.rutas.set(rKey, (cm.rutas.get(rKey) || 0) + 1)
      }

      // 3. Build rows
      const rows: ClienteRow[] = Array.from(clienteMap.entries())
        .map(([cKey, cm]) => {
          // Most frequent route
          let topRuta = 'â'
          let topRutaCount = 0
          for (const [ruta, count] of cm.rutas) {
            if (count > topRutaCount) {
              topRutaCount = count
              topRuta = ruta
            }
          }

          // Format date
          let ultimaCarga = 'â'
          if (cm.lastDate) {
            try {
              ultimaCarga = new Date(cm.lastDate).toLocaleDateString('es-MX', {
                day: '2-digit', month: 'short', year: 'numeric',
              })
            } catch {
              ultimaCarga = cm.lastDate.slice(0, 10)
            }
          }

          return {
            id: cKey,
            cliente: cKey,
            ultimaCarga,
            rutaHabitual: topRuta,
            totalViajes: cm.viajes,
            ultimoTracto: cm.lastTracto,
          }
        })
        .sort((a, b) => b.totalViajes - a.totalViajes)

      // Filter by plaza if selected
      const filtered = plaza
        ? rows.filter(r => {
            const plazaLower = plaza.toLowerCase()
            return r.rutaHabitual.toLowerCase().includes(plazaLower) ||
                   r.cliente.toLowerCase().includes(plazaLower)
          })
        : rows

      setClientes(filtered)
    } catch (err) {
      console.error('Error fetching clientes:', err)
      setClientes([])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { fetchClientes() }, [])

  const toggleClienteSelection = (clienteId: string) => {
    const n = new Set(selectedClientes)
    if (n.has(clienteId)) n.delete(clienteId)
    else n.add(clienteId)
    setSelectedClientes(n)
  }

  const handleBuscar = () => fetchClientes()

  const handleEnviarOferta = () => {
    const selected = clientes.filter(c => selectedClientes.has(c.id))
    const msg = `Oferta de equipo ${tipoEquipo || 'disponible'} en plaza ${plaza || 'general'}.\nClientes: ${selected.map(c => c.cliente).join(', ')}`
    console.log('Enviando oferta:', msg)
  }

  const plazaOptions = [
    { value: '', label: 'Todas las plazas' },
    { value: 'monterrey', label: 'Monterrey' },
    { value: 'cdmx', label: 'CDMX' },
    { value: 'guadalajara', label: 'Guadalajara' },
    { value: 'laredo', label: 'Laredo' },
    { value: 'veracruz', label: 'Veracruz' },
    { value: 'saltillo', label: 'Saltillo' },
    { value: 'queretaro', label: 'QuerÃ©taro' },
  ]

  const equipoOptions = [
    { value: '', label: 'Todos' },
    { value: 'tractocamion', label: 'TractocamiÃ³n' },
    { value: 'refrigerado', label: 'Refrigerado' },
    { value: 'flatbed', label: 'Flatbed' },
    { value: 'volteo', label: 'Volteo' },
  ]

  const clienteColumns: Column<ClienteRow>[] = [
    {
      key: 'select', label: '', width: '40px',
      render: (row) => (
        <input
          type="checkbox"
          checked={selectedClientes.has(row.id)}
          onChange={() => toggleClienteSelection(row.id)}
          style={{ accentColor: tokens.colors.primary }}
        />
      ),
    },
    {
      key: 'cliente', label: 'Cliente',
      render: (row) => (
        <span style={{ color: tokens.colors.textPrimary, fontWeight: 600, fontFamily: tokens.fonts.body }}>
          {row.cliente}
        </span>
      ),
    },
    {
      key: 'ultimaCarga', label: 'Ãltima Carga',
      render: (row) => (
        <span style={{ color: tokens.colors.textSecondary, fontFamily: tokens.fonts.body }}>
          {row.ultimaCarga}
        </span>
      ),
    },
    {
      key: 'rutaHabitual', label: 'Ruta Habitual',
      render: (row) => (
        <span style={{ color: tokens.colors.textSecondary, fontFamily: tokens.fonts.body, fontSize: '0.85rem' }}>
          {row.rutaHabitual}
        </span>
      ),
    },
    {
      key: 'totalViajes', label: 'Viajes (90d)', align: 'center',
      render: (row) => (
        <span style={{ color: tokens.colors.textPrimary, fontWeight: 600 }}>{row.totalViajes}</span>
      ),
    },
    {
      key: 'ultimoTracto', label: 'Ãltimo Tracto',
      render: (row) => (
        <span style={{ color: tokens.colors.textMuted, fontSize: '0.85rem' }}>{row.ultimoTracto}</span>
      ),
    },
  ]

  return (
    <ModuleLayout
      titulo="Oferta de Equipo"
      subtitulo="Clientes con historial de carga â datos ANODOS Ãºltimos 90 dÃ­as"
      acciones={
        <Button variant="secondary" size="sm" onClick={fetchClientes} loading={loading}>
          <RefreshCw size={16} />
          Actualizar
        </Button>
      }
    >
      {/* KPIs */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <KPICard titulo="Clientes" valor={clientes.length} color="blue" icono={<Users size={18} />} />
        <KPICard titulo="Seleccionados" valor={selectedClientes.size} color="primary" icono={<MessageSquare size={18} />} />
        <KPICard titulo="Con Viajes" valor={clientes.filter(c => c.totalViajes > 0).length} color="green" icono={<Truck size={18} />} />
        <KPICard titulo="Plaza" valor={plaza || 'Todas'} color="gray" />
      </div>

      {/* Filtros */}
      <div style={{ marginBottom: tokens.spacing.lg }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr auto', gap: tokens.spacing.md, alignItems: 'end' }}>
          <Select label="Plaza" value={plaza} onChange={(e) => setPlaza(e.target.value)} options={plazaOptions} />
          <Select label="Tipo de Equipo" value={tipoEquipo} onChange={(e) => setTipoEquipo(e.target.value)} options={equipoOptions} />
          <Button onClick={handleBuscar} variant="secondary">Buscar Clientes</Button>
        </div>
      </div>

      {/* Tabla */}
      <div style={{ marginBottom: tokens.spacing.lg }}>
        <Card noPadding>
          <DataTable
            columns={clienteColumns}
            data={clientes}
            loading={loading}
            emptyMessage="No hay clientes con viajes en los Ãºltimos 90 dÃ­as"
          />
        </Card>
      </div>

      {/* Enviar oferta */}
      <Button
        onClick={handleEnviarOferta}
        variant="primary"
        disabled={selectedClientes.size === 0}
        style={{ display: 'flex', alignItems: 'center', gap: tokens.spacing.sm }}
      >
        <MessageSquare size={18} />
        Enviar Oferta por WhatsApp ({selectedClientes.size})
      </Button>
    </ModuleLayout>
  )
}
