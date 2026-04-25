import { useState, useEffect, useRef, useCallback } from 'react'
import type React from 'react'
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

// V3.2 — Delay 1s + Btn -20% width + G icon +25% + Footer armonizado
const L = {
  bg: '#050508',
  orange: '#E8611A',
  orangeBright: '#FF7A2E',
  white: '#FAFAFA',
  btn: '#18181D',
  font: "'Montserrat', -apple-system, BlinkMacSystemFont, sans-serif",
  mono: "'Menlo', 'Consolas', 'SF Mono', monospace",
} as const

const KF = `
@keyframes lhSeqUp {
  0% { opacity: 0; transform: translateY(14px); filter: blur(2px); }
  100% { opacity: 1; transform: translateY(0); filter: blur(0); }
}
@keyframes lhLineSweep {
  0% { left: -30%; }
  100% { left: 130%; }
}
@keyframes lhMoireAppear {
  0% { opacity: 0; }
  100% { opacity: 1; }
}
@keyframes lhMoireSpin {
  to { transform: rotate(360deg); }
}
@keyframes lhMoireFadeO {
  0%, 100% { opacity: 0.30; }
  50% { opacity: 1; }
}
@keyframes lhMoireFadeW {
  0%, 100% { opacity: 0.25; }
  50% { opacity: 1; }
}
@keyframes lhMoireFadeB {
  0%, 100% { opacity: 0.20; }
  50% { opacity: 0.85; }
}
@keyframes lhDotPulse {
  0%, 100% { opacity: 0.55; }
  50% { opacity: 1; }
}
@keyframes lhSpin {
  to { transform: rotate(360deg) }
}
@keyframes lhGlowBreathe {
  0%, 100% { opacity: 0.6; transform: translate(-50%, -50%) scale(1); }
  50% { opacity: 1; transform: translate(-50%, -50%) scale(1.06); }
}
`

function injectKF() {
  if (typeof document === 'undefined') return
  if (document.getElementById('lh-login-kf')) return
  const el = document.createElement('style')
  el.id = 'lh-login-kf'
  el.textContent = KF
  document.head.appendChild(el)
}

