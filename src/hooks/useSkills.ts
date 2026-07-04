import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import type { Skill } from '../types/database'
import { filterSkills } from '../lib/skillFilters'
import type { DirectionFilter, CountFilter } from '../lib/skillFilters'

interface UseSkillsResult {
  filtered: Skill[]
  loading: boolean
}

export function useSkills(
  direction: DirectionFilter,
  count: CountFilter,
  search: string,
): UseSkillsResult {
  const [allSkills, setAllSkills] = useState<Skill[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    supabase
      .from('skills')
      .select('*')
      .eq('discipline', 'individual')
      .then(({ data }) => {
        setAllSkills(data ?? [])
        setLoading(false)
      })
  }, [])

  const filtered = filterSkills(allSkills, direction, count, search)

  return { filtered, loading }
}
