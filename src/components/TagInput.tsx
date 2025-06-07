'use client'

import { useState, KeyboardEvent } from 'react'

interface TagInputProps {
  tags: string[]
  onChange: (tags: string[]) => void
  placeholder?: string
  maxTags?: number
}

export default function TagInput({
  tags,
  onChange,
  placeholder = 'Type and press Enter...',
  maxTags = 10
}: TagInputProps) {
  const [input, setInput] = useState('')

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key !== 'Enter') return
    e.preventDefault()
    
    const value = input.trim()
    if (!value) return
    
    if (tags.length >= maxTags) {
      alert(`Maximum ${maxTags} tags allowed`)
      return
    }
    
    if (!tags.includes(value)) {
      onChange([...tags, value])
    }
    setInput('')
  }

  const removeTag = (tagToRemove: string) => {
    onChange(tags.filter(tag => tag !== tagToRemove))
  }

  return (
    <div className="w-full">
      <div className="flex flex-wrap gap-2 mb-2">
        {tags.map(tag => (
          <span
            key={tag}
            className="px-3 py-1 bg-primary bg-opacity-10 text-primary rounded-full flex items-center gap-2"
          >
            {tag}
            <button
              type="button"
              onClick={() => removeTag(tag)}
              className="text-primary hover:text-opacity-70"
            >
              ×
            </button>
          </span>
        ))}
      </div>
      <input
        type="text"
        value={input}
        onChange={(e) => setInput(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder={placeholder}
        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
      />
      <p className="mt-1 text-sm text-gray-500">
        Press Enter to add a value ({tags.length}/{maxTags})
      </p>
    </div>
  )
} 