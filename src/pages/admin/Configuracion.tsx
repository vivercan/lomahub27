import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { ModuleLayout } from '../../components/layout/ModuleLayout'
import { tokens } from '../../lib/tokens'

/* –––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––
   CONFIGURACIÓN — Landing Page  ·  AAA Premium 3D Glass Cards
   7 cards top row + 1 card second row · World-class depth & motion
   ––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––– */

const DASH = {
  fontFamily: tokens.fonts.heading,
  fontBody: tokens.fonts.body,
} as const

/* inject keyframes once */
const STYLE_ID = 'config-premium-keyframes'
function injectKeyframes() {
  if (typeof document === 'undefined') return
  if (document.getElementById(STYLE_ID)) return
  const style = document.createElement('style')
  style.id = STYLE_ID
  style.textContent = `
    @keyframes cfgShimmer {
      0%   { transform: translateX(-100%) skewX(-15deg); }
      100% { transform: translateX(200%) skewX(-15deg); }
    }
    @keyframes cfgFloat {
      0%, 100% { transform: translate(0, 0) scale(1); }
      50%      { transform: translate(3px, -5px) scale(1.04); }
    }
    @keyframes cfgGlow {
      0%, 100% { opacity: 0.4; }
      50%      { opacity: 0.9; }
    }
    @keyframes cfgGrainDrift {
      0%   { transform: translate(0, 0); }
      100% { transform: translate(-50px, -50px); }
    }
  `
  document.head.appendChild(style)
}

/* –– Geometric SVGs — large, elegant –– */
const geoWrap: React.CSSProperties = {
  position: 'absolute', top: 0, right: 0, width: '100%', height: '100%',
  pointerEvents: 'none', overflow: 'hidden', borderRadius: '16px',
}

const geoSvg: React.CSSProperties = {
  position: 'absolute', right: '-8%', bottom: '-12%', width: '90%', height: '95%', opacity: 0.22,
}

const GeoUsuarios = () => (
  <div style={geoWrap}>
    <svg viewBox="0 0 200 140" style={geoSvg}>
      <circle cx="100" cy="42" r="30" fill="none" stroke="rgba(255,255,255,0.65)" strokeWidth="1.6" />
      <circle cx="142" cy="68" r="22" fill="none" stroke="rgba(255,255,255,0.5)" strokeWidth="1.2" />
      <circle cx="62" cy="72" r="20" fill="none" stroke="rgba(255,255,255,0.5)" strokeWidth="1" />
      <path d="M50,112 Q100,82 150,112" fill="none" stroke="rgba(255,255,255,0.55)" strokeWidth="1.3" />
    </svg>
  </div>
)

const GeoCatalogos = () => (
  <div style={geoWrap}>
    <svg viewBox="0 0 200 140" style={geoSvg}>
      <rect x="48" y="14" width="78" height="56" rx="6" fill="none" stroke="rgba(255,255,255,0.65)" strokeWidth="1.6" />
      <rect x="68" y="34" width="78" height="56" rx="6" fill="none" stroke="rgba(255,255,255,0.5)" strokeWidth="1.2" />
      <line x1="58" y1="34" x2="116" y2="34" stroke="rgba(255,255,255,0.5)" strokeWidth="1" />
      <line x1="58" y1="47" x2="110" y2="47" stroke="rgba(255,255,255,0.4)" strokeWidth="0.8" />
    </svg>
  </div>
)

const GeoParametros = () => (
  <div style={geoWrap}>
    <svg viewBox="0 0 200 140" style={geoSvg}>
      <line x1="45" y1="35" x2="175" y2="35" stroke="rgba(255,255,255,0.55)" strokeWidth="1.5" />
      <circle cx="112" cy="35" r="9" fill="none" stroke="rgba(255,255,255,0.65)" strokeWidth="2" />
      <line x1="45" y1="65" x2="175" y2="65" stroke="rgba(255,255,255,0.5)" strokeWidth="1.2" />
      <circle cx="142" cy="65" r="9" fill="none" stroke="rgba(255,255,255,0.65)" strokeWidth="2" />
      <line x1="45" y1="95" x2="175" y2="95" stroke="rgba(255,255,255,0.45)" strokeWidth="1" />
      <circle cx="78" cy="95" r="9" fill="none" stroke="rgba(255,255,255,0.55)" strokeWidth="2" />
    </svg>
  </div>
)

