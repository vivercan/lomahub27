import { tokens } from '../../lib/tokens'

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'danger' | 'ghost'
  size?: 'sm' | 'md' | 'lg'
  loading?: boolean
  children: React.ReactNode
}

const variantStyles = {
  primary: {
    background: tokens.colors.primary,
    color: '#fff',
    border: 'none',
    boxShadow: tokens.effects.glowPrimary,
  },
  secondary: {
    background: 'transparent',
    color: tokens.colors.textPrimary,
    border: `1px solid ${tokens.colors.border}`,
    boxShadow: 'none',
  },
  danger: {
    background: tokens.colors.red,
    color: '#fff',
    border: 'none',
    boxShadow: tokens.effects.glowRed,
  },
  ghost: {
    background: 'transparent',
    color: tokens.colors.textSecondary,
    border: 'none',
    boxShadow: 'none',
  },
}

const sizeClasses = {
  sm: 'px-3 py-1.5 text-xs',
  md: 'px-4 py-2 text-sm',
  lg: 'px-6 py-3 text-base',
}

export function Button({ variant = 'primary', size = 'md', loading, children, className = '', disabled, ...props }: ButtonProps) {
  const styles = variantStyles[variant]

  return (
    <button
      className={`rounded-lg font-medium transition-all duration-200 hover:brightness-110 disabled:opacity-50 disabled:cursor-not-allowed inline-flex items-center gap-2 ${sizeClasses[size]} ${className}`}
      style={{ ...styles, fontFamily: tokens.fonts.body }}
      disabled={disabled || loading}
      {...props}
    >
      {loading && (
        <span className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
      )}
      {children}
    </button>
  )
}
