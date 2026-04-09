import { useState, useEffect, useRef, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuthContext } from '../hooks/AuthContext'
import { AlertCircle } from 'lucide-react'

const GOOGLE_CLIENT_ID =
  '431361414884-df5g44uf1b7bv95oh8ecag7j5vir3om4.apps.googleusercontent.com'

declare global {
  interface Window {
    google?: {
      accounts: {
        id: {
          initialize: (config: any) => void
          renderButton: (element: HTMLElement, config: any) => void
          prompt: () => void
          cancel: () => void
          disableAutoSelect: () => void
          revoke: (hint: string, callback?: () => void) => void
        }
      }
    }
  }
}

const L = {
  bg: '#08080C',
  orange: 'rgba(232,97,26,0.80)',
  orangeHover: 'rgba(255,122,46,0.85)',
  orangeGlow: 'rgba(232, 97, 26, 0.15)',
  w90: 'rgba(255,255,255,0.90)',
  w50: 'rgba(255,255,255,0.50)',
  w20: 'rgba(255,255,255,0.20)',
  w10: 'rgba(255,255,255,0.10)',
  w08: 'rgba(255,255,255,0.08)',
  w04: 'rgba(255,255,255,0.04)',
  w02: 'rgba(255,255,255,0.02)',
  red: '#C53030',
  green: '#0D9668',
  font: "'Montserrat', -apple-system, BlinkMacSystemFont, sans-serif",
} as const

