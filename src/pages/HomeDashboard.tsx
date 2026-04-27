// HomeDashboard V43 — P20 Rubber Salidos + Títulos Blancos Hundidos (Bloque 1)
//
// Cambios V43 sobre V42:
//   • TÍTULO: 22px → 27px · weight 800 → 900 · letter-spacing -0.02 → -0.024em
//     · color BLANCO 0.96 + textShadow rubber deboss (top-dark 0.74 + bottom-light 0.26 + drop 0.32)
//   • SUBTÍTULO: 12px → 14px · weight 500 → 600 · color NEGRO rubber (rgba(0,0,0,0.42))
//     + textShadow dual (top 0.66 + bottom 0.20)
//   • ICONOS: +10% tamaño (138→152, 136→150, 118→130, 116→128, 108→119, 100→110)
//     · Oportunidades se queda 100 (evita empalme con subtitle largo)
//     · opacity 0.12/0.15 → 0.88/0.92
//     · filter full chain en img: brightness(0) invert(0.95) + 4 drop-shadows
//       [highlight -1.5/-1.5 + shadow 2/2 + lift 6px + depth 2px]
//   • OPORTUNIDADES FIX: iconRight 16 → 20px · iconBottom 8 → 4px
//   • DIAGONALES REMOVIDAS: renderDecor ya no incluye geometry, solo icon
//     (matchea demo P20 limpio sin patrones que peleen con el 3D laser-cut)
//
// HomeDashboard V42 — All-in: verde enterprise + Ventas vibrante + parallax reforzado + ritmo orgánico
//
// 8 cambios sobre V41:
//   1. PULSES DESINCRONIZADOS — cada card con delay random 0-1.8s (sistema orgánico, no marea sincronizada)
//   2. CONFIG SIN PULSE — solo dot estático dorado (es módulo sistema, no operación)
//   3. DOTS VERDE ENTERPRISE — #10B981 con gradient radial #34D399→#10B981→#047857 (Slack/Linear "active")
//   4. VENTAS VIBRANTE — gradient #F09830→#9A4E0E (más vivo que V41, sigue premium sin cruzar a cartoon)
//   5. PARALLAX 3D REFORZADO — tilt ±6° + translateY -10 + translateZ +24 + scale 1.02
//   6. GRID GAP RITHM — 18px horizontal + 24px vertical (respiración entre filas)
//   7. COMERCIAL ICONO — 124 → 136 (reforza dominancia visual del rey)
//   8. HAPTIC FLASH ARM — 120ms flash dorado al armar card (confirmación visual)
//
// HomeDashboard V41 — Refinement maduro completo (Packs A + B + C)
//
// 16 cambios aplicados sobre V40:
//
// PACK A (tus 5 recomendaciones + mis 4):
//   1. Subtítulos 0.78 → 0.88 opacity (lectura reforzada)
//   2. Iconos 0.09 → 0.12 base / 0.15 hover + contrast 1.1 + drop-shadow más fino (más firmes sin crecer)
//   3. Títulos text-shadow top-dark 0.40 → 0.28 (menos halo, más engraving sutil)
//   4. Copper Ventas #C77A22 → #D08530 (más luminoso sin cruzar a cartoon)
//   5. Diagonales opacity base 0.08 → 0.06 / stronger 0.10 → 0.08 (bajar 25%, dejan de dominar)
//   6. Servicio al Cliente: diagonales más angostas (32% → 26%, 18% → 16%), recupera azul profundo
//   7. Comunicaciones: gradient start #4F88E3 → #4078D0 (-8% brillo), más autoridad
//   8. Comercial: gradient #2557A8→#082552 → #224CA0→#062348 + inset extra -40px 60px 0.18 (rey visual)
//   9. Sombras arquitectónicas: 4 layers calibradas con spread negative en vez de "nube"
//
// PACK B (evolución del dot + mejoras UX):
//   10. Dot evolucionado a pulse ring + dot gradient radial
//       - Center 6×6 radial-gradient(#FFD270 → #D6A84F → #B8892B)
//       - Pulse ring 14×14 border 1.5px #FFC14A, animación scale 1→2.2 opacity 0.70→0 en 2.2s ease-in-out
//   11. Transición de página 150ms fade-out antes de navegar (premium perception)
//   12. Padding alineado 32px AppHeader + Grid (antes 28/32 inconsistente)
//   13. @media (prefers-reduced-motion) respect — accesibilidad vestibular
//
// PACK C (polish final):
//   14. Logo "27" con text-shadow glow azul sutil 0 0 8px rgba(59,108,231,0.28)
//   15. Cursor pointer → pointer en cards no armed, move solo en armed/drag
//   16. Keyframe lhDotPulse añadido al <style>
//
// Preservado: 8 cards, distribución, drag cross-family con doble-click V37,
// parallax 3D tilt, spotlight interior, mount animation staggered, noise texture.
//
// HomeDashboard V40 — Fix raya blanca inferior (border CSS → insets asimétricos)
// V40 fix visual: JJ reportó una "raya blanca" en la base de todos los cards.
// Causa: border 1px blanco 360° + inset bottom dark 3px producían un contraste parasitario.
// Fix: border: 'none', reemplazado por inset laterales 1px en el boxShadow stack.
// Preservado todo V39: parallax, spotlight, rim light, shadows dramáticas, patterns 0.08.
// V39 header:
// HomeDashboard V39 — Cinematic Premium Command Center + 3 refinamientos finales
// V39 sobre V38 (validado por JJ como "10/10 absoluto objetivo"):
//   - FONDO más oscuro: centro #B0B6C0 → orillas #747A85 (antes #CED3DB → #878C96)
//   - SHADOW BOTTOM bump: última layer 0.32 → 0.44 (cards flotan con más peso)
//   - PATTERNS opacity: baseline 0.06 → 0.08 / stronger 0.08 → 0.10 (más texturales sobre bg oscuro)
// Resto idéntico a V38: parallax 3D, spotlight, rim light, noise, mount animation.
// V38 header original abajo para referencia:
// HomeDashboard V38 — Cinematic Premium Command Center
// Combo B + TODO lo mejor. All-in on impact + depth.
//
// CAMBIOS V38 sobre V37:
//   1. FONDO RADIAL OSCURO: gris plomo con vignette `#C8CED6 → #8A8F98`
//   2. SHADOWS DRAMÁTICAS: 4-layer stack hasta rgba 0.40 max
//   3. SPOTLIGHT INTERIOR: lámpara cenital top-center en cada card (radial 0→55%)
//   4. RIM LIGHT PRONUNCIADO: 3px top brillante + 3px bottom oscuro (grosor físico)
//   5. PARALLAX 3D TILT: cursor parallax ±2° perspective (Apple/Linear-style)
//   6. OUTLINE OUTER OSCURO: 1px rgba(0,0,0,0.18) separa card del fondo
//   7. PATTERNS REVEAL EN HOVER: planos geométricos 0.06→0.14 con transición
//   8. NOISE TEXTURE sutil: SVG turbulence overlay 1.5% opacity
//   9. PRESSED Z-DEPTH real: translateZ(-8px) con transición de scale sutil
//   10. LIGHT SWEEP al mount: animación de "encendido" una sola vez (180ms stagger)
//
// Preservado: distribución, familias, drag cross-family con doble-click, timer 250ms,
// persistencia localStorage, AppHeader V32 intacto, dot dorado, engraved titles.

