import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ModuleLayout } from '../../components/layout/ModuleLayout'
import { tokens } from '../../lib/tokens'

/* –––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––
   CONFIGURACIÓN — Landing Page (estilo Dashboard V27k premium)
   8 cards con efecto 3D, iconos grandes, y profundidad
   ––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––– */

const DASH = {
  fontFamily: tokens.fonts.heading,
  fontBody: tokens.fonts.body,
} as const

/* –– Geometric SVGs — 3x bigger, higher opacity –– */
const geoStyle: React.CSSProperties = {
  position: 'absolute', top: 0, right: 0, width: '100%', height: '100%',
  pointerEvents: 'none', overflow: 'hidden', borderRadius: '18px',
  transition: 'transform 0.6s cubic-bezier(0.23,1,0.32,1)',
}

const GeoUsuarios = () => (
  <div style={geoStyle}>
    <svg viewBox="0 0 200 140" style={{ position: 'absolute', right: '-5%', bottom: '-10%', width: '85%', height: '90%', opacity: 0.18 }}>
      <circle cx="100" cy="45" r="28" fill="none" stroke="rgba(255,255,255,0.6)" strokeWidth="1.5" />
      <circle cx="140" cy="70" r="22" fill="none" stroke="rgba(255,255,255,0.5)" strokeWidth="1.2" />
      <circle cx="65" cy="75" r="20" fill="none" stroke="rgba(255,255,255,0.5)" strokeWidth="1" />
      <path d="M55,110 Q100,85 145,110" fill="none" stroke="rgba(255,255,255,0.5)" strokeWidth="1.2" />
    </svg>
  </div>
)

const GeoCatalogos = () => (
  <div style={geoStyle}>
    <svg viewBox="0 0 200 140" style={{ position: 'absolute', right: '-5%', bottom: '-10%', width: '85%', height: '90%', opacity: 0.18 }}>
      <rect x="50" y="15" width="75" height="55" rx="5" fill="none" stroke="rgba(255,255,255,0.6)" strokeWidth="1.5" />
      <rect x="70" y="35" width="75" height="55" rx="5" fill="none" stroke="rgba(255,255,255,0.5)" strokeWidth="1.2" />
      <line x1="60" y1="35" x2="115" y2="35" stroke="rgba(255,255,255,0.5)" strokeWidth="1" />
      <line x1="60" y1="47" x2="110" y2="47" stroke="rgba(255,255,255,0.4)" strokeWidth="0.8" />
    </svg>
  </div>
)

const GeoParametros = () => (
  <div style={geoStyle}>
    <svg viewBox="0 0 200 140" style={{ position: 'absolute', right: '-5%', bottom: '-10%', width: '85%', height: '90%', opacity: 0.18 }}>
      <line x1="50" y1="35" x2="170" y2="35" stroke="rgba(255,255,255,0.5)" strokeWidth="1.5" />
      <circle cx="110" cy="35" r="8" fill="none" stroke="rgba(255,255,255,0.6)" strokeWidth="2" />
      <line x1="50" y1="65" x2="170" y2="65" stroke="rgba(255,255,255,0.5)" strokeWidth="1.2" />
      <circle cx="140" cy="65" r="8" fill="none" stroke="rgba(255,255,255,0.6)" strokeWidth="2" />
      <line x1="50" y1="95" x2="170" y2="95" stroke="rgba(255,255,255,0.4)" strokeWidth="1" />
      <circle cx="80" cy="95" r="8" fill="none" stroke="rgba(255,255,255,0.5)" strokeWidth="2" />
    </svg>
  </div>
)

const GeoIntegraciones = () => (
  <div style={geoStyle}>
    <svg viewBox="0 0 200 140" style={{ position: 'absolute', right: '-5%', bottom: '-10%', width: '85%', height: '90%', opacity: 0.18 }}>
      <circle cx="80" cy="50" r="24" fill="none" stroke="rgba(255,255,255,0.6)" strokeWidth="1.5" />
      <circle cx="145" cy="50" r="24" fill="none" stroke="rgba(255,255,255,0.5)" strokeWidth="1.2" />
      <line x1="104" y1="50" x2="121" y2="50" stroke="rgba(255,255,255,0.6)" strokeWidth="2" strokeDasharray="5 4" />
      <circle cx="112" cy="90" r="16" fill="none" stroke="rgba(255,255,255,0.4)" strokeWidth="1" />
    </svg>
  </div>
)

const GeoAuditoria = () => (
  <div style={geoStyle}>
    <svg viewBox="0 0 200 140" style={{ position: 'absolute', right: '-5%', bottom: '-10%', width: '85%', height: '90%', opacity: 0.18 }}>
      <path d="M100,15 L140,40 L128,85 L72,85 L60,40 Z" fill="none" stroke="rgba(255,255,255,0.6)" strokeWidth="1.5" />
      <path d="M82,55 L97,70 L128,40" fill="none" stroke="rgba(255,255,255,0.6)" strokeWidth="2" strokeLinecap="round" />
    </svg>
  </div>
)

