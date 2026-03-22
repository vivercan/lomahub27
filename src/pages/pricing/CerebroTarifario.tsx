import { useState, useEffect } from 'react'
import type { ReactNode } from 'react'
import { DollarSign, TrendingUp, Truck, MapPin, Package, Search, RefreshCw, Globe, Flag } from 'lucide-react'
import { ModuleLayout } from '../../components/layout/ModuleLayout'
import { Card } from '../../components/ui/Card'
import { Button } from '../../components/ui/Button'
import { Badge } from '../../components/ui/Badge'
import { KPICard } from '../../components/ui/KPICard'
import { DataTable, type Column } from '../../components/ui/DataTable'
import { tokens } from '../../lib/tokens'
import { supabase } from '../../lib/supabase'

/* ââ Interfaces ââ */
interface TarifaMX {
  id: string
  rango_km_min: number
  rango_km_max: number
  tarifa_por_km: number
  tipo_equipo: string
  empresa: string | null
  descripcion: string | null
  activo: boolean
}

interface TarifaUSA {
  id: string
  rango_millas_min: number
  rango_millas_max: number
  tarifa_por_milla: number
  tipo_equipo: string
  empresa: string | null
  descripcion: string | null
  activo: boolean
}

interface Cruce {
  id: string
  nombre: string
  ciudad_mx: string
  ciudad_usa: string
  estado_mx: string | null
  estado_usa: string | null
  tarifa_cruce: number
  tarifa_cruce_hazmat: number
  tiempo_promedio_hrs: number
  restricciones: string | null
  activo: boolean
}

interface Accesorial {
  id: string
  codigo: string
  nombre: string
  descripcion: string | null
  monto_default: number
  moneda: string
  tipo: string
  aplica_a: string
  activo: boolean
}

type TabKey = 'mx' | 'usa' | 'cruces' | 'accesoriales'

const TABS: { key: TabKey; label: string; icon: ReactNode }[] = [
  { key: 'mx', label: 'Tarifas MX', icon: <Flag size={15} /> },
  { key: 'usa', label: 'Tarifas USA', icon: <Globe size={15} /> },
  { key: 'cruces', label: 'Cruces', icon: <MapPin size={15} /> },
  { key: 'accesoriales', label: 'Accesoriales', icon: <Package size={15} /> },
]

const equipoBadge: Record<string, 'primary' | 'blue' | 'green' | 'orange'> = {
  seco: 'primary',
  refrigerado: 'blue',
  plataforma: 'green',
  lowboy: 'orange',
}

const tipoBadge: Record<string, 'primary' | 'green' | 'yellow' | 'orange'> = {
  fijo: 'primary',
  por_hora: 'green',
  por_dia: 'yellow',
  porcentaje: 'orange',
}

const fmtUSD = (n: number) => `US$${n.toLocaleString('en-US', { minimumFractionDigits: 2 })}`
const fmtMXN = (n: number) => `$${n.toLocaleString('es-MX', { minimumFractionDigits: 2 })}`
const fmtMoney = (n: number, mon: string) => mon === 'USD' ? fmtUSD(n) : fmtMXN(n)

