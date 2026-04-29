import type { ReactElement } from 'react'
import { useState, useEffect } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { ArrowLeft, Globe, User, Phone, Mail, AlertCircle, CheckCircle, Building2, MapPin, Target, Zap, Save, DollarSign, TrendingUp, Truck, FileText } from 'lucide-react'
import { tokens } from '../../lib/tokens'
import { ModuleLayout } from '../../components/layout/ModuleLayout'
import { supabase } from '../../lib/supabase'
import { useAuthContext } from '../../hooks/AuthContext'

const TIPO_SERVICIO = ['Seco', 'Refrigerado', 'Seco Hazmat', 'Refri Hazmat']
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
  const [searchParams] = useSearchParams()
  const { user } = useAuthContext()
  const editId = searchParams.get('edit')
  const isEdit = !!editId
  const [readOnly, setReadOnly] = useState(false)
  const [loadingEdit, setLoadingEdit] = useState(isEdit)
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
  const [tipoServicio, setTipoServicio] = useState<string>('')
  // FIX 75 — tipo carga ahora chips multi-select
  const [tipoCargaList, setTipoCargaList] = useState<string[]>([])
  const [transbordo, setTransbordo] = useState(false)
  const [dtd, setDtd] = useState(false)
  const [proximosPasos, setProximosPasos] = useState('')
  const [rutas, setRutas] = useState<string[]>([''])
  const [viajesMes, setViajesMes] = useState('')
  const [tarifa, setTarifa] = useState('')
  const [proyectadoUsd, setProyectadoUsd] = useState('')
  // V50 26/Abr/2026 — Eran useState(false) booleans, pero los inputs los usaban como string. Fix: empty string
  const [hitoN4, setHitoN4] = useState('')
  const [hitoN5, setHitoN5] = useState('')
  const [hitoN6, setHitoN6] = useState('')
  const [hitoN7, setHitoN7] = useState('')
  const [dupWarning, setDupWarning] = useState(false)
  const [verifying, setVerifying] = useState(false)
  const [dupResults, setDupResults] = useState<any[]>([])

  // FIX 75 — precarga de datos si ?edit=ID
  useEffect(() => {
    if (!editId) return
    const loadLead = async () => {
      try {
        const { data, error } = await supabase
          .from('leads').select('*').eq('id', editId).maybeSingle()
        if (error) throw error
        if (!data) { setError('Lead no encontrado'); return }
        setEmpresa(data.empresa || '')
        setContacto(data.contacto || '')
        setTelefono(data.telefono || '')
        setEmail(data.email || '')
        setCiudad(data.ciudad || '')
        // tipo_carga puede venir como "Seca, Refrigerada"
        if (data.tipo_carga) setTipoCargaList(data.tipo_carga.split(',').map((s: string) => s.trim()).filter(Boolean))
        // ruta_interes con separador " | "
        if (data.ruta_interes) setRutas(data.ruta_interes.split(' | ').filter(Boolean) || [''])
        if (data.viajes_mes) setViajesMes(String(data.viajes_mes))
        if (data.valor_estimado) setProyectadoUsd(String(data.valor_estimado))
      } catch (e: any) {
        setError(`No se pudo cargar el lead: ${e?.message || 'error'}`)
      } finally { setLoadingEdit(false) }
    }
    loadLead()
  }, [editId])

  useEffect(() => {
    const vm = parseInt(viajesMes) || 0
    const t = parseFloat(tarifa) || 0
    if (vm > 0 && t > 0) setProyectadoUsd((vm * t).toFixed(0))
  }, [viajesMes, tarifa])

  const toggleChip = (arr: string[], val: string, setter: (v: string[]) => void) => {
    setter(arr.includes(val) ? arr.filter(v => v !== val) : [...arr, val])
  }

  const addRuta = () => setRutas([...rutas, ''])
  const updateRuta = (index: number, value: string) => {
    const newRutas = [...rutas]
    newRutas[index] = value
    setRutas(newRutas)
  }
  const removeRuta = (index: number) => {
    if (rutas.length > 1) setRutas(rutas.filter((_, i) => i !== index))
  }

  const verifyAndEnrich = async () => {
    if (!empresa.trim() || empresa.trim().length < 3) {
      setError('Ingresa al menos 3 caracteres para verificar')
      return
    }

    setVerifying(true)
    setError('')
    setDupResults([])

    try {
      // Check for duplicates in both leads and clientes tables
      const searchTerm = empresa.trim().toLowerCase()
      const firstChars = searchTerm.substring(0, 5)

      // FIX 73 — traer ejecutivo + fecha_ultimo_mov para regla 30 dias
      const { data: leadsData } = await supabase
        .from('leads')
        .select('id, empresa, estado, ejecutivo_nombre, ejecutivo_email, fecha_ultimo_mov')
        .or(`empresa.ilike.%${searchTerm}%,empresa.ilike.${searchTerm}`)
        .is('deleted_at', null)
        .limit(10)

      // Query clientes table with multiple strategies
      const { data: clientesData } = await supabase
        .from('clientes')
        .select('id, empresa, estado')
        .or(`empresa.ilike.%${searchTerm}%,empresa.ilike.${searchTerm}`)
        .limit(10)

      const allMatches = [...(leadsData || []), ...(clientesData || [])].reduce((acc: any[], item) => {
        // Avoid duplicates by ID
        if (!acc.find(m => m.id === item.id)) acc.push(item)
        return acc
      }, [])

      if (allMatches.length > 0) {
        setDupResults(allMatches)
        setError('Se encontraron coincidencias. Revisa antes de continuar.')
      } else {
        // No duplicates - call enrichment API
        try {
          // V50 26/Abr/2026 — Edge fn renamed: 'enrich-lead' no existe deployed, usar 'prospeccion-enriquecer'
          const { data: enrichData } = await supabase.functions.invoke('prospeccion-enriquecer', {
            body: { empresa: empresa.trim() }
          })

          if (enrichData) {
            if (enrichData.web) setWeb(enrichData.web)
            if (enrichData.ciudad) setCiudad(enrichData.ciudad)
            if (enrichData.estadoMx) setEstadoMx(enrichData.estadoMx)
            if (enrichData.tipoEmpresa) setTipoEmpresa(enrichData.tipoEmpresa)
          }
          setSuccess(true)
          setTimeout(() => setSuccess(false), 3000)
        } catch (enrichErr) {
          // Enrichment failed but no duplicates, so it's OK to continue
          setSuccess(true)
          setTimeout(() => setSuccess(false), 2000)
        }
      }
    } catch (e: any) {
      setError(e.message || 'Error al verificar empresa')
    } finally {
      setVerifying(false)
    }
  }

  const handleSave = async () => {
    if (!empresa.trim()) { setError('La empresa es obligatoria'); window.scrollTo({ top: 0, behavior: 'smooth' }); return }
    if (!contacto.trim()) { setError('El nombre del contacto es obligatorio'); window.scrollTo({ top: 0, behavior: 'smooth' }); return }
    if (!telefono.trim() && !email.trim()) { setError('Proporciona al menos teléfono o correo de contacto'); window.scrollTo({ top: 0, behavior: 'smooth' }); return }

    // FIX 75 — Validar formato email (RFC simple)
    if (email.trim() && !/^[\w.+-]+@[\w-]+\.[\w.-]+$/.test(email.trim())) {
      setError('Email con formato inválido (ej: contacto@empresa.com)')
      window.scrollTo({ top: 0, behavior: 'smooth' })
      return
    }

    // FIX 75 — Teléfono: solo dígitos y mínimo 10
    if (telefono.trim()) {
      const tel = telefono.trim().replace(/[\s\-\(\)\+]/g, '')
      if (!/^\d{10,15}$/.test(tel)) {
        setError('Teléfono inválido. Solo números, 10 a 15 dígitos.')
        window.scrollTo({ top: 0, behavior: 'smooth' })
        return
      }
    }

    // FIX 75 — Sanitizar empresa: longitud + caracteres permitidos
    const empresaClean = empresa.trim().replace(/\s+/g, ' ')
    if (empresaClean.length < 3) { setError('Nombre de empresa muy corto (mín 3 caracteres)'); return }
    if (empresaClean.length > 120) { setError('Nombre de empresa muy largo (máx 120 caracteres)'); return }
    if (/[<>\$#@!%\^&*\\]/.test(empresaClean)) {
      setError('Nombre de empresa contiene caracteres no permitidos (<>$#@!%^&*\\).')
      return
    }

    // FIX 72 — Bloquear si email coincide con un usuario interno (vendedor/admin/cs) de TROB/WE/SHI
    if (email.trim()) {
      const emailLower = email.trim().toLowerCase()
      const dominiosInternos = ['@trob.com.mx','@wexpress.com.mx','@speedyhaul.com','@shi.com.mx']
      if (dominiosInternos.some(d => emailLower.endsWith(d))) {
        const { data: userInterno } = await supabase
          .from('usuarios_autorizados')
          .select('email,rol,nombre')
          .eq('email', emailLower)
          .maybeSingle()
        if (userInterno) {
          setError(`No se permite registrar lead con email de un colaborador interno (${userInterno.nombre || emailLower}, ${userInterno.rol}). Usa el email del cliente prospecto.`)
          window.scrollTo({ top: 0, behavior: 'smooth' })
          return
        }
      }
    }
    
    // FIX 73 — BLOQUEO DURO si empresa ya está asignada a otro vendedor.
    // Regla 30 días: si el lead lleva ≥30d sin movimiento, permitir solicitar liberación.
    if (dupResults.length > 0) {
      const leadConDueno = dupResults.find((d: any) => d.ejecutivo_nombre || d.ejecutivo_email)
      if (leadConDueno) {
        const ahora = Date.now()
        const ultMov = leadConDueno.fecha_ultimo_mov ? new Date(leadConDueno.fecha_ultimo_mov).getTime() : ahora
        const diasSinMov = Math.floor((ahora - ultMov) / 86400000)
        const diasRestantes = Math.max(0, 30 - diasSinMov)
        const owner = leadConDueno.ejecutivo_nombre || leadConDueno.ejecutivo_email || 'otro vendedor'
        if (diasRestantes > 0) {
          setError(`Lead bloqueado: "${leadConDueno.empresa}" ya está asignado a ${owner}. Podrá liberarse en ${diasRestantes} días si no hay movimiento (regla 30d).`)
          window.scrollTo({ top: 0, behavior: 'smooth' })
          return
        }
        const motivo = window.prompt(`"${leadConDueno.empresa}" lleva ${diasSinMov} días sin movimiento bajo ${owner}.\n\n¿Por qué quieres tomarlo? (mensaje al vendedor actual y a admin)`) || ''
        if (!motivo.trim()) {
          setError('Solicitud cancelada. Para tomar este lead, escribe un motivo.')
          return
        }
        try {
          await supabase.from('solicitudes_liberacion_lead').insert([{
            empresa_solicitada: leadConDueno.empresa,
            lead_id_existente: leadConDueno.id,
            ejecutivo_actual_email: leadConDueno.ejecutivo_email || null,
            ejecutivo_actual_nombre: leadConDueno.ejecutivo_nombre || null,
            solicitante_id: user?.id || null,
            solicitante_email: user?.email || null,
            solicitante_nombre: user?.nombre || user?.email || null,
            estado: 'pendiente',
            dias_sin_movimiento_al_solicitar: diasSinMov,
            motivo_solicitud: motivo.trim(),
          }])
          setError(`Solicitud enviada a ${owner} y a admin. Recibirás respuesta en su panel. No se creó lead duplicado.`)
        } catch (sErr: any) {
          setError(`No se pudo registrar solicitud: ${sErr?.message || 'error'}`)
        }
        return
      }
      const confirmar = window.confirm(`"${dupResults[0].empresa}" ya existe como cliente activo. ¿Confirmas crear lead nuevo de todas formas?`)
      if (!confirmar) return
    }

    setSaving(true); setError('')
    try {
      // FIX 75 — Title Case respetando acrónimos (palabras 2-4 letras todas mayúsculas se mantienen)
      const empresaTitleCase = empresaClean
        .split(' ')
        .map(w => {
          if (!w) return w
          if (/^[A-Z]{2,4}$/.test(w)) return w  // QA, USA, S.A. (acrónimo, mantener)
          if (/^[A-Z]\.[A-Z]\.?$/.test(w)) return w  // S.A., S.A.
          return w.charAt(0).toUpperCase() + w.slice(1).toLowerCase()
        })
        .join(' ')

      // V50 (26/Abr/2026) — Schema fix: solo columnas que existen en tabla leads.
      // Datos extra (web, tipo_empresa, estado_mx, prioridad, tamano, fecha_cierre,
      // transbordo, dtd, proximos_pasos, tarifa, proyectado_usd) se persisten en `notas`
      // como bloque legible para no perder data del formulario.
      const notasExtra = [
        web.trim() && `Web: ${web.trim()}`,
        tipoEmpresa && `Tipo empresa: ${tipoEmpresa}`,
        estadoMx.trim() && `Estado MX: ${estadoMx.trim()}`,
        prioridad && `Prioridad: ${prioridad}`,
        tamano && `Tamaño: ${tamano}`,
        fechaCierre && `Fecha cierre: ${fechaCierre}`,
        `Tipo viaje: FTL · Transbordo: ${transbordo ? 'Sí' : 'No'} · DTD: ${dtd ? 'Sí' : 'No'}`,
        proximosPasos.trim() && `Próximos pasos: ${proximosPasos.trim()}`,
        tarifa && `Tarifa: $${tarifa}`,
        proyectadoUsd && `Proyectado USD: $${proyectadoUsd}`,
      ].filter(Boolean).join('\n')

      const payload = {
        empresa: empresaTitleCase,  // FIX 75 — Title Case con acrónimos respetados

        contacto: contacto.trim(),
        telefono: telefono.trim(),
        email: email.trim(),
        ciudad: ciudad.trim(),
        tipo_carga: tipoCargaList.join(', '),
        ruta_interes: rutas.filter(r => r.trim()).join(' | '),
        viajes_mes: parseInt(viajesMes) || 0,
        valor_estimado: parseFloat(proyectadoUsd) || 0,
        estado: 'Nuevo',
        probabilidad: 10,
        fuente: 'Manual',
        ejecutivo_id: user?.id || null,
        ejecutivo_nombre: user?.nombre || user?.email || 'Sin asignar',
        ejecutivo_email: user?.email || null,
        notas: notasExtra || null,
        fecha_creacion: new Date().toISOString(),
        fecha_ultimo_mov: new Date().toISOString(),
      }
      let err: any = null
      if (isEdit && editId) {
        const { error } = await supabase.from('leads').update(payload).eq('id', editId)
        err = error
      } else {
        const { error } = await supabase.from('leads').insert([payload])
        err = error
      }
      if (err) throw err
      setSuccess(true)
      setTimeout(() => navigate('/oportunidades/mis-leads'), 1200)
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
    background: prioridad === val
      ? `linear-gradient(180deg, ${color} 0%, ${color}DD 100%)`
      : 'linear-gradient(180deg, #FFFFFF 0%, #F3F4F6 100%)',
    color: prioridad === val ? '#fff' : tokens.colors.textSecondary,
    border: '1px solid ' + (prioridad === val ? color : tokens.colors.border),
    fontFamily: tokens.fonts.body,
    transition: 'all 0.18s ease',
    boxShadow: prioridad === val
      ? `0 2px 4px rgba(0,0,0,0.20), inset 0 1px 0 rgba(255,255,255,0.25), inset 0 -1px 0 rgba(0,0,0,0.18)`
      : '0 1px 2px rgba(0,0,0,0.08), inset 0 1px 0 rgba(255,255,255,0.80), inset 0 -1px 0 rgba(0,0,0,0.04)',
    textShadow: prioridad === val ? '0 1px 1px rgba(0,0,0,0.20)' : 'none',
  })

  const selectBase: React.CSSProperties = { ...inputBase, appearance: 'auto' as const }

  // ── Premium V29 Styles ──
  const ps = {
    section: {
      background: tokens.colors.bgCard,
      borderRadius: tokens.radius.lg,
      border: '1px solid ' + tokens.colors.border,
      padding: '16px',
      boxShadow: tokens.effects.cardShadow,
    } as React.CSSProperties,
    sectionTitle: {
      display: 'flex', alignItems: 'center', gap: '8px',
      fontSize: '13px', fontWeight: 700, color: tokens.colors.textPrimary,
      fontFamily: tokens.fonts.heading, marginBottom: '14px',
      paddingBottom: '10px', borderBottom: '1px solid ' + tokens.colors.border,
    } as React.CSSProperties,
    label: {
      display: 'block', fontSize: '11px', fontWeight: 600,
      color: tokens.colors.textSecondary, marginBottom: '4px',
      textTransform: 'uppercase' as const, letterSpacing: '0.5px',
    } as React.CSSProperties,
    input: {
      width: '100%', padding: '9px 12px', fontSize: '13px',
      background: tokens.colors.bgMain,
      border: '1px solid ' + tokens.colors.border,
      borderRadius: tokens.radius.md, color: tokens.colors.textPrimary,
      fontFamily: tokens.fonts.body, outline: 'none',
      boxShadow: 'inset 0 1px 3px rgba(0,0,0,0.2)',
      transition: 'border-color 0.15s, box-shadow 0.15s',
    } as React.CSSProperties,
    select: {
      width: '100%', padding: '9px 12px', fontSize: '13px',
      background: tokens.colors.bgMain,
      border: '1px solid ' + tokens.colors.border,
      borderRadius: tokens.radius.md, color: tokens.colors.textPrimary,
      fontFamily: tokens.fonts.body, outline: 'none',
      boxShadow: 'inset 0 1px 3px rgba(0,0,0,0.2)',
      appearance: 'none' as const,
    } as React.CSSProperties,
    fieldGroup: { marginBottom: '12px' } as React.CSSProperties,
    row: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' } as React.CSSProperties,
  }

  return (
    <ModuleLayout titulo="Agregar Lead">
      {/* MAIN CONTENT — premium V29 sectioned layout */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '14px', padding: '8px 16px', height: 'calc(100vh - 160px)', overflow: 'hidden' }}>

        {/* ── COL 1: Empresa + Contacto ── */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', overflow: 'auto', scrollbarWidth: 'none' }}>
          {/* Empresa Section */}
          <div style={ps.section}>
            <div style={ps.sectionTitle}><Building2 size={14} style={{ color: tokens.colors.primary }} /> Empresa</div>
            <div style={ps.fieldGroup}>
              <label style={ps.label}>Nombre de empresa *</label>
              <div style={{ display: 'flex', gap: '8px', alignItems: 'flex-end' }}>
                <input style={{ ...ps.input, flex: 1 }} value={empresa} onChange={e => setEmpresa(e.target.value)} placeholder="Ej: Grupo Bimbo" onFocus={e => { e.target.style.borderColor = tokens.colors.primary; e.target.style.boxShadow = tokens.effects.glowPrimary }} onBlur={e => { e.target.style.borderColor = tokens.colors.border; e.target.style.boxShadow = 'inset 0 1px 3px rgba(0,0,0,0.2)' }} />
                <button
                  onClick={verifyAndEnrich}
                  disabled={verifying || !empresa.trim()}
                  style={{
                    padding: '9px 12px',
                    background: verifying || !empresa.trim() ? tokens.colors.bgHover : tokens.colors.primary + '15',
                    border: '1px solid ' + (verifying || !empresa.trim() ? tokens.colors.border : tokens.colors.primary),
                    borderRadius: tokens.radius.md,
                    color: verifying || !empresa.trim() ? tokens.colors.textMuted : tokens.colors.primary,
                    fontSize: '12px',
                    fontWeight: 600,
                    cursor: verifying || !empresa.trim() ? 'default' : 'pointer',
                    fontFamily: tokens.fonts.body,
                    whiteSpace: 'nowrap',
                    transition: 'all 0.15s',
                  }}
                  onMouseEnter={(e) => {
                    if (!verifying && empresa.trim()) {
                      e.currentTarget.style.background = tokens.colors.primary + '25'
                      e.currentTarget.style.borderColor = tokens.colors.primary
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (!verifying && empresa.trim()) {
                      e.currentTarget.style.background = tokens.colors.primary + '15'
                      e.currentTarget.style.borderColor = tokens.colors.primary
                    }
                  }}
                >
                  {verifying ? 'Verificando...' : 'Verificar y Buscar'}
                </button>
              </div>
            </div>

            {/* Duplicate Results Panel */}
            {dupResults.length > 0 && (
              <div style={{
                marginTop: '8px',
                padding: '10px 12px',
                background: tokens.colors.redBg,
                border: '1px solid ' + tokens.colors.red + '33',
                borderRadius: tokens.radius.md,
              }}>
                <div style={{ fontSize: '11px', fontWeight: 600, color: tokens.colors.red, marginBottom: '6px' }}>
                  ⚠️ Se encontraron {dupResults.length} coincidencia{dupResults.length > 1 ? 's' : ''}:
                </div>
                {dupResults.map((dup, idx) => (
                  <div key={idx} style={{ fontSize: '11px', color: tokens.colors.textSecondary, marginBottom: idx < dupResults.length - 1 ? '4px' : '0' }}>
                    • {dup.empresa} {dup.estado ? `(${dup.estado})` : ''}
                  </div>
                ))}
              </div>
            )}

            {/* Success Message */}
            {success && dupResults.length === 0 && (
              <div style={{
                marginTop: '8px',
                padding: '10px 12px',
                background: tokens.colors.greenBg,
                border: '1px solid ' + tokens.colors.green + '33',
                borderRadius: tokens.radius.md,
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
              }}>
                <span style={{ fontSize: '12px', color: tokens.colors.green }}>✓ Empresa nueva - Datos enriquecidos</span>
              </div>
            )}
            <div style={ps.row}>
              <div style={ps.fieldGroup}>
                <label style={ps.label}>Tipo de empresa</label>
                <select style={ps.select} value={tipoEmpresa} onChange={e => setTipoEmpresa(e.target.value)}>
                  <option value="">Seleccionar</option>
                  <option value="manufacturer">Manufacturer</option>
                  <option value="broker">Broker</option>
                  <option value="forwarder">Forwarder</option>
                  <option value="trading">Trading Co.</option>
                  <option value="otro">Otro</option>
                </select>
              </div>
              <div style={ps.fieldGroup}>
                <label style={ps.label}>Sitio web</label>
                <input style={ps.input} value={web} onChange={e => setWeb(e.target.value)} placeholder="https://" />
              </div>
            </div>
            <div style={ps.row}>
              <div style={ps.fieldGroup}>
                <label style={ps.label}>Ciudad</label>
                <input style={ps.input} value={ciudad} onChange={e => setCiudad(e.target.value)} placeholder="Ciudad" />
              </div>
              <div style={ps.fieldGroup}>
                <label style={ps.label}>Estado</label>
                <input style={ps.input} value={estadoMx} onChange={e => setEstadoMx(e.target.value)} placeholder="Estado" />
              </div>
            </div>
          </div>

          {/* Contacto Section */}
          <div style={ps.section}>
            <div style={ps.sectionTitle}><User size={14} style={{ color: tokens.colors.primary }} /> Contacto</div>
            <div style={ps.fieldGroup}>
              <label style={ps.label}>Nombre del contacto *</label>
              <input style={ps.input} value={contacto} onChange={e => setContacto(e.target.value)} placeholder="Nombre completo" onFocus={e => { e.target.style.borderColor = tokens.colors.primary; e.target.style.boxShadow = tokens.effects.glowPrimary }} onBlur={e => { e.target.style.borderColor = tokens.colors.border; e.target.style.boxShadow = 'inset 0 1px 3px rgba(0,0,0,0.2)' }} />
            </div>
            <div style={ps.row}>
              <div style={ps.fieldGroup}>
                <label style={ps.label}>Telefono</label>
                <input style={ps.input} value={telefono} onChange={e => setTelefono(e.target.value)} placeholder="+52 81 1234 5678" />
              </div>
              <div style={ps.fieldGroup}>
                <label style={ps.label}>Email</label>
                <input style={ps.input} value={email} onChange={e => setEmail(e.target.value)} placeholder="correo@empresa.com" />
              </div>
            </div>
          </div>
        </div>

        {/* ── COL 2: Servicio + Ruta ── */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', overflow: 'auto', scrollbarWidth: 'none' }}>
          <div style={ps.section}>
            <div style={ps.sectionTitle}><Target size={14} style={{ color: tokens.colors.primary }} /> Servicio</div>
            <div style={ps.fieldGroup}>
              <label style={ps.label}>Tipo servicio</label>
              <select style={ps.select} value={tipoServicio} onChange={e => setTipoServicio(e.target.value)} disabled={readOnly}>
                <option value="">Seleccionar</option>
                <option value="IMPO">IMPO</option>
                <option value="EXPO">EXPO</option>
                <option value="NAC">NAC</option>
                <option value="DEDICADO">DEDICADO</option>
              </select>
            </div>
            <div style={ps.fieldGroup}>
              <label style={ps.label}>Tipo carga</label>
              <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                {['Seca','Refrigerada','Peligrosa','Hazmat'].map(opt => {
                  const selected = tipoCargaList.includes(opt)
                  return (
                    <button key={opt} type="button"
                      onClick={() => setTipoCargaList(selected ? tipoCargaList.filter(v => v !== opt) : [...tipoCargaList, opt])}
                      style={{
                        padding: '5px 10px', borderRadius: '999px', fontSize: '11px', fontWeight: 600,
                        border: '1px solid ' + (selected ? tokens.colors.primary : tokens.colors.border),
                        background: selected ? tokens.colors.primary : 'transparent',
                        color: selected ? '#FFFFFF' : tokens.colors.textPrimary,
                        cursor: 'pointer'
                      }}>{opt}</button>
                  )
                })}
              </div>
            </div>
            <div style={ps.fieldGroup}>
              <label style={ps.label}>Ruta principal</label>
              {rutas.map((r, idx) => (
                <div key={idx} style={{ display: 'flex', gap: '8px', marginBottom: idx < rutas.length - 1 ? '8px' : '0', alignItems: 'center' }}>
                  <span style={{ fontSize: '12px', fontWeight: 600, color: tokens.colors.textMuted, minWidth: '20px' }}>{idx + 1}.</span>
                  <input
                    style={ps.input}
                    value={r}
                    onChange={e => updateRuta(idx, e.target.value)}
                    placeholder="Ej: Laredo TX → Monterrey NL"
                  />
                  {rutas.length > 1 && (
                    <button
                      onClick={() => removeRuta(idx)}
                      style={{
                        padding: '6px 8px',
                        background: 'transparent',
                        border: 'none',
                        color: tokens.colors.red,
                        cursor: 'pointer',
                        fontSize: '14px',
                        fontWeight: 'bold',
                        opacity: 0.7,
                        transition: 'opacity 0.15s',
                      }}
                      onMouseEnter={(e) => (e.currentTarget.style.opacity = '1')}
                      onMouseLeave={(e) => (e.currentTarget.style.opacity = '0.7')}
                    >
                      ✕
                    </button>
                  )}
                </div>
              ))}
              <button
                onClick={addRuta}
                style={{
                  marginTop: '8px',
                  padding: '8px 12px',
                  background: tokens.colors.bgHover,
                  border: '1px solid ' + tokens.colors.border,
                  borderRadius: tokens.radius.md,
                  color: tokens.colors.primary,
                  fontSize: '12px',
                  fontWeight: 600,
                  cursor: 'pointer',
                  fontFamily: tokens.fonts.body,
                  transition: 'all 0.15s',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = tokens.colors.primary + '15'
                  e.currentTarget.style.borderColor = tokens.colors.primary
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = tokens.colors.bgHover
                  e.currentTarget.style.borderColor = tokens.colors.border
                }}
              >
                + Agregar ruta
              </button>
            </div>
            <div style={ps.row}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '4px' }}>
                <input type="checkbox" checked={transbordo} onChange={e => setTransbordo(e.target.checked)} style={{ accentColor: tokens.colors.primary }} />
                <label style={{ fontSize: '12px', color: tokens.colors.textSecondary }}>Transbordo</label>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '4px' }}>
                <input type="checkbox" checked={dtd} onChange={e => setDtd(e.target.checked)} style={{ accentColor: tokens.colors.primary }} />
                <label style={{ fontSize: '12px', color: tokens.colors.textSecondary }}>Door-to-Door</label>
              </div>
            </div>
          </div>

          <div style={ps.section}>
            <div style={ps.sectionTitle}><MapPin size={14} style={{ color: tokens.colors.primary }} /> Volumen</div>
            <div style={ps.row}>
              <div style={ps.fieldGroup}>
                <label style={ps.label}>Viajes / mes</label>
                <input style={ps.input} type="number" value={viajesMes} onChange={e => setViajesMes(e.target.value)} placeholder="0" />
              </div>
              <div style={ps.fieldGroup}>
                <label style={ps.label}>Tarifa estimada</label>
                <input style={ps.input} type="number" value={tarifa} onChange={e => setTarifa(e.target.value)} placeholder="$0 USD" />
              </div>
            </div>
          </div>
        </div>

        {/* ── COL 3: Valores + Proximos Pasos + Guardar ── */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', overflow: 'auto', scrollbarWidth: 'none' }}>
          <div style={ps.section}>
            <div style={ps.sectionTitle}><Zap size={14} style={{ color: tokens.colors.primary }} /> Oportunidad</div>
            <div style={ps.row}>
              <div style={ps.fieldGroup}>
                <label style={ps.label}>Prioridad</label>
                <select style={ps.select} value={prioridad} onChange={e => setPrioridad(e.target.value)}>
                  <option value="media">Media</option>
                  <option value="alta">Alta</option>
                  <option value="baja">Baja</option>
                  <option value="critica">Critica</option>
                </select>
              </div>
              <div style={ps.fieldGroup}>
                <label style={ps.label}>Tamano cuenta</label>
                <select style={ps.select} value={tamano} onChange={e => setTamano(e.target.value)}>
                  <option value="">Seleccionar</option>
                  <option value="enterprise">Enterprise</option>
                  <option value="mid_market">Mid-Market</option>
                  <option value="smb">SMB</option>
                </select>
              </div>
            </div>
            <div style={ps.row}>
              <div style={ps.fieldGroup}>
                <label style={ps.label}>Proyectado USD</label>
                <input style={ps.input} type="number" value={proyectadoUsd} onChange={e => setProyectadoUsd(e.target.value)} placeholder="$0" />
              </div>
              <div style={ps.fieldGroup}>
                <label style={ps.label}>Fecha cierre est.</label>
                <input style={{ ...ps.input, colorScheme: 'dark' }} type="date" value={fechaCierre} onChange={e => setFechaCierre(e.target.value)} />
              </div>
            </div>
          </div>

          <div style={ps.section}>
            <div style={ps.sectionTitle}><FileText size={14} style={{ color: tokens.colors.primary }} /> Notas</div>
            <div style={ps.fieldGroup}>
              <label style={ps.label}>Proximos pasos</label>
              <textarea style={{ ...ps.input, minHeight: '60px', resize: 'none' }} value={proximosPasos} onChange={e => setProximosPasos(e.target.value)} placeholder="Siguiente acción con el prospecto..." />
            </div>
            <div style={ps.row}>
              <div style={ps.fieldGroup}>
                <label style={ps.label}>Hito N4</label>
                <input style={ps.input} value={hitoN4} onChange={e => setHitoN4(e.target.value)} placeholder="Hito nivel 4" />
              </div>
              <div style={ps.fieldGroup}>
                <label style={ps.label}>Hito N5</label>
                <input style={ps.input} value={hitoN5} onChange={e => setHitoN5(e.target.value)} placeholder="Hito nivel 5" />
              </div>
            </div>
          </div>

          {/* Status Messages */}
          {error && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 14px', background: tokens.colors.redBg, border: '1px solid ' + tokens.colors.red + '33', borderRadius: tokens.radius.md }}>
              <AlertCircle size={14} style={{ color: tokens.colors.red }} />
              <span style={{ fontSize: '12px', color: tokens.colors.red }}>{error}</span>
            </div>
          )}
          {success && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 14px', background: tokens.colors.greenBg, border: '1px solid ' + tokens.colors.green + '33', borderRadius: tokens.radius.md }}>
              <CheckCircle size={14} style={{ color: tokens.colors.green }} />
              <span style={{ fontSize: '12px', color: tokens.colors.green }}>Lead guardado correctamente</span>
            </div>
          )}

          {/* Save Button */}
          <button onClick={handleSave} disabled={saving || success} style={{
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
            width: '100%', padding: '12px', fontSize: '13px', fontWeight: 700,
            fontFamily: tokens.fonts.heading, textTransform: 'uppercase' as const,
            letterSpacing: '1px', color: '#fff',
            background: saving || success ? tokens.colors.bgHover : `linear-gradient(180deg, #4A7AF0 0%, ${tokens.colors.primary} 50%, #2F5BC4 100%)`,
            border: 'none', borderRadius: tokens.radius.md, cursor: saving || success ? 'default' : 'pointer',
            boxShadow: saving || success ? 'none' : '0 2px 4px rgba(59,108,231,0.30), 0 6px 14px -3px rgba(59,108,231,0.25), 0 10px 24px -6px rgba(0,0,0,0.18), inset 0 1px 0 rgba(255,255,255,0.28), inset 0 -1px 0 rgba(0,0,0,0.18)',
            textShadow: '0 1px 2px rgba(0,0,0,0.20)',
            opacity: saving || success ? 0.6 : 1,
            transition: 'all 0.18s ease',
          }}>
            <Save size={14} />
            {saving ? 'GUARDANDO...' : 'GUARDAR LEAD'}
          </button>
        </div>
      </div>
      </ModuleLayout>
  )
}
