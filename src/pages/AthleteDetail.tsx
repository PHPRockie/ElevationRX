import { useCallback, useEffect, useState } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { useCoach } from '../contexts/CoachContext'
import { useAthletes } from '../hooks/useAthletes'
import { countryByCode } from '../lib/countries'
import EditAthleteModal from '../components/EditAthleteModal'
import Spinner from '../components/Spinner'
import type { Athlete, Routine } from '../types/database'
import { COMPULSORY_ROUTINES, DMT_COMPULSORY_ROUTINES, getCompulsoryLevel } from '../lib/compulsoryRoutines'

interface RoutineSummary extends Routine {
  skill_count: number
  total_dd: number
  pass_dds?: number[]
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

  function getSkillDd(rs: any): number {
    const s = rs.skills
    if (!s) return 0
    const dd =
      rs.selected_form === 'tuck' ? s.dd_tuck :
      rs.selected_form === 'pike' ? s.dd_pike :
      rs.selected_form === 'straight' ? s.dd_straight : null
    return dd ?? 0
  }

  function computeSummaries(routs: any[], isDmt = false): RoutineSummary[] {
    return routs.map((r: any) => {
      const skillRows = r.routine_skills ?? []
      const total_dd = skillRows.reduce((sum: number, rs: any) => sum + getSkillDd(rs), 0)
      const { routine_skills: _, ...routine } = r

      let pass_dds: number[] | undefined
      if (isDmt) {
        const passTotals: number[] = [0, 0, 0, 0]
        skillRows.forEach((rs: any) => {
          const seq = rs.sequence_order ?? 1
          const passIdx = Math.ceil(seq / 2) - 1
          if (passIdx >= 0 && passIdx < 4) {
            passTotals[passIdx] += getSkillDd(rs)
          }
        })
        pass_dds = passTotals
      }

      return { ...routine, skill_count: skillRows.length, total_dd, pass_dds }
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
        .select('*, routine_skills(selected_form, sequence_order, skills(dd_tuck, dd_pike, dd_straight))')
        .eq('athlete_id', athleteId)
        .order('routine_number')

      if (routs && !routsError) {
        setItRoutines(computeSummaries(routs.filter((r: any) => r.discipline === 'individual' || !r.discipline)))
        setDmtRoutines(computeSummaries(routs.filter((r: any) => r.discipline === 'dmt'), true))
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

      {/* Compulsory routine for levels 1–7 */}
      {(() => {
        const lvl = getCompulsoryLevel(athlete.level)
        if (!lvl) return null
        const skills = COMPULSORY_ROUTINES[lvl]
        return (
          <div className="mb-6">
            <h2 className="mb-3 text-sm font-bold text-violet-300">
              Compulsory Routine — Level {lvl}
            </h2>
            <div className="overflow-hidden rounded-lg border border-border bg-card">
              {skills.map((skill, i) => (
                <div
                  key={i}
                  className={`flex items-center justify-between px-4 py-2.5 text-sm ${
                    i % 2 === 0 ? 'bg-card' : 'bg-[#1a1728]'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <span className="w-5 flex-shrink-0 text-xs font-bold text-violet-500">{i + 1}</span>
                    <span className="text-violet-100">{skill.name}</span>
                  </div>
                  {skill.fig && (
                    <span className="font-mono text-xs text-orange-400">{skill.fig}</span>
                  )}
                </div>
              ))}
            </div>
          </div>
        )
      })()}

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

      {/* DMT compulsory for levels 1–7 */}
      {(() => {
        const lvl = getCompulsoryLevel(athlete.level)
        if (!lvl) return null
        const passes = DMT_COMPULSORY_ROUTINES[lvl]
        return (
          <div className="mb-4">
            <h2 className="mb-3 text-sm font-bold text-violet-300">
              DMT Compulsory — Level {lvl}
            </h2>
            <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
              {passes.map(pass => (
                <div key={pass.routineNumber} className="overflow-hidden rounded-lg border border-border bg-card">
                  <div className="border-b border-border bg-[#1a1728] px-4 py-2">
                    <span className="text-xs font-bold uppercase tracking-wide text-emerald-400">
                      Routine {pass.routineNumber}
                    </span>
                  </div>
                  {pass.skills.map((skill, i) => (
                    <div
                      key={i}
                      className={`flex items-center justify-between px-4 py-2.5 text-sm ${
                        i % 2 === 0 ? 'bg-card' : 'bg-[#1a1728]'
                      }`}
                    >
                      <span className="text-violet-100">{skill.name}</span>
                      {skill.fig && (
                        <span className="font-mono text-xs text-orange-400">{skill.fig}</span>
                      )}
                    </div>
                  ))}
                </div>
              ))}
            </div>
          </div>
        )
      })()}

      {/* Double Mini Trampoline routines */}
      <h2 className="mb-3 text-sm font-bold text-violet-300">Double Mini Trampoline</h2>
      {dmtRoutines.length === 0 ? (
        <p className="text-sm text-violet-400">No DMT routines yet.</p>
      ) : (
        <>
          <div className="flex flex-col gap-2 md:hidden">
            {dmtRoutines.map(r => {
              const passLabel = r.pass_dds
                ?.map((dd, i) => dd > 0 ? `P${i + 1}: ${dd.toFixed(1)}` : null)
                .filter(Boolean)
                .join(' / ') ?? '—'
              return (
                <button
                  key={r.id}
                  type="button"
                  onClick={() => navigate(`/athletes/${athlete.id}/dmt/${r.id}`)}
                  className="flex items-center justify-between rounded-lg border border-border bg-card px-4 py-3 text-left hover:bg-[#1a1728] focus:outline-none focus:ring-2 focus:ring-orange-500"
                >
                  <div>
                    <p className="font-medium text-violet-100">Routine #{r.routine_number}</p>
                    <p className="text-xs text-violet-400">{Math.ceil(r.skill_count / 2)} / 4 passes</p>
                  </div>
                  <span className="text-sm font-bold text-orange-500">{passLabel}</span>
                </button>
              )
            })}
          </div>
          <div className="hidden overflow-hidden rounded-lg border border-border bg-card md:block">
            <table className="w-full text-sm">
              <thead className="bg-[#1a1728] text-xs font-semibold uppercase text-violet-400">
                <tr>
                  <th className="px-4 py-3 text-left">Routine</th>
                  <th className="px-4 py-3 text-left">Passes</th>
                  <th className="px-4 py-3 text-left">DD per Pass</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {dmtRoutines.map(r => {
                  const passLabel = r.pass_dds
                    ?.map(dd => dd > 0 ? `${dd.toFixed(1)}` : null)
                    .filter(Boolean)
                    .join(' / ') ?? '—'
                  return (
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
                      <td className="px-4 py-3 font-semibold text-orange-500">{passLabel}</td>
                    </tr>
                  )
                })}
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
