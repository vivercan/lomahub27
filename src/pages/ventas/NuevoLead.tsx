import type { ReactElement } from 'react'
import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { ArrowLeft, Globe, User, Phone, Mail, AlertCircle, CheckCircle, Building2, MapPin, Target, Zap, Save } from 'lucide-react'
import { tokens } from '../../lib/tokens'
import { ModuleLayout } from '../../components/layout/ModuleLayout'
import { supabase } from '../../lib/supabase'
import { useAuthContext } from '../../hooks/AuthContext'

const TIPO_SERVICIO = ['Seco', 'Refrigerado', 'Seco Hazmat', 'Refri Hazmat']
const TIPO_VIAJE = ['Impo', 'Expo', 'Nacional', 'Dedicado']
const TIPO_EMPRESA_OPTS = [
  { value: '', label: 'Selecciona...' },
  { value: 'Naviera', label: 'Naviera' },
  { value: 'Freight Forwarder', label: 'Freight Forwarder' },
  { value: 'Directo', label: 'Directo' },
  { value: 'Broker', label: 'Broker' },
  { value: 'Otro', label: 'Otro' },
]
const PRIORIDAD_OPTS = [
  { value: 'media', label: 'Media', color: tokens.colors.yellow },
  { value: 'alta', label: 'Alta', color: tokens.colors.red },
  { value: 'baja', label: 'Baja', color: tokens.colors.green },
]
const TAMANO_OPTS = [
  { value: '', label: '-' },
  { value: 'chico', label: 'Chico' },
  { value: 'mediano', label: 'Mediano' },
  { value: 'grande', label: 'Grande' },
  { value: 'enterprise', label: 'Enterprise' },
]

