import { tokens } from '../../lib/tokens'

interface LogoProps {
  variant?: 'full' | 'mini' | 'white' | 'text'
  size?: number
  className?: string
}

export function Logo({ variant = 'full', size = 40, className = '' }: LogoProps) {
  // Text-only variant as fallback when SVG not available
  if (variant === 'text') {
    return (
      <span
        className={className}
        style={{
          fontFamily: tokens.fonts.heading,
          fontSize: size * 0.5,
          fontWeight: 700,
          color: tokens.colors.primary,
        }}
      >
        {tokens.brand.nombre}
      </span>
    )
  }

  const src = {
    full:  tokens.brand.logo,
    mini:  tokens.brand.logoMini,
    white: tokens.brand.logoWhite,
  }[variant]

  return (
    <img
      src={src}
      alt={tokens.brand.nombre}
      height={size}
      className={className}
      style={{ height: size }}
      onError={(e) => {
        // Fallback to text if image fails
        const span = document.createElement('span')
        span.style.fontFamily = tokens.fonts.heading
        span.style.fontSize = `${size * 0.5}px`
        span.style.fontWeight = '700'
        span.style.color = tokens.colors.primary
        span.textContent = tokens.brand.nombre
        ;(e.target as HTMLElement).replaceWith(span)
      }}
    />
  )
}
