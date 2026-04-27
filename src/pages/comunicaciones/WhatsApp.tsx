// ===================================================================
// WhatsApp Bandeja — V50 (26/Abr/2026)
// Reemplaza STUB Proximamente. Conectado a tabla whatsapp_mensajes
// y whatsapp_numeros_autorizados. Usa edge fn whatsapp-masivo para enviar.
// ===================================================================
import { useEffect, useMemo, useRef, useState } from 'react'
import { ModuleLayout } from '../../components/layout/ModuleLayout'
import { tokens } from '../../lib/tokens'
import { supabase } from '../../lib/supabase'
import { useAuthContext } from '../../hooks/AuthContext'

interface Mensaje {
  id: string
  numero_origen: string
  cliente_id: string | null
  direccion: 'entrante' | 'saliente'
  contenido: string | null
  tipo: string | null
  timestamp: string | null
  ejecutiva_id: string | null
  tiempo_respuesta_min: number | null
  en_sla: boolean | null
}

interface NumeroAutorizado {
  id: string
  cliente_id: string | null
  numero: string
  nombre_contacto: string | null
  activo: boolean
}

interface ClienteMin {
  id: string
  razon_social: string
}

interface Conversacion {
  numero: string
  nombre_display: string
  cliente_id: string | null
  ultimo_mensaje: string
  ultimo_ts: string
  count: number
  no_leidos: number
}

