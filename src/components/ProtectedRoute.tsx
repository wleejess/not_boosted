import { Navigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

interface ProtectedRouteProps {
  children: React.ReactNode
  adminOnly?: boolean
}

export default function ProtectedRoute({ children, adminOnly = false }: ProtectedRouteProps) {
  const { session, user, loading } = useAuth()

  if (loading) {
    return (
      <div className="min-h-svh flex items-center justify-center bg-slate-950">
        <div className="text-slate-400 text-sm">Loading...</div>
      </div>
    )
  }

  if (!session) return <Navigate to="/login" replace />
  if (adminOnly && user?.role !== 'admin') return <Navigate to="/guild" replace />

  return <>{children}</>
}
