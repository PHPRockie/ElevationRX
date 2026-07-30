import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import { useCoach } from '../contexts/CoachContext'
import type { Athlete } from '../types/database'

export interface ActivityItem {
  id: string
  athleteName: string
  athleteId: string
  routineNumber: number
  discipline: string
  updatedAt: string
}

interface DashboardData {
  athleteCount: number
  routineCount: number
  coachCount: number
  recentAthletes: Athlete[]
  recentActivity: ActivityItem[]
  loading: boolean
  error: string | null
}

export function useDashboard(): DashboardData {
  const { gym } = useCoach()
  const [athleteCount, setAthleteCount] = useState(0)
  const [routineCount, setRoutineCount] = useState(0)
  const [coachCount, setCoachCount] = useState(0)
  const [recentAthletes, setRecentAthletes] = useState<Athlete[]>([])
  const [recentActivity, setRecentActivity] = useState<ActivityItem[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false
    if (!gym) { setLoading(false); return }

    setLoading(true)
    setError(null)

    async function load() {
      const [countRes, recentRes, coachRes, allAthRes] = await Promise.all([
        supabase
          .from('athletes')
          .select('*', { count: 'exact', head: true })
          .eq('gym_id', gym!.id),
        supabase
          .from('athletes')
          .select('*')
          .eq('gym_id', gym!.id)
          .order('created_at', { ascending: false })
          .limit(5),
        supabase
          .from('coaches')
          .select('*', { count: 'exact', head: true })
          .eq('gym_id', gym!.id),
        supabase
          .from('athletes')
          .select('id')
          .eq('gym_id', gym!.id),
      ])

      if (cancelled) return
      if (countRes.error || recentRes.error) {
        setError('Failed to load dashboard data.')
        setLoading(false)
        return
      }

      setAthleteCount(countRes.count ?? 0)
      setRecentAthletes(recentRes.data ?? [])
      setCoachCount(coachRes.count ?? 0)

      const allIds = (allAthRes.data ?? []).map((a: { id: string }) => a.id)

      if (allIds.length > 0) {
        const [routineCountRes, activityRes] = await Promise.all([
          supabase
            .from('routines')
            .select('*', { count: 'exact', head: true })
            .in('athlete_id', allIds),
          supabase
            .from('routines')
            .select('id, routine_number, discipline, updated_at, athletes(id, full_name)')
            .in('athlete_id', allIds)
            .order('updated_at', { ascending: false })
            .limit(6),
        ])

        if (!cancelled) {
          setRoutineCount(routineCountRes.count ?? 0)
          const items: ActivityItem[] = (activityRes.data ?? []).map((r: any) => ({
            id: r.id,
            athleteName: r.athletes?.full_name ?? 'Unknown',
            athleteId: r.athletes?.id ?? '',
            routineNumber: r.routine_number,
            discipline: r.discipline ?? 'individual',
            updatedAt: r.updated_at,
          }))
          setRecentActivity(items)
        }
      }

      if (!cancelled) setLoading(false)
    }

    load().catch(() => {
      if (!cancelled) {
        setError('Failed to load dashboard data.')
        setLoading(false)
      }
    })

    return () => { cancelled = true }
  }, [gym])

  return { athleteCount, routineCount, coachCount, recentAthletes, recentActivity, loading, error }
}
