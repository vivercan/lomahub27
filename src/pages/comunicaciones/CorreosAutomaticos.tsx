import { useState, useEffect } from 'react'
import { Mail, Zap, Clock, CheckCircle, Send, Plus, Play, Pause } from 'lucide-react'
import { ModuleLayout } from '../../components/layout/ModuleLayout'
import { Card } from '../../components/ui/Card'
import { Button } from '../../components/ui/Button'
import { Badge } from '../../components/ui/Badge'
import { KPICard } from '../../components/ui/KPICard'
import { DataTable, type Column } from '../../components/ui/DataTable'
import { tokens } from '../../lib/tokens'
import { supabase } from '../../lib/supabase'

interface CorreoTemplate {
  id: string
  nombre: string
  asunto: string
  trigger_evento: 'nuevo_lead' | 'cotizacion_enviada' | 'seguimiento_3d' | 'seguimiento_7d' | 'bienvenida' | 'vencimiento' | 'cobranza' | 'manual'
  estado: 'activo' | 'pausado' | 'borrador'
  destinatarios: number
  enviados: number
  tasa_apertura: number
  ultima_ejecucion?: string
  creado_por?: string
}

const triggerLabels: Record<string, string> = {
  nuevo_lead: 'Nuevo Lead',
  cotizacion_enviada: 'Cotización Enviada',
  seguimiento_3d: 'Seguimiento 3 días',
  seguimiento_7d: 'Seguimiento 7 días',
  bienvenida: 'Bienvenida Cliente',
  vencimiento: 'Vencimiento Contrato',
  cobranza: 'Recordatorio Cobranza',
  manual: 'Envío Manual',
}

const triggerColores: Record<string, 'primary' | 'green' | 'yellow' | 'red' | 'blue' | 'orange'> = {
  nuevo_lead: 'primary',
  cotizacion_enviada: 'blue',
  seguimiento_3d: 'yellow',
  seguimiento_7d: 'orange',
  bienvenida: 'green',
  vencimiento: 'red',
  cobranza: 'red',
  manual: 'gray' as 'primary',
}

const estadoColores: Record<string, 'green' | 'yellow' | 'gray'> = {
  activo: 'green',
  pausado: 'yellow',
  borrador: 'gray',
}

export default function CorreosAutomaticos() {
  const [templates, setTemplates] = useState<CorreoTemplate[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchTemplates()
  }, [])

  async function fetchTemplates() {
    setLoading(true)
    const { data, error } = await supabase
      .from('correos_automaticos')
      .select('*')
      .order('nombre', { ascending: true })
    if (!error && data) setTemplates(data)
    setLoading(false)
  }

  const activos = templates.filter(t => t.estado === 'activo').length
  const totalEnviados = templates.reduce((s, t) => s + (t.enviados || 0), 0)
  const tasaPromedioApertura = templates.length > 0
    ? (templates.reduce((s, t) => s + (t.tasa_apertura || 0), 0) / templates.length).toFixed(1)
    : '0'
  const automaticos = templates.filter(t => t.trigger_evento !== 'manual').length

  const columns: Column<CorreoTemplate>[] = [
    {
      key: 'nombre', label: 'Template',
      render: (row) => (
        <div>
          <div style={{ color: tokens.colors.textPrimary, fontFamily: tokens.fonts.body, fontSize: '13px', fontWeight: 600 }}>{row.nombre}</div>
          <div style={{ color: tokens.colors.textMuted, fontFamily: tokens.fonts.body, fontSize: '11px' }}>{row.asunto}</div>
        </div>
      )
    },
    {
      key: 'trigger_evento', label: 'Trigger', width: '160px',
      render: (row) => (
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <Zap size={12} style={{ color: tokens.colors[triggerColores[row.trigger_evento] || 'primary'] }} />
          <Badge color={triggerColores[row.trigger_evento] || 'primary'}>{triggerLabels[row.trigger_evento] || row.trigger_evento}</Badge>
        </div>
      )
    },
    {
      key: 'estado', label: 'Estado', width: '100px',
      render: (row) => (
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          {row.estado === 'activo' ? <Play size={12} style={{ color: tokens.colors.green }} /> : <Pause size={12} style={{ color: tokens.colors.yellow }} />}
          <Badge color={estadoColores[row.estado] || 'gray'}>{row.estado}</Badge>
        </div>
      )
    },
    {
      key: 'enviados', label: 'Enviados', width: '90px', align: 'right',
      render: (row) => (
        <span style={{ color: tokens.colors.textPrimary, fontFamily: tokens.fonts.body, fontWeight: 600, fontSize: '13px' }}>
          {(row.enviados || 0).toLocaleString()}
        </span>
      )
    },
    {
      key: 'tasa_apertura', label: 'Apertura', width: '100px', align: 'center',
      render: (row) => {
        const color = row.tasa_apertura >= 30 ? 'green' : row.tasa_apertura >= 15 ? 'yellow' : 'red'
        return <Badge color={color}>{row.tasa_apertura.toFixed(1)}%</Badge>
      }
    },
    {
      key: 'ultima_ejecucion', label: 'Última Ejecución', width: '130px',
      render: (row) => (
        <span style={{ color: tokens.colors.textMuted, fontFamily: tokens.fonts.body, fontSize: '12px' }}>
          {row.ultima_ejecucion || 'Nunca'}
        </span>
      )
    },
  ]

  return (
    <ModuleLayout
      titulo="Correos Automáticos"
      subtitulo="Templates y triggers de seguimiento automatizado"
      acciones={<Button size="sm"><Plus size={16} /> Nuevo Template</Button>}
    >
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: tokens.spacing.md, marginBottom: tokens.spacing.lg }}>
        <KPICard titulo="Templates Activos" valor={activos} subtitulo={`de ${templates.length} total`} color="green" icono={<Mail size={20} />} />
        <KPICard titulo="Total Enviados" valor={totalEnviados.toLocaleString()} subtitulo="correos despachados" color="primary" icono={<Send size={20} />} />
        <KPICard titulo="Tasa Apertura" valor={`${tasaPromedioApertura}%`} subtitulo="promedio general" color="yellow" icono={<CheckCircle size={20} />} />
        <KPICard titulo="Automatizaciones" valor={automaticos} subtitulo="triggers activos" color="blue" icono={<Zap size={20} />} />
      </div>

      <Card>
        <DataTable
          columns={columns}
          data={templates}
          loading={loading}
          emptyMessage="Sin datos • Tabla vacía en Supabase"
        />
      </Card>
    </ModuleLayout>
  )
}
