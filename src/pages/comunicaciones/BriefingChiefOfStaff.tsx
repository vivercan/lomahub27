import { useEffect, useState } from 'react'
import { useParams, useSearchParams } from 'react-router-dom'
import { supabase } from '../../lib/supabase'
import { tokens } from '../../lib/tokens'
import {
  Brain, Sun, Moon, Clock, Mail, MailOpen,
  Users, FileText, ChevronDown, ChevronUp,
  Copy, ExternalLink, CheckCircle2, AlertTriangle,
  AlertCircle, Minus, TrendingUp, Calendar
} from 'lucide-react'

interface Pendiente {
  prioridad: string
  titulo: string
  descripcion: string
  accion_sugerida: string
  tipo_accion: string
  datos_accion: Record<string, unknown>
}

interface TimelineEvento {
  hora: string
  evento: string
  detalle: string
}

interface Metricas {
  cotizaciones_pedidas?: number
  cotizaciones_enviadas?: number
  leads_nuevos?: number
  respuestas_recibidas?: number
  correos_entrantes?: number
  correos_salientes?: number
  [key: string]: number | undefined
}

interface CierreDia {
  logros: string[]
  pendientes_manana: string[]
  metricas_comparadas: Record<string, unknown>
}

interface Briefing {
  id: string
  tipo: string
  fecha: string
  resumen_ejecutivo: string
  metricas: Metricas
  pendientes: Pendiente[]
  timeline: TimelineEvento[]
  cierre_dia: CierreDia | null
  created_at: string
}

const t = tokens

function formatFechaLarga(fecha: string): string {
  const d = new Date(fecha + 'T12:00:00')
  const dias = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado']
  const meses = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre']
  return `${dias[d.getDay()]}, ${d.getDate()} de ${meses[d.getMonth()]} ${d.getFullYear()}`
}

function PrioridadBadge({ prioridad }: { prioridad: string }) {
  const colorMap: Record<string, { bg: string; text: string; icon: React.ReactNode }> = {
    alta: { bg: t.colors.redBg, text: t.colors.red, icon: <AlertCircle size={14} /> },
    media: { bg: t.colors.yellowBg, text: t.colors.yellow, icon: <AlertTriangle size={14} /> },
    baja: { bg: t.colors.greenBg, text: t.colors.green, icon: <Minus size={14} /> },
  }
  const c = colorMap[prioridad] || colorMap.baja
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', gap: '4px',
      padding: '2px 10px', borderRadius: t.radius.full,
      background: c.bg, color: c.text,
      fontSize: '12px', fontWeight: 600, textTransform: 'uppercase',
      fontFamily: t.fonts.body,
    }}>
      {c.icon} {prioridad}
    </span>
  )
}

function MetricCard({ label, value, icon }: { label: string; value: number; icon: React.ReactNode }) {
  return (
    <div style={{
      background: t.colors.bgCard,
      border: `1px solid ${t.colors.border}`,
      borderRadius: t.radius.lg,
      padding: '16px 20px',
      display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '6px',
      minWidth: '120px', flex: 1,
      boxShadow: t.effects.cardShadow,
    }}>
      <div style={{ color: t.colors.textMuted, display: 'flex', alignItems: 'center', gap: '6px' }}>
        {icon}
      </div>
      <div style={{
        fontSize: '28px', fontWeight: 700, color: t.colors.textPrimary,
        fontFamily: t.fonts.heading,
      }}>
        {value}
      </div>
      <div style={{
        fontSize: '11px', color: t.colors.textSecondary, textAlign: 'center',
        fontFamily: t.fonts.body, textTransform: 'uppercase', letterSpacing: '0.5px',
      }}>
        {label}
      </div>
    </div>
  )
}

