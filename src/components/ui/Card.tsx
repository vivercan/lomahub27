import { tokens } from '../../lib/tokens'

interface CardProps {
  children: React.ReactNode
  className?: string
  glow?: 'none' | 'primary' | 'green' | 'red'
  noPadding?: boolean
}

export function Card({ children, className = '', glow = 'none', noPadding = false }: CardProps) {
  const glowStyle = {
    none:    tokens.effects.cardShadow,
    primary: tokens.effects.glowPrimary,
    green:   tokens.effects.glowGreen,
    red:     tokens.effects.glowRed,
  }[glow]

  return (
    <div
      className={`rounded-xl border ${noPadding ? '' : 'p-4'} ${className}`}
      style={{
        background:   tokens.colors.bgCard,
        borderColor:  tokens.colors.border,
        borderRadius: tokens.radius.lg,
        boxShadow:    glowStyle,
      }}
    >
      {children}
    </div>
  )
}
