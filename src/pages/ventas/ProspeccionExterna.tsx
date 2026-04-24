import type { ReactElement } from 'react'
import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { ModuleLayout } from '../../components/layout/ModuleLayout'
import { Card } from '../../components/ui/Card'
import { KPICard } from '../../components/ui/KPICard'
import { DataTable } from '../../components/ui/DataTable'
import { Badge } from '../../components/ui/Badge'
import { tokens } from '../../lib/tokens'
import { supabase } from '../../lib/supabase'
import {
  Search,
  Globe,
  Users,
  Building2,
  Mail,
  Phone,
  Linkedin,
  Plus,
  RefreshCw,
  ExternalLink,
  UserPlus,
  Target,
  Zap,
  Filter,
  Download,
  AlertCircle,
  CheckCircle2,
  Clock,
} from 'lucide-react'

/* ─── types ─── */
interface Prospecto {
  id: string
  empresa: string
  dominio: string
  industria: string
  empleados: number | null
  ciudad: string
  pais: string
  contacto_nombre: string
  contacto_puesto: string
  contacto_email: string
  contacto_telefono: string
  contacto_linkedin: string
  fuente: 'apollo' | 'hunter' | 'manual'
  score: number
  estado: 'nuevo' | 'contactado' | 'importado' | 'descartado'
  fecha_enriquecimiento: string | null
  created_at: string
}

interface ProspeccionStats {
  total: number
  nuevos: number
  contactados: number
  importados: number
}