function PendienteCard({ pendiente }: { pendiente: Pendiente }) {
  const [expanded, setExpanded] = useState(false)
  const [copied, setCopied] = useState(false)

  const handleCopy = () => {
    const text = pendiente.accion_sugerida
    navigator.clipboard.writeText(text).then(() => {
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    })
  }

  return (
    <div style={{
      background: t.colors.bgCard,
      border: `1px solid ${t.colors.border}`,
      borderRadius: t.radius.lg,
      overflow: 'hidden',
      boxShadow: t.effects.cardShadow,
    }}>
      <button
        onClick={() => setExpanded(!expanded)}
        style={{
          width: '100%', padding: '16px 20px',
          display: 'flex', alignItems: 'center', gap: '12px',
          background: 'transparent', border: 'none', cursor: 'pointer',
          textAlign: 'left',
        }}
      >
        <PrioridadBadge prioridad={pendiente.prioridad} />
        <div style={{ flex: 1 }}>
          <div style={{
            color: t.colors.textPrimary, fontSize: '14px', fontWeight: 600,
            fontFamily: t.fonts.body,
          }}>
            {pendiente.titulo}
          </div>
          <div style={{
            color: t.colors.textSecondary, fontSize: '13px', marginTop: '2px',
            fontFamily: t.fonts.body,
          }}>
            {pendiente.descripcion}
          </div>
        </div>
        <div style={{ color: t.colors.textMuted }}>
          {expanded ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
        </div>
      </button>
      {expanded && (
        <div style={{
          padding: '0 20px 16px',
          borderTop: `1px solid ${t.colors.border}`,
        }}>
          <div style={{
            marginTop: '12px', padding: '12px 16px',
            background: t.colors.bgHover, borderRadius: t.radius.md,
            fontFamily: t.fonts.body, fontSize: '13px', lineHeight: '1.6',
            color: t.colors.textPrimary, whiteSpace: 'pre-wrap',
          }}>
            {pendiente.accion_sugerida}
          </div>
          <div style={{ display: 'flex', gap: '8px', marginTop: '12px' }}>
            <button
              onClick={handleCopy}
              style={{
                display: 'flex', alignItems: 'center', gap: '6px',
                padding: '6px 14px', borderRadius: t.radius.md,
                background: t.colors.primary, color: '#fff',
                border: 'none', cursor: 'pointer', fontSize: '12px',
                fontFamily: t.fonts.body, fontWeight: 600,
              }}
            >
              {copied ? <CheckCircle2 size={14} /> : <Copy size={14} />}
              {copied ? 'Copiado' : 'Copiar borrador'}
            </button>
            {pendiente.tipo_accion === 'email_draft' && pendiente.datos_accion?.to && (
              <a
                href={`https://mail.google.com/mail/?view=cm&to=${pendiente.datos_accion.to}&su=${encodeURIComponent(String(pendiente.datos_accion.subject || ''))}`}
                target="_blank"
                rel="noopener noreferrer"
                style={{
                  display: 'flex', alignItems: 'center', gap: '6px',
                  padding: '6px 14px', borderRadius: t.radius.md,
                  background: 'transparent', color: t.colors.primary,
                  border: `1px solid ${t.colors.primary}`,
                  textDecoration: 'none', fontSize: '12px',
                  fontFamily: t.fonts.body, fontWeight: 600,
                }}
              >
                <ExternalLink size={14} /> Abrir en Gmail
              </a>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

export default function BriefingChiefOfStaff() {
  const { id } = useParams<{ id: string }>()
  const [searchParams] = useSearchParams()
  const accessToken = searchParams.get('token')

  const [briefing, setBriefing] = useState<Briefing | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [showTimeline, setShowTimeline] = useState(false)

  useEffect(() => {
    async function fetchBriefing() {
      try {
        let query = supabase
          .from('briefings')
          .select('*')
          .eq('id', id)
          .is('deleted_at', null)
          .single()

        if (accessToken) {
          query = supabase
            .from('briefings')
            .select('*')
            .eq('id', id)
            .eq('access_token', accessToken)
            .is('deleted_at', null)
            .single()
        }

        const { data, error: fetchErr } = await query

        if (fetchErr) throw new Error(fetchErr.message)
        if (!data) throw new Error('Briefing no encontrado')

        setBriefing(data as Briefing)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Error desconocido')
      } finally {
        setLoading(false)
      }
    }
    if (id) fetchBriefing()
  }, [id, accessToken])

  if (loading) {
    return (
      <div style={{
        minHeight: '100vh', background: t.colors.bgMain,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontFamily: t.fonts.body, color: t.colors.textSecondary,
      }}>
        <div style={{ textAlign: 'center' }}>
          <Brain size={40} style={{ color: t.colors.primary, marginBottom: '12px' }} />
          <div>Cargando briefing...</div>
        </div>
      </div>
    )
  }

  if (error || !briefing) {
    return (
      <div style={{
        minHeight: '100vh', background: t.colors.bgMain,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontFamily: t.fonts.body, color: t.colors.red,
      }}>
        <div style={{ textAlign: 'center' }}>
          <AlertCircle size={40} style={{ marginBottom: '12px' }} />
          <div>{error || 'Briefing no encontrado'}</div>
        </div>
      </div>
    )
  }

  const isMorning = briefing.tipo === 'morning'
  const metricas = briefing.metricas || {}
  const pendientes = briefing.pendientes || []
  const timeline = briefing.timeline || []
  const pendientesOrdenados = [...pendientes].sort((a, b) => {
    const ord: Record<string, number> = { alta: 0, media: 1, baja: 2 }
    return (ord[a.prioridad] ?? 3) - (ord[b.prioridad] ?? 3)
  })

  return (
    <div style={{
      minHeight: '100vh', background: t.colors.bgMain,
      fontFamily: t.fonts.body, color: t.colors.textPrimary,
      overflow: 'auto',
    }}>
      <div style={{ maxWidth: '960px', margin: '0 auto', padding: '32px 24px' }}>

        {/* ——— HEADER ——— */}
        <div style={{
          display: 'flex', alignItems: 'center', gap: '16px',
          marginBottom: '32px',
        }}>
          <div style={{
            width: '52px', height: '52px', borderRadius: t.radius.lg,
            background: t.colors.blueBg, display: 'flex',
            alignItems: 'center', justifyContent: 'center',
          }}>
            {isMorning
              ? <Sun size={28} style={{ color: t.colors.yellow }} />
              : <Moon size={28} style={{ color: t.colors.primary }} />
            }
          </div>
          <div>
            <h1 style={{
              margin: 0, fontSize: '22px', fontWeight: 700,
              fontFamily: t.fonts.heading, color: t.colors.textPrimary,
            }}>
              {isMorning ? 'Briefing Matutino' : 'Cierre del Día'}
            </h1>
            <div style={{
              display: 'flex', alignItems: 'center', gap: '8px',
              color: t.colors.textSecondary, fontSize: '13px', marginTop: '4px',
            }}>
              <Calendar size={14} />
              {formatFechaLarga(briefing.fecha)}
            </div>
          </div>
          <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: '6px' }}>
            <Brain size={18} style={{ color: t.colors.primary }} />
            <span style={{
              fontSize: '12px', color: t.colors.textMuted, fontWeight: 600,
              textTransform: 'uppercase', letterSpacing: '0.5px',
            }}>
              AI Chief of Staff
            </span>
          </div>
        </div>

        {/* ——— MÉTRICAS ——— */}
        <div style={{
          display: 'flex', gap: '12px', marginBottom: '28px',
          flexWrap: 'wrap',
        }}>
          <MetricCard label="Cotizaciones Pedidas" value={metricas.cotizaciones_pedidas || 0} icon={<FileText size={18} style={{ color: t.colors.primary }} />} />
          <MetricCard label="Cotizaciones Enviadas" value={metricas.cotizaciones_enviadas || 0} icon={<FileText size={18} style={{ color: t.colors.green }} />} />
          <MetricCard label="Leads Nuevos" value={metricas.leads_nuevos || 0} icon={<Users size={18} style={{ color: t.colors.yellow }} />} />
          <MetricCard label="Respuestas" value={metricas.respuestas_recibidas || 0} icon={<TrendingUp size={18} style={{ color: t.colors.orange }} />} />
          <MetricCard label="Correos In" value={metricas.correos_entrantes || 0} icon={<Mail size={18} style={{ color: t.colors.blue }} />} />
          <MetricCard label="Correos Out" value={metricas.correos_salientes || 0} icon={<MailOpen size={18} style={{ color: t.colors.blue }} />} />
        </div>

        {/* ——— RESUMEN EJECUTIVO ——— */}
        <div style={{
          background: t.colors.bgCard,
          border: `1px solid ${t.colors.border}`,
          borderRadius: t.radius.lg,
          padding: '24px', marginBottom: '28px',
          boxShadow: t.effects.cardShadow,
        }}>
          <h2 style={{
            margin: '0 0 16px', fontSize: '16px', fontWeight: 700,
            fontFamily: t.fonts.heading, color: t.colors.textPrimary,
            display: 'flex', alignItems: 'center', gap: '8px',
          }}>
            <Brain size={18} style={{ color: t.colors.primary }} />
            Resumen Ejecutivo
          </h2>
          <div style={{
            fontSize: '14px', lineHeight: '1.7',
            color: t.colors.textSecondary, whiteSpace: 'pre-wrap',
          }}>
            {briefing.resumen_ejecutivo}
          </div>
        </div>

        {/* ——— PENDIENTES ——— */}
        {pendientesOrdenados.length > 0 && (
          <div style={{ marginBottom: '28px' }}>
            <h2 style={{
              margin: '0 0 16px', fontSize: '16px', fontWeight: 700,
              fontFamily: t.fonts.heading, color: t.colors.textPrimary,
              display: 'flex', alignItems: 'center', gap: '8px',
            }}>
              <AlertTriangle size={18} style={{ color: t.colors.yellow }} />
              Pendientes Priorizados ({pendientesOrdenados.length})
            </h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {pendientesOrdenados.map((p, i) => (
                <PendienteCard key={i} pendiente={p} />
              ))}
            </div>
          </div>
        )}

        {/* ——— TIMELINE ——— */}
        {timeline.length > 0 && (
          <div style={{ marginBottom: '28px' }}>
            <button
              onClick={() => setShowTimeline(!showTimeline)}
              style={{
                display: 'flex', alignItems: 'center', gap: '8px', width: '100%',
                background: 'transparent', border: 'none', cursor: 'pointer',
                padding: '0', marginBottom: '12px',
              }}
            >
              <Clock size={18} style={{ color: t.colors.textMuted }} />
              <span style={{
                fontSize: '16px', fontWeight: 700,
                fontFamily: t.fonts.heading, color: t.colors.textPrimary,
              }}>
                Timeline ({timeline.length} eventos)
              </span>
              {showTimeline ? <ChevronUp size={16} style={{ color: t.colors.textMuted }} /> : <ChevronDown size={16} style={{ color: t.colors.textMuted }} />}
            </button>
            {showTimeline && (
              <div style={{
                background: t.colors.bgCard,
                border: `1px solid ${t.colors.border}`,
                borderRadius: t.radius.lg,
                padding: '20px', boxShadow: t.effects.cardShadow,
              }}>
                {timeline.map((ev, i) => (
                  <div key={i} style={{
                    display: 'flex', gap: '16px',
                    paddingBottom: i < timeline.length - 1 ? '16px' : '0',
                    marginBottom: i < timeline.length - 1 ? '16px' : '0',
                    borderBottom: i < timeline.length - 1 ? `1px solid ${t.colors.border}` : 'none',
                  }}>
                    <div style={{
                      fontSize: '13px', fontWeight: 700, color: t.colors.primary,
                      fontFamily: t.fonts.heading, minWidth: '50px',
                    }}>
                      {ev.hora}
                    </div>
                    <div>
                      <div style={{ fontSize: '13px', fontWeight: 600, color: t.colors.textPrimary }}>
                        {ev.evento}
                      </div>
                      {ev.detalle && (
                        <div style={{ fontSize: '12px', color: t.colors.textSecondary, marginTop: '2px' }}>
                          {ev.detalle}
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ——— CIERRE DEL DÍA (solo evening) ——— */}
        {!isMorning && briefing.cierre_dia && (
          <div style={{
            background: t.colors.bgCard,
            border: `1px solid ${t.colors.border}`,
            borderRadius: t.radius.lg,
            padding: '24px', marginBottom: '28px',
            boxShadow: t.effects.cardShadow,
          }}>
            <h2 style={{
              margin: '0 0 20px', fontSize: '16px', fontWeight: 700,
              fontFamily: t.fonts.heading, color: t.colors.textPrimary,
              display: 'flex', alignItems: 'center', gap: '8px',
            }}>
              <Moon size={18} style={{ color: t.colors.primary }} />
              Cierre del Día
            </h2>

            {briefing.cierre_dia.logros && briefing.cierre_dia.logros.length > 0 && (
              <div style={{ marginBottom: '16px' }}>
                <div style={{
                  fontSize: '13px', fontWeight: 700, color: t.colors.green,
                  marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '0.5px',
                }}>
                  Lo que se logró hoy
                </div>
                {briefing.cierre_dia.logros.map((l, i) => (
                  <div key={i} style={{
                    display: 'flex', alignItems: 'flex-start', gap: '8px',
                    padding: '6px 0', fontSize: '13px', color: t.colors.textSecondary,
                  }}>
                    <CheckCircle2 size={16} style={{ color: t.colors.green, flexShrink: 0, marginTop: '1px' }} />
                    {l}
                  </div>
                ))}
              </div>
            )}

            {briefing.cierre_dia.pendientes_manana && briefing.cierre_dia.pendientes_manana.length > 0 && (
              <div>
                <div style={{
                  fontSize: '13px', fontWeight: 700, color: t.colors.orange,
                  marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '0.5px',
                }}>
                  Pendiente para mañana
                </div>
                {briefing.cierre_dia.pendientes_manana.map((p, i) => (
                  <div key={i} style={{
                    display: 'flex', alignItems: 'flex-start', gap: '8px',
                    padding: '6px 0', fontSize: '13px', color: t.colors.textSecondary,
                  }}>
                    <AlertTriangle size={16} style={{ color: t.colors.orange, flexShrink: 0, marginTop: '1px' }} />
                    {p}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ——— FOOTER ——— */}
        <div style={{
          textAlign: 'center', padding: '16px',
          color: t.colors.textMuted, fontSize: '11px',
        }}>
          Generado por AI Chief of Staff · LomaHUB27 · {new Date(briefing.created_at).toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit' })}
        </div>
      </div>
    </div>
  )
}