const S = {
  page: {
    display: 'grid' as const,
    gridTemplateColumns: '560px 1fr',
    width: '100%',
    height: '100vh',
    background: L.bg,
    fontFamily: L.font,
    position: 'relative' as const,
    overflow: 'hidden' as const,
  },
  pageLoading: {
    display: 'flex' as const,
    justifyContent: 'center' as const,
    alignItems: 'center' as const,
    height: '100vh',
    background: L.bg,
    fontFamily: L.font,
  },
  grain: {
    position: 'fixed' as const,
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    pointerEvents: 'none' as const,
    zIndex: 1,
    opacity: 0.007,
    mixBlendMode: 'overlay' as const,
  },
  amb1: {
    position: 'fixed' as const,
    width: '900px',
    height: '900px',
    borderRadius: '50%',
    filter: 'blur(150px)',
    background: 'radial-gradient(circle, rgba(232,97,26,0.07), transparent 65%)',
    top: '-30%',
    right: '-15%',
    pointerEvents: 'none' as const,
    zIndex: 0,
  },
  amb2: {
    position: 'fixed' as const,
    width: '400px',
    height: '400px',
    borderRadius: '50%',
    filter: 'blur(150px)',
    background: 'radial-gradient(circle, rgba(255,255,255,0.015), transparent 70%)',
    bottom: '-10%',
    left: '30%',
    pointerEvents: 'none' as const,
    zIndex: 0,
  },
  left: {
    display: 'flex' as const,
    flexDirection: 'column' as const,
    justifyContent: 'center' as const,
    padding: '85px 48px 0 48px',
    position: 'relative' as const,
    zIndex: 2,
  },
  divider: {
    position: 'absolute' as const,
    top: '15%',
    bottom: '15%',
    right: '7px',
    width: '1px',
    background: 'linear-gradient(to bottom, transparent, rgba(232,97,26,0.10), transparent)',
  },
  card: {
    background:
      'linear-gradient(135deg, rgba(255,255,255,0.06) 0%, rgba(255,255,255,0.02) 50%, rgba(255,255,255,0.04) 100%)',
    border: '1px solid rgba(255,255,255,0.12)',
    borderRadius: '20px',
    padding: '22px 52px',
    backdropFilter: 'blur(40px) saturate(1.4)',
    WebkitBackdropFilter: 'blur(40px) saturate(1.4)',
    position: 'relative' as const,
    overflow: 'hidden' as const,
    animation: 'loginSlideUp 0.7s cubic-bezier(0.16, 1, 0.3, 1) 0.2s both',
    boxShadow:
      '0 8px 32px rgba(0,0,0,0.4), 0 0 0 0.5px rgba(255,255,255,0.08) inset, 0 1px 0 rgba(255,255,255,0.1) inset, 0 -1px 0 rgba(0,0,0,0.2) inset',
    transform: 'perspective(1000px) rotateX(0.5deg)',
  },
  cardLine: {
    position: 'absolute' as const,
    top: 0,
    left: '10%',
    right: '10%',
    height: '1px',
    background:
      'linear-gradient(90deg, transparent, rgba(255,255,255,0.15) 30%, rgba(232,97,26,0.3) 50%, rgba(255,255,255,0.15) 70%, transparent)',
  },
  title: {
    fontSize: '28px',
    fontWeight: 700,
    color: L.w90,
    marginBottom: '16px',
  },
  errorBox: {
    display: 'flex' as const,
    alignItems: 'center' as const,
    gap: '10px',
    padding: '12px',
    borderRadius: '10px',
    border: '1px solid rgba(239,68,68,0.25)',
    background: 'rgba(239,68,68,0.08)',
    marginBottom: '20px',
  },
  errorIcon: { width: '18px', height: '18px', flexShrink: 0, color: L.red },
  errorText: { fontSize: '13px', color: L.red, margin: 0 },
  customBtn: {
    width: '100%',
    height: '52px',
    display: 'flex' as const,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
    gap: '12px',
    padding: '0 24px',
    background: 'rgba(255,255,255,0.04)',
    border: '1px solid rgba(255,255,255,0.10)',
    borderRadius: '12px',
    color: '#fff',
    fontFamily: L.font,
    fontSize: '16px',
    fontWeight: 600,
    cursor: 'pointer',
    transition: 'all 0.3s cubic-bezier(0.4,0,0.2,1)',
    boxShadow: '0 2px 12px rgba(0,0,0,0.2), 0 1px 0 rgba(255,255,255,0.06) inset',
    letterSpacing: '0.3px',
    position: 'relative' as const,
    overflow: 'hidden' as const,
  },
  loadingBox: {
    display: 'flex' as const,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
    gap: '8px',
    marginTop: '12px',
  },
  spinner: {
    width: '14px',
    height: '14px',
    border: `2px solid ${L.w20}`,
    borderTopColor: 'transparent',
    borderRadius: '50%',
    animation: 'loginSpin 1s linear infinite',
  },
  loadingText: { fontSize: '12px', color: L.w20 },
  right: {
    display: 'flex' as const,
    alignItems: 'flex-start' as const,
    justifyContent: 'center' as const,
    position: 'relative' as const,
    padding: '170px 40px 60px 35px',
    overflow: 'hidden' as const,
    zIndex: 2,
  },
  brand: {
    width: '100%',
    maxWidth: '800px',
    animation: 'loginFadeIn 0.6s cubic-bezier(0.16,1,0.3,1) both',
  },
  lineTop: {
    width: '100%',
    height: '2px',
    marginBottom: '16px',
    background:
      'linear-gradient(90deg, transparent, rgba(255,255,255,0.08) 10%, rgba(255,255,255,0.25) 40%, rgba(232,97,26,0.5) 75%, rgba(232,97,26,0.2) 90%, transparent)',
    borderRadius: '2px',
  },
  logoRow: {
    display: 'flex' as const,
    alignItems: 'baseline' as const,
    justifyContent: 'flex-start' as const,
    lineHeight: 1,
    marginBottom: '2px',
    userSelect: 'none' as const,
  },
  logoLoma: {
    fontSize: '148px',
    fontWeight: 800,
    fontStyle: 'italic' as const,
    color: L.w90,
    letterSpacing: '-6px',
  },
  logoHub: {
    fontSize: '148px',
    fontWeight: 800,
    fontStyle: 'italic' as const,
    color: L.w90,
    letterSpacing: '-6px',
  },
  logo27: {
    fontSize: '148px',
    fontWeight: 800,
    fontStyle: 'italic' as const,
    color: '#E8611A',
    letterSpacing: '-6px',
    textShadow: '0 0 80px rgba(232,97,26,0.25)',
  },
  lineBot: {
    width: '100%',
    height: '3px',
    margin: '8px 0 8px',
    background:
      'linear-gradient(90deg, rgba(255,255,255,0.05), rgba(255,255,255,0.25) 25%, rgba(255,255,255,0.45) 45%, rgba(232,97,26,0.6) 70%, rgba(232,97,26,0.25) 88%, transparent)',
    borderRadius: '2px',
  },
  tagline: {
    fontSize: '20px',
    fontWeight: 400,
    fontStyle: 'italic' as const,
    letterSpacing: '3px',
    color: 'rgba(180,180,180,0.55)',
    textAlign: 'right' as const,
    paddingRight: '4px',
  },
  statusBar: {
    position: 'fixed' as const,
    bottom: 0,
    left: 0,
    right: 0,
    height: '32px',
    display: 'flex' as const,
    alignItems: 'center' as const,
    justifyContent: 'flex-end' as const,
    padding: '0 32px',
    background: 'rgba(0,0,0,0.6)',
    borderTop: `1px solid ${L.w04}`,
    zIndex: 10,
  },
  statusR: {
    fontSize: '9px',
    color: 'rgba(255,255,255,0.40)',
    letterSpacing: '0.3px',
    textAlign: 'right' as const,
    fontWeight: 400,
  },
}

