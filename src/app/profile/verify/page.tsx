'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/lib/auth-context'
import { getProfile, updateProfile } from '@/lib/profile-service'
import { uploadFile } from '@/lib/upload'
import FileUpload from '@/components/FileUpload'
import TrustScore from '@/components/TrustScore'
import IdDocumentUpload from '@/components/IdDocumentUpload'
import PhotoUpload from '@/components/PhotoUpload'
import VideoUpload from '@/components/VideoUpload'

interface VerificationStatus {
  id: boolean
  photo: boolean
  video: boolean
  profile: boolean
}

export default function Verify() {
  const { user, loading } = useAuth()
  const router = useRouter()
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [verificationStatus, setVerificationStatus] = useState<VerificationStatus>({
    id: false,
    photo: false,
    video: false,
    profile: false
  })

  useEffect(() => {
    if (!loading && !user) {
      router.push('/login')
      return
    }

    if (user) {
      loadVerificationStatus()
    }
  }, [user, loading])

  const loadVerificationStatus = async () => {
    try {
      const profile = await getProfile(user!.id)
      if (profile) {
        // Check if profile is complete
        const isProfileComplete = Boolean(
          profile.full_name &&
          profile.age &&
          profile.gender &&
          profile.location &&
          profile.relationship_goals &&
          profile.values?.length > 0
        )

        setVerificationStatus({
          id: !!profile.id_document_url,
          photo: !!profile.profile_photo_url,
          video: !!profile.intro_video_url,
          profile: isProfileComplete
        })
      }
    } catch (err) {
      console.error('Error loading verification status:', err)
    }
  }

  const calculateTrustScore = () => {
    let score = 0
    
    // ID verification: +20%
    if (verificationStatus.id) score += 20
    
    // Photo verification: +20%
    if (verificationStatus.photo) score += 20
    
    // Video verification: +30%
    if (verificationStatus.video) score += 30
    
    // Profile completion: +30%
    if (verificationStatus.profile) score += 30
    
    return score
  }

  const handleUploadComplete = async (type: keyof VerificationStatus, url: string) => {
    try {
      if (!user) return

      const updateField = type === 'id' ? 'id_document_url' :
                         type === 'photo' ? 'profile_photo_url' : 'intro_video_url'

      await updateProfile(user.id, {
        [updateField]: url
      })

      setVerificationStatus(prev => ({
        ...prev,
        [type]: true
      }))
    } catch (err) {
      console.error(`Error updating ${type} verification:`, err)
      setError(`Failed to update ${type} verification status`)
    }
  }

  if (loading) {
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
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">Verify Your Profile</h1>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="md:col-span-2 space-y-8">
            <div className="bg-white rounded-xl shadow-lg p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">ID Verification</h2>
              <p className="text-gray-600 mb-4">
                Upload a government-issued ID to verify your identity. Accepted formats: PDF, JPG, PNG
              </p>
              <IdDocumentUpload
                userId={user!.id}
                onUploadComplete={() => {
                  setVerificationStatus(prev => ({
                    ...prev,
                    id: true
                  }))
                }}
                className={verificationStatus.id ? 'opacity-50' : ''}
              />
              {verificationStatus.id && (
                <p className="mt-2 text-sm text-green-600">ID verified successfully</p>
              )}
            </div>

            <div className="bg-white rounded-xl shadow-lg p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">Profile Photo</h2>
              <p className="text-gray-600 mb-4">
                Upload a clear photo of yourself. This will be visible to other users.
              </p>
              <PhotoUpload
                userId={user!.id}
                onUploadComplete={() => {
                  setVerificationStatus(prev => ({
                    ...prev,
                    photo: true
                  }))
                }}
                className={verificationStatus.photo ? 'opacity-50' : ''}
              />
              {verificationStatus.photo && (
                <p className="mt-2 text-sm text-green-600">Profile photo uploaded successfully</p>
              )}
            </div>

            <div className="bg-white rounded-xl shadow-lg p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">Intro Video</h2>
              <p className="text-gray-600 mb-4">
                Record a 30-second video introducing yourself to potential matches.
              </p>
              <VideoUpload
                userId={user!.id}
                onUploadComplete={() => {
                  setVerificationStatus(prev => ({
                    ...prev,
                    video: true
                  }))
                }}
                className={verificationStatus.video ? 'opacity-50' : ''}
              />
              {verificationStatus.video && (
                <p className="mt-2 text-sm text-green-600">Intro video uploaded successfully</p>
              )}
            </div>

            {error && (
              <p className="text-red-600 text-sm">{error}</p>
            )}
          </div>

          <div className="md:col-span-1">
            <TrustScore
              score={calculateTrustScore()}
              verifications={verificationStatus}
            />

            <button
              onClick={() => router.push('/dashboard')}
              className="w-full mt-6 px-6 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors"
            >
              Back to Dashboard
            </button>
          </div>
        </div>
      </div>
    </main>
  )
} 