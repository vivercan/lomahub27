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
        background: '#FFFFFF',
        borderBottom: '1px solid rgba(0,0,0,0.10)',
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
            <span style={{ color: '#2563EB' }}>Loma</span>
            <span style={{ color: '#2563EB' }}>HUB</span>
            <span style={{ color: '#E87A1A' }}>27</span>
          </h1>
          <span style={{ fontSize: 9, fontWeight: 600, color: 'rgba(0,0,0,0.45)', textTransform: 'uppercase' as const, letterSpacing: 0.8, marginLeft: 4 }}>
            {userRole}
          </span>
        </div>

        {/* CENTER — Fecha, Semana, Tipo Cambio */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 20 }}>
          {/* Fecha */}
          <div style={{ textAlign: 'center' }}>
            <p style={{ margin: 0, fontSize: 12, fontWeight: 600, color: '#1E293B', textTransform: 'capitalize' as const }}>
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
            <span style={{ fontSize: 11, color: 'rgba(0,0,0,0.55)' }}>USD/MXN</span>
            <span
              style={{
                fontSize: 13,
                fontWeight: 700,
                color: '#B8860B',
              }}
            >
              {tipoCambio ? `$${tipoCambio.toFixed(2)}` : '—'}
            </span>
          </div>
        </div>

        {/* RIGHT — User + Bell + Logout */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          {/* User name */}
          <span style={{ fontSize: 12, color: 'rgba(0,0,0,0.6)', fontWeight: 500 }}>
            {userName}
          </span>

          {/* Logout — Red Power Button */}
          <button
            onClick={onLogout}
            title="Cerrar sesión"
            style={{
              width: 36,
              height: 36,
              borderRadius: '50%',
              background: '#DC2626',
              border: 'none',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              transition: 'all 0.2s ease',
              boxShadow: '0 2px 8px rgba(220,38,38,0.35)',
            }}
            onMouseEnter={(e) => { e.currentTarget.style.background = '#B91C1C'; e.currentTarget.style.transform = 'scale(1.08)'; }}
            onMouseLeave={(e) => { e.currentTarget.style.background = '#DC2626'; e.currentTarget.style.transform = 'scale(1)'; }}
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M18.36 6.64a9 9 0 1 1-12.73 0" />
              <line x1="12" y1="2" x2="12" y2="12" />
            </svg>
          </button>

        </div>
      </div>
    </header>
  )
}
