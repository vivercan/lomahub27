// SSoT — tratamiento visual icono watermark cards (M1 Refinado)
// Icono Lucide oversized anclado bottom-right, recortado naturalmente por overflow:hidden del card
import type { CSSProperties } from 'react'

export const CARD_ICON_POS: CSSProperties = {
  position: 'absolute',
  right: '-8%',
  bottom: '-12%',
  width: '78%',
  height: '108%',
  pointerEvents: 'none',
}

export const CARD_ICON_P = 'rgba(255,255,255,0.14)'
export const CARD_ICON_S = 'rgba(255,255,255,0.08)'
