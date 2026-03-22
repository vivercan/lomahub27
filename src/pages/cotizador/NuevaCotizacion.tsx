import { useState, useEffect, useMemo } from 'react'
import { Upload, MapPin, Globe, AlertTriangle, Plus, X, Calculator, FileText } from 'lucide-react'
import { ModuleLayout } from '../../components/layout/ModuleLayout'
import { Card } from '../../components/ui/Card'
import { Button } from '../../components/ui/Button'
import { Input } from '../../components/ui/Input'
import { Select } from '../../components/ui/Select'
import { tokens } from '../../lib/tokens'
import { supabase } from '../../lib/supabase'
import type { ReactNode } from 'react'

/* ── Types ──────────────────────────────────────────── */
interface SelectOption { value: string; label: string }
interface TarifaMX { id: string; rango_km_min: number; rango_km_max: number; tarifa_por_km: number; tipo_equipo: string }
interface TarifaUSA { id: string; rango_millas_min: number; rango_millas_max: number; tarifa_por_milla: number; tipo_equipo: string }
interface Cruce { id: string; nombre: string; ciudad_mx: string; ciudad_usa: string; tarifa_cruce: number; tarifa_cruce_hazmat: number }
interface Accesorial { id: string; codigo: string; nombre: string; monto_default: number; moneda: string; tipo: string }

type TipoOp = 'NAC_MX' | 'IMPO' | 'EXPO' | 'TRANSBORDO' | 'DOM_USA' | 'DTD'
type Moneda = 'MXN' | 'USD'

const TIPO_OP_OPTIONS: SelectOption[] = [
  { value: '', label: 'Seleccionar...' },
  { value: 'NAC_MX', label: 'Nacional México' },
  { value: 'IMPO', label: 'Importación (USA → MX)' },
  { value: 'EXPO', label: 'Exportación (MX → USA)' },
  { value: 'TRANSBORDO', label: 'Transbordo (cruce sin entrar)' },
  { value: 'DOM_USA', label: 'Doméstico USA' },
  { value: 'DTD', label: 'Door-to-Door (MX ↔ USA completo)' },
]

const TIPO_EQUIPO_OPTIONS: SelectOption[] = [
  { value: 'seco', label: 'Seco' },
  { value: 'refrigerado', label: 'Refrigerado' },
  { value: 'plataforma', label: 'Plataforma' },
  { value: 'lowboy', label: 'Lowboy' },
]

const MONEDA_OPTIONS: SelectOption[] = [
  { value: 'USD', label: 'USD (Dólares)' },
  { value: 'MXN', label: 'MXN (Pesos)' },
]

/* ── Helpers ─────────────────────────────────────────── */
function needsTramoMX(t: TipoOp) { return ['NAC_MX','IMPO','EXPO','DTD'].includes(t) }
function needsCruce(t: TipoOp) { return ['IMPO','EXPO','TRANSBORDO','DTD'].includes(t) }
function needsTramoUSA(t: TipoOp) { return ['DOM_USA','IMPO','EXPO','DTD'].includes(t) }

function lookupTarifaMX(km: number, equipo: string, tarifas: TarifaMX[]): number {
  const row = tarifas.find(t => t.tipo_equipo === equipo && km >= t.rango_km_min && km < t.rango_km_max)
  return row ? row.tarifa_por_km * km : 0
}
function lookupTarifaUSA(mi: number, equipo: string, tarifas: TarifaUSA[]): number {
  const row = tarifas.find(t => t.tipo_equipo === equipo && mi >= t.rango_millas_min && mi < t.rango_millas_max)
  return row ? row.tarifa_por_milla * mi : 0
}

/* ── Section title ──────────────────────────────────── */
function SectionTitle({ icon, children }: { icon: ReactNode; children: ReactNode }) {
  return (
    <div className="flex items-center gap-2 mb-3">
      {icon}
      <h3 style={{ color: tokens.colors.textPrimary, fontFamily: tokens.fonts.heading, fontSize: '1rem', fontWeight: 700 }}>
        {children}
      </h3>
    </div>
  )
}

