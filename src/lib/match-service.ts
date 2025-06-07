import { supabase } from './supabase'

export interface Match {
  id: string
  user1_id: string
  user2_id: string
  match_date: string
  match_status: 'active' | 'blocked' | 'unmatched'
}

export interface MatchedUser {
  match_id: string
  matched_user_id: string
  match_date: string
  match_status: string
}

export async function createMatch(userId: string): Promise<Match> {
  const { data, error } = await supabase
    .from('matches')
    .insert({
      user1_id: (await supabase.auth.getUser()).data.user?.id,
      user2_id: userId
    })
    .select()
    .single()

  if (error) throw error
  return data
}

export async function updateMatchStatus(
  matchId: string,
  status: Match['match_status']
): Promise<void> {
  const { error } = await supabase
    .from('matches')
    .update({ match_status: status })
    .eq('id', matchId)

  if (error) throw error
}

export async function deleteMatch(matchId: string): Promise<void> {
  const { error } = await supabase
    .from('matches')
    .delete()
    .eq('id', matchId)

  if (error) throw error
}

export async function getUserMatches(
  status?: Match['match_status'],
  page: number = 1,
  limit: number = 20
): Promise<MatchedUser[]> {
  const { data, error } = await supabase
    .rpc('get_user_matches', {
      user_id: (await supabase.auth.getUser()).data.user?.id,
      status,
      limit_val: limit,
      offset_val: (page - 1) * limit
    })

  if (error) throw error
  return data || []
}

export async function checkIfMatched(userId: string): Promise<boolean> {
  const { data, error } = await supabase
    .rpc('are_users_matched', {
      user_a: (await supabase.auth.getUser()).data.user?.id,
      user_b: userId
    })

  if (error) throw error
  return data || false
}

export async function getMatchDetails(matchId: string): Promise<Match> {
  const { data, error } = await supabase
    .from('matches')
    .select('*')
    .eq('id', matchId)
    .single()

  if (error) throw error
  return data
}

export async function getActiveMatchCount(): Promise<number> {
  const { count, error } = await supabase
    .from('matches')
    .select('*', { count: 'exact', head: true })
    .eq('match_status', 'active')
    .or(`user1_id.eq.${(await supabase.auth.getUser()).data.user?.id},user2_id.eq.${(await supabase.auth.getUser()).data.user?.id}`)

  if (error) throw error
  return count || 0
}

export async function getRecentMatches(limit: number = 5): Promise<MatchedUser[]> {
  const { data, error } = await supabase
    .rpc('get_user_matches', {
      user_id: (await supabase.auth.getUser()).data.user?.id,
      status: 'active',
      limit_val: limit,
      offset_val: 0
    })

  if (error) throw error
  return data || []
}

export async function getMatches(userId: string): Promise<Match[]> {
  const { data: matches, error } = await supabase
    .from('matches')
    .select(`
      id,
      user1_id,
      user2_id,
      match_date,
      profiles!matches_user1_id_fkey (
        full_name,
        profile_photo_url
      ),
      profiles!matches_user2_id_fkey (
        full_name,
        profile_photo_url
      )
    `)
    .or(`user1_id.eq.${userId},user2_id.eq.${userId}`)
    .order('match_date', { ascending: false })

  if (error) throw error

  // Transform the data to always show the other user's profile
  return matches.map(match => {
    const otherUserId = match.user1_id === userId ? match.user2_id : match.user1_id
    const otherUserProfile = match.user1_id === userId 
      ? match.profiles_matches_user2_id_fkey
      : match.profiles_matches_user1_id_fkey

    return {
      id: match.id,
      user1_id: match.user1_id,
      user2_id: match.user2_id,
      match_date: match.match_date,
      match_status: match.match_status,
      matched_user: {
        full_name: otherUserProfile.full_name,
        profile_photo_url: otherUserProfile.profile_photo_url
      }
    }
  })
}

export async function checkForNewMatches(userId: string): Promise<Match[]> {
  const { data: newMatches, error } = await supabase
    .from('matches')
    .select(`
      id,
      user1_id,
      user2_id,
      match_date,
      profiles!matches_user1_id_fkey (
        full_name,
        profile_photo_url
      ),
      profiles!matches_user2_id_fkey (
        full_name,
        profile_photo_url
      )
    `)
    .or(`user1_id.eq.${userId},user2_id.eq.${userId}`)
    .order('match_date', { ascending: false })
    .limit(1)

  if (error) throw error

  return newMatches?.map(match => {
    const otherUserId = match.user1_id === userId ? match.user2_id : match.user1_id
    const otherUserProfile = match.user1_id === userId 
      ? match.profiles_matches_user2_id_fkey
      : match.profiles_matches_user1_id_fkey

    return {
      id: match.id,
      user1_id: match.user1_id,
      user2_id: match.user2_id,
      match_date: match.match_date,
      match_status: match.match_status,
      matched_user: {
        full_name: otherUserProfile.full_name,
        profile_photo_url: otherUserProfile.profile_photo_url
      }
    }
  }) || []
}

export function subscribeToMatches(
  userId: string,
  callback: (match: Match) => void
) {
  return supabase
    .channel('matches')
    .on(
      'postgres_changes',
      {
        event: 'INSERT',
        schema: 'public',
        table: 'matches',
        filter: `user1_id=eq.${userId},user2_id=eq.${userId}`
      },
      (payload) => {
        // Fetch the complete match data including the matched user's profile
        getMatches(userId)
          .then(matches => {
            const newMatch = matches.find(m => m.id === payload.new.id)
            if (newMatch) {
              callback(newMatch)
            }
          })
          .catch(console.error)
      }
    )
    .subscribe()
} 