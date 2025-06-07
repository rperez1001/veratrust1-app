'use client'

import { useEffect, useState } from 'react'
import { useUser } from '@/hooks/useUser'
import { Match, getMatches } from '@/lib/match-service'
import Image from 'next/image'
import Chat from '@/components/Chat'

interface MatchWithUser extends Match {
  matched_user: {
    full_name: string
    profile_photo_url: string | null
  }
}

export default function MessagesPage() {
  const { user } = useUser()
  const [matches, setMatches] = useState<MatchWithUser[]>([])
  const [selectedMatch, setSelectedMatch] = useState<MatchWithUser | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!user) return

    const loadMatches = async () => {
      try {
        const matches = await getMatches(user.id)
        setMatches(matches as MatchWithUser[])
        setLoading(false)
      } catch (error) {
        console.error('Error loading matches:', error)
        setLoading(false)
      }
    }

    loadMatches()
  }, [user])

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-pink-500" />
      </div>
    )
  }

  if (matches.length === 0) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-4">
        <h2 className="text-2xl font-semibold mb-2">No Matches Yet</h2>
        <p className="text-gray-600 dark:text-gray-300 text-center">
          Keep swiping to find your perfect match!
        </p>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex">
      {/* Matches Sidebar */}
      <div className="w-80 border-r dark:border-gray-700 bg-white dark:bg-gray-900">
        <div className="p-4 border-b dark:border-gray-700">
          <h1 className="text-xl font-semibold">Messages</h1>
        </div>
        <div className="overflow-y-auto">
          {matches.map(match => (
            <button
              key={match.id}
              onClick={() => setSelectedMatch(match)}
              className={`w-full p-4 flex items-center gap-3 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors ${
                selectedMatch?.id === match.id
                  ? 'bg-gray-100 dark:bg-gray-800'
                  : ''
              }`}
            >
              {match.matched_user.profile_photo_url ? (
                <div className="relative w-12 h-12">
                  <Image
                    src={match.matched_user.profile_photo_url}
                    alt={match.matched_user.full_name}
                    fill
                    className="rounded-full object-cover"
                  />
                </div>
              ) : (
                <div className="w-12 h-12 rounded-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center">
                  <span className="text-xl">
                    {match.matched_user.full_name[0]}
                  </span>
                </div>
              )}
              <div className="flex-1 text-left">
                <h3 className="font-medium">
                  {match.matched_user.full_name}
                </h3>
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Chat Area */}
      <div className="flex-1 flex">
        {selectedMatch ? (
          <Chat match={selectedMatch} />
        ) : (
          <div className="flex-1 flex items-center justify-center text-gray-500 dark:text-gray-400">
            <p>Select a match to start chatting</p>
          </div>
        )}
      </div>
    </div>
  )
} 