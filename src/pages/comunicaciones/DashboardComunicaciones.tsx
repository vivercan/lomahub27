import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { ModuleLayout } from '../../components/layout/ModuleLayout'
import { tokens } from '../../lib/tokens'

/* ———————————————————————————————————————————————————————————————
   COMUNICACIONES — Landing Page (3 cards)
   Dark glass cards with amber hover glow — same FX27 style as DashboardVentas
   ——————————————————————————————————————————————————————————————— */

const D = {
  bg: '#E8EBF0',
  font: tokens.fonts.heading,
  fontBody: tokens.fonts.body,
} as const

const STROKE_SCALE = 0.75

const IcoCenter = ({ set, name, hovered }: { set: string; name: string; hovered?: boolean }) => {
  const [srcWhite, setSrcWhite] = useState(`https://api.iconify.design/${set}:${name}.svg?color=%23ffffff`)
  const [srcOrange, setSrcOrange] = useState(`https://api.iconify.design/${set}:${name}.svg?color=%23ff7800`)

  useEffect(() => {
    const thinify = (raw: string) =>
      raw.replace(/stroke-width="([^"]+)"/g, (_, w) =>
        `stroke-width="${(parseFloat(w) * STROKE_SCALE).toFixed(2)}"`)

    fetch(`https://api.iconify.design/${set}:${name}.svg?color=%23ffffff`)
      .then(r => r.text())
      .then(raw => setSrcWhite(`data:image/svg+xml,${encodeURIComponent(thinify(raw))}`))
      .catch(() => {})

    fetch(`https://api.iconify.design/${set}:${name}.svg?color=%23ff9940`)
      .then(r => r.text())
      .then(raw => setSrcOrange(`data:image/svg+xml,${encodeURIComponent(thinify(raw))}`))
      .catch(() => {})
  }, [set, name])

  return (
    <img src={hovered ? srcOrange : srcWhite} alt=""
      style={{ width: '79px', height: '79px', opacity: hovered ? 0.55 : 0.90, filter: 'drop-shadow(0 1px 2px rgba(0,0,0,0.3))', transition: 'opacity 0.3s ease' }} />
  )
}

interface CardDef {
  id: string; label: string; route: string; kpiLabel: string;
  iconSet: string; iconName: string
}

const CARDS: CardDef[] = [
  { id: 'correos',         label: 'Correos Automáticos', route: '/comunicaciones/correos',          kpiLabel: 'Templates',  iconSet: 'hugeicons', iconName: 'mail-send-02' },
  { id: 'chief_of_staff',  label: 'Chief of Staff IA',   route: '/comunicaciones/chief-of-staff',   kpiLabel: 'Briefings',  iconSet: 'hugeicons', iconName: 'artificial-intelligence-04' },
  { id: 'notificaciones',  label: 'Notificaciones',      route: '/comunicaciones/notificaciones',   kpiLabel: 'Centro',     iconSet: 'hugeicons', iconName: 'notification-02' },
]

