import { useNavigate } from 'react-router-dom'
import { tokens } from '../lib/tokens'

/**
 * Proximamente — Placeholder page for modules under construction.
 * Shows a clean, professional "coming soon" screen with back navigation.
 */
export default function Proximamente({ titulo, descripcion }: { titulo: string; descripcion?: string }) {
  const navigate = useNavigate()

  return (
    <div
      style={{
        minHeight: '100vh',
        background: tokens.colors.bgMain,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        fontFamily: tokens.fonts.body,
        padding: '40px',
      }}
    >
      <div
        style={{
          background: tokens.colors.bgCard,
          border: `1px solid ${tokens.colors.border}`,
          borderRadius: '16px',
          padding: '48px 56px',
          textAlign: 'center',
          maxWidth: '480px',
          width: '100%',
        }}
      >
        {/* Icon */}
        <div style={{ fontSize: '48px', marginBottom: '16px' }}>🚧</div>

        {/* Title */}
        <h2
          style={{
            fontFamily: tokens.fonts.heading,
            fontSize: '1.5rem',
            fontWeight: 700,
            color: tokens.colors.textPrimary,
            margin: '0 0 12px 0',
          }}
        >
          {titulo}
        </h2>

        {/* Status */}
        <div
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '8px',
            background: 'rgba(245, 158, 11, 0.12)',
            border: '1px solid rgba(245, 158, 11, 0.3)',
            borderRadius: '20px',
            padding: '6px 16px',
            marginBottom: '16px',
          }}
        >
          <div
            style={{
              width: '8px',
              height: '8px',
              borderRadius: '50%',
              background: tokens.colors.yellow,
            }}
          />
          <span
            style={{
              fontSize: '0.85rem',
              fontWeight: 600,
              color: tokens.colors.yellow,
            }}
          >
            En desarrollo
          </span>
        </div>

        {/* Description */}
        <p
          style={{
            color: tokens.colors.textSecondary,
            fontSize: '0.95rem',
            lineHeight: 1.6,
            margin: '0 0 28px 0',
          }}
        >
          {descripcion || 'Este módulo está en desarrollo y estará disponible próximamente.'}
        </p>
        {/* Back button */}
        <button
          onClick={() => navigate(-1)}
          style={{
            background: tokens.colors.primary,
            color: '#fff',
            border: 'none',
            borderRadius: '8px',
            padding: '10px 28px',
            fontSize: '0.9rem',
            fontWeight: 600,
            cursor: 'pointer',
            fontFamily: tokens.fonts.body,
            transition: 'background 0.2s ease',
          }}
          onMouseEnter={(e) => (e.currentTarget.style.background = tokens.colors.primaryHover)}
          onMouseLeave={(e) => (e.currentTarget.style.background = tokens.colors.primary)}
        >
          ← Regresar
        </button>
      </div>
    </div>
  )
}
