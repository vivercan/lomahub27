import { type ReactNode } from 'react'
import { useNavigate } from 'react-router-dom'
import { ArrowLeft } from 'lucide-react'
import { tokens } from '../../lib/tokens'
import AppHeader from './AppHeader'
import { useAuthContext } from '../../hooks/AuthContext'

interface ModuleLayoutProps {
  titulo: string
  subtitulo?: string
  acciones?: ReactNode
  children: ReactNode
  moduloPadre?: { nombre?: string; label?: string; ruta: string }
}

export function ModuleLayout({ titulo, subtitulo, acciones, children, moduloPadre }: ModuleLayoutProps) {
  const navigate = useNavigate()
  const { user, logout } = useAuthContext()
  const formatName = (email?: string) => {
    if (!email) return 'Usuario'
    const name = email.split('@')[0]
    return name
      .split('.')
      .map((p: string) => p.charAt(0).toUpperCase() + p.slice(1))
      .join(' ')
  }
  const handleLogout = async () => {
    await logout()
    navigate('/login')
  }

  return (
    <div style={{
      height: '100vh',
      overflow: 'hidden',
      display: 'flex',
      flexDirection: 'column' as const,
      background: tokens.colors.bgMain,
      fontFamily: tokens.fonts.body
    }}>
      <AppHeader
        onLogout={handleLogout}
        userName={formatName(user?.email)}
        userRole={user?.rol || 'admin'}
        userEmail={user?.email}
      />
      {/* V52 (26/Abr/2026) — Navegacion world-class: SOLO "Atras". Casita Home eliminada porque era redundante con el logo LomaHUB27 (clickeable a /dashboard). */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '12px 24px',
        flexShrink: 0
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
          {/* V53 (26/Abr/2026) — UNICO boton de navegacion: SIEMPRE regresa al Dashboard principal (decision JJ). La prop moduloPadre se ignora en navegacion para evitar saltos intermedios. */}
          {/* V54 (28/Abr/2026) — DOS botones: Dashboard (blanco) + Regresar (NARANJA) para no confundir */}
          <button
            onClick={() => navigate('/dashboard')}
            style={{
              display: 'flex', alignItems: 'center', gap: '8px',
              padding: '9px 18px', minWidth: '120px',
              background: '#FFFFFF', border: '1px solid #E2E8F0', borderRadius: '10px',
              color: '#0F172A', fontSize: '14px', fontWeight: 600, cursor: 'pointer',
              fontFamily: tokens.fonts.body, transition: 'all 0.18s ease',
              boxShadow: '0 1px 2px rgba(15,23,42,0.04), 0 2px 8px rgba(15,23,42,0.06)',
              letterSpacing: '-0.01em', justifyContent: 'flex-start',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = '#F8FAFC'
              e.currentTarget.style.borderColor = '#CBD5E1'
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = '#FFFFFF'
              e.currentTarget.style.borderColor = '#E2E8F0'
            }}
            title="Volver al Dashboard principal"
          >
            <ArrowLeft size={16} strokeWidth={2.2} />
            <span>Dashboard</span>
          </button>
          <button
            onClick={() => moduloPadre?.ruta ? navigate(moduloPadre.ruta) : navigate(-1)}
            style={{
              display: 'flex', alignItems: 'center', gap: '8px',
              padding: '9px 18px', minWidth: '120px',
              background: 'linear-gradient(180deg, #FB923C 0%, #F97316 50%, #EA580C 100%)',
              border: 'none', borderRadius: '10px',
              color: '#FFFFFF', fontSize: '14px', fontWeight: 700, cursor: 'pointer',
              fontFamily: tokens.fonts.body, transition: 'all 0.18s ease',
              boxShadow: '0 2px 4px rgba(249,115,22,0.30), 0 4px 10px -2px rgba(249,115,22,0.25), inset 0 1px 0 rgba(255,255,255,0.30)',
              textShadow: '0 1px 2px rgba(0,0,0,0.20)',
              letterSpacing: '-0.01em', justifyContent: 'flex-start',
            }}
            onMouseEnter={(e) => { e.currentTarget.style.filter = 'brightness(1.05)' }}
            onMouseLeave={(e) => { e.currentTarget.style.filter = 'brightness(1)' }}
            title="Regresar a la pantalla anterior"
          >
            <ArrowLeft size={16} strokeWidth={2.4} />
            <span>Regresar</span>
          </button>
          <div style={{
            display: 'flex',
            flexDirection: 'column',
            gap: '2px'
          }}>
            <span style={{
              color: tokens.colors.textPrimary,
              fontSize: '16px',
              fontWeight: 700,
              fontFamily: tokens.fonts.heading
            }}>
              {titulo}
            </span>
            {subtitulo && (
              <span style={{
                color: tokens.colors.textMuted,
                fontSize: '13px',
                fontWeight: 400,
                fontFamily: tokens.fonts.body
              }}>
                {subtitulo}
              </span>
            )}
          </div>
        </div>
        <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
          {acciones}
        </div>
      </div>
      {/* Content — overflow-y auto para permitir scroll en modulos con contenido largo (26/Abr/2026) */}
      <div style={{
        flex: 1,
        overflowY: 'auto',
        overflowX: 'hidden',
        padding: '0 24px 24px',
        scrollbarWidth: 'thin',
        display: 'flex',
        flexDirection: 'column' as const
      }}>
        {children}
      </div>
    </div>
  )
}
