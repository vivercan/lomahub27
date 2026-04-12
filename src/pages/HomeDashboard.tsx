// HomeDashboard V27i - Solid colors, no icons, original layout
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
  kpiValue: number | string
  kpiLabel: string
  statusDot: 'green' | 'yellow' | 'red' | 'gray'
  statusText: string
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
    { id: 'oportunidades', label: 'Oportunidades', route: '/ventas/mis-leads', bgColor: '#2563EB', kpiValue: kpis.leadsActivos, kpiLabel: 'leads', statusDot: 'green', statusText: 'Pipeline activo' },
    { id: 'comercial', label: 'Comercial', route: '/ventas/dashboard', bgColor: '#0D9488', kpiValue: kpis.formatosActivos.toLocaleString(), kpiLabel: 'formatos', statusDot: 'green', statusText: '11 subm\u00f3dulos' },
    { id: 'servicio-clientes', label: 'Servicio a\nClientes', route: '/servicio/dashboard', bgColor: '#16A34A', kpiValue: kpis.clientes.toLocaleString(), kpiLabel: 'clientes', statusDot: 'green', statusText: '3 subm\u00f3dulos' },
    { id: 'despacho', label: 'Despacho\nInteligente', route: '/operaciones/torre-control', bgColor: '#15803D', kpiValue: kpis.viajesActivos, kpiLabel: 'viajes', statusDot: kpis.viajesActivos > 0 ? 'green' : 'gray', statusText: kpis.viajesActivos > 0 ? 'Operando' : 'Sin viajes' },
    { id: 'ventas', label: 'Ventas', route: '/ventas/mis-leads', bgColor: '#EA580C', kpiValue: kpis.formatosActivos.toLocaleString(), kpiLabel: 'formatos', statusDot: 'green', statusText: 'Pipeline activo' },
    { id: 'cotizaciones', label: 'Cotizaciones', route: '/cotizador/nueva', bgColor: '#D97706', kpiValue: '\u2014', kpiLabel: 'pendientes', statusDot: 'gray', statusText: 'Disponible' },
    { id: 'plantillas', label: 'Plantillas', route: '/documentos', bgColor: '#7C3AED', kpiValue: '\u2014', kpiLabel: 'plantillas', statusDot: 'gray', statusText: 'Disponible' },
  ]

  const row2Cards: CardConfig[] = [
    { id: 'comunicaciones', label: 'Comunicaciones', route: '/comunicaciones/correos', bgColor: '#DB2777', kpiValue: '3', kpiLabel: 'canales', statusDot: 'green', statusText: 'Activo' },
    { id: 'config', label: 'Configuraci\u00f3n', route: '/admin/configuracion', bgColor: '#6366F1', kpiValue: '', kpiLabel: 'admin', statusDot: 'gray', statusText: 'Sistema' },
  ]

  const getCardStyle = (isHovered: boolean, bgColor: string): React.CSSProperties => ({
    aspectRatio: '1 / 0.75',
    borderRadius: '14px',
    padding: '22px',
    background: bgColor,
    border: 'none',
    cursor: 'pointer',
    position: 'relative',
    overflow: 'hidden',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'flex-start',
    justifyContent: 'flex-start',
    transition: 'transform 0.25s ease, box-shadow 0.25s ease',
    transform: isHovered ? 'translateY(-3px)' : 'translateY(0)',
    boxShadow: isHovered
      ? '0 6px 12px rgba(0,0,0,0.15), 0 12px 32px rgba(0,0,0,0.1)'
      : '0 2px 4px rgba(0,0,0,0.08), 0 4px 12px rgba(0,0,0,0.06)',
  })

  const renderCard = (card: CardConfig) => {
    const isHovered = hoveredCard === card.id
    return (
      <div
        key={card.id}
        onClick={() => navigate(card.route)}
        onMouseEnter={() => setHoveredCard(card.id)}
        onMouseLeave={() => setHoveredCard(null)}
        style={getCardStyle(isHovered, card.bgColor)}
      >
        <div style={{
          position: 'absolute', top: '14px', right: '14px',
          width: '6px', height: '6px', borderRadius: '50%',
          backgroundColor: DOT_COLORS[card.statusDot] || DOT_COLORS.gray,
        }} />
        <div style={{
          fontFamily: "'Montserrat', sans-serif",
          fontSize: '20px',
          fontWeight: 800,
          color: '#FFFFFF',
          lineHeight: 1.2,
          marginBottom: 'auto',
          whiteSpace: 'pre-line',
        }}>
          {card.label}
        </div>
        <div style={{
          fontFamily: "'Montserrat', sans-serif",
          fontSize: '28px',
          fontWeight: 600,
          color: '#FFFFFF',
          lineHeight: 1,
          marginTop: '6px',
        }}>
          {card.kpiValue}
        </div>
        <div style={{
          fontFamily: "'Montserrat', sans-serif",
          fontSize: '9px',
          fontWeight: 400,
          color: 'rgba(255,255,255,0.7)',
          marginTop: '3px',
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
        padding: '16px 28px',
        display: 'flex',
        flexDirection: 'column',
        gap: '14px',
        overflow: 'hidden',
      }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '14px' }}>
          {mainCards.map(renderCard)}
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '14px' }}>
          <div style={{ gridColumn: '6 / 7' }}>{renderCard(row2Cards[0])}</div>
          <div style={{ gridColumn: '7 / 8' }}>{renderCard(row2Cards[1])}</div>
        </div>
      </div>
    </div>
  )
}
