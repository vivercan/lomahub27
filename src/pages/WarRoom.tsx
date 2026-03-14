import { AlertCircle } from 'lucide-react'
import { ModuleLayout } from '../components/layout/ModuleLayout'
import { Card } from '../components/ui/Card'
import { KPICard } from '../components/ui/KPICard'
import { Semaforo } from '../components/ui/Semaforo'
import { tokens } from '../lib/tokens'

export default function WarRoom() {
  const kpis = [
    { titulo: 'Viajes Activos', valor: '47', color: 'green' as const },
    { titulo: 'Flota Disponible', valor: '23', color: 'blue' as const },
    { titulo: 'Facturación Hoy', valor: '$1.2M', color: 'primary' as const },
    { titulo: 'Leads Nuevos', valor: '8', color: 'orange' as const },
  ]

  const areas = [
    { nombre: 'Ventas', estado: 'verde' as const },
    { nombre: 'CS', estado: 'verde' as const },
    { nombre: 'Operaciones', estado: 'amarillo' as const },
    { nombre: 'CXC', estado: 'naranja' as const },
    { nombre: 'GPS', estado: 'rojo' as const },
  ]

  const alertas = [
    {
      id: 1,
      mensaje: 'Ruta 47-B: Retraso estimado 45 min',
      tipo: 'warning',
      hora: '11:45',
    },
    {
      id: 2,
      mensaje: 'Cliente MX003: Pago vencido hace 5 días',
      tipo: 'danger',
      hora: '11:30',
    },
    {
      id: 3,
      mensaje: 'Conductor JM-001: Próximo descanso obligatorio en 2h',
      tipo: 'info',
      hora: '11:15',
    },
  ]

  return (
    <ModuleLayout titulo="War Room" subtitulo="Control Operativo en Tiempo Real">
      <div className="space-y-6">
        {/* KPIs */}
        <div className="grid grid-cols-4 gap-4">
          {kpis.map((kpi) => (
            <KPICard
              key={kpi.titulo}
              titulo={kpi.titulo}
              valor={kpi.valor}
              color={kpi.color}
            />
          ))}
        </div>

        {/* Semáforo de Salud */}
        <Card>
          <div className="mb-4">
            <h2
              className="text-lg font-bold"
              style={{
                color: tokens.colors.textPrimary,
                fontFamily: tokens.fonts.heading,
              }}
            >
              Semáforo de Salud Operativa
            </h2>
          </div>
          <div className="grid grid-cols-5 gap-4">
            {areas.map((area) => (
              <div key={area.nombre} className="text-center">
                <div className="flex justify-center mb-3">
                  <Semaforo estado={area.estado} size="lg" pulse={area.estado !== 'verde'} />
                </div>
                <p
                  className="text-sm"
                  style={{
                    color: tokens.colors.textSecondary,
                    fontFamily: tokens.fonts.body,
                  }}
                >
                  {area.nombre}
                </p>
              </div>
            ))}
          </div>
        </Card>

        {/* Alertas del Día */}
        <Card>
          <div className="mb-4">
            <div className="flex items-center gap-2">
              <AlertCircle
                className="w-5 h-5"
                style={{ color: tokens.colors.orange }}
              />
              <h2
                className="text-lg font-bold"
                style={{
                  color: tokens.colors.textPrimary,
                  fontFamily: tokens.fonts.heading,
                }}
              >
                Alertas del Día
              </h2>
            </div>
          </div>
          <div className="space-y-3">
            {alertas.map((alerta) => {
              const colorMap: Record<string, { bg: string; border: string; icon: string }> = {
                warning: {
                  bg: `${tokens.colors.yellow}1a`,
                  border: `${tokens.colors.yellow}33`,
                  icon: tokens.colors.yellow,
                },
                danger: {
                  bg: `${tokens.colors.red}1a`,
                  border: `${tokens.colors.red}33`,
                  icon: tokens.colors.red,
                },
                info: {
                  bg: `${tokens.colors.blue}1a`,
                  border: `${tokens.colors.blue}33`,
                  icon: tokens.colors.blue,
                },
              }
              const style = colorMap[alerta.tipo]

              return (
                <div
                  key={alerta.id}
                  className="flex items-start gap-3 p-3 rounded-lg border"
                  style={{
                    background: style.bg,
                    borderColor: style.border,
                  }}
                >
                  <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" style={{ color: style.icon }} />
                  <div className="flex-1">
                    <p
                      className="text-sm"
                      style={{
                        color: tokens.colors.textPrimary,
                        fontFamily: tokens.fonts.body,
                      }}
                    >
                      {alerta.mensaje}
                    </p>
                  </div>
                  <p
                    className="text-xs shrink-0"
                    style={{
                      color: tokens.colors.textMuted,
                      fontFamily: tokens.fonts.body,
                    }}
                  >
                    {alerta.hora}
                  </p>
                </div>
              )
            })}
          </div>
        </Card>
      </div>
    </ModuleLayout>
  )
}