const GeoIntegraciones = () => (
  <div style={geoWrap}>
    <svg viewBox="0 0 200 140" style={geoSvg}>
      <circle cx="78" cy="48" r="26" fill="none" stroke="rgba(255,255,255,0.65)" strokeWidth="1.6" />
      <circle cx="148" cy="48" r="26" fill="none" stroke="rgba(255,255,255,0.5)" strokeWidth="1.2" />
      <line x1="104" y1="48" x2="122" y2="48" stroke="rgba(255,255,255,0.65)" strokeWidth="2.2" strokeDasharray="5 4" />
      <circle cx="113" cy="92" r="17" fill="none" stroke="rgba(255,255,255,0.45)" strokeWidth="1" />
    </svg>
  </div>
)

const GeoAuditoria = () => (
  <div style={geoWrap}>
    <svg viewBox="0 0 200 140" style={geoSvg}>
      <path d="M100,12 L142,38 L130,88 L70,88 L58,38 Z" fill="none" stroke="rgba(255,255,255,0.65)" strokeWidth="1.6" />
      <path d="M80,54 L96,70 L130,38" fill="none" stroke="rgba(255,255,255,0.65)" strokeWidth="2.2" strokeLinecap="round" />
    </svg>
  </div>
)

const GeoPlantillas = () => (
  <div style={geoWrap}>
    <svg viewBox="0 0 200 140" style={geoSvg}>
      <rect x="42" y="12" width="62" height="94" rx="5" fill="none" stroke="rgba(255,255,255,0.65)" strokeWidth="1.6" />
      <rect x="68" y="26" width="62" height="94" rx="5" fill="none" stroke="rgba(255,255,255,0.5)" strokeWidth="1.2" />
      <line x1="52" y1="36" x2="94" y2="36" stroke="rgba(255,255,255,0.5)" strokeWidth="1" />
      <line x1="52" y1="50" x2="88" y2="50" stroke="rgba(255,255,255,0.45)" strokeWidth="0.8" />
      <line x1="52" y1="64" x2="82" y2="64" stroke="rgba(255,255,255,0.4)" strokeWidth="0.8" />
    </svg>
  </div>
)

const GeoDocumentos = () => (
  <div style={geoWrap}>
    <svg viewBox="0 0 200 140" style={geoSvg}>
      <path d="M62,18 L62,108 Q62,118 72,118 L142,118 Q152,118 152,108 L152,44 L126,18 L72,18 Q62,18 62,24 Z" fill="none" stroke="rgba(255,255,255,0.65)" strokeWidth="1.6" />
      <line x1="78" y1="48" x2="138" y2="48" stroke="rgba(255,255,255,0.55)" strokeWidth="1.2" />
      <line x1="78" y1="64" x2="138" y2="64" stroke="rgba(255,255,255,0.45)" strokeWidth="1" />
      <line x1="78" y1="80" x2="126" y2="80" stroke="rgba(255,255,255,0.4)" strokeWidth="0.8" />
    </svg>
  </div>
)

const GeoCerebro = () => (
  <div style={geoWrap}>
    <svg viewBox="0 0 200 140" style={geoSvg}>
      <circle cx="100" cy="55" r="35" fill="none" stroke="rgba(255,255,255,0.6)" strokeWidth="1.6" />
      <path d="M80,40 Q90,25 110,30 Q125,35 120,55 Q130,65 120,78 Q110,90 95,85 Q78,88 75,72 Q65,60 80,40 Z" fill="none" stroke="rgba(255,255,255,0.5)" strokeWidth="1.2" />
      <circle cx="95" cy="52" r="3" fill="rgba(255,255,255,0.5)" />
      <circle cx="108" cy="58" r="3" fill="rgba(255,255,255,0.5)" />
      <line x1="95" y1="52" x2="108" y2="58" stroke="rgba(255,255,255,0.45)" strokeWidth="1" />
    </svg>
  </div>
)

/* –– Card definitions –– */
interface ConfigCard {
  id: string
  label: string
  route: string
  subtitle: string
  accent: string
  gradientBase: string
  gradientHover: string
  glowColor: string
  geo: React.ReactNode
}

