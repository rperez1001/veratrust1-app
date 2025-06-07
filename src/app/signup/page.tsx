'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import FileUpload from '@/components/FileUpload'
import { supabase } from '@/lib/supabase'

export default function Signup() {
  const router = useRouter()
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    password: '',
    age: '',
    gender: '',
    datingIntention: '',
    values: [] as string[],
    relationshipPreferences: {
      lookingFor: [] as string[],
      ageRange: {
        min: 18,
        max: 99
      },
      distance: 50
    },
    idDocumentUrl: '',
    profilePhotoUrl: '',
    introVideoUrl: ''
  })

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: value
    }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      // Sign up with Supabase Auth
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: formData.email,
        password: formData.password
      })

      if (authError) throw authError

      // Create profile in profiles table
      const { error: profileError } = await supabase
        .from('profiles')
        .insert([
          {
            user_id: authData.user!.id,
            full_name: formData.fullName,
            age: parseInt(formData.age),
            gender: formData.gender,
            dating_intention: formData.datingIntention,
            values: formData.values,
            relationship_preferences: formData.relationshipPreferences,
            id_document_url: formData.idDocumentUrl,
            profile_photo_url: formData.profilePhotoUrl,
            intro_video_url: formData.introVideoUrl
          }
        ])

      if (profileError) throw profileError

      router.push('/dashboard')
    } catch (error) {
      console.error('Error:', error)
      alert('An error occurred during signup')
    }
  }

  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-8 bg-gray-50">
      <div className="w-full max-w-2xl bg-white rounded-xl shadow-lg p-8">
        <h1 className="text-3xl font-bold text-primary text-center mb-8">
          Create Your Profile
        </h1>
        
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Basic Information */}
          <div>
            <label htmlFor="fullName" className="block text-sm font-medium text-gray-700 mb-2">
              Full Name
            </label>
            <input
              type="text"
              id="fullName"
              name="fullName"
              value={formData.fullName}
              onChange={handleInputChange}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
              required
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                Email
              </label>
              <input
                type="email"
                id="email"
                name="email"
                value={formData.email}
                onChange={handleInputChange}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                required
              />
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">
                Password
              </label>
              <input
                type="password"
                id="password"
                name="password"
                value={formData.password}
                onChange={handleInputChange}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label htmlFor="age" className="block text-sm font-medium text-gray-700 mb-2">
                Age
              </label>
              <input
                type="number"
                id="age"
                name="age"
                min="18"
                max="120"
                value={formData.age}
                onChange={handleInputChange}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                required
              />
            </div>

            <div>
              <label htmlFor="gender" className="block text-sm font-medium text-gray-700 mb-2">
                Gender
              </label>
              <select
                id="gender"
                name="gender"
                value={formData.gender}
                onChange={handleInputChange}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                required
              >
                <option value="">Select gender</option>
                <option value="male">Male</option>
                <option value="female">Female</option>
                <option value="non-binary">Non-binary</option>
                <option value="other">Other</option>
              </select>
            </div>
          </div>

          <div>
            <label htmlFor="datingIntention" className="block text-sm font-medium text-gray-700 mb-2">
              Dating Intention
            </label>
            <select
              id="datingIntention"
              name="datingIntention"
              value={formData.datingIntention}
              onChange={handleInputChange}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
              required
            >
              <option value="">Select intention</option>
              <option value="long-term">Long-term Relationship</option>
              <option value="casual">Casual Dating</option>
              <option value="friendship">Friendship First</option>
              <option value="marriage">Marriage-minded</option>
            </select>
          </div>

          {/* File Uploads */}
          <div className="space-y-4">
            <h2 className="text-lg font-semibold text-gray-900">Verification & Media</h2>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                ID Document
              </label>
              <FileUpload
                bucketName="id-documents"
                fileType="document"
                onUploadComplete={(url) => setFormData(prev => ({ ...prev, idDocumentUrl: url }))}
                maxSizeMB={10}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Profile Photo
              </label>
              <FileUpload
                bucketName="profile-photos"
                fileType="image"
                onUploadComplete={(url) => setFormData(prev => ({ ...prev, profilePhotoUrl: url }))}
                maxSizeMB={5}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Intro Video (30 seconds max)
              </label>
              <FileUpload
                bucketName="intro-videos"
                fileType="video"
                onUploadComplete={(url) => setFormData(prev => ({ ...prev, introVideoUrl: url }))}
                maxSizeMB={50}
              />
            </div>
          </div>
          
          <button
            type="submit"
            className="w-full bg-secondary text-white py-3 rounded-lg hover:bg-opacity-90 transition-all font-semibold"
          >
            Create Account
          </button>
        </form>
        
        <p className="mt-6 text-center text-gray-600">
          Already have an account?{' '}
          <Link href="/login" className="text-primary hover:underline">
            Log in
          </Link>
        </p>
      </div>
    </main>
  )
} 