import type { ReactElement } from 'react'
import { useState, useEffect } from 'react'
import { Plus, Search, Building2, User, Phone, Mail, MapPin, X, CheckCircle, AlertCircle, Clock, FileText, ChevronRight } from 'lucide-react'
import { ModuleLayout } from '../../components/layout/ModuleLayout'
import { tokens } from '../../lib/tokens'
import { supabase } from '../../lib/supabase'
import { useAuthContext } from '../../hooks/AuthContext'
import { useNavigate } from 'react-router-dom'

interface Solicitud {
  id: string
  razon_social: string
  rfc: string
  tipo: string
  contacto_nombre: string
  telefono: string
  email: string
  ciudad: string
  estado_mx: string
  created_at: string
  ejecutivo_nombre?: string
}

const TIPO_OPTIONS = [
  { value: 'prospecto', label: 'Prospecto' },
  { value: 'activo', label: 'Activo' },
  { value: 'corporativo', label: 'Corporativo' },
  { value: 'estrategico', label: 'Estrategico' },
]

export default function AltaCliente(): ReactElement {
  const { user } = useAuthContext()
  const navigate = useNavigate()

  // List state
  const [solicitudes, setSolicitudes] = useState<Solicitud[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')

  // Modal state
  const [showModal, setShowModal] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)

  // Form fields
  const [razonSocial, setRazonSocial] = useState('')
  const [rfc, setRfc] = useState('')
  const [tipo, setTipo] = useState('prospecto')
  const [contactoNombre, setContactoNombre] = useState('')
  const [telefono, setTelefono] = useState('')
  const [email, setEmail] = useState('')
  const [ciudad, setCiudad] = useState('')
  const [estadoMx, setEstadoMx] = useState('')

  // Fetch solicitudes (clientes tipo prospecto, ordered by recent)
  useEffect(() => {
    const fetch = async () => {
      setLoading(true)
      const { data } = await supabase
        .from('clientes')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(200)
      setSolicitudes((data || []).map((c: any) => ({
        id: c.id,
        razon_social: c.razon_social || '',
        rfc: c.rfc || '',
        tipo: c.tipo || 'prospecto',
        contacto_nombre: c.contacto_nombre || '',
        telefono: c.telefono || '',
        email: c.email || '',
        ciudad: c.ciudad || '',
        estado_mx: c.estado_mx || '',
        created_at: c.created_at || '',
        ejecutivo_nombre: c.ejecutivo_nombre || '',
      })))
      setLoading(false)
    }
    fetch()
  }, [success])

  const handleSave = async () => {
    if (!razonSocial.trim()) { setError('Razon social es requerida'); return }
    setSaving(true)
    setError('')
    const { error: err } = await supabase.from('clientes').insert({
      razon_social: razonSocial.trim(),
      rfc: rfc.trim().toUpperCase(),
      tipo,
      contacto_nombre: contactoNombre.trim(),
      telefono: telefono.trim(),
      email: email.trim(),
      ciudad: ciudad.trim(),
      estado_mx: estadoMx.trim(),
    })
    setSaving(false)
    if (err) { setError(err.message); return }
    setSuccess(true)
    setTimeout(() => {
      setShowModal(false)
      setSuccess(false)
      resetForm()
    }, 1200)
  }

  const resetForm = () => {
    setRazonSocial(''); setRfc(''); setTipo('prospecto')
    setContactoNombre(''); setTelefono(''); setEmail('')
    setCiudad(''); setEstadoMx(''); setError('')
  }

  const filtered = solicitudes.filter(s => {
    if (!search) return true
    const q = search.toLowerCase()
    return s.razon_social.toLowerCase().includes(q) || s.rfc.toLowerCase().includes(q) || s.contacto_nombre.toLowerCase().includes(q) || s.email.toLowerCase().includes(q)
  })

  const tipoBadge = (t: string) => {
    const map: Record<string, string> = { prospecto: tokens.colors.yellow, activo: tokens.colors.green, corporativo: tokens.colors.primary, estrategico: tokens.colors.blue, bloqueado: tokens.colors.red }
    const color = map[t] || tokens.colors.textMuted
    return { display: 'inline-block', padding: '2px 10px', borderRadius: tokens.radius.full, fontSize: '11px', fontWeight: 600, color: '#fff', background: color } as React.CSSProperties
  }

  const formatDate = (d: string) => {
    if (!d) return '—'
    return new Date(d).toLocaleDateString('es-MX', { day: '2-digit', month: 'short', year: 'numeric' })
  }

  // ── Styles ──
  const ps = {
    section: { background: tokens.colors.bgCard, borderRadius: tokens.radius.lg, border: '1px solid ' + tokens.colors.border, boxShadow: tokens.effects.cardShadow } as React.CSSProperties,
    input: { width: '100%', padding: '9px 12px', fontSize: '13px', background: tokens.colors.bgMain, border: '1px solid ' + tokens.colors.border, borderRadius: tokens.radius.md, color: tokens.colors.textPrimary, fontFamily: tokens.fonts.body, outline: 'none', boxShadow: 'inset 0 1px 3px rgba(0,0,0,0.2)', transition: 'border-color 0.15s' } as React.CSSProperties,
    select: { width: '100%', padding: '9px 12px', fontSize: '13px', background: tokens.colors.bgMain, border: '1px solid ' + tokens.colors.border, borderRadius: tokens.radius.md, color: tokens.colors.textPrimary, fontFamily: tokens.fonts.body, outline: 'none', boxShadow: 'inset 0 1px 3px rgba(0,0,0,0.2)', appearance: 'none' as const } as React.CSSProperties,
    label: { display: 'block', fontSize: '11px', fontWeight: 600, color: tokens.colors.textSecondary, marginBottom: '4px', textTransform: 'uppercase' as const, letterSpacing: '0.5px' } as React.CSSProperties,
    row: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' } as React.CSSProperties,
    th: { padding: '10px 14px', fontSize: '11px', fontWeight: 700, color: tokens.colors.textMuted, textTransform: 'uppercase' as const, letterSpacing: '0.5px', textAlign: 'left' as const, borderBottom: '1px solid ' + tokens.colors.border, fontFamily: tokens.fonts.heading } as React.CSSProperties,
    td: { padding: '10px 14px', fontSize: '13px', color: tokens.colors.textPrimary, borderBottom: '1px solid ' + tokens.colors.border } as React.CSSProperties,
    tdMuted: { padding: '10px 14px', fontSize: '12px', color: tokens.colors.textSecondary, borderBottom: '1px solid ' + tokens.colors.border } as React.CSSProperties,
  }

  return (
    <ModuleLayout titulo="Alta de Cliente" moduloPadre={{ nombre: 'Comercial', ruta: '/ventas' }}>
      <div style={{ padding: '8px 16px', height: 'calc(100vh - 140px)', display: 'flex', flexDirection: 'column', gap: '12px', overflow: 'hidden' }}>

        {/* ── TOOLBAR ── */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{ position: 'relative' }}>
              <Search size={14} style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: tokens.colors.textMuted }} />
              <input
                style={{ ...ps.input, paddingLeft: '32px', width: '280px' }}
                placeholder="Buscar por razon social, RFC, contacto..."
                value={search}
                onChange={e => setSearch(e.target.value)}
              />
            </div>
            <span style={{ fontSize: '12px', color: tokens.colors.textMuted }}>{filtered.length} clientes</span>
          </div>
          <button onClick={() => { resetForm(); setShowModal(true) }} style={{
            display: 'flex', alignItems: 'center', gap: '6px', padding: '8px 16px',
            fontSize: '13px', fontWeight: 600, color: '#fff', background: tokens.colors.primary,
            border: 'none', borderRadius: tokens.radius.md, cursor: 'pointer',
            fontFamily: tokens.fonts.heading, boxShadow: tokens.effects.glowPrimary,
          }}>
            <Plus size={14} /> Nueva Solicitud
          </button>
        </div>

        {/* ── TABLE ── */}
        <div style={{ ...ps.section, flex: 1, overflow: 'auto', scrollbarWidth: 'none' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ position: 'sticky', top: 0, background: tokens.colors.bgCard, zIndex: 1 }}>
                <th style={ps.th}>RAZON SOCIAL</th>
                <th style={ps.th}>RFC</th>
                <th style={ps.th}>TIPO</th>
                <th style={ps.th}>CONTACTO</th>
                <th style={ps.th}>EMAIL</th>
                <th style={ps.th}>CIUDAD</th>
                <th style={ps.th}>FECHA ALTA</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={7} style={{ ...ps.td, textAlign: 'center', color: tokens.colors.textMuted, padding: '40px' }}>Cargando...</td></tr>
              ) : filtered.length === 0 ? (
                <tr><td colSpan={7} style={{ ...ps.td, textAlign: 'center', color: tokens.colors.textMuted, padding: '40px' }}>Sin resultados</td></tr>
              ) : filtered.map(s => (
                <tr key={s.id} style={{ cursor: 'pointer', transition: 'background 0.1s' }}
                  onMouseEnter={e => (e.currentTarget.style.background = tokens.colors.bgHover)}
                  onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
                  onClick={() => navigate('/clientes/' + s.id)}>
                  <td style={{ ...ps.td, fontWeight: 600 }}>{s.razon_social || '—'}</td>
                  <td style={ps.tdMuted}>{s.rfc || '—'}</td>
                  <td style={ps.td}><span style={tipoBadge(s.tipo)}>{s.tipo}</span></td>
                  <td style={ps.td}>{s.contacto_nombre || '—'}</td>
                  <td style={ps.tdMuted}>{s.email || '—'}</td>
                  <td style={ps.tdMuted}>{s.ciudad ? s.ciudad + (s.estado_mx ? ', ' + s.estado_mx : '') : '—'}</td>
                  <td style={ps.tdMuted}>{formatDate(s.created_at)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* ── MODAL: Nueva Solicitud ── */}
      {showModal && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)' }}
          onClick={() => setShowModal(false)}>
          <div style={{ width: '520px', maxHeight: '85vh', background: tokens.colors.bgCard, borderRadius: tokens.radius.lg, border: '1px solid ' + tokens.colors.border, boxShadow: '0 24px 64px rgba(0,0,0,0.4)', overflow: 'auto', scrollbarWidth: 'none' }}
            onClick={e => e.stopPropagation()}>

            {/* Header */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px 20px', borderBottom: '1px solid ' + tokens.colors.border }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <Building2 size={18} style={{ color: tokens.colors.primary }} />
                <span style={{ fontSize: '15px', fontWeight: 700, color: tokens.colors.textPrimary, fontFamily: tokens.fonts.heading }}>Nueva Solicitud de Alta</span>
              </div>
              <button onClick={() => setShowModal(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: tokens.colors.textMuted, padding: '4px' }}>
                <X size={18} />
              </button>
            </div>

            {/* Form */}
            <div style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '14px' }}>
              {/* Empresa */}
              <div>
                <label style={ps.label}>Razon Social *</label>
                <input style={ps.input} value={razonSocial} onChange={e => setRazonSocial(e.target.value)} placeholder="Ej: Grupo Industrial del Norte SA de CV"
                  onFocus={e => { e.target.style.borderColor = tokens.colors.primary }}
                  onBlur={e => { e.target.style.borderColor = tokens.colors.border }} />
              </div>

              <div style={ps.row}>
                <div>
                  <label style={ps.label}>RFC</label>
                  <input style={ps.input} value={rfc} onChange={e => setRfc(e.target.value)} placeholder="XAXX010101000" maxLength={13} />
                </div>
                <div>
                  <label style={ps.label}>Tipo</label>
                  <select style={ps.select} value={tipo} onChange={e => setTipo(e.target.value)}>
                    {TIPO_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
                  </select>
                </div>
              </div>

              {/* Contacto */}
              <div style={{ borderTop: '1px solid ' + tokens.colors.border, paddingTop: '14px', display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '-4px' }}>
                <User size={14} style={{ color: tokens.colors.primary }} />
                <span style={{ fontSize: '12px', fontWeight: 700, color: tokens.colors.textSecondary, fontFamily: tokens.fonts.heading }}>CONTACTO PRINCIPAL</span>
              </div>
              <div>
                <label style={ps.label}>Nombre del contacto</label>
                <input style={ps.input} value={contactoNombre} onChange={e => setContactoNombre(e.target.value)} placeholder="Nombre completo" />
              </div>
              <div style={ps.row}>
                <div>
                  <label style={ps.label}>Telefono</label>
                  <input style={ps.input} value={telefono} onChange={e => setTelefono(e.target.value)} placeholder="+52 81 1234 5678" />
                </div>
                <div>
                  <label style={ps.label}>Email</label>
                  <input style={ps.input} value={email} onChange={e => setEmail(e.target.value)} placeholder="correo@empresa.com" />
                </div>
              </div>

              {/* Ubicacion */}
              <div style={{ borderTop: '1px solid ' + tokens.colors.border, paddingTop: '14px', display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '-4px' }}>
                <MapPin size={14} style={{ color: tokens.colors.primary }} />
                <span style={{ fontSize: '12px', fontWeight: 700, color: tokens.colors.textSecondary, fontFamily: tokens.fonts.heading }}>UBICACION</span>
              </div>
              <div style={ps.row}>
                <div>
                  <label style={ps.label}>Ciudad</label>
                  <input style={ps.input} value={ciudad} onChange={e => setCiudad(e.target.value)} placeholder="Ciudad" />
                </div>
                <div>
                  <label style={ps.label}>Estado</label>
                  <input style={ps.input} value={estadoMx} onChange={e => setEstadoMx(e.target.value)} placeholder="Estado" />
                </div>
              </div>

              {/* Error / Success */}
              {error && (
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '10px', background: tokens.colors.red + '15', borderRadius: tokens.radius.md }}>
                  <AlertCircle size={14} style={{ color: tokens.colors.red }} />
                  <span style={{ fontSize: '12px', color: tokens.colors.red }}>{error}</span>
                </div>
              )}
              {success && (
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '10px', background: tokens.colors.green + '15', borderRadius: tokens.radius.md }}>
                  <CheckCircle size={14} style={{ color: tokens.colors.green }} />
                  <span style={{ fontSize: '12px', color: tokens.colors.green }}>Solicitud registrada correctamente</span>
                </div>
              )}
            </div>

            {/* Footer */}
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', padding: '16px 20px', borderTop: '1px solid ' + tokens.colors.border }}>
              <button onClick={() => setShowModal(false)} style={{
                padding: '8px 18px', fontSize: '13px', fontWeight: 600,
                color: tokens.colors.textSecondary, background: 'transparent',
                border: '1px solid ' + tokens.colors.border, borderRadius: tokens.radius.md, cursor: 'pointer',
              }}>Cancelar</button>
              <button onClick={handleSave} disabled={saving || success} style={{
                padding: '8px 24px', fontSize: '13px', fontWeight: 700,
                color: '#fff', background: saving || success ? tokens.colors.bgHover : tokens.colors.primary,
                border: 'none', borderRadius: tokens.radius.md, cursor: saving ? 'default' : 'pointer',
                fontFamily: tokens.fonts.heading, boxShadow: tokens.effects.glowPrimary,
                opacity: saving || success ? 0.6 : 1,
              }}>{saving ? 'Guardando...' : 'Registrar Solicitud'}</button>
            </div>
          </div>
        </div>
      )}
    </ModuleLayout>
  )
}
