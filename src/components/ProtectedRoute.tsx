import type { ReactNode } from 'react'
import { Navigate } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'
import { useCoach } from '../contexts/CoachContext'
import { supabase } from '../lib/supabase'
import Spinner from './Spinner'

export default function ProtectedRoute({ children }: { children: ReactNode }) {
  const { user, loading: authLoading } = useAuth()
  const { coach, loading: coachLoading } = useCoach()

  if (authLoading || coachLoading) return <Spinner />
  if (!user) return <Navigate to="/login" replace />
  if (!coach) {
    // If this user has pending gym setup data in their metadata, send them to /setup to complete it
    if (user.user_metadata?.pending_gym_name) {
      return <Navigate to="/setup" replace />
    }
    return (
      <div className="flex h-screen items-center justify-center bg-surface">
        <div className="max-w-sm rounded-lg bg-card p-8 text-center shadow">
          <p className="mb-2 font-semibold text-violet-100">Account not linked</p>
          <p className="text-sm text-violet-400">
            Your account isn't linked to a gym yet — contact your admin.
          </p>
          <button
            type="button"
            onClick={async () => {
              const { error } = await supabase.auth.signOut()
              if (error) console.error('[ProtectedRoute] sign-out failed', error)
            }}
            className="mt-4 text-sm text-orange-500 hover:underline"
          >
            Sign out and try a different account
          </button>
        </div>
      </div>
    )
  }
  return <>{children}</>
}
