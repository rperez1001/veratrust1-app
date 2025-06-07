import { useState } from 'react'
import { Heart } from 'lucide-react'

interface ComplimentButtonProps {
  onSend: (content: string) => void
}

const COMPLIMENTS = [
  "You have a beautiful smile! 😊",
  "I love your sense of humor! 😄",
  "You're so easy to talk to! 💫",
  "You have such great energy! ✨",
  "I really enjoy our conversations! 💝",
  "You're so thoughtful! 💭",
  "You have a wonderful perspective! 🌟",
  "You're really interesting! 💫"
]

export default function ComplimentButton({ onSend }: ComplimentButtonProps) {
  const [isOpen, setIsOpen] = useState(false)

  const handleCompliment = (compliment: string) => {
    onSend(compliment)
    setIsOpen(false)
  }

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="p-2 text-pink-500 hover:bg-pink-50 rounded-lg transition-colors"
      >
        <Heart className="w-6 h-6" />
      </button>

      {isOpen && (
        <div className="absolute bottom-full left-0 mb-2 w-64 bg-white rounded-lg shadow-lg p-2 border border-gray-200">
          <div className="space-y-1">
            {COMPLIMENTS.map((compliment, index) => (
              <button
                key={index}
                onClick={() => handleCompliment(compliment)}
                className="w-full text-left p-2 text-sm text-gray-700 hover:bg-gray-50 rounded-md transition-colors"
              >
                {compliment}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  )
} 