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
    'comercial': { id: 'comercial', label: 'Comercial', route: '/ventas/dashboard', bgColor: '#2557A8', gradient: 'linear-gradient(135deg, #2557A8 0%, #082552 100%)', iconFile: 'comercial.svg', statusDot: 'green', statusText: 'Formatos · Cotizaciones · Analytics' },
    'operaciones': { id: 'operaciones', label: 'Operaciones', route: '/operaciones/dashboard', bgColor: '#3D78D6', gradient: 'linear-gradient(135deg, #3D78D6 0%, #134287 100%)', iconFile: 'camion-contenedor-v2.svg', statusDot: 'green', statusText: 'Despachos · Seguimiento' },
    'ventas': { id: 'ventas', label: 'Ventas', route: '/ventas/analytics', bgColor: '#C77A22', gradient: 'linear-gradient(135deg, #C77A22 0%, #7A3F0E 100%)', iconFile: 'ingresos.svg', statusDot: 'green', statusText: 'Analytics · KPIs' },
    'comunicaciones': { id: 'comunicaciones', label: 'Comunicaciones', route: '/comunicaciones/dashboard', bgColor: '#4F88E3', gradient: 'linear-gradient(135deg, #4F88E3 0%, #1B56A8 100%)', iconFile: 'comunicaciones.svg', statusDot: 'green', statusText: 'Mail · WhatsApp · Resumen Ejecutivo IA' },
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

  const armCard = useCallback((cardId: string) => {
    setArmedCardId(cardId)
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
        else if (!draggingId) navigate(card.route)
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

  // V38 — PARALLAX 3D tilt handler
  const handleCardMouseMove = (e: React.MouseEvent, cardId: string) => {
    if (draggingId || armedCardId) return
    const rect = (e.currentTarget as HTMLElement).getBoundingClientRect()
    const x = e.clientX - rect.left
    const y = e.clientY - rect.top
    const px = (x / rect.width) - 0.5   // -0.5 .. +0.5
    const py = (y / rect.height) - 0.5  // -0.5 .. +0.5
    // Max ±2° tilt — controlado, enterprise-level (no gaming)
    const rx = -py * 4  // invertido: mouse arriba = tilt forward
    const ry = px * 4
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
      // V38 HOVER — parallax 3D tilt + lift + deepened shadows
      transform = `${basePerspective} rotateX(${tilt.rx}deg) rotateY(${tilt.ry}deg) translateY(-6px) translateZ(12px)`
      boxShadow = `
        inset 0 3px 0 rgba(255,255,255,0.28),
        inset 0 -3px 0 rgba(0,0,0,0.38),
        inset 0 -20px 36px rgba(0,0,0,0.16),
        0 8px 16px rgba(0,0,0,0.24),
        0 24px 48px rgba(0,0,0,0.36),
        0 48px 80px rgba(0,0,0,0.38),
        0 80px 120px -20px rgba(0,0,0,0.40)
      `
    } else {
      // V38 RESTING — dramatic depth, clear separation from bg
      transform = `${basePerspective} translateY(0) translateZ(0)`
      boxShadow = `
        inset 0 3px 0 rgba(255,255,255,0.22),
        inset 0 -3px 0 rgba(0,0,0,0.34),
        inset 0 -18px 34px rgba(0,0,0,0.16),
        0 4px 8px rgba(0,0,0,0.18),
        0 16px 32px rgba(0,0,0,0.30),
        0 32px 56px rgba(0,0,0,0.34),
        0 60px 88px -16px rgba(0,0,0,0.32)
      `
    }

    return ({
      gridColumn: slot.gridColumn,
      gridRow: slot.gridRow,
      minHeight: 0,
      borderRadius: '20px',
      padding: '28px',
      background: materialGradient,
      border: '1px solid rgba(255,255,255,0.12)',
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
    // V38 — patterns reveal en hover (opacity bump)
    const mult = isHovered ? 2.2 : 1
    const geometry = (() => {
      const baseOpacity = 0.06 * mult
      const strongerOpacity = 0.08 * mult
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
              <div style={{ position: 'absolute', left: '44%', top: '-30%', width: '32%', height: '160%', background: `rgba(255,255,255,${baseOpacity})`, transform: 'rotate(26deg)', transformOrigin: 'top left', pointerEvents: 'none', transition: baseTransition }} />
              <div style={{ position: 'absolute', left: '70%', top: '-30%', width: '18%', height: '160%', background: `rgba(255,255,255,${baseOpacity})`, transform: 'rotate(26deg)', transformOrigin: 'top left', pointerEvents: 'none', transition: baseTransition }} />
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
              <div style={{ position: 'absolute', right: '-4%', top: '10%', width: '26%', height: '140%', background: `rgba(255,255,255,${strongerOpacity})`, transform: 'rotate(22deg)', transformOrigin: 'center center', pointerEvents: 'none', transition: baseTransition }} />
              <div style={{ position: 'absolute', left: 'calc(34% - 8%)', top: '-30%', width: '14%', height: '160%', background: `rgba(255,255,255,${0.10 * mult})`, transform: 'rotate(34deg)', transformOrigin: 'center center', pointerEvents: 'none', transition: baseTransition }} />
            </>
          )
        case 'ventas':
          return (
            <>
              <div style={{ position: 'absolute', left: '52%', top: '-30%', width: '30%', height: '160%', background: `rgba(255,255,255,${strongerOpacity})`, transform: 'rotate(38deg)', transformOrigin: 'top left', pointerEvents: 'none', transition: baseTransition }} />
              <div style={{ position: 'absolute', left: '70%', top: '-30%', width: '12%', height: '160%', background: `rgba(255,255,255,${baseOpacity})`, transform: 'rotate(44deg)', transformOrigin: 'top left', pointerEvents: 'none', transition: baseTransition }} />
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
      switch (card.id) {
        case 'operaciones': return 138
        case 'comercial': return 124
        case 'comunicaciones': return 118
        case 'servicio-clientes': return 116
        case 'oportunidades': return 108
        case 'autofomento': return 108
        case 'config': return 108
        default: return 100
      }
    })()
    const iconOpacity = isHovered ? 0.14 : 0.09
    const iconBottom = card.id === 'operaciones' ? '-26px' : '8px'
    const iconRight = card.id === 'operaciones' ? '8px' : '16px'
    const icon = card.iconFile ? (
      <div style={{ position: 'absolute', right: iconRight, bottom: iconBottom, width: `${iconSize}px`, height: `${iconSize}px`, pointerEvents: 'none', transition: baseTransition, zIndex: 2, filter: 'drop-shadow(0 4px 12px rgba(0,0,0,0.18))' }}>
        <img src={`/icons/dashboard/${card.iconFile}`} alt="" style={{ width: '100%', height: '100%', objectFit: 'contain', objectPosition: 'center center', filter: 'brightness(0) invert(1)', opacity: iconOpacity, transition: 'opacity 0.24s ease' }} />
      </div>
    ) : null
    return <>{geometry}{icon}</>
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
        className={mounted ? 'lh-card-entered' : 'lh-card-entering'}
        style={{
          ...getCardStyle(isHovered, isPressed, card, slot, slotIndex, tilt),
          transitionDelay: mounted ? '0s' : mountDelay,
        }}
      >
        {renderDecor(card, isHovered)}
        {/* Gold dot */}
        <div style={{ position: 'absolute', top: '18px', right: '18px', width: '6px', height: '6px', borderRadius: '50%', background: '#D6A84F', boxShadow: '0 0 0 1.5px rgba(214,168,79,0.28), 0 0 12px rgba(214,168,79,0.55)', zIndex: 3, pointerEvents: 'none' }} />
        {/* V38 Title — engraved triple */}
        <div style={{
          fontFamily: "'Montserrat', sans-serif",
          fontSize: '22px',
          fontWeight: 800,
          color: '#FFFFFF',
          letterSpacing: '-0.02em',
          lineHeight: 1.15,
          marginBottom: 'auto',
          textAlign: 'left',
          width: '100%',
          position: 'relative',
          zIndex: 2,
          textShadow: [
            '0 -1px 0 rgba(0,0,0,0.40)',
            '0 1px 0 rgba(255,255,255,0.14)',
            '0 2px 6px rgba(0,0,0,0.34)',
          ].join(', '),
          pointerEvents: 'none',
        }}>
          {card.label}
        </div>
        <div style={{
          fontFamily: "'Montserrat', sans-serif",
          fontSize: '12px',
          fontWeight: 500,
          color: 'rgba(255,255,255,0.78)',
          letterSpacing: '0.2px',
          textAlign: 'left',
          width: '100%',
          marginTop: '8px',
          position: 'relative',
          zIndex: 3,
          whiteSpace: 'nowrap',
          overflow: 'hidden',
          textOverflow: 'ellipsis',
          boxSizing: 'border-box',
          textShadow: '0 1px 3px rgba(0,0,0,0.28)',
          pointerEvents: 'none',
        }}>
          {card.statusText}
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
      // V38 BACKGROUND — radial vignette oscuro con gradient profundo
      background: `
        radial-gradient(ellipse 100% 70% at 50% 35%, #CED3DB 0%, #A8AEB8 50%, #878C96 100%)
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
      `}</style>
      <AppHeader onLogout={handleLogout} userName={formatName(user?.email)} userRole={user?.rol || 'admin'} userEmail={user?.email} />
      <div onClick={handleBackgroundClick} style={{
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
          gap: '20px',
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
