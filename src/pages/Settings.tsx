import { useEffect, useState } from 'react'
import { Navigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { useCoach } from '../contexts/CoachContext'
import { useInvitations } from '../hooks/useInvitations'
import InviteCoachModal from '../components/InviteCoachModal'
import Spinner from '../components/Spinner'
import type { Coach } from '../types/database'

export default function Settings() {
  const { coach, gym, loading: authLoading } = useCoach()
  const { invitations, loading: invLoading, error: invError, createInvitation, revokeInvitation } = useInvitations()

  const [coaches, setCoaches] = useState<Coach[]>([])
  const [coachesLoading, setCoachesLoading] = useState(true)
  const [coachesError, setCoachesError] = useState<string | null>(null)
  const [showInviteModal, setShowInviteModal] = useState(false)
  const [revokeError, setRevokeError] = useState<string | null>(null)

  useEffect(() => {
    if (!gym) { setCoachesLoading(false); return }
    let cancelled = false
    setCoachesLoading(true)
    setCoachesError(null)
    supabase
      .from('coaches')
      .select('*')
      .eq('gym_id', gym.id)
      .order('full_name')
      .then(({ data, error }) => {
        if (cancelled) return
        if (error) setCoachesError('Failed to load team.')
        else setCoaches(data ?? [])
        setCoachesLoading(false)
      })
    return () => { cancelled = true }
  }, [gym])

  async function handleRevoke(id: string) {
    setRevokeError(null)
    try {
      await revokeInvitation(id)
    } catch {
      setRevokeError('Failed to revoke invitation. Please try again.')
    }
  }

  if (authLoading) return <Spinner />
  if (!coach || coach.role !== 'admin') return <Navigate to="/dashboard" replace />

  if (coachesLoading) return <Spinner />

  return (
    <div className="h-full overflow-auto p-6">
      <h1 className="mb-6 text-xl font-bold text-violet-100">Settings</h1>

      {/* Team */}
      <section className="mb-8">
        <h2 className="mb-3 text-sm font-bold text-violet-300">Team</h2>
        {coachesError && <p className="mb-2 text-xs text-red-500">{coachesError}</p>}
        <div className="overflow-hidden rounded-lg border border-border bg-card">
          <table className="w-full text-sm">
            <thead className="bg-[#1a1728] text-xs font-semibold uppercase text-violet-400">
              <tr>
                <th className="px-4 py-3 text-left">Name</th>
                <th className="px-4 py-3 text-left">Role</th>
                <th className="px-4 py-3 text-left">Joined</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {coaches.map(c => (
                <tr key={c.id}>
                  <td className="px-4 py-3 font-medium text-violet-100">{c.full_name}</td>
                  <td className="px-4 py-3">
                    <span className={`inline-flex rounded-full px-2 py-0.5 text-xs font-semibold ${
                      c.role === 'admin'
                        ? 'bg-orange-900/40 text-orange-400'
                        : 'bg-zinc-800 text-zinc-400'
                    }`}>
                      {c.role === 'admin' ? 'Admin' : 'Coach'}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-violet-400">
                    {new Date(c.created_at).toLocaleDateString()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* Invitations */}
      <section>
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-sm font-bold text-violet-300">Invitations</h2>
          <button
            type="button"
            onClick={() => setShowInviteModal(true)}
            className="rounded bg-orange-500 px-3 py-1.5 text-sm font-semibold text-white hover:bg-orange-600"
          >
            + Invite coach
          </button>
        </div>

        {revokeError && <p className="mb-2 text-xs text-red-500">{revokeError}</p>}
        {invError && <p className="mb-2 text-xs text-red-500">{invError}</p>}

        {invLoading ? (
          <Spinner />
        ) : invitations.length === 0 ? (
          <p className="text-sm text-violet-400">No invitations yet.</p>
        ) : (
          <div className="overflow-hidden rounded-lg border border-border bg-card">
            <table className="w-full text-sm">
              <thead className="bg-[#1a1728] text-xs font-semibold uppercase text-violet-400">
                <tr>
                  <th className="px-4 py-3 text-left">Email</th>
                  <th className="px-4 py-3 text-left">Name</th>
                  <th className="px-4 py-3 text-left">Expires</th>
                  <th className="px-4 py-3 text-left">Status</th>
                  <th className="px-4 py-3 text-left">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {invitations.map(inv => (
                  <tr key={inv.id} className={inv.status !== 'pending' ? 'opacity-50' : ''}>
                    <td className="px-4 py-3 text-violet-300">{inv.email}</td>
                    <td className="px-4 py-3 text-violet-300">{inv.full_name}</td>
                    <td className="px-4 py-3 text-violet-400">
                      {new Date(inv.expires_at).toLocaleDateString()}
                    </td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex rounded-full px-2 py-0.5 text-xs font-semibold ${
                        inv.status === 'pending'
                          ? 'bg-amber-900/40 text-amber-400'
                          : inv.status === 'accepted'
                          ? 'bg-green-900/40 text-green-400'
                          : 'bg-zinc-800 text-zinc-400'
                      }`}>
                        {inv.status}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      {inv.status === 'pending' && (
                        <button
                          type="button"
                          onClick={() => handleRevoke(inv.id)}
                          className="text-xs text-red-500 hover:underline"
                        >
                          Revoke
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {showInviteModal && (
        <InviteCoachModal
          onCreate={createInvitation}
          onClose={() => setShowInviteModal(false)}
        />
      )}
    </div>
  )
}