const CARDS: ConfigCard[] = [
  {
    id: 'usuarios', label: 'Usuarios', route: '/admin/configuracion/usuarios',
    subtitle: 'Roles y permisos', accent: '#2563EB',
    gradientBase: 'linear-gradient(155deg, #4B83F7 0%, #2563EB 35%, #1A4FCC 70%, #152F7A 100%)',
    gradientHover: 'linear-gradient(155deg, #5A90FF 0%, #3070F0 35%, #2060DD 70%, #1A3A90 100%)',
    glowColor: 'rgba(59,130,246,0.5)', geo: <GeoUsuarios />,
  },
  {
    id: 'catalogos', label: 'Catálogos', route: '/admin/configuracion/catalogos',
    subtitle: 'Tipos y estados', accent: '#059669',
    gradientBase: 'linear-gradient(155deg, #34D399 0%, #059669 35%, #047857 70%, #064E3B 100%)',
    gradientHover: 'linear-gradient(155deg, #45E0A5 0%, #0AAA78 35%, #058A64 70%, #075B45 100%)',
    glowColor: 'rgba(16,185,129,0.5)', geo: <GeoCatalogos />,
  },
  {
    id: 'parametros', label: 'Parámetros', route: '/admin/configuracion/parametros',
    subtitle: 'Tarifas y costos', accent: '#D97706',
    gradientBase: 'linear-gradient(155deg, #FBBF24 0%, #D97706 35%, #B45309 70%, #78350F 100%)',
    gradientHover: 'linear-gradient(155deg, #FCC93A 0%, #E08510 35%, #C46015 70%, #8A4012 100%)',
    glowColor: 'rgba(245,158,11,0.5)', geo: <GeoParametros />,
  },
  {
    id: 'integraciones', label: 'Integraciones', route: '/admin/configuracion/integraciones',
    subtitle: 'ANODOS · GPS · WA', accent: '#7C3AED',
    gradientBase: 'linear-gradient(155deg, #A78BFA 0%, #7C3AED 35%, #6D28D9 70%, #4C1D95 100%)',
    gradientHover: 'linear-gradient(155deg, #B89EFF 0%, #8B4DF5 35%, #7A35E5 70%, #5A25A8 100%)',
    glowColor: 'rgba(139,92,246,0.5)', geo: <GeoIntegraciones />,
  },
  {
    id: 'auditoria', label: 'Auditoría', route: '/admin/configuracion/auditoria',
    subtitle: 'Actividad del sistema', accent: '#DC2626',
    gradientBase: 'linear-gradient(155deg, #F87171 0%, #DC2626 35%, #B91C1C 70%, #7F1D1D 100%)',
    gradientHover: 'linear-gradient(155deg, #FF8585 0%, #E83535 35%, #C82828 70%, #922525 100%)',
    glowColor: 'rgba(239,68,68,0.5)', geo: <GeoAuditoria />,
  },
  {
    id: 'plantillas', label: 'Plantillas', route: '/admin/configuracion/plantillas',
    subtitle: 'Formatos y templates', accent: '#DB2777',
    gradientBase: 'linear-gradient(155deg, #F472B6 0%, #DB2777 35%, #BE185D 70%, #831843 100%)',
    gradientHover: 'linear-gradient(155deg, #FF85C5 0%, #E83888 35%, #CC256B 70%, #952250 100%)',
    glowColor: 'rgba(236,72,153,0.5)', geo: <GeoPlantillas />,
  },
  {
    id: 'documentos', label: 'Documentos', route: '/admin/configuracion/documentos',
    subtitle: 'Legales y actas', accent: '#0891B2',
    gradientBase: 'linear-gradient(155deg, #22D3EE 0%, #0891B2 35%, #0E7490 70%, #164E63 100%)',
    gradientHover: 'linear-gradient(155deg, #38DFF5 0%, #12A2C5 35%, #1585A0 70%, #1D5C72 100%)',
    glowColor: 'rgba(34,211,238,0.5)', geo: <GeoDocumentos />,
  },
  {
    id: 'cerebro', label: 'Cerebro Tarifario', route: '/pricing/cerebro-tarifario',
    subtitle: 'Tarifas y pricing', accent: '#EA580C',
    gradientBase: 'linear-gradient(155deg, #FB923C 0%, #EA580C 35%, #C2410C 70%, #7C2D12 100%)',
    gradientHover: 'linear-gradient(155deg, #FFA350 0%, #F06818 35%, #D45018 70%, #8E3518 100%)',
    glowColor: 'rgba(251,146,60,0.5)', geo: <GeoCerebro />,
  },
]

