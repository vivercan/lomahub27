// HomeDashboard V34 - Drag siempre activo (sin modo edición) + refinement V32
// Cambios sobre V33 autorizados por JJ 21/Abr/2026 noche:
//   - ELIMINADO modo edición (botones Editar/Listo/Restaurar + tooltip + drag handles)
//   - Drag siempre activo: click normal navega, drag (>5px) mueve el card
//   - Cursor 'grab' en hover, 'grabbing' mientras se arrastra
//   - Swap 1:1 dentro de familia, localStorage por usuario preservado
//   - Todo el refinement visual V32 intacto (colores, material, shadows, typography)
import React, { useState, useEffect, useCallback, useMemo } from 'react'
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
  family: 'A' | 'B' | 'C'
}

interface Slot {
  family: 'A' | 'B' | 'C'
  gridColumn: string
  gridRow: string
}

// 8 slots fijos — la cuadratura nunca cambia, solo qué card ocupa cada slot
const SLOTS: Slot[] = [
  { family: 'A', gridColumn: '1 / 2', gridRow: '1 / 2' }, // 0 — default: oportunidades
  { family: 'B', gridColumn: '2 / 4', gridRow: '1 / 2' }, // 1 — default: servicio
  { family: 'C', gridColumn: '4 / 5', gridRow: '1 / 3' }, // 2 — default: comercial
  { family: 'A', gridColumn: '1 / 2', gridRow: '2 / 3' }, // 3 — default: operaciones
  { family: 'A', gridColumn: '2 / 3', gridRow: '2 / 3' }, // 4 — default: ventas
  { family: 'C', gridColumn: '3 / 4', gridRow: '2 / 4' }, // 5 — default: comunicaciones
  { family: 'B', gridColumn: '1 / 3', gridRow: '3 / 4' }, // 6 — default: autofomento
  { family: 'A', gridColumn: '4 / 5', gridRow: '3 / 4' }, // 7 — default: config
]

const DEFAULT_LAYOUT = [
  'oportunidades', 'servicio-clientes', 'comercial', 'operaciones',
  'ventas', 'comunicaciones', 'autofomento', 'config',
]

