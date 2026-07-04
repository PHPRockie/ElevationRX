import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import { useCoach } from '../contexts/CoachContext'
import type { Athlete } from '../types/database'

interface DashboardData {
  athleteCount: number
  recentAthletes: Athlete[]
  loading: boolean
}

export function useDashboard(): DashboardData {
  const { gym } = useCoach()
  const [athleteCount, setAthleteCount] = useState(0)
  const [recentAthletes, setRecentAthletes] = useState<Athlete[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!gym) return

    Promise.all([
      supabase
        .from('athletes')
        .select('*', { count: 'exact', head: true })
        .eq('gym_id', gym.id),
      supabase
        .from('athletes')
        .select('*')
        .eq('gym_id', gym.id)
        .order('created_at', { ascending: false })
        .limit(5),
    ]).then(([countRes, recentRes]) => {
      setAthleteCount(countRes.count ?? 0)
      setRecentAthletes(recentRes.data ?? [])
      setLoading(false)
    })
  }, [gym])

  return { athleteCount, recentAthletes, loading }
}
