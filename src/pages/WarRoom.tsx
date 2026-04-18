import { useEffect, useState, useCallback } from 'react'
import { AlertCircle, RefreshCw } from 'lucide-react'
import { ModuleLayout } from '../components/layout/ModuleLayout'
import { Card } from '../components/ui/Card'
import { KPICard } from '../components/ui/KPICard'
import { Semaforo } from '../components/ui/Semaforo'
import { tokens } from '../lib/tokens'
import { supabase } from '../lib/supabase'
import type { SemaforoEstado } from '../lib/tokens'

// ============================================================================
// TYPES
// ============================================================================

interface KPI {
  titulo: string
  valor: string
  color: 'green' | 'blue' | 'primary' | 'orange'
}

interface Area {
  nombre: string
  estado: SemaforoEstado
  detalle: string
}

interface Alerta {
  id: number
  mensaje: string
  tipo: 'warning' | 'danger' | 'info'
  hora: string
}

// ============================================================================
// HELPERS
// ============================================================================

function timeAgo(dateStr: string): string {
  const now = new Date()
  const d = new Date(dateStr)
  const diffMs = now.getTime() - d.getTime()
  const mins = Math.floor(diffMs / 60000)
  if (mins < 1) return 'ahora'
  if (mins < 60) return `hace ${mins}m`
  const hrs = Math.floor(mins / 60)
  if (hrs < 24) return `hace ${hrs}h`
  const days = Math.floor(hrs / 24)
  return `hace ${days}d`
}

function formatCurrency(n: number): string {
  if (n >= 1_000_000) return `$${(n / 1_000_000).toFixed(1)}M`
  if (n >= 1_000) return `$${(n / 1_000).toFixed(0)}K`
  return `$${n.toLocaleString()}`
}

// ============================================================================
// COMPONENT
// ============================================================================

