'use client'

import { CheckCircleIcon, XCircleIcon } from '@heroicons/react/24/solid'

interface TrustScoreCardProps {
  trustScore: number
  idUploaded: boolean
  photoUploaded: boolean
  videoUploaded: boolean
}

export default function TrustScoreCard({
  trustScore,
  idUploaded,
  photoUploaded,
  videoUploaded
}: TrustScoreCardProps) {
  const getScoreColorClass = () => {
    if (trustScore >= 80) return 'bg-green-500'
    if (trustScore >= 50) return 'bg-yellow-500'
    return 'bg-red-500'
  }

  const getBadgeColorClass = () => {
    if (trustScore >= 80) return 'bg-green-100 text-green-800 ring-green-500/30'
    if (trustScore >= 50) return 'bg-yellow-100 text-yellow-800 ring-yellow-500/30'
    return 'bg-red-100 text-red-800 ring-red-500/30'
  }

  const verificationItems = [
    {
      label: 'ID',
      verified: idUploaded,
      successText: 'ID Verified',
      failureText: 'ID Not Uploaded'
    },
    {
      label: 'Photo',
      verified: photoUploaded,
      successText: 'Photo Verified',
      failureText: 'Photo Not Uploaded'
    },
    {
      label: 'Video',
      verified: videoUploaded,
      successText: 'Video Verified',
      failureText: 'Video Not Uploaded'
    }
  ]

  return (
    <div className="bg-white rounded-xl shadow-lg p-6">
      {/* Trust Score Badge */}
      <div className="flex justify-center mb-6">
        <div className={`inline-flex items-center rounded-full px-5 py-2 text-lg font-semibold ring-1 ring-inset ${getBadgeColorClass()}`}>
          Trust Score: {trustScore}
        </div>
      </div>

      {/* Progress Bar */}
      <div className="relative h-4 bg-gray-200 rounded-full overflow-hidden mb-6">
        <div
          className={`absolute left-0 top-0 h-full transition-all duration-500 ${getScoreColorClass()}`}
          style={{ width: `${trustScore}%` }}
        />
      </div>

      {/* Verification Checklist */}
      <div className="space-y-3">
        {verificationItems.map((item) => (
          <div key={item.label} className="flex items-center gap-3 p-2 rounded-lg hover:bg-gray-50">
            {item.verified ? (
              <CheckCircleIcon className="w-6 h-6 text-green-500 flex-shrink-0" />
            ) : (
              <XCircleIcon className="w-6 h-6 text-red-500 flex-shrink-0" />
            )}
            <span className={`text-sm font-medium ${
              item.verified ? 'text-green-700' : 'text-red-700'
            }`}>
              {item.verified ? item.successText : item.failureText}
            </span>
          </div>
        ))}
      </div>

      {/* Encouragement Message */}
      {trustScore < 100 && (
        <div className="mt-6 pt-4 border-t border-gray-200">
          <p className="text-sm text-gray-600 text-center">
            Complete all verifications to achieve a 100% trust score!
          </p>
        </div>
      )}
    </div>
  )
} 