// HomeDashboard V37 - Fix click/dblclick race condition
// V36 tenía un bug: onClick se disparaba con cada click individual del doble-click,
// navegando al módulo ANTES de que llegara el evento onDoubleClick para armar el drag.
// V37 usa timer de 250ms en onClick para distinguir single vs double:
//   - Si llega un solo click en 250ms → single click → navegar (o desarmar si armed)
//   - Si llega un segundo click antes de 250ms → double click → armar/desarmar drag
// onDoubleClick handler eliminado — todo unificado en onClick con timer.
// Cambios sobre V35 autorizados por JJ 21/Abr/2026 noche:
//   - DRAG TRIGGER: ahora doble-click (rápido) arma el card como movible durante 5s
//     Cursor cambia a 'move' (cruz 4 flechas) en card armado
//     Click simple sigue navegando al módulo
//     Outline dorado punteado persistente marca el card armado
//   - ENGRAVED TITLES: text-shadow triple (inset top dark + lip bright + drop) sutil
//   - CONTOUR PRECISION: top edge brightened 2px + bottom edge darkened 2px (milled-edge feel)
//   - OUTER OUTLINE: 1px rgba(0,0,0,0.08) muy sutil para silueta definida sobre bg claro
//   - PRESSED FEEDBACK: compression visual más refinada
//   - 3D preservado de V35 pero contenido en límites "subtle" no "cartoon"
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

