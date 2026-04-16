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
  moduloPadre?: { nombre: string; ruta: string }
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
      {/* Breadcrumb + titulo + subtitulo + acciones — todo en una línea */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '12px 24px',
        flexShrink: 0
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <button
            onClick={() => navigate('/dashboard')}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              padding: '7px 14px',
              background: 'linear-gradient(180deg, #FF5C1A 0%, #FF4500 50%, #CC3700 100%)',
              border: '1px solid #B03000',
              borderRadius: '8px',
              color: '#FFFFFF',
              fontSize: '13px',
              fontWeight: 600,
              cursor: 'pointer',
              fontFamily: tokens.fonts.body,
              transition: 'all 0.18s ease',
              boxShadow: `
                0 2px 4px rgba(255,69,0,0.30),
                0 6px 14px -3px rgba(255,69,0,0.25),
                0 10px 24px -6px rgba(0,0,0,0.20),
                inset 0 1px 0 rgba(255,255,255,0.28),
                inset 0 -1px 0 rgba(0,0,0,0.20)
              `,
              textShadow: '0 1px 2px rgba(0,0,0,0.25)'
            }}
          >
            <ArrowLeft size={14} />
            <span>Dashboard</span>
          </button>
          {moduloPadre && moduloPadre.ruta !== '/dashboard' && (
            <button
              onClick={() => navigate(moduloPadre.ruta)}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                width: '32px',
                height: '32px',
                padding: 0,
                background: 'linear-gradient(180deg, #4A7AF0 0%, #3B6CE7 50%, #2F5BC4 100%)',
                border: '1px solid #2F5BC4',
                borderRadius: '8px',
                color: '#FFFFFF',
                cursor: 'pointer',
                fontFamily: tokens.fonts.body,
                transition: 'all 0.18s ease',
                boxShadow: '0 2px 4px rgba(59,108,231,0.30), 0 6px 14px -3px rgba(59,108,231,0.25), inset 0 1px 0 rgba(255,255,255,0.28), inset 0 -1px 0 rgba(0,0,0,0.18)'
              }}
              title="Volver"
            >
              <ArrowLeft size={14} />
            </button>
          )}
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
        {acciones && <div style={{ display: 'flex', gap: '8px' }}>{acciones}</div>}
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
