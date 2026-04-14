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
    { id: 'oportunidades', label: 'Oportunidades', route: '/ventas/mis-leads', bgColor: '#000000', gradient: 'linear-gradient(135deg, #0A0A0A 0%, #050505 50%, #000000 100%)', decorType: 'silk', decorColor: 'rgba(255,255,255,0.08)', iconFile: 'oportunidades.svg', iconOpacity: 0.18, kpiValue: kpis.leadsActivos, kpiLabel: 'leads', statusDot: 'green', statusText: 'Pipeline activo', gridColumn: '1 / 2', gridRow: '1 / 2' },
    { id: 'servicio-clientes', label: 'Servicio al Cliente', route: '/servicio/dashboard', bgColor: '#040D28', gradient: 'linear-gradient(135deg, #030A22 0%, #061230 50%, #081840 100%)', decorType: 'silk', decorColor: 'rgba(255,255,255,0.10)', iconFile: 'servicio-al-cliente.svg', iconOpacity: 0.14, kpiValue: kpis.clientes.toLocaleString(), kpiLabel: 'clientes', statusDot: 'green', statusText: '3 submódulos', gridColumn: '2 / 4', gridRow: '1 / 2' },
    { id: 'comercial', label: 'Comercial', route: '/ventas/dashboard', bgColor: '#FFCC00', gradient: 'linear-gradient(135deg, #FFD000 0%, #FFC000 50%, #FFB000 100%)', decorType: 'silk', decorColor: 'rgba(255,180,0,0.20)', iconFile: 'comercial.svg', iconOpacity: 0.18, kpiValue: kpis.formatosActivos.toLocaleString(), kpiLabel: 'formatos', statusDot: 'green', statusText: '11 submódulos', gridColumn: '4 / 5', gridRow: '1 / 3' },
    { id: 'operaciones', label: 'Operaciones', route: '/operaciones/dashboard', bgColor: '#F4F4F4', gradient: 'linear-gradient(135deg, #F8F8F8 0%, #EDEDED 55%, #E0E0E0 100%)', decorType: 'silk', decorColor: 'rgba(0,0,0,0.05)', iconFile: 'Despacho inteligente.svg', iconOpacity: 0.18, kpiValue: kpis.viajesActivos, kpiLabel: 'viajes', statusDot: kpis.viajesActivos > 0 ? 'green' : 'gray', statusText: kpis.viajesActivos > 0 ? 'Operando' : 'Sin viajes', gridColumn: '1 / 2', gridRow: '2 / 3' },
    { id: 'ventas', label: 'Ventas', route: '/ventas/analytics', bgColor: '#1868E8', gradient: 'linear-gradient(135deg, #0F56E0 0%, #1868E8 50%, #2A7AF2 100%)', decorType: 'silk', decorColor: 'rgba(255,255,255,0.22)', iconFile: 'Ventas.svg', iconOpacity: 0.13, kpiValue: kpis.formatosActivos.toLocaleString(), kpiLabel: 'formatos', statusDot: 'green', statusText: 'Pipeline activo', gridColumn: '2 / 3', gridRow: '2 / 3' },
    { id: 'comunicaciones', label: 'Comunicaciones', route: '/comunicaciones/dashboard', bgColor: '#0AA8F0', gradient: 'linear-gradient(135deg, #06A8F0 0%, #1AB0F5 50%, #2BB5F5 100%)', decorType: 'gear', decorColor: 'rgba(255,255,255,0.08)', iconFile: 'comunicaciones.svg', iconOpacity: 0.18, kpiValue: '5', kpiLabel: 'canales', statusDot: 'green', statusText: 'Activo', gridColumn: '3 / 4', gridRow: '2 / 4' },
    { id: 'autofomento', label: 'Control de equipo', route: '/', bgColor: '#1BD51A', gradient: 'linear-gradient(90deg, #B8E614 0%, #7CDB12 35%, #2BCE1A 75%, #0CC014 100%)', decorType: 'silk', decorColor: 'rgba(255,255,255,0.12)', iconFile: 'comercial.svg', iconOpacity: 0.16, kpiValue: '', kpiLabel: '', statusDot: 'gray', statusText: 'Próximamente', gridColumn: '1 / 3', gridRow: '3 / 4' },
    { id: 'config', label: 'Configuración', route: '/admin/configuracion', bgColor: '#E84040', gradient: 'linear-gradient(135deg, #F05050 0%, #E84040 50%, #D63030 100%)', decorType: 'gear', decorColor: 'rgba(255,255,255,0.10)', iconFile: 'configuracion.svg', iconOpacity: 0.22, kpiValue: '', kpiLabel: 'admin', statusDot: 'gray', statusText: 'Sistema', gridColumn: '4 / 5', gridRow: '3 / 4' },
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

    // Caso especial Configuración: papel crepé rojo con pliegues diagonales y textura vertical
    if (card.id === 'config') {
      return (
        <>
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
              {/* Patrón de fibra vertical tipo crepé */}
              <pattern id="cfgFiber" x="0" y="0" width="3" height="240" patternUnits="userSpaceOnUse">
                <line x1="0" y1="0" x2="0" y2="240" stroke="rgba(120,20,20,0.18)" strokeWidth="0.5" />
                <line x1="1.5" y1="0" x2="1.5" y2="240" stroke="rgba(255,200,200,0.10)" strokeWidth="0.3" />
              </pattern>
              {/* Highlight suave diagonal */}
              <linearGradient id="cfgHighlight" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#FF6A6A" stopOpacity="0.35" />
                <stop offset="50%" stopColor="#FF8080" stopOpacity="0.20" />
                <stop offset="100%" stopColor="#FF5050" stopOpacity="0" />
              </linearGradient>
              {/* Sombra suave de capa */}
              <linearGradient id="cfgShadow" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#A01818" stopOpacity="0" />
                <stop offset="50%" stopColor="#B01C1C" stopOpacity="0.30" />
                <stop offset="100%" stopColor="#8A1212" stopOpacity="0.55" />
              </linearGradient>
            </defs>
            {/* Capa 1 (parte superior) - tono medio con borde de pliegue */}
            <polygon points="0,0 400,0 400,60 0,95" fill="#E84040" />
            <polygon points="0,0 400,0 400,60 0,95" fill="url(#cfgHighlight)" />
            {/* Borde/hairline del pliegue */}
            <polygon points="0,95 400,60 400,64 0,99" fill="rgba(80,8,8,0.40)" />
            <polygon points="0,92 400,57 400,60 0,95" fill="rgba(255,180,180,0.25)" />

            {/* Capa 2 (centro) - más claro */}
            <polygon points="0,95 400,60 400,145 0,175" fill="#F05050" />
            <polygon points="0,95 400,60 400,145 0,175" fill="url(#cfgHighlight)" opacity="0.6" />
            {/* Borde del pliegue inferior */}
            <polygon points="0,175 400,145 400,149 0,179" fill="rgba(90,10,10,0.45)" />
            <polygon points="0,172 400,142 400,145 0,175" fill="rgba(255,190,190,0.25)" />

            {/* Capa 3 (inferior) - tono profundo con sombra */}
            <polygon points="0,175 400,145 400,240 0,240" fill="#D83030" />
            <polygon points="0,175 400,145 400,240 0,240" fill="url(#cfgShadow)" />

            {/* Textura de fibra vertical sobre todo el card */}
            <rect width="400" height="240" fill="url(#cfgFiber)" opacity="0.85" />

            {/* Detalle de edge irregular en los pliegues (tear-like) */}
            <path d="M 50 93 L 80 96 L 120 92 L 160 94 L 200 91 L 240 95 L 280 90 L 320 93 L 360 91"
                  stroke="rgba(60,5,5,0.30)" strokeWidth="0.5" fill="none" />
            <path d="M 50 173 L 90 176 L 130 172 L 170 175 L 210 171 L 250 175 L 290 172 L 330 175 L 370 172"
                  stroke="rgba(60,5,5,0.35)" strokeWidth="0.5" fill="none" />
          </svg>
          {icon}
        </>
      )
    }
    // Caso especial Control de equipo: verde vibrante con ondas verticales tipo cortina
    if (card.id === 'autofomento') {
      return (
        <>
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
              <linearGradient id="ctrlWaveLight" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="#D4F04C" stopOpacity="0.55" />
                <stop offset="100%" stopColor="#D4F04C" stopOpacity="0" />
              </linearGradient>
              <linearGradient id="ctrlWaveDark" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="#0A9012" stopOpacity="0" />
                <stop offset="100%" stopColor="#0A9012" stopOpacity="0.35" />
              </linearGradient>
            </defs>
            {/* Bandas verticales curvas tipo cortina */}
            <path d="M 80 -20 Q 60 120 90 260 L 130 260 Q 110 120 130 -20 Z" fill="url(#ctrlWaveLight)" />
            <path d="M 170 -20 Q 150 120 180 260 L 215 260 Q 200 120 220 -20 Z" fill="url(#ctrlWaveLight)" opacity="0.75" />
            <path d="M 260 -20 Q 245 120 275 260 L 310 260 Q 295 120 315 -20 Z" fill="url(#ctrlWaveDark)" />
            <path d="M 340 -20 Q 325 120 355 260 L 420 260 Q 400 120 420 -20 Z" fill="url(#ctrlWaveDark)" opacity="0.85" />
            {/* Highlight curvado en esquina superior izquierda */}
            <path d="M -20 -20 Q 20 50 -20 120 Z" fill="#E8FA5C" opacity="0.45" />
          </svg>
          {icon}
        </>
      )
    }
    // Caso especial Ventas: chevrons apuntando a la derecha con highlights cyan
    if (card.id === 'ventas') {
      return (
        <>
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
              <linearGradient id="ventChevronLight" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="#1FC4FF" stopOpacity="0.75" />
                <stop offset="100%" stopColor="#5DD4FF" stopOpacity="0.55" />
              </linearGradient>
              <linearGradient id="ventChevronMid" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="#3F8CF5" stopOpacity="0.55" />
                <stop offset="100%" stopColor="#5DA3FF" stopOpacity="0.45" />
              </linearGradient>
              <linearGradient id="ventChevronDark" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="#0E4FC2" stopOpacity="0.70" />
                <stop offset="100%" stopColor="#1968E8" stopOpacity="0" />
              </linearGradient>
            </defs>
            {/* Chevrons apuntando a la derecha — stacked desde izquierda hacia afuera */}
            <polygon points="200,0 270,0 340,120 270,240 200,240 270,120" fill="url(#ventChevronDark)" />
            <polygon points="255,0 310,0 375,120 310,240 255,240 320,120" fill="url(#ventChevronMid)" />
            <polygon points="300,0 345,0 400,120 345,240 300,240 355,120" fill="url(#ventChevronLight)" />
            <polygon points="340,0 375,0 420,120 375,240 340,240 385,120" fill="url(#ventChevronMid)" opacity="0.8" />
            <polygon points="370,0 400,0 430,120 400,240 370,240 405,120" fill="url(#ventChevronLight)" opacity="0.6" />
          </svg>
          {icon}
        </>
      )
    }
    // Caso especial Comunicaciones: rayas horizontales diagonales cyan
    if (card.id === 'comunicaciones') {
      return (
        <>
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
              <linearGradient id="comuStripeLight" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="#3ED4FF" stopOpacity="0.45" />
                <stop offset="100%" stopColor="#88E0FF" stopOpacity="0.25" />
              </linearGradient>
              <linearGradient id="comuStripeDark" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="#0668A8" stopOpacity="0.35" />
                <stop offset="100%" stopColor="#0890D0" stopOpacity="0.20" />
              </linearGradient>
            </defs>
            {/* Rayas horizontales-diagonales con rotación suave -8° */}
            <g transform="rotate(-8 200 120)">
              <rect x="-80" y="-10" width="600" height="8" fill="url(#comuStripeLight)" />
              <rect x="-80" y="15" width="600" height="14" fill="url(#comuStripeLight)" opacity="0.7" />
              <rect x="-80" y="40" width="600" height="5" fill="url(#comuStripeDark)" />
              <rect x="-80" y="55" width="600" height="10" fill="url(#comuStripeLight)" />
              <rect x="-80" y="80" width="600" height="18" fill="url(#comuStripeLight)" opacity="0.55" />
              <rect x="-80" y="110" width="600" height="6" fill="url(#comuStripeDark)" />
              <rect x="-80" y="125" width="600" height="12" fill="url(#comuStripeLight)" />
              <rect x="-80" y="150" width="600" height="22" fill="url(#comuStripeLight)" opacity="0.40" />
              <rect x="-80" y="185" width="600" height="8" fill="url(#comuStripeDark)" />
              <rect x="-80" y="200" width="600" height="14" fill="url(#comuStripeLight)" opacity="0.65" />
              <rect x="-80" y="225" width="600" height="10" fill="url(#comuStripeLight)" />
              <rect x="-80" y="250" width="600" height="16" fill="url(#comuStripeLight)" opacity="0.55" />
            </g>
            {/* Bloque rectangular notch central-derecha */}
            <polygon points="240,125 400,115 400,185 230,195" fill="#0668A8" opacity="0.18" />
          </svg>
          {icon}
        </>
      )
    }
    if (card.decorType === 'silk') {
      // Caso especial Operaciones: blanco premium con óvalos orgánicos translúcidos
      if (card.id === 'operaciones') {
        return (
          <>
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
                <linearGradient id="opOvalLight" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#E8E8E8" stopOpacity="0.65" />
                  <stop offset="100%" stopColor="#D0D0D0" stopOpacity="0.30" />
                </linearGradient>
                <linearGradient id="opOvalSoft" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#DADADA" stopOpacity="0.50" />
                  <stop offset="100%" stopColor="#C5C5C5" stopOpacity="0.20" />
                </linearGradient>
              </defs>
              {/* Óvalo grande arriba-izquierda (cortado) */}
              <ellipse cx="120" cy="30" rx="110" ry="95" fill="url(#opOvalLight)" />
              {/* Óvalo grande centro-izquierda intersectando abajo */}
              <ellipse cx="80" cy="200" rx="130" ry="100" fill="url(#opOvalSoft)" />
              {/* Óvalo grande centro-derecha abajo */}
              <ellipse cx="260" cy="220" rx="170" ry="110" fill="url(#opOvalLight)" opacity="0.75" />
              {/* Óvalo derecha */}
              <ellipse cx="390" cy="180" rx="120" ry="95" fill="url(#opOvalSoft)" opacity="0.85" />
              {/* Pequeño acento abajo-centro */}
              <ellipse cx="200" cy="235" rx="80" ry="45" fill="#C8C8C8" opacity="0.20" />
            </svg>
            {/* Icono oscuro en lugar de blanco para fondo claro */}
            {card.iconFile && card.iconOpacity > 0 && (
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
                    opacity: 0.25,
                    filter: `
                      brightness(0)
                      drop-shadow(0 1px 0 rgba(255,255,255,0.6))
                      drop-shadow(0 2px 4px rgba(0,0,0,0.15))
                    `,
                  }}
                />
              </div>
            )}
          </>
        )
      }
      // Caso especial Comercial: amarillo dorado con anillos orgánicos translúcidos
      if (card.id === 'comercial') {
        return (
          <>
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
                <linearGradient id="comYellowLight" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#FFF060" stopOpacity="0.55" />
                  <stop offset="100%" stopColor="#FFE000" stopOpacity="0.30" />
                </linearGradient>
                <linearGradient id="comOrange" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#FFA500" stopOpacity="0.55" />
                  <stop offset="100%" stopColor="#FF9000" stopOpacity="0.30" />
                </linearGradient>
              </defs>
              {/* Anillo grande arriba-izquierda (cortado por el top edge) */}
              <circle cx="80" cy="-20" r="110" fill="none" stroke="url(#comYellowLight)" strokeWidth="42" />
              {/* Anillo mediano naranja arriba-centro */}
              <circle cx="180" cy="40" r="75" fill="none" stroke="url(#comOrange)" strokeWidth="28" opacity="0.85" />
              {/* Anillo grande derecha (cortado por el right edge) */}
              <circle cx="370" cy="145" r="130" fill="none" stroke="url(#comYellowLight)" strokeWidth="55" />
              {/* Anillo interior derecha más brillante */}
              <circle cx="375" cy="150" r="85" fill="none" stroke="#FFEC40" strokeOpacity="0.60" strokeWidth="18" />
              {/* Anillo abajo-izquierda */}
              <circle cx="50" cy="230" r="90" fill="none" stroke="url(#comOrange)" strokeWidth="32" opacity="0.75" />
              {/* Ring sólido translúcido superpuesto central */}
              <circle cx="220" cy="180" r="55" fill="rgba(255,230,50,0.25)" />
              {/* Highlight amarillo brillante esquina sup-izq */}
              <ellipse cx="-20" cy="-20" rx="120" ry="100" fill="rgba(255,245,100,0.35)" />
            </svg>
            {icon}
          </>
        )
      }
      // Caso especial Servicio al Cliente: navy con bandas diagonales en X (no distorsiona — usa xMidYMid slice)
      if (card.id === 'servicio-clientes') {
        return (
          <>
            <svg
              viewBox="0 0 400 240"
              preserveAspectRatio="xMidYMid slice"
              style={{
                position: 'absolute', inset: 0,
                width: '100%', height: '100%',
                pointerEvents: 'none',
                transition: baseTransition,
                transform: isHovered ? 'scale(1.02)' : 'scale(1)',
              }}
            >
              <defs>
                <linearGradient id="svcBandMed" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#0A1F55" stopOpacity="0.95" />
                  <stop offset="100%" stopColor="#0E2A70" stopOpacity="0.85" />
                </linearGradient>
                <linearGradient id="svcBandBright" x1="0%" y1="0%" x2="100%" y2="0%">
                  <stop offset="0%" stopColor="#0A1F55" stopOpacity="0.30" />
                  <stop offset="50%" stopColor="#143D95" stopOpacity="0.95" />
                  <stop offset="100%" stopColor="#0A1F55" stopOpacity="0.30" />
                </linearGradient>
                <linearGradient id="svcBandDark" x1="0%" y1="0%" x2="0%" y2="100%">
                  <stop offset="0%" stopColor="#020819" stopOpacity="0.95" />
                  <stop offset="100%" stopColor="#030E28" stopOpacity="0.95" />
                </linearGradient>
              </defs>

              {/* Banda diagonal ↘ (top-left → bottom-right) */}
              <g transform="rotate(28 200 120)">
                <rect x="-150" y="80" width="700" height="55" fill="url(#svcBandMed)" />
                <rect x="-150" y="78" width="700" height="2" fill="rgba(30,70,160,0.50)" />
                <rect x="-150" y="135" width="700" height="2" fill="rgba(0,4,12,0.65)" />
              </g>

              {/* Banda diagonal ↗ (bottom-left → top-right) */}
              <g transform="rotate(-28 200 120)">
                <rect x="-150" y="80" width="700" height="55" fill="url(#svcBandMed)" opacity="0.90" />
                <rect x="-150" y="78" width="700" height="2" fill="rgba(30,70,160,0.50)" />
                <rect x="-150" y="135" width="700" height="2" fill="rgba(0,4,12,0.65)" />
              </g>

              {/* Plano oscuro inferior diagonal (triángulo bajo derecha) */}
              <polygon points="120,240 400,240 400,180 250,240" fill="url(#svcBandDark)" opacity="0.75" />
              {/* Plano oscuro superior diagonal (triángulo sup izquierda) */}
              <polygon points="0,0 0,70 180,0" fill="url(#svcBandDark)" opacity="0.70" />

              {/* Highlight diagonal brillante — cruce de la X */}
              <g transform="rotate(-28 200 120)">
                <rect x="120" y="95" width="180" height="25" fill="url(#svcBandBright)" opacity="0.70" />
              </g>
              <g transform="rotate(28 200 120)">
                <rect x="120" y="95" width="160" height="22" fill="url(#svcBandBright)" opacity="0.55" />
              </g>

              {/* Hairlines en los edges para efecto paper-fold crisp */}
              <g opacity="0.45">
                <line x1="0" y1="70" x2="180" y2="0" stroke="rgba(40,80,170,0.55)" strokeWidth="0.6" />
                <line x1="120" y1="240" x2="400" y2="180" stroke="rgba(40,80,170,0.45)" strokeWidth="0.6" />
              </g>
            </svg>
            {icon}
          </>
        )
      }
      // Caso especial Oportunidades: negro puro con rectangulos flotantes scattered (match ref)
      if (card.id === 'oportunidades') {
        return (
          <>
            <svg
              viewBox="0 0 400 240"
              preserveAspectRatio="xMidYMid slice"
              style={{
                position: 'absolute', inset: 0,
                width: '100%', height: '100%',
                pointerEvents: 'none',
                transition: baseTransition,
                transform: isHovered ? 'scale(1.02)' : 'scale(1)',
              }}
            >
              <defs>
                {/* Gradient sutil: highlight top-left → sombra bottom-right */}
                <linearGradient id="oppRect" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#2A2A2A" stopOpacity="1" />
                  <stop offset="50%" stopColor="#1A1A1A" stopOpacity="1" />
                  <stop offset="100%" stopColor="#080808" stopOpacity="1" />
                </linearGradient>
                <linearGradient id="oppRectAlt" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#242424" stopOpacity="1" />
                  <stop offset="60%" stopColor="#141414" stopOpacity="1" />
                  <stop offset="100%" stopColor="#050505" stopOpacity="1" />
                </linearGradient>
              </defs>

              {/* FILA SUPERIOR */}
              {/* Cuadrado pequeño centro-izquierda */}
              <rect x="110" y="0" width="55" height="60" fill="url(#oppRect)" />
              <line x1="110" y1="0" x2="110" y2="60" stroke="rgba(255,255,255,0.06)" strokeWidth="0.5" />

              {/* Rect medio centro */}
              <rect x="165" y="0" width="110" height="70" fill="url(#oppRectAlt)" />
              <line x1="165" y1="0" x2="165" y2="70" stroke="rgba(255,255,255,0.05)" strokeWidth="0.5" />

              {/* Rect grande derecha */}
              <rect x="305" y="0" width="110" height="70" fill="url(#oppRect)" />
              <line x1="305" y1="0" x2="305" y2="70" stroke="rgba(255,255,255,0.06)" strokeWidth="0.5" />

              {/* FILA MEDIA */}
              {/* Rect medio derecha */}
              <rect x="215" y="75" width="120" height="65" fill="url(#oppRectAlt)" />
              <line x1="215" y1="75" x2="215" y2="140" stroke="rgba(255,255,255,0.05)" strokeWidth="0.5" />
              <line x1="215" y1="75" x2="335" y2="75" stroke="rgba(255,255,255,0.04)" strokeWidth="0.5" />

              {/* FILA INFERIOR */}
              {/* Rect medio-bajo izquierda */}
              <rect x="45" y="155" width="125" height="50" fill="url(#oppRect)" />
              <line x1="45" y1="155" x2="45" y2="205" stroke="rgba(255,255,255,0.06)" strokeWidth="0.5" />
              <line x1="45" y1="155" x2="170" y2="155" stroke="rgba(255,255,255,0.04)" strokeWidth="0.5" />

              {/* Rect inferior izquierda muy ancho */}
              <rect x="0" y="205" width="165" height="40" fill="url(#oppRectAlt)" />
              <line x1="0" y1="205" x2="165" y2="205" stroke="rgba(255,255,255,0.04)" strokeWidth="0.5" />

              {/* Rect inferior centro */}
              <rect x="165" y="200" width="90" height="45" fill="url(#oppRect)" />
              <line x1="165" y1="200" x2="165" y2="245" stroke="rgba(255,255,255,0.06)" strokeWidth="0.5" />
              <line x1="165" y1="200" x2="255" y2="200" stroke="rgba(255,255,255,0.04)" strokeWidth="0.5" />

              {/* Cuadrado pequeño inferior-centro-der */}
              <rect x="255" y="205" width="55" height="40" fill="url(#oppRectAlt)" />
              <line x1="255" y1="205" x2="255" y2="245" stroke="rgba(255,255,255,0.05)" strokeWidth="0.5" />
            </svg>
            {icon}
          </>
        )
      }
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
    // Operaciones tiene fondo claro → texto oscuro. El resto texto blanco.
    const isLightBg = card.id === 'operaciones'
    const textColor = isLightBg ? '#0F172A' : '#FFFFFF'
    const mutedColor = isLightBg ? 'rgba(15,23,42,0.65)' : 'rgba(255,255,255,0.72)'
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
        background: `
          radial-gradient(ellipse 75% 65% at 50% 40%, transparent 55%, rgba(0,0,0,0.22) 100%),
          linear-gradient(180deg, transparent 55%, rgba(0,0,0,0.10) 82%, rgba(0,0,0,0.20) 100%),
          radial-gradient(ellipse 100% 80% at 50% 38%,
            #ECECEC 0%,
            #DEDEDE 20%,
            #C8C8C8 45%,
            #AEAEAE 70%,
            #959595 92%,
            #888888 100%
          )
        `,
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












