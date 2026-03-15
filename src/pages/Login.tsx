import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuthContext } from '../hooks/AuthContext'
import { Truck, AlertCircle } from 'lucide-react'
import { tokens } from '../lib/tokens'

const GOOGLE_CLIENT_ID = '431361414884-df5g44uf1b7bv95oh8ecag7j5vir3om4.apps.googleusercontent.com'

declare global {
  interface Window {
    google?: {
      accounts: {
        id: {
          initialize: (config: any) => void
          renderButton: (element: HTMLElement, config: any) => void
          prompt: () => void
        }
      }
    }
  }
}

export default function Login() {
  const [error, setError] = useState('')
  const [googleLoading, setGoogleLoading] = useState(false)
  const { user, loading, loginWithGoogleIdToken, getRutaInicial } = useAuthContext()
  const navigate = useNavigate()
  const googleBtnRef = useRef<HTMLDivElement>(null)

  // Redirect if already authenticated
  useEffect(() => {
    if (!loading && user) {
      const ruta = getRutaInicial()
      navigate(ruta, { replace: true })
    }
  }, [loading, user])

  // Load Google Identity Services script
  useEffect(() => {
    if (document.getElementById('gsi-script')) return
    const script = document.createElement('script')
    script.id = 'gsi-script'
    script.src = 'https://accounts.google.com/gsi/client'
    script.async = true
    script.onload = () => initializeGSI()
    document.head.appendChild(script)

    // If script already loaded
    if (window.google?.accounts?.id) {
      initializeGSI()
    }
  }, [])

  const initializeGSI = () => {
    if (!window.google?.accounts?.id) return

    window.google.accounts.id.initialize({
      client_id: GOOGLE_CLIENT_ID,
      callback: handleGoogleCredential,
      auto_select: false,
    })

    // Render the styled Google button
    if (googleBtnRef.current) {
      window.google.accounts.id.renderButton(googleBtnRef.current, {
        type: 'standard',
        theme: 'filled_black',
        size: 'large',
        text: 'signin_with',
        shape: 'rectangular',
        width: googleBtnRef.current.offsetWidth,
        locale: 'es',
      })
    }
  }

  const handleGoogleCredential = async (response: { credential: string }) => {
    setError('')
    setGoogleLoading(true)
    try {
      await loginWithGoogleIdToken(response.credential)
      // Navigation is handled by the useEffect watching user state
    } catch (err: any) {
      setError(err.message || 'Error al iniciar sesión con Google')
    } finally {
      setGoogleLoading(false)
    }
  }

  // Show nothing while checking auth
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center"
        style={{ background: tokens.effects.gradientBg }}>
        <div className="w-8 h-8 border-4 border-current border-t-transparent rounded-full animate-spin"
          style={{ color: tokens.colors.primary }} />
      </div>
    )
  }

  return (
    <div
      className="min-h-screen flex items-center justify-center p-4"
      style={{ background: tokens.effects.gradientBg }}
    >
      {/* Background effects */}
      <div className="absolute inset-0 overflow-hidden">
        <div
          className="absolute top-1/4 -left-20 w-96 h-96 rounded-full blur-3xl"
          style={{ background: `${tokens.colors.primary}0d` }}
        />
        <div
          className="absolute bottom-1/4 -right-20 w-96 h-96 rounded-full blur-3xl"
          style={{ background: `${tokens.colors.primary}0d` }}
        />
      </div>

      <div className="relative w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          <div
            className="inline-flex items-center justify-center w-16 h-16 rounded-2xl border mb-4"
            style={{
              background: `${tokens.colors.primary}1a`,
              borderColor: `${tokens.colors.primary}33`,
            }}
          >
            <Truck className="w-8 h-8" style={{ color: tokens.colors.primary }} />
          </div>
          <h1
            className="text-3xl font-bold"
            style={{
              color: tokens.colors.textPrimary,
              fontFamily: tokens.fonts.heading,
              letterSpacing: '0.05em',
            }}
          >
            Loma<span style={{ color: tokens.colors.primary }}>HUB</span>27
          </h1>
          <p
            className="mt-2 text-sm"
            style={{
              color: tokens.colors.textSecondary,
              fontFamily: tokens.fonts.body,
            }}
          >
            CRM + TMS + Torre de Control
          </p>
        </div>

        {/* Login Card */}
        <div
          className="rounded-xl border p-8"
          style={{
            background: tokens.effects.glassmorphism.background,
            backdropFilter: tokens.effects.glassmorphism.backdropFilter,
            borderColor: tokens.effects.glassmorphism.border,
          }}
        >
          {error && (
            <div
              className="flex items-center gap-3 p-3 rounded-lg border mb-6"
              style={{
                background: `${tokens.colors.red}1a`,
                borderColor: `${tokens.colors.red}33`,
              }}
            >
              <AlertCircle
                className="w-5 h-5 shrink-0"
                style={{ color: tokens.colors.red }}
              />
              <p
                className="text-sm"
                style={{ color: tokens.colors.red, fontFamily: tokens.fonts.body }}
              >
                {error}
              </p>
            </div>
          )}

          <p
            className="text-center text-sm mb-6"
            style={{ color: tokens.colors.textSecondary, fontFamily: tokens.fonts.body }}
          >
            Inicia sesión con tu cuenta de Google
          </p>

          {/* Google Sign-In Button (rendered by GSI) */}
          <div className="w-full flex justify-center">
            <div ref={googleBtnRef} className="w-full" />
          </div>

          {googleLoading && (
            <div className="flex items-center justify-center gap-2 mt-3">
              <div
                className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin"
                style={{ color: tokens.colors.textMuted }}
              />
              <span className="text-xs" style={{ color: tokens.colors.textMuted }}>
                Autenticando…
              </span>
            </div>
          )}
        </div>

        <p
          className="text-center text-xs mt-6"
          style={{
            color: tokens.colors.textMuted,
            fontFamily: tokens.fonts.body,
          }}
        >
          LomaHUB27 v2.0 — Sistema de gestión integral
        </p>
      </div>
    </div>
  )
}
