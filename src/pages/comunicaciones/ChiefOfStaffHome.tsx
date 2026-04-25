import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../../lib/supabase'
import { tokens } from '../../lib/tokens'
import { ModuleLayout } from '../../components/layout/ModuleLayout'
import {
  Brain, Sun, Moon, Filter, ChevronRight,
  Calendar, Clock
} from 'lucide-react'

interface BriefingSummary {
  id: string
  tipo: string
  fecha: string
  resumen_ejecutivo: string
  created_at: string
  metricas: Record<string, number>
}

type FiltroTipo = 'todos' | 'morning' | 'evening'

const t = tokens

function formatFechaCorta(fecha: string): string {
  const d = new Date(fecha + 'T12:00:00')
  const meses = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic']
  const dias = ['Dom', 'Lun', 'Mar', 'MiÃ©', 'Jue', 'Vie', 'SÃ¡b']
  return `${dias[d.getDay()]} ${d.getDate()} ${meses[d.getMonth()]} ${d.getFullYear()}`
}

export default function ChiefOfStaffHome() {
  const navigate = useNavigate()
  const [briefings, setBriefings] = useState<BriefingSummary[]>([])
  const [loading, setLoading] = useState(true)
  const [filtro, setFiltro] = useState<FiltroTipo>('todos')

  useEffect(() => {
    async function fetchBriefings() {
      try {
        let query = supabase
          .from('briefings')
          .select('id, tipo, fecha, resumen_ejecutivo, created_at, metricas')
          .is('deleted_at', null)
          .order('fecha', { ascending: false })
          .order('created_at', { ascending: false })
          .limit(50)

        if (filtro !== 'todos') {
          query = query.eq('tipo', filtro)
        }

        const { data } = await query
        setBriefings((data || []) as BriefingSummary[])
      } catch {
        // silently fail
      } finally {
        setLoading(false)
      }
    }
    fetchBriefings()
  }, [filtro])

  const filtros: { label: string; value: FiltroTipo; icon: React.ReactNode }[] = [
    { label: 'Todos', value: 'todos', icon: <Filter size={14} /> },
    { label: 'Matutino', value: 'morning', icon: <Sun size={14} /> },
    { label: 'Cierre', value: 'evening', icon: <Moon size={14} /> },
  ]

  return (
    <ModuleLayout titulo="Resumen Ejecutivo" moduloPadre={{ nombre: 'Comercial', ruta: '/ventas/dashboard' }}>
    <div style={{
      height: 'calc(100vh - 110px)', background: t.colors.bgMain,
      fontFamily: t.fonts.body, color: t.colors.textPrimary,
      display: 'flex', flexDirection: 'column',
      overflow: 'hidden',
    }}>
      <div style={{ flex: 1, padding: '24px 32px', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>

        {/* âââ HEADER âââ */}
        <div style={{
          display: 'flex', alignItems: 'center', gap: '16px',
          marginBottom: '28px',
        }}>
          <div style={{
            width: '48px', height: '48px', borderRadius: t.radius.lg,
            background: t.colors.blueBg, display: 'flex',
            alignItems: 'center', justifyContent: 'center',
          }}>
            <Brain size={26} style={{ color: t.colors.primary }} />
          </div>
          <div>
            <h1 style={{
              margin: 0, fontSize: '20px', fontWeight: 700,
              fontFamily: t.fonts.heading, color: t.colors.textPrimary,
            }}>
              Resumen Ejecutivo IA
            </h1>
            <div style={{
              fontSize: '13px', color: t.colors.textSecondary, marginTop: '2px',
            }}>
              Tu asistente ejecutivo AI â briefings diarios
            </div>
          </div>
        </div>

        {/* âââ FILTROS âââ */}
        <div style={{
          display: 'flex', gap: '8px', marginBottom: '24px',
        }}>
          {filtros.map(f => (
            <button
              key={f.value}
              onClick={() => { setLoading(true); setFiltro(f.value) }}
              style={{
                display: 'flex', alignItems: 'center', gap: '6px',
                padding: '8px 16px', borderRadius: t.radius.full,
                background: filtro === f.value ? t.colors.primary : t.colors.bgCard,
                color: filtro === f.value ? '#fff' : t.colors.textSecondary,
                border: `1px solid ${filtro === f.value ? t.colors.primary : t.colors.border}`,
                cursor: 'pointer', fontSize: '13px', fontWeight: 600,
                fontFamily: t.fonts.body,
                transition: 'all 0.2s ease',
              }}
            >
              {f.icon} {f.label}
            </button>
          ))}
        </div>

        {/* âââ LISTA âââ */}
        {loading ? (
          <div style={{
            textAlign: 'center', padding: '60px 0',
            color: t.colors.textSecondary,
          }}>
            <Brain size={36} style={{ color: t.colors.primary, marginBottom: '12px' }} />
            <div>Cargando briefings...</div>
          </div>
        ) : briefings.length === 0 ? (
          <div style={{
            textAlign: 'center', padding: '60px 0',
            color: t.colors.textMuted,
          }}>
            <Brain size={36} style={{ marginBottom: '12px' }} />
            <div>No hay briefings aÃºn</div>
            <div style={{ fontSize: '13px', marginTop: '4px' }}>
              Los briefings se generan automÃ¡ticamente a las 7AM y 6PM
            </div>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', flex: 1, overflowY: 'auto', paddingRight: '4px' }}>
            {briefings.map((b, idx) => {
              const isMorning = b.tipo === 'morning'
              const preview = b.resumen_ejecutivo
                ? b.resumen_ejecutivo.substring(0, 300) + (b.resumen_ejecutivo.length > 300 ? '...' : '')
                : 'Sin resumen'

              return (
                <button
                  key={b.id}
                  onClick={() => navigate(`/briefing/${b.id}`)}
                  style={{
                    display: 'flex', alignItems: 'center', gap: '16px',
                    width: '100%', padding: '16px 20px', textAlign: 'left',
                    background: idx === 0 ? t.colors.bgHover : t.colors.bgCard,
                    border: idx === 0
                      ? `1px solid ${t.colors.primary}`
                      : `1px solid ${t.colors.border}`,
                    borderRadius: t.radius.lg,
                    cursor: 'pointer',
                    boxShadow: idx === 0 ? t.effects.glowPrimary : t.effects.cardShadow,
                    transition: 'all 0.2s ease',
                  }}
                >
                  <div style={{
                    width: '40px', height: '40px', borderRadius: t.radius.md,
                    background: isMorning ? t.colors.yellowBg : t.colors.blueBg,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    flexShrink: 0,
                  }}>
                    {isMorning
                      ? <Sun size={20} style={{ color: t.colors.yellow }} />
                      : <Moon size={20} style={{ color: t.colors.primary }} />
                    }
                  </div>

                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                      <span style={{
                        fontSize: '14px', fontWeight: 700,
                        fontFamily: t.fonts.heading, color: t.colors.textPrimary,
                      }}>
                        {isMorning ? 'Briefing Matutino' : 'Cierre del DÃ­a'}
                      </span>
                      {idx === 0 && (
                        <span style={{
                          fontSize: '10px', fontWeight: 700,
                          padding: '2px 8px', borderRadius: t.radius.full,
                          background: t.colors.primary, color: '#fff',
                          textTransform: 'uppercase', letterSpacing: '0.5px',
                        }}>
                          MÃ¡s reciente
                        </span>
                      )}
                    </div>
                    <div style={{
                      display: 'flex', alignItems: 'center', gap: '12px',
                      fontSize: '12px', color: t.colors.textMuted, marginBottom: '6px',
                    }}>
                      <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                        <Calendar size={12} /> {formatFechaCorta(b.fecha)}
                      </span>
                      <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                        <Clock size={12} /> {new Date(b.created_at).toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                    <div style={{
                      fontSize: '13px', color: t.colors.textSecondary,
                      lineHeight: '1.5', overflow: 'hidden',
                      display: '-webkit-box', WebkitLineClamp: 2,
                      WebkitBoxOrient: 'vertical' as const,
                    }}>
                      {preview}
                    </div>
                  </div>

                  <ChevronRight size={18} style={{ color: t.colors.textMuted, flexShrink: 0 }} />
                </button>
              )
            })}
          </div>
        )}
      </div>
    </div>
    </ModuleLayout>
  )
}
