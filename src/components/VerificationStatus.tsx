'use client'

import { CheckCircleIcon, XCircleIcon } from '@heroicons/react/24/solid'

interface VerificationStatusProps {
  verifications: {
    id: boolean
    photo: boolean
    video: boolean
    profile: boolean
  }
  trustScore: number
}

export default function VerificationStatus({ verifications, trustScore }: VerificationStatusProps) {
  const getScoreColor = () => {
    if (trustScore >= 80) return 'bg-green-600'
    if (trustScore >= 50) return 'bg-yellow-600'
    return 'bg-red-600'
  }

  const verificationSteps = [
    {
      name: 'ID Verification',
      completed: verifications.id,
      points: 20,
      description: 'Government-issued ID'
    },
    {
      name: 'Profile Photo',
      completed: verifications.photo,
      points: 20,
      description: 'Clear photo of yourself'
    },
    {
      name: 'Intro Video',
      completed: verifications.video,
      points: 30,
      description: '30-second introduction'
    },
    {
      name: 'Profile Info',
      completed: verifications.profile,
      points: 30,
      description: 'Complete profile details'
    }
  ]

  return (
    <div className="bg-white rounded-xl shadow-lg p-6">
      <div className="mb-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-2">Trust Score</h2>
        <div className="relative h-4 bg-gray-200 rounded-full overflow-hidden">
          <div
            className={`absolute left-0 top-0 h-full transition-all duration-500 ${getScoreColor()}`}
            style={{ width: `${trustScore}%` }}
          />
        </div>
        <div className="mt-2 flex justify-between items-center">
          <span className="text-sm font-medium text-gray-600">Progress</span>
          <span className={`text-lg font-bold ${
            trustScore >= 80 ? 'text-green-600' :
            trustScore >= 50 ? 'text-yellow-600' : 'text-red-600'
          }`}>{trustScore}%</span>
        </div>
      </div>

      <div className="space-y-4">
        {verificationSteps.map((step) => (
          <div key={step.name} className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg">
            {step.completed ? (
              <CheckCircleIcon className="w-6 h-6 text-green-600 flex-shrink-0" />
            ) : (
              <XCircleIcon className="w-6 h-6 text-gray-400 flex-shrink-0" />
            )}
            <div className="flex-grow">
              <div className="flex justify-between items-center mb-1">
                <h3 className="font-medium text-gray-900">{step.name}</h3>
                <span className={`text-sm ${step.completed ? 'text-green-600' : 'text-gray-500'}`}>
                  +{step.points}%
                </span>
              </div>
              <p className="text-sm text-gray-600">{step.description}</p>
            </div>
          </div>
        ))}
      </div>

      {trustScore < 100 && (
        <div className="mt-6 pt-4 border-t border-gray-200">
          <p className="text-sm text-gray-600">
            Complete all verifications to achieve a 100% trust score and increase your visibility.
          </p>
        </div>
      )}
    </div>
  )
} 