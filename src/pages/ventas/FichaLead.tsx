import { useState, useEffect } from 'react'
import { useSearchParams } from 'react-router-dom'
import { Phone, Mail, MapPin, Plus } from 'lucide-react'
import { ModuleLayout } from '../../components/layout/ModuleLayout'
import { Card } from '../../components/ui/Card'
import { Button } from '../../components/ui/Button'
import { Badge } from '../../components/ui/Badge'
import { DataTable } from '../../components/ui/DataTable'
import { tokens } from '../../lib/tokens'
import { supabase } from '../../lib/supabase'
import type { Column } from '../../components/ui/DataTable'

interface Activity {
  fecha: string
  tipo: string
  resultado: string
}

interface Cliente {
  id: string
  nombre: string
  telefono: string | null
  email: string | null
  ciudad: string | null
  ruta: string | null
  fuente: string | null
}

export default function FichaLead() {
  const [searchParams] = useSearchParams()
  const leadId = searchParams.get('id')

  const [leadData, setLeadData] = useState<Cliente | null>(null)
  const [loading, setLoading] = useState(true)
  const [notFound, setNotFound] = useState(false)
  const [actividades, setActividades] = useState<Activity[]>([])

  const pipelineSteps = [
    { nombre: 'Nuevo', activo: false },
    { nombre: 'Contactado', activo: false },
    { nombre: 'Cotización', activo: false },
    { nombre: 'Negociación', activo: false },
    { nombre: 'Ganado', activo: false },
  ]

  useEffect(() => {
    const fetchLead = async () => {
      try {
        if (!leadId) {
          setNotFound(true)
          setLoading(false)
          return
        }

        const { data, error } = await supabase
          .from('clientes')
          .select('*')
          .eq('id', leadId)
          .single()

        if (error || !data) {
          setNotFound(true)
        } else {
          setLeadData(data)
        }

        setActividades([])
      } catch (err) {
        console.error('Error fetching lead:', err)
        setNotFound(true)
      } finally {
        setLoading(false)
      }
    }

    fetchLead()
  }, [leadId])

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

  if (loading) {
    return (
      <ModuleLayout titulo="Lead">
        <div style={{ textAlign: 'center', padding: tokens.spacing.xl, color: tokens.colors.textMuted }}>
          <p>Cargando...</p>
        </div>
      </ModuleLayout>
    )
  }

  if (notFound || !leadData) {
    return (
      <ModuleLayout titulo="Lead">
        <div style={{ textAlign: 'center', padding: tokens.spacing.xl, color: tokens.colors.textMuted }}>
          <p style={{ fontSize: '18px', fontWeight: 500, margin: 0 }}>Lead no encontrado</p>
          <p style={{ fontSize: '14px', marginTop: tokens.spacing.sm }}>No hay información disponible para este lead</p>
        </div>
      </ModuleLayout>
    )
  }

  return (
    <ModuleLayout titulo={`Lead — ${leadData.nombre}`}>
      <div className="grid grid-cols-3 gap-6">
        <div>
          <Card glow="primary">
            <div className="space-y-4">
              <div>
                <p className="text-xs uppercase tracking-wider mb-1" style={{ color: tokens.colors.textMuted, fontFamily: tokens.fonts.body }}>Empresa</p>
                <p className="text-lg font-bold" style={{ color: tokens.colors.textPrimary, fontFamily: tokens.fonts.heading }}>{leadData.nombre}</p>
              </div>

              {leadData.telefono && (
                <div className="flex items-center gap-3">
                  <Phone className="w-4 h-4" style={{ color: tokens.colors.primary }} />
                  <p style={{ color: tokens.colors.textSecondary, fontFamily: tokens.fonts.body }}>{leadData.telefono}</p>
                </div>
              )}

              {leadData.email && (
                <div className="flex items-center gap-3">
                  <Mail className="w-4 h-4" style={{ color: tokens.colors.primary }} />
                  <p style={{ color: tokens.colors.textSecondary, fontFamily: tokens.fonts.body }}>{leadData.email}</p>
                </div>
              )}

              {leadData.ciudad && (
                <div className="flex items-center gap-3">
                  <MapPin className="w-4 h-4" style={{ color: tokens.colors.primary }} />
                  <p style={{ color: tokens.colors.textSecondary, fontFamily: tokens.fonts.body }}>{leadData.ciudad}</p>
                </div>
              )}

              {(leadData.ruta || leadData.fuente) && (
                <div className="pt-4 border-t" style={{ borderColor: tokens.colors.border }}>
                  <p className="text-xs uppercase tracking-wider mb-2" style={{ color: tokens.colors.textMuted, fontFamily: tokens.fonts.body }}>Información</p>
                  <div className="space-y-2">
                    {leadData.ruta && (
                      <div>
                        <p className="text-xs" style={{ color: tokens.colors.textMuted, fontFamily: tokens.fonts.body }}>Ruta</p>
                        <p style={{           color: tokens.colors.textSecondary,
                            fontFamily: tokens.fonts.body,
                          }}
                        >
                          {leadData.ruta}
                        </p>
                      </div>
                    )}
                    {leadData.fuente && (
                      <div>
                        <p className="text-xs" style={{ color: tokens.colors.textMuted, fontFamily: tokens.fonts.body }}>Fuente</p>
                        <Badge>{leadData.fuente}</Badge>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          </Card>
        </div>

        <div className="col-span-2 space-y-6">
          <Card>
            <div className="mb-4">
              <p className="text-sm uppercase tracking-wider mb-4" style={{ color: tokens.colors.textMuted, fontFamily: tokens.fonts.body }}>Pipeline</p>
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
                  <p className="text-xs text-center" style={{ color: step.activo ? tokens.colors.primary : tokens.colors.textSecondary, fontFamily: tokens.fonts.body }}>
                    {step.nombre}
                  </p>
                </div>
              ))}
            </div>
          </Card>

          <Card>
            <div className="mb-4">
              <h3 className="text-lg font-bold" style={{ color: tokens.colors.textPrimary, fontFamily: tokens.fonts.heading }}>Historial de Actividades</h3>
            </div>
            {actividades.length === 0 ? (
              <div style={{ textAlign: 'center', padding: tokens.spacing.xl, color: tokens.colors.textMuted }}>
                <p style={{ fontSize: '14px', margin: 0 }}>Sin actividades registradas</p>
              </div>
            ) : (
              <DataTable columns={activityColumns} data={actividades} />
            )}
          </Card>

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
