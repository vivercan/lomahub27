'use client'

import React, { useState, useEffect, useRef } from 'react'
import { supabase } from '../lib/supabase'

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

interface GroupedNotifications {
  [key: string]: Notificacion[]
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
  const notifPanelRef = useRef<HTMLDivElement>(null)
  const bellButtonRef = useRef<HTMLButtonElement>(null)

  // Fetch notifications
  const fetchNotifications = async () => {
    if (!userEmail) return

    try {
      setLoading(true)
      const { data, error } = await supabase
        .from('notificaciones')
        .select('*')
        .eq('usuario_email', userEmail)
        .is('deleted_at', null)
        .order('created_at', { ascending: false })
        .limit(100)

      if (error) {
        console.error('Error fetching notifications:', error)
        return
      }

      const notificaciones: Notificacion[] = data?.map((n: any) => ({
        id: n.id,
        tipo: n.tipo,
        titulo: n.titulo,
        mensaje: n.mensaje,
        leida: n.leida,
        created_at: n.created_at,
        url_destino: n.url_destino,
      })) || []

      setNotifications(notificaciones)
      const unread = notificaciones.filter((n) => !n.leida).length
      setUnreadCount(unread)
    } catch (err) {
      console.error('Error in fetchNotifications:', err)
    } finally {
      setLoading(false)
    }
  }

