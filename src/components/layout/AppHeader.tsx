'use client'

import React, { useState, useEffect, useRef, useCallback } from 'react'
import { supabase } from '../../lib/supabase'
import { useFxRate } from '../../hooks/useFxRate'

interface AppHeaderProps {
  onLogout: () => void
  userName?: string
  userRole?: string
  userEmail?: string
}

interface Notificacion {
  id: string
  tipo: 'alerta' | 'info' | 'exito' | 'pendiente'
  titulo: string
  mensaje: string
  leida: boolean
  created_at: string
  url_destino?: string
}

// V32 AppHeader — refinement premium polish sobre V31
// Cambios: shadow más limpia (less cloudy), bottom separation line sutil,
// typography hierarchy mejorada (user stronger, role secondary),
// bell + logout más crisp con border 1px fino y svg stroke 1.8px
export default function AppHeader({
  onLogout,
  userName = 'Usuario',
  userRole = 'Usuario',
  userEmail = '',
}: AppHeaderProps) {
  const [notifications, setNotifications] = useState<Notificacion[]>([])
  const [showNotifPanel, setShowNotifPanel] = useState(false)
  const [unreadCount, setUnreadCount] = useState(0)
  const [loading, setLoading] = useState(false)
  const { rate: tipoCambio } = useFxRate()
  const notifPanelRef = useRef<HTMLDivElement>(null)
  const bellButtonRef = useRef<HTMLButtonElement>(null)

  const now = new Date()
  const fechaStr = now.toLocaleDateString('es-MX', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  })
  const getWeekNumber = (d: Date): number => {
    const oneJan = new Date(d.getFullYear(), 0, 1)
    const days = Math.floor((d.getTime() - oneJan.getTime()) / 86400000)
    return Math.ceil((days + oneJan.getDay() + 1) / 7)
  }
  const weekNum = getWeekNumber(now)

  const fetchNotifications = useCallback(async () => {
    if (!userEmail) return
    try {
      setLoading(true)
      const { data, error } = await supabase
        .from('notificaciones')
        .select('*')
        .eq('usuario_email', userEmail)
        .is('deleted_at', null)
        .order('created_at', { ascending: false })
        .limit(50)

      if (error) {
        console.error('Error fetching notifications:', error)
        return
      }

      const list: Notificacion[] = (data ?? []).map((n: any) => ({
        id: n.id,
        tipo: n.tipo,
        titulo: n.titulo,
        mensaje: n.mensaje,
        leida: n.leida,
        created_at: n.created_at,
        url_destino: n.url_destino,
      }))

      setNotifications(list)
      setUnreadCount(list.filter((n) => !n.leida).length)
    } catch (err) {
      console.error('Error in fetchNotifications:', err)
    } finally {
      setLoading(false)
    }
  }, [userEmail])

  useEffect(() => {
    fetchNotifications()
    if (!userEmail) return

    const subscription = supabase
      .channel(`notifications:${userEmail}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'notificaciones',
          filter: `usuario_email=eq.${userEmail}`,
        },
        () => fetchNotifications()
      )
      .subscribe()

    return () => { subscription.unsubscribe() }
  }, [userEmail, fetchNotifications])

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (
        notifPanelRef.current &&
        !notifPanelRef.current.contains(e.target as Node) &&
        bellButtonRef.current &&
        !bellButtonRef.current.contains(e.target as Node)
      ) {
        setShowNotifPanel(false)
      }
    }
    if (showNotifPanel) {
      document.addEventListener('mousedown', handleClickOutside)
      return () => document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [showNotifPanel])

  const markAsRead = async (id: string) => {
    try {
      const { error } = await supabase
        .from('notificaciones')
        .update({ leida: true })
        .eq('id', id)
      if (error) return
      setNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, leida: true } : n)))
      setUnreadCount((prev) => Math.max(0, prev - 1))
    } catch (err) {
      console.error('Error markAsRead:', err)
    }
  }

  const handleNotifClick = (n: Notificacion) => {
    if (!n.leida) markAsRead(n.id)
    if (n.url_destino) window.location.href = n.url_destino
  }

  const typeColor = (t: string) => {
    switch (t) {
      case 'alerta': return '#B8860B'
      case 'exito': return '#0D9668'
      case 'info': return '#3B6CE7'
      case 'pendiente': return '#A855F7'
      default: return '#6B7280'
    }
  }

  const timeAgo = (d: string) => {
    const secs = Math.floor((Date.now() - new Date(d).getTime()) / 1000)
    if (secs < 60) return 'Hace un momento'
    const mins = Math.floor(secs / 60)
    if (mins < 60) return `Hace ${mins}m`
    const hrs = Math.floor(mins / 60)
    if (hrs < 24) return `Hace ${hrs}h`
    const days = Math.floor(hrs / 24)
    if (days < 7) return `Hace ${days}d`
    return new Date(d).toLocaleDateString('es-MX')
  }

  const recent = notifications.slice(0, 8)

  return (
    <header
      style={{
        position: 'relative',
        height: 64,
        background: '#FFFFFF',
        // V32: shadow premium más limpia (antes 3-layer cloud)
        boxShadow: '0 1px 0 rgba(15,23,42,0.06), 0 2px 8px rgba(15,23,42,0.04)',
        borderBottom: '1px solid rgba(15,23,42,0.05)',
        zIndex: 50,
        fontFamily: 'Montserrat, sans-serif',
        flexShrink: 0,
      }}
    >
      <div
        style={{
          position: 'relative',
          height: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '0 32px', /* V41 — alineado con grid (antes 28px, inconsistente) */
          zIndex: 10,
        }}
      >
        {/* LEFT — Logo LomaHUB27 — V41: "27" con glow azul sutil para más firma */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <h1 style={{ margin: 0, fontFamily: "'Montserrat', sans-serif", fontWeight: 800, fontStyle: 'italic', fontSize: 22, letterSpacing: '-0.5px', lineHeight: 1 }}>
            <span style={{ color: '#0F172A' }}>Loma</span>
            <span style={{ color: '#0F172A' }}>HUB</span>
            <span style={{ color: '#3B6CE7', textShadow: '0 0 10px rgba(59,108,231,0.32)' }}>27</span>
          </h1>
        </div>

        {/* CENTER — Fecha, Semana, Tipo Cambio — V32 spacing rhythm refinado */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 48, marginRight: 'auto', marginLeft: 48 }}>
          <div style={{ textAlign: 'center' }}>
            <p style={{ margin: 0, fontSize: 13, fontWeight: 600, color: '#1E293B', fontFamily: "'Montserrat', sans-serif", letterSpacing: '-0.01em' }}>
              {fechaStr.charAt(0).toUpperCase() + fechaStr.slice(1)}
            </p>
          </div>

          <div style={{ padding: '3px 0' }}>
            <span style={{ fontSize: 13, fontWeight: 700, color: '#3B6CE7', fontFamily: "'Montserrat', sans-serif", letterSpacing: '-0.01em' }}>
              Semana {weekNum}
            </span>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <span style={{ fontSize: 12, color: '#64748B', fontWeight: 500, fontFamily: "'Montserrat', sans-serif", letterSpacing: '0.02em' }}>USD/MXN</span>
            <span style={{ fontSize: 14, fontWeight: 700, color: '#1E293B', fontFamily: "'Montserrat', sans-serif", letterSpacing: '-0.01em' }}>
              {tipoCambio ? `${tipoCambio.toFixed(2)}` : '—'}
            </span>
          </div>
        </div>

        {/* RIGHT — User + Bell + Logout — V32 hierarchy refinada */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
          {/* User info — name stronger, role secondary */}
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', lineHeight: 1.25 }}>
            <span style={{ fontSize: 13, color: '#0F172A', fontWeight: 700, fontFamily: "'Montserrat', sans-serif", letterSpacing: '-0.01em' }}>
              {userName}
            </span>
            <span style={{ fontSize: 11, color: '#64748B', fontWeight: 500, fontFamily: "'Montserrat', sans-serif", letterSpacing: '0.02em', textTransform: 'lowercase' }}>
              {userRole}
            </span>
          </div>

          {/* Bell — V32 más crisp */}
          <div style={{ position: 'relative' }}>
            <button
              ref={bellButtonRef}
              onClick={() => setShowNotifPanel((p) => !p)}
              title="Notificaciones"
              style={{
                width: 34,
                height: 34,
                background: 'transparent',
                border: '1px solid #E2E8F0',
                borderRadius: '50%',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                position: 'relative',
                transition: 'all 0.18s ease',
                boxShadow: 'none',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = '#F8FAFC';
                e.currentTarget.style.borderColor = '#CBD5E1';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = 'transparent';
                e.currentTarget.style.borderColor = '#E2E8F0';
              }}
              onMouseDown={(e) => { e.currentTarget.style.background = '#F1F5F9'; }}
              onMouseUp={(e) => { e.currentTarget.style.background = '#F8FAFC'; }}
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#475569" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
                <path d="M13.73 21a2 2 0 0 1-3.46 0" />
              </svg>
              {unreadCount > 0 && (
                <span
                  style={{
                    position: 'absolute',
                    top: 2,
                    right: 2,
                    width: 14,
                    height: 14,
                    borderRadius: '50%',
                    background: '#DC2626',
                    color: '#FFFFFF',
                    fontSize: 9,
                    fontWeight: 700,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    lineHeight: 1,
                    fontFamily: "'Montserrat', sans-serif",
                    border: '1.5px solid #FFFFFF',
                  }}
                >
                  {unreadCount > 9 ? '9+' : unreadCount}
                </span>
              )}
            </button>

            {showNotifPanel && (
              <div
                ref={notifPanelRef}
                style={{
                  position: 'absolute',
                  top: 44,
                  right: 0,
                  width: 340,
                  maxHeight: 420,
                  background: '#FFFFFF',
                  borderRadius: 12,
                  boxShadow: '0 12px 40px rgba(0,0,0,0.12), 0 4px 12px rgba(0,0,0,0.06)',
                  border: '1px solid #E2E8F0',
                  overflow: 'hidden',
                  zIndex: 100,
                  fontFamily: "'Montserrat', sans-serif",
                }}
              >
                <div
                  style={{
                    padding: '12px 16px',
                    borderBottom: '1px solid #E2E8F0',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                  }}
                >
                  <span style={{ fontSize: 14, fontWeight: 700, color: '#1E293B' }}>Notificaciones</span>
                  {unreadCount > 0 && (
                    <span
                      style={{
                        fontSize: 11,
                        fontWeight: 600,
                        color: '#3B6CE7',
                        background: '#EFF6FF',
                        padding: '2px 8px',
                        borderRadius: 10,
                      }}
                    >
                      {unreadCount} nueva{unreadCount > 1 ? 's' : ''}
                    </span>
                  )}
                </div>

                <div style={{ maxHeight: 360, overflowY: 'auto' }}>
                  {loading && (
                    <div style={{ padding: 20, textAlign: 'center', color: '#94A3B8', fontSize: 13 }}>Cargando...</div>
                  )}
                  {!loading && recent.length === 0 && (
                    <div style={{ padding: 20, textAlign: 'center', color: '#94A3B8', fontSize: 13 }}>Sin notificaciones</div>
                  )}
                  {!loading && recent.map((n) => (
                    <div
                      key={n.id}
                      onClick={() => handleNotifClick(n)}
                      style={{
                        padding: '10px 16px',
                        cursor: n.url_destino ? 'pointer' : 'default',
                        borderBottom: '1px solid #F1F5F9',
                        background: n.leida ? 'transparent' : '#F8FAFC',
                        transition: 'background 0.15s ease',
                      }}
                      onMouseEnter={(e) => { e.currentTarget.style.background = '#F1F5F9'; }}
                      onMouseLeave={(e) => { e.currentTarget.style.background = n.leida ? 'transparent' : '#F8FAFC'; }}
                    >
                      <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10 }}>
                        <div
                          style={{
                            width: 8,
                            height: 8,
                            borderRadius: '50%',
                            background: n.leida ? 'transparent' : typeColor(n.tipo),
                            marginTop: 5,
                            flexShrink: 0,
                          }}
                        />
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <p style={{ margin: 0, fontSize: 13, fontWeight: 600, color: '#1E293B', lineHeight: 1.3 }}>{n.titulo}</p>
                          <p
                            style={{
                              margin: '2px 0 0',
                              fontSize: 12,
                              color: '#64748B',
                              lineHeight: 1.4,
                              overflow: 'hidden',
                              textOverflow: 'ellipsis',
                              whiteSpace: 'nowrap',
                            }}
                          >
                            {n.mensaje}
                          </p>
                          <p style={{ margin: '3px 0 0', fontSize: 11, color: '#94A3B8' }}>{timeAgo(n.created_at)}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Logout — V32 más controlado */}
          <button
            onClick={onLogout}
            title="Cerrar sesión"
            style={{
              width: 34,
              height: 34,
              background: 'transparent',
              border: '1px solid #E2E8F0',
              borderRadius: '50%',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              transition: 'all 0.18s ease',
              boxShadow: 'none',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = '#FEF2F2';
              e.currentTarget.style.borderColor = '#FCA5A5';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = 'transparent';
              e.currentTarget.style.borderColor = '#E2E8F0';
            }}
            onMouseDown={(e) => { e.currentTarget.style.background = '#FEE2E2'; }}
            onMouseUp={(e) => { e.currentTarget.style.background = '#FEF2F2'; }}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#DC2626" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
              <path d="M18.36 6.64a9 9 0 1 1-12.73 0" />
              <line x1="12" y1="2" x2="12" y2="12" />
            </svg>
          </button>
        </div>
      </div>
    </header>
  )
}
