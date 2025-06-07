'use client'

import { useState, useRef } from 'react'
import { uploadFile, FileType } from '@/lib/upload'

interface FileUploadProps {
  fileType: FileType
  userId: string
  onUploadComplete: (url: string) => void
  className?: string
}

export default function FileUpload({ 
  fileType,
  userId,
  onUploadComplete,
  className = ''
}: FileUploadProps) {
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    try {
      setError(null)
      const file = e.target.files?.[0]
      if (!file) return

      setUploading(true)
      const url = await uploadFile(file, fileType, userId)
      onUploadComplete(url)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error uploading file')
      console.error('Error uploading file:', err)
    } finally {
      setUploading(false)
    }
  }

  return (
    <div className={`w-full ${className}`}>
      <input
        type="file"
        onChange={handleFileChange}
        disabled={uploading}
        ref={fileInputRef}
        className="hidden"
      />
      <button
        onClick={() => fileInputRef.current?.click()}
        disabled={uploading}
        className="w-full px-4 py-2 text-sm border-2 border-dashed border-gray-300 rounded-lg hover:border-primary focus:outline-none focus:border-primary transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {uploading ? 'Uploading...' : `Upload ${fileType.replace('-', ' ')}`}
      </button>
      {error && (
        <p className="mt-2 text-sm text-red-600">{error}</p>
      )}
    </div>
  )
} 