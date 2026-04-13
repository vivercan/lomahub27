import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ModuleLayout } from '../../components/layout/ModuleLayout'
import { tokens } from '../../lib/tokens'
import {
  Users, BookOpen, SlidersHorizontal, Plug, ShieldCheck
} from 'lucide-react'

/* –––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––
   CONFIGURACIÓN — Landing Page (estilo Dashboard V27f)
   5 cards: Usuarios, Catálogos, Parámetros, Integraciones, Auditoría
   ––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––– */

const DASH = {
  bg: '#E8EBF0',
  fontFamily: tokens.fonts.heading,
  fontBody: tokens.fonts.body,
  cardBg: 'linear-gradient(180deg, #FFFFFF 0%, #F6F7FA 100%)',
  cardBorder: '1px solid #CDD5E1',
  cardRadius: '14px',
  cardPadding: '22px',
  cardShadow: '0 2px 4px rgba(0,0,0,0.06), 0 4px 12px rgba(0,0,0,0.05), 0 8px 24px rgba(0,0,0,0.04), inset 0 1px 0 rgba(255,255,255,0.9)',
  cardHoverShadow: '0 4px 8px rgba(0,0,0,0.08), 0 8px 24px rgba(0,0,0,0.08), 0 16px 48px rgba(0,0,0,0.06), inset 0 1px 0 rgba(255,255,255,0.95)',
  titleSize: '20px',
  titleWeight: 800,
  titleColor: '#0F172A',
  subSize: '9px',
  subColor: '#64748B',
  dotSize: '6px',
} as const

const DOT: Record<string, string> = {
  green: '#0D9668', blue: '#3B6CE7', yellow: '#B8860B',
  purple: '#8B5CF6', red: '#C53030', gray: '#CBD5E1',
}

/* –– Geometric SVGs (matching dashboard style) –– */
const geoStyle: React.CSSProperties = {
  position: 'absolute', top: 0, right: 0, width: '100%', height: '100%',
  pointerEvents: 'none', overflow: 'hidden', borderRadius: '14px',
  transition: 'transform 0.6s cubic-bezier(0.23,1,0.32,1)',
}

const GeoUsuarios = () => (
  <div style={geoStyle}>
    <svg viewBox="0 0 200 140" style={{ position: 'absolute', right: '-10px', bottom: '-10px', width: '65%', height: '75%', opacity: 0.35 }}>
      <circle cx="100" cy="45" r="22" fill="none" stroke="rgba(255,255,255,0.5)" strokeWidth="1.2" />
      <circle cx="130" cy="65" r="18" fill="none" stroke="rgba(255,255,255,0.5)" strokeWidth="1" />
      <circle cx="75" cy="70" r="16" fill="none" stroke="rgba(255,255,255,0.5)" strokeWidth="0.8" />
      <path d="M70,100 Q100,80 130,100" fill="none" stroke="rgba(255,255,255,0.5)" strokeWidth="1" />
    </svg>
  </div>
)

const GeoCatalogos = () => (
  <div style={geoStyle}>
    <svg viewBox="0 0 200 140" style={{ position: 'absolute', right: '-10px', bottom: '-10px', width: '65%', height: '75%', opacity: 0.35 }}>
      <rect x="65" y="25" width="60" height="45" rx="4" fill="none" stroke="rgba(255,255,255,0.5)" strokeWidth="1.2" />
      <rect x="80" y="40" width="60" height="45" rx="4" fill="none" stroke="rgba(255,255,255,0.5)" strokeWidth="1" />
      <line x1="75" y1="42" x2="115" y2="42" stroke="rgba(255,255,255,0.5)" strokeWidth="0.8" />
      <line x1="75" y1="50" x2="110" y2="50" stroke="rgba(255,255,255,0.5)" strokeWidth="0.6" />
    </svg>
  </div>
)

