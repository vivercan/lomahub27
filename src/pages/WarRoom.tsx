import { useEffect, useState } from 'react'
import { AlertCircle } from 'lucide-react'
import { ModuleLayout } from '../components/layout/ModuleLayout'
import { Card } from '../components/ui/Card'
import { KPICard } from '../components/ui/KPICard'
import { Semaforo } from '../components/ui/Semaforo'
import { tokens } from '../lib/tokens'
import { supabase } from '../lib/supabase'

interface KPI {
  titulo: string
  valor: string
  color: 'green' | 'blue' | 'primary' | 'orange'
}

interface Area {
  nombre: string
  estado: 'verde' | 'amarillo' | 'naranja' | 'rojo' | 'gris'
}

interface Alerta {
  id: number
  mensaje: string
  tipo: 'warning' | 'danger' | 'info'
  hora: string
}

export default function WarRoom() {
  const [kpis, setKpis] = useState<KPI[]>([
    { titulo: 'Viajes Activos', valor: '0', color: 'green' as const },
    { titulo: 'Flota Disponible', valor: '0', color: 'blue' as const },
    { titulo: 'Facturación Hoy', valor: '$0', color: 'primary' as const },
    { titulo: 'Leads Nuevos', valor: '0', color: 'orange' as const },
  ])

  const areas: Area[] = [
    { nombre: 'Ventas', estado: 'verde' as const },
    { nombre: 'CS', estado: 'verde' as const },
    { nombre: 'Operaciones', estado: 'amarillo' as const },
    { nombre: 'CXC', estado: 'naranja' as const },
    { nombre: 'GPS', estado: 'rojo' as const },
  ]

  const [alertas, setAlertas] = useState<Alerta[]>([])

  useEffect(() => {
    const fetchKPIs = async () => {
      try {
        const { data: viajes, error: viajesError } = await supabase
          .from('viajes')
          .select('id, estado')
        if (!viajesError && viajes) {
          const activos = viajes.filter(v => v.estado === 'en_transito' || v.estado === 'programado' || v.estado === 'cargando').length
          setKpis(prev => [
            { ...prev[0], valor: activos.toString() },
            prev[1], prev[2], prev[3],
          ])
        }
      } catch (err) { console.error('Error fetching KPIs:', err) }
    }
    const fetchAlertas = async () => { try { setAlertas([]) } catch (err) { console.error('Error:', err) } }
    fetchKPIs()
    fetchAlertas()
  }, [])

  return (
    <ModuleLayout titulo="War Room" subtitulo="Control Operativo en Tiempo Real">
      <div className="space-y-6">
        <div className="grid grid-cols-4 gap-4">
          {kpis.map((kpi) => (
            <KPICard key={kpi.titulo} titulo={kpi.titulo} valor={kpi.valor} color={kpi.color} />
          ))}
        </div>
        <Card>
          <div className="mb-4">
            <h2 className="text-lg font-bold" style={{ color: tokens.colors.textPrimary, fontFamily: tokens.fonts.heading }}>Semáforo de Salud Operativa</h2>
          </div>
          <div className="grid grid-cols-5 gap-4">
            {areas.map((area) => (
              <div key={area.nombre} className="text-center">
                <div className="flex justify-center mb-3">
                  <Semaforo estado={area.estado} size="lg" pulse={area.estado !== 'verde'} />
                </div>
                <p className="text-sm" style={{ color: tokens.colors.textSecondary, fontFamily: tokens.fonts.body }}>{area.nombre}</p>
              </div>
            ))}
          </div>
        </Card>
        <Card>
          <div className="mb-4">
            <div className="flex items-center gap-2">
              <AlertCircle className="w-5 h-5" style={{ color: tokens.colors.orange }} />
              <h2 className="text-lg font-bold" style={{ color: tokens.colors.textPrimary, fontFamily: tokens.fonts.heading }}>Alertas del Día</h2>
            </div>
          </div>
          <div className="space-y-3">
            {alertas.length === 0 ? (
              <div style={{ textAlign: 'center', padding: tokens.spacing.lg, color: tokens.colors.textSecondary }}>
                <p style={{ fontSize: '0.95rem', fontWeight: '500', margin: 0 }}>Sin alertas</p>
                <p style={{ fontSize: '0.8rem', marginTop: tokens.spacing.xs }}>Las alertas se mostrarán cuando haya eventos</p>
              </div>
            ) : (
              alertas.map((alerta) => {
                const colorMap = {
                  warning: { bg: `${tokens.colors.yellow}1a`, border: `${tokens.colors.yellow}33`, icon: tokens.colors.yellow },
                  danger: { bg: `${tokens.colors.red}1a`, border: `${tokens.colors.red}33`, icon: tokens.colors.red },
                  info: { bg: `${tokens.colors.blue}1a`, border: `${tokens.colors.blue}33`, icon: tokens.colors.blue },
                }
                const style = colorMap[alerta.tipo]
                return (
                  <div key={alerta.id} className="flex items-start gap-3 p-3 rounded-lg border" style={{ background: style.bg, borderColor: style.border }}>
                    <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" style={{ color: style.icon }} />
                    <div className="flex-1"><p className="text-sm" style={{ color: tokens.colors.textPrimary, fontFamily: tokens.fonts.body }}>{alerta.mensaje}</p></div>
                    <p className="text-xs shrink-0" style={{ color: tokens.colors.textMuted, fontFamily: tokens.fonts.body }}>{alerta.hora}</p>
                  </div>
                )
              })
            )}
          </div>
        </Card>
      </div>
    </ModuleLayout>
  )
}
