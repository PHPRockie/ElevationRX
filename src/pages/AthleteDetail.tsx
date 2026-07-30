import { useCallback, useEffect, useState } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { useCoach } from '../contexts/CoachContext'
import { useAthletes } from '../hooks/useAthletes'
import { countryByCode } from '../lib/countries'
import { useToast } from '../contexts/ToastContext'
import EditAthleteModal from '../components/EditAthleteModal'
import { AthleteDetailSkeleton } from '../components/Skeleton'
import type { Athlete, Routine } from '../types/database'
import { COMPULSORY_ROUTINES, DMT_COMPULSORY_ROUTINES, getCompulsoryLevel } from '../lib/compulsoryRoutines'

interface RoutineSummary extends Routine {
  skill_count: number
  total_dd: number
  pass_dds?: number[]
  skillNames: string[]
}

export default function AthleteDetail() {
  const { athleteId } = useParams<{ athleteId: string }>()
  const navigate = useNavigate()
  const { gym } = useCoach()
  const { updateAthlete, deleteAthlete } = useAthletes()
  const toast = useToast()

  const [athlete, setAthlete] = useState<Athlete | null>(null)
  const [itRoutines, setItRoutines] = useState<RoutineSummary[]>([])
  const [dmtRoutines, setDmtRoutines] = useState<RoutineSummary[]>([])
  const [loading, setLoading] = useState(true)
  const [fetchError, setFetchError] = useState<string | null>(null)
  const [showEdit, setShowEdit] = useState(false)
  const [compareA, setCompareA] = useState<string>('')
  const [compareB, setCompareB] = useState<string>('')
  const [showCompare, setShowCompare] = useState(false)

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
      const skillNames: string[] = skillRows.map((rs: any) => rs.skills?.name ?? '').filter(Boolean)

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

      return { ...routine, skill_count: skillRows.length, total_dd, pass_dds, skillNames }
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
        .select('*, routine_skills(selected_form, sequence_order, skills(name, dd_tuck, dd_pike, dd_straight))')
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
    try {
      await deleteAthlete(athlete.id)
      navigate('/athletes')
    } catch {
      toast.error('Failed to delete athlete. Please try again.')
    }
  }

  async function handleDeleteRoutine(routineId: string, label: string, isDmt: boolean) {
    if (!window.confirm(`Delete ${label}? This cannot be undone.`)) return
    const { error } = await supabase.from('routine_skills').delete().eq('routine_id', routineId)
    if (!error) await supabase.from('routines').delete().eq('id', routineId)
    if (error) {
      toast.error('Failed to delete routine.')
      return
    }
    if (isDmt) {
      setDmtRoutines(prev => prev.filter(r => r.id !== routineId))
    } else {
      setItRoutines(prev => prev.filter(r => r.id !== routineId))
    }
    toast.success(`${label} deleted`)
  }

  if (loading) return <AthleteDetailSkeleton />
  if (fetchError) return <div className="p-6 text-sm text-red-500">{fetchError}</div>
  if (!athlete) return <div className="p-6 text-sm text-violet-400">Athlete not found.</div>

  const country = countryByCode(athlete.country)

  return (
    <div className="h-full overflow-auto p-4 md:p-6">
      <Link to="/athletes" className="mb-4 inline-flex items-center gap-1 text-sm text-orange-500 hover:underline">
        ← Athletes
      </Link>

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
              <div key={r.id} className="flex items-center gap-2 rounded-lg border border-border bg-card px-4 py-3">
                <button
                  type="button"
                  onClick={() => navigate(`/athletes/${athlete.id}/routines/${r.id}`)}
                  className="flex flex-1 items-center justify-between text-left focus:outline-none"
                >
                  <div>
                    <p className="font-medium text-violet-100">Routine #{r.routine_number}</p>
                    <p className="text-xs text-violet-400">{r.skill_count} / 10 skills</p>
                  </div>
                  <span className="text-sm font-bold text-orange-500">DD {r.total_dd.toFixed(1)}</span>
                </button>
                <button
                  type="button"
                  onClick={() => handleDeleteRoutine(r.id, `Routine #${r.routine_number}`, false)}
                  className="ml-2 text-xs text-red-500 hover:text-red-400"
                  aria-label={`Delete Routine #${r.routine_number}`}
                >
                  ✕
                </button>
              </div>
            ))}
          </div>
          <div className="hidden overflow-hidden rounded-lg border border-border bg-card md:block">
            <table className="w-full text-sm">
              <thead className="bg-[#1a1728] text-xs font-semibold uppercase text-violet-400">
                <tr>
                  <th className="px-4 py-3 text-left">Routine</th>
                  <th className="px-4 py-3 text-left">Skills</th>
                  <th className="px-4 py-3 text-left">Total DD</th>
                  <th className="px-4 py-3 text-left"></th>
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
                    <td className="px-4 py-3 text-right">
                      <button
                        type="button"
                        onClick={e => { e.stopPropagation(); handleDeleteRoutine(r.id, `Routine #${r.routine_number}`, false) }}
                        className="text-xs text-red-500 hover:underline"
                      >
                        Delete
                      </button>
                    </td>
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
                <div key={r.id} className="flex items-center gap-2 rounded-lg border border-border bg-card px-4 py-3">
                  <button
                    type="button"
                    onClick={() => navigate(`/athletes/${athlete.id}/dmt/${r.id}`)}
                    className="flex flex-1 items-center justify-between text-left focus:outline-none"
                  >
                    <div>
                      <p className="font-medium text-violet-100">Routine #{r.routine_number}</p>
                      <p className="text-xs text-violet-400">{Math.ceil(r.skill_count / 2)} / 4 passes</p>
                    </div>
                    <span className="text-sm font-bold text-orange-500">{passLabel}</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => handleDeleteRoutine(r.id, `Routine #${r.routine_number}`, true)}
                    className="ml-2 text-xs text-red-500 hover:text-red-400"
                    aria-label={`Delete Routine #${r.routine_number}`}
                  >
                    ✕
                  </button>
                </div>
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
                  <th className="px-4 py-3 text-left"></th>
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
                      <td className="px-4 py-3 text-right">
                        <button
                          type="button"
                          onClick={e => { e.stopPropagation(); handleDeleteRoutine(r.id, `Routine #${r.routine_number}`, true) }}
                          className="text-xs text-red-500 hover:underline"
                        >
                          Delete
                        </button>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </>
      )}

      {/* DD Bar Chart — appears when athlete has 2+ IT routines */}
      {itRoutines.length >= 2 && (() => {
        const maxDD = Math.max(...itRoutines.map(r => r.total_dd), 1)
        return (
          <div className="mb-6">
            <div className="mb-3 flex items-center justify-between">
              <h2 className="text-sm font-bold text-violet-300">TRA Routine DD Comparison</h2>
            </div>
            <div className="rounded-lg border border-border bg-card p-4">
              <div className="flex items-end gap-3">
                {itRoutines.map(r => (
                  <div key={r.id} className="flex flex-1 flex-col items-center gap-1">
                    <span className="text-xs font-bold text-orange-500">{r.total_dd.toFixed(1)}</span>
                    <div
                      className="w-full rounded-t bg-orange-500/30 border-t-2 border-orange-500 transition-all"
                      style={{ height: `${Math.max((r.total_dd / maxDD) * 80, 8)}px` }}
                    />
                    <span className="text-xs text-violet-400">#{r.routine_number}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )
      })()}

      {/* Routine Comparison — appears when athlete has 2+ IT routines */}
      {itRoutines.length >= 2 && (
        <div className="mb-6">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-sm font-bold text-violet-300">Compare TRA Routines</h2>
            <button
              type="button"
              onClick={() => {
                setShowCompare(v => !v)
                if (!compareA && itRoutines[0]) setCompareA(itRoutines[0].id)
                if (!compareB && itRoutines[1]) setCompareB(itRoutines[1].id)
              }}
              className="rounded border border-border px-2 py-1 text-xs text-violet-400 hover:bg-[#1a1728]"
            >
              {showCompare ? 'Hide' : 'Show comparison'}
            </button>
          </div>
          {showCompare && (() => {
            const rA = itRoutines.find(r => r.id === (compareA || itRoutines[0]?.id))
            const rB = itRoutines.find(r => r.id === (compareB || itRoutines[1]?.id))
            if (!rA || !rB) return null
            const maxLen = Math.max(rA.skillNames.length, rB.skillNames.length)
            return (
              <div className="overflow-hidden rounded-lg border border-border bg-card">
                {/* selectors */}
                <div className="grid grid-cols-2 gap-px border-b border-border bg-border">
                  <div className="bg-card px-3 py-2">
                    <select
                      value={compareA}
                      onChange={e => setCompareA(e.target.value)}
                      className="w-full bg-transparent text-xs font-bold text-orange-400 outline-none"
                    >
                      {itRoutines.map(r => <option key={r.id} value={r.id}>Routine #{r.routine_number} · DD {r.total_dd.toFixed(1)}</option>)}
                    </select>
                  </div>
                  <div className="bg-card px-3 py-2">
                    <select
                      value={compareB}
                      onChange={e => setCompareB(e.target.value)}
                      className="w-full bg-transparent text-xs font-bold text-violet-400 outline-none"
                    >
                      {itRoutines.map(r => <option key={r.id} value={r.id}>Routine #{r.routine_number} · DD {r.total_dd.toFixed(1)}</option>)}
                    </select>
                  </div>
                </div>
                {/* skill rows */}
                {Array.from({ length: maxLen }).map((_, i) => {
                  const a = rA.skillNames[i] ?? '—'
                  const b = rB.skillNames[i] ?? '—'
                  const same = a === b && a !== '—'
                  return (
                    <div key={i} className={`grid grid-cols-2 gap-px border-b border-border bg-border last:border-0 ${i % 2 === 0 ? '' : ''}`}>
                      <div className={`bg-card px-3 py-2 text-xs ${same ? 'text-violet-300' : 'text-orange-400'}`}>
                        <span className="mr-1.5 text-violet-600">{i + 1}</span>{a}
                      </div>
                      <div className={`bg-card px-3 py-2 text-xs ${same ? 'text-violet-300' : 'text-violet-400'}`}>
                        {b}
                      </div>
                    </div>
                  )
                })}
                {/* totals */}
                <div className="grid grid-cols-2 gap-px bg-border">
                  <div className="bg-[#1a1728] px-3 py-2 text-xs font-bold text-orange-500">Total DD {rA.total_dd.toFixed(1)}</div>
                  <div className="bg-[#1a1728] px-3 py-2 text-xs font-bold text-violet-400">Total DD {rB.total_dd.toFixed(1)}</div>
                </div>
              </div>
            )
          })()}
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
