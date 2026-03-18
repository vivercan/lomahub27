import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuthContext } from '../hooks/AuthContext'
import { AlertCircle } from 'lucide-react'

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

/* ── Design tokens (login-specific, black + orange brand) ── */
const login = {
  bg: '#08080C',
  orange: '#E8611A',
  orangeGlow: 'rgba(232, 97, 26, 0.12)',
  white90: 'rgba(255,255,255,0.90)',
  white50: 'rgba(255,255,255,0.50)',
  white20: 'rgba(255,255,255,0.20)',
  white08: 'rgba(255,255,255,0.08)',
  white04: 'rgba(255,255,255,0.04)',
  white02: 'rgba(255,255,255,0.02)',
  red: '#EF4444',
  green: '#2ECC71',
  font: "'Inter', -apple-system, BlinkMacSystemFont, sans-serif",
} as const

const styles = {
  /* ── Page ── */
  page: {
    display: 'grid' as const,
    gridTemplateColumns: '400px 1fr',
    width: '100%',
    minHeight: '100vh',
    background: login.bg,
    fontFamily: login.font,
    position: 'relative' as const,
    overflow: 'hidden' as const,
  },
  pageLoading: {
    display: 'flex' as const,
    justifyContent: 'center' as const,
    alignItems: 'center' as const,
    height: '100vh',
    background: login.bg,
    fontFamily: login.font,
  },

  /* ── Ambient orbs ── */
  ambient1: {
    position: 'fixed' as const,
    width: '900px',
    height: '900px',
    borderRadius: '50%',
    filter: 'blur(150px)',
    background: 'radial-gradient(circle, rgba(232, 97, 26, 0.07), transparent 65%)',
    top: '-30%',
    right: '-15%',
    pointerEvents: 'none' as const,
    zIndex: 0,
  },
  ambient2: {
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

  /* ── Left panel ── */
  leftPanel: {
    display: 'flex' as const,
    flexDirection: 'column' as const,
    justifyContent: 'flex-end' as const,
    padding: '0 48px 100px 48px',
    position: 'relative' as const,
    zIndex: 2,
  },
  leftDivider: {
    position: 'absolute' as const,
    top: '15%',
    bottom: '15%',
    right: 0,
    width: '1px',
    background: `linear-gradient(to bottom, transparent, ${login.white08}, transparent)`,
  },

  /* ── Login card ── */
  card: {
    background: login.white02,
    border: `1px solid ${login.white08}`,
    borderRadius: '16px',
    padding: '40px 36px',
    backdropFilter: 'blur(30px)',
    WebkitBackdropFilter: 'blur(30px)',
    position: 'relative' as const,
    overflow: 'hidden' as const,
    animation: 'loginSlideUp 0.7s cubic-bezier(0.16, 1, 0.3, 1) 0.2s both',
  },
  cardTopLine: {
    position: 'absolute' as const,
    top: 0,
    left: '15%',
    right: '15%',
    height: '1px',
    background: `linear-gradient(90deg, transparent, ${login.orangeGlow.replace('0.12', '0.25')}, transparent)`,
  },
  title: {
    fontSize: '28px',
    fontWeight: 700,
    color: login.white90,
    marginBottom: '6px',
  },
  subtitle: {
    fontSize: '13px',
    color: login.white20,
    marginBottom: '36px',
    lineHeight: 1.6,
  },

  /* ── Google button container ── */
  googleContainer: {
    width: '100%',
    display: 'flex' as const,
    justifyContent: 'center' as const,
  },
  googleBtn: {
    width: '100%',
  },

  /* ── Error ── */
  errorBox: {
    display: 'flex' as const,
    alignItems: 'center' as const,
    gap: '10px',
    padding: '12px',
    borderRadius: '10px',
    border: `1px solid rgba(239, 68, 68, 0.25)`,
    background: 'rgba(239, 68, 68, 0.08)',
    marginBottom: '24px',
  },
  errorIcon: {
    width: '18px',
    height: '18px',
    flexShrink: 0,
    color: login.red,
  },
  errorText: {
    fontSize: '13px',
    color: login.red,
    margin: 0,
  },

  /* ── Loading indicator ── */
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
    border: `2px solid ${login.white20}`,
    borderTopColor: 'transparent',
    borderRadius: '50%',
    animation: 'loginSpin 1s linear infinite',
  },
  loadingText: {
    fontSize: '12px',
    color: login.white20,
  },

  version: {
    marginTop: '24px',
    fontSize: '10px',
    color: 'rgba(255,255,255,0.10)',
    letterSpacing: '1px',
    textAlign: 'center' as const,
  },

  /* ── Right panel ── */
  rightPanel: {
    display: 'flex' as const,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
    position: 'relative' as const,
    padding: '60px 80px 60px 40px',
    overflow: 'hidden' as const,
    zIndex: 2,
  },
  brandContainer: {
    width: '100%',
    maxWidth: '700px',
    animation: 'loginFadeIn 0.6s cubic-bezier(0.16, 1, 0.3, 1) both',
  },

  /* ── Logo lines ── */
  lineTop: {
    width: '100%',
    height: '2px',
    marginBottom: '20px',
    background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.08) 10%, rgba(255,255,255,0.25) 40%, rgba(232,97,26,0.5) 75%, rgba(232,97,26,0.2) 90%, transparent)',
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
    fontSize: '110px',
    fontWeight: 800,
    fontStyle: 'italic' as const,
    color: login.white90,
    letterSpacing: '-5px',
  },
  logoHub: {
    fontSize: '110px',
    fontWeight: 800,
    fontStyle: 'italic' as const,
    color: login.white90,
    letterSpacing: '-5px',
  },
  logo27: {
    fontSize: '110px',
    fontWeight: 800,
    fontStyle: 'italic' as const,
    color: login.orange,
    letterSpacing: '-4px',
    textShadow: '0 0 80px rgba(232, 97, 26, 0.2)',
  },
  lineBottom: {
    width: '100%',
    height: '3px',
    margin: '10px 0 8px',
    background: 'linear-gradient(90deg, rgba(255,255,255,0.05), rgba(255,255,255,0.25) 25%, rgba(255,255,255,0.45) 45%, rgba(232,97,26,0.6) 70%, rgba(232,97,26,0.25) 88%, transparent)',
    borderRadius: '2px',
  },
  tagline: {
    fontSize: '20px',
    fontWeight: 400,
    fontStyle: 'italic' as const,
    letterSpacing: '3px',
    color: 'rgba(180, 180, 180, 0.4)',
    textAlign: 'right' as const,
    paddingRight: '4px',
  },

  /* ── Status bar ── */
  statusBar: {
    position: 'fixed' as const,
    bottom: 0,
    left: 0,
    right: 0,
    height: '32px',
    display: 'flex' as const,
    alignItems: 'center' as const,
    justifyContent: 'space-between' as const,
    padding: '0 32px',
    background: 'rgba(0, 0, 0, 0.6)',
    borderTop: `1px solid ${login.white04}`,
    zIndex: 10,
  },
  statusText: {
    fontSize: '10px',
    color: 'rgba(255,255,255,0.15)',
    letterSpacing: '0.5px',
  },
  statusDot: {
    display: 'inline-block',
    width: '5px',
    height: '5px',
    borderRadius: '50%',
    background: login.green,
    boxShadow: `0 0 6px rgba(46, 204, 113, 0.4)`,
    marginRight: '6px',
  },
}

