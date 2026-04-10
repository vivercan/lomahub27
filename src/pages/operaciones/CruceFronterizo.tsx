import type { ReactElement } from 'react'
import { useState, useEffect, Fragment } from 'react'
import { ModuleLayout } from '../../components/layout/ModuleLayout'
import { Card } from '../../components/Card'
import { KPICard } from '../../components/KPICard'
import { tokens } from '../../lib/tokens'
import { supabase } from '../../lib/supabase'
import {
  FileText,
  Globe,
  Truck,
  ShieldCheck,
  AlertTriangle,
  Clock,
  CheckCircle2,
  XCircle,
  Search,
  Filter,
  ChevronDown,
  ChevronRight,
  Upload,
  Eye,
  Download,
  RefreshCw,
  ArrowRightLeft,
  MapPin,
} from 'lucide-react'

/* ─── types ─── */
interface CruceDoc {
  id: string
  viaje_id: string
  tipo_operacion: 'IMPO' | 'EXPO'
  cruce: string
  pedimento: string
  factura_comercial: boolean
  packing_list: boolean
  carta_porte: boolean
  certificado_origen: boolean
  permiso_previo: boolean
  pedimento_pagado: boolean
  inspeccion_aduana: 'pendiente' | 'aprobada' | 'rechazada' | 'no_requerida'
  estatus_semaforo: 'verde' | 'amarillo' | 'rojo'
  notas: string
  created_at: string
  updated_at: string
  /* join */
  viaje_origen?: string
  viaje_destino?: string
  cliente_nombre?: string
  tracto_numero?: string
}

