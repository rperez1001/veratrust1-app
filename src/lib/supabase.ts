import { createClient } from '@supabase/supabase-js'
import { getSupabaseConfig } from './env'

const { supabaseUrl, supabaseAnonKey } = getSupabaseConfig()
export const supabase = createClient(supabaseUrl, supabaseAnonKey)

export type Profile = {
  id: string
  full_name: string
  email: string | null
  age: number
  gender: 'male' | 'female' | 'other'
  location: string
  relationship_goal: 'long-term' | 'marriage' | 'poly' | 'casual' | 'friendship'
  values: string[]
  id_uploaded: boolean
  photo_uploaded: boolean
  video_uploaded: boolean
  trust_score: number
  created_at: string
  updated_at: string
} 