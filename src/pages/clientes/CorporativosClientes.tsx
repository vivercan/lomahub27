// V5 (28/Abr/2026) — Listado clientes con estado derivado + venta MXN + sort
// JJ: NO existe "prospecto", todos son CLIENTES. Estado se deriva por actividad:
//   - activo: facturó últimos 30d
//   - vigente: 31-90d
//   - recuperar: +90d sin facturar
//   - sin_actividad: nunca ha facturado
// Columna VENTA MXN: SUM(tarifa) de formatos_venta × FX si USD
// Sort por click en cualquier encabezado.

import type { ReactElement } from 'react'
import { useState, useEffect, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { ModuleLayout } from '../../components/layout/ModuleLayout'
import { Card } from '../../components/ui/Card'
import { KPICard } from '../../components/ui/KPICard'
import { Badge } from '../../components/ui/Badge'
import { tokens } from '../../lib/tokens'
import { supabase } from '../../lib/supabase'
import { Building2, Users, TrendingUp, Activity, Search, ArrowUp, ArrowDown } from 'lucide-react'

interface ClienteRow {
  id: string
  razon_social: string
  estado_derivado: 'activo' | 'vigente' | 'recuperar' | 'sin_actividad'
  empresa: string | null
  vendedor_nombre: string | null
  cs_nombre: string | null
  cxc_nombre: string | null
  viajes_90d: number
  viajes_30d: number
  viajes_7d: number
  viajes_activos: number
  venta_mxn_12m: number
  ultimo_viaje: string | null
}

const EMPRESAS_VALIDAS = ['TROB', 'wexpress', 'SpeedyHaul']

const fmtFecha = (iso: string | null) => {
  if (!iso) return '—'
  try { return new Date(iso).toLocaleDateString('es-MX', { day: '2-digit', month: 'short', year: '2-digit' }) }
  catch { return '—' }
}
const fmtN = (n: number) => (n || 0).toLocaleString('en-US')
const fmtMxn = (n: number) => '$' + (n || 0).toLocaleString('en-US', { maximumFractionDigits: 0 })
const cap = (s: string | null) => {
  if (!s) return '—'
  return s.split(/[._-]/).map(p => p.charAt(0).toUpperCase() + p.slice(1).toLowerCase()).join(' ')
}
const empresaLabel = (e: string) => {
  if (e === 'wexpress') return 'WExpress'
  if (e === 'SpeedyHaul') return 'SpeedyHaul'
  return e.toUpperCase()
}
const estadoLabel = (e: string) => {
  if (e === 'activo') return 'Activo'
  if (e === 'vigente') return 'Vigente'
  if (e === 'recuperar') return 'Recuperar'
  return 'Sin actividad'
}
const estadoColor = (e: string): 'green' | 'blue' | 'orange' | 'gray' => {
  if (e === 'activo') return 'green'
  if (e === 'vigente') return 'blue'
  if (e === 'recuperar') return 'orange'
  return 'gray'
}

type SortKey = 'razon_social' | 'empresa' | 'estado_derivado' | 'vendedor_nombre' | 'cs_nombre' | 'cxc_nombre'
            | 'viajes_90d' | 'viajes_30d' | 'viajes_activos' | 'venta_mxn_12m' | 'ultimo_viaje'
type SortDir = 'asc' | 'desc'

export default function CorporativosClientes(): ReactElement {
  const navigate = useNavigate()
  const [clientes, setClientes] = useState<ClienteRow[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [filtroEstado, setFiltroEstado] = useState<string>('todos')
  const [filtroEmpresa, setFiltroEmpresa] = useState<string>('todas')
  const [filtroVendedor, setFiltroVendedor] = useState<string>('todos')
  const [sortKey, setSortKey] = useState<SortKey>('viajes_90d')
  const [sortDir, setSortDir] = useState<SortDir>('desc')

  useEffect(() => {
    const load = async () => {
      try {
        // FIX 76 — Source AAA: v_clientes_aaa une viajes_anodos histórico + master clientes (incluye huérfanos)
        const { data, error } = await supabase
          .from('v_clientes_aaa')
          .select('id, razon_social, estado_derivado, empresa, vendedor_nombre, cs_nombre, cxc_nombre, viajes_90d, viajes_30d, viajes_7d, viajes_activos, venta_mxn_12m, ultimo_viaje, viajes_total_history, solo_en_anodos')
        if (error) { console.error('Error v_clientes_con_ventas:', error); setClientes([]) }
        else setClientes((data || []) as ClienteRow[])
      } catch (err) { console.error(err); setClientes([]) }
      finally { setLoading(false) }
    }
    load()
  }, [])

  const empresas = useMemo(() => {
    const set = new Set<string>(); clientes.forEach(c => c.empresa && set.add(c.empresa))
    return Array.from(set).sort()
  }, [clientes])
  const vendedores = useMemo(() => {
    const set = new Set<string>(); clientes.forEach(c => c.vendedor_nombre && set.add(c.vendedor_nombre))
    return Array.from(set).sort()
  }, [clientes])

  const kpis = useMemo(() => ({
    total: clientes.length,
    activo: clientes.filter(c => c.estado_derivado === 'activo').length,
    vigente: clientes.filter(c => c.estado_derivado === 'vigente').length,
    recuperar: clientes.filter(c => c.estado_derivado === 'recuperar').length,
  }), [clientes])

  const filtrados = useMemo(() => {
    const s = search.trim().toLowerCase()
    return clientes.filter(c => {
      if (filtroEstado !== 'todos' && c.estado_derivado !== filtroEstado) return false
      if (filtroEmpresa !== 'todas' && (c.empresa || '').toLowerCase() !== filtroEmpresa.toLowerCase()) return false
      if (filtroVendedor !== 'todos' && (c.vendedor_nombre || '') !== filtroVendedor) return false
      if (s && !(c.razon_social || '').toLowerCase().includes(s)) return false
      return true
    })
  }, [clientes, search, filtroEstado, filtroEmpresa, filtroVendedor])

  const sorted = useMemo(() => {
    const arr = [...filtrados]
    const dir = sortDir === 'asc' ? 1 : -1
    arr.sort((a, b) => {
      const va = (a as any)[sortKey], vb = (b as any)[sortKey]
      if (va == null && vb == null) return 0
      if (va == null) return 1
      if (vb == null) return -1
      if (typeof va === 'number' && typeof vb === 'number') return (va - vb) * dir
      return String(va).localeCompare(String(vb), 'es') * dir
    })
    return arr
  }, [filtrados, sortKey, sortDir])

  const toggleSort = (k: SortKey) => {
    if (sortKey === k) setSortDir(d => d === 'asc' ? 'desc' : 'asc')
    else { setSortKey(k); setSortDir(k === 'razon_social' || k === 'empresa' ? 'asc' : 'desc') }
  }

  const SortIcon = ({ k }: { k: SortKey }) => {
    if (sortKey !== k) return <span style={{ opacity: 0.3, marginLeft: 4 }}>⇅</span>
    return sortDir === 'asc'
      ? <ArrowUp size={11} style={{ marginLeft: 4, verticalAlign: 'middle' }} />
      : <ArrowDown size={11} style={{ marginLeft: 4, verticalAlign: 'middle' }} />
  }

  const Th = ({ k, label, align = 'left' }: { k: SortKey, label: string, align?: 'left' | 'right' | 'center' }) => (
    <th onClick={() => toggleSort(k)}
      style={{
        textAlign: align as any, padding: '10px 12px', fontSize: '11px',
        textTransform: 'uppercase', color: tokens.colors.textSecondary, fontWeight: 700,
        cursor: 'pointer', userSelect: 'none', borderBottom: `1px solid ${tokens.colors.border}`,
        background: sortKey === k ? 'rgba(30,102,245,0.08)' : 'transparent',
      }}>
      {label}<SortIcon k={k} />
    </th>
  )

  const selectStyle = {
    padding: '10px 12px', background: tokens.colors.bgMain,
    border: `1px solid ${tokens.colors.border}`, borderRadius: tokens.radius.md,
    color: tokens.colors.textPrimary, fontSize: '13px', fontWeight: 600,
    outline: 'none', cursor: 'pointer', minWidth: 140,
  } as React.CSSProperties

  return (
    <ModuleLayout titulo="Clientes — Listado y Ventas">
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: tokens.spacing.md, marginBottom: tokens.spacing.lg }}>
        <KPICard titulo="Total clientes" valor={fmtN(kpis.total)} color="primary" icono={<Users size={20} />} />
        <KPICard titulo="Activos (≤30d)" valor={fmtN(kpis.activo)} color="green" icono={<TrendingUp size={20} />} />
        <KPICard titulo="Vigentes (31-90d)" valor={fmtN(kpis.vigente)} color="blue" icono={<Building2 size={20} />} />
        <KPICard titulo="Por recuperar (+90d)" valor={fmtN(kpis.recuperar)} color="orange" icono={<Activity size={20} />} />
      </div>

      <Card>
        <div style={{ marginBottom: tokens.spacing.md }}>
          <div style={{ position: 'relative' }}>
            <Search size={16} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: tokens.colors.textMuted }} />
            <input type="text" placeholder="Buscar cliente por nombre…" value={search} onChange={e => setSearch(e.target.value)}
              style={{
                width: '100%', padding: '10px 14px 10px 36px', background: tokens.colors.bgMain,
                border: `1px solid ${tokens.colors.border}`, borderRadius: tokens.radius.md,
                color: tokens.colors.textPrimary, fontSize: '14px', outline: 'none',
              }} />
          </div>
        </div>

        <div style={{ display: 'flex', gap: tokens.spacing.sm, marginBottom: tokens.spacing.md, flexWrap: 'wrap' }}>
          <select value={filtroEmpresa} onChange={e => setFiltroEmpresa(e.target.value)} style={selectStyle}>
            <option value="todas">Todas las empresas</option>
            {empresas.map(e => <option key={e} value={e}>{empresaLabel(e)}</option>)}
          </select>
          <select value={filtroVendedor} onChange={e => setFiltroVendedor(e.target.value)} style={selectStyle}>
            <option value="todos">Todos los vendedores</option>
            <option value="">Sin asignar</option>
            {vendedores.map(v => <option key={v} value={v}>{v}</option>)}
          </select>
          <select value={filtroEstado} onChange={e => setFiltroEstado(e.target.value)} style={selectStyle}>
            <option value="todos">Todos los estados</option>
            <option value="activo">Activo (≤30d)</option>
            <option value="vigente">Vigente (31-90d)</option>
            <option value="recuperar">Recuperar (+90d)</option>
            <option value="sin_actividad">Sin actividad</option>
          </select>
        </div>

        <div style={{ marginBottom: tokens.spacing.sm, fontSize: '13px', color: tokens.colors.textSecondary }}>
          Mostrando {fmtN(sorted.length)} de {fmtN(clientes.length)} clientes · Click en encabezado para ordenar
        </div>

        {loading ? (
          <div style={{ textAlign: 'center', padding: tokens.spacing.xl, color: tokens.colors.textSecondary }}>Cargando…</div>
        ) : sorted.length === 0 ? (
          <div style={{ textAlign: 'center', padding: tokens.spacing.xl, color: tokens.colors.textMuted }}>Sin resultados</div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr>
                  <Th k="razon_social" label="Cliente" />
                  <Th k="empresa" label="Empresa" />
                  <Th k="estado_derivado" label="Estado" />
                  <Th k="vendedor_nombre" label="Vendedor" />
                  <Th k="cs_nombre" label="CS" />
                  <Th k="cxc_nombre" label="CXC" />
                  <Th k="viajes_90d" label="90d" align="right" />
                  <Th k="viajes_30d" label="30d" align="right" />
                  <Th k="viajes_activos" label="Activos" align="right" />
                  <Th k="venta_mxn_12m" label="Venta MXN 12m" align="right" />
                  <Th k="ultimo_viaje" label="Último" />
                </tr>
              </thead>
              <tbody>
                {sorted.map(row => (
                  <tr key={row.id}
                    onClick={() => navigate(`/clientes/${row.id}`)}
                    style={{ cursor: 'pointer', borderBottom: `1px solid ${tokens.colors.border}` }}
                    onMouseEnter={e => (e.currentTarget as HTMLElement).style.background = 'rgba(30,102,245,0.05)'}
                    onMouseLeave={e => (e.currentTarget as HTMLElement).style.background = 'transparent'}
                  >
                    <td style={{ padding: '8px 12px', fontWeight: 600, color: tokens.colors.textPrimary, fontSize: '13px' }}>{row.razon_social || '—'}</td>
                    <td style={{ padding: '8px 12px', fontSize: '12px', fontWeight: 600, color: tokens.colors.textSecondary }}>{empresaLabel(row.empresa || '—')}</td>
                    <td style={{ padding: '8px 12px' }}><Badge color={estadoColor(row.estado_derivado)}>{estadoLabel(row.estado_derivado)}</Badge></td>
                    <td style={{ padding: '8px 12px', fontSize: '12px', color: row.vendedor_nombre ? tokens.colors.textPrimary : tokens.colors.textMuted }}>{cap(row.vendedor_nombre)}</td>
                    <td style={{ padding: '8px 12px', fontSize: '12px', color: row.cs_nombre ? tokens.colors.textPrimary : tokens.colors.textMuted }}>{row.cs_nombre || '—'}</td>
                    <td style={{ padding: '8px 12px', fontSize: '12px', color: row.cxc_nombre ? tokens.colors.textPrimary : tokens.colors.textMuted }}>{row.cxc_nombre || '—'}</td>
                    <td style={{ padding: '8px 12px', textAlign: 'right', color: row.viajes_90d > 0 ? tokens.colors.green : tokens.colors.textMuted, fontWeight: row.viajes_90d > 0 ? 700 : 400 }}>{fmtN(row.viajes_90d)}</td>
                    <td style={{ padding: '8px 12px', textAlign: 'right', color: row.viajes_30d > 0 ? tokens.colors.blue : tokens.colors.textMuted }}>{fmtN(row.viajes_30d)}</td>
                    <td style={{ padding: '8px 12px', textAlign: 'right', color: row.viajes_activos > 0 ? tokens.colors.orange : tokens.colors.textMuted, fontWeight: row.viajes_activos > 0 ? 700 : 400 }}>{row.viajes_activos > 0 ? row.viajes_activos : '—'}</td>
                    <td style={{ padding: '8px 12px', textAlign: 'right', fontSize: '12px', color: row.venta_mxn_12m > 0 ? tokens.colors.textPrimary : tokens.colors.textMuted }}>{row.venta_mxn_12m > 0 ? fmtMxn(row.venta_mxn_12m) : '—'}</td>
                    <td style={{ padding: '8px 12px', fontSize: '12px', color: tokens.colors.textSecondary }}>{fmtFecha(row.ultimo_viaje)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </ModuleLayout>
  )
}
