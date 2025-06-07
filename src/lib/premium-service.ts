import { supabase } from './supabase'

export interface SubscriptionPlan {
  id: string
  name: string
  price_monthly: number
  price_yearly: number
  features: {
    swipes_per_day: number
    can_see_likes: boolean
    global_search: boolean
    video_calls: boolean
    hide_ads: boolean
    priority_matches?: boolean
    incognito_mode?: boolean
  }
}

export interface VideoCall {
  id: string
  caller_id: string
  receiver_id: string
  status: 'pending' | 'accepted' | 'rejected' | 'completed' | 'missed'
  scheduled_for: string | null
  started_at: string | null
  ended_at: string | null
  room_id: string | null
  created_at: string
}

export interface MatchingScore {
  id: string
  user1_id: string
  user2_id: string
  compatibility_score: number
  shared_values: string[]
  created_at: string
}

export async function getSubscriptionPlans(): Promise<SubscriptionPlan[]> {
  const { data, error } = await supabase
    .from('subscription_plans')
    .select('*')
    .order('price_monthly')

  if (error) throw error
  return data
}

export async function getCurrentSubscription(): Promise<{
  tier: string
  endDate: string | null
}> {
  const { data: profile, error } = await supabase
    .from('profiles')
    .select('subscription_tier, subscription_end_date')
    .eq('id', (await supabase.auth.getUser()).data.user?.id)
    .single()

  if (error) throw error
  return {
    tier: profile.subscription_tier,
    endDate: profile.subscription_end_date
  }
}

export async function updateSubscription(
  tier: 'free' | 'premium' | 'premium_plus',
  endDate: string
): Promise<void> {
  const { error } = await supabase
    .from('profiles')
    .update({
      subscription_tier: tier,
      subscription_start_date: new Date().toISOString(),
      subscription_end_date: endDate
    })
    .eq('id', (await supabase.auth.getUser()).data.user?.id)

  if (error) throw error
}

export async function initiateVideoCall(
  receiverId: string,
  scheduledFor?: string
): Promise<VideoCall> {
  // Check if user has video call feature
  const { data: profile } = await supabase
    .from('profiles')
    .select('subscription_tier')
    .eq('id', (await supabase.auth.getUser()).data.user?.id)
    .single()

  if (!profile || profile.subscription_tier === 'free') {
    throw new Error('Video calls are only available for premium users')
  }

  // Create video call record
  const { data, error } = await supabase
    .from('video_calls')
    .insert({
      caller_id: (await supabase.auth.getUser()).data.user?.id,
      receiver_id: receiverId,
      scheduled_for: scheduledFor,
      room_id: `room_${Math.random().toString(36).substring(7)}`
    })
    .select()
    .single()

  if (error) throw error
  return data
}

export async function updateVideoCallStatus(
  callId: string,
  status: VideoCall['status'],
  additionalData: Partial<VideoCall> = {}
): Promise<void> {
  const { error } = await supabase
    .from('video_calls')
    .update({
      status,
      ...additionalData
    })
    .eq('id', callId)

  if (error) throw error
}

export async function getVideoCallHistory(): Promise<VideoCall[]> {
  const userId = (await supabase.auth.getUser()).data.user?.id
  const { data, error } = await supabase
    .from('video_calls')
    .select('*')
    .or(`caller_id.eq.${userId},receiver_id.eq.${userId}`)
    .order('created_at', { ascending: false })

  if (error) throw error
  return data
}

export async function searchUsers(params: {
  maxDistance?: number
  country?: string
  city?: string
  relationshipType?: string[]
  relationshipIntentions?: string[]
  page?: number
  limit?: number
}) {
  const {
    maxDistance = 100, // km
    country,
    city,
    relationshipType,
    relationshipIntentions,
    page = 1,
    limit = 20
  } = params

  // Get current user's location
  const { data: currentUser } = await supabase
    .from('profiles')
    .select('latitude, longitude, subscription_tier')
    .eq('id', (await supabase.auth.getUser()).data.user?.id)
    .single()

  if (!currentUser) throw new Error('User not found')

  // Build query
  let query = supabase
    .from('profiles')
    .select('*, matching_scores!matching_scores_user2_id_fkey(*)')

  // Apply filters
  if (currentUser.subscription_tier !== 'free') {
    if (country) query = query.eq('location_country', country)
    if (city) query = query.eq('location_city', city)
    if (relationshipType) {
      query = query.contains('relationship_type', relationshipType)
    }
    if (relationshipIntentions) {
      query = query.contains('relationship_intentions', relationshipIntentions)
    }
  }

  // Apply distance filter if location is available
  if (currentUser.latitude && currentUser.longitude) {
    query = query.filter('location_geom', 'not.is.null')
    if (currentUser.subscription_tier !== 'free') {
      query = query.filter(
        'location_geom',
        'st_dwithin',
        `POINT(${currentUser.longitude} ${currentUser.latitude})`,
        maxDistance * 1000 // Convert km to meters
      )
    } else {
      // Free users can only see people within 50km
      query = query.filter(
        'location_geom',
        'st_dwithin',
        `POINT(${currentUser.longitude} ${currentUser.latitude})`,
        50000 // 50km in meters
      )
    }
  }

  // Add pagination
  const start = (page - 1) * limit
  query = query.range(start, start + limit - 1)

  const { data, error } = await query

  if (error) throw error
  return data
}

export async function updateUserLocation(
  latitude: number,
  longitude: number,
  country: string,
  city: string
): Promise<void> {
  const { error } = await supabase
    .from('profiles')
    .update({
      latitude,
      longitude,
      location_country: country,
      location_city: city
    })
    .eq('id', (await supabase.auth.getUser()).data.user?.id)

  if (error) throw error
}

export async function updateRelationshipPreferences(
  type: string[],
  intentions: string[]
): Promise<void> {
  const { error } = await supabase
    .from('profiles')
    .update({
      relationship_type: type,
      relationship_intentions: intentions
    })
    .eq('id', (await supabase.auth.getUser()).data.user?.id)

  if (error) throw error
}

export async function updateValuesAndInterests(
  values: string[]
): Promise<void> {
  const { error } = await supabase
    .from('profiles')
    .update({
      values_and_interests: values
    })
    .eq('id', (await supabase.auth.getUser()).data.user?.id)

  if (error) throw error
} 