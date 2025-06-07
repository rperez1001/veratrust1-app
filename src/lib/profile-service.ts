import { supabase } from './supabase'
import type { Profile } from './supabase'
import { calculateTrustScore } from './trust-score'

export async function createProfile(profile: Omit<Profile, 'id' | 'created_at' | 'updated_at' | 'trust_score'>) {
  const trustScore = calculateTrustScore(profile)
  
  const { data, error } = await supabase
    .from('profiles')
    .insert([{ ...profile, trust_score: trustScore }])
    .select()
    .single()

  if (error) {
    throw error
  }

  return data
}

export async function updateProfile(
  userId: string,
  profile: Partial<Omit<Profile, 'id' | 'created_at' | 'updated_at' | 'trust_score'>>
) {
  // First get the current profile to calculate the new trust score
  const { data: currentProfile, error: fetchError } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', userId)
    .single()

  if (fetchError) {
    throw fetchError
  }

  // Calculate new trust score based on merged profile data
  const mergedProfile = { ...currentProfile, ...profile }
  const trustScore = calculateTrustScore(mergedProfile)

  // Update the profile with new data and trust score
  const { data, error } = await supabase
    .from('profiles')
    .update({ ...profile, trust_score: trustScore })
    .eq('id', userId)
    .select()
    .single()

  if (error) {
    throw error
  }

  return data
}

export async function getProfile(userId: string) {
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', userId)
    .single()

  if (error) {
    throw error
  }

  return data
} 