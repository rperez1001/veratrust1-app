import { supabase } from './supabase'

export interface Profile {
  id: string
  full_name: string
  age: number
  location: string
  trust_score: number
  relationship_goal: string
  profile_photo_url: string
}

export interface Swipe {
  id: string
  swiper_id: string
  swiped_id: string
  action: 'like' | 'skip'
  created_at: string
}

export async function getNextProfiles(limit: number = 5): Promise<Profile[]> {
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Not authenticated')

  // Get profiles that:
  // 1. Have trust score >= 60
  // 2. User hasn't swiped on or matched with
  // 3. Are not the current user
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .gte('trust_score', 60)
    .not('id', 'in', (
      supabase
        .from('swipes')
        .select('swiped_id')
        .eq('swiper_id', user.id)
    ))
    .not('id', 'in', (
      supabase
        .from('matches')
        .select('user2_id')
        .eq('user1_id', user.id)
    ))
    .not('id', 'in', (
      supabase
        .from('matches')
        .select('user1_id')
        .eq('user2_id', user.id)
    ))
    .neq('id', user.id)
    .order('trust_score', { ascending: false }) // Show highest trust scores first
    .limit(limit)

  if (error) throw error
  return data || []
}

export async function createSwipe(
  swipedId: string,
  action: 'like' | 'skip'
): Promise<{ isMatch: boolean }> {
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Not authenticated')

  // Create the swipe
  const { error: swipeError } = await supabase
    .from('swipes')
    .insert({
      swiper_id: user.id,
      swiped_id: swipedId,
      action
    })

  if (swipeError) throw swipeError

  // If it was a like, check for a match
  if (action === 'like') {
    const { data: isMatch, error: matchError } = await supabase
      .rpc('check_mutual_like', {
        user1_id: user.id,
        user2_id: swipedId
      })

    if (matchError) throw matchError
    return { isMatch: isMatch || false }
  }

  return { isMatch: false }
}

export async function getSwipeStats(): Promise<{
  likes: number
  skips: number
  matches: number
}> {
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Not authenticated')

  const [likesResponse, skipsResponse, matchesResponse] = await Promise.all([
    supabase
      .from('swipes')
      .select('*', { count: 'exact', head: true })
      .eq('swiper_id', user.id)
      .eq('action', 'like'),
    supabase
      .from('swipes')
      .select('*', { count: 'exact', head: true })
      .eq('swiper_id', user.id)
      .eq('action', 'skip'),
    supabase
      .from('matches')
      .select('*', { count: 'exact', head: true })
      .or(`user1_id.eq.${user.id},user2_id.eq.${user.id}`)
  ])

  return {
    likes: likesResponse.count || 0,
    skips: skipsResponse.count || 0,
    matches: matchesResponse.count || 0
  }
} 