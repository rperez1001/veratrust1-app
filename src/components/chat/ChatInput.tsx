import { useState, useRef, useEffect } from 'react'
import { Send } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import ComplimentButton from './ComplimentButton'

export interface ChatInputProps {
  onSendMessage: (content: string) => void
  matchId: string
  disabled?: boolean
}

export default function ChatInput({ onSendMessage, matchId, disabled }: ChatInputProps) {
  const [message, setMessage] = useState('')
  const inputRef = useRef<HTMLTextAreaElement>(null)

  // Auto-resize textarea
  useEffect(() => {
    if (inputRef.current) {
      inputRef.current.style.height = 'auto'
      inputRef.current.style.height = `${inputRef.current.scrollHeight}px`
    }
  }, [message])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!message.trim() || disabled) return

    onSendMessage(message.trim())
    setMessage('')

    // Reset textarea height
    if (inputRef.current) {
      inputRef.current.style.height = 'auto'
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSubmit(e)
    }
  }

  const handleTyping = () => {
    // Broadcast typing status
    supabase.channel(`typing:${matchId}`).send({
      type: 'broadcast',
      event: 'typing',
      payload: { typing: true }
    })
  }

  return (
    <form onSubmit={handleSubmit} className="flex items-end gap-2">
      <ComplimentButton onSend={onSendMessage} />
      <textarea
        ref={inputRef}
        value={message}
        onChange={(e) => setMessage(e.target.value)}
        onKeyDown={handleKeyDown}
        onInput={handleTyping}
        placeholder="Type a message..."
        disabled={disabled}
        className="flex-1 resize-none rounded-lg border border-gray-300 p-3 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent min-h-[44px] max-h-32"
        rows={1}
      />
      <button
        type="submit"
        disabled={!message.trim() || disabled}
        className="p-3 bg-primary text-white rounded-lg hover:bg-opacity-90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
      >
        <Send className="w-5 h-5" />
      </button>
    </form>
  )
} 