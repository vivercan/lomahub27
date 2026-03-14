interface KPICardProps {
  titulo: string
  valor: string | number
  subtitulo?: string
  color?: 'blue' | 'emerald' | 'amber' | 'red' | 'orange'
}

const colorClasses = {
  blue: 'text-blue-400',
  emerald: 'text-emerald-400',
  amber: 'text-amber-400',
  red: 'text-red-400',
  orange: 'text-orange-400',
}

export function KPICard({ titulo, valor, subtitulo, color = 'blue' }: KPICardProps) {
  return (
    <div className="bg-gray-900 border border-gray-800 rounded-xl p-4">
      <p className="text-gray-400 text-sm font-exo2">{titulo}</p>
      <p className={`text-3xl font-orbitron font-bold ${colorClasses[color]} mt-1`}>
        {valor}
      </p>
      {subtitulo && (
        <p className="text-gray-500 text-xs mt-1 font-exo2">{subtitulo}</p>
      )}
    </div>
  )
}
