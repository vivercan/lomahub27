import { tokens } from '../../lib/tokens'
import type { SemaforoEstado } from '../../lib/tokens'

interface SemaforoProps {
  estado: SemaforoEstado
  size?: 'sm' | 'md' | 'lg'
  label?: string
  pulse?: boolean
}

const colorMap: Record<SemaforoEstado, string> = {
  verde:    tokens.colors.green,
  amarillo: tokens.colors.yellow,
  naranja:  tokens.colors.orange2,
  rojo:     tokens.colors.red,
  gris:     tokens.colors.gray,
  azul:     tokens.colors.blue,
}

const sizeMap = { sm: '8px', md: '12px', lg: '16px' }

export function Semaforo({ estado, size = 'md', label, pulse = false }: SemaforoProps) {
  const color = colorMap[estado]

  return (
    <span className="inline-flex items-center gap-2">
      <span
        className={pulse ? 'animate-pulse' : ''}
        style={{
          display: 'inline-block',
          width: sizeMap[size],
          height: sizeMap[size],
          borderRadius: '50%',
          backgroundColor: color,
          boxShadow: `0 0 6px ${color}`,
        }}
      />
      {label && (
        <span style={{ color: tokens.colors.textSecondary, fontSize: '12px', fontFamily: tokens.fonts.body }}>
          {label}
        </span>
      )}
    </span>
  )
}
