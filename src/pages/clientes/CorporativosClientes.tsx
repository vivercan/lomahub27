// V4 (28/Abr/2026) — Listado clientes 3 empresas (TROB/WExpress/SpeedyHaul)
// JJ: ver toda la lista completa, EXCLUIR TROB USA (eso será otro módulo).
// Filtros por empresa, vendedor, tipo, búsqueda. Default = TODOS.

import type { ReactElement } from 'react'
import { useState, useEffect, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { ModuleLayout } from '../../components/layout/ModuleLayout'
import { Card } from '../../components/ui/Card'
import { KPICard } from '../../components/ui/KPICard'
import { DataTable } from '../../components/ui/DataTable'
import { Badge } from '../../components/ui/Badge'
import { tokens } from '../../lib/tokens'
import { supabase } from '../../lib/supabase'
import { Building2, Users, TrendingUp, Activity, Search } from 'lucide-react'

interface ClienteRow {
  id: string
  razon_social: string
  tipo: string | null
  empresa: string | null
  vendedor_nombre: string | null
  cs_nombre: string | null
  cxc_nombre: string | null
  viajes_90d: number
  viajes_30d: number
  viajes_7d: number
  viajes_activos: number
  ultimo_viaje: string | null
}

const EMPRESAS_VALIDAS = ['TROB', 'wexpress', 'SpeedyHaul']

const fmtFecha = (iso: string | null): string => {
  if (!iso) return '—'
  try { return new Date(iso).toLocaleDateString('es-MX', { day: '2-digit', month: 'short', year: '2-digit' }) }
  catch { return '—' }
}
const fmtN = (n: number): string => (n || 0).toLocaleString('en-US')
const cap = (s: string | null): string => {
  if (!s) return '—'
  return s.split(/[._-]/).map(p => p.charAt(0).toUpperCase() + p.slice(1).toLowerCase()).join(' ')
}
const empresaLabel = (e: string): string => {
  if (e === 'wexpress') return 'WExpress'
  if (e === 'SpeedyHaul') return 'SpeedyHaul'
  return e.toUpperCase()
}

export default function CorporativosClientes(): ReactElement {
  const navigate = useNavigate()

  const [clientes, setClientes] = useState<ClienteRow[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [filtroPeriodo, setFiltroPeriodo] = useState<'todos' | 'con_ventas' | 'activos'>('todos')
  const [filtroEmpresa, setFiltroEmpresa] = useState<string>('todas')
  const [filtroVendedor, setFiltroVendedor] = useState<string>('todos')
  const [filtroTipo, setFiltroTipo] = useState<string>('todos')

  useEffect(() => {
    const load = async () => {
      try {
        const { data, error } = await supabase
          .from('v_clientes_con_ventas')
          .select('id, razon_social, tipo, empresa, vendedor_nombre, cs_nombre, cxc_nombre, viajes_90d, viajes_30d, viajes_7d, viajes_activos, ultimo_viaje')
          .in('empresa', EMPRESAS_VALIDAS)  // EXCLUYE TROB USA y otros legacy
          .order('viajes_90d', { ascending: false })
          .order('razon_social', { ascending: true })
        if (error) {
          console.error('Error v_clientes_con_ventas:', error)
          setClientes([])
        } else {
          setClientes((data || []) as ClienteRow[])
        }
      } catch (err) {
        console.error('Unexpected:', err)
        setClientes([])
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [])

  const empresas = useMemo(() => {
    const set = new Set<string>()
    clientes.forEach(c => { if (c.empresa) set.add(c.empresa) })
    return Array.from(set).sort()
  }, [clientes])

  const vendedores = useMemo(() => {
    const set = new Set<string>()
    clientes.forEach(c => { if (c.vendedor_nombre) set.add(c.vendedor_nombre) })
    return Array.from(set).sort()
  }, [clientes])

  const kpis = useMemo(() => {
    const total = clientes.length
    const con90 = clientes.filter(c => c.viajes_90d > 0).length
    const con30 = clientes.filter(c => c.viajes_30d > 0).length
    const activos = clientes.filter(c => c.viajes_activos > 0).length
    return { total, con90, con30, activos }
  }, [clientes])

  const filtrados = useMemo(() => {
    const s = search.trim().toLowerCase()
    return clientes.filter(c => {
      if (filtroPeriodo === 'con_ventas' && c.viajes_90d === 0) return false
      if (filtroPeriodo === 'activos' && c.viajes_activos === 0) return false
      if (filtroEmpresa !== 'todas' && (c.empresa || '').toLowerCase() !== filtroEmpresa.toLowerCase()) return false
      if (filtroVendedor !== 'todos' && (c.vendedor_nombre || '') !== filtroVendedor) return false
      if (filtroTipo !== 'todos' && (c.tipo || '') !== filtroTipo) return false
      if (s && !(c.razon_social || '').toLowerCase().includes(s)) return false
      return true
    })
  }, [clientes, search, filtroPeriodo, filtroEmpresa, filtroVendedor, filtroTipo])

  const columns = [
    { key: 'razon_social', label: 'Cliente',
      render: (row: ClienteRow) => <div style={{ fontWeight: 600, color: tokens.colors.textPrimary, fontSize: '13px' }}>{row.razon_social || '—'}</div>,
    },
    { key: 'empresa', label: 'Empresa',
      render: (row: ClienteRow) => <span style={{ color: tokens.colors.textSecondary, fontSize: '12px', fontWeight: 600 }}>{empresaLabel(row.empresa || '—')}</span>,
    },
    { key: 'tipo', label: 'Tipo',
      render: (row: ClienteRow) => row.tipo
        ? <Badge color={row.tipo === 'activo' ? 'green' : 'gray'}>{row.tipo}</Badge>
        : <span style={{ color: tokens.colors.textMuted }}>—</span>,
    },
    { key: 'vendedor_nombre', label: 'Vendedor',
      render: (row: ClienteRow) => <span style={{ color: row.vendedor_nombre ? tokens.colors.textPrimary : tokens.colors.textMuted, fontSize: '12px' }}>{cap(row.vendedor_nombre)}</span>,
    },
    { key: 'cs_nombre', label: 'CS',
      render: (row: ClienteRow) => <span style={{ color: row.cs_nombre ? tokens.colors.textPrimary : tokens.colors.textMuted, fontSize: '12px' }}>{row.cs_nombre || '—'}</span>,
    },
    { key: 'cxc_nombre', label: 'CXC',
      render: (row: ClienteRow) => <span style={{ color: row.cxc_nombre ? tokens.colors.textPrimary : tokens.colors.textMuted, fontSize: '12px' }}>{row.cxc_nombre || '—'}</span>,
    },
    { key: 'viajes_90d', label: '90d', align: 'right' as const,
      render: (row: ClienteRow) => <span style={{ color: row.viajes_90d > 0 ? tokens.colors.green : tokens.colors.textMuted, fontWeight: row.viajes_90d > 0 ? 700 : 400 }}>{fmtN(row.viajes_90d)}</span>,
    },
    { key: 'viajes_30d', label: '30d', align: 'right' as const,
      render: (row: ClienteRow) => <span style={{ color: row.viajes_30d > 0 ? tokens.colors.blue : tokens.colors.textMuted }}>{fmtN(row.viajes_30d)}</span>,
    },
    { key: 'viajes_activos', label: 'Activos', align: 'right' as const,
      render: (row: ClienteRow) => row.viajes_activos > 0
        ? <span style={{ color: tokens.colors.orange, fontWeight: 700 }}>{row.viajes_activos}</span>
        : <span style={{ color: tokens.colors.textMuted }}>—</span>,
    },
    { key: 'ultimo_viaje', label: 'Último',
      render: (row: ClienteRow) => <span style={{ color: tokens.colors.textSecondary, fontSize: '12px' }}>{fmtFecha(row.ultimo_viaje)}</span>,
    },
  ]

  const selectStyle = {
    padding: '10px 12px',
    background: tokens.colors.bgMain,
    border: `1px solid ${tokens.colors.border}`,
    borderRadius: tokens.radius.md,
    color: tokens.colors.textPrimary,
    fontSize: '13px',
    fontWeight: 600,
    outline: 'none',
    cursor: 'pointer',
    minWidth: 140,
  } as React.CSSProperties

  return (
    <ModuleLayout titulo="Clientes — Listado y Ventas">
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: tokens.spacing.md, marginBottom: tokens.spacing.lg }}>
        <KPICard titulo="Registrados (3 empresas)" valor={fmtN(kpis.total)} color="primary" icono={<Users size={20} />} />
        <KPICard titulo="Con ventas 90d" valor={fmtN(kpis.con90)} color="blue" icono={<TrendingUp size={20} />} />
        <KPICard titulo="Con ventas 30d" valor={fmtN(kpis.con30)} color="green" icono={<Building2 size={20} />} />
        <KPICard titulo="Con viajes activos" valor={fmtN(kpis.activos)} color="orange" icono={<Activity size={20} />} />
      </div>

      <Card>
        {/* Fila 1: búsqueda */}
        <div style={{ marginBottom: tokens.spacing.md }}>
          <div style={{ position: 'relative' }}>
            <Search size={16} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: tokens.colors.textMuted }} />
            <input
              type="text"
              placeholder="Buscar cliente por nombre…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              style={{
                width: '100%',
                padding: '10px 14px 10px 36px',
                background: tokens.colors.bgMain,
                border: `1px solid ${tokens.colors.border}`,
                borderRadius: tokens.radius.md,
                color: tokens.colors.textPrimary,
                fontSize: '14px',
                outline: 'none',
              }}
            />
          </div>
        </div>

        {/* Fila 2: dropdowns */}
        <div style={{ display: 'flex', gap: tokens.spacing.sm, marginBottom: tokens.spacing.md, flexWrap: 'wrap' }}>
          <select value={filtroEmpresa} onChange={(e) => setFiltroEmpresa(e.target.value)} style={selectStyle}>
            <option value="todas">Todas las empresas</option>
            {empresas.map(e => <option key={e} value={e}>{empresaLabel(e)}</option>)}
          </select>
          <select value={filtroVendedor} onChange={(e) => setFiltroVendedor(e.target.value)} style={selectStyle}>
            <option value="todos">Todos los vendedores</option>
            <option value="">Sin asignar</option>
            {vendedores.map(v => <option key={v} value={v}>{v}</option>)}
          </select>
          <select value={filtroTipo} onChange={(e) => setFiltroTipo(e.target.value)} style={selectStyle}>
            <option value="todos">Todos los tipos</option>
            <option value="activo">Activo</option>
            <option value="prospecto">Prospecto</option>
          </select>
        </div>

        {/* Fila 3: pills periodo */}
        <div style={{ display: 'flex', gap: '6px', marginBottom: tokens.spacing.md, flexWrap: 'wrap' }}>
          {([
            ['todos', 'Todos'],
            ['con_ventas', 'Con ventas 90d'],
            ['activos', 'Con activos'],
          ] as const).map(([k, label]) => (
            <button key={k}
              onClick={() => setFiltroPeriodo(k)}
              style={{
                padding: '8px 16px', borderRadius: tokens.radius.md,
                border: `1px solid ${filtroPeriodo === k ? tokens.colors.primary : tokens.colors.border}`,
                background: filtroPeriodo === k ? tokens.colors.primary : 'transparent',
                color: filtroPeriodo === k ? '#FFFFFF' : tokens.colors.textPrimary,
                fontSize: '13px', fontWeight: 600, cursor: 'pointer',
              }}
            >{label}</button>
          ))}
        </div>

        <div style={{ marginBottom: tokens.spacing.sm, fontSize: '13px', color: tokens.colors.textSecondary }}>
          Mostrando {fmtN(filtrados.length)} de {fmtN(clientes.length)} clientes
        </div>

        {loading ? (
          <div style={{ textAlign: 'center', padding: tokens.spacing.xl, color: tokens.colors.textSecondary }}>
            Cargando clientes con sus ventas…
          </div>
        ) : filtrados.length === 0 ? (
          <div style={{ textAlign: 'center', padding: tokens.spacing.xl, color: tokens.colors.textMuted }}>
            Sin resultados con los filtros aplicados
          </div>
        ) : (
          <DataTable
            columns={columns}
            data={filtrados}
            onRowClick={(row: ClienteRow) => navigate(`/clientes/${row.id}`)}
          />
        )}
      </Card>
    </ModuleLayout>
  )
}
