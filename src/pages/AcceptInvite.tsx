import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import Spinner from '../components/Spinner'
import type { Invitation } from '../types/database'

export default function AcceptInvite() {
  const navigate = useNavigate()

  const [invitation, setInvitation] = useState<Invitation | null>(null)
  const [lookupLoading, setLookupLoading] = useState(true)
  const [lookupError, setLookupError] = useState<string | null>(null)

  const [fullName, setFullName] = useState('')
  const [password, setPassword] = useState('')
  const [saving, setSaving] = useState(false)
  const [submitError, setSubmitError] = useState<string | null>(null)

  useEffect(() => {
    const token = new URLSearchParams(window.location.search).get('token')
    if (!token) {
      setLookupError('Invalid invite link.')
      setLookupLoading(false)
      return
    }

    supabase
      .from('invitations')
      .select('*')
      .eq('token', token)
      .single()
      .then(({ data, error }) => {
        setLookupLoading(false)
        if (error || !data) { setLookupError('Invalid invite link.'); return }
        if (data.status === 'accepted') { setLookupError('This invite has already been used — try signing in.'); return }
        if (data.status === 'revoked') { setLookupError('This invite link is no longer valid.'); return }
        if (new Date(data.expires_at) < new Date()) { setLookupError('This invite has expired — ask your admin for a new one.'); return }
        setInvitation(data)
        setFullName(data.full_name)
      })
  }, [])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!invitation) return
    setSubmitError(null)
    setSaving(true)
    try {
      const { data: authData, error: signUpError } = await supabase.auth.signUp({
        email: invitation.email,
        password,
        options: { data: { full_name: fullName.trim() } },
      })
      if (signUpError) {
        setSubmitError(
          signUpError.message.toLowerCase().includes('already')
            ? 'An account with this email already exists — try signing in.'
            : signUpError.message,
        )
        return
      }
      if (!authData.user) {
        setSubmitError('Account creation failed. Please try again.')
        return
      }

      const { error: coachError } = await supabase.from('coaches').insert({
        id: authData.user.id,
        gym_id: invitation.gym_id,
        full_name: fullName.trim(),
        role: 'coach',
      })
      if (coachError) {
        setSubmitError('Account created but profile setup failed. Contact your admin.')
        return
      }

      await supabase
        .from('invitations')
        .update({ status: 'accepted' })
        .eq('id', invitation.id)

      navigate('/dashboard', { replace: true })
    } finally {
      setSaving(false)
    }
  }

  if (lookupLoading) return <Spinner />

  if (lookupError) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50">
        <div className="w-full max-w-sm rounded-lg bg-white p-8 text-center shadow">
          <h1 className="mb-1 text-xl font-extrabold text-slate-900">ElevationRx</h1>
          <p className="mb-2 mt-4 font-semibold text-slate-900">Invite unavailable</p>
          <p className="text-sm text-slate-500">{lookupError}</p>
        </div>
      </div>
    )
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50">
      <div className="w-full max-w-sm rounded-lg bg-white p-8 shadow">
        <h1 className="mb-1 text-xl font-extrabold text-slate-900">ElevationRx</h1>
        <p className="mb-6 text-sm text-slate-400">Create your coach account</p>
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div>
            <label htmlFor="accept-email" className="mb-1 block text-xs font-semibold text-slate-600">Email</label>
            <input
              id="accept-email"
              type="email"
              value={invitation?.email ?? ''}
              readOnly
              className="w-full rounded border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-500"
            />
          </div>
          <div>
            <label htmlFor="accept-name" className="mb-1 block text-xs font-semibold text-slate-600">Full name</label>
            <input
              id="accept-name"
              type="text"
              value={fullName}
              onChange={e => setFullName(e.target.value)}
              required
              className="w-full rounded border border-slate-200 px-3 py-2 text-sm outline-none focus:border-indigo-500"
            />
          </div>
          <div>
            <label htmlFor="accept-password" className="mb-1 block text-xs font-semibold text-slate-600">Password</label>
            <input
              id="accept-password"
              type="password"
              autoComplete="new-password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              required
              minLength={6}
              className="w-full rounded border border-slate-200 px-3 py-2 text-sm outline-none focus:border-indigo-500"
            />
          </div>
          {submitError && <p className="text-xs text-red-500">{submitError}</p>}
          <button
            type="submit"
            disabled={saving}
            className="rounded bg-indigo-600 py-2 text-sm font-semibold text-white hover:bg-indigo-700 disabled:opacity-50"
          >
            {saving ? 'Creating account…' : 'Create account'}
          </button>
        </form>
      </div>
    </div>
  )
}
