import { Filter } from 'lucide-react'
import { useState } from 'react'
import { ModuleLayout } from '../../components/layout/ModuleLayout'
import { Card } from '../../components/ui/Card'
import { KPICard } from '../../components/ui/KPICard'
import { DataTable } from '../../components/ui/DataTable'
import { Badge } from '../../components/ui/Badge'
import { Select } from '../../components/ui/Select'
import { tokens } from '../../lib/tokens'
import type { Column } from '../../components/ui/DataTable'

interface Lead {
  id: number
  empresa: string
  contacto: string
  etapa: string
  diasSinActividad: number
  valor: string
}

export default function MisLeads() {
  const [filtroEtapa, setFiltroEtapa] = useState('')

  const leads: Lead[] = [
    {
      id: 1,
      empresa: 'Transportes García',
      contacto: 'Roberto García',
      etapa: 'Cotización',
      diasSinActividad: 3,
      valor: '$125K',
    },
    {
      id: 2,
      empresa: 'Logística México SA',
      contacto: 'Ana Martínez',
      etapa: 'Negociación',
      diasSinActividad: 1,
      valor: '$320K',
    },
    {
      id: 3,
      empresa: 'Express Delivery',
      contacto: 'Juan Pérez',
      etapa: 'Contactado',
      diasSinActividad: 5,
      valor: '$85K',
    },
    {
      id: 4,
      empresa: 'Frigorífico del Norte',
      contacto: 'Carlos López',
      etapa: 'Nuevo',
      diasSinActividad: 8,
      valor: '$210K',
    },
    {
      id: 5,
      empresa: 'RyC Transportes',
      contacto: 'María Sánchez',
      etapa: 'Cotización',
      diasSinActividad: 2,
      valor: '$150K',
    },
  ]

  const etapaOptions = [
    { value: '', label: 'Todas las etapas' },
    { value: 'Nuevo', label: 'Nuevo' },
    { value: 'Contactado', label: 'Contactado' },
    { value: 'Cotización', label: 'Cotización' },
    { value: 'Negociación', label: 'Negociación' },
  ]

  const etapaColorMap: Record<string, 'primary' | 'green' | 'yellow' | 'orange' | 'red' | 'blue' | 'gray'> = {
    Nuevo: 'gray',
    Contactado: 'blue',
    Cotización: 'orange',
    Negociación: 'primary',
  }

  const filteredLeads = filtroEtapa
    ? leads.filter((lead) => lead.etapa === filtroEtapa)
    : leads

  const columns: Column<Lead>[] = [
    { key: 'empresa', label: 'Empresa', width: '25%' },
    { key: 'contacto', label: 'Contacto', width: '20%' },
    {
      key: 'etapa',
      label: 'Etapa',
      width: '15%',
      render: (row: Lead) => (
        <Badge color={etapaColorMap[row.etapa] || 'gray'}>{row.etapa}</Badge>
      ),
    },
    { key: 'diasSinActividad', label: 'Días sin Actividad', width: '20%', align: 'center' },
    { key: 'valor', label: 'Valor Est.', width: '20%', align: 'right' },
  ]

  return (
    <ModuleLayout titulo="Mis Leads" subtitulo="Panel Personal">
      <div className="space-y-6">
        {/* KPIs */}
        <div className="grid grid-cols-3 gap-4">
          <KPICard
            titulo="Leads Activos"
            valor="18"
            color="primary"
          />
          <KPICard
            titulo="Funnel Total"
            valor="$850K"
            color="green"
          />
          <KPICard
            titulo="Meta Avance"
            valor="62%"
            color="blue"
          />
        </div>

        {/* Tabla de Leads */}
        <Card>
          <div className="mb-4">
            <div className="flex items-center justify-between mb-4">
              <h2
                className="text-lg font-bold"
                style={{
                  color: tokens.colors.textPrimary,
                  fontFamily: tokens.fonts.heading,
                }}
              >
                Mis Leads
              </h2>
              <Filter className="w-5 h-5" style={{ color: tokens.colors.textSecondary }} />
            </div>

            {/* Filtro de Etapa */}
            <div style={{ maxWidth: '280px' }}>
              <Select
                options={etapaOptions}
                value={filtroEtapa}
                onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setFiltroEtapa(e.target.value)}
                label="Filtrar por Etapa"
              />
            </div>
          </div>

          <DataTable columns={columns} data={filteredLeads} />
        </Card>
      </div>
    </ModuleLayout>
  )
}
