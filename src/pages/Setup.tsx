import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { supabase } from '../lib/supabase'
import { COUNTRIES } from '../lib/countries'
import Spinner from '../components/Spinner'

export default function Setup() {
  const navigate = useNavigate()
  const { t } = useTranslation()
  const [checking, setChecking] = useState(true)
  const [alreadyConfigured, setAlreadyConfigured] = useState(false)

  const [gymName, setGymName] = useState('')
  const [country, setCountry] = useState('USA')
  const [fullName, setFullName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false
    supabase
      .from('gyms')
      .select('id', { count: 'exact', head: true })
      .then(({ count }) => {
        if (cancelled) return
        if (count && count > 0) {
          setAlreadyConfigured(true)
          setChecking(false)
        } else {
          setChecking(false)
        }
      })
    return () => { cancelled = true }
  }, [navigate])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (saving) return
    setError(null)
    setSaving(true)
    try {
      const { data: authData, error: signUpError } = await supabase.auth.signUp({
        email,
        password,
        options: { data: { full_name: fullName.trim() } },
      })
      if (signUpError) { setError(signUpError.message); return }
      if (!authData.user || !authData.session) {
        setError(t('setup.errorEmailConfirmation'))
        return
      }

      const { data: gymData, error: gymError } = await supabase
        .from('gyms')
        .insert({ name: gymName.trim(), country })
        .select('id')
        .single()
      if (gymError) {
        setError(t('setup.errorGymExists'))
        return
      }

      const { error: coachError } = await supabase.from('coaches').insert({
        id: authData.user.id,
        gym_id: gymData.id,
        full_name: fullName.trim(),
        role: 'admin',
      })
      if (coachError) {
        setError('Gym created but admin profile setup failed: ' + coachError.message)
        return
      }

      navigate('/dashboard', { replace: true })
    } finally {
      setSaving(false)
    }
  }

  if (checking) return <Spinner />

  if (alreadyConfigured) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-surface px-4">
        <div className="w-full max-w-sm rounded-lg bg-card p-8 text-center shadow">
          <h1 className="mb-1 text-xl font-extrabold text-violet-100">ElevationRx</h1>
          <p className="mb-2 mt-4 font-semibold text-orange-400">Already configured</p>
          <p className="mb-6 text-sm text-violet-400">
            A gym is already set up on this app. Sign in with your coach account instead.
          </p>
          <a
            href="/login"
            className="inline-block rounded bg-orange-500 px-5 py-2 text-sm font-semibold text-white hover:bg-orange-600"
          >
            Go to sign in
          </a>
        </div>
      </div>
    )
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-surface px-4">
      <div className="w-full max-w-md rounded-lg bg-card p-8 shadow">
        <h1 className="mb-1 text-xl font-extrabold text-violet-100">{t('setup.title')}</h1>
        <p className="mb-1 text-sm font-semibold text-orange-400">{t('setup.subtitle')}</p>
        <p className="mb-6 text-xs text-violet-400">{t('setup.description')}</p>

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
