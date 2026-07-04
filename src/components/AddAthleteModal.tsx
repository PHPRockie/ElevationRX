import { useState } from 'react'
import { COUNTRIES } from '../lib/countries'

interface Props {
  onSave: (data: { full_name: string; level: string; country: string }) => Promise<void>
  onClose: () => void
}

export default function AddAthleteModal({ onSave, onClose }: Props) {
  const [fullName, setFullName] = useState('')
  const [level, setLevel] = useState('')
  const [country, setCountry] = useState(COUNTRIES[0].code)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    setSaving(true)
    try {
      await onSave({ full_name: fullName.trim(), level: level.trim(), country })
    } catch {
      setError('Failed to save. Please try again.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="add-athlete-title"
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40"
      onKeyDown={e => e.key === 'Escape' && onClose()}
    >
      <div className="w-full max-w-sm rounded-lg bg-white p-6 shadow-lg">
        <h2 id="add-athlete-title" className="mb-4 text-base font-bold text-slate-900">Add athlete</h2>
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div>
            <label htmlFor="add-fullname" className="mb-1 block text-xs font-semibold text-slate-600">Full name</label>
            <input
              id="add-fullname"
              type="text"
              value={fullName}
              onChange={e => setFullName(e.target.value)}
              required
              className="w-full rounded border border-slate-200 px-3 py-2 text-sm outline-none focus:border-indigo-500"
              placeholder="Ana González"
            />
          </div>
          <div>
            <label htmlFor="add-level" className="mb-1 block text-xs font-semibold text-slate-600">Level</label>
            <input
              id="add-level"
              type="text"
              value={level}
              onChange={e => setLevel(e.target.value)}
              required
              className="w-full rounded border border-slate-200 px-3 py-2 text-sm outline-none focus:border-indigo-500"
              placeholder="Elite, Junior, Age Group…"
            />
          </div>
          <div>
            <label htmlFor="add-country" className="mb-1 block text-xs font-semibold text-slate-600">Country</label>
            <select
              id="add-country"
              value={country}
              onChange={e => setCountry(e.target.value)}
              className="w-full rounded border border-slate-200 px-3 py-2 text-sm outline-none focus:border-indigo-500"
            >
              {COUNTRIES.map(c => (
                <option key={c.code} value={c.code}>
                  {c.flag} {c.name} ({c.code})
                </option>
              ))}
            </select>
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
              {saving ? 'Saving…' : 'Save'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
