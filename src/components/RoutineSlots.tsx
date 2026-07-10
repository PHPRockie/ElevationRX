import type { RoutineSlot, SkillForm } from '../lib/ddCalc'
import { availableForms, getSkillDD } from '../lib/ddCalc'
import type { Athlete, Routine } from '../types/database'

interface Props {
  athlete: Athlete | null
  routine: Routine | null
  slots: (RoutineSlot | null)[]
  totalDD: number
  saving: boolean
  onRemove: (index: number) => void
  onSetForm: (index: number, form: SkillForm) => void
  onMove: (from: number, to: number) => void
  onSave: () => void
}

const FORM_LABELS: Record<SkillForm, string> = {
  tuck: 'Tuck',
  pike: 'Pike',
  straight: 'Str',
}

export default function RoutineSlots({
  athlete,
  routine,
  slots,
  totalDD,
  saving,
  onRemove,
  onSetForm,
  onMove,
  onSave,
}: Props) {
  const filledCount = slots.filter(Boolean).length

  return (
    <div className="flex h-full flex-1 flex-col overflow-hidden">
      <div className="flex flex-shrink-0 items-center justify-between border-b border-border bg-card px-4 py-3">
        <div>
          <p className="text-sm font-bold text-violet-100">{athlete?.full_name ?? '—'}</p>
          <p className="text-xs text-violet-400">
            {routine ? `Routine #${routine.routine_number}` : 'New routine'} · TRA
          </p>
        </div>
        <button
          type="button"
          onClick={onSave}
          disabled={saving || filledCount === 0}
          className="rounded bg-orange-500 px-4 py-1.5 text-sm font-semibold text-white hover:bg-orange-600 disabled:opacity-50"
        >
          {saving ? 'Saving…' : 'Save routine'}
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-4">
        <div className="flex flex-col gap-2">
          {slots.map((slot, i) => (
            <div
              key={i}
              className={`flex items-center gap-2 rounded-lg border px-3 py-2 ${
                slot ? 'border-border bg-card' : 'border-dashed border-border bg-[#1a1728]'
              }`}
            >
              <span className="w-5 flex-shrink-0 text-xs font-bold text-violet-400">{i + 1}</span>

              {slot ? (
                <>
                  <span className="flex-1 truncate text-sm font-medium text-violet-100">
                    {slot.skill.name}
                  </span>

                  <div className="flex gap-1">
                    {availableForms(slot.skill).map(f => (
                      <button
                        key={f}
                        type="button"
                        onClick={() => onSetForm(i, f)}
                        className={`rounded px-1.5 py-0.5 text-xs font-semibold transition-colors ${
                          slot.form === f
                            ? 'bg-orange-500 text-white'
                            : 'bg-[#1e1a2e] text-violet-400 border border-border hover:bg-[#1a1728]'
                        }`}
                      >
                        {FORM_LABELS[f]}
                      </button>
                    ))}
                  </div>

                  <span className="w-10 flex-shrink-0 text-right text-sm font-bold text-orange-500">
                    {getSkillDD(slot).toFixed(1)}
                  </span>

                  <div className="flex flex-col gap-0.5">
                    <button
                      type="button"
                      onClick={() => onMove(i, i - 1)}
                      disabled={i === 0}
                      className="text-xs leading-none text-violet-400 hover:text-violet-100 disabled:opacity-30"
                      title="Move up"
                      aria-label="Move skill up"
                    >
                      ▲
                    </button>
                    <button
                      type="button"
                      onClick={() => onMove(i, i + 1)}
                      disabled={i === slots.length - 1}
                      className="text-xs leading-none text-violet-400 hover:text-violet-100 disabled:opacity-30"
                      title="Move down"
                      aria-label="Move skill down"
                    >
                      ▼
                    </button>
                  </div>

                  <button
                    type="button"
                    onClick={() => onRemove(i)}
                    className="flex-shrink-0 text-violet-400 hover:text-red-500"
                    title="Remove skill"
                    aria-label={`Remove ${slot.skill.name}`}
                  >
                    ✕
                  </button>
                </>
              ) : (
                <span className="text-xs text-violet-400">Empty slot</span>
              )}
            </div>
          ))}
        </div>
      </div>

      <div className="flex flex-shrink-0 items-center justify-between border-t border-border bg-card px-4 py-3">
        <span className="text-xs text-violet-400">{filledCount} / 10 skills added</span>
        <span className="text-sm font-bold text-orange-500">DD {totalDD.toFixed(1)}</span>
      </div>
    </div>
  )
}
