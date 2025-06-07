import { formatDistanceToNow } from 'date-fns'

interface Message {
  id: string
  content: string
  created_at: string
  sender_id: string
}

export interface ChatMessageProps {
  message: Message
  isOwnMessage: boolean
}

export default function ChatMessage({ message, isOwnMessage }: ChatMessageProps) {
  return (
    <div
      className={`flex ${
        isOwnMessage ? 'justify-end' : 'justify-start'
      }`}
    >
      <div
        className={`max-w-[70%] rounded-lg px-4 py-2 ${
          isOwnMessage
            ? 'bg-primary text-white'
            : 'bg-gray-100 text-gray-900'
        }`}
      >
        <p className="break-words">{message.content}</p>
        <p
          className={`text-xs mt-1 ${
            isOwnMessage ? 'text-white/70' : 'text-gray-500'
          }`}
        >
          {formatDistanceToNow(new Date(message.created_at), {
            addSuffix: true
          })}
        </p>
      </div>
    </div>
  )
} 