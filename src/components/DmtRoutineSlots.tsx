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
  onSave: () => void
}

const FORM_LABELS: Record<SkillForm, string> = {
  tuck: 'Tuck',
  pike: 'Pike',
  straight: 'Str',
}

const SLOT_LABELS = ['Mount / Spotter', 'Dismount']

export default function DmtRoutineSlots({
  athlete,
  routine,
  slots,
  totalDD,
  saving,
  onRemove,
  onSetForm,
  onSave,
}: Props) {
  const filledCount = slots.filter(Boolean).length
  const passes = [0, 1, 2, 3]

  return (
    <div className="flex h-full flex-1 flex-col overflow-hidden">
      <div className="flex flex-shrink-0 items-center justify-between border-b border-border bg-card px-4 py-3">
        <div>
          <p className="text-sm font-bold text-violet-100">{athlete?.full_name ?? '—'}</p>
          <p className="text-xs text-violet-400">
            {routine ? `Routine #${routine.routine_number}` : 'New routine'} · Double Mini
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
        <div className="flex flex-col gap-4">
          {passes.map(passIdx => {
            const mountIdx = passIdx * 2
            const dismountIdx = passIdx * 2 + 1
            const mountSlot = slots[mountIdx]
            const dismountSlot = slots[dismountIdx]
            const passDD = (mountSlot ? getSkillDD(mountSlot) : 0) + (dismountSlot ? getSkillDD(dismountSlot) : 0)

            return (
              <div key={passIdx} className="rounded-lg border border-border bg-card overflow-hidden">
                <div className="flex items-center justify-between border-b border-border bg-[#1a1728] px-3 py-2">
                  <span className="text-xs font-bold uppercase tracking-wide text-violet-300">Pass {passIdx + 1}</span>
                  {passDD > 0 && (
                    <span className="text-xs font-semibold text-orange-500">DD {passDD.toFixed(1)}</span>
                  )}
                </div>

                <div className="flex flex-col divide-y divide-border">
                  {[mountIdx, dismountIdx].map((slotIdx, labelIdx) => {
                    const slot = slots[slotIdx]
                    return (
                      <div
                        key={slotIdx}
                        className={`px-3 py-2.5 ${slot ? '' : 'bg-[#1a1728]'}`}
                      >
                        {slot ? (
                          <>
                            {/* Row 1: label + full skill name */}
                            <div className="flex items-baseline gap-2">
                              <span className="w-24 flex-shrink-0 text-xs text-violet-400">
                                {SLOT_LABELS[labelIdx]}
                              </span>
                              <span className="flex-1 text-sm font-medium text-violet-100 break-words">
                                {slot.skill.name}
                              </span>
                            </div>
                            {/* Row 2: form buttons + DD + remove, right-aligned */}
                            <div className="mt-1.5 flex items-center justify-end gap-1.5">
                              {availableForms(slot.skill).map(f => (
                                <button
                                  key={f}
                                  type="button"
                                  onClick={() => onSetForm(slotIdx, f)}
                                  className={`rounded px-1.5 py-0.5 text-xs font-semibold transition-colors ${
                                    slot.form === f
                                      ? 'bg-orange-500 text-white'
                                      : 'border border-border bg-[#1e1a2e] text-violet-400 hover:bg-[#1a1728]'
                                  }`}
                                >
                                  {FORM_LABELS[f]}
                                </button>
                              ))}
                              <span className="w-10 text-right text-sm font-bold text-orange-500">
                                {getSkillDD(slot).toFixed(1)}
                              </span>
                              <button
                                type="button"
                                onClick={() => onRemove(slotIdx)}
                                className="text-violet-400 hover:text-red-500"
                                title="Remove skill"
                                aria-label={`Remove ${slot.skill.name}`}
                              >
                                ✕
                              </button>
                            </div>
                          </>
                        ) : (
                          <div className="flex items-center gap-2">
                            <span className="w-24 flex-shrink-0 text-xs text-violet-400">
                              {SLOT_LABELS[labelIdx]}
                            </span>
                            <span className="text-xs text-violet-500">Empty</span>
                          </div>
                        )}
                      </div>
                    )
                  })}
                </div>
              </div>
            )
          })}
        </div>
      </div>

      <div className="flex flex-shrink-0 items-center justify-between border-t border-border bg-card px-4 py-3">
        <span className="text-xs text-violet-400">{filledCount} / 8 skills added</span>
        <span className="text-sm font-bold text-orange-500">DD {totalDD.toFixed(1)}</span>
      </div>
    </div>
  )
}
