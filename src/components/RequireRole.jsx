import { Navigate, useLocation } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

/**
 * Lindungi laluan ikut peranan. `roles` = array peranan dibenarkan, cth ['admin'].
 * Tiada `roles` diberi = hanya perlu log masuk (apa-apa peranan).
 */
export default function RequireRole({ roles, children }) {
  const { user, profile, loading } = useAuth()
  const location = useLocation()

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-brand-600 border-t-transparent" />
      </div>
    )
  }

  if (!user || !profile) {
    return <Navigate to="/log-masuk" state={{ from: location }} replace />
  }

  if (roles && !roles.includes(profile.role)) {
    return <Navigate to="/" replace />
  }

  return children
}
