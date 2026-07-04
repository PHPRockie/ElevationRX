import { Navigate } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'
import { useCoach } from '../contexts/CoachContext'
import Spinner from './Spinner'

export default function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user, loading: authLoading } = useAuth()
  const { coach, loading: coachLoading } = useCoach()

  if (authLoading || coachLoading) return <Spinner />
  if (!user) return <Navigate to="/login" replace />
  if (!coach) {
    return (
      <div className="flex h-screen items-center justify-center bg-gray-50">
        <div className="max-w-sm rounded-lg bg-white p-8 text-center shadow">
          <p className="mb-2 font-semibold text-slate-900">Account not linked</p>
          <p className="text-sm text-slate-500">
            Your account isn't linked to a gym yet — contact your admin.
          </p>
        </div>
      </div>
    )
  }
  return <>{children}</>
}
