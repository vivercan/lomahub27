import { useState, useEffect, useCallback } from 'react'
import type { ReactElement } from 'react'
import { RefreshCw, Users, Headphones, AlertTriangle, Clock } from 'lucide-react'
import { ModuleLayout } from '../../components/layout/ModuleLayout'
import { Card } from '../../components/ui/Card'
import { KPICard } from '../../components/ui/KPICard'
import { DataTable } from '../../components/ui/DataTable'
import { Semaforo } from '../../components/ui/Semaforo'
import type { SemaforoEstado } from '../../lib/tokens'
import { tokens } from '../../lib/tokens'
import { supabase } from '../../lib/supabase'

// =============================================================================
// TYPES
// =============================================================================

interface ClienteCS {
  id: string
  cliente: string
  tipo: string
  estado: SemaforoEstado
  estadoLabel: string
  viajesActivos: number
  ticketsAbiertos: number
  ultimoContacto: string
}

interface TicketResumen {
  id: string
  asunto: string
  cliente: string
  estado: string
  prioridad: string
  creado: string
  estadoColor: string
}

// =============================================================================
// HELPERS
// =============================================================================

function timeAgo(dateStr: string): string {
  if (!dateStr) return 'Sin registro'
  const now = new Date()
  const d = new Date(dateStr)
  const diffMs = now.getTime() - d.getTime()
  const mins = Math.floor(diffMs / 60000)
  if (mins < 1) return 'ahora'
  if (mins < 60) return `hace ${mins}m`
  const hrs = Math.floor(mins / 60)
  if (hrs < 24) return `hace ${hrs}h`
  const days = Math.floor(hrs / 24)
  if (days === 1) return 'ayer'
  if (days < 7) return `hace ${days}d`
  return d.toLocaleDateString('es-MX', { day: 'numeric', month: 'short' })
}

function getClienteHealth(
  tipo: string,
  viajesActivos: number,
  ticketsAbiertos: number
): { estado: SemaforoEstado; label: string } {
  // If client has open tickets = issue
  if (ticketsAbiertos >= 3) return { estado: 'rojo', label: 'Crítico' }
  if (ticketsAbiertos >= 1) return { estado: 'amarillo', label: 'Con tickets' }
  // Active trips = engaged
  if (viajesActivos > 0) return { estado: 'verde', label: 'Activo' }
  // Strategic/corporate clients without activity
  if (tipo === 'estrategico' || tipo === 'corporativo') {
    return { estado: 'amarillo', label: 'Sin actividad' }
  }
  return { estado: 'verde', label: 'Normal' }
}

// =============================================================================
// COMPONENT
// =============================================================================