  // Initial fetch and subscribe to real-time changes
  useEffect(() => {
    fetchNotifications()

    if (!userEmail) return

    // Set up real-time listener
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
        () => {
          fetchNotifications()
        }
      )
      .subscribe()

    return () => {
      subscription.unsubscribe()
    }
  }, [userEmail])

  // Close panel when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        notifPanelRef.current &&
        !notifPanelRef.current.contains(event.target as Node) &&
        bellButtonRef.current &&
        !bellButtonRef.current.contains(event.target as Node)
      ) {
        setShowNotifPanel(false)
      }
    }

    if (showNotifPanel) {
      document.addEventListener('mousedown', handleClickOutside)
      return () => {
        document.removeEventListener('mousedown', handleClickOutside)
      }
    }
  }, [showNotifPanel])

  // Mark notification as read
  const markAsRead = async (notificationId: string) => {
    try {
      const { error } = await supabase
        .from('notificaciones')
        .update({ leida: true })
        .eq('id', notificationId)

      if (error) {
        console.error('Error marking notification as read:', error)
        return
      }

      // Update local state
      setNotifications((prev) =>
        prev.map((n) => (n.id === notificationId ? { ...n, leida: true } : n))
      )
      setUnreadCount((prev) => Math.max(0, prev - 1))
    } catch (err) {
      console.error('Error in markAsRead:', err)
    }
  }

  const handleNotificationClick = (notification: Notificacion) => {
    if (!notification.leida) {
      markAsRead(notification.id)
    }
    if (notification.url_destino) {
      window.location.href = notification.url_destino
    }
  }

  const getNotificationIcon = (tipo: string) => {
    switch (tipo) {
      case 'alerta':
        return (
          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
            <path
              fillRule="evenodd"
              d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z"
              clipRule="evenodd"
            />
          </svg>
        )
      case 'exito':
        return (
          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
            <path
              fillRule="evenodd"
              d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
              clipRule="evenodd"
            />
          </svg>
        )
      case 'info':
        return (
          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
            <path
              fillRule="evenodd"
              d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z"
              clipRule="evenodd"
            />
          </svg>
        )
      case 'pendiente':
        return (
          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
            <path d="M2 11a1 1 0 011-1h2a1 1 0 011 1v5a1 1 0 01-1 1H3a1 1 0 01-1-1v-5zM8 7a1 1 0 011-1h2a1 1 0 011 1v9a1 1 0 01-1 1H9a1 1 0 01-1-1V7zM14 4a1 1 0 011-1h2a1 1 0 011 1v12a1 1 0 01-1 1h-2a1 1 0 01-1-1V4z" />
          </svg>
        )
      default:
        return null
    }
  }

  const getNotificationColor = (tipo: string) => {
    switch (tipo) {
      case 'alerta':
        return 'text-yellow-400'
      case 'exito':
        return 'text-green-400'
      case 'info':
        return 'text-blue-400'
      case 'pendiente':
        return 'text-purple-400'
      default:
        return 'text-gray-400'
    }
  }

  const formatRelativeTime = (dateString: string) => {
    const date = new Date(dateString)
    const now = new Date()
    const seconds = Math.floor((now.getTime() - date.getTime()) / 1000)

    if (seconds < 60) return 'Hace un momento'
    const minutes = Math.floor(seconds / 60)
    if (minutes < 60) return `Hace ${minutes}m`
    const hours = Math.floor(minutes / 60)
    if (hours < 24) return `Hace ${hours}h`
    const days = Math.floor(hours / 24)
    if (days < 7) return `Hace ${days}d`
    return date.toLocaleDateString('es-ES')
  }

  const recentNotifications = notifications.slice(0, 5)

  return (
    <header className="relative h-20 bg-gradient-to-b from-[#1a1a1f] to-[#111116] border-b border-[rgba(255,255,255,0.08)]">
      {/* Cristal effect background */}
      <div className="absolute inset-0 backdrop-blur-sm opacity-40" />

      <div className="relative h-full flex items-center justify-between px-6 z-10">
        {/* Left section - Logo/Brand */}
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-[#E8611A] to-[#C44A0E] flex items-center justify-center shadow-lg">
            <span className="text-white font-semibold text-sm" style={{ fontFamily: 'Montserrat' }}>
              LH
            </span>
          </div>
          <div className="flex flex-col gap-0.5">
            <h1 className="text-sm font-semibold text-white" style={{ fontFamily: 'Montserrat' }}>
              LomaHUB27
            </h1>
            <p className="text-xs text-[rgba(255,255,255,0.6)]" style={{ fontFamily: 'Montserrat' }}>
              {userRole}
            </p>
          </div>
        </div>

        {/* Center section - Navigation or Title */}
        <div className="flex-1 text-center">
          <p className="text-xs text-[rgba(255,255,255,0.5)]" style={{ fontFamily: 'Montserrat' }}>
            {userName}
          </p>
        </div>

        {/* Right section - Actions */}
        <div className="flex items-center gap-3">
          {/* Notification Bell Button */}
          <div className="relative">
            <button
              ref={bellButtonRef}
              onClick={() => setShowNotifPanel(!showNotifPanel)}
              className={`relative w-10 h-10 rounded-full flex items-center justify-center transition-all duration-300 ${
                unreadCount > 0
                  ? 'bg-gradient-to-br from-[#3B6CE7] to-[#2A4DB8] shadow-lg animate-pulse-subtle'
                  : 'bg-[rgba(255,255,255,0.08)] hover:bg-[rgba(255,255,255,0.12)]'
              } border border-[rgba(255,255,255,0.12)] hover:border-[rgba(255,255,255,0.2)]`}
              title="Notificaciones"
              aria-label="Notificaciones"
            >
              <svg
                className={`w-5 h-5 ${unreadCount > 0 ? 'text-white' : 'text-[rgba(255,255,255,0.7)]'}`}
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"
                />
              </svg>

              {/* Unread badge */}
              {unreadCount > 0 && (
                <div className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 rounded-full flex items-center justify-center border border-[#111116]">
                  <span
                    className="text-white text-xs font-bold"
                    style={{ fontFamily: 'Montserrat' }}
                  >
                    {unreadCount > 9 ? '9+' : unreadCount}
                  </span>
                </div>
              )}
            </button>

            {/* Notification Panel */}
            {showNotifPanel && (
              <div
                ref={notifPanelRef}
                className="absolute right-0 mt-3 w-80 bg-gradient-to-b from-[#1a1a1f] to-[#0f0f13] rounded-lg border border-[rgba(255,255,255,0.12)] shadow-2xl z-50 overflow-hidden backdrop-blur-md"
              >
                {/* Panel Header */}
                <div className="px-4 py-3 border-b border-[rgba(255,255,255,0.08)]">
                  <h2
                    className="text-sm font-semibold text-white"
                    style={{ fontFamily: 'Montserrat' }}
                  >
                    Notificaciones
                  </h2>
                  <p className="text-xs text-[rgba(255,255,255,0.5)] mt-1" style={{ fontFamily: 'Montserrat' }}>
                    {unreadCount > 0 ? `${unreadCount} sin leer` : 'Al día'}
                  </p>
                </div>

                {/* Notifications List */}
                <div className="max-h-96 overflow-y-hidden">
                  {recentNotifications.length > 0 ? (
                    <div className="divide-y divide-[rgba(255,255,255,0.08)]">
                      {recentNotifications.map((notification) => (
                        <button
                          key={notification.id}
                          onClick={() => handleNotificationClick(notification)}
                          className={`w-full px-4 py-3 text-left transition-colors duration-200 ${
                            !notification.leida
                              ? 'bg-[rgba(59,108,231,0.1)] hover:bg-[rgba(59,108,231,0.15)]'
                              : 'bg-transparent hover:bg-[rgba(255,255,255,0.05)]'
                          }`}
                        >
                          <div className="flex gap-3">
                            <div
                              className={`flex-shrink-0 mt-0.5 ${getNotificationColor(notification.tipo)}`}
                            >
                              {getNotificationIcon(notification.tipo)}
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-start justify-between gap-2">
                                <h3
                                  className="text-sm font-semibold text-white leading-snug"
                                  style={{ fontFamily: 'Montserrat' }}
                                >
                                  {notification.titulo}
                                </h3>
                                {!notification.leida && (
                                  <div className="w-2 h-2 rounded-full bg-[#3B6CE7] flex-shrink-0 mt-1.5" />
                                )}
                              </div>
                              <p
                                className="text-xs text-[rgba(255,255,255,0.6)] mt-1 line-clamp-2"
                                style={{ fontFamily: 'Montserrat' }}
                              >
                                {notification.mensaje}
                              </p>
                              <p
                                className="text-xs text-[rgba(255,255,255,0.4)] mt-1.5"
                                style={{ fontFamily: 'Montserrat' }}
                              >
                                {formatRelativeTime(notification.created_at)}
                              </p>
                            </div>
                          </div>
                        </button>
                      ))}
                    </div>
                  ) : (
                    <div className="px-4 py-8 text-center">
                      <svg
                        className="w-10 h-10 mx-auto text-[rgba(255,255,255,0.3)] mb-2"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={1.5}
                          d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"
                        />
                      </svg>
                      <p
                        className="text-sm text-[rgba(255,255,255,0.5)]"
                        style={{ fontFamily: 'Montserrat' }}
                      >
                        Sin notificaciones
                      </p>
                    </div>
                  )}
                </div>

                {/* Panel Footer */}
                {recentNotifications.length > 0 && (
                  <div className="px-4 py-3 border-t border-[rgba(255,255,255,0.08)]">
                    <button
                      onClick={() => setShowNotifPanel(false)}
                      className="w-full text-center text-xs font-semibold text-[#3B6CE7] hover:text-[#5B8CF7] transition-colors py-2 rounded hover:bg-[rgba(59,108,231,0.1)]"
                      style={{ fontFamily: 'Montserrat' }}
                    >
                      Ver todas las notificaciones
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Power Button - Existing */}
          <button
            onClick={onLogout}
            className="w-10 h-10 rounded-full bg-gradient-to-br from-[#E8611A] to-[#C44A0E] flex items-center justify-center hover:shadow-lg transition-all duration-200 border border-[rgba(232,97,26,0.5)] hover:border-[rgba(232,97,26,0.8)]"
            title="Logout"
            aria-label="Logout"
          >
            <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"
              />
            </svg>
          </button>
        </div>
      </div>

on>
        </div>
      </div>

      {/* Subtle top accent line */}
      <div className="absolute top-0 inset-x-0 h-px bg-gradient-to-r from-transparent via-[#E8611A] to-transparent opacity-30" />

      <style jsx>{`
        @keyframes pulse-subtle {
          0%,
          100% {
            box-shadow: 0 0 0 0 rgba(59, 108, 231, 0.4);
          }
          50% {
            box-shadow: 0 0 0 6px rgba(59, 108, 231, 0);
          }
        }
        .animate-pulse-subtle {
          animation: pulse-subtle 2s infinite;
        }
      `}</style>
    </header>
  )
}
