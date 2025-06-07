import { supabase } from './supabase'

export type FileType = 'id-document' | 'profile-photo' | 'intro-video'

const ALLOWED_FILE_TYPES = {
  'id-document': ['image/jpeg', 'image/png', 'application/pdf'],
  'profile-photo': ['image/jpeg', 'image/png'],
  'intro-video': ['video/mp4', 'video/quicktime']
}

const MAX_FILE_SIZES = {
  'id-document': 10 * 1024 * 1024, // 10MB
  'profile-photo': 5 * 1024 * 1024, // 5MB
  'intro-video': 50 * 1024 * 1024 // 50MB
}

export async function uploadFile(
  file: File,
  fileType: FileType,
  userId: string
): Promise<string> {
  // Validate file type
  if (!ALLOWED_FILE_TYPES[fileType].includes(file.type)) {
    throw new Error(`Invalid file type. Allowed types: ${ALLOWED_FILE_TYPES[fileType].join(', ')}`)
  }

  // Validate file size
  if (file.size > MAX_FILE_SIZES[fileType]) {
    throw new Error(`File too large. Maximum size: ${MAX_FILE_SIZES[fileType] / 1024 / 1024}MB`)
  }

  // Create a unique file name
  const fileExt = file.name.split('.').pop()
  const fileName = `${userId}/${Date.now()}.${fileExt}`
  const bucketName = fileType === 'id-document' ? 'id-documents' :
                    fileType === 'profile-photo' ? 'profile-photos' : 'intro-videos'

  // Upload file
  const { data, error } = await supabase.storage
    .from(bucketName)
    .upload(fileName, file)

  if (error) {
    throw error
  }

  // Get public URL (except for ID documents)
  const { data: { publicUrl } } = supabase.storage
    .from(bucketName)
    .getPublicUrl(fileName)

  return publicUrl
} 