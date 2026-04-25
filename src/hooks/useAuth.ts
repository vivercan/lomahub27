import { useState, useEffect, useCallback, useRef } from 'react'
import type { Session, User } from '@supabase/supabase-js'
import { supabase } from '../lib/supabase'
import type { Rol, AuthUser } from '../types/auth'
import { RUTAS_INICIALES, PERMISOS_CUSTOM_ROUTES } from '../types/auth'

/**
 * useAuth — V2.0 (25/Abr/2026)
 * Gate: si auth.users.app_metadata.rol está vacío → no se considera autenticado.
 * El SQL trigger handle_new_auth_user() bloquea cualquier email no autorizado
 * y rellena rol/empresa/permisos_custom desde usuarios_autorizados activos.
 * Defensa en profundidad: aquí, si llega session pero sin rol, signOut + /unauthorized.
 */
export function useAuth() {
  const [session, setSession] = useState<Session | null>(null)
  const [user, setUser] = useState<AuthUser | null>(null)
  const [loading, setLoading] = useState(true)
  const enforced = useRef(false)

  const parseUser = useCallback((supabaseUser: User | null): AuthUser | null => {
    if (!supabaseUser) return null
    const meta = supabaseUser.app_metadata || {}
    const rolRaw = meta.rol as string | undefined
    if (!rolRaw) return null  // sin rol → no autorizado, NO fallback a 'ventas'
    // Acepta tanto permisos_custom (snake, desde trigger) como permisosCustom (legacy camel)
    const permisos = Array.isArray(meta.permisos_custom)
      ? meta.permisos_custom
      : Array.isArray(meta.permisosCustom)
        ? meta.permisosCustom
        : undefined
    return {
      id: supabaseUser.id,
      email: supabaseUser.email || '',
      rol: rolRaw as Rol,
      empresa: (meta.empresa as string) || '',
      permisosCustom: permisos,
    }
  }, [])

  const enforceGate = useCallback(async (sess: Session | null) => {
    if (enforced.current) return
    if (sess && sess.user && !sess.user.app_metadata?.rol) {
      enforced.current = true
      // Sesión existe pero el usuario NO está autorizado (sin rol en app_metadata)
      try {
        if (window.google?.accounts?.id) {
          window.google.accounts.id.disableAutoSelect()
          window.google.accounts.id.cancel()
        }
      } catch (_) { /* ignore */ }
      await supabase.auth.signOut()
      if (typeof window !== 'undefined' && !window.location.pathname.startsWith('/unauthorized')) {
        window.location.href = '/unauthorized'
      }
    }
  }, [])

  useEffect(() => {
    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session)
      const parsed = parseUser(session?.user ?? null)
      setUser(parsed)
      setLoading(false)
      if (session && !parsed) {
        enforceGate(session)
      }
    })

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        setSession(session)
        const parsed = parseUser(session?.user ?? null)
        setUser(parsed)
        setLoading(false)
        if (session && !parsed) {
          enforceGate(session)
        }
      }
    )

    return () => subscription.unsubscribe()
  }, [parseUser, enforceGate])

  const login = async (email: string, password: string) => {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    })
    if (error) throw error
    return data
  }

  const loginWithGoogleIdToken = async (idToken: string) => {
    const { data, error } = await supabase.auth.signInWithIdToken({
      provider: 'google',
      token: idToken,
    })
    if (error) throw error
    return data
  }

  const logout = async () => {
    if (window.google?.accounts?.id) {
      try {
        window.google.accounts.id.disableAutoSelect()
        window.google.accounts.id.cancel()
      } catch (_) { /* ignore GSI errors */ }
    }
    const gsiScript = document.getElementById('gsi-script')
    if (gsiScript) gsiScript.remove()
    const { error } = await supabase.auth.signOut()
    if (error) throw error
    window.location.href = '/login'
  }

  const getRutaInicial = (): string => {
    if (!user) return '/login'
    if (user.permisosCustom && user.permisosCustom.length > 0) {
      const firstPermiso = user.permisosCustom[0]
      const routes = PERMISOS_CUSTOM_ROUTES[firstPermiso]
      if (routes && routes.length > 0) return routes[0]
    }
    return RUTAS_INICIALES[user.rol] || '/dashboard'
  }

  const hasRole = (...roles: Rol[]): boolean => {
    if (!user) return false
    return roles.includes(user.rol)
  }

  const isAdmin = (): boolean => hasRole('superadmin', 'admin')
  const isDireccion = (): boolean => hasRole('superadmin', 'admin', 'direccion')

  return {
    session,
    user,
    loading,
    login,
    loginWithGoogleIdToken,
    logout,
    getRutaInicial,
    hasRole,
    isAdmin,
    isDireccion,
  }
}
