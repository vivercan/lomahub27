import { useState, useEffect, useCallback } from 'react'
import type { Session, User } from '@supabase/supabase-js'
import { supabase } from '../lib/supabase'
import type { Rol, AuthUser } from '../types/auth'
import { RUTAS_INICIALES } from '../types/auth'

export function useAuth() {
  const [session, setSession] = useState<Session | null>(null)
  const [user, setUser] = useState<AuthUser | null>(null)
  const [loading, setLoading] = useState(true)

  const parseUser = useCallback((supabaseUser: User | null): AuthUser | null => {
    if (!supabaseUser) return null
    return {
      id: supabaseUser.id,
      email: supabaseUser.email || '',
      rol: (supabaseUser.app_metadata?.rol as Rol) || 'ventas',
      empresa: supabaseUser.app_metadata?.empresa || '',
    }
  }, [])

  useEffect(() => {
    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session)
      setUser(parseUser(session?.user ?? null))
      setLoading(false)
    })

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        setSession(session)
        setUser(parseUser(session?.user ?? null))
        setLoading(false)
      }
    )

    return () => subscription.unsubscribe()
  }, [parseUser])

  const login = async (email: string, password: string) => {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    })
    if (error) throw error
    return data
  }

  const logout = async () => {
    const { error } = await supabase.auth.signOut()
    if (error) throw error
  }

  const getRutaInicial = (): string => {
    if (!user) return '/login'
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
    logout,
    getRutaInicial,
    hasRole,
    isAdmin,
    isDireccion,
  }
}
