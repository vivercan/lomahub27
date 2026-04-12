import { type ReactNode } from 'react'
import { useNavigate } from 'react-router-dom'
import { ArrowLeft, ChevronRight } from 'lucide-react'
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
        <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
          <button
            onClick={() => navigate('/dashboard')}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              padding: '6px 12px',
              background: '#FF4500',
              border: '1px solid #CC3700',
              borderRadius: '8px',
              color: '#FFFFFF',
              fontSize: '13px',
              fontWeight: 600,
              cursor: 'pointer',
              fontFamily: tokens.fonts.body,
              transition: 'all 0.15s ease'
            }}
          >
            <ArrowLeft size={14} />
            <span>Dashboard</span>
          </button>
          {moduloPadre && moduloPadre.ruta !== '/dashboard' && (
            <>
              <ChevronRight size={14} style={{ color: tokens.colors.textMuted, margin: '0 2px' }} />
              <button
                onClick={() => navigate(moduloPadre.ruta)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px',
                  padding: '6px 10px',
                  background: 'rgba(15, 23, 42, 0.04)',
                  border: '1px solid rgba(15, 23, 42, 0.06)',
                  borderRadius: '8px',
                  color: tokens.colors.textSecondary,
                  fontSize: '13px',
                  fontWeight: 500,
                  cursor: 'pointer',
                  fontFamily: tokens.fonts.body,
                  transition: 'all 0.15s ease'
                }}
              >
                {moduloPadre.nombre}
              </button>
            </>
          )}
          <ChevronRight size={14} style={{ color: tokens.colors.textMuted, margin: '0 2px' }} />
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
              marginLeft: '12px',
              fontFamily: tokens.fonts.body
            }}>
              {subtitulo}
            </span>
          )}
        </div>
        {acciones && <div style={{ display: 'flex', gap: '8px' }}>{acciones}</div>}
      </div>
      {/* Content */}
      <div style={{
        flex: 1,
        overflow: 'auto',
        padding: '0 24px 24px',
        scrollbarWidth: 'none'
      }}>
        {children}
      </div>
    </div>
  )
}
