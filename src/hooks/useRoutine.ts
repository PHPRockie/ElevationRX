import { useEffect, useState, useCallback } from 'react'
import { useParams } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { useCoach } from '../contexts/CoachContext'
import type { Athlete, Routine } from '../types/database'
import type { RoutineSlot, SkillForm } from '../lib/ddCalc'
import { defaultForm, calculateTotalDD } from '../lib/ddCalc'

const SLOT_COUNT = 10

interface UseRoutineResult {
  athlete: Athlete | null
  routine: Routine | null
  slots: (RoutineSlot | null)[]
  totalDD: number
  loading: boolean
  saving: boolean
  addSkill: (skill: RoutineSlot['skill']) => void
  removeSlot: (index: number) => void
  setForm: (index: number, form: SkillForm) => void
  moveSlot: (from: number, to: number) => void
  save: () => Promise<void>
}

export function useRoutine(): UseRoutineResult {
  const { athleteId, routineId } = useParams<{ athleteId: string; routineId: string }>()
  const { gym } = useCoach()

  const [athlete, setAthlete] = useState<Athlete | null>(null)
  const [routine, setRoutine] = useState<Routine | null>(null)
  const [slots, setSlots] = useState<(RoutineSlot | null)[]>(Array(SLOT_COUNT).fill(null))
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  const load = useCallback(async () => {
    if (!athleteId) return
    setLoading(true)

    const { data: ath } = await supabase
      .from('athletes')
      .select('*')
      .eq('id', athleteId)
      .single()
    setAthlete(ath)

    if (routineId) {
      const [{ data: rout }, { data: routSkills }] = await Promise.all([
        supabase.from('routines').select('*').eq('id', routineId).single(),
        supabase
          .from('routine_skills')
          .select('*, skills(*)')
          .eq('routine_id', routineId)
          .order('sequence_order'),
      ])
      setRoutine(rout)

      if (routSkills) {
        const newSlots: (RoutineSlot | null)[] = Array(SLOT_COUNT).fill(null)
        routSkills.forEach((rs: any) => {
          const idx = (rs.sequence_order ?? 1) - 1
          if (idx >= 0 && idx < SLOT_COUNT && rs.skills) {
            newSlots[idx] = {
              skill: rs.skills,
              form: (rs.selected_form as SkillForm) ?? defaultForm(rs.skills),
            }
          }
        })
        setSlots(newSlots)
      }
    }

    setLoading(false)
  }, [athleteId, routineId])

  useEffect(() => { load() }, [load])

  function addSkill(skill: RoutineSlot['skill']) {
    setSlots(prev => {
      const emptyIdx = prev.findIndex(s => s === null)
      if (emptyIdx === -1) return prev
      const next = [...prev]
      next[emptyIdx] = { skill, form: defaultForm(skill) }
      return next
    })
  }

  function removeSlot(index: number) {
    setSlots(prev => {
      const next = [...prev]
      next[index] = null
      return next
    })
  }

  function setForm(index: number, form: SkillForm) {
    setSlots(prev => {
      const slot = prev[index]
      if (!slot) return prev
      const next = [...prev]
      next[index] = { ...slot, form }
      return next
    })
  }

  function moveSlot(from: number, to: number) {
    if (to < 0 || to >= SLOT_COUNT) return
    setSlots(prev => {
      const next = [...prev]
      ;[next[from], next[to]] = [next[to], next[from]]
      return next
    })
  }

  async function save() {
    if (!athlete || !gym) return
    setSaving(true)

    let targetRoutine = routine

    if (!targetRoutine) {
      const { data: existing } = await supabase
        .from('routines')
        .select('id')
        .eq('athlete_id', athlete.id)
      const nextNumber = (existing?.length ?? 0) + 1

      const { data: newRoutine } = await supabase
        .from('routines')
        .insert({
          athlete_id: athlete.id,
          gym_id: gym.id,
          level: athlete.level,
          country: athlete.country,
          routine_number: nextNumber,
          discipline: 'individual',
        })
        .select()
        .single()
      targetRoutine = newRoutine
      setRoutine(newRoutine)
    } else {
      await supabase
        .from('routines')
        .update({ updated_at: new Date().toISOString() })
        .eq('id', targetRoutine.id)
    }

    if (!targetRoutine) {
      setSaving(false)
      return
    }

    await supabase.from('routine_skills').delete().eq('routine_id', targetRoutine.id)

    const inserts = slots
      .map((slot, i) =>
        slot
          ? {
              routine_id: targetRoutine!.id,
              skill_id: slot.skill.id,
              position: i + 1,
              sequence_order: i + 1,
              selected_form: slot.form,
            }
          : null,
      )
      .filter((row): row is NonNullable<typeof row> => row !== null)

    if (inserts.length > 0) {
      await supabase.from('routine_skills').insert(inserts)
    }

    setSaving(false)
  }

  return {
    athlete,
    routine,
    slots,
    totalDD: calculateTotalDD(slots),
    loading,
    saving,
    addSkill,
    removeSlot,
    setForm,
    moveSlot,
    save,
  }
}
