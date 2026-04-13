import { useState, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { ModuleLayout } from '../../components/layout/ModuleLayout'
import { supabase } from '../../lib/supabase'
import { tokens } from '../../lib/tokens'

/* ———————————————————————————————————————————————————————————————
   COMERCIAL — Landing Page (15 cards)
   Cotizador, Mis Cotizaciones, Programa Semanal, Alta de Clientes,
   Workflow Alta, Portal Docs, Firma Digital, Prospección,
   Inteligencia, Presupuesto, Pareto, CXC x3, Chief of Staff
   ——————————————————————————————————————————————————————————————— */

const D = {
  bg: '#E8EBF0',
  font: tokens.fonts.heading,
  cardRadius: '14px',
  titleSize: '20px',
  titleWeight: 800,
  kpiSize: '28px',
  kpiWeight: 600,
  subSize: '9px',
} as const

const ICO_OPACITY = 0.20
const ico = (path: string, style: React.CSSProperties) => (
  <img src={`https://api.iconify.design/${path}.svg?color=%23ffffff`} alt="" style={style} />
)
const compose = (main: string) => () => (
  <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none', opacity: ICO_OPACITY }}>
    {ico(main, { position: 'absolute', right: '-2%', bottom: '-2%', width: '70%', height: '70%' })}
  </div>
)

const IconCotizador       = compose('hugeicons:invoice-03')
const IconMisCotizaciones = compose('hugeicons:file-management')
const IconPrograma        = compose('hugeicons:calendar-03')
const IconAltaClientes    = compose('hugeicons:user-add-01')
const IconWorkflowAlta    = compose('hugeicons:workflow-square-06')
const IconPortalDocs      = compose('hugeicons:folder-upload')
const IconFirmaDigital    = compose('hugeicons:signature')
const IconProspeccion     = compose('hugeicons:search-visual')
const IconInteligencia    = compose('hugeicons:analytics-01')
const IconPresupuesto     = compose('hugeicons:money-bag-02')
const IconPareto          = compose('hugeicons:chart-bar-line')
const IconCXCCartera      = compose('hugeicons:wallet-02')
const IconCXCAging        = compose('hugeicons:clock-01')
const IconCXCAcciones     = compose('hugeicons:alert-circle')
const IconChiefOfStaff    = compose('hugeicons:artificial-intelligence-04')

interface LandingCard {
  id: string; label: string; route: string; kpiLabel: string;
  icon: React.ReactNode; accent: string
}

/* Cards ocultados (parte del flujo Alta de Clientes, no módulos independientes):
   - Workflow Alta (/clientes/workflow-alta) — paso interno del flujo
   - Portal Documentos (/clientes/corporativos) — cliente sube docs por correo
   - Firma Digital (/cotizador/firma-digital) — paso final firma electrónica
   - Prospección (/ventas/prospeccion) — desconectado temporalmente
   - CXC Aging (/cxc/aging) — parte del flujo de asignación CXC
   Documentados en Notion P37. Rutas siguen activas en App.tsx */

const CARDS: LandingCard[] = [
  { id: 'cotizador',       label: 'Cotizador',            route: '/cotizador/nueva',            kpiLabel: 'Pendientes',       icon: <IconCotizador />,       accent: '#D97706' },
  { id: 'mis_cotizaciones', label: 'Mis Cotizaciones',    route: '/cotizador/mis-cotizaciones',  kpiLabel: 'Total',            icon: <IconMisCotizaciones />, accent: '#B45309' },
  { id: 'programa',        label: 'Programa Semanal',     route: '/ventas/programa-semanal',     kpiLabel: 'Esta semana',      icon: <IconPrograma />,        accent: '#0891B2' },
  { id: 'alta_clientes',   label: 'Alta de Clientes',     route: '/clientes/alta',               kpiLabel: 'Formulario',       icon: <IconAltaClientes />,    accent: '#2563EB' },
  { id: 'inteligencia',    label: 'Inteligencia',         route: '/inteligencia',                 kpiLabel: 'Rankings',         icon: <IconInteligencia />,    accent: '#6366F1' },
  { id: 'presupuesto',     label: 'Presupuesto',          route: '/inteligencia/presupuesto',     kpiLabel: 'Mensual',          icon: <IconPresupuesto />,     accent: '#15803D' },
  { id: 'pareto',          label: 'Análisis 80/20',       route: '/inteligencia/pareto',          kpiLabel: 'Pareto',           icon: <IconPareto />,          accent: '#EA580C' },
  { id: 'cxc_cartera',     label: 'CXC Cartera',          route: '/cxc/cartera',                  kpiLabel: 'Cuentas',          icon: <IconCXCCartera />,      accent: '#1D4ED8' },
  { id: 'cxc_acciones',    label: 'Acciones Cobro',       route: '/cxc/acciones',                 kpiLabel: 'Pendientes',       icon: <IconCXCAcciones />,     accent: '#BE123C' },
  { id: 'chief_of_staff',  label: 'Chief of Staff',       route: '/comunicaciones/chief-of-staff', kpiLabel: 'AI Briefing',     icon: <IconChiefOfStaff />,    accent: '#DB2777' },
]

export default function DashboardVentas() {
  const navigate = useNavigate()
  const [hovered, setHovered] = useState<string | null>(null)
  const [kpis, setKpis] = useState<Record<string, number>>({})
  const [loading, setLoading] = useState(true)

  const fetchKpis = useCallback(async () => {
    try {
      const [cots, prog, leads, altas, cxcCuentas] = await Promise.all([
        supabase.from('cotizaciones').select('*', { count: 'exact', head: true }).is('deleted_at', null).eq('estado', 'pendiente'),
        supabase.from('leads').select('*', { count: 'exact', head: true }).is('deleted_at', null).gte('created_at', new Date(Date.now() - 7 * 86400000).toISOString()),
        supabase.from('leads').select('*', { count: 'exact', head: true }).is('deleted_at', null),
        supabase.from('alta_clientes').select('*', { count: 'exact', head: true }).not('estado', 'eq', 'COMPLETADA'),
        supabase.from('cxc_cartera').select('*', { count: 'exact', head: true }),
      ])
      setKpis({
        cotizador: cots.count ?? 0,
        mis_cotizaciones: cots.count ?? 0,
        programa: prog.count ?? 0,
        alta_clientes: leads.count ?? 0,
        workflow_alta: altas.count ?? 0,
        cxc_cartera: cxcCuentas.count ?? 0,
      })
    } catch (e) {
      console.error('KPI fetch error:', e)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { fetchKpis() }, [fetchKpis])

  const getCardStyle = (isH: boolean, accent: string): React.CSSProperties => ({
    aspectRatio: '1 / 0.75',
    borderRadius: D.cardRadius,
    padding: '22px',
    background: accent,
    border: 'none',
    cursor: 'pointer',
    position: 'relative',
    overflow: 'hidden',
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'space-between',
    transition: 'transform 0.25s ease, box-shadow 0.25s ease',
    transform: isH ? 'translateY(-3px)' : 'none',
    boxShadow: isH ? '0 6px 12px rgba(0,0,0,0.15), 0 12px 32px rgba(0,0,0,0.1)' : '0 2px 4px rgba(0,0,0,0.08), 0 4px 12px rgba(0,0,0,0.06)',
  })

  return (
    <ModuleLayout titulo="Comercial" moduloPadre={{ nombre: 'Dashboard', ruta: '/dashboard' }}>
      <div style={{ background: D.bg, minHeight: 'calc(100vh - 120px)', padding: '32px 40px' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '14px' }}>
          {CARDS.map(card => {
            const isH = hovered === card.id
            return (
              <div
                key={card.id}
                style={getCardStyle(isH, card.accent)}
                onMouseEnter={() => setHovered(card.id)}
                onMouseLeave={() => setHovered(null)}
                onClick={() => navigate(card.route)}
              >
                <div style={{
                  position: 'absolute', inset: 0, pointerEvents: 'none', overflow: 'hidden', borderRadius: '14px',
                  transition: 'transform 0.6s cubic-bezier(0.23,1,0.32,1)',
                  transform: isH ? 'translate(4px,-4px) scale(1.05)' : 'none',
                }}>
                  {card.icon}
                </div>
                <div style={{ position: 'absolute', top: 14, right: 14, width: 6, height: 6, borderRadius: '50%', backgroundColor: 'rgba(255,255,255,0.35)' }} />
                <div style={{ fontFamily: D.font, fontSize: D.titleSize, fontWeight: D.titleWeight, color: '#FFFFFF', lineHeight: 1.2, position: 'relative', zIndex: 1, textAlign: 'center' }}>
                  {card.label}
                </div>
                <div>
                  <div style={{ fontFamily: D.font, fontSize: D.kpiSize, fontWeight: D.kpiWeight, color: '#FFFFFF', lineHeight: 1, position: 'relative', zIndex: 1 }}>
                    {loading ? '—' : (kpis[card.id] ?? 0).toLocaleString()}
                  </div>
                  <div style={{ fontFamily: D.font, fontSize: D.subSize, color: 'rgba(255,255,255,0.7)', marginTop: 3, position: 'relative', zIndex: 1 }}>
                    {card.kpiLabel}
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </ModuleLayout>
  )
}
