import type { Skill } from '../types/database'

export type DirectionFilter = 'front' | 'back'
export type CountFilter = 'all' | 'single' | 'double' | 'triple_quad'

export function inferSomersaultCount(name: string): 'single' | 'double' | 'triple_quad' {
  const lower = name.toLowerCase()
  // "Back Double Full" / "Back Triple Full" = single somersault + multiple twists; "Double Pullover" = 1¾ back
  if (['back double full', 'back triple full', 'double pullover'].some(e => lower.includes(e))) return 'single'
  if (lower.includes('triple') || lower.includes('triffis') || lower.includes('quad')) return 'triple_quad'
  if (
    lower.includes('double') || lower.includes('fliffis') ||
    /\bhalf\s+(out|in)\b/.test(lower) || /\bfull\s+(out|in)\b/.test(lower) ||
    /\brudy\s+out\b/.test(lower) || /\brandy\s+out\b/.test(lower) ||
    lower.includes('2 3/4')
  ) return 'double'
  return 'single'
}

export function filterSkills(
  skills: Skill[],
  direction: DirectionFilter,
  count: CountFilter,
  search: string,
): Skill[] {
  const q = search.trim().toLowerCase()

  if (q) {
    return skills.filter(
      s =>
        s.name.toLowerCase().includes(q) ||
        (s.fig_code?.toLowerCase().includes(q) ?? false),
    )
  }

  // 'lateral' skills are excluded by design — no DirectionFilter maps to 'lateral'
  const dbDirection = direction === 'front' ? 'forward' : 'backward'

  return skills.filter(s => {
    if (s.direction !== dbDirection) return false
    if (count === 'all') return true
    if (s.skill_group !== 'somersault') return false
    return inferSomersaultCount(s.name) === count
  })
}
