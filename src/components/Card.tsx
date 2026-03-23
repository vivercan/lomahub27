import type { ReactNode, CSSProperties } from 'react'
import { tokens } from '../lib/tokens'

interface CardProps {
  children: ReactNode
  style?: CSSProperties
  className?: string
  glow?: 'none' | 'primary' | 'green' | 'red'
  noPadding?: boolean
  onClick?: () => void
}

export function Card({ children, style, className = '', glow = 'none', noPadding = false, onClick }: CardProps) {
  const glowStyle = {
    none: tokens.effects?.cardShadow ?? 'none',
    primary: tokens.effects?.glowPrimary ?? 'none',
    green: tokens.effects?.glowGreen ?? 'none',
    red: tokens.effects?.glowRed ?? 'none',
  }[glow]

  return (
    <div
      className={className}
      onClick={onClick}
      style={{
        background: tokens.colors.bgCard,
        border: `1px solid ${tokens.colors.border}`,
        borderRadius: tokens.radius.lg,
        boxShadow: glowStyle,
        padding: noPadding ? 0 : tokens.spacing.md,
        ...style,
      }}
    >
      {children}
    </div>
  )
}
