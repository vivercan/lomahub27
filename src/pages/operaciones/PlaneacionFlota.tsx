import type { ReactElement } from 'react'
import { useState, useEffect } from 'react'
import { ModuleLayout } from '../../components/layout/ModuleLayout'
import { Card } from '../../components/Card'
import { KPICard } from '../../components/KPICard'
import { tokens } from '../../lib/tokens'
import { supabase } from '../../lib/supabase'
import {
  Truck,
  Calendar,
  AlertTriangle,
  CheckCircle2,
  Clock,
  MapPin,
  TrendingUp,
  ArrowRight,
  RefreshCw,
  Search,
  Filter,
  ChevronDown,
  ChevronRight,
  Activity,
  Zap,
} from 'lucide-react'

/* ─── types ─── */
interface UnidadProyectada {
  tracto_id: string
  numero_economico: string
  empresa: string
  ubicacion_actual: string
  estatus: string
  viaje_actual_id: string | null
  eta_descarga: string | null
  disponible_en: string | null
  ciudad_disponible: string
  horas_para_disponible: number
}

interface SobreDisponibilidad {
  ciudad: string
  tractos_disponibles: number
  demanda_estimada: number
  excedente: number
}

/* ─── component ─── */
export default function PlaneacionFlota(): ReactElement {
  const [unidades, setUnidades] = useState<UnidadProyectada[]>([])
  const [sobredisp, setSobredisp] = useState<SobreDisponibilidad[]>([])
  const [loading, setLoading] = useState(true)
  const [horizonte, setHorizonte] = useState<12 | 24 | 48 | 72>(24)
  const [searchQ, setSearchQ] = useState('')
  const [filtroEmpresa, setFiltroEmpresa] = useState<string>('todos')
  const [filtroCiudad, setFiltroCiudad] = useState<string>('todos')

  useEffect(() => { fetchData() }, [horizonte])

  async function fetchData() {
    setLoading(true)
    try {
      /* Tractos con viaje actual y ETA */
      const { data: tractos, error: e1 } = await supabase
        .from('tractos')
        .select('id, numero_economico, empresa, segmento, estado_operativo')
        .is('deleted_at', null)
        .order('numero_economico')

      if (e1) { console.error('tractos:', e1); setUnidades([]); return }

      const { data: viajes, error: e2 } = await supabase
        .from('viajes')
        .select('id, tracto_id, origen, destino, cita_descarga, estado')
        .in('estado', ['en_transito', 'en_carga', 'programado'])

      if (e2) console.error('viajes:', e2)

      const viajeMap = new Map((viajes || []).map((v: any) => [v.tracto_id, v]))
      const now = Date.now()

      const proyectadas: UnidadProyectada[] = (tractos || []).map((t: any) => {
        const v = viajeMap.get(t.id)
        let disponibleEn: string | null = null
        let ciudadDisp = t.segmento || 'Sin segmento'
        let horasDisp = 0

        if (v && v.cita_descarga) {
          const eta = new Date(v.cita_descarga).getTime()
          horasDisp = Math.max(0, (eta - now) / 3600000)
          disponibleEn = v.cita_descarga
          ciudadDisp = v.destino || ciudadDisp
        } else if (t.estado_operativo === 'disponible') {
          horasDisp = 0
          disponibleEn = new Date().toISOString()
        }

        return {
          tracto_id: t.id,
          numero_economico: t.numero_economico,
          empresa: t.empresa || 'TROB',
          ubicacion_actual: t.segmento || '—',
          estatus: t.estado_operativo,
          viaje_actual_id: v?.id || null,
          eta_descarga: v?.cita_descarga || null,
          disponible_en: disponibleEn,
          ciudad_disponible: ciudadDisp,
          horas_para_disponible: Math.round(horasDisp * 10) / 10,
        }
      })

      setUnidades(proyectadas)

      /* Sobredisponibilidad por ciudad */
      const dentroHorizonte = proyectadas.filter(u => u.horas_para_disponible <= horizonte)
      const porCiudad = new Map<string, number>()
      dentroHorizonte.forEach(u => {
        const c = u.ciudad_disponible
        porCiudad.set(c, (porCiudad.get(c) || 0) + 1)
      })

      const sobreList: SobreDisponibilidad[] = []
      porCiudad.forEach((count, ciudad) => {
        const demanda = 2 /* placeholder — debería venir de programación */
        sobreList.push({ ciudad, tractos_disponibles: count, demanda_estimada: demanda, excedente: count - demanda })
      })
      sobreList.sort((a, b) => b.excedente - a.excedente)
      setSobredisp(sobreList)
    } finally { setLoading(false) }
  }

  const disponiblesEnHorizonte = unidades.filter(u => u.horas_para_disponible <= horizonte).length
  const enTransito = unidades.filter(u => u.viaje_actual_id).length
  const sobreTotal = sobredisp.filter(s => s.excedente > 0).reduce((a, b) => a + b.excedente, 0)
  const deficitTotal = sobredisp.filter(s => s.excedente < 0).reduce((a, b) => a + Math.abs(b.excedente), 0)

  const empresas = [...new Set(unidades.map(u => u.empresa))].filter(Boolean)
  const ciudades = [...new Set(unidades.map(u => u.ciudad_disponible))].filter(Boolean).sort()

  const filtered = unidades.filter(u => {
    if (u.horas_para_disponible > horizonte && u.viaje_actual_id) return false
    if (filtroEmpresa !== 'todos' && u.empresa !== filtroEmpresa) return false
    if (filtroCiudad !== 'todos' && u.ciudad_disponible !== filtroCiudad) return false
    if (searchQ && !u.numero_economico.toLowerCase().includes(searchQ.toLowerCase())) return false
    return true
  })

  return (
    <ModuleLayout title="Planeación de Flota — Disponibilidad Futura">
      <div style={{ padding: tokens.spacing.lg, minHeight: '100vh', background: tokens.colors.bgMain }}>
        {/* KPIs */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: tokens.spacing.md, marginBottom: tokens.spacing.lg }}>
          <KPICard icon={<Truck size={20} />} label={`Disponibles en ${horizonte}h`} value={disponiblesEnHorizonte} />
          <KPICard icon={<Activity size={20} />} label="En Tránsito" value={enTransito} />
          <KPICard icon={<TrendingUp size={20} />} label="Sobredisponibilidad" value={sobreTotal} />
          <KPICard icon={<AlertTriangle size={20} />} label="Déficit Estimado" value={deficitTotal} />
        </div>

        {/* Horizon selector */}
        <div style={{ display: 'flex', gap: tokens.spacing.sm, marginBottom: tokens.spacing.lg, alignItems: 'center' }}>
          <span style={{ fontSize: '14px', fontWeight: 600, color: tokens.colors.textSecondary, fontFamily: tokens.fonts.heading }}>Horizonte:</span>
          {([12, 24, 48, 72] as const).map(h => (
            <button key={h} onClick={() => setHorizonte(h)} style={{
              background: horizonte === h ? tokens.colors.primary : tokens.colors.bgCard,
              color: horizonte === h ? '#fff' : tokens.colors.textSecondary,
              border: `1px solid ${horizonte === h ? tokens.colors.primary : tokens.colors.border}`,
              borderRadius: tokens.radius.md, padding: `${tokens.spacing.xs} ${tokens.spacing.md}`,
              fontFamily: tokens.fonts.body, fontSize: '13px', fontWeight: 600, cursor: 'pointer',
            }}>
              {h}h
            </button>
          ))}

          <div style={{ flex: 1 }} />

          <div style={{ position: 'relative', maxWidth: 240 }}>
            <Search size={16} color={tokens.colors.textMuted} style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)' }} />
            <input type="text" value={searchQ} onChange={e => setSearchQ(e.target.value)}
              placeholder="Buscar tracto..."
              style={{
                width: '100%', background: tokens.colors.bgCard, color: tokens.colors.textPrimary,
                border: `1px solid ${tokens.colors.border}`, borderRadius: tokens.radius.md,
                padding: `${tokens.spacing.xs} ${tokens.spacing.md} ${tokens.spacing.xs} 32px`,
                fontFamily: tokens.fonts.body, fontSize: '13px', outline: 'none',
              }}
            />
          </div>

          {empresas.length > 1 && (
            <select value={filtroEmpresa} onChange={e => setFiltroEmpresa(e.target.value)} style={selStyle}>
              <option value="todos">Todas empresas</option>
              {empresas.map(e => <option key={e} value={e}>{e}</option>)}
            </select>
          )}
        </div>

        {/* Sobredisponibilidad cards */}
        {sobredisp.length > 0 && (
          <div style={{ marginBottom: tokens.spacing.lg }}>
            <h3 style={{ fontFamily: tokens.fonts.heading, fontSize: '14px', fontWeight: 700, color: tokens.colors.textSecondary, marginBottom: tokens.spacing.sm, textTransform: 'uppercase' }}>
              Sobredisponibilidad por Ciudad ({horizonte}h)
            </h3>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: tokens.spacing.sm }}>
              {sobredisp.slice(0, 8).map(s => (
                <Card key={s.ciudad} style={{
                  padding: tokens.spacing.md, cursor: 'pointer',
                  borderLeft: `3px solid ${s.excedente > 0 ? tokens.colors.yellow : s.excedente < 0 ? tokens.colors.red : tokens.colors.green}`,
                }} onClick={() => setFiltroCiudad(s.ciudad === filtroCiudad ? 'todos' : s.ciudad)}>
                  <div style={{ fontSize: '13px', fontWeight: 700, color: tokens.colors.textPrimary, marginBottom: tokens.spacing.xs }}>
                    <MapPin size={12} style={{ marginRight: 4 }} />{s.ciudad}
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px' }}>
                    <span style={{ color: tokens.colors.textMuted }}>Disp: {s.tractos_disponibles}</span>
                    <span style={{ color: tokens.colors.textMuted }}>Dem: {s.demanda_estimada}</span>
                  </div>
                  <div style={{
                    marginTop: tokens.spacing.xs, fontSize: '14px', fontWeight: 700,
                    color: s.excedente > 0 ? tokens.colors.yellow : s.excedente < 0 ? tokens.colors.red : tokens.colors.green,
                  }}>
                    {s.excedente > 0 ? `+${s.excedente} excedente` : s.excedente < 0 ? `${s.excedente} déficit` : 'Balanceado'}
                  </div>
                </Card>
              ))}
            </div>
          </div>
        )}

        {/* Units table */}
        <Card style={{ padding: 0, overflow: 'hidden' }}>
          {loading ? (
            <div style={{ padding: tokens.spacing.xxl, textAlign: 'center', color: tokens.colors.textMuted }}>
              <RefreshCw size={24} style={{ animation: 'spin 1s linear infinite' }} />
              <p style={{ marginTop: tokens.spacing.sm }}>Cargando flota...</p>
            </div>
          ) : filtered.length === 0 ? (
            <div style={{ padding: tokens.spacing.xxl, textAlign: 'center' }}>
              <Truck size={48} color={tokens.colors.textMuted} style={{ marginBottom: tokens.spacing.md }} />
              <p style={{ fontFamily: tokens.fonts.heading, fontSize: '16px', fontWeight: 700, color: tokens.colors.textPrimary }}>
                Sin unidades proyectadas
              </p>
              <p style={{ fontSize: '14px', color: tokens.colors.textMuted, marginTop: tokens.spacing.xs }}>
                No hay tractos con disponibilidad estimada en las próximas {horizonte} horas
              </p>
            </div>
          ) : (
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ background: tokens.colors.bgHover }}>
                  {['Tracto', 'Empresa', 'Ubicación Actual', 'Ciudad Disponible', 'Disponible En', 'Estatus'].map(h => (
                    <th key={h} style={thStyle}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.map(u => (
                  <tr key={u.tracto_id} style={{ borderBottom: `1px solid ${tokens.colors.border}` }}>
                    <td style={tdStyle}><span style={{ fontWeight: 600, color: tokens.colors.textPrimary }}>{u.numero_economico}</span></td>
                    <td style={tdStyle}><span style={{ fontSize: '13px' }}>{u.empresa}</span></td>
                    <td style={tdStyle}><span style={{ fontSize: '13px' }}>{u.ubicacion_actual}</span></td>
                    <td style={tdStyle}>
                      <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', fontSize: '13px' }}>
                        <MapPin size={12} color={tokens.colors.primary} />{u.ciudad_disponible}
                      </span>
                    </td>
                    <td style={tdStyle}>
                      {u.horas_para_disponible === 0 ? (
                        <span style={{ fontWeight: 600, color: tokens.colors.green, fontSize: '13px' }}>
                          <CheckCircle2 size={12} style={{ marginRight: 4 }} />Disponible ahora
                        </span>
                      ) : (
                        <span style={{
                          fontSize: '13px', fontWeight: 600,
                          color: u.horas_para_disponible <= 12 ? tokens.colors.green : u.horas_para_disponible <= 24 ? tokens.colors.yellow : tokens.colors.orange,
                        }}>
                          <Clock size={12} style={{ marginRight: 4 }} />
                          {u.horas_para_disponible}h
                        </span>
                      )}
                    </td>
                    <td style={tdStyle}>
                      <span style={{
                        fontSize: '12px', fontWeight: 600, padding: '2px 8px',
                        borderRadius: tokens.radius.sm,
                        background: u.estatus === 'disponible' ? tokens.colors.greenBg : tokens.colors.blueBg,
                        color: u.estatus === 'disponible' ? tokens.colors.green : tokens.colors.blue,
                      }}>
                        {u.estatus}
                      </span>
                    </td>
                  </tr>
                ))}
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
const selStyle: React.CSSProperties = {
  background: tokens.colors.bgCard, color: tokens.colors.textPrimary,
  border: `1px solid ${tokens.colors.border}`, borderRadius: tokens.radius.md,
  padding: `${tokens.spacing.xs} ${tokens.spacing.md}`, fontFamily: tokens.fonts.body, fontSize: '13px',
}
