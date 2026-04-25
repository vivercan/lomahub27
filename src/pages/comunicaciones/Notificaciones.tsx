import { useState, useEffect } from 'react'
import { Bell, AlertTriangle, Clock, CheckCircle, Truck, DollarSign, FileText, Users } from 'lucide-react'
import { ModuleLayout } from '../../components/layout/ModuleLayout'
import { Card } from '../../components/ui/Card'
import { Badge } from '../../components/ui/Badge'
import { KPICard } from '../../components/ui/KPICard'
import { tokens } from '../../lib/tokens'
import { supabase } from '../../lib/supabase'

interface Notificación {
  id: string
  titulo: string
  mensaje: string
  tipo: 'sla' | 'pago' | 'viaje' | 'lead' | 'documento' | 'sistema' | 'alerta'
  prioridad: 'alta' | 'media' | 'baja'
  leida: boolean
  fecha: string
  modulo_origen?: string
  link?: string
}

const tipoIconos: Record<string, React.ReactNode> = {
  sla: <Clock size={18} />,
  pago: <DollarSign size={18} />,
  viaje: <Truck size={18} />,
  lead: <Users size={18} />,
  documento: <FileText size={18} />,
  sistema: <Bell size={18} />,
  alerta: <AlertTriangle size={18} />,
}

const tipoColores: Record<string, string> = {
  sla: tokens.colors.yellow,
  pago: tokens.colors.green,
  viaje: tokens.colors.primary,
  lead: tokens.colors.blue,
  documento: tokens.colors.orange,
  sistema: tokens.colors.gray,
  alerta: tokens.colors.red,
}

const prioridadColores: Record<string, 'red' | 'yellow' | 'gray'> = {
  alta: 'red',
  media: 'yellow',
  baja: 'gray',
}