export default function DashboardCS(): ReactElement {
  const [kpis, setKpis] = useState([
    { titulo: 'Clientes Activos', valor: '—', color: 'primary' as const },
    { titulo: 'Tickets Abiertos', valor: '—', color: 'orange' as const },
    { titulo: 'Viajes en Tránsito', valor: '—', color: 'green' as const },
    { titulo: 'Clientes Críticos', valor: '—', color: 'red' as const },
  ])

  const [clientes, setClientes] = useState<ClienteCS[]>([])
  const [tickets, setTickets] = useState<TicketResumen[]>([])
  const [resumen, setResumen] = useState('Cargando datos...')
  const [lastRefresh, setLastRefresh] = useState('')
  const [refreshing, setRefreshing] = useState(false)

  // ─── FETCH ALL DATA ───────────────────────────────────────────────
  const fetchAll = useCallback(async () => {
    setRefreshing(true)
    try {
      const [
        { data: clientesData },
        { count: clientesTotal },
        { count: viajesActivos },
        { count: viajesRiesgo },
        { count: viajesRetrasados },
        { data: ticketsData },
        { count: ticketsAbiertos },
      ] = await Promise.all([
        // Top 100 clientes with most activity (activo, corporativo, estrategico)
        supabase
          .from('clientes')
          .select('id, razon_social, tipo, updated_at')
          .is('deleted_at', null)
          .in('tipo', ['activo', 'corporativo', 'estrategico'])
          .order('updated_at', { ascending: false })
          .limit(100),
        // Total clientes activos
        supabase
          .from('clientes')
          .select('*', { count: 'exact', head: true })
          .is('deleted_at', null)
          .in('tipo', ['activo', 'corporativo', 'estrategico']),
        // Viajes en transito + programados
        supabase
          .from('viajes')
          .select('*', { count: 'exact', head: true })
          .in('estado', ['en_transito', 'programado']),
        // Viajes en riesgo
        supabase
          .from('viajes')
          .select('*', { count: 'exact', head: true })
          .eq('estado', 'en_riesgo'),
        // Viajes retrasados
        supabase
          .from('viajes')
          .select('*', { count: 'exact', head: true })
          .eq('estado', 'retrasado'),
        // Tickets recientes (open/in-progress)
        supabase
          .from('tickets')
          .select('id, asunto, cliente_nombre, estado, prioridad, created_at')
          .in('estado', ['abierto', 'en_progreso'])
          .order('created_at', { ascending: false })
          .limit(20),
        // Total tickets abiertos
        supabase
          .from('tickets')
          .select('*', { count: 'exact', head: true })
          .in('estado', ['abierto', 'en_progreso']),
      ])

      const ct = clientesTotal ?? 0
      const va = viajesActivos ?? 0
      const vr = viajesRiesgo ?? 0
      const vret = viajesRetrasados ?? 0
      const ta = ticketsAbiertos ?? 0

      // ─── FORMAT CLIENTES ──────────────────────────────────────
      // For now we don't have per-client viaje/ticket counts from a single query
      // We show the top clients with health based on type
      const formattedClientes: ClienteCS[] = (clientesData || []).map((c: any) => {
        const health = getClienteHealth(c.tipo || 'activo', 0, 0)
        return {
          id: c.id,
          cliente: c.razon_social || 'Sin nombre',
          tipo: c.tipo || 'activo',
          estado: health.estado,
          estadoLabel: health.label,
          viajesActivos: 0,
          ticketsAbiertos: 0,
          ultimoContacto: timeAgo(c.updated_at),
        }
      })
      setClientes(formattedClientes)

      // ─── FORMAT TICKETS ───────────────────────────────────────
      const formattedTickets: TicketResumen[] = (ticketsData || []).map((t: any) => ({
        id: t.id?.substring(0, 8)?.toUpperCase() || '—',
        asunto: t.asunto || 'Sin asunto',
        cliente: t.cliente_nombre || '—',
        estado: t.estado === 'abierto' ? 'Abierto' : 'En Progreso',
        prioridad: t.prioridad || 'normal',
        creado: timeAgo(t.created_at),
        estadoColor:
          t.estado === 'abierto' ? tokens.colors.orange : tokens.colors.blue,
      }))
      setTickets(formattedTickets)

      // ─── COMPUTE CRITICAL CLIENTS ─────────────────────────────
      // Clients with tickets = critical attention needed
      const criticos = ta > 0 ? Math.min(ta, ct) : 0

      // ─── UPDATE KPIS ──────────────────────────────────────────
      setKpis([
        { titulo: 'Clientes Activos', valor: ct.toLocaleString(), color: 'primary' as const },
        { titulo: 'Tickets Abiertos', valor: ta.toString(), color: ta > 0 ? 'orange' as const : 'green' as const },
        { titulo: 'Viajes en Tránsito', valor: va.toString(), color: 'green' as const },
        { titulo: 'Clientes Críticos', valor: criticos.toString(), color: criticos > 0 ? 'red' as const : 'green' as const },
      ])

      // ─── RESUMEN 8AM ──────────────────────────────────────────
      const riskTotal = vr + vret
      const parts: string[] = []
      parts.push(`${ct.toLocaleString()} clientes activos`)
      parts.push(`${va} viajes en tránsito`)
      if (riskTotal > 0) {
        parts.push(`${vr} en riesgo, ${vret} retrasados`)
      } else {
        parts.push('operación normal — sin viajes en riesgo')
      }
      if (ta > 0) {
        parts.push(`${ta} tickets abiertos requiriendo atención`)
      } else {
        parts.push('sin tickets abiertos — bandeja limpia')
      }
      setResumen(parts.join(' · '))

      // Refresh timestamp
      setLastRefresh(
        new Date().toLocaleTimeString('es-MX', {
          hour: '2-digit',
          minute: '2-digit',
          second: '2-digit',
        })
      )
    } catch (err) {
      console.error('DashboardCS fetch error:', err)
    } finally {
      setRefreshing(false)
    }
  }, [])

  // Initial fetch + auto-refresh every 30 seconds
  useEffect(() => {
    fetchAll()
    const interval = setInterval(fetchAll, 30000)
    return () => clearInterval(interval)
  }, [fetchAll])

  // ─── TABLE COLUMNS ──────────────────────────────────────────────
  const clientesColumns = [
    {
      key: 'cliente',
      label: 'Cliente',
      width: '30%',
    },
    {
      key: 'tipo',
      label: 'Tipo',
      width: '15%',
      render: (row: ClienteCS) => (
        <span
          style={{
            padding: '2px 8px',
            borderRadius: '10px',
            fontSize: '11px',
            fontWeight: 600,
            background:
              row.tipo === 'estrategico'
                ? `${tokens.colors.primary}22`
                : row.tipo === 'corporativo'
                  ? `${tokens.colors.blue}22`
                  : `${tokens.colors.green}22`,
            color:
              row.tipo === 'estrategico'
                ? tokens.colors.primary
                : row.tipo === 'corporativo'
                  ? tokens.colors.blue
                  : tokens.colors.green,
          }}
        >
          {row.tipo.charAt(0).toUpperCase() + row.tipo.slice(1)}
        </span>
      ),
    },
    {
      key: 'estado',
      label: 'Salud',
      width: '20%',
      render: (row: ClienteCS) => (
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Semaforo estado={row.estado} />
          <span style={{ fontSize: '12px', color: tokens.colors.textSecondary }}>
            {row.estadoLabel}
          </span>
        </div>
      ),
    },
    {
      key: 'ultimoContacto',
      label: 'Último Contacto',
      width: '20%',
    },
  ]

  const ticketsColumns = [
    { key: 'id', label: 'ID', width: '10%' },
    { key: 'asunto', label: 'Asunto', width: '30%' },
    { key: 'cliente', label: 'Cliente', width: '22%' },
    {
      key: 'estado',
      label: 'Estado',
      width: '15%',
      render: (row: TicketResumen) => (
        <span
          style={{
            padding: '2px 10px',
            borderRadius: '10px',
            fontSize: '11px',
            fontWeight: 600,
            background: `${row.estadoColor}22`,
            color: row.estadoColor,
          }}
        >
          {row.estado}
        </span>
      ),
    },
    {
      key: 'prioridad',
      label: 'Prioridad',
      width: '12%',
      render: (row: TicketResumen) => {
        const colors: Record<string, string> = {
          alta: tokens.colors.red,
          media: tokens.colors.yellow,
          normal: tokens.colors.textSecondary,
          baja: tokens.colors.textMuted,
        }
        return (
          <span style={{ color: colors[row.prioridad] || tokens.colors.textSecondary, fontWeight: 600, fontSize: '12px' }}>
            {row.prioridad.charAt(0).toUpperCase() + row.prioridad.slice(1)}
          </span>
        )
      },
    },
    { key: 'creado', label: 'Creado', width: '11%' },
  ]

  // ─── RENDER ──────────────────────────────────────────────────────
  return (
    <ModuleLayout titulo="Dashboard Servicio a Clientes" subtitulo="Centro de Atención y Monitoreo">
      <div className="space-y-6">

        {/* Refresh bar */}
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
          }}
        >
          <span
            style={{
              fontSize: '12px',
              color: tokens.colors.textMuted,
              fontFamily: tokens.fonts.body,
            }}
          >
            {lastRefresh ? `Última actualización: ${lastRefresh}` : 'Cargando datos...'}
            {' · Auto-refresh cada 30s'}
          </span>
          <button
            onClick={fetchAll}
            disabled={refreshing}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              padding: '6px 14px',
              background: tokens.colors.bgCard,
              border: `1px solid ${tokens.colors.border}`,
              borderRadius: tokens.radius.md,
              color: refreshing ? tokens.colors.textMuted : tokens.colors.primary,
              cursor: refreshing ? 'default' : 'pointer',
              fontFamily: tokens.fonts.body,
              fontSize: '12px',
              fontWeight: 600,
              transition: 'all 0.15s ease',
            }}
          >
            <RefreshCw
              size={14}
              style={{
                animation: refreshing ? 'spin 1s linear infinite' : 'none',
              }}
            />
            {refreshing ? 'Actualizando...' : 'Actualizar'}
          </button>
        </div>

        {/* Resumen 8AM */}
        <Card>
          <div className="flex items-center gap-2 mb-3">
            <Headphones className="w-5 h-5" style={{ color: tokens.colors.primary }} />
            <h3
              style={{
                margin: 0,
                color: tokens.colors.textPrimary,
                fontFamily: tokens.fonts.heading,
                fontSize: '15px',
                fontWeight: 700,
              }}
            >
              Resumen Operativo
            </h3>
          </div>
          <div
            style={{
              padding: '12px 16px',
              backgroundColor: `${tokens.colors.primary}0a`,
              borderRadius: tokens.radius.md,
              border: `1px solid ${tokens.colors.primary}15`,
              color: tokens.colors.textPrimary,
              lineHeight: 1.7,
              fontSize: '13px',
              fontFamily: tokens.fonts.body,
            }}
          >
            {resumen}
          </div>
        </Card>

        {/* KPIs */}
        <div className="grid grid-cols-4 gap-4">
          {kpis.map((kpi) => (
            <KPICard
              key={kpi.titulo}
              titulo={kpi.titulo}
              valor={kpi.valor}
              color={kpi.color}
            />
          ))}
        </div>

        {/* Tickets Abiertos */}
        <Card>
          <div className="mb-4 flex items-center gap-2">
            <AlertTriangle className="w-5 h-5" style={{ color: tokens.colors.orange }} />
            <h2
              className="text-lg font-bold"
              style={{
                color: tokens.colors.textPrimary,
                fontFamily: tokens.fonts.heading,
              }}
            >
              Tickets Abiertos
            </h2>
            {tickets.length > 0 && (
              <span
                style={{
                  padding: '2px 10px',
                  borderRadius: '12px',
                  fontSize: '11px',
                  fontWeight: 700,
                  background: `${tokens.colors.orange}22`,
                  color: tokens.colors.orange,
                }}
              >
                {tickets.length}
              </span>
            )}
          </div>
          {tickets.length === 0 ? (
            <div
              style={{
                textAlign: 'center',
                padding: '40px 16px',
                color: tokens.colors.textMuted,
              }}
            >
              <Headphones
                style={{
                  width: 32,
                  height: 32,
                  margin: '0 auto 12px',
                  color: tokens.colors.green,
                }}
              />
              <p style={{ fontSize: '15px', fontWeight: 600, margin: 0, color: tokens.colors.green }}>
                Bandeja limpia
              </p>
              <p style={{ fontSize: '13px', marginTop: '6px' }}>
                No hay tickets abiertos — todos los clientes atendidos
              </p>
            </div>
          ) : (
            <DataTable columns={ticketsColumns} data={tickets} />
          )}
        </Card>

        {/* Mis Clientes */}
        <Card>
          <div className="mb-4 flex items-center gap-2">
            <Users className="w-5 h-5" style={{ color: tokens.colors.primary }} />
            <h2
              className="text-lg font-bold"
              style={{
                color: tokens.colors.textPrimary,
                fontFamily: tokens.fonts.heading,
              }}
            >
              Clientes Activos
            </h2>
            {clientes.length > 0 && (
              <span
                style={{
                  padding: '2px 10px',
                  borderRadius: '12px',
                  fontSize: '11px',
                  fontWeight: 700,
                  background: `${tokens.colors.primary}22`,
                  color: tokens.colors.primary,
                }}
              >
                {clientes.length}
              </span>
            )}
          </div>
          {clientes.length === 0 ? (
            <div
              style={{
                textAlign: 'center',
                padding: '48px 16px',
                color: tokens.colors.textMuted,
              }}
            >
              <p style={{ fontSize: '18px', fontWeight: 500, margin: 0 }}>Sin datos</p>
              <p style={{ fontSize: '14px', marginTop: '8px' }}>
                Los datos se cargarán cuando estén disponibles en el sistema
              </p>
            </div>
          ) : (
            <DataTable columns={clientesColumns} data={clientes} />
          )}
        </Card>

      </div>

      {/* Spin animation for refresh button */}
      <style>{`
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>
    </ModuleLayout>
  )
}
