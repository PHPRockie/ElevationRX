export interface CompulsorySkill {
  name: string
  fig?: string
}

export const COMPULSORY_ROUTINES: Record<number, CompulsorySkill[]> = {
  1: [
    { name: 'Tuck Jump', fig: 'o' },
    { name: 'Pike Jump', fig: '<' },
    { name: 'Straddle Jump', fig: 'v' },
    { name: 'Seat Drop' },
    { name: 'Return to Feet' },
    { name: 'Jump 1/2 Twist', fig: '01 /' },
    { name: 'Seat Drop' },
    { name: 'Hands & Knees Drop' },
    { name: 'Front Drop' },
    { name: 'Return to Feet' },
  ],
  2: [
    { name: 'Seat Drop' },
    { name: 'Front Drop Free' },
    { name: 'Return to Feet' },
    { name: 'Tuck Jump', fig: 'o' },
    { name: '1/2 Twist to Seat Drop' },
    { name: 'Return to Feet' },
    { name: 'Pike Jump', fig: '<' },
    { name: 'Straddle Jump', fig: 'v' },
    { name: 'Back Drop Free', fig: '10 /' },
    { name: 'Return to Feet', fig: '10 /' },
  ],
  3: [
    { name: 'Front Drop', fig: '10 /' },
    { name: 'Seat Drop' },
    { name: 'Return to Feet' },
    { name: 'Tuck Jump', fig: 'o' },
    { name: 'Seat Drop' },
    { name: '1/2 Twist to Seat Drop' },
    { name: '1/2 Twist to Feet' },
    { name: 'Pike Jump', fig: '<' },
    { name: 'Straddle Jump', fig: 'v' },
    { name: 'Front Somersault Tuck', fig: '40 o' },
  ],
  4: [
    { name: 'Back Somersault Tuck', fig: '40 o' },
    { name: 'Tuck Jump', fig: 'o' },
    { name: 'Jump 1/1 Twist', fig: '02 /' },
    { name: 'Straddle Jump', fig: 'v' },
    { name: '1/2 Twist to Front Drop (Airplane)', fig: '11 /' },
    { name: 'Seat Drop' },
    { name: 'Return to Feet' },
    { name: 'Jump 1/2 Twist', fig: '01 /' },
    { name: 'Pike Jump', fig: '<' },
    { name: 'Front Somersault Pike', fig: '40 <' },
  ],
  5: [
    { name: 'Back Somersault Pike', fig: '40 <' },
    { name: 'Tuck Jump', fig: 'o' },
    { name: 'Back Somersault Tuck', fig: '40 o' },
    { name: 'Straddle Jump', fig: 'v' },
    { name: '1/2 Twist to Front Drop (Airplane)', fig: '11 /' },
    { name: 'Back Drop Free' },
    { name: 'Return to Feet' },
    { name: 'Jump 1/2 Twist', fig: '01 /' },
    { name: 'Pike Jump', fig: '<' },
    { name: 'Barani Pike', fig: '41 <' },
  ],
  6: [
    { name: '3/4 Back Somersault Straight', fig: '30 /' },
    { name: '1/2 Twist to Front Drop (Cruise)', fig: '21 /' },
    { name: 'Return to Feet', fig: '10 /' },
    { name: 'Tuck Jump', fig: 'o' },
    { name: 'Back Somersault Pike', fig: '40 <' },
    { name: 'Barani Pike', fig: '41 <' },
    { name: 'Pike Jump', fig: '<' },
    { name: 'Straddle Jump', fig: 'v' },
    { name: 'Barani Tuck', fig: '41 o' },
    { name: 'Back Somersault Straight', fig: '40 /' },
  ],
  7: [
    { name: 'Back Somersault Straight', fig: '40 /' },
    { name: 'Barani Straight', fig: '41 /' },
    { name: 'Back Somersault Tuck', fig: '40 o' },
    { name: 'Pike Jump', fig: '<' },
    { name: 'Back Somersault Pike', fig: '40 <' },
    { name: 'Barani Pike', fig: '41 <' },
    { name: 'Tuck Jump', fig: 'o' },
    { name: 'Straddle Jump', fig: 'v' },
    { name: '3/4 Front Somersault Straight', fig: '30 /' },
    { name: 'Ball Out Tuck / Barani Ball Out Tuck', fig: '50 o / 51 o' },
  ],
}

export const ATHLETE_LEVELS = [
  { value: '1', label: 'Level 1' },
  { value: '2', label: 'Level 2' },
  { value: '3', label: 'Level 3' },
  { value: '4', label: 'Level 4' },
  { value: '5', label: 'Level 5' },
  { value: '6', label: 'Level 6' },
  { value: '7', label: 'Level 7' },
  { value: 'Young Elite', label: 'Young Elite' },
  { value: 'Junior Elite', label: 'Junior Elite' },
  { value: 'Senior Elite', label: 'Senior Elite' },
]

export function getCompulsoryLevel(level: string): number | null {
  const n = parseInt(level, 10)
  if (!isNaN(n) && n >= 1 && n <= 7 && String(n) === level.trim()) return n
  return null
}