export default function WarRoom() {
  const [kpis, setKpis] = useState<KPI[]>([
    { titulo: 'Viajes Activos', valor: '—', color: 'green' },
    { titulo: 'Flota Operativa', valor: '—', color: 'blue' },
    { titulo: 'Formatos Activos', valor: '—', color: 'primary' },
    { titulo: 'Leads Pipeline', valor: '—', color: 'orange' },
  ])

  const [areas, setAreas] = useState<Area[]>([
    { nombre: 'Ventas', estado: 'gris', detalle: 'Cargando...' },
    { nombre: 'CS', estado: 'gris', detalle: 'Cargando...' },
    { nombre: 'Operaciones', estado: 'gris', detalle: 'Cargando...' },
    { nombre: 'CxC', estado: 'gris', detalle: 'Cargando...' },
    { nombre: 'GPS', estado: 'gris', detalle: 'Cargando...' },
  ])

  const [alertas, setAlertas] = useState<Alerta[]>([])
  const [lastRefresh, setLastRefresh] = useState<string>('')
  const [refreshing, setRefreshing] = useState(false)

  // ─── FETCH ALL DATA ─────────────────────────────────
  const fetchAll = useCallback(async () => {
    setRefreshing(true)
    try {
      // Parallel queries for maximum speed
      const [
        { count: viajesActivos },
        { count: viajesRiesgo },
        { count: viajesRetrasados },
        { count: tractosTotal },
        { count: cajasTotal },
        { count: formatosActivos },
        { count: leadsTotal },
        { count: leadsNuevos },
        { count: clientesTotal },
        { count: ticketsAbiertos },
        { count: cxcTotal },
        { count: gpsUnidades },
        { data: gpsRecent },
      ] = await Promise.all([
        // Viajes activos (filtrar por estados operativos, NO por columna 'activo' que no existe)
        supabase
          .from('viajes')
          .select('*', { count: 'exact', head: true })
          .in('estado', ['asignado', 'en_transito', 'en_curso', 'programado']),
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
        // Tractos totales
        supabase
          .from('tractos')
          .select('*', { count: 'exact', head: true }),
        // Cajas totales
        supabase
          .from('cajas')
          .select('*', { count: 'exact', head: true }),
        // Formatos venta activos
        supabase
          .from('formatos_venta')
          .select('*', { count: 'exact', head: true })
          .eq('activo', true),
        // Leads totales (no deleted)
        supabase
          .from('leads')
          .select('*', { count: 'exact', head: true })
          .is('deleted_at', null),
        // Leads nuevos (estado = Nuevo)
        supabase
          .from('leads')
          .select('*', { count: 'exact', head: true })
          .is('deleted_at', null)
          .eq('estado', 'Nuevo'),
        // Clientes activos
        supabase
          .from('clientes')
          .select('*', { count: 'exact', head: true })
          .is('deleted_at', null),
        // Tickets abiertos
        supabase
          .from('tickets')
          .select('*', { count: 'exact', head: true })
          .in('estado', ['abierto', 'en_progreso']),
        // CXC cartera (tabla real es cxc_cartera, NO cxc_cuentas)
        supabase
          .from('cxc_cartera')
          .select('*', { count: 'exact', head: true }),
        // GPS unidades (tabla real es gps_tracking, NOT gps_unidades)
        supabase
          .from('gps_tracking')
          .select('*', { count: 'exact', head: true }),
        // GPS last tracking (most recent position)
        supabase
          .from('gps_tracking')
          .select('ultima_actualizacion')
          .order('ultima_actualizacion', { ascending: false })
          .limit(1),
      ])

      // ─── UPDATE KPIs ────────────────────────────────
      const va = viajesActivos ?? 0
      const tr = tractosTotal ?? 0
      const ca = cajasTotal ?? 0
      const fa = formatosActivos ?? 0
      const lt = leadsTotal ?? 0

      setKpis([
        { titulo: 'Viajes Activos', valor: va.toString(), color: 'green' },
        { titulo: 'Flota Operativa', valor: `${tr} / ${ca}`, color: 'blue' },
        { titulo: 'Formatos Activos', valor: fa.toLocaleString(), color: 'primary' },
        { titulo: 'Leads Pipeline', valor: lt.toString(), color: 'orange' },
      ])

      // ─── DYNAMIC SEMAPHORE ──────────────────────────
      const vr = viajesRiesgo ?? 0
      const vret = viajesRetrasados ?? 0
      const ln = leadsNuevos ?? 0
      const ta = ticketsAbiertos ?? 0
      const cx = cxcTotal ?? 0
      const gu = gpsUnidades ?? 0

      // Ventas health: based on pipeline health
      const ventasEstado: SemaforoEstado =
        lt >= 60 ? 'verde' : lt >= 30 ? 'amarillo' : 'rojo'
      const ventasDetalle = `${lt} leads, ${ln} nuevos`

      // CS health: based on open tickets
      const csEstado: SemaforoEstado =
        ta === 0 ? 'verde' : ta <= 5 ? 'amarillo' : ta <= 15 ? 'naranja' : 'rojo'
      const csDetalle = ta === 0 ? `${clientesTotal ?? 0} clientes, sin tickets` : `${ta} tickets abiertos`

      // Operations health: based on risky/delayed trips
      const riskTotal = vr + vret
      const opsEstado: SemaforoEstado =
        riskTotal === 0 ? 'verde' : riskTotal <= 2 ? 'amarillo' : riskTotal <= 5 ? 'naranja' : 'rojo'
      const opsDetalle = riskTotal === 0 ? `${va} viajes, todo normal` : `${vr} en riesgo, ${vret} retrasados`

      // CXC health: based on number of overdue accounts
      const cxcEstado: SemaforoEstado =
        cx <= 10 ? 'verde' : cx <= 15 ? 'amarillo' : cx <= 20 ? 'naranja' : 'rojo'
      const cxcDetalle = `${cx} cuentas por cobrar`

      // GPS health: based on last sync freshness
      let gpsEstado: SemaforoEstado = 'rojo'
      let gpsDetalle = 'Sin datos GPS'
      if (gpsRecent && gpsRecent.length > 0) {
        const lastSync = new Date(gpsRecent[0].ultima_actualizacion)
        const diffMin = Math.floor((Date.now() - lastSync.getTime()) / 60000)
        if (diffMin <= 15) {
          gpsEstado = 'verde'
          gpsDetalle = `${gu} unidades, sync ${timeAgo(gpsRecent[0].ultima_actualizacion)}`
        } else if (diffMin <= 30) {
          gpsEstado = 'amarillo'
          gpsDetalle = `${gu} unidades, último sync ${timeAgo(gpsRecent[0].ultima_actualizacion)}`
        } else if (diffMin <= 60) {
          gpsEstado = 'naranja'
          gpsDetalle = `${gu} unidades, sync atrasado ${timeAgo(gpsRecent[0].ultima_actualizacion)}`
        } else {
          gpsEstado = 'rojo'
          gpsDetalle = `${gu} unidades, SIN SYNC ${timeAgo(gpsRecent[0].ultima_actualizacion)}`
        }
      }

      setAreas([
        { nombre: 'Ventas', estado: ventasEstado, detalle: ventasDetalle },
        { nombre: 'CS', estado: csEstado, detalle: csDetalle },
        { nombre: 'Operaciones', estado: opsEstado, detalle: opsDetalle },
        { nombre: 'CxC', estado: cxcEstado, detalle: cxcDetalle },
        { nombre: 'GPS', estado: gpsEstado, detalle: gpsDetalle },
      ])

      // ─── DYNAMIC ALERTS ─────────────────────────────
      const newAlertas: Alerta[] = []
      let alertId = 1

      if (vret > 0) {
        newAlertas.push({
          id: alertId++,
          mensaje: `${vret} viaje${vret > 1 ? 's' : ''} retrasado${vret > 1 ? 's' : ''} — requiere atención inmediata`,
          tipo: 'danger',
          hora: 'ahora',
        })
      }

      if (vr > 0) {
        newAlertas.push({
          id: alertId++,
          mensaje: `${vr} viaje${vr > 1 ? 's' : ''} en riesgo de retraso`,
          tipo: 'warning',
          hora: 'ahora',
        })
      }

      if (gpsEstado === 'rojo' || gpsEstado === 'naranja') {
        newAlertas.push({
          id: alertId++,
          mensaje: `GPS sync atrasado — ${gpsDetalle}`,
          tipo: gpsEstado === 'rojo' ? 'danger' : 'warning',
          hora: 'ahora',
        })
      }

      if (ta > 5) {
        newAlertas.push({
          id: alertId++,
          mensaje: `${ta} tickets de servicio abiertos — revisar prioridad`,
          tipo: 'warning',
          hora: 'ahora',
        })
      }

      if (cx > 15) {
        newAlertas.push({
          id: alertId++,
          mensaje: `${cx} cuentas CxC activas — por encima del umbral normal`,
          tipo: 'warning',
          hora: 'ahora',
        })
      }

      if (ln > 10) {
        newAlertas.push({
          id: alertId++,
          mensaje: `${ln} leads nuevos sin contactar — oportunidad de conversión`,
          tipo: 'info',
          hora: 'ahora',
        })
      }

      if (newAlertas.length === 0) {
        newAlertas.push({
          id: alertId++,
          mensaje: 'Operación normal — todos los indicadores dentro de parámetros',
          tipo: 'info',
          hora: 'ahora',
        })
      }

      setAlertas(newAlertas)

      // Update refresh timestamp
      setLastRefresh(new Date().toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit', second: '2-digit' }))
    } catch (err) {
      console.error('War Room fetch error:', err)
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

  // ─── RENDER ──────────────────────────────────────────
  return (
    <ModuleLayout titulo="War Room" subtitulo="Control Operativo en Tiempo Real">
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

        {/* Row 1: KPIs */}
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

        {/* Row 2: Semáforo de Salud Operativa */}
        <Card>
          <div className="mb-4">
            <h2
              className="text-lg font-bold"
              style={{
                color: tokens.colors.textPrimary,
                fontFamily: tokens.fonts.heading,
              }}
            >
              Semáforo de Salud Operativa
            </h2>
            <p
              style={{
                color: tokens.colors.textMuted,
                fontSize: '12px',
                fontFamily: tokens.fonts.body,
                marginTop: '4px',
              }}
            >
              Estado calculado en tiempo real
            </p>
          </div>
          <div className="grid grid-cols-5 gap-4">
            {areas.map((area) => (
              <div key={area.nombre} className="text-center">
                <div className="flex justify-center mb-3">
                  <Semaforo
                    estado={area.estado}
                    size="lg"
                    pulse={area.estado !== 'verde' && area.estado !== 'gris'}
                  />
                </div>
                <p
                  className="text-sm font-semibold"
                  style={{
                    color: tokens.colors.textPrimary,
                    fontFamily: tokens.fonts.body,
                  }}
                >
                  {area.nombre}
                </p>
                <p
                  style={{
                    color: tokens.colors.textMuted,
                    fontSize: '11px',
                    fontFamily: tokens.fonts.body,
                    marginTop: '4px',
                    lineHeight: '1.3',
                  }}
                >
                  {area.detalle}
                </p>
              </div>
            ))}
          </div>
        </Card>

        {/* Row 3: Operational Metrics Grid */}
        <div className="grid grid-cols-3 gap-4">
          <Card>
            <h3
              style={{
                color: tokens.colors.textPrimary,
                fontFamily: tokens.fonts.heading,
                fontSize: '14px',
                fontWeight: 700,
                marginBottom: '12px',
              }}
            >
              Flota
            </h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {[
                { label: 'Tractos registrados', value: kpis[1].valor.split(' / ')[0] || '—' },
                { label: 'Cajas registradas', value: kpis[1].valor.split(' / ')[1] || '—' },
                { label: 'Viajes en tránsito', value: kpis[0].valor },
              ].map((item) => (
                <div
                  key={item.label}
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    padding: '6px 0',
                    borderBottom: `1px solid ${tokens.colors.borderLight}`,
                  }}
                >
                  <span
                    style={{
                      color: tokens.colors.textSecondary,
                      fontSize: '13px',
                      fontFamily: tokens.fonts.body,
                    }}
                  >
                    {item.label}
                  </span>
                  <span
                    style={{
                      color: tokens.colors.textPrimary,
                      fontSize: '14px',
                      fontWeight: 700,
                      fontFamily: tokens.fonts.body,
                    }}
                  >
                    {item.value}
                  </span>
                </div>
              ))}
            </div>
          </Card>

          <Card>
            <h3
              style={{
                color: tokens.colors.textPrimary,
                fontFamily: tokens.fonts.heading,
                fontSize: '14px',
                fontWeight: 700,
                marginBottom: '12px',
              }}
            >
              Comercial
            </h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {[
                { label: 'Leads en pipeline', value: kpis[3].valor },
                { label: 'Formatos activos', value: kpis[2].valor },
              ].map((item) => (
                <div
                  key={item.label}
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    padding: '6px 0',
                    borderBottom: `1px solid ${tokens.colors.borderLight}`,
                  }}
                >
                  <span
                    style={{
                      color: tokens.colors.textSecondary,
                      fontSize: '13px',
                      fontFamily: tokens.fonts.body,
                    }}
                  >
                    {item.label}
                  </span>
                  <span
                    style={{
                      color: tokens.colors.textPrimary,
                      fontSize: '14px',
                      fontWeight: 700,
                      fontFamily: tokens.fonts.body,
                    }}
                  >
                    {item.value}
                  </span>
                </div>
              ))}
            </div>
          </Card>

          <Card>
            <h3
              style={{
                color: tokens.colors.textPrimary,
                fontFamily: tokens.fonts.heading,
                fontSize: '14px',
                fontWeight: 700,
                marginBottom: '12px',
              }}
            >
              GPS Tracking
            </h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {[
                {
                  label: 'Estado sync',
                  value: areas[4].estado === 'verde'
                    ? 'OK'
                    : areas[4].estado === 'amarillo'
                      ? 'Lento'
                      : areas[4].estado === 'naranja'
                        ? 'Atrasado'
                        : 'Sin sync',
                  valueColor:
                    areas[4].estado === 'verde'
                      ? tokens.colors.green
                      : areas[4].estado === 'amarillo'
                        ? tokens.colors.yellow
                        : tokens.colors.red,
                },
                { label: 'Detalle', value: areas[4].detalle },
              ].map((item) => (
                <div
                  key={item.label}
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    padding: '6px 0',
                    borderBottom: `1px solid ${tokens.colors.borderLight}`,
                  }}
                >
                  <span
                    style={{
                      color: tokens.colors.textSecondary,
                      fontSize: '13px',
                      fontFamily: tokens.fonts.body,
                    }}
                  >
                    {item.label}
                  </span>
                  <span
                    style={{
                      color: ('valueColor' in item && item.valueColor) ? item.valueColor : tokens.colors.textPrimary,
                      fontSize: '13px',
                      fontWeight: 700,
                      fontFamily: tokens.fonts.body,
                      maxWidth: '180px',
                      textAlign: 'right' as const,
                    }}
                  >
                    {item.value}
                  </span>
                </div>
              ))}
            </div>
          </Card>
        </div>

        {/* Row 4: Alertas del Día */}
        <Card>
          <div className="mb-4">
            <div className="flex items-center gap-2">
              <AlertCircle className="w-5 h-5" style={{ color: tokens.colors.orange }} />
              <h2
                className="text-lg font-bold"
                style={{
                  color: tokens.colors.textPrimary,
                  fontFamily: tokens.fonts.heading,
                }}
              >
                Alertas del Día
              </h2>
              <span
                style={{
                  background: alertas.some((a) => a.tipo === 'danger')
                    ? `${tokens.colors.red}22`
                    : alertas.some((a) => a.tipo === 'warning')
                      ? `${tokens.colors.yellow}22`
                      : `${tokens.colors.green}22`,
                  color: alertas.some((a) => a.tipo === 'danger')
                    ? tokens.colors.red
                    : alertas.some((a) => a.tipo === 'warning')
                      ? tokens.colors.yellow
                      : tokens.colors.green,
                  padding: '2px 10px',
                  borderRadius: '12px',
                  fontSize: '11px',
                  fontWeight: 700,
                }}
              >
                {alertas.filter((a) => a.tipo === 'danger').length > 0
                  ? `${alertas.filter((a) => a.tipo === 'danger').length} críticas`
                  : alertas.filter((a) => a.tipo === 'warning').length > 0
                    ? (() => { const n = alertas.filter((a) => a.tipo === 'warning').length; return `${n} ${n === 1 ? 'advertencia' : 'advertencias'}`; })()
                    : 'Todo normal'}
              </span>
            </div>
          </div>
          <div className="space-y-3">
            {alertas.map((alerta) => {
              const colorMap = {
                warning: {
                  bg: `${tokens.colors.yellow}1a`,
                  border: `${tokens.colors.yellow}33`,
                  icon: tokens.colors.yellow,
                },
                danger: {
                  bg: `${tokens.colors.red}1a`,
                  border: `${tokens.colors.red}33`,
                  icon: tokens.colors.red,
                },
                info: {
                  bg: `${tokens.colors.blue}1a`,
                  border: `${tokens.colors.blue}33`,
                  icon: tokens.colors.blue,
                },
              }
              const style = colorMap[alerta.tipo]
              return (
                <div
                  key={alerta.id}
                  className="flex items-start gap-3 p-3 rounded-lg border"
                  style={{ background: style.bg, borderColor: style.border }}
                >
                  <AlertCircle
                    className="w-5 h-5 shrink-0 mt-0.5"
                    style={{ color: style.icon }}
                  />
                  <div className="flex-1">
                    <p
                      className="text-sm"
                      style={{
                        color: tokens.colors.textPrimary,
                        fontFamily: tokens.fonts.body,
                      }}
                    >
                      {alerta.mensaje}
                    </p>
                  </div>
                  <p
                    className="text-xs shrink-0"
                    style={{
                      color: tokens.colors.textMuted,
                      fontFamily: tokens.fonts.body,
                    }}
                  >
                    {alerta.hora}
                  </p>
                </div>
              )
            })}
          </div>
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
