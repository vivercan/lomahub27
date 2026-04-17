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

/* –– Themed SVG Icons — laser-etched look –– */
const geoWrap: React.CSSProperties = {
  position: 'absolute', top: 0, right: 0, width: '100%', height: '100%',
  pointerEvents: 'none', overflow: 'hidden', borderRadius: '16px',
}
const geoSvg: React.CSSProperties = {
  position: 'absolute', right: '-8%', bottom: '-12%', width: '90%', height: '95%', opacity: 0.55,
  filter: 'drop-shadow(0 2px 0 rgba(255,255,255,0.35)) drop-shadow(0 -1px 0 rgba(0,0,0,0.40))',
}
const S = 'rgba(0,0,0,0.70)'
const S2 = 'rgba(0,0,0,0.55)'

/* Usuarios — people / team */
const IcoUsuarios = () => (
  <div style={geoWrap}><svg viewBox="0 0 200 140" style={geoSvg} fill="none" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="100" cy="38" r="22" stroke={S} strokeWidth="2" />
    <path d="M58,115 C58,85 76,72 100,72 C124,72 142,85 142,115" stroke={S} strokeWidth="2" />
    <circle cx="155" cy="48" r="14" stroke={S2} strokeWidth="1.5" />
    <path d="M135,110 C135,92 142,84 155,84 C168,84 175,92 175,110" stroke={S2} strokeWidth="1.5" />
    <circle cx="48" cy="50" r="13" stroke={S2} strokeWidth="1.5" />
    <path d="M28,108 C28,92 36,85 48,85 C60,85 68,92 68,108" stroke={S2} strokeWidth="1.5" />
  </svg></div>
)

/* Catálogos — grid / list */
const IcoCatalogos = () => (
  <div style={geoWrap}><svg viewBox="0 0 200 140" style={geoSvg} fill="none" strokeLinecap="round">
    <rect x="38" y="15" width="52" height="46" rx="6" stroke={S} strokeWidth="2" />
    <rect x="108" y="15" width="52" height="46" rx="6" stroke={S} strokeWidth="2" />
    <rect x="38" y="78" width="52" height="46" rx="6" stroke={S} strokeWidth="2" />
    <rect x="108" y="78" width="52" height="46" rx="6" stroke={S2} strokeWidth="1.5" />
    <line x1="52" y1="32" x2="76" y2="32" stroke={S2} strokeWidth="1.5" />
    <line x1="52" y1="42" x2="68" y2="42" stroke={S2} strokeWidth="1.2" />
    <line x1="122" y1="32" x2="146" y2="32" stroke={S2} strokeWidth="1.5" />
    <line x1="122" y1="42" x2="138" y2="42" stroke={S2} strokeWidth="1.2" />
  </svg></div>
)

/* Parámetros — sliders / settings — medium-dark card */
const IcoParametros = () => (
  <div style={geoWrap}><svg viewBox="0 0 200 140" style={geoSvg} fill="none" strokeLinecap="round">
    <line x1="40" y1="35" x2="160" y2="35" stroke={S} strokeWidth="2.5" />
    <circle cx="105" cy="35" r="12" stroke={S} strokeWidth="3" />
    <line x1="40" y1="70" x2="160" y2="70" stroke={S} strokeWidth="2.5" />
    <circle cx="70" cy="70" r="12" stroke={S} strokeWidth="3" />
    <line x1="40" y1="105" x2="160" y2="105" stroke={S} strokeWidth="2.5" />
    <circle cx="135" cy="105" r="12" stroke={S} strokeWidth="3" />
  </svg></div>
)