const kfId = 'login-kf'
function injectKF() {
  if (typeof document !== 'undefined' && !document.getElementById(kfId)) {
    const el = document.createElement('style')
    el.id = kfId
    el.textContent = `
      @keyframes loginFadeIn { from{opacity:0} to{opacity:1} }
      @keyframes loginSlideUp { from{opacity:0;transform:translateY(24px)} to{opacity:1;transform:translateY(0)} }
      @keyframes loginSpin { to{transform:rotate(360deg)} }
    `
    document.head.appendChild(el)
  }
}

export default function Login() {
  const [error, setError] = useState('')
  const [googleLoading, setGoogleLoading] = useState(false)
  const [hover, setHover] = useState(false)
  const [pressed, setPressed] = useState(false)
  const [gsiReady, setGsiReady] = useState(false)
  const [gsiAttempt, setGsiAttempt] = useState(0)
  const { user, loading, loginWithGoogleIdToken, getRutaInicial } = useAuthContext()
  const navigate = useNavigate()
  const hiddenGoogleRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    injectKF()
  }, [])

  useEffect(() => {
    if (!loading && user) {
      navigate(getRutaInicial(), { replace: true })
    }
  }, [loading, user])

  const handleCredential = useCallback(
    async (response: { credential: string }) => {
      setError('')
      setGoogleLoading(true)
      try {
        await loginWithGoogleIdToken(response.credential)
      } catch (err: any) {
        setError(err.message || 'Error al iniciar sesión con Google')
      } finally {
        setGoogleLoading(false)
      }
    },
    [loginWithGoogleIdToken]
  )

  useEffect(() => {
    let mounted = true

    const initGSI = () => {
      if (!window.google?.accounts?.id || !mounted) return false
      try {
        // Always cancel first to clean up any stale state from previous session
        try {
          window.google.accounts.id.cancel()
        } catch (_) {
          /* ignore */
        }

        window.google.accounts.id.initialize({
          client_id: GOOGLE_CLIENT_ID,
          callback: handleCredential,
          auto_select: false,
          cancel_on_tap_outside: true,
          itp_support: true,
        })

        if (hiddenGoogleRef.current) {
          // Clear previous rendered button completely
          hiddenGoogleRef.current.innerHTML = ''
          window.google.accounts.id.renderButton(hiddenGoogleRef.current, {
            type: 'standard',
            theme: 'filled_black',
            size: 'large',
            text: 'signin_with',
            shape: 'rectangular',
            width: 300,
            locale: 'es',
          })
        }

        if (mounted) setGsiReady(true)
        return true
      } catch (e) {
        console.error('GSI init error:', e)
        return false
      }
    }

    const loadGSI = () => {
      // 1. Remove any existing GSI script to guarantee fresh load
      const existing = document.getElementById('gsi-script')
      if (existing) existing.remove()

      // 2. Clear Google global to force complete re-initialization
      // This is the KEY fix for post-logout: Google's library retains
      // stale FedCM state in the window.google object. By deleting it
      // before loading a fresh script, we ensure clean initialization.
      delete (window as any).google

      // 3. Load fresh GSI script with cache-buster to prevent stale cached version
      const s = document.createElement('script')
      s.id = 'gsi-script'
      s.src = 'https://accounts.google.com/gsi/client?ts=' + Date.now()
      s.async = true
      s.onload = () => {
        // Wait for Google library to fully initialize (up to 2 seconds)
        const waitForGoogle = (retries: number) => {
          if (!mounted) return
          if (window.google?.accounts?.id) {
            const ok = initGSI()
            if (!ok && retries > 0) {
              setTimeout(() => waitForGoogle(retries - 1), 200)
            }
          } else if (retries > 0) {
            setTimeout(() => waitForGoogle(retries - 1), 200)
          } else {
            console.error('GSI library failed to initialize after retries')
            // Force retry by bumping attempt counter
            if (mounted) setGsiAttempt((prev) => prev + 1)
          }
        }
        waitForGoogle(10)
      }
      s.onerror = () => {
        console.error('Failed to load GSI script')
        // Retry once on network error
        if (mounted) {
          setTimeout(() => {
            if (mounted) setGsiAttempt((prev) => prev + 1)
          }, 1000)
        }
      }
      document.head.appendChild(s)
    }

    loadGSI()

    return () => {
      mounted = false
      if (window.google?.accounts?.id) {
        try {
          window.google.accounts.id.cancel()
        } catch (_) {
          /* ignore */
        }
      }
    }
  }, [handleCredential, gsiAttempt])

  const triggerGoogleSignIn = () => {
    // Strategy 1: Click the hidden rendered Google button
    if (hiddenGoogleRef.current) {
      const btn = hiddenGoogleRef.current.querySelector(
        'div[role="button"]'
      ) as HTMLElement
      if (btn) {
        btn.click()
        return
      }
      // Also try iframe approach (Google sometimes renders inside iframe)
      const iframe = hiddenGoogleRef.current.querySelector('iframe')
      if (iframe) {
        try {
          const iframeBtn = iframe.contentDocument?.querySelector(
            'div[role="button"]'
          ) as HTMLElement
          if (iframeBtn) {
            iframeBtn.click()
            return
          }
        } catch (_) {
          /* cross-origin, ignore */
        }
      }
    }

    // Strategy 2: Use Google One Tap prompt
    if (window.google?.accounts?.id) {
      try {
        window.google.accounts.id.prompt()
        return
      } catch (_) {
        /* ignore */
      }
    }

    // Strategy 3: Force GSI reload if nothing worked
    console.warn('GSI not available, forcing reload...')
    setGsiAttempt((prev) => prev + 1)
  }

  if (loading) {
    return (
      <div style={S.pageLoading}>
        <p style={{ color: L.w20 }}>Cargando...</p>
      </div>
    )
  }

  return (
    <div style={S.page}>
      <svg style={{ position: 'absolute', width: 0, height: 0 }}>
        <filter id="grain">
          <feTurbulence
            type="fractalNoise"
            baseFrequency="0.65"
            numOctaves="3"
            stitchTiles="stitch"
          />
        </filter>
      </svg>
      <div style={{ ...S.grain, filter: 'url(#grain)' }} />
      <div style={S.amb1} />
      <div style={S.amb2} />

      <div style={S.left}>
        <div style={S.divider} />
        <div style={S.card}>
          <div style={S.cardLine} />
          <h1 style={S.title}>Bienvenido</h1>

          {error && (
            <div style={S.errorBox}>
              <AlertCircle style={S.errorIcon} />
              <p style={S.errorText}>{error}</p>
            </div>
          )}

          {/* Hidden Google button for auth flow — key forces remount on retry */}
          <div
            key={'gsi-' + gsiAttempt}
            ref={hiddenGoogleRef}
            style={{
              position: 'absolute',
              opacity: 0,
              pointerEvents: 'none',
              height: 0,
              overflow: 'hidden',
            }}
          />

          {/* Custom styled Google button */}
          <button
            style={{
              ...S.customBtn,
              background: pressed
                ? 'rgba(244,123,32,0.06)'
                : hover
                  ? 'rgba(244,123,32,0.06)'
                  : 'rgba(255,255,255,0.04)',
              borderColor: pressed
                ? 'rgba(244,123,32,0.45)'
                : hover
                  ? 'rgba(244,123,32,0.60)'
                  : 'rgba(255,255,255,0.10)',
              boxShadow: pressed
                ? '0 1px 4px rgba(0,0,0,0.5), 0 0 15px rgba(244,123,32,0.18), inset 0 2px 6px rgba(0,0,0,0.4)'
                : hover
                  ? '0 8px 32px rgba(0,0,0,0.3), 0 0 35px rgba(244,123,32,0.28), 4px 0 20px rgba(244,123,32,0.14)'
                  : '0 2px 12px rgba(0,0,0,0.2), 0 1px 0 rgba(255,255,255,0.06) inset',
              transform: pressed
                ? 'translateY(2px) scale(0.98)'
                : hover
                  ? 'translateY(-1px)'
                  : 'none',
              transition: pressed
                ? 'all 0.08s ease'
                : 'all 0.3s cubic-bezier(0.4,0,0.2,1)',
            }}
            onMouseEnter={() => setHover(true)}
            onMouseLeave={() => {
              setHover(false)
              setPressed(false)
            }}
            onMouseDown={() => setPressed(true)}
            onMouseUp={() => setPressed(false)}
            onClick={triggerGoogleSignIn}
          >
            <div
              style={{
                position: 'absolute',
                inset: 0,
                background:
                  'linear-gradient(270deg, rgba(244,123,32,0.50) 0%, rgba(244,123,32,0.22) 40%, rgba(232,97,26,0.04) 100%)',
                opacity: hover ? 1 : 0,
                transition: 'opacity 0.3s ease',
                pointerEvents: 'none' as const,
                borderRadius: '12px',
              }}
            />
            <svg
              width="20"
              height="20"
              viewBox="0 0 24 24"
              style={{
                opacity: hover ? 0.95 : 0.55,
                transition: 'opacity 0.3s ease',
                position: 'relative' as const,
                zIndex: 1,
              }}
            >
              <path
                fill="rgba(255,255,255,0.85)"
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z"
              />
              <path
                fill="rgba(255,255,255,0.70)"
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
              />
              <path
                fill="rgba(255,255,255,0.55)"
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18A11.96 11.96 0 0 0 1 12c0 1.94.46 3.77 1.18 5.07l3.66-2.98z"
              />
              <path
                fill="rgba(255,255,255,0.90)"
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
              />
            </svg>
            <span
              style={{
                color: hover
                  ? 'rgba(255,255,255,0.95)'
                  : 'rgba(255,255,255,0.60)',
                transition: 'color 0.3s ease',
                position: 'relative' as const,
                zIndex: 1,
              }}
            >
              Continuar con Google
            </span>
          </button>

          {googleLoading && (
            <div style={S.loadingBox}>
              <div style={S.spinner} />
              <span style={S.loadingText}>Autenticando...</span>
            </div>
          )}
        </div>

        {/* Separador + Security */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '14px',
            margin: '14px 0 4px',
          }}
        >
          <div
            style={{
              flex: 1,
              height: '1px',
              background: 'rgba(255,255,255,0.06)',
            }}
          />
          <span
            style={{
              fontSize: '10px',
              fontWeight: 600,
              color: 'rgba(255,255,255,0.18)',
              textTransform: 'uppercase' as const,
              letterSpacing: '2px',
            }}
          >
            Acceso autorizado
          </span>
          <div
            style={{
              flex: 1,
              height: '1px',
              background: 'rgba(255,255,255,0.06)',
            }}
          />
        </div>
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '7px',
          }}
        >
          <svg
            width="11"
            height="11"
            viewBox="0 0 24 24"
            fill="none"
            stroke="rgba(255,255,255,0.30)"
            strokeWidth="2"
            strokeLinecap="round"
            style={{ opacity: 0.5 }}
          >
            <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
            <path d="M7 11V7a5 5 0 0 1 10 0v4" />
          </svg>
          <span
            style={{
              fontSize: '11px',
              fontWeight: 500,
              color: 'rgba(255,255,255,0.18)',
              letterSpacing: '0.3px',
            }}
          >
            Conexión cifrada · Solo personal autorizado
          </span>
        </div>
      </div>

      <div style={S.right}>
        <div style={S.brand}>
          <div style={S.lineTop} />
          <div style={S.logoRow}>
            <span style={S.logoLoma}>Loma</span>
            <span style={S.logoHub}>HUB</span>
            <span style={S.logo27}>27</span>
          </div>
          <div style={S.lineBot} />
          <div style={S.tagline}>Future Experience</div>
        </div>
      </div>

      <div style={S.statusBar}>
        <span style={S.statusR}>
          Grupo Loma 2026 {'·'}{' '}
          <a
            href="mailto:hola@trob.com.mx"
            onDoubleClick={(e) => {
              e.preventDefault()
              navigator.clipboard.writeText('hola@trob.com.mx')
            }}
            style={{
              color: 'inherit',
              textDecoration: 'none',
              cursor: 'pointer',
            }}
          >
            hola@trob.com.mx
          </a>{' '}
          {'·'} Operación inteligente... Resultados reales
        </span>
      </div>
    </div>
  )
}
