// src/components/layout/ModuleLayout.tsx
// Layout con AppHeader arriba, SIN sidebar lateral
// Modificado 19/Mar/2026 — compatible con props originales (titulo, subtitulo)

import { ReactNode } from 'react'
import { useNavigate } from 'react-router-dom'
import { ArrowLeft } from 'lucide-react'
import AppHeader from './AppHeader'
import { useAuth } from '../../hooks/useAuth'

interface ModuleLayoutProps {
  titulo: string
  subtitulo?: string
  acciones?: ReactNode
  children: ReactNode
}

export function ModuleLayout({ titulo, subtitulo, acciones, children }: ModuleLayoutProps) {
  const navigate = useNavigate()
  const { user, logout } = useAuth()

  const handleLogout = async () => {
    await logout()
  }

  return (
    <div style={{ minHeight: '100vh', background: '#2a2a36' }}>
      <AppHeader
        onLogout={handleLogout}
        userName={user?.email?.split('@')[0] || 'Usuario'}
        userRole={user?.rol || 'admin'}
      />

      <div style={{
        display: 'flex', alignItems: 'center', gap: '16px',
        padding: '16px 36px', borderBottom: '1px solid rgba(255,255,255,0.06)',
      }}>
        <button onClick={() => navigate('/dashboard')} style={{
          display: 'flex', alignItems: 'center', gap: '6px',
          padding: '6px 12px', background: 'rgba(255,255,255,0.05)',
          border: '1px solid rgba(255,255,255,0.08)', borderRadius: '8px',
          color: 'rgba(255,255,255,0.6)', cursor: 'pointer',
          fontFamily: "'Montserrat', sans-serif", fontSize: '13px', fontWeight: 600,
        }}>
          <ArrowLeft size={18} />
          <span>Dashboard</span>
        </button>

        <div>
          <h1 style={{
            fontFamily: "'Montserrat', sans-serif", fontWeight: 700,
            fontSize: '20px', color: '#fff', margin: 0, lineHeight: 1.2,
          }}>{titulo}</h1>
          {subtitulo && (
            <p style={{
              fontFamily: "'Montserrat', sans-serif", fontWeight: 400,
              fontSize: '13px', color: 'rgba(255,255,255,0.45)', margin: '2px 0 0 0',
            }}>{subtitulo}</p>
          )}
        </div>

        {acciones && <div style={{ marginLeft: 'auto' }}>{acciones}</div>}
      </div>

      <main style={{ padding: '24px 36px' }}>
        {children}
      </main>
    </div>
  )
}
