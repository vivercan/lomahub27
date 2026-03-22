import { Navigate, useLocation } from 'react-router-dom'
import { useAuthContext } from '../hooks/AuthContext'
import type { Rol } from '../types/auth'
import { checkCustomAccess } from '../types/auth'

interface ProtectedRouteProps {
  children: React.ReactNode
  allowedRoles?: Rol[]
}

export function ProtectedRoute({ children, allowedRoles }: ProtectedRouteProps) {
  const { user, loading } = useAuthContext()
  const location = useLocation()

  if (loading) {
    return (
      <div className="min-h-screen bg-fx-bg flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-fx-primary border-t-transparent rounded-full animate-spin" />
          <p className="text-fx-text-secondary font-montserrat">Cargando...</p>
        </div>
      </div>
    )
  }

  if (!user) {
    return <Navigate to="/login" replace />
  }

  // superadmin and admin always have full access
  if (user.rol === 'superadmin' || user.rol === 'admin') {
    return <>{children}</>
  }

  // If user has permisosCustom, restrict to ONLY those modules
  if (user.permisosCustom && user.permisosCustom.length > 0) {
    if (!checkCustomAccess(user.permisosCustom, location.pathname)) {
      return <Navigate to="/unauthorized" replace />
    }
    return <>{children}</>
  }

  // Standard role-based check
  if (allowedRoles && !allowedRoles.includes(user.rol)) {
    return <Navigate to="/unauthorized" replace />
  }

  return <>{children}</>
}
