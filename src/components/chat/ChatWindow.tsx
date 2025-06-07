import { useEffect, useRef, useState } from 'react'
import { Message, getMessages, sendMessage, subscribeToMatchMessages } from '@/lib/message-service'
import ChatMessage from './ChatMessage'
import ChatInput from './ChatInput'
import { useUser } from '@/hooks/useUser'

interface ChatWindowProps {
  matchId: string
  otherUserName: string
}

export default function ChatWindow({ matchId, otherUserName }: ChatWindowProps) {
  const { user } = useUser()
  const [messages, setMessages] = useState<Message[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const [error, setError] = useState<string | null>(null)

  // Load initial messages
  useEffect(() => {
    const loadMessages = async () => {
      try {
        setIsLoading(true)
        const initialMessages = await getMessages(matchId)
        setMessages(initialMessages)
        setError(null)
      } catch (error) {
        console.error('Failed to load messages:', error)
        setError('Failed to load messages')
      } finally {
        setIsLoading(false)
      }
    }

    loadMessages()
  }, [matchId])

  // Subscribe to new messages
  useEffect(() => {
    const unsubscribe = subscribeToMatchMessages(matchId, (newMessage) => {
      setMessages(prev => [...prev, newMessage])
    })

    return () => {
      unsubscribe()
    }
  }, [matchId])

  // Scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const handleSendMessage = async (content: string) => {
    if (!user) return
    await sendMessage(matchId, content)
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center h-full p-4 text-center">
        <p className="text-red-500 mb-4">{error}</p>
        <button
          onClick={() => window.location.reload()}
          className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600"
        >
          Retry
        </button>
      </div>
    )
  }

  return (
    <div className="flex flex-col h-full bg-white">
      {/* Messages Container */}
      <div className="flex-1 overflow-y-auto p-4">
        {isLoading ? (
          <div className="flex justify-center items-center h-full">
            <div className="animate-spin rounded-full h-8 w-8 border-2 border-blue-500 border-t-transparent" />
          </div>
        ) : messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center text-gray-500">
            <p className="mb-2">No messages yet</p>
            <p className="text-sm">Send a message to start the conversation!</p>
          </div>
        ) : (
          messages.map((message) => (
            <ChatMessage
              key={message.id}
              message={message}
              senderName={message.sender_id === user?.id ? 'You' : otherUserName}
            />
          ))
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input Box */}
      <ChatInput
        onSend={handleSendMessage}
        disabled={isLoading}
      />
    </div>
  )
} 