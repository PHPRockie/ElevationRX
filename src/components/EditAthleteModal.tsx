import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { COUNTRIES } from '../lib/countries'
import { ATHLETE_LEVELS } from '../lib/compulsoryRoutines'
import type { Athlete } from '../types/database'

interface Props {
  athlete: Athlete
  onSave: (data: { full_name: string; level: string; country: string }) => Promise<void>
  onClose: () => void
}

export default function EditAthleteModal({ athlete, onSave, onClose }: Props) {
  const { t } = useTranslation()
  const [fullName, setFullName] = useState(athlete.full_name)
  const [level, setLevel] = useState(athlete.level)
  const [country, setCountry] = useState(athlete.country)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    setSaving(true)
    try {
      await onSave({ full_name: fullName.trim(), level: level.trim(), country })
    } catch {
      setError(t('editAthleteModal.error'))
    } finally {
      setSaving(false)
    }
  }

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="edit-athlete-title"
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40"
      onKeyDown={e => e.key === 'Escape' && onClose()}
    >
      <div className="mx-4 w-full max-w-sm rounded-lg bg-card p-6 shadow-lg">
        <h2 id="edit-athlete-title" className="mb-4 text-base font-bold text-violet-100">
          {t('editAthleteModal.title')}
        </h2>
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div>
            <label htmlFor="edit-fullname" className="mb-1 block text-xs font-semibold text-violet-300">
              {t('editAthleteModal.fullName')}
            </label>
            <input
              id="edit-fullname"
              type="text"
              value={fullName}
              onChange={e => setFullName(e.target.value)}
              required
              className="w-full rounded border border-border bg-[#1a1728] px-3 py-2 text-sm text-violet-100 placeholder-violet-600 outline-none focus:border-orange-500"
            />
          </div>
          <div>
            <label htmlFor="edit-level" className="mb-1 block text-xs font-semibold text-violet-300">
              {t('editAthleteModal.level')}
            </label>
            <select
              id="edit-level"
              value={ATHLETE_LEVELS.some(l => l.value === level) ? level : ''}
              onChange={e => setLevel(e.target.value)}
              required
              className="w-full rounded border border-border bg-[#1a1728] px-3 py-2 text-sm text-violet-100 outline-none focus:border-orange-500"
            >
              <option value="" disabled>{athlete.level}</option>
              {ATHLETE_LEVELS.map(l => (
                <option key={l.value} value={l.value}>{l.label}</option>
              ))}
            </select>
          </div>
          <div>
            <label htmlFor="edit-country" className="mb-1 block text-xs font-semibold text-violet-300">
              {t('editAthleteModal.country')}
            </label>
            <select
              id="edit-country"
              value={country}
              onChange={e => setCountry(e.target.value)}
              className="w-full rounded border border-border bg-[#1a1728] px-3 py-2 text-sm text-violet-100 placeholder-violet-600 outline-none focus:border-orange-500"
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
              className="flex-1 rounded border border-border py-2 text-sm text-violet-300 hover:bg-[#1a1728] disabled:opacity-50"
            >
              {t('editAthleteModal.cancel')}
            </button>
            <button
              type="submit"
              disabled={saving}
              className="flex-1 rounded bg-orange-500 py-2 text-sm font-semibold text-white hover:bg-orange-600 disabled:opacity-50"
            >
              {saving ? t('editAthleteModal.saving') : t('editAthleteModal.save')}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