const S = {
  pageLoading: {
    display: 'flex' as const,
    justifyContent: 'center' as const,
    alignItems: 'center' as const,
    height: '100vh',
    background: L.bg,
    fontFamily: L.font,
  },
  page: {
    width: '100%',
    height: '100vh',
    background: L.bg,
    fontFamily: L.font,
    position: 'relative' as const,
    overflow: 'hidden' as const,
  },
  moireWrap: {
    position: 'absolute' as const,
    inset: '-10%',
    opacity: 0,
    animation: 'lhMoireAppear 3s ease 6s forwards, lhMoireSpin 120s linear 9s infinite',
    pointerEvents: 'none' as const,
    zIndex: 1,
  },
  moireLayerBase: {
    position: 'absolute' as const,
    inset: 0,
    maskImage: 'radial-gradient(ellipse at center, black 20%, transparent 75%)',
    WebkitMaskImage: 'radial-gradient(ellipse at center, black 20%, transparent 75%)',
  },
  moireOrange: {
    backgroundImage:
      'linear-gradient(rgba(232, 97, 26, 0.07) 1px, transparent 1px), linear-gradient(90deg, rgba(232, 97, 26, 0.07) 1px, transparent 1px)',
    backgroundSize: '80px 80px',
    animation: 'lhMoireFadeO 19s ease-in-out 9s infinite',
  },
  moireWhite: {
    backgroundImage:
      'linear-gradient(rgba(255, 255, 255, 0.045) 1px, transparent 1px), linear-gradient(90deg, rgba(255, 255, 255, 0.045) 1px, transparent 1px)',
    backgroundSize: '40px 40px',
    animation: 'lhMoireFadeW 19s ease-in-out 9s infinite reverse',
  },
  moireBlue: {
    backgroundImage:
      'linear-gradient(rgba(100, 150, 220, 0.06) 1px, transparent 1px), linear-gradient(90deg, rgba(100, 150, 220, 0.06) 1px, transparent 1px)',
    backgroundSize: '60px 60px',
    animation: 'lhMoireFadeB 19s ease-in-out 10.5s infinite',
  },
  glow: {
    position: 'absolute' as const,
    left: '35%',
    top: '50%',
    transform: 'translate(-50%, -50%)',
    width: '780px',
    height: '460px',
    background:
      'radial-gradient(ellipse at center, rgba(232, 97, 26, 0.14), transparent 60%)',
    filter: 'blur(40px)',
    pointerEvents: 'none' as const,
    animation: 'lhSeqUp 1.4s ease 1s both, lhGlowBreathe 7s ease-in-out 5s infinite',
    zIndex: 0,
  },
  content: {
    position: 'relative' as const,
    zIndex: 5,
    height: '100%',
    display: 'grid' as const,
    gridTemplateColumns: '1.1fr 0.9fr',
    alignItems: 'center' as const,
    padding: '0 7%',
  },
  logoWrap: {
    display: 'flex' as const,
    flexDirection: 'column' as const,
    alignItems: 'flex-start' as const,
    position: 'relative' as const,
  },
  logoLineTop: {
    width: '100%',
    height: '1px',
    position: 'relative' as const,
    background:
      'linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.18) 25%, rgba(255,255,255,0.28) 55%, rgba(232,97,26,0.55) 92%, transparent 100%)',
    overflow: 'hidden' as const,
    marginBottom: '18px',
    animation: 'lhSeqUp 1.1s ease 1.4s both',
  },
  logoLineBot: {
    width: '100%',
    height: '1px',
    position: 'relative' as const,
    background:
      'linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.18) 25%, rgba(255,255,255,0.28) 55%, rgba(232,97,26,0.55) 92%, transparent 100%)',
    overflow: 'hidden' as const,
    marginTop: '14px',
    animation: 'lhSeqUp 1.1s ease 2.3s both',
  },
  logoLineSweep: {
    position: 'absolute' as const,
    top: 0,
    left: '-30%',
    width: '30%',
    height: '100%',
    background:
      'linear-gradient(90deg, transparent, rgba(255,255,255,0.9), transparent)',
    animation: 'lhLineSweep 8s linear 5s infinite',
  },
  logoLineSweepBot: {
    position: 'absolute' as const,
    top: 0,
    left: '-30%',
    width: '30%',
    height: '100%',
    background:
      'linear-gradient(90deg, transparent, rgba(255,255,255,0.9), transparent)',
    animation: 'lhLineSweep 8s linear 9s infinite',
  },
  logoRow: {
    fontFamily: L.font,
    fontWeight: 900,
    fontStyle: 'italic' as const,
    letterSpacing: '-0.035em',
    lineHeight: 0.92,
    whiteSpace: 'nowrap' as const,
    fontSize: 'clamp(64px, 7.4vw, 112px)',
    display: 'flex' as const,
    alignItems: 'baseline' as const,
    animation: 'lhSeqUp 1.2s ease 1.9s both',
  },
  logoWhite: { color: L.white },
  logoOrange: { color: L.orange },
  logoTag: {
    fontFamily: 'Inter, system-ui, sans-serif',
    fontStyle: 'italic' as const,
    fontWeight: 300,
    color: 'rgba(255,255,255,0.55)',
    letterSpacing: '0.04em',
    fontSize: '23px',
    marginTop: '10px',
    alignSelf: 'flex-end' as const,
    animation: 'lhSeqUp 1s ease 2.7s both',
  },
  logoSpec: {
    marginTop: '22px',
    fontSize: '11px',
    fontWeight: 600,
    letterSpacing: '2.6px',
    textTransform: 'uppercase' as const,
    color: 'rgba(255, 255, 255, 0.45)',
    fontFamily: L.mono,
    animation: 'lhSeqUp 1s ease 3s both',
  },
  loginBlock: {
    display: 'flex' as const,
    flexDirection: 'column' as const,
    justifySelf: 'end' as const,
    alignItems: 'stretch' as const,
    width: '100%',
    maxWidth: '460px',
  },
  loginH: {
    fontFamily: L.font,
    fontWeight: 600,
    fontSize: '29px',
    color: 'rgba(255, 255, 255, 0.94)',
    marginBottom: '28px',
    letterSpacing: '-0.02em',
    animation: 'lhSeqUp 1s ease 3.4s both',
    textAlign: 'center' as const,
  },
  // Wrapper para centrar el botón al 80%
  gbtnWrap: {
    width: '100%',
    display: 'flex' as const,
    justifyContent: 'center' as const,
    animation: 'lhSeqUp 1.1s ease 3.8s both',
  },
  // V27 — Remember me toggle (iOS-style switch + label)
  rememberWrap: {
    width: '80%',
    margin: '14px auto 0',
    display: 'flex' as const,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
    gap: '12px',
    cursor: 'pointer' as const,
    userSelect: 'none' as const,
    animation: 'lhSeqUp 1.1s ease 4.1s both',
  },
  rememberLabel: {
    fontFamily: L.font,
    fontSize: '13px',
    fontWeight: 500,
    color: 'rgba(250,250,250,0.78)',
    letterSpacing: '0.01em',
    transition: 'color 0.22s ease',
  },
  rememberLabelActive: {
    color: L.orangeBright,
  },
  switchTrack: (active: boolean): React.CSSProperties => ({
    width: '40px',
    height: '22px',
    borderRadius: '999px',
    background: active
      ? `linear-gradient(135deg, ${L.orange} 0%, ${L.orangeBright} 100%)`
      : 'rgba(255,255,255,0.12)',
    border: active
      ? '1px solid rgba(255,180,120,0.5)'
      : '1px solid rgba(255,255,255,0.18)',
    position: 'relative',
    transition: 'background 0.25s ease, border-color 0.25s ease',
    boxShadow: active
      ? '0 0 14px rgba(232,97,26,0.35), inset 0 1px 2px rgba(0,0,0,0.18)'
      : 'inset 0 1px 2px rgba(0,0,0,0.35)',
    flexShrink: 0,
  }),
  switchThumb: (active: boolean): React.CSSProperties => ({
    position: 'absolute',
    top: '2px',
    left: active ? '20px' : '2px',
    width: '16px',
    height: '16px',
    borderRadius: '999px',
    background: '#FFFFFF',
    transition: 'left 0.25s cubic-bezier(0.4,0,0.2,1), transform 0.2s ease',
    boxShadow: '0 2px 4px rgba(0,0,0,0.4), 0 0 0 0.5px rgba(0,0,0,0.05)',
  }),
  // Botón -20% de ancho (80% del bloque) manteniendo height
  gbtn: {
    display: 'inline-flex' as const,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
    gap: '14px',
    width: '80%',
    padding: '0 20px',
    height: '68px',
    background: L.btn,
    color: 'rgba(255, 255, 255, 0.94)',
    border: '1px solid rgba(255, 255, 255, 0.08)',
    borderRadius: '13px',
    fontFamily: 'Inter, system-ui, sans-serif',
    fontSize: '17px',
    fontWeight: 500,
    cursor: 'pointer' as const,
    position: 'relative' as const,
    overflow: 'hidden' as const,
    boxShadow:
      'inset 0 1px 0 rgba(255,255,255,0.08), inset 0 -1px 0 rgba(0,0,0,0.35), 0 2px 0 rgba(0,0,0,0.4), 0 10px 24px rgba(0,0,0,0.55)',
    transition: 'all 0.35s cubic-bezier(.2,.7,.2,1)',
  },
  gbtnHover: {
    background: `linear-gradient(135deg, ${L.orange}, ${L.orangeBright})`,
    borderColor: L.orange,
    transform: 'translateY(-2px) scale(1.012)',
    boxShadow:
      'inset 0 1px 0 rgba(255,255,255,0.25), 0 4px 0 rgba(0,0,0,0.4), 0 18px 42px rgba(232, 97, 26, 0.55), 0 0 0 1px rgba(232, 97, 26, 0.45)',
    color: '#ffffff',
  },
  // G icon +25% (26 -> 32)
  gIconSlot: {
    position: 'relative' as const,
    width: '32px',
    height: '32px',
    display: 'flex' as const,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
    flexShrink: 0,
  },
  gIconLayer: {
    position: 'absolute' as const,
    inset: 0,
    display: 'flex' as const,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
    transition: 'opacity 0.35s cubic-bezier(.2,.7,.2,1)',
  },
  divider: {
    display: 'flex' as const,
    alignItems: 'center' as const,
    gap: '14px',
    marginTop: '22px',
    fontSize: '10px',
    letterSpacing: '3.6px',
    color: 'rgba(255, 255, 255, 0.38)',
    textTransform: 'uppercase' as const,
    fontWeight: 600,
    animation: 'lhSeqUp 1s ease 4.2s both',
  },
  dividerLine: {
    flex: 1,
    height: '1px',
    background:
      'linear-gradient(90deg, transparent, rgba(255,255,255,0.1), transparent)',
  },
  secure: {
    display: 'flex' as const,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
    gap: '7px',
    marginTop: '12px',
    fontSize: '12px',
    color: 'rgba(255, 255, 255, 0.55)',
    fontWeight: 400,
    animation: 'lhSeqUp 1s ease 4.5s both',
  },
  errorBox: {
    marginTop: '14px',
    display: 'flex' as const,
    alignItems: 'flex-start' as const,
    gap: '8px',
    padding: '12px 14px',
    background: 'rgba(197, 48, 48, 0.10)',
    border: '1px solid rgba(197, 48, 48, 0.30)',
    borderRadius: '8px',
    color: '#F29090',
    fontSize: '13px',
    lineHeight: 1.4,
  },
  versionTag: {
    position: 'absolute' as const,
    bottom: '14px',
    left: '22px',
    display: 'flex' as const,
    alignItems: 'center' as const,
    gap: '8px',
    fontSize: '10px',
    fontWeight: 600,
    letterSpacing: '2.4px',
    fontFamily: L.mono,
    color: 'rgba(232, 97, 26, 0.7)',
    textTransform: 'uppercase' as const,
    zIndex: 10,
    animation: 'lhSeqUp 1s ease 4.8s both',
  },
  versionDot: {
    width: '6px',
    height: '6px',
    borderRadius: '50%',
    background: L.orange,
    boxShadow: '0 0 6px rgba(232, 97, 26, 0.7)',
    animation: 'lhDotPulse 3s ease-in-out 5.5s infinite',
  },
  versionPipe: { color: 'rgba(255, 255, 255, 0.2)', fontWeight: 400 },
  versionLabel: { color: 'rgba(255, 255, 255, 0.5)' },
  // Footer armonizado con Acceso Autorizado / Conexión Cifrada
  footer: {
    position: 'absolute' as const,
    bottom: '14px',
    right: '22px',
    fontSize: '11px',
    color: 'rgba(255, 255, 255, 0.45)',
    letterSpacing: '1px',
    fontWeight: 400,
    zIndex: 10,
    animation: 'lhSeqUp 1s ease 5s both',
  },
  footerEmail: {
    color: 'rgba(255, 255, 255, 0.55)',
    textDecoration: 'none' as const,
    cursor: 'pointer' as const,
    transition: 'color 0.2s ease',
    fontWeight: 500,
  },
  hiddenGsi: {
    position: 'absolute' as const,
    opacity: 0,
    pointerEvents: 'none' as const,
    zIndex: -1,
    width: '1px',
    height: '1px',
    overflow: 'hidden' as const,
  },
  spinner: {
    width: '18px',
    height: '18px',
    border: '2px solid rgba(255,255,255,0.2)',
    borderTopColor: L.orange,
    borderRadius: '50%',
    animation: 'lhSpin 0.9s linear infinite',
  },
}