/* Integraciones — 2 puzzle pieces interlocking */
const IcoIntegraciones = () => (
  <div style={geoWrap}><svg viewBox="0 0 200 140" style={geoSvg} fill="none" strokeLinecap="round" strokeLinejoin="round">
    {/* Left piece */}
    <path d="M25,20 L90,20 L90,45 Q105,45 105,60 Q105,75 90,75 L90,100 L25,100 L25,75 Q10,75 10,60 Q10,45 25,45 Z" stroke={S} strokeWidth="2.5" />
    {/* Right piece — interlocked */}
    <path d="M96,20 L170,20 L170,45 Q185,45 185,60 Q185,75 170,75 L170,100 L96,100 L96,75 Q111,75 111,60 Q111,45 96,45 Z" stroke={S} strokeWidth="2.5" />
    {/* Connection dots */}
    <circle cx="100" cy="60" r="3" fill={S} />
  </svg></div>
)

/* Auditoría — shield / check — dark card, use light strokes */
const L = 'rgba(255,255,255,0.65)'
const L2 = 'rgba(255,255,255,0.50)'
const geoSvgLight: React.CSSProperties = {
  ...geoSvg, filter: 'drop-shadow(0 2px 0 rgba(255,255,255,0.18)) drop-shadow(0 -1px 0 rgba(0,0,0,0.70))',
}
const IcoAuditoria = () => (
  <div style={geoWrap}><svg viewBox="0 0 200 140" style={geoSvgLight} fill="none" strokeLinecap="round" strokeLinejoin="round">
    <path d="M100,12 L155,35 L155,72 Q155,105 100,128 Q45,105 45,72 L45,35 Z" stroke={L} strokeWidth="2.5" />
    <path d="M78,65 L92,82 L125,50" stroke={L} strokeWidth="3.5" />
  </svg></div>
)

/* Plantillas — file / template */
const IcoPlantillas = () => (
  <div style={geoWrap}><svg viewBox="0 0 200 140" style={geoSvg} fill="none" strokeLinecap="round" strokeLinejoin="round">
    <path d="M65,15 L65,125 Q65,130 70,130 L150,130 Q155,130 155,125 L155,42 L128,15 Z" stroke={S} strokeWidth="2.5" />
    <path d="M128,15 L128,42 L155,42" stroke={S} strokeWidth="2.5" />
    <line x1="82" y1="60" x2="138" y2="60" stroke={S} strokeWidth="2" />
    <line x1="82" y1="76" x2="138" y2="76" stroke={S} strokeWidth="2" />
    <line x1="82" y1="92" x2="120" y2="92" stroke={S2} strokeWidth="1.8" />
    <line x1="82" y1="108" x2="110" y2="108" stroke={S2} strokeWidth="1.5" />
  </svg></div>
)

/* Documentos — folder / briefcase */
const IcoDocumentos = () => (
  <div style={geoWrap}><svg viewBox="0 0 200 140" style={geoSvg} fill="none" strokeLinecap="round" strokeLinejoin="round">
    <path d="M35,40 L35,115 Q35,122 42,122 L158,122 Q165,122 165,115 L165,40 Q165,33 158,33 L115,33 L105,18 L42,18 Q35,18 35,25 Z" stroke={S} strokeWidth="2.5" />
    <line x1="35" y1="55" x2="165" y2="55" stroke={S} strokeWidth="2" />
    <rect x="75" y="42" width="50" height="22" rx="4" stroke={S} strokeWidth="2" />
  </svg></div>
)

