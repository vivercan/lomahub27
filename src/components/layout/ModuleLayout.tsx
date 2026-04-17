import { type ReactNode, useState } from 'react'
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

/* ── FX27-styled back button (double gradient, gold border hover) ── */
function BackButtonFX27({ onClick }: { onClick: () => void }) {
  const [h, setH] = useState(false)
  return (
    <div
      style={{
        width: '42px', height: '42px', borderRadius: '10px',
        backgroundImage: h
          ? 'linear-gradient(155deg, rgba(28,48,82,1) 0%, rgba(20,35,62,1) 100%), linear-gradient(135deg, rgba(240,160,80,0.65) 0%, rgba(70,110,170,0.4) 50%, rgba(240,160,80,0.65) 100%)'
          : 'linear-gradient(155deg, rgba(18,32,58,0.96) 0%, rgba(6,12,24,1) 100%), linear-gradient(135deg, rgba(180,100,50,0.28) 0%, rgba(60,90,140,0.25) 50%, rgba(180,100,50,0.28) 100%)',
        backgroundOrigin: 'border-box',
        backgroundClip: 'padding-box, border-box',
        border: '2px solid transparent',
        boxShadow: h
          ? '0 4px 8px rgba(0,0,0,0.4), 0 0 20px rgba(240,160,80,0.12)'
          : '0 2px 4px rgba(0,0,0,0.3), 0 6px 16px rgba(0,0,0,0.5)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        cursor: 'pointer',
        transform: h ? 'translateY(-3px)' : 'none',
        transition: 'all 0.3s ease',
      }}
      onMouseEnter={() => setH(true)}
      onMouseLeave={() => setH(false)}
      onClick={onClick}
      title="Regresar"
    >
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none"
        stroke={h ? '#f0a050' : '#e0e8f0'} strokeWidth="2"
        strokeLinecap="round" strokeLinejoin="round"
        style={{ transition: 'stroke 0.3s ease' }}>
        <path d="M19 12H5" /><path d="M12 19l-7-7 7-7" />
      </svg>
    </div>
  )
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
        <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
          {acciones}
          {moduloPadre && <BackButtonFX27 onClick={() => navigate(moduloPadre.ruta)} />}
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
