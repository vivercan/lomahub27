import type { ReactElement } from 'react'
import { useState, useEffect } from 'react'
import { X, AlertCircle, CheckCircle } from 'lucide-react'
import { tokens } from '../../lib/tokens'
import { supabase } from '../../lib/supabase'
import { useAuthContext } from '../../hooks/AuthContext'

const toUpperCaseVal = (v: string) => v.toUpperCase()
const toTitleCase = (v: string) =>
  v.toLowerCase().replace(/(^|\s)\S/g, (c) => c.toUpperCase())

const TIPO_SERVICIO = ['Seco', 'Refrigerado', 'Seco Hazmat', 'Refri Hazmat']
const TIPO_VIAJE = ['Impo', 'Expo', 'Nacional', 'Dedicado']

interface AddLeadModalProps {
  open: boolean
  onClose: () => void
  onSaved: () => void
}

const initialForm = {
  empresa: '', web: '', contacto: '', telefono: '', email: '',
  tipoEmpresa: '', ciudad: '', estado_mx: '', prioridad: '', tamano: '',
  tipoServicio: [] as string[], tipoViaje: [] as string[],
  transbordo: false, dtd: false,
  ruta: '', viajesMes: '', tarifa: '', proyectadoUsd: '',
  fuente: '', proximosPasos: '', notas: '',
}

