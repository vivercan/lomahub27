import { tokens } from '../../lib/tokens'

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'danger' | 'ghost'
  size?: 'sm' | 'md' | 'lg'
  loading?: boolean
  children: React.ReactNode
}

const variantStyles = {
  primary: {
    background: `linear-gradient(180deg, #4A7AF0 0%, ${tokens.colors.primary} 50%, #2F5BC4 100%)`,
    color: '#fff',
    border: 'none',
    boxShadow: '0 2px 4px rgba(59,108,231,0.30), 0 6px 14px -3px rgba(59,108,231,0.25), 0 10px 24px -6px rgba(0,0,0,0.18), inset 0 1px 0 rgba(255,255,255,0.28), inset 0 -1px 0 rgba(0,0,0,0.18)',
    textShadow: '0 1px 2px rgba(0,0,0,0.20)',
  },
  secondary: {
    background: 'linear-gradient(180deg, #FFFFFF 0%, #F3F4F6 100%)',
    color: tokens.colors.textPrimary,
    border: `1px solid ${tokens.colors.border}`,
    boxShadow: '0 2px 4px rgba(0,0,0,0.12), 0 4px 10px -2px rgba(0,0,0,0.10), inset 0 1px 0 rgba(255,255,255,0.90), inset 0 -2px 0 rgba(0,0,0,0.06)',
  },
  danger: {
    background: 'linear-gradient(180deg, #EF4444 0%, #DC2626 50%, #B91C1C 100%)',
    color: '#fff',
    border: 'none',
    boxShadow: '0 2px 4px rgba(220,38,38,0.30), 0 6px 14px -3px rgba(220,38,38,0.25), 0 10px 24px -6px rgba(0,0,0,0.18), inset 0 1px 0 rgba(255,255,255,0.25), inset 0 -1px 0 rgba(0,0,0,0.20)',
    textShadow: '0 1px 2px rgba(0,0,0,0.20)',
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
