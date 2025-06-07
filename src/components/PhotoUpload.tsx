'use client'

import { useState, useRef } from 'react'
import { uploadFile } from '@/lib/upload'
import { supabase } from '@/lib/supabase'
import Image from 'next/image'

interface PhotoUploadProps {
  userId: string
  onUploadComplete: () => void
  className?: string
  currentPhotoUrl?: string | null
}

export default function PhotoUpload({ 
  userId,
  onUploadComplete,
  className = '',
  currentPhotoUrl
}: PhotoUploadProps) {
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [previewUrl, setPreviewUrl] = useState<string | null>(currentPhotoUrl || null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    try {
      setError(null)
      const file = e.target.files?.[0]
      if (!file) return

      // Validate file type
      if (!['image/jpeg', 'image/png'].includes(file.type)) {
        setError('Please upload a JPG or PNG image')
        return
      }

      // Validate file size (5MB max)
      if (file.size > 5 * 1024 * 1024) {
        setError('File size must be less than 5MB')
        return
      }

      setUploading(true)

      // Upload to Supabase storage
      const url = await uploadFile(file, 'profile-photo', userId)

      // Update profile record - trust score will be automatically calculated by database trigger
      const { error: updateError } = await supabase
        .from('profiles')
        .update({ 
          profile_photo_url: url,
          photo_uploaded: true
        })
        .eq('user_id', userId)

      if (updateError) throw updateError

      // Update preview
      setPreviewUrl(url)
      onUploadComplete()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error uploading photo')
      console.error('Error uploading photo:', err)
    } finally {
      setUploading(false)
    }
  }

  return (
    <div className={`w-full ${className}`}>
      {/* Current photo preview */}
      {previewUrl && (
        <div className="mb-4 relative w-32 h-32 mx-auto">
          <Image
            src={previewUrl}
            alt="Profile photo"
            fill
            className="rounded-full object-cover"
          />
        </div>
      )}

      <input
        type="file"
        accept="image/jpeg,image/png"
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
        {uploading ? 'Uploading...' : previewUrl ? 'Change photo' : 'Upload profile photo'}
      </button>

      {error && (
        <p className="mt-2 text-sm text-red-600">{error}</p>
      )}
    </div>
  )
} 