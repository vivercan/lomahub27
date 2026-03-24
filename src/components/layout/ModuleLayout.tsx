import { type ReactNode } from 'react'
import { useNavigate } from 'react-router-dom'
import { ArrowLeft, ChevronRight } from 'lucide-react'
import { tokens } from '../../lib/tokens'

interface ModuleLayoutProps {
  titulo: string
  subtitulo?: string
  acciones?: ReactNode
  children: ReactNode
  moduloPadre?: { nombre: string; ruta: string }
}

export function ModuleLayout({ titulo, subtitulo, acciones, children, moduloPadre }: ModuleLayoutProps) {
  const navigate = useNavigate()

  return (
    <div style={{ height: '100vh', overflow: 'hidden', background: '#2a2a36', display: 'flex',
      flexDirection: 'column', fontFamily: tokens.fonts.body }}>

      {/* Breadcrumb Bar */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '12px 24px 0 24px', flexShrink: 0 }}>

        <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
          {/* Dashboard button */}
          <button onClick={() => navigate('/dashboard')} style={{
            display: 'flex', alignItems: 'center', gap: '6px',
            padding: '6px 12px', background: 'rgba(255,255,255,0.04)',
            border: '1px solid rgba(255,255,255,0.06)', borderRadius: '8px',
            color: tokens.colors.textSecondary, fontSize: '13px', fontWeight: 500,
            cursor: 'pointer', fontFamily: tokens.fonts.body,
            transition: 'all 0.15s ease' }}>
            <ArrowLeft size={14} />
            <span>Dashboard</span>
          </button>

          {/* Module parent breadcrumb (P13) */}
          {moduloPadre && (
            <>
              <ChevronRight size={14} style={{ color: tokens.colors.textMuted, margin: '0 2px' }} />
              <button onClick={() => navigate(moduloPadre.ruta)} style={{
                display: 'flex', alignItems: 'center', gap: '4px',
                padding: '6px 10px', background: 'rgba(255,255,255,0.04)',
                border: '1px solid rgba(255,255,255,0.06)', borderRadius: '8px',
                color: tokens.colors.textSecondary, fontSize: '13px', fontWeight: 500,
                cursor: 'pointer', fontFamily: tokens.fonts.body,
                transition: 'all 0.15s ease' }}>
                {moduloPadre.nombre}
              </button>
            </>
          )}

          <ChevronRight size={14} style={{ color: tokens.colors.textMuted, margin: '0 2px' }} />
          <span style={{ color: tokens.colors.textPrimary, fontSize: '13px', fontWeight: 600,
            fontFamily: tokens.fonts.heading }}>
            {titulo}
          </span>
        </div>

        {acciones && <div style={{ display: 'flex', gap: '8px' }}>{acciones}</div>}
      </div>

      {/* Title area */}
      <div style={{ padding: '8px 24px 12px', flexShrink: 0 }}>
        <h1 style={{ margin: 0, fontSize: '22px', fontWeight: 700, color: tokens.colors.textPrimary,
          fontFamily: tokens.fonts.heading }}>{titulo}</h1>
        {subtitulo && (
          <p style={{ margin: '4px 0 0', fontSize: '13px', color: tokens.colors.textSecondary }}>
            {subtitulo}
          </p>
        )}
      </div>

      {/* Content */}
      <div style={{ flex: 1, overflow: 'auto', padding: '0 24px 24px',
        scrollbarWidth: 'none' }}>
        <style>{`div::-webkit-scrollbar { width: 0; background: transparent; }`}</style>
        {children}
      </div>
    </div>
  )
}
