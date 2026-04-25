import { useState, useEffect } from 'react'
import { FileText, Download, Eye, Upload, FolderOpen, Search, Plus } from 'lucide-react'
import { ModuleLayout } from '../../components/layout/ModuleLayout'
import { Card } from '../../components/ui/Card'
import { Button } from '../../components/ui/Button'
import { Badge } from '../../components/ui/Badge'
import { KPICard } from '../../components/ui/KPICard'
import { DataTable, type Column } from '../../components/ui/DataTable'
import { tokens } from '../../lib/tokens'
import { supabase } from '../../lib/supabase'

interface Documento {
  id: string
  nombre: string
  tipo: 'contrato' | 'carta_porte' | 'pod' | 'factura' | 'poliza' | 'plantilla' | 'otro'
  cliente?: string
  viaje_id?: string
  created_at: string
  estado: 'vigente' | 'vencido' | 'borrador' | 'firmado'
  url?: string
  tamano_kb?: number
  creado_por?: string
}

const tipoColores: Record<string, 'primary' | 'green' | 'yellow' | 'red' | 'blue' | 'orange' | 'gray'> = {
  contrato: 'primary',
  carta_porte: 'green',
  pod: 'blue',
  factura: 'yellow',
  poliza: 'orange',
  plantilla: 'gray',
  otro: 'gray',
}

const estadoColores: Record<string, 'green' | 'yellow' | 'red' | 'gray' | 'primary' | 'blue'> = {
  vigente: 'green',
  vencido: 'red',
  borrador: 'yellow',
  firmado: 'blue',
}

