import { supabase } from './supabase'

export interface UserPreferences {
  id?: string
  user_id?: string
  min_age: number
  max_age: number
  relationship_goals: string[]
  max_distance?: number
  min_trust_score: number
  created_at?: string
  updated_at?: string
}

export const DEFAULT_PREFERENCES: Omit<UserPreferences, 'id' | 'user_id' | 'created_at' | 'updated_at'> = {
  min_age: 18,
  max_age: 100,
  relationship_goals: ['dating', 'relationship', 'marriage'],
  min_trust_score: 60
}

export async function getUserPreferences(): Promise<UserPreferences> {
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Not authenticated')

  const { data, error } = await supabase
    .from('user_preferences')
    .select('*')
    .eq('user_id', user.id)
    .single()

  if (error) {
    if (error.code === 'PGRST116') { // Record not found
      return createUserPreferences(DEFAULT_PREFERENCES)
    }
    throw error
  }

  return data
}

export async function createUserPreferences(
  preferences: Partial<UserPreferences>
): Promise<UserPreferences> {
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Not authenticated')

  const { data, error } = await supabase
    .from('user_preferences')
    .insert({
      user_id: user.id,
      ...DEFAULT_PREFERENCES,
      ...preferences
    })
    .select()
    .single()

  if (error) throw error
  return data
}

export async function updateUserPreferences(
  preferences: Partial<UserPreferences>
): Promise<UserPreferences> {
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Not authenticated')

  const { data, error } = await supabase
    .from('user_preferences')
    .update(preferences)
    .eq('user_id', user.id)
    .select()
    .single()

  if (error) throw error
  return data
}

export async function resetUserPreferences(): Promise<UserPreferences> {
  return updateUserPreferences(DEFAULT_PREFERENCES)
}

export const RELATIONSHIP_GOALS = [
  'dating',
  'relationship',
  'marriage',
  'friendship',
  'casual'
] as const

export type RelationshipGoal = typeof RELATIONSHIP_GOALS[number]

export function isValidRelationshipGoal(goal: string): goal is RelationshipGoal {
  return RELATIONSHIP_GOALS.includes(goal as RelationshipGoal)
}

export function validatePreferences(preferences: Partial<UserPreferences>): string[] {
  const errors: string[] = []

  if (preferences.min_age !== undefined) {
    if (preferences.min_age < 18) {
      errors.push('Minimum age must be at least 18')
    }
  }

  if (preferences.max_age !== undefined) {
    if (preferences.max_age > 100) {
      errors.push('Maximum age must be at most 100')
    }
  }

  if (preferences.min_age !== undefined && preferences.max_age !== undefined) {
    if (preferences.min_age > preferences.max_age) {
      errors.push('Minimum age must be less than or equal to maximum age')
    }
  }

  if (preferences.relationship_goals !== undefined) {
    if (preferences.relationship_goals.length === 0) {
      errors.push('At least one relationship goal must be selected')
    }
    if (!preferences.relationship_goals.every(isValidRelationshipGoal)) {
      errors.push('Invalid relationship goal selected')
    }
  }

  if (preferences.min_trust_score !== undefined) {
    if (preferences.min_trust_score < 0 || preferences.min_trust_score > 100) {
      errors.push('Trust score must be between 0 and 100')
    }
  }

  if (preferences.max_distance !== undefined) {
    if (preferences.max_distance < 0) {
      errors.push('Maximum distance must be positive')
    }
  }

  return errors
} 