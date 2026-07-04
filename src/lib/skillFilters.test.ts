import { describe, it, expect } from 'vitest'
import { inferSomersaultCount, filterSkills } from './skillFilters'
import type { Skill } from '../types/database'

describe('inferSomersaultCount', () => {
  it('returns single for a plain somersault name', () => {
    expect(inferSomersaultCount('Front somersault tuck')).toBe('single')
  })
  it('returns double for a name with "double"', () => {
    expect(inferSomersaultCount('Front double somersault')).toBe('double')
  })
  it('returns triple_quad for a name with "triple"', () => {
    expect(inferSomersaultCount('Back triple somersault')).toBe('triple_quad')
  })
  it('returns triple_quad for a name with "quad"', () => {
    expect(inferSomersaultCount('Back quad somersault')).toBe('triple_quad')
  })
  it('is case-insensitive', () => {
    expect(inferSomersaultCount('FRONT DOUBLE SOMERSAULT')).toBe('double')
  })
})

const makeSkill = (overrides: Partial<Skill>): Skill => ({
  id: '1',
  name: 'Front somersault',
  fig_code: null,
  direction: 'forward',
  skill_group: 'somersault',
  dd_tuck: 0.5,
  dd_pike: 0.6,
  dd_straight: 0.7,
  discipline: 'individual',
  created_at: '',
  ...overrides,
})

describe('filterSkills', () => {
  const skills: Skill[] = [
    makeSkill({ id: '1', name: 'Front somersault', direction: 'forward', skill_group: 'somersault', fig_code: '401' }),
    makeSkill({ id: '2', name: 'Back somersault', direction: 'backward', skill_group: 'somersault' }),
    makeSkill({ id: '3', name: 'Front double somersault', direction: 'forward', skill_group: 'somersault' }),
    makeSkill({ id: '4', name: 'Front triple somersault', direction: 'forward', skill_group: 'somersault' }),
    makeSkill({ id: '5', name: 'Straight jump', direction: null, skill_group: 'straight_jump' }),
  ]

  it('filters by direction front', () => {
    const result = filterSkills(skills, 'front', 'all', '')
    expect(result.map(s => s.id)).toEqual(['1', '3', '4'])
  })

  it('filters by direction back', () => {
    const result = filterSkills(skills, 'back', 'all', '')
    expect(result.map(s => s.id)).toEqual(['2'])
  })

  it('count=single returns only single somersaults', () => {
    const result = filterSkills(skills, 'front', 'single', '')
    expect(result.map(s => s.id)).toEqual(['1'])
  })

  it('count=double returns only double somersaults', () => {
    const result = filterSkills(skills, 'front', 'double', '')
    expect(result.map(s => s.id)).toEqual(['3'])
  })

  it('count=triple_quad returns triple and quad somersaults', () => {
    const result = filterSkills(skills, 'front', 'triple_quad', '')
    expect(result.map(s => s.id)).toEqual(['4'])
  })

  it('search overrides direction filter — matches across all directions', () => {
    const result = filterSkills(skills, 'front', 'single', 'back')
    expect(result.map(s => s.id)).toEqual(['2'])
  })

  it('search matches by fig code', () => {
    const result = filterSkills(skills, 'front', 'all', '401')
    expect(result.map(s => s.id)).toEqual(['1'])
  })
})