import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import AppHeader from '../components/layout/AppHeader'
import { useAuthContext } from '../hooks/AuthContext'

interface CardConfig {
  id: string
  label: string
  route: string
  bgColor: string
  gradient: string
  iconFile: string
  statusDot: 'green' | 'yellow' | 'red' | 'gray'
  statusText: string
}

interface Slot {
  gridColumn: string
  gridRow: string
}

interface Tilt { rx: number; ry: number }

const SLOTS: Slot[] = [
  { gridColumn: '1 / 2', gridRow: '1 / 2' },
  { gridColumn: '2 / 4', gridRow: '1 / 2' },
  { gridColumn: '4 / 5', gridRow: '1 / 3' },
  { gridColumn: '1 / 2', gridRow: '2 / 3' },
  { gridColumn: '2 / 3', gridRow: '2 / 3' },
  { gridColumn: '3 / 4', gridRow: '2 / 4' },
  { gridColumn: '1 / 3', gridRow: '3 / 4' },
  { gridColumn: '4 / 5', gridRow: '3 / 4' },
]

const DEFAULT_LAYOUT = [
  'oportunidades', 'servicio-clientes', 'comercial', 'operaciones',
  'ventas', 'comunicaciones', 'autofomento', 'config',
]

const ARMED_TIMEOUT_MS = 5000

// V38 — SVG noise texture inline (base64 encoded for no extra HTTP)
const NOISE_SVG = `url("data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='120' height='120'><filter id='n'><feTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='2' stitchTiles='stitch'/><feColorMatrix values='0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0.4 0'/></filter><rect width='100%' height='100%' filter='url(%23n)' opacity='0.4'/></svg>")`

