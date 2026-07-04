import { useCallback, useEffect, useState } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { useCoach } from '../contexts/CoachContext'
import { useAthletes } from '../hooks/useAthletes'
import { countryByCode } from '../lib/countries'
import EditAthleteModal from '../components/EditAthleteModal'
import Spinner from '../components/Spinner'
import type { Athlete, Routine } from '../types/database'

interface RoutineSummary extends Routine {
  skill_count: number
  total_dd: number
}

export default function AthleteDetail() {
  const { athleteId } = useParams<{ athleteId: string }>()
  const navigate = useNavigate()
  const { gym } = useCoach()
  const { updateAthlete, deleteAthlete } = useAthletes()

  const [athlete, setAthlete] = useState<Athlete | null>(null)
  const [routines, setRoutines] = useState<RoutineSummary[]>([])
  const [loading, setLoading] = useState(true)
  const [fetchError, setFetchError] = useState<string | null>(null)
  const [deleteError, setDeleteError] = useState<string | null>(null)
  const [showEdit, setShowEdit] = useState(false)

  const loadData = useCallback(async () => {
    if (!athleteId) return
    setFetchError(null)
    setLoading(true)
    try {
      const [{ data: ath, error: athError }, { data: routs, error: routsError }] = await Promise.all([
        supabase.from('athletes').select('*').eq('id', athleteId).single(),
        supabase
          .from('routines')
          .select('*, routine_skills(selected_form, skills(dd_tuck, dd_pike, dd_straight))')
          .eq('athlete_id', athleteId)
          .order('routine_number'),
      ])
      if (athError) { setFetchError('Failed to load athlete.'); return }
      setAthlete(ath)
      if (routs && !routsError) {
        const summaries: RoutineSummary[] = routs.map((r: any) => {
          const skillRows = r.routine_skills ?? []
          const total_dd = skillRows.reduce((sum: number, rs: any) => {
            const s = rs.skills
            if (!s) return sum
            const dd =
              rs.selected_form === 'tuck' ? s.dd_tuck :
              rs.selected_form === 'pike' ? s.dd_pike :
              rs.selected_form === 'straight' ? s.dd_straight : null
            return sum + (dd ?? 0)
          }, 0)
          const { routine_skills: _, ...routine } = r
          return { ...routine, skill_count: skillRows.length, total_dd }
        })
        setRoutines(summaries)
      }
    } catch {
      setFetchError('Failed to load data.')
    } finally {
      setLoading(false)
    }
  }, [athleteId])

  useEffect(() => { loadData() }, [loadData])

  async function handleDelete() {
    if (!athlete) return
    if (!window.confirm(`Delete ${athlete.full_name}? This cannot be undone.`)) return
    setDeleteError(null)
    try {
      await deleteAthlete(athlete.id)
      navigate('/athletes')
    } catch {
      setDeleteError('Failed to delete athlete. Please try again.')
    }
  }

  if (loading) return <Spinner />
  if (fetchError) return <div className="p-6 text-sm text-red-500">{fetchError}</div>
  if (!athlete) return <div className="p-6 text-sm text-slate-500">Athlete not found.</div>

  const country = countryByCode(athlete.country)

  return (
    <div className="h-full overflow-auto p-6">
      <Link to="/athletes" className="mb-4 inline-flex items-center gap-1 text-sm text-indigo-600 hover:underline">
        ← Athletes
      </Link>

      {deleteError && <p className="mb-4 text-xs text-red-500">{deleteError}</p>}

      <div className="mb-6 flex items-start justify-between">
        <div>
          <h1 className="text-xl font-bold text-slate-900">{athlete.full_name}</h1>
          <p className="text-sm text-slate-500">
            {athlete.level}
            {country && ` · ${country.flag} ${country.name}`}
            {gym && ` · ${gym.name}`}
          </p>
        </div>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => setShowEdit(true)}
            className="rounded border border-slate-200 px-3 py-1.5 text-sm text-slate-600 hover:bg-slate-50"
          >
            Edit
          </button>
          <button
            type="button"
            onClick={handleDelete}
            className="rounded border border-red-200 px-3 py-1.5 text-sm text-red-600 hover:bg-red-50"
          >
            Delete
          </button>
          <button
            type="button"
            onClick={() => navigate(`/athletes/${athlete.id}/routines/new`)}
            className="rounded bg-indigo-600 px-3 py-1.5 text-sm font-semibold text-white hover:bg-indigo-700"
          >
            + New routine
          </button>
        </div>
      </div>

      <h2 className="mb-3 text-sm font-bold text-slate-700">Routines</h2>
      {routines.length === 0 ? (
        <p className="text-sm text-slate-400">No routines yet. Create one above.</p>
      ) : (
        <div className="overflow-hidden rounded-lg border border-slate-200 bg-white">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 text-xs font-semibold uppercase text-slate-500">
              <tr>
                <th className="px-4 py-3 text-left">Routine</th>
                <th className="px-4 py-3 text-left">Skills</th>
                <th className="px-4 py-3 text-left">Total DD</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {routines.map(r => (
                <tr
                  key={r.id}
                  onClick={() => navigate(`/athletes/${athlete.id}/routines/${r.id}`)}
                  onKeyDown={e => (e.key === 'Enter' || e.key === ' ') && navigate(`/athletes/${athlete.id}/routines/${r.id}`)}
                  tabIndex={0}
                  role="link"
                  className="cursor-pointer hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-indigo-500"
                >
                  <td className="px-4 py-3 font-medium text-slate-900">Routine #{r.routine_number}</td>
                  <td className="px-4 py-3 text-slate-500">{r.skill_count} / 10</td>
                  <td className="px-4 py-3 font-semibold text-indigo-700">{r.total_dd.toFixed(1)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {showEdit && (
        <EditAthleteModal
          athlete={athlete}
          onSave={async data => {
            await updateAthlete(athlete.id, data)
            setAthlete(prev => (prev ? { ...prev, ...data } : prev))
            setShowEdit(false)
          }}
          onClose={() => setShowEdit(false)}
        />
      )}
    </div>
  )
}
