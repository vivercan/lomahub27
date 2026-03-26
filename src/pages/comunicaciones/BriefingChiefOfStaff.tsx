import { useEffect, useState } from 'react'
import { useParams, useSearchParams } from 'react-router-dom'
import { supabase } from '../../lib/supabase'
import { tokens } from '../../lib/tokens'
import {
  Brain, Sun, Moon, Clock, Mail, MailOpen,
  Users, FileText, ChevronDown, ChevronUp,
  Copy, CheckCircle2, AlertTriangle,
  AlertCircle, TrendingUp,
  Calendar, Truck, MessageCircle, Shield,
  Database, Zap, ArrowUp, ArrowDown, Minus
} from 'lucide-react'

// ─── INTERFACES V2 ──────────────────────────────────────

interface Pendiente {
  prioridad: string
  titulo: string
  descripcion: string
  accion_sugerida: string
  tipo_accion: string
  datos_accion: Record<string, unknown>
  status?: 'nuevo' | 'recurrente' | 'resuelto'
  responsable?: string
  impacto_estimado?: string
}

interface TimelineEvento {
  hora: string
  evento: string
  detalle: string
}

interface AlertaSistema {
  tipo: 'integracion' | 'datos' | 'rendimiento'
  mensaje: string
}

interface Metricas {
  cotizaciones_pedidas?: number
  cotizaciones_enviadas?: number
  leads_nuevos?: number
  respuestas_recibidas?: number
  correos_entrantes?: number
  correos_salientes?: number
  utilizacion_flota_pct?: number
  whatsapp_mensajes?: number
  [key: string]: number | undefined
}

interface MetricaComparada {
  manana: number
  ahora: number
  cambio: string
}

interface CierreDia {
  logros: string[]
  pendientes_manana: string[]
  pendientes_resueltos?: string[]
  metricas_comparadas?: Record<string, MetricaComparada>
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
  alertas_sistema?: AlertaSistema[]
  created_at: string
}

const t = tokens

// ─── HELPERS ────────────────────────────────────────────

function formatFechaLarga(fecha: string): string {
  const d = new Date(fecha + 'T12:00:00')
  const dias = ['Domingo', 'Lunes', 'Martes', 'Miercoles', 'Jueves', 'Viernes', 'Sabado']
  const meses = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre']
  return `${dias[d.getDay()]} ${d.getDate()} de ${meses[d.getMonth()]}, ${d.getFullYear()}`
}

function prioridadOrder(p: string): number {
  if (p === 'alta') return 0
  if (p === 'media') return 1
  return 2
}

function prioridadColor(p: string): string {
  if (p === 'alta') return t.colors.red
  if (p === 'media') return t.colors.yellow
  return t.colors.green
}

function prioridadBg(p: string): string {
  if (p === 'alta') return t.colors.redBg
  if (p === 'media') return t.colors.yellowBg
  return t.colors.greenBg
}

function statusBadge(s?: string): { color: string; bg: string; label: string } {
  if (s === 'recurrente') return { color: t.colors.orange, bg: t.colors.orangeLight, label: 'Recurrente' }
  if (s === 'resuelto') return { color: t.colors.green, bg: t.colors.greenBg, label: 'Resuelto' }
  return { color: t.colors.blue, bg: t.colors.blueBg, label: 'Nuevo' }
}

function alertaIcon(tipo: string) {
  if (tipo === 'integracion') return <Zap size={14} />
  if (tipo === 'datos') return <Database size={14} />
  return <Shield size={14} />
}

// ─── COMPONENT ──────────────────────────────────────────

