import type { Skill } from '../types/database'

export type SkillForm = 'tuck' | 'pike' | 'straight'

export interface RoutineSlot {
  skill: Skill
  form: SkillForm
}

export function availableForms(skill: Skill): SkillForm[] {
  const forms: SkillForm[] = []
  if (skill.dd_tuck != null) forms.push('tuck')
  if (skill.dd_pike != null) forms.push('pike')
  if (skill.dd_straight != null) forms.push('straight')
  return forms
}

export function defaultForm(skill: Skill): SkillForm {
  const forms = availableForms(skill)
  return forms[0] ?? 'tuck'
}

export function getSkillDD(slot: RoutineSlot): number {
  const { skill, form } = slot
  const dd =
    form === 'tuck' ? skill.dd_tuck :
    form === 'pike' ? skill.dd_pike :
    skill.dd_straight
  return dd ?? 0
}

export function calculateTotalDD(slots: (RoutineSlot | null)[]): number {
  return slots.reduce<number>((sum, slot) => sum + (slot ? getSkillDD(slot) : 0), 0)
}
