import { useState, useEffect } from 'react'
import { useAuth } from '@/lib/auth-context'
import { supabase } from '@/lib/supabase'
import { MoreVertical } from 'lucide-react'
import Image from 'next/image'
import ChatMessage from './ChatMessage'
import ChatInput from './ChatInput'
import TypingIndicator from './TypingIndicator'
import ConversationStarters from './ConversationStarters'
import BlockReportDialog from '../BlockReportDialog'

interface Message {
  id: string
  match_id: string
  sender_id: string
  content: string
  created_at: string
}

interface ChatContainerProps {
  match: {
    id: string
    matched_user: {
      id: string
      full_name: string
      profile_photo_url: string | null
    }
  }
}

export default function ChatContainer({ match }: ChatContainerProps) {
  const { user } = useAuth()
  const [messages, setMessages] = useState<Message[]>([])
  const [isBlockReportOpen, setIsBlockReportOpen] = useState(false)

  useEffect(() => {
    // Load initial messages
    const loadMessages = async () => {
      const { data, error } = await supabase
        .from('messages')
        .select('*')
        .eq('match_id', match.id)
        .order('created_at', { ascending: true })

      if (error) {
        console.error('Error loading messages:', error)
        return
      }

      setMessages(data || [])
    }

    loadMessages()

    // Subscribe to new messages
    const channel = supabase
      .channel(`match:${match.id}`)
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'messages',
        filter: `match_id=eq.${match.id}`
      }, (payload: { new: Message }) => {
        setMessages(prev => [...prev, payload.new])
      })
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [match.id])

  const handleSendMessage = async (content: string) => {
    if (!user?.id) return

    try {
      const { error } = await supabase
        .from('messages')
        .insert({
          match_id: match.id,
          sender_id: user.id,
          content
        })

      if (error) throw error
    } catch (error) {
      console.error('Error sending message:', error)
    }
  }

  const handleStarterSelect = (starter: string) => {
    handleSendMessage(starter)
  }

  return (
    <div className="flex flex-col h-full">
      {/* Chat Header */}
      <div className="flex items-center justify-between p-4 border-b">
        <div className="flex items-center gap-3">
          {match.matched_user.profile_photo_url ? (
            <div className="relative w-10 h-10">
              <Image
                src={match.matched_user.profile_photo_url}
                alt={match.matched_user.full_name}
                fill
                className="rounded-full object-cover"
              />
            </div>
          ) : (
            <div className="w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center">
              <span className="text-xl">{match.matched_user.full_name[0]}</span>
            </div>
          )}
          <h2 className="font-semibold">{match.matched_user.full_name}</h2>
        </div>

        <button
          onClick={() => setIsBlockReportOpen(true)}
          className="p-2 hover:bg-gray-100 rounded-full"
        >
          <MoreVertical className="w-5 h-5 text-gray-600" />
        </button>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.length === 0 && (
          <div className="flex flex-col items-center justify-center h-full text-center p-4">
            <p className="text-gray-600 mb-4">Start a conversation!</p>
            <ConversationStarters onSelect={handleStarterSelect} />
          </div>
        )}

        {messages.map((message) => (
          <ChatMessage
            key={message.id}
            message={message}
            isOwnMessage={message.sender_id === user?.id}
          />
        ))}

        {user?.id && (
          <TypingIndicator
            matchId={match.id}
            userId={user.id}
            otherUserId={match.matched_user.id}
          />
        )}
      </div>

      {/* Input */}
      <div className="p-4 border-t">
        <ChatInput
          onSendMessage={handleSendMessage}
          matchId={match.id}
          disabled={!user?.id}
        />
      </div>

      {/* Block/Report Dialog */}
      <BlockReportDialog
        isOpen={isBlockReportOpen}
        onClose={() => setIsBlockReportOpen(false)}
        targetUserId={match.matched_user.id}
        targetUserName={match.matched_user.full_name}
      />
    </div>
  )
} 