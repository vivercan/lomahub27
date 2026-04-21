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

// ============================================================
// BLUEPRINT V2.3 — design tokens (10 refinements)
// ============================================================
const L = {
  bg: '#050505',
  orange: '#E8611A',
  orangeBright: '#FF7A2E',
  orangeGlow: 'rgba(232, 97, 26, 0.22)',
  orangeSoft: 'rgba(232, 97, 26, 0.13)',
  orangeBorder: 'rgba(232, 97, 26, 0.28)',
  orangeTick: 'rgba(232, 97, 26, 0.55)',
  orangeBtnBorder: 'rgba(232, 97, 26, 0.25)',
  orangeCardBloom: 'rgba(232, 97, 26, 0.15)',
  orangeFocus: 'rgba(232, 97, 26, 0.08)',
  gridMajor: 'rgba(232, 97, 26, 0.045)',
  gridMinor: 'rgba(255, 255, 255, 0.022)',
  w92: 'rgba(255,255,255,0.92)',
  w70: 'rgba(255,255,255,0.70)',
  w50: 'rgba(255,255,255,0.50)',
  w48: 'rgba(255,255,255,0.48)',
  w35: 'rgba(255,255,255,0.35)',
  w20: 'rgba(255,255,255,0.20)',
  w15: 'rgba(255,255,255,0.15)',
  w12: 'rgba(255,255,255,0.12)',
  w10: 'rgba(255,255,255,0.10)',
  w08: 'rgba(255,255,255,0.08)',
  w06: 'rgba(255,255,255,0.06)',
  w05: 'rgba(255,255,255,0.05)',
  w04: 'rgba(255,255,255,0.04)',
  w03: 'rgba(255,255,255,0.03)',
  w02: 'rgba(255,255,255,0.02)',
  red: '#C53030',
  font: "'Montserrat', -apple-system, BlinkMacSystemFont, sans-serif",
  mono: "'Menlo', 'Consolas', 'SF Mono', monospace",
} as const

