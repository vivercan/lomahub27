// V2 (28/Abr/2026) — Listado de clientes con ventas REALES de ANODOS
// JJ pidio: jala el listado de clientes y sus ventas con los GET de anodos.
// Antes: pagina vacia "Sin grupos corporativos" (porque 0 clientes tipo='corporativo')
// Ahora: tabla simple con TODOS los clientes activos, agregados desde view v_clientes_con_ventas
// La vista ya tiene CTE optimizada (1 query agregada en lugar de 879 LATERAL).

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

interface ClienteConVentas {
  id: string
  razon_social: string
  tipo: string | null
  empresa: string | null
  ejecutivo_asignado: string | null
  viajes_90d: number
  viajes_30d: number
  viajes_7d: number
  viajes_activos: number
  ultimo_viaje: string | null
}

const fmtFecha = (iso: string | null): string => {
  if (!iso) return '—'
  try {
    return new Date(iso).toLocaleDateString('es-MX', { day: '2-digit', month: 'short', year: '2-digit' })
  } catch { return '—' }
}

const fmtN = (n: number): string => (n || 0).toLocaleString('en-US')

export default function CorporativosClientes(): ReactElement {
  const navigate = useNavigate()

  const [clientes, setClientes] = useState<ClienteConVentas[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [filtro, setFiltro] = useState<'todos' | 'con_ventas' | 'activos'>('con_ventas')

  useEffect(() => {
    const load = async () => {
      try {
        const { data, error } = await supabase
          .from('v_clientes_con_ventas')
          .select('id, razon_social, tipo, empresa, ejecutivo_asignado, viajes_90d, viajes_30d, viajes_7d, viajes_activos, ultimo_viaje')
          .order('viajes_90d', { ascending: false })
          .order('razon_social', { ascending: true })
        if (error) {
          console.error('Error v_clientes_con_ventas:', error)
          setClientes([])
        } else {
          // Dedup por id (la vista puede traer duplicados si hay clientes con mismo nombre)
          const seen = new Set<string>()
          const uniq: ClienteConVentas[] = []
          for (const c of (data || []) as ClienteConVentas[]) {
            if (!seen.has(c.id)) {
              seen.add(c.id)
              uniq.push(c)
            }
          }
          setClientes(uniq)
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

  // KPIs computados
  const kpis = useMemo(() => {
    const total = clientes.length
    const con90 = clientes.filter(c => c.viajes_90d > 0).length
    const con30 = clientes.filter(c => c.viajes_30d > 0).length
    const activos = clientes.filter(c => c.viajes_activos > 0).length
    const totalViajes90 = clientes.reduce((s, c) => s + (c.viajes_90d || 0), 0)
    return { total, con90, con30, activos, totalViajes90 }
  }, [clientes])

  // Filtrado por búsqueda + filtro
  const filtrados = useMemo(() => {
    const s = search.trim().toLowerCase()
    return clientes.filter(c => {
      if (filtro === 'con_ventas' && c.viajes_90d === 0) return false
      if (filtro === 'activos' && c.viajes_activos === 0) return false
      if (s && !(c.razon_social || '').toLowerCase().includes(s)) return false
      return true
    })
  }, [clientes, search, filtro])

  const columns = [
    {
      key: 'razon_social',
      label: 'Cliente',
      render: (row: ClienteConVentas) => (
        <div style={{ fontWeight: 600, color: tokens.colors.textPrimary }}>
          {row.razon_social || '—'}
        </div>
      ),
    },
    {
      key: 'empresa',
      label: 'Empresa',
      render: (row: ClienteConVentas) => (
        <span style={{ color: tokens.colors.textSecondary, fontSize: '13px' }}>
          {row.empresa || '—'}
        </span>
      ),
    },
    {
      key: 'tipo',
      label: 'Tipo',
      render: (row: ClienteConVentas) => row.tipo
        ? <Badge color="primary">{row.tipo}</Badge>
        : <span style={{ color: tokens.colors.textMuted }}>—</span>,
    },
    {
      key: 'viajes_90d',
      label: 'Viajes 90d',
      align: 'right' as const,
      render: (row: ClienteConVentas) => (
        <span style={{
          color: row.viajes_90d > 0 ? tokens.colors.green : tokens.colors.textMuted,
          fontWeight: row.viajes_90d > 0 ? 700 : 400,
        }}>
          {fmtN(row.viajes_90d)}
        </span>
      ),
    },
    {
      key: 'viajes_30d',
      label: 'Viajes 30d',
      align: 'right' as const,
      render: (row: ClienteConVentas) => (
        <span style={{ color: row.viajes_30d > 0 ? tokens.colors.blue : tokens.colors.textMuted }}>
          {fmtN(row.viajes_30d)}
        </span>
      ),
    },
    {
      key: 'viajes_activos',
      label: 'Activos',
      align: 'right' as const,
      render: (row: ClienteConVentas) => row.viajes_activos > 0
        ? <span style={{ color: tokens.colors.orange, fontWeight: 700 }}>{row.viajes_activos}</span>
        : <span style={{ color: tokens.colors.textMuted }}>—</span>,
    },
    {
      key: 'ultimo_viaje',
      label: 'Último viaje',
      render: (row: ClienteConVentas) => (
        <span style={{ color: tokens.colors.textSecondary, fontSize: '13px' }}>
          {fmtFecha(row.ultimo_viaje)}
        </span>
      ),
    },
  ]

  return (
    <ModuleLayout titulo="Clientes — Listado y Ventas">
      {/* KPIs */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: tokens.spacing.md, marginBottom: tokens.spacing.lg }}>
        <KPICard titulo="Registrados" valor={fmtN(kpis.total)} color="primary" icono={<Users size={20} />} />
        <KPICard titulo="Con ventas 90d" valor={fmtN(kpis.con90)} color="blue" icono={<TrendingUp size={20} />} />
        <KPICard titulo="Con ventas 30d" valor={fmtN(kpis.con30)} color="green" icono={<Building2 size={20} />} />
        <KPICard titulo="Con viajes activos" valor={fmtN(kpis.activos)} color="orange" icono={<Activity size={20} />} />
      </div>

      {/* Buscador + filtros */}
      <Card>
        <div style={{ display: 'flex', gap: tokens.spacing.md, alignItems: 'center', marginBottom: tokens.spacing.md, flexWrap: 'wrap' }}>
          <div style={{ position: 'relative', flex: 1, minWidth: 240 }}>
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
          <div style={{ display: 'flex', gap: '6px' }}>
            {([
              ['con_ventas', 'Con ventas 90d'],
              ['activos', 'Con activos'],
              ['todos', 'Todos'],
            ] as const).map(([k, label]) => (
              <button
                key={k}
                onClick={() => setFiltro(k)}
                style={{
                  padding: '8px 14px',
                  borderRadius: tokens.radius.md,
                  border: `1px solid ${filtro === k ? tokens.colors.primary : tokens.colors.border}`,
                  background: filtro === k ? tokens.colors.primary : 'transparent',
                  color: filtro === k ? '#FFFFFF' : tokens.colors.textPrimary,
                  fontSize: '13px',
                  fontWeight: 600,
                  cursor: 'pointer',
                }}
              >
                {label}
              </button>
            ))}
          </div>
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
            Sin resultados con el filtro actual
          </div>
        ) : (
          <DataTable
            columns={columns}
            data={filtrados}
            onRowClick={(row: ClienteConVentas) => navigate(`/clientes/${row.id}`)}
          />
        )}
      </Card>
    </ModuleLayout>
  )
}
