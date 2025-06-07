import type { Profile } from './supabase'

export function calculateTrustScore(profile: Partial<Profile>): number {
  let score = 0

  // ID verification: +20%
  if (profile.id_uploaded) {
    score += 20
  }

  // Photo verification: +20%
  if (profile.photo_uploaded) {
    score += 20
  }

  // Video verification: +30%
  if (profile.video_uploaded) {
    score += 30
  }

  // Profile completion: +30%
  const isProfileComplete = Boolean(
    profile.full_name &&
    profile.age &&
    profile.gender &&
    profile.location &&
    profile.relationship_goal
  )
  if (isProfileComplete) {
    score += 30
  }

  return score
} 