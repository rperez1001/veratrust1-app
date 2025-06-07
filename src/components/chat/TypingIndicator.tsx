import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'

interface TypingIndicatorProps {
  matchId: string
  userId: string
  otherUserId: string
}

export default function TypingIndicator({ matchId, userId, otherUserId }: TypingIndicatorProps) {
  const [isTyping, setIsTyping] = useState(false)
  const TYPING_TIMEOUT = 3000 // 3 seconds

  useEffect(() => {
    // Subscribe to typing channel
    const channel = supabase.channel(`typing:${matchId}`)
      .on('broadcast', { event: 'typing' }, ({ payload }) => {
        if (payload.userId === otherUserId) {
          setIsTyping(true)
          // Reset typing status after timeout
          setTimeout(() => setIsTyping(false), TYPING_TIMEOUT)
        }
      })
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [matchId, otherUserId])

  if (!isTyping) return null

  return (
    <div className="flex items-center space-x-2 text-gray-500 text-sm p-2">
      <div className="flex space-x-1">
        <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
        <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
        <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
      </div>
      <span>typing...</span>
    </div>
  )
} 