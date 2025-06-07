'use client'

import { useEffect, useState } from 'react'
import { useUser } from '@/hooks/useUser'
import { Match, subscribeToMatches } from '@/lib/match-service'
import { RealtimeChannel } from '@supabase/supabase-js'
import Image from 'next/image'
import Link from 'next/link'
import { motion, AnimatePresence } from 'framer-motion'
import { Heart } from 'lucide-react'

export default function MatchNotification() {
  const { user } = useUser()
  const [latestMatch, setLatestMatch] = useState<Match | null>(null)
  const [subscription, setSubscription] = useState<RealtimeChannel | null>(null)

  useEffect(() => {
    if (!user) return

    // Subscribe to new matches
    const sub = subscribeToMatches(user.id, (match) => {
      setLatestMatch(match)
      // Clear notification after 5 seconds
      setTimeout(() => setLatestMatch(null), 5000)
    })

    setSubscription(sub)

    return () => {
      subscription?.unsubscribe()
    }
  }, [user])

  if (!latestMatch?.matched_user) return null

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: -50 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -50 }}
        className="fixed top-4 right-4 z-50"
      >
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-4 max-w-sm">
          <div className="flex items-center gap-4">
            <div className="relative w-12 h-12">
              {latestMatch.matched_user.profile_photo_url ? (
                <Image
                  src={latestMatch.matched_user.profile_photo_url}
                  alt={latestMatch.matched_user.full_name}
                  fill
                  className="rounded-full object-cover"
                />
              ) : (
                <div className="w-12 h-12 rounded-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center">
                  <span className="text-xl">
                    {latestMatch.matched_user.full_name[0]}
                  </span>
                </div>
              )}
              <div className="absolute -bottom-1 -right-1 bg-pink-500 rounded-full p-1">
                <Heart className="w-4 h-4 text-white" />
              </div>
            </div>
            <div>
              <h3 className="font-semibold text-lg">It's a match!</h3>
              <p className="text-sm text-gray-600 dark:text-gray-300">
                You and {latestMatch.matched_user.full_name} liked each other
              </p>
            </div>
          </div>
          <div className="mt-4 flex justify-end">
            <Link
              href="/messages"
              className="text-sm text-pink-500 hover:text-pink-600 font-medium"
            >
              Send a message →
            </Link>
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  )
} 