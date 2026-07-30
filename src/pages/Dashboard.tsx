import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { useCoach } from '../contexts/CoachContext'
import { useDashboard } from '../hooks/useDashboard'
import { countryByCode } from '../lib/countries'
import Spinner from '../components/Spinner'

function timeAgo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime()
  const m = Math.floor(diff / 60000)
  if (m < 1) return 'just now'
  if (m < 60) return `${m}m ago`
  const h = Math.floor(m / 60)
  if (h < 24) return `${h}h ago`
  const d = Math.floor(h / 24)
  return `${d}d ago`
}

const DISC_LABEL: Record<string, string> = {
  individual: 'TRA',
  dmt: 'DMT',
}

export default function Dashboard() {
  const { coach, gym } = useCoach()
  const { athleteCount, routineCount, coachCount, recentAthletes, recentActivity, loading, error } = useDashboard()
  const { t } = useTranslation()

  const firstName = coach?.full_name.split(' ')[0] ?? ''

  if (loading) return <Spinner />
  if (error) return <div className="p-6 text-sm text-red-500">{error}</div>

  return (
    <div className="h-full overflow-auto p-4 md:p-6">
      <h1 className="mb-1 text-lg font-bold text-violet-100 md:text-xl">
        {t('dashboard.welcome', { name: firstName })} <span aria-hidden="true">👋</span>
      </h1>
      <p className="mb-6 text-sm text-violet-400">
        {gym?.name}
        {gym?.country ? ` · ${countryByCode(gym.country)?.flag ?? ''} ${countryByCode(gym.country)?.name ?? gym.country}` : ''}
      </p>

      {/* Stats row */}
      <div className="mb-8 grid grid-cols-3 gap-3 md:gap-4">
        <div className="rounded-lg border border-border bg-card p-4">
          <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-violet-400">
            {t('dashboard.athletes')}
          </p>
          <p className="text-3xl font-extrabold leading-none text-violet-100">{athleteCount}</p>
          <p className="mt-1 text-xs text-violet-500">{t('dashboard.inYourGym')}</p>
        </div>
        <div className="rounded-lg border border-border bg-card p-4">
          <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-violet-400">Routines</p>
          <p className="text-3xl font-extrabold leading-none text-orange-400">{routineCount}</p>
          <p className="mt-1 text-xs text-violet-500">TRA + DMT</p>
        </div>
        <div className="rounded-lg border border-border bg-card p-4">
          <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-violet-400">Team</p>
          <p className="text-3xl font-extrabold leading-none text-violet-100">{coachCount}</p>
          <p className="mt-1 text-xs text-violet-500">coaches</p>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Recent athletes */}
        <div>
          <h2 className="mb-2 text-sm font-bold text-violet-300">{t('dashboard.recentAthletes')}</h2>
          {recentAthletes.length === 0 ? (
            <p className="text-sm text-violet-400">{t('dashboard.noAthletes')}</p>
          ) : (
            <>
              <div className="overflow-hidden rounded-lg border border-border bg-card">
                {recentAthletes.map((athlete, i) => {
                  const country = countryByCode(athlete.country)
                  return (
                    <Link
                      key={athlete.id}
                      to={`/athletes/${athlete.id}`}
                      className={`flex items-center justify-between px-4 py-3 text-sm hover:bg-[#1a1728] focus:outline-none focus:ring-2 focus:ring-inset focus:ring-orange-500 ${
                        i < recentAthletes.length - 1 ? 'border-b border-border' : ''
                      }`}
                    >
                      <span className="font-medium text-violet-100">{athlete.full_name}</span>
                      <span className="text-violet-400">
                        {athlete.level}
                        {country && ` · ${country.flag}`}
                      </span>
                    </Link>
                  )
                })}
              </div>
              <Link to="/athletes" className="mt-2 block text-xs text-orange-500 hover:underline">
                {t('dashboard.viewAll')}
              </Link>
            </>
          )}
        </div>

        {/* Activity feed */}
        <div>
          <h2 className="mb-2 text-sm font-bold text-violet-300">Recent Activity</h2>
          {recentActivity.length === 0 ? (
            <p className="text-sm text-violet-400">No recent activity yet.</p>
          ) : (
            <div className="overflow-hidden rounded-lg border border-border bg-card">
              {recentActivity.map((item, i) => (
                <Link
                  key={item.id}
                  to={`/athletes/${item.athleteId}`}
                  className={`flex items-center gap-3 px-4 py-3 text-sm hover:bg-[#1a1728] focus:outline-none focus:ring-2 focus:ring-inset focus:ring-orange-500 ${
                    i < recentActivity.length - 1 ? 'border-b border-border' : ''
                  }`}
                >
                  <span className={`h-2 w-2 flex-shrink-0 rounded-full ${
                    item.discipline === 'dmt' ? 'bg-emerald-400' : 'bg-orange-400'
                  }`} />
                  <span className="flex-1 text-violet-300">
                    <span className="font-semibold text-violet-100">{item.athleteName}</span>
                    {' · '}Routine #{item.routineNumber}
                    {' '}
                    <span className={`text-xs font-semibold ${
                      item.discipline === 'dmt' ? 'text-emerald-500' : 'text-orange-500'
                    }`}>
                      {DISC_LABEL[item.discipline] ?? item.discipline.toUpperCase()}
                    </span>
                  </span>
                  <span className="flex-shrink-0 text-xs text-violet-600">{timeAgo(item.updatedAt)}</span>
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
