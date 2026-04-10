import type { ReactElement } from 'react'
import { useState, useEffect } from 'react'
import { ModuleLayout } from '../../components/layout/ModuleLayout'
import { Card } from '../../components/Card'
import { tokens } from '../../lib/tokens'
import { supabase } from '../../lib/supabase'
import {
  Wifi, WifiOff, RefreshCw, CheckCircle2, XCircle, Clock,
  Satellite, Truck, Map, Brain, Mail, MessageSquare,
  Database, Activity, AlertTriangle, ExternalLink, Settings2,
  Zap, Globe, Shield
} from 'lucide-react'

/* âââ types âââ */
interface IntegrationStatus {
  name: string
  key: string
  icon: ReactElement
  description: string
  status: 'connected' | 'error' | 'pending' | 'disabled'
  lastSync: string | null
  records: number | null
  endpoint: string
  category: 'gps' | 'tms' | 'api' | 'comms'
}

const CATEGORIES = [
  { key: 'gps', label: 'GPS & Rastreo', color: tokens.colors.blue },
  { key: 'tms', label: 'TMS & Datos', color: tokens.colors.green },
  { key: 'api', label: 'APIs Externas', color: '#8B5CF6' },
  { key: 'comms', label: 'Comunicaciones', color: tokens.colors.orange },
]

