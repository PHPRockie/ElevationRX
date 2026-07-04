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

  useEffect(() => {
    if (!session) {
      setCoach(null)
      setGym(null)
      setLoading(false)
      return
    }

    setLoading(true)
    supabase
      .from('coaches')
      .select('*, gyms(*)')
      .eq('id', session.user.id)
      .single()
      .then(({ data }) => {
        if (data) {
          const { gyms, ...coachData } = data as Coach & { gyms: Gym }
          setCoach(coachData)
          setGym(gyms)
        }
        setLoading(false)
      })
  }, [session])

  return (
    <CoachContext.Provider value={{ coach, gym, loading }}>
      {children}
    </CoachContext.Provider>
  )
}

export function useCoach() {
  return useContext(CoachContext)
}
