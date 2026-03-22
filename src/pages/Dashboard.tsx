import { useAuthContext } from '../hooks/AuthContext'
import { ROLES_LABELS } from '../types/auth'
import { LogOut, LayoutDashboard } from 'lucide-react'

export default function Dashboard() {
  const { user, logout } = useAuthContext()

  return (
    <div className="min-h-screen bg-fx-bg p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-3">
            <LayoutDashboard className="w-8 h-8 text-fx-primary" />
            <div>
              <h1 className="text-2xl font-montserrat font-bold text-fx-text-primary">
                Loma<span className="text-fx-primary">HUB</span>27
              </h1>
              <p className="text-fx-text-secondary text-sm font-montserrat">
                {user ? ROLES_LABELS[user.rol] : ''} — {user?.empresa || 'Sistema'}
              </p>
            </div>
          </div>
          <button
            onClick={logout}
            className="flex items-center gap-2 px-4 py-2 text-fx-text-secondary hover:text-white border border-fx-border rounded-lg hover:bg-fx-bg-hover transition-colors font-montserrat"
          >
            <LogOut className="w-4 h-4" />
            Cerrar sesión
          </button>
        </div>

        {/* Welcome Card */}
        <div className="glass p-8 text-center">
          <h2 className="text-xl font-montserrat text-fx-text-primary mb-4">
            Bienvenido, {user?.email}
          </h2>
          <p className="text-fx-text-secondary font-montserrat mb-6">
            El sistema está en construcción. Los módulos se irán habilitando progresivamente.
          </p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-8">
            <div className="p-4 bg-fx-bg border border-fx-border rounded-xl">
              <p className="text-3xl font-montserrat font-bold text-fx-primary">0</p>
              <p className="text-fx-text-secondary text-sm mt-1">Viajes activos</p>
            </div>
            <div className="p-4 bg-fx-bg border border-fx-border rounded-xl">
              <p className="text-3xl font-montserrat font-bold text-emerald-400">0</p>
              <p className="text-fx-text-secondary text-sm mt-1">Unidades en ruta</p>
            </div>
            <div className="p-4 bg-fx-bg border border-fx-border rounded-xl">
              <p className="text-3xl font-montserrat font-bold text-fx-orange">0</p>
              <p className="text-fx-text-secondary text-sm mt-1">Alertas pendientes</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
