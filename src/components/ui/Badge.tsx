import { tokens } from '../../lib/tokens'

interface BadgeProps {
  children: React.ReactNode
  color?: 'primary' | 'green' | 'yellow' | 'red' | 'gray' | 'blue' | 'orange'
}

const colorStyles: Record<string, { bg: string; text: string }> = {
  primary: { bg: 'rgba(30, 102, 245, 0.15)', text: tokens.colors.primary },
  green:   { bg: tokens.colors.greenBg, text: tokens.colors.green },
  yellow:  { bg: tokens.colors.yellowBg, text: tokens.colors.yellow },
  red:     { bg: tokens.colors.redBg, text: tokens.colors.red },
  gray:    { bg: 'rgba(107, 114, 128, 0.15)', text: tokens.colors.gray },
  blue:    { bg: tokens.colors.blueBg, text: tokens.colors.blue },
  orange:  { bg: tokens.colors.orangeLight, text: tokens.colors.orange },
}

export function Badge({ children, color = 'primary' }: BadgeProps) {
  const style = colorStyles[color]
  return (
    <span
      className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium"
      style={{
        background: style.bg,
        color: style.text,
        fontFamily: tokens.fonts.body,
        boxShadow: '0 1px 3px rgba(0,0,0,0.10), 0 2px 6px -1px rgba(0,0,0,0.06), inset 0 1px 0 rgba(255,255,255,0.50), inset 0 -1px 0 rgba(0,0,0,0.04)',
      }}
    >
      {children}
    </span>
  )
}
