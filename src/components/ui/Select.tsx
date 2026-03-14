import { tokens } from '../../lib/tokens'

interface SelectOption {
  value: string
  label: string
}

interface SelectProps extends Omit<React.SelectHTMLAttributes<HTMLSelectElement>, 'children'> {
  label?: string
  options: SelectOption[]
  placeholder?: string
}

export function Select({ label, options, placeholder, className = '', ...props }: SelectProps) {
  return (
    <div className="flex flex-col gap-1">
      {label && (
        <label className="text-sm font-medium" style={{ color: tokens.colors.textSecondary, fontFamily: tokens.fonts.body }}>
          {label}
        </label>
      )}
      <select
        className={`w-full rounded-lg px-4 py-2.5 text-sm outline-none transition-colors focus:ring-2 appearance-none ${className}`}
        style={{
          background: tokens.colors.bgHover,
          border: `1px solid ${tokens.colors.border}`,
          color: tokens.colors.textPrimary,
          fontFamily: tokens.fonts.body,
        }}
        {...props}
      >
        {placeholder && <option value="">{placeholder}</option>}
        {options.map(opt => (
          <option key={opt.value} value={opt.value}>{opt.label}</option>
        ))}
      </select>
    </div>
  )
}
