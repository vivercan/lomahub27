'use client'

import React, { useState, useEffect, useRef, useCallback } from 'react'
import { supabase } from '../../lib/supabase'

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
  const [tipoCambio, setTipoCambio] = useState<number | null>(null)
  const notifPanelRef = useRef<HTMLDivElement>(null)
  const bellButtonRef = useRef<HTMLButtonElement>(null)

  // --- Date / Week helpers ---
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

  // --- Fetch USD/MXN exchange rate ---
  useEffect(() => {
    const fetchRate = async () => {
      // 1. Try Supabase configuracion table
      try {
        const { data, error } = await supabase
          .from('configuracion')
          .select('valor')
          .eq('clave', 'tipo_cambio_usd_mxn')
          .maybeSingle()
        if (!error && data?.valor) {
          setTipoCambio(parseFloat(data.valor))
          return
        }
      } catch { /* fallthrough */ }
      // 2. Fallback: free exchangerate API
      try {
        const res = await fetch('https://open.er-api.com/v6/latest/USD')
        const json = await res.json()
        if (json?.rates?.MXN) {
          setTipoCambio(json.rates.MXN)
          return
        }
      } catch { /* fallthrough */ }
      setTipoCambio(null)
    }
    fetchRate()
  }, [])

  // --- Fetch notifications ---
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

  // Close panel on outside click
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

  // Mark as read
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

  // -------- RENDER --------
  return (
    <header
      style={{
        position: 'relative',
        height: 64,
        background: '#FFFFFF',
        boxShadow: '0 8px 32px rgba(0,0,0,0.12), 0 4px 12px rgba(0,0,0,0.08), 0 1px 3px rgba(0,0,0,0.06)',
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
          padding: '0 20px',
          zIndex: 10,
        }}
      >
        {/* LEFT — Logo Institucional LomaHUB27 */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <h1 style={{ margin: 0, fontFamily: "'Montserrat', sans-serif", fontWeight: 800, fontStyle: 'italic', fontSize: 22, letterSpacing: '-0.5px', lineHeight: 1 }}>
            <span style={{ color: '#0F172A' }}>Loma</span>
            <span style={{ color: '#0F172A' }}>HUB</span>
            <span style={{ color: '#3B6CE7' }}>27</span>
          </h1>
        </div>

        {/* CENTER — Fecha, Semana, Tipo Cambio */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 56, marginRight: 'auto', marginLeft: 40 }}>
          {/* Fecha */}
          <div style={{ textAlign: 'center' }}>
            <p style={{ margin: 0, fontSize: 14, fontWeight: 600, color: '#1E293B', fontFamily: "'Montserrat', sans-serif" }}>
              {fechaStr.charAt(0).toUpperCase() + fechaStr.slice(1)}
            </p>
          </div>

          {/* Semana */}
          <div
            style={{
              background: 'transparent',
              border: 'none',
              borderRadius: 0,
              padding: '3px 0',
            }}
          >
            <span style={{ fontSize: 14, fontWeight: 700, color: '#3B6CE7', fontFamily: "'Montserrat', sans-serif" }}>
              Semana {weekNum}
            </span>
          </div>

          {/* USD / MXN */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <span style={{ fontSize: 13, color: '#1E293B', fontFamily: "'Montserrat', sans-serif" }}>USD/MXN</span>
            <span
              style={{
                fontSize: 15,
                fontWeight: 700,
                color: '#1E293B',
                fontFamily: "'Montserrat', sans-serif",
              }}
            >
              {tipoCambio ? `${tipoCambio.toFixed(2)}` : '—'}
            </span>
          </div>
        </div>

        {/* RIGHT — User + Bell + Logout */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          {/* User info — name + role stacked */}
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', lineHeight: 1.3 }}>
            <span style={{ fontSize: 13, color: '#1E293B', fontWeight: 600, fontFamily: "'Montserrat', sans-serif" }}>
              {userName}
            </span>
            <span style={{ fontSize: 13, color: '#1E293B', fontWeight: 400, fontFamily: "'Montserrat', sans-serif" }}>
              {userRole}
            </span>
          </div>

          {/* Bell — Flat minimal circle */}
          <div style={{ position: 'relative' }}>
            <button
              ref={bellButtonRef}
              onClick={() => setShowNotifPanel((p) => !p)}
              title="Notificaciones"
              style={{
                width: 36,
                height: 36,
                background: 'transparent',
                border: '1.5px solid #CBD5E1',
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
                e.currentTarget.style.background = '#F1F5F9';
                e.currentTarget.style.borderColor = '#94A3B8';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = 'transparent';
                e.currentTarget.style.borderColor = '#CBD5E1';
              }}
              onMouseDown={(e) => {
                e.currentTarget.style.background = '#E2E8F0';
              }}
              onMouseUp={(e) => {
                e.currentTarget.style.background = '#F1F5F9';
              }}
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#64748B" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
                <path d="M13.73 21a2 2 0 0 1-3.46 0" />
              </svg>
              {unreadCount > 0 && (
                <span
                  style={{
                    position: 'absolute',
                    top: 4,
                    right: 4,
                    width: 16,
                    height: 16,
                    borderRadius: '50%',
                    background: '#DC2626',
                    color: '#FFFFFF',
                    fontSize: 10,
                    fontWeight: 700,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    lineHeight: 1,
                    fontFamily: "'Montserrat', sans-serif",
                  }}
                >
                  {unreadCount > 9 ? '9+' : unreadCount}
                </span>
              )}
            </button>

            {/* Notification Panel */}
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
                  boxShadow: '0 12px 40px rgba(0,0,0,0.15), 0 4px 12px rgba(0,0,0,0.08)',
                  border: '1px solid #E2E8F0',
                  overflow: 'hidden',
                  zIndex: 100,
                  fontFamily: "'Montserrat', sans-serif",
                }}
              >
                {/* Panel header */}
                <div
                  style={{
                    padding: '12px 16px',
                    borderBottom: '1px solid #E2E8F0',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                  }}
                >
                  <span style={{ fontSize: 14, fontWeight: 700, color: '#1E293B' }}>
                    Notificaciones
                  </span>
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

                {/* Panel body */}
                <div style={{ maxHeight: 360, overflowY: 'auto' }}>
                  {loading && (
                    <div style={{ padding: 20, textAlign: 'center', color: '#94A3B8', fontSize: 13 }}>
                      Cargando...
                    </div>
                  )}
                  {!loading && recent.length === 0 && (
                    <div style={{ padding: 20, textAlign: 'center', color: '#94A3B8', fontSize: 13 }}>
                      Sin notificaciones
                    </div>
                  )}
                  {!loading &&
                    recent.map((n) => (
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
                            <p style={{ margin: 0, fontSize: 13, fontWeight: 600, color: '#1E293B', lineHeight: 1.3 }}>
                              {n.titulo}
                            </p>
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
                            <p style={{ margin: '3px 0 0', fontSize: 11, color: '#94A3B8' }}>
                              {timeAgo(n.created_at)}
                            </p>
                          </div>
                        </div>
                      </div>
                    ))}
                </div>
              </div>
            )}
          </div>

          {/* Logout — Flat minimal circle */}
          <button
            onClick={onLogout}
            title="Cerrar sesión"
            style={{
              width: 36,
              height: 36,
              background: 'transparent',
              border: '1.5px solid #CBD5E1',
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
              e.currentTarget.style.borderColor = '#CBD5E1';
            }}
            onMouseDown={(e) => {
              e.currentTarget.style.background = '#FEE2E2';
            }}
            onMouseUp={(e) => {
              e.currentTarget.style.background = '#FEF2F2';
            }}
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#DC2626" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M18.36 6.64a9 9 0 1 1-12.73 0" />
              <line x1="12" y1="2" x2="12" y2="12" />
            </svg>
          </button>

        </div>
      </div>
    </header>
  )
}
