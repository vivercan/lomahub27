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
  iconFile: string
  kpiValue: number | string
  kpiLabel: string
  statusDot: 'green' | 'yellow' | 'red' | 'gray'
  statusText: string
  iconOpacity: number
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
    { id: 'oportunidades', label: 'Oportunidades', route: '/ventas/mis-leads', bgColor: '#25559B', gradient: 'linear-gradient(138deg, #25559B 0%, #25559B 24%, #183A69 100%)', iconFile: 'oportunidades.svg', iconOpacity: 0.24, kpiValue: kpis.leadsActivos, kpiLabel: 'leads', statusDot: 'green', statusText: 'Pipeline activo' },
    { id: 'comercial', label: 'Comercial', route: '/ventas/dashboard', bgColor: '#3D6496', gradient: 'linear-gradient(145deg, #3D6496 0%, #3D6496 24%, #173A62 100%)', iconFile: 'comercial.svg', iconOpacity: 0.24, kpiValue: kpis.formatosActivos.toLocaleString(), kpiLabel: 'formatos', statusDot: 'green', statusText: '11 submódulos' },
    { id: 'servicio-clientes', label: 'Servicio al Cliente', route: '/servicio/dashboard', bgColor: '#1A3C67', gradient: 'linear-gradient(142deg, #1A3C67 0%, #1A3C67 24%, #09121E 100%)', iconFile: 'servicio-al-cliente.svg', iconOpacity: 0.24, kpiValue: kpis.clientes.toLocaleString(), kpiLabel: 'clientes', statusDot: 'green', statusText: '3 submódulos' },
    { id: 'despacho', label: 'Despacho IA', route: '/operaciones/torre-control', bgColor: '#487FD0', gradient: 'linear-gradient(136deg, #487FD0 0%, #487FD0 24%, #265492 100%)', iconFile: 'Despacho inteligente.svg', iconOpacity: 0.24, kpiValue: kpis.viajesActivos, kpiLabel: 'viajes', statusDot: kpis.viajesActivos > 0 ? 'green' : 'gray', statusText: kpis.viajesActivos > 0 ? 'Operando' : 'Sin viajes' },
    { id: 'ventas', label: 'Ventas', route: '/ventas/mis-leads', bgColor: '#356FBB', gradient: 'linear-gradient(140deg, #356FBB 0%, #356FBB 24%, #1F4C86 100%)', iconFile: 'Ventas.svg', iconOpacity: 0.24, kpiValue: kpis.formatosActivos.toLocaleString(), kpiLabel: 'formatos', statusDot: 'green', statusText: 'Pipeline activo' },
    { id: 'cotizaciones', label: 'Cotizaciones', route: '/cotizador/nueva', bgColor: '#2D5B8A', gradient: 'linear-gradient(152deg, #2D5B8A 0%, #2D5B8A 24%, #162D4F 100%)', iconFile: 'cotizacionea.svg', iconOpacity: 0.24, kpiValue: '\u2014', kpiLabel: 'pendientes', statusDot: 'gray', statusText: 'Disponible' },
    { id: 'plantillas', label: 'Plantillas', route: '/documentos', bgColor: '#3E4A6D', gradient: 'linear-gradient(155deg, #3E4A6D 0%, #3E4A6D 24%, #1E2540 100%)', iconFile: 'plantillas.svg', iconOpacity: 0.24, kpiValue: '\u2014', kpiLabel: 'plantillas', statusDot: 'gray', statusText: 'Disponible' },
  ]

  const row2Cards: CardConfig[] = [
    { id: 'comunicaciones', label: 'Comunicaciones', route: '/comunicaciones/correos', bgColor: '#5678A0', gradient: 'linear-gradient(148deg, #5678A0 0%, #5678A0 24%, #223955 100%)', iconFile: 'comunicaciones.svg', iconOpacity: 0.24, kpiValue: '3', kpiLabel: 'canales', statusDot: 'green', statusText: 'Activo' },
    { id: 'config', label: 'Configuración', route: '/admin/configuracion', bgColor: '#0E1724', gradient: 'linear-gradient(144deg, #0E1724 0%, #0E1724 24%, #1A365B 100%)', iconFile: 'configuracion.svg', iconOpacity: 0.24, kpiValue: '', kpiLabel: 'admin', statusDot: 'gray', statusText: 'Sistema' },
  ]

  const getCardStyle = (isHovered: boolean, card: CardConfig): React.CSSProperties => ({
    borderRadius: '22px',
    padding: '22px',
    background: card.gradient,
    border: '1px solid rgba(255,255,255,0.14)',
    cursor: 'pointer',
    position: 'relative',
    overflow: 'hidden',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'flex-start',
    transition: 'transform 0.25s ease, box-shadow 0.25s ease',
    transform: isHovered ? 'translateY(-3px)' : 'translateY(0)',
    boxShadow: isHovered
      ? '0 3px 5px -1px rgba(0,0,0,0.70), 0 14px 26px -8px rgba(0,0,0,0.48), 0 38px 76px -20px rgba(0,0,0,0.58), inset 2px 2px 0 rgba(255,255,255,0.14), inset -2px -2px 0 rgba(0,0,0,0.22), inset 0 0 24px rgba(0,0,0,0.18)'
      : '0 18px 34px rgba(0,0,0,0.24), 0 6px 12px rgba(0,0,0,0.14), inset 0 1px 0 rgba(255,255,255,0.12), inset 0 18px 28px rgba(255,255,255,0.025), inset 0 -14px 20px rgba(0,0,0,0.12)',
  })

  // Planos geométricos por card — cada uno único
  const renderDecor = (card: CardConfig) => {
    switch (card.id) {
      case 'oportunidades':
        return (<>
          <div style={{ position:'absolute', right:'42%', top:'60%', width:'34%', height:'3px', background:'rgba(255,255,255,0.10)', transformOrigin:'100% 50%', transform:'rotate(-48deg)', pointerEvents:'none' }} />
          <div style={{ position:'absolute', right:'42%', top:'60%', width:'34%', height:'3px', background:'rgba(255,255,255,0.10)', transformOrigin:'100% 50%', transform:'rotate(-48deg) translateY(-24px)', pointerEvents:'none' }} />
          <div style={{ position:'absolute', right:'16px', bottom:'16px', width:'43px', height:'43px', backgroundImage:'radial-gradient(circle, rgba(255,122,0,0.90) 1.5px, transparent 1.6px)', backgroundSize:'10px 10px', filter:'drop-shadow(0 0 8px rgba(255,122,0,0.30))', pointerEvents:'none' }} />
        </>)
      case 'comercial':
        return (<>
          <div style={{ position:'absolute', left:'calc(58% - 10%)', top:'-30%', width:'20%', height:'160%', background:'rgba(255,255,255,0.10)', transform:'rotate(18deg)', pointerEvents:'none' }} />
          <div style={{ position:'absolute', left:'calc(78% - 6%)', top:'-30%', width:'12%', height:'160%', background:'rgba(255,255,255,0.07)', transform:'rotate(18deg)', pointerEvents:'none' }} />
        </>)
      case 'servicio-clientes':
        return (<>
          <div style={{ position:'absolute', left:'42%', top:'-30%', width:'30%', height:'160%', background:'rgba(255,255,255,0.10)', transform:'rotate(26deg)', transformOrigin:'top left', pointerEvents:'none' }} />
          <div style={{ position:'absolute', left:'69%', top:'-30%', width:'18%', height:'160%', background:'rgba(255,255,255,0.07)', transform:'rotate(26deg)', transformOrigin:'top left', pointerEvents:'none' }} />
        </>)
      case 'despacho':
        return (<>
          <div style={{ position:'absolute', right:'-2%', top:'10%', width:'24%', height:'140%', background:'rgba(255,255,255,0.07)', transform:'rotate(22deg)', pointerEvents:'none' }} />
          <div style={{ position:'absolute', left:'calc(34% - 9%)', top:'-30%', width:'18%', height:'160%', background:'rgba(255,255,255,0.16)', transform:'rotate(34deg)', pointerEvents:'none' }} />
        </>)
      case 'ventas':
        return (<>
          <div style={{ position:'absolute', left:'52%', top:'-30%', width:'22%', height:'160%', background:'rgba(255,255,255,0.10)', transform:'rotate(38deg)', transformOrigin:'top left', pointerEvents:'none' }} />
          <div style={{ position:'absolute', left:'70%', top:'-30%', width:'12%', height:'160%', background:'rgba(255,255,255,0.07)', transform:'rotate(44deg)', transformOrigin:'top left', pointerEvents:'none' }} />
          <div style={{ position:'absolute', left:'60%', top:'18%', width:'120px', height:'120px', transform:'translate(-50%,-50%)', background:'radial-gradient(circle, rgba(255,255,255,0.12) 0%, rgba(255,255,255,0) 70%)', pointerEvents:'none' }} />
        </>)
      case 'cotizaciones':
        return (<>
          <div style={{ position:'absolute', left:'30%', top:'-30%', width:'24%', height:'160%', background:'rgba(255,255,255,0.10)', transform:'rotate(32deg)', pointerEvents:'none' }} />
          <div style={{ position:'absolute', left:'60%', top:'-30%', width:'14%', height:'160%', background:'rgba(255,255,255,0.07)', transform:'rotate(28deg)', pointerEvents:'none' }} />
        </>)
      case 'plantillas':
        return (<>
          <div style={{ position:'absolute', left:'35%', top:'-30%', width:'18%', height:'160%', background:'rgba(255,255,255,0.10)', transform:'rotate(22deg)', pointerEvents:'none' }} />
          <div style={{ position:'absolute', left:'65%', top:'-30%', width:'10%', height:'160%', background:'rgba(255,255,255,0.07)', transform:'rotate(36deg)', pointerEvents:'none' }} />
        </>)
      case 'comunicaciones':
        return (<>
          <div style={{ position:'absolute', left:'calc(46% - 8%)', top:'-30%', width:'16%', height:'160%', background:'rgba(255,255,255,0.10)', transform:'rotate(20deg)', pointerEvents:'none' }} />
          <div style={{ position:'absolute', left:'calc(63% - 5%)', top:'-30%', width:'10%', height:'160%', background:'rgba(255,255,255,0.07)', transform:'rotate(28deg)', pointerEvents:'none' }} />
        </>)
      case 'config':
        return (<>
          <div style={{ position:'absolute', left:'56%', top:'-30%', width:'18%', height:'160%', background:'rgba(255,255,255,0.10)', transform:'rotate(30deg)', transformOrigin:'top left', pointerEvents:'none' }} />
          <div style={{ position:'absolute', left:'76%', top:'20%', width:'90px', height:'90px', transform:'translate(-50%,-50%)', background:'radial-gradient(circle, rgba(255,255,255,0.12) 0%, rgba(255,255,255,0) 70%)', pointerEvents:'none' }} />
        </>)
      default: return null
    }
  }

  const renderCard = (card: CardConfig) => {
    const isHovered = hoveredCard === card.id
    // Despacho IA icon +20%
    const iconScale = card.id === 'despacho' ? 1.20 : 1
    return (
      <div
        key={card.id}
        onClick={() => navigate(card.route)}
        onMouseEnter={() => setHoveredCard(card.id)}
        onMouseLeave={() => setHoveredCard(null)}
        style={getCardStyle(isHovered, card)}
      >
        {/* Planos geométricos */}
        {renderDecor(card)}
        {/* Punto naranja fosfo superior derecho */}
        <div style={{
          position: 'absolute', top: '14px', right: '14px',
          width: '7px', height: '7px', borderRadius: '50%',
          backgroundColor: '#FF7A00',
          boxShadow: '0 0 10px rgba(255,122,0,0.50)',
          zIndex: 3,
        }} />
        <img
          src={`/icons/dashboard/${card.iconFile}`}
          alt=""
          style={{
            position: 'absolute',
            right: '-5%',
            bottom: '-8%',
            width: `${70 * iconScale}%`,
            height: `${70 * iconScale}%`,
            objectFit: 'contain',
            pointerEvents: 'none',
            opacity: 0.24,
            filter: 'brightness(0) invert(1) drop-shadow(0 0 6px rgba(255,122,0,0.22)) drop-shadow(0 0 14px rgba(255,122,0,0.12))',
            transition: 'transform 0.5s cubic-bezier(0.23,1,0.32,1)',
            transform: isHovered ? 'translate(3px,-3px) scale(1.05)' : 'translate(0,0) scale(1)',
          }}
        />
        <div style={{
          fontFamily: "'Montserrat', sans-serif",
          fontSize: '20px',
          fontWeight: 800,
          color: '#F5F7FA',
          lineHeight: 1.2,
          marginBottom: 'auto',
          whiteSpace: 'nowrap', textAlign: 'center',
          position: 'relative',
          zIndex: 1,
          textShadow: '0 1px 2px rgba(0,0,0,0.35)',
        }}>
          {card.label}
        </div>
        <div style={{
          fontFamily: "'Montserrat', sans-serif",
          fontSize: '28px',
          fontWeight: 600,
          color: '#F5F7FA',
          textAlign: 'left', width: '100%',lineHeight: 1,
          marginTop: '6px',
          position: 'relative',
          zIndex: 1,
          textShadow: '0 1px 2px rgba(0,0,0,0.35)',
        }}>
          {card.kpiValue}
        </div>
        <div style={{
          fontFamily: "'Montserrat', sans-serif",
          fontSize: '9px',
          fontWeight: 400,
          color: 'rgba(245,247,250,0.80)',
          textAlign: 'left', width: '100%',
          marginTop: '3px',
          position: 'relative',
          zIndex: 1,
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
      backgroundColor: '#E8EBF0',
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
        padding: '26px 28px',
        display: 'grid',
        gridTemplateRows: '1fr 1fr',
        gap: '14px',
        overflow: 'hidden',
      }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '14px', minHeight: 0 }}>
          {mainCards.map(renderCard)}
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '14px', minHeight: 0 }}>
          <div style={{ gridColumn: '6 / 7' }}>{renderCard(row2Cards[0])}</div>
          <div style={{ gridColumn: '7 / 8' }}>{renderCard(row2Cards[1])}</div>
        </div>
      </div>
    </div>
  )
}












