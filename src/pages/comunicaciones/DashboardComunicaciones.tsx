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
