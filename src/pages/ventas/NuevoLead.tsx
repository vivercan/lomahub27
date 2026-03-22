import { useState, useEffect, useCallback } from 'react'
import { AlertCircle, CheckCircle, X } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { ModuleLayout } from '../../components/layout/ModuleLayout'
import { Card } from '../../components/ui/Card'
import { Button } from '../../components/ui/Button'
import { Input } from '../../components/ui/Input'
import { Select } from '../../components/ui/Select'
import { tokens } from '../../lib/tokens'
import { supabase } from '../../lib/supabase'
import { useAuthContext } from '../../hooks/AuthContext'

const TIPO_SERVICIO = ['Seco', 'Refrigerado', 'Seco Hazmat', 'Refri Hazmat']
const TIPO_VIAJE = ['Impo', 'Expo', 'Nacional', 'Dedicado']
const HITOS = [
  { key: 'n4_alta', label: 'N4 Alta' },
  { key: 'n5_sop', label: 'N5 SOP' },
  { key: 'n6_junta', label: 'N6 Junta Arranque' },
  { key: 'n7_facturado', label: 'N7 Facturado' },
]

const toUpperCaseVal = (v: string) => v.toUpperCase()
const toTitleCase = (v: string) =>
  v.replace(/\w\S*/g, (t) => t.charAt(0).toUpperCase() + t.slice(1).toLowerCase())