/* ── COMPONENT ──────────────────────────────────────── */
export default function NuevaCotizacion() {
  /* catalogs */
  const [clienteOpts, setClienteOpts] = useState<SelectOption[]>([{ value: '', label: 'Seleccionar cliente...' }])
  const [tarifasMX, setTarifasMX] = useState<TarifaMX[]>([])
  const [tarifasUSA, setTarifasUSA] = useState<TarifaUSA[]>([])
  const [cruces, setCruces] = useState<Cruce[]>([])
  const [accesoriales, setAccesoriales] = useState<Accesorial[]>([])

  /* form */
  const [cliente, setCliente] = useState('')
  const [tipoOp, setTipoOp] = useState<TipoOp | ''>('')
  const [tipoEquipo, setTipoEquipo] = useState('seco')
  const [moneda, setMoneda] = useState<Moneda>('USD')
  const [hazmat, setHazmat] = useState(false)
  const [origen, setOrigen] = useState('')
  const [destino, setDestino] = useState('')
  const [distanciaKm, setDistanciaKm] = useState('')
  const [distanciaMillas, setDistanciaMillas] = useState('')
  const [cruceId, setCruceId] = useState('')
  const [selectedAcc, setSelectedAcc] = useState<string[]>([])
  const [notas, setNotas] = useState('')
  const [file, setFile] = useState<File | null>(null)
  const [fxRate] = useState(17.88) // TODO: fetch real rate from API
  const [saving, setSaving] = useState(false)

  /* validation */
  const [errors, setErrors] = useState<string[]>([])

  /* ── Fetch catalogs on mount ── */
  useEffect(() => {
    async function load() {
      const [rCli, rMX, rUSA, rCr, rAcc] = await Promise.all([
        supabase.from('clientes').select('id, nombre').order('nombre'),
        supabase.from('tarifas_mx').select('*').eq('activo', true).order('rango_km_min'),
        supabase.from('tarifas_usa').select('*').eq('activo', true).order('rango_millas_min'),
        supabase.from('cruces').select('*').eq('activo', true).order('nombre'),
        supabase.from('accesoriales').select('*').eq('activo', true).order('codigo'),
      ])
      if (rCli.data) setClienteOpts([{ value: '', label: 'Seleccionar cliente...' }, ...rCli.data.map(c => ({ value: c.id, label: c.nombre || 'Sin nombre' }))])
      if (rMX.data) setTarifasMX(rMX.data as TarifaMX[])
      if (rUSA.data) setTarifasUSA(rUSA.data as TarifaUSA[])
      if (rCr.data) setCruces(rCr.data as Cruce[])
      if (rAcc.data) setAccesoriales(rAcc.data as Accesorial[])
    }
    load()
  }, [])

  /* ── Cruce options ── */
  const cruceOpts: SelectOption[] = useMemo(() => [
    { value: '', label: 'Seleccionar cruce...' },
    ...cruces.map(c => ({ value: c.id, label: `${c.nombre} (${c.ciudad_mx} ↔ ${c.ciudad_usa})` })),
  ], [cruces])

  /* ── Pricing calculation ── */
  const calc = useMemo(() => {
    if (!tipoOp) return { tramoMX: 0, cruce: 0, tramoUSA: 0, accTotal: 0, total: 0 }
    const km = parseFloat(distanciaKm) || 0
    const mi = parseFloat(distanciaMillas) || 0
    const tramoMX = needsTramoMX(tipoOp as TipoOp) ? lookupTarifaMX(km, tipoEquipo, tarifasMX) : 0
    const selectedCruce = cruces.find(c => c.id === cruceId)
    const cruceCost = needsCruce(tipoOp as TipoOp) && selectedCruce
      ? (hazmat ? selectedCruce.tarifa_cruce_hazmat : selectedCruce.tarifa_cruce)
      : 0
    const tramoUSA = needsTramoUSA(tipoOp as TipoOp) ? lookupTarifaUSA(mi, tipoEquipo, tarifasUSA) : 0
    const accTotal = selectedAcc.reduce((sum, accId) => {
      const acc = accesoriales.find(a => a.id === accId)
      if (!acc) return sum
      const amt = acc.moneda === moneda ? acc.monto_default
        : moneda === 'USD' ? acc.monto_default / fxRate
        : acc.monto_default * fxRate
      return sum + amt
    }, 0)
    return { tramoMX, cruce: cruceCost, tramoUSA, accTotal, total: tramoMX + cruceCost + tramoUSA + accTotal }
  }, [tipoOp, distanciaKm, distanciaMillas, tipoEquipo, cruceId, hazmat, selectedAcc, moneda, tarifasMX, tarifasUSA, cruces, accesoriales, fxRate])

  /* ── Validations ── */
  function validate(): string[] {
    const e: string[] = []
    if (!cliente) e.push('Selecciona un cliente')
    if (!tipoOp) e.push('Selecciona tipo de operación')
    if (!origen.trim()) e.push('Ingresa origen')
    if (!destino.trim()) e.push('Ingresa destino')
    if (tipoOp && needsTramoMX(tipoOp as TipoOp) && !(parseFloat(distanciaKm) > 0)) e.push('Ingresa distancia en km (tramo MX)')
    if (tipoOp && needsTramoUSA(tipoOp as TipoOp) && !(parseFloat(distanciaMillas) > 0)) e.push('Ingresa distancia en millas (tramo USA)')
    if (tipoOp && needsCruce(tipoOp as TipoOp) && !cruceId) e.push('Selecciona un cruce fronterizo')
    if (hazmat && tipoOp === 'DTD') e.push('Hazmat + Door-to-Door no permitido (restricción operativa)')
    if (hazmat && tipoOp === 'IMPO') {
      const cr = cruces.find(c => c.id === cruceId)
      if (cr && cr.nombre === 'Laredo') e.push('Hazmat vía Laredo → interior USA bloqueado (restricción aduanal)')
    }
    return e
  }

  /* ── Submit ── */
  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    const v = validate()
    if (v.length) { setErrors(v); return }
    setErrors([])
    setSaving(true)
    try {
      const { data, error } = await supabase.from('cotizaciones').insert({
        cliente_id: cliente,
        tipo_operacion: tipoOp,
        moneda,
        hazmat,
        total: calc.total,
      }).select('id').single()
      if (error) throw error
      if (data && tipoOp) {
        await supabase.from('cotizacion_rutas').insert({
          cotizacion_id: data.id,
          origen, destino,
          tipo_operacion: tipoOp,
          distancia_km: parseFloat(distanciaKm) || null,
          distancia_millas: parseFloat(distanciaMillas) || null,
          cruce: cruces.find(c => c.id === cruceId)?.nombre || null,
          tarifa_tramo_mx: calc.tramoMX,
          tarifa_cruce: calc.cruce,
          tarifa_tramo_usa: calc.tramoUSA,
          accesoriales_total: calc.accTotal,
          subtotal: calc.total,
          moneda, hazmat, notas,
        })
      }
      alert('Cotización guardada exitosamente')
    } catch (err) {
      console.error('Error guardando cotización:', err)
      alert('Error al guardar. Verifica consola.')
    } finally {
      setSaving(false)
    }
  }

  /* ── Toggle accesorial ── */
  function toggleAcc(id: string) {
    setSelectedAcc(prev => prev.includes(id) ? prev.filter(a => a !== id) : [...prev, id])
  }

  /* ── Render ── */
  const op = tipoOp as TipoOp
  const showMX = tipoOp && needsTramoMX(op)
  const showCruce = tipoOp && needsCruce(op)
  const showUSA = tipoOp && needsTramoUSA(op)

  return (
    <ModuleLayout titulo="Nueva Cotización" subtitulo="Cotizador cross-border V28">
      <form onSubmit={handleSubmit}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 340px', gap: '1.25rem', maxHeight: 'calc(100vh - 140px)', overflow: 'hidden' }}>

          {/* ── LEFT COLUMN: Form ── */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', overflowY: 'auto', paddingRight: 8 }}>

            {/* Card 1: General */}
            <Card>
              <SectionTitle icon={<FileText size={16} style={{ color: tokens.colors.primary }} />}>Datos Generales</SectionTitle>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                <Select label="Cliente" options={clienteOpts} value={cliente}
                  onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setCliente(e.target.value)} required />
                <Select label="Tipo Operación" options={TIPO_OP_OPTIONS} value={tipoOp}
                  onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setTipoOp(e.target.value as TipoOp | '')} required />
                <Select label="Tipo Equipo" options={TIPO_EQUIPO_OPTIONS} value={tipoEquipo}
                  onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setTipoEquipo(e.target.value)} />
                <Select label="Moneda" options={MONEDA_OPTIONS} value={moneda}
                  onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setMoneda(e.target.value as Moneda)} />
              </div>
              <div className="mt-3 flex items-center gap-3">
                <label className="flex items-center gap-2 cursor-pointer" style={{ color: tokens.colors.textSecondary, fontFamily: tokens.fonts.body, fontSize: '0.85rem' }}>
                  <input type="checkbox" checked={hazmat} onChange={e => setHazmat(e.target.checked)}
                    style={{ width: 18, height: 18, accentColor: tokens.colors.yellow }} />
                  <AlertTriangle size={14} style={{ color: hazmat ? tokens.colors.yellow : tokens.colors.textMuted }} />
                  Carga Hazmat
                </label>
                {hazmat && (
                  <span style={{ color: tokens.colors.yellow, fontFamily: tokens.fonts.body, fontSize: '0.75rem', background: `${tokens.colors.yellow}1a`, padding: '2px 8px', borderRadius: 6 }}>
                    Aplica tarifa cruce hazmat
                  </span>
                )}
              </div>
            </Card>

            {/* Card 2: Ruta */}
            <Card>
              <SectionTitle icon={<MapPin size={16} style={{ color: tokens.colors.green }} />}>Ruta y Distancias</SectionTitle>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                <Input label="Origen" placeholder="Ciudad / Terminal origen" value={origen}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => setOrigen(e.target.value)} />
                <Input label="Destino" placeholder="Ciudad / Terminal destino" value={destino}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => setDestino(e.target.value)} />
              </div>
              {tipoOp && (
                <div style={{ display: 'grid', gridTemplateColumns: showMX && showUSA ? '1fr 1fr 1fr' : showCruce ? '1fr 1fr' : '1fr', gap: '0.75rem', marginTop: '0.75rem' }}>
                  {showMX && (
                    <Input label="Distancia MX (km)" type="number" placeholder="0" value={distanciaKm}
                      onChange={(e: React.ChangeEvent<HTMLInputElement>) => setDistanciaKm(e.target.value)} />
                  )}
                  {showCruce && (
                    <Select label="Cruce Fronterizo" options={cruceOpts} value={cruceId}
                      onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setCruceId(e.target.value)} />
                  )}
                  {showUSA && (
                    <Input label="Distancia USA (millas)" type="number" placeholder="0" value={distanciaMillas}
                      onChange={(e: React.ChangeEvent<HTMLInputElement>) => setDistanciaMillas(e.target.value)} />
                  )}
                </div>
              )}
            </Card>

            {/* Card 3: Accesoriales */}
            <Card>
              <SectionTitle icon={<Plus size={16} style={{ color: tokens.colors.blue }} />}>Accesoriales</SectionTitle>
              {accesoriales.length === 0 ? (
                <p style={{ color: tokens.colors.textMuted, fontFamily: tokens.fonts.body, fontSize: '0.8rem' }}>
                  Sin accesoriales disponibles. Ejecutar migración 012 en Supabase.
                </p>
              ) : (
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.4rem' }}>
                  {accesoriales.map(acc => {
                    const active = selectedAcc.includes(acc.id)
                    return (
                      <button key={acc.id} type="button" onClick={() => toggleAcc(acc.id)}
                        style={{
                          padding: '4px 10px', borderRadius: 8, fontSize: '0.75rem',
                          fontFamily: tokens.fonts.body, cursor: 'pointer', transition: 'all 0.15s',
                          border: `1px solid ${active ? tokens.colors.primary : tokens.colors.border}`,
                          background: active ? `${tokens.colors.primary}22` : 'transparent',
                          color: active ? tokens.colors.primary : tokens.colors.textSecondary,
                        }}>
                        {active && <X size={10} style={{ marginRight: 3, display: 'inline' }} />}
                        {acc.codigo} — ${acc.monto_default} {acc.moneda}
                      </button>
                    )
                  })}
                </div>
              )}
            </Card>

            {/* Card 4: Notas + PDF */}
            <Card>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                <div>
                  <label style={{ display: 'block', marginBottom: 4, color: tokens.colors.textSecondary, fontFamily: tokens.fonts.body, fontSize: '0.8rem' }}>Notas</label>
                  <textarea value={notas} onChange={e => setNotas(e.target.value)} rows={3} placeholder="Notas adicionales..."
                    style={{ width: '100%', background: tokens.colors.bgHover, border: `1px solid ${tokens.colors.border}`, borderRadius: 8, padding: 8, color: tokens.colors.textPrimary, fontFamily: tokens.fonts.body, fontSize: '0.85rem', resize: 'none' }} />
                </div>
                <div>
                  <label style={{ display: 'block', marginBottom: 4, color: tokens.colors.textSecondary, fontFamily: tokens.fonts.body, fontSize: '0.8rem' }}>PDF del Cliente</label>
                  <div style={{ border: `2px dashed ${tokens.colors.border}`, borderRadius: 8, padding: '1rem', textAlign: 'center', background: tokens.colors.bgHover, cursor: 'pointer' }}
                    onDragOver={e => { e.preventDefault(); e.stopPropagation() }}
                    onDrop={e => { e.preventDefault(); e.stopPropagation(); if (e.dataTransfer.files?.[0]) setFile(e.dataTransfer.files[0]) }}>
                    <input type="file" accept=".pdf" onChange={e => { if (e.target.files?.[0]) setFile(e.target.files[0]) }} className="hidden" id="pdf-upload" />
                    <label htmlFor="pdf-upload" className="cursor-pointer block">
                      <Upload size={20} style={{ margin: '0 auto 4px', opacity: 0.5, color: tokens.colors.textMuted }} />
                      <p style={{ color: tokens.colors.textSecondary, fontFamily: tokens.fonts.body, fontSize: '0.75rem' }}>
                        {file ? file.name : 'Arrastra PDF o clic'}
                      </p>
                    </label>
                  </div>
                </div>
              </div>
            </Card>
          </div>

          {/* ── RIGHT COLUMN: Summary ── */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>

            {/* Pricing breakdown */}
            <Card>
              <SectionTitle icon={<Calculator size={16} style={{ color: tokens.colors.green }} />}>Desglose de Precio</SectionTitle>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                {showMX && (
                  <Row label={`Tramo MX (${distanciaKm || 0} km)`} value={calc.tramoMX} moneda={moneda} />
                )}
                {showCruce && (
                  <Row label={`Cruce ${cruces.find(c => c.id === cruceId)?.nombre || '—'}${hazmat ? ' (Hazmat)' : ''}`} value={calc.cruce} moneda={moneda} />
                )}
                {showUSA && (
                  <Row label={`Tramo USA (${distanciaMillas || 0} mi)`} value={calc.tramoUSA} moneda={moneda} />
                )}
                {calc.accTotal > 0 && (
                  <Row label={`Accesoriales (${selectedAcc.length})`} value={calc.accTotal} moneda={moneda} />
                )}
                <div style={{ borderTop: `1px solid ${tokens.colors.border}`, paddingTop: 8, marginTop: 4 }}>
                  <div className="flex justify-between items-center">
                    <span style={{ color: tokens.colors.textPrimary, fontFamily: tokens.fonts.heading, fontSize: '0.95rem', fontWeight: 700 }}>TOTAL</span>
                    <span style={{ color: tokens.colors.green, fontFamily: tokens.fonts.heading, fontSize: '1.4rem', fontWeight: 700 }}>
                      {moneda === 'USD' ? '$' : 'MX$'}{calc.total.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} {moneda}
                    </span>
                  </div>
                </div>
              </div>
            </Card>

            {/* FX Reference */}
            <Card>
              <div className="flex justify-between items-center">
                <span style={{ color: tokens.colors.textMuted, fontFamily: tokens.fonts.body, fontSize: '0.75rem' }}>
                  <Globe size={12} style={{ display: 'inline', marginRight: 4 }} />TC Referencia
                </span>
                <span style={{ color: tokens.colors.textSecondary, fontFamily: tokens.fonts.body, fontSize: '0.85rem', fontWeight: 600 }}>
                  1 USD = ${fxRate} MXN
                </span>
              </div>
              {moneda === 'MXN' && calc.total > 0 && (
                <p style={{ color: tokens.colors.textMuted, fontFamily: tokens.fonts.body, fontSize: '0.7rem', marginTop: 4 }}>
                  Equivalente: ~${(calc.total / fxRate).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} USD
                </p>
              )}
              {moneda === 'USD' && calc.total > 0 && (
                <p style={{ color: tokens.colors.textMuted, fontFamily: tokens.fonts.body, fontSize: '0.7rem', marginTop: 4 }}>
                  Equivalente: ~MX${(calc.total * fxRate).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} MXN
                </p>
              )}
            </Card>

            {/* Operation type badge */}
            {tipoOp && (
              <Card>
                <div className="text-center">
                  <span style={{
                    display: 'inline-block', padding: '4px 14px', borderRadius: 20,
                    background: `${tokens.colors.primary}22`, color: tokens.colors.primary,
                    fontFamily: tokens.fonts.heading, fontSize: '0.8rem', fontWeight: 700, letterSpacing: '0.5px',
                  }}>
                    {TIPO_OP_OPTIONS.find(o => o.value === tipoOp)?.label}
                  </span>
                  {hazmat && (
                    <span style={{
                      display: 'inline-block', marginLeft: 8, padding: '4px 10px', borderRadius: 20,
                      background: `${tokens.colors.yellow}22`, color: tokens.colors.yellow,
                      fontFamily: tokens.fonts.body, fontSize: '0.7rem', fontWeight: 600,
                    }}>
                      HAZMAT
                    </span>
                  )}
                </div>
              </Card>
            )}

            {/* Errors */}
            {errors.length > 0 && (
              <Card>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                  {errors.map((err, i) => (
                    <p key={i} style={{ color: tokens.colors.red, fontFamily: tokens.fonts.body, fontSize: '0.75rem' }}>
                      <AlertTriangle size={12} style={{ display: 'inline', marginRight: 4 }} />{err}
                    </p>
                  ))}
                </div>
              </Card>
            )}

            {/* Submit */}
            <Button variant="primary" className="w-full" disabled={saving}>
              {saving ? 'Guardando...' : 'Guardar Cotización'}
            </Button>
          </div>
        </div>
      </form>
    </ModuleLayout>
  )
}

/* ── Row helper ── */
function Row({ label, value, moneda }: { label: string; value: number; moneda: Moneda }) {
  return (
    <div className="flex justify-between items-center">
      <span style={{ color: tokens.colors.textSecondary, fontFamily: tokens.fonts.body, fontSize: '0.8rem' }}>{label}</span>
      <span style={{ color: tokens.colors.textPrimary, fontFamily: tokens.fonts.body, fontSize: '0.85rem', fontWeight: 600 }}>
        {moneda === 'USD' ? '$' : 'MX$'}{value.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
      </span>
    </div>
  )
}
