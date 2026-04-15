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
    { id: 'oportunidades', label: 'Oportunidades', route: '/ventas/mis-leads', bgColor: '#02103A', gradient: 'linear-gradient(135deg, #031858 0%, #021244 50%, #010826 100%)', decorType: 'silk', decorColor: 'rgba(255,255,255,0.08)', iconFile: 'oportunidades.svg', iconOpacity: 0.18, kpiValue: kpis.leadsActivos, kpiLabel: 'leads', statusDot: 'green', statusText: 'Pipeline activo', gridColumn: '1 / 2', gridRow: '1 / 2' },
    { id: 'servicio-clientes', label: 'Servicio al Cliente', route: '/servicio/dashboard', bgColor: '#020718', gradient: 'linear-gradient(135deg, #030A22 0%, #010614 50%, #000308 100%)', decorType: 'silk', decorColor: 'rgba(255,255,255,0.10)', iconFile: 'servicio-al-cliente.svg', iconOpacity: 0.14, kpiValue: kpis.clientes.toLocaleString(), kpiLabel: 'clientes', statusDot: 'green', statusText: '3 submódulos', gridColumn: '2 / 4', gridRow: '1 / 2' },
    { id: 'comercial', label: 'Comercial', route: '/ventas/dashboard', bgColor: '#FFB810', gradient: 'linear-gradient(135deg, #FFC820 0%, #FFA808 55%, #FF7A00 100%)', decorType: 'silk', decorColor: 'rgba(255,180,0,0.20)', iconFile: 'comercial.svg', iconOpacity: 0.18, kpiValue: kpis.formatosActivos.toLocaleString(), kpiLabel: 'formatos', statusDot: 'green', statusText: '11 submódulos', gridColumn: '4 / 5', gridRow: '1 / 3' },
    { id: 'operaciones', label: 'Operaciones', route: '/operaciones/dashboard', bgColor: '#0B3AB5', gradient: 'linear-gradient(135deg, #0930A0 0%, #0B3AB5 50%, #0F4AD0 100%)', decorType: 'silk', decorColor: 'rgba(255,255,255,0.10)', iconFile: 'camion-contenedor-v2.svg', iconOpacity: 0.16, kpiValue: kpis.viajesActivos, kpiLabel: 'viajes', statusDot: kpis.viajesActivos > 0 ? 'green' : 'gray', statusText: kpis.viajesActivos > 0 ? 'Operando' : 'Sin viajes', gridColumn: '1 / 2', gridRow: '2 / 3' },
    { id: 'ventas', label: 'Ventas', route: '/ventas/analytics', bgColor: '#1868E8', gradient: 'linear-gradient(135deg, #0F56E0 0%, #1868E8 50%, #2A7AF2 100%)', decorType: 'silk', decorColor: 'rgba(255,255,255,0.22)', iconFile: 'ingresos.svg', iconOpacity: 0.13, kpiValue: kpis.formatosActivos.toLocaleString(), kpiLabel: 'formatos', statusDot: 'green', statusText: 'Pipeline activo', gridColumn: '2 / 3', gridRow: '2 / 3' },
    { id: 'comunicaciones', label: 'Comunicaciones', route: '/comunicaciones/dashboard', bgColor: '#061670', gradient: 'linear-gradient(135deg, #0A1E88 0%, #061670 50%, #020A40 100%)', decorType: 'gear', decorColor: 'rgba(255,255,255,0.08)', iconFile: 'comunicaciones.svg', iconOpacity: 0.18, kpiValue: '5', kpiLabel: 'canales', statusDot: 'green', statusText: 'Activo', gridColumn: '3 / 4', gridRow: '2 / 4' },
    { id: 'autofomento', label: 'Control de equipo', route: '/', bgColor: '#15C814', gradient: 'linear-gradient(90deg, #8AE60E 0%, #15D818 40%, #0AC020 75%, #07A038 100%)', decorType: 'silk', decorColor: 'rgba(255,255,255,0.12)', iconFile: 'gps.svg', iconOpacity: 0.16, kpiValue: '', kpiLabel: '', statusDot: 'gray', statusText: 'Próximamente', gridColumn: '1 / 3', gridRow: '3 / 4' },
    { id: 'config', label: 'Configuración', route: '/admin/configuracion', bgColor: '#0A0A0A', gradient: 'linear-gradient(135deg, #141414 0%, #0A0A0A 50%, #050505 100%)', decorType: 'gear', decorColor: 'rgba(255,255,255,0.08)', iconFile: 'configuracion.svg', iconOpacity: 0.22, kpiValue: '', kpiLabel: 'admin', statusDot: 'gray', statusText: 'Sistema', gridColumn: '4 / 5', gridRow: '3 / 4' },
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

    // Icon universal — watermark discreto, tamaño uniforme
    // Config mantiene su tratamiento original (72px, emboss, iconOpacity original)
    // Los otros 7 cards: agrandados 15% (72→83px), 90% opacity (10% transparencia)
    const isSolidWhiteIcon = ['oportunidades', 'servicio-clientes', 'ventas', 'comunicaciones', 'comercial'].includes(card.id)
    const isConfig = card.id === 'config'
    const iconSize = isConfig ? 72 : 83 // 72 * 1.15 = 82.8 ≈ 83
    const iconOpacityFinal = isConfig ? card.iconOpacity : 0.765 // 0.9 - 15% adicional
    const icon = card.iconFile && card.iconOpacity > 0 ? (
      <div
        style={{
          position: 'absolute',
          right: '18px', bottom: '15px',
          width: `${iconSize}px`,
          height: `${iconSize}px`,
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
            opacity: iconOpacityFinal,
            // Solid white: brillo pleno sin emboss; otros: emboss sutil
            filter: isSolidWhiteIcon
              ? 'brightness(0) invert(1)'
              : `
                brightness(0) invert(1)
                drop-shadow(0 1px 0 rgba(255,255,255,0.15))
                drop-shadow(0 3px 8px rgba(0,0,0,0.45))
                drop-shadow(0 1px 2px rgba(0,0,0,0.30))
              `,
          }}
        />
      </div>
    ) : null

    // Caso especial Configuración: rectángulos oscuros superpuestos — layers geométricos minimales
    if (card.id === 'config') {
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
              {/* Gradientes grises oscuros (tonos muy sutiles sobre negro) */}
              <linearGradient id="cfgLayerA" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#222222" />
                <stop offset="100%" stopColor="#0C0C0C" />
              </linearGradient>
              <linearGradient id="cfgLayerB" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#1C1C1C" />
                <stop offset="100%" stopColor="#080808" />
              </linearGradient>
              <linearGradient id="cfgLayerC" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#1A1A1A" />
                <stop offset="100%" stopColor="#060606" />
              </linearGradient>
              <linearGradient id="cfgLayerD" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#262626" />
                <stop offset="100%" stopColor="#101010" />
              </linearGradient>
              {/* Glow sutil centro */}
              <radialGradient id="cfgGlow" cx="50%" cy="50%" r="60%">
                <stop offset="0%" stopColor="#2A2A2A" stopOpacity="0.40" />
                <stop offset="100%" stopColor="#0A0A0A" stopOpacity="0" />
              </radialGradient>
            </defs>

            {/* Glow central sutil */}
            <rect width="400" height="240" fill="url(#cfgGlow)" />

            {/* Rectángulos superpuestos — inclinados ligeramente */}
            {/* Capa base grande izquierda, inclinada */}
            <g transform="rotate(-10 100 120)">
              <rect x="-60" y="-40" width="260" height="200" fill="url(#cfgLayerA)" />
              <rect x="-60" y="-40" width="260" height="200" fill="none" stroke="#2E2E2E" strokeWidth="0.5" opacity="0.6" />
            </g>

            {/* Rectángulo derecho grande inclinado al otro lado */}
            <g transform="rotate(12 320 130)">
              <rect x="210" y="-30" width="240" height="220" fill="url(#cfgLayerB)" />
              <rect x="210" y="-30" width="240" height="220" fill="none" stroke="#262626" strokeWidth="0.5" opacity="0.5" />
            </g>

            {/* Rectángulo central delgado vertical inclinado */}
            <g transform="rotate(-14 200 120)">
              <rect x="145" y="-50" width="80" height="340" fill="url(#cfgLayerC)" />
            </g>

            {/* Rectángulo superior horizontal inclinado */}
            <g transform="rotate(8 200 50)">
              <rect x="60" y="-30" width="320" height="80" fill="url(#cfgLayerD)" opacity="0.75" />
            </g>

            {/* Rectángulo inferior horizontal inclinado */}
            <g transform="rotate(-6 200 190)">
              <rect x="40" y="170" width="340" height="100" fill="url(#cfgLayerA)" opacity="0.70" />
            </g>

            {/* Hairline highlight sutil en un borde para dar dimensión */}
            <g transform="rotate(-10 100 120)">
              <line x1="-60" y1="-40" x2="200" y2="-40" stroke="#3A3A3A" strokeWidth="0.5" opacity="0.5" />
            </g>
            <g transform="rotate(12 320 130)">
              <line x1="210" y1="-30" x2="450" y2="-30" stroke="#323232" strokeWidth="0.5" opacity="0.45" />
            </g>
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
              {/* Base gradient — lime amarillo (izq) → verde profundo (der) */}
              <linearGradient id="ceBase" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="#B8F20A" />
                <stop offset="45%" stopColor="#5EE412" />
                <stop offset="100%" stopColor="#0CB028" />
              </linearGradient>
              {/* Curva superior clara */}
              <linearGradient id="ceCurveTop" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="#CFFB3A" stopOpacity="0.85" />
                <stop offset="100%" stopColor="#6EE816" stopOpacity="0.70" />
              </linearGradient>
              {/* Curva media — verde vibrante */}
              <linearGradient id="ceCurveMid" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="#8EEA10" stopOpacity="0.75" />
                <stop offset="100%" stopColor="#18CE20" stopOpacity="0.85" />
              </linearGradient>
              {/* Curva inferior — verde más oscuro */}
              <linearGradient id="ceCurveDeep" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="#18B820" stopOpacity="0" />
                <stop offset="70%" stopColor="#0AA028" stopOpacity="0.70" />
                <stop offset="100%" stopColor="#047C30" stopOpacity="0.95" />
              </linearGradient>
            </defs>
            {/* Fondo base */}
            <rect width="400" height="240" fill="url(#ceBase)" />
            {/* Curva superior suave — sweep desde bottom-left hasta top-right */}
            <path d="M 0,240 C 150,200 280,100 400,10 L 400,0 L 0,0 Z" fill="url(#ceCurveTop)" opacity="0.55" />
            {/* Curva media — desde bottom-left hasta mid-right */}
            <path d="M 0,240 C 180,220 290,140 400,60 L 400,0 L 0,0 Z" fill="url(#ceCurveMid)" opacity="0.45" />
            {/* Curva profunda — acento oscuro superior-derecho */}
            <path d="M 150,240 C 260,190 340,100 400,0 L 400,240 Z" fill="url(#ceCurveDeep)" />
            {/* Highlight sutil top */}
            <path d="M 0,0 L 400,0 L 400,40 C 280,55 150,75 0,100 Z" fill="#FFFFFF" opacity="0.10" />
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
              {/* Chevron grande — body con gradient cyan→azul medio y highlight inner edge */}
              <linearGradient id="ventChevron1" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="#20D4FF" stopOpacity="0.95" />
                <stop offset="35%" stopColor="#1888F8" stopOpacity="0.90" />
                <stop offset="100%" stopColor="#0E5CE0" stopOpacity="0.80" />
              </linearGradient>
              {/* Chevron medio */}
              <linearGradient id="ventChevron2" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="#38C8FF" stopOpacity="0.80" />
                <stop offset="50%" stopColor="#1E7AF5" stopOpacity="0.75" />
                <stop offset="100%" stopColor="#1060E5" stopOpacity="0.65" />
              </linearGradient>
              {/* Chevron outer */}
              <linearGradient id="ventChevron3" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="#50D8FF" stopOpacity="0.65" />
                <stop offset="100%" stopColor="#2E88F8" stopOpacity="0.55" />
              </linearGradient>
              {/* Chevron most outer (más tenue) */}
              <linearGradient id="ventChevron4" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="#70E0FF" stopOpacity="0.45" />
                <stop offset="100%" stopColor="#3E92FA" stopOpacity="0.40" />
              </linearGradient>
              {/* Highlight radial sutil centro-izquierda */}
              <radialGradient id="ventGlow" cx="35%" cy="50%" r="50%">
                <stop offset="0%" stopColor="#2F8CF8" stopOpacity="0.20" />
                <stop offset="100%" stopColor="#1060E0" stopOpacity="0" />
              </radialGradient>
            </defs>

            {/* Glow suave lado izquierdo */}
            <rect width="400" height="240" fill="url(#ventGlow)" />

            {/* Chevron 1 (más grande / más a la izquierda del grupo) — tip x=300 */}
            <polygon
              points="300,120 195,0 255,0 360,120 255,240 195,240"
              fill="url(#ventChevron1)"
            />

            {/* Chevron 2 — tip x=345 */}
            <polygon
              points="345,120 250,0 295,0 390,120 295,240 250,240"
              fill="url(#ventChevron2)"
            />

            {/* Chevron 3 — tip x=385 */}
            <polygon
              points="385,120 300,0 340,0 425,120 340,240 300,240"
              fill="url(#ventChevron3)"
            />

            {/* Chevron 4 (más outer / más tenue) — tip x=420 */}
            <polygon
              points="420,120 345,0 380,0 455,120 380,240 345,240"
              fill="url(#ventChevron4)"
            />

            {/* Hairline highlight cyan en inner edge del chevron 1 */}
            <polyline
              points="195,0 300,120 195,240"
              fill="none"
              stroke="rgba(100,230,255,0.55)"
              strokeWidth="1.2"
            />
          </svg>
          {icon}
        </>
      )
    }
    // Caso especial Comunicaciones: royal blue con bars diagonales scattered + hairlines
    if (card.id === 'comunicaciones') {
      return (
        <>
          <svg
            viewBox="0 0 400 500"
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
              {/* Base royal blue — zona bottom más saturada */}
              <linearGradient id="comuBase2" x1="0%" y1="0%" x2="0%" y2="100%">
                <stop offset="0%" stopColor="#0A1E88" />
                <stop offset="45%" stopColor="#061670" />
                <stop offset="100%" stopColor="#020A40" />
              </linearGradient>
              {/* Bar oscuro casi negro */}
              <linearGradient id="comuBarDark" x1="0%" y1="0%" x2="0%" y2="100%">
                <stop offset="0%" stopColor="#02042E" stopOpacity="0" />
                <stop offset="50%" stopColor="#010218" stopOpacity="0.95" />
                <stop offset="100%" stopColor="#010218" stopOpacity="0" />
              </linearGradient>
              {/* Bar medio-oscuro */}
              <linearGradient id="comuBarMid" x1="0%" y1="0%" x2="0%" y2="100%">
                <stop offset="0%" stopColor="#0E2A98" stopOpacity="0" />
                <stop offset="50%" stopColor="#0A2088" stopOpacity="0.95" />
                <stop offset="100%" stopColor="#0A2088" stopOpacity="0" />
              </linearGradient>
              {/* Bar claro (medium blue brillante) */}
              <linearGradient id="comuBarLight" x1="0%" y1="0%" x2="0%" y2="100%">
                <stop offset="0%" stopColor="#1A40D0" stopOpacity="0" />
                <stop offset="50%" stopColor="#1E48DC" stopOpacity="1" />
                <stop offset="100%" stopColor="#1A40D0" stopOpacity="0" />
              </linearGradient>
              {/* Rectángulos translúcidos top-right (ventanas claras) */}
              <linearGradient id="comuWindow" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#4A88F8" stopOpacity="0.30" />
                <stop offset="100%" stopColor="#2A68E8" stopOpacity="0.12" />
              </linearGradient>
              {/* Glow top-right (zona más brillante) */}
              <radialGradient id="comuTRGlow" cx="85%" cy="10%" r="70%">
                <stop offset="0%" stopColor="#3068E8" stopOpacity="0.55" />
                <stop offset="100%" stopColor="#061670" stopOpacity="0" />
              </radialGradient>
              {/* Glow bottom-left medio azul */}
              <radialGradient id="comuBLGlow" cx="5%" cy="90%" r="55%">
                <stop offset="0%" stopColor="#1040C8" stopOpacity="0.40" />
                <stop offset="100%" stopColor="#061670" stopOpacity="0" />
              </radialGradient>
              {/* Dark corner bottom-right */}
              <radialGradient id="comuBRDark" cx="95%" cy="95%" r="55%">
                <stop offset="0%" stopColor="#01040F" stopOpacity="0.65" />
                <stop offset="100%" stopColor="#061670" stopOpacity="0" />
              </radialGradient>
            </defs>

            {/* Base */}
            <rect width="400" height="500" fill="url(#comuBase2)" />

            {/* Glow top-right */}
            <rect width="400" height="500" fill="url(#comuTRGlow)" />

            {/* Glow bottom-left */}
            <rect width="400" height="500" fill="url(#comuBLGlow)" />

            {/* Dark corner bottom-right */}
            <rect width="400" height="500" fill="url(#comuBRDark)" />

            {/* ===== Ventanas translúcidas top-right (overlapping parallelograms) ===== */}
            <g transform="rotate(-45 320 60)">
              <rect x="220" y="-20" width="200" height="110" fill="url(#comuWindow)" />
              <rect x="200" y="100" width="220" height="120" fill="url(#comuWindow)" opacity="0.75" />
              <rect x="280" y="220" width="180" height="100" fill="url(#comuWindow)" opacity="0.55" />
            </g>

            {/* ===== Bars diagonales scattered — rotate -45° ===== */}
            {/* Bar 1 — oscuro casi negro, top-left */}
            <g transform="rotate(-45 95 140)">
              <rect x="45" y="20" width="12" height="260" fill="url(#comuBarDark)" />
            </g>

            {/* Bar 2 — medio, centro superior */}
            <g transform="rotate(-45 230 220)">
              <rect x="180" y="90" width="14" height="300" fill="url(#comuBarMid)" />
            </g>

            {/* Bar 3 — medium blue brillante, centro (el más visible) */}
            <g transform="rotate(-45 245 315)">
              <rect x="195" y="170" width="18" height="300" fill="url(#comuBarLight)" />
            </g>

            {/* Bar 4 — medium blue más claro bottom-center */}
            <g transform="rotate(-45 170 430)">
              <rect x="125" y="320" width="16" height="240" fill="url(#comuBarLight)" opacity="0.85" />
            </g>

            {/* Bar 5 — medio bottom-left */}
            <g transform="rotate(-45 45 410)">
              <rect x="5" y="310" width="14" height="220" fill="url(#comuBarMid)" opacity="0.80" />
            </g>

            {/* ===== Hairlines diagonales (líneas finas muy sutiles) ===== */}
            <line x1="60" y1="720" x2="250" y2="510" stroke="#6A9CF8" strokeWidth="0.8" opacity="0.35" />
            <line x1="290" y1="700" x2="450" y2="540" stroke="#6A9CF8" strokeWidth="0.9" opacity="0.40" />
            <line x1="-20" y1="540" x2="200" y2="300" stroke="#5088F0" strokeWidth="0.6" opacity="0.22" />
            <line x1="250" y1="200" x2="400" y2="40" stroke="#5088F0" strokeWidth="0.5" opacity="0.20" />
          </svg>
          {icon}
        </>
      )
    }
    if (card.decorType === 'silk') {
      // Caso especial Operaciones: royal blue con bandas diagonales sutiles lado izq y der
      if (card.id === 'operaciones') {
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
                {/* Banda clara sutil */}
                <linearGradient id="opBandLight" x1="0%" y1="0%" x2="100%" y2="0%">
                  <stop offset="0%" stopColor="#1A58E0" stopOpacity="0.35" />
                  <stop offset="100%" stopColor="#1A58E0" stopOpacity="0.10" />
                </linearGradient>
                {/* Banda oscura sutil */}
                <linearGradient id="opBandDark" x1="0%" y1="0%" x2="100%" y2="0%">
                  <stop offset="0%" stopColor="#041E7A" stopOpacity="0.45" />
                  <stop offset="100%" stopColor="#041E7A" stopOpacity="0.15" />
                </linearGradient>
                {/* Glow radial bottom-right */}
                <radialGradient id="opGlow" cx="75%" cy="70%" r="55%">
                  <stop offset="0%" stopColor="#1E60E8" stopOpacity="0.30" />
                  <stop offset="100%" stopColor="#0B3AB5" stopOpacity="0" />
                </radialGradient>
              </defs>

              {/* Glow suave bottom-right */}
              <rect width="400" height="240" fill="url(#opGlow)" />

              {/* Bandas diagonales sutiles ↘ lado izquierdo */}
              <g transform="rotate(28 200 120)">
                <rect x="-220" y="-180" width="120" height="900" fill="url(#opBandDark)" />
                <rect x="-100" y="-180" width="12" height="900" fill="rgba(80,140,240,0.25)" />
                <rect x="-350" y="-180" width="80" height="900" fill="url(#opBandLight)" opacity="0.65" />
              </g>

              {/* Bandas diagonales sutiles ↘ lado derecho */}
              <g transform="rotate(28 200 120)">
                <rect x="340" y="-180" width="90" height="900" fill="url(#opBandDark)" opacity="0.70" />
                <rect x="340" y="-180" width="8" height="900" fill="rgba(80,140,240,0.30)" />
                <rect x="440" y="-180" width="60" height="900" fill="url(#opBandLight)" opacity="0.55" />
                <rect x="510" y="-180" width="40" height="900" fill="url(#opBandDark)" opacity="0.50" />
              </g>
            </svg>
          </>
        )
      }
      // Caso especial Comercial: amarillo-naranja painterly con textura canvas + shapes angulares translúcidos
      if (card.id === 'comercial') {
        return (
          <>
            <svg
              viewBox="0 0 400 500"
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
                {/* Base gradient amarillo → naranja (top-right más naranja) */}
                <linearGradient id="comCanvasBase" x1="0%" y1="100%" x2="100%" y2="0%">
                  <stop offset="0%" stopColor="#FFC828" />
                  <stop offset="50%" stopColor="#FFB008" />
                  <stop offset="100%" stopColor="#FF6E00" />
                </linearGradient>
                {/* Shape naranja translúcido */}
                <linearGradient id="comShapeOrange" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#FF7A00" stopOpacity="0.55" />
                  <stop offset="100%" stopColor="#FF9000" stopOpacity="0.20" />
                </linearGradient>
                {/* Shape amarillo claro translúcido */}
                <linearGradient id="comShapeLight" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#FFE860" stopOpacity="0.40" />
                  <stop offset="100%" stopColor="#FFD020" stopOpacity="0.15" />
                </linearGradient>
                {/* Textura canvas (tejido) — cruz fina */}
                <pattern id="comCanvas" x="0" y="0" width="6" height="6" patternUnits="userSpaceOnUse">
                  <rect x="0" y="0" width="6" height="6" fill="none" />
                  <line x1="0" y1="0" x2="6" y2="0" stroke="#B06800" strokeWidth="0.4" opacity="0.30" />
                  <line x1="0" y1="3" x2="6" y2="3" stroke="#FFDE40" strokeWidth="0.3" opacity="0.25" />
                  <line x1="0" y1="0" x2="0" y2="6" stroke="#B06800" strokeWidth="0.4" opacity="0.30" />
                  <line x1="3" y1="0" x2="3" y2="6" stroke="#FFDE40" strokeWidth="0.3" opacity="0.25" />
                </pattern>
                {/* Textura pinceladas suaves */}
                <pattern id="comBrush" x="0" y="0" width="120" height="40" patternUnits="userSpaceOnUse">
                  <path d="M 0 20 Q 30 10 60 20 T 120 20" stroke="#FFDC40" strokeWidth="0.8" fill="none" opacity="0.25" />
                  <path d="M 0 30 Q 40 22 80 30 T 160 30" stroke="#D08000" strokeWidth="0.6" fill="none" opacity="0.20" />
                </pattern>
                {/* Glow radial warm naranja top-right */}
                <radialGradient id="comWarmGlow" cx="80%" cy="10%" r="65%">
                  <stop offset="0%" stopColor="#FF7A00" stopOpacity="0.55" />
                  <stop offset="100%" stopColor="#FFB000" stopOpacity="0" />
                </radialGradient>
                {/* Highlight amarillo bajo-izquierda */}
                <radialGradient id="comBrightGlow" cx="20%" cy="70%" r="60%">
                  <stop offset="0%" stopColor="#FFE85A" stopOpacity="0.45" />
                  <stop offset="100%" stopColor="#FFB000" stopOpacity="0" />
                </radialGradient>
              </defs>

              {/* Base */}
              <rect width="400" height="500" fill="url(#comCanvasBase)" />

              {/* Warm glow top-right (acento naranja) */}
              <rect width="400" height="500" fill="url(#comWarmGlow)" />

              {/* Bright glow bottom-left (resplandor amarillo) */}
              <rect width="400" height="500" fill="url(#comBrightGlow)" />

              {/* ===== Shapes angulares translúcidos superpuestos ===== */}
              {/* Shape grande naranja top-right — forma de ala/triángulo */}
              <polygon points="260,0 400,0 400,180 320,220 240,80" fill="url(#comShapeOrange)" />
              {/* Shape secundario naranja */}
              <polygon points="310,0 400,0 400,120 340,140" fill="url(#comShapeOrange)" opacity="0.60" />

              {/* Shape amarillo claro diagonal centro */}
              <polygon points="80,180 260,80 340,220 140,320" fill="url(#comShapeLight)" />

              {/* Shape diagonal bottom con brush */}
              <polygon points="0,280 200,200 280,360 80,460" fill="url(#comShapeLight)" opacity="0.70" />

              {/* Shape triangular bottom-right naranja */}
              <polygon points="220,340 400,260 400,500 280,500" fill="url(#comShapeOrange)" opacity="0.55" />

              {/* Shape delgado vertical naranja centro-derecha */}
              <polygon points="290,140 350,100 390,350 330,390" fill="url(#comShapeOrange)" opacity="0.45" />

              {/* ===== Pinceladas/brush strokes ===== */}
              <rect width="400" height="500" fill="url(#comBrush)" opacity="0.55" />

              {/* Líneas diagonales pinceladas largas (marca de pincel) */}
              <g opacity="0.35">
                <path d="M -20 180 Q 180 120 420 40" stroke="#FFDE60" strokeWidth="2" fill="none" />
                <path d="M -20 220 Q 200 150 420 100" stroke="#B87000" strokeWidth="1.2" fill="none" />
                <path d="M -20 300 Q 180 240 420 180" stroke="#FFDE60" strokeWidth="1.5" fill="none" />
                <path d="M -20 350 Q 200 280 420 220" stroke="#A86000" strokeWidth="1" fill="none" />
                <path d="M -20 420 Q 180 340 420 280" stroke="#FFD040" strokeWidth="1.8" fill="none" />
              </g>

              {/* Textura canvas encima de todo (tejido) */}
              <rect width="400" height="500" fill="url(#comCanvas)" opacity="0.75" />

              {/* Highlight sutil top-left (painted paper edge) */}
              <path d="M 0 0 L 120 0 Q 80 60 40 100 L 0 140 Z" fill="#FFE860" opacity="0.20" />
              {/* Sombra sutil bottom-right edge */}
              <path d="M 400 350 L 400 500 L 260 500 Q 320 440 360 400 Z" fill="#B84000" opacity="0.18" />
            </svg>
            {icon}
          </>
        )
      }
      // Caso especial Servicio al Cliente: navy-black minimalista con bandas diagonales sutiles ↘
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
                {/* Banda navy sutil (tono más claro) */}
                <linearGradient id="svcPlaneLight" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#0A1E4A" stopOpacity="0.85" />
                  <stop offset="100%" stopColor="#051238" stopOpacity="0.60" />
                </linearGradient>
                {/* Banda muy oscura (casi negro con tinte azul) */}
                <linearGradient id="svcPlaneDark" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#010510" stopOpacity="0.95" />
                  <stop offset="100%" stopColor="#000208" stopOpacity="0.90" />
                </linearGradient>
                {/* Banda intermedia */}
                <linearGradient id="svcPlaneMid" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#061430" stopOpacity="0.75" />
                  <stop offset="100%" stopColor="#030A20" stopOpacity="0.50" />
                </linearGradient>
                {/* Hairline edge (borde casi imperceptible entre bandas) */}
                <linearGradient id="svcEdgeHint" x1="0%" y1="0%" x2="100%" y2="0%">
                  <stop offset="0%" stopColor="#0C2258" stopOpacity="0.55" />
                  <stop offset="100%" stopColor="#0C2258" stopOpacity="0" />
                </linearGradient>
              </defs>

              {/* Banda 1 — más clara, diagonal top-left a bottom-left (cross) */}
              <polygon points="-40,-20 240,-20 60,260 -40,260" fill="url(#svcPlaneLight)" />

              {/* Banda 2 — oscura, diagonal que cruza la clara */}
              <polygon points="120,-20 320,-20 220,260 20,260" fill="url(#svcPlaneDark)" />

              {/* Banda 3 — intermedia top-right */}
              <polygon points="260,-20 440,-20 440,140 200,260" fill="url(#svcPlaneMid)" />

              {/* Banda 4 — sutil right edge */}
              <polygon points="360,-20 440,-20 440,260 300,260" fill="url(#svcPlaneLight)" opacity="0.50" />

              {/* Hairline edges finos reforzando bordes */}
              <line x1="240" y1="-20" x2="60" y2="260" stroke="#0C2560" strokeWidth="0.6" opacity="0.55" />
              <line x1="320" y1="-20" x2="220" y2="260" stroke="#0A1E4A" strokeWidth="0.5" opacity="0.45" />
              <line x1="360" y1="-20" x2="300" y2="260" stroke="#0A1E4A" strokeWidth="0.4" opacity="0.35" />

              {/* Glow radial sutil top-center (apenas perceptible) */}
              <radialGradient id="svcSubtleGlow" cx="50%" cy="20%" r="55%">
                <stop offset="0%" stopColor="#0A1E50" stopOpacity="0.35" />
                <stop offset="100%" stopColor="#020718" stopOpacity="0" />
              </radialGradient>
              <rect width="400" height="240" fill="url(#svcSubtleGlow)" />
            </svg>
            {icon}
          </>
        )
      }
      // Caso especial Oportunidades: navy profundo con streaks diagonales sutiles top-right + dots bottom-right
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
                {/* Base navy gradient — top-right ligeramente más claro */}
                <linearGradient id="oppBase" x1="100%" y1="0%" x2="0%" y2="100%">
                  <stop offset="0%" stopColor="#0A3088" />
                  <stop offset="40%" stopColor="#051E60" />
                  <stop offset="100%" stopColor="#010828" />
                </linearGradient>
                {/* Streak azul sutil */}
                <linearGradient id="oppStreak" x1="0%" y1="0%" x2="0%" y2="100%">
                  <stop offset="0%" stopColor="#2060D8" stopOpacity="0" />
                  <stop offset="50%" stopColor="#2060D8" stopOpacity="0.55" />
                  <stop offset="100%" stopColor="#1A50C8" stopOpacity="0" />
                </linearGradient>
                {/* Streak más tenue */}
                <linearGradient id="oppStreakDim" x1="0%" y1="0%" x2="0%" y2="100%">
                  <stop offset="0%" stopColor="#1A4AB8" stopOpacity="0" />
                  <stop offset="50%" stopColor="#1A4AB8" stopOpacity="0.35" />
                  <stop offset="100%" stopColor="#123890" stopOpacity="0" />
                </linearGradient>
                {/* Glow radial top-right */}
                <radialGradient id="oppGlow" cx="85%" cy="15%" r="55%">
                  <stop offset="0%" stopColor="#1A50C8" stopOpacity="0.45" />
                  <stop offset="100%" stopColor="#031858" stopOpacity="0" />
                </radialGradient>
                {/* Patrón de puntos halftone */}
                <pattern id="oppDots" x="0" y="0" width="8" height="8" patternUnits="userSpaceOnUse">
                  <circle cx="4" cy="4" r="1" fill="#3080E8" opacity="0.60" />
                </pattern>
              </defs>

              {/* Base */}
              <rect width="400" height="240" fill="url(#oppBase)" />

              {/* Glow top-right */}
              <rect width="400" height="240" fill="url(#oppGlow)" />

              {/* Streaks diagonales sutiles — rotate -45° concentrados top-right */}
              <g transform="rotate(-45 280 60)">
                <rect x="150" y="-50" width="2.5" height="220" fill="url(#oppStreak)" />
                <rect x="170" y="-50" width="1.5" height="200" fill="url(#oppStreakDim)" />
                <rect x="195" y="-50" width="3" height="220" fill="url(#oppStreak)" opacity="0.85" />
                <rect x="215" y="-50" width="1.5" height="180" fill="url(#oppStreakDim)" />
                <rect x="235" y="-50" width="2" height="210" fill="url(#oppStreak)" opacity="0.70" />
                <rect x="255" y="-50" width="1.2" height="180" fill="url(#oppStreakDim)" opacity="0.65" />
                <rect x="275" y="-50" width="2.5" height="200" fill="url(#oppStreak)" opacity="0.80" />
                <rect x="300" y="-50" width="1.5" height="180" fill="url(#oppStreakDim)" />
                <rect x="320" y="-50" width="2" height="190" fill="url(#oppStreak)" opacity="0.60" />
              </g>

              {/* Dots halftone bottom-right — con fade via masking */}
              <mask id="oppDotsMask">
                <radialGradient id="oppDotsFade" cx="85%" cy="85%" r="50%">
                  <stop offset="0%" stopColor="#FFFFFF" stopOpacity="1" />
                  <stop offset="100%" stopColor="#FFFFFF" stopOpacity="0" />
                </radialGradient>
                <rect width="400" height="240" fill="url(#oppDotsFade)" />
              </mask>
              <rect x="260" y="130" width="140" height="110" fill="url(#oppDots)" mask="url(#oppDotsMask)" />
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
    // Todos los cards con fondos oscuros → texto blanco.
    const isLightBg = false
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