export default function DashboardComunicaciones() {
  const navigate = useNavigate()
  const [hovered, setHovered] = useState<string | null>(null)
  const [pressed, setPressed] = useState<string | null>(null)

  return (
    <ModuleLayout titulo="Comunicaciones">
      <div style={{ background: D.bg, minHeight: 'calc(100vh - 120px)', padding: '32px 40px' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '20px' }}>
          {CARDS.map(card => {
            const isH = hovered === card.id
            const isP = pressed === card.id

            const bgNormal =
              'linear-gradient(155deg, rgba(18,32,58,0.96) 0%, rgba(12,22,42,0.98) 35%, rgba(8,16,32,1) 70%, rgba(6,12,24,1) 100%), ' +
              'linear-gradient(135deg, rgba(180,100,50,0.28) 0%, rgba(60,90,140,0.25) 50%, rgba(180,100,50,0.28) 100%)'
            const bgHover =
              'linear-gradient(155deg, rgba(28,48,82,1) 0%, rgba(20,35,62,1) 35%, rgba(14,24,45,1) 70%, rgba(10,18,35,1) 100%), ' +
              'linear-gradient(135deg, rgba(240,160,80,0.65) 0%, rgba(220,140,70,0.6) 25%, rgba(70,110,170,0.4) 50%, rgba(220,140,70,0.6) 75%, rgba(240,160,80,0.65) 100%)'

            return (
              <div
                key={card.id}
                style={{
                  aspectRatio: '1 / 0.9',
                  borderRadius: '10px',
                  padding: '24px 20px',
                  backgroundImage: isH ? bgHover : bgNormal,
                  backgroundOrigin: 'border-box',
                  backgroundClip: 'padding-box, border-box',
                  border: '2px solid transparent',
                  cursor: 'pointer',
                  position: 'relative',
                  overflow: 'hidden',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  gap: '0px',
                  transition: 'all 0.3s ease',
                  transform: isP ? 'translateY(0px)' : isH ? 'translateY(-6px)' : 'translateY(0)',
                  boxShadow: isP
                    ? '0 1px 2px rgba(0,0,0,0.3), 0 2px 8px rgba(0,0,0,0.4), inset -2px -2px 4px rgba(0,0,0,0.2)'
                    : isH
                    ? '0 4px 8px rgba(0,0,0,0.4), 0 10px 24px rgba(0,0,0,0.6), 0 0 30px rgba(240,160,80,0.15), inset 0 1px 0 rgba(255,255,255,0.05)'
                    : '0 2px 4px rgba(0,0,0,0.3), 0 6px 16px rgba(0,0,0,0.5), inset -2px -2px 4px rgba(0,0,0,0.2)',
                  fontFamily: D.font,
                }}
                onMouseEnter={() => setHovered(card.id)}
                onMouseLeave={() => { setHovered(null); setPressed(null) }}
                onMouseDown={() => setPressed(card.id)}
                onMouseUp={() => setPressed(null)}
                onClick={() => navigate(card.route)}
              >
                {/* Top shine */}
                <div style={{
                  position: 'absolute', top: 0, left: 0, right: 0, height: '35%',
                  background: 'linear-gradient(180deg, rgba(255,255,255,0.12) 0%, transparent 100%)',
                  borderTopLeftRadius: '10px', borderTopRightRadius: '10px',
                  pointerEvents: 'none', opacity: isH ? 0.5 : 0.3,
                  transition: 'opacity 0.3s ease',
                }} />

                {/* Label */}
                <div style={{
                  fontFamily: D.font, fontSize: '17px', fontWeight: 600, color: '#ffffff',
                  textAlign: 'center', position: 'relative', zIndex: 1, letterSpacing: '0.02em',
                  lineHeight: 1.2, paddingTop: '2px',
                }}>
                  {card.label}
                </div>

                {/* Icon */}
                <div style={{ position: 'relative', zIndex: 1, transition: 'transform 0.3s ease', transform: isH ? 'scale(1.05)' : 'none' }}>
                  <IcoCenter set={card.iconSet} name={card.iconName} hovered={isH} />
                </div>

                {/* KPI */}
                <div style={{ textAlign: 'center', position: 'relative', zIndex: 1 }}>
                  <div style={{
                    fontFamily: D.font, fontSize: '22px', fontWeight: 600,
                    color: isH ? 'rgba(240,160,80,1)' : 'rgba(255,255,255,0.95)',
                    lineHeight: 1, transition: 'color 0.3s ease',
                  }}>
                    —
                  </div>
                  <div style={{
                    fontFamily: D.font, fontSize: '10px', fontWeight: 500,
                    color: 'rgba(255,255,255,0.50)', marginTop: 3, letterSpacing: '0.03em',
                    textTransform: 'uppercase',
                  }}>
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