/* ── CSS Keyframes (injected once) ── */
const keyframesId = 'login-keyframes'
function injectKeyframes() {
  if (typeof document !== 'undefined' && !document.getElementById(keyframesId)) {
    const style = document.createElement('style')
    style.id = keyframesId
    style.textContent = `
      @keyframes loginFadeIn {
        from { opacity: 0; }
        to { opacity: 1; }
      }
      @keyframes loginSlideUp {
        from { opacity: 0; transform: translateY(24px); }
        to { opacity: 1; transform: translateY(0); }
      }
      @keyframes loginSpin {
        to { transform: rotate(360deg); }
      }
    `
    document.head.appendChild(style)
  }
}

export default function Login() {
  const [error, setError] = useState('')
  const [googleLoading, setGoogleLoading] = useState(false)
  const { user, loading, loginWithGoogleIdToken, getRutaInicial } = useAuthContext()
  const navigate = useNavigate()
  const googleBtnRef = useRef<HTMLDivElement>(null)

  useEffect(() => { injectKeyframes() }, [])

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
    } catch (err) {
      console.error('Error initializing Google Sign-In:', err)
    }
  }

  const handleGoogleCredential = async (response: { credential: string }) => {
    setError('')
    setGoogleLoading(true)
    try {
      await loginWithGoogleIdToken(response.credential)
    } catch (err: any) {
      setError(err.message || 'Error al iniciar sesión con Google')
    } finally {
      setGoogleLoading(false)
    }
  }

  if (loading) {
    return (
      <div style={styles.pageLoading}>
        <p style={{ color: login.white20 }}>Cargando...</p>
      </div>
    )
  }

  return (
    <div style={styles.page}>
      {/* Ambient light */}
      <div style={styles.ambient1} />
      <div style={styles.ambient2} />

      {/* Left: Login panel — pushed to bottom */}
      <div style={styles.leftPanel}>
        <div style={styles.leftDivider} />
        <div style={styles.card}>
          <div style={styles.cardTopLine} />
          <h1 style={styles.title}>Bienvenido</h1>
          <p style={styles.subtitle}>
            Inicia sesión con tu cuenta de Google para acceder al centro de operaciones.
          </p>

          {error && (
            <div style={styles.errorBox}>
              <AlertCircle style={styles.errorIcon} />
              <p style={styles.errorText}>{error}</p>
            </div>
          )}

          <div style={styles.googleContainer}>
            <div ref={googleBtnRef} style={styles.googleBtn} />
          </div>

          {googleLoading && (
            <div style={styles.loadingBox}>
              <div style={styles.spinner} />
              <span style={styles.loadingText}>Autenticando…</span>
            </div>
          )}

          <p style={styles.version}>v2.0 · Grupo Loma 2026</p>
        </div>
      </div>

      {/* Right: Logo GRANDE */}
      <div style={styles.rightPanel}>
        <div style={styles.brandContainer}>
          <div style={styles.lineTop} />
          <div style={styles.logoRow}>
            <span style={styles.logoLoma}>Loma</span>
            <span style={styles.logoHub}>HUB</span>
            <span style={styles.logo27}>27</span>
          </div>
          <div style={styles.lineBottom} />
          <div style={styles.tagline}>Future Experience</div>
        </div>
      </div>

      {/* Status bar */}
      <div style={styles.statusBar}>
        <span style={styles.statusText}>
          <span style={styles.statusDot} />
          Sistema operativo
        </span>
        <span style={styles.statusText}>Operación Inteligente</span>
      </div>
    </div>
  )
}