/* –– Component –– */
export default function Configuracion() {
  const navigate = useNavigate()
  const [hovered, setHovered] = useState<string | null>(null)
  const [pressed, setPressed] = useState<string | null>(null)

  useEffect(() => { injectKeyframes() }, [])

  const getCardStyle = (isH: boolean, isP: boolean, card: ConfigCard): React.CSSProperties => ({
    aspectRatio: '1 / 0.88',
    borderRadius: '16px',
    padding: '18px 14px 14px',
    background: isH ? card.gradientHover : card.gradientBase,
    border: 'none',
    cursor: 'pointer',
    position: 'relative',
    overflow: 'hidden',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'flex-start',
    justifyContent: 'flex-start',
    transition: 'all 0.32s cubic-bezier(0.23,1,0.32,1)',
    transform: isP
      ? 'translateY(3px) scale(0.975)'
      : isH
        ? 'translateY(-8px) scale(1.03)'
        : 'translateY(0) scale(1)',
    boxShadow: isP
      ? `0 1px 2px rgba(0,0,0,0.45), inset 0 -1px 0 rgba(255,255,255,0.10), inset 0 4px 8px rgba(0,0,0,0.45)`
      : isH
        ? `0 0 0 1.5px ${card.glowColor}, 0 0 20px ${card.glowColor}, 0 8px 16px rgba(0,0,0,0.40), 0 24px 48px -8px rgba(0,0,0,0.35), inset 0 1px 0 rgba(255,255,255,0.35), inset 0 -2px 0 rgba(0,0,0,0.30)`
        : `0 2px 4px rgba(0,0,0,0.25), 0 8px 20px -4px rgba(0,0,0,0.22), 0 20px 40px -8px rgba(0,0,0,0.18), inset 0 1px 0 rgba(255,255,255,0.28), inset 0 -2px 0 rgba(0,0,0,0.28)`,
    outline: 'none',
  })

  return (
    <ModuleLayout titulo="Configuración" moduloPadre={{ nombre: 'Dashboard', ruta: '/dashboard' }}>
      <div style={{
        background: 'linear-gradient(180deg, #E2E6EC 0%, #D5DAE3 100%)',
        minHeight: 'calc(100vh - 140px)',
        padding: '36px 32px',
      }}>
        {/* 7 cards top row */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(7, 1fr)',
          gap: '16px',
        }}>
          {CARDS.slice(0, 7).map(card => {
            const isH = hovered === card.id
            const isP = pressed === card.id
            return (
              <div
                key={card.id}
                style={getCardStyle(isH, isP, card)}
                onMouseEnter={() => setHovered(card.id)}
                onMouseLeave={() => { setHovered(null); setPressed(null) }}
                onMouseDown={() => setPressed(card.id)}
                onMouseUp={() => setPressed(null)}
                onClick={() => navigate(card.route)}
              >
                {/* Geometric SVG background — floats on hover */}
                <div style={{
                  ...geoWrap,
                  transition: 'transform 0.5s cubic-bezier(0.23,1,0.32,1)',
                  transform: isH ? 'translate(3px, -4px) scale(1.06)' : 'translate(0,0) scale(1)',
                  animation: isH ? 'cfgFloat 3s ease-in-out infinite' : 'none',
                }}>
                  {card.geo}
                </div>

                {/* Glassmorphism overlay — frosted glass panel */}
                <div style={{
                  position: 'absolute', left: 0, top: 0, width: '100%', height: '100%',
                  background: 'linear-gradient(165deg, rgba(255,255,255,0.12) 0%, rgba(255,255,255,0.04) 40%, rgba(0,0,0,0.06) 100%)',
                  backdropFilter: 'blur(0.5px)',
                  pointerEvents: 'none', borderRadius: 'inherit', zIndex: 1,
                }} />

                {/* Specular highlight — curved glass shine */}
                <div style={{
                  position: 'absolute', left: '5%', top: '-10%', width: '90%', height: '65%',
                  background: 'radial-gradient(ellipse 100% 80% at 50% 0%, rgba(255,255,255,0.22) 0%, rgba(255,255,255,0.08) 40%, rgba(255,255,255,0) 70%)',
                  pointerEvents: 'none', borderRadius: 'inherit', zIndex: 2,
                }} />

                {/* Top light edge — lens flare bar */}
                <div style={{
                  position: 'absolute', left: '4px', top: 0, right: '4px', height: '1.5px',
                  background: 'linear-gradient(90deg, rgba(255,255,255,0) 0%, rgba(255,255,255,0.50) 20%, rgba(255,255,255,0.65) 50%, rgba(255,255,255,0.50) 80%, rgba(255,255,255,0) 100%)',
                  pointerEvents: 'none', borderRadius: '16px 16px 0 0', zIndex: 5,
                }} />

                {/* Bottom darkening — depth shadow */}
                <div style={{
                  position: 'absolute', left: 0, bottom: 0, width: '100%', height: '45%',
                  background: 'linear-gradient(180deg, rgba(0,0,0,0) 0%, rgba(0,0,0,0.22) 100%)',
                  pointerEvents: 'none', borderRadius: 'inherit', zIndex: 1,
                }} />

                {/* Shimmer sweep on hover */}
                <div style={{
                  position: 'absolute', left: 0, top: 0, width: '100%', height: '100%',
                  pointerEvents: 'none', borderRadius: 'inherit', zIndex: 6,
                  overflow: 'hidden',
                }}>
                  {isH && (
                    <div style={{
                      position: 'absolute', top: 0, left: 0, width: '50%', height: '100%',
                      background: 'linear-gradient(90deg, rgba(255,255,255,0) 0%, rgba(255,255,255,0.18) 40%, rgba(255,255,255,0.30) 50%, rgba(255,255,255,0.18) 60%, rgba(255,255,255,0) 100%)',
                      animation: 'cfgShimmer 1.2s ease-out forwards',
                    }} />
                  )}
                </div>

                {/* Animated glow border on hover */}
                {isH && (
                  <div style={{
                    position: 'absolute', inset: '-1px',
                    borderRadius: '17px',
                    border: `1.5px solid ${card.glowColor}`,
                    animation: 'cfgGlow 2s ease-in-out infinite',
                    pointerEvents: 'none', zIndex: 7,
                  }} />
                )}

                {/* Noise / grain texture for material feel */}
                <div style={{
                  position: 'absolute', left: 0, top: 0, width: '150%', height: '150%',
                  opacity: 0.035,
                  backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E")`,
                  backgroundSize: '128px 128px',
                  pointerEvents: 'none', borderRadius: 'inherit', zIndex: 3,
                  animation: 'cfgGrainDrift 8s linear infinite',
                }} />

                {/* Title */}
                <div style={{
                  fontFamily: DASH.fontFamily,
                  fontSize: '15px',
                  fontWeight: 800,
                  color: '#FFFFFF',
                  lineHeight: 1.2,
                  letterSpacing: '-0.01em',
                  marginBottom: 'auto',
                  position: 'relative',
                  zIndex: 4,
                  textShadow: '0 2px 6px rgba(0,0,0,0.35)',
                }}>
                  {card.label}
                </div>

                {/* Subtitle */}
                <div style={{
                  fontFamily: DASH.fontBody,
                  fontSize: '11px',
                  fontWeight: 500,
                  color: 'rgba(255,255,255,0.82)',
                  marginTop: '6px',
                  position: 'relative',
                  zIndex: 4,
                  textShadow: '0 1px 3px rgba(0,0,0,0.30)',
                }}>
                  {card.subtitle}
                </div>
              </div>
            )
          })}
        </div>

        {/* 8th card — second row, same width as one cell */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(7, 1fr)',
          gap: '16px',
          marginTop: '16px',
        }}>
          {CARDS.slice(7).map(card => {
            const isH = hovered === card.id
            const isP = pressed === card.id
            return (
              <div
                key={card.id}
                style={getCardStyle(isH, isP, card)}
                onMouseEnter={() => setHovered(card.id)}
                onMouseLeave={() => { setHovered(null); setPressed(null) }}
                onMouseDown={() => setPressed(card.id)}
                onMouseUp={() => setPressed(null)}
                onClick={() => navigate(card.route)}
              >
                <div style={{
                  ...geoWrap,
                  transition: 'transform 0.5s cubic-bezier(0.23,1,0.32,1)',
                  transform: isH ? 'translate(3px, -4px) scale(1.06)' : 'translate(0,0) scale(1)',
                  animation: isH ? 'cfgFloat 3s ease-in-out infinite' : 'none',
                }}>
                  {card.geo}
                </div>

                <div style={{
                  position: 'absolute', left: 0, top: 0, width: '100%', height: '100%',
                  background: 'linear-gradient(165deg, rgba(255,255,255,0.12) 0%, rgba(255,255,255,0.04) 40%, rgba(0,0,0,0.06) 100%)',
                  backdropFilter: 'blur(0.5px)',
                  pointerEvents: 'none', borderRadius: 'inherit', zIndex: 1,
                }} />

                <div style={{
                  position: 'absolute', left: '5%', top: '-10%', width: '90%', height: '65%',
                  background: 'radial-gradient(ellipse 100% 80% at 50% 0%, rgba(255,255,255,0.22) 0%, rgba(255,255,255,0.08) 40%, rgba(255,255,255,0) 70%)',
                  pointerEvents: 'none', borderRadius: 'inherit', zIndex: 2,
                }} />

                <div style={{
                  position: 'absolute', left: '4px', top: 0, right: '4px', height: '1.5px',
                  background: 'linear-gradient(90deg, rgba(255,255,255,0) 0%, rgba(255,255,255,0.50) 20%, rgba(255,255,255,0.65) 50%, rgba(255,255,255,0.50) 80%, rgba(255,255,255,0) 100%)',
                  pointerEvents: 'none', borderRadius: '16px 16px 0 0', zIndex: 5,
                }} />

                <div style={{
                  position: 'absolute', left: 0, bottom: 0, width: '100%', height: '45%',
                  background: 'linear-gradient(180deg, rgba(0,0,0,0) 0%, rgba(0,0,0,0.22) 100%)',
                  pointerEvents: 'none', borderRadius: 'inherit', zIndex: 1,
                }} />

                <div style={{
                  position: 'absolute', left: 0, top: 0, width: '100%', height: '100%',
                  pointerEvents: 'none', borderRadius: 'inherit', zIndex: 6,
                  overflow: 'hidden',
                }}>
                  {isH && (
                    <div style={{
                      position: 'absolute', top: 0, left: 0, width: '50%', height: '100%',
                      background: 'linear-gradient(90deg, rgba(255,255,255,0) 0%, rgba(255,255,255,0.18) 40%, rgba(255,255,255,0.30) 50%, rgba(255,255,255,0.18) 60%, rgba(255,255,255,0) 100%)',
                      animation: 'cfgShimmer 1.2s ease-out forwards',
                    }} />
                  )}
                </div>

                {isH && (
                  <div style={{
                    position: 'absolute', inset: '-1px',
                    borderRadius: '17px',
                    border: `1.5px solid ${card.glowColor}`,
                    animation: 'cfgGlow 2s ease-in-out infinite',
                    pointerEvents: 'none', zIndex: 7,
                  }} />
                )}

                <div style={{
                  position: 'absolute', left: 0, top: 0, width: '150%', height: '150%',
                  opacity: 0.035,
                  backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E")`,
                  backgroundSize: '128px 128px',
                  pointerEvents: 'none', borderRadius: 'inherit', zIndex: 3,
                  animation: 'cfgGrainDrift 8s linear infinite',
                }} />

                <div style={{
                  fontFamily: DASH.fontFamily,
                  fontSize: '15px',
                  fontWeight: 800,
                  color: '#FFFFFF',
                  lineHeight: 1.2,
                  letterSpacing: '-0.01em',
                  marginBottom: 'auto',
                  position: 'relative',
                  zIndex: 4,
                  textShadow: '0 2px 6px rgba(0,0,0,0.35)',
                }}>
                  {card.label}
                </div>

                <div style={{
                  fontFamily: DASH.fontBody,
                  fontSize: '11px',
                  fontWeight: 500,
                  color: 'rgba(255,255,255,0.82)',
                  marginTop: '6px',
                  position: 'relative',
                  zIndex: 4,
                  textShadow: '0 1px 3px rgba(0,0,0,0.30)',
                }}>
                  {card.subtitle}
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </ModuleLayout>
  )
}
