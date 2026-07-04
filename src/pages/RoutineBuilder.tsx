import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useRoutine } from '../hooks/useRoutine'
import SkillCatalog from '../components/SkillCatalog'
import RoutineSlots from '../components/RoutineSlots'
import Spinner from '../components/Spinner'

export default function RoutineBuilder() {
  const navigate = useNavigate()
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

  async function handleSave() {
    try {
      await save()
      if (athlete) navigate(`/athletes/${athlete.id}`)
    } catch {
      // save() already set saveError state — stay on page so user can retry
    }
  }

  return (
    <div className="flex h-full flex-col">
      {saveError && (
        <div className="flex-shrink-0 border-b border-red-100 bg-red-50 px-4 py-2 text-xs text-red-600">
          {saveError}
        </div>
      )}
      <div className="flex flex-1 overflow-hidden">
        <SkillCatalog onAdd={addSkill} full={isFull} />
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
  )
}
