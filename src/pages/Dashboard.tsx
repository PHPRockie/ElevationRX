import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { useCoach } from '../contexts/CoachContext'
import { useDashboard } from '../hooks/useDashboard'
import { countryByCode } from '../lib/countries'
import Spinner from '../components/Spinner'

export default function Dashboard() {
  const { coach, gym } = useCoach()
  const { athleteCount, recentAthletes, loading, error } = useDashboard()
  const { t } = useTranslation()

  const firstName = coach?.full_name.split(' ')[0] ?? ''

  if (loading) return <Spinner />
  if (error) return <div className="p-6 text-sm text-red-500">{error}</div>

  return (
    <div className="h-full overflow-auto p-4 md:p-6">
      <h1 className="mb-1 text-lg font-bold text-violet-100 md:text-xl">
        {t('dashboard.welcome', { name: firstName })} <span aria-hidden="true">👋</span>
      </h1>
      <p className="mb-5 text-sm text-violet-400">
        {gym?.name}
        {gym?.country ? ` · ${countryByCode(gym.country)?.flag ?? ''} ${countryByCode(gym.country)?.name ?? gym.country}` : ''}
      </p>

      <div className="mb-6 w-36 rounded-lg border border-border bg-card p-4 md:w-40">
        <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-violet-400">
          {t('dashboard.athletes')}
        </p>
        <p className="text-3xl font-extrabold leading-none text-violet-100">{athleteCount}</p>
        <p className="mt-1 text-xs text-violet-400">{t('dashboard.inYourGym')}</p>
      </div>

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
  )
}
