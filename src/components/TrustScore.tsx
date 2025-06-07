'use client'

interface TrustScoreProps {
  score: number
  verifications: {
    id: boolean
    photo: boolean
    video: boolean
    profile: boolean
  }
}

export default function TrustScore({ score, verifications }: TrustScoreProps) {
  const getScoreColor = () => {
    if (score >= 80) return 'text-green-600'
    if (score >= 50) return 'text-yellow-600'
    return 'text-red-600'
  }

  return (
    <div className="bg-white rounded-xl shadow-lg p-6">
      <div className="text-center mb-6">
        <h2 className="text-2xl font-bold text-gray-900">Trust Score</h2>
        <div className={`text-4xl font-bold mt-2 ${getScoreColor()}`}>
          {score}%
        </div>
      </div>

      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <span className="text-gray-700">ID Verification</span>
          {verifications.id ? (
            <span className="text-green-600">✓ Verified (+20%)</span>
          ) : (
            <span className="text-gray-400">Pending</span>
          )}
        </div>
        <div className="flex items-center justify-between">
          <span className="text-gray-700">Profile Photo</span>
          {verifications.photo ? (
            <span className="text-green-600">✓ Verified (+20%)</span>
          ) : (
            <span className="text-gray-400">Pending</span>
          )}
        </div>
        <div className="flex items-center justify-between">
          <span className="text-gray-700">Intro Video</span>
          {verifications.video ? (
            <span className="text-green-600">✓ Verified (+30%)</span>
          ) : (
            <span className="text-gray-400">Pending</span>
          )}
        </div>
        <div className="flex items-center justify-between">
          <span className="text-gray-700">Profile Completion</span>
          {verifications.profile ? (
            <span className="text-green-600">✓ Complete (+30%)</span>
          ) : (
            <span className="text-gray-400">Incomplete</span>
          )}
        </div>
      </div>

      <div className="mt-6 pt-6 border-t border-gray-200">
        <p className="text-sm text-gray-600">
          Complete all verifications to achieve a 100% trust score and increase your visibility.
        </p>
      </div>
    </div>
  )
} 