import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useRoutine } from '../hooks/useRoutine'
import { useToast } from '../contexts/ToastContext'
import SkillCatalog from '../components/SkillCatalog'
import DmtRoutineSlots from '../components/DmtRoutineSlots'
import Spinner from '../components/Spinner'

type MobileTab = 'catalog' | 'routine'

export default function DmtRoutineBuilder() {
  const navigate = useNavigate()
  const toast = useToast()
  const [mobileTab, setMobileTab] = useState<MobileTab>('catalog')
  const {
    athlete,
    routine,
    slots,
    totalDD,
    loading,
    saving,
    loadError,
    saveError,
    addSkill,
    removeSlot,
    setForm,
    save,
  } = useRoutine({ discipline: 'dmt', slotCount: 8 })

  if (loading) return <Spinner />
  if (loadError) return <div className="p-6 text-sm text-red-500">{loadError}</div>

  const isFull = slots.every(s => s !== null)
  const filledCount = slots.filter(Boolean).length

  async function handleSave() {
    try {
      await save()
      toast.success('Routine saved')
      if (athlete) navigate(`/athletes/${athlete.id}`)
    } catch {
      toast.error(saveError ?? 'Failed to save routine')
    }
  }

  return (
    <div className="flex h-full flex-col">
      {saveError && (
        <div className="flex-shrink-0 border-b border-red-900 bg-red-900/20 px-4 py-2 text-xs text-red-400">
          {saveError}
        </div>
      )}

      {/* Mobile tab bar */}
      <div className="flex flex-shrink-0 border-b border-border bg-card md:hidden">
        <button
          type="button"
          onClick={() => setMobileTab('catalog')}
          className={`flex-1 py-2.5 text-sm font-semibold transition-colors ${
            mobileTab === 'catalog'
              ? 'border-b-2 border-orange-500 text-orange-400'
              : 'text-zinc-500'
          }`}
        >
          Skills
        </button>
        <button
          type="button"
          onClick={() => setMobileTab('routine')}
          className={`flex-1 py-2.5 text-sm font-semibold transition-colors ${
            mobileTab === 'routine'
              ? 'border-b-2 border-orange-500 text-orange-400'
              : 'text-zinc-500'
          }`}
        >
          Passes · {filledCount}/8 · DD {totalDD.toFixed(1)}
        </button>
      </div>

      <div className="flex flex-1 overflow-hidden">
        <div className={`${mobileTab === 'catalog' ? 'flex' : 'hidden'} w-full md:flex md:w-auto`}>
          <SkillCatalog
            discipline="dmt"
            onAdd={skill => { addSkill(skill); setMobileTab('routine') }}
            full={isFull}
          />
        </div>

        <div className={`${mobileTab === 'routine' ? 'flex' : 'hidden'} w-full flex-col md:flex`}>
          <DmtRoutineSlots
            athlete={athlete}
            routine={routine}
            slots={slots}
            totalDD={totalDD}
            saving={saving}
            onRemove={removeSlot}
            onSetForm={setForm}
            onSave={handleSave}
          />
        </div>
      </div>
    </div>
  )
}
