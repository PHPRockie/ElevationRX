import { useState, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { useAthletes } from '../hooks/useAthletes'
import { countryByCode } from '../lib/countries'
import AddAthleteModal from '../components/AddAthleteModal'
import { AthleteListSkeleton } from '../components/Skeleton'

type ViewMode = 'list' | 'grid'

const AVATAR_COLORS = [
  ['rgba(249,115,22,.15)', '#f97316'],
  ['rgba(167,139,250,.15)', '#a78bfa'],
  ['rgba(52,211,153,.15)', '#34d399'],
  ['rgba(251,191,36,.15)', '#fbbf24'],
  ['rgba(96,165,250,.15)', '#60a5fa'],
  ['rgba(251,113,133,.15)', '#fb7185'],
]

export default function AthleteList() {
  const navigate = useNavigate()
  const { athletes, loading, addAthlete } = useAthletes()
  const { t } = useTranslation()
  const [showAdd, setShowAdd] = useState(false)
  const [search, setSearch] = useState('')
  const [viewMode, setViewMode] = useState<ViewMode>('list')

  const filtered = useMemo(() => {
    const q = search.toLowerCase().trim()
    if (!q) return athletes
    return athletes.filter(a =>
      a.full_name.toLowerCase().includes(q) ||
      a.level?.toLowerCase().includes(q) ||
      a.country?.toLowerCase().includes(q)
    )
  }, [athletes, search])

  if (loading) return (
    <div className="p-4 md:p-6">
      <div className="mb-4 flex items-center justify-between">
        <h1 className="text-lg font-bold text-violet-100">{t('athletes.title')}</h1>
      </div>
      <AthleteListSkeleton />
    </div>
  )

  return (
    <div className="h-full overflow-auto p-4 md:p-6">
      {/* Header */}
      <div className="mb-4 flex items-center justify-between">
        <h1 className="text-lg font-bold text-violet-100">{t('athletes.title')}</h1>
        <button
          type="button"
          onClick={() => setShowAdd(true)}
          className="rounded bg-orange-500 px-3 py-1.5 text-sm font-semibold text-white hover:bg-orange-600"
        >
          {t('athletes.addButton')}
        </button>
      </div>

      {/* Search + view toggle */}
      <div className="mb-4 flex items-center gap-2">
        <input
          type="text"
          placeholder="Search athletes…"
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="flex-1 rounded-lg border border-border bg-card px-3 py-2 text-sm text-violet-100 placeholder-violet-600 outline-none focus:border-orange-500"
        />
        <button
          type="button"
          onClick={() => setViewMode(v => v === 'list' ? 'grid' : 'list')}
          title={viewMode === 'list' ? 'Grid view' : 'List view'}
          className="rounded-lg border border-border bg-card px-3 py-2 text-sm text-violet-400 hover:bg-[#1a1728] hover:text-violet-100"
        >
          {viewMode === 'list' ? '⊞' : '☰'}
        </button>
      </div>

      {filtered.length === 0 ? (
        <p className="text-sm text-violet-400">
          {search ? 'No athletes match your search.' : t('athletes.noAthletes')}
        </p>
      ) : viewMode === 'grid' ? (
        /* ── Grid view ── */
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
          {filtered.map((athlete, i) => {
            const country = countryByCode(athlete.country)
            const [bg, fg] = AVATAR_COLORS[i % AVATAR_COLORS.length]
            const initials = athlete.full_name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()
            return (
              <button
                key={athlete.id}
                type="button"
                onClick={() => navigate(`/athletes/${athlete.id}`)}
                className="flex flex-col items-center rounded-xl border border-border bg-card p-4 text-center hover:bg-[#1a1728] focus:outline-none focus:ring-2 focus:ring-orange-500"
              >
                <div
                  className="mb-3 flex h-12 w-12 items-center justify-center rounded-full text-base font-bold"
                  style={{ background: bg, color: fg }}
                >
                  {initials}
                </div>
                <p className="w-full truncate text-sm font-semibold text-violet-100">{athlete.full_name}</p>
                <p className="mt-0.5 text-xs text-violet-400">{athlete.level}</p>
                {country && <p className="mt-1 text-sm">{country.flag}</p>}
              </button>
            )
          })}
        </div>
      ) : (
        <>
          {/* ── Mobile card list ── */}
          <div className="flex flex-col gap-2 md:hidden">
            {filtered.map((athlete, i) => {
              const country = countryByCode(athlete.country)
              const [bg, fg] = AVATAR_COLORS[i % AVATAR_COLORS.length]
              const initials = athlete.full_name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()
              return (
                <button
                  key={athlete.id}
                  type="button"
                  onClick={() => navigate(`/athletes/${athlete.id}`)}
                  className="flex items-center gap-3 rounded-lg border border-border bg-card px-4 py-3 text-left hover:bg-[#1a1728] focus:outline-none focus:ring-2 focus:ring-orange-500"
                >
                  <div
                    className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full text-sm font-bold"
                    style={{ background: bg, color: fg }}
                  >
                    {initials}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="truncate font-medium text-violet-100">{athlete.full_name}</p>
                    <p className="text-xs text-violet-400">{athlete.level}</p>
                  </div>
                  <span className="text-sm text-violet-400">
                    {country ? country.flag : athlete.country}
                  </span>
                </button>
              )
            })}
          </div>

          {/* ── Desktop table ── */}
          <div className="hidden overflow-hidden rounded-lg border border-border bg-card md:block">
            <table className="w-full text-sm">
              <thead className="bg-[#1a1728] text-xs font-semibold uppercase text-violet-400">
                <tr>
                  <th className="px-4 py-3 text-left">{t('athletes.colName')}</th>
                  <th className="px-4 py-3 text-left">{t('athletes.colLevel')}</th>
                  <th className="px-4 py-3 text-left">{t('athletes.colCountry')}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {filtered.map(athlete => {
                  const country = countryByCode(athlete.country)
                  return (
                    <tr
                      key={athlete.id}
                      onClick={() => navigate(`/athletes/${athlete.id}`)}
                      onKeyDown={e => (e.key === 'Enter' || e.key === ' ') && navigate(`/athletes/${athlete.id}`)}
                      tabIndex={0}
                      role="link"
                      className="cursor-pointer hover:bg-[#1a1728] focus:outline-none focus:ring-2 focus:ring-inset focus:ring-orange-500"
                    >
                      <td className="px-4 py-3 font-medium text-violet-100">{athlete.full_name}</td>
                      <td className="px-4 py-3 text-violet-400">{athlete.level}</td>
                      <td className="px-4 py-3 text-violet-400">
                        {country ? `${country.flag} ${country.name}` : athlete.country}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </>
      )}

      {showAdd && (
        <AddAthleteModal
          onSave={async data => {
            const id = await addAthlete(data)
            setShowAdd(false)
            navigate(`/athletes/${id}`)
          }}
          onClose={() => setShowAdd(false)}
        />
      )}
    </div>
  )
}
