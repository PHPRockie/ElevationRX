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
    // Pending gym setup in metadata → complete it via /setup
    if (user.user_metadata?.pending_gym_name) {
      return <Navigate to="/setup" replace />
    }
    return (
      <div className="flex h-screen items-center justify-center bg-surface">
        <div className="max-w-sm rounded-lg bg-card p-8 text-center shadow">
          <p className="mb-2 font-semibold text-violet-100">Account not linked</p>
          <p className="mb-4 text-sm text-violet-400">
            Your account isn't linked to a gym yet.
          </p>
          <a
            href="/setup"
            className="block rounded bg-orange-500 px-4 py-2 text-sm font-semibold text-white hover:bg-orange-600"
          >
            Set up my gym
          </a>
          <button
            type="button"
            onClick={async () => {
              await supabase.auth.signOut()
            }}
            className="mt-3 text-sm text-violet-500 hover:underline"
          >
            Sign out and use a different account
          </button>
        </div>
      </div>
    )
  }
  return <>{children}</>
}