export default function HomeDashboard() {
  const navigate = useNavigate()
  const { user, logout } = useAuthContext()
  const [hoveredCard, setHoveredCard] = useState<string | null>(null)
  const [pressedCard, setPressedCard] = useState<string | null>(null)
  const [draggingId, setDraggingId] = useState<string | null>(null)
  const [overSlot, setOverSlot] = useState<number | null>(null)
  const [armedCardId, setArmedCardId] = useState<string | null>(null)
  const armedTimerRef = useRef<number | null>(null)
  // V37 — click timer para distinguir single vs double click
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

  // Cleanup de timers al desmontar
  useEffect(() => {
    return () => {
      if (armedTimerRef.current) window.clearTimeout(armedTimerRef.current)
      if (clickTimerRef.current) window.clearTimeout(clickTimerRef.current)
    }
  }, [])

  // Desarmar al clickear fuera del dashboard (ESC o click en área vacía)
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

  // V37 — Click unificado con timer 250ms
  // Single click → navegar (o desarmar si armed)
  // Double click → armar/desarmar drag
  const handleClick = (card: CardConfig) => {
    // Si diferente card, reset
    if (pendingClickIdRef.current !== card.id) {
      clickCountRef.current = 0
      pendingClickIdRef.current = card.id
    }
    clickCountRef.current += 1

    // Cancelar timer anterior
    if (clickTimerRef.current) {
      window.clearTimeout(clickTimerRef.current)
    }

    // Si ya hay 2 clicks, acción inmediata (doble-click detectado)
    if (clickCountRef.current >= 2) {
      const targetId = card.id
      clickCountRef.current = 0
      pendingClickIdRef.current = null
      if (clickTimerRef.current) {
        window.clearTimeout(clickTimerRef.current)
        clickTimerRef.current = null
      }
      // Toggle armed state
      if (armedCardId === targetId) {
        disarmCard()
      } else {
        armCard(targetId)
      }
      return
    }

    // Solo 1 click — esperar 250ms para ver si viene otro
    clickTimerRef.current = window.setTimeout(() => {
      const count = clickCountRef.current
      const id = pendingClickIdRef.current
      clickCountRef.current = 0
      pendingClickIdRef.current = null
      clickTimerRef.current = null

      if (count === 1 && id) {
        // Single click confirmado
        if (armedCardId === id) {
          // Card armado → click simple desarma (no navega)
          disarmCard()
        } else if (!draggingId) {
          // Navegar al módulo
          navigate(card.route)
        }
      }
    }, 250)
  }

  const handleDragStart = (e: React.DragEvent, cardId: string) => {
    // Solo permite drag si está armado
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
    disarmCard() // Al terminar drag (exitoso o no), desarmar
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

  const getCardStyle = (isHovered: boolean, isPressed: boolean, card: CardConfig, slot: Slot, slotIndex: number): React.CSSProperties => {
    // V36 Material — upper-left ambient + luz/sombra vertical + base color
    const materialGradient = `
      radial-gradient(ellipse at 0% 0%, rgba(255,255,255,0.13) 0%, rgba(255,255,255,0) 45%),
      linear-gradient(180deg, rgba(255,255,255,0.09) 0%, rgba(255,255,255,0.02) 22%, rgba(0,0,0,0.13) 100%),
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

    // CURSOR LOGIC
    if (isDragging) cursor = 'move'
    else if (isArmed) cursor = 'move'
    else cursor = 'pointer'

    if (isDragging) {
      transform = 'scale(0.97)'
      boxShadow = `
        inset 0 1px 0 rgba(255,255,255,0.16),
        0 2px 6px rgba(15,23,42,0.14),
        0 10px 20px rgba(15,23,42,0.16)
      `
    } else if (isOverThisSlot) {
      transform = 'translateY(-3px)'
      boxShadow = `
        inset 0 2px 0 rgba(255,255,255,0.14),
        inset 0 -2px 0 rgba(0,0,0,0.26),
        inset 0 -16px 28px rgba(0,0,0,0.12),
        0 2px 4px rgba(15,23,42,0.10),
        0 14px 28px rgba(214,168,79,0.30),
        0 30px 54px rgba(15,23,42,0.26)
      `
      outline = '2px solid rgba(214,168,79,0.70)'
      outlineOffset = '2px'
    } else if (isValidDropTarget) {
      transform = 'translateY(0)'
      boxShadow = `
        inset 0 2px 0 rgba(255,255,255,0.12),
        inset 0 -2px 0 rgba(0,0,0,0.24),
        inset 0 -16px 30px rgba(0,0,0,0.13),
        0 2px 4px rgba(15,23,42,0.10),
        0 8px 16px rgba(15,23,42,0.14),
        0 18px 36px rgba(15,23,42,0.18)
      `
      outline = '1px dashed rgba(214,168,79,0.26)'
      outlineOffset = '2px'
    } else if (isArmed) {
      // V36 ARMED STATE — outline dorado persistente + lift sutil + cursor move
      transform = 'translateY(-2px)'
      boxShadow = `
        inset 0 2px 0 rgba(255,255,255,0.14),
        inset 0 -2px 0 rgba(0,0,0,0.26),
        inset 0 -16px 30px rgba(0,0,0,0.13),
        0 2px 4px rgba(15,23,42,0.10),
        0 12px 24px rgba(15,23,42,0.18),
        0 26px 46px rgba(214,168,79,0.22)
      `
      outline = '1.5px solid rgba(214,168,79,0.62)'
      outlineOffset = '2px'
    } else if (isPressed) {
      // V36 PRESSED — compression refinada
      transform = 'translateY(1.5px)'
      boxShadow = `
        inset 0 1px 0 rgba(255,255,255,0.06),
        inset 0 -1px 0 rgba(0,0,0,0.18),
        inset 0 3px 10px rgba(0,0,0,0.22),
        0 1px 3px rgba(15,23,42,0.12),
        0 3px 6px rgba(15,23,42,0.08)
      `
    } else if (isHovered) {
      // V36 HOVER — lift controlado
      transform = 'translateY(-3px)'
      boxShadow = `
        inset 0 2px 0 rgba(255,255,255,0.18),
        inset 0 -2px 0 rgba(0,0,0,0.26),
        inset 0 -16px 30px rgba(0,0,0,0.12),
        0 2px 4px rgba(15,23,42,0.10),
        0 12px 24px rgba(15,23,42,0.18),
        0 26px 46px rgba(15,23,42,0.22),
        0 44px 64px -12px rgba(15,23,42,0.20)
      `
    } else {
      // V36 RESTING — contour premium asimétrico (top bright + bottom dark)
      transform = 'translateY(0)'
      boxShadow = `
        inset 0 2px 0 rgba(255,255,255,0.14),
        inset 0 -2px 0 rgba(0,0,0,0.26),
        inset 0 -16px 30px rgba(0,0,0,0.13),
        0 2px 4px rgba(15,23,42,0.10),
        0 10px 20px rgba(15,23,42,0.16),
        0 22px 40px rgba(15,23,42,0.20),
        0 42px 56px -12px rgba(15,23,42,0.18)
      `
    }

    return ({
      gridColumn: slot.gridColumn,
      gridRow: slot.gridRow,
      minHeight: 0,
      borderRadius: '20px',
      padding: '28px',
      background: materialGradient,
      // V36 doble contour: inner precision edge + outer silhouette definer
      border: '1px solid rgba(255,255,255,0.10)',
      outline: outline !== 'none' ? outline : '1px solid rgba(15,23,42,0.06)',
      outlineOffset: outline !== 'none' ? outlineOffset : '-1px',
      cursor,
      position: 'relative',
      overflow: 'hidden',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'flex-start',
      justifyContent: 'flex-start',
      transition: 'transform 0.22s cubic-bezier(0.22,1,0.36,1), box-shadow 0.22s ease, outline 0.18s ease, opacity 0.2s ease',
      transform,
      boxShadow,
      opacity: isDragging ? 0.55 : 1,
      userSelect: 'none' as const,
    })
  }

  const renderDecor = (card: CardConfig, isHovered: boolean) => {
    const baseTransition = 'opacity 0.4s ease'
    const geometry = (() => {
      switch (card.id) {
        case 'oportunidades':
          return (
            <>
              {[0, 1, 2].map(i => (
                <div key={`opp-line-${i}`} style={{ position: 'absolute', right: '42%', top: '60%', width: '62%', height: '2px', background: 'rgba(255,255,255,0.05)', transformOrigin: '100% 50%', transform: `rotate(-48deg) translateY(${-i * 22}px)`, pointerEvents: 'none' }} />
              ))}
            </>
          )
        case 'servicio-clientes':
          return (
            <>
              <div style={{ position: 'absolute', left: '44%', top: '-30%', width: '32%', height: '160%', background: 'rgba(255,255,255,0.04)', transform: 'rotate(26deg)', transformOrigin: 'top left', pointerEvents: 'none' }} />
              <div style={{ position: 'absolute', left: '70%', top: '-30%', width: '18%', height: '160%', background: 'rgba(255,255,255,0.04)', transform: 'rotate(26deg)', transformOrigin: 'top left', pointerEvents: 'none' }} />
            </>
          )
        case 'comercial':
          return (
            <>
              <div style={{ position: 'absolute', left: '44%', top: '-30%', width: '28%', height: '160%', background: 'rgba(255,255,255,0.04)', transform: 'rotate(18deg)', transformOrigin: 'center center', pointerEvents: 'none' }} />
              <div style={{ position: 'absolute', left: '69%', top: '-30%', width: '16%', height: '160%', background: 'rgba(255,255,255,0.04)', transform: 'rotate(18deg)', transformOrigin: 'center center', pointerEvents: 'none' }} />
            </>
          )
        case 'operaciones':
          return (
            <>
              <div style={{ position: 'absolute', right: '-4%', top: '10%', width: '26%', height: '140%', background: 'rgba(255,255,255,0.05)', transform: 'rotate(22deg)', transformOrigin: 'center center', pointerEvents: 'none' }} />
              <div style={{ position: 'absolute', left: 'calc(34% - 8%)', top: '-30%', width: '14%', height: '160%', background: 'rgba(255,255,255,0.06)', transform: 'rotate(34deg)', transformOrigin: 'center center', pointerEvents: 'none' }} />
            </>
          )
        case 'ventas':
          return (
            <>
              <div style={{ position: 'absolute', left: '52%', top: '-30%', width: '30%', height: '160%', background: 'rgba(255,255,255,0.05)', transform: 'rotate(38deg)', transformOrigin: 'top left', pointerEvents: 'none' }} />
              <div style={{ position: 'absolute', left: '70%', top: '-30%', width: '12%', height: '160%', background: 'rgba(255,255,255,0.04)', transform: 'rotate(44deg)', transformOrigin: 'top left', pointerEvents: 'none' }} />
            </>
          )
        case 'comunicaciones':
          return (
            <>
              <div style={{ position: 'absolute', left: 'calc(46% - 12%)', top: '-30%', width: '24%', height: '160%', background: 'rgba(255,255,255,0.04)', transform: 'rotate(20deg)', transformOrigin: 'center center', pointerEvents: 'none' }} />
              <div style={{ position: 'absolute', left: 'calc(63% - 7%)', top: '-30%', width: '14%', height: '160%', background: 'rgba(255,255,255,0.04)', transform: 'rotate(28deg)', transformOrigin: 'center center', pointerEvents: 'none' }} />
            </>
          )
        case 'autofomento':
          return (
            <>
              <div style={{ position: 'absolute', left: '22%', top: '-30%', width: '36%', height: '160%', background: 'rgba(255,255,255,0.04)', transform: 'rotate(24deg)', transformOrigin: 'center center', pointerEvents: 'none' }} />
              <div style={{ position: 'absolute', left: '56%', top: '-30%', width: '22%', height: '160%', background: 'rgba(255,255,255,0.04)', transform: 'rotate(-12deg)', transformOrigin: 'center center', pointerEvents: 'none' }} />
            </>
          )
        case 'config':
          return (
            <>
              <div style={{ position: 'absolute', left: '56%', top: '-30%', width: '28%', height: '160%', background: 'rgba(255,255,255,0.04)', transform: 'rotate(30deg)', transformOrigin: 'top left', pointerEvents: 'none' }} />
              <div style={{ position: 'absolute', left: '74%', top: '-30%', width: '9%', height: '160%', background: 'rgba(255,255,255,0.04)', transform: 'rotate(33deg)', transformOrigin: 'top left', pointerEvents: 'none' }} />
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
    const iconOpacity = isHovered ? 0.11 : 0.08
    const iconBottom = card.id === 'operaciones' ? '-26px' : '8px'
    const iconRight = card.id === 'operaciones' ? '8px' : '16px'
    const icon = card.iconFile ? (
      <div style={{ position: 'absolute', right: iconRight, bottom: iconBottom, width: `${iconSize}px`, height: `${iconSize}px`, pointerEvents: 'none', transition: baseTransition, zIndex: 2, filter: 'drop-shadow(0 2px 6px rgba(0,0,0,0.14))' }}>
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
    const isArmed = armedCardId === card.id

    return (
      <div
        key={card.id}
        draggable={isArmed}
        onDragStart={(e) => handleDragStart(e, card.id)}
        onDragEnd={handleDragEnd}
        onDragOver={(e) => handleDragOver(e, slotIndex)}
        onDragLeave={(e) => handleDragLeave(e, slotIndex)}
        onDrop={(e) => handleDrop(e, slotIndex)}
        onClick={() => handleClick(card)}
        onMouseEnter={() => !draggingId && setHoveredCard(card.id)}
        onMouseLeave={() => { setHoveredCard(null); setPressedCard(null) }}
        onMouseDown={() => !draggingId && setPressedCard(card.id)}
        onMouseUp={() => setPressedCard(null)}
        style={getCardStyle(isHovered, isPressed, card, slot, slotIndex)}
      >
        {renderDecor(card, isHovered)}
        {/* Gold dot — preserved V35 */}
        <div style={{ position: 'absolute', top: '18px', right: '18px', width: '6px', height: '6px', borderRadius: '50%', background: '#D6A84F', boxShadow: '0 0 0 1.5px rgba(214,168,79,0.22), 0 0 10px rgba(214,168,79,0.45)', zIndex: 3, pointerEvents: 'none' }} />
        {/* V36 Title — text-shadow engraved (inset-like doble highlight + drop) */}
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
            '0 -1px 0 rgba(0,0,0,0.32)',
            '0 1px 0 rgba(255,255,255,0.10)',
            '0 2px 4px rgba(0,0,0,0.28)',
          ].join(', '),
          pointerEvents: 'none',
        }}>
          {card.label}
        </div>
        {/* Subtitle */}
        <div style={{
          fontFamily: "'Montserrat', sans-serif",
          fontSize: '12px',
          fontWeight: 500,
          color: 'rgba(255,255,255,0.72)',
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
          textShadow: '0 1px 2px rgba(0,0,0,0.18)',
          pointerEvents: 'none',
        }}>
          {card.statusText}
        </div>
      </div>
    )
  }

  // Global click to dismiss armed when clicking outside of cards
  const handleBackgroundClick = () => {
    if (armedCardId) disarmCard()
  }

  return (
    <div style={{ height: '100vh', overflow: 'hidden', display: 'flex', flexDirection: 'column', background: `radial-gradient(ellipse 120% 80% at 50% 0%, rgba(255,255,255,0.6) 0%, rgba(255,255,255,0) 60%), #ECEEF2`, fontFamily: "'Montserrat', sans-serif", color: '#1E293B' }}>
      <style>{`@import url('https://fonts.googleapis.com/css2?family=Montserrat:wght@400;500;600;700;800&display=swap');`}</style>
      <AppHeader onLogout={handleLogout} userName={formatName(user?.email)} userRole={user?.rol || 'admin'} userEmail={user?.email} />
      <div onClick={handleBackgroundClick} style={{ flex: '1 1 auto', padding: '36px 32px', display: 'flex', flexDirection: 'column', gap: '16px', overflow: 'hidden' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gridTemplateRows: 'repeat(3, 1fr)', gap: '18px', flex: '0 0 72%', minHeight: 0 }}>
          {SLOTS.map((_, i) => renderCard(i))}
        </div>
      </div>
    </div>
  )
}
