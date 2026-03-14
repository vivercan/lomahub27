import { Phone, Mail, MapPin, Plus } from 'lucide-react'
import { ModuleLayout } from '../../components/layout/ModuleLayout'
import { Card } from '../../components/ui/Card'
import { Button } from '../../components/ui/Button'
import { Badge } from '../../components/ui/Badge'
import { DataTable } from '../../components/ui/DataTable'
import { tokens } from '../../lib/tokens'
import type { Column } from '../../components/ui/DataTable'

interface Activity {
  fecha: string
  tipo: string
  resultado: string
}

export default function FichaLead() {
  const leadData = {
    nombre: 'Transportes García',
    telefono: '+52 55 1234 5678',
    email: 'info@transportesgarcia.com',
    ciudad: 'Mexico City',
    ruta: 'CDMX - Monterrey',
    fuente: 'Referencia',
  }

  const pipelineSteps = [
    { nombre: 'Nuevo', activo: false },
    { nombre: 'Contactado', activo: false },
    { nombre: 'Cotización', activo: true },
    { nombre: 'Negociación', activo: false },
    { nombre: 'Ganado', activo: false },
  ]

  const actividades: Activity[] = [
    {
      fecha: '2024-03-10',
      tipo: 'Llamada',
      resultado: 'Contacto exitoso - Presentación cliente',
    },
    {
      fecha: '2024-03-08',
      tipo: 'Email',
      resultado: 'Envío de propuesta inicial',
    },
    {
      fecha: '2024-03-05',
      tipo: 'Reunión',
      resultado: 'Presentación en oficina del cliente',
    },
  ]

  const activityColumns: Column<Activity>[] = [
    { key: 'fecha', label: 'Fecha', width: '20%' },
    {
      key: 'tipo',
      label: 'Tipo',
      width: '20%',
      render: (row: Activity) => {
        const colorMap: Record<string, 'primary' | 'green' | 'yellow' | 'orange' | 'red' | 'blue' | 'gray'> = {
          Llamada: 'blue',
          Email: 'gray',
          Reunión: 'primary',
        }
        return <Badge color={colorMap[row.tipo] || 'gray'}>{row.tipo}</Badge>
      },
    },
    { key: 'resultado', label: 'Resultado', width: '60%' },
  ]

  return (
    <ModuleLayout titulo={`Lead — ${leadData.nombre}`}>
      <div className="grid grid-cols-3 gap-6">
        {/* Left Column - Lead Details */}
        <div>
          <Card glow="primary">
            <div className="space-y-4">
              <div>
                <p
                  className="text-xs uppercase tracking-wider mb-1"
                  style={{
                    color: tokens.colors.textMuted,
                    fontFamily: tokens.fonts.body,
                  }}
                >
                  Empresa
                </p>
                <p
                  className="text-lg font-bold"
                  style={{
                    color: tokens.colors.textPrimary,
                    fontFamily: tokens.fonts.heading,
                  }}
                >
                  {leadData.nombre}
                </p>
              </div>

              <div className="flex items-center gap-3">
                <Phone className="w-4 h-4" style={{ color: tokens.colors.primary }} />
                <p
                  style={{
                    color: tokens.colors.textSecondary,
                    fontFamily: tokens.fonts.body,
                  }}
                >
                  {leadData.telefono}
                </p>
              </div>

              <div className="flex items-center gap-3">
                <Mail className="w-4 h-4" style={{ color: tokens.colors.primary }} />
                <p
                  style={{
                    color: tokens.colors.textSecondary,
                    fontFamily: tokens.fonts.body,
                  }}
                >
                  {leadData.email}
                </p>
              </div>

              <div className="flex items-center gap-3">
                <MapPin className="w-4 h-4" style={{ color: tokens.colors.primary }} />
                <p
                  style={{
                    color: tokens.colors.textSecondary,
                    fontFamily: tokens.fonts.body,
                  }}
                >
                  {leadData.ciudad}
                </p>
              </div>

              <div className="pt-4 border-t" style={{ borderColor: tokens.colors.border }}>
                <p
                  className="text-xs uppercase tracking-wider mb-2"
                  style={{
                    color: tokens.colors.textMuted,
                    fontFamily: tokens.fonts.body,
                  }}
                >
                  Información
                </p>
                <div className="space-y-2">
                  <div>
                    <p
                      className="text-xs"
                      style={{
                        color: tokens.colors.textMuted,
                        fontFamily: tokens.fonts.body,
                      }}
                    >
                      Ruta
                    </p>
                    <p
                      style={{
                        color: tokens.colors.textSecondary,
                        fontFamily: tokens.fonts.body,
                      }}
                    >
                      {leadData.ruta}
                    </p>
                  </div>
                  <div>
                    <p
                      className="text-xs"
                      style={{
                        color: tokens.colors.textMuted,
                        fontFamily: tokens.fonts.body,
                      }}
                    >
                      Fuente
                    </p>
                    <Badge>{leadData.fuente}</Badge>
                  </div>
                </div>
              </div>
            </div>
          </Card>
        </div>

        {/* Right Column - Pipeline & Activities */}
        <div className="col-span-2 space-y-6">
          {/* Pipeline */}
          <Card>
            <div className="mb-4">
              <p
                className="text-sm uppercase tracking-wider mb-4"
                style={{
                  color: tokens.colors.textMuted,
                  fontFamily: tokens.fonts.body,
                }}
              >
                Pipeline
              </p>
            </div>
            <div className="flex justify-between items-center">
              {pipelineSteps.map((step, idx) => (
                <div key={step.nombre} className="flex flex-col items-center">
                  <div
                    className="w-10 h-10 rounded-full flex items-center justify-center text-xs font-bold border mb-2"
                    style={{
                      background: step.activo ? tokens.colors.primary : tokens.colors.bgHover,
                      borderColor: step.activo ? tokens.colors.primary : tokens.colors.border,
                      color: step.activo ? '#fff' : tokens.colors.textSecondary,
                    }}
                  >
                    {idx + 1}
                  </div>
                  <p
                    className="text-xs text-center"
                    style={{
                      color: step.activo ? tokens.colors.primary : tokens.colors.textSecondary,
                      fontFamily: tokens.fonts.body,
                    }}
                  >
                    {step.nombre}
                  </p>
                  {idx < pipelineSteps.length - 1 && (
                    <div
                      className="absolute w-8 h-0.5 ml-12 mt-5"
                      style={{ background: tokens.colors.border }}
                    />
                  )}
                </div>
              ))}
            </div>
          </Card>

          {/* Historial de Actividades */}
          <Card>
            <div className="mb-4">
              <h3
                className="text-lg font-bold"
                style={{
                  color: tokens.colors.textPrimary,
                  fontFamily: tokens.fonts.heading,
                }}
              >
                Historial de Actividades
              </h3>
            </div>
            <DataTable columns={activityColumns} data={actividades} />
          </Card>

          {/* Action Buttons */}
          <div className="flex gap-2">
            <Button variant="primary">
              <Plus className="w-4 h-4" />
              Registrar Actividad
            </Button>
            <Button variant="secondary">Crear Cotización</Button>
            <Button variant="secondary">Convertir a Cliente</Button>
          </div>
        </div>
      </div>
    </ModuleLayout>
  )
}
