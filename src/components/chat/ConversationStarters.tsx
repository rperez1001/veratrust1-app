import { useState } from 'react'
import { MessageCircle } from 'lucide-react'

interface ConversationStartersProps {
  onSelect: (message: string) => void
}

const STARTERS = [
  "Hi! I noticed we share similar values. What's most important to you in a relationship?",
  "Your profile caught my attention! What made you join VeraTrust?",
  "Hey there! What's your idea of a perfect first date?",
  "Hi! I see you're into [hobby]. What got you started with that?",
  "Hello! What's the most adventurous thing you've done lately?",
  "Hi! If you could travel anywhere right now, where would you go?",
  "Hey! What's your favorite way to unwind after a long day?",
  "Hi there! What's something you're really passionate about?"
]

export default function ConversationStarters({ onSelect }: ConversationStartersProps) {
  const [isOpen, setIsOpen] = useState(false)

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 text-gray-600 hover:text-gray-900 text-sm"
      >
        <MessageCircle className="w-4 h-4" />
        <span>Conversation Starters</span>
      </button>

      {isOpen && (
        <div className="absolute bottom-full left-0 mb-2 w-80 bg-white rounded-lg shadow-lg p-2 border border-gray-200">
          <div className="space-y-1">
            {STARTERS.map((starter, index) => (
              <button
                key={index}
                onClick={() => {
                  onSelect(starter)
                  setIsOpen(false)
                }}
                className="w-full text-left p-2 text-sm text-gray-700 hover:bg-gray-50 rounded-md transition-colors"
              >
                {starter}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  )
} 