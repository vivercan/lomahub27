import { useEffect, useMemo, useState } from 'react'
import { ModuleLayout } from '../components/layout/ModuleLayout'
import { supabase } from '../lib/supabase'

/* ———————————————————————————————————————————————————————————————
   CONTROL DE EQUIPO — Posicionamiento en tiempo real (WidgeTech GPS)
   Muestra conteo de cajas (secas) y thermos (refrigerados) por ubicación:
     · Patio Querétaro
     · Patio Monterrey
     · Patio Nvo Laredo
     · Patio Laredo TX
     · Cargando en Frontera
     · Descargando en Frontera
     · En tránsito
   Fuente: tabla `gps_tracking` (WidgeTech) + catálogo `cajas` con tipo {seca,thermo}
   TODO backend: endpoint WidgeTech real + módulo de Configuración para catálogo
   ——————————————————————————————————————————————————————————————— */

type Ubicacion =
  | 'patio_queretaro'
  | 'patio_monterrey'
  | 'patio_nvo_laredo'
  | 'patio_laredo_tx'
  | 'cargando_frontera'
  | 'descargando_frontera'
  | 'en_transito'

const UBICACIONES: { id: Ubicacion; label: string; color: string }[] = [
  { id: 'patio_queretaro',      label: 'Patio Querétaro',      color: '#1868E8' },
  { id: 'patio_monterrey',      label: 'Patio Monterrey',      color: '#0F56E0' },
  { id: 'patio_nvo_laredo',     label: 'Patio Nvo Laredo',     color: '#0B3AB5' },
  { id: 'patio_laredo_tx',      label: 'Patio Laredo TX',      color: '#061670' },
  { id: 'cargando_frontera',    label: 'Cargando en Frontera', color: '#FFB810' },
  { id: 'descargando_frontera', label: 'Descargando Frontera', color: '#FF7A00' },
  { id: 'en_transito',          label: 'En tránsito',          color: '#15C814' },
]

type Conteo = Record<Ubicacion, { cajas: number; thermos: number }>

const CONTEO_VACIO: Conteo = UBICACIONES.reduce((acc, u) => {
  acc[u.id] = { cajas: 0, thermos: 0 }
  return acc
}, {} as Conteo)

export default function ControlEquipo() {
  const [conteo, setConteo] = useState<Conteo>(CONTEO_VACIO)
  const [loading, setLoading] = useState(true)
  const [lastSync, setLastSync] = useState<Date | null>(null)

  useEffect(() => {
    // TODO: reemplazar por endpoint WidgeTech en tiempo real
    // Por ahora consultamos gps_tracking si existe; si no, queda en ceros
    const fetchData = async () => {
      setLoading(true)
      try {
        const { data } = await supabase
          .from('gps_tracking')
          .select('tipo_unidad, ubicacion')
          .limit(1000)
        if (Array.isArray(data)) {
          const next = { ...CONTEO_VACIO } as Conteo
          for (const row of data as Array<{ tipo_unidad?: string; ubicacion?: string }>) {
            const ub = (row.ubicacion as Ubicacion) || 'en_transito'
            if (!next[ub]) continue
            if (row.tipo_unidad === 'thermo') next[ub].thermos += 1
            else if (row.tipo_unidad === 'caja' || row.tipo_unidad === 'seca') next[ub].cajas += 1
          }
          setConteo(next)
        }
      } catch {
        // silencioso — quedan ceros hasta que el módulo esté conectado
      }
      setLastSync(new Date())
      setLoading(false)
    }
    fetchData()
  }, [])

  const totales = useMemo(() => {
    let cajas = 0, thermos = 0
    for (const u of UBICACIONES) {
      cajas += conteo[u.id].cajas
      thermos += conteo[u.id].thermos
    }
    return { cajas, thermos, total: cajas + thermos }
  }, [conteo])

  return (
    <ModuleLayout
      titulo="Control de Equipo"
      subtitulo="Posicionamiento en tiempo real · WidgeTech GPS"
    >
      <div style={{ padding: '20px 28px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
        {/* Totales */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px' }}>
          <TotalCard label="Total unidades" value={totales.total} accent="#0F172A" />
          <TotalCard label="Cajas secas"   value={totales.cajas}  accent="#1868E8" />
          <TotalCard label="Thermos"       value={totales.thermos} accent="#15C814" />
        </div>

        {/* Desglose por ubicación */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '14px' }}>
          {UBICACIONES.map(u => {
            const { cajas, thermos } = conteo[u.id]
            const total = cajas + thermos
            return (
              <div
                key={u.id}
                style={{
                  background: '#FFFFFF',
                  borderRadius: '14px',
                  padding: '18px 20px',
                  border: '1px solid rgba(0,0,0,0.06)',
                  boxShadow: '0 1px 2px rgba(0,0,0,0.04), 0 8px 16px -8px rgba(0,0,0,0.08)',
                  position: 'relative',
                  overflow: 'hidden',
                }}
              >
                <div style={{
                  position: 'absolute', top: 0, left: 0, width: '4px', height: '100%',
                  background: u.color,
                }} />
                <div style={{
                  fontFamily: "'Montserrat', sans-serif",
                  fontSize: '13px',
                  fontWeight: 600,
                  color: '#64748B',
                  textTransform: 'uppercase',
                  letterSpacing: '0.5px',
                  marginBottom: '8px',
                }}>
                  {u.label}
                </div>
                <div style={{
                  fontFamily: "'Montserrat', sans-serif",
                  fontSize: '32px',
                  fontWeight: 800,
                  color: '#0F172A',
                  lineHeight: 1,
                  marginBottom: '12px',
                }}>
                  {total}
                </div>
                <div style={{ display: 'flex', gap: '14px', fontSize: '12px', color: '#475569' }}>
                  <span><strong style={{ color: '#1868E8' }}>{cajas}</strong> cajas</span>
                  <span><strong style={{ color: '#15C814' }}>{thermos}</strong> thermos</span>
                </div>
              </div>
            )
          })}
        </div>

        {/* Footer info */}
        <div style={{
          fontFamily: "'Montserrat', sans-serif",
          fontSize: '11px',
          color: '#94A3B8',
          textAlign: 'right',
          marginTop: '6px',
        }}>
          {loading ? 'Sincronizando...' : lastSync && `Última sincronización: ${lastSync.toLocaleTimeString()}`}
          {' · '}Fuente: WidgeTech GPS · Catálogo: Configuración → Equipo
        </div>
      </div>
    </ModuleLayout>
  )
}

function TotalCard({ label, value, accent }: { label: string; value: number; accent: string }) {
  return (
    <div style={{
      background: '#FFFFFF',
      borderRadius: '14px',
      padding: '20px 24px',
      border: '1px solid rgba(0,0,0,0.06)',
      boxShadow: '0 1px 2px rgba(0,0,0,0.04), 0 8px 16px -8px rgba(0,0,0,0.08)',
      borderLeft: `4px solid ${accent}`,
    }}>
      <div style={{
        fontFamily: "'Montserrat', sans-serif",
        fontSize: '12px',
        fontWeight: 600,
        color: '#64748B',
        textTransform: 'uppercase',
        letterSpacing: '0.5px',
        marginBottom: '8px',
      }}>
        {label}
      </div>
      <div style={{
        fontFamily: "'Montserrat', sans-serif",
        fontSize: '38px',
        fontWeight: 800,
        color: '#0F172A',
        lineHeight: 1,
      }}>
        {value}
      </div>
    </div>
  )
}
