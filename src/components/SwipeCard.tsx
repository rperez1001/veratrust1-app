import { useState } from 'react'
import { motion, useAnimation, PanInfo } from 'framer-motion'
import { Profile } from '@/lib/swipe-service'

interface SwipeCardProps {
  profile: Profile
  onSwipe: (direction: 'left' | 'right') => void
  isActive: boolean
}

export default function SwipeCard({ profile, onSwipe, isActive }: SwipeCardProps) {
  const [exitX, setExitX] = useState(0)
  const controls = useAnimation()

  const getRotation = (x: number) => {
    return x * 0.1 // Adjust rotation based on drag distance
  }

  const handleDragEnd = async (event: any, info: PanInfo) => {
    const offset = info.offset.x
    const velocity = info.velocity.x

    // Determine if the card should be dismissed based on drag distance or velocity
    const shouldDismiss = Math.abs(offset) > 100 || Math.abs(velocity) > 500

    if (shouldDismiss) {
      const direction = offset > 0 ? 'right' : 'left'
      setExitX(offset)
      await controls.start({ x: offset * 3 })
      onSwipe(direction)
    } else {
      controls.start({ x: 0, y: 0, rotate: 0 })
    }
  }

  if (!isActive) return null

  return (
    <motion.div
      className="absolute w-full h-[70vh] max-w-sm mx-auto"
      animate={controls}
      drag={isActive ? 'x' : false}
      dragConstraints={{ left: 0, right: 0, top: 0, bottom: 0 }}
      onDragEnd={handleDragEnd}
      style={{ x: 0 }}
      whileDrag={{ scale: 1.05 }}
    >
      <div className="relative w-full h-full bg-white rounded-2xl shadow-xl overflow-hidden">
        {/* Profile Image */}
        <div className="w-full h-full">
          <img
            src={profile.profile_photo_url || '/default-avatar.png'}
            alt={profile.full_name}
            className="w-full h-full object-cover"
          />
        </div>

        {/* Profile Info Overlay */}
        <div className="absolute bottom-0 left-0 right-0 p-6 bg-gradient-to-t from-black/80 to-transparent text-white">
          <div className="flex items-center gap-4 mb-2">
            <h2 className="text-2xl font-semibold">
              {profile.full_name}, {profile.age}
            </h2>
            <div className="bg-blue-500 px-2 py-1 rounded-full text-sm">
              {profile.trust_score}% Trust
            </div>
          </div>
          
          <div className="flex items-center gap-2 text-sm mb-2">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
            <span>{profile.location}</span>
          </div>

          <div className="inline-block bg-pink-500 px-3 py-1 rounded-full text-sm">
            {profile.relationship_goal}
          </div>
        </div>

        {/* Action Buttons */}
        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-6">
          <button
            onClick={() => onSwipe('left')}
            className="w-14 h-14 bg-white rounded-full flex items-center justify-center shadow-lg hover:scale-110 transition-transform"
          >
            <span className="text-2xl">❌</span>
          </button>
          <button
            onClick={() => onSwipe('right')}
            className="w-14 h-14 bg-white rounded-full flex items-center justify-center shadow-lg hover:scale-110 transition-transform"
          >
            <span className="text-2xl">❤️</span>
          </button>
        </div>
      </div>
    </motion.div>
  )
} 