export default function WhatsAppBandeja() {
  const { user } = useAuthContext()
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [mensajes, setMensajes] = useState<Mensaje[]>([])
  const [numeros, setNumeros] = useState<NumeroAutorizado[]>([])
  const [clientes, setClientes] = useState<Record<string, ClienteMin>>({})
  const [activeNumero, setActiveNumero] = useState<string | null>(null)
  const [draftText, setDraftText] = useState('')
  const [sending, setSending] = useState(false)
  const scrollRef = useRef<HTMLDivElement>(null)

  // Fetch inicial
  useEffect(() => {
    let mounted = true
    const load = async () => {
      setLoading(true)
      setError(null)
      try {
        const [msgRes, numRes] = await Promise.all([
          supabase.from('whatsapp_mensajes').select('*').order('timestamp', { ascending: false }).limit(500),
          supabase.from('whatsapp_numeros_autorizados').select('*').eq('activo', true),
        ])
        if (msgRes.error) throw msgRes.error
        if (numRes.error) throw numRes.error
        if (!mounted) return
        const msgs = (msgRes.data || []) as Mensaje[]
        const nums = (numRes.data || []) as NumeroAutorizado[]
        setMensajes(msgs)
        setNumeros(nums)

        // Cargar clientes de los mensajes para mostrar nombre
        const cliIds = Array.from(new Set([
          ...msgs.map(m => m.cliente_id).filter(Boolean) as string[],
          ...nums.map(n => n.cliente_id).filter(Boolean) as string[],
        ]))
        if (cliIds.length > 0) {
          const { data: cli } = await supabase.from('clientes')
            .select('id,razon_social').in('id', cliIds)
          if (cli && mounted) {
            const map: Record<string, ClienteMin> = {}
            cli.forEach((c: any) => { map[c.id] = c })
            setClientes(map)
          }
        }
      } catch (e: any) {
        setError(e.message || 'Error cargando bandeja')
      } finally {
        if (mounted) setLoading(false)
      }
    }
    load()
    // Refrescar cada 30s
    const iv = setInterval(load, 30000)
    return () => { mounted = false; clearInterval(iv) }
  }, [])

  // Agrupar por número
  const conversaciones = useMemo<Conversacion[]>(() => {
    const map = new Map<string, Conversacion>()
    for (const m of mensajes) {
      const num = m.numero_origen
      const cli = m.cliente_id ? clientes[m.cliente_id] : null
      const numAuth = numeros.find(n => n.numero === num)
      const display = cli?.razon_social || numAuth?.nombre_contacto || num
      const existing = map.get(num)
      if (!existing) {
        map.set(num, {
          numero: num,
          nombre_display: display,
          cliente_id: m.cliente_id,
          ultimo_mensaje: m.contenido?.slice(0, 60) || '(sin contenido)',
          ultimo_ts: m.timestamp || '',
          count: 1,
          no_leidos: m.direccion === 'entrante' ? 1 : 0,
        })
      } else {
        existing.count++
        if (m.direccion === 'entrante' && (!m.timestamp || !existing.ultimo_ts || m.timestamp > existing.ultimo_ts)) {
          existing.no_leidos++
        }
      }
    }
    return Array.from(map.values()).sort((a, b) => (b.ultimo_ts || '').localeCompare(a.ultimo_ts || ''))
  }, [mensajes, clientes, numeros])

  const mensajesActivos = useMemo(() => {
    if (!activeNumero) return []
    return mensajes
      .filter(m => m.numero_origen === activeNumero)
      .sort((a, b) => (a.timestamp || '').localeCompare(b.timestamp || ''))
  }, [mensajes, activeNumero])

  // Auto-scroll al fondo
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight
    }
  }, [activeNumero, mensajesActivos.length])

  const handleSend = async () => {
    if (!activeNumero || !draftText.trim() || sending) return
    setSending(true)
    setError(null)
    try {
      // Invocar whatsapp-masivo con un solo destinatario
      const { error: invokeErr } = await supabase.functions.invoke('whatsapp-masivo', {
        body: {
          destinatarios: [activeNumero],
          mensaje: draftText.trim(),
          ejecutiva_id: user?.id || null,
        },
      })
      if (invokeErr) throw invokeErr
      // Insertar también en tabla local para refresh inmediato
      const newMsg: Partial<Mensaje> = {
        numero_origen: activeNumero,
        direccion: 'saliente',
        contenido: draftText.trim(),
        tipo: 'texto',
        timestamp: new Date().toISOString(),
        ejecutiva_id: user?.id || null,
      }
      await supabase.from('whatsapp_mensajes').insert(newMsg)
      setDraftText('')
      // Refresh bandeja
      const { data } = await supabase.from('whatsapp_mensajes').select('*').order('timestamp', { ascending: false }).limit(500)
      if (data) setMensajes(data as Mensaje[])
    } catch (e: any) {
      setError(e.message || 'Error enviando mensaje')
    } finally {
      setSending(false)
    }
  }

  return (
    <ModuleLayout
      titulo="WhatsApp Bandeja"
      subtitulo={loading ? 'Cargando...' : `${conversaciones.length} conversaciones · ${mensajes.length} mensajes`}
    >
      {error && (
        <div style={{
          margin: '12px 0', padding: '12px 16px', borderRadius: 10,
          background: 'rgba(239,68,68,0.06)', border: '1px solid rgba(239,68,68,0.30)',
          color: '#B91C1C', fontSize: 13, fontFamily: tokens.fonts.body,
        }}>
          ⚠ {error}
        </div>
      )}

      <div style={{ display: 'flex', gap: '14px', flex: 1, minHeight: 0 }}>
        {/* SIDEBAR — Lista de conversaciones */}
        <div style={{
          width: 320, flexShrink: 0,
          background: '#FFFFFF', border: '1px solid #E5E7EB',
          borderRadius: 12, display: 'flex', flexDirection: 'column',
          overflow: 'hidden',
        }}>
          <div style={{
            padding: '14px 16px', borderBottom: '1px solid #E5E7EB',
            fontFamily: tokens.fonts.heading, fontWeight: 700, fontSize: 14,
            color: '#0F172A',
          }}>
            Conversaciones
          </div>
          <div style={{ flex: 1, overflowY: 'auto' }}>
            {loading ? (
              <div style={{ padding: 24, textAlign: 'center', color: '#94A3B8', fontSize: 13 }}>
                Cargando bandeja...
              </div>
            ) : conversaciones.length === 0 ? (
              <div style={{ padding: 24, textAlign: 'center', color: '#94A3B8', fontSize: 13 }}>
                <p style={{ marginBottom: 8 }}>No hay mensajes aún.</p>
                <p style={{ fontSize: 11 }}>Cuando un cliente escriba al WhatsApp Business conectado, aparecerá aquí.</p>
              </div>
            ) : (
              conversaciones.map(c => (
                <div
                  key={c.numero}
                  onClick={() => setActiveNumero(c.numero)}
                  style={{
                    padding: '12px 16px', cursor: 'pointer',
                    borderBottom: '1px solid #F1F5F9',
                    background: activeNumero === c.numero ? 'rgba(59,108,231,0.06)' : 'transparent',
                    borderLeft: activeNumero === c.numero ? `3px solid ${tokens.colors.primary}` : '3px solid transparent',
                    display: 'flex', flexDirection: 'column', gap: 4,
                    transition: 'background 0.12s',
                  }}
                  onMouseEnter={(e) => { if (activeNumero !== c.numero) e.currentTarget.style.background = '#F8FAFC' }}
                  onMouseLeave={(e) => { if (activeNumero !== c.numero) e.currentTarget.style.background = 'transparent' }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontFamily: tokens.fonts.heading, fontSize: 13, fontWeight: 600, color: '#0F172A',
                                   whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', flex: 1 }}>
                      {c.nombre_display}
                    </span>
                    {c.no_leidos > 0 && (
                      <span style={{
                        background: '#10B981', color: 'white', borderRadius: 999,
                        padding: '1px 7px', fontSize: 10, fontWeight: 700, marginLeft: 6,
                      }}>{c.no_leidos}</span>
                    )}
                  </div>
                  <span style={{ fontSize: 11, color: '#64748B', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    {c.numero}
                  </span>
                  <span style={{ fontSize: 12, color: '#475569', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    {c.ultimo_mensaje}
                  </span>
                </div>
              ))
            )}
          </div>
        </div>

        {/* MAIN — Chat */}
        <div style={{
          flex: 1, background: '#FFFFFF', border: '1px solid #E5E7EB',
          borderRadius: 12, display: 'flex', flexDirection: 'column', overflow: 'hidden',
        }}>
          {!activeNumero ? (
            <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center',
                          flexDirection: 'column', color: '#94A3B8', gap: 12 }}>
              <span style={{ fontSize: 48 }}>💬</span>
              <p style={{ fontSize: 13, fontFamily: tokens.fonts.body }}>
                Selecciona una conversación para ver mensajes
              </p>
            </div>
          ) : (
            <>
              {/* Header chat */}
              <div style={{ padding: '14px 18px', borderBottom: '1px solid #E5E7EB',
                            display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <div style={{ fontFamily: tokens.fonts.heading, fontWeight: 700, fontSize: 15, color: '#0F172A' }}>
                    {conversaciones.find(c => c.numero === activeNumero)?.nombre_display}
                  </div>
                  <div style={{ fontSize: 11, color: '#64748B' }}>{activeNumero}</div>
                </div>
                <span style={{ fontSize: 11, color: '#64748B' }}>
                  {mensajesActivos.length} mensajes
                </span>
              </div>

              {/* Mensajes */}
              <div ref={scrollRef} style={{
                flex: 1, overflowY: 'auto', padding: '16px 18px',
                background: '#F8FAFC',
                display: 'flex', flexDirection: 'column', gap: 8,
              }}>
                {mensajesActivos.map(m => {
                  const out = m.direccion === 'saliente'
                  return (
                    <div key={m.id} style={{
                      alignSelf: out ? 'flex-end' : 'flex-start',
                      maxWidth: '70%',
                      background: out ? tokens.colors.primary : '#FFFFFF',
                      color: out ? '#FFFFFF' : '#0F172A',
                      padding: '8px 12px', borderRadius: 10,
                      border: out ? 'none' : '1px solid #E5E7EB',
                      fontSize: 13, fontFamily: tokens.fonts.body,
                      boxShadow: out ? 'none' : '0 1px 2px rgba(15,23,42,0.04)',
                    }}>
                      <div>{m.contenido}</div>
                      <div style={{ fontSize: 10, opacity: 0.7, marginTop: 4, textAlign: 'right' }}>
                        {m.timestamp ? new Date(m.timestamp).toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit' }) : ''}
                      </div>
                    </div>
                  )
                })}
              </div>

              {/* Input */}
              <div style={{ padding: 12, borderTop: '1px solid #E5E7EB', display: 'flex', gap: 8 }}>
                <input
                  type="text"
                  value={draftText}
                  onChange={(e) => setDraftText(e.target.value)}
                  onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend() } }}
                  placeholder="Escribe un mensaje..."
                  disabled={sending}
                  style={{
                    flex: 1, padding: '10px 14px', borderRadius: 10,
                    border: '1px solid #CBD5E1', fontSize: 13, fontFamily: tokens.fonts.body,
                    outline: 'none',
                  }}
                />
                <button
                  onClick={handleSend}
                  disabled={sending || !draftText.trim()}
                  style={{
                    padding: '10px 18px', borderRadius: 10, border: 'none',
                    background: sending || !draftText.trim() ? '#CBD5E1' : tokens.colors.primary,
                    color: '#FFFFFF', fontWeight: 600, fontSize: 13,
                    cursor: sending || !draftText.trim() ? 'not-allowed' : 'pointer',
                    fontFamily: tokens.fonts.body,
                  }}
                >
                  {sending ? 'Enviando...' : 'Enviar'}
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </ModuleLayout>
  )
}