export default function NuevoLead(): ReactElement {
  const navigate = useNavigate()
  const { user } = useAuthContext()
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)

  const [empresa, setEmpresa] = useState('')
  const [web, setWeb] = useState('')
  const [contacto, setContacto] = useState('')
  const [telefono, setTelefono] = useState('')
  const [email, setEmail] = useState('')
  const [tipoEmpresa, setTipoEmpresa] = useState('')
  const [ciudad, setCiudad] = useState('')
  const [estadoMx, setEstadoMx] = useState('')
  const [prioridad, setPrioridad] = useState('media')
  const [tamano, setTamano] = useState('')
  const [fechaCierre, setFechaCierre] = useState('')

  const [tipoServicio, setTipoServicio] = useState<string[]>([])
  const [tipoViaje, setTipoViaje] = useState<string[]>([])
  const [transbordo, setTransbordo] = useState(false)
  const [dtd, setDtd] = useState(false)
  const [proximosPasos, setProximosPasos] = useState('')

  const [ruta, setRuta] = useState('')
  const [viajesMes, setViajesMes] = useState('')
  const [tarifa, setTarifa] = useState('')
  const [proyectadoUsd, setProyectadoUsd] = useState('')

  const [hitoN4, setHitoN4] = useState(false)
  const [hitoN5, setHitoN5] = useState(false)
  const [hitoN6, setHitoN6] = useState(false)
  const [hitoN7, setHitoN7] = useState(false)

  const [dupWarning, setDupWarning] = useState(false)

  useEffect(() => {
    const vm = parseInt(viajesMes) || 0
    const t = parseFloat(tarifa) || 0
    if (vm > 0 && t > 0) setProyectadoUsd((vm * t).toFixed(0))
  }, [viajesMes, tarifa])

  const toggleChip = (arr: string[], val: string, setter: (v: string[]) => void) => {
    setter(arr.includes(val) ? arr.filter(v => v !== val) : [...arr, val])
  }

  const checkDuplicate = async (name: string) => {
    if (name.length < 3) { setDupWarning(false); return }
    const { data } = await supabase.from('leads').select('id').ilike('empresa', '%' + name + '%').limit(1)
    setDupWarning((data || []).length > 0)
  }

  const handleSave = async () => {
    if (!empresa.trim()) { setError('Empresa es obligatoria'); return }
    setSaving(true); setError('')
    try {
      const { error: err } = await supabase.from('leads').insert([{
        empresa: empresa.trim().toUpperCase(),
        contacto: contacto.trim(),
        telefono: telefono.trim(),
        email: email.trim(),
        web: web.trim(),
        tipo_empresa: tipoEmpresa,
        ciudad: ciudad.trim(),
        estado_mx: estadoMx.trim(),
        prioridad,
        tamano,
        fecha_cierre: fechaCierre || null,
        tipo_carga: tipoServicio.join(', '),
        tipo_viaje: tipoViaje.join(', '),
        transbordo,
        dtd,
        proximos_pasos: proximosPasos.trim(),
        ruta_interes: ruta.trim(),
        viajes_mes: parseInt(viajesMes) || 0,
        tarifa: parseFloat(tarifa) || 0,
        proyectado_usd: parseFloat(proyectadoUsd) || 0,
        valor_estimado: parseFloat(proyectadoUsd) || 0,
        estado: 'Nuevo',
        probabilidad: 10,
        fuente: 'Manual',
        ejecutivo_id: user?.id || '',
        ejecutivo_nombre: user?.nombre || user?.email || 'Sin asignar',
        fecha_creacion: new Date().toISOString(),
        fecha_ultimo_mov: new Date().toISOString(),
      }])
      if (err) throw err
      setSuccess(true)
      setTimeout(() => navigate('/ventas/mis-leads'), 1200)
    } catch (e: any) { setError(e.message || 'Error al guardar') }
    finally { setSaving(false) }
  }

  // ─── STYLES ──────────────────────────────────────────
  const page: React.CSSProperties = {
    minHeight: '100vh', background: tokens.colors.bgMain,
    display: 'flex', flexDirection: 'column',
    fontFamily: tokens.fonts.body, color: tokens.colors.textPrimary,
  }
  const header: React.CSSProperties = {
    display: 'flex', alignItems: 'center', gap: '16px',
    padding: '20px 32px', borderBottom: '1px solid ' + tokens.colors.border,
  }
  const backBtn: React.CSSProperties = {
    width: 36, height: 36, borderRadius: tokens.radius.md,
    background: tokens.colors.orange, border: 'none', cursor: 'pointer',
    display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff',
  }
  const titleStyle: React.CSSProperties = {
    fontSize: '24px', fontWeight: 800, margin: 0,
    fontFamily: tokens.fonts.heading, color: tokens.colors.textPrimary,
  }
  const grid3: React.CSSProperties = {
    display: 'grid', gridTemplateColumns: '1fr 1fr 1fr',
    gap: '24px', padding: '24px 32px', flex: 1,
  }
  const section = (borderColor: string): React.CSSProperties => ({
    background: tokens.colors.bgCard, borderRadius: tokens.radius.lg,
    border: '1px solid ' + tokens.colors.border,
    borderLeft: '4px solid ' + borderColor,
    padding: '20px',
  })
  const sectionNoBorder: React.CSSProperties = {
    background: tokens.colors.bgCard, borderRadius: tokens.radius.lg,
    border: '1px solid ' + tokens.colors.border,
    padding: '20px',
  }
  const sectionTitle = (color: string): React.CSSProperties => ({
    fontSize: '12px', fontWeight: 800, textTransform: 'uppercase' as const,
    letterSpacing: '0.1em', color, marginBottom: '16px',
    fontFamily: tokens.fonts.heading,
    display: 'flex', alignItems: 'center', gap: '8px',
  })
  const inputStyle: React.CSSProperties = {
    width: '100%', padding: '10px 12px', fontSize: '13px',
    background: tokens.colors.bgHover, border: '1px solid ' + tokens.colors.border,
    borderRadius: tokens.radius.md, color: tokens.colors.textPrimary,
    outline: 'none', fontFamily: tokens.fonts.body,
    boxSizing: 'border-box' as const,
  }
  const labelStyle: React.CSSProperties = {
    fontSize: '11px', fontWeight: 600, color: tokens.colors.textMuted,
    marginBottom: '4px', display: 'flex', alignItems: 'center', gap: '6px',
    fontFamily: tokens.fonts.body,
  }
  const row2: React.CSSProperties = { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }
  const row3: React.CSSProperties = { display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '12px' }
  const fieldWrap: React.CSSProperties = { marginBottom: '12px' }
  const chip = (active: boolean): React.CSSProperties => ({
    padding: '8px 16px', borderRadius: tokens.radius.md,
    fontSize: '12px', fontWeight: 600, cursor: 'pointer',
    background: active ? tokens.colors.primary : tokens.colors.bgHover,
    color: active ? '#fff' : tokens.colors.textSecondary,
    border: '1px solid ' + (active ? tokens.colors.primary : tokens.colors.border),
    fontFamily: tokens.fonts.body, textAlign: 'center' as const,
    transition: 'all 0.15s ease',
  })
  const chipGrid: React.CSSProperties = {
    display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', marginBottom: '16px',
  }
  const checkRow: React.CSSProperties = {
    display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px',
    fontSize: '13px', color: tokens.colors.textSecondary, cursor: 'pointer',
    fontFamily: tokens.fonts.body,
  }
  const footer: React.CSSProperties = {
    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
    padding: '16px 32px', borderTop: '1px solid ' + tokens.colors.border,
    background: tokens.colors.bgCard,
  }
  const saveBtn: React.CSSProperties = {
    padding: '12px 28px', borderRadius: tokens.radius.md, cursor: 'pointer',
    background: tokens.colors.primary, color: '#fff', border: 'none',
    fontSize: '13px', fontWeight: 700, fontFamily: tokens.fonts.heading,
    display: 'flex', alignItems: 'center', gap: '8px',
    boxShadow: tokens.effects.glowPrimary, letterSpacing: '0.05em',
    textTransform: 'uppercase' as const,
    opacity: saving || success ? 0.6 : 1,
  }
  const selectStyle: React.CSSProperties = {
    ...inputStyle, appearance: 'auto' as const,
  }
  const prioBtn = (val: string, color: string): React.CSSProperties => ({
    padding: '8px 12px', borderRadius: tokens.radius.md,
    fontSize: '11px', fontWeight: 600, cursor: 'pointer',
    background: prioridad === val ? color : tokens.colors.bgHover,
    color: prioridad === val ? '#fff' : tokens.colors.textSecondary,
    border: '1px solid ' + (prioridad === val ? color : tokens.colors.border),
    fontFamily: tokens.fonts.body, display: 'flex', alignItems: 'center', gap: '4px',
  })

  return (
    <ModuleLayout titulo="Agregar Lead">
      {/* 3 COLUMN GRID */}
      <div style={grid3}>
        {/* ─── LEFT: N1 - EMPRESA ─── */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div style={section(tokens.colors.green)}>
            <div style={sectionTitle(tokens.colors.green)}>
              <Building2 size={14} /> N1 - EMPRESA
            </div>
            <div style={fieldWrap}>
              <input style={{ ...inputStyle, fontSize: '15px', fontWeight: 700, fontFamily: tokens.fonts.heading, textTransform: 'uppercase' }}
                placeholder="EMPRESA S.A. DE C.V."
                value={empresa}
                onChange={e => { setEmpresa(e.target.value); checkDuplicate(e.target.value) }} />
            </div>
            <div style={{ ...row2, ...fieldWrap }}>
              <div>
                <div style={labelStyle}><Globe size={12} /> Web</div>
                <input style={inputStyle} placeholder="www.empresa.com" value={web} onChange={e => setWeb(e.target.value)} />
              </div>
              <div>
                <div style={labelStyle}><User size={12} /> Contacto</div>
                <input style={inputStyle} placeholder="Juan Pérez" value={contacto} onChange={e => setContacto(e.target.value)} />
              </div>
            </div>
            <div style={{ ...row2, ...fieldWrap }}>
              <div>
                <div style={labelStyle}><Phone size={12} /> Teléfono</div>
                <input style={inputStyle} placeholder="55 1234 5678" value={telefono} onChange={e => setTelefono(e.target.value)} />
              </div>
              <div>
                <div style={labelStyle}><Mail size={12} /> Email</div>
                <input style={inputStyle} placeholder="mail@empresa.com" value={email} onChange={e => setEmail(e.target.value)} />
              </div>
            </div>
            <div style={fieldWrap}>
              <div style={labelStyle}><Building2 size={12} /> Tipo de Empresa</div>
              <select style={selectStyle} value={tipoEmpresa} onChange={e => setTipoEmpresa(e.target.value)}>
                {TIPO_EMPRESA_OPTS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
              </select>
            </div>
            <div style={{ ...row2, ...fieldWrap }}>
              <div>
                <div style={labelStyle}>Ciudad</div>
                <input style={inputStyle} placeholder="Monterrey" value={ciudad} onChange={e => setCiudad(e.target.value)} />
              </div>
              <div>
                <div style={labelStyle}>Estado</div>
                <input style={inputStyle} placeholder="Nuevo León" value={estadoMx} onChange={e => setEstadoMx(e.target.value)} />
              </div>
            </div>
            <div style={row3}>
              <div>
                <div style={labelStyle}><Target size={12} /> Prior.</div>
                <div style={{ display: 'flex', gap: '4px' }}>
                  {PRIORIDAD_OPTS.map(p => (
                    <button key={p.value} style={prioBtn(p.value, p.color)} onClick={() => setPrioridad(p.value)}>
                      {p.label}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <div style={labelStyle}><Zap size={12} /> Tamaño</div>
                <select style={selectStyle} value={tamano} onChange={e => setTamano(e.target.value)}>
                  {TAMANO_OPTS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
                </select>
              </div>
              <div>
                <div style={labelStyle}>Cierre</div>
                <input style={inputStyle} type="date" value={fechaCierre} onChange={e => setFechaCierre(e.target.value)} />
              </div>
            </div>
          </div>
        </div>

        {/* ─── CENTER: SERVICIO + VIAJE + PROX PASOS ─── */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div style={sectionNoBorder}>
            <div style={sectionTitle(tokens.colors.primary)}>
              <Zap size={14} /> TIPO DE SERVICIO
            </div>
            <div style={chipGrid}>
              {TIPO_SERVICIO.map(s => (
                <button key={s} style={chip(tipoServicio.includes(s))} onClick={() => toggleChip(tipoServicio, s, setTipoServicio)}>
                  {s}
                </button>
              ))}
            </div>
          </div>
          <div style={sectionNoBorder}>
            <div style={sectionTitle(tokens.colors.green)}>
              <MapPin size={14} /> TIPO DE VIAJE
            </div>
            <div style={chipGrid}>
              {TIPO_VIAJE.map(v => (
                <button key={v} style={chip(tipoViaje.includes(v))} onClick={() => toggleChip(tipoViaje, v, setTipoViaje)}>
                  {v}
                </button>
              ))}
            </div>
            <div style={{ display: 'flex', gap: '24px' }}>
              <label style={checkRow}>
                <input type="checkbox" checked={transbordo} onChange={e => setTransbordo(e.target.checked)} /> Transbordo
              </label>
              <label style={checkRow}>
                <input type="checkbox" checked={dtd} onChange={e => setDtd(e.target.checked)} /> DTD
              </label>
            </div>
          </div>
          <div style={sectionNoBorder}>
            <div style={sectionTitle(tokens.colors.orange)}>
              <AlertCircle size={14} /> PRÓXIMOS PASOS
            </div>
            <textarea
              style={{ ...inputStyle, minHeight: '160px', resize: 'vertical' as const }}
              placeholder="Describe los próximos pasos..."
              value={proximosPasos}
              onChange={e => setProximosPasos(e.target.value)} />
          </div>
        </div>

        {/* ─── RIGHT: N3 - FINANZAS + HITOS ─── */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div style={section(tokens.colors.orange)}>
            <div style={sectionTitle(tokens.colors.orange)}>
              <Zap size={14} /> N3 - FINANZAS
            </div>
            <div style={fieldWrap}>
              <input style={inputStyle} placeholder="CDMX - MTY - GDL" value={ruta} onChange={e => setRuta(e.target.value)} />
            </div>
            <div style={{ ...row2, ...fieldWrap }}>
              <div>
                <div style={labelStyle}>Viajes/Mes</div>
                <input style={inputStyle} type="number" placeholder="0" value={viajesMes} onChange={e => setViajesMes(e.target.value)} />
              </div>
              <div>
                <div style={labelStyle}>Tarifa</div>
                <input style={inputStyle} type="number" placeholder="0" value={tarifa} onChange={e => setTarifa(e.target.value)} />
              </div>
            </div>
            <div style={fieldWrap}>
              <div style={labelStyle}>Proyectado USD: ${proyectadoUsd ? Number(proyectadoUsd).toLocaleString() : '0'}</div>
              <input style={inputStyle} placeholder="$50k-$100k" value={proyectadoUsd} onChange={e => setProyectadoUsd(e.target.value)} />
            </div>
          </div>
          <div style={sectionNoBorder}>
            <div style={sectionTitle(tokens.colors.blue)}>
              <Zap size={14} /> HITOS DEL CLIENTE
            </div>
            <label style={checkRow}><input type="checkbox" checked={hitoN4} onChange={e => setHitoN4(e.target.checked)} /> N4 · Alta de Cliente</label>
            <label style={checkRow}><input type="checkbox" checked={hitoN5} onChange={e => setHitoN5(e.target.checked)} /> N5 · Generación SOP</label>
            <label style={checkRow}><input type="checkbox" checked={hitoN6} onChange={e => setHitoN6(e.target.checked)} /> N6 · Junta de Arranque</label>
            <label style={checkRow}><input type="checkbox" checked={hitoN7} onChange={e => setHitoN7(e.target.checked)} /> N7 · Facturado</label>
          </div>
        </div>
      </div>

      {/* ALERTS */}
      {dupWarning && (
        <div style={{ margin: '0 32px 12px', padding: '10px 14px', borderRadius: tokens.radius.md, background: tokens.colors.yellowBg, border: '1px solid rgba(245,158,11,0.2)', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <AlertCircle size={14} style={{ color: tokens.colors.yellow }} />
          <span style={{ fontSize: '12px', color: tokens.colors.yellow }}>Posible empresa duplicada en base de datos.</span>
        </div>
      )}
      {error && (
        <div style={{ margin: '0 32px 12px', padding: '10px 14px', borderRadius: tokens.radius.md, background: tokens.colors.redBg, border: '1px solid rgba(239,68,68,0.2)', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <AlertCircle size={14} style={{ color: tokens.colors.red }} />
          <span style={{ fontSize: '12px', color: tokens.colors.red }}>{error}</span>
        </div>
      )}
      {success && (
        <div style={{ margin: '0 32px 12px', padding: '10px 14px', borderRadius: tokens.radius.md, background: tokens.colors.greenBg, border: '1px solid rgba(16,185,129,0.2)', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <CheckCircle size={14} style={{ color: tokens.colors.green }} />
          <span style={{ fontSize: '12px', color: tokens.colors.green }}>Lead guardado correctamente.</span>
        </div>
      )}

      {/* FOOTER */}
      <div style={footer}>
        <span style={{ fontSize: '12px', color: tokens.colors.textMuted, fontFamily: tokens.fonts.body }}>
          Vendedor: <strong style={{ color: tokens.colors.textPrimary }}>{user?.nombre || user?.email || '—'}</strong> · {new Date().toLocaleDateString('es-MX')}
        </span>
        <button style={saveBtn} onClick={handleSave} disabled={saving || success}>
          <Save size={15} />
          {saving ? 'GUARDANDO...' : 'GUARDAR LEAD'}
        </button>
      </div>
    </ModuleLayout>
  )
}