const GeoParametros = () => (
  <div style={geoStyle}>
    <svg viewBox="0 0 200 140" style={{ position: 'absolute', right: '-10px', bottom: '-10px', width: '65%', height: '75%', opacity: 0.35 }}>
      <line x1="70" y1="40" x2="160" y2="40" stroke="rgba(255,255,255,0.5)" strokeWidth="1.2" />
      <circle cx="110" cy="40" r="6" fill="none" stroke="rgba(255,255,255,0.5)" strokeWidth="1.5" />
      <line x1="70" y1="65" x2="160" y2="65" stroke="rgba(255,255,255,0.5)" strokeWidth="1" />
      <circle cx="130" cy="65" r="6" fill="none" stroke="rgba(255,255,255,0.5)" strokeWidth="1.5" />
      <line x1="70" y1="90" x2="160" y2="90" stroke="rgba(255,255,255,0.5)" strokeWidth="0.8" />
      <circle cx="90" cy="90" r="6" fill="none" stroke="rgba(255,255,255,0.5)" strokeWidth="1.5" />
    </svg>
  </div>
)

const GeoIntegraciones = () => (
  <div style={geoStyle}>
    <svg viewBox="0 0 200 140" style={{ position: 'absolute', right: '-10px', bottom: '-10px', width: '65%', height: '75%', opacity: 0.35 }}>
      <circle cx="90" cy="55" r="18" fill="none" stroke="rgba(255,255,255,0.5)" strokeWidth="1.2" />
      <circle cx="140" cy="55" r="18" fill="none" stroke="rgba(255,255,255,0.5)" strokeWidth="1" />
      <line x1="108" y1="55" x2="122" y2="55" stroke="rgba(255,255,255,0.5)" strokeWidth="1.5" strokeDasharray="4 3" />
      <circle cx="115" cy="85" r="12" fill="none" stroke="rgba(255,255,255,0.5)" strokeWidth="0.8" />
    </svg>
  </div>
)

const GeoAuditoria = () => (
  <div style={geoStyle}>
    <svg viewBox="0 0 200 140" style={{ position: 'absolute', right: '-10px', bottom: '-10px', width: '65%', height: '75%', opacity: 0.35 }}>
      <path d="M100,25 L130,45 L120,80 L80,80 L70,45 Z" fill="none" stroke="rgba(255,255,255,0.5)" strokeWidth="1.2" />
      <path d="M90,55 L100,65 L120,45" fill="none" stroke="rgba(255,255,255,0.5)" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  </div>
)

const GeoPlantillas = () => (
  <div style={geoStyle}>
    <svg viewBox="0 0 200 140" style={{ position: 'absolute', right: '-10px', bottom: '-10px', width: '65%', height: '75%', opacity: 0.35 }}>
      <rect x="60" y="30" width="50" height="70" rx="3" fill="none" stroke="rgba(255,255,255,0.5)" strokeWidth="1.2" />
      <rect x="78" y="40" width="50" height="70" rx="3" fill="none" stroke="rgba(255,255,255,0.5)" strokeWidth="1" />
      <line x1="70" y1="48" x2="100" y2="48" stroke="rgba(255,255,255,0.5)" strokeWidth="0.8" />
      <line x1="70" y1="56" x2="95" y2="56" stroke="rgba(255,255,255,0.5)" strokeWidth="0.6" />
      <line x1="70" y1="64" x2="90" y2="64" stroke="rgba(255,255,255,0.5)" strokeWidth="0.6" />
    </svg>
  </div>
)

const GeoDocumentos = () => (
  <div style={geoStyle}>
    <svg viewBox="0 0 200 140" style={{ position: 'absolute', right: '-10px', bottom: '-10px', width: '65%', height: '75%', opacity: 0.35 }}>
      <path d="M75,35 L75,95 Q75,105 85,105 L130,105 Q140,105 140,95 L140,50 L120,30 Q115,30 110,30 L85,30 Q75,30 75,35 Z" fill="none" stroke="rgba(255,255,255,0.5)" strokeWidth="1.2" />
      <line x1="85" y1="50" x2="130" y2="50" stroke="rgba(255,255,255,0.5)" strokeWidth="1" />
      <line x1="85" y1="60" x2="130" y2="60" stroke="rgba(255,255,255,0.5)" strokeWidth="0.8" />
      <line x1="85" y1="70" x2="125" y2="70" stroke="rgba(255,255,255,0.5)" strokeWidth="0.6" />
    </svg>
  </div>
)

/* –– Card definitions –– */
interface ConfigCard {
  id: string
  label: string
  route: string
  subtitle: string
  dot: string
  accent: string
  geo: React.ReactNode
}