export default function Documentos() {
  const [documentos, setDocumentos] = useState<Documento[]>([])
  const [loading, setLoading] = useState(true)
  const [busqueda, setBusqueda] = useState('')
  const [filtroTipo, setFiltroTipo] = useState<string | null>(null)

  useEffect(() => {
    fetchDocumentos()
  }, [])

  async function fetchDocumentos() {
    setLoading(true)
    const { data, error } = await supabase
      .from('documentos')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(200)
    if (!error && data) setDocumentos(data)
    setLoading(false)
  }

  const filtered = documentos.filter(d => {
    if (filtroTipo && d.tipo !== filtroTipo) return false
    if (busqueda) {
      const q = busqueda.toLowerCase()
      return d.nombre.toLowerCase().includes(q) || (d.cliente || '').toLowerCase().includes(q)
    }
    return true
  })

  const totalDocs = documentos.length
  const vigentes = documentos.filter(d => d.estado === 'vigente' || d.estado === 'firmado').length
  const vencidos = documentos.filter(d => d.estado === 'vencido').length
  const plantillas = documentos.filter(d => d.tipo === 'plantilla').length

  const columns: Column<Documento>[] = [
    {
      key: 'nombre', label: 'Documento',
      render: (row) => (
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <FileText size={16} style={{ color: tokens.colors[tipoColores[row.tipo] || 'gray'], flexShrink: 0 }} />
          <div>
            <div style={{ color: tokens.colors.textPrimary, fontFamily: tokens.fonts.body, fontSize: '13px', fontWeight: 600 }}>{row.nombre}</div>
            {row.cliente && (
              <div style={{ color: tokens.colors.textMuted, fontFamily: tokens.fonts.body, fontSize: '11px' }}>{row.cliente}</div>
            )}
          </div>
        </div>
      )
    },
    {
      key: 'tipo', label: 'Tipo', width: '120px',
      render: (row) => <Badge color={tipoColores[row.tipo] || 'gray'}>{row.tipo.replace('_', ' ')}</Badge>
    },
    {
      key: 'estado', label: 'Estado', width: '100px',
      render: (row) => <Badge color={estadoColores[row.estado] || 'gray'}>{row.estado}</Badge>
    },
    {
      key: 'created_at', label: 'Fecha', width: '110px',
      render: (row) => (
        <span style={{ color: tokens.colors.textSecondary, fontFamily: tokens.fonts.body, fontSize: '12px' }}>
          {row.created_at}
        </span>
      )
    },
    {
      key: 'tamano_kb', label: 'Tamaño', width: '80px', align: 'right',
      render: (row) => (
        <span style={{ color: tokens.colors.textMuted, fontFamily: tokens.fonts.body, fontSize: '12px' }}>
          {row.tamano_kb ? `${(row.tamano_kb / 1024).toFixed(1)} MB` : '—'}
        </span>
      )
    },
    {
      key: 'acciones', label: 'Acciones', width: '100px', align: 'center',
      render: (row) => (
        <div style={{ display: 'flex', gap: '6px', justifyContent: 'center' }}>
          <button
            style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: tokens.colors.primary, padding: '4px' }}
            title="Ver"
            onClick={() => row.url && window.open(row.url, '_blank')}
          >
            <Eye size={16} />
          </button>
          <button
            style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: tokens.colors.green, padding: '4px' }}
            title="Descargar"
          >
            <Download size={16} />
          </button>
        </div>
      )
    },
  ]

  const tipos = ['contrato', 'carta_porte', 'pod', 'factura', 'poliza', 'plantilla']

  return (
    <ModuleLayout
      titulo="Documentos"
      subtitulo="Contratos, cartas porte, PODs y plantillas"
      moduloPadre={{ nombre: 'Configuración', ruta: '/admin/configuracion' }}
      acciones={
        <div style={{ display: 'flex', gap: tokens.spacing.sm }}>
          <Button size="sm" variant="secondary"><Upload size={16} /> Subir</Button>
          <Button size="sm"><Plus size={16} /> Nueva Plantilla</Button>
        </div>
      }
    >
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: tokens.spacing.md, marginBottom: tokens.spacing.lg }}>
        <KPICard titulo="Total Documentos" valor={totalDocs} subtitulo="en el sistema" color="primary" icono={<FolderOpen size={20} />} />
        <KPICard titulo="Vigentes" valor={vigentes} subtitulo="contratos activos" color="green" icono={<FileText size={20} />} />
        <KPICard titulo="Vencidos" valor={vencidos} subtitulo="requieren renovación" color="red" icono={<FileText size={20} />} />
        <KPICard titulo="Plantillas" valor={plantillas} subtitulo="disponibles" color="blue" icono={<FileText size={20} />} />
      </div>

      <Card>
        <div style={{ display: 'flex', alignItems: 'center', gap: tokens.spacing.md, marginBottom: tokens.spacing.md, flexWrap: 'wrap' }}>
          <div style={{
            display: 'flex', alignItems: 'center', gap: '8px',
            background: tokens.colors.bgHover, borderRadius: tokens.radius.md, padding: '6px 12px', flex: '0 0 260px'
          }}>
            <Search size={14} style={{ color: tokens.colors.textMuted }} />
            <input
              value={busqueda}
              onChange={e => setBusqueda(e.target.value)}
              placeholder="Buscar documento o cliente..."
              style={{
                background: 'transparent', border: 'none', outline: 'none',
                color: tokens.colors.textPrimary, fontFamily: tokens.fonts.body, fontSize: '13px', width: '100%',
              }}
            />
          </div>

          <span style={{ color: tokens.colors.textMuted, fontFamily: tokens.fonts.body, fontSize: '13px', fontWeight: 600 }}>Tipo:</span>
          {tipos.map(t => (
            <button
              key={t}
              onClick={() => setFiltroTipo(filtroTipo === t ? null : t)}
              style={{
                padding: '4px 12px', borderRadius: tokens.radius.full, fontSize: '12px',
                fontFamily: tokens.fonts.body, fontWeight: 500, border: 'none', cursor: 'pointer',
                background: filtroTipo === t ? tokens.colors.primary : tokens.colors.bgHover,
                color: filtroTipo === t ? '#fff' : tokens.colors.textSecondary,
              }}
            >
              {t.replace('_', ' ')}
            </button>
          ))}
        </div>

        <DataTable
          columns={columns}
          data={filtered}
          loading={loading}
          emptyMessage="Aún no hay documentos"
        />
      </Card>
    </ModuleLayout>
  )
}
