import { useState } from 'react'
import { useSkills } from '../hooks/useSkills'
import type { DirectionFilter, CountFilter } from '../lib/skillFilters'
import type { Skill } from '../types/database'

interface Props {
  onAdd: (skill: Skill) => void
  full: boolean
}

export default function SkillCatalog({ onAdd, full }: Props) {
  const [direction, setDirection] = useState<DirectionFilter>('front')
  const [count, setCount] = useState<CountFilter>('all')
  const [search, setSearch] = useState('')
  const { filtered, loading } = useSkills(direction, count, search)

  return (
    <div className="flex h-full flex-col border-r border-slate-200 bg-slate-50" style={{ width: 280, minWidth: 280 }}>
      <div className="flex-shrink-0 border-b border-slate-200 bg-white p-3">
        <input
          type="text"
          placeholder="🔍 Search by name or FIG code…"
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="mb-3 w-full rounded border border-slate-200 px-3 py-1.5 text-sm outline-none focus:border-indigo-400"
        />
        <div className="mb-2 flex gap-2">
          {(['front', 'back'] as DirectionFilter[]).map(d => (
            <button
              key={d}
              type="button"
              onClick={() => setDirection(d)}
              className={`rounded-full px-4 py-1 text-sm font-semibold transition-colors ${
                direction === d
                  ? 'bg-sky-500 text-white'
                  : 'border border-slate-200 bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              {d === 'front' ? 'Front' : 'Back'}
            </button>
          ))}
        </div>
        <div className="flex flex-wrap gap-1.5">
          {(
            [
              ['all', 'All'],
              ['single', 'Single'],
              ['double', 'Double'],
              ['triple_quad', 'Triple/Quad'],
            ] as [CountFilter, string][]
          ).map(([value, label]) => (
            <button
              key={value}
              type="button"
              onClick={() => setCount(value)}
              className={`rounded-full px-3 py-0.5 text-xs font-semibold transition-colors ${
                count === value
                  ? 'bg-indigo-600 text-white'
                  : 'border border-slate-200 bg-slate-100 text-slate-500 hover:bg-slate-200'
              }`}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-2">
        {loading ? (
          <p className="p-3 text-xs text-slate-400">Loading skills…</p>
        ) : filtered.length === 0 ? (
          <p className="p-3 text-xs text-slate-400">No skills found.</p>
        ) : (
          filtered.map(skill => {
            const ddParts = [
              skill.dd_tuck != null && `T: ${skill.dd_tuck}`,
              skill.dd_pike != null && `P: ${skill.dd_pike}`,
              skill.dd_straight != null && `S: ${skill.dd_straight}`,
            ].filter(Boolean)

            return (
              <div
                key={skill.id}
                className="mb-1.5 flex items-center justify-between rounded-md border border-slate-100 bg-white p-2"
              >
                <div className="min-w-0 flex-1 pr-2">
                  <div className="truncate text-sm font-semibold text-slate-900">{skill.name}</div>
                  <div className="text-xs text-slate-400">
                    {skill.fig_code && <span className="mr-2 font-mono">{skill.fig_code}</span>}
                    {ddParts.join(' · ')}
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => onAdd(skill)}
                  disabled={full}
                  aria-label={`Add ${skill.name}`}
                  className={`flex-shrink-0 rounded px-2 py-1 text-xs font-bold transition-colors ${
                    full
                      ? 'cursor-not-allowed bg-slate-100 text-slate-400'
                      : 'bg-indigo-600 text-white hover:bg-indigo-700'
                  }`}
                >
                  +
                </button>
              </div>
            )
          })
        )}
      </div>
    </div>
  )
}