const GeoPlantillas = () => (
  <div style={geoStyle}>
    <svg viewBox="0 0 200 140" style={{ position: 'absolute', right: '-5%', bottom: '-10%', width: '85%', height: '90%', opacity: 0.18 }}>
      <rect x="45" y="15" width="60" height="90" rx="4" fill="none" stroke="rgba(255,255,255,0.6)" strokeWidth="1.5" />
      <rect x="70" y="28" width="60" height="90" rx="4" fill="none" stroke="rgba(255,255,255,0.5)" strokeWidth="1.2" />
      <line x1="55" y1="38" x2="95" y2="38" stroke="rgba(255,255,255,0.5)" strokeWidth="1" />
      <line x1="55" y1="50" x2="90" y2="50" stroke="rgba(255,255,255,0.4)" strokeWidth="0.8" />
      <line x1="55" y1="62" x2="85" y2="62" stroke="rgba(255,255,255,0.4)" strokeWidth="0.8" />
    </svg>
  </div>
)

const GeoDocumentos = () => (
  <div style={geoStyle}>
    <svg viewBox="0 0 200 140" style={{ position: 'absolute', right: '-5%', bottom: '-10%', width: '85%', height: '90%', opacity: 0.18 }}>
      <path d="M65,20 L65,105 Q65,115 75,115 L140,115 Q150,115 150,105 L150,45 L125,20 L75,20 Q65,20 65,25 Z" fill="none" stroke="rgba(255,255,255,0.6)" strokeWidth="1.5" />
      <line x1="80" y1="48" x2="135" y2="48" stroke="rgba(255,255,255,0.5)" strokeWidth="1.2" />
      <line x1="80" y1="62" x2="135" y2="62" stroke="rgba(255,255,255,0.4)" strokeWidth="1" />
      <line x1="80" y1="76" x2="125" y2="76" stroke="rgba(255,255,255,0.4)" strokeWidth="0.8" />
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
  gradient: string
  geo: React.ReactNode
}

const CARDS: ConfigCard[] = [
  { id: 'usuarios', label: 'Usuarios', route: '/admin/configuracion/usuarios', subtitle: 'Roles y permisos', accent: '#2563EB', gradient: 'linear-gradient(145deg, #3B82F6 0%, #2563EB 40%, #1D4ED8 100%)', geo: <GeoUsuarios /> },
  { id: 'catalogos', label: 'Catálogos', route: '/admin/configuracion/catalogos', subtitle: 'Tipos y estados', accent: '#059669', gradient: 'linear-gradient(145deg, #10B981 0%, #059669 40%, #047857 100%)', geo: <GeoCatalogos /> },
  { id: 'parametros', label: 'Parámetros', route: '/admin/configuracion/parametros', subtitle: 'Tarifas y costos', accent: '#D97706', gradient: 'linear-gradient(145deg, #F59E0B 0%, #D97706 40%, #B45309 100%)', geo: <GeoParametros /> },
  { id: 'integraciones', label: 'Integraciones', route: '/admin/configuracion/integraciones', subtitle: 'ANODOS, GPS, WhatsApp', accent: '#7C3AED', gradient: 'linear-gradient(145deg, #8B5CF6 0%, #7C3AED 40%, #6D28D9 100%)', geo: <GeoIntegraciones /> },
  { id: 'auditoria', label: 'Auditoría', route: '/admin/configuracion/auditoria', subtitle: 'Actividad del sistema', accent: '#DC2626', gradient: 'linear-gradient(145deg, #EF4444 0%, #DC2626 40%, #B91C1C 100%)', geo: <GeoAuditoria /> },
  { id: 'plantillas', label: 'Plantillas', route: '/admin/configuracion/plantillas', subtitle: 'Formatos y templates', accent: '#7C3AED', gradient: 'linear-gradient(145deg, #A78BFA 0%, #7C3AED 40%, #6D28D9 100%)', geo: <GeoPlantillas /> },
  { id: 'documentos', label: 'Documentos', route: '/admin/configuracion/documentos', subtitle: 'Acta constitutiva y legales', accent: '#0891B2', gradient: 'linear-gradient(145deg, #22D3EE 0%, #0891B2 40%, #0E7490 100%)', geo: <GeoDocumentos /> },
  { id: 'cerebro', label: 'Cerebro Tarifario', route: '/pricing/cerebro-tarifario', subtitle: 'Tarifas y pricing', accent: '#EA580C', gradient: 'linear-gradient(145deg, #FB923C 0%, #EA580C 40%, #C2410C 100%)', geo: <GeoParametros /> },
]

