import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { useAthletes } from '../hooks/useAthletes'
import { countryByCode } from '../lib/countries'
import AddAthleteModal from '../components/AddAthleteModal'
import Spinner from '../components/Spinner'

export default function AthleteList() {
  const navigate = useNavigate()
  const { athletes, loading, addAthlete } = useAthletes()
  const { t } = useTranslation()
  const [showAdd, setShowAdd] = useState(false)

  if (loading) return <Spinner />

  return (
    <div className="h-full overflow-auto p-6">
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

      {athletes.length === 0 ? (
        <p className="text-sm text-violet-400">{t('athletes.noAthletes')}</p>
      ) : (
        <div className="overflow-hidden rounded-lg border border-border bg-card">
          <table className="w-full text-sm">
            <thead className="bg-[#1a1728] text-xs font-semibold uppercase text-violet-400">
              <tr>
                <th className="px-4 py-3 text-left">{t('athletes.colName')}</th>
                <th className="px-4 py-3 text-left">{t('athletes.colLevel')}</th>
                <th className="px-4 py-3 text-left">{t('athletes.colCountry')}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {athletes.map(athlete => {
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
      )}

      {showAdd && (
        <AddAthleteModal
          onSave={async data => {
            await addAthlete(data)
            setShowAdd(false)
          }}
          onClose={() => setShowAdd(false)}
        />
      )}
    </div>
  )
}
