import { useState } from 'react'
import type { Invitation } from '../types/database'

interface Props {
  onCreate: (email: string, fullName: string) => Promise<Invitation>
  onClose: () => void
}

export default function InviteCoachModal({ onCreate, onClose }: Props) {
  const [email, setEmail] = useState('')
  const [fullName, setFullName] = useState('')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [createdInvite, setCreatedInvite] = useState<Invitation | null>(null)
  const [copied, setCopied] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    setSaving(true)
    try {
      const invite = await onCreate(email.trim(), fullName.trim())
      setCreatedInvite(invite)
    } catch {
      setError('Failed to create invite. Please try again.')
    } finally {
      setSaving(false)
    }
  }

  const inviteUrl = createdInvite
    ? `${window.location.origin}/accept-invite?token=${createdInvite.token}`
    : ''

  async function handleCopy() {
    await navigator.clipboard.writeText(inviteUrl)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="invite-coach-title"
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40"
      onKeyDown={e => e.key === 'Escape' && onClose()}
    >
      <div className="w-full max-w-sm rounded-lg bg-white p-6 shadow-lg">
        {!createdInvite ? (
          <>
            <h2 id="invite-coach-title" className="mb-4 text-base font-bold text-slate-900">
              Invite coach
            </h2>
            <form onSubmit={handleSubmit} className="flex flex-col gap-4">
              <div>
                <label htmlFor="invite-email" className="mb-1 block text-xs font-semibold text-slate-600">
                  Email
                </label>
                <input
                  id="invite-email"
                  type="email"
                  autoComplete="email"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  required
                  className="w-full rounded border border-slate-200 px-3 py-2 text-sm outline-none focus:border-indigo-500"
                  placeholder="coach@example.com"
                />
              </div>
              <div>
                <label htmlFor="invite-name" className="mb-1 block text-xs font-semibold text-slate-600">
                  Full name
                </label>
                <input
                  id="invite-name"
                  type="text"
                  value={fullName}
                  onChange={e => setFullName(e.target.value)}
                  required
                  className="w-full rounded border border-slate-200 px-3 py-2 text-sm outline-none focus:border-indigo-500"
                  placeholder="Jane Smith"
                />
              </div>
              {error && <p className="text-xs text-red-500">{error}</p>}
              <div className="flex gap-2 pt-1">
                <button
                  type="button"
                  onClick={onClose}
                  disabled={saving}
                  className="flex-1 rounded border border-slate-200 py-2 text-sm text-slate-600 hover:bg-slate-50 disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="flex-1 rounded bg-indigo-600 py-2 text-sm font-semibold text-white hover:bg-indigo-700 disabled:opacity-50"
                >
                  {saving ? 'Creating…' : 'Create invite'}
                </button>
              </div>
            </form>
          </>
        ) : (
          <>
            <h2 id="invite-coach-title" className="mb-2 text-base font-bold text-slate-900">
              Invite created
            </h2>
            <p className="mb-3 text-sm text-slate-500">
              Share this link with {createdInvite.full_name}:
            </p>
            <div className="mb-4 rounded border border-slate-200 bg-slate-50 px-3 py-2">
              <span className="break-all font-mono text-xs text-slate-700">{inviteUrl}</span>
            </div>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={handleCopy}
                className="flex-1 rounded border border-slate-200 py-2 text-sm text-slate-600 hover:bg-slate-50"
              >
                {copied ? '✓ Copied!' : 'Copy link'}
              </button>
              <button
                type="button"
                onClick={onClose}
                className="flex-1 rounded bg-indigo-600 py-2 text-sm font-semibold text-white hover:bg-indigo-700"
              >
                Done
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  )
}
