import { useState, useEffect } from 'react'
import { Plug, Wifi, WifiOff, RefreshCw, Clock, CheckCircle, AlertTriangle, Settings } from 'lucide-react'
import { ModuleLayout } from '../../components/layout/ModuleLayout'
import { Card } from '../../components/ui/Card'
import { Button } from '../../components/ui/Button'
import { KPICard } from '../../components/ui/KPICard'
import { tokens } from '../../lib/tokens'
import { supabase } from '../../lib/supabase'

interface Integracion {
  id: string
  nombre: string
  descripcion: string
  tipo: 'gps' | 'whatsapp' | 'facturacion' | 'erp' | 'email' | 'anodos' | 'maps' | 'supabase'
  estado: 'conectado' | 'desconectado' | 'error' | 'configurando'
  ultima_sync?: string
  registros_sync?: number
  api_key_configurada: boolean
  url_endpoint?: string
}

const defaultIntegraciones: Integracion[] = [
  { id: '1', nombre: 'Supabase', descripcion: 'Base de datos y autenticación', tipo: 'supabase', estado: 'conectado', ultima_sync: new Date().toLocaleDateString('es-MX', { timeZone: 'America/Mexico_City' }), registros_sync: 4739, api_key_configurada: true },
  { id: '2', nombre: 'GPS Tracking', descripcion: 'Posición en tiempo real de unidades', tipo: 'gps', estado: 'conectado', ultima_sync: new Date().toLocaleDateString('es-MX', { timeZone: 'America/Mexico_City' }), registros_sync: 271, api_key_configurada: true },
  { id: '3', nombre: 'WhatsApp Business', descripcion: 'Mensajería con clientes', tipo: 'whatsapp', estado: 'desconectado', api_key_configurada: false },
  { id: '4', nombre: 'ANODOS ERP', descripcion: 'Sincronización contable y facturación', tipo: 'anodos', estado: 'desconectado', api_key_configurada: false },
  { id: '5', nombre: 'Resend Email', descripcion: 'Correos transaccionales y marketing', tipo: 'email', estado: 'desconectado', api_key_configurada: false },
  { id: '6', nombre: 'Facturación CFDI', descripcion: 'Timbrado y emisión de facturas', tipo: 'facturacion', estado: 'desconectado', api_key_configurada: false },
  { id: '7', nombre: 'Google Maps', descripcion: 'Geocodificación y rutas', tipo: 'maps', estado: 'conectado', api_key_configurada: true, registros_sync: 0 },
]

const estadoConfig: Record<string, { color: string; icon: React.ReactNode; label: string; bg: string }> = {
  conectado: { color: tokens.colors.green, icon: <Wifi size={18} />, label: 'Conectado', bg: tokens.colors.greenBg },
  desconectado: { color: tokens.colors.gray, icon: <WifiOff size={18} />, label: 'Desconectado', bg: 'rgba(107, 114, 128, 0.1)' },
  error: { color: tokens.colors.red, icon: <AlertTriangle size={18} />, label: 'Error', bg: tokens.colors.redBg },
  configurando: { color: tokens.colors.yellow, icon: <Settings size={18} />, label: 'Configurando', bg: tokens.colors.yellowBg },
}

