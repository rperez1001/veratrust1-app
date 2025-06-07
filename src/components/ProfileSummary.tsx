'use client'

import Image from 'next/image'
import { CheckBadgeIcon } from '@heroicons/react/24/solid'

interface ProfileSummaryProps {
  profile: {
    full_name: string
    email: string
    location: string
    relationship_goals: string
    profile_photo_url: string | null
  }
  trustScore: number
}

export default function ProfileSummary({ profile, trustScore }: ProfileSummaryProps) {
  return (
    <div className="bg-white rounded-xl shadow-lg p-6">
      <div className="flex items-start gap-6">
        {/* Profile Photo */}
        <div className="relative w-24 h-24 flex-shrink-0">
          {profile.profile_photo_url ? (
            <Image
              src={profile.profile_photo_url}
              alt={profile.full_name}
              fill
              className="rounded-full object-cover"
            />
          ) : (
            <div className="w-full h-full bg-gray-200 rounded-full flex items-center justify-center">
              <span className="text-gray-400 text-2xl">
                {profile.full_name.charAt(0)}
              </span>
            </div>
          )}
        </div>

        {/* User Info */}
        <div className="flex-grow">
          <div className="flex items-center gap-2 mb-2">
            <h2 className="text-2xl font-bold text-gray-900">{profile.full_name}</h2>
            {trustScore === 100 && (
              <CheckBadgeIcon className="w-6 h-6 text-green-600" />
            )}
          </div>
          <div className="space-y-1 text-gray-600">
            <p>{profile.email}</p>
            <p>{profile.location}</p>
            <p>{profile.relationship_goals}</p>
          </div>
        </div>

        {/* Trust Score */}
        <div className="flex-shrink-0 text-right">
          <div className="text-sm font-medium text-gray-500 mb-1">Trust Score</div>
          <div className="relative w-32 h-4 bg-gray-200 rounded-full overflow-hidden">
            <div 
              className={`absolute left-0 top-0 h-full rounded-full transition-all duration-500 ${
                trustScore >= 80 ? 'bg-green-600' :
                trustScore >= 50 ? 'bg-yellow-600' : 'bg-red-600'
              }`}
              style={{ width: `${trustScore}%` }}
            />
          </div>
          <div className="mt-1 text-sm font-medium text-gray-700">{trustScore}%</div>
        </div>
      </div>
    </div>
  )
} 