'use client'

import { useState } from 'react'
import Image from 'next/image'
import { motion, PanInfo, useAnimation } from 'framer-motion'
import { Heart, X } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { useUser } from '@/hooks/useUser'

interface ProfileCardProps {
  profile: {
    id: string
    full_name: string
    age: number
    location: string
    relationship_goal: string
    profile_photo_url: string
    trust_score: number
  }
  onSwipe: (direction: 'left' | 'right') => void
}

export default function ProfileCard({ profile, onSwipe }: ProfileCardProps) {
  const { user } = useUser()
  const [isAnimating, setIsAnimating] = useState(false)
  const controls = useAnimation()

  const handleDragEnd = async (event: any, info: PanInfo) => {
    const offset = info.offset.x
    const velocity = info.velocity.x

    if (Math.abs(offset) < 100 && Math.abs(velocity) < 500) {
      await controls.start({ x: 0, transition: { type: 'spring' } })
      return
    }

    const direction = offset > 0 ? 'right' : 'left'
    await handleSwipe(direction)
  }

  const handleSwipe = async (direction: 'left' | 'right') => {
    if (isAnimating || !user) return
    setIsAnimating(true)

    const xPosition = direction === 'left' ? -200 : 200
    await controls.start({
      x: xPosition,
      opacity: 0,
      transition: { duration: 0.2 }
    })

    // Record the swipe in the database
    const { error } = await supabase
      .from('swipes')
      .insert({
        user_id: user.id,
        liked_user_id: profile.id,
        action: direction === 'right' ? 'like' : 'skip'
      })

    if (error) {
      console.error('Error recording swipe:', error)
    }

    onSwipe(direction)
    setIsAnimating(false)
  }

  return (
    <motion.div
      drag="x"
      dragConstraints={{ left: 0, right: 0 }}
      onDragEnd={handleDragEnd}
      animate={controls}
      className="relative w-full max-w-sm mx-auto aspect-[3/4] bg-white dark:bg-gray-800 rounded-2xl shadow-lg overflow-hidden"
    >
      {/* Profile Photo */}
      <div className="relative w-full h-full">
        <Image
          src={profile.profile_photo_url}
          alt={profile.full_name}
          fill
          className="object-cover"
          priority
        />
        {/* Gradient Overlay */}
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-black/60" />
      </div>

      {/* Profile Info */}
      <div className="absolute bottom-0 left-0 right-0 p-6 text-white">
        <div className="flex items-center gap-3 mb-2">
          <h2 className="text-2xl font-semibold">
            {profile.full_name}, {profile.age}
          </h2>
          <div className="px-2 py-1 bg-green-500 rounded-full text-sm">
            {profile.trust_score}% Verified
          </div>
        </div>
        <p className="text-gray-200 mb-1">{profile.location}</p>
        <p className="text-sm text-gray-300">{profile.relationship_goal}</p>
      </div>

      {/* Action Buttons */}
      <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-4">
        <button
          onClick={() => handleSwipe('left')}
          className="w-12 h-12 flex items-center justify-center bg-white/10 hover:bg-white/20 rounded-full backdrop-blur-lg transition-colors"
        >
          <X className="w-6 h-6 text-white" />
        </button>
        <button
          onClick={() => handleSwipe('right')}
          className="w-12 h-12 flex items-center justify-center bg-pink-500 hover:bg-pink-600 rounded-full transition-colors"
        >
          <Heart className="w-6 h-6 text-white" />
        </button>
      </div>
    </motion.div>
  )
} 