export default function CerebroTarifario() {
  const [tab, setTab] = useState<TabKey>('mx')
  const [loading, setLoading] = useState(true)
  const [busqueda, setBusqueda] = useState('')

  const [tarifasMX, setTarifasMX] = useState<TarifaMX[]>([])
  const [tarifasUSA, setTarifasUSA] = useState<TarifaUSA[]>([])
  const [cruces, setCruces] = useState<Cruce[]>([])
  const [accesoriales, setAccesoriales] = useState<Accesorial[]>([])

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

  /* ââ KPIs ââ */
  const totalTarifas = tarifasMX.length + tarifasUSA.length
  const totalCruces = cruces.length
  const totalAccesoriales = accesoriales.length
  const promedioKm = tarifasMX.length > 0
    ? (tarifasMX.reduce((s, t) => s + t.tarifa_por_km, 0) / tarifasMX.length).toFixed(2)
    : '0'

  /* ââ Columns MX ââ */
  const colsMX: Column<TarifaMX>[] = [
    {
      key: 'rango', label: 'Rango KM', width: '180px',
      render: (r) => (
        <span style={{ color: tokens.colors.textPrimary, fontFamily: tokens.fonts.body, fontSize: '13px', fontWeight: 600 }}>
          {r.rango_km_min.toLocaleString()} â {r.rango_km_max >= 99000 ? 'â' : r.rango_km_max.toLocaleString()} km
        </span>
      )
    },
    {
      key: 'tarifa_por_km', label: 'Tarifa/km', width: '120px', align: 'right',
      render: (r) => (
        <span style={{ color: tokens.colors.green, fontFamily: tokens.fonts.body, fontWeight: 700, fontSize: '14px' }}>
          {fmtMXN(r.tarifa_por_km)}
        </span>
      )
    },
    {
      key: 'tipo_equipo', label: 'Equipo', width: '130px',
      render: (r) => <Badge color={equipoBadge[r.tipo_equipo] || 'gray'}>{r.tipo_equipo}</Badge>
    },
    {
      key: 'descripcion', label: 'DescripciÃ³n',
      render: (r) => (
        <span style={{ color: tokens.colors.textSecondary, fontFamily: tokens.fonts.body, fontSize: '12px' }}>
          {r.descripcion || 'â'}
        </span>
      )
    },
  ]

  /* ââ Columns USA ââ */
  const colsUSA: Column<TarifaUSA>[] = [
    {
      key: 'rango', label: 'Rango Millas', width: '180px',
      render: (r) => (
        <span style={{ color: tokens.colors.textPrimary, fontFamily: tokens.fonts.body, fontSize: '13px', fontWeight: 600 }}>
          {r.rango_millas_min.toLocaleString()} â {r.rango_millas_max >= 99000 ? 'â' : r.rango_millas_max.toLocaleString()} mi
        </span>
      )
    },
    {
      key: 'tarifa_por_milla', label: 'Tarifa/milla', width: '130px', align: 'right',
      render: (r) => (
        <span style={{ color: tokens.colors.green, fontFamily: tokens.fonts.body, fontWeight: 700, fontSize: '14px' }}>
          {fmtUSD(r.tarifa_por_milla)}
        </span>
      )
    },
    {
      key: 'tipo_equipo', label: 'Equipo', width: '130px',
      render: (r) => <Badge color={equipoBadge[r.tipo_equipo] || 'gray'}>{r.tipo_equipo}</Badge>
    },
    {
      key: 'descripcion', label: 'DescripciÃ³n',
      render: (r) => (
        <span style={{ color: tokens.colors.textSecondary, fontFamily: tokens.fonts.body, fontSize: '12px' }}>
          {r.descripcion || 'â'}
        </span>
      )
    },
  ]

  /* ââ Columns Cruces ââ */
  const colsCruces: Column<Cruce>[] = [
    {
      key: 'nombre', label: 'Cruce', width: '160px',
      render: (r) => (
        <span style={{ color: tokens.colors.textPrimary, fontFamily: tokens.fonts.body, fontSize: '13px', fontWeight: 700 }}>
          {r.nombre}
        </span>
      )
    },
    {
      key: 'ruta', label: 'MX â USA',
      render: (r) => (
        <div>
          <span style={{ color: tokens.colors.textPrimary, fontFamily: tokens.fonts.body, fontSize: '13px' }}>
            {r.ciudad_mx}, {r.estado_mx}
          </span>
          <span style={{ color: tokens.colors.textMuted, margin: '0 6px' }}>â</span>
          <span style={{ color: tokens.colors.textPrimary, fontFamily: tokens.fonts.body, fontSize: '13px' }}>
            {r.ciudad_usa}, {r.estado_usa}
          </span>
        </div>
      )
    },
    {
      key: 'tarifa_cruce', label: 'Tarifa', width: '120px', align: 'right',
      render: (r) => (
        <span style={{ color: tokens.colors.green, fontFamily: tokens.fonts.body, fontWeight: 700, fontSize: '14px' }}>
          {fmtUSD(r.tarifa_cruce)}
        </span>
      )
    },
    {
      key: 'tarifa_cruce_hazmat', label: 'HAZMAT', width: '120px', align: 'right',
      render: (r) => (
        <span style={{ color: tokens.colors.orange, fontFamily: tokens.fonts.body, fontWeight: 700, fontSize: '14px' }}>
          {fmtUSD(r.tarifa_cruce_hazmat)}
        </span>
      )
    },
    {
      key: 'tiempo_promedio_hrs', label: 'Tiempo', width: '90px', align: 'center',
      render: (r) => <Badge color="primary">{r.tiempo_promedio_hrs}h</Badge>
    },
  ]

  /* ââ Columns Accesoriales ââ */
  const colsAcc: Column<Accesorial>[] = [
    {
      key: 'codigo', label: 'CÃ³digo', width: '150px',
      render: (r) => (
        <span style={{ color: tokens.colors.primary, fontFamily: tokens.fonts.body, fontSize: '13px', fontWeight: 700 }}>
          {r.codigo}
        </span>
      )
    },
    {
      key: 'nombre', label: 'Concepto',
      render: (r) => (
        <div>
          <div style={{ color: tokens.colors.textPrimary, fontFamily: tokens.fonts.body, fontSize: '13px', fontWeight: 600 }}>
            {r.nombre}
          </div>
          {r.descripcion && (
            <div style={{ color: tokens.colors.textMuted, fontFamily: tokens.fonts.body, fontSize: '11px' }}>
              {r.descripcion}
            </div>
          )}
        </div>
      )
    },
    {
      key: 'monto_default', label: 'Monto', width: '130px', align: 'right',
      render: (r) => (
        <span style={{ color: tokens.colors.green, fontFamily: tokens.fonts.body, fontWeight: 700, fontSize: '14px' }}>
          {fmtMoney(r.monto_default, r.moneda)}
        </span>
      )
    },
    {
      key: 'tipo', label: 'Tipo', width: '110px',
      render: (r) => <Badge color={tipoBadge[r.tipo] || 'gray'}>{r.tipo.replace('_', '/')}</Badge>
    },
    {
      key: 'aplica_a', label: 'Aplica', width: '100px',
      render: (r) => (
        <span style={{ color: tokens.colors.textSecondary, fontFamily: tokens.fonts.body, fontSize: '12px', textTransform: 'uppercase' }}>
          {r.aplica_a}
        </span>
      )
    },
  ]

  /* ââ Filter by search ââ */
  const q = busqueda.toLowerCase()
  const filteredMX = tarifasMX.filter(t => !q || (t.descripcion || '').toLowerCase().includes(q) || t.tipo_equipo.includes(q))
  const filteredUSA = tarifasUSA.filter(t => !q || (t.descripcion || '').toLowerCase().includes(q) || t.tipo_equipo.includes(q))
  const filteredCruces = cruces.filter(c => !q || c.nombre.toLowerCase().includes(q) || c.ciudad_mx.toLowerCase().includes(q) || c.ciudad_usa.toLowerCase().includes(q))
  const filteredAcc = accesoriales.filter(a => !q || a.codigo.toLowerCase().includes(q) || a.nombre.toLowerCase().includes(q))

  const tableMap = {
    mx: { columns: colsMX, data: filteredMX, empty: 'Sin tarifas MX â ejecutar migraciÃ³n SQL' },
    usa: { columns: colsUSA, data: filteredUSA, empty: 'Sin tarifas USA â ejecutar migraciÃ³n SQL' },
    cruces: { columns: colsCruces, data: filteredCruces, empty: 'Sin cruces fronterizos â ejecutar migraciÃ³n SQL' },
    accesoriales: { columns: colsAcc, data: filteredAcc, empty: 'Sin accesoriales â ejecutar migraciÃ³n SQL' },
  }

  const current = tableMap[tab]

  return (
    <ModuleLayout
      titulo="Cerebro Tarifario"
      subtitulo="Motor de pricing â tarifas MX/USA, cruces fronterizos y accesoriales"
      acciones={
        <div style={{ display: 'flex', gap: tokens.spacing.sm }}>
          <Button size="sm" variant="secondary" onClick={fetchAll}><RefreshCw size={16} /> Actualizar</Button>
        </div>
      }
    >
      {/* KPIs */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: tokens.spacing.md, marginBottom: tokens.spacing.lg }}>
        <KPICard titulo="Tarifas Activas" valor={totalTarifas} subtitulo={`${tarifasMX.length} MX + ${tarifasUSA.length} USA`} color="primary" icono={<DollarSign size={20} />} />
        <KPICard titulo="Promedio MX" valor={`$${promedioKm}/km`} subtitulo="tarifa promedio por km" color="green" icono={<TrendingUp size={20} />} />
        <KPICard titulo="Cruces Activos" valor={totalCruces} subtitulo="puntos fronterizos" color="yellow" icono={<MapPin size={20} />} />
        <KPICard titulo="Accesoriales" valor={totalAccesoriales} subtitulo="conceptos configurados" color="blue" icono={<Package size={20} />} />
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
        <DataTable
          columns={current.columns as Column<Record<string, unknown>>[]}
          data={current.data as Record<string, unknown>[]}
          loading={loading}
          emptyMessage={current.empty}
        />
      </Card>
    </ModuleLayout>
  )
}
