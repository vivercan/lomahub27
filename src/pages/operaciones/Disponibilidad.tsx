import { useState, useEffect, useCallback } from 'react'
import type { ReactElement } from 'react'
import { RefreshCw, Truck, Container, MapPin, AlertTriangle, CheckCircle } from 'lucide-react'
import { ModuleLayout } from '../../components/layout/ModuleLayout'
import { Card } from '../../components/ui/Card'
import { KPICard } from '../../components/ui/KPICard'
import { Semaforo } from '../../components/ui/Semaforo'
import { DataTable } from '../../components/ui/DataTable'
import type { SemaforoEstado } from '../../lib/tokens'
import { tokens } from '../../lib/tokens'
import { supabase } from '../../lib/supabase'

// =============================================================================
// TYPES
// =============================================================================

interface EquipoRow {
  tipo_equipo: string
  disponibles: number
  en_ruta: number
  en_taller: number
  total: number
  pctDisp: string
}

interface PlazaData {
  nombre: string
  estado: SemaforoEstado
  estadoLabel: string
  totalEquipos: number
  disponibles: number
  pctDisp: number
  equipos: EquipoRow[]
}

// =============================================================================
// HELPERS
// =============================================================================

function getPlazaHealth(disponibles: number, total: number): { estado: SemaforoEstado; label: string } {
  if (total === 0) return { estado: 'gris', label: 'Sin equipo' }
  const pct = (disponibles / total) * 100
  if (pct >= 60) return { estado: 'verde', label: 'Suficiente' }
  if (pct >= 30) return { estado: 'amarillo', label: 'Limitado' }
  return { estado: 'rojo', label: 'Crítico' }
}

// =============================================================================
// COMPONENT
// =============================================================================

