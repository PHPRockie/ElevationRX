import { useState, useRef, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import type { Invitation } from '../types/database'

interface Props {
  onCreate: (email: string, fullName: string) => Promise<Invitation>
  onClose: () => void
}

export default function InviteCoachModal({ onCreate, onClose }: Props) {
  const { t } = useTranslation()
  const [email, setEmail] = useState('')
  const [fullName, setFullName] = useState('')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [createdInvite, setCreatedInvite] = useState<Invitation | null>(null)
  const [copied, setCopied] = useState(false)
  const copyTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    return () => {
      if (copyTimeoutRef.current) clearTimeout(copyTimeoutRef.current)
    }
  }, [])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    setSaving(true)
    try {
      const invite = await onCreate(email.trim(), fullName.trim())
      setCreatedInvite(invite)
    } catch {
      setError(t('inviteModal.error'))
    } finally {
      setSaving(false)
    }
  }

  const baseUrl = (import.meta.env.VITE_APP_URL as string | undefined)?.replace(/\/$/, '') ?? window.location.origin
  const inviteUrl = createdInvite
    ? `${baseUrl}/accept-invite?token=${createdInvite.token}`
    : ''

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(inviteUrl)
      setCopied(true)
      copyTimeoutRef.current = setTimeout(() => setCopied(false), 2000)
    } catch {
      // Clipboard access denied — user can copy the URL manually
    }
  }

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="invite-coach-title"
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40"
      onKeyDown={e => e.key === 'Escape' && onClose()}
    >
      <div className="mx-4 w-full max-w-sm rounded-lg bg-card p-6 shadow-lg">
        {!createdInvite ? (
          <>
            <h2 id="invite-coach-title" className="mb-4 text-base font-bold text-violet-100">
              {t('inviteModal.title')}
            </h2>
            <form onSubmit={handleSubmit} className="flex flex-col gap-4">
              <div>
                <label htmlFor="invite-email" className="mb-1 block text-xs font-semibold text-violet-300">
                  {t('inviteModal.email')}
                </label>
                <input
                  id="invite-email"
                  type="email"
                  autoComplete="email"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  required
                  className="w-full rounded border border-border bg-[#1a1728] px-3 py-2 text-sm text-violet-100 placeholder-violet-600 outline-none focus:border-orange-500"
                  placeholder={t('inviteModal.emailPlaceholder')}
                />
              </div>
              <div>
                <label htmlFor="invite-name" className="mb-1 block text-xs font-semibold text-violet-300">
                  {t('inviteModal.fullName')}
                </label>
                <input
                  id="invite-name"
                  type="text"
                  value={fullName}
                  onChange={e => setFullName(e.target.value)}
                  required
                  className="w-full rounded border border-border bg-[#1a1728] px-3 py-2 text-sm text-violet-100 placeholder-violet-600 outline-none focus:border-orange-500"
                  placeholder={t('inviteModal.fullNamePlaceholder')}
                />
              </div>
              {error && <p className="text-xs text-red-500">{error}</p>}
              <div className="flex gap-2 pt-1">
                <button
                  type="button"
                  onClick={onClose}
                  disabled={saving}
                  className="flex-1 rounded border border-border py-2 text-sm text-violet-300 hover:bg-[#1a1728] disabled:opacity-50"
                >
                  {t('inviteModal.cancel')}
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="flex-1 rounded bg-orange-500 py-2 text-sm font-semibold text-white hover:bg-orange-600 disabled:opacity-50"
                >
                  {saving ? t('inviteModal.creating') : t('inviteModal.createInvite')}
                </button>
              </div>
            </form>
          </>
        ) : (
          <>
            <h2 id="invite-coach-title" className="mb-2 text-base font-bold text-violet-100">
              {t('inviteModal.createdTitle')}
            </h2>
            <p className="mb-3 text-sm text-violet-400">
              {t('inviteModal.createdDesc', { name: createdInvite.full_name })}
            </p>
            <div className="mb-4 rounded border border-border bg-[#1a1728] px-3 py-2">
              <span className="break-all font-mono text-xs text-violet-300">{inviteUrl}</span>
            </div>
            <div className="flex gap-2">
              <button
                type="button"
                aria-live="polite"
                onClick={handleCopy}
                className="flex-1 rounded border border-border py-2 text-sm text-violet-300 hover:bg-[#1a1728]"
              >
                {copied ? t('inviteModal.copied') : t('inviteModal.copyLink')}
              </button>
              <button
                type="button"
                onClick={onClose}
                className="flex-1 rounded bg-orange-500 py-2 text-sm font-semibold text-white hover:bg-orange-600"
              >
                {t('inviteModal.done')}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  )
}
