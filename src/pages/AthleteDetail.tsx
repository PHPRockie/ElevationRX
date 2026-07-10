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
  const [itRoutines, setItRoutines] = useState<RoutineSummary[]>([])
  const [dmtRoutines, setDmtRoutines] = useState<RoutineSummary[]>([])
  const [loading, setLoading] = useState(true)
  const [fetchError, setFetchError] = useState<string | null>(null)
  const [deleteError, setDeleteError] = useState<string | null>(null)
  const [showEdit, setShowEdit] = useState(false)

  function computeSummaries(routs: any[]): RoutineSummary[] {
    return routs.map((r: any) => {
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
  }

  const loadData = useCallback(async () => {
    if (!athleteId) return
    setFetchError(null)
    setLoading(true)
    try {
      const { data: ath, error: athError } = await supabase
        .from('athletes').select('*').eq('id', athleteId).single()
      if (athError) { setFetchError('Failed to load athlete.'); return }
      setAthlete(ath)

      const { data: routs, error: routsError } = await supabase
        .from('routines')
        .select('*, routine_skills(selected_form, skills(dd_tuck, dd_pike, dd_straight))')
        .eq('athlete_id', athleteId)
        .order('routine_number')

      if (routs && !routsError) {
        setItRoutines(computeSummaries(routs.filter((r: any) => r.discipline === 'individual' || !r.discipline)))
        setDmtRoutines(computeSummaries(routs.filter((r: any) => r.discipline === 'dmt')))
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
  if (!athlete) return <div className="p-6 text-sm text-violet-400">Athlete not found.</div>

  const country = countryByCode(athlete.country)

  return (
    <div className="h-full overflow-auto p-4 md:p-6">
      <Link to="/athletes" className="mb-4 inline-flex items-center gap-1 text-sm text-orange-500 hover:underline">
        ← Athletes
      </Link>

      {deleteError && <p className="mb-4 text-xs text-red-500">{deleteError}</p>}

      {/* Header — stacks on mobile, side-by-side on desktop */}
      <div className="mb-6 flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
        <div>
          <h1 className="text-xl font-bold text-violet-100">{athlete.full_name}</h1>
          <p className="text-sm text-violet-400">
            {athlete.level}
            {country && ` · ${country.flag} ${country.name}`}
            {gym && ` · ${gym.name}`}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => setShowEdit(true)}
            className="rounded border border-border px-3 py-1.5 text-sm text-violet-300 hover:bg-[#1a1728]"
          >
            Edit
          </button>
          <button
            type="button"
            onClick={handleDelete}
            className="rounded border border-red-900 px-3 py-1.5 text-sm text-red-500 hover:bg-red-900/20"
          >
            Delete
          </button>
          <button
            type="button"
            onClick={() => navigate(`/athletes/${athlete.id}/routines/new`)}
            className="rounded bg-blue-600 px-3 py-1.5 text-sm font-semibold text-white hover:bg-blue-700"
          >
            + TRA Routine
          </button>
          <button
            type="button"
            onClick={() => navigate(`/athletes/${athlete.id}/dmt/new`)}
            className="rounded bg-emerald-600 px-3 py-1.5 text-sm font-semibold text-white hover:bg-emerald-700"
          >
            + DMT Routine
          </button>
        </div>
      </div>

      {/* Individual Trampoline routines */}
      <h2 className="mb-3 text-sm font-bold text-violet-300">Individual Trampoline</h2>
      {itRoutines.length === 0 ? (
        <p className="mb-6 text-sm text-violet-400">No IT routines yet.</p>
      ) : (
        <div className="mb-6">
          <div className="flex flex-col gap-2 md:hidden">
            {itRoutines.map(r => (
              <button
                key={r.id}
                type="button"
                onClick={() => navigate(`/athletes/${athlete.id}/routines/${r.id}`)}
                className="flex items-center justify-between rounded-lg border border-border bg-card px-4 py-3 text-left hover:bg-[#1a1728] focus:outline-none focus:ring-2 focus:ring-orange-500"
              >
                <div>
                  <p className="font-medium text-violet-100">Routine #{r.routine_number}</p>
                  <p className="text-xs text-violet-400">{r.skill_count} / 10 skills</p>
                </div>
                <span className="text-sm font-bold text-orange-500">DD {r.total_dd.toFixed(1)}</span>
              </button>
            ))}
          </div>
          <div className="hidden overflow-hidden rounded-lg border border-border bg-card md:block">
            <table className="w-full text-sm">
              <thead className="bg-[#1a1728] text-xs font-semibold uppercase text-violet-400">
                <tr>
                  <th className="px-4 py-3 text-left">Routine</th>
                  <th className="px-4 py-3 text-left">Skills</th>
                  <th className="px-4 py-3 text-left">Total DD</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {itRoutines.map(r => (
                  <tr
                    key={r.id}
                    onClick={() => navigate(`/athletes/${athlete.id}/routines/${r.id}`)}
                    onKeyDown={e => (e.key === 'Enter' || e.key === ' ') && navigate(`/athletes/${athlete.id}/routines/${r.id}`)}
                    tabIndex={0}
                    role="link"
                    className="cursor-pointer hover:bg-[#1a1728] focus:outline-none focus:ring-2 focus:ring-inset focus:ring-orange-500"
                  >
                    <td className="px-4 py-3 font-medium text-violet-100">Routine #{r.routine_number}</td>
                    <td className="px-4 py-3 text-violet-400">{r.skill_count} / 10</td>
                    <td className="px-4 py-3 font-semibold text-orange-500">{r.total_dd.toFixed(1)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Double Mini Trampoline routines */}
      <h2 className="mb-3 text-sm font-bold text-violet-300">Double Mini Trampoline</h2>
      {dmtRoutines.length === 0 ? (
        <p className="text-sm text-violet-400">No DMT routines yet.</p>
      ) : (
        <>
          <div className="flex flex-col gap-2 md:hidden">
            {dmtRoutines.map(r => (
              <button
                key={r.id}
                type="button"
                onClick={() => navigate(`/athletes/${athlete.id}/dmt/${r.id}`)}
                className="flex items-center justify-between rounded-lg border border-border bg-card px-4 py-3 text-left hover:bg-[#1a1728] focus:outline-none focus:ring-2 focus:ring-orange-500"
              >
                <div>
                  <p className="font-medium text-violet-100">Routine #{r.routine_number}</p>
                  <p className="text-xs text-violet-400">{r.skill_count} / 8 skills · 4 passes</p>
                </div>
                <span className="text-sm font-bold text-orange-500">DD {r.total_dd.toFixed(1)}</span>
              </button>
            ))}
          </div>
          <div className="hidden overflow-hidden rounded-lg border border-border bg-card md:block">
            <table className="w-full text-sm">
              <thead className="bg-[#1a1728] text-xs font-semibold uppercase text-violet-400">
                <tr>
                  <th className="px-4 py-3 text-left">Routine</th>
                  <th className="px-4 py-3 text-left">Passes</th>
                  <th className="px-4 py-3 text-left">Total DD</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {dmtRoutines.map(r => (
                  <tr
                    key={r.id}
                    onClick={() => navigate(`/athletes/${athlete.id}/dmt/${r.id}`)}
                    onKeyDown={e => (e.key === 'Enter' || e.key === ' ') && navigate(`/athletes/${athlete.id}/dmt/${r.id}`)}
                    tabIndex={0}
                    role="link"
                    className="cursor-pointer hover:bg-[#1a1728] focus:outline-none focus:ring-2 focus:ring-inset focus:ring-orange-500"
                  >
                    <td className="px-4 py-3 font-medium text-violet-100">Routine #{r.routine_number}</td>
                    <td className="px-4 py-3 text-violet-400">{Math.ceil(r.skill_count / 2)} / 4</td>
                    <td className="px-4 py-3 font-semibold text-orange-500">{r.total_dd.toFixed(1)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
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
