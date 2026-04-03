export type UserRole = 'member' | 'admin'

export interface User {
  id: string
  email: string
  ign: string
  role: UserRole
  created_at: string
}

export interface Character {
  id: string
  user_id: string
  name: string
  class: string
  level: number
  is_main: boolean
  created_at: string
}

export type PotentialTier = 'None' | 'Rare' | 'Epic' | 'Unique' | 'Legendary'

export interface GearSlot {
  id: string
  character_id: string
  slot_name: string
  stars: number
  flame_score: number
  potential_tier: PotentialTier
  potential_line1: string
  potential_line2: string
  potential_line3: string
}

export interface MesoSavings {
  id: string
  user_id: string
  amount: number
  goal: number | null
  updated_at: string
}

export interface BossDrop {
  id: string
  user_id: string
  character_id: string
  boss: string
  item: string
  pitched: boolean
  dropped_at: string
}

export const GEAR_SLOTS = [
  'Weapon', 'Secondary', 'Emblem',
  'Hat', 'Top', 'Bottom', 'Gloves', 'Cape', 'Shoes',
  'Belt', 'Shoulder', 'Pocket',
  'Face Accessory', 'Eye Accessory', 'Earring',
  'Ring 1', 'Ring 2', 'Ring 3', 'Ring 4',
  'Pendant 1', 'Pendant 2',
  'Badge', 'Medal', 'Heart',
] as const

export const BOSSES = [
  'Zakum', 'Horntail', 'Pink Bean', 'Cygnus', 'Arkarium', 'Magnus',
  'Chaos Root Abyss', 'Von Leon', 'Akechi Mitsuhide', 'Lotus', 'Damien',
  'Lucid', 'Will', 'Gloom', 'Darknell', 'Verus Hilla', 'Seren',
  'Kalos', 'Kaling', 'Limbo',
] as const

export type Boss = typeof BOSSES[number]
export type GearSlotName = typeof GEAR_SLOTS[number]