export default function HomeDashboard() {
  const navigate = useNavigate()
  const { user, logout } = useAuthContext()
  const [hoveredCard, setHoveredCard] = useState<string | null>(null)
  const [pressedCard, setPressedCard] = useState<string | null>(null)
  const [draggingId, setDraggingId] = useState<string | null>(null)
  const [overSlot, setOverSlot] = useState<number | null>(null)
  const [armedCardId, setArmedCardId] = useState<string | null>(null)
  const [cardTilts, setCardTilts] = useState<Record<string, Tilt>>({})
  const [mounted, setMounted] = useState(false)

  const armedTimerRef = useRef<number | null>(null)
  const clickTimerRef = useRef<number | null>(null)
  const pendingClickIdRef = useRef<string | null>(null)
  const clickCountRef = useRef<number>(0)

  const formatName = (email?: string) => {
    if (!email) return 'Usuario'
    const name = email.split('@')[0]
    return name.split('.').map((p: string) => p.charAt(0).toUpperCase() + p.slice(1)).join(' ')
  }

  const handleLogout = async () => {
    await logout()
    navigate('/login')
  }

  const cardCatalog: Record<string, CardConfig> = useMemo(() => ({
    'oportunidades': { id: 'oportunidades', label: 'Oportunidades', route: '/ventas/mis-leads', bgColor: '#2763C4', gradient: 'linear-gradient(135deg, #2763C4 0%, #0A2D6F 100%)', iconFile: 'oportunidades.svg', statusDot: 'green', statusText: 'Mis Leads · Funnel · Oportunidades' },
    'servicio-clientes': { id: 'servicio-clientes', label: 'Servicio al Cliente', route: '/servicio/dashboard', bgColor: '#2B5FB5', gradient: 'linear-gradient(135deg, #2B5FB5 0%, #0B2E68 100%)', iconFile: 'servicio-al-cliente.svg', statusDot: 'green', statusText: 'Tickets · KPIs · Programación' },
    'comercial': { id: 'comercial', label: 'Comercial', route: '/ventas/dashboard', bgColor: '#224CA0', gradient: 'linear-gradient(135deg, #224CA0 0%, #062348 100%)', iconFile: 'comercial.svg', statusDot: 'green', statusText: 'Formatos · Cotizaciones · Analytics' },
    'operaciones': { id: 'operaciones', label: 'Operaciones', route: '/operaciones/dashboard', bgColor: '#3D78D6', gradient: 'linear-gradient(135deg, #3D78D6 0%, #134287 100%)', iconFile: 'camion-contenedor-v2.svg', statusDot: 'green', statusText: 'Despachos · Seguimiento' },
    // V51 26/Abr/2026: REVERT BUG-002. JJ aclaró: Comercial=tools de trabajo, Ventas=panel resultados/KPIs. Son distintos, ambos quedan.
    'ventas': { id: 'ventas', label: 'Ventas', route: '/ventas/analytics', bgColor: '#F09830', gradient: 'linear-gradient(135deg, #F09830 0%, #9A4E0E 100%)', iconFile: 'ingresos.svg', statusDot: 'green', statusText: 'Analytics · KPIs · Resultados' },
    'comunicaciones': { id: 'comunicaciones', label: 'Comunicaciones', route: '/comunicaciones/dashboard', bgColor: '#4078D0', gradient: 'linear-gradient(135deg, #4078D0 0%, #153E88 100%)', iconFile: 'comunicaciones.svg', statusDot: 'green', statusText: 'Mail · WhatsApp · Resumen Ejecutivo IA' },
    'autofomento': { id: 'autofomento', label: 'Control de equipo', route: '/control-equipo', bgColor: '#3A72CF', gradient: 'linear-gradient(135deg, #3A72CF 0%, #153E82 100%)', iconFile: 'gps.svg', statusDot: 'green', statusText: 'GPS · Cajas · Tractos · Thermos' },
    'config': { id: 'config', label: 'Configuración', route: '/admin/configuracion', bgColor: '#3F4856', gradient: 'linear-gradient(135deg, #3F4856 0%, #0F1620 100%)', iconFile: 'configuracion.svg', statusDot: 'gray', statusText: '' },
  }), [])

  const layoutKey = `lhub27-layout-${user?.id || 'guest'}`
  const [layout, setLayout] = useState<string[]>(() => {
    if (typeof window === 'undefined') return DEFAULT_LAYOUT
    try {
      const stored = window.localStorage.getItem(layoutKey)
      if (stored) {
        const parsed = JSON.parse(stored)
        if (Array.isArray(parsed) && parsed.length === 8 && parsed.every((id) => id in cardCatalog)) {
          return parsed
        }
      }
    } catch {}
    return DEFAULT_LAYOUT
  })

  useEffect(() => {
    if (!user?.id) return
    try {
      const stored = window.localStorage.getItem(layoutKey)
      if (stored) {
        const parsed = JSON.parse(stored)
        if (Array.isArray(parsed) && parsed.length === 8 && parsed.every((id: string) => id in cardCatalog)) {
          setLayout(parsed)
          return
        }
      }
    } catch {}
    setLayout(DEFAULT_LAYOUT)
  }, [user?.id, layoutKey, cardCatalog])

  useEffect(() => {
    if (typeof window === 'undefined') return
    try {
      window.localStorage.setItem(layoutKey, JSON.stringify(layout))
    } catch {}
  }, [layout, layoutKey])

  // V38 — mount animation flag (light sweep 1-time)
  useEffect(() => {
    const t = window.setTimeout(() => setMounted(true), 50)
    return () => window.clearTimeout(t)
  }, [])

  // Cleanup timers
  useEffect(() => {
    return () => {
      if (armedTimerRef.current) window.clearTimeout(armedTimerRef.current)
      if (clickTimerRef.current) window.clearTimeout(clickTimerRef.current)
    }
  }, [])

  // ESC para desarmar
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && armedCardId) {
        setArmedCardId(null)
        if (armedTimerRef.current) window.clearTimeout(armedTimerRef.current)
      }
    }
    document.addEventListener('keydown', handler)
    return () => document.removeEventListener('keydown', handler)
  }, [armedCardId])

  const [flashCardId, setFlashCardId] = useState<string | null>(null)

  const armCard = useCallback((cardId: string) => {
    setArmedCardId(cardId)
    /* V42 — haptic flash 400ms al armar (confirmación visual) */
    setFlashCardId(cardId)
    window.setTimeout(() => setFlashCardId((prev) => (prev === cardId ? null : prev)), 420)
    if (armedTimerRef.current) window.clearTimeout(armedTimerRef.current)
    armedTimerRef.current = window.setTimeout(() => {
      setArmedCardId(null)
    }, ARMED_TIMEOUT_MS)
  }, [])

  const disarmCard = useCallback(() => {
    setArmedCardId(null)
    if (armedTimerRef.current) window.clearTimeout(armedTimerRef.current)
  }, [])

  const handleClick = (card: CardConfig) => {
    if (pendingClickIdRef.current !== card.id) {
      clickCountRef.current = 0
      pendingClickIdRef.current = card.id
    }
    clickCountRef.current += 1

    if (clickTimerRef.current) window.clearTimeout(clickTimerRef.current)

    if (clickCountRef.current >= 2) {
      const targetId = card.id
      clickCountRef.current = 0
      pendingClickIdRef.current = null
      clickTimerRef.current = null
      if (armedCardId === targetId) disarmCard()
      else armCard(targetId)
      return
    }

    clickTimerRef.current = window.setTimeout(() => {
      const count = clickCountRef.current
      const id = pendingClickIdRef.current
      clickCountRef.current = 0
      pendingClickIdRef.current = null
      clickTimerRef.current = null

      if (count === 1 && id) {
        if (armedCardId === id) disarmCard()
        else if (!draggingId) {
          // V41 — transición fade-out 150ms antes de navegar (premium perception)
          if (typeof document !== 'undefined') {
            const main = document.querySelector('.lh-dashboard-main') as HTMLElement | null
            if (main) {
              main.classList.add('lh-page-exit')
              window.setTimeout(() => navigate(card.route), 150)
              return
            }
          }
          navigate(card.route)
        }
      }
    }, 250)
  }

  const handleDragStart = (e: React.DragEvent, cardId: string) => {
    if (armedCardId !== cardId) {
      e.preventDefault()
      return
    }
    e.dataTransfer.setData('text/plain', cardId)
    e.dataTransfer.effectAllowed = 'move'
    setDraggingId(cardId)
    setPressedCard(null)
    setHoveredCard(null)
  }

  const handleDragEnd = () => {
    setDraggingId(null)
    setOverSlot(null)
    disarmCard()
  }

  const handleDragOver = (e: React.DragEvent, slotIndex: number) => {
    if (!draggingId) return
    e.preventDefault()
    e.dataTransfer.dropEffect = 'move'
    setOverSlot(slotIndex)
  }

  const handleDragLeave = (_: React.DragEvent, slotIndex: number) => {
    if (overSlot === slotIndex) setOverSlot(null)
  }

  const handleDrop = (e: React.DragEvent, targetSlotIndex: number) => {
    e.preventDefault()
    const draggedId = e.dataTransfer.getData('text/plain')
    if (!draggedId || !(draggedId in cardCatalog)) return

    const sourceSlotIndex = layout.indexOf(draggedId)
    if (sourceSlotIndex === -1 || sourceSlotIndex === targetSlotIndex) {
      setDraggingId(null)
      setOverSlot(null)
      return
    }

    const newLayout = [...layout]
    ;[newLayout[sourceSlotIndex], newLayout[targetSlotIndex]] = [newLayout[targetSlotIndex], newLayout[sourceSlotIndex]]
    setLayout(newLayout)
    setDraggingId(null)
    setOverSlot(null)
    disarmCard()
  }

  // V42 — PARALLAX 3D reforzado (±6° tilt, se siente más "sale hacia el usuario")
  const handleCardMouseMove = (e: React.MouseEvent, cardId: string) => {
    if (draggingId || armedCardId) return
    const rect = (e.currentTarget as HTMLElement).getBoundingClientRect()
    const x = e.clientX - rect.left
    const y = e.clientY - rect.top
    const px = (x / rect.width) - 0.5
    const py = (y / rect.height) - 0.5
    // Max ±3° tilt — más perceptible que V41 (±2°), sigue enterprise
    const rx = -py * 6
    const ry = px * 6
    setCardTilts(prev => ({ ...prev, [cardId]: { rx, ry } }))
  }

  const handleCardMouseLeave = (cardId: string) => {
    setCardTilts(prev => ({ ...prev, [cardId]: { rx: 0, ry: 0 } }))
    setHoveredCard(null)
    setPressedCard(null)
  }

  const getCardStyle = (isHovered: boolean, isPressed: boolean, card: CardConfig, slot: Slot, slotIndex: number, tilt: Tilt): React.CSSProperties => {
    // V38 MATERIAL — 5 layers: noise + spotlight + ambient + vertical light/shadow + base color
    const materialGradient = `
      ${NOISE_SVG},
      radial-gradient(ellipse 80% 60% at 50% 0%, rgba(255,255,255,0.18) 0%, rgba(255,255,255,0) 55%),
      radial-gradient(ellipse at 0% 0%, rgba(255,255,255,0.14) 0%, rgba(255,255,255,0) 45%),
      linear-gradient(180deg, rgba(255,255,255,0.10) 0%, rgba(255,255,255,0.02) 22%, rgba(0,0,0,0.16) 100%),
      ${card.gradient}
    `

    const isDragging = draggingId === card.id
    const isArmed = armedCardId === card.id
    const isValidDropTarget = !!draggingId && draggingId !== card.id
    const isOverThisSlot = overSlot === slotIndex && isValidDropTarget

    let transform: string
    let boxShadow: string
    let outline = 'none'
    let outlineOffset = '0'
    let cursor = 'pointer'

    if (isDragging) cursor = 'move'
    else if (isArmed) cursor = 'move'

    // V38 — PERSPECTIVE 3D baseline. Every transform inherits perspective from parent
    const basePerspective = 'perspective(1400px)'

    if (isDragging) {
      transform = `${basePerspective} scale(0.96)`
      boxShadow = `
        inset 0 3px 0 rgba(255,255,255,0.18),
        inset 0 -3px 0 rgba(0,0,0,0.32),
        0 4px 8px rgba(0,0,0,0.24),
        0 12px 24px rgba(0,0,0,0.30)
      `
    } else if (isOverThisSlot) {
      transform = `${basePerspective} translateY(-4px) translateZ(8px)`
      boxShadow = `
        inset 0 3px 0 rgba(255,255,255,0.26),
        inset 0 -3px 0 rgba(0,0,0,0.36),
        inset 0 -20px 36px rgba(0,0,0,0.18),
        0 6px 12px rgba(0,0,0,0.22),
        0 20px 40px rgba(214,168,79,0.38),
        0 40px 72px rgba(0,0,0,0.40)
      `
      outline = '2px solid rgba(214,168,79,0.85)'
      outlineOffset = '3px'
    } else if (isValidDropTarget) {
      transform = `${basePerspective}`
      boxShadow = `
        inset 0 3px 0 rgba(255,255,255,0.22),
        inset 0 -3px 0 rgba(0,0,0,0.34),
        inset 0 -20px 36px rgba(0,0,0,0.18),
        0 4px 8px rgba(0,0,0,0.18),
        0 16px 32px rgba(0,0,0,0.30),
        0 32px 56px rgba(0,0,0,0.30)
      `
      outline = '1.5px dashed rgba(214,168,79,0.42)'
      outlineOffset = '3px'
    } else if (isArmed) {
      transform = `${basePerspective} translateY(-3px) translateZ(6px)`
      boxShadow = `
        inset 1px 0 0 rgba(255,255,255,0.12),
        inset -1px 0 0 rgba(255,255,255,0.08),
        inset 0 3px 0 rgba(255,255,255,0.24),
        inset 0 -3px 0 rgba(0,0,0,0.36),
        inset 0 -20px 36px rgba(0,0,0,0.18),
        0 6px 12px rgba(0,0,0,0.22),
        0 18px 36px rgba(0,0,0,0.32),
        0 32px 56px rgba(214,168,79,0.34)
      `
      outline = '2px solid rgba(214,168,79,0.75)'
      outlineOffset = '3px'
    } else if (isPressed) {
      transform = `${basePerspective} translateY(2px) translateZ(-4px)`
      boxShadow = `
        inset 0 2px 0 rgba(255,255,255,0.10),
        inset 0 -1px 0 rgba(0,0,0,0.22),
        inset 0 4px 12px rgba(0,0,0,0.28),
        0 2px 4px rgba(0,0,0,0.16),
        0 4px 8px rgba(0,0,0,0.12)
      `
    } else if (isHovered) {
      // V48 HOVER — hierarchy ultra-elite: primary +14%, secondary +9%, strong +3%, technical -8%
      const reducedRx = tilt.rx * 0.33
      const reducedRy = tilt.ry * 0.33
      transform = `${basePerspective} rotateX(${reducedRx}deg) rotateY(${reducedRy}deg) translateY(-10px) translateZ(24px) scale(1.02)`
      const tier = card.id === 'comercial' ? 'primary'
                 : card.id === 'servicio-clientes' ? 'secondary'
                 : (card.id === 'autofomento' || card.id === 'comunicaciones') ? 'strong'
                 : card.id === 'config' ? 'technical'
                 : 'mid'
      const shadowMult = tier === 'primary' ? 1.12 : tier === 'secondary' ? 1.07 : tier === 'strong' ? 1.04 : tier === 'technical' ? 0.92 : 1
      const lightMult = tier === 'primary' ? 1.14 : tier === 'secondary' ? 1.08 : tier === 'strong' ? 1.04 : 1
      const topLight = (0.19 * lightMult).toFixed(3)
      const topLeftLight = (0.13 * lightMult).toFixed(3)
      boxShadow = `
        inset 1px 0 0 rgba(255,255,255,${topLeftLight}),
        inset -1px 0 0 rgba(255,255,255,0.08),
        inset 0 1px 0 rgba(255,255,255,${topLight}),
        inset 0 -1px 0 rgba(0,0,0,0.21),
        inset 0 -22px 38px rgba(0,0,0,0.18),
        0 3px 6px rgba(0,0,0,${(0.22 * shadowMult).toFixed(3)}),
        0 22px 40px -4px rgba(0,0,0,${(0.36 * shadowMult).toFixed(3)}),
        0 56px 88px -14px rgba(0,0,0,${(0.40 * shadowMult).toFixed(3)})
      `
    } else {
      // V48 RESTING ULTRA — hierarchy +14/+9/+3/-8 + Comercial +12% tonal depth + strong +4% richness + bevels 0.13/0.17 per spec
      transform = `${basePerspective} translateY(0) translateZ(0)`
      const tier = card.id === 'comercial' ? 'primary'
                 : card.id === 'servicio-clientes' ? 'secondary'
                 : (card.id === 'autofomento' || card.id === 'comunicaciones') ? 'strong'
                 : card.id === 'config' ? 'technical'
                 : 'mid'
      const shadowMult = tier === 'primary' ? 1.12 : tier === 'secondary' ? 1.07 : tier === 'strong' ? 1.04 : tier === 'technical' ? 0.92 : 1
      const lightMult = tier === 'primary' ? 1.14 : tier === 'secondary' ? 1.08 : tier === 'strong' ? 1.04 : 1
      const topLight = (0.10 * lightMult).toFixed(3)
      const topLeftLight = (0.08 * lightMult).toFixed(3)
      /* V61 — Comercial authority preserved at cap (1.0/0.947/0.189) */
      const comercialAuthority = card.id === 'comercial'
        ? `, inset 0 -60px 80px rgba(0,0,0,1), inset -40px -50px 72px rgba(0,0,0,0.947), inset 40px 30px 80px rgba(255,255,255,0.189)`
        : ''
      /* V61 — Servicio: +3% richness adicional (0.331→0.341, 0.073→0.075) */
      const servicioDepth = card.id === 'servicio-clientes'
        ? `, inset 0 -32px 60px rgba(0,0,0,0.341), inset 30px 20px 60px rgba(255,255,255,0.075)`
        : ''
      /* V61 — Strong: +4% richness (0.170→0.177, 0.032→0.033) */
      const strongDepth = (card.id === 'autofomento' || card.id === 'comunicaciones')
        ? `, inset 0 -26px 52px rgba(0,0,0,0.177), inset 20px 10px 50px rgba(255,255,255,0.033)`
        : ''
      /* V61 — Config: +3% richness (0.070→0.072) */
      const configDepth = card.id === 'config'
        ? `, inset 0 -22px 48px rgba(0,0,0,0.072)`
        : ''
      boxShadow = `
        inset 1px 0 0 rgba(255,255,255,${topLeftLight}),
        inset -1px 0 0 rgba(255,255,255,0.06),
        inset 0 1px 0 rgba(255,255,255,${topLight}),
        inset 0 -1px 0 rgba(0,0,0,0.14),
        inset 0 -20px 36px rgba(0,0,0,0.099),
        0 2px 4px rgba(0,0,0,${(0.20 * shadowMult).toFixed(3)}),
        0 16px 32px -4px rgba(0,0,0,${(0.30 * shadowMult).toFixed(3)}),
        0 48px 72px -12px rgba(0,0,0,${(0.36 * shadowMult).toFixed(3)})${comercialAuthority}${servicioDepth}${strongDepth}${configDepth}
      `
    }

    return ({
      gridColumn: slot.gridColumn,
      gridRow: slot.gridRow,
      minHeight: 0,
      borderRadius: '20px',
      padding: '28px',
      background: materialGradient,
      // V40 — border eliminado. La silueta se define ahora con insets asimétricos dentro del boxShadow.
      // Así quitamos la "raya blanca" inferior que generaba el border 1px sobre la zona oscura del inset bottom.
      border: 'none',
      outline: outline !== 'none' ? outline : '1px solid rgba(0,0,0,0.18)',
      outlineOffset: outline !== 'none' ? outlineOffset : '-1px',
      cursor,
      position: 'relative',
      overflow: 'hidden',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'flex-start',
      justifyContent: 'flex-start',
      transformStyle: 'preserve-3d' as const,
      transition: `transform 0.3s cubic-bezier(0.22,1,0.36,1), box-shadow 0.3s ease, outline 0.18s ease, opacity 0.2s ease`,
      transform,
      boxShadow,
      opacity: isDragging ? 0.55 : (mounted ? 1 : 0),
      userSelect: 'none' as const,
      willChange: isHovered ? 'transform' : 'auto',
      // V38 mount animation — light sweep fade in with stagger
      animation: mounted ? undefined : 'none',
    })
  }

  const renderDecor = (card: CardConfig, isHovered: boolean) => {
    const baseTransition = 'opacity 0.3s ease'
    const mult = isHovered ? 2.2 : 1
    const geometry = (() => {
      // V60 GOD-TIER — bright -6% adicional
      const opacityMult = 0.237
      const brightWidthMult = 0.241 /* 0.256 * 0.94 */
      /* V51 — Per-tier diagonal strength: primary 1.10, secondary 1.05, strong 0.90, standard 0.80, technical 0.65 */
      const tierDiagonal = card.id === 'comercial' ? 1.10
                         : card.id === 'servicio-clientes' ? 1.05
                         : (card.id === 'autofomento' || card.id === 'comunicaciones') ? 0.90
                         : card.id === 'config' ? 0.65
                         : 0.80
      const baseOpacity = 0.06 * mult * opacityMult * tierDiagonal
      const strongerOpacity = 0.08 * mult * opacityMult * tierDiagonal
      switch (card.id) {
        case 'oportunidades':
          return (
            <>
              {[0, 1, 2].map(i => (
                <div key={`opp-line-${i}`} style={{ position: 'absolute', right: '42%', top: '60%', width: '62%', height: '2px', background: `rgba(255,255,255,${baseOpacity})`, transformOrigin: '100% 50%', transform: `rotate(-48deg) translateY(${-i * 22}px)`, pointerEvents: 'none', transition: baseTransition }} />
              ))}
            </>
          )
        case 'servicio-clientes':
          return (
            <>
              {/* V41 — diagonales más angostas (32%→26%, 18%→16%), recupera azul profundo en centro */}
              <div style={{ position: 'absolute', left: '48%', top: '-30%', width: '26%', height: '160%', background: `rgba(255,255,255,${baseOpacity * 0.85})`, transform: 'rotate(26deg)', transformOrigin: 'top left', pointerEvents: 'none', transition: baseTransition }} />
              <div style={{ position: 'absolute', left: '72%', top: '-30%', width: '16%', height: '160%', background: `rgba(255,255,255,${baseOpacity * 0.85})`, transform: 'rotate(26deg)', transformOrigin: 'top left', pointerEvents: 'none', transition: baseTransition }} />
            </>
          )
        case 'comercial':
          return (
            <>
              <div style={{ position: 'absolute', left: '44%', top: '-30%', width: '28%', height: '160%', background: `rgba(255,255,255,${baseOpacity})`, transform: 'rotate(18deg)', transformOrigin: 'center center', pointerEvents: 'none', transition: baseTransition }} />
              <div style={{ position: 'absolute', left: '69%', top: '-30%', width: '16%', height: '160%', background: `rgba(255,255,255,${baseOpacity})`, transform: 'rotate(18deg)', transformOrigin: 'center center', pointerEvents: 'none', transition: baseTransition }} />
            </>
          )
        case 'operaciones':
          return (
            <>
              <div style={{ position: 'absolute', right: '-4%', top: '10%', width: `${26 * brightWidthMult}%`, height: '140%', background: `rgba(255,255,255,${strongerOpacity})`, transform: 'rotate(22deg)', transformOrigin: 'center center', pointerEvents: 'none', transition: baseTransition }} />
              <div style={{ position: 'absolute', left: 'calc(34% - 8%)', top: '-30%', width: `${14 * brightWidthMult}%`, height: '160%', background: `rgba(255,255,255,${0.10 * mult * opacityMult})`, transform: 'rotate(34deg)', transformOrigin: 'center center', pointerEvents: 'none', transition: baseTransition }} />
            </>
          )
        // V51 26/Abr/2026 — case 'ventas' restaurado (REVERT BUG-002)
        case 'ventas':
          return (
            <>
              <div style={{ position: 'absolute', left: '52%', top: '-30%', width: `${30 * brightWidthMult}%`, height: '160%', background: `rgba(255,255,255,${strongerOpacity * 0.483})`, transform: 'rotate(38deg)', transformOrigin: 'top left', pointerEvents: 'none', transition: baseTransition }} />
              <div style={{ position: 'absolute', left: '70%', top: '-30%', width: '12%', height: '160%', background: `rgba(255,255,255,${baseOpacity * 0.483})`, transform: 'rotate(44deg)', transformOrigin: 'top left', pointerEvents: 'none', transition: baseTransition }} />
            </>
          )
        case 'comunicaciones':
          return (
            <>
              <div style={{ position: 'absolute', left: 'calc(46% - 12%)', top: '-30%', width: '24%', height: '160%', background: `rgba(255,255,255,${baseOpacity})`, transform: 'rotate(20deg)', transformOrigin: 'center center', pointerEvents: 'none', transition: baseTransition }} />
              <div style={{ position: 'absolute', left: 'calc(63% - 7%)', top: '-30%', width: '14%', height: '160%', background: `rgba(255,255,255,${baseOpacity})`, transform: 'rotate(28deg)', transformOrigin: 'center center', pointerEvents: 'none', transition: baseTransition }} />
            </>
          )
        case 'autofomento':
          return (
            <>
              <div style={{ position: 'absolute', left: '22%', top: '-30%', width: '36%', height: '160%', background: `rgba(255,255,255,${baseOpacity})`, transform: 'rotate(24deg)', transformOrigin: 'center center', pointerEvents: 'none', transition: baseTransition }} />
              <div style={{ position: 'absolute', left: '56%', top: '-30%', width: '22%', height: '160%', background: `rgba(255,255,255,${baseOpacity})`, transform: 'rotate(-12deg)', transformOrigin: 'center center', pointerEvents: 'none', transition: baseTransition }} />
            </>
          )
        case 'config':
          return (
            <>
              <div style={{ position: 'absolute', left: '56%', top: '-30%', width: '28%', height: '160%', background: `rgba(255,255,255,${baseOpacity})`, transform: 'rotate(30deg)', transformOrigin: 'top left', pointerEvents: 'none', transition: baseTransition }} />
              <div style={{ position: 'absolute', left: '74%', top: '-30%', width: '9%', height: '160%', background: `rgba(255,255,255,${baseOpacity})`, transform: 'rotate(33deg)', transformOrigin: 'top left', pointerEvents: 'none', transition: baseTransition }} />
            </>
          )
        default:
          return null
      }
    })()

    const iconSize = (() => {
      /* V43 — tamaños +10% (P20 Bloque 1) */
      switch (card.id) {
        case 'operaciones': return 152
        case 'comercial': return 150
        case 'comunicaciones': return 130
        case 'servicio-clientes': return 128
        case 'oportunidades': return 100 /* se queda chico para no empalmar con subtitle largo */
        case 'autofomento': return 119
        case 'config': return 119
        default: return 110
      }
    })()
    // V60 GOD-TIER — icono per-tier 0.56-0.60 range ampliado (más embedded)
    const iconTier = card.id === 'comercial' ? 'primary'
                   : card.id === 'servicio-clientes' ? 'secondary'
                   : (card.id === 'autofomento' || card.id === 'comunicaciones') ? 'strong'
                   : card.id === 'config' ? 'technical'
                   : 'mid'
    const iconBaseOpacity = iconTier === 'primary' ? 0.60 : iconTier === 'secondary' ? 0.59 : iconTier === 'strong' ? 0.58 : iconTier === 'technical' ? 0.56 : 0.57
    const iconOpacity = isHovered ? iconBaseOpacity + 0.04 : iconBaseOpacity
    const iconBottom = card.id === 'operaciones' ? '-26px' : card.id === 'oportunidades' ? '4px' : '8px'
    const iconRight = card.id === 'operaciones' ? '8px' : card.id === 'oportunidades' ? '20px' : '16px'
    /* V44 PRECISION — icono único, embedded, elegante. White 0.72 + subtle shadow 0.18 per spec. */
    const icon = card.iconFile ? (
      <div style={{
        position: 'absolute',
        right: iconRight,
        bottom: iconBottom,
        width: `${iconSize}px`,
        height: `${iconSize}px`,
        pointerEvents: 'none',
        transition: baseTransition,
        zIndex: 2,
        overflow: 'visible',
        /* V53 GOD-TIER — Subtle shadow rgba(0,0,0,0.10): icon engraved into surface */
        filter: 'drop-shadow(0 1px 2px rgba(0,0,0,0.10))',
      }}>
        <img
          src={`/icons/dashboard/${card.iconFile}`}
          alt=""
          style={{
            width: '100%',
            height: '100%',
            objectFit: 'contain',
            objectPosition: 'center center',
            filter: 'brightness(0) invert(1)',
            opacity: iconOpacity,
            transition: 'opacity 0.24s ease',
          }}
        />
      </div>
    ) : null
    /* V44 PRECISION — grain overlay ultra-fino 1.5% opacity (casi imperceptible, premium materiality) */
    const grain = (
      <div
        style={{
          position: 'absolute',
          inset: 0,
          pointerEvents: 'none',
          zIndex: 1,
          opacity: 0.0045,
          backgroundImage: `url("data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='180' height='180'><filter id='n'><feTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='2' stitchTiles='stitch'/></filter><rect width='100%25' height='100%25' filter='url(%23n)'/></svg>")`,
          backgroundSize: '180px 180px',
          mixBlendMode: 'overlay',
          borderRadius: '20px',
        }}
      />
    )
    /* V44 PRECISION — geometry -22%/-15%, grain 1.5%, icon white 0.72 */
    return <>{geometry}{grain}{icon}</>
  }

  const renderCard = (slotIndex: number) => {
    const slot = SLOTS[slotIndex]
    const cardId = layout[slotIndex]
    const card = cardCatalog[cardId]
    if (!card) return null
    const isHovered = hoveredCard === card.id
    const isPressed = pressedCard === card.id
    const tilt = cardTilts[card.id] || { rx: 0, ry: 0 }
    const mountDelay = `${slotIndex * 60}ms`

    return (
      <div
        key={card.id}
        draggable={armedCardId === card.id}
        onDragStart={(e) => handleDragStart(e, card.id)}
        onDragEnd={handleDragEnd}
        onDragOver={(e) => handleDragOver(e, slotIndex)}
        onDragLeave={(e) => handleDragLeave(e, slotIndex)}
        onDrop={(e) => handleDrop(e, slotIndex)}
        onClick={() => handleClick(card)}
        onMouseMove={(e) => handleCardMouseMove(e, card.id)}
        onMouseEnter={() => !draggingId && setHoveredCard(card.id)}
        onMouseLeave={() => handleCardMouseLeave(card.id)}
        onMouseDown={() => !draggingId && setPressedCard(card.id)}
        onMouseUp={() => setPressedCard(null)}
        className={`${mounted ? 'lh-card-entered' : 'lh-card-entering'}${flashCardId === card.id ? ' lh-arm-flash' : ''}`}
        style={{
          ...getCardStyle(isHovered, isPressed, card, slot, slotIndex, tilt),
          transitionDelay: mounted ? '0s' : mountDelay,
        }}
      >
        {renderDecor(card, isHovered)}
        {/* V43 — Dot verde enterprise con pulse (SOLO cards operacionales)
            Config: SIN nada (matchea demo P20 — grafito limpio sin dot). */}
        {card.id !== 'config' && (
          <div style={{ position: 'absolute', top: '14px', right: '14px', width: '14px', height: '14px', pointerEvents: 'none', zIndex: 3 }}>
            {/* Pulse ring — delay determinístico por card para ritmo orgánico */}
            <div style={{
              position: 'absolute',
              top: '50%', left: '50%',
              width: '14px', height: '14px',
              borderRadius: '50%',
              border: '1.5px solid rgba(16,185,129,0.75)',
              transform: 'translate(-50%, -50%)',
              animation: 'lhDotPulse 2.2s ease-in-out infinite',
              animationDelay: (() => {
                const delayMap: Record<string, string> = {
                  'oportunidades': '0s',
                  'servicio-clientes': '0.3s',
                  'comercial': '0.7s',
                  'operaciones': '1.1s',
                  'ventas': '1.5s',
                  'comunicaciones': '0.5s',
                  'autofomento': '0.9s',
                }
                return delayMap[card.id] || '0s'
              })(),
              pointerEvents: 'none',
            }} />
            {/* Dot verde central */}
            <div style={{
              position: 'absolute',
              top: '50%', left: '50%',
              width: '6px', height: '6px',
              borderRadius: '50%',
              background: 'radial-gradient(circle at 35% 30%, #2DD4BF 0%, #10B981 65%, #065F46 100%)',
              boxShadow: '0 0 0 1px rgba(255,255,255,0.10), 0 0 6px rgba(16,185,129,0.38)',
              transform: 'translate(-50%, -50%)',
              pointerEvents: 'none',
            }} />
          </div>
        )}
        {/* V43 — Wrapper título + subtítulo */}
        <div style={{ position: 'relative', zIndex: 2, width: '100%' }}>
          {/* V60 GOD-TIER — Title tiered refinado final (0.975-0.99 per role) */}
          <div style={{
            fontFamily: "'Montserrat', sans-serif",
            fontSize: '27px',
            fontWeight: 900,
            color: card.id === 'comercial' ? 'rgba(255,255,255,0.99)'
                 : card.id === 'servicio-clientes' ? 'rgba(255,255,255,0.985)'
                 : card.id === 'ventas' ? 'rgba(255,255,255,0.985)'
                 : (card.id === 'autofomento' || card.id === 'comunicaciones') ? 'rgba(255,255,255,0.98)'
                 : card.id === 'config' ? 'rgba(255,255,255,0.975)'
                 : 'rgba(255,255,255,0.975)',
            letterSpacing: '-0.024em',
            lineHeight: 1.12,
            textAlign: 'left',
            width: '100%',
            textShadow: [
              '0 -1.5px 0 rgba(0,0,0,0.92)',           /* top-dark crisp FUERTE (cavidad) */
              '0 1.5px 0 rgba(255,255,255,0.32)',      /* bottom-light lip iluminado */
              '0 2px 3px rgba(0,0,0,0.52)',            /* drop profundo */
              '0 4px 7px rgba(0,0,0,0.30)',            /* drop ambient extendido */
            ].join(', '),
            pointerEvents: 'none',
          }}>
            {card.label}
          </div>
          {/* V60 GOD-TIER — Supporting text refinado final per card family */}
          <div style={{
            fontFamily: "'Montserrat', sans-serif",
            fontSize: '14px',
            fontWeight: 500,
            color: card.id === 'comercial' ? 'rgba(232,240,252,0.84)'
                 : card.id === 'servicio-clientes' ? 'rgba(231,239,251,0.82)'
                 : (card.id === 'autofomento' || card.id === 'comunicaciones') ? 'rgba(228,237,250,0.80)'
                 : card.id === 'ventas' ? 'rgba(255,244,228,0.80)'
                 : card.id === 'config' ? 'rgba(225,230,238,0.75)'
                 : 'rgba(226,236,249,0.78)',
            letterSpacing: '0.015em',
            textAlign: 'left',
            width: '100%',
            marginTop: '20px',
            whiteSpace: 'nowrap',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            boxSizing: 'border-box',
            textShadow: '0 1px 2px rgba(0,0,0,0.28)',
            pointerEvents: 'none',
          }}>
            {card.statusText}
          </div>
        </div>
      </div>
    )
  }

  const handleBackgroundClick = () => {
    if (armedCardId) disarmCard()
  }

  return (
    <div style={{
      height: '100vh',
      overflow: 'hidden',
      display: 'flex',
      flexDirection: 'column',
      // V39 BACKGROUND — radial vignette MÁS oscuro para drama máximo
      background: `
        linear-gradient(180deg, rgba(15,23,42,0.045) 0%, rgba(15,23,42,0) 38%, rgba(255,255,255,0.015) 100%),
        radial-gradient(ellipse 110% 75% at 50% 58%, #B8BEC8 0%, #9CA3AD 55%, #7C828C 100%)
      `,
      fontFamily: "'Montserrat', sans-serif",
      color: '#1E293B',
    }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Montserrat:wght@400;500;600;700;800&display=swap');

        /* V38 — Mount entrance with stagger */
        .lh-card-entering {
          transform: perspective(1400px) translateY(14px) translateZ(-10px) !important;
          opacity: 0 !important;
          filter: brightness(0.88);
        }
        .lh-card-entered {
          filter: brightness(1);
        }
        .lh-card-entering,
        .lh-card-entered {
          transition: transform 0.55s cubic-bezier(0.22,1,0.36,1),
                      box-shadow 0.3s ease,
                      outline 0.18s ease,
                      opacity 0.45s ease,
                      filter 0.6s ease !important;
        }

        /* V41 — Pulse ring en dots (sistema vivo, 2.2s respiración) */
        @keyframes lhDotPulse {
          0%   { transform: translate(-50%, -50%) scale(1);   opacity: 0.70; }
          70%  { transform: translate(-50%, -50%) scale(2.2); opacity: 0; }
          100% { transform: translate(-50%, -50%) scale(2.2); opacity: 0; }
        }

        /* V42 — Haptic flash al armar card (confirmación visual 120ms) */
        @keyframes lhArmFlash {
          0%   { box-shadow: inset 0 0 0 0 rgba(214,168,79,0); }
          35%  { box-shadow: inset 0 0 40px 4px rgba(214,168,79,0.40); }
          100% { box-shadow: inset 0 0 0 0 rgba(214,168,79,0); }
        }
        .lh-arm-flash {
          animation: lhArmFlash 400ms ease-out;
        }

        /* V41 — Page transition fade-out (150ms premium, Linear/Arc-style) */
        .lh-page-exit {
          opacity: 0.55;
          transition: opacity 0.15s ease-out;
        }

        /* V41 — Accesibilidad vestibular (respeta prefers-reduced-motion) */
        @media (prefers-reduced-motion: reduce) {
          * {
            animation-duration: 0.01ms !important;
            animation-iteration-count: 1 !important;
            transition-duration: 0.01ms !important;
          }
          .lh-card-entering, .lh-card-entered {
            transform: none !important;
            opacity: 1 !important;
            filter: none !important;
          }
        }
      `}</style>
      <AppHeader onLogout={handleLogout} userName={formatName(user?.email)} userRole={user?.rol || 'admin'} userEmail={user?.email} />
      <div className="lh-dashboard-main" onClick={handleBackgroundClick} style={{
        flex: '1 1 auto',
        padding: '36px 32px',
        display: 'flex',
        flexDirection: 'column',
        gap: '16px',
        overflow: 'hidden',
        perspective: '1400px',
      }}>
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(4, 1fr)',
          gridTemplateRows: 'repeat(3, 1fr)',
          /* V42 — gap asimétrico 18px horizontal + 24px vertical (más respiración entre filas) */
          columnGap: '18px',
          rowGap: '24px',
          flex: '0 0 72%',
          minHeight: 0,
          perspective: '1400px',
          transformStyle: 'preserve-3d',
        }}>
          {SLOTS.map((_, i) => renderCard(i))}
        </div>
      </div>
    </div>
  )
}
