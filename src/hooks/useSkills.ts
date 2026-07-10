import { useEffect, useState, useMemo } from 'react'
import { supabase } from '../lib/supabase'
import type { Skill } from '../types/database'
import { filterSkills } from '../lib/skillFilters'
import type { DirectionFilter, CountFilter } from '../lib/skillFilters'

interface UseSkillsResult {
  filtered: Skill[]
  loading: boolean
  error: string | null
}

export function useSkills(
  direction: DirectionFilter,
  count: CountFilter,
  search: string,
  discipline: 'individual' | 'dmt' = 'individual',
): UseSkillsResult {
  const [allSkills, setAllSkills] = useState<Skill[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    setLoading(true)
    supabase
      .from('skills')
      .select('*')
      .eq('discipline', discipline)
      .then(({ data, error: sbError }) => {
        if (sbError) {
          setError('Failed to load skills.')
        } else {
          setAllSkills(data ?? [])
        }
        setLoading(false)
      })
  }, [discipline])

  const filtered = useMemo(
    () => filterSkills(allSkills, direction, count, search),
    [allSkills, direction, count, search],
  )

  return { filtered, loading, error }
}
