'use client'

import { useState, useRef } from 'react'
import { uploadFile } from '@/lib/upload'
import { supabase } from '@/lib/supabase'

interface VideoUploadProps {
  userId: string
  onUploadComplete: () => void
  className?: string
  currentVideoUrl?: string | null
}

export default function VideoUpload({ 
  userId,
  onUploadComplete,
  className = '',
  currentVideoUrl
}: VideoUploadProps) {
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [previewUrl, setPreviewUrl] = useState<string | null>(currentVideoUrl || null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const videoRef = useRef<HTMLVideoElement>(null)

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    try {
      setError(null)
      const file = e.target.files?.[0]
      if (!file) return

      // Validate file type
      if (file.type !== 'video/mp4') {
        setError('Please upload an MP4 video')
        return
      }

      // Validate file size (30MB max)
      if (file.size > 30 * 1024 * 1024) {
        setError('File size must be less than 30MB')
        return
      }

      // Create preview URL
      const objectUrl = URL.createObjectURL(file)
      
      // Check video duration
      const video = document.createElement('video')
      video.src = objectUrl
      
      await new Promise((resolve, reject) => {
        video.onloadedmetadata = () => {
          if (video.duration > 30) {
            URL.revokeObjectURL(objectUrl)
            reject(new Error('Video must be 30 seconds or shorter'))
          } else {
            resolve(true)
          }
        }
        video.onerror = () => reject(new Error('Error loading video'))
      })

      setUploading(true)

      // Upload to Supabase storage
      const url = await uploadFile(file, 'intro-video', userId)

      // Update profile record - trust score will be automatically calculated by database trigger
      const { error: updateError } = await supabase
        .from('profiles')
        .update({ 
          intro_video_url: url,
          video_uploaded: true
        })
        .eq('user_id', userId)

      if (updateError) throw updateError

      // Update preview
      setPreviewUrl(url)
      onUploadComplete()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error uploading video')
      console.error('Error uploading video:', err)
    } finally {
      setUploading(false)
    }
  }

  return (
    <div className={`w-full ${className}`}>
      {/* Current video preview */}
      {previewUrl && (
        <div className="mb-4">
          <video
            ref={videoRef}
            src={previewUrl}
            controls
            className="w-full rounded-lg"
            style={{ maxHeight: '200px' }}
          >
            Your browser does not support the video tag.
          </video>
        </div>
      )}

      <input
        type="file"
        accept="video/mp4"
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
        {uploading ? 'Uploading...' : previewUrl ? 'Change video' : 'Upload intro video'}
      </button>

      {error && (
        <p className="mt-2 text-sm text-red-600">{error}</p>
      )}

      <p className="mt-2 text-xs text-gray-500">
        Maximum video length: 30 seconds. Maximum file size: 30MB. Format: MP4 only.
      </p>
    </div>
  )
} 