import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ModuleLayout } from '../../components/layout/ModuleLayout'
import {
  Users, BookOpen, SlidersHorizontal, Plug, ShieldCheck
} from 'lucide-react'

/* âââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââ
   CONFIGURACIÃN â Landing Page (estilo Dashboard V27f)
   5 cards: Usuarios, CatÃ¡logos, ParÃ¡metros, Integraciones, AuditorÃ­a
   âââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââ */

const DASH = {
  bg: '#F3F4F8',
  fontFamily: "'Montserrat', sans-serif",
  fontBody: "'Montserrat', sans-serif",
  cardBg: 'linear-gradient(180deg, #FFFFFF 0%, #F6F7FA 100%)',
  cardBorder: '1px solid #CDD5E1',
  cardRadius: '20px',
  cardPadding: '24px',
  cardShadow: '0 2px 4px rgba(0,0,0,0.06), 0 4px 12px rgba(0,0,0,0.05), 0 8px 24px rgba(0,0,0,0.04), inset 0 1px 0 rgba(255,255,255,0.9)',
  cardHoverShadow: '0 4px 8px rgba(0,0,0,0.08), 0 8px 24px rgba(0,0,0,0.08), 0 16px 48px rgba(0,0,0,0.06), inset 0 1px 0 rgba(255,255,255,0.95)',
  titleSize: '1.1rem',
  titleWeight: 700,
  titleColor: '#1E3A8A',
  subSize: '13px',
  subColor: '#64748B',
  dotSize: '8px',
} as const

const DOT: Record<string, string> = {
  green: '#10B981', blue: '#3B82F6', yellow: '#F59E0B',
  purple: '#8B5CF6', red: '#EF4444', gray: '#CBD5E1',
}

/* ââ Geometric SVGs (matching dashboard style) ââ */
const geoStyle: React.CSSProperties = {
  position: 'absolute', top: 0, right: 0, width: '100%', height: '100%',
  pointerEvents: 'none', overflow: 'hidden', borderRadius: '20px',
  transition: 'transform 0.6s cubic-bezier(0.23,1,0.32,1)',
}

const GeoUsuarios = () => (
  <div style={geoStyle}>
    <svg viewBox="0 0 200 140" style={{ position: 'absolute', right: '-10px', bottom: '-10px', width: '65%', height: '75%', opacity: 0.18 }}>
      <circle cx="100" cy="45" r="22" fill="none" stroke="#3B82F6" strokeWidth="1.2" />
      <circle cx="130" cy="65" r="18" fill="none" stroke="#F59E0B" strokeWidth="1" />
      <circle cx="75" cy="70" r="16" fill="none" stroke="#3B82F6" strokeWidth="0.8" />
      <path d="M70,100 Q100,80 130,100" fill="none" stroke="#F59E0B" strokeWidth="1" />
    </svg>
  </div>
)

const GeoCatalogos = () => (
  <div style={geoStyle}>
    <svg viewBox="0 0 200 140" style={{ position: 'absolute', right: '-10px', bottom: '-10px', width: '65%', height: '75%', opacity: 0.18 }}>
      <rect x="65" y="25" width="60" height="45" rx="4" fill="none" stroke="#10B981" strokeWidth="1.2" />
      <rect x="80" y="40" width="60" height="45" rx="4" fill="none" stroke="#F59E0B" strokeWidth="1" />
      <line x1="75" y1="42" x2="115" y2="42" stroke="#10B981" strokeWidth="0.8" />
      <line x1="75" y1="50" x2="110" y2="50" stroke="#10B981" strokeWidth="0.6" />
    </svg>
  </div>
)

const GeoParametros = () => (
  <div style={geoStyle}>
    <svg viewBox="0 0 200 140" style={{ position: 'absolute', right: '-10px', bottom: '-10px', width: '65%', height: '75%', opacity: 0.18 }}>
      <line x1="70" y1="40" x2="160" y2="40" stroke="#F59E0B" strokeWidth="1.2" />
      <circle cx="110" cy="40" r="6" fill="none" stroke="#3B82F6" strokeWidth="1.5" />
      <line x1="70" y1="65" x2="160" y2="65" stroke="#F59E0B" strokeWidth="1" />
      <circle cx="130" cy="65" r="6" fill="none" stroke="#3B82F6" strokeWidth="1.5" />
      <line x1="70" y1="90" x2="160" y2="90" stroke="#F59E0B" strokeWidth="0.8" />
      <circle cx="90" cy="90" r="6" fill="none" stroke="#3B82F6" strokeWidth="1.5" />
    </svg>
  </div>
)