export default function Disponibilidad(): ReactElement {
  const [kpis, setKpis] = useState([
    { titulo: 'Total Tractos', valor: '—', color: 'primary' as const },
    { titulo: 'Total Cajas', valor: '—', color: 'blue' as const },
    { titulo: '% Disponibilidad', valor: '—', color: 'green' as const },
    { titulo: 'Plazas Críticas', valor: '—', color: 'red' as const },
  ])

  const [plazasData, setPlazasData] = useState<PlazaData[]>([])
  const [resumen, setResumen] = useState('Cargando datos...')
  const [lastRefresh, setLastRefresh] = useState('')
  const [refreshing, setRefreshing] = useState(false)

  // ─── FETCH ALL DATA ─────────────────────────────────────────────────
  const fetchAll = useCallback(async () => {
    setRefreshing(true)
    try {
      const [
        { data: tractos },
        { data: cajas },
        { count: tractosTotal },
        { count: cajasTotal },
      ] = await Promise.all([
        supabase
          .from('tractos')
          .select('id, numero_economico, segmento, estado_operativo')
          .is('deleted_at', null),
        supabase
          .from('cajas')
          .select('id, numero_economico, ubicacion_actual, estado, tipo')
          .is('deleted_at', null),
        supabase
          .from('tractos')
          .select('*', { count: 'exact', head: true })
          .is('deleted_at', null),
        supabase
          .from('cajas')
          .select('*', { count: 'exact', head: true })
          .is('deleted_at', null),
      ])

      const tt = tractosTotal ?? 0
      const ct = cajasTotal ?? 0

      // ─── BUILD PLAZAS MAP ──────────────────────────────────────────
      const plazasMap = new Map<string, {
        tractosDisp: number; tractosRuta: number; tractosTaller: number; tractosTotal: number;
        cajasDisp: number; cajasRuta: number; cajasTaller: number; cajasTotal: number;
      }>()

      const initPlaza = () => ({
        tractosDisp: 0, tractosRuta: 0, tractosTaller: 0, tractosTotal: 0,
        cajasDisp: 0, cajasRuta: 0, cajasTaller: 0, cajasTotal: 0,
      })

      ;(tractos || []).forEach((t: any) => {
        const u = t.segmento || 'Sin segmento'
        if (!plazasMap.has(u)) plazasMap.set(u, initPlaza())
        const p = plazasMap.get(u)!
        p.tractosTotal += 1
        if (t.estado_operativo === 'disponible') p.tractosDisp += 1
        else if (t.estado_operativo === 'en_taller' || t.estado_operativo === 'mantenimiento') p.tractosTaller += 1
        else p.tractosRuta += 1
      })

      ;(cajas || []).forEach((c: any) => {
        const u = c.ubicacion_actual || 'Sin ubicación'
        if (!plazasMap.has(u)) plazasMap.set(u, initPlaza())
        const p = plazasMap.get(u)!
        p.cajasTotal += 1
        if (c.estado === 'disponible') p.cajasDisp += 1
        else if (c.estado === 'en_taller' || c.estado === 'mantenimiento') p.cajasTaller += 1
        else p.cajasRuta += 1
      })

      // ─── FORMAT PLAZAS ─────────────────────────────────────────────
      const plazas: PlazaData[] = Array.from(plazasMap.entries())
        .map(([nombre, p]) => {
          const totalEquipos = p.tractosTotal + p.cajasTotal
          const disponibles = p.tractosDisp + p.cajasDisp
          const pctDisp = totalEquipos > 0 ? Math.round((disponibles / totalEquipos) * 100) : 0
          const health = getPlazaHealth(disponibles, totalEquipos)

          const equipos: EquipoRow[] = [
            {
              tipo_equipo: 'Tractocamión',
              disponibles: p.tractosDisp,
              en_ruta: p.tractosRuta,
              en_taller: p.tractosTaller,
              total: p.tractosTotal,
              pctDisp: p.tractosTotal > 0
                ? Math.round((p.tractosDisp / p.tractosTotal) * 100) + '%'
                : '—',
            },
            {
              tipo_equipo: 'Caja',
              disponibles: p.cajasDisp,
              en_ruta: p.cajasRuta,
              en_taller: p.cajasTaller,
              total: p.cajasTotal,
              pctDisp: p.cajasTotal > 0
                ? Math.round((p.cajasDisp / p.cajasTotal) * 100) + '%'
                : '—',
            },
          ]

          return {
            nombre,
            estado: health.estado,
            estadoLabel: health.label,
            totalEquipos,
            disponibles,
            pctDisp,
            equipos,
          }
        })
        .sort((a, b) => a.pctDisp - b.pctDisp) // Critical plazas first

      setPlazasData(plazas)

      // ─── COMPUTE KPIS ──────────────────────────────────────────────
      const totalDisp = plazas.reduce((s, p) => s + p.disponibles, 0)
      const totalEquipos = tt + ct
      const pctGlobal = totalEquipos > 0 ? Math.round((totalDisp / totalEquipos) * 100) : 0
      const criticas = plazas.filter(p => p.estado === 'rojo').length

      setKpis([
        { titulo: 'Total Tractos', valor: tt.toLocaleString(), color: 'primary' as const },
        { titulo: 'Total Cajas', valor: ct.toLocaleString(), color: 'blue' as const },
        { titulo: '% Disponibilidad', valor: pctGlobal + '%', color: pctGlobal >= 50 ? 'green' as const : 'red' as const },
        { titulo: 'Plazas Críticas', valor: criticas.toString(), color: criticas > 0 ? 'red' as const : 'green' as const },
      ])

      // ─── RESUMEN ───────────────────────────────────────────────────
      const parts: string[] = []
      parts.push(`${tt.toLocaleString()} tractos y ${ct.toLocaleString()} cajas en ${plazas.length} plazas`)
      parts.push(`${totalDisp} unidades disponibles (${pctGlobal}%)`)
      if (criticas > 0) {
        const nombres = plazas.filter(p => p.estado === 'rojo').map(p => p.nombre).slice(0, 3).join(', ')
        parts.push(`${criticas} plaza${criticas > 1 ? 's' : ''} crítica${criticas > 1 ? 's' : ''}: ${nombres}`)
      } else {
        parts.push('todas las plazas con disponibilidad suficiente')
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
      console.error('Disponibilidad fetch error:', err)
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

  // ─── TABLE COLUMNS ──────────────────────────────────────────────────
  const equipoColumns = [
    { key: 'tipo_equipo', label: 'Tipo', width: '25%' },
    { key: 'disponibles', label: 'Disponibles', width: '18%' },
    { key: 'en_ruta', label: 'En Ruta', width: '18%' },
    { key: 'en_taller', label: 'Taller', width: '15%' },
    { key: 'total', label: 'Total', width: '12%' },
    {
      key: 'pctDisp',
      label: '% Disp.',
      width: '12%',
      render: (row: EquipoRow) => (
        <span
          style={{
            fontWeight: 700,
            fontSize: '12px',
            color:
              row.pctDisp === '—'
                ? tokens.colors.textMuted
                : parseInt(row.pctDisp) >= 60
                  ? tokens.colors.green
                  : parseInt(row.pctDisp) >= 30
                    ? tokens.colors.yellow
                    : tokens.colors.red,
          }}
        >
          {row.pctDisp}
        </span>
      ),
    },
  ]

  // ─── RENDER ─────────────────────────────────────────────────────────
  return (
    <ModuleLayout titulo="Disponibilidad de Flota" subtitulo="Visibilidad por Plaza y Tipo de Equipo">
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

        {/* Resumen Operativo */}
        <Card>
          <div className="flex items-center gap-2 mb-3">
            <Truck className="w-5 h-5" style={{ color: tokens.colors.primary }} />
            <h3
              style={{
                margin: 0,
                color: tokens.colors.textPrimary,
                fontFamily: tokens.fonts.heading,
                fontSize: '15px',
                fontWeight: 700,
              }}
            >
              Resumen de Disponibilidad
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

        {/* Plazas Grid */}
        {plazasData.length === 0 ? (
          <Card>
            <div
              style={{
                textAlign: 'center',
                padding: '48px 16px',
                color: tokens.colors.textMuted,
              }}
            >
              <MapPin
                style={{
                  width: 32,
                  height: 32,
                  margin: '0 auto 12px',
                  color: tokens.colors.textMuted,
                }}
              />
              <p style={{ fontSize: '18px', fontWeight: 500, margin: 0 }}>Sin datos</p>
              <p style={{ fontSize: '14px', marginTop: '8px' }}>
                Los datos se cargarán cuando estén disponibles en el sistema
              </p>
            </div>
          </Card>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: tokens.spacing.md }}>
            {plazasData.map((plaza) => (
              <Card key={plaza.nombre}>
                {/* Plaza header */}
                <div
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    marginBottom: tokens.spacing.md,
                    paddingBottom: tokens.spacing.sm,
                    borderBottom: `1px solid ${tokens.colors.border}`,
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <MapPin size={16} style={{ color: tokens.colors.primary }} />
                    <h3
                      style={{
                        margin: 0,
                        fontSize: '14px',
                        fontWeight: 700,
                        color: tokens.colors.textPrimary,
                        fontFamily: tokens.fonts.heading,
                      }}
                    >
                      {plaza.nombre}
                    </h3>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <Semaforo estado={plaza.estado} />
                    <span
                      style={{
                        fontSize: '11px',
                        fontWeight: 600,
                        color: tokens.colors.textSecondary,
                      }}
                    >
                      {plaza.estadoLabel}
                    </span>
                  </div>
                </div>

                {/* Stats row */}
                <div
                  style={{
                    display: 'flex',
                    justifyContent: 'space-around',
                    marginBottom: tokens.spacing.md,
                    padding: '8px 0',
                  }}
                >
                  <div style={{ textAlign: 'center' }}>
                    <div
                      style={{
                        fontSize: '20px',
                        fontWeight: 800,
                        color: tokens.colors.textPrimary,
                        fontFamily: tokens.fonts.heading,
                      }}
                    >
                      {plaza.disponibles}
                    </div>
                    <div style={{ fontSize: '11px', color: tokens.colors.textMuted }}>Disponibles</div>
                  </div>
                  <div style={{ textAlign: 'center' }}>
                    <div
                      style={{
                        fontSize: '20px',
                        fontWeight: 800,
                        color: tokens.colors.textPrimary,
                        fontFamily: tokens.fonts.heading,
                      }}
                    >
                      {plaza.totalEquipos}
                    </div>
                    <div style={{ fontSize: '11px', color: tokens.colors.textMuted }}>Total</div>
                  </div>
                  <div style={{ textAlign: 'center' }}>
                    <div
                      style={{
                        fontSize: '20px',
                        fontWeight: 800,
                        color:
                          plaza.pctDisp >= 60
                            ? tokens.colors.green
                            : plaza.pctDisp >= 30
                              ? tokens.colors.yellow
                              : tokens.colors.red,
                        fontFamily: tokens.fonts.heading,
                      }}
                    >
                      {plaza.pctDisp}%
                    </div>
                    <div style={{ fontSize: '11px', color: tokens.colors.textMuted }}>Disp.</div>
                  </div>
                </div>

                {/* Equipment table */}
                <DataTable columns={equipoColumns} data={plaza.equipos} />
              </Card>
            ))}
          </div>
        )}

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
