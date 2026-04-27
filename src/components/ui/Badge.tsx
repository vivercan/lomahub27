import { tokens } from '../../lib/tokens'

interface BadgeProps {
  children: React.ReactNode
  color?: 'primary' | 'green' | 'yellow' | 'red' | 'gray' | 'blue' | 'orange'
}

// V53 (27/Abr/2026) — Badges sólidos 3D reforzados.
// 'orange' apunta a tokens.tipo.seca (semántica caliente)
// 'blue'   apunta a tokens.tipo.thermo (semántica fría)
// Otros colores mantienen palette estándar.
const colorStyles: Record<string, { bg: string; bgGrad: string; border: string }> = {
  primary: { bg: '#3B6CE7', bgGrad: 'linear-gradient(180deg, #4F7DF0 0%, #3B6CE7 50%, #2D58C8 100%)', border: '#2D58C8' },
  green:   { bg: '#10B981', bgGrad: 'linear-gradient(180deg, #34D399 0%, #10B981 50%, #047857 100%)', border: '#059669' },
  yellow:  { bg: '#F59E0B', bgGrad: 'linear-gradient(180deg, #FBBF24 0%, #F59E0B 50%, #B45309 100%)', border: '#D97706' },
  red:     { bg: '#EF4444', bgGrad: 'linear-gradient(180deg, #F87171 0%, #EF4444 50%, #B91C1C 100%)', border: '#DC2626' },
  gray:    { bg: '#64748B', bgGrad: 'linear-gradient(180deg, #94A3B8 0%, #64748B 50%, #334155 100%)', border: '#475569' },
  // SECA (caliente)
  orange:  { bg: tokens.tipo.seca.bg,   bgGrad: tokens.tipo.seca.gradient,   border: tokens.tipo.seca.border },
  // THERMO (frío)
  blue:    { bg: tokens.tipo.thermo.bg, bgGrad: tokens.tipo.thermo.gradient, border: tokens.tipo.thermo.border },
}

export function Badge({ children, color = 'primary' }: BadgeProps) {
  const style = colorStyles[color] || colorStyles.gray
  return (
    <span
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        padding: '5px 13px',         // V53: padding más generoso
        borderRadius: 999,
        fontSize: 12,                // V53: +1px legibilidad
        fontWeight: 700,
        letterSpacing: '0.03em',
        background: style.bgGrad,
        color: '#FFFFFF',
        fontFamily: tokens.fonts.body,
        border: `1px solid ${style.border}`,
        // V53: 4 layers shadow + inset highlights = 3D contundente
        boxShadow: `inset 0 1px 0 rgba(255,255,255,0.40), inset 0 -1px 0 rgba(0,0,0,0.20), 0 1px 2px rgba(0,0,0,0.10), 0 3px 6px ${style.bg}40`,
        textShadow: '0 1px 1px rgba(0,0,0,0.18)',
      }}
    >
      {children}
    </span>
  )
}
