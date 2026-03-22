import { useNavigate } from 'react-router-dom'
import { ShieldAlert } from 'lucide-react'

export default function Unauthorized() {
  const navigate = useNavigate()

  return (
    <div className="min-h-screen bg-fx-bg flex items-center justify-center p-4">
      <div className="glass p-8 text-center max-w-md">
        <ShieldAlert className="w-16 h-16 text-red-400 mx-auto mb-4" />
        <h1 className="text-2xl font-montserrat font-bold text-fx-text-primary mb-2">
          Acceso denegado
        </h1>
        <p className="text-fx-text-secondary font-montserrat mb-6">
          No tienes permisos para acceder a esta sección del sistema.
        </p>
        <button
          onClick={() => navigate(-1)}
          className="px-6 py-3 bg-fx-primary text-white font-montserrat font-semibold rounded-lg btn-glow hover:bg-blue-600 transition-all"
        >
          Regresar
        </button>
      </div>
    </div>
  )
}