export default function BriefingChiefOfStaff() {
  const { id } = useParams<{ id: string }>()
  const [searchParams] = useSearchParams()
  const accessToken = searchParams.get('token')

  const [briefing, setBriefing] = useState<Briefing | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [expandTimeline, setExpandTimeline] = useState(false)
  const [copiedId, setCopiedId] = useState<string | null>(null)

  useEffect(() => {
    if (!id) return
    const fetchBriefing = async () => {
      setLoading(true)
      let query = supabase.from('briefings').select('*').eq('id', id)
      if (accessToken) {
        query = query.eq('access_token', accessToken)
      }
      const { data, error: err } = await query.single()
      if (err || !data) {
        setError('Briefing no encontrado o sin acceso')
      } else {
        setBriefing(data as Briefing)
      }
      setLoading(false)
    }
    fetchBriefing()
  }, [id, accessToken])

  const copyToClipboard = (text: string, itemId: string) => {
    navigator.clipboard.writeText(text)
    setCopiedId(itemId)
    setTimeout(() => setCopiedId(null), 2000)
  }

  if (loading) {
    return (
      <div style={{ minHeight: '100vh', background: t.colors.bgMain, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ color: t.colors.textSecondary, fontFamily: t.fonts.body, fontSize: '15px' }}>
          Cargando briefing...
        </div>
      </div>
    )
  }

  if (error || !briefing) {
    return (
      <div style={{ minHeight: '100vh', background: t.colors.bgMain, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ color: t.colors.red, fontFamily: t.fonts.body, fontSize: '15px' }}>
          {error || 'Error al cargar'}
        </div>
      </div>
    )
  }

  const isMorning = briefing.tipo === 'morning'
  const m = briefing.metricas || {}
  const pendientes = [...(briefing.pendientes || [])].sort((a, b) => prioridadOrder(a.prioridad) - prioridadOrder(b.prioridad))
  const alertas = briefing.alertas_sistema || []
  const cierre = briefing.cierre_dia

  // ─── RENDER ─────────────────────────────────────────

  return (
    <div style={{
      minHeight: '100vh',
      background: t.colors.bgMain,
      fontFamily: t.fonts.body,
      color: t.colors.textPrimary,
      paddingBottom: '40px',
    }}>
      {/* ── CONTAINER ── */}
      <div style={{
        maxWidth: '900px',
        margin: '0 auto',
        padding: '16px 12px',
      }}>

        {/* ── HEADER ── */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '16px 0',
          borderBottom: `1px solid ${t.colors.border}`,
          marginBottom: '16px',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{
              width: '36px', height: '36px', borderRadius: t.radius.md,
              background: isMorning ? t.colors.yellowBg : t.colors.blueBg,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              {isMorning ? <Sun size={18} color={t.colors.yellow} /> : <Moon size={18} color={t.colors.blue} />}
            </div>
            <div>
              <div style={{
                fontFamily: t.fonts.heading, fontWeight: 700, fontSize: '16px',
                color: t.colors.textPrimary, letterSpacing: '-0.3px',
              }}>
                {isMorning ? 'Briefing Matutino' : 'Cierre del Dia'}
              </div>
              <div style={{ fontSize: '12px', color: t.colors.textSecondary, display: 'flex', alignItems: 'center', gap: '4px' }}>
                <Calendar size={11} /> {formatFechaLarga(briefing.fecha)}
              </div>
            </div>
          </div>
          <div style={{
            display: 'flex', alignItems: 'center', gap: '6px',
            padding: '4px 10px', borderRadius: t.radius.full,
            background: t.colors.bgCard, border: `1px solid ${t.colors.border}`,
            fontSize: '11px', color: t.colors.textMuted,
          }}>
            <Brain size={12} /> AI Chief of Staff
          </div>
        </div>

        {/* ── ALERTAS DEL SISTEMA ── */}
        {alertas.length > 0 && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', marginBottom: '16px' }}>
            {alertas.map((a, i) => (
              <div key={i} style={{
                display: 'flex', alignItems: 'center', gap: '8px',
                padding: '8px 12px', borderRadius: t.radius.md,
                background: a.tipo === 'integracion' ? t.colors.redBg : a.tipo === 'datos' ? t.colors.yellowBg : t.colors.orangeLight,
                border: `1px solid ${a.tipo === 'integracion' ? t.colors.red : a.tipo === 'datos' ? t.colors.yellow : t.colors.orange}22`,
                fontSize: '12px', color: a.tipo === 'integracion' ? t.colors.red : a.tipo === 'datos' ? t.colors.yellow : t.colors.orange,
              }}>
                {alertaIcon(a.tipo)}
                <span style={{ fontWeight: 600, textTransform: 'uppercase', fontSize: '10px', letterSpacing: '0.5px' }}>
                  {a.tipo}
                </span>
                <span style={{ color: t.colors.textSecondary, fontSize: '12px' }}>{a.mensaje}</span>
              </div>
            ))}
          </div>
        )}

        {/* ── METRICAS GRID ── */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))',
          gap: '8px',
          marginBottom: '16px',
        }}>
          {[
            { label: 'Cotizaciones', value: m.cotizaciones_enviadas ?? 0, sub: `${m.cotizaciones_pedidas ?? 0} pedidas`, icon: <FileText size={14} />, color: t.colors.blue },
            { label: 'Leads Nuevos', value: m.leads_nuevos ?? 0, icon: <Users size={14} />, color: t.colors.green },
            { label: 'Correos In', value: m.correos_entrantes ?? 0, icon: <Mail size={14} />, color: t.colors.primary },
            { label: 'Correos Out', value: m.correos_salientes ?? 0, icon: <MailOpen size={14} />, color: t.colors.orange },
            { label: 'Flota', value: m.utilizacion_flota_pct != null ? `${m.utilizacion_flota_pct}%` : '-', icon: <Truck size={14} />, color: t.colors.yellow, isFlota: true },
            { label: 'WhatsApp', value: m.whatsapp_mensajes ?? 0, icon: <MessageCircle size={14} />, color: t.colors.green },
          ].map((metric, i) => (
            <div key={i} style={{
              background: t.colors.bgCard,
              border: `1px solid ${t.colors.border}`,
              borderRadius: t.radius.md,
              padding: '10px 12px',
              boxShadow: t.effects.cardHighlight,
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '4px' }}>
                <span style={{ color: metric.color, opacity: 0.8 }}>{metric.icon}</span>
                <span style={{ fontSize: '10px', color: t.colors.textMuted, textTransform: 'uppercase', letterSpacing: '0.5px', fontWeight: 600 }}>
                  {metric.label}
                </span>
              </div>
              <div style={{ fontSize: '22px', fontWeight: 700, fontFamily: t.fonts.heading, color: t.colors.textPrimary }}>
                {metric.value}
              </div>
              {metric.sub && (
                <div style={{ fontSize: '10px', color: t.colors.textMuted, marginTop: '2px' }}>{metric.sub}</div>
              )}
              {/* Gauge bar for flota */}
              {'isFlota' in metric && metric.isFlota && m.utilizacion_flota_pct != null && (
                <div style={{ marginTop: '6px', height: '3px', borderRadius: '2px', background: t.colors.bgHover }}>
                  <div style={{
                    height: '100%', borderRadius: '2px',
                    width: `${Math.min(m.utilizacion_flota_pct, 100)}%`,
                    background: m.utilizacion_flota_pct > 85 ? t.colors.green : m.utilizacion_flota_pct > 60 ? t.colors.yellow : t.colors.red,
                  }} />
                </div>
              )}
            </div>
          ))}
        </div>

        {/* ── RESUMEN EJECUTIVO ── */}
        <div style={{
          background: t.colors.bgCard,
          border: `1px solid ${t.colors.border}`,
          borderRadius: t.radius.md,
          padding: '14px 16px',
          marginBottom: '16px',
          boxShadow: t.effects.cardHighlight,
        }}>
          <div style={{
            display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '8px',
            fontSize: '11px', fontWeight: 700, color: t.colors.textSecondary,
            textTransform: 'uppercase', letterSpacing: '0.8px',
          }}>
            <Brain size={13} /> Resumen Ejecutivo
          </div>
          <div style={{
            fontSize: '13px', lineHeight: '1.6', color: t.colors.textPrimary,
            whiteSpace: 'pre-wrap',
          }}>
            {briefing.resumen_ejecutivo}
          </div>
        </div>

        {/* ── PENDIENTES ── */}
        {pendientes.length > 0 && (
          <div style={{
            background: t.colors.bgCard,
            border: `1px solid ${t.colors.border}`,
            borderRadius: t.radius.md,
            padding: '14px 16px',
            marginBottom: '16px',
            boxShadow: t.effects.cardHighlight,
          }}>
            <div style={{
              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              marginBottom: '10px',
            }}>
              <div style={{
                display: 'flex', alignItems: 'center', gap: '6px',
                fontSize: '11px', fontWeight: 700, color: t.colors.textSecondary,
                textTransform: 'uppercase', letterSpacing: '0.8px',
              }}>
                <AlertTriangle size={13} /> Pendientes ({pendientes.length})
              </div>
              <div style={{ display: 'flex', gap: '4px' }}>
                {['alta', 'media', 'baja'].map(p => {
                  const count = pendientes.filter(x => x.prioridad === p).length
                  if (!count) return null
                  return (
                    <span key={p} style={{
                      fontSize: '9px', fontWeight: 700, padding: '2px 6px',
                      borderRadius: t.radius.full, color: prioridadColor(p),
                      background: prioridadBg(p), textTransform: 'uppercase',
                    }}>
                      {count} {p}
                    </span>
                  )
                })}
              </div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              {pendientes.map((p, i) => {
                const sb = statusBadge(p.status)
                const isResolved = p.status === 'resuelto'
                return (
                  <div key={i} style={{
                    padding: '10px 12px',
                    borderRadius: t.radius.sm,
                    background: t.colors.bgMain,
                    border: `1px solid ${t.colors.border}`,
                    opacity: isResolved ? 0.6 : 1,
                  }}>
                    {/* Top row: priority + status + title */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap' }}>
                      <span style={{
                        width: '6px', height: '6px', borderRadius: '50%',
                        background: prioridadColor(p.prioridad), flexShrink: 0,
                      }} />
                      <span style={{
                        fontSize: '9px', fontWeight: 700, padding: '1px 6px',
                        borderRadius: t.radius.full, color: sb.color,
                        background: sb.bg, textTransform: 'uppercase', letterSpacing: '0.3px',
                      }}>
                        {sb.label}
                      </span>
                      <span style={{
                        fontSize: '13px', fontWeight: 600, color: t.colors.textPrimary,
                        textDecoration: isResolved ? 'line-through' : 'none',
                        flex: 1,
                      }}>
                        {p.titulo}
                      </span>
                      <button
                        onClick={() => copyToClipboard(`${p.titulo}: ${p.descripcion}. Accion: ${p.accion_sugerida}`, `p-${i}`)}
                        style={{
                          background: 'none', border: 'none', cursor: 'pointer',
                          color: copiedId === `p-${i}` ? t.colors.green : t.colors.textMuted,
                          padding: '2px', flexShrink: 0,
                        }}
                      >
                        {copiedId === `p-${i}` ? <CheckCircle2 size={13} /> : <Copy size={13} />}
                      </button>
                    </div>

                    {/* Description */}
                    <div style={{ fontSize: '12px', color: t.colors.textSecondary, marginTop: '4px', lineHeight: '1.5' }}>
                      {p.descripcion}
                    </div>

                    {/* Impacto estimado */}
                    {p.impacto_estimado && (
                      <div style={{ fontSize: '11px', color: t.colors.textMuted, marginTop: '3px', fontStyle: 'italic' }}>
                        Impacto: {p.impacto_estimado}
                      </div>
                    )}

                    {/* Bottom row: responsable + accion */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '6px', flexWrap: 'wrap' }}>
                      {p.responsable && (
                        <span style={{
                          fontSize: '10px', color: t.colors.primary, fontWeight: 600,
                          display: 'flex', alignItems: 'center', gap: '3px',
                        }}>
                          <Users size={10} /> {p.responsable}
                        </span>
                      )}
                      {p.accion_sugerida && !isResolved && (
                        <span style={{
                          fontSize: '10px', color: t.colors.textMuted,
                          padding: '2px 6px', borderRadius: t.radius.sm,
                          background: t.colors.bgHover,
                        }}>
                          {p.accion_sugerida}
                        </span>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        )}

        {/* ── TIMELINE ── */}
        {(briefing.timeline || []).length > 0 && (
          <div style={{
            background: t.colors.bgCard,
            border: `1px solid ${t.colors.border}`,
            borderRadius: t.radius.md,
            padding: '14px 16px',
            marginBottom: '16px',
            boxShadow: t.effects.cardHighlight,
          }}>
            <button
              onClick={() => setExpandTimeline(!expandTimeline)}
              style={{
                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                width: '100%', background: 'none', border: 'none', cursor: 'pointer',
                padding: 0, color: t.colors.textSecondary,
              }}
            >
              <span style={{
                display: 'flex', alignItems: 'center', gap: '6px',
                fontSize: '11px', fontWeight: 700,
                textTransform: 'uppercase', letterSpacing: '0.8px',
              }}>
                <Clock size={13} /> Timeline ({briefing.timeline.length} eventos)
              </span>
              {expandTimeline ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
            </button>

            {expandTimeline && (
              <div style={{ marginTop: '10px', display: 'flex', flexDirection: 'column', gap: '6px' }}>
                {briefing.timeline.map((ev, i) => (
                  <div key={i} style={{
                    display: 'flex', gap: '10px', padding: '6px 0',
                    borderBottom: i < briefing.timeline.length - 1 ? `1px solid ${t.colors.border}` : 'none',
                  }}>
                    <span style={{
                      fontSize: '11px', fontWeight: 700, color: t.colors.primary,
                      minWidth: '50px', flexShrink: 0,
                    }}>
                      {ev.hora}
                    </span>
                    <div>
                      <div style={{ fontSize: '12px', fontWeight: 600, color: t.colors.textPrimary }}>
                        {ev.evento}
                      </div>
                      <div style={{ fontSize: '11px', color: t.colors.textMuted, marginTop: '1px' }}>
                        {ev.detalle}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ── CIERRE DEL DIA (solo evening) ── */}
        {!isMorning && cierre && (
          <>
            {/* Pendientes Resueltos */}
            {cierre.pendientes_resueltos && cierre.pendientes_resueltos.length > 0 && (
              <div style={{
                background: t.colors.bgCard,
                border: `1px solid ${t.colors.border}`,
                borderRadius: t.radius.md,
                padding: '14px 16px',
                marginBottom: '16px',
                boxShadow: t.effects.cardHighlight,
              }}>
                <div style={{
                  display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '8px',
                  fontSize: '11px', fontWeight: 700, color: t.colors.green,
                  textTransform: 'uppercase', letterSpacing: '0.8px',
                }}>
                  <CheckCircle2 size={13} /> Resueltos Hoy ({cierre.pendientes_resueltos.length})
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                  {cierre.pendientes_resueltos.map((item, i) => (
                    <div key={i} style={{
                      display: 'flex', alignItems: 'center', gap: '6px',
                      fontSize: '12px', color: t.colors.textSecondary,
                    }}>
                      <CheckCircle2 size={12} color={t.colors.green} />
                      <span style={{ textDecoration: 'line-through', opacity: 0.8 }}>{item}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Metricas Comparadas (manana vs ahora) */}
            {cierre.metricas_comparadas && Object.keys(cierre.metricas_comparadas).length > 0 && (
              <div style={{
                background: t.colors.bgCard,
                border: `1px solid ${t.colors.border}`,
                borderRadius: t.radius.md,
                padding: '14px 16px',
                marginBottom: '16px',
                boxShadow: t.effects.cardHighlight,
              }}>
                <div style={{
                  display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '10px',
                  fontSize: '11px', fontWeight: 700, color: t.colors.textSecondary,
                  textTransform: 'uppercase', letterSpacing: '0.8px',
                }}>
                  <TrendingUp size={13} /> Comparativo del Dia
                </div>
                <div style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))',
                  gap: '8px',
                }}>
                  {Object.entries(cierre.metricas_comparadas).map(([campo, val]) => {
                    const mc = val as MetricaComparada
                    const isUp = mc.ahora > mc.manana
                    const isDown = mc.ahora < mc.manana
                    return (
                      <div key={campo} style={{
                        padding: '8px 10px', borderRadius: t.radius.sm,
                        background: t.colors.bgMain, border: `1px solid ${t.colors.border}`,
                      }}>
                        <div style={{ fontSize: '10px', color: t.colors.textMuted, textTransform: 'uppercase', marginBottom: '4px', fontWeight: 600, letterSpacing: '0.3px' }}>
                          {campo.replace(/_/g, ' ')}
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                          <div>
                            <span style={{ fontSize: '10px', color: t.colors.textMuted }}>AM </span>
                            <span style={{ fontSize: '13px', fontWeight: 600, color: t.colors.textSecondary }}>{mc.manana}</span>
                          </div>
                          <div style={{ color: isUp ? t.colors.green : isDown ? t.colors.red : t.colors.textMuted }}>
                            {isUp ? <ArrowUp size={14} /> : isDown ? <ArrowDown size={14} /> : <Minus size={14} />}
                          </div>
                          <div>
                            <span style={{ fontSize: '10px', color: t.colors.textMuted }}>PM </span>
                            <span style={{ fontSize: '13px', fontWeight: 700, color: t.colors.textPrimary }}>{mc.ahora}</span>
                          </div>
                        </div>
                        {mc.cambio && (
                          <div style={{
                            fontSize: '10px', marginTop: '3px', fontWeight: 600,
                            color: isUp ? t.colors.green : isDown ? t.colors.red : t.colors.textMuted,
                          }}>
                            {mc.cambio}
                          </div>
                        )}
                      </div>
                    )
                  })}
                </div>
              </div>
            )}

            {/* Logros */}
            {cierre.logros && cierre.logros.length > 0 && (
              <div style={{
                background: t.colors.bgCard,
                border: `1px solid ${t.colors.border}`,
                borderRadius: t.radius.md,
                padding: '14px 16px',
                marginBottom: '16px',
                boxShadow: t.effects.cardHighlight,
              }}>
                <div style={{
                  display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '8px',
                  fontSize: '11px', fontWeight: 700, color: t.colors.textSecondary,
                  textTransform: 'uppercase', letterSpacing: '0.8px',
                }}>
                  <CheckCircle2 size={13} /> Logros del Dia
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                  {cierre.logros.map((l, i) => (
                    <div key={i} style={{ fontSize: '12px', color: t.colors.textPrimary, display: 'flex', gap: '6px', lineHeight: '1.5' }}>
                      <span style={{ color: t.colors.green, flexShrink: 0, marginTop: '2px' }}>
                        <CheckCircle2 size={12} />
                      </span>
                      {l}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Pendientes para manana */}
            {cierre.pendientes_manana && cierre.pendientes_manana.length > 0 && (
              <div style={{
                background: t.colors.bgCard,
                border: `1px solid ${t.colors.border}`,
                borderRadius: t.radius.md,
                padding: '14px 16px',
                marginBottom: '16px',
                boxShadow: t.effects.cardHighlight,
              }}>
                <div style={{
                  display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '8px',
                  fontSize: '11px', fontWeight: 700, color: t.colors.textSecondary,
                  textTransform: 'uppercase', letterSpacing: '0.8px',
                }}>
                  <AlertCircle size={13} /> Pendientes para Manana
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                  {cierre.pendientes_manana.map((p, i) => (
                    <div key={i} style={{ fontSize: '12px', color: t.colors.textPrimary, display: 'flex', gap: '6px', lineHeight: '1.5' }}>
                      <span style={{ color: t.colors.yellow, flexShrink: 0, marginTop: '2px' }}>
                        <AlertCircle size={12} />
                      </span>
                      {p}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </>
        )}

        {/* ── FOOTER ── */}
        <div style={{
          textAlign: 'center',
          padding: '12px 0',
          fontSize: '10px',
          color: t.colors.textMuted,
          borderTop: `1px solid ${t.colors.border}`,
          marginTop: '8px',
        }}>
          LomaHUB27 · AI Chief of Staff · Generado {new Date(briefing.created_at).toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit' })}
        </div>
      </div>
    </div>
  )
}