export default function NuevoLead() {
  const navigate = useNavigate()
  const { user } = useAuthContext()
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)
  const [duplicates, setDuplicates] = useState<string[]>([])
  const [checkingDup, setCheckingDup] = useState(false)

  const [form, setForm] = useState({
    empresa: '',
    web: '',
    contacto: '',
    telefono: '',
    email: '',
    tipoEmpresa: '',
    ciudad: '',
    estado: '',
    prioridad: '',
    tamano: '',
    fechaCierre: '',
    tipoServicio: [] as string[],
    tipoViaje: [] as string[],
    transbordo: false,
    dtd: false,
    proximosPasos: '',
    ruta: '',
    viajesMes: '',
    tarifa: '',
    proyectadoUsd: '',
    hitos: {} as Record<string, boolean>,
    fuente: '',
    notas: '',
  })

  const toggleChip = (field: 'tipoServicio' | 'tipoViaje', value: string) => {
    setForm((p) => {
      const arr = p[field]
      return { ...p, [field]: arr.includes(value) ? arr.filter((v) => v !== value) : [...arr, value] }
    })
  }

  const set = (field: string, value: any) => {
    setForm((p) => ({ ...p, [field]: value }))
    setError(null)
  }

  // Duplicate check with debounce
  const checkDuplicates = useCallback(async (empresa: string) => {
    if (empresa.length < 3) { setDuplicates([]); return }
    setCheckingDup(true)
    try {
      const term = `%${empresa}%`
      const [leadsRes, clientesRes] = await Promise.all([
        supabase.from('leads').select('empresa').ilike('empresa', term).limit(5),
        supabase.from('sc_contactos_clientes').select('nombre_cliente').ilike('nombre_cliente', term).limit(5),
      ])
      const found: string[] = []
      leadsRes.data?.forEach((l: any) => found.push(`Lead: ${l.empresa}`))
      clientesRes.data?.forEach((c: any) => found.push(`Cliente: ${c.nombre_cliente}`))
      setDuplicates(found)
    } catch { setDuplicates([]) }
    finally { setCheckingDup(false) }
  }, [])

  useEffect(() => {
    const t = setTimeout(() => checkDuplicates(form.empresa), 400)
    return () => clearTimeout(t)
  }, [form.empresa, checkDuplicates])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
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
        estado_mx: form.estado.trim(),
        prioridad: form.prioridad,
        tamano: form.tamano,
        fecha_cierre: form.fechaCierre || null,
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
      setTimeout(() => navigate('/ventas/mis-leads'), 1200)
    } catch (err: any) {
      setError(err.message || 'Error al guardar el lead')
    } finally { setSaving(false) }
  }

  const Chip = ({ label, active, onClick }: { label: string; active: boolean; onClick: () => void }) => (
    <button type="button" onClick={onClick}
      className="px-3 py-1.5 rounded-full text-xs font-medium transition-all"
      style={{
        background: active ? tokens.colors.primary : tokens.colors.bgHover,
        color: active ? '#fff' : tokens.colors.textSecondary,
        border: `1px solid ${active ? tokens.colors.primary : tokens.colors.border}`,
      }}>
      {label}
    </button>
  )

  const SectionTitle = ({ children }: { children: string }) => (
    <p className="text-[10px] uppercase tracking-widest font-bold mb-3"
      style={{ color: tokens.colors.orange, fontFamily: tokens.fonts.heading }}>
      {children}
    </p>
  )

  const tipoEmpresaOpts = [
    { value: '', label: 'Seleccionar...' },
    { value: 'fabricante', label: 'Fabricante' },
    { value: 'distribuidor', label: 'Distribuidor' },
    { value: 'maquiladora', label: 'Maquiladora' },
    { value: 'comercializadora', label: 'Comercializadora' },
    { value: 'broker', label: 'Broker Logístico' },
    { value: 'otro', label: 'Otro' },
  ]
  const prioridadOpts = [
    { value: '', label: 'Seleccionar...' },
    { value: 'alta', label: 'Alta' },
    { value: 'media', label: 'Media' },
    { value: 'baja', label: 'Baja' },
  ]
  const tamanoOpts = [
    { value: '', label: 'Seleccionar...' },
    { value: 'grande', label: 'Grande (50+ viajes/mes)' },
    { value: 'mediana', label: 'Mediana (10-49 viajes/mes)' },
    { value: 'chica', label: 'Chica (1-9 viajes/mes)' },
  ]
  const fuenteOpts = [
    { value: '', label: 'Seleccionar...' },
    { value: 'referencia', label: 'Referencia' },
    { value: 'llamada', label: 'Llamada Entrante' },
    { value: 'web', label: 'Sitio Web' },
    { value: 'feria', label: 'Feria/Evento' },
    { value: 'prospeccion', label: 'Prospección Directa' },
    { value: 'otro', label: 'Otro' },
  ]

  return (
    <ModuleLayout titulo="Agregar Lead" subtitulo="Captura completa de prospecto">
      <form onSubmit={handleSubmit}>
        {/* 3 columns */}
        <div className="grid grid-cols-3 gap-4" style={{ minHeight: 0 }}>

          {/* COL 1: EMPRESA */}
          <Card>
            <SectionTitle>N1 — Empresa</SectionTitle>
            <div className="space-y-2.5">
              <Input label="Empresa *" placeholder="NOMBRE DE LA EMPRESA"
                value={form.empresa}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => set('empresa', toUpperCaseVal(e.target.value))} required />
              <Input label="Sitio Web" placeholder="www.empresa.com"
                value={form.web}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => set('web', e.target.value)} />
              <Input label="Contacto" placeholder="Nombre Del Contacto"
                value={form.contacto}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => set('contacto', toTitleCase(e.target.value))} />
              <div className="grid grid-cols-2 gap-2">
                <Input label="Teléfono" placeholder="+52 ..."
                  value={form.telefono}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => set('telefono', e.target.value)} />
                <Input label="Email" type="email" placeholder="email@empresa.com"
                  value={form.email}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => set('email', e.target.value)} />
              </div>
              <Select label="Tipo de Empresa" options={tipoEmpresaOpts} value={form.tipoEmpresa}
                onChange={(e: React.ChangeEvent<HTMLSelectElement>) => set('tipoEmpresa', e.target.value)} />
              <div className="grid grid-cols-2 gap-2">
                <Input label="Ciudad" placeholder="Ciudad"
                  value={form.ciudad}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => set('ciudad', e.target.value)} />
                <Input label="Estado" placeholder="Estado"
                  value={form.estado}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => set('estado', e.target.value)} />
              </div>
              <div className="grid grid-cols-2 gap-2">
                <Select label="Prioridad" options={prioridadOpts} value={form.prioridad}
                  onChange={(e: React.ChangeEvent<HTMLSelectElement>) => set('prioridad', e.target.value)} />
                <Select label="Tamaño" options={tamanoOpts} value={form.tamano}
                  onChange={(e: React.ChangeEvent<HTMLSelectElement>) => set('tamano', e.target.value)} />
              </div>
              <Input label="Fecha Cierre Estimada" type="date" value={form.fechaCierre}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => set('fechaCierre', e.target.value)} />
            </div>
          </Card>

          {/* COL 2: SERVICIO + VIAJE */}
          <Card>
            <SectionTitle>N2 — Tipo de Servicio</SectionTitle>
            <div className="flex flex-wrap gap-2 mb-4">
              {TIPO_SERVICIO.map((ts) => (
                <Chip key={ts} label={ts} active={form.tipoServicio.includes(ts)}
                  onClick={() => toggleChip('tipoServicio', ts)} />
              ))}
            </div>
            <SectionTitle>Tipo de Viaje</SectionTitle>
            <div className="flex flex-wrap gap-2 mb-3">
              {TIPO_VIAJE.map((tv) => (
                <Chip key={tv} label={tv} active={form.tipoViaje.includes(tv)}
                  onClick={() => toggleChip('tipoViaje', tv)} />
              ))}
            </div>
            <div className="flex gap-4 mb-4">
              <label className="flex items-center gap-2 text-xs cursor-pointer" style={{ color: tokens.colors.textSecondary }}>
                <input type="checkbox" checked={form.transbordo} onChange={(e) => set('transbordo', e.target.checked)}
                  className="rounded" style={{ accentColor: tokens.colors.primary }} />
                Transbordo
              </label>
              <label className="flex items-center gap-2 text-xs cursor-pointer" style={{ color: tokens.colors.textSecondary }}>
                <input type="checkbox" checked={form.dtd} onChange={(e) => set('dtd', e.target.checked)}
                  className="rounded" style={{ accentColor: tokens.colors.primary }} />
                Door-to-Door
              </label>
            </div>
            <div className="mb-4">
              <Select label="Fuente" options={fuenteOpts} value={form.fuente}
                onChange={(e: React.ChangeEvent<HTMLSelectElement>) => set('fuente', e.target.value)} />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1"
                style={{ color: tokens.colors.textSecondary, fontFamily: tokens.fonts.body }}>
                Próximos Pasos
              </label>
              <textarea placeholder="Acciones a tomar con este prospecto..."
                value={form.proximosPasos}
                onChange={(e) => set('proximosPasos', e.target.value)}
                className="w-full rounded-lg px-3 py-2 text-sm outline-none resize-none"
                style={{
                  background: tokens.colors.bgHover,
                  border: `1px solid ${tokens.colors.border}`,
                  color: tokens.colors.textPrimary,
                  fontFamily: tokens.fonts.body,
                }} rows={3} />
            </div>
            <div className="mt-3">
              <label className="block text-sm font-medium mb-1"
                style={{ color: tokens.colors.textSecondary, fontFamily: tokens.fonts.body }}>
                Notas
              </label>
              <textarea placeholder="Notas adicionales..."
                value={form.notas}
                onChange={(e) => set('notas', e.target.value)}
                className="w-full rounded-lg px-3 py-2 text-sm outline-none resize-none"
                style={{
                  background: tokens.colors.bgHover,
                  border: `1px solid ${tokens.colors.border}`,
                  color: tokens.colors.textPrimary,
                  fontFamily: tokens.fonts.body,
                }} rows={3} />
            </div>
          </Card>

          {/* COL 3: FINANZAS + HITOS */}
          <Card>
            <SectionTitle>N3 — Finanzas</SectionTitle>
            <div className="space-y-2.5 mb-5">
              <Input label="Ruta Principal" placeholder="CDMX — MTY — LRD"
                value={form.ruta}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => set('ruta', e.target.value)} />
              <div className="grid grid-cols-2 gap-2">
                <Input label="Viajes / Mes" type="number" placeholder="0"
                  value={form.viajesMes}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => set('viajesMes', e.target.value)} />
                <Input label="Tarifa (USD)" type="number" placeholder="0.00"
                  value={form.tarifa}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => set('tarifa', e.target.value)} />
              </div>
              <Input label="Proyectado Mensual (USD)" type="number" placeholder="0.00"
                value={form.proyectadoUsd}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => set('proyectadoUsd', e.target.value)} />
              {form.viajesMes && form.tarifa && (
                <div className="p-3 rounded-lg" style={{ background: tokens.colors.blueBg, border: `1px solid ${tokens.colors.blue}33` }}>
                  <p className="text-xs" style={{ color: tokens.colors.textSecondary }}>Cálculo automático</p>
                  <p className="text-lg font-bold" style={{ color: tokens.colors.blue, fontFamily: tokens.fonts.heading }}>
                    ${(parseFloat(form.viajesMes) * parseFloat(form.tarifa)).toLocaleString('en-US', { minimumFractionDigits: 2 })} USD/mes
                  </p>
                </div>
              )}
            </div>

            <SectionTitle>Hitos del Cliente</SectionTitle>
            <div className="space-y-2 mb-5">
              {HITOS.map((h) => (
                <label key={h.key} className="flex items-center gap-3 p-2 rounded-lg cursor-pointer transition-colors"
                  style={{ background: form.hitos[h.key] ? tokens.colors.greenBg : 'transparent' }}>
                  <input type="checkbox" checked={!!form.hitos[h.key]}
                    onChange={(e) => set('hitos', { ...form.hitos, [h.key]: e.target.checked })}
                    className="rounded" style={{ accentColor: tokens.colors.green }} />
                  <span className="text-sm" style={{
                    color: form.hitos[h.key] ? tokens.colors.green : tokens.colors.textSecondary,
                    fontFamily: tokens.fonts.body,
                  }}>{h.label}</span>
                </label>
              ))}
            </div>

            {/* Duplicate warning */}
            {duplicates.length > 0 && (
              <div className="p-3 rounded-lg mb-3" style={{ background: tokens.colors.yellowBg, border: `1px solid ${tokens.colors.yellow}33` }}>
                <div className="flex items-center gap-2 mb-1">
                  <AlertCircle size={14} style={{ color: tokens.colors.yellow }} />
                  <p className="text-xs font-bold" style={{ color: tokens.colors.yellow }}>Posibles duplicados</p>
                </div>
                {duplicates.map((d, i) => (
                  <p key={i} className="text-xs ml-5" style={{ color: tokens.colors.textSecondary }}>{d}</p>
                ))}
              </div>
            )}

            {error && (
              <div className="p-3 rounded-lg mb-3" style={{ background: tokens.colors.redBg, border: `1px solid ${tokens.colors.red}33` }}>
                <div className="flex items-center gap-2">
                  <AlertCircle size={14} style={{ color: tokens.colors.red }} />
                  <p className="text-xs" style={{ color: tokens.colors.red }}>{error}</p>
                </div>
              </div>
            )}

            {success && (
              <div className="p-3 rounded-lg mb-3" style={{ background: tokens.colors.greenBg, border: `1px solid ${tokens.colors.green}33` }}>
                <div className="flex items-center gap-2">
                  <CheckCircle size={14} style={{ color: tokens.colors.green }} />
                  <p className="text-xs" style={{ color: tokens.colors.green }}>Lead guardado. Redirigiendo...</p>
                </div>
              </div>
            )}
          </Card>
        </div>

        {/* FOOTER */}
        <div className="flex items-center justify-between mt-4 px-1">
          <div className="flex items-center gap-4">
            <p className="text-xs" style={{ color: tokens.colors.textMuted }}>
              Vendedor: <span style={{ color: tokens.colors.textSecondary }}>{user?.email || '—'}</span>
            </p>
            <p className="text-xs" style={{ color: tokens.colors.textMuted }}>
              Fecha: <span style={{ color: tokens.colors.textSecondary }}>{new Date().toLocaleDateString('es-MX')}</span>
            </p>
          </div>
          <div className="flex gap-2">
            <Button variant="secondary" onClick={() => navigate('/ventas/mis-leads')} disabled={saving}>
              Cancelar
            </Button>
            <Button variant="primary" disabled={saving || success} loading={saving}>
              {saving ? 'Guardando...' : 'Guardar Lead'}
            </Button>
          </div>
        </div>
      </form>
    </ModuleLayout>
  )
}
