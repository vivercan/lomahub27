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

  useEffect(() => {
    if (!loading && user) {
      const ruta = getRutaInicial()
      navigate(ruta, { replace: true })
    }
  }, [loading, user])

  useEffect(() => {
    const loadGSI = () => {
      const existingScript = document.getElementById('gsi-script')
      if (existingScript && !window.google?.accounts?.id) {
        existingScript.remove()
      }
      if (!document.getElementById('gsi-script')) {
        const script = document.createElement('script')
        script.id = 'gsi-script'
        script.src = 'https://accounts.google.com/gsi/client'
        script.async = true
        script.onload = () => {
          setTimeout(initializeGSI, 100)
        }
        document.head.appendChild(script)
      } else if (window.google?.accounts?.id) {
        initializeGSI()
      }
    }
    loadGSI()
  }, [])

  const initializeGSI = () => {
    if (!window.google?.accounts?.id) {
      console.error('Google Identity Services not available')
      return
    }
    try {
      window.google.accounts.id.initialize({
        client_id: GOOGLE_CLIENT_ID,
        callback: handleGoogleCredential,
        auto_select: false,
      })
      if (googleBtnRef.current) {
        const width = googleBtnRef.current.offsetWidth
        if (width > 0) {
          window.google.accounts.id.renderButton(googleBtnRef.current, {
            type: 'standard',
            theme: 'filled_black',
            size: 'large',
            text: 'signin_with',
            shape: 'rectangular',
            width: width,
            locale: 'es',
          })
        } else {
          setTimeout(initializeGSI, 100)
        }
      }
    } catch (error) {
      console.error('Error initializing Google Sign-In:', error)
    }
  }

  const handleGoogleCredential = async (response: { credential: string }) => {
    setError('')
    setGoogleLoading(true)
    try {
      await loginWithGoogleIdToken(response.credential)
    } catch (err: any) {
      setError(err.message || 'Error al iniciar sesi\u00f3n con Google')
    } finally {
      setGoogleLoading(false)
    }
  }

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', background: tokens.colors.bgPrimary }}>
        <p style={{ color: tokens.colors.textSecondary }}>Cargando...</p>
      </div>
    )
  }

  return (
    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh', padding: '1rem', background: tokens.effects.gradientBg, position: 'relative' }}>
      <div style={{ position: 'absolute', inset: 0, overflow: 'hidden' }}>
        <div style={{ position: 'absolute', top: '25%', left: '-5rem', width: '24rem', height: '24rem', borderRadius: '50%', filter: 'blur(48px)', background: `${tokens.colors.primary}0d` }} />
        <div style={{ position: 'absolute', bottom: '25%', right: '-5rem', width: '24rem', height: '24rem', borderRadius: '50%', filter: 'blur(48px)', background: `${tokens.colors.primary}0d` }} />
      </div>

      <div style={{ position: 'relative', width: '100%', maxWidth: '28rem' }}>
        <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: '4rem', height: '4rem', borderRadius: '1rem', border: `1px solid ${tokens.colors.primary}33`, background: `${tokens.colors.primary}1a`, marginBottom: '1rem' }}>
            <Truck style={{ width: '2rem', height: '2rem', color: tokens.colors.primary }} />
          </div>
          <h1 style={{ fontSize: '1.875rem', fontWeight: 700, color: tokens.colors.textPrimary, fontFamily: tokens.fonts.heading, letterSpacing: '0.05em' }}>
            Loma<span style={{ color: tokens.colors.primary }}>HUB</span>27
          </h1>
          <p style={{ marginTop: '0.5rem', fontSize: '0.875rem', color: tokens.colors.textSecondary, fontFamily: tokens.fonts.body }}>
            CRM + TMS + Torre de Control
          </p>
        </div>

        <div style={{ borderRadius: '0.75rem', border: `1px solid ${tokens.effects.glassmorphism.border}`, padding: '2rem', background: tokens.effects.glassmorphism.background, backdropFilter: tokens.effects.glassmorphism.backdropFilter }}>
          {error && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '0.75rem', borderRadius: '0.5rem', border: `1px solid ${tokens.colors.red}33`, background: `${tokens.colors.red}1a`, marginBottom: '1.5rem' }}>
              <AlertCircle style={{ width: '1.25rem', height: '1.25rem', flexShrink: 0, color: tokens.colors.red }} />
              <p style={{ fontSize: '0.875rem', color: tokens.colors.red, fontFamily: tokens.fonts.body }}>{error}</p>
            </div>
          )}

          <p style={{ textAlign: 'center', fontSize: '0.875rem', marginBottom: '1.5rem', color: tokens.colors.textSecondary, fontFamily: tokens.fonts.body }}>
            Inicia sesi\u00f3n con tu cuenta de Google
          </p>

          <div style={{ width: '100%', display: 'flex', justifyContent: 'center' }}>
            <div ref={googleBtnRef} style={{ width: '100%' }} />
          </div>

          {googleLoading && (
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', marginTop: '0.75rem' }}>
              <div style={{ width: '1rem', height: '1rem', border: '2px solid currentColor', borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin 1s linear infinite', color: tokens.colors.textMuted }} />
              <span style={{ fontSize: '0.75rem', color: tokens.colors.textMuted }}>Autenticando\u2026</span>
            </div>
          )}
        </div>

        <p style={{ textAlign: 'center', fontSize: '0.75rem', marginTop: '1.5rem', color: tokens.colors.textMuted, fontFamily: tokens.fonts.body }}>
          LomaHUB27 v2.0 \u2014 Sistema de gesti\u00f3n integral
        </p>
      </div>
    </div>
  )
}
