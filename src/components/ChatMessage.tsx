import { Message } from '@/lib/message-service'
import Image from 'next/image'
import { format } from 'date-fns'

interface ChatMessageProps {
  message: Message
  isCurrentUser: boolean
}

export default function ChatMessage({ message, isCurrentUser }: ChatMessageProps) {
  return (
    <div
      className={`flex gap-2 mb-4 ${
        isCurrentUser ? 'flex-row-reverse' : 'flex-row'
      }`}
    >
      {/* Profile Picture */}
      <div className="flex-shrink-0">
        {message.sender?.profile_photo_url ? (
          <div className="relative w-8 h-8">
            <Image
              src={message.sender.profile_photo_url}
              alt={message.sender.full_name}
              fill
              className="rounded-full object-cover"
            />
          </div>
        ) : (
          <div className="w-8 h-8 rounded-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center">
            <span className="text-sm font-medium">
              {message.sender?.full_name?.[0]}
            </span>
          </div>
        )}
      </div>

      {/* Message Content */}
      <div
        className={`flex flex-col ${
          isCurrentUser ? 'items-end' : 'items-start'
        }`}
      >
        <div
          className={`px-4 py-2 rounded-2xl max-w-sm break-words ${
            isCurrentUser
              ? 'bg-pink-500 text-white'
              : 'bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-gray-100'
          }`}
        >
          {message.content}
        </div>
        <span className="text-xs text-gray-500 dark:text-gray-400 mt-1">
          {format(new Date(message.created_at), 'h:mm a')}
        </span>
      </div>
    </div>
  )
} 