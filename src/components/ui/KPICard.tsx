import { tokens } from '../../lib/tokens'

interface KPICardProps {
  titulo: string
  valor: string | number
  subtitulo?: string
  color?: 'primary' | 'green' | 'yellow' | 'red' | 'gray' | 'blue' | 'orange'
  icono?: React.ReactNode
  onClick?: () => void
}

const colorMap = {
  primary: tokens.colors.primary,
  green:   tokens.colors.green,
  yellow:  tokens.colors.yellow,
  red:     tokens.colors.red,
  gray:    tokens.colors.gray,
  blue:    tokens.colors.blue,
  orange:  tokens.colors.orange,
}

export function KPICard({ titulo, valor, subtitulo, color = 'primary', icono, onClick }: KPICardProps) {
  return (
    <div
      className={`rounded-xl border p-4 ${onClick ? 'cursor-pointer hover:brightness-110 transition-all' : ''}`}
      style={{ background: tokens.colors.bgCard, borderColor: tokens.colors.border }}
      onClick={onClick}
    >
      <div className="flex items-center justify-between mb-1">
        <p className="text-sm" style={{ color: tokens.colors.textSecondary, fontFamily: tokens.fonts.body }}>
          {titulo}
        </p>
        {icono && <span style={{ color: colorMap[color] }}>{icono}</span>}
      </div>
      <p className="text-3xl font-bold" style={{ color: colorMap[color], fontFamily: tokens.fonts.heading }}>
        {valor}
      </p>
      {subtitulo && (
        <p className="text-xs mt-1" style={{ color: tokens.colors.textMuted, fontFamily: tokens.fonts.body }}>
          {subtitulo}
        </p>
      )}
    </div>
  )
}
