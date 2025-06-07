'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@/lib/auth-context'
import { useRouter } from 'next/navigation'
import { getProfile } from '@/lib/profile-service'
import ProfileSummary from '@/components/ProfileSummary'
import TrustScoreCard from '@/components/TrustScoreCard'

interface Profile {
  full_name: string
  email: string
  location: string
  relationship_goals: string
  profile_photo_url: string | null
  id_document_url: string | null
  intro_video_url: string | null
  values: string[]
  age: number
  gender: string
}

export default function Dashboard() {
  const { user, loading, signOut } = useAuth()
  const router = useRouter()
  const [profile, setProfile] = useState<Profile | null>(null)

  useEffect(() => {
    if (!loading && !user) {
      router.push('/login')
      return
    }

    if (user) {
      loadProfile()
    }
  }, [loading, user, router])

  const loadProfile = async () => {
    try {
      if (!user) return
      const profileData = await getProfile(user.id)
      setProfile(profileData)
    } catch (err) {
      console.error('Error loading profile:', err)
    }
  }

  const getVerificationStatus = () => {
    if (!profile) return {
      id: false,
      photo: false,
      video: false,
      profile: false
    }

    const isProfileComplete = Boolean(
      profile.full_name &&
      profile.age &&
      profile.gender &&
      profile.location &&
      profile.relationship_goals &&
      profile.values?.length > 0
    )

    return {
      id: !!profile.id_document_url,
      photo: !!profile.profile_photo_url,
      video: !!profile.intro_video_url,
      profile: isProfileComplete
    }
  }

  const calculateTrustScore = () => {
    if (!profile) return 0
    const verifications = getVerificationStatus()
    let score = 0
    
    if (verifications.id) score += 20
    if (verifications.photo) score += 20
    if (verifications.video) score += 30
    if (verifications.profile) score += 30
    
    return score
  }

  if (loading || !profile) {
    return (
      <main className="flex min-h-screen items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-semibold text-gray-900">Loading...</h2>
        </div>
      </main>
    )
  }

  return (
    <main className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-4xl mx-auto space-y-8">
        <div className="flex justify-end">
          <button
            onClick={() => signOut()}
            className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors"
          >
            Sign Out
          </button>
        </div>

        <ProfileSummary
          profile={{
            ...profile,
            email: user?.email ?? ''
          }}
          trustScore={calculateTrustScore()}
        />

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-white p-6 rounded-xl shadow-lg">
            <h2 className="text-xl font-semibold text-primary mb-4">Your Profile</h2>
            <p className="text-gray-600">Complete your profile to start connecting with others.</p>
            <button
              onClick={() => router.push('/profile/edit')}
              className="mt-4 px-4 py-2 bg-primary text-white rounded-lg hover:bg-opacity-90 transition-colors"
            >
              Edit Profile
            </button>
          </div>

          <div>
            <TrustScoreCard
              trustScore={calculateTrustScore()}
              idUploaded={!!profile?.id_document_url}
              photoUploaded={!!profile?.profile_photo_url}
              videoUploaded={!!profile?.intro_video_url}
            />
            <button
              onClick={() => router.push('/profile/verify')}
              className="w-full mt-4 px-4 py-2 bg-secondary text-white rounded-lg hover:bg-opacity-90 transition-colors"
            >
              Complete Verification
            </button>
          </div>
        </div>
      </div>
    </main>
  )
} 