/* Cerebro Tarifario — chip / AI brain — dark card, light strokes */
const IcoCerebro = () => (
  <div style={geoWrap}><svg viewBox="0 0 200 140" style={geoSvgLight} fill="none" strokeLinecap="round" strokeLinejoin="round">
    {/* Central chip square */}
    <rect x="62" y="32" width="76" height="76" rx="12" stroke={L} strokeWidth="2.5" />
    {/* Inner circuit */}
    <circle cx="100" cy="70" r="18" stroke={L} strokeWidth="2" />
    <path d="M100,52 L100,58 M100,82 L100,88" stroke={L2} strokeWidth="2" />
    <path d="M82,70 L88,70 M112,70 L118,70" stroke={L2} strokeWidth="2" />
    {/* AI dot center */}
    <circle cx="100" cy="70" r="4.5" fill={L2} />
    {/* Traces — left */}
    <line x1="62" y1="50" x2="42" y2="50" stroke={L2} strokeWidth="2" />
    <line x1="62" y1="70" x2="38" y2="70" stroke={L2} strokeWidth="2" />
    <line x1="62" y1="90" x2="42" y2="90" stroke={L2} strokeWidth="2" />
    {/* Traces — right */}
    <line x1="138" y1="50" x2="158" y2="50" stroke={L2} strokeWidth="2" />
    <line x1="138" y1="70" x2="162" y2="70" stroke={L2} strokeWidth="2" />
    <line x1="138" y1="90" x2="158" y2="90" stroke={L2} strokeWidth="2" />
    {/* Traces — top */}
    <line x1="82" y1="32" x2="82" y2="16" stroke={L2} strokeWidth="2" />
    <line x1="100" y1="32" x2="100" y2="12" stroke={L2} strokeWidth="2" />
    <line x1="118" y1="32" x2="118" y2="16" stroke={L2} strokeWidth="2" />
    {/* Traces — bottom */}
    <line x1="82" y1="108" x2="82" y2="124" stroke={L2} strokeWidth="2" />
    <line x1="100" y1="108" x2="100" y2="128" stroke={L2} strokeWidth="2" />
    <line x1="118" y1="108" x2="118" y2="124" stroke={L2} strokeWidth="2" />
    {/* Trace endpoints */}
    <circle cx="42" cy="50" r="2.5" fill={L2} />
    <circle cx="38" cy="70" r="2.5" fill={L2} />
    <circle cx="42" cy="90" r="2.5" fill={L2} />
    <circle cx="158" cy="50" r="2.5" fill={L2} />
    <circle cx="162" cy="70" r="2.5" fill={L2} />
    <circle cx="158" cy="90" r="2.5" fill={L2} />
  </svg></div>
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
    subtitle: 'Roles y permisos', accent: '#6B7280',
    gradientBase: 'linear-gradient(155deg, #4B5563 0%, #374151 35%, #1F2937 70%, #111827 100%)',
    gradientHover: 'linear-gradient(155deg, #6B7280 0%, #4B5563 35%, #374151 70%, #1F2937 100%)',
    glowColor: 'rgba(107,114,128,0.4)', geo: <IcoUsuarios />,
  },
  {
    id: 'catalogos', label: 'Catálogos', route: '/admin/configuracion/catalogos',
    subtitle: 'Tipos y estados', accent: '#9CA3AF',
    gradientBase: 'linear-gradient(155deg, #6B7280 0%, #4B5563 35%, #374151 70%, #1F2937 100%)',
    gradientHover: 'linear-gradient(155deg, #9CA3AF 0%, #6B7280 35%, #4B5563 70%, #374151 100%)',
    glowColor: 'rgba(156,163,175,0.4)', geo: <IcoCatalogos />,
  },
  {
    id: 'parametros', label: 'Parámetros', route: '/admin/configuracion/parametros',
    subtitle: 'Tarifas y costos', accent: '#374151',
    gradientBase: 'linear-gradient(155deg, #374151 0%, #1F2937 35%, #111827 70%, #030712 100%)',
    gradientHover: 'linear-gradient(155deg, #4B5563 0%, #374151 35%, #1F2937 70%, #111827 100%)',
    glowColor: 'rgba(55,65,81,0.4)', geo: <IcoParametros />,
  },
  {
    id: 'integraciones', label: 'Integraciones', route: '/admin/configuracion/integraciones',
    subtitle: 'ANODOS · GPS · WA', accent: '#D1D5DB',
    gradientBase: 'linear-gradient(155deg, #9CA3AF 0%, #6B7280 35%, #4B5563 70%, #374151 100%)',
    gradientHover: 'linear-gradient(155deg, #D1D5DB 0%, #9CA3AF 35%, #6B7280 70%, #4B5563 100%)',
    glowColor: 'rgba(209,213,219,0.3)', geo: <IcoIntegraciones />,
  },
  {
    id: 'auditoria', label: 'Auditoría', route: '/admin/configuracion/auditoria',
    subtitle: 'Actividad del sistema', accent: '#1F2937',
    gradientBase: 'linear-gradient(155deg, #1F2937 0%, #111827 35%, #030712 70%, #000000 100%)',
    gradientHover: 'linear-gradient(155deg, #374151 0%, #1F2937 35%, #111827 70%, #030712 100%)',
    glowColor: 'rgba(31,41,55,0.4)', geo: <IcoAuditoria />,
  },
  {
    id: 'plantillas', label: 'Plantillas', route: '/admin/configuracion/plantillas',
    subtitle: 'Formatos y templates', accent: '#E5E7EB',
    gradientBase: 'linear-gradient(155deg, #D1D5DB 0%, #9CA3AF 35%, #6B7280 70%, #4B5563 100%)',
    gradientHover: 'linear-gradient(155deg, #E5E7EB 0%, #D1D5DB 35%, #9CA3AF 70%, #6B7280 100%)',
    glowColor: 'rgba(229,231,235,0.3)', geo: <IcoPlantillas />,
  },
  {
    id: 'documentos', label: 'Documentos', route: '/admin/configuracion/documentos',
    subtitle: 'Legales y actas', accent: '#4B5563',
    gradientBase: 'linear-gradient(155deg, #4B5563 0%, #374151 35%, #1F2937 70%, #111827 100%)',
    gradientHover: 'linear-gradient(155deg, #6B7280 0%, #4B5563 35%, #374151 70%, #1F2937 100%)',
    glowColor: 'rgba(75,85,99,0.4)', geo: <IcoDocumentos />,
  },
  {
    id: 'cerebro', label: 'Cerebro Tarifario', route: '/pricing/cerebro-tarifario',
    subtitle: 'Tarifas y pricing', accent: '#111827',
    gradientBase: 'linear-gradient(155deg, #1F2937 0%, #111827 35%, #030712 70%, #000000 100%)',
    gradientHover: 'linear-gradient(155deg, #374151 0%, #1F2937 35%, #111827 70%, #030712 100%)',
    glowColor: 'rgba(17,24,39,0.4)', geo: <IcoCerebro />,
  },
]

