import type { ReactElement } from 'react'
import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { ArrowLeft, Globe, User, Phone, Mail, AlertCircle, CheckCircle, Building2, MapPin, Target, Zap, Save, DollarSign, TrendingUp, Truck, FileText } from 'lucide-react'
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
    } catch (e: any) {
      setError(e.message || 'Error al guardar')
    } finally { setSaving(false) }
  }

  /* ─── COMPACT STYLES ─── */
  const inputBase: React.CSSProperties = {
    width: '100%',
    padding: '6px 10px',
    fontSize: '12px',
    background: tokens.colors.bgHover,
    border: '1px solid ' + tokens.colors.border,
    borderRadius: tokens.radius.md,
    color: tokens.colors.textPrimary,
    outline: 'none',
    fontFamily: tokens.fonts.body,
    boxSizing: 'border-box' as const,
  }

  const labelBase: React.CSSProperties = {
    fontSize: '10px',
    fontWeight: 600,
    color: tokens.colors.textMuted,
    marginBottom: '2px',
    display: 'flex',
    alignItems: 'center',
    gap: '4px',
    fontFamily: tokens.fonts.body,
    textTransform: 'uppercase' as const,
    letterSpacing: '0.04em',
  }

  const sectionBox = (accent?: string): React.CSSProperties => ({
    background: tokens.colors.bgCard,
    borderRadius: tokens.radius.md,
    border: '1px solid ' + tokens.colors.border,
    borderLeft: accent ? '3px solid ' + accent : '1px solid ' + tokens.colors.border,
    padding: '10px 12px',
  })

  const sectionHead = (color: string): React.CSSProperties => ({
    fontSize: '10px',
    fontWeight: 700,
    textTransform: 'uppercase' as const,
    letterSpacing: '0.08em',
    color,
    marginBottom: '8px',
    fontFamily: tokens.fonts.heading,
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
  })

  const fw: React.CSSProperties = { marginBottom: '6px' }
  const row2: React.CSSProperties = { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }
  const row3: React.CSSProperties = { display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '6px' }

  const chip = (active: boolean): React.CSSProperties => ({
    padding: '5px 0',
    borderRadius: tokens.radius.sm,
    fontSize: '11px',
    fontWeight: 600,
    cursor: 'pointer',
    background: active ? tokens.colors.primary : tokens.colors.bgHover,
    color: active ? '#fff' : tokens.colors.textSecondary,
    border: '1px solid ' + (active ? tokens.colors.primary : tokens.colors.border),
    fontFamily: tokens.fonts.body,
    textAlign: 'center' as const,
    transition: 'all 0.12s ease',
  })

  const checkRow: React.CSSProperties = {
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
    fontSize: '11px',
    color: tokens.colors.textSecondary,
    cursor: 'pointer',
    fontFamily: tokens.fonts.body,
  }

  const prioBtn = (val: string, color: string): React.CSSProperties => ({
    padding: '4px 10px',
    borderRadius: tokens.radius.sm,
    fontSize: '10px',
    fontWeight: 600,
    cursor: 'pointer',
    background: prioridad === val ? color : tokens.colors.bgHover,
    color: prioridad === val ? '#fff' : tokens.colors.textSecondary,
    border: '1px solid ' + (prioridad === val ? color : tokens.colors.border),
    fontFamily: tokens.fonts.body,
  })

  const selectBase: React.CSSProperties = { ...inputBase, appearance: 'auto' as const }

  return (
    <ModuleLayout titulo="Agregar Lead">
      {/* MAIN CONTENT — fits viewport, no scroll */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: '1.1fr 0.9fr 1fr',
        gap: '12px',
        padding: '10px 16px',
        flex: 1,
        alignContent: 'start',
        overflow: 'hidden',
      }}>

        {/* ─── COL 1: EMPRESA ─── */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          <div style={sectionBox(tokens.colors.green)}>
            <div style={sectionHead(tokens.colors.green)}>
              <Building2 size={12} /> Empresa
            </div>
            <div style={fw}>
              <input
                style={{ ...inputBase, fontSize: '14px', fontWeight: 700, fontFamily: tokens.fonts.heading, textTransform: 'uppercase' }}
                placeholder="EMPRESA S.A. DE C.V."
                value={empresa}
                onChange={e => { setEmpresa(e.target.value); checkDuplicate(e.target.value) }}
              />
            </div>
            <div style={{ ...row2, ...fw }}>
              <div>
                <div style={labelBase}><Globe size={10} /> Web</div>
                <input style={inputBase} placeholder="www.empresa.com" value={web} onChange={e => setWeb(e.target.value)} />
              </div>
              <div>
                <div style={labelBase}><User size={10} /> Contacto</div>
                <input style={inputBase} placeholder="Juan Pérez" value={contacto} onChange={e => setContacto(e.target.value)} />
              </div>
            </div>
            <div style={{ ...row2, ...fw }}>
              <div>
                <div style={labelBase}><Phone size={10} /> Teléfono</div>
                <input style={inputBase} placeholder="55 1234 5678" value={telefono} onChange={e => setTelefono(e.target.value)} />
              </div>
              <div>
                <div style={labelBase}><Mail size={10} /> Email</div>
                <input style={inputBase} placeholder="mail@empresa.com" value={email} onChange={e => setEmail(e.target.value)} />
              </div>
            </div>
            <div style={fw}>
              <div style={labelBase}><Building2 size={10} /> Tipo de Empresa</div>
              <select style={selectBase} value={tipoEmpresa} onChange={e => setTipoEmpresa(e.target.value)}>
                {TIPO_EMPRESA_OPTS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
              </select>
            </div>
            <div style={{ ...row2, ...fw }}>
              <div>
                <div style={labelBase}>Ciudad</div>
                <input style={inputBase} placeholder="Monterrey" value={ciudad} onChange={e => setCiudad(e.target.value)} />
              </div>
              <div>
                <div style={labelBase}>Estado</div>
                <input style={inputBase} placeholder="Nuevo León" value={estadoMx} onChange={e => setEstadoMx(e.target.value)} />
              </div>
            </div>
            <div style={row3}>
              <div>
                <div style={labelBase}><Target size={10} /> Prioridad</div>
                <div style={{ display: 'flex', gap: '3px' }}>
                  {PRIORIDAD_OPTS.map(p => (
                    <button key={p.value} style={prioBtn(p.value, p.color)} onClick={() => setPrioridad(p.value)}>
                      {p.label}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <div style={labelBase}><Zap size={10} /> Tamaño</div>
                <select style={selectBase} value={tamano} onChange={e => setTamano(e.target.value)}>
                  {TAMANO_OPTS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
                </select>
              </div>
              <div>
                <div style={labelBase}>Cierre</div>
                <input style={inputBase} type="date" value={fechaCierre} onChange={e => setFechaCierre(e.target.value)} />
              </div>
            </div>
          </div>

          {dupWarning && (
            <div style={{ padding: '6px 10px', borderRadius: tokens.radius.sm, background: 'rgba(245,158,11,0.08)', border: '1px solid rgba(245,158,11,0.2)', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <AlertCircle size={12} style={{ color: tokens.colors.yellow }} />
              <span style={{ fontSize: '11px', color: tokens.colors.yellow }}>Posible empresa duplicada.</span>
            </div>
          )}
        </div>

        {/* ─── COL 2: SERVICIO + VIAJE + PRÓXIMOS PASOS ─── */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          <div style={sectionBox()}>
            <div style={sectionHead(tokens.colors.primary)}>
              <Truck size={12} /> Tipo de Servicio
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '6px' }}>
              {TIPO_SERVICIO.map(s => (
                <button key={s} style={chip(tipoServicio.includes(s))} onClick={() => toggleChip(tipoServicio, s, setTipoServicio)}>
                  {s}
                </button>
              ))}
            </div>
          </div>

          <div style={sectionBox()}>
            <div style={sectionHead(tokens.colors.green)}>
              <MapPin size={12} /> Tipo de Viaje
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '6px', marginBottom: '8px' }}>
              {TIPO_VIAJE.map(v => (
                <button key={v} style={chip(tipoViaje.includes(v))} onClick={() => toggleChip(tipoViaje, v, setTipoViaje)}>
                  {v}
                </button>
              ))}
            </div>
            <div style={{ display: 'flex', gap: '16px' }}>
              <label style={checkRow}>
                <input type="checkbox" checked={transbordo} onChange={e => setTransbordo(e.target.checked)} /> Transbordo
              </label>
              <label style={checkRow}>
                <input type="checkbox" checked={dtd} onChange={e => setDtd(e.target.checked)} /> DTD
              </label>
            </div>
          </div>

          <div style={{ ...sectionBox(), flex: 1, display: 'flex', flexDirection: 'column' }}>
            <div style={sectionHead(tokens.colors.orange)}>
              <FileText size={12} /> Próximos Pasos
            </div>
            <textarea
              style={{ ...inputBase, flex: 1, minHeight: '80px', resize: 'vertical' as const }}
              placeholder="Describe los próximos pasos..."
              value={proximosPasos}
              onChange={e => setProximosPasos(e.target.value)}
            />
          </div>
        </div>

        {/* ─── COL 3: FINANZAS + HITOS ─── */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          <div style={sectionBox(tokens.colors.orange)}>
            <div style={sectionHead(tokens.colors.orange)}>
              <DollarSign size={12} /> Finanzas
            </div>
            <div style={fw}>
              <div style={labelBase}><MapPin size={10} /> Ruta</div>
              <input style={inputBase} placeholder="CDMX - MTY - GDL" value={ruta} onChange={e => setRuta(e.target.value)} />
            </div>
            <div style={{ ...row2, ...fw }}>
              <div>
                <div style={labelBase}>Viajes/Mes</div>
                <input style={inputBase} type="number" placeholder="0" value={viajesMes} onChange={e => setViajesMes(e.target.value)} />
              </div>
              <div>
                <div style={labelBase}>Tarifa USD</div>
                <input style={inputBase} type="number" placeholder="0" value={tarifa} onChange={e => setTarifa(e.target.value)} />
              </div>
            </div>
            <div style={{ padding: '6px 10px', borderRadius: tokens.radius.sm, background: 'rgba(16,185,129,0.06)', border: '1px solid rgba(16,185,129,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <span style={{ fontSize: '10px', fontWeight: 600, color: tokens.colors.textMuted, textTransform: 'uppercase', letterSpacing: '0.04em' }}>Proyectado USD</span>
              <span style={{ fontSize: '16px', fontWeight: 700, color: tokens.colors.green, fontFamily: tokens.fonts.heading }}>
                ${proyectadoUsd ? Number(proyectadoUsd).toLocaleString() : '0'}
              </span>
            </div>
            <div style={{ marginTop: '6px' }}>
              <div style={labelBase}><TrendingUp size={10} /> Rango estimado</div>
              <input style={inputBase} placeholder="$50k-$100k" value={proyectadoUsd} onChange={e => setProyectadoUsd(e.target.value)} />
            </div>
          </div>

          <div style={sectionBox()}>
            <div style={sectionHead(tokens.colors.blue)}>
              <CheckCircle size={12} /> Hitos del Cliente
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
              <label style={checkRow}><input type="checkbox" checked={hitoN4} onChange={e => setHitoN4(e.target.checked)} /> N4 · Alta de Cliente</label>
              <label style={checkRow}><input type="checkbox" checked={hitoN5} onChange={e => setHitoN5(e.target.checked)} /> N5 · Generación SOP</label>
              <label style={checkRow}><input type="checkbox" checked={hitoN6} onChange={e => setHitoN6(e.target.checked)} /> N6 · Junta de Arranque</label>
              <label style={checkRow}><input type="checkbox" checked={hitoN7} onChange={e => setHitoN7(e.target.checked)} /> N7 · Facturado</label>
            </div>
          </div>
        </div>
      </div>

      {/* ALERTS */}
      {error && (
        <div style={{ margin: '0 16px 6px', padding: '6px 10px', borderRadius: tokens.radius.sm, background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)', display: 'flex', alignItems: 'center', gap: '6px' }}>
          <AlertCircle size={12} style={{ color: tokens.colors.red }} />
          <span style={{ fontSize: '11px', color: tokens.colors.red }}>{error}</span>
        </div>
      )}
      {success && (
        <div style={{ margin: '0 16px 6px', padding: '6px 10px', borderRadius: tokens.radius.sm, background: 'rgba(16,185,129,0.08)', border: '1px solid rgba(16,185,129,0.2)', display: 'flex', alignItems: 'center', gap: '6px' }}>
          <CheckCircle size={12} style={{ color: tokens.colors.green }} />
          <span style={{ fontSize: '11px', color: tokens.colors.green }}>Lead guardado correctamente.</span>
        </div>
      )}

      {/* FOOTER */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '8px 16px',
        borderTop: '1px solid ' + tokens.colors.border,
        background: tokens.colors.bgCard,
        flexShrink: 0,
      }}>
        <span style={{ fontSize: '11px', color: tokens.colors.textMuted, fontFamily: tokens.fonts.body }}>
          Vendedor: <strong style={{ color: tokens.colors.textPrimary }}>{user?.nombre || user?.email || '\u2014'}</strong> · {new Date().toLocaleDateString('es-MX')}
        </span>
        <button
          style={{
            padding: '8px 24px',
            borderRadius: tokens.radius.md,
            cursor: 'pointer',
            background: tokens.colors.primary,
            color: '#fff',
            border: 'none',
            fontSize: '12px',
            fontWeight: 700,
            fontFamily: tokens.fonts.heading,
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            boxShadow: tokens.effects.glowPrimary,
            letterSpacing: '0.04em',
            textTransform: 'uppercase' as const,
            opacity: saving || success ? 0.6 : 1,
            transition: 'all 0.15s',
          }}
          onClick={handleSave}
          disabled={saving || success}
        >
          <Save size={14} />
          {saving ? 'GUARDANDO...' : 'GUARDAR LEAD'}
        </button>
      </div>
    </ModuleLayout>
  )
}
