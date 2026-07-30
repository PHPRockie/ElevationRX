import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useRoutine } from '../hooks/useRoutine'
import { useToast } from '../contexts/ToastContext'
import SkillCatalog from '../components/SkillCatalog'
import RoutineSlots from '../components/RoutineSlots'
import Spinner from '../components/Spinner'

type MobileTab = 'catalog' | 'routine'

export default function RoutineBuilder() {
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
    moveSlot,
    save,
  } = useRoutine()

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
          Routine · {filledCount}/10 · DD {totalDD.toFixed(1)}
        </button>
      </div>

      <div className="flex flex-1 overflow-hidden">
        {/* SkillCatalog: always visible on desktop, tab-controlled on mobile */}
        <div className={`${mobileTab === 'catalog' ? 'flex' : 'hidden'} w-full md:flex md:w-auto`}>
          <SkillCatalog onAdd={skill => { addSkill(skill); setMobileTab('routine') }} full={isFull} />
        </div>

        {/* RoutineSlots: always visible on desktop, tab-controlled on mobile */}
        <div className={`${mobileTab === 'routine' ? 'flex' : 'hidden'} w-full flex-col md:flex`}>
          <RoutineSlots
            athlete={athlete}
            routine={routine}
            slots={slots}
            totalDD={totalDD}
            saving={saving}
            onRemove={removeSlot}
            onSetForm={setForm}
            onMove={moveSlot}
            onSave={handleSave}
          />
        </div>
      </div>
    </div>
  )
}
