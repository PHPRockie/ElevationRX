import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import { useCoach } from '../contexts/CoachContext'
import type { Athlete } from '../types/database'

interface DashboardData {
  athleteCount: number
  recentAthletes: Athlete[]
  loading: boolean
  error: string | null
}

export function useDashboard(): DashboardData {
  const { gym } = useCoach()
  const [athleteCount, setAthleteCount] = useState(0)
  const [recentAthletes, setRecentAthletes] = useState<Athlete[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false

    if (!gym) { setLoading(false); return }

    setLoading(true)
    setError(null)

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
      if (cancelled) return
      if (countRes.error || recentRes.error) {
        setError('Failed to load dashboard data.')
      } else {
        setAthleteCount(countRes.count ?? 0)
        setRecentAthletes(recentRes.data ?? [])
      }
      setLoading(false)
    }).catch(() => {
      if (cancelled) return
      setError('Failed to load dashboard data.')
      setLoading(false)
    })

    return () => { cancelled = true }
  }, [gym])

  return { athleteCount, recentAthletes, loading, error }
}
