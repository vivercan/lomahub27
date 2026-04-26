import { tokens } from '../../lib/tokens'

interface BadgeProps {
  children: React.ReactNode
  color?: 'primary' | 'green' | 'yellow' | 'red' | 'gray' | 'blue' | 'orange'
}

// V50 (26/Abr/2026) — JJ pidió badges SÓLIDOS + 3D + texto blanco (estilo botón "Nuevo")
// Bottom shadow + inset highlight arriba simulan elevación táctil. NO pasteles.
const colorStyles: Record<string, { bg: string; bgGrad: string }> = {
  primary: { bg: '#3B6CE7', bgGrad: 'linear-gradient(180deg, #4F7DF0 0%, #3B6CE7 50%, #2D58C8 100%)' },
  green:   { bg: '#10B981', bgGrad: 'linear-gradient(180deg, #34D399 0%, #10B981 50%, #059669 100%)' },
  yellow:  { bg: '#F59E0B', bgGrad: 'linear-gradient(180deg, #FBBF24 0%, #F59E0B 50%, #D97706 100%)' },
  red:     { bg: '#EF4444', bgGrad: 'linear-gradient(180deg, #F87171 0%, #EF4444 50%, #DC2626 100%)' },
  gray:    { bg: '#64748B', bgGrad: 'linear-gradient(180deg, #94A3B8 0%, #64748B 50%, #475569 100%)' },
  blue:    { bg: '#0891B2', bgGrad: 'linear-gradient(180deg, #22D3EE 0%, #0891B2 50%, #0E7490 100%)' },
  orange:  { bg: '#F97316', bgGrad: 'linear-gradient(180deg, #FB923C 0%, #F97316 50%, #EA580C 100%)' },
}

export function Badge({ children, color = 'primary' }: BadgeProps) {
  const style = colorStyles[color] || colorStyles.gray
  return (
    <span
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        padding: '4px 11px',
        borderRadius: 999,
        fontSize: 11,
        fontWeight: 700,
        letterSpacing: '0.02em',
        background: style.bgGrad,
        color: '#FFFFFF',
        fontFamily: tokens.fonts.body,
        border: `1px solid ${style.bg}`,
        boxShadow: `0 1px 0 rgba(0,0,0,0.08), 0 2px 4px ${style.bg}55, inset 0 1px 0 rgba(255,255,255,0.35), inset 0 -1px 0 rgba(0,0,0,0.18)`,
        textShadow: '0 1px 0 rgba(0,0,0,0.12)',
      }}
    >
      {children}
    </span>
  )
}