export default function HomeDashboard() {
  const navigate = useNavigate()
  const { user, logout } = useAuthContext()
  const [hoveredCard, setHoveredCard] = useState<string | null>(null)
  const [pressedCard, setPressedCard] = useState<string | null>(null)
  const [draggingId, setDraggingId] = useState<string | null>(null)
  const [overSlot, setOverSlot] = useState<number | null>(null)

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
    'oportunidades': { id: 'oportunidades', label: 'Oportunidades', route: '/ventas/mis-leads', bgColor: '#2763C4', gradient: 'linear-gradient(135deg, #2763C4 0%, #0A2D6F 100%)', iconFile: 'oportunidades.svg', statusDot: 'green', statusText: 'Mis Leads · Funnel · Oportunidades', family: 'A' },
    'servicio-clientes': { id: 'servicio-clientes', label: 'Servicio al Cliente', route: '/servicio/dashboard', bgColor: '#2B5FB5', gradient: 'linear-gradient(135deg, #2B5FB5 0%, #0B2E68 100%)', iconFile: 'servicio-al-cliente.svg', statusDot: 'green', statusText: 'Tickets · KPIs · Programación', family: 'B' },
    'comercial': { id: 'comercial', label: 'Comercial', route: '/ventas/dashboard', bgColor: '#2557A8', gradient: 'linear-gradient(135deg, #2557A8 0%, #082552 100%)', iconFile: 'comercial.svg', statusDot: 'green', statusText: 'Formatos · Cotizaciones · Analytics', family: 'C' },
    'operaciones': { id: 'operaciones', label: 'Operaciones', route: '/operaciones/dashboard', bgColor: '#3D78D6', gradient: 'linear-gradient(135deg, #3D78D6 0%, #134287 100%)', iconFile: 'camion-contenedor-v2.svg', statusDot: 'green', statusText: 'Despachos · Seguimiento', family: 'A' },
    'ventas': { id: 'ventas', label: 'Ventas', route: '/ventas/analytics', bgColor: '#C77A22', gradient: 'linear-gradient(135deg, #C77A22 0%, #7A3F0E 100%)', iconFile: 'ingresos.svg', statusDot: 'green', statusText: 'Analytics · KPIs', family: 'A' },
    'comunicaciones': { id: 'comunicaciones', label: 'Comunicaciones', route: '/comunicaciones/dashboard', bgColor: '#4F88E3', gradient: 'linear-gradient(135deg, #4F88E3 0%, #1B56A8 100%)', iconFile: 'comunicaciones.svg', statusDot: 'green', statusText: 'Mail · WhatsApp · Resumen Ejecutivo IA', family: 'C' },
    'autofomento': { id: 'autofomento', label: 'Control de equipo', route: '/control-equipo', bgColor: '#3A72CF', gradient: 'linear-gradient(135deg, #3A72CF 0%, #153E82 100%)', iconFile: 'gps.svg', statusDot: 'green', statusText: 'GPS · Cajas · Tractos · Thermos', family: 'B' },
    'config': { id: 'config', label: 'Configuración', route: '/admin/configuracion', bgColor: '#3F4856', gradient: 'linear-gradient(135deg, #3F4856 0%, #0F1620 100%)', iconFile: 'configuracion.svg', statusDot: 'gray', statusText: '', family: 'A' },
  }), [])

  const layoutKey = `lhub27-layout-${user?.id || 'guest'}`
  const [layout, setLayout] = useState<string[]>(() => {
    if (typeof window === 'undefined') return DEFAULT_LAYOUT
    try {
      const stored = window.localStorage.getItem(layoutKey)
      if (stored) {
        const parsed = JSON.parse(stored)
        if (Array.isArray(parsed) && parsed.length === 8 && parsed.every((id) => id in cardCatalog)) {
          const valid = parsed.every((id: string, i: number) => cardCatalog[id]?.family === SLOTS[i].family)
          if (valid) return parsed
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
          const valid = parsed.every((id: string, i: number) => cardCatalog[id]?.family === SLOTS[i].family)
          if (valid) {
            setLayout(parsed)
            return
          }
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

  const handleDragStart = (e: React.DragEvent, cardId: string) => {
    e.dataTransfer.setData('text/plain', cardId)
    e.dataTransfer.effectAllowed = 'move'
    setDraggingId(cardId)
    setPressedCard(null) // cancelar pressed si empieza drag
    setHoveredCard(null)
  }

  const handleDragEnd = () => {
    setDraggingId(null)
    setOverSlot(null)
  }

  const handleDragOver = (e: React.DragEvent, slotIndex: number) => {
    if (!draggingId) return
    const draggingCard = cardCatalog[draggingId]
    if (draggingCard && draggingCard.family === SLOTS[slotIndex].family) {
      e.preventDefault()
      e.dataTransfer.dropEffect = 'move'
      setOverSlot(slotIndex)
    }
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

    const draggedFamily = cardCatalog[draggedId].family
    const targetFamily = SLOTS[targetSlotIndex].family
    if (draggedFamily !== targetFamily) {
      setDraggingId(null)
      setOverSlot(null)
      return
    }

    const newLayout = [...layout]
    ;[newLayout[sourceSlotIndex], newLayout[targetSlotIndex]] = [newLayout[targetSlotIndex], newLayout[sourceSlotIndex]]
    setLayout(newLayout)
    setDraggingId(null)
    setOverSlot(null)
  }

  const getCardStyle = (isHovered: boolean, isPressed: boolean, card: CardConfig, slot: Slot, slotIndex: number): React.CSSProperties => {
    const materialGradient = `
      radial-gradient(ellipse at 0% 0%, rgba(255,255,255,0.09) 0%, rgba(255,255,255,0) 40%),
      linear-gradient(180deg, rgba(255,255,255,0.08) 0%, rgba(255,255,255,0.02) 20%, rgba(0,0,0,0.10) 100%),
      ${card.gradient}
    `

    const isDragging = draggingId === card.id
    const isValidDropTarget = draggingId && cardCatalog[draggingId]?.family === slot.family && draggingId !== card.id
    const isOverThisSlot = overSlot === slotIndex && isValidDropTarget

    let transform: string
    let boxShadow: string
    let outline = 'none'
    let outlineOffset = '0'

    if (isDragging) {
      transform = 'scale(0.98)'
      boxShadow = `inset 0 1px 0 rgba(255,255,255,0.16), 0 8px 16px rgba(15,23,42,0.12)`
    } else if (isOverThisSlot) {
      transform = 'translateY(-2px)'
      boxShadow = `inset 0 1px 0 rgba(255,255,255,0.20), 0 10px 24px rgba(214,168,79,0.28), 0 4px 10px rgba(15,23,42,0.10)`
      outline = '2px solid rgba(214,168,79,0.70)'
      outlineOffset = '2px'
    } else if (isValidDropTarget) {
      // Target válido mientras se arrastra otro card de la misma familia — hint sutil
      transform = 'translateY(0)'
      boxShadow = `inset 0 1px 0 rgba(255,255,255,0.16), inset 0 -1px 0 rgba(0,0,0,0.20), 0 10px 22px rgba(15,23,42,0.14), 0 3px 8px rgba(15,23,42,0.08)`
      outline = '1px dashed rgba(214,168,79,0.32)'
      outlineOffset = '2px'
    } else if (isPressed) {
      transform = 'translateY(1px)'
      boxShadow = `inset 0 1px 0 rgba(255,255,255,0.06), inset 0 3px 8px rgba(0,0,0,0.18), 0 2px 6px rgba(0,0,0,0.14), 0 1px 2px rgba(0,0,0,0.10)`
    } else if (isHovered) {
      transform = 'translateY(-3px)'
      boxShadow = `inset 0 1px 0 rgba(255,255,255,0.18), inset 0 -1px 0 rgba(0,0,0,0.22), inset 0 -14px 26px rgba(0,0,0,0.10), 0 18px 42px rgba(15,23,42,0.22), 0 6px 14px rgba(15,23,42,0.14)`
    } else {
      transform = 'translateY(0)'
      boxShadow = `inset 0 1px 0 rgba(255,255,255,0.16), inset 0 -1px 0 rgba(0,0,0,0.20), inset 0 -12px 22px rgba(0,0,0,0.08), 0 14px 30px rgba(15,23,42,0.16), 0 4px 10px rgba(15,23,42,0.10)`
    }

    return ({
      gridColumn: slot.gridColumn,
      gridRow: slot.gridRow,
      minHeight: 0,
      borderRadius: '20px',
      padding: '28px',
      background: materialGradient,
      border: '1px solid rgba(255,255,255,0.09)',
      outline,
      outlineOffset,
      cursor: isDragging ? 'grabbing' : 'grab',
      position: 'relative',
      overflow: 'hidden',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'flex-start',
      justifyContent: 'flex-start',
      transition: 'transform 0.24s cubic-bezier(0.22,1,0.36,1), box-shadow 0.24s ease, outline 0.18s ease, opacity 0.2s ease',
      transform,
      boxShadow,
      opacity: isDragging ? 0.5 : 1,
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
    const iconOpacity = isHovered ? 0.10 : 0.07
    const iconBottom = card.id === 'operaciones' ? '-26px' : '8px'
    const iconRight = card.id === 'operaciones' ? '8px' : '16px'
    const icon = card.iconFile ? (
      <div style={{ position: 'absolute', right: iconRight, bottom: iconBottom, width: `${iconSize}px`, height: `${iconSize}px`, pointerEvents: 'none', transition: baseTransition, zIndex: 2, filter: 'drop-shadow(0 2px 6px rgba(0,0,0,0.10))' }}>
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

    return (
      <div
        key={card.id}
        draggable={true}
        onDragStart={(e) => handleDragStart(e, card.id)}
        onDragEnd={handleDragEnd}
        onDragOver={(e) => handleDragOver(e, slotIndex)}
        onDragLeave={(e) => handleDragLeave(e, slotIndex)}
        onDrop={(e) => handleDrop(e, slotIndex)}
        onClick={() => { if (!draggingId) navigate(card.route) }}
        onMouseEnter={() => !draggingId && setHoveredCard(card.id)}
        onMouseLeave={() => { setHoveredCard(null); setPressedCard(null) }}
        onMouseDown={() => !draggingId && setPressedCard(card.id)}
        onMouseUp={() => setPressedCard(null)}
        style={getCardStyle(isHovered, isPressed, card, slot, slotIndex)}
      >
        {renderDecor(card, isHovered)}
        <div style={{ position: 'absolute', top: '18px', right: '18px', width: '6px', height: '6px', borderRadius: '50%', background: '#D6A84F', boxShadow: '0 0 0 1.5px rgba(214,168,79,0.18), 0 0 8px rgba(214,168,79,0.35)', zIndex: 3, pointerEvents: 'none' }} />
        <div style={{ fontFamily: "'Montserrat', sans-serif", fontSize: '22px', fontWeight: 800, color: '#FFFFFF', letterSpacing: '-0.02em', lineHeight: 1.15, marginBottom: 'auto', textAlign: 'left', width: '100%', position: 'relative', zIndex: 2, textShadow: '0 1px 0 rgba(255,255,255,0.08), 0 1px 3px rgba(0,0,0,0.24)', pointerEvents: 'none' }}>
          {card.label}
        </div>
        <div style={{ fontFamily: "'Montserrat', sans-serif", fontSize: '12px', fontWeight: 500, color: 'rgba(255,255,255,0.70)', letterSpacing: '0.2px', textAlign: 'left', width: '100%', marginTop: '8px', position: 'relative', zIndex: 3, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', boxSizing: 'border-box', textShadow: '0 1px 2px rgba(0,0,0,0.16)', pointerEvents: 'none' }}>
          {card.statusText}
        </div>
      </div>
    )
  }

  return (
    <div style={{ height: '100vh', overflow: 'hidden', display: 'flex', flexDirection: 'column', background: `radial-gradient(ellipse 120% 80% at 50% 0%, rgba(255,255,255,0.6) 0%, rgba(255,255,255,0) 60%), #ECEEF2`, fontFamily: "'Montserrat', sans-serif", color: '#1E293B' }}>
      <style>{`@import url('https://fonts.googleapis.com/css2?family=Montserrat:wght@400;500;600;700;800&display=swap');`}</style>
      <AppHeader onLogout={handleLogout} userName={formatName(user?.email)} userRole={user?.rol || 'admin'} userEmail={user?.email} />
      <div style={{ flex: '1 1 auto', padding: '36px 32px', display: 'flex', flexDirection: 'column', gap: '16px', overflow: 'hidden' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gridTemplateRows: 'repeat(3, 1fr)', gap: '16px', flex: '0 0 72%', minHeight: 0 }}>
          {SLOTS.map((_, i) => renderCard(i))}
        </div>
      </div>
    </div>
  )
}
