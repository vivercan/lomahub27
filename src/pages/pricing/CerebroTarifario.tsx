import { useState, useEffect, useRef } from 'react'
import type { ReactNode } from 'react'
import { DollarSign, TrendingUp, MapPin, Package, Search, RefreshCw, Globe, Flag, Plus, Trash2, Save, X, Clock, History } from 'lucide-react'
import { ModuleLayout } from '../../components/layout/ModuleLayout'
import { Card } from '../../components/ui/Card'
import { Button } from '../../components/ui/Button'
import { Badge } from '../../components/ui/Badge'
import { KPICard } from '../../components/ui/KPICard'
import { tokens } from '../../lib/tokens'
import { supabase } from '../../lib/supabase'
import { confirmDialog } from '../../components/ui/ConfirmModal'

/* –– Interfaces –– */
interface TarifaMX {
  id: string; rango_km_min: number; rango_km_max: number; tarifa_por_km: number
  tipo_equipo: string; empresa: string | null; descripcion: string | null; activo: boolean
  updated_at?: string
}
interface TarifaUSA {
  id: string; rango_millas_min: number; rango_millas_max: number; tarifa_por_milla: number
  tipo_equipo: string; empresa: string | null; descripcion: string | null; activo: boolean
  updated_at?: string
}
interface Cruce {
  id: string; nombre: string; ciudad_mx: string; ciudad_usa: string
  estado_mx: string | null; estado_usa: string | null; tarifa_cruce: number
  tarifa_cruce_hazmat: number; tiempo_promedio_hrs: number; restricciones: string | null
  activo: boolean; updated_at?: string
}
interface Accesorial {
  id: string; codigo: string; nombre: string; descripcion: string | null
  monto_default: number; moneda: string; tipo: string; aplica_a: string
  activo: boolean; updated_at?: string
}
interface HistorialEntry {
  id: string; tabla: string; registro_id: string; campo: string
  valor_anterior: string | null; valor_nuevo: string | null
  usuario: string; created_at: string
}

type TabKey = 'mx' | 'usa' | 'cruces' | 'accesoriales' | 'historial'

const TABS: { key: TabKey; label: string; icon: ReactNode }[] = [
  { key: 'mx', label: 'Tarifas MX', icon: <Flag size={15} /> },
  { key: 'usa', label: 'Tarifas USA', icon: <Globe size={15} /> },
  { key: 'cruces', label: 'Cruces', icon: <MapPin size={15} /> },
  { key: 'accesoriales', label: 'Accesoriales', icon: <Package size={15} /> },
  { key: 'historial', label: 'Historial', icon: <History size={15} /> },
]

const equipoBadge: Record<string, 'primary' | 'blue' | 'green' | 'orange'> = {
  seco: 'primary', refrigerado: 'blue', plataforma: 'green', lowboy: 'orange',
}
const tipoBadge: Record<string, 'primary' | 'green' | 'yellow' | 'orange'> = {
  fijo: 'primary', por_hora: 'green', por_dia: 'yellow', porcentaje: 'orange',
}

const fmtUSD = (n: number) => `US$${n.toLocaleString('en-US', { minimumFractionDigits: 2 })}`
const fmtMXN = (n: number) => `$${n.toLocaleString('es-MX', { minimumFractionDigits: 2 })}`
const fmtMoney = (n: number, mon: string) => mon === 'USD' ? fmtUSD(n) : fmtMXN(n)
const fmtDate = (d: string | undefined) => {
  if (!d) return '—'
  const dt = new Date(d)
  return dt.toLocaleDateString('es-MX', { day: '2-digit', month: 'short', year: 'numeric' }) + ' ' + dt.toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit' })
}

const EQUIPO_OPTIONS = ['seco', 'refrigerado', 'plataforma', 'lowboy']
const TIPO_OPTIONS = ['fijo', 'por_hora', 'por_dia', 'porcentaje']
const APLICA_OPTIONS = ['todos', 'impo', 'expo', 'nac', 'dedicado', 'usa']
const MONEDA_OPTIONS = ['MXN', 'USD']

