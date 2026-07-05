export interface Gym {
  id: string
  name: string
  country: string
  created_at: string
}

export type CoachRole = 'admin' | 'coach'

export interface Coach {
  id: string
  gym_id: string
  full_name: string
  role: CoachRole
  created_at: string
}

export type InvitationStatus = 'pending' | 'accepted' | 'revoked'

export interface Invitation {
  id: string
  gym_id: string
  email: string
  full_name: string
  token: string
  expires_at: string
  invited_by: string
  status: InvitationStatus
  created_at: string
}

export interface Athlete {
  id: string
  gym_id: string
  full_name: string
  level: string
  country: string
  created_at: string
}

export type SkillDirection = 'forward' | 'backward' | 'lateral'
export type SkillGroup = 'straight_jump' | 'tuck_jump' | 'pike_jump' | 'straddle_jump' | 'twist' | 'somersault'
export type Discipline = 'individual' | 'synchronized' | 'dmt' | 'tumbling'

export interface Skill {
  id: string
  name: string
  fig_code: string | null
  direction: SkillDirection | null
  skill_group: SkillGroup | null
  dd_tuck: number | null
  dd_pike: number | null
  dd_straight: number | null
  discipline: Discipline
  created_at: string
}

export interface Routine {
  id: string
  athlete_id: string
  gym_id: string
  level: string
  country: string
  routine_number: number
  discipline: Discipline
  created_at: string
  updated_at: string
}

export interface RoutineSkill {
  id: string
  routine_id: string
  skill_id: string
  position: number
  sequence_order: number
  selected_form: 'tuck' | 'pike' | 'straight' | null
  created_at: string
}

export interface Requirement {
  id: string
  country: string
  level: string
  num_routines: number
  is_fixed: boolean
  notes: string | null
  created_at: string
}
