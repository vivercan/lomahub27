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
  red: '#EF4444',
  green: '#2ECC71',
  font: "'Inter', -apple-system, BlinkMacSystemFont, sans-serif",
} as const

const S = {
  page: {
    display: 'grid' as const,
    gridTemplateColumns: '560px 1fr',
    width: '100%',
    minHeight: '100vh',
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
    top: 0, left: 0, right: 0, bottom: 0,
    pointerEvents: 'none' as const,
    zIndex: 1,
    opacity: 0.007,
    mixBlendMode: 'overlay' as const,
  },
  amb1: {
    position: 'fixed' as const,
    width: '900px', height: '900px',
    borderRadius: '50%',
    filter: 'blur(150px)',
    background: 'radial-gradient(circle, rgba(232,97,26,0.07), transparent 65%)',
    top: '-30%', right: '-15%',
    pointerEvents: 'none' as const,
    zIndex: 0,
  },
  amb2: {
    position: 'fixed' as const,
    width: '400px', height: '400px',
    borderRadius: '50%',
    filter: 'blur(150px)',
    background: 'radial-gradient(circle, rgba(255,255,255,0.015), transparent 70%)',
    bottom: '-10%', left: '30%',
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
    top: '15%', bottom: '15%', right: '7px',
    width: '1px',
    background: 'linear-gradient(to bottom, transparent, rgba(232,97,26,0.10), transparent)',
  },
  card: {
    background: 'linear-gradient(135deg, rgba(255,255,255,0.06) 0%, rgba(255,255,255,0.02) 50%, rgba(255,255,255,0.04) 100%)',
    border: '1px solid rgba(255,255,255,0.12)',
    borderRadius: '20px',
    padding: '22px 52px',
    backdropFilter: 'blur(40px) saturate(1.4)',
    WebkitBackdropFilter: 'blur(40px) saturate(1.4)',
    position: 'relative' as const,
    overflow: 'hidden' as const,
    animation: 'loginSlideUp 0.7s cubic-bezier(0.16, 1, 0.3, 1) 0.2s both',
    boxShadow: '0 8px 32px rgba(0,0,0,0.4), 0 0 0 0.5px rgba(255,255,255,0.08) inset, 0 1px 0 rgba(255,255,255,0.1) inset, 0 -1px 0 rgba(0,0,0,0.2) inset',
    transform: 'perspective(1000px) rotateX(0.5deg)',
  },
  cardLine: {
    position: 'absolute' as const,
    top: 0, left: '10%', right: '10%',
    height: '1px',
    background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.15) 30%, rgba(232,97,26,0.3) 50%, rgba(255,255,255,0.15) 70%, transparent)',
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
  googleWrap: {
    width: '100%',
    display: 'flex' as const,
    justifyContent: 'center' as const,
  },
  googleDiv: { width: '100%' },
  customBtn: {
    width: '100%',
    height: '52px',
    display: 'flex' as const,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
    gap: '12px',
    padding: '0 24px',
    background: '#4285F4',
    border: 'none',
    borderRadius: '12px',
    color: '#fff',
    fontFamily: L.font,
    fontSize: '16px',
    fontWeight: 600,
    cursor: 'pointer',
    transition: 'all 0.3s cubic-bezier(0.4,0,0.2,1)',
    boxShadow: '0 4px 24px rgba(66,133,244,0.30), 0 1px 0 rgba(255,255,255,0.10) inset',
    letterSpacing: '0.3px',
  },
  loadingBox: {
    display: 'flex' as const,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
    gap: '8px',
    marginTop: '12px',
  },
  spinner: {
    width: '14px', height: '14px',
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
    padding: '170px 80px 60px 35px',
    overflow: 'hidden' as const,
    zIndex: 2,
  },
  brand: {
    width: '100%',
    maxWidth: '800px',
    animation: 'loginFadeIn 0.6s cubic-bezier(0.16,1,0.3,1) both',
  },
  lineTop: {
    width: '100%', height: '2px',
    marginBottom: '16px',
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
    fontSize: '170px', fontWeight: 800,
    fontStyle: 'italic' as const,
    color: L.w90, letterSpacing: '-7px',
  },
  logoHub: {
    fontSize: '170px', fontWeight: 800,
    fontStyle: 'italic' as const,
    color: L.w90, letterSpacing: '-7px',
  },
  logo27: {
    fontSize: '170px', fontWeight: 800,
    fontStyle: 'italic' as const,
    color: '#E8611A', letterSpacing: '-6px',
    textShadow: '0 0 80px rgba(232,97,26,0.25)',
  },
  lineBot: {
    width: '100%', height: '3px',
    margin: '8px 0 8px',
    background: 'linear-gradient(90deg, rgba(255,255,255,0.05), rgba(255,255,255,0.25) 25%, rgba(255,255,255,0.45) 45%, rgba(232,97,26,0.6) 70%, rgba(232,97,26,0.25) 88%, transparent)',
    borderRadius: '2px',
  },
  tagline: {
    fontSize: '20px', fontWeight: 400,
    fontStyle: 'italic' as const,
    letterSpacing: '3px',
    color: 'rgba(180,180,180,0.55)',
    textAlign: 'right' as const,
    paddingRight: '4px',
  },
  statusBar: {
    position: 'fixed' as const,
    bottom: 0, left: 0, right: 0,
    height: '32px',
    display: 'flex' as const,
    alignItems: 'center' as const,
    justifyContent: 'flex-end' as const,
    padding: '0 32px',
    background: 'rgba(0,0,0,0.6)',
    borderTop: `1px solid ${L.w04}`,
    zIndex: 10,
  },
  statusL: {
    fontSize: '10px',
    color: 'rgba(255,255,255,0.15)',
    letterSpacing: '0.5px',
    display: 'flex' as const,
    alignItems: 'center' as const,
    gap: '6px',
  },
  statusR: {
    fontSize: '9px',
    color: 'rgba(255,255,255,0.40)',
    letterSpacing: '0.3px',
    textAlign: 'right' as const,
    fontWeight: 400,
  },
  dot: {
    display: 'inline-block',
    width: '5px', height: '5px',
    borderRadius: '50%',
    background: L.green,
    boxShadow: '0 0 6px rgba(46,204,113,0.4)',
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
  const { user, loading, loginWithGoogleIdToken, getRutaInicial } = useAuthContext()
  const navigate = useNavigate()
  const googleBtnRef = useRef<HTMLDivElement>(null)
  const hiddenGoogleRef = useRef<HTMLDivElement>(null)

  useEffect(() => { injectKF() }, [])

  useEffect(() => {
    if (!loading && user) {
      navigate(getRutaInicial(), { replace: true })
    }
  }, [loading, user])

  useEffect(() => {
    const loadGSI = () => {
      const existing = document.getElementById('gsi-script')
      if (existing && !window.google?.accounts?.id) existing.remove()
      if (!document.getElementById('gsi-script')) {
        const s = document.createElement('script')
        s.id = 'gsi-script'
        s.src = 'https://accounts.google.com/gsi/client'
        s.async = true
        s.onload = () => setTimeout(initGSI, 100)
        document.head.appendChild(s)
      } else if (window.google?.accounts?.id) {
        initGSI()
      }
    }
    loadGSI()
  }, [])

  const initGSI = () => {
    if (!window.google?.accounts?.id) return
    try {
      window.google.accounts.id.initialize({
        client_id: GOOGLE_CLIENT_ID,
        callback: handleCredential,
        auto_select: false,
      })
      if (hiddenGoogleRef.current) {
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
    } catch (e) {
      console.error('GSI init error:', e)
    }
  }

  const handleCredential = async (response: { credential: string }) => {
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

  const triggerGoogleSignIn = () => {
    if (hiddenGoogleRef.current) {
      const btn = hiddenGoogleRef.current.querySelector('div[role="button"]') as HTMLElement
      if (btn) {
        btn.click()
        return
      }
    }
    if (window.google?.accounts?.id) {
      window.google.accounts.id.prompt()
    }
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
          <feTurbulence type="fractalNoise" baseFrequency="0.65" numOctaves="3" stitchTiles="stitch" />
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

          {/* Hidden Google button for auth flow */}
          <div ref={hiddenGoogleRef} style={{ position: 'absolute', opacity: 0, pointerEvents: 'none', height: 0, overflow: 'hidden' }} />

          {/* Custom blue Google button */}
          <button
            style={{
              ...S.customBtn,
              background: hover ? '#3B78E7' : '#4285F4',
              boxShadow: hover
                ? '0 6px 32px rgba(66,133,244,0.40), 0 1px 0 rgba(255,255,255,0.15) inset'
                : '0 4px 24px rgba(66,133,244,0.30), 0 1px 0 rgba(255,255,255,0.10) inset',
              transform: hover ? 'translateY(-1px)' : 'none',
            }}
            onMouseEnter={() => setHover(true)}
            onMouseLeave={() => setHover(false)}
            onClick={triggerGoogleSignIn}
          >
            <svg width="26" height="26" viewBox="0 0 24 24" style={{ filter: 'drop-shadow(0 1px 2px rgba(0,0,0,0.2))' }}>
              <path fill="#FF5200" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z"/>
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
            </svg>
            Iniciar Sesi{"\u00f3"}n
          </button>

          {googleLoading && (
            <div style={S.loadingBox}>
        &           <div style={S.spinner} />
              <span style={S.loadingText}>Autenticando...</span>
            </div>
          )}
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
          Grupo Loma 2026 {"\u00b7"} <a href="mailto:hola@trob.com.mx" onDoubleClick={(e) => { e.preventDefault(); navigator.clipboard.writeText('hola@trob.com.mx') }} style={{ color: 'inherit', textDecoration: 'none', cursor: 'pointer' }}>hola@trob.com.mx</a> {"\u00b7"} Operaci{"\u00f3"}n inteligente... Resultados reales
        </span>
      </div>
    </div>
  )
}
