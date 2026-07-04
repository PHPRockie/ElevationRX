import { useEffect, useState, useCallback } from 'react'
import { supabase } from '../lib/supabase'
import { useCoach } from '../contexts/CoachContext'
import type { Athlete } from '../types/database'

interface AthleteInput {
  full_name: string
  level: string
  country: string
}

interface UseAthletesResult {
  athletes: Athlete[]
  loading: boolean
  addAthlete: (data: AthleteInput) => Promise<void>
  updateAthlete: (id: string, data: AthleteInput) => Promise<void>
  deleteAthlete: (id: string) => Promise<void>
  refresh: () => void
}

export function useAthletes(): UseAthletesResult {
  const { gym } = useCoach()
  const [athletes, setAthletes] = useState<Athlete[]>([])
  const [loading, setLoading] = useState(true)

  const fetchAthletes = useCallback(async () => {
    if (!gym) { setLoading(false); return }
    setLoading(true)
    const { data } = await supabase
      .from('athletes')
      .select('*')
      .eq('gym_id', gym.id)
      .order('full_name')
    setAthletes(data ?? [])
    setLoading(false)
  }, [gym])

  useEffect(() => { fetchAthletes() }, [fetchAthletes])

  async function addAthlete(data: AthleteInput) {
    if (!gym) return
    const { error } = await supabase.from('athletes').insert({ ...data, gym_id: gym.id })
    if (error) throw error
    await fetchAthletes()
  }

  async function updateAthlete(id: string, data: AthleteInput) {
    if (!gym) return
    const { error } = await supabase.from('athletes').update(data).eq('id', id).eq('gym_id', gym.id)
    if (error) throw error
    await fetchAthletes()
  }

  async function deleteAthlete(id: string) {
    if (!gym) return
    const { error } = await supabase.from('athletes').delete().eq('id', id).eq('gym_id', gym.id)
    if (error) throw error
    await fetchAthletes()
  }

  return { athletes, loading, addAthlete, updateAthlete, deleteAthlete, refresh: fetchAthletes }
}