/* ─── component ─── */
export default function CruceFronterizo(): ReactElement {
  const [docs, setDocs] = useState<CruceDoc[]>([])
  const [loading, setLoading] = useState(true)
  const [filtroTipo, setFiltroTipo] = useState<string>('todos')
  const [filtroCruce, setFiltroCruce] = useState<string>('todos')
  const [filtroSemaforo, setFiltroSemaforo] = useState<string>('todos')
  const [searchQ, setSearchQ] = useState('')
  const [expandedId, setExpandedId] = useState<string | null>(null)

  useEffect(() => { fetchData() }, [])

  async function fetchData() {
    setLoading(true)
    try {
      const { data, error } = await supabase
        .from('cruce_documentos')
        .select('*, viajes(origen, destino, cliente_id, tracto_id, clientes(razon_social), tractos(numero_economico))')
        .is('deleted_at', null)
        .order('created_at', { ascending: false })
        .limit(200)

      if (error) { console.error('cruce_documentos:', error); setDocs([]); return }
      setDocs((data || []).map((d: any) => ({
        ...d,
        viaje_origen: d.viajes?.origen || '',
        viaje_destino: d.viajes?.destino || '',
        cliente_nombre: d.viajes?.clientes?.razon_social || '',
        tracto_numero: d.viajes?.tractos?.numero_economico || '',
      })))
    } finally { setLoading(false) }
  }

  const stats = {
    total: docs.length,
    impo: docs.filter(d => d.tipo_operacion === 'IMPO').length,
    expo: docs.filter(d => d.tipo_operacion === 'EXPO').length,
    pendientes: docs.filter(d => d.estatus_semaforo === 'rojo' || d.estatus_semaforo === 'amarillo').length,
  }

  const filtered = docs.filter(d => {
    if (filtroTipo !== 'todos' && d.tipo_operacion !== filtroTipo) return false
    if (filtroCruce !== 'todos' && d.cruce !== filtroCruce) return false
    if (filtroSemaforo !== 'todos' && d.estatus_semaforo !== filtroSemaforo) return false
    if (searchQ) {
      const q = searchQ.toLowerCase()
      if (!d.pedimento.toLowerCase().includes(q) && !d.cliente_nombre?.toLowerCase().includes(q) && !d.viaje_origen?.toLowerCase().includes(q)) return false
    }
    return true
  })

  const cruces = [...new Set(docs.map(d => d.cruce))].filter(Boolean)

  const semaforoStyle = (s: string) => {
    if (s === 'verde') return { bg: tokens.colors.greenBg, color: tokens.colors.green, icon: <CheckCircle2 size={14} /> }
    if (s === 'amarillo') return { bg: tokens.colors.yellowBg, color: tokens.colors.yellow, icon: <Clock size={14} /> }
    return { bg: tokens.colors.redBg, color: tokens.colors.red, icon: <AlertTriangle size={14} /> }
  }

  const docCheck = (label: string, ok: boolean) => (
    <div style={{ display: 'flex', alignItems: 'center', gap: tokens.spacing.xs, padding: `${tokens.spacing.xs} 0` }}>
      {ok ? <CheckCircle2 size={14} color={tokens.colors.green} /> : <XCircle size={14} color={tokens.colors.red} />}
      <span style={{ fontSize: '13px', color: ok ? tokens.colors.textPrimary : tokens.colors.textMuted }}>{label}</span>
    </div>
  )

  return (
    <ModuleLayout titulo="Cruce Fronterizo — Docs Aduanales">
      <div style={{ padding: tokens.spacing.lg, minHeight: '100vh', background: tokens.colors.bgMain }}>
        {/* KPIs */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: tokens.spacing.md, marginBottom: tokens.spacing.lg }}>
          <KPICard icon={<FileText size={20} />} label="Cruces Registrados" value={stats.total} />
          <KPICard icon={<ArrowRightLeft size={20} />} label="Importaciones" value={stats.impo} />
          <KPICard icon={<Truck size={20} />} label="Exportaciones" value={stats.expo} />
          <KPICard icon={<AlertTriangle size={20} />} label="Pendientes Docs" value={stats.pendientes} />
        </div>

        {/* Filters */}
        <div style={{ display: 'flex', gap: tokens.spacing.sm, marginBottom: tokens.spacing.md, flexWrap: 'wrap', alignItems: 'center' }}>
          <div style={{ position: 'relative', flex: 1, maxWidth: 300 }}>
            <Search size={16} color={tokens.colors.textMuted} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)' }} />
            <input
              type="text" value={searchQ} onChange={e => setSearchQ(e.target.value)}
              placeholder="Pedimento, cliente, origen..."
              style={{
                width: '100%', background: tokens.colors.bgCard, color: tokens.colors.textPrimary,
                border: `1px solid ${tokens.colors.border}`, borderRadius: tokens.radius.md,
                padding: `${tokens.spacing.sm} ${tokens.spacing.md} ${tokens.spacing.sm} 36px`,
                fontFamily: tokens.fonts.body, fontSize: '14px', outline: 'none',
              }}
            />
          </div>
          {[
            { val: filtroTipo, set: setFiltroTipo, opts: [['todos', 'Tipo: Todos'], ['IMPO', 'IMPO'], ['EXPO', 'EXPO']] },
            { val: filtroSemaforo, set: setFiltroSemaforo, opts: [['todos', 'Semáforo: Todos'], ['verde', 'Verde'], ['amarillo', 'Amarillo'], ['rojo', 'Rojo']] },
          ].map((f, i) => (
            <select key={i} value={f.val} onChange={e => f.set(e.target.value)} style={selectStyle}>
              {f.opts.map(([v, l]) => <option key={v} value={v}>{l}</option>)}
            </select>
          ))}
          {cruces.length > 0 && (
            <select value={filtroCruce} onChange={e => setFiltroCruce(e.target.value)} style={selectStyle}>
              <option value="todos">Cruce: Todos</option>
              {cruces.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          )}
        </div>

        {/* Table */}
        <Card style={{ padding: 0, overflow: 'hidden' }}>
          {loading ? (
            <div style={{ padding: tokens.spacing.xxl, textAlign: 'center', color: tokens.colors.textMuted }}>
              <RefreshCw size={24} style={{ animation: 'spin 1s linear infinite' }} />
              <p style={{ marginTop: tokens.spacing.sm }}>Cargando cruces...</p>
            </div>
          ) : filtered.length === 0 ? (
            <div style={{ padding: tokens.spacing.xxl, textAlign: 'center' }}>
              <Globe size={48} color={tokens.colors.textMuted} style={{ marginBottom: tokens.spacing.md }} />
              <p style={{ fontFamily: tokens.fonts.heading, fontSize: '16px', fontWeight: 700, color: tokens.colors.textPrimary }}>
                Sin cruces fronterizos registrados
              </p>
              <p style={{ fontSize: '14px', color: tokens.colors.textMuted, marginTop: tokens.spacing.xs }}>
                Registra un cruce fronterizo para comenzar el tracking
              </p>
            </div>
          ) : (
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ background: tokens.colors.bgHover }}>
                  {['', 'Pedimento', 'Tipo', 'Cruce', 'Cliente', 'Ruta', 'Semáforo', 'Inspección', 'Fecha'].map(h => (
                    <th key={h} style={thStyle}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.map(d => {
                  const sem = semaforoStyle(d.estatus_semaforo)
                  const isOpen = expandedId === d.id
                  return (
                    <Fragment key={d.id}>
                      <tr style={{ borderBottom: `1px solid ${tokens.colors.border}`, cursor: 'pointer' }} onClick={() => setExpandedId(isOpen ? null : d.id)}>
                        <td style={tdStyle}>{isOpen ? <ChevronDown size={14} /> : <ChevronRight size={14} />}</td>
                        <td style={tdStyle}><span style={{ fontWeight: 600, color: tokens.colors.textPrimary }}>{d.pedimento || '—'}</span></td>
                        <td style={tdStyle}>
                          <span style={{
                            fontSize: '12px', fontWeight: 700, padding: '2px 8px',
                            borderRadius: tokens.radius.sm,
                            background: d.tipo_operacion === 'IMPO' ? tokens.colors.blueBg : tokens.colors.orangeLight,
                            color: d.tipo_operacion === 'IMPO' ? tokens.colors.blue : tokens.colors.orange,
                          }}>
                            {d.tipo_operacion}
                          </span>
                        </td>
                        <td style={tdStyle}><span style={{ fontSize: '13px' }}>{d.cruce}</span></td>
                        <td style={tdStyle}><span style={{ fontSize: '13px' }}>{d.cliente_nombre || '—'}</span></td>
                        <td style={tdStyle}>
                          <span style={{ fontSize: '12px', color: tokens.colors.textMuted }}>
                            {d.viaje_origen} → {d.viaje_destino}
                          </span>
                        </td>
                        <td style={tdStyle}>
                          <span style={{
                            display: 'inline-flex', alignItems: 'center', gap: '4px',
                            fontSize: '12px', fontWeight: 600, padding: '2px 8px',
                            borderRadius: tokens.radius.sm, background: sem.bg, color: sem.color,
                          }}>
                            {sem.icon} {d.estatus_semaforo}
                          </span>
                        </td>
                        <td style={tdStyle}>
                          <span style={{
                            fontSize: '12px',
                            color: d.inspeccion_aduana === 'aprobada' ? tokens.colors.green
                              : d.inspeccion_aduana === 'rechazada' ? tokens.colors.red
                              : tokens.colors.textMuted,
                          }}>
                            {d.inspeccion_aduana}
                          </span>
                        </td>
                        <td style={tdStyle}>
                          <span style={{ fontSize: '12px', color: tokens.colors.textMuted }}>
                            {new Date(d.created_at).toLocaleDateString('es-MX')}
                          </span>
                        </td>
                      </tr>
                      {isOpen && (
                        <tr key={`${d.id}-detail`}>
                          <td colSpan={9} style={{ padding: tokens.spacing.md, background: tokens.colors.bgHover }}>
                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: tokens.spacing.lg }}>
                              <div>
                                <p style={{ fontSize: '12px', fontWeight: 700, color: tokens.colors.textMuted, marginBottom: tokens.spacing.sm, textTransform: 'uppercase' }}>Documentos Requeridos</p>
                                {docCheck('Factura Comercial', d.factura_comercial)}
                                {docCheck('Packing List', d.packing_list)}
                                {docCheck('Carta Porte', d.carta_porte)}
                                {docCheck('Certificado de Origen', d.certificado_origen)}
                                {docCheck('Permiso Previo', d.permiso_previo)}
                                {docCheck('Pedimento Pagado', d.pedimento_pagado)}
                              </div>
                              <div>
                                <p style={{ fontSize: '12px', fontWeight: 700, color: tokens.colors.textMuted, marginBottom: tokens.spacing.sm, textTransform: 'uppercase' }}>Detalles del Cruce</p>
                                <div style={{ fontSize: '13px', color: tokens.colors.textSecondary, lineHeight: 1.8 }}>
                                  <div><strong>Tracto:</strong> {d.tracto_numero || '—'}</div>
                                  <div><strong>Viaje ID:</strong> {d.viaje_id}</div>
                                  <div><strong>Última actualización:</strong> {d.updated_at ? new Date(d.updated_at).toLocaleString('es-MX') : '—'}</div>
                                </div>
                              </div>
                              <div>
                                <p style={{ fontSize: '12px', fontWeight: 700, color: tokens.colors.textMuted, marginBottom: tokens.spacing.sm, textTransform: 'uppercase' }}>Notas</p>
                                <p style={{ fontSize: '13px', color: tokens.colors.textSecondary, lineHeight: 1.6 }}>
                                  {d.notas || 'Sin notas registradas.'}
                                </p>
                              </div>
                            </div>
                          </td>
                        </tr>
                      )}
                    </Fragment>
                  )
                })}
              </tbody>
            </table>
          )}
        </Card>
      </div>
    </ModuleLayout>
  )
}

/* ─── styles ─── */
const thStyle: React.CSSProperties = {
  padding: `${tokens.spacing.sm} ${tokens.spacing.md}`, textAlign: 'left',
  fontSize: '12px', fontWeight: 600, color: tokens.colors.textMuted,
  fontFamily: tokens.fonts.heading, textTransform: 'uppercase', letterSpacing: '0.5px',
}
const tdStyle: React.CSSProperties = {
  padding: `${tokens.spacing.sm} ${tokens.spacing.md}`, fontSize: '14px',
  fontFamily: tokens.fonts.body, color: tokens.colors.textSecondary, verticalAlign: 'middle',
}
const selectStyle: React.CSSProperties = {
  background: tokens.colors.bgCard, color: tokens.colors.textPrimary,
  border: `1px solid ${tokens.colors.border}`, borderRadius: tokens.radius.md,
  padding: `${tokens.spacing.xs} ${tokens.spacing.md}`, fontFamily: tokens.fonts.body, fontSize: '13px',
}
