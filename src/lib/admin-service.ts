import { supabase } from './supabase'

export interface AdminProfile {
  id: string
  full_name: string
  email: string
  trust_score: number
  id_verified: boolean
  video_verified: boolean
  account_status: 'active' | 'suspended' | 'deleted'
  created_at: string
  last_sign_in_at: string | null
  photo_uploaded: boolean
  video_uploaded: boolean
}

interface DatabaseProfile {
  id: string
  full_name: string
  trust_score: number
  id_verified: boolean
  video_verified: boolean
  account_status: 'active' | 'suspended' | 'deleted'
  created_at: string
  photo_uploaded: boolean
  video_uploaded: boolean
  auth_user: {
    email: string
    last_sign_in_at: string | null
  }
}

export interface Report {
  id: string
  reporter_id: string
  reported_user_id: string
  reason: string
  details: string | null
  status: 'pending' | 'reviewed' | 'resolved' | 'dismissed'
  created_at: string
  reviewed_at: string | null
  reviewed_by: string | null
  reporter: {
    full_name: string
  }
  reported_user: {
    full_name: string
    trust_score: number
  }
}

export async function isAdmin(): Promise<boolean> {
  const { data: profile, error } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', (await supabase.auth.getUser()).data.user?.id)
    .single()

  if (error) return false
  return profile?.role === 'admin'
}

export async function getUsers(
  filter: 'all' | 'suspicious' | 'pending_verification' = 'all',
  page = 1,
  limit = 20
): Promise<{ users: AdminProfile[]; total: number }> {
  let query = supabase
    .from('profiles')
    .select(`
      id,
      full_name,
      trust_score,
      id_verified,
      video_verified,
      account_status,
      created_at,
      photo_uploaded,
      video_uploaded,
      auth_user:auth.users!inner(
        email,
        last_sign_in_at
      )
    `, { count: 'exact' })

  // Apply filters
  if (filter === 'suspicious') {
    query = query.or('trust_score.lt.30,photo_uploaded.is.false')
  } else if (filter === 'pending_verification') {
    query = query.or('id_verified.is.false,video_verified.is.false')
      .eq('photo_uploaded', true)
      .eq('video_uploaded', true)
  }

  // Add pagination
  const start = (page - 1) * limit
  query = query.range(start, start + limit - 1)

  const { data, error, count } = await query

  if (error) throw error

  const users = (data as DatabaseProfile[]).map(profile => ({
    id: profile.id,
    full_name: profile.full_name,
    email: profile.auth_user.email,
    trust_score: profile.trust_score,
    id_verified: profile.id_verified,
    video_verified: profile.video_verified,
    account_status: profile.account_status,
    created_at: profile.created_at,
    last_sign_in_at: profile.auth_user.last_sign_in_at,
    photo_uploaded: profile.photo_uploaded,
    video_uploaded: profile.video_uploaded
  }))

  return {
    users,
    total: count || 0
  }
}

export async function getReports(
  status: 'pending' | 'all' = 'pending',
  page = 1,
  limit = 20
): Promise<{ reports: Report[]; total: number }> {
  let query = supabase
    .from('reports')
    .select(`
      *,
      reporter:profiles!reports_reporter_id_fkey(
        full_name
      ),
      reported_user:profiles!reports_reported_user_id_fkey(
        full_name,
        trust_score
      )
    `, { count: 'exact' })

  if (status === 'pending') {
    query = query.eq('status', 'pending')
  }

  // Add pagination
  const start = (page - 1) * limit
  query = query.range(start, start + limit - 1)
    .order('created_at', { ascending: false })

  const { data, error, count } = await query

  if (error) throw error

  return {
    reports: data as Report[],
    total: count || 0
  }
}

export async function updateVerificationStatus(
  userId: string,
  updates: {
    id_verified?: boolean
    video_verified?: boolean
  }
): Promise<void> {
  const { error } = await supabase
    .from('profiles')
    .update(updates)
    .eq('id', userId)

  if (error) throw error
}

export async function updateAccountStatus(
  userId: string,
  status: 'active' | 'suspended' | 'deleted'
): Promise<void> {
  const { error } = await supabase
    .from('profiles')
    .update({ account_status: status })
    .eq('id', userId)

  if (error) throw error
}

export async function updateReportStatus(
  reportId: string,
  status: 'reviewed' | 'resolved' | 'dismissed',
  adminId: string
): Promise<void> {
  const { error } = await supabase
    .from('reports')
    .update({
      status,
      reviewed_at: new Date().toISOString(),
      reviewed_by: adminId
    })
    .eq('id', reportId)

  if (error) throw error
} 