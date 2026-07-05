import { useEffect, useState } from 'react'
import { Navigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { supabase } from '../lib/supabase'
import { useCoach } from '../contexts/CoachContext'
import { useInvitations } from '../hooks/useInvitations'
import InviteCoachModal from '../components/InviteCoachModal'
import Spinner from '../components/Spinner'
import type { Coach } from '../types/database'

export default function Settings() {
  const { coach, gym, loading: authLoading } = useCoach()
  const { invitations, loading: invLoading, error: invError, createInvitation, revokeInvitation } = useInvitations()
  const { t } = useTranslation()

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
        if (error) setCoachesError(t('settings.errorLoadTeam'))
        else setCoaches(data ?? [])
        setCoachesLoading(false)
      })
    return () => { cancelled = true }
  }, [gym, t])

  async function handleRevoke(id: string) {
    setRevokeError(null)
    try {
      await revokeInvitation(id)
    } catch {
      setRevokeError(t('settings.errorRevoke'))
    }
  }

  if (authLoading) return <Spinner />
  if (!coach || coach.role !== 'admin') return <Navigate to="/dashboard" replace />
  if (coachesLoading) return <Spinner />

  const statusLabel = (status: string) => {
    if (status === 'pending') return t('settings.statusPending')
    if (status === 'accepted') return t('settings.statusAccepted')
    return t('settings.statusRevoked')
  }

  const statusColors = (status: string) => {
    if (status === 'pending') return 'bg-amber-900/40 text-amber-400'
    if (status === 'accepted') return 'bg-green-900/40 text-green-400'
    return 'bg-zinc-800 text-zinc-400'
  }

  return (
    <div className="h-full overflow-auto p-4 md:p-6">
      <h1 className="mb-6 text-xl font-bold text-violet-100">{t('settings.title')}</h1>

      {/* Team */}
      <section className="mb-8">
        <h2 className="mb-3 text-sm font-bold text-violet-300">{t('settings.teamSection')}</h2>
        {coachesError && <p className="mb-2 text-xs text-red-500">{coachesError}</p>}

        {/* Mobile card list */}
        <div className="flex flex-col gap-2 md:hidden">
          {coaches.map(c => (
            <div key={c.id} className="flex items-center justify-between rounded-lg border border-border bg-card px-4 py-3">
              <div>
                <p className="font-medium text-violet-100">{c.full_name}</p>
                <p className="text-xs text-violet-400">{new Date(c.created_at).toLocaleDateString()}</p>
              </div>
              <span className={`inline-flex rounded-full px-2 py-0.5 text-xs font-semibold ${
                c.role === 'admin' ? 'bg-orange-900/40 text-orange-400' : 'bg-zinc-800 text-zinc-400'
              }`}>
                {c.role === 'admin' ? t('settings.roleAdmin') : t('settings.roleCoach')}
              </span>
            </div>
          ))}
        </div>

        {/* Desktop table */}
        <div className="hidden overflow-hidden rounded-lg border border-border bg-card md:block">
          <table className="w-full text-sm">
            <thead className="bg-[#1a1728] text-xs font-semibold uppercase text-violet-400">
              <tr>
                <th className="px-4 py-3 text-left">{t('settings.colName')}</th>
                <th className="px-4 py-3 text-left">{t('settings.colRole')}</th>
                <th className="px-4 py-3 text-left">{t('settings.colJoined')}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {coaches.map(c => (
                <tr key={c.id}>
                  <td className="px-4 py-3 font-medium text-violet-100">{c.full_name}</td>
                  <td className="px-4 py-3">
                    <span className={`inline-flex rounded-full px-2 py-0.5 text-xs font-semibold ${
                      c.role === 'admin' ? 'bg-orange-900/40 text-orange-400' : 'bg-zinc-800 text-zinc-400'
                    }`}>
                      {c.role === 'admin' ? t('settings.roleAdmin') : t('settings.roleCoach')}
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
          <h2 className="text-sm font-bold text-violet-300">{t('settings.invitationsSection')}</h2>
          <button
            type="button"
            onClick={() => setShowInviteModal(true)}
            className="rounded bg-orange-500 px-3 py-1.5 text-sm font-semibold text-white hover:bg-orange-600"
          >
            {t('settings.inviteButton')}
          </button>
        </div>

        {revokeError && <p className="mb-2 text-xs text-red-500">{revokeError}</p>}
        {invError && <p className="mb-2 text-xs text-red-500">{invError}</p>}

        {invLoading ? (
          <Spinner />
        ) : invitations.length === 0 ? (
          <p className="text-sm text-violet-400">{t('settings.noInvitations')}</p>
        ) : (
          <>
            {/* Mobile card list */}
            <div className="flex flex-col gap-2 md:hidden">
              {invitations.map(inv => (
                <div
                  key={inv.id}
                  className={`rounded-lg border border-border bg-card px-4 py-3 ${inv.status !== 'pending' ? 'opacity-50' : ''}`}
                >
                  <div className="mb-1 flex items-center justify-between">
                    <p className="font-medium text-violet-100">{inv.full_name}</p>
                    <span className={`inline-flex rounded-full px-2 py-0.5 text-xs font-semibold ${statusColors(inv.status)}`}>
                      {statusLabel(inv.status)}
                    </span>
                  </div>
                  <p className="text-xs text-violet-400">{inv.email}</p>
                  <div className="mt-2 flex items-center justify-between">
                    <p className="text-xs text-violet-600">Exp. {new Date(inv.expires_at).toLocaleDateString()}</p>
                    {inv.status === 'pending' && (
                      <button
                        type="button"
                        onClick={() => handleRevoke(inv.id)}
                        className="text-xs text-red-500 hover:underline"
                      >
                        {t('settings.revokeButton')}
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>

            {/* Desktop table */}
            <div className="hidden overflow-hidden rounded-lg border border-border bg-card md:block">
              <table className="w-full text-sm">
                <thead className="bg-[#1a1728] text-xs font-semibold uppercase text-violet-400">
                  <tr>
                    <th className="px-4 py-3 text-left">{t('settings.colEmail')}</th>
                    <th className="px-4 py-3 text-left">{t('settings.colName')}</th>
                    <th className="px-4 py-3 text-left">{t('settings.colExpires')}</th>
                    <th className="px-4 py-3 text-left">{t('settings.colStatus')}</th>
                    <th className="px-4 py-3 text-left">{t('settings.colActions')}</th>
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
                        <span className={`inline-flex rounded-full px-2 py-0.5 text-xs font-semibold ${statusColors(inv.status)}`}>
                          {statusLabel(inv.status)}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        {inv.status === 'pending' && (
                          <button
                            type="button"
                            onClick={() => handleRevoke(inv.id)}
                            className="text-xs text-red-500 hover:underline"
                          >
                            {t('settings.revokeButton')}
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
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
