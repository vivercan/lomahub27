import type { ReactNode } from 'react'
import { tokens } from '../lib/tokens'

interface KPICardProps {
  /** New API */
  icon?: ReactNode
  label?: string
  value?: string | number
  /** Legacy API */
  titulo?: string
  valor?: string | number
  subtitulo?: string
  icono?: ReactNode
  /** Shared */
  color?: 'primary' | 'green' | 'yellow' | 'red' | 'gray' | 'blue' | 'orange'
  onClick?: () => void
}

const colorMap: Record<string, string> = {
  primary: tokens.colors.primary,
  green: tokens.colors.green,
  yellow: tokens.colors.yellow,
  red: tokens.colors.red,
  gray: tokens.colors.gray,
  blue: tokens.colors.blue,
  orange: tokens.colors.orange,
}

export function KPICard({
  icon, label, value,
  titulo, valor, subtitulo, icono,
  color = 'primary', onClick,
}: KPICardProps) {
  const displayLabel = label ?? titulo ?? ''
  const displayValue = value ?? valor ?? ''
  const displayIcon = icon ?? icono ?? null

  return (
    <div
      onClick={onClick}
      style={{
        background: tokens.colors.bgCard,
        border: `1px solid ${tokens.colors.border}`,
        borderRadius: tokens.radius.lg,
        padding: tokens.spacing.md,
        cursor: onClick ? 'pointer' : 'default',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '4px' }}>
        <p style={{ fontSize: '13px', color: tokens.colors.textSecondary, fontFamily: tokens.fonts.body, margin: 0 }}>
          {displayLabel}
        </p>
        {displayIcon && <span style={{ color: colorMap[color] }}>{displayIcon}</span>}
      </div>
      <p style={{ fontSize: '28px', fontWeight: 700, color: colorMap[color], fontFamily: tokens.fonts.heading, margin: 0 }}>
        {displayValue}
      </p>
      {subtitulo && (
        <p style={{ fontSize: '12px', color: tokens.colors.textMuted, fontFamily: tokens.fonts.body, marginTop: '4px', margin: 0 }}>
          {subtitulo}
        </p>
      )}
    </div>
  )
}
