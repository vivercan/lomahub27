// HomeDashboard V27j - Solo cards modificados: iconos SVG blancos
// AppHeader, banner, layout 7+2, KPIs, rutas = INTACTO
import React, { useState, useEffect, useCallback } from 'react'
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
  decorType: 'silk' | 'ring' | 'gear'
  decorColor: string
  decorSecondary?: string
  iconFile: string
  kpiValue: number | string
  kpiLabel: string
  statusDot: 'green' | 'yellow' | 'red' | 'gray'
  statusText: string
  iconOpacity: number
  gridColumn: string
  gridRow: string
}

const DOT_COLORS: Record<string, string> = {
  green: '#10B981', yellow: '#F59E0B', red: '#EF4444', gray: '#CBD5E1',
}

export default function HomeDashboard() {
  const navigate = useNavigate()
  const { user, logout } = useAuthContext()
  const [hoveredCard, setHoveredCard] = useState<string | null>(null)

  const formatName = (email?: string) => {
    if (!email) return 'Usuario'
    const name = email.split('@')[0]
    return name.split('.').map((p: string) => p.charAt(0).toUpperCase() + p.slice(1)).join(' ')
  }

  const handleLogout = async () => {
    await logout()
    navigate('/login')
  }

  const [kpis, setKpis] = useState({
    leadsActivos: 0, viajesActivos: 0, clientes: 0,
    segmentosDedicados: 0, cuentasCxc: 0, unidadesGps: 0,
    alertasHoy: 0, formatosActivos: 0, leadsPipeline: 0,
    tractosTotal: 0, cajasTotal: 0,
  })

  const fetchKpis = useCallback(async () => {
    try {
      const [
        { count: leads }, { count: viajes }, { count: clientes },
        { count: dedicados }, { count: cxc }, { count: gps },
        { count: formatosActivos }, { count: viajesRiesgo },
        { count: notifUnread }, { count: tractos }, { count: cajas },
      ] = await Promise.all([
        supabase.from('leads').select('*', { count: 'exact', head: true }).is('deleted_at', null),
        supabase.from('viajes').select('*', { count: 'exact', head: true }).in('estado', ['asignado', 'en_transito', 'en_curso', 'programado']),
        supabase.from('clientes').select('*', { count: 'exact', head: true }).is('deleted_at', null),
        supabase.from('formatos_venta').select('*', { count: 'exact', head: true }).eq('tipo_servicio', 'DEDICADO'),
        supabase.from('cxc_cartera').select('*', { count: 'exact', head: true }),
        supabase.from('gps_tracking').select('*', { count: 'exact', head: true }),
        supabase.from('formatos_venta').select('*', { count: 'exact', head: true }).eq('activo', true),
        supabase.from('viajes').select('*', { count: 'exact', head: true }).in('estado', ['en_riesgo', 'retrasado']),
        supabase.from('notificaciones').select('*', { count: 'exact', head: true }).eq('leida', false).is('deleted_at', null),
        supabase.from('tractos').select('*', { count: 'exact', head: true }).eq('activo', true),
        supabase.from('cajas').select('*', { count: 'exact', head: true }).eq('activo', true),
      ])
      const totalAlertas = (viajesRiesgo ?? 0) + (notifUnread ?? 0)
      setKpis({
        leadsActivos: leads ?? 0, viajesActivos: viajes ?? 0,
        clientes: clientes ?? 0, segmentosDedicados: dedicados ?? 0,
        cuentasCxc: cxc ?? 0, unidadesGps: gps ?? 0,
        alertasHoy: totalAlertas, formatosActivos: formatosActivos ?? 0,
        leadsPipeline: leads ?? 0, tractosTotal: tractos ?? 0,
        cajasTotal: cajas ?? 0,
      })
    } catch (err) {
      console.error('Error fetching KPIs:', err)
    }
  }, [])

  useEffect(() => {
    fetchKpis()
    const interval = setInterval(fetchKpis, 60000)
    return () => clearInterval(interval)
  }, [fetchKpis])

  const mainCards: CardConfig[] = [
    { id: 'oportunidades', label: 'Oportunidades', route: '/ventas/mis-leads', bgColor: '#0D1220', gradient: 'linear-gradient(135deg, #0B0F1A 0%, #161C2C 100%)', decorType: 'silk', decorColor: 'rgba(255,255,255,0.08)', iconFile: 'oportunidades.svg', iconOpacity: 0.18, kpiValue: kpis.leadsActivos, kpiLabel: 'leads', statusDot: 'green', statusText: 'Pipeline activo', gridColumn: '1 / 2', gridRow: '1 / 2' },
    { id: 'servicio-clientes', label: 'Servicio al Cliente', route: '/servicio/dashboard', bgColor: '#172554', gradient: 'linear-gradient(135deg, #0B1226 0%, #13204A 50%, #1E3A8A 100%)', decorType: 'silk', decorColor: 'rgba(255,255,255,0.14)', iconFile: 'servicio-al-cliente.svg', iconOpacity: 0.14, kpiValue: kpis.clientes.toLocaleString(), kpiLabel: 'clientes', statusDot: 'green', statusText: '3 submódulos', gridColumn: '2 / 4', gridRow: '1 / 2' },
    { id: 'comercial', label: 'Comercial', route: '/ventas/dashboard', bgColor: '#172554', gradient: 'linear-gradient(135deg, #0A0F22 0%, #131C3E 50%, #1E3072 100%)', decorType: 'silk', decorColor: 'rgba(255,255,255,0.12)', iconFile: 'comercial.svg', iconOpacity: 0.15, kpiValue: kpis.formatosActivos.toLocaleString(), kpiLabel: 'formatos', statusDot: 'green', statusText: '11 submódulos', gridColumn: '4 / 5', gridRow: '1 / 3' },
    { id: 'operaciones', label: 'Operaciones', route: '/operaciones/dashboard', bgColor: '#0D1220', gradient: 'linear-gradient(135deg, #0B0F1A 0%, #181E2E 100%)', decorType: 'silk', decorColor: 'rgba(255,255,255,0.09)', iconFile: 'Despacho inteligente.svg', iconOpacity: 0.18, kpiValue: kpis.viajesActivos, kpiLabel: 'viajes', statusDot: kpis.viajesActivos > 0 ? 'green' : 'gray', statusText: kpis.viajesActivos > 0 ? 'Operando' : 'Sin viajes', gridColumn: '1 / 2', gridRow: '2 / 3' },
    { id: 'ventas', label: 'Ventas', route: '/ventas/analytics', bgColor: '#2563EB', gradient: 'linear-gradient(135deg, #1D4ED8 0%, #2563EB 45%, #3B82F6 100%)', decorType: 'silk', decorColor: 'rgba(255,255,255,0.22)', iconFile: 'Ventas.svg', iconOpacity: 0.13, kpiValue: kpis.formatosActivos.toLocaleString(), kpiLabel: 'formatos', statusDot: 'green', statusText: 'Pipeline activo', gridColumn: '2 / 3', gridRow: '2 / 3' },
    { id: 'comunicaciones', label: 'Comunicaciones', route: '/comunicaciones/dashboard', bgColor: '#0D1220', gradient: 'linear-gradient(135deg, #0A0E18 0%, #161C2A 100%)', decorType: 'gear', decorColor: 'rgba(255,255,255,0.08)', iconFile: 'comunicaciones.svg', iconOpacity: 0.18, kpiValue: '5', kpiLabel: 'canales', statusDot: 'green', statusText: 'Activo', gridColumn: '3 / 4', gridRow: '2 / 4' },
    { id: 'autofomento', label: 'Auto Fomento SEAT', route: '/', bgColor: '#2E3138', gradient: 'linear-gradient(135deg, #22252B 0%, #2E3138 45%, #3A3E46 100%)', decorType: 'silk', decorColor: 'rgba(255,255,255,0.12)', iconFile: 'comercial.svg', iconOpacity: 0.16, kpiValue: '', kpiLabel: '', statusDot: 'gray', statusText: 'Próximamente', gridColumn: '1 / 3', gridRow: '3 / 4' },
    { id: 'config', label: 'Configuración', route: '/admin/configuracion', bgColor: '#3F444D', gradient: 'linear-gradient(135deg, #2D3138 0%, #3F444D 55%, #4B515A 100%)', decorType: 'gear', decorColor: 'rgba(255,255,255,0.10)', iconFile: 'configuracion.svg', iconOpacity: 0.22, kpiValue: '', kpiLabel: 'admin', statusDot: 'gray', statusText: 'Sistema', gridColumn: '4 / 5', gridRow: '3 / 4' },
  ]

  // Helper: convierte hex a rgba con alpha, para sombras teñidas del color del card
  const hexToRgba = (hex: string, alpha: number): string => {
    const h = hex.replace('#', '')
    const r = parseInt(h.substring(0, 2), 16)
    const g = parseInt(h.substring(2, 4), 16)
    const b = parseInt(h.substring(4, 6), 16)
    return `rgba(${r},${g},${b},${alpha})`
  }

  const getCardStyle = (isHovered: boolean, card: CardConfig): React.CSSProperties => ({
    gridColumn: card.gridColumn,
    gridRow: card.gridRow,
    minHeight: 0,
    borderRadius: '20px',
    padding: '26px',
    // Fondo sobrio: gradiente base + viñeta muy sutil para profundidad premium
    background: `
      radial-gradient(ellipse at 20% 0%, rgba(255,255,255,0.06) 0%, transparent 55%),
      ${card.gradient}
    `,
    border: '1px solid rgba(255,255,255,0.05)',
    cursor: 'pointer',
    position: 'relative',
    overflow: 'hidden',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'flex-start',
    justifyContent: 'flex-start',
    transition: 'transform 0.5s cubic-bezier(0.16,1,0.3,1), box-shadow 0.5s cubic-bezier(0.16,1,0.3,1), border-color 0.3s ease',
    transform: isHovered
      ? 'translateY(-6px)'
      : 'translateY(0)',
    // Sombras en dos capas + doble highlight interno (top + bottom) para acabado premium "cristal corporativo"
    boxShadow: isHovered
      ? `
        0 26px 50px -20px rgba(0,0,0,0.50),
        0 14px 28px -12px rgba(0,0,0,0.32),
        inset 0 1px 0 rgba(255,255,255,0.09),
        inset 0 0 0 1px rgba(255,255,255,0.03),
        inset 0 -1px 0 rgba(0,0,0,0.18)
      `
      : `
        0 14px 30px -14px rgba(0,0,0,0.38),
        0 7px 15px -7px rgba(0,0,0,0.24),
        inset 0 1px 0 rgba(255,255,255,0.06),
        inset 0 0 0 1px rgba(255,255,255,0.025),
        inset 0 -1px 0 rgba(0,0,0,0.15)
      `,
  })

  // Superficies curvas con efecto chrome-fold — cada card tiene su propio recorrido (no repetitivo)
  const renderDecor = (card: CardConfig, isHovered: boolean) => {
    const baseTransition = 'transform 1s cubic-bezier(0.16,1,0.3,1), opacity 0.6s ease'
    // Intensidad atenuada globalmente (-40%) para un look más tenue y premium
    const intensity =
      card.id === 'ventas' ? 1.1
      : card.id === 'servicio-clientes' || card.id === 'comercial' ? 0.85
      : card.id === 'autofomento' ? 0.65
      : 0.72
    // Cada card tiene SU propio recorrido de curva (ribbon + hairline). Nada repetido.
    type Recipe = { ribbon: string; hairline: string; showHair2: boolean; hair2?: string }
    const recipes: Record<string, Recipe> = {
      'oportunidades': {
        ribbon: 'M -40 70 Q 100 30 250 80 T 460 50 L 460 160 Q 300 200 140 160 T -40 200 Z',
        hairline: 'M -10 130 Q 140 65 280 100 T 430 70',
        showHair2: false,
      },
      'servicio-clientes': {
        // curva más horizontal y amplia (es un card ancho 2-cols)
        ribbon: 'M -40 90 Q 120 40 240 70 T 460 55 L 460 155 Q 300 195 160 170 T -40 210 Z',
        hairline: 'M -10 135 Q 140 75 280 105 T 430 85',
        showHair2: true,
        hair2: 'M 20 170 Q 160 110 310 140 T 440 125',
      },
      'comercial': {
        // card vertical alto — curva descendente
        ribbon: 'M -40 50 Q 120 100 260 70 T 460 120 L 460 210 Q 280 230 140 200 T -40 240 Z',
        hairline: 'M 0 90 Q 130 140 270 110 T 430 150',
        showHair2: false,
      },
      'operaciones': {
        // S-curve más marcada
        ribbon: 'M -40 110 Q 80 60 200 95 Q 320 130 460 80 L 460 180 Q 320 220 200 190 Q 80 160 -40 210 Z',
        hairline: 'M -10 150 Q 100 100 220 130 Q 340 160 430 115',
        showHair2: false,
      },
      'ventas': {
        // curva ascendente amplia (card más brillante)
        ribbon: 'M -40 140 Q 130 50 270 110 T 460 70 L 460 180 Q 300 220 160 195 T -40 230 Z',
        hairline: 'M -10 170 Q 140 85 280 140 T 430 100',
        showHair2: true,
        hair2: 'M 30 200 Q 170 115 300 170 T 440 135',
      },
      'autofomento': {
        // card ancho — curva muy tendida, casi plana
        ribbon: 'M -40 120 Q 200 80 440 110 T 460 110 L 460 170 Q 220 200 -40 180 Z',
        hairline: 'M -10 150 Q 220 110 440 135',
        showHair2: false,
      },
      'comunicaciones': {
        // curva que abraza el anillo por abajo
        ribbon: 'M -40 60 Q 140 130 260 80 T 460 110 L 460 180 Q 300 230 140 200 T -40 220 Z',
        hairline: 'M 0 100 Q 150 170 270 120 T 430 145',
        showHair2: false,
      },
      'config': {
        // curva que pasa sobre el engrane
        ribbon: 'M -40 80 Q 120 130 260 100 T 460 130 L 460 190 Q 300 220 140 200 T -40 220 Z',
        hairline: 'M -10 115 Q 130 160 270 130 T 430 165',
        showHair2: false,
      },
    }
    const r = recipes[card.id] || recipes['oportunidades']

    const chromeFolds = (
      <svg
        viewBox="0 0 400 240"
        preserveAspectRatio="none"
        style={{
          position: 'absolute', inset: 0,
          width: '100%', height: '100%',
          pointerEvents: 'none',
          transition: baseTransition,
          transform: isHovered ? 'scale(1.02)' : 'scale(1)',
        }}
      >
        <defs>
          {/* Fold gradient principal — atenuado 40% para look tenue */}
          <linearGradient id={`fold1-${card.id}`} x1="50%" y1="0%" x2="50%" y2="100%">
            <stop offset="0%" stopColor="#000000" stopOpacity={0.22} />
            <stop offset="30%" stopColor="#000000" stopOpacity={0.05} />
            <stop offset="52%" stopColor="#FFFFFF" stopOpacity={0.14 * intensity} />
            <stop offset="70%" stopColor="#FFFFFF" stopOpacity={0.02} />
            <stop offset="100%" stopColor="#000000" stopOpacity={0.14} />
          </linearGradient>
          {/* Viñeta superior izquierda (más sutil) */}
          <radialGradient id={`vignette-${card.id}`} cx="0%" cy="0%" r="100%">
            <stop offset="0%" stopColor="#000000" stopOpacity={0.22} />
            <stop offset="50%" stopColor="#000000" stopOpacity="0" />
          </radialGradient>
          {/* Hairline brillante (más tenue) */}
          <linearGradient id={`hair-${card.id}`} x1="0%" y1="50%" x2="100%" y2="50%">
            <stop offset="0%" stopColor="#FFFFFF" stopOpacity="0" />
            <stop offset="45%" stopColor="#FFFFFF" stopOpacity={0.32 * intensity} />
            <stop offset="100%" stopColor="#FFFFFF" stopOpacity="0" />
          </linearGradient>
        </defs>
        {/* Capa 0: viñeta superior-izquierda */}
        <rect width="400" height="240" fill={`url(#vignette-${card.id})`} />
        {/* Capa 1: un solo ribbon con recorrido específico del card */}
        <path d={r.ribbon} fill={`url(#fold1-${card.id})`} />
        {/* Capa 2: hairline principal (único en la mayoría de cards) */}
        <path
          d={r.hairline}
          stroke={`url(#hair-${card.id})`}
          strokeWidth="0.8"
          fill="none"
        />
        {/* Capa 3: hairline adicional solo en cards anchos (para balancear el vacío) */}
        {r.showHair2 && r.hair2 && (
          <path
            d={r.hair2}
            stroke="#FFFFFF"
            strokeOpacity={0.10 * intensity}
            strokeWidth="0.6"
            fill="none"
          />
        )}
      </svg>
    )

    // Icon universal — watermark discreto, tamaño fijo uniforme, bien alineado
    // Caja cuadrada de 72px (no porcentaje) → TODOS los cards tienen icons del MISMO tamaño absoluto
    const icon = card.iconFile && card.iconOpacity > 0 ? (
      <div
        style={{
          position: 'absolute',
          right: '18px', bottom: '18px',
          width: '72px',
          height: '72px',
          pointerEvents: 'none',
          transition: baseTransition,
          transform: isHovered ? 'scale(1.04)' : 'scale(1)',
        }}
      >
        <img
          src={`/icons/dashboard/${card.iconFile}`}
          alt=""
          style={{
            width: '100%',
            height: '100%',
            objectFit: 'contain',
            opacity: card.iconOpacity,
            // Emboss sutil: highlight arriba + sombra suave + contacto
            filter: `
              brightness(0) invert(1)
              drop-shadow(0 1px 0 rgba(255,255,255,0.15))
              drop-shadow(0 3px 8px rgba(0,0,0,0.45))
              drop-shadow(0 1px 2px rgba(0,0,0,0.30))
            `,
          }}
        />
      </div>
    ) : null

    if (card.decorType === 'silk') {
      return (
        <>
          {chromeFolds}
          {icon}
        </>
      )
    }
    if (card.decorType === 'ring') {
      return (
        <>
          {chromeFolds}
          <svg
            viewBox="0 0 400 400"
            preserveAspectRatio="xMidYMid meet"
            style={{
              position: 'absolute',
              right: '-18%', bottom: '-22%',
              width: '92%', height: '92%',
              pointerEvents: 'none',
              transition: baseTransition,
              transform: isHovered ? 'scale(1.04)' : 'scale(1)',
            }}
          >
            <defs>
              <radialGradient id={`ringGlow-${card.id}`} cx="50%" cy="50%" r="50%">
                <stop offset="60%" stopColor="rgba(255,255,255,0)" />
                <stop offset="82%" stopColor="rgba(255,255,255,0.18)" />
                <stop offset="100%" stopColor="rgba(255,255,255,0)" />
              </radialGradient>
            </defs>
            <circle cx="200" cy="200" r="180" fill={`url(#ringGlow-${card.id})`} />
            <circle cx="200" cy="200" r="180" fill="none" stroke="rgba(255,255,255,0.28)" strokeWidth="1.5" />
            <circle cx="200" cy="200" r="155" fill="none" stroke="rgba(255,255,255,0.12)" strokeWidth="1" />
            <circle cx="200" cy="200" r="128" fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="1" />
          </svg>
        </>
      )
    }
    if (card.decorType === 'gear') {
      return (
        <>
          {chromeFolds}
          {icon}
        </>
      )
    }
    return null
  }

  const renderCard = (card: CardConfig) => {
    const isHovered = hoveredCard === card.id
    // Todos los cards son dark premium → texto blanco
    const textColor = '#FFFFFF'
    const mutedColor = 'rgba(255,255,255,0.72)'
    return (
      <div
        key={card.id}
        onClick={() => navigate(card.route)}
        onMouseEnter={() => setHoveredCard(card.id)}
        onMouseLeave={() => setHoveredCard(null)}
        style={getCardStyle(isHovered, card)}
      >
        {renderDecor(card, isHovered)}
        <div style={{
          position: 'absolute', top: '16px', right: '16px',
          width: '7px', height: '7px', borderRadius: '50%',
          backgroundColor: DOT_COLORS[card.statusDot] || DOT_COLORS.gray,
          boxShadow: `0 0 0 2px rgba(255,255,255,0.04), 0 0 8px ${DOT_COLORS[card.statusDot] || DOT_COLORS.gray}66`,
          zIndex: 3,
        }} />
        <div style={{
          fontFamily: "'Montserrat', sans-serif",
          fontSize: '28px',
          fontWeight: 800,
          color: textColor,
          letterSpacing: '-0.5px',
          lineHeight: 1.1,
          marginBottom: 'auto',
          textAlign: 'left', width: '100%',
          // Efecto 3D extrudido: highlight superior + capas oscuras descendentes + sombra difusa
          textShadow: `
            0 1px 0 rgba(255,255,255,0.18),
            0 -1px 0 rgba(0,0,0,0.35),
            0 2px 0 rgba(0,0,0,0.45),
            0 3px 0 rgba(0,0,0,0.30),
            0 4px 2px rgba(0,0,0,0.30),
            0 6px 12px rgba(0,0,0,0.45),
            0 10px 24px rgba(0,0,0,0.25)
          `,
          position: 'relative',
          zIndex: 2,
        }}>
          {card.label}
        </div>
        {card.kpiValue !== '' && (
          <div style={{
            fontFamily: "'Montserrat', sans-serif",
            fontSize: '39px',
            fontWeight: 800,
            color: textColor,
            letterSpacing: '-1.2px',
            textAlign: 'left', width: '100%', lineHeight: 1,
            marginTop: '6px',
            position: 'relative',
            zIndex: 2,
            textShadow: '0 1px 2px rgba(0,0,0,0.40), 0 3px 10px rgba(0,0,0,0.25)',
          }}>
            {card.kpiValue}
          </div>
        )}
        <div style={{
          fontFamily: "'Montserrat', sans-serif",
          fontSize: '12px',
          fontWeight: 500,
          color: mutedColor,
          letterSpacing: '0.2px',
          textAlign: 'left', width: '100%',
          marginTop: '6px',
          position: 'relative',
          zIndex: 2,
        }}>
          {card.statusText}
        </div>
      </div>
    )
  }

  return (
    <div style={{
      height: '100vh',
      overflow: 'hidden',
      display: 'flex',
      flexDirection: 'column',
      background: '#FFFFFF',
      fontFamily: "'Montserrat', sans-serif",
      color: '#1E293B',
    }}>
      <style>{`@import url('https://fonts.googleapis.com/css2?family=Montserrat:wght@400;500;600;700;800&display=swap');`}</style>
      <AppHeader
        onLogout={handleLogout}
        userName={formatName(user?.email)}
        userRole={user?.rol || 'admin'}
        userEmail={user?.email}
      />
      <div style={{
        flex: '1 1 auto',
        padding: '33px 28px',
        display: 'flex',
        flexDirection: 'column',
        gap: '14px',
        overflow: 'hidden',
        background: 'radial-gradient(ellipse at 50% 45%, #8E8E8E 0%, #757575 40%, #5A5A5A 85%, #525252 100%)',
      }}>
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(4, 1fr)',
          gridTemplateRows: 'repeat(3, 1fr)',
          gap: '14px',
          flex: '0 0 70%',
          minHeight: 0,
        }}>
          {mainCards.map(renderCard)}
        </div>
      </div>
    </div>
  )
}












