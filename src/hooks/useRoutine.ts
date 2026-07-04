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
  loadError: string | null
  saveError: string | null
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
  const [loadError, setLoadError] = useState<string | null>(null)
  const [saveError, setSaveError] = useState<string | null>(null)

  const load = useCallback(async () => {
    if (!athleteId) { setLoading(false); return }
    setLoadError(null)
    setLoading(true)
    try {
      const { data: ath, error: athError } = await supabase
        .from('athletes')
        .select('*')
        .eq('id', athleteId)
        .single()
      if (athError) { setLoadError('Failed to load athlete.'); return }
      setAthlete(ath)

      if (routineId) {
        const [{ data: rout, error: routError }, { data: routSkills }] = await Promise.all([
          supabase.from('routines').select('*').eq('id', routineId).single(),
          supabase
            .from('routine_skills')
            .select('*, skills(*)')
            .eq('routine_id', routineId)
            .order('sequence_order'),
        ])
        if (routError) { setLoadError('Failed to load routine.'); return }
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
    } catch {
      setLoadError('Failed to load data.')
    } finally {
      setLoading(false)
    }
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
    setSaveError(null)
    setSaving(true)
    try {
      let targetRoutine = routine

      if (!targetRoutine) {
        // routine_number is computed app-side: TOCTOU race possible under concurrent saves.
        // Acceptable for this app (single-coach usage); a DB sequence/trigger would be the proper fix.
        const { data: existing } = await supabase
          .from('routines')
          .select('id')
          .eq('athlete_id', athlete.id)
        const nextNumber = (existing?.length ?? 0) + 1

        const { data: newRoutine, error: insertRoutineError } = await supabase
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
        if (insertRoutineError) throw insertRoutineError
        targetRoutine = newRoutine
        setRoutine(newRoutine)
      } else {
        const { error: tsError } = await supabase
          .from('routines')
          .update({ updated_at: new Date().toISOString() })
          .eq('id', targetRoutine.id)
        if (tsError) throw tsError
      }

      if (!targetRoutine) return

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

      // Delete existing skills then insert new ones.
      // Not atomic: if insert fails after delete, skills are lost. Re-save to recover.
      const { error: deleteError } = await supabase
        .from('routine_skills')
        .delete()
        .eq('routine_id', targetRoutine.id)
      if (deleteError) throw deleteError

      if (inserts.length > 0) {
        const { error: insertError } = await supabase.from('routine_skills').insert(inserts)
        if (insertError) throw insertError
      }
    } catch (err: any) {
      setSaveError(err?.message ?? 'Failed to save routine.')
      throw err  // re-throw so RoutineBuilder can skip navigation
    } finally {
      setSaving(false)
    }
  }

  return {
    athlete,
    routine,
    slots,
    totalDD: calculateTotalDD(slots),
    loading,
    saving,
    loadError,
    saveError,
    addSkill,
    removeSlot,
    setForm,
    moveSlot,
    save,
  }
}
