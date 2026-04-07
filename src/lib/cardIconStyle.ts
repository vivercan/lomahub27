// src/lib/cardIconStyle.ts
// SOURCE OF TRUTH — Decorative icon positioning for dashboard-family cards.
// Rule: anchored bottom-right with elegant margin, 42% width / 48% height, opacity 12%.
// All dashboard and submodule card files MUST import from here.
// To replace with externally downloaded icons, only swap the SVG glyph inside the
// component; never override these position/opacity values locally.
import type { CSSProperties } from 'react'

export const CARD_ICON_POS: CSSProperties = {
  position: 'absolute',
  right: '-12%',
  bottom: '-14%',
  width: '88%',
  height: '100%',
  pointerEvents: 'none',
}

export const CARD_ICON_P = 'rgba(255,255,255,0.12)'
export const CARD_ICON_S = 'rgba(255,255,255,0.08)'