export default function PanelIntegraciones() {
  const [integraciones, setIntegraciones] = useState<Integracion[]>(defaultIntegraciones)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchIntegraciones()
  }, [])

  async function fetchIntegraciones() {
    setLoading(true)
    const { data, error } = await supabase
      .from('integraciones')
      .select('*')
      .order('nombre', { ascending: true })
    if (!error && data && data.length > 0) {
      setIntegraciones(data)
    }
    setLoading(false)
  }

  const conectadas = integraciones.filter(i => i.estado === 'conectado').length
  const conError = integraciones.filter(i => i.estado === 'error').length
  const totalSync = integraciones.reduce((s, i) => s + (i.registros_sync || 0), 0)

  return (
    <ModuleLayout
      titulo="Panel de Integraciones"
      subtitulo="Estado de conexiones externas del sistema"
      moduloPadre={{ nombre: 'Configuración', ruta: '/admin/configuracion' }}
      acciones={
        <Button size="sm" variant="secondary" onClick={fetchIntegraciones}>
          <RefreshCw size={16} /> Verificar Estado
        </Button>
      }
    >
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: tokens.spacing.md, marginBottom: tokens.spacing.lg }}>
        <KPICard titulo="Total Integraciones" valor={integraciones.length} subtitulo="configuradas" color="primary" icono={<Plug size={20} />} />
        <KPICard titulo="Conectadas" valor={conectadas} subtitulo="funcionando OK" color="green" icono={<Wifi size={20} />} />
        <KPICard titulo="Con Error" valor={conError} subtitulo="requieren atención" color="red" icono={<AlertTriangle size={20} />} />
        <KPICard titulo="Registros Sync" valor={totalSync.toLocaleString()} subtitulo="total sincronizado" color="blue" icono={<RefreshCw size={20} />} />
      </div>

      {loading ? (
        <div style={{ display: 'flex', justifyContent: 'center', padding: '48px' }}>
          <div style={{
            width: '32px', height: '32px', border: `3px solid ${tokens.colors.primary}`,
            borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin 1s linear infinite',
          }} />
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: tokens.spacing.md }}>
          {integraciones.map(integ => {
            const cfg = estadoConfig[integ.estado] || estadoConfig.desconectado
            return (
              <Card key={integ.id}>
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: tokens.spacing.md }}>
                  <div style={{
                    width: '44px', height: '44px', borderRadius: tokens.radius.lg,
                    background: cfg.bg, display: 'flex', alignItems: 'center', justifyContent: 'center',
                    color: cfg.color, flexShrink: 0,
                  }}>
                    {cfg.icon}
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                      <h3 style={{
                        color: tokens.colors.textPrimary, fontFamily: tokens.fonts.heading,
                        fontSize: '15px', fontWeight: 700, margin: 0,
                      }}>
                        {integ.nombre}
                      </h3>
                      <span style={{
                        display: 'inline-flex', alignItems: 'center', gap: '4px',
                        padding: '3px 10px', borderRadius: tokens.radius.full, fontSize: '11px',
                        fontFamily: tokens.fonts.body, fontWeight: 600,
                        background: cfg.bg, color: cfg.color,
                      }}>
                        <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: cfg.color }} />
                        {cfg.label}
                      </span>
                    </div>
                    <p style={{
                      color: tokens.colors.textMuted, fontFamily: tokens.fonts.body,
                      fontSize: '12px', margin: '4px 0 8px 0',
                    }}>
                      {integ.descripcion}
                    </p>
                    <div style={{ display: 'flex', gap: tokens.spacing.lg }}>
                      {integ.ultima_sync && (
                        <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                          <Clock size={12} style={{ color: tokens.colors.textMuted }} />
                          <span style={{ color: tokens.colors.textMuted, fontFamily: tokens.fonts.body, fontSize: '11px' }}>
                            Sync: {new Date(integ.ultima_sync).toLocaleString('es-MX', { timeZone: 'America/Mexico_City' })}
                          </span>
                        </div>
                      )}
                      {integ.registros_sync !== undefined && integ.registros_sync > 0 && (
                        <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                          <CheckCircle size={12} style={{ color: tokens.colors.green }} />
                          <span style={{ color: tokens.colors.textSecondary, fontFamily: tokens.fonts.body, fontSize: '11px' }}>
                            {integ.registros_sync.toLocaleString()} registros
                          </span>
                        </div>
                      )}
                      {!integ.api_key_configurada && (
                        <span style={{ color: tokens.colors.yellow, fontFamily: tokens.fonts.body, fontSize: '11px', fontWeight: 600 }}>
                          API Key pendiente
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </Card>
            )
          })}
        </div>
      )}
    </ModuleLayout>
  )
}
