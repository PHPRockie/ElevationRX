import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { supabase } from '../lib/supabase'
import { useAuth } from '../hooks/useAuth'

export default function Login() {
  const navigate = useNavigate()
  const { user, loading: authLoading } = useAuth()
  const { t } = useTranslation()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (!authLoading && user) navigate('/dashboard', { replace: true })
  }, [user, authLoading, navigate])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    setLoading(true)
    const { error: authError } = await supabase.auth.signInWithPassword({ email, password })
    if (authError) {
      setError(t('login.error'))
    }
    setLoading(false)
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-surface">
      <div className="w-full max-w-sm rounded-lg bg-card p-8 shadow">
        <h1 className="mb-1 text-xl font-extrabold text-violet-100">{t('login.title')}</h1>
        <p className="mb-6 text-sm text-violet-400">{t('login.subtitle')}</p>
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div>
            <label htmlFor="login-email" className="mb-1 block text-xs font-semibold text-violet-300">
              {t('login.email')}
            </label>
            <input
              id="login-email"
              type="email"
              autoComplete="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              required
              className="w-full rounded border border-border bg-[#1a1728] px-3 py-2 text-sm outline-none focus:border-orange-500"
              placeholder={t('login.emailPlaceholder')}
            />
          </div>
          <div>
            <label htmlFor="login-password" className="mb-1 block text-xs font-semibold text-violet-300">
              {t('login.password')}
            </label>
            <input
              id="login-password"
              type="password"
              autoComplete="current-password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              required
              className="w-full rounded border border-border bg-[#1a1728] px-3 py-2 text-sm outline-none focus:border-orange-500"
            />
          </div>
          {error && <p className="text-xs text-red-500">{error}</p>}
          <button
            type="submit"
            disabled={loading}
            className="rounded bg-orange-500 py-2 text-sm font-semibold text-white hover:bg-orange-600 disabled:opacity-50"
          >
            {loading ? t('login.submitting') : t('login.submit')}
          </button>
        </form>
        <p className="mt-4 text-center text-xs text-violet-400">{t('login.contactAdmin')}</p>
        <p className="mt-2 text-center text-xs text-violet-600">
          {t('login.setupLink')}{' '}
          <a href="/setup" className="text-violet-400 hover:underline">
            {t('login.setupLinkCta')}
          </a>
        </p>
      </div>
    </div>
  )
}
