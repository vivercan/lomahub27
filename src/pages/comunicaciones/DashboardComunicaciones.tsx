import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ModuleLayout } from '../../components/layout/ModuleLayout'
import { tokens } from '../../lib/tokens'

/* ———————————————————————————————————————————————————————————————
   COMUNICACIONES — Landing Page (5 cards)
   Correos, WhatsApp, Com. Proactiva, Escalamiento, Notificaciones
   ——————————————————————————————————————————————————————————————— */

const D = {
  bg: '#E8EBF0',
  font: tokens.fonts.heading,
  cardRadius: '14px',
  titleSize: '20px',
  titleWeight: 800,
  kpiSize: '28px',
  kpiWeight: 600,
  subSize: '9px',
} as const

const ICO_OPACITY = 0.20
const ico = (path: string, style: React.CSSProperties) => (
  <img src={`https://api.iconify.design/${path}.svg?color=%23ffffff`} alt="" style={style} />
)
const compose = (main: string) => () => (
  <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none', opacity: ICO_OPACITY }}>
    {ico(main, { position: 'absolute', right: '-2%', bottom: '-2%', width: '70%', height: '70%' })}
  </div>
)

const CARDS = [
  { id: 'correos',      label: 'Correos Automáticos',    route: '/comunicaciones/correos',              kpiLabel: 'Templates',      icon: compose('hugeicons:mail-send-02'),       accent: '#2563EB' },
  { id: 'whatsapp',     label: 'WhatsApp',               route: '/servicio/whatsapp',                   kpiLabel: 'Bandeja',        icon: compose('hugeicons:whatsapp'),            accent: '#16A34A' },
  { id: 'proactiva',    label: 'Com. Proactiva',         route: '/servicio/comunicacion-proactiva',     kpiLabel: 'Campañas',       icon: compose('hugeicons:megaphone-01'),        accent: '#D97706' },
  { id: 'escalamiento', label: 'Escalamiento',           route: '/servicio/escalamiento-whatsapp',      kpiLabel: 'Pendientes',     icon: compose('hugeicons:arrow-up-double'),     accent: '#DC2626' },
  { id: 'notificaciones', label: 'Notificaciones',       route: '/comunicaciones/notificaciones',       kpiLabel: 'Sin leer',       icon: compose('hugeicons:notification-03'),     accent: '#7C3AED' },
]

export default function DashboardComunicaciones() {
  const navigate = useNavigate()
  const [hovered, setHovered] = useState<string | null>(null)

  const getCardStyle = (isH: boolean, accent: string): React.CSSProperties => ({
    aspectRatio: '1 / 0.75',
    borderRadius: D.cardRadius,
    padding: '22px',
    background: accent,
    border: 'none',
    cursor: 'pointer',
    position: 'relative',
    overflow: 'hidden',
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'space-between',
    transition: 'transform 0.25s ease, box-shadow 0.25s ease',
    transform: isH ? 'translateY(-3px)' : 'none',
    boxShadow: isH ? '0 6px 12px rgba(0,0,0,0.15), 0 12px 32px rgba(0,0,0,0.1)' : '0 2px 4px rgba(0,0,0,0.08), 0 4px 12px rgba(0,0,0,0.06)',
  })

  return (
    <ModuleLayout titulo="Comunicaciones" moduloPadre={{ nombre: 'Dashboard', ruta: '/dashboard' }}>
      <div style={{ background: D.bg, minHeight: 'calc(100vh - 120px)', padding: '32px 40px' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '14px' }}>
          {CARDS.map(card => {
            const isH = hovered === card.id
            const Icon = card.icon
            return (
              <div
                key={card.id}
                style={getCardStyle(isH, card.accent)}
                onMouseEnter={() => setHovered(card.id)}
                onMouseLeave={() => setHovered(null)}
                onClick={() => navigate(card.route)}
              >
                <div style={{
                  position: 'absolute', inset: 0, pointerEvents: 'none', overflow: 'hidden', borderRadius: '14px',
                  transition: 'transform 0.6s cubic-bezier(0.23,1,0.32,1)',
                  transform: isH ? 'translate(4px,-4px) scale(1.05)' : 'none',
                }}>
                  <Icon />
                </div>
                <div style={{ position: 'absolute', top: 14, right: 14, width: 6, height: 6, borderRadius: '50%', backgroundColor: 'rgba(255,255,255,0.35)' }} />
                <div style={{ fontFamily: D.font, fontSize: D.titleSize, fontWeight: D.titleWeight, color: '#FFFFFF', lineHeight: 1.2, position: 'relative', zIndex: 1, textAlign: 'center' }}>
                  {card.label}
                </div>
                <div>
                  <div style={{ fontFamily: D.font, fontSize: D.kpiSize, fontWeight: D.kpiWeight, color: '#FFFFFF', lineHeight: 1, position: 'relative', zIndex: 1 }}>
                    —
                  </div>
                  <div style={{ fontFamily: D.font, fontSize: D.subSize, color: 'rgba(255,255,255,0.7)', marginTop: 3, position: 'relative', zIndex: 1 }}>
                    {card.kpiLabel}
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </ModuleLayout>
  )
}