export default function AddLeadModal({ open, onClose, onSaved }: AddLeadModalProps): ReactElement | null {
  const { user } = useAuthContext()
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)
  const [duplicates, setDuplicates] = useState<string[]>([])
  const [form, setForm] = useState({ ...initialForm })

  useEffect(() => {
    if (open) {
      setForm({ ...initialForm, tipoServicio: [], tipoViaje: [] })
      setError(null)
      setSuccess(false)
      setDuplicates([])
    }
  }, [open])

  const set = (field: string, value: unknown) => {
    setForm((p) => ({ ...p, [field]: value }))
    setError(null)
  }

  const toggleChip = (field: 'tipoServicio' | 'tipoViaje', value: string) => {
    setForm((p) => {
      const arr = p[field]
      return { ...p, [field]: arr.includes(value) ? arr.filter((v) => v !== value) : [...arr, value] }
    })
  }

  // Duplicate check
  useEffect(() => {
    if (!open || form.empresa.length < 3) { setDuplicates([]); return }
    const t = setTimeout(async () => {
      try {
        const term = `%${form.empresa}%`
        const [leadsRes, clientesRes] = await Promise.all([
          supabase.from('leads').select('empresa').ilike('empresa', term).limit(5),
          supabase.from('sc_contactos_clientes').select('nombre_cliente').ilike('nombre_cliente', term).limit(5),
        ])
        const found: string[] = []
        leadsRes.data?.forEach((l: Record<string, string>) => found.push('Lead: ' + l.empresa))
        clientesRes.data?.forEach((c: Record<string, string>) => found.push('Cliente: ' + c.nombre_cliente))
        setDuplicates(found)
      } catch { setDuplicates([]) }
    }, 400)
    return () => clearTimeout(t)
  }, [form.empresa, open])

  const handleSave = async () => {
    if (!form.empresa.trim()) { setError('El nombre de la empresa es obligatorio'); return }
    setSaving(true)
    setError(null)
    try {
      const { error: insertError } = await supabase.from('leads').insert([{
        empresa: form.empresa.trim(),
        contacto: form.contacto.trim(),
        telefono: form.telefono.trim(),
        email: form.email.trim(),
        ciudad: form.ciudad.trim(),
        ruta_interes: form.ruta.trim(),
        tipo_carga: form.tipoServicio.join(', '),
        tipo_viaje: form.tipoViaje.join(', '),
        fuente: form.fuente || 'Manual',
        notas: form.notas.trim(),
        estado: 'Nuevo',
        probabilidad: 10,
        ejecutivo_nombre: user?.email || 'Sin asignar',
        web: form.web.trim(),
        tipo_empresa: form.tipoEmpresa,
        estado_mx: form.estado_mx.trim(),
        prioridad: form.prioridad,
        tamano: form.tamano,
        transbordo: form.transbordo,
        dtd: form.dtd,
        proximos_pasos: form.proximosPasos.trim(),
        viajes_mes: form.viajesMes ? parseInt(form.viajesMes) : null,
        tarifa: form.tarifa ? parseFloat(form.tarifa) : null,
        proyectado_usd: form.proyectadoUsd ? parseFloat(form.proyectadoUsd) : null,
        valor_estimado: form.proyectadoUsd ? parseFloat(form.proyectadoUsd) : 0,
      }])
      if (insertError) throw insertError
      setSuccess(true)
      setTimeout(() => { onSaved(); onClose() }, 600)
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Error al guardar'
      setError(msg)
    } finally { setSaving(false) }
  }

  if (!open) return null

  const overlayStyle: React.CSSProperties = {
    position: 'fixed', inset: 0, zIndex: 50,
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    background: 'rgba(11, 18, 32, 0.82)',
    backdropFilter: 'blur(4px)',
  }

  const modalStyle: React.CSSProperties = {
    width: '70%', maxWidth: '1100px', maxHeight: '90vh',
    background: tokens.colors.bgCard,
    border: '1px solid ' + tokens.colors.border,
    borderRadius: tokens.radius.xl,
    boxShadow: tokens.effects.cardShadow,
    display: 'flex', flexDirection: 'column',
    overflow: 'hidden',
  }

  const headerStyle: React.CSSProperties = {
    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
    padding: '20px 28px',
    borderBottom: '1px solid ' + tokens.colors.border,
  }

  const bodyStyle: React.CSSProperties = {
    padding: '24px 28px',
    overflowY: 'auto', flex: 1,
  }

  const footerStyle: React.CSSProperties = {
    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
    padding: '16px 28px',
    borderTop: '1px solid ' + tokens.colors.border,
  }

  const sectionTitleStyle: React.CSSProperties = {
    fontSize: '10px', fontWeight: 700, letterSpacing: '0.1em',
    textTransform: 'uppercase' as const,
    color: tokens.colors.orange, fontFamily: tokens.fonts.heading,
    marginBottom: '14px', marginTop: '20px',
  }

  const labelStyle: React.CSSProperties = {
    display: 'block', fontSize: '12px', fontWeight: 500,
    color: tokens.colors.textSecondary, fontFamily: tokens.fonts.body,
    marginBottom: '4px',
  }

  const inputStyle: React.CSSProperties = {
    width: '100%', padding: '8px 12px', fontSize: '13px',
    background: tokens.colors.bgHover,
    border: '1px solid ' + tokens.colors.border,
    borderRadius: tokens.radius.md,
    color: tokens.colors.textPrimary, fontFamily: tokens.fonts.body,
    outline: 'none',
  }

  const selectStyle: React.CSSProperties = { ...inputStyle }

  const textareaStyle: React.CSSProperties = {
    ...inputStyle, resize: 'none' as const, minHeight: '68px',
  }

  const gridRow2 = { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' } as React.CSSProperties
  const fieldGap = { marginBottom: '10px' } as React.CSSProperties

  const chipStyle = (active: boolean): React.CSSProperties => ({
    padding: '6px 14px', borderRadius: tokens.radius.full,
    fontSize: '12px', fontWeight: 500, cursor: 'pointer',
    background: active
      ? `linear-gradient(180deg, #4A7AF0 0%, ${tokens.colors.primary} 100%)`
      : 'linear-gradient(180deg, #FFFFFF 0%, #F3F4F6 100%)',
    color: active ? '#fff' : tokens.colors.textSecondary,
    border: '1px solid ' + (active ? tokens.colors.primary : tokens.colors.border),
    transition: 'all 0.18s ease',
    fontFamily: tokens.fonts.body,
    boxShadow: active
      ? '0 2px 4px rgba(59,108,231,0.25), inset 0 1px 0 rgba(255,255,255,0.25), inset 0 -1px 0 rgba(0,0,0,0.15)'
      : '0 1px 2px rgba(0,0,0,0.08), inset 0 1px 0 rgba(255,255,255,0.80), inset 0 -1px 0 rgba(0,0,0,0.04)',
    textShadow: active ? '0 1px 1px rgba(0,0,0,0.18)' : 'none',
  })

  const btnBase: React.CSSProperties = {
    padding: '10px 24px', borderRadius: tokens.radius.md,
    fontSize: '13px', fontWeight: 600, cursor: 'pointer',
    fontFamily: tokens.fonts.body, transition: 'all 0.18s ease',
    display: 'inline-flex', alignItems: 'center', gap: '8px',
  }

  return (
    <div style={overlayStyle} onClick={(e) => { if (e.target === e.currentTarget) onClose() }}>
      <div style={modalStyle}>
        {/* HEADER */}
        <div style={headerStyle}>
          <h2 style={{ margin: 0, fontSize: '18px', fontWeight: 700, color: tokens.colors.textPrimary, fontFamily: tokens.fonts.heading }}>
            Añadir Lead
          </h2>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '4px', color: tokens.colors.textMuted }}>
            <X size={20} />
          </button>
        </div>

        {/* BODY */}
        <div style={bodyStyle}>
          {/* SECCIÓN A — EMPRESA */}
          <div style={{ ...sectionTitleStyle, marginTop: 0 }}>A — Datos de la Empresa</div>

          <div style={fieldGap}>
            <label style={labelStyle}>Empresa *</label>
            <input style={inputStyle} placeholder="NOMBRE DE LA EMPRESA"
              value={form.empresa}
              onChange={(e) => set('empresa', toUpperCaseVal(e.target.value))} />
          </div>

          <div style={{ ...gridRow2, ...fieldGap }}>
            <div>
              <label style={labelStyle}>Sitio Web</label>
              <input style={inputStyle} placeholder="www.empresa.com"
                value={form.web} onChange={(e) => set('web', e.target.value)} />
            </div>
            <div>
              <label style={labelStyle}>Tipo de Empresa</label>
              <select style={selectStyle} value={form.tipoEmpresa}
                onChange={(e) => set('tipoEmpresa', e.target.value)}>
                <option value="">Seleccionar...</option>
                <option value="fabricante">Fabricante</option>
                <option value="distribuidor">Distribuidor</option>
                <option value="maquiladora">Maquiladora</option>
                <option value="comercializadora">Comercializadora</option>
                <option value="broker">Broker Logístico</option>
                <option value="otro">Otro</option>
              </select>
            </div>
          </div>

          <div style={{ ...gridRow2, ...fieldGap }}>
            <div>
              <label style={labelStyle}>Ciudad</label>
              <input style={inputStyle} placeholder="Ciudad"
                value={form.ciudad} onChange={(e) => set('ciudad', e.target.value)} />
            </div>
            <div>
              <label style={labelStyle}>Estado</label>
              <input style={inputStyle} placeholder="Estado"
                value={form.estado_mx} onChange={(e) => set('estado_mx', e.target.value)} />
            </div>
          </div>

          <div style={{ ...gridRow2, ...fieldGap }}>
            <div>
              <label style={labelStyle}>Prioridad</label>
              <select style={selectStyle} value={form.prioridad}
                onChange={(e) => set('prioridad', e.target.value)}>
                <option value="">Seleccionar...</option>
                <option value="alta">Alta</option>
                <option value="media">Media</option>
                <option value="baja">Baja</option>
              </select>
            </div>
            <div>
              <label style={labelStyle}>Tamaño</label>
              <select style={selectStyle} value={form.tamano}
                onChange={(e) => set('tamano', e.target.value)}>
                <option value="">Seleccionar...</option>
                <option value="grande">Grande (50+ viajes/mes)</option>
                <option value="mediana">Mediana (10-49 viajes/mes)</option>
                <option value="chica">Chica (1-9 viajes/mes)</option>
              </select>
            </div>
          </div>

          {/* Tipo Servicio — Toggle Chips */}
          <div style={fieldGap}>
            <label style={labelStyle}>Tipo de Servicio</label>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
              {TIPO_SERVICIO.map((ts) => (
                <button key={ts} type="button" style={chipStyle(form.tipoServicio.includes(ts))}
                  onClick={() => toggleChip('tipoServicio', ts)}>{ts}</button>
              ))}
            </div>
          </div>

          {/* Tipo Viaje — Toggle Chips */}
          <div style={fieldGap}>
            <label style={labelStyle}>Tipo de Viaje</label>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
              {TIPO_VIAJE.map((tv) => (
                <button key={tv} type="button" style={chipStyle(form.tipoViaje.includes(tv))}
                  onClick={() => toggleChip('tipoViaje', tv)}>{tv}</button>
              ))}
            </div>
          </div>

          {/* Checkboxes */}
          <div style={{ display: 'flex', gap: '24px', marginBottom: '10px' }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '12px', color: tokens.colors.textSecondary, cursor: 'pointer' }}>
              <input type="checkbox" checked={form.transbordo}
                onChange={(e) => set('transbordo', e.target.checked)}
                style={{ accentColor: tokens.colors.primary }} />
              Transbordo
            </label>
            <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '12px', color: tokens.colors.textSecondary, cursor: 'pointer' }}>
              <input type="checkbox" checked={form.dtd}
                onChange={(e) => set('dtd', e.target.checked)}
                style={{ accentColor: tokens.colors.primary }} />
              Door-to-Door
            </label>
          </div>

          <div style={fieldGap}>
            <label style={labelStyle}>Ruta Principal</label>
            <input style={inputStyle} placeholder="CDMX — MTY — LRD"
              value={form.ruta} onChange={(e) => set('ruta', e.target.value)} />
          </div>

          <div style={{ ...gridRow2, ...fieldGap }}>
            <div>
              <label style={labelStyle}>Viajes / Mes</label>
              <input style={inputStyle} type="number" placeholder="0"
                value={form.viajesMes} onChange={(e) => set('viajesMes', e.target.value)} />
            </div>
            <div>
              <label style={labelStyle}>Tarifa (USD)</label>
              <input style={inputStyle} type="number" placeholder="0.00"
                value={form.tarifa} onChange={(e) => set('tarifa', e.target.value)} />
            </div>
          </div>

          <div style={fieldGap}>
            <label style={labelStyle}>Potencial Mensual (USD)</label>
            <input style={inputStyle} type="number" placeholder="0.00"
              value={form.proyectadoUsd} onChange={(e) => set('proyectadoUsd', e.target.value)} />
          </div>

          {form.viajesMes && form.tarifa && (
            <div style={{
              padding: '10px 14px', borderRadius: tokens.radius.md,
              background: tokens.colors.blueBg, border: '1px solid rgba(59,130,246,0.2)',
              marginBottom: '10px',
            }}>
              <span style={{ fontSize: '12px', color: tokens.colors.textSecondary }}>Cálculo: </span>
              <span style={{ fontSize: '15px', fontWeight: 700, color: tokens.colors.blue, fontFamily: tokens.fonts.heading }}>
                ${(parseFloat(form.viajesMes) * parseFloat(form.tarifa)).toLocaleString('en-US', { minimumFractionDigits: 2 })} USD/mes
              </span>
            </div>
          )}

          {/* SECCIÓN B — CONTACTO */}
          <div style={sectionTitleStyle}>B — Datos de Contacto</div>

          <div style={{ ...gridRow2, ...fieldGap }}>
            <div>
              <label style={labelStyle}>Nombre Contacto</label>
              <input style={inputStyle} placeholder="Nombre Del Contacto"
                value={form.contacto}
                onChange={(e) => set('contacto', toTitleCase(e.target.value))} />
            </div>
            <div>
              <label style={labelStyle}>Teléfono</label>
              <input style={inputStyle} type="tel" placeholder="+52 ..."
                value={form.telefono} onChange={(e) => set('telefono', e.target.value)} />
            </div>
          </div>

          <div style={fieldGap}>
            <label style={labelStyle}>Email</label>
            <input style={inputStyle} type="email" placeholder="email@empresa.com"
              value={form.email} onChange={(e) => set('email', e.target.value)} />
          </div>

          {/* SECCIÓN C — ASIGNACIÓN */}
          <div style={sectionTitleStyle}>C — Asignación Interna</div>

          <div style={{ ...gridRow2, ...fieldGap }}>
            <div>
              <label style={labelStyle}>Fuente</label>
              <select style={selectStyle} value={form.fuente}
                onChange={(e) => set('fuente', e.target.value)}>
                <option value="">Seleccionar...</option>
                <option value="referencia">Referencia</option>
                <option value="llamada">Llamada Entrante</option>
                <option value="web">Sitio Web</option>
                <option value="feria">Feria / Evento</option>
                <option value="prospeccion">Prospección Directa</option>
                <option value="otro">Otro</option>
              </select>
            </div>
            <div>
              <label style={labelStyle}>Responsable</label>
              <input style={{ ...inputStyle, opacity: 0.7 }} readOnly
                value={user?.email || 'Sin asignar'} />
            </div>
          </div>

          <div style={fieldGap}>
            <label style={labelStyle}>Próximos Pasos</label>
            <textarea style={textareaStyle} placeholder="Acciones a tomar con este prospecto..."
              value={form.proximosPasos} onChange={(e) => set('proximosPasos', e.target.value)} />
          </div>

          <div style={fieldGap}>
            <label style={labelStyle}>Notas</label>
            <textarea style={textareaStyle} placeholder="Notas internas..."
              value={form.notas} onChange={(e) => set('notas', e.target.value)} />
          </div>

          {/* Duplicate warning */}
          {duplicates.length > 0 && (
            <div style={{
              padding: '10px 14px', borderRadius: tokens.radius.md,
              background: tokens.colors.yellowBg, border: '1px solid rgba(245,158,11,0.2)',
              marginBottom: '10px',
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '4px' }}>
                <AlertCircle size={14} style={{ color: tokens.colors.yellow }} />
                <span style={{ fontSize: '12px', fontWeight: 700, color: tokens.colors.yellow }}>Posibles duplicados</span>
              </div>
              {duplicates.map((d, i) => (
                <div key={i} style={{ fontSize: '11px', color: tokens.colors.textSecondary, marginLeft: '20px' }}>{d}</div>
              ))}
            </div>
          )}

          {/* Error */}
          {error && (
            <div style={{
              padding: '10px 14px', borderRadius: tokens.radius.md,
              background: tokens.colors.redBg, border: '1px solid rgba(239,68,68,0.2)',
              display: 'flex', alignItems: 'center', gap: '8px',
           }}>
              <AlertCircle size={14} style={{ color: tokens.colors.red }} />
              <span style={{ fontSize: '12px', color: tokens.colors.red }}>{error}</span>
            </div>
          )}

          {/* Success */}
          {success && (
            <div style={{
              padding: '10px 14px', borderRadius: tokens.radius.md,
              background: tokens.colors.greenBg, border: '1px solid rgba(16,185,129,0.2)',
              display: 'flex', alignItems: 'center', gap: '8px',
            }}>
              <CheckCircle size={14} style={{ color: tokens.colors.green }} />
              <span style={{ fontSize: '12px', color: tokens.colors.green }}>Lead guardado correctamente.</span>
            </div>
          )}
        </div>

        {/* FOOTER */}
        <div style={footerStyle}>
          <span style={{ fontSize: '11px', color: tokens.colors.textMuted }}>
            Vendedor: {user?.email || '—'} · {new Date().toLocaleDateString('es-MX')}
          </span>
          <div style={{ display: 'flex', gap: '10px' }}>
            <button style={{ ...btnBase, background: 'linear-gradient(180deg, #FFFFFF 0%, #F3F4F6 100%)', color: tokens.colors.textSecondary, border: '1px solid ' + tokens.colors.border, boxShadow: '0 1px 3px rgba(0,0,0,0.10), inset 0 1px 0 rgba(255,255,255,0.80), inset 0 -1px 0 rgba(0,0,0,0.05)' }}
              onClick={onClose} disabled={saving} type="button">
              Cancelar
            </button>
            <button style={{
              ...btnBase,
              background: `linear-gradient(180deg, #4A7AF0 0%, ${tokens.colors.primary} 50%, #2F5BC4 100%)`, color: '#fff', border: 'none',
              boxShadow: '0 2px 4px rgba(59,108,231,0.30), 0 6px 14px -3px rgba(59,108,231,0.25), inset 0 1px 0 rgba(255,255,255,0.28), inset 0 -1px 0 rgba(0,0,0,0.18)',
              textShadow: '0 1px 2px rgba(0,0,0,0.20)',
              opacity: saving || success ? 0.6 : 1,
            }}
              onClick={handleSave} disabled={saving || success} type="button">
              {saving ? 'Guardando...' : 'Guardar Lead'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
