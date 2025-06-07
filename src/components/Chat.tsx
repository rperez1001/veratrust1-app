'use client'

import { useEffect, useRef, useState } from 'react'
import { useUser } from '@/hooks/useUser'
import { Match } from '@/lib/match-service'
import {
  Message,
  getMessages,
  sendMessage,
  subscribeToMessages,
  markMessagesAsRead
} from '@/lib/message-service'
import { RealtimeChannel } from '@supabase/supabase-js'
import ChatMessage from './ChatMessage'
import { Send } from 'lucide-react'

interface ChatProps {
  match: Match & {
    matched_user: {
      full_name: string
      profile_photo_url: string | null
    }
  }
}

export default function Chat({ match }: ChatProps) {
  const { user } = useUser()
  const [messages, setMessages] = useState<Message[]>([])
  const [newMessage, setNewMessage] = useState('')
  const [subscription, setSubscription] = useState<RealtimeChannel | null>(null)
  const [loading, setLoading] = useState(true)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  const otherUserId = match.user1_id === user?.id ? match.user2_id : match.user1_id

  useEffect(() => {
    if (!user) return

    // Load existing messages
    const loadMessages = async () => {
      try {
        const messages = await getMessages(match.id)
        setMessages(messages)
        setLoading(false)
        scrollToBottom()
        
        // Mark messages as read
        await markMessagesAsRead(match.id, user.id)
      } catch (error) {
        console.error('Error loading messages:', error)
        setLoading(false)
      }
    }

    loadMessages()

    // Subscribe to new messages
    const sub = subscribeToMessages(match.id, (newMessage: Message) => {
      setMessages(prev => [...prev, newMessage])
      scrollToBottom()
      
      // Mark message as read if it's for the current user
      if (newMessage.receiver_id === user.id) {
        markMessagesAsRead(match.id, user.id)
      }
    })

    setSubscription(sub)

    return () => {
      subscription?.unsubscribe()
    }
  }, [match.id, user])

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!user || !newMessage.trim()) return

    try {
      await sendMessage(
        match.id,
        user.id,
        otherUserId,
        newMessage.trim()
      )
      setNewMessage('')
    } catch (error) {
      console.error('Error sending message:', error)
    }
  }

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-pink-500" />
      </div>
    )
  }

  return (
    <div className="flex-1 flex flex-col h-full">
      {/* Chat Header */}
      <div className="p-4 border-b dark:border-gray-700">
        <div className="flex items-center gap-3">
          <h2 className="text-lg font-semibold">
            Chat with {match.matched_user.full_name}
          </h2>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4">
        {messages.length === 0 ? (
          <div className="flex-1 flex items-center justify-center text-gray-500 dark:text-gray-400">
            <p>No messages yet. Start the conversation!</p>
          </div>
        ) : (
          messages.map(message => (
            <ChatMessage
              key={message.id}
              message={message}
              isCurrentUser={message.sender_id === user?.id}
            />
          ))
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Message Input */}
      <form onSubmit={handleSend} className="p-4 border-t dark:border-gray-700">
        <div className="flex gap-2">
          <input
            type="text"
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            placeholder="Type a message..."
            className="flex-1 px-4 py-2 rounded-full bg-gray-100 dark:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-pink-500"
          />
          <button
            type="submit"
            disabled={!newMessage.trim()}
            className="px-4 py-2 bg-pink-500 text-white rounded-full hover:bg-pink-600 focus:outline-none focus:ring-2 focus:ring-pink-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Send className="w-5 h-5" />
          </button>
        </div>
      </form>
    </div>
  )
} 