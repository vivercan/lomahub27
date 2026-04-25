import { useState, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { ModuleLayout } from '../../components/layout/ModuleLayout'
import { supabase } from '../../lib/supabase'
import { tokens } from '../../lib/tokens'
import { Pagination } from '../../components/ui/Pagination'
import { Plus, FileText, Send, CheckCircle, XCircle, Clock, Eye } from 'lucide-react'
import { useAuthContext } from '../../hooks/AuthContext'

interface Cotización {
  id: string
  folio: string
  estado: string
  tipo_operacion: string
  moneda: string
  total: number
  created_at: string
  fecha_envio: string | null
  fecha_vencimiento: string | null
  cliente: { razon_social: string } | null
}

const estadoConfig: Record<string, { label: string; color: string; icon: typeof Clock }> = {
  borrador: { label: 'Borrador', color: '#6B7280', icon: FileText },
  enviada: { label: 'Enviada', color: '#3B82F6', icon: Send },
  vista: { label: 'Vista', color: '#8B5CF6', icon: Eye },
  aceptada: { label: 'Aceptada', color: '#10B981', icon: CheckCircle },
  rechazada: { label: 'Rechazada', color: '#EF4444', icon: XCircle },
  vencida: { label: 'Vencida', color: '#F59E0B', icon: Clock },
}

export default function MisCotizaciones() {
  const navigate = useNavigate()
  const { user } = useAuthContext()
  const [cotizaciones, setCotizaciones] = useState<Cotización[]>([])
  const [loading, setLoading] = useState(true)
  const [filtro, setFiltro] = useState('todas')
  const [currentPage, setCurrentPage] = useState(1)
  const pageSize = 20

  const fetchCotizaciones = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from('cotizaciones')
        .select('id, folio, estado, tipo_operacion, moneda, total, created_at, fecha_envio, fecha_vencimiento, cliente:clientes(razon_social)')
        .order('created_at', { ascending: false })
        .limit(100)
      if (!error && data) setCotizaciones(data as Cotización[])
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { fetchCotizaciones() }, [fetchCotizaciones])

  const filtered = filtro === 'todas'
    ? cotizaciones
    : cotizaciones.filter(c => c.estado === filtro)

  const totalPages = Math.ceil(filtered.length / pageSize)
  const paginated = filtered.slice((currentPage - 1) * pageSize, currentPage * pageSize)

  const kpis = {
    total: cotizaciones.length,
    borradores: cotizaciones.filter(c => c.estado === 'borrador').length,
    enviadas: cotizaciones.filter(c => c.estado === 'enviada' || c.estado === 'vista').length,
    aceptadas: cotizaciones.filter(c => c.estado === 'aceptada').length,
  }

  return (
    <ModuleLayout titulo="Mis Cotizaciones" subtitulo="Cotizador Transfronterizo" moduloPadre={{ nombre: 'Comercial', ruta: '/ventas/dashboard' }}>
      <div style={{ padding: '24px', maxHeight: '100vh', overflow: 'hidden' }}>
        {/* KPI Bar */}
        <div style={{ display: 'flex', gap: '16px', marginBottom: '20px' }}>
          {[
            { label: 'Total', value: kpis.total, color: tokens.colors.primary },
            { label: 'Borradores', value: kpis.borradores, color: '#6B7280' },
            { label: 'En proceso', value: kpis.enviadas, color: '#3B82F6' },
            { label: 'Aceptadas', value: kpis.aceptadas, color: '#10B981' },
          ].map(k => (
            <div key={k.label} style={{
              flex: 1,
              background: tokens.colors.bgCard,
              border: `1px solid ${tokens.colors.border}`,
              borderRadius: '12px',
              padding: '16px',
              textAlign: 'center',
            }}>
              <div style={{ fontFamily: tokens.fonts.heading, fontSize: '28px', fontWeight: 700, color: k.color }}>{k.value}</div>
              <div style={{ fontFamily: tokens.fonts.body, fontSize: '12px', color: tokens.colors.textSecondary, marginTop: '4px' }}>{k.label}</div>
            </div>
          ))}
        </div>

        {/* Filter + New button */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
          <div style={{ display: 'flex', gap: '8px' }}>
            {['todas', 'borrador', 'enviada', 'aceptada', 'rechazada', 'vencida'].map(f => (
              <button key={f} onClick={() => { setFiltro(f); setCurrentPage(1) }} style={{
                padding: '6px 14px',
                borderRadius: '8px',
                border: filtro === f ? `2px solid ${tokens.colors.primary}` : `1px solid ${tokens.colors.border}`,
                background: filtro === f ? tokens.colors.primary : 'transparent',
                color: filtro === f ? '#fff' : tokens.colors.textSecondary,
                fontFamily: tokens.fonts.body,
                fontSize: '13px',
                cursor: 'pointer',
                transition: '0.2s',
              }}>
                {f === 'todas' ? 'Todas' : (estadoConfig[f]?.label || f)}
              </button>
            ))}
          </div>
          <button onClick={() => navigate('/cotizador/nueva')} style={{
            display: 'flex', alignItems: 'center', gap: '8px',
            padding: '10px 20px', borderRadius: '10px', border: 'none',
            background: tokens.colors.primary, color: '#fff',
            fontFamily: tokens.fonts.heading, fontSize: '14px', fontWeight: 600,
            cursor: 'pointer', transition: '0.2s',
          }}>
            <Plus size={18} /> Nueva Cotización
          </button>
        </div>

        {/* Table */}
        <div style={{
          background: tokens.colors.bgCard,
          border: `1px solid ${tokens.colors.border}`,
          borderRadius: '12px',
          overflow: 'hidden',
        }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontFamily: tokens.fonts.body }}>
            <thead>
              <tr style={{ background: tokens.colors.bgHover, borderBottom: `1px solid ${tokens.colors.border}` }}>
                {['Folio', 'Cliente', 'Tipo', 'Moneda', 'Total', 'Estado', 'Fecha', 'Vencimiento'].map(h => (
                  <th key={h} style={{ padding: '12px 16px', textAlign: 'left', fontSize: '12px', fontWeight: 600, color: tokens.colors.textSecondary, textTransform: 'uppercase' as const, letterSpacing: '0.5px' }}>
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {paginated.length === 0 ? (
                <tr><td colSpan={8} style={{ padding: '40px', textAlign: 'center', color: tokens.colors.textMuted, fontSize: '14px' }}>
                  {filtered.length === 0 ? 'No hay cotizaciones aún. Crea la primera.' : `No hay cotizaciones con estado "${filtro}"`}
                </td></tr>
              ) : paginated.map(c => {
                const est = estadoConfig[c.estado] || estadoConfig.borrador
                const Icon = est.icon
                return (
                  <tr key={c.id} style={{ borderBottom: `1px solid ${tokens.colors.border}`, cursor: 'pointer', transition: '0.15s' }}
                    onMouseEnter={e => (e.currentTarget.style.background = tokens.colors.bgHover)}
                    onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
                  >
                    <td style={{ padding: '14px 16px', fontWeight: 600, color: tokens.colors.primary, fontSize: '14px' }}>{c.folio || '-'}</td>
                    <td style={{ padding: '14px 16px', color: tokens.colors.textPrimary, fontSize: '14px' }}>{c.cliente?.razon_social || 'Sin cliente'}</td>
                    <td style={{ padding: '14px 16px', color: tokens.colors.textSecondary, fontSize: '13px' }}>{c.tipo_operacion}</td>
                    <td style={{ padding: '14px 16px', color: tokens.colors.textSecondary, fontSize: '13px' }}>{c.moneda}</td>
                    <td style={{ padding: '14px 16px', fontWeight: 600, color: tokens.colors.textPrimary, fontSize: '14px' }}>
                      {c.moneda === 'USD' ? '$' : 'MX$'}{(c.total || 0).toLocaleString('es-MX', { minimumFractionDigits: 2 })}
                    </td>
                    <td style={{ padding: '14px 16px' }}>
                      <span style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', padding: '4px 10px', borderRadius: '6px', background: est.color + '15', color: est.color, fontSize: '12px', fontWeight: 600 }}>
                        <Icon size={14} /> {est.label}
                      </span>
                    </td>
                    <td style={{ padding: '14px 16px', color: tokens.colors.textSecondary, fontSize: '13px' }}>
                      {new Date(c.created_at).toLocaleDateString('es-MX', { day: '2-digit', month: 'short', year: 'numeric' })}
                    </td>
                    <td style={{ padding: '14px 16px', color: c.fecha_vencimiento ? tokens.colors.textSecondary : tokens.colors.textMuted, fontSize: '13px' }}>
                      {c.fecha_vencimiento ? new Date(c.fecha_vencimiento).toLocaleDateString('es-MX', { day: '2-digit', month: 'short' }) : '-'}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        <Pagination
          currentPage={currentPage}
          totalPages={totalPages}
          totalItems={filtered.length}
          pageSize={pageSize}
          onPageChange={setCurrentPage}
        />
        </div>
      </div>
    </ModuleLayout>
  )
}
