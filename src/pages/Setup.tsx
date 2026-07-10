import { useState, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { supabase } from '../lib/supabase'
import { COUNTRIES } from '../lib/countries'
import Spinner from '../components/Spinner'

const SITE_URL = (import.meta.env.VITE_APP_URL as string | undefined)?.replace(/\/$/, '') ?? window.location.origin

async function createGymAndCoach(userId: string, gymName: string, country: string, fullName: string) {
  const { data: gymData, error: gymError } = await supabase
    .from('gyms')
    .insert({ name: gymName, country })
    .select('id')
    .single()
  if (gymError) throw gymError

  const { error: coachError } = await supabase.from('coaches').insert({
    id: userId,
    gym_id: gymData.id,
    full_name: fullName,
    role: 'admin',
  })
  if (coachError) throw coachError
}

export default function Setup() {
  const { t } = useTranslation()
  const [checking, setChecking] = useState(true)
  const [confirmationSent, setConfirmationSent] = useState(false)
  const [completing, setCompleting] = useState(false)
  // True when an existing auth user (no gym yet) is completing setup
  const [existingAuthUser, setExistingAuthUser] = useState<string | null>(null)

  const [gymName, setGymName] = useState('')
  const [country, setCountry] = useState('USA')
  const [fullName, setFullName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      if (cancelled) return
      if (!session) { setChecking(false); return }

      const meta = session.user.user_metadata
      if (meta?.pending_gym_name) {
        // User confirmed email — check if setup already completed
        const { data: existingCoach } = await supabase
          .from('coaches').select('id').eq('id', session.user.id).single()

        if (existingCoach) {
          window.location.replace('/dashboard')
          return
        }

        // Complete the gym setup now
        if (!cancelled) setCompleting(true)
        try {
          await createGymAndCoach(
            session.user.id,
            meta.pending_gym_name,
            meta.pending_gym_country ?? 'USA',
            meta.full_name ?? '',
          )
          window.location.replace('/dashboard')
        } catch {
          if (!cancelled) {
            setError('Setup could not be completed. Please try again or contact support.')
            setChecking(false)
            setCompleting(false)
          }
        }
      } else {
        // Authenticated but no pending gym metadata — check if they already have a gym
        const { data: existingCoach } = await supabase
          .from('coaches').select('id').eq('id', session.user.id).single()

        if (existingCoach) {
          // Already fully set up → go to dashboard
          window.location.replace('/dashboard')
        } else {
          // Authenticated but no gym — let them complete setup inline
          if (!cancelled) {
            setExistingAuthUser(session.user.id)
            setFullName(meta?.full_name ?? '')
            setChecking(false)
          }
        }
      }
    })
    return () => { cancelled = true }
  }, [])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (saving) return
    setError(null)
    setSaving(true)
    try {
      // Already authenticated user (e.g. came from "Account not linked" screen)
      if (existingAuthUser) {
        try {
          await createGymAndCoach(existingAuthUser, gymName.trim(), country, fullName.trim())
          window.location.replace('/dashboard')
        } catch (err: any) {
          setError(err?.message ?? 'Failed to create gym. Please try again.')
        }
        return
      }

      const { data: authData, error: signUpError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: `${SITE_URL}/setup`,
          data: {
            full_name: fullName.trim(),
            pending_gym_name: gymName.trim(),
            pending_gym_country: country,
          },
        },
      })
      if (signUpError) { setError(signUpError.message); return }
      if (!authData.user) { setError('Signup failed. Please try again.'); return }

      if (authData.session) {
        // Email confirmation is off — create gym immediately
        try {
          await createGymAndCoach(authData.user.id, gymName.trim(), country, fullName.trim())
          window.location.replace('/dashboard')
        } catch (err: any) {
          setError(err?.message ?? 'Failed to create gym. Please try again.')
        }
      } else {
        // Email confirmation is on — show "check your email" screen
        setConfirmationSent(true)
        setEmail(email)
      }
    } finally {
      setSaving(false)
    }
  }

  if (checking || completing) return <Spinner />

  if (confirmationSent) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-surface px-4">
        <div className="w-full max-w-md rounded-lg bg-card p-8 shadow text-center">
          <div className="mb-4 text-5xl">📧</div>
          <h1 className="mb-2 text-xl font-extrabold text-violet-100">Check your email</h1>
          <p className="text-sm text-violet-400">
            We sent a confirmation link to{' '}
            <span className="font-semibold text-violet-200">{email}</span>.
          </p>
          <p className="mt-3 text-sm text-violet-400">
            Click the link in the email and your gym will be set up automatically.
          </p>
          <p className="mt-6 text-xs text-violet-600">
            Already confirmed?{' '}
            <a href="/setup" className="text-violet-400 hover:underline">
              Click here to finish setup
            </a>
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-surface px-4">
      <div className="w-full max-w-md rounded-lg bg-card p-8 shadow">
        <h1 className="mb-1 text-xl font-extrabold text-violet-100">
          {existingAuthUser ? 'Complete Your Gym Setup' : t('setup.title')}
        </h1>
        {!existingAuthUser && (
          <>
            <p className="mb-1 text-sm font-semibold text-orange-400">{t('setup.subtitle')}</p>
            <p className="mb-6 text-xs text-violet-400">{t('setup.description')}</p>
          </>
        )}
        {existingAuthUser && (
          <p className="mb-6 text-xs text-violet-400">
            Your account is confirmed. Just fill in your gym details to finish.
          </p>
        )}

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div className="border-b border-border pb-4">
            <p className="mb-3 text-xs font-bold uppercase tracking-widest text-violet-300">
              {t('setup.gymSection')}
            </p>
            <div className="flex flex-col gap-3">
              <div>
                <label className="mb-1 block text-xs font-semibold text-violet-300">
                  {t('setup.gymName')}
                </label>
                <input
                  type="text"
                  value={gymName}
                  onChange={e => setGymName(e.target.value)}
                  required
                  placeholder={t('setup.gymNamePlaceholder')}
                  className="w-full rounded border border-border bg-[#1a1728] px-3 py-2 text-sm text-violet-100 placeholder-violet-700 outline-none focus:border-orange-500"
                />
              </div>
              <div>
                <label className="mb-1 block text-xs font-semibold text-violet-300">
                  {t('setup.country')}
                </label>
                <select
                  value={country}
                  onChange={e => setCountry(e.target.value)}
                  className="w-full rounded border border-border bg-[#1a1728] px-3 py-2 text-sm text-violet-100 outline-none focus:border-orange-500"
                >
                  {COUNTRIES.map(c => (
                    <option key={c.code} value={c.code}>
                      {c.flag} {c.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          <div>
            <p className="mb-3 text-xs font-bold uppercase tracking-widest text-violet-300">
              {t('setup.adminSection')}
            </p>
            <div className="flex flex-col gap-3">
              <div>
                <label className="mb-1 block text-xs font-semibold text-violet-300">
                  {t('setup.fullName')}
                </label>
                <input
                  type="text"
                  value={fullName}
                  onChange={e => setFullName(e.target.value)}
                  required
                  placeholder={t('setup.fullNamePlaceholder')}
                  className="w-full rounded border border-border bg-[#1a1728] px-3 py-2 text-sm text-violet-100 placeholder-violet-700 outline-none focus:border-orange-500"
                />
              </div>
              {!existingAuthUser && (
                <>
                  <div>
                    <label className="mb-1 block text-xs font-semibold text-violet-300">
                      {t('setup.email')}
                    </label>
                    <input
                      type="email"
                      value={email}
                      onChange={e => setEmail(e.target.value)}
                      required
                      autoComplete="email"
                      placeholder={t('setup.emailPlaceholder')}
                      className="w-full rounded border border-border bg-[#1a1728] px-3 py-2 text-sm text-violet-100 placeholder-violet-700 outline-none focus:border-orange-500"
                    />
                  </div>
                  <div>
                    <label className="mb-1 block text-xs font-semibold text-violet-300">
                      {t('setup.password')}
                    </label>
                    <input
                      type="password"
                      value={password}
                      onChange={e => setPassword(e.target.value)}
                      required
                      minLength={6}
                      autoComplete="new-password"
                      className="w-full rounded border border-border bg-[#1a1728] px-3 py-2 text-sm text-violet-100 outline-none focus:border-orange-500"
                    />
                  </div>
                </>
              )}
            </div>
          </div>

          {error && (
            <p className="rounded bg-red-900/30 px-3 py-2 text-xs text-red-400">{error}</p>
          )}

          <button
            type="submit"
            disabled={saving}
            className="rounded bg-gradient-to-r from-orange-500 to-pink-500 py-2 text-sm font-semibold text-white hover:opacity-90 disabled:opacity-50"
          >
            {saving ? t('setup.submitting') : t('setup.submit')}
          </button>
        </form>

        <p className="mt-4 text-center text-xs text-violet-600">
          {t('setup.signInLink')}{' '}
          <a href="/login" className="text-violet-400 hover:underline">
            {t('setup.signInLinkCta')}
          </a>
        </p>
      </div>
    </div>
  )
}
