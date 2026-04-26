import { useState, useEffect, useMemo, useCallback } from 'react'
import { ModuleLayout } from '../../components/layout/ModuleLayout'
import { supabase } from '../../lib/supabase'
import { tokens } from '../../lib/tokens'
import { Plus, Search, Edit2, Trash2, X, Satellite, Truck, Container, Thermometer } from 'lucide-react'

interface UnidadFlota {
  numero_economico: string
  tipo: 'tracto' | 'caja' | 'thermo'
  linea: string | null
  empresa: string | null
  activo: boolean
  notas: string | null
  updated_at: string
}

interface GPSInfo {
  economico: string
  latitud: number | null
  longitud: number | null
  velocidad: number | null
  ultima_actualizacion: string | null
  estatus: string | null
  ubicacion: string | null
}

const TIPO_OPTS: UnidadFlota['tipo'][] = ['tracto', 'caja', 'thermo']
const LINEA_OPTS = ['TROB', 'WE', 'WIDETECH', 'SHI', 'TROB USA', 'WERNER', 'OTRO']

export default function FlotaMaster() {
  const [unidades, setUnidades] = useState<UnidadFlota[]>([])
  const [gpsMap, setGpsMap] = useState<Map<string, GPSInfo>>(new Map())
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [filterTipo, setFilterTipo] = useState<string>('')
  const [filterLinea, setFilterLinea] = useState<string>('')
  const [filterActivo, setFilterActivo] = useState<string>('true')
  const [editing, setEditing] = useState<UnidadFlota | null>(null)
  const [adding, setAdding] = useState(false)

  const loadAll = useCallback(async () => {
    setLoading(true)
    const [{ data: fl }, { data: gp }] = await Promise.all([
      supabase.from('flota_master').select('*').order('numero_economico'),
      supabase.from('gps_tracking').select('economico,latitud,longitud,velocidad,ultima_actualizacion,estatus,ubicacion'),
    ])
    setUnidades((fl as UnidadFlota[]) || [])
    const map = new Map<string, GPSInfo>()
    ;(gp as GPSInfo[] || []).forEach(g => map.set(g.economico, g))
    setGpsMap(map)
    setLoading(false)
  }, [])

  useEffect(() => { loadAll() }, [loadAll])

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase()
    return unidades.filter(u => {
      if (filterTipo && u.tipo !== filterTipo) return false
      if (filterLinea && (u.linea || '') !== filterLinea) return false
      if (filterActivo === 'true' && !u.activo) return false
      if (filterActivo === 'false' && u.activo) return false
      if (q && !u.numero_economico.toLowerCase().includes(q) && !(u.linea || '').toLowerCase().includes(q)) return false
      return true
    })
  }, [unidades, search, filterTipo, filterLinea, filterActivo])

  const stats = useMemo(() => {
    const total = unidades.filter(u => u.activo).length
    const con_gps = unidades.filter(u => u.activo && gpsMap.get(u.numero_economico)?.ultima_actualizacion).length
    const fresh = unidades.filter(u => {
      if (!u.activo) return false
      const g = gpsMap.get(u.numero_economico)
      if (!g?.ultima_actualizacion) return false
      return new Date(g.ultima_actualizacion).getTime() > Date.now() - 3600000
    }).length
    const by_tipo: Record<string, number> = { tracto: 0, caja: 0, thermo: 0 }
    unidades.forEach(u => { if (u.activo) by_tipo[u.tipo] = (by_tipo[u.tipo] || 0) + 1 })
    return { total, con_gps, fresh, by_tipo }
  }, [unidades, gpsMap])

  const saveUnidad = async (u: Partial<UnidadFlota> & { numero_economico: string }, isNew: boolean) => {
    // V50 26/Abr/2026 BUG-014 — try/catch hardening
    try {
      if (isNew) {
        const { error } = await supabase.from('flota_master').insert([{
          numero_economico: u.numero_economico,
          tipo: u.tipo || 'tracto',
          linea: u.linea || null,
          empresa: u.empresa || u.linea || null,
          activo: u.activo !== false,
          origen: 'MANUAL_UI',
        }])
        if (error) throw error
      } else {
        const { error } = await supabase.from('flota_master').update({
          tipo: u.tipo,
          linea: u.linea || null,
          empresa: u.empresa || u.linea || null,
          activo: u.activo,
          notas: u.notas || null,
        }).eq('numero_economico', u.numero_economico)
        if (error) throw error
      }
      setEditing(null)
      setAdding(false)
      loadAll()
    } catch (err: any) {
      console.error('Error guardando unidad flota:', err)
      alert('Error guardando: ' + (err?.message || 'desconocido'))
    }
  }

  const toggleActivo = async (ne: string, next: boolean) => {
    try {
      const { error } = await supabase.from('flota_master').update({ activo: next }).eq('numero_economico', ne)
      if (error) throw error
      loadAll()
    } catch (err: any) {
      console.error('Error toggle activo:', err)
    }
  }

  const TipoIcon = ({ t }: { t: string }) => (
    t === 'tracto' ? <Truck size={14} /> : t === 'thermo' ? <Thermometer size={14} /> : <Container size={14} />
  )

  return (
    <ModuleLayout titulo="Flota Master (GPS)" moduloPadre={{ nombre: 'Configuración', ruta: '/admin/configuracion/integraciones' }}>
      <div style={{ fontFamily: tokens.fonts.body, padding: '1.5rem 2rem', background: '#F7F8FA', minHeight: 'calc(100vh - 120px)' }}>
        {/* Header row */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.5rem', flexWrap: 'wrap', gap: 16 }}>
          <div>
            <h1 style={{ fontSize: '1.75rem', fontWeight: 700, margin: 0, color: '#0F172A', display: 'flex', alignItems: 'center', gap: 10 }}>
              <Satellite size={24} style={{ color: '#3B6CE7' }} /> Flota Master
            </h1>
            <div style={{ fontSize: 13, color: '#64748B', marginTop: 2 }}>
              Catálogo de tractos, cajas y thermos que el worker GPS consulta cada 15 min a WideTech
            </div>
          </div>
          <button onClick={() => setAdding(true)} style={btnPrimary}>
            <Plus size={18} /> Agregar unidad
          </button>
        </div>

        {/* KPI cards */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 16, marginBottom: 20 }}>
          <KpiCard label="Activas" value={stats.total} color="#3B6CE7" />
          <KpiCard label="Tractos" value={stats.by_tipo.tracto} color="#0F172A" />
          <KpiCard label="Cajas" value={stats.by_tipo.caja} color="#6B7280" />
          <KpiCard label="Thermos" value={stats.by_tipo.thermo} color="#0891B2" />
          <KpiCard label="Con GPS (alguna vez)" value={stats.con_gps} color="#10B981" />
          <KpiCard label="Reportando <1h" value={stats.fresh} color="#F59E0B" />
        </div>

        {/* Filtros */}
        <div style={{ display: 'flex', gap: 12, alignItems: 'center', marginBottom: 16, flexWrap: 'wrap' }}>
          <div style={{ position: 'relative', flex: '1 1 280px', minWidth: 240 }}>
            <Search size={16} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: '#94A3B8' }} />
            <input type="text" placeholder="Buscar por número o línea..." value={search} onChange={e => setSearch(e.target.value)}
              style={{ ...inputStyle, paddingLeft: 38, width: '100%' }} />
          </div>
          <select value={filterTipo} onChange={e => setFilterTipo(e.target.value)} style={inputStyle}>
            <option value="">Todos los tipos</option>
            {TIPO_OPTS.map(t => <option key={t} value={t}>{t}</option>)}
          </select>
          <select value={filterLinea} onChange={e => setFilterLinea(e.target.value)} style={inputStyle}>
            <option value="">Todas las líneas</option>
            {LINEA_OPTS.map(l => <option key={l} value={l}>{l}</option>)}
          </select>
          <select value={filterActivo} onChange={e => setFilterActivo(e.target.value)} style={inputStyle}>
            <option value="true">Activas</option>
            <option value="false">Inactivas</option>
            <option value="">Todas</option>
          </select>
          <div style={{ color: '#64748B', fontSize: 13 }}>{filtered.length} / {unidades.length}</div>
        </div>

        {/* Tabla */}
        <div style={{ background: '#fff', borderRadius: 12, overflow: 'hidden', border: '1px solid #E5E7EB' }}>
          <div style={{ maxHeight: 'calc(100vh - 420px)', overflowY: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 14 }}>
              <thead style={{ background: '#F8FAFC', position: 'sticky', top: 0, zIndex: 1 }}>
                <tr>
                  <th style={thStyle}>Económico</th>
                  <th style={thStyle}>Tipo</th>
                  <th style={thStyle}>Línea</th>
                  <th style={thStyle}>Empresa</th>
                  <th style={thStyle}>GPS</th>
                  <th style={thStyle}>Última posición</th>
                  <th style={thStyle}>Activo</th>
                  <th style={thStyle}>Acciones</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr><td colSpan={8} style={{ padding: 30, textAlign: 'center', color: '#64748B' }}>Cargando...</td></tr>
                ) : filtered.length === 0 ? (
                  <tr><td colSpan={8} style={{ padding: 30, textAlign: 'center', color: '#64748B' }}>Sin resultados</td></tr>
                ) : filtered.map(u => {
                  const gps = gpsMap.get(u.numero_economico)
                  const fresh = gps?.ultima_actualizacion && new Date(gps.ultima_actualizacion).getTime() > Date.now() - 3600000
                  const stale = gps?.ultima_actualizacion && !fresh
                  return (
                    <tr key={u.numero_economico} style={{ borderTop: '1px solid #F1F5F9' }}>
                      <td style={tdStyle}><strong>{u.numero_economico}</strong></td>
                      <td style={tdStyle}>
                        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, padding: '2px 8px', borderRadius: 6, background: '#F1F5F9', fontSize: 12 }}>
                          <TipoIcon t={u.tipo} /> {u.tipo}
                        </span>
                      </td>
                      <td style={tdStyle}>{u.linea || '—'}</td>
                      <td style={tdStyle}>{u.empresa || '—'}</td>
                      <td style={tdStyle}>
                        {fresh ? <span style={badgeGreen}>EN VIVO</span>
                          : stale ? <span style={badgeYellow}>viejo</span>
                          : <span style={badgeGrey}>sin GPS</span>}
                      </td>
                      <td style={{ ...tdStyle, fontSize: 12, color: '#64748B' }}>
                        {gps?.ultima_actualizacion ? new Date(gps.ultima_actualizacion).toLocaleString('es-MX', { dateStyle: 'short', timeStyle: 'short' }) : '—'}
                        {gps?.ubicacion ? <div style={{ fontSize: 11, color: '#94A3B8', maxWidth: 220, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{gps.ubicacion}</div> : null}
                      </td>
                      <td style={tdStyle}>
                        <label style={{ cursor: 'pointer', display: 'inline-flex', alignItems: 'center' }}>
                          <input type="checkbox" checked={u.activo} onChange={e => toggleActivo(u.numero_economico, e.target.checked)} />
                        </label>
                      </td>
                      <td style={tdStyle}>
                        <button onClick={() => setEditing(u)} style={btnIcon} title="Editar"><Edit2 size={14} /></button>
                        <button onClick={() => toggleActivo(u.numero_economico, !u.activo)} style={{ ...btnIcon, color: u.activo ? '#DC2626' : '#10B981' }} title={u.activo ? 'Desactivar' : 'Activar'}>
                          <Trash2 size={14} />
                        </button>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {(editing || adding) && (
        <Modal
          unidad={editing || { numero_economico: '', tipo: 'tracto', linea: 'TROB', empresa: 'TROB', activo: true, notas: null, updated_at: '' }}
          isNew={adding}
          onClose={() => { setEditing(null); setAdding(false) }}
          onSave={saveUnidad}
        />
      )}
    </ModuleLayout>
  )
}

function Modal({ unidad, isNew, onClose, onSave }: { unidad: UnidadFlota; isNew: boolean; onClose: () => void; onSave: (u: UnidadFlota, isNew: boolean) => void }) {
  const [f, setF] = useState<UnidadFlota>(unidad)
  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(15,23,42,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 50 }}>
      <div style={{ background: '#fff', borderRadius: 12, padding: 24, width: 480, maxWidth: '90vw', boxShadow: '0 20px 50px rgba(0,0,0,0.3)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
          <h2 style={{ margin: 0, fontSize: 18, fontWeight: 700 }}>{isNew ? 'Agregar unidad' : `Editar ${f.numero_economico}`}</h2>
          <button onClick={onClose} style={{ ...btnIcon, fontSize: 20 }}><X size={20} /></button>
        </div>
        <div style={{ display: 'grid', gap: 12 }}>
          <Label text="Número económico">
            <input disabled={!isNew} value={f.numero_economico} onChange={e => setF({ ...f, numero_economico: e.target.value.trim() })} style={inputStyle} />
          </Label>
          <Label text="Tipo">
            <select value={f.tipo} onChange={e => setF({ ...f, tipo: e.target.value as any })} style={inputStyle}>
              {TIPO_OPTS.map(t => <option key={t} value={t}>{t}</option>)}
            </select>
          </Label>
          <Label text="Línea">
            <select value={f.linea || ''} onChange={e => setF({ ...f, linea: e.target.value })} style={inputStyle}>
              <option value="">(sin línea)</option>
              {LINEA_OPTS.map(l => <option key={l} value={l}>{l}</option>)}
            </select>
          </Label>
          <Label text="Empresa">
            <input value={f.empresa || ''} onChange={e => setF({ ...f, empresa: e.target.value })} style={inputStyle} placeholder="(toma el valor de Línea si se deja vacío)" />
          </Label>
          <Label text="Notas">
            <textarea value={f.notas || ''} onChange={e => setF({ ...f, notas: e.target.value })} style={{ ...inputStyle, minHeight: 60 }} />
          </Label>
          <label style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <input type="checkbox" checked={f.activo} onChange={e => setF({ ...f, activo: e.target.checked })} />
            <span>Activo (se consulta en el worker GPS)</span>
          </label>
        </div>
        <div style={{ display: 'flex', gap: 8, marginTop: 20, justifyContent: 'flex-end' }}>
          <button onClick={onClose} style={btnSecondary}>Cancelar</button>
          <button onClick={() => onSave(f, isNew)} style={btnPrimary} disabled={!f.numero_economico}>Guardar</button>
        </div>
      </div>
    </div>
  )
}

const Label = ({ text, children }: { text: string; children: React.ReactNode }) => (
  <div>
    <div style={{ fontSize: 12, color: '#64748B', marginBottom: 4, fontWeight: 500 }}>{text}</div>
    {children}
  </div>
)

const KpiCard = ({ label, value, color }: { label: string; value: number; color: string }) => (
  <div style={{ background: '#fff', padding: 16, borderRadius: 10, border: '1px solid #E5E7EB' }}>
    <div style={{ fontSize: 11, color: '#64748B', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{label}</div>
    <div style={{ fontSize: 28, fontWeight: 700, color, marginTop: 4 }}>{value.toLocaleString()}</div>
  </div>
)

const inputStyle: React.CSSProperties = {
  padding: '8px 12px', border: '1px solid #E5E7EB', borderRadius: 8, fontSize: 14,
  fontFamily: 'inherit', color: '#0F172A', background: '#fff', outline: 'none',
}
const thStyle: React.CSSProperties = { padding: '12px 16px', textAlign: 'left', fontWeight: 600, fontSize: 12, color: '#475569', textTransform: 'uppercase', letterSpacing: '0.03em' }
const tdStyle: React.CSSProperties = { padding: '10px 16px', color: '#0F172A', fontSize: 14 }
const btnPrimary: React.CSSProperties = { display: 'inline-flex', alignItems: 'center', gap: 6, padding: '9px 16px', background: '#3B6CE7', color: '#fff', border: 'none', borderRadius: 8, fontWeight: 600, cursor: 'pointer', fontSize: 14 }
const btnSecondary: React.CSSProperties = { padding: '9px 16px', background: '#F1F5F9', color: '#0F172A', border: 'none', borderRadius: 8, fontWeight: 600, cursor: 'pointer' }
const btnIcon: React.CSSProperties = { padding: 6, background: 'transparent', border: 'none', borderRadius: 6, cursor: 'pointer', color: '#475569', marginRight: 4 }
const badgeGreen: React.CSSProperties = { padding: '2px 8px', background: '#D1FAE5', color: '#065F46', borderRadius: 6, fontSize: 11, fontWeight: 600 }
const badgeYellow: React.CSSProperties = { padding: '2px 8px', background: '#FEF3C7', color: '#92400E', borderRadius: 6, fontSize: 11, fontWeight: 600 }
const badgeGrey: React.CSSProperties = { padding: '2px 8px', background: '#F1F5F9', color: '#64748B', borderRadius: 6, fontSize: 11, fontWeight: 600 }