const KF = `
@keyframes lhFadeIn { from { opacity: 0 } to { opacity: 1 } }
@keyframes lhLogoEnter {
  from { opacity: 0; letter-spacing: 0px; }
  to { opacity: 1; letter-spacing: -6px; }
}
@keyframes lhCardEnter {
  from { opacity: 0; transform: translateY(14px) scale(0.985); }
  to { opacity: 1; transform: translateY(0) scale(1); }
}
@keyframes lhGridPulse {
  0%, 100% { opacity: 0.75 }
  50% { opacity: 1 }
}
@keyframes lhSpin { to { transform: rotate(360deg) } }
@keyframes lhCornerDraw {
  from { opacity: 0; transform: scale(0.85); }
  to { opacity: 1; transform: scale(1); }
}
@keyframes lhShimmer {
  0% { transform: translateX(-120%); opacity: 0; }
  6% { opacity: 1; }
  55% { transform: translateX(460%); opacity: 1; }
  58% { opacity: 0; }
  100% { transform: translateX(460%); opacity: 0; }
}
@keyframes lhBreathe {
  0%, 100% { transform: scale(1); opacity: 0.85; }
  50% { transform: scale(1.06); opacity: 1; }
}
@keyframes lhVersionBlink {
  0%, 94%, 100% { opacity: 0.55; }
  96% { opacity: 0.95; }
  98% { opacity: 0.55; }
}
@keyframes lhBtnIdleShimmer {
  0%, 88% { left: -100%; opacity: 0; }
  89% { opacity: 0; }
  92% { opacity: 0.6; }
  100% { left: 130%; opacity: 0; }
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

// SVG grain datauri (turbulence 1.5% opacity, overlay blend)
const GRAIN_SVG =
  "url(\"data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='180' height='180'><filter id='n'><feTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='2' stitchTiles='stitch'/></filter><rect width='100%25' height='100%25' filter='url(%23n)' opacity='0.55'/></svg>\")"

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
  // Layer 0: vignette radial (dar teatro)
  vignette: {
    position: 'absolute' as const,
    inset: 0,
    background:
      'radial-gradient(ellipse at center, transparent 45%, rgba(0,0,0,0.55) 100%)',
    pointerEvents: 'none' as const,
    zIndex: 0,
  },
  // Layer 1: ambient glow (breathing)
  ambientGlow: {
    position: 'absolute' as const,
    inset: 0,
    background: `
      radial-gradient(ellipse 900px 560px at 28% 52%, ${L.orangeGlow}, transparent 58%),
      radial-gradient(ellipse 700px 460px at 76% 48%, ${L.orangeSoft}, transparent 58%)
    `,
    pointerEvents: 'none' as const,
    animation: 'lhBreathe 15s ease-in-out infinite',
    transformOrigin: '50% 50%' as const,
    zIndex: 0,
  },
  // Layer 2: grain texture (cinematic)
  grain: {
    position: 'absolute' as const,
    inset: 0,
    backgroundImage: GRAIN_SVG,
    opacity: 0.25,
    mixBlendMode: 'overlay' as const,
    pointerEvents: 'none' as const,
    zIndex: 0,
  },
  // Layer 3: blueprint grid
  gridLayer: {
    position: 'absolute' as const,
    inset: 0,
    backgroundImage: `
      linear-gradient(${L.gridMajor} 1px, transparent 1px),
      linear-gradient(90deg, ${L.gridMajor} 1px, transparent 1px),
      linear-gradient(${L.gridMinor} 1px, transparent 1px),
      linear-gradient(90deg, ${L.gridMinor} 1px, transparent 1px)
    `,
    backgroundSize: '100px 100px, 100px 100px, 20px 20px, 20px 20px',
    maskImage: 'radial-gradient(ellipse at center, black 45%, transparent 90%)',
    WebkitMaskImage: 'radial-gradient(ellipse at center, black 45%, transparent 90%)',
    animation: 'lhGridPulse 12s ease-in-out infinite',
    pointerEvents: 'none' as const,
    zIndex: 1,
  },
  // Layer 4: meridiano vertical central (tensión visual)
  meridian: {
    position: 'absolute' as const,
    left: '50%',
    top: '20%',
    bottom: '20%',
    width: '1px',
    background:
      'linear-gradient(180deg, transparent, rgba(232,97,26,0.10), rgba(255,255,255,0.05), rgba(232,97,26,0.10), transparent)',
    pointerEvents: 'none' as const,
    zIndex: 1,
    animation: 'lhFadeIn 1.5s ease 0.7s both',
  },
  // Focus light (aparece al hover card)
  cardFocusGlow: {
    position: 'absolute' as const,
    right: '6%',
    top: '50%',
    transform: 'translateY(-50%)',
    width: '520px',
    height: '520px',
    background:
      `radial-gradient(circle, ${L.orangeFocus}, transparent 65%)`,
    pointerEvents: 'none' as const,
    filter: 'blur(40px)',
    transition: 'opacity 0.6s cubic-bezier(.2,.7,.2,1)',
    zIndex: 1,
  },
  // Corners
  corner: {
    position: 'absolute' as const,
    width: '64px',
    height: '64px',
    border: `1px solid ${L.orangeBorder}`,
    pointerEvents: 'none' as const,
    animation: 'lhCornerDraw 0.8s cubic-bezier(.2,.7,.2,1) both',
    zIndex: 2,
  },
  cornerTL: { top: '28px', left: '28px', borderRight: 'none', borderBottom: 'none' },
  cornerTR: { top: '28px', right: '28px', borderLeft: 'none', borderBottom: 'none', animationDelay: '0.1s' },
  cornerBL: { bottom: '28px', left: '28px', borderRight: 'none', borderTop: 'none', animationDelay: '0.2s' },
  cornerBR: { bottom: '28px', right: '28px', borderLeft: 'none', borderTop: 'none', animationDelay: '0.3s' },
  cornerTick: {
    position: 'absolute' as const,
    fontSize: '8px',
    fontWeight: 600,
    letterSpacing: '1.5px',
    color: L.orangeTick,
    fontFamily: L.mono,
    pointerEvents: 'none' as const,
    animation: 'lhFadeIn 1.2s ease 0.6s both',
    zIndex: 3,
    display: 'flex' as const,
    alignItems: 'center' as const,
    gap: '4px',
  },
  tickTL: { top: '36px', left: '100px' },
  tickTR: { top: '36px', right: '100px' },
  tickBL: { bottom: '36px', left: '100px' },
  tickBR: { bottom: '36px', right: '100px' },
  tickMark: {
    display: 'inline-block' as const,
    width: '5px',
    height: '1px',
    background: L.orangeTick,
  },
  // Content grid
  content: {
    position: 'relative' as const,
    zIndex: 2,
    height: '100%',
    display: 'grid' as const,
    gridTemplateColumns: '1fr 1fr',
    alignItems: 'center' as const,
    padding: '0 8%',
  },
  logoWrap: {
    display: 'flex' as const,
    flexDirection: 'column' as const,
    alignItems: 'flex-start' as const,
    animation: 'lhFadeIn 1s ease both',
    position: 'relative' as const,
  },
  logoRow: {
    display: 'flex' as const,
    alignItems: 'baseline' as const,
    fontSize: 'clamp(68px, 7.8vw, 124px)',
    fontWeight: 900,
    fontStyle: 'italic' as const,
    letterSpacing: '-6px',
    lineHeight: 0.95,
    whiteSpace: 'nowrap' as const,
    animation: 'lhLogoEnter 1.2s cubic-bezier(.2,.7,.2,1) both',
  },
  logoWhite: { color: L.w92 },
  logoOrange: { color: L.orange, textShadow: `0 0 80px ${L.orangeGlow}` },
  logoLine: {
    position: 'relative' as const,
    width: '100%',
    height: '1px',
    background: `linear-gradient(90deg, transparent, ${L.w35}, ${L.orangeBorder}, transparent)`,
    marginTop: '14px',
    overflow: 'hidden' as const,
  },
  logoShimmer: {
    position: 'absolute' as const,
    top: 0,
    left: 0,
    width: '18%',
    height: '1px',
    background:
      'linear-gradient(90deg, transparent, rgba(255,200,150,0.9), #FF8A3E, rgba(255,200,150,0.9), transparent)',
    filter: 'blur(0.3px)',
    animation: 'lhShimmer 7s cubic-bezier(.35,.1,.25,1) infinite',
    pointerEvents: 'none' as const,
  },
  logoTag: {
    alignSelf: 'flex-end' as const,
    marginTop: '10px',
    fontSize: '15px',
    fontStyle: 'italic' as const,
    fontWeight: 300,
    color: L.w48,
    letterSpacing: '0.28em',
    textTransform: 'lowercase' as const,
  },
  logoSpec: {
    marginTop: '26px',
    fontSize: '10px',
    fontWeight: 600,
    letterSpacing: '2.4px',
    textTransform: 'uppercase' as const,
    color: 'rgba(232, 97, 26, 0.65)',
  },
  cardWrap: {
    display: 'flex' as const,
    justifyContent: 'flex-end' as const,
    position: 'relative' as const,
  },
  // ============== CARD WITH ARCHITECTURE ==============
  card: {
    width: '100%',
    maxWidth: '400px',
    position: 'relative' as const,
    background: `linear-gradient(180deg, ${L.w06} 0%, ${L.w04} 50%, ${L.w02} 100%)`,
    borderRadius: '18px',
    padding: '42px 38px 32px',
    boxShadow: `
      0 40px 100px rgba(0,0,0,0.7),
      inset 0 1px 0 rgba(255,255,255,0.12),
      inset 0 -1px 0 rgba(232,97,26,0.08)
    `,
    transition:
      'transform 0.5s cubic-bezier(.2,.7,.2,1), box-shadow 0.5s cubic-bezier(.2,.7,.2,1)',
    animation: 'lhCardEnter 0.8s cubic-bezier(.2,.7,.2,1) both',
    overflow: 'hidden' as const,
  },
  // Gradient border overlay (::before replacement via absolute div)
  cardBorder: {
    position: 'absolute' as const,
    inset: 0,
    borderRadius: '18px',
    padding: '1px',
    background:
      'linear-gradient(180deg, rgba(255,255,255,0.15) 0%, rgba(255,255,255,0.06) 50%, rgba(232,97,26,0.10) 100%)',
    WebkitMask:
      'linear-gradient(#000 0 0) content-box, linear-gradient(#000 0 0)',
    WebkitMaskComposite: 'xor',
    maskComposite: 'exclude' as const,
    pointerEvents: 'none' as const,
    zIndex: 1,
  },
  // Inner bloom (top-left corner warm fog)
  cardBloom: {
    position: 'absolute' as const,
    top: '-20%',
    left: '-10%',
    width: '60%',
    height: '60%',
    background: `radial-gradient(circle, ${L.orangeCardBloom}, transparent 65%)`,
    filter: 'blur(30px)',
    pointerEvents: 'none' as const,
    zIndex: 0,
    opacity: 0.6,
  },
  cardHover: {
    transform: 'translateY(-5px) scale(1.003)',
    boxShadow: `
      0 52px 110px rgba(0,0,0,0.8),
      inset 0 1px 0 rgba(255,255,255,0.16),
      inset 0 -1px 0 rgba(232,97,26,0.14),
      0 0 0 1px rgba(232,97,26,0.12)
    `,
  },
  cardContent: {
    position: 'relative' as const,
    zIndex: 2,
  },
  cardTitle: {
    fontSize: '22px',
    fontWeight: 600,
    color: L.w92,
    letterSpacing: '-0.015em',
    marginBottom: '8px',
  },
  cardSub: {
    fontSize: '12.5px',
    color: L.w50,
    marginBottom: '28px',
    fontWeight: 400,
  },
  // ============== GOOGLE BUTTON (HERO CTA) ==============
  gbtn: {
    position: 'relative' as const,
    overflow: 'hidden' as const,
    display: 'inline-flex' as const,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
    gap: '14px',
    width: '100%',
    height: '60px',
    padding: '0 22px',
    background: `linear-gradient(180deg, ${L.w06}, ${L.w03})`,
    color: L.w92,
    border: `1px solid ${L.orangeBtnBorder}`,
    borderRadius: '13px',
    fontFamily: L.font,
    fontSize: '14.5px',
    fontWeight: 500,
    letterSpacing: '0.2px',
    cursor: 'pointer' as const,
    boxShadow: `
      inset 0 1px 0 rgba(255,255,255,0.10),
      inset 0 -1px 0 rgba(0,0,0,0.2),
      0 8px 24px rgba(0,0,0,0.4)
    `,
    transition:
      'transform 0.35s cubic-bezier(.2,.7,.2,1), box-shadow 0.4s cubic-bezier(.2,.7,.2,1), border-color 0.35s ease, background 0.35s ease',
    zIndex: 1,
  },
  gbtnHover: {
    background: `linear-gradient(135deg, ${L.orange} 0%, ${L.orangeBright} 100%)`,
    borderColor: L.orange,
    transform: 'scale(1.012)',
    boxShadow: `
      0 22px 50px rgba(232,97,26,0.45),
      0 0 0 1px rgba(232,97,26,0.5),
      inset 0 1px 0 rgba(255,255,255,0.22)
    `,
    color: '#ffffff',
  },
  gbtnShimmer: {
    position: 'absolute' as const,
    top: '-50%',
    left: '-100%',
    width: '60%',
    height: '200%',
    background:
      'linear-gradient(90deg, transparent, rgba(255,255,255,0.18), transparent)',
    transform: 'skewX(-20deg)',
    transition: 'left 0.7s cubic-bezier(.2,.7,.2,1)',
    pointerEvents: 'none' as const,
    zIndex: 0,
  },
  gbtnShimmerHover: { left: '130%' },
  // Idle shimmer (periodic, subtle)
  gbtnIdleShimmer: {
    position: 'absolute' as const,
    top: '-50%',
    left: '-100%',
    width: '40%',
    height: '200%',
    background:
      'linear-gradient(90deg, transparent, rgba(255,255,255,0.08), transparent)',
    transform: 'skewX(-20deg)',
    animation: 'lhBtnIdleShimmer 14s linear infinite',
    pointerEvents: 'none' as const,
    zIndex: 0,
  },
  gIconSlot: {
    position: 'relative' as const,
    width: '26px',
    height: '26px',
    display: 'flex' as const,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
    flexShrink: 0,
    zIndex: 2,
  },
  gIconLayer: {
    position: 'absolute' as const,
    inset: 0,
    display: 'flex' as const,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
    transition: 'opacity 0.35s cubic-bezier(.2,.7,.2,1)',
  },
  gbtnLabel: { position: 'relative' as const, zIndex: 2 },
  // Divider + secure
  divider: {
    display: 'flex' as const,
    alignItems: 'center' as const,
    gap: '12px',
    marginTop: '22px',
    fontSize: '8px',
    letterSpacing: '3px',
    color: L.w35,
    textTransform: 'uppercase' as const,
    fontWeight: 600,
  },
  dividerLine: {
    flex: 1,
    height: '1px',
    background: `linear-gradient(90deg, transparent, ${L.w10}, transparent)`,
  },
  secure: {
    display: 'flex' as const,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
    gap: '6px',
    marginTop: '10px',
    fontSize: '10px',
    color: L.w50,
    fontWeight: 400,
  },
  errorBox: {
    marginTop: '14px',
    display: 'flex' as const,
    alignItems: 'flex-start' as const,
    gap: '8px',
    padding: '10px 12px',
    background: 'rgba(197, 48, 48, 0.10)',
    border: '1px solid rgba(197, 48, 48, 0.30)',
    borderRadius: '8px',
    color: '#F29090',
    fontSize: '12px',
    lineHeight: 1.4,
  },
  footer: {
    position: 'absolute' as const,
    bottom: 0,
    left: 0,
    right: 0,
    height: '32px',
    display: 'flex' as const,
    alignItems: 'center' as const,
    justifyContent: 'flex-end' as const,
    padding: '0 24px',
    background: 'rgba(0, 0, 0, 0.5)',
    borderTop: `1px solid ${L.w03}`,
    fontSize: '9.5px',
    color: L.w35,
    fontWeight: 400,
    letterSpacing: '0.3px',
    zIndex: 3,
  },
  footerEmail: {
    color: L.w35,
    textDecoration: 'none' as const,
    cursor: 'pointer' as const,
    transition: 'color 0.2s ease',
  },
  versionTag: {
    position: 'absolute' as const,
    bottom: '44px',
    left: '28px',
    display: 'flex' as const,
    alignItems: 'center' as const,
    gap: '10px',
    fontSize: '9px',
    fontWeight: 600,
    letterSpacing: '2px',
    fontFamily: L.mono,
    color: 'rgba(232, 97, 26, 0.70)',
    textTransform: 'uppercase' as const,
    pointerEvents: 'none' as const,
    zIndex: 3,
    animation: 'lhFadeIn 1.5s ease 0.8s both',
  },
  versionDot: {
    width: '6px',
    height: '6px',
    borderRadius: '50%',
    background: '#E8611A',
    boxShadow: '0 0 8px rgba(232, 97, 26, 0.7)',
    animation: 'lhVersionBlink 3s ease-in-out infinite',
  },
  versionPipe: {
    color: L.w20,
    fontWeight: 400,
  },
  versionLabel: { color: L.w50 },
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
    border: `2px solid ${L.w20}`,
    borderTopColor: L.orange,
    borderRadius: '50%',
    animation: 'lhSpin 0.9s linear infinite',
  },
}

function GoogleGColor() {
  return (
    <svg width="22" height="22" viewBox="0 0 48 48" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
      <path fill="#FFC107" d="M43.611 20.083H42V20H24v8h11.303c-1.649 4.657-6.08 8-11.303 8-6.627 0-12-5.373-12-12s5.373-12 12-12c3.059 0 5.842 1.154 7.961 3.039l5.657-5.657C34.046 6.053 29.268 4 24 4 12.955 4 4 12.955 4 24s8.955 20 20 20 20-8.955 20-20c0-1.341-.138-2.65-.389-3.917z"/>
      <path fill="#FF3D00" d="M6.306 14.691l6.571 4.819C14.655 15.108 18.961 12 24 12c3.059 0 5.842 1.154 7.961 3.039l5.657-5.657C34.046 6.053 29.268 4 24 4 16.318 4 9.656 8.337 6.306 14.691z"/>
      <path fill="#4CAF50" d="M24 44c5.166 0 9.86-1.977 13.409-5.192l-6.19-5.238C29.211 35.091 26.715 36 24 36c-5.202 0-9.619-3.317-11.283-7.946l-6.522 5.025C9.505 39.556 16.227 44 24 44z"/>
      <path fill="#1976D2" d="M43.611 20.083H42V20H24v8h11.303c-.792 2.237-2.231 4.166-4.087 5.571.001-.001.002-.001.003-.002l6.19 5.238C36.971 39.205 44 34 44 24c0-1.341-.138-2.65-.389-3.917z"/>
    </svg>
  )
}

function GoogleGWhite() {
  return (
    <svg width="22" height="22" viewBox="0 0 48 48" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
      <path fill="#ffffff" d="M43.611 20.083H42V20H24v8h11.303c-1.649 4.657-6.08 8-11.303 8-6.627 0-12-5.373-12-12s5.373-12 12-12c3.059 0 5.842 1.154 7.961 3.039l5.657-5.657C34.046 6.053 29.268 4 24 4 12.955 4 4 12.955 4 24s8.955 20 20 20 20-8.955 20-20c0-1.341-.138-2.65-.389-3.917z"/>
    </svg>
  )
}

export default function Login() {
  const [error, setError] = useState('')
  const [googleLoading, setGoogleLoading] = useState(false)
  const [hover, setHover] = useState(false)
  const [cardHover, setCardHover] = useState(false)
  const { user, loading, loginWithGoogleIdToken, getRutaInicial } = useAuthContext()
  const navigate = useNavigate()
  const hiddenGoogleRef = useRef<HTMLDivElement>(null)

  useEffect(() => { injectKF() }, [])

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
          auto_select: false,
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
  }, [handleCredential])

  const triggerGoogle = () => {
    setError('')
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
  const shimmerStyle = hover ? { ...S.gbtnShimmer, ...S.gbtnShimmerHover } : S.gbtnShimmer
  const cardStyle = cardHover ? { ...S.card, ...S.cardHover } : S.card
  const focusGlowStyle = { ...S.cardFocusGlow, opacity: cardHover ? 1 : 0 }

  const now = new Date()
  const versionStr =
    String(now.getFullYear()).slice(2) +
    '.' +
    String(now.getMonth() + 1).padStart(2, '0') +
    '.' +
    String(now.getDate()).padStart(2, '0')

  return (
    <div style={S.page}>
      {/* Layered background */}
      <div style={S.ambientGlow} />
      <div style={S.vignette} />
      <div style={S.grain} />
      <div style={S.gridLayer} />
      <div style={S.meridian} />
      <div style={focusGlowStyle} />

      {/* Corners + ticks */}
      <div style={{ ...S.corner, ...S.cornerTL }} />
      <div style={{ ...S.corner, ...S.cornerTR }} />
      <div style={{ ...S.corner, ...S.cornerBL }} />
      <div style={{ ...S.corner, ...S.cornerBR }} />

      <div style={{ ...S.cornerTick, ...S.tickTL }}>
        <span style={S.tickMark} />00,00
      </div>
      <div style={{ ...S.cornerTick, ...S.tickTR }}>
        00,99<span style={S.tickMark} />
      </div>
      <div style={{ ...S.cornerTick, ...S.tickBL }}>
        <span style={S.tickMark} />99,00
      </div>
      <div style={{ ...S.cornerTick, ...S.tickBR }}>
        99,99<span style={S.tickMark} />
      </div>

      {/* Version tag inferior izquierda */}
      <div style={S.versionTag}>
        <span style={S.versionDot} />
        <span>V2</span>
        <span style={S.versionPipe}>|</span>
        <span>{versionStr}</span>
        <span style={S.versionPipe}>|</span>
        <span style={S.versionLabel}>LIVE</span>
      </div>

      {/* Content grid */}
      <div style={S.content}>
        <div style={S.logoWrap}>
          <div style={S.logoRow}>
            <span style={S.logoWhite}>Loma</span>
            <span style={S.logoOrange}>HUB27</span>
          </div>
          <div style={S.logoLine}>
            <span style={S.logoShimmer} />
          </div>
          <div style={S.logoTag}>future experience</div>
          <div style={S.logoSpec}>
            TROB {'\u00b7'} OPS-V2 {'\u00b7'} 2026 EDITION
          </div>
        </div>

        <div style={S.cardWrap}>
          <div
            style={cardStyle}
            onMouseEnter={() => setCardHover(true)}
            onMouseLeave={() => setCardHover(false)}
          >
            {/* Inner bloom layer (behind content) */}
            <div style={S.cardBloom} />
            {/* Gradient border overlay */}
            <div style={S.cardBorder} />

            {/* Actual content */}
            <div style={S.cardContent}>
              <h2 style={S.cardTitle}>Bienvenido</h2>
              <p style={S.cardSub}>Acceso al sistema operativo</p>

              <button
                type="button"
                style={gbtnStyle}
                onMouseEnter={() => setHover(true)}
                onMouseLeave={() => setHover(false)}
                onClick={triggerGoogle}
                disabled={googleLoading}
              >
                <span style={S.gbtnIdleShimmer} />
                <span style={shimmerStyle} />
                <span style={S.gIconSlot}>
                  <span style={{ ...S.gIconLayer, opacity: hover ? 0 : 1 }}>
                    <GoogleGColor />
                  </span>
                  <span style={{ ...S.gIconLayer, opacity: hover ? 1 : 0 }}>
                    <GoogleGWhite />
                  </span>
                </span>
                <span style={S.gbtnLabel}>
                  {googleLoading ? 'Conectando...' : 'Continuar con Google'}
                </span>
              </button>

              {error && (
                <div style={S.errorBox}>
                  <AlertCircle size={14} style={{ marginTop: '1px', flexShrink: 0 }} />
                  <span>{error}</span>
                </div>
              )}

              <div style={S.divider}>
                <span style={S.dividerLine} />
                Acceso Autorizado
                <span style={S.dividerLine} />
              </div>
              <div style={S.secure}>
                <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
                  <rect x="5" y="11" width="14" height="9" rx="2" />
                  <path d="M8 11V7a4 4 0 0 1 8 0v4" />
                </svg>
                Conexi{'\u00f3'}n cifrada {'\u00b7'} Solo personal autorizado
              </div>

              <div ref={hiddenGoogleRef} style={S.hiddenGsi} aria-hidden="true" />
            </div>
          </div>
        </div>
      </div>

      <div style={S.footer}>
        <span>
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
        </span>
      </div>
    </div>
  )
}
