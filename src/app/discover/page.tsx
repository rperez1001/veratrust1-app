'use client'

import { useEffect, useState } from 'react'
import { useUser } from '@/hooks/useUser'
import { supabase } from '@/lib/supabase'
import ProfileCard from '@/components/ProfileCard'

interface Profile {
  id: string
  full_name: string
  age: number
  location: string
  relationship_goal: string
  profile_photo_url: string
  trust_score: number
}

export default function DiscoverPage() {
  const { user } = useUser()
  const [profiles, setProfiles] = useState<Profile[]>([])
  const [loading, setLoading] = useState(true)

  const fetchProfiles = async () => {
    if (!user) return

    try {
      // Get profiles that:
      // 1. Have trust score >= 60%
      // 2. Haven't been swiped on by current user
      // 3. Aren't the current user
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .not('id', 'in', (
          supabase
            .from('swipes')
            .select('liked_user_id')
            .eq('user_id', user.id)
        ))
        .neq('id', user.id)
        .gte('trust_score', 60)
        .order('created_at', { ascending: false })
        .limit(10)

      if (error) throw error

      setProfiles(data as Profile[])
    } catch (error) {
      console.error('Error fetching profiles:', error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchProfiles()
  }, [user])

  const handleSwipe = (direction: 'left' | 'right') => {
    setProfiles(prev => prev.slice(1))

    // Fetch more profiles when running low
    if (profiles.length < 3) {
      fetchProfiles()
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-pink-500" />
      </div>
    )
  }

  if (profiles.length === 0) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-4">
        <h2 className="text-2xl font-semibold mb-2">No More Profiles</h2>
        <p className="text-gray-600 dark:text-gray-300 text-center">
          We're currently looking for more verified profiles that match your preferences.
          Check back soon!
        </p>
      </div>
    )
  }

  return (
    <div className="min-h-screen p-4 flex flex-col">
      <h1 className="text-3xl font-bold mb-8 text-center">Discover</h1>
      <div className="flex-1 flex items-center justify-center">
        <ProfileCard
          profile={profiles[0]}
          onSwipe={handleSwipe}
        />
      </div>
    </div>
  )
} 