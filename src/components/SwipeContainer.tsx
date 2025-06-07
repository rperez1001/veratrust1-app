import { useState, useEffect } from 'react'
import { getNextProfiles, createSwipe, Profile } from '@/lib/swipe-service'
import SwipeCard from './SwipeCard'
import { toast } from 'sonner'

export default function SwipeContainer() {
  const [profiles, setProfiles] = useState<Profile[]>([])
  const [currentIndex, setCurrentIndex] = useState(0)
  const [isLoading, setIsLoading] = useState(true)

  const loadMoreProfiles = async () => {
    try {
      const newProfiles = await getNextProfiles(5)
      setProfiles(prev => [...prev, ...newProfiles])
    } catch (error) {
      console.error('Error loading profiles:', error)
      toast.error('Failed to load profiles')
    }
  }

  useEffect(() => {
    loadMoreProfiles()
    setIsLoading(false)
  }, [])

  // Load more profiles when we're running low
  useEffect(() => {
    if (profiles.length - currentIndex <= 2) {
      loadMoreProfiles()
    }
  }, [currentIndex, profiles.length])

  const handleSwipe = async (direction: 'left' | 'right') => {
    const currentProfile = profiles[currentIndex]
    if (!currentProfile) return

    try {
      const action = direction === 'right' ? 'like' : 'skip'
      const { isMatch } = await createSwipe(currentProfile.id, action)

      // Show appropriate toast message
      if (action === 'like' && isMatch) {
        toast.success("It's a match! 🎉", {
          description: `You and ${currentProfile.full_name} liked each other!`,
          action: {
            label: 'Send Message',
            onClick: () => {/* Navigate to chat */}
          }
        })
      } else if (action === 'like') {
        toast.success('Profile liked! ❤️')
      }

      // Move to next profile
      setCurrentIndex(prev => prev + 1)
    } catch (error) {
      console.error('Error handling swipe:', error)
      toast.error('Failed to process your action')
    }
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-[70vh]">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    )
  }

  if (profiles.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-[70vh] text-center px-4">
        <h3 className="text-2xl font-semibold mb-2">No more profiles</h3>
        <p className="text-gray-600 mb-4">
          We're out of profiles to show you right now. Check back later!
        </p>
        <button
          onClick={() => loadMoreProfiles()}
          className="px-4 py-2 bg-blue-500 text-white rounded-full hover:bg-blue-600 transition-colors"
        >
          Refresh
        </button>
      </div>
    )
  }

  return (
    <div className="relative h-[70vh] max-w-sm mx-auto">
      {/* Show next 3 cards for smooth transitions */}
      {profiles
        .slice(currentIndex, currentIndex + 3)
        .map((profile, index) => (
          <SwipeCard
            key={profile.id}
            profile={profile}
            onSwipe={handleSwipe}
            isActive={index === 0}
          />
        ))}
    </div>
  )
} 