import type { ReactElement } from 'react'
import { useState, useEffect } from 'react'
import { ModuleLayout } from '../../components/layout/ModuleLayout'
import { Card } from '../../components/ui/Card'
import { KPICard } from '../../components/ui/KPICard'
import { tokens } from '../../lib/tokens'
import { supabase } from '../../lib/supabase'
import {
  Thermometer,
  AlertTriangle,
  CheckCircle2,
  Snowflake,
  TrendingUp,
  TrendingDown,
  Truck,
  Clock,
  RefreshCw,
  Search,
  Eye,
  Bell,
  Activity,
  ChevronDown,
  ChevronRight,
} from 'lucide-react'

/* ─── types ─── */
interface RegistroTemp {
  id: string
  caja_id: string
  caja_numero: string
  viaje_id: string | null
  cliente_nombre: string
  ruta: string
  temp_setpoint: number
  temp_actual: number
  temp_min_24h: number
  temp_max_24h: number
  estado: 'normal' | 'alerta' | 'critico'
  tipo_carga: string
  ultima_lectura: string
  lecturas_24h: number
}

/* ─── component ─── */
export default function ControlTemperatura(): ReactElement {
  const [registros, setRegistros] = useState<RegistroTemp[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQ, setSearchQ] = useState('')
  const [filtroEstado, setFiltroEstado] = useState<string>('todos')
  const [expandedId, setExpandedId] = useState<string | null>(null)

  useEffect(() => { fetchData() }, [])

  async function fetchData() {
    setLoading(true)
    try {
      const { data, error } = await supabase
        .from('control_temperatura')
        .select('*')
        .is('deleted_at', null)
        .order('ultima_lectura', { ascending: false })
        .limit(200)

      if (error) { console.error('control_temperatura:', error); setRegistros([]); return }
      setRegistros((data || []) as RegistroTemp[])
    } finally { setLoading(false) }
  }

  const stats = {
    total: registros.length,
    normales: registros.filter(r => r.estado === 'normal').length,
    alertas: registros.filter(r => r.estado === 'alerta').length,
    criticos: registros.filter(r => r.estado === 'critico').length,
  }

  const filtered = registros.filter(r => {
    if (filtroEstado !== 'todos' && r.estado !== filtroEstado) return false
    if (searchQ) {
      const q = searchQ.toLowerCase()
      if (!r.caja_numero.toLowerCase().includes(q) && !r.cliente_nombre.toLowerCase().includes(q) && !r.ruta.toLowerCase().includes(q)) return false
    }
    return true
  })

  const tempColor = (actual: number, setpoint: number) => {
    const diff = Math.abs(actual - setpoint)
    if (diff <= 1) return tokens.colors.green
    if (diff <= 3) return tokens.colors.yellow
    return tokens.colors.red
  }

  const estadoStyle = (e: string) => {
    if (e === 'normal') return { bg: tokens.colors.greenBg, color: tokens.colors.green, icon: <CheckCircle2 size={14} />, label: 'Normal' }
    if (e === 'alerta') return { bg: tokens.colors.yellowBg, color: tokens.colors.yellow, icon: <AlertTriangle size={14} />, label: 'Alerta' }
    return { bg: tokens.colors.redBg, color: tokens.colors.red, icon: <Bell size={14} />, label: 'Crítico' }
  }

  const tempBar = (min: number, max: number, setpoint: number, actual: number) => {
    const rangeMin = Math.min(min, setpoint - 5)
    const rangeMax = Math.max(max, setpoint + 5)
    const span = rangeMax - rangeMin || 1
    const setpointPct = ((setpoint - rangeMin) / span) * 100
    const actualPct = ((actual - rangeMin) / span) * 100
    const minPct = ((min - rangeMin) / span) * 100
    const maxPct = ((max - rangeMin) / span) * 100

    return (
      <div style={{ position: 'relative', height: 8, background: tokens.colors.bgHover, borderRadius: tokens.radius.full, width: '100%', marginTop: 4 }}>
        {/* range 24h */}
        <div style={{
          position: 'absolute', top: 0, left: `${minPct}%`, width: `${maxPct - minPct}%`,
          height: '100%', background: 'rgba(59,130,246,0.2)', borderRadius: tokens.radius.full,
        }} />
        {/* setpoint line */}
        <div style={{
          position: 'absolute', top: -2, left: `${setpointPct}%`, width: 2, height: 12,
          background: tokens.colors.green,
        }} />
        {/* actual dot */}
        <div style={{
          position: 'absolute', top: -2, left: `${actualPct}%`, width: 12, height: 12,
          borderRadius: '50%', background: tempColor(actual, setpoint),
          transform: 'translateX(-6px)', border: '2px solid #fff',
        }} />
      </div>
    )
  }

  return (
    <ModuleLayout titulo="Control de Temperatura — Refrigerados" moduloPadre={{ nombre: 'Operaciones', ruta: '/operaciones/dashboard' }}>
      <div style={{ padding: tokens.spacing.lg, minHeight: '100vh', background: tokens.colors.bgMain }}>
        {/* KPIs */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: tokens.spacing.md, marginBottom: tokens.spacing.lg }}>
          <KPICard icon={<Snowflake size={20} />} label="Unidades Monitoreadas" value={stats.total} />
          <KPICard icon={<CheckCircle2 size={20} />} label="Temperatura Normal" value={stats.normales} />
          <KPICard icon={<AlertTriangle size={20} />} label="En Alerta" value={stats.alertas} />
          <KPICard icon={<Thermometer size={20} />} label="Estado Crítico" value={stats.criticos} />
        </div>

        {/* Filters */}
        <div style={{ display: 'flex', gap: tokens.spacing.sm, marginBottom: tokens.spacing.md, alignItems: 'center' }}>
          <div style={{ position: 'relative', flex: 1, maxWidth: 300 }}>
            <Search size={16} color={tokens.colors.textMuted} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)' }} />
            <input type="text" value={searchQ} onChange={e => setSearchQ(e.target.value)}
              placeholder="Caja, cliente, ruta..." style={inputStyle} />
          </div>
          {['todos', 'normal', 'alerta', 'critico'].map(e => (
            <button key={e} onClick={() => setFiltroEstado(e)} style={{
              ...chipStyle,
              background: filtroEstado === e ? tokens.colors.primary : tokens.colors.bgCard,
              color: filtroEstado === e ? '#fff' : tokens.colors.textSecondary,
            }}>
              {e === 'todos' ? 'Todos' : e.charAt(0).toUpperCase() + e.slice(1)}
            </button>
          ))}
          <button onClick={fetchData} style={{ ...chipStyle, background: tokens.colors.bgCard, color: tokens.colors.textSecondary }}>
            <RefreshCw size={14} /> Actualizar
          </button>
        </div>

        {/* Table */}
        <Card style={{ padding: 0, overflow: 'hidden' }}>
          {loading ? (
            <div style={{ padding: tokens.spacing.xxl, textAlign: 'center', color: tokens.colors.textMuted }}>
              <RefreshCw size={24} style={{ animation: 'spin 1s linear infinite' }} />
              <p style={{ marginTop: tokens.spacing.sm }}>Cargando lecturas...</p>
            </div>
          ) : filtered.length === 0 ? (
            <div style={{ padding: tokens.spacing.xxl, textAlign: 'center' }}>
              <Snowflake size={48} color={tokens.colors.textMuted} style={{ marginBottom: tokens.spacing.md }} />
              <p style={{ fontFamily: tokens.fonts.heading, fontSize: '16px', fontWeight: 700, color: tokens.colors.textPrimary }}>
                Sin unidades refrigeradas monitoreadas
              </p>
              <p style={{ fontSize: '14px', color: tokens.colors.textMuted, marginTop: tokens.spacing.xs }}>
                Asigna sensores a unidades refrigeradas para monitorear temperatura
              </p>
            </div>
          ) : (
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ background: tokens.colors.bgHover }}>
                  {['', 'Caja', 'Cliente / Ruta', 'Setpoint', 'Actual', 'Rango 24h', 'Estado', 'Última Lectura'].map(h => (
                    <th key={h} style={thStyle}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.map(r => {
                  const est = estadoStyle(r.estado)
                  const isOpen = expandedId === r.id
                  return (
                    <>
                      <tr key={r.id} style={{ borderBottom: `1px solid ${tokens.colors.border}`, cursor: 'pointer' }}
                        onClick={() => setExpandedId(isOpen ? null : r.id)}>
                        <td style={tdStyle}>{isOpen ? <ChevronDown size={14} /> : <ChevronRight size={14} />}</td>
                        <td style={tdStyle}>
                          <span style={{ fontWeight: 600, color: tokens.colors.textPrimary }}>{r.caja_numero}</span>
                        </td>
                        <td style={tdStyle}>
                          <div>
                            <span style={{ fontSize: '13px', color: tokens.colors.textPrimary }}>{r.cliente_nombre}</span>
                            <div style={{ fontSize: '12px', color: tokens.colors.textMuted }}>{r.ruta}</div>
                          </div>
                        </td>
                        <td style={tdStyle}>
                          <span style={{ fontWeight: 700, color: tokens.colors.blue, fontSize: '15px' }}>{r.temp_setpoint}°C</span>
                        </td>
                        <td style={tdStyle}>
                          <span style={{ fontWeight: 700, color: tempColor(r.temp_actual, r.temp_setpoint), fontSize: '15px' }}>
                            {r.temp_actual}°C
                          </span>
                        </td>
                        <td style={{ ...tdStyle, minWidth: 160 }}>
                          <div style={{ fontSize: '11px', color: tokens.colors.textMuted, display: 'flex', justifyContent: 'space-between' }}>
                            <span>{r.temp_min_24h}°</span>
                            <span>{r.temp_max_24h}°</span>
                          </div>
                          {tempBar(r.temp_min_24h, r.temp_max_24h, r.temp_setpoint, r.temp_actual)}
                        </td>
                        <td style={tdStyle}>
                          <span style={{
                            display: 'inline-flex', alignItems: 'center', gap: '4px',
                            fontSize: '12px', fontWeight: 600, padding: '2px 8px',
                            borderRadius: tokens.radius.sm, background: est.bg, color: est.color,
                          }}>
                            {est.icon} {est.label}
                          </span>
                        </td>
                        <td style={tdStyle}>
                          <span style={{ fontSize: '12px', color: tokens.colors.textMuted }}>
                            {new Date(r.ultima_lectura).toLocaleString('es-MX')}
                          </span>
                        </td>
                      </tr>
                      {isOpen && (
                        <tr key={`${r.id}-detail`}>
                          <td colSpan={8} style={{ padding: tokens.spacing.md, background: tokens.colors.bgHover }}>
                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: tokens.spacing.lg }}>
                              <div>
                                <p style={{ fontSize: '12px', fontWeight: 700, color: tokens.colors.textMuted, marginBottom: tokens.spacing.sm, textTransform: 'uppercase' }}>Detalle Unidad</p>
                                <div style={{ fontSize: '13px', color: tokens.colors.textSecondary, lineHeight: 1.8 }}>
                                  <div><strong>Tipo carga:</strong> {r.tipo_carga}</div>
                                  <div><strong>Viaje ID:</strong> {r.viaje_id || 'Sin viaje'}</div>
                                  <div><strong>Lecturas 24h:</strong> {r.lecturas_24h}</div>
                                </div>
                              </div>
                              <div>
                                <p style={{ fontSize: '12px', fontWeight: 700, color: tokens.colors.textMuted, marginBottom: tokens.spacing.sm, textTransform: 'uppercase' }}>Temperatura</p>
                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: tokens.spacing.sm }}>
                                  {[
                                    { label: 'Setpoint', val: `${r.temp_setpoint}°C`, color: tokens.colors.blue },
                                    { label: 'Actual', val: `${r.temp_actual}°C`, color: tempColor(r.temp_actual, r.temp_setpoint) },
                                    { label: 'Mín 24h', val: `${r.temp_min_24h}°C`, color: tokens.colors.textSecondary },
                                    { label: 'Máx 24h', val: `${r.temp_max_24h}°C`, color: tokens.colors.textSecondary },
                                  ].map(t => (
                                    <div key={t.label} style={{ background: tokens.colors.bgCard, borderRadius: tokens.radius.md, padding: tokens.spacing.sm, textAlign: 'center' }}>
                                      <div style={{ fontSize: '11px', color: tokens.colors.textMuted }}>{t.label}</div>
                                      <div style={{ fontSize: '18px', fontWeight: 700, color: t.color }}>{t.val}</div>
                                    </div>
                                  ))}
                                </div>
                              </div>
                              <div>
                                <p style={{ fontSize: '12px', fontWeight: 700, color: tokens.colors.textMuted, marginBottom: tokens.spacing.sm, textTransform: 'uppercase' }}>Histórico (próximamente)</p>
                                <div style={{ height: 100, background: tokens.colors.bgCard, borderRadius: tokens.radius.md, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                  <Activity size={24} color={tokens.colors.textMuted} />
                                  <span style={{ fontSize: '12px', color: tokens.colors.textMuted, marginLeft: tokens.spacing.sm }}>Gráfico 24h</span>
                                </div>
                              </div>
                            </div>
                          </td>
                        </tr>
                      )}
                    </>
                  )
                })}
              </tbody>
            </table>
          )}
        </Card>
      </div>
    </ModuleLayout>
  )
}

/* ─── styles ─── */
const thStyle: React.CSSProperties = {
  padding: `${tokens.spacing.sm} ${tokens.spacing.md}`, textAlign: 'left',
  fontSize: '12px', fontWeight: 600, color: tokens.colors.textMuted,
  fontFamily: tokens.fonts.heading, textTransform: 'uppercase', letterSpacing: '0.5px',
}
const tdStyle: React.CSSProperties = {
  padding: `${tokens.spacing.sm} ${tokens.spacing.md}`, fontSize: '14px',
  fontFamily: tokens.fonts.body, color: tokens.colors.textSecondary, verticalAlign: 'middle',
}
const inputStyle: React.CSSProperties = {
  width: '100%', background: tokens.colors.bgCard, color: tokens.colors.textPrimary,
  border: `1px solid ${tokens.colors.border}`, borderRadius: tokens.radius.md,
  padding: `${tokens.spacing.sm} ${tokens.spacing.md} ${tokens.spacing.sm} 36px`,
  fontFamily: tokens.fonts.body, fontSize: '14px', outline: 'none',
}
const chipStyle: React.CSSProperties = {
  display: 'flex', alignItems: 'center', gap: '4px',
  border: `1px solid ${tokens.colors.border}`, borderRadius: tokens.radius.md,
  padding: `${tokens.spacing.xs} ${tokens.spacing.md}`, fontFamily: tokens.fonts.body,
  fontSize: '13px', fontWeight: 600, cursor: 'pointer',
}