const GeoIntegraciones = () => (
  <div style={geoStyle}>
    <svg viewBox="0 0 200 140" style={{ position: 'absolute', right: '-10px', bottom: '-10px', width: '65%', height: '75%', opacity: 0.18 }}>
      <circle cx="90" cy="55" r="18" fill="none" stroke="#8B5CF6" strokeWidth="1.2" />
      <circle cx="140" cy="55" r="18" fill="none" stroke="#F59E0B" strokeWidth="1" />
      <line x1="108" y1="55" x2="122" y2="55" stroke="#3B82F6" strokeWidth="1.5" strokeDasharray="4 3" />
      <circle cx="115" cy="85" r="12" fill="none" stroke="#3B82F6" strokeWidth="0.8" />
    </svg>
  </div>
)

const GeoAuditoria = () => (
  <div style={geoStyle}>
    <svg viewBox="0 0 200 140" style={{ position: 'absolute', right: '-10px', bottom: '-10px', width: '65%', height: '75%', opacity: 0.18 }}>
      <path d="M100,25 L130,45 L120,80 L80,80 L70,45 Z" fill="none" stroke="#EF4444" strokeWidth="1.2" />
      <path d="M90,55 L100,65 L120,45" fill="none" stroke="#F59E0B" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  </div>
)

/* ââ Card definitions ââ */
interface ConfigCard {
  id: string
  label: string
  route: string
  subtitle: string
  dot: string
  geo: React.ReactNode
}

const CARDS: ConfigCard[] = [
  { id: 'usuarios', label: 'Usuarios', route: '/admin/configuracion/usuarios', subtitle: 'Roles y permisos', dot: 'blue', geo: <GeoUsuarios /> },
  { id: 'catalogos', label: 'CatÃ¡logos', route: '/admin/configuracion/catalogos', subtitle: 'Tipos y estados', dot: 'green', geo: <GeoCatalogos /> },
  { id: 'parametros', label: 'ParÃ¡metros', route: '/admin/configuracion/parametros', subtitle: 'Tarifas y costos', dot: 'yellow', geo: <GeoParametros /> },
  { id: 'integraciones', label: 'Integraciones', route: '/admin/configuracion/integraciones', subtitle: 'ANODOS, GPS, WhatsApp', dot: 'purple', geo: <GeoIntegraciones /> },
  { id: 'auditoria', label: 'AuditorÃ­a', route: '/admin/configuracion/auditoria', subtitle: 'Actividad del sistema', dot: 'red', geo: <GeoAuditoria /> },
]

/* ââ Component ââ */
export default function Configuracion() {
  const navigate = useNavigate()
  const [hovered, setHovered] = useState<string | null>(null)

  const getCardStyle = (isH: boolean): React.CSSProperties => ({
    aspectRatio: '1 / 0.75',
    borderRadius: DASH.cardRadius,
    padding: DASH.cardPadding,
    background: DASH.cardBg,
    border: DASH.cardBorder,
    cursor: 'pointer',
    position: 'relative',
    overflow: 'hidden',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'flex-start',
    justifyContent: 'flex-start',
    transition: 'transform 0.25s ease, box-shadow 0.25s ease',
    transform: isH ? 'translateY(-3px)' : 'translateY(0)',
    boxShadow: isH ? DASH.cardHoverShadow : DASH.cardShadow,
  })

  return (
    <ModuleLayout titulo="ConfiguraciÃ³n" moduloPadre={{ nombre: 'Dashboard', ruta: '/dashboard' }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Montserrat:wght@400;500;600;700;800&display=swap');
      `}</style>

      <div style={{
        background: DASH.bg,
        minHeight: 'calc(100vh - 140px)',
        padding: '32px 40px',
      }}>
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(5, 1fr)',
          gap: '20px',
          maxWidth: '1400px',
          margin: '0 auto',
        }}>
          {CARDS.map(card => {
            const isH = hovered === card.id
            return (
              <div
                key={card.id}
                style={getCardStyle(isH)}
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
                  color: DASH.titleColor,
                  lineHeight: 1.2,
                  marginBottom: 'auto',
                  position: 'relative',
                  zIndex: 1,
                }}>
                  {card.label}
                </div>

                {/* Subtitle */}
                <div style={{
                  fontFamily: DASH.fontBody,
                  fontSize: DASH.subSize,
                  color: DASH.subColor,
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
