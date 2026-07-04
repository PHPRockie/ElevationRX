import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAthletes } from '../hooks/useAthletes'
import { countryByCode } from '../lib/countries'
import AddAthleteModal from '../components/AddAthleteModal'
import Spinner from '../components/Spinner'

export default function AthleteList() {
  const navigate = useNavigate()
  const { athletes, loading, addAthlete } = useAthletes()
  const [showAdd, setShowAdd] = useState(false)

  if (loading) return <Spinner />

  return (
    <div className="h-full overflow-auto p-6">
      <div className="mb-4 flex items-center justify-between">
        <h1 className="text-lg font-bold text-slate-900">Athletes</h1>
        <button
          type="button"
          onClick={() => setShowAdd(true)}
          className="rounded bg-indigo-600 px-3 py-1.5 text-sm font-semibold text-white hover:bg-indigo-700"
        >
          + Add athlete
        </button>
      </div>

      {athletes.length === 0 ? (
        <p className="text-sm text-slate-400">No athletes yet. Add one to get started.</p>
      ) : (
        <div className="overflow-hidden rounded-lg border border-slate-200 bg-white">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 text-xs font-semibold uppercase text-slate-500">
              <tr>
                <th className="px-4 py-3 text-left">Name</th>
                <th className="px-4 py-3 text-left">Level</th>
                <th className="px-4 py-3 text-left">Country</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {athletes.map(athlete => {
                const country = countryByCode(athlete.country)
                return (
                  <tr
                    key={athlete.id}
                    onClick={() => navigate(`/athletes/${athlete.id}`)}
                    className="cursor-pointer hover:bg-slate-50"
                  >
                    <td className="px-4 py-3 font-medium text-slate-900">{athlete.full_name}</td>
                    <td className="px-4 py-3 text-slate-500">{athlete.level}</td>
                    <td className="px-4 py-3 text-slate-500">
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
