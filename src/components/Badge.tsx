import type { ReactNode, CSSProperties } from 'react'
import { tokens } from '../lib/tokens'

interface BadgeProps {
  children: ReactNode
  variant?: 'default' | 'success' | 'warning' | 'danger' | 'info' | 'muted'
  size?: 'sm' | 'md'
  style?: CSSProperties
}

const variantStyles: Record<string, { bg: string; color: string }> = {
  default: { bg: tokens.colors.bgHover, color: tokens.colors.textPrimary },
  success: { bg: 'rgba(16,185,129,0.15)', color: tokens.colors.green },
  warning: { bg: 'rgba(245,158,11,0.15)', color: tokens.colors.yellow },
  danger: { bg: 'rgba(239,68,68,0.15)', color: tokens.colors.red },
  info: { bg: 'rgba(59,130,246,0.15)', color: tokens.colors.blue },
  muted: { bg: tokens.colors.bgHover, color: tokens.colors.textMuted },
}

export function Badge({ children, variant = 'default', size = 'sm', style }: BadgeProps) {
  const vs = variantStyles[variant] || variantStyles.default
  return (
    <span
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: '4px',
        padding: size === 'sm' ? '2px 8px' : '4px 12px',
        fontSize: size === 'sm' ? '12px' : '13px',
        fontWeight: 600,
        fontFamily: tokens.fonts.body,
        borderRadius: tokens.radius.sm,
        background: vs.bg,
        color: vs.color,
        ...style,
      }}
    >
      {children}
    </span>
  )
}