/* –– Inline editable cell –– */
function EditableCell({ value, onSave, type = 'text', options }: {
  value: string | number; onSave: (v: string) => void; type?: 'text' | 'number' | 'select'; options?: string[]
}) {
  const [editing, setEditing] = useState(false)
  const [val, setVal] = useState(String(value))
  const ref = useRef<HTMLInputElement | HTMLSelectElement>(null)

  useEffect(() => { setVal(String(value)) }, [value])
  useEffect(() => { if (editing && ref.current) ref.current.focus() }, [editing])

  if (!editing) {
    return (
      <span
        onClick={() => setEditing(true)}
        style={{ cursor: 'pointer', borderBottom: '1px dashed rgba(0,0,0,0.2)', paddingBottom: '1px' }}
        title="Click para editar"
      >
        {type === 'select' ? (value || '—') : (value || '—')}
      </span>
    )
  }

  const save = () => { onSave(val); setEditing(false) }
  const cancel = () => { setVal(String(value)); setEditing(false) }

  if (type === 'select' && options) {
    return (
      <select
        ref={ref as React.RefObject<HTMLSelectElement>}
        value={val}
        onChange={e => setVal(e.target.value)}
        onBlur={save}
        onKeyDown={e => { if (e.key === 'Enter') save(); if (e.key === 'Escape') cancel() }}
        style={{
          padding: '2px 6px', fontSize: '13px', fontFamily: tokens.fonts.body,
          border: `1.5px solid ${tokens.colors.primary}`, borderRadius: '4px',
          outline: 'none', background: '#fff', width: '100%',
        }}
      >
        {options.map(o => <option key={o} value={o}>{o}</option>)}
      </select>
    )
  }

  return (
    <input
      ref={ref as React.RefObject<HTMLInputElement>}
      type={type === 'number' ? 'number' : 'text'}
      step={type === 'number' ? '0.01' : undefined}
      value={val}
      onChange={e => setVal(e.target.value)}
      onBlur={save}
      onKeyDown={e => { if (e.key === 'Enter') save(); if (e.key === 'Escape') cancel() }}
      style={{
        padding: '2px 6px', fontSize: '13px', fontFamily: tokens.fonts.body,
        border: `1.5px solid ${tokens.colors.primary}`, borderRadius: '4px',
        outline: 'none', width: type === 'number' ? '90px' : '100%',
      }}
    />
  )
}

/* –– Modal for adding new rows –– */
function AddModal({ tab, onSave, onClose }: { tab: TabKey; onSave: (data: Record<string, unknown>) => void; onClose: () => void }) {
  const [form, setForm] = useState<Record<string, string>>({})
  const set = (k: string, v: string) => setForm(prev => ({ ...prev, [k]: v }))

  const fields: { key: string; label: string; type: 'text' | 'number' | 'select'; options?: string[] }[] =
    tab === 'mx' ? [
      { key: 'rango_km_min', label: 'KM Mínimo', type: 'number' },
      { key: 'rango_km_max', label: 'KM Máximo', type: 'number' },
      { key: 'tarifa_por_km', label: 'Tarifa/km', type: 'number' },
      { key: 'tipo_equipo', label: 'Equipo', type: 'select', options: EQUIPO_OPTIONS },
      { key: 'descripcion', label: 'Descripción', type: 'text' },
    ] : tab === 'usa' ? [
      { key: 'rango_millas_min', label: 'Millas Mínimo', type: 'number' },
      { key: 'rango_millas_max', label: 'Millas Máximo', type: 'number' },
      { key: 'tarifa_por_milla', label: 'Tarifa/milla', type: 'number' },
      { key: 'tipo_equipo', label: 'Equipo', type: 'select', options: EQUIPO_OPTIONS },
      { key: 'descripcion', label: 'Descripción', type: 'text' },
    ] : tab === 'cruces' ? [
      { key: 'nombre', label: 'Nombre del cruce', type: 'text' },
      { key: 'ciudad_mx', label: 'Ciudad MX', type: 'text' },
      { key: 'estado_mx', label: 'Estado MX', type: 'text' },
      { key: 'ciudad_usa', label: 'Ciudad USA', type: 'text' },
      { key: 'estado_usa', label: 'Estado USA', type: 'text' },
      { key: 'tarifa_cruce', label: 'Tarifa cruce (USD)', type: 'number' },
      { key: 'tarifa_cruce_hazmat', label: 'Tarifa HAZMAT (USD)', type: 'number' },
      { key: 'tiempo_promedio_hrs', label: 'Tiempo promedio (hrs)', type: 'number' },
    ] : [
      { key: 'codigo', label: 'Código', type: 'text' },
      { key: 'nombre', label: 'Nombre', type: 'text' },
      { key: 'descripcion', label: 'Descripción', type: 'text' },
      { key: 'monto_default', label: 'Monto', type: 'number' },
      { key: 'moneda', label: 'Moneda', type: 'select', options: MONEDA_OPTIONS },
      { key: 'tipo', label: 'Tipo', type: 'select', options: TIPO_OPTIONS },
      { key: 'aplica_a', label: 'Aplica a', type: 'select', options: APLICA_OPTIONS },
    ]

  const handleSubmit = () => {
    const data: Record<string, unknown> = { activo: true }
    fields.forEach(f => {
      const v = form[f.key]
      if (!v) return
      data[f.key] = f.type === 'number' ? parseFloat(v) : v
    })
    onSave(data)
  }

  return (
    <div style={{
      position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 1000,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
    }} onClick={onClose}>
      <div style={{
        background: '#fff', borderRadius: '12px', padding: '24px', minWidth: '420px', maxWidth: '520px',
        boxShadow: '0 20px 60px rgba(0,0,0,0.3)',
      }} onClick={e => e.stopPropagation()}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
          <h3 style={{ fontFamily: tokens.fonts.heading, fontSize: '18px', fontWeight: 700, color: tokens.colors.textPrimary, margin: 0 }}>
            Agregar registro
          </h3>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: tokens.colors.textMuted }}>
            <X size={20} />
          </button>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {fields.map(f => (
            <div key={f.key}>
              <label style={{ fontSize: '12px', fontWeight: 600, color: tokens.colors.textSecondary, fontFamily: tokens.fonts.body, marginBottom: '4px', display: 'block' }}>
                {f.label}
              </label>
              {f.type === 'select' ? (
                <select
                  value={form[f.key] || f.options?.[0] || ''}
                  onChange={e => set(f.key, e.target.value)}
                  style={{
                    width: '100%', padding: '8px 10px', border: `1px solid ${tokens.colors.border}`,
                    borderRadius: '6px', fontSize: '13px', fontFamily: tokens.fonts.body, outline: 'none',
                  }}
                >
                  {f.options?.map(o => <option key={o} value={o}>{o}</option>)}
                </select>
              ) : (
                <input
                  type={f.type === 'number' ? 'number' : 'text'}
                  step={f.type === 'number' ? '0.01' : undefined}
                  value={form[f.key] || ''}
                  onChange={e => set(f.key, e.target.value)}
                  style={{
                    width: '100%', padding: '8px 10px', border: `1px solid ${tokens.colors.border}`,
                    borderRadius: '6px', fontSize: '13px', fontFamily: tokens.fonts.body, outline: 'none',
                    boxSizing: 'border-box',
                  }}
                />
              )}
            </div>
          ))}
        </div>

        <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end', marginTop: '20px' }}>
          <Button size="sm" variant="secondary" onClick={onClose}>Cancelar</Button>
          <Button size="sm" variant="primary" onClick={handleSubmit}><Save size={14} /> Guardar</Button>
        </div>
      </div>
    </div>
  )
}

