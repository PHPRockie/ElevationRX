import { createContext, useContext, useEffect, useState } from 'react'
import type { ReactNode } from 'react'
import type { Session } from '@supabase/supabase-js'
import { supabase } from '../lib/supabase'
import type { Coach, Gym } from '../types/database'

interface CoachContextValue {
  coach: Coach | null
  gym: Gym | null
  loading: boolean
}

const CoachContext = createContext<CoachContextValue>({
  coach: null,
  gym: null,
  loading: true,
})

export function CoachProvider({
  children,
  session,
}: {
  children: ReactNode
  session: Session | null
}) {
  const [coach, setCoach] = useState<Coach | null>(null)
  const [gym, setGym] = useState<Gym | null>(null)
  const [loading, setLoading] = useState(true)

  const userId = session?.user.id ?? null

  useEffect(() => {
    if (!userId) {
      setCoach(null)
      setGym(null)
      setLoading(false)
      return
    }

    let cancelled = false
    setCoach(null)   // clear stale data from previous user
    setGym(null)     // clear stale data from previous user
    setLoading(true)

    supabase
      .from('coaches')
      .select('*, gyms(*)')
      .eq('id', userId)
      .single()
      .then(({ data, error }) => {
        if (cancelled) return
        if (error && error.code !== 'PGRST116') {
          console.error('[CoachContext] fetch error', error)
        }
        if (data) {
          const { gyms, ...coachData } = data as Coach & { gyms: Gym | null }
          setCoach(coachData)
          setGym(gyms)
        }
        setLoading(false)
      })

    return () => { cancelled = true }
  }, [userId])

  return (
    <CoachContext.Provider value={{ coach, gym, loading }}>
      {children}
    </CoachContext.Provider>
  )
}

export function useCoach() {
  return useContext(CoachContext)
}