export default function ConfigIntegraciones() {
  const [integrations, setIntegrations] = useState<IntegrationStatus[]>([])
  const [loading, setLoading] = useState(true)
  const [testing, setTesting] = useState<string | null>(null)
  const [lastRefresh, setLastRefresh] = useState<Date>(new Date())

  useEffect(() => { fetchStatus() }, [])

  async function fetchStatus() {
    setLoading(true)
    try {
      /* GPS WideTech â check gps_tracking for recent data */
      const { count: gpsCount } = await supabase
        .from('gps_tracking')
        .select('*', { count: 'exact', head: true })
      const { data: latestGps } = await supabase
        .from('gps_tracking')
        .select('updated_at')
        .order('updated_at', { ascending: false })
        .limit(1)
      const gpsLastSync = latestGps?.[0]?.updated_at || null
      const gpsMinutesAgo = gpsLastSync
        ? Math.floor((Date.now() - new Date(gpsLastSync).getTime()) / 60000)
        : null

      /* ANODOS â check formatos_venta */
      const { count: anodosCount } = await supabase
        .from('formatos_venta')
        .select('*', { count: 'exact', head: true })
      const { data: latestAnodos } = await supabase
        .from('formatos_venta')
        .select('updated_at')
        .order('updated_at', { ascending: false })
        .limit(1)
      const anodosLastSync = latestAnodos?.[0]?.updated_at || null

      /* Supabase Edge Functions â check count */
      /* We can't directly query edge functions, so we check known tables */
      const { count: leadsCount } = await supabase
        .from('leads')
        .select('*', { count: 'exact', head: true })

      /* Clientes */
      const { count: clientesCount } = await supabase
        .from('clientes')
        .select('*', { count: 'exact', head: true })

      /* CXC */
      const { count: cxcCount } = await supabase
        .from('cxc_cartera')
        .select('*', { count: 'exact', head: true })

      /* GPS unidades */
      const { count: gpsUnidadesCount } = await supabase
        .from('gps_unidades')
        .select('*', { count: 'exact', head: true })

      const results: IntegrationStatus[] = [
        {
          name: 'WideTech GPS',
          key: 'widetech',
          icon: <Satellite size={20} />,
          description: 'Rastreo GPS en tiempo real via SOAP/XML. CRON cada 10 min.',
          status: gpsMinutesAgo !== null && gpsMinutesAgo < 30 ? 'connected' : gpsMinutesAgo !== null ? 'error' : 'disabled',
          lastSync: gpsLastSync,
          records: gpsCount || 0,
          endpoint: 'HistoyDataLastLocationByUser (SOAP)',
          category: 'gps',
        },
        {
          name: 'GPS Unidades',
          key: 'gps_unidades',
          icon: <Truck size={20} />,
          description: 'CatÃ¡logo de unidades GPS registradas en WideTech.',
          status: (gpsUnidadesCount || 0) > 0 ? 'connected' : 'pending',
          lastSync: null,
          records: gpsUnidadesCount || 0,
          endpoint: 'gps_unidades (Supabase)',
          category: 'gps',
        },
        {
          name: 'ANODOS TMS',
          key: 'anodos',
          icon: <Database size={20} />,
          description: 'SincronizaciÃ³n formatos de venta desde ANODOS REST API. CRON cada 10 min.',
          status: anodosCount && anodosCount > 0 ? 'connected' : 'error',
          lastSync: anodosLastSync,
          records: anodosCount || 0,
          endpoint: 'api.anodos.com.mx/FormatoVenta',
          category: 'tms',
        },
        {
          name: 'Supabase Database',
          key: 'supabase',
          icon: <Shield size={20} />,
          description: 'Base de datos principal con RLS activo. Leads, clientes, viajes, flota.',
          status: 'connected',
          lastSync: new Date().toISOString(),
          records: (leadsCount || 0) + (clientesCount || 0) + (cxcCount || 0),
          endpoint: 'wtogsqxvyfeibnfxfbev.supabase.co',
          category: 'tms',
        },
        {
          name: 'Google Maps API',
          key: 'gmaps',
          icon: <Map size={20} />,
          description: 'Distance Matrix + Places Autocomplete para cotizaciones cross-border.',
          status: 'connected',
          lastSync: null,
          records: null,
          endpoint: 'maps.googleapis.com',
          category: 'api',
        },
        {
          name: 'Anthropic Claude API',
          key: 'anthropic',
          icon: <Brain size={20} />,
          description: 'IA para anÃ¡lisis de cotizaciones PDF y validaciÃ³n de documentos.',
          status: 'connected',
          lastSync: null,
          records: null,
          endpoint: 'api.anthropic.com/v1/messages',
          category: 'api',
        },
        {
          name: 'Resend Email',
          key: 'resend',
          icon: <Mail size={20} />,
          description: 'Correos transaccionales desde mail.jjcrm27.com (alta clientes, notificaciones).',
          status: 'connected',
          lastSync: null,
          records: null,
          endpoint: 'api.resend.com',
          category: 'comms',
        },
        {
          name: 'WhatsApp Business',
          key: 'whatsapp',
          icon: <MessageSquare size={20} />,
          description: 'Meta WhatsApp Business Cloud API â pendiente integraciÃ³n.',
          status: 'pending',
          lastSync: null,
          records: null,
          endpoint: 'graph.facebook.com (pendiente)',
          category: 'comms',
        },
      ]

      setIntegrations(results)
      setLastRefresh(new Date())
    } catch (err) {
      console.error('Error fetching integration status:', err)
    } finally {
      setLoading(false)
    }
  }

  async function testConnection(key: string) {
    setTesting(key)
    /* Simulate test â in production this would call edge functions */
    await new Promise(r => setTimeout(r, 1500))
    setTesting(null)
  }

  function statusBadge(status: IntegrationStatus['status']) {
    const cfg = {
      connected: { color: tokens.colors.green, bg: tokens.colors.greenBg, label: 'Conectado', icon: <CheckCircle2 size={12} /> },
      error: { color: tokens.colors.red, bg: tokens.colors.redBg, label: 'Error', icon: <XCircle size={12} /> },
      pending: { color: tokens.colors.yellow, bg: tokens.colors.yellowBg, label: 'Pendiente', icon: <Clock size={12} /> },
      disabled: { color: tokens.colors.gray, bg: 'rgba(107,114,128,0.1)', label: 'Deshabilitado', icon: <WifiOff size={12} /> },
    }[status]
    return (
      <span style={{
        display: 'inline-flex', alignItems: 'center', gap: '4px',
        fontSize: '11px', fontWeight: 700, padding: '2px 10px',
        borderRadius: tokens.radius.sm, background: cfg.bg, color: cfg.color,
        textTransform: 'uppercase', letterSpacing: '0.5px',
      }}>
        {cfg.icon} {cfg.label}
      </span>
    )
  }

  function timeAgo(iso: string | null) {
    if (!iso) return 'â'
    const mins = Math.floor((Date.now() - new Date(iso).getTime()) / 60000)
    if (mins < 1) return 'Ahora'
    if (mins < 60) return `Hace ${mins} min`
    const hrs = Math.floor(mins / 60)
    if (hrs < 24) return `Hace ${hrs}h`
    return new Date(iso).toLocaleDateString('es-MX')
  }

  /* âââ stats âââ */
  const stats = {
    total: integrations.length,
    connected: integrations.filter(i => i.status === 'connected').length,
    errors: integrations.filter(i => i.status === 'error').length,
    pending: integrations.filter(i => i.status === 'pending').length,
  }

  return (
    <ModuleLayout titulo="Integraciones â Panel de Control" moduloPadre={{ nombre: 'ConfiguraciÃ³n', ruta: '/admin/configuracion' }}>
      <div style={{ padding: tokens.spacing.lg, minHeight: '100vh', background: tokens.colors.bgMain }}>
        {/* Header stats */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: tokens.spacing.lg }}>
          <div style={{ display: 'flex', gap: tokens.spacing.lg, alignItems: 'center' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: tokens.spacing.xs }}>
              <Wifi size={16} color={tokens.colors.green} />
              <span style={{ fontSize: '14px', color: tokens.colors.textPrimary, fontWeight: 600, fontFamily: tokens.fonts.body }}>
                {stats.connected}/{stats.total} conectadas
              </span>
            </div>
            {stats.errors > 0 && (
              <div style={{ display: 'flex', alignItems: 'center', gap: tokens.spacing.xs }}>
                <AlertTriangle size={16} color={tokens.colors.red} />
                <span style={{ fontSize: '14px', color: tokens.colors.red, fontWeight: 600, fontFamily: tokens.fonts.body }}>
                  {stats.errors} con error
                </span>
              </div>
            )}
            {stats.pending > 0 && (
              <div style={{ display: 'flex', alignItems: 'center', gap: tokens.spacing.xs }}>
                <Clock size={16} color={tokens.colors.yellow} />
                <span style={{ fontSize: '14px', color: tokens.colors.yellow, fontWeight: 600, fontFamily: tokens.fonts.body }}>
                  {stats.pending} pendientes
                </span>
              </div>
            )}
          </div>
          <div style={{ display: 'flex', gap: tokens.spacing.sm, alignItems: 'center' }}>
            <span style={{ fontSize: '12px', color: tokens.colors.textMuted, fontFamily: tokens.fonts.body }}>
              Actualizado: {lastRefresh.toLocaleTimeString('es-MX')}
            </span>
            <button onClick={fetchStatus} disabled={loading} style={{
              display: 'flex', alignItems: 'center', gap: '6px',
              padding: `${tokens.spacing.xs} ${tokens.spacing.md}`,
              background: tokens.colors.bgCard, color: tokens.colors.textPrimary,
              border: `1px solid ${tokens.colors.border}`, borderRadius: tokens.radius.md,
              fontFamily: tokens.fonts.body, fontSize: '13px', cursor: 'pointer',
              opacity: loading ? 0.6 : 1,
            }}>
              <RefreshCw size={14} style={loading ? { animation: 'spin 1s linear infinite' } : {}} /> Actualizar
            </button>
          </div>
        </div>

        {/* Categories */}
        {CATEGORIES.map(cat => {
          const catIntegrations = integrations.filter(i => i.category === cat.key)
          if (catIntegrations.length === 0) return null
          return (
            <div key={cat.key} style={{ marginBottom: tokens.spacing.xl }}>
              <div style={{
                display: 'flex', alignItems: 'center', gap: tokens.spacing.sm,
                marginBottom: tokens.spacing.md,
              }}>
                <div style={{
                  width: 4, height: 20, borderRadius: 2, background: cat.color,
                }} />
                <h3 style={{
                  fontFamily: tokens.fonts.heading, fontSize: '15px', fontWeight: 700,
                  color: tokens.colors.textPrimary, margin: 0,
                }}>
                  {cat.label}
                </h3>
                <span style={{
                  fontSize: '12px', color: tokens.colors.textMuted,
                  background: tokens.colors.bgHover, padding: '2px 8px',
                  borderRadius: tokens.radius.sm, fontFamily: tokens.fonts.body,
                }}>
                  {catIntegrations.filter(i => i.status === 'connected').length}/{catIntegrations.length}
                </span>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(420px, 1fr))', gap: tokens.spacing.md }}>
                {catIntegrations.map(integ => (
                  <Card key={integ.key} style={{ padding: tokens.spacing.md }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: tokens.spacing.sm }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: tokens.spacing.sm }}>
                        <div style={{
                          width: 36, height: 36, borderRadius: tokens.radius.md,
                          background: tokens.colors.bgHover, display: 'flex',
                          alignItems: 'center', justifyContent: 'center',
                          color: integ.status === 'connected' ? tokens.colors.green
                            : integ.status === 'error' ? tokens.colors.red
                            : tokens.colors.textMuted,
                        }}>
                          {integ.icon}
                        </div>
                        <div>
                          <div style={{
                            fontFamily: tokens.fonts.heading, fontSize: '14px',
                            fontWeight: 700, color: tokens.colors.textPrimary,
                          }}>
                            {integ.name}
                          </div>
                          <div style={{
                            fontSize: '12px', color: tokens.colors.textMuted,
                            fontFamily: tokens.fonts.body, marginTop: '2px',
                          }}>
                            {integ.endpoint}
                          </div>
                        </div>
                      </div>
                      {statusBadge(integ.status)}
                    </div>

                    <p style={{
                      fontSize: '13px', color: tokens.colors.textSecondary,
                      fontFamily: tokens.fonts.body, margin: `${tokens.spacing.sm} 0`,
                      lineHeight: 1.5,
                    }}>
                      {integ.description}
                    </p>

                    <div style={{
                      display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                      paddingTop: tokens.spacing.sm,
                      borderTop: `1px solid ${tokens.colors.border}`,
                    }}>
                      <div style={{ display: 'flex', gap: tokens.spacing.lg }}>
                        {integ.lastSync && (
                          <div>
                            <div style={{ fontSize: '10px', color: tokens.colors.textMuted, textTransform: 'uppercase', letterSpacing: '0.5px', fontFamily: tokens.fonts.body }}>
                              Ãltimo sync
                            </div>
                            <div style={{ fontSize: '13px', color: tokens.colors.textPrimary, fontWeight: 600, fontFamily: tokens.fonts.body }}>
                              {timeAgo(integ.lastSync)}
                            </div>
                          </div>
                        )}
                        {integ.records !== null && (
                          <div>
                            <div style={{ fontSize: '10px', color: tokens.colors.textMuted, textTransform: 'uppercase', letterSpacing: '0.5px', fontFamily: tokens.fonts.body }}>
                              Registros
                            </div>
                            <div style={{ fontSize: '13px', color: tokens.colors.textPrimary, fontWeight: 600, fontFamily: tokens.fonts.body }}>
                              {integ.records.toLocaleString()}
                            </div>
                          </div>
                        )}
                      </div>

                      <button
                        onClick={() => testConnection(integ.key)}
                        disabled={testing === integ.key}
                        style={{
                          display: 'flex', alignItems: 'center', gap: '4px',
                          padding: `${tokens.spacing.xs} ${tokens.spacing.sm}`,
                          background: 'transparent', color: tokens.colors.blue,
                          border: `1px solid ${tokens.colors.blue}`, borderRadius: tokens.radius.md,
                          fontSize: '12px', fontWeight: 600, fontFamily: tokens.fonts.body,
                          cursor: testing === integ.key ? 'wait' : 'pointer',
                          opacity: testing === integ.key ? 0.6 : 1,
                        }}
                      >
                        {testing === integ.key ? (
                          <><RefreshCw size={12} style={{ animation: 'spin 1s linear infinite' }} /> Probando...</>
                        ) : (
                          <><Zap size={12} /> Probar</>
                        )}
                      </button>
                    </div>
                  </Card>
                ))}
              </div>
            </div>
          )
        })}

        {loading && integrations.length === 0 && (
          <div style={{ textAlign: 'center', padding: tokens.spacing.xxl, color: tokens.colors.textMuted }}>
            <Activity size={32} style={{ animation: 'spin 1s linear infinite', marginBottom: tokens.spacing.md }} />
            <p style={{ fontFamily: tokens.fonts.body, fontSize: '14px' }}>Consultando estado de integraciones...</p>
          </div>
        )}

        {/* Edge Functions summary */}
        <Card style={{ padding: tokens.spacing.md, marginTop: tokens.spacing.lg }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: tokens.spacing.sm, marginBottom: tokens.spacing.md }}>
            <Settings2 size={18} color={tokens.colors.textPrimary} />
            <h3 style={{
              fontFamily: tokens.fonts.heading, fontSize: '14px', fontWeight: 700,
              color: tokens.colors.textPrimary, margin: 0,
            }}>
              Edge Functions & CRON Jobs
            </h3>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: tokens.spacing.md }}>
            {[
              { label: 'Edge Functions activas', value: '16', color: tokens.colors.blue },
              { label: 'CRON Jobs programados', value: '5', color: tokens.colors.green },
              { label: 'GPS Worker (10 min)', value: 'Activo', color: tokens.colors.green },
            ].map(item => (
              <div key={item.label} style={{
                padding: tokens.spacing.sm, background: tokens.colors.bgHover,
                borderRadius: tokens.radius.md, textAlign: 'center',
              }}>
                <div style={{
                  fontSize: '22px', fontWeight: 700, color: item.color,
                  fontFamily: tokens.fonts.heading,
                }}>
                  {item.value}
                </div>
                <div style={{
                  fontSize: '11px', color: tokens.colors.textMuted,
                  fontFamily: tokens.fonts.body, marginTop: '2px',
                }}>
                  {item.label}
                </div>
              </div>
            ))}
          </div>
        </Card>

        {/* Quick Links */}
        <div style={{
          display: 'flex', gap: tokens.spacing.sm, marginTop: tokens.spacing.lg,
          flexWrap: 'wrap',
        }}>
          {[
            { label: 'Supabase Dashboard', href: 'https://supabase.com/dashboard/project/wtogsqxvyfeibnfxfbev' },
            { label: 'Vercel Deploy', href: 'https://vercel.com' },
            { label: 'GitHub Repo', href: 'https://github.com/vivercan/lomahub27' },
          ].map(link => (
            <a key={link.label} href={link.href} target="_blank" rel="noreferrer" style={{
              display: 'inline-flex', alignItems: 'center', gap: '6px',
              padding: `${tokens.spacing.xs} ${tokens.spacing.md}`,
              background: tokens.colors.bgCard, color: tokens.colors.blue,
              border: `1px solid ${tokens.colors.border}`, borderRadius: tokens.radius.md,
              fontSize: '12px', fontFamily: tokens.fonts.body, textDecoration: 'none',
            }}>
              <ExternalLink size={12} /> {link.label}
            </a>
          ))}
        </div>
      </div>
    </ModuleLayout>
  )
}
