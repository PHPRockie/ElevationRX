import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { supabase } from '../lib/supabase'
import Spinner from '../components/Spinner'
import type { Invitation } from '../types/database'

export default function AcceptInvite() {
  const navigate = useNavigate()
  const { t } = useTranslation()

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
      setLookupError(t('acceptInvite.errorInvalid'))
      setLookupLoading(false)
      return
    }

    let cancelled = false
    supabase
      .from('invitations')
      .select('*')
      .eq('token', token)
      .single()
      .then(({ data, error }) => {
        if (cancelled) return
        setLookupLoading(false)
        if (error || !data) { setLookupError(t('acceptInvite.errorInvalid')); return }
        if (data.status === 'accepted') { setLookupError(t('acceptInvite.errorAlreadyUsed')); return }
        if (data.status === 'revoked') { setLookupError(t('acceptInvite.errorRevoked')); return }
        if (new Date(data.expires_at) < new Date()) { setLookupError(t('acceptInvite.errorExpired')); return }
        setInvitation(data)
        setFullName(data.full_name)
      })
    return () => { cancelled = true }
  }, [t])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!invitation || saving) return
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
            ? t('acceptInvite.errorEmailExists')
            : signUpError.message,
        )
        return
      }
      if (!authData.user || !authData.session) {
        setSubmitError(t('acceptInvite.errorEmailConfirmation'))
        return
      }

      const { error: coachError } = await supabase.from('coaches').insert({
        id: authData.user.id,
        gym_id: invitation.gym_id,
        full_name: fullName.trim(),
        role: 'coach',
      })
      if (coachError) {
        setSubmitError(t('acceptInvite.errorProfileFailed'))
        return
      }

      const { error: acceptError } = await supabase
        .from('invitations')
        .update({ status: 'accepted' })
        .eq('id', invitation.id)
      if (acceptError) {
        setSubmitError(t('acceptInvite.errorInviteUpdate'))
        return
      }

      navigate('/dashboard', { replace: true })
    } finally {
      setSaving(false)
    }
  }

  if (lookupLoading) return <Spinner />

  if (lookupError) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-surface">
        <div className="w-full max-w-sm rounded-lg bg-card p-8 text-center shadow">
          <h1 className="mb-1 text-xl font-extrabold text-violet-100">{t('acceptInvite.title')}</h1>
          <p className="mb-2 mt-4 font-semibold text-violet-100">{t('acceptInvite.unavailableTitle')}</p>
          <p className="text-sm text-violet-400">{lookupError}</p>
        </div>
      </div>
    )
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-surface">
      <div className="w-full max-w-sm rounded-lg bg-card p-8 shadow">
        <h1 className="mb-1 text-xl font-extrabold text-violet-100">{t('acceptInvite.title')}</h1>
        <p className="mb-6 text-sm text-violet-400">{t('acceptInvite.subtitle')}</p>
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div>
            <label htmlFor="accept-email" className="mb-1 block text-xs font-semibold text-violet-300">
              {t('acceptInvite.email')}
            </label>
            <input
              id="accept-email"
              type="email"
              value={invitation?.email ?? ''}
              readOnly
              className="w-full rounded border border-border bg-[#1a1728] px-3 py-2 text-sm text-violet-400"
            />
          </div>
          <div>
            <label htmlFor="accept-name" className="mb-1 block text-xs font-semibold text-violet-300">
              {t('acceptInvite.fullName')}
            </label>
            <input
              id="accept-name"
              type="text"
              value={fullName}
              onChange={e => setFullName(e.target.value)}
              required
              className="w-full rounded border border-border bg-[#1a1728] px-3 py-2 text-sm text-violet-100 placeholder-violet-600 outline-none focus:border-orange-500"
            />
          </div>
          <div>
            <label htmlFor="accept-password" className="mb-1 block text-xs font-semibold text-violet-300">
              {t('acceptInvite.password')}
            </label>
            <input
              id="accept-password"
              type="password"
              autoComplete="new-password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              required
              minLength={6}
              className="w-full rounded border border-border bg-[#1a1728] px-3 py-2 text-sm text-violet-100 placeholder-violet-600 outline-none focus:border-orange-500"
            />
          </div>
          {submitError && <p className="text-xs text-red-500">{submitError}</p>}
          <button
            type="submit"
            disabled={saving}
            className="rounded bg-orange-500 py-2 text-sm font-semibold text-white hover:bg-orange-600 disabled:opacity-50"
          >
            {saving ? t('acceptInvite.submitting') : t('acceptInvite.submit')}
          </button>
        </form>
      </div>
    </div>
  )
}
