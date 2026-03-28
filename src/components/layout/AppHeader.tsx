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
    weekday: 'short',
    day: 'numeric',
    month: 'short',
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
      try {
        const { data, error } = await supabase
          .from('configuracion')
          .select('valor')
          .eq('clave', 'tipo_cambio_usd_mxn')
          .maybeSingle()
        if (!error && data?.valor) {
          setTipoCambio(parseFloat(data.valor))
        } else {
          // Fallback: try Banxico-like static value
          setTipoCambio(null)
        }
      } catch {
        setTipoCambio(null)
      }
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
      case 'alerta': return '#F59E0B'
      case 'exito': return '#10B981'
      case 'info': return '#3B82F6'
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
        height: 56,
        background: 'linear-gradient(180deg, #1a1a24 0%, #14141c 100%)',
        borderBottom: '1px solid rgba(255,255,255,0.08)',
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
        {/* LEFT — Logo + Brand */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div
            style={{
              width: 34,
              height: 34,
              borderRadius: 8,
              background: 'linear-gradient(135deg, #E8611A, #C44A0E)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 2px 8px rgba(232,97,26,0.3)',
            }}
          >
            <span style={{ color: '#fff', fontWeight: 700, fontSize: 12 }}>LH</span>
          </div>
          <div>
            <h1 style={{ margin: 0, fontSize: 14, fontWeight: 700, color: '#F9FAFB' }}>
              LomaHUB27
            </h1>
            <p style={{ margin: 0, fontSize: 10, color: 'rgba(255,255,255,0.45)', textTransform: 'uppercase' as const, letterSpacing: 0.5 }}>
              {userRole}
            </p>
          </div>
        </div>

        {/* CENTER — Fecha, Semana, Tipo Cambio */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 20 }}>
          {/* Fecha */}
          <div style={{ textAlign: 'center' }}>
            <p style={{ margin: 0, fontSize: 12, fontWeight: 600, color: '#F9FAFB', textTransform: 'capitalize' as const }}>
              {fechaStr}
            </p>
          </div>

          {/* Semana */}
          <div
            style={{
              background: 'rgba(59,108,231,0.15)',
              border: '1px solid rgba(59,108,231,0.3)',
              borderRadius: 6,
              padding: '3px 10px',
            }}
          >
            <span style={{ fontSize: 12, fontWeight: 700, color: '#3B82F6' }}>
              W{weekNum}
            </span>
          </div>

          {/* USD / MXN */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.5)' }}>USD/MXN</span>
            <span
              style={{
                fontSize: 13,
                fontWeight: 700,
                color: '#10B981',
              }}
            >
              {tipoCambio ? `$${tipoCambio.toFixed(2)}` : '—'}
            </span>
          </div>
        </div>

        {/* RIGHT — User + Bell + Logout */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          {/* User name */}
          <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.6)', fontWeight: 500 }}>
            {userName}
          </span>

          {/* Notification Bell */}
          <div style={{ position: 'relative' }}>
            <button
              ref={bellButtonRef}
              onClick={() => setShowNotifPanel(!showNotifPanel)}
              style={{
                position: 'relative',
                width: 34,
                height: 34,
                borderRadius: 8,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                background: unreadCount > 0
                  ? 'linear-gradient(135deg, #3B6CE7, #2A4DB8)'
                  : 'rgba(255,255,255,0.08)',
                border: '1px solid rgba(255,255,255,0.1)',
                cursor: 'pointer',
                color: '#fff',
                transition: 'all 0.15s ease',
              }}
            >
              {/* Bell SVG */}
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
                <path d="M13.73 21a2 2 0 0 1-3.46 0" />
              </svg>
              {unreadCount > 0 && (
                <span
                  style={{
                    position: 'absolute',
                    top: -4,
                    right: -4,
                    background: '#EF4444',
                    color: '#fff',
                    fontSize: 9,
                    fontWeight: 700,
                    borderRadius: '50%',
                    width: 16,
                    height: 16,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    border: '2px solid #1a1a24',
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
                  top: 42,
                  right: 0,
                  width: 360,
                  maxHeight: 420,
                  background: '#1E1E2A',
                  border: '1px solid rgba(255,255,255,0.1)',
                  borderRadius: 12,
                  boxShadow: '0 8px 32px rgba(0,0,0,0.4)',
                  overflow: 'hidden',
                  zIndex: 50,
                  fontFamily: 'Montserrat, sans-serif',
                }}
              >
                {/* Panel Header */}
                <div
                  style={{
                    padding: '12px 16px',
                    borderBottom: '1px solid rgba(255,255,255,0.08)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                  }}
                >
                  <span style={{ fontSize: 13, fontWeight: 700, color: '#F9FAFB' }}>
                    Notificaciones
                  </span>
                  {unreadCount > 0 && (
                    <span
                      style={{
                        fontSize: 10,
                        fontWeight: 600,
                        color: '#3B82F6',
                        background: 'rgba(59,130,246,0.15)',
                        padding: '2px 8px',
                        borderRadius: 10,
                      }}
                    >
                      {unreadCount} nuevas
                    </span>
                  )}
                </div>

                {/* Panel Body */}
                <div style={{ overflowY: 'auto', maxHeight: 360 }}>
                  {loading ? (
                    <div style={{ padding: 24, textAlign: 'center', color: 'rgba(255,255,255,0.4)', fontSize: 12 }}>
                      Cargando...
                    </div>
                  ) : recent.length === 0 ? (
                    <div style={{ padding: 32, textAlign: 'center' }}>
                      <p style={{ margin: 0, color: 'rgba(255,255,255,0.3)', fontSize: 12 }}>
                        Sin notificaciones
                      </p>
                    </div>
                  ) : (
                    recent.map((n) => (
                      <button
                        key={n.id}
                        onClick={() => handleNotifClick(n)}
                        style={{
                          width: '100%',
                          display: 'flex',
                          alignItems: 'flex-start',
                          gap: 10,
                          padding: '10px 16px',
                          background: n.leida ? 'transparent' : 'rgba(59,130,246,0.06)',
                          border: 'none',
                          borderBottom: '1px solid rgba(255,255,255,0.04)',
                          cursor: 'pointer',
                          textAlign: 'left' as const,
                          transition: 'background 0.1s ease',
                        }}
                      >
                        {/* Type indicator dot */}
                        <div
                          style={{
                            width: 8,
                            height: 8,
                            borderRadius: '50%',
                            background: typeColor(n.tipo),
                            marginTop: 5,
                            flexShrink: 0,
                          }}
                        />
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <p
                            style={{
                              margin: 0,
                              fontSize: 12,
                              fontWeight: n.leida ? 400 : 600,
                              color: n.leida ? 'rgba(255,255,255,0.6)' : '#F9FAFB',
                              whiteSpace: 'nowrap',
                              overflow: 'hidden',
                              textOverflow: 'ellipsis',
                            }}
                          >
                            {n.titulo}
                          </p>
                          <p
                            style={{
                              margin: '2px 0 0',
                              fontSize: 11,
                              color: 'rgba(255,255,255,0.4)',
                              whiteSpace: 'nowrap',
                              overflow: 'hidden',
                              textOverflow: 'ellipsis',
                            }}
                          >
                            {n.mensaje}
                          </p>
                          <p style={{ margin: '3px 0 0', fontSize: 10, color: 'rgba(255,255,255,0.25)' }}>
                            {timeAgo(n.created_at)}
                          </p>
                        </div>
                        {!n.leida && (
                          <div
                            style={{
                              width: 6,
                              height: 6,
                              borderRadius: '50%',
                              background: '#3B82F6',
                              marginTop: 6,
                              flexShrink: 0,
                            }}
                          />
                        )}
                      </button>
                    ))
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Logout */}
          <button
            onClick={onLogout}
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: 34,
              height: 34,
              borderRadius: 8,
              background: 'rgba(255,255,255,0.06)',
              border: '1px solid rgba(255,255,255,0.08)',
              cursor: 'pointer',
              color: 'rgba(255,255,255,0.5)',
              transition: 'all 0.15s ease',
            }}
            title="Cerrar sesion"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
              <polyline points="16 17 21 12 16 7" />
              <line x1="21" y1="12" x2="9" y2="12" />
            </svg>
          </button>
        </div>
      </div>
    </header>
  )
}