/* ─── component ─── */
export default function ProspeccionExterna(): ReactElement {
  const navigate = useNavigate()
  const [prospectos, setProspectos] = useState<Prospecto[]>([])
  const [stats, setStats] = useState<ProspeccionStats>({ total: 0, nuevos: 0, contactados: 0, importados: 0 })
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [searchType, setSearchType] = useState<'empresa' | 'dominio' | 'contacto'>('empresa')
  const [searching, setSearching] = useState(false)
  const [filtroFuente, setFiltroFuente] = useState<string>('todos')
  const [filtroEstado, setFiltroEstado] = useState<string>('todos')
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())

  useEffect(() => { fetchData() }, [])

  async function fetchData() {
    setLoading(true)
    try {
      const { data, error } = await supabase
        .from('prospeccion_externa')
        .select('*')
        .is('deleted_at', null)
        .order('created_at', { ascending: false })
        .limit(500)

      if (error) { console.error('prospeccion_externa:', error); setProspectos([]); return }
      const rows = (data || []) as Prospecto[]
      setProspectos(rows)
      setStats({
        total: rows.length,
        nuevos: rows.filter(r => r.estado === 'nuevo').length,
        contactados: rows.filter(r => r.estado === 'contactado').length,
        importados: rows.filter(r => r.estado === 'importado').length,
      })
    } finally { setLoading(false) }
  }

  async function handleSearch() {
    if (!searchQuery.trim()) return
    setSearching(true)
    try {
      const { data, error } = await supabase.functions.invoke('prospeccion-buscar', {
        body: { query: searchQuery, tipo: searchType },
      })
      if (error) { console.error('prospeccion-buscar:', error); return }
      if (data?.resultados) { await fetchData() }
    } finally { setSearching(false) }
  }

  async function handleImportarComoLead(p: Prospecto) {
    const { error } = await supabase.from('leads').insert({
      empresa: p.empresa,
      contacto: p.contacto_nombre,
      puesto: p.contacto_puesto,
      email: p.contacto_email,
      telefono: p.contacto_telefono,
      segmento: p.industria || 'General',
      estado: 'Nuevo',
      potencial_usd: 0,
      fuente: `prospeccion-${p.fuente}`,
    })
    if (error) { console.error('import lead:', error); return }
    await supabase.from('prospeccion_externa').update({ estado: 'importado' }).eq('id', p.id)
    await fetchData()
  }

  async function handleEnriquecer(p: Prospecto) {
    const { error } = await supabase.functions.invoke('prospeccion-enriquecer', {
      body: { prospecto_id: p.id, dominio: p.dominio },
    })
    if (error) console.error('enriquecer:', error)
    await fetchData()
  }

  async function handleBulkImport() {
    for (const id of selectedIds) {
      const p = prospectos.find(x => x.id === id)
      if (p && p.estado !== 'importado') await handleImportarComoLead(p)
    }
    setSelectedIds(new Set())
  }

  const filtered = prospectos.filter(p => {
    if (filtroFuente !== 'todos' && p.fuente !== filtroFuente) return false
    if (filtroEstado !== 'todos' && p.estado !== filtroEstado) return false
    return true
  })

  const fuenteColor = (f: string) => {
    if (f === 'apollo') return tokens.colors.blue
    if (f === 'hunter') return tokens.colors.orange
    return tokens.colors.gray
  }

  const estadoBadge = (e: string) => {
    if (e === 'nuevo') return { color: tokens.colors.blue, bg: tokens.colors.blueBg }
    if (e === 'contactado') return { color: tokens.colors.yellow, bg: tokens.colors.yellowBg }
    if (e === 'importado') return { color: tokens.colors.green, bg: tokens.colors.greenBg }
    return { color: tokens.colors.red, bg: tokens.colors.redBg }
  }

  /* ─── render ─── */
  return (
    <ModuleLayout titulo="Prospección Externa" moduloPadre={{ nombre: 'Comercial', ruta: '/comercial/dashboard' }}>
      <div style={{ padding: tokens.spacing.lg, minHeight: '100vh', background: tokens.colors.bgMain }}>
        {/* KPI Cards */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: tokens.spacing.md, marginBottom: tokens.spacing.lg }}>
          <KPICard icon={<Target size={20} />} label="Prospectos Totales" value={stats.total} />
          <KPICard icon={<Zap size={20} />} label="Nuevos" value={stats.nuevos} />
          <KPICard icon={<Phone size={20} />} label="Contactados" value={stats.contactados} />
          <KPICard icon={<CheckCircle2 size={20} />} label="Importados a Leads" value={stats.importados} />
        </div>

        {/* Search Panel */}
        <Card style={{ marginBottom: tokens.spacing.lg, padding: tokens.spacing.lg }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: tokens.spacing.md, marginBottom: tokens.spacing.md }}>
            <Globe size={20} color={tokens.colors.primary} />
            <span style={{ fontFamily: tokens.fonts.heading, fontSize: '16px', fontWeight: 700, color: tokens.colors.textPrimary }}>
              Buscar Prospectos Externos
            </span>
          </div>

          <div style={{ display: 'flex', gap: tokens.spacing.sm, alignItems: 'center' }}>
            <select
              value={searchType}
              onChange={e => setSearchType(e.target.value as 'empresa' | 'dominio' | 'contacto')}
              style={{
                background: tokens.colors.bgHover, color: tokens.colors.textPrimary,
                border: `1px solid ${tokens.colors.border}`, borderRadius: tokens.radius.md,
                padding: `${tokens.spacing.sm} ${tokens.spacing.md}`, fontFamily: tokens.fonts.body,
                fontSize: '14px', outline: 'none', cursor: 'pointer',
              }}
            >
              <option value="empresa">Por Empresa</option>
              <option value="dominio">Por Dominio</option>
              <option value="contacto">Por Contacto</option>
            </select>

            <div style={{ flex: 1, position: 'relative' }}>
              <Search size={16} color={tokens.colors.textMuted} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)' }} />
              <input
                type="text"
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleSearch()}
                placeholder={searchType === 'empresa' ? 'Nombre de empresa...' : searchType === 'dominio' ? 'ejemplo.com' : 'Nombre o email...'}
                style={{
                  width: '100%', background: tokens.colors.bgHover, color: tokens.colors.textPrimary,
                  border: `1px solid ${tokens.colors.border}`, borderRadius: tokens.radius.md,
                  padding: `${tokens.spacing.sm} ${tokens.spacing.md} ${tokens.spacing.sm} 36px`,
                  fontFamily: tokens.fonts.body, fontSize: '14px', outline: 'none',
                }}
              />
            </div>

            <button
              onClick={handleSearch}
              disabled={searching || !searchQuery.trim()}
              style={{
                display: 'flex', alignItems: 'center', gap: tokens.spacing.xs,
                background: tokens.colors.primary, color: '#fff', border: 'none',
                borderRadius: tokens.radius.md, padding: `${tokens.spacing.sm} ${tokens.spacing.lg}`,
                fontFamily: tokens.fonts.body, fontSize: '14px', fontWeight: 600,
                cursor: searching ? 'wait' : 'pointer', opacity: searching ? 0.6 : 1,
              }}
            >
              {searching ? <RefreshCw size={16} className="spin" /> : <Search size={16} />}
              {searching ? 'Buscando...' : 'Buscar'}
            </button>
          </div>

          <div style={{ display: 'flex', gap: tokens.spacing.lg, marginTop: tokens.spacing.md }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: tokens.spacing.xs }}>
              <div style={{ width: 8, height: 8, borderRadius: '50%', background: tokens.colors.blue }} />
              <span style={{ fontSize: '12px', color: tokens.colors.textSecondary }}>Apollo.io — Empresas B2B, datos de contacto</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: tokens.spacing.xs }}>
              <div style={{ width: 8, height: 8, borderRadius: '50%', background: tokens.colors.orange }} />
              <span style={{ fontSize: '12px', color: tokens.colors.textSecondary }}>Hunter.io — Emails verificados por dominio</span>
            </div>
          </div>
        </Card>

        {/* Filters + Actions */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: tokens.spacing.md }}>
          <div style={{ display: 'flex', gap: tokens.spacing.sm }}>
            <select
              value={filtroFuente}
              onChange={e => setFiltroFuente(e.target.value)}
              style={{
                background: tokens.colors.bgCard, color: tokens.colors.textPrimary,
                border: `1px solid ${tokens.colors.border}`, borderRadius: tokens.radius.md,
                padding: `${tokens.spacing.xs} ${tokens.spacing.md}`, fontFamily: tokens.fonts.body, fontSize: '13px',
              }}
            >
              <option value="todos">Todas las fuentes</option>
              <option value="apollo">Apollo.io</option>
              <option value="hunter">Hunter.io</option>
              <option value="manual">Manual</option>
            </select>

            <select
              value={filtroEstado}
              onChange={e => setFiltroEstado(e.target.value)}
              style={{
                background: tokens.colors.bgCard, color: tokens.colors.textPrimary,
                border: `1px solid ${tokens.colors.border}`, borderRadius: tokens.radius.md,
                padding: `${tokens.spacing.xs} ${tokens.spacing.md}`, fontFamily: tokens.fonts.body, fontSize: '13px',
              }}
            >
              <option value="todos">Todos los estados</option>
              <option value="nuevo">Nuevos</option>
              <option value="contactado">Contactados</option>
              <option value="importado">Importados</option>
              <option value="descartado">Descartados</option>
            </select>
          </div>

          {selectedIds.size > 0 && (
            <button
              onClick={handleBulkImport}
              style={{
                display: 'flex', alignItems: 'center', gap: tokens.spacing.xs,
                background: tokens.colors.green, color: '#fff', border: 'none',
                borderRadius: tokens.radius.md, padding: `${tokens.spacing.sm} ${tokens.spacing.md}`,
                fontFamily: tokens.fonts.body, fontSize: '13px', fontWeight: 600, cursor: 'pointer',
              }}
            >
              <UserPlus size={14} />
              Importar {selectedIds.size} como Leads
            </button>
          )}
        </div>

        {/* Results Table */}
        <Card style={{ padding: 0, overflow: 'hidden' }}>
          {loading ? (
            <div style={{ padding: tokens.spacing.xxl, textAlign: 'center', color: tokens.colors.textMuted }}>
              <RefreshCw size={24} style={{ animation: 'spin 1s linear infinite' }} />
              <p style={{ marginTop: tokens.spacing.sm }}>Cargando prospectos...</p>
            </div>
          ) : filtered.length === 0 ? (
            <div style={{ padding: tokens.spacing.xxl, textAlign: 'center' }}>
              <Globe size={48} color={tokens.colors.textMuted} style={{ marginBottom: tokens.spacing.md }} />
              <p style={{ fontFamily: tokens.fonts.heading, fontSize: '16px', fontWeight: 700, color: tokens.colors.textPrimary }}>
                {prospectos.length === 0 ? 'Sin prospectos externos' : 'Sin resultados con estos filtros'}
              </p>
              <p style={{ fontSize: '14px', color: tokens.colors.textMuted, marginTop: tokens.spacing.xs }}>
                {prospectos.length === 0
                  ? 'Usa la barra de arriba para buscar empresas en Apollo.io o Hunter.io'
                  : 'Ajusta los filtros para ver más resultados'}
              </p>
              {prospectos.length === 0 && (
                <p style={{ fontSize: '12px', color: tokens.colors.textMuted, marginTop: tokens.spacing.md }}>
                  La integración de prospección aún no está activada. Contacta al administrador.
                </p>
              )}
            </div>
          ) : (
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ background: tokens.colors.bgHover }}>
                    <th style={{ ...thStyle, width: 40 }}>
                      <input
                        type="checkbox"
                        checked={selectedIds.size === filtered.length && filtered.length > 0}
                        onChange={e => {
                          if (e.target.checked) setSelectedIds(new Set(filtered.map(p => p.id)))
                          else setSelectedIds(new Set())
                        }}
                      />
                    </th>
                    <th style={thStyle}>Empresa</th>
                    <th style={thStyle}>Contacto</th>
                    <th style={thStyle}>Email</th>
                    <th style={thStyle}>Fuente</th>
                    <th style={thStyle}>Score</th>
                    <th style={thStyle}>Estado</th>
                    <th style={{ ...thStyle, width: 120 }}>Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map(p => {
                    const eb = estadoBadge(p.estado)
                    return (
                      <tr key={p.id} style={{ borderBottom: `1px solid ${tokens.colors.border}` }}>
                        <td style={tdStyle}>
                          <input
                            type="checkbox"
                            checked={selectedIds.has(p.id)}
                            onChange={e => {
                              const next = new Set(selectedIds)
                              if (e.target.checked) next.add(p.id); else next.delete(p.id)
                              setSelectedIds(next)
                            }}
                          />
                        </td>
                        <td style={tdStyle}>
                          <div>
                            <span style={{ fontWeight: 600, color: tokens.colors.textPrimary }}>{p.empresa}</span>
                            <div style={{ fontSize: '12px', color: tokens.colors.textMuted }}>
                              {p.industria}{p.ciudad ? ` · ${p.ciudad}` : ''}{p.empleados ? ` · ${p.empleados} emp.` : ''}
                            </div>
                          </div>
                        </td>
                        <td style={tdStyle}>
                          <div>
                            <span style={{ color: tokens.colors.textPrimary }}>{p.contacto_nombre || '—'}</span>
                            <div style={{ fontSize: '12px', color: tokens.colors.textMuted }}>{p.contacto_puesto || ''}</div>
                          </div>
                        </td>
                        <td style={tdStyle}>
                          <span style={{ fontSize: '13px', color: tokens.colors.textSecondary }}>{p.contacto_email || '—'}</span>
                        </td>
                        <td style={tdStyle}>
                          <span style={{
                            display: 'inline-flex', alignItems: 'center', gap: '4px',
                            fontSize: '12px', fontWeight: 600, color: fuenteColor(p.fuente),
                            textTransform: 'uppercase',
                          }}>
                            {p.fuente}
                          </span>
                        </td>
                        <td style={tdStyle}>
                          <div style={{
                            width: 36, height: 36, borderRadius: '50%', display: 'flex',
                            alignItems: 'center', justifyContent: 'center', fontWeight: 700,
                            fontSize: '13px',
                            background: p.score >= 70 ? tokens.colors.greenBg : p.score >= 40 ? tokens.colors.yellowBg : tokens.colors.redBg,
                            color: p.score >= 70 ? tokens.colors.green : p.score >= 40 ? tokens.colors.yellow : tokens.colors.red,
                          }}>
                            {p.score}
                          </div>
                        </td>
                        <td style={tdStyle}>
                          <span style={{
                            fontSize: '12px', fontWeight: 600, padding: '2px 8px',
                            borderRadius: tokens.radius.sm, background: eb.bg, color: eb.color,
                          }}>
                            {p.estado}
                          </span>
                        </td>
                        <td style={tdStyle}>
                          <div style={{ display: 'flex', gap: tokens.spacing.xs }}>
                            {p.estado !== 'importado' && (
                              <button
                                onClick={() => handleImportarComoLead(p)}
                                title="Importar como Lead"
                                style={actionBtn}
                              >
                                <UserPlus size={14} color={tokens.colors.green} />
                              </button>
                            )}
                            <button
                              onClick={() => handleEnriquecer(p)}
                              title="Enriquecer datos"
                              style={actionBtn}
                            >
                              <Zap size={14} color={tokens.colors.primary} />
                            </button>
                            {p.contacto_linkedin && (
                              <a href={p.contacto_linkedin} target="_blank" rel="noopener noreferrer" style={actionBtn}>
                                <Linkedin size={14} color={tokens.colors.blue} />
                              </a>
                            )}
                          </div>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          )}
        </Card>
      </div>
    </ModuleLayout>
  )
}

/* ─── styles ─── */
const thStyle: React.CSSProperties = {
  padding: `${tokens.spacing.sm} ${tokens.spacing.md}`,
  textAlign: 'left',
  fontSize: '12px',
  fontWeight: 600,
  color: tokens.colors.textMuted,
  fontFamily: tokens.fonts.heading,
  textTransform: 'uppercase',
  letterSpacing: '0.5px',
}

const tdStyle: React.CSSProperties = {
  padding: `${tokens.spacing.sm} ${tokens.spacing.md}`,
  fontSize: '14px',
  fontFamily: tokens.fonts.body,
  color: tokens.colors.textSecondary,
  verticalAlign: 'middle',
}

const actionBtn: React.CSSProperties = {
  background: 'linear-gradient(180deg, #FFFFFF 0%, #F3F4F6 100%)',
  border: `1px solid ${tokens.colors.border}`,
  borderRadius: tokens.radius.sm,
  padding: '6px',
  cursor: 'pointer',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  transition: 'all 0.18s ease',
  boxShadow: '0 1px 3px rgba(0,0,0,0.10), inset 0 1px 0 rgba(255,255,255,0.80), inset 0 -1px 0 rgba(0,0,0,0.05)',
}