function GoogleGColor() {
  return (
    <svg width="30" height="30" viewBox="0 0 48 48" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
      <path fill="#FFC107" d="M43.611 20.083H42V20H24v8h11.303c-1.649 4.657-6.08 8-11.303 8-6.627 0-12-5.373-12-12s5.373-12 12-12c3.059 0 5.842 1.154 7.961 3.039l5.657-5.657C34.046 6.053 29.268 4 24 4 12.955 4 4 12.955 4 24s8.955 20 20 20 20-8.955 20-20c0-1.341-.138-2.65-.389-3.917z"/>
      <path fill="#FF3D00" d="M6.306 14.691l6.571 4.819C14.655 15.108 18.961 12 24 12c3.059 0 5.842 1.154 7.961 3.039l5.657-5.657C34.046 6.053 29.268 4 24 4 16.318 4 9.656 8.337 6.306 14.691z"/>
      <path fill="#4CAF50" d="M24 44c5.166 0 9.86-1.977 13.409-5.192l-6.19-5.238C29.211 35.091 26.715 36 24 36c-5.202 0-9.619-3.317-11.283-7.946l-6.522 5.025C9.505 39.556 16.227 44 24 44z"/>
      <path fill="#1976D2" d="M43.611 20.083H42V20H24v8h11.303c-.792 2.237-2.231 4.166-4.087 5.571l6.19 5.238C36.971 39.205 44 34 44 24c0-1.341-.138-2.65-.389-3.917z"/>
    </svg>
  )
}
function GoogleGWhite() {
  return (
    <svg width="30" height="30" viewBox="0 0 48 48" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
      <path fill="#ffffff" d="M43.611 20.083H42V20H24v8h11.303c-1.649 4.657-6.08 8-11.303 8-6.627 0-12-5.373-12-12s5.373-12 12-12c3.059 0 5.842 1.154 7.961 3.039l5.657-5.657C34.046 6.053 29.268 4 24 4 12.955 4 4 12.955 4 24s8.955 20 20 20 20-8.955 20-20c0-1.341-.138-2.65-.389-3.917z"/>
    </svg>
  )
}