/* –– Component –– */
export default function Configuracion() {
  const navigate = useNavigate()
  const [hovered, setHovered] = useState<string | null>(null)
  const [pressed, setPressed] = useState<string | null>(null)

  const getCardStyle = (isH: boolean, isP: boolean, card: ConfigCard): React.CSSProperties => ({
    aspectRatio: '1 / 0.82',
    borderRadius: '18px',
    padding: '24px',
    background: card.gradient,
    border: 'none',
    outline: isH
      ? '1.5px solid rgba(255,140,0,0.55)'
      : '1.5px solid rgba(0,0,0,0.08)',
    outlineOffset: '-1px',
    cursor: 'pointer',
    position: 'relative',
    overflow: 'hidden',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'flex-start',
    justifyContent: 'flex-start',
    transition: 'transform 0.18s cubic-bezier(0.4,0,0.2,1), box-shadow 0.18s cubic-bezier(0.4,0,0.2,1)',
    transform: isP
      ? 'translateY(2px) scale(0.985)'
      : isH
        ? 'translateY(-6px) scale(1.01)'
        : 'translateY(0) scale(1)',
    boxShadow: isP
      ? `0 1px 2px rgba(0,0,0,0.40), inset 0 -1px 0 rgba(255,255,255,0.15), inset 0 3px 6px rgba(0,0,0,0.40)`
      : isH
        ? `0 0 16px rgba(255,122,0,0.15), 0 4px 8px rgba(0,0,0,0.40), 0 16px 32px -6px rgba(0,0,0,0.45), inset 0 2px 0 rgba(255,255,255,0.30), inset 0 -2px 0 rgba(0,0,0,0.35)`
        : `0 2px 4px rgba(0,0,0,0.30), 0 8px 16px -4px rgba(0,0,0,0.25), 0 20px 40px -8px rgba(0,0,0,0.20), inset 0 2px 0 rgba(255,255,255,0.25), inset 0 -2px 0 rgba(0,0,0,0.30)`,
  })

  return (
    <ModuleLayout titulo="Configuración" moduloPadre={{ nombre: 'Dashboard', ruta: '/dashboard' }}>
      <div style={{
        background: '#E8EBF0',
        minHeight: 'calc(100vh - 140px)',
        padding: '36px 44px',
      }}>
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(4, 1fr)',
          gap: '18px',
          maxWidth: '1100px',
        }}>
          {CARDS.map(card => {
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
                {/* Geometric SVG background */}
                <div style={{
                  ...geoStyle,
                  transform: isH ? 'translate(4px, -4px) scale(1.05)' : 'translate(0,0) scale(1)',
                }}>
                  {card.geo}
                </div>

                {/* Specular highlight — top shine */}
                <div style={{
                  position: 'absolute', left: 0, top: 0, width: '100%', height: '50%',
                  background: 'linear-gradient(180deg, rgba(255,255,255,0.18) 0%, rgba(255,255,255,0.06) 30%, rgba(255,255,255,0) 100%)',
                  pointerEvents: 'none', borderRadius: 'inherit', zIndex: 1,
                }} />

                {/* Top light edge */}
                <div style={{
                  position: 'absolute', left: '2px', top: 0, right: '2px', height: '2px',
                  background: 'linear-gradient(90deg, rgba(255,255,255,0) 0%, rgba(255,255,255,0.45) 15%, rgba(255,255,255,0.55) 50%, rgba(255,255,255,0.45) 85%, rgba(255,255,255,0) 100%)',
                  pointerEvents: 'none', borderRadius: '18px 18px 0 0', zIndex: 5,
                }} />

                {/* Bottom darkening */}
                <div style={{
                  position: 'absolute', left: 0, bottom: 0, width: '100%', height: '40%',
                  background: 'linear-gradient(180deg, rgba(0,0,0,0) 0%, rgba(0,0,0,0.18) 100%)',
                  pointerEvents: 'none', borderRadius: 'inherit', zIndex: 1,
                }} />

                {/* Title */}
                <div style={{
                  fontFamily: DASH.fontFamily,
                  fontSize: '22px',
                  fontWeight: 800,
                  color: '#FFFFFF',
                  lineHeight: 1.2,
                  marginBottom: 'auto',
                  position: 'relative',
                  zIndex: 2,
                  textShadow: '0 2px 4px rgba(0,0,0,0.25)',
                }}>
                  {card.label}
                </div>

                {/* Subtitle */}
                <div style={{
                  fontFamily: DASH.fontBody,
                  fontSize: '13px',
                  fontWeight: 500,
                  color: 'rgba(255,255,255,0.80)',
                  marginTop: '8px',
                  position: 'relative',
                  zIndex: 2,
                  textShadow: '0 1px 2px rgba(0,0,0,0.20)',
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
