import { describe, it, expect } from 'vitest'
import { calculateTotalDD, availableForms, defaultForm, getSkillDD } from './ddCalc'
import type { Skill } from '../types/database'
import type { RoutineSlot } from './ddCalc'

const makeSkill = (overrides: Partial<Skill> = {}): Skill => ({
  id: '1',
  name: 'Front somersault',
  fig_code: '401',
  direction: 'forward',
  skill_group: 'somersault',
  dd_tuck: 0.5,
  dd_pike: 0.6,
  dd_straight: 0.7,
  discipline: 'individual',
  created_at: '',
  ...overrides,
})

describe('getSkillDD', () => {
  it('returns tuck DD when form is tuck', () => {
    const slot: RoutineSlot = { skill: makeSkill(), form: 'tuck' }
    expect(getSkillDD(slot)).toBe(0.5)
  })
  it('returns pike DD when form is pike', () => {
    const slot: RoutineSlot = { skill: makeSkill(), form: 'pike' }
    expect(getSkillDD(slot)).toBe(0.6)
  })
  it('returns straight DD when form is straight', () => {
    const slot: RoutineSlot = { skill: makeSkill(), form: 'straight' }
    expect(getSkillDD(slot)).toBe(0.7)
  })
  it('returns 0 when DD for the selected form is null', () => {
    const slot: RoutineSlot = { skill: makeSkill({ dd_tuck: null }), form: 'tuck' }
    expect(getSkillDD(slot)).toBe(0)
  })
})

describe('calculateTotalDD', () => {
  it('sums DD across filled slots', () => {
    const skill = makeSkill()
    const slots: (RoutineSlot | null)[] = [
      { skill, form: 'tuck' },
      { skill, form: 'pike' },
      null,
    ]
    expect(calculateTotalDD(slots)).toBeCloseTo(1.1)
  })
  it('returns 0 for an all-empty routine', () => {
    expect(calculateTotalDD(Array(10).fill(null))).toBe(0)
  })
})

describe('availableForms', () => {
  it('returns only forms that have a DD value', () => {
    expect(availableForms(makeSkill({ dd_pike: null }))).toEqual(['tuck', 'straight'])
  })
  it('returns all three when all DD values are set', () => {
    expect(availableForms(makeSkill())).toEqual(['tuck', 'pike', 'straight'])
  })
  it('returns empty array when all DD values are null', () => {
    expect(availableForms(makeSkill({ dd_tuck: null, dd_pike: null, dd_straight: null }))).toEqual([])
  })
})

describe('defaultForm', () => {
  it('returns the first available form', () => {
    expect(defaultForm(makeSkill({ dd_tuck: null }))).toBe('pike')
  })
  it('falls back to tuck when no forms are available', () => {
    expect(defaultForm(makeSkill({ dd_tuck: null, dd_pike: null, dd_straight: null }))).toBe('tuck')
  })
})