export default function Login() {
  const [error, setError] = useState('')
  const [googleLoading, setGoogleLoading] = useState(false)
  const [hover, setHover] = useState(false)
  /* V27 — Recordar mi sesion: lee de localStorage, default TRUE (mejor UX para retornos frecuentes) */
  const [rememberMe, setRememberMe] = useState<boolean>(() => {
    try { return localStorage.getItem('lhub-remember') !== 'false' } catch { return true }
  })
  const { user, loading, loginWithGoogleIdToken, getRutaInicial } = useAuthContext()
  const navigate = useNavigate()
  const hiddenGoogleRef = useRef<HTMLDivElement>(null)
  const playClickRef = useRef<() => void>(() => {})

  /* V46.2 — Click sintético "premium tactile" (WebAudio API, sin archivo extra) */
  useEffect(() => {
    let ctx: AudioContext | null = null
    playClickRef.current = () => {
      try {
        if (!ctx) {
          const AC = (window as any).AudioContext || (window as any).webkitAudioContext
          if (!AC) return
          ctx = new AC()
        }
        const c = ctx!
        const now = c.currentTime
        // Tono cristalino — sine 1200Hz, envelope decay 90ms
        const osc = c.createOscillator()
        osc.type = 'sine'
        osc.frequency.setValueAtTime(1400, now)
        osc.frequency.exponentialRampToValueAtTime(900, now + 0.08)
        const oscGain = c.createGain()
        oscGain.gain.setValueAtTime(0.0, now)
        oscGain.gain.linearRampToValueAtTime(0.32, now + 0.002)
        oscGain.gain.exponentialRampToValueAtTime(0.0001, now + 0.10)
        osc.connect(oscGain).connect(c.destination)
        osc.start(now); osc.stop(now + 0.12)
        // Burst de ruido alto-paso 6kHz para textura "tactile"
        const buf = c.createBuffer(1, c.sampleRate * 0.04, c.sampleRate)
        const data = buf.getChannelData(0)
        for (let i = 0; i < data.length; i++) data[i] = (Math.random() * 2 - 1) * (1 - i / data.length)
        const noise = c.createBufferSource()
        noise.buffer = buf
        const hp = c.createBiquadFilter()
        hp.type = 'highpass'; hp.frequency.value = 6000
        const noiseGain = c.createGain()
        noiseGain.gain.setValueAtTime(0.18, now)
        noiseGain.gain.exponentialRampToValueAtTime(0.0001, now + 0.04)
        noise.connect(hp).connect(noiseGain).connect(c.destination)
        noise.start(now); noise.stop(now + 0.05)
      } catch { /* noop */ }
    }
    return () => { try { ctx?.close() } catch { /* noop */ } }
  }, [])

  useEffect(() => { injectKF() }, [])

  /* V46.1 — Audio intro: autoplay + loop, stop al primer click anywhere (25/Abr/2026) */
  useEffect(() => {
    const audio = new Audio('/audio/intro_login.ogg')
    audio.loop = true
    audio.volume = 0.47
    audio.preload = 'auto'
    let stopped = false
    const stop = () => {
      if (stopped) return
      stopped = true
      try { audio.pause(); audio.currentTime = 0 } catch { /* noop */ }
      document.removeEventListener('click', stop, true)
      document.removeEventListener('keydown', stop, true)
      document.removeEventListener('touchstart', stop, true)
    }
    // Intentar autoplay; algunos browsers lo bloquean — fallback silencioso
    const tryPlay = () => audio.play().catch(() => { /* autoplay blocked */ })
    tryPlay()
    // Fallback: si autoplay bloqueado, primer mousemove inicia
    let started = false
    const startOnInteract = () => {
      if (started) return
      started = true
      tryPlay()
      document.removeEventListener('mousemove', startOnInteract, true)
      document.removeEventListener('pointerdown', startOnInteract, true)
    }
    document.addEventListener('mousemove', startOnInteract, true)
    document.addEventListener('pointerdown', startOnInteract, true)
    // Stop en primer click/key/touch
    document.addEventListener('click', stop, true)
    document.addEventListener('keydown', stop, true)
    document.addEventListener('touchstart', stop, true)
    return () => {
      stop()
      document.removeEventListener('mousemove', startOnInteract, true)
      document.removeEventListener('pointerdown', startOnInteract, true)
    }
  }, [])

  /* V27 — persistir rememberMe en cada cambio */
  useEffect(() => {
    try { localStorage.setItem('lhub-remember', rememberMe ? 'true' : 'false') } catch { /* noop */ }
  }, [rememberMe])

  useEffect(() => {
    if (!loading && user) {
      navigate(getRutaInicial(), { replace: true })
    }
  }, [loading, user, navigate, getRutaInicial])

  const handleCredential = useCallback(
    async (response: any) => {
      setError('')
      setGoogleLoading(true)
      try {
        await loginWithGoogleIdToken(response.credential)
      } catch (err: any) {
        setError(err?.message || 'Error al iniciar sesi\u00f3n con Google')
      } finally {
        setGoogleLoading(false)
      }
    },
    [loginWithGoogleIdToken],
  )

  useEffect(() => {
    let mounted = true
    const existing = document.querySelector<HTMLScriptElement>('script[data-gsi="1"]')
    const initGsi = () => {
      if (!mounted) return
      if (!window.google?.accounts?.id) return
      try {
        window.google.accounts.id.initialize({
          client_id: GOOGLE_CLIENT_ID,
          callback: handleCredential,
          /* V27 — auto_select ligado a rememberMe: si usuario marco "Recordar", Google auto-selecciona su cuenta */
          auto_select: rememberMe,
          cancel_on_tap_outside: true,
          itp_support: true,
        })
        if (hiddenGoogleRef.current) {
          hiddenGoogleRef.current.innerHTML = ''
          window.google.accounts.id.renderButton(hiddenGoogleRef.current, {
            type: 'standard',
            theme: 'filled_black',
            size: 'large',
            text: 'continue_with',
            shape: 'rectangular',
            logo_alignment: 'left',
            width: 320,
          })
        }
      } catch (_err) { /* noop */ }
    }

    if (existing && window.google?.accounts?.id) {
      initGsi()
    } else if (!existing) {
      const s = document.createElement('script')
      s.src = 'https://accounts.google.com/gsi/client?t=' + Date.now()
      s.async = true
      s.defer = true
      s.setAttribute('data-gsi', '1')
      s.onload = () => {
        let tries = 0
        const waitG = () => {
          if (!mounted) return
          if (window.google?.accounts?.id) { initGsi(); return }
          tries += 1
          if (tries < 20) setTimeout(waitG, 100)
        }
        waitG()
      }
      document.head.appendChild(s)
    } else {
      let tries = 0
      const waitG = () => {
        if (!mounted) return
        if (window.google?.accounts?.id) { initGsi(); return }
        tries += 1
        if (tries < 20) setTimeout(waitG, 100)
      }
      waitG()
    }

    return () => { mounted = false }
  }, [handleCredential, rememberMe])

  const triggerGoogle = () => {
    setError('')
    try { playClickRef.current && playClickRef.current() } catch { /* noop */ }
    const node = hiddenGoogleRef.current
    if (!node) return
    const realBtn =
      node.querySelector<HTMLElement>('[role="button"]') ||
      node.querySelector<HTMLElement>('div[aria-labelledby]') ||
      node.querySelector<HTMLElement>('button')
    if (realBtn) { realBtn.click(); return }
    try { window.google?.accounts?.id?.prompt() } catch (_e) { /* noop */ }
  }

  if (loading) {
    return (
      <div style={S.pageLoading}>
        <div style={S.spinner} />
      </div>
    )
  }

  const gbtnStyle = hover ? { ...S.gbtn, ...S.gbtnHover } : S.gbtn

  const now = new Date()
  const versionStr =
    String(now.getFullYear()).slice(2) +
    '.' +
    String(now.getMonth() + 1).padStart(2, '0') +
    '.' +
    String(now.getDate()).padStart(2, '0')

  return (
    <div style={S.page}>
      <div style={S.glow} />

      <div style={S.moireWrap}>
        <div style={{ ...S.moireLayerBase, ...S.moireOrange }} />
        <div style={{ ...S.moireLayerBase, ...S.moireWhite }} />
        <div style={{ ...S.moireLayerBase, ...S.moireBlue }} />
      </div>

      <div style={S.content}>
        <div style={S.logoWrap}>
          <div style={S.logoLineTop}>
            <span style={S.logoLineSweep} />
          </div>
          <div style={S.logoRow}>
            <span style={S.logoWhite}>LomaHUB</span>
            <span style={S.logoOrange}>27</span>
          </div>
          <div style={S.logoLineBot}>
            <span style={S.logoLineSweepBot} />
          </div>
          <div style={S.logoTag}>Future Experience</div>
          <div style={S.logoSpec}>
            TROB {'\u00b7'} OPS-V2 {'\u00b7'} 2026 EDITION
          </div>
        </div>

        <div style={S.loginBlock}>
          <h2 style={S.loginH}>Bienvenido</h2>

          <div style={S.gbtnWrap}>
            <button
              type="button"
              style={gbtnStyle}
              onMouseEnter={() => setHover(true)}
              onMouseLeave={() => setHover(false)}
              onClick={triggerGoogle}
              disabled={googleLoading}
            >
              <span style={S.gIconSlot}>
                <span style={{ ...S.gIconLayer, opacity: hover ? 0 : 1 }}>
                  <GoogleGColor />
                </span>
                <span style={{ ...S.gIconLayer, opacity: hover ? 1 : 0 }}>
                  <GoogleGWhite />
                </span>
              </span>
              <span>
                {googleLoading ? 'Conectando...' : 'Continuar con Google'}
              </span>
            </button>
          </div>

          {/* V27 — Toggle "Recordar mi sesion" — visible y contundente */}
          <div
            style={S.rememberWrap}
            onClick={() => setRememberMe(v => !v)}
            role="switch"
            aria-checked={rememberMe}
            tabIndex={0}
            onKeyDown={(e) => {
              if (e.key === ' ' || e.key === 'Enter') {
                e.preventDefault()
                setRememberMe(v => !v)
              }
            }}
          >
            <div style={S.switchTrack(rememberMe)}>
              <div style={S.switchThumb(rememberMe)} />
            </div>
            <span style={{ ...S.rememberLabel, ...(rememberMe ? S.rememberLabelActive : {}) }}>
              Recordar mi sesi{'\u00f3'}n
            </span>
          </div>

          {error && (
            <div style={S.errorBox}>
              <AlertCircle size={16} style={{ marginTop: '1px', flexShrink: 0 }} />
              <span>{error}</span>
            </div>
          )}

          <div style={S.divider}>
            <span style={S.dividerLine} />
            Acceso Autorizado
            <span style={S.dividerLine} />
          </div>
          <div style={S.secure}>
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
              <rect x="5" y="11" width="14" height="9" rx="2" />
              <path d="M8 11V7a4 4 0 0 1 8 0v4" />
            </svg>
            Conexi{'\u00f3'}n cifrada {'\u00b7'} Solo personal autorizado
          </div>

          <div ref={hiddenGoogleRef} style={S.hiddenGsi} aria-hidden="true" />
        </div>
      </div>

      <div style={S.versionTag}>
        <span style={S.versionDot} />
        <span>V2</span>
        <span style={S.versionPipe}>|</span>
        <span>{versionStr}</span>
        <span style={S.versionPipe}>|</span>
        <span style={S.versionLabel}>LIVE</span>
      </div>

      <div style={S.footer}>
        Grupo Loma 2026 {'\u00b7'}{' '}
        <a
          href="mailto:hola@trob.com.mx"
          style={S.footerEmail}
          onDoubleClick={(e) => {
            e.preventDefault()
            navigator.clipboard?.writeText('hola@trob.com.mx')
          }}
        >
          hola@trob.com.mx
        </a>{' '}
        {'\u00b7'} Operaci{'\u00f3'}n inteligente {'\u00b7'} Resultados reales
      </div>
    </div>
  )
}
