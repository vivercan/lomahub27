interface SemaforoProps {
  estado: 'verde' | 'amarillo' | 'rojo' | 'gris'
  size?: 'sm' | 'md' | 'lg'
}

const colores = {
  verde: 'bg-emerald-500',
  amarillo: 'bg-amber-500',
  rojo: 'bg-red-500',
  gris: 'bg-gray-500',
}

const sizes = {
  sm: 'w-2 h-2',
  md: 'w-3 h-3',
  lg: 'w-4 h-4',
}

export function Semaforo({ estado, size = 'md' }: SemaforoProps) {
  return (
    <span
      className={`inline-block rounded-full ${colores[estado]} ${sizes[size]}`}
      title={estado}
    />
  )
}
