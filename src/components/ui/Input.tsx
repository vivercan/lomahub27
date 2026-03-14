import { tokens } from '../../lib/tokens'

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string
  error?: string
  icon?: React.ReactNode
}

export function Input({ label, error, icon, className = '', ...props }: InputProps) {
  return (
    <div className="flex flex-col gap-1">
      {label && (
        <label className="text-sm font-medium" style={{ color: tokens.colors.textSecondary, fontFamily: tokens.fonts.body }}>
          {label}
        </label>
      )}
      <div className="relative">
        {icon && (
          <span className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: tokens.colors.textMuted }}>
            {icon}
          </span>
        )}
        <input
          className={`w-full rounded-lg px-4 py-2.5 text-sm outline-none transition-colors focus:ring-2 ${icon ? 'pl-10' : ''} ${className}`}
          style={{
            background: tokens.colors.bgHover,
            border: `1px solid ${error ? tokens.colors.red : tokens.colors.border}`,
            color: tokens.colors.textPrimary,
            fontFamily: tokens.fonts.body,
            // @ts-expect-error CSS custom property
            '--tw-ring-color': tokens.colors.primary,
          }}
          {...props}
        />
      </div>
      {error && (
        <span className="text-xs" style={{ color: tokens.colors.red }}>{error}</span>
      )}
    </div>
  )
}
