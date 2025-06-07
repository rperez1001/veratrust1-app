import { supabase } from './supabase'
import OpenAI from 'openai'

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
})

export interface MatchingProfile {
  id: string
  values_and_interests: string[]
  relationship_type: string[]
  relationship_intentions: string[]
  bio: string
  compatibility_score?: number
  shared_values?: string[]
}

export async function calculateCompatibilityScore(
  profile1: MatchingProfile,
  profile2: MatchingProfile
): Promise<{ score: number; sharedValues: string[] }> {
  try {
    // Prepare profile data for analysis
    const profile1Data = {
      interests: profile1.values_and_interests,
      relationshipType: profile1.relationship_type,
      intentions: profile1.relationship_intentions,
      bio: profile1.bio
    }

    const profile2Data = {
      interests: profile2.values_and_interests,
      relationshipType: profile2.relationship_type,
      intentions: profile2.relationship_intentions,
      bio: profile2.bio
    }

    // Use OpenAI to analyze compatibility
    const response = await openai.chat.completions.create({
      model: 'gpt-4-turbo-preview',
      messages: [
        {
          role: 'system',
          content: `You are a dating compatibility analyzer. Analyze two profiles and:
1. Calculate a compatibility score (0-100)
2. Identify shared values and interests
3. Consider relationship type compatibility
4. Evaluate intention alignment
5. Analyze bio sentiment and personality match
Provide output in JSON format with 'score' and 'sharedValues' fields.`
        },
        {
          role: 'user',
          content: `Profile 1: ${JSON.stringify(profile1Data)}
Profile 2: ${JSON.stringify(profile2Data)}`
        }
      ],
      response_format: { type: 'json_object' }
    })

    const analysis = JSON.parse(response.choices[0].message.content)

    return {
      score: analysis.score,
      sharedValues: analysis.sharedValues
    }
  } catch (error) {
    console.error('Error calculating compatibility:', error)
    return {
      score: 50, // Default score
      sharedValues: []
    }
  }
}

export async function findCompatibleMatches(
  userId: string,
  limit: number = 20
): Promise<MatchingProfile[]> {
  try {
    // Get user's profile
    const { data: userProfile } = await supabase
      .from('profiles')
      .select('values_and_interests, relationship_type, relationship_intentions, bio')
      .eq('id', userId)
      .single()

    if (!userProfile) {
      throw new Error('User profile not found')
    }

    // Get potential matches
    const { data: potentialMatches } = await supabase
      .from('profiles')
      .select('id, values_and_interests, relationship_type, relationship_intentions, bio')
      .neq('id', userId)
      .not('values_and_interests', 'is', null)
      .limit(50) // Get more than needed for filtering

    if (!potentialMatches) {
      return []
    }

    // Calculate compatibility scores
    const scoredMatches = await Promise.all(
      potentialMatches.map(async (match) => {
        const { score, sharedValues } = await calculateCompatibilityScore(
          {
            id: userId,
            ...userProfile
          },
          match
        )

        return {
          ...match,
          compatibility_score: score,
          shared_values: sharedValues
        }
      })
    )

    // Sort by compatibility score and return top matches
    return scoredMatches
      .sort((a, b) => (b.compatibility_score || 0) - (a.compatibility_score || 0))
      .slice(0, limit)
  } catch (error) {
    console.error('Error finding compatible matches:', error)
    return []
  }
}

export async function updateMatchingScores(
  userId: string,
  matches: MatchingProfile[]
): Promise<void> {
  try {
    const scoresToUpdate = matches.map((match) => ({
      user1_id: userId,
      user2_id: match.id,
      compatibility_score: match.compatibility_score || 50,
      shared_values: match.shared_values || []
    }))

    // Upsert matching scores
    const { error } = await supabase
      .from('matching_scores')
      .upsert(scoresToUpdate, {
        onConflict: 'user1_id,user2_id'
      })

    if (error) throw error
  } catch (error) {
    console.error('Error updating matching scores:', error)
  }
}

export async function getMatchRecommendations(
  userId: string,
  limit: number = 10
): Promise<MatchingProfile[]> {
  try {
    // Get user's subscription tier
    const { data: userProfile } = await supabase
      .from('profiles')
      .select('subscription_tier')
      .eq('id', userId)
      .single()

    if (!userProfile) {
      throw new Error('User profile not found')
    }

    // Get existing matching scores
    const { data: existingScores } = await supabase
      .from('matching_scores')
      .select('user2_id, compatibility_score')
      .eq('user1_id', userId)
      .order('compatibility_score', { ascending: false })
      .limit(limit)

    if (existingScores && existingScores.length >= limit) {
      // Use existing scores if available
      const { data: recommendations } = await supabase
        .from('profiles')
        .select('id, values_and_interests, relationship_type, relationship_intentions, bio')
        .in(
          'id',
          existingScores.map((score) => score.user2_id)
        )

      return recommendations?.map((profile) => ({
        ...profile,
        compatibility_score: existingScores.find(
          (score) => score.user2_id === profile.id
        )?.compatibility_score
      })) || []
    } else {
      // Calculate new matches if needed
      const matches = await findCompatibleMatches(userId, limit)
      await updateMatchingScores(userId, matches)
      return matches
    }
  } catch (error) {
    console.error('Error getting match recommendations:', error)
    return []
  }
} 