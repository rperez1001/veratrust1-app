'use client'

import { useState, useRef } from 'react'
import { supabase } from '@/lib/supabase'
import { updateProfile } from '@/lib/profile-service'

const ALLOWED_FILE_TYPES = ['image/jpeg', 'image/png', 'application/pdf']
const MAX_FILE_SIZE = 10 * 1024 * 1024 // 10MB

interface IdDocumentUploadProps {
  userId: string
  onUploadComplete?: () => void
  className?: string
}

export default function IdDocumentUpload({ 
  userId, 
  onUploadComplete,
  className = ''
}: IdDocumentUploadProps) {
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const validateFile = (file: File): string | null => {
    if (!ALLOWED_FILE_TYPES.includes(file.type)) {
      return 'Invalid file type. Please upload a PDF, JPG, or PNG file.'
    }
    if (file.size > MAX_FILE_SIZE) {
      return 'File is too large. Maximum size is 10MB.'
    }
    return null
  }

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    try {
      setError(null)
      const file = e.target.files?.[0]
      if (!file) return

      // Validate file
      const validationError = validateFile(file)
      if (validationError) {
        setError(validationError)
        return
      }

      setUploading(true)

      // Create a unique file name
      const fileExt = file.name.split('.').pop()
      const fileName = `${userId}/${Date.now()}.${fileExt}`

      // Upload file to Supabase Storage
      const { error: uploadError } = await supabase.storage
        .from('id-documents')
        .upload(fileName, file)

      if (uploadError) {
        throw uploadError
      }

      // Update profile to mark ID as uploaded
      await updateProfile(userId, {
        id_uploaded: true
      })

      // Clear input
      if (fileInputRef.current) {
        fileInputRef.current.value = ''
      }

      onUploadComplete?.()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error uploading file')
      console.error('Error uploading ID document:', err)
    } finally {
      setUploading(false)
    }
  }

  return (
    <div className={`space-y-4 ${className}`}>
      <div className="bg-white rounded-lg border-2 border-dashed border-gray-300 p-6">
        <input
          type="file"
          accept=".pdf,.jpg,.jpeg,.png"
          onChange={handleFileChange}
          disabled={uploading}
          ref={fileInputRef}
          className="hidden"
        />
        
        <div className="text-center">
          <button
            onClick={() => fileInputRef.current?.click()}
            disabled={uploading}
            className="inline-flex items-center justify-center px-6 py-3 border border-transparent text-base font-medium rounded-md text-white bg-primary hover:bg-opacity-90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {uploading ? (
              <>
                <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Uploading...
              </>
            ) : (
              'Upload ID Document'
            )}
          </button>
          
          <p className="mt-2 text-sm text-gray-600">
            Upload a government-issued ID (PDF, JPG, or PNG)
          </p>
          <p className="text-xs text-gray-500">
            Maximum file size: 10MB
          </p>
        </div>
      </div>

      {error && (
        <p className="text-sm text-red-600">{error}</p>
      )}
    </div>
  )
} 