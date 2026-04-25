import { type ReactNode } from 'react'
import { useNavigate } from 'react-router-dom'
import { ArrowLeft, Home } from 'lucide-react'
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
      {/* V46.6 — Navegación uniforme: Atrás (blanco) + Casita NARANJA siempre visibles (25/Abr/2026) */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '12px 24px',
        flexShrink: 0
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          {/* PRIMARIO — Atrás (blanco): label dinámico según padre, fallback "Dashboard" */}
          <button
            onClick={() => {
              if (moduloPadre?.ruta) navigate(moduloPadre.ruta)
              else navigate('/dashboard')
            }}
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
            title={moduloPadre?.ruta ? 'Volver al módulo padre' : 'Volver al Dashboard'}
          >
            <ArrowLeft size={16} strokeWidth={2.2} />
            <span>{moduloPadre?.label || moduloPadre?.nombre || 'Dashboard'}</span>
          </button>
          {/* SECUNDARIO — Casita NARANJA SIEMPRE visible (excepto Dashboard ppal que no usa este layout) */}
          <button
            onClick={() => navigate('/dashboard')}
            style={{
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              width: '40px', height: '40px', padding: 0,
              background: 'linear-gradient(180deg, #FF5C1A 0%, #FF4500 50%, #CC3700 100%)',
              border: '1px solid #B03000', borderRadius: '10px',
              color: '#FFFFFF', cursor: 'pointer',
              fontFamily: tokens.fonts.body, transition: 'all 0.18s ease',
              boxShadow: '0 2px 4px rgba(255,69,0,0.30), 0 6px 14px -3px rgba(255,69,0,0.25), 0 10px 24px -6px rgba(0,0,0,0.20), inset 0 1px 0 rgba(255,255,255,0.28), inset 0 -1px 0 rgba(0,0,0,0.20)',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = 'translateY(-1px)'
              e.currentTarget.style.boxShadow = '0 4px 8px rgba(255,69,0,0.40), 0 10px 20px -3px rgba(255,69,0,0.30), 0 14px 30px -6px rgba(0,0,0,0.25), inset 0 1px 0 rgba(255,255,255,0.32), inset 0 -1px 0 rgba(0,0,0,0.20)'
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = 'translateY(0)'
              e.currentTarget.style.boxShadow = '0 2px 4px rgba(255,69,0,0.30), 0 6px 14px -3px rgba(255,69,0,0.25), 0 10px 24px -6px rgba(0,0,0,0.20), inset 0 1px 0 rgba(255,255,255,0.28), inset 0 -1px 0 rgba(0,0,0,0.20)'
            }}
            title="Ir al Dashboard principal"
          >
            <Home size={18} strokeWidth={2.4} color="#FFFFFF" />
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
      {/* Content */}
      <div style={{
        flex: 1,
        overflow: 'hidden',
        padding: '0 24px 24px',
        scrollbarWidth: 'none',
        display: 'flex',
        flexDirection: 'column' as const
      }}>
        {children}
      </div>
    </div>
  )
}