/* –– Main Component –– */
export default function CerebroTarifario() /* renamed: Parámetros de Cotización */ {
  const [tab, setTab] = useState<TabKey>('mx')
  const [loading, setLoading] = useState(true)
  const [busqueda, setBusqueda] = useState('')
  const [showAddModal, setShowAddModal] = useState(false)
  const [saving, setSaving] = useState(false)

  const [tarifasMX, setTarifasMX] = useState<TarifaMX[]>([])
  const [tarifasUSA, setTarifasUSA] = useState<TarifaUSA[]>([])
  const [cruces, setCruces] = useState<Cruce[]>([])
  const [accesoriales, setAccesoriales] = useState<Accesorial[]>([])
  const [historial, setHistorial] = useState<HistorialEntry[]>([])

  useEffect(() => { fetchAll() }, [])

  async function fetchAll() {
    setLoading(true)
    const [rMX, rUSA, rCr, rAcc] = await Promise.all([
      supabase.from('tarifas_mx').select('*').eq('activo', true).order('rango_km_min'),
      supabase.from('tarifas_usa').select('*').eq('activo', true).order('rango_millas_min'),
      supabase.from('cruces').select('*').eq('activo', true).order('nombre'),
      supabase.from('accesoriales').select('*').eq('activo', true).order('codigo'),
    ])
    if (rMX.data) setTarifasMX(rMX.data)
    if (rUSA.data) setTarifasUSA(rUSA.data)
    if (rCr.data) setCruces(rCr.data)
    if (rAcc.data) setAccesoriales(rAcc.data)
    setLoading(false)
  }

  async function fetchHistorial() {
    const { data } = await supabase
      .from('pricing_historial')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(200)
    if (data) setHistorial(data)
  }

  useEffect(() => { if (tab === 'historial') fetchHistorial() }, [tab])

  /* –– Log change to historial –– */
  async function logChange(tabla: string, registro_id: string, campo: string, valor_anterior: unknown, valor_nuevo: unknown) {
    const { data: { user } } = await supabase.auth.getUser()
    await supabase.from('pricing_historial').insert({
      tabla, registro_id, campo,
      valor_anterior: valor_anterior != null ? String(valor_anterior) : null,
      valor_nuevo: valor_nuevo != null ? String(valor_nuevo) : null,
      usuario: user?.email || 'desconocido',
    })
  }

  /* –– Inline update handler –– */
  async function handleInlineUpdate(table: string, id: string, field: string, value: string, oldValue: unknown) {
    setSaving(true)
    const numFields = ['rango_km_min', 'rango_km_max', 'tarifa_por_km', 'rango_millas_min', 'rango_millas_max', 'tarifa_por_milla', 'tarifa_cruce', 'tarifa_cruce_hazmat', 'tiempo_promedio_hrs', 'monto_default']
    const parsed = numFields.includes(field) ? parseFloat(value) : value

    const { error } = await supabase.from(table).update({ [field]: parsed, updated_at: new Date().toISOString() }).eq('id', id)
    if (!error) {
      await logChange(table, id, field, oldValue, parsed)
      await fetchAll()
    }
    setSaving(false)
  }

  /* –– Add new row –– */
  async function handleAdd(data: Record<string, unknown>) {
    setSaving(true)
    const tableMap: Record<string, string> = { mx: 'tarifas_mx', usa: 'tarifas_usa', cruces: 'cruces', accesoriales: 'accesoriales' }
    const table = tableMap[tab]
    if (!table) return

    const { error } = await supabase.from(table).insert({ ...data, updated_at: new Date().toISOString() })
    if (!error) {
      await logChange(table, 'nuevo', 'INSERT', null, JSON.stringify(data))
      await fetchAll()
    }
    setShowAddModal(false)
    setSaving(false)
  }

  /* –– Delete row (soft delete) –– */
  async function handleDelete(table: string, id: string, label: string) {
    if (!await confirmDialog({ message: `¿Eliminar "${label}"? Se desactivará del sistema.`, danger: true })) return
    setSaving(true)
    const { error } = await supabase.from(table).update({ activo: false, updated_at: new Date().toISOString() }).eq('id', id)
    if (!error) {
      await logChange(table, id, 'activo', 'true', 'false (eliminado)')
      await fetchAll()
    }
    setSaving(false)
  }

  /* –– KPIs –– */
  const totalTarifas = tarifasMX.length + tarifasUSA.length
  const promedioKm = tarifasMX.length > 0
    ? (tarifasMX.reduce((s, t) => s + t.tarifa_por_km, 0) / tarifasMX.length).toFixed(2)
    : '0'

  /* –– Filter –– */
  const q = busqueda.toLowerCase()
  const filteredMX = tarifasMX.filter(t => !q || (t.descripcion || '').toLowerCase().includes(q) || t.tipo_equipo.includes(q))
  const filteredUSA = tarifasUSA.filter(t => !q || (t.descripcion || '').toLowerCase().includes(q) || t.tipo_equipo.includes(q))
  const filteredCruces = cruces.filter(c => !q || c.nombre.toLowerCase().includes(q) || c.ciudad_mx.toLowerCase().includes(q) || c.ciudad_usa.toLowerCase().includes(q))
  const filteredAcc = accesoriales.filter(a => !q || a.codigo.toLowerCase().includes(q) || a.nombre.toLowerCase().includes(q))
  const filteredHist = historial.filter(h => !q || h.tabla.includes(q) || h.campo.includes(q) || (h.usuario || '').toLowerCase().includes(q))

  /* –– Table cell styles –– */
  const cellStyle: React.CSSProperties = { padding: '10px 14px', fontSize: '13px', fontFamily: tokens.fonts.body, borderBottom: `1px solid ${tokens.colors.border}` }
  const headerStyle: React.CSSProperties = { ...cellStyle, fontSize: '11px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em', color: tokens.colors.textMuted, background: tokens.colors.bgMain }
  const greenStyle: React.CSSProperties = { color: tokens.colors.green, fontWeight: 700, fontSize: '14px' }
  const dateStyle: React.CSSProperties = { color: tokens.colors.textMuted, fontSize: '11px' }

  /* –– Render tables –– */
  const renderMX = () => (
    <table style={{ width: '100%', borderCollapse: 'collapse' }}>
      <thead>
        <tr>
          <th style={headerStyle}>Rango KM</th>
          <th style={{ ...headerStyle, textAlign: 'right' }}>Tarifa/km</th>
          <th style={headerStyle}>Equipo</th>
          <th style={headerStyle}>Descripción</th>
          <th style={{ ...headerStyle, width: '130px' }}>Modificado</th>
          <th style={{ ...headerStyle, width: '50px' }}></th>
        </tr>
      </thead>
      <tbody>
        {filteredMX.map(r => (
          <tr key={r.id} style={{ transition: 'background 0.15s' }} onMouseEnter={e => (e.currentTarget.style.background = tokens.colors.bgHover)} onMouseLeave={e => (e.currentTarget.style.background = '')}>
            <td style={cellStyle}>
              <span style={{ fontWeight: 600 }}>
                <EditableCell value={r.rango_km_min ?? 0} type="number" onSave={v => handleInlineUpdate('tarifas_mx', r.id, 'rango_km_min', v, r.rango_km_min)} />
                {' — '}
                <EditableCell value={r.rango_km_max >= 99000 ? '∞' : r.rango_km_max} type="number" onSave={v => handleInlineUpdate('tarifas_mx', r.id, 'rango_km_max', v, r.rango_km_max)} />
                {' km'}
              </span>
            </td>
            <td style={{ ...cellStyle, textAlign: 'right' }}>
              <span style={greenStyle}>
                $<EditableCell value={r.tarifa_por_km} type="number" onSave={v => handleInlineUpdate('tarifas_mx', r.id, 'tarifa_por_km', v, r.tarifa_por_km)} />
              </span>
            </td>
            <td style={cellStyle}>
              <EditableCell value={r.tipo_equipo} type="select" options={EQUIPO_OPTIONS} onSave={v => handleInlineUpdate('tarifas_mx', r.id, 'tipo_equipo', v, r.tipo_equipo)} />
            </td>
            <td style={cellStyle}>
              <EditableCell value={r.descripcion || ''} onSave={v => handleInlineUpdate('tarifas_mx', r.id, 'descripcion', v, r.descripcion)} />
            </td>
            <td style={{ ...cellStyle, ...dateStyle }}>{fmtDate(r.updated_at)}</td>
            <td style={cellStyle}>
              <button onClick={() => handleDelete('tarifas_mx', r.id, r.descripcion || 'tarifa')} style={{ background: 'none', border: 'none', cursor: 'pointer', color: tokens.colors.textMuted, opacity: 0.5 }} title="Eliminar">
                <Trash2 size={14} />
              </button>
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  )

  const renderUSA = () => (
    <table style={{ width: '100%', borderCollapse: 'collapse' }}>
      <thead>
        <tr>
          <th style={headerStyle}>Rango Millas</th>
          <th style={{ ...headerStyle, textAlign: 'right' }}>Tarifa/milla</th>
          <th style={headerStyle}>Equipo</th>
          <th style={headerStyle}>Descripción</th>
          <th style={{ ...headerStyle, width: '130px' }}>Modificado</th>
          <th style={{ ...headerStyle, width: '50px' }}></th>
        </tr>
      </thead>
      <tbody>
        {filteredUSA.map(r => (
          <tr key={r.id} style={{ transition: 'background 0.15s' }} onMouseEnter={e => (e.currentTarget.style.background = tokens.colors.bgHover)} onMouseLeave={e => (e.currentTarget.style.background = '')}>
            <td style={cellStyle}>
              <span style={{ fontWeight: 600 }}>
                <EditableCell value={r.rango_millas_min ?? 0} type="number" onSave={v => handleInlineUpdate('tarifas_usa', r.id, 'rango_millas_min', v, r.rango_millas_min)} />
                {' — '}
                <EditableCell value={r.rango_millas_max >= 99000 ? '∞' : r.rango_millas_max} type="number" onSave={v => handleInlineUpdate('tarifas_usa', r.id, 'rango_millas_max', v, r.rango_millas_max)} />
                {' mi'}
              </span>
            </td>
            <td style={{ ...cellStyle, textAlign: 'right' }}>
              <span style={greenStyle}>
                US$<EditableCell value={r.tarifa_por_milla} type="number" onSave={v => handleInlineUpdate('tarifas_usa', r.id, 'tarifa_por_milla', v, r.tarifa_por_milla)} />
              </span>
            </td>
            <td style={cellStyle}>
              <EditableCell value={r.tipo_equipo} type="select" options={EQUIPO_OPTIONS} onSave={v => handleInlineUpdate('tarifas_usa', r.id, 'tipo_equipo', v, r.tipo_equipo)} />
            </td>
            <td style={cellStyle}>
              <EditableCell value={r.descripcion || ''} onSave={v => handleInlineUpdate('tarifas_usa', r.id, 'descripcion', v, r.descripcion)} />
            </td>
            <td style={{ ...cellStyle, ...dateStyle }}>{fmtDate(r.updated_at)}</td>
            <td style={cellStyle}>
              <button onClick={() => handleDelete('tarifas_usa', r.id, r.descripcion || 'tarifa')} style={{ background: 'none', border: 'none', cursor: 'pointer', color: tokens.colors.textMuted, opacity: 0.5 }} title="Eliminar">
                <Trash2 size={14} />
              </button>
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  )

  const renderCruces = () => (
    <table style={{ width: '100%', borderCollapse: 'collapse' }}>
      <thead>
        <tr>
          <th style={headerStyle}>Cruce</th>
          <th style={headerStyle}>MX – USA</th>
          <th style={{ ...headerStyle, textAlign: 'right' }}>Tarifa</th>
          <th style={{ ...headerStyle, textAlign: 'right' }}>HAZMAT</th>
          <th style={{ ...headerStyle, textAlign: 'center', width: '80px' }}>Tiempo</th>
          <th style={{ ...headerStyle, width: '130px' }}>Modificado</th>
          <th style={{ ...headerStyle, width: '50px' }}></th>
        </tr>
      </thead>
      <tbody>
        {filteredCruces.map(r => (
          <tr key={r.id} style={{ transition: 'background 0.15s' }} onMouseEnter={e => (e.currentTarget.style.background = tokens.colors.bgHover)} onMouseLeave={e => (e.currentTarget.style.background = '')}>
            <td style={{ ...cellStyle, fontWeight: 700 }}>
              <EditableCell value={r.nombre} onSave={v => handleInlineUpdate('cruces', r.id, 'nombre', v, r.nombre)} />
            </td>
            <td style={cellStyle}>
              <EditableCell value={r.ciudad_mx} onSave={v => handleInlineUpdate('cruces', r.id, 'ciudad_mx', v, r.ciudad_mx)} />
              {', '}
              <EditableCell value={r.estado_mx || ''} onSave={v => handleInlineUpdate('cruces', r.id, 'estado_mx', v, r.estado_mx)} />
              <span style={{ color: tokens.colors.textMuted, margin: '0 6px' }}>–</span>
              <EditableCell value={r.ciudad_usa} onSave={v => handleInlineUpdate('cruces', r.id, 'ciudad_usa', v, r.ciudad_usa)} />
              {', '}
              <EditableCell value={r.estado_usa || ''} onSave={v => handleInlineUpdate('cruces', r.id, 'estado_usa', v, r.estado_usa)} />
            </td>
            <td style={{ ...cellStyle, textAlign: 'right' }}>
              <span style={greenStyle}>
                US$<EditableCell value={r.tarifa_cruce} type="number" onSave={v => handleInlineUpdate('cruces', r.id, 'tarifa_cruce', v, r.tarifa_cruce)} />
              </span>
            </td>
            <td style={{ ...cellStyle, textAlign: 'right' }}>
              <span style={{ color: tokens.colors.orange, fontWeight: 700, fontSize: '14px' }}>
                US$<EditableCell value={r.tarifa_cruce_hazmat} type="number" onSave={v => handleInlineUpdate('cruces', r.id, 'tarifa_cruce_hazmat', v, r.tarifa_cruce_hazmat)} />
              </span>
            </td>
            <td style={{ ...cellStyle, textAlign: 'center' }}>
              <EditableCell value={r.tiempo_promedio_hrs} type="number" onSave={v => handleInlineUpdate('cruces', r.id, 'tiempo_promedio_hrs', v, r.tiempo_promedio_hrs)} />h
            </td>
            <td style={{ ...cellStyle, ...dateStyle }}>{fmtDate(r.updated_at)}</td>
            <td style={cellStyle}>
              <button onClick={() => handleDelete('cruces', r.id, r.nombre)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: tokens.colors.textMuted, opacity: 0.5 }} title="Eliminar">
                <Trash2 size={14} />
              </button>
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  )

  const renderAccesoriales = () => (
    <table style={{ width: '100%', borderCollapse: 'collapse' }}>
      <thead>
        <tr>
          <th style={{ ...headerStyle, width: '130px' }}>Código</th>
          <th style={headerStyle}>Concepto</th>
          <th style={{ ...headerStyle, textAlign: 'right', width: '120px' }}>Monto</th>
          <th style={{ ...headerStyle, width: '80px' }}>Moneda</th>
          <th style={{ ...headerStyle, width: '100px' }}>Tipo</th>
          <th style={{ ...headerStyle, width: '90px' }}>Aplica</th>
          <th style={{ ...headerStyle, width: '130px' }}>Modificado</th>
          <th style={{ ...headerStyle, width: '50px' }}></th>
        </tr>
      </thead>
      <tbody>
        {filteredAcc.map(r => (
          <tr key={r.id} style={{ transition: 'background 0.15s' }} onMouseEnter={e => (e.currentTarget.style.background = tokens.colors.bgHover)} onMouseLeave={e => (e.currentTarget.style.background = '')}>
            <td style={{ ...cellStyle, color: tokens.colors.primary, fontWeight: 700 }}>
              <EditableCell value={r.codigo} onSave={v => handleInlineUpdate('accesoriales', r.id, 'codigo', v, r.codigo)} />
            </td>
            <td style={cellStyle}>
              <div>
                <div style={{ fontWeight: 600 }}>
                  <EditableCell value={r.nombre} onSave={v => handleInlineUpdate('accesoriales', r.id, 'nombre', v, r.nombre)} />
                </div>
                <div style={{ color: tokens.colors.textMuted, fontSize: '11px' }}>
                  <EditableCell value={r.descripcion || ''} onSave={v => handleInlineUpdate('accesoriales', r.id, 'descripcion', v, r.descripcion)} />
                </div>
              </div>
            </td>
            <td style={{ ...cellStyle, textAlign: 'right' }}>
              <span style={greenStyle}>
                {r.moneda === 'USD' ? 'US$' : '$'}<EditableCell value={r.monto_default} type="number" onSave={v => handleInlineUpdate('accesoriales', r.id, 'monto_default', v, r.monto_default)} />
              </span>
            </td>
            <td style={cellStyle}>
              <EditableCell value={r.moneda} type="select" options={MONEDA_OPTIONS} onSave={v => handleInlineUpdate('accesoriales', r.id, 'moneda', v, r.moneda)} />
            </td>
            <td style={cellStyle}>
              <EditableCell value={r.tipo} type="select" options={TIPO_OPTIONS} onSave={v => handleInlineUpdate('accesoriales', r.id, 'tipo', v, r.tipo)} />
            </td>
            <td style={{ ...cellStyle, textTransform: 'uppercase', fontSize: '12px' }}>
              <EditableCell value={r.aplica_a} type="select" options={APLICA_OPTIONS} onSave={v => handleInlineUpdate('accesoriales', r.id, 'aplica_a', v, r.aplica_a)} />
            </td>
            <td style={{ ...cellStyle, ...dateStyle }}>{fmtDate(r.updated_at)}</td>
            <td style={cellStyle}>
              <button onClick={() => handleDelete('accesoriales', r.id, r.nombre)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: tokens.colors.textMuted, opacity: 0.5 }} title="Eliminar">
                <Trash2 size={14} />
              </button>
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  )

  const tablaLabels: Record<string, string> = { tarifas_mx: 'Tarifas MX', tarifas_usa: 'Tarifas USA', cruces: 'Cruces', accesoriales: 'Accesoriales' }

  const renderHistorial = () => (
    <table style={{ width: '100%', borderCollapse: 'collapse' }}>
      <thead>
        <tr>
          <th style={{ ...headerStyle, width: '160px' }}>Fecha</th>
          <th style={{ ...headerStyle, width: '130px' }}>Tabla</th>
          <th style={{ ...headerStyle, width: '140px' }}>Campo</th>
          <th style={headerStyle}>Valor anterior</th>
          <th style={headerStyle}>Valor nuevo</th>
          <th style={{ ...headerStyle, width: '180px' }}>Usuario</th>
        </tr>
      </thead>
      <tbody>
        {filteredHist.length === 0 ? (
          <tr><td colSpan={6} style={{ ...cellStyle, textAlign: 'center', color: tokens.colors.textMuted, padding: '40px' }}>Sin registros de cambios</td></tr>
        ) : filteredHist.map(h => (
          <tr key={h.id} style={{ transition: 'background 0.15s' }} onMouseEnter={e => (e.currentTarget.style.background = tokens.colors.bgHover)} onMouseLeave={e => (e.currentTarget.style.background = '')}>
            <td style={{ ...cellStyle, fontSize: '12px', color: tokens.colors.textSecondary }}>
              <Clock size={12} style={{ marginRight: '4px', verticalAlign: 'middle' }} />
              {fmtDate(h.created_at)}
            </td>
            <td style={cellStyle}>
              <Badge color="primary">{tablaLabels[h.tabla] || h.tabla}</Badge>
            </td>
            <td style={{ ...cellStyle, fontWeight: 600, color: tokens.colors.textPrimary }}>{h.campo}</td>
            <td style={{ ...cellStyle, color: '#DC2626', fontSize: '12px' }}>{h.valor_anterior || '—'}</td>
            <td style={{ ...cellStyle, color: tokens.colors.green, fontSize: '12px' }}>{h.valor_nuevo || '—'}</td>
            <td style={{ ...cellStyle, fontSize: '12px', color: tokens.colors.textSecondary }}>{h.usuario}</td>
          </tr>
        ))}
      </tbody>
    </table>
  )

  return (
    <ModuleLayout
      titulo="Parámetros de Cotización"
      subtitulo="Configuración de tarifas — tarifas MX/USA, cruces fronterizos y accesoriales"
      acciones={
        <div style={{ display: 'flex', gap: tokens.spacing.sm }}>
          {tab !== 'historial' && (
            <Button size="sm" variant="primary" onClick={() => setShowAddModal(true)}><Plus size={16} /> Agregar</Button>
          )}
          <Button size="sm" variant="secondary" onClick={() => { fetchAll(); if (tab === 'historial') fetchHistorial() }}>
            <RefreshCw size={16} className={saving ? 'animate-spin' : ''} /> Actualizar
          </Button>
        </div>
      }
    >
      {/* KPIs */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: tokens.spacing.md, marginBottom: tokens.spacing.lg }}>
        <KPICard titulo="Tarifas Activas" valor={totalTarifas} subtitulo={`${tarifasMX.length} MX + ${tarifasUSA.length} USA`} color="primary" icono={<DollarSign size={20} />} />
        <KPICard titulo="Promedio MX" valor={`$${promedioKm}/km`} subtitulo="tarifa promedio por km" color="green" icono={<TrendingUp size={20} />} />
        <KPICard titulo="Cruces Activos" valor={cruces.length} subtitulo="puntos fronterizos" color="yellow" icono={<MapPin size={20} />} />
        <KPICard titulo="Accesoriales" valor={accesoriales.length} subtitulo="conceptos configurados" color="blue" icono={<Package size={20} />} />
      </div>

      <Card>
        {/* Tab bar + search */}
        <div style={{ display: 'flex', alignItems: 'center', gap: tokens.spacing.md, marginBottom: tokens.spacing.md, flexWrap: 'wrap' }}>
          <div style={{ display: 'flex', gap: '4px', background: tokens.colors.bgMain, borderRadius: tokens.radius.md, padding: '3px' }}>
            {TABS.map(t => (
              <button
                key={t.key}
                onClick={() => { setTab(t.key); setBusqueda('') }}
                style={{
                  display: 'flex', alignItems: 'center', gap: '6px',
                  padding: '6px 14px', borderRadius: tokens.radius.sm, fontSize: '13px',
                  fontFamily: tokens.fonts.body, fontWeight: tab === t.key ? 700 : 500,
                  border: 'none', cursor: 'pointer', transition: 'all 0.2s',
                  background: tab === t.key ? tokens.colors.primary : 'transparent',
                  color: tab === t.key ? '#fff' : tokens.colors.textSecondary,
                }}
              >
                {t.icon} {t.label}
              </button>
            ))}
          </div>

          <div style={{
            display: 'flex', alignItems: 'center', gap: '8px',
            background: tokens.colors.bgHover, borderRadius: tokens.radius.md, padding: '6px 12px', flex: '0 0 240px', marginLeft: 'auto'
          }}>
            <Search size={14} style={{ color: tokens.colors.textMuted }} />
            <input
              value={busqueda}
              onChange={e => setBusqueda(e.target.value)}
              placeholder="Buscar..."
              style={{
                background: 'transparent', border: 'none', outline: 'none',
                color: tokens.colors.textPrimary, fontFamily: tokens.fonts.body, fontSize: '13px', width: '100%',
              }}
            />
          </div>
        </div>

        {/* Table */}
        <div style={{ overflowX: 'auto' }}>
          {loading ? (
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '48px' }}>
              <div style={{ width: '32px', height: '32px', border: `3px solid ${tokens.colors.primary}`, borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin 1s linear infinite' }} />
            </div>
          ) : (
            tab === 'mx' ? renderMX() :
            tab === 'usa' ? renderUSA() :
            tab === 'cruces' ? renderCruces() :
            tab === 'accesoriales' ? renderAccesoriales() :
            renderHistorial()
          )}
        </div>
      </Card>

      {/* Add Modal */}
      {showAddModal && tab !== 'historial' && (
        <AddModal tab={tab} onSave={handleAdd} onClose={() => setShowAddModal(false)} />
      )}
    </ModuleLayout>
  )
}