const CARDS: ConfigCard[] = [
  { id: 'usuarios', label: 'Usuarios', route: '/admin/configuracion/usuarios', subtitle: 'Roles y permisos', dot: 'blue', accent: '#2563EB', geo: <GeoUsuarios /> },
  { id: 'catalogos', label: 'Catálogos', route: '/admin/configuracion/catalogos', subtitle: 'Tipos y estados', dot: 'green', accent: '#059669', geo: <GeoCatalogos /> },
  { id: 'parametros', label: 'Parámetros', route: '/admin/configuracion/parametros', subtitle: 'Tarifas y costos', dot: 'yellow', accent: '#D97706', geo: <GeoParametros /> },
  { id: 'integraciones', label: 'Integraciones', route: '/admin/configuracion/integraciones', subtitle: 'ANODOS, GPS, WhatsApp', dot: 'purple', accent: '#7C3AED', geo: <GeoIntegraciones /> },
  { id: 'auditoria', label: 'Auditoría', route: '/admin/configuracion/auditoria', subtitle: 'Actividad del sistema', dot: 'red', accent: '#DC2626', geo: <GeoAuditoria /> },
  { id: 'plantillas', label: 'Plantillas', route: '/admin/configuracion/plantillas', subtitle: 'Formatos y templates', dot: 'purple', accent: '#7C3AED', geo: <GeoPlantillas /> },
  { id: 'documentos', label: 'Documentos', route: '/admin/configuracion/documentos', subtitle: 'Acta constitutiva y legales', dot: 'green', accent: '#0891B2', geo: <GeoDocumentos /> },
]

/* –– Component –– */
export default function Configuracion() {
  const navigate = useNavigate()
  const [hovered, setHovered] = useState<string | null>(null)

  const getCardStyle = (isH: boolean, accent: string): React.CSSProperties => ({
    aspectRatio: '1 / 0.75',
    borderRadius: DASH.cardRadius,
    padding: DASH.cardPadding,
    background: accent,
    border: 'none',
    cursor: 'pointer',
    position: 'relative',
    overflow: 'hidden',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'flex-start',
    transition: 'transform 0.25s ease, box-shadow 0.25s ease',
    transform: isH ? 'translateY(-3px)' : 'translateY(0)',
    boxShadow: isH ? '0 6px 12px rgba(0,0,0,0.15), 0 12px 32px rgba(0,0,0,0.1)' : '0 2px 4px rgba(0,0,0,0.08), 0 4px 12px rgba(0,0,0,0.06)',
  })

  return (
    <ModuleLayout titulo="Configuración" moduloPadre={{ nombre: 'Dashboard', ruta: '/dashboard' }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=${tokens.fonts.heading}:wght@400;500;600;700;800&display=swap');
      `}</style>

      <div style={{
        background: DASH.bg,
        minHeight: 'calc(100vh - 140px)',
        padding: '32px 40px',
      }}>
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(7, 1fr)',
          gap: '14px',
        }}>
          {CARDS.map(card => {
            const isH = hovered === card.id
            return (
              <div
                key={card.id}
                style={getCardStyle(isH, card.accent)}
                onMouseEnter={() => setHovered(card.id)}
                onMouseLeave={() => setHovered(null)}
                onClick={() => navigate(card.route)}
              >
                {/* Geometric SVG background */}
                <div style={{
                  ...geoStyle,
                  transform: isH ? 'translate(4px, -4px) scale(1.05)' : 'translate(0,0) scale(1)',
                }}>
                  {card.geo}
                </div>

                {/* Status dot */}
                <div style={{
                  position: 'absolute', top: '14px', right: '14px',
                  width: DASH.dotSize, height: DASH.dotSize, borderRadius: '50%',
                  backgroundColor: DOT[card.dot] || DOT.gray,
                }} />

                {/* Title */}
                <div style={{
                  fontFamily: DASH.fontFamily,
                  fontSize: DASH.titleSize,
                  fontWeight: DASH.titleWeight,
                  color: '#FFFFFF',
                  lineHeight: 1.2,
                  marginBottom: 'auto',
                  position: 'relative',
                  zIndex: 1,
                  textAlign: 'center',
                }}>
                  {card.label}
                </div>

                {/* Subtitle */}
                <div style={{
                  fontFamily: DASH.fontFamily,
                  fontSize: DASH.subSize,
                  color: 'rgba(255,255,255,0.7)',
                  marginTop: '6px',
                  position: 'relative',
                  zIndex: 1,
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