/* –– Component –– */
export default function Configuracion() {
  const navigate = useNavigate()
  const [hovered, setHovered] = useState<string | null>(null)
  const [pressed, setPressed] = useState<string | null>(null)

  useEffect(() => { injectKeyframes() }, [])

  const getCardStyle = (isH: boolean, isP: boolean, card: ConfigCard): React.CSSProperties => ({
    aspectRatio: '1 / 0.79',
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
    transition: 'all 0.22s cubic-bezier(0.23,1,0.32,1)',
    transform: isP
      ? 'translateY(3px) scale(0.982)'
      : isH
        ? 'translateY(-10px) scale(1.012)'
        : 'translateY(0) scale(1)',
    boxShadow: isP
      ? `0 1px 2px rgba(0,0,0,0.50),
         0 2px 6px rgba(0,0,0,0.40),
         0 4px 12px -2px rgba(0,0,0,0.35),
         inset 0 -1px 0 rgba(255,255,255,0.18),
         inset 0 3px 6px rgba(0,0,0,0.55),
         inset 0 8px 20px rgba(0,0,0,0.18)`
      : isH
        ? `0 4px 8px rgba(0,0,0,0.80),
           0 18px 36px -6px rgba(0,0,0,0.60),
           0 50px 90px -16px rgba(0,0,0,0.65),
           inset 0 2px 0 rgba(255,255,255,0.35),
           inset 2px 0 0 rgba(255,255,255,0.12),
           inset 0 -2px 0 rgba(0,0,0,0.50),
           inset -2px 0 0 rgba(0,0,0,0.25),
           inset 0 0 30px rgba(0,0,0,0.20)`
        : `0 3px 6px rgba(0,0,0,0.40),
           0 10px 20px rgba(0,0,0,0.30),
           0 24px 48px -6px rgba(0,0,0,0.35),
           0 48px 80px -16px rgba(0,0,0,0.25),
           inset 0 2px 0 rgba(255,255,255,0.30),
           inset 2px 0 0 rgba(255,255,255,0.10),
           inset 0 -2px 0 rgba(0,0,0,0.45),
           inset -2px 0 0 rgba(0,0,0,0.20),
           inset 0 24px 40px rgba(255,255,255,0.05),
           inset 0 -20px 30px rgba(0,0,0,0.22)`,
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
                  transition: 'opacity 0.4s ease',
                  opacity: isH ? 1.3 : 1,
                }}>
                  {card.geo}
                </div>


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
                  position: 'absolute', left: 0, top: 0, width: '200%', height: '200%',
                  opacity: 0.08,
                  backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 400 400' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='b'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.01,0.8' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23b)'/%3E%3C/svg%3E")`,
                  backgroundSize: '200px 200px',
                  pointerEvents: 'none', borderRadius: 'inherit', zIndex: 3,
                  animation: 'cfgGrainDrift 12s linear infinite',
                }} />

                {/* Title */}
                <div style={{
                  fontFamily: DASH.fontFamily,
                  fontSize: '22px',
                  fontWeight: 800,
                  color: 'rgba(255,255,255,0.75)',
                  lineHeight: 1.15,
                  letterSpacing: '-0.02em',
                  whiteSpace: 'nowrap',
                  marginBottom: 'auto',
                  position: 'relative',
                  zIndex: 4,
                  textShadow: '0 -2px 1px rgba(0,0,0,0.85), 0 2px 0 rgba(255,255,255,0.30), 0 0 6px rgba(0,0,0,0.25)',
                }}>
                  {card.label}
                </div>

                {/* Subtitle */}
                <div style={{
                  fontFamily: DASH.fontBody,
                  fontSize: '15px',
                  fontWeight: 700,
                  color: 'rgba(255,255,255,0.68)',
                  marginTop: '6px',
                  position: 'relative',
                  zIndex: 4,
                  textShadow: '0 -2px 1px rgba(0,0,0,0.75), 0 2px 0 rgba(255,255,255,0.25), 0 0 5px rgba(0,0,0,0.20)',
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
                {/* Geo SVG */}
                <div style={{
                  ...geoWrap,
                  transition: 'opacity 0.4s ease',
                  opacity: isH ? 1.3 : 1,
                }}>
                  {card.geo}
                </div>

                {/* Shimmer */}
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

                {/* Noise */}
                <div style={{
                  position: 'absolute', left: 0, top: 0, width: '200%', height: '200%',
                  opacity: 0.08,
                  backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 400 400' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='b'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.01,0.8' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23b)'/%3E%3C/svg%3E")`,
                  backgroundSize: '200px 200px',
                  pointerEvents: 'none', borderRadius: 'inherit', zIndex: 3,
                  animation: 'cfgGrainDrift 12s linear infinite',
                }} />

                {/* Title */}
                <div style={{
                  fontFamily: DASH.fontFamily,
                  fontSize: '22px',
                  fontWeight: 800,
                  color: 'rgba(255,255,255,0.75)',
                  lineHeight: 1.15,
                  letterSpacing: '-0.02em',
                  whiteSpace: 'nowrap',
                  marginBottom: 'auto',
                  position: 'relative',
                  zIndex: 4,
                  textShadow: '0 -2px 1px rgba(0,0,0,0.85), 0 2px 0 rgba(255,255,255,0.30), 0 0 6px rgba(0,0,0,0.25)',
                }}>
                  {card.label}
                </div>

                {/* Subtitle */}
                <div style={{
                  fontFamily: DASH.fontBody,
                  fontSize: '15px',
                  fontWeight: 700,
                  color: 'rgba(255,255,255,0.68)',
                  marginTop: '6px',
                  position: 'relative',
                  zIndex: 4,
                  textShadow: '0 -2px 1px rgba(0,0,0,0.75), 0 2px 0 rgba(255,255,255,0.25), 0 0 5px rgba(0,0,0,0.20)',
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
