import { Link } from 'react-router-dom'
import { useCoach } from '../contexts/CoachContext'
import { useDashboard } from '../hooks/useDashboard'
import { countryByCode } from '../lib/countries'
import Spinner from '../components/Spinner'

export default function Dashboard() {
  const { coach, gym } = useCoach()
  const { athleteCount, recentAthletes, loading } = useDashboard()

  const firstName = coach?.full_name.split(' ')[0] ?? ''

  if (loading) return <Spinner />

  return (
    <div className="h-full overflow-auto p-6">
      <h1 className="mb-1 text-xl font-bold text-slate-900">
        Welcome back, {firstName} 👋
      </h1>
      <p className="mb-6 text-sm text-slate-400">
        {gym?.name}
        {gym?.country ? ` · ${gym.country}` : ''}
      </p>

      <div className="mb-6 w-40 rounded-lg border border-slate-200 bg-white p-4">
        <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-slate-400">
          Athletes
        </p>
        <p className="text-3xl font-extrabold leading-none text-slate-900">{athleteCount}</p>
        <p className="mt-1 text-xs text-slate-400">in your gym</p>
      </div>

      <h2 className="mb-2 text-sm font-bold text-slate-700">Recent athletes</h2>
      {recentAthletes.length === 0 ? (
        <p className="text-sm text-slate-400">No athletes yet.</p>
      ) : (
        <>
          <div className="overflow-hidden rounded-lg border border-slate-200 bg-white">
            {recentAthletes.map((athlete, i) => {
              const country = countryByCode(athlete.country)
              return (
                <Link
                  key={athlete.id}
                  to={`/athletes/${athlete.id}`}
                  className={`flex items-center justify-between px-4 py-3 text-sm hover:bg-slate-50 ${
                    i < recentAthletes.length - 1 ? 'border-b border-slate-100' : ''
                  }`}
                >
                  <span className="font-medium text-slate-900">{athlete.full_name}</span>
                  <span className="text-slate-400">
                    {athlete.level}
                    {country && ` · ${country.flag}`}
                  </span>
                </Link>
              )
            })}
          </div>
          <Link to="/athletes" className="mt-2 block text-xs text-indigo-600 hover:underline">
            View all athletes →
          </Link>
        </>
      )}
    </div>
  )
}