export default function Notificaciones() {
  const [notificaciones, setNotificaciones] = useState<Notificación[]>([])
  const [loading, setLoading] = useState(true)
  const [filtroTipo, setFiltroTipo] = useState<string | null>(null)
  const [soloNoLeidas, setSoloNoLeidas] = useState(false)

  useEffect(() => {
    fetchNotificaciones()
  }, [])

  async function fetchNotificaciones() {
    setLoading(true)
    const { data, error } = await supabase
      .from('notificaciones')
      .select('*')
      .order('fecha', { ascending: false })
      .limit(100)
    if (!error && data) setNotificaciones(data)
    setLoading(false)
  }

  async function marcarLeida(id: string) {
    await supabase.from('notificaciones').update({ leida: true }).eq('id', id)
    setNotificaciones(prev => prev.map(n => n.id === id ? { ...n, leida: true } : n))
  }

  async function marcarTodasLeidas() {
    const ids = notificaciones.filter(n => !n.leida).map(n => n.id)
    if (ids.length === 0) return
    await supabase.from('notificaciones').update({ leida: true }).in('id', ids)
    setNotificaciones(prev => prev.map(n => ({ ...n, leida: true })))
  }

  const filtered = notificaciones.filter(n => {
    if (filtroTipo && n.tipo !== filtroTipo) return false
    if (soloNoLeidas && n.leida) return false
    return true
  })

  const totalNoLeidas = notificaciones.filter(n => !n.leida).length
  const alertasAlta = notificaciones.filter(n => n.prioridad === 'alta' && !n.leida).length
  const hoy = new Date().toISOString().split('T')[0]
  const hoyCount = notificaciones.filter(n => n.fecha.startsWith(hoy)).length

  const tipos = ['sla', 'pago', 'viaje', 'lead', 'documento', 'sistema', 'alerta']

  return (
    <ModuleLayout
      titulo="Notificaciones"
      moduloPadre={{ nombre: 'Comunicaciones', ruta: '/comunicaciones/dashboard' }}
      subtitulo="Centro de alertas en tiempo real"
      acciones={
        totalNoLeidas > 0 ? (
          <button
            onClick={marcarTodasLeidas}
            style={{
              padding: '6px 14px', borderRadius: tokens.radius.md, fontSize: '12px',
              fontFamily: tokens.fonts.body, fontWeight: 600, border: 'none', cursor: 'pointer',
              background: `linear-gradient(180deg, #4A7AF0 0%, ${tokens.colors.primary} 100%)`, color: '#fff',
              transition: 'all 0.18s ease',
              boxShadow: '0 2px 4px rgba(59,108,231,0.30), 0 6px 14px -3px rgba(59,108,231,0.25), inset 0 1px 0 rgba(255,255,255,0.28), inset 0 -1px 0 rgba(0,0,0,0.18)',
              textShadow: '0 1px 2px rgba(0,0,0,0.20)',
            }}
          >
            <CheckCircle size={14} style={{ verticalAlign: 'middle', marginRight: '4px' }} />
            Marcar todas leídas
          </button>
        ) : null
      }
    >
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: tokens.spacing.md, marginBottom: tokens.spacing.lg }}>
        <KPICard titulo="No Leídas" valor={totalNoLeidas} subtitulo={`de ${notificaciones.length} total`} color="primary" icono={<Bell size={20} />} />
        <KPICard titulo="Alertas Críticas" valor={alertasAlta} subtitulo="prioridad alta" color="red" icono={<AlertTriangle size={20} />} />
        <KPICard titulo="Hoy" valor={hoyCount} subtitulo="notificaciones" color="blue" icono={<Clock size={20} />} />
        <KPICard titulo="Resueltas" valor={notificaciones.filter(n => n.leida).length} subtitulo="procesadas" color="green" icono={<CheckCircle size={20} />} />
      </div>

      <Card>
        <div style={{ display: 'flex', alignItems: 'center', gap: tokens.spacing.md, marginBottom: tokens.spacing.md, flexWrap: 'wrap' }}>
          <button
            onClick={() => setSoloNoLeidas(!soloNoLeidas)}
            style={{
              padding: '4px 12px', borderRadius: tokens.radius.full, fontSize: '12px',
              fontFamily: tokens.fonts.body, fontWeight: 500, border: 'none', cursor: 'pointer',
              background: soloNoLeidas ? tokens.colors.primary : tokens.colors.bgHover,
              color: soloNoLeidas ? '#fff' : tokens.colors.textSecondary,
            }}
          >
            Solo no leídas
          </button>
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
              {t}
            </button>
          ))}
        </div>

        {loading ? (
          <div style={{ display: 'flex', justifyContent: 'center', padding: '48px' }}>
            <div style={{
              width: '32px', height: '32px', border: `3px solid ${tokens.colors.primary}`,
              borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin 1s linear infinite',
            }} />
          </div>
        ) : filtered.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '48px', color: tokens.colors.textMuted, fontFamily: tokens.fonts.body }}>
            Aún no hay notificaciones
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
            {filtered.map(n => (
              <div
                key={n.id}
                onClick={() => !n.leida && marcarLeida(n.id)}
                style={{
                  display: 'flex', alignItems: 'center', gap: tokens.spacing.md,
                  padding: '12px 16px', borderRadius: tokens.radius.md,
                  background: n.leida ? 'transparent' : 'rgba(30, 102, 245, 0.05)',
                  borderLeft: `3px solid ${n.leida ? 'transparent' : tipoColores[n.tipo]}`,
                  cursor: n.leida ? 'default' : 'pointer',
                  transition: 'background 0.15s',
                }}
                onMouseEnter={e => { if (!n.leida) (e.currentTarget as HTMLElement).style.background = tokens.colors.bgHover }}
                onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = n.leida ? 'transparent' : 'rgba(30, 102, 245, 0.05)' }}
              >
                <div style={{ color: tipoColores[n.tipo], flexShrink: 0 }}>
                  {tipoIconos[n.tipo]}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{
                    color: tokens.colors.textPrimary, fontFamily: tokens.fonts.body,
                    fontSize: '13px', fontWeight: n.leida ? 400 : 600,
                  }}>
                    {n.titulo}
                  </div>
                  <div style={{
                    color: tokens.colors.textMuted, fontFamily: tokens.fonts.body, fontSize: '12px',
                    overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                  }}>
                    {n.mensaje}
                  </div>
                </div>
                <Badge color={prioridadColores[n.prioridad]}>{n.prioridad}</Badge>
                <span style={{ color: tokens.colors.textMuted, fontFamily: tokens.fonts.body, fontSize: '11px', flexShrink: 0 }}>
                  {n.fecha}
                </span>
                {!n.leida && (
                  <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: tokens.colors.primary, flexShrink: 0 }} />
                )}
              </div>
            ))}
          </div>
        )}
      </Card>
    </ModuleLayout>
  )
}
