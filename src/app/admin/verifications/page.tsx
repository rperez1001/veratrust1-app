'use client'

import { useEffect, useState } from 'react'
import { AdminProfile, getUsers, updateVerificationStatus } from '@/lib/admin-service'
import { CheckCircle, XCircle } from 'lucide-react'
import Image from 'next/image'

export default function VerificationsPage() {
  const [users, setUsers] = useState<AdminProfile[]>([])
  const [loading, setLoading] = useState(true)
  const [totalUsers, setTotalUsers] = useState(0)
  const [page, setPage] = useState(1)
  const [selectedUser, setSelectedUser] = useState<AdminProfile | null>(null)

  useEffect(() => {
    loadUsers()
  }, [page])

  const loadUsers = async () => {
    try {
      const { users, total } = await getUsers('pending_verification', page)
      setUsers(users)
      setTotalUsers(total)
    } catch (error) {
      console.error('Error loading users:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleVerificationChange = async (
    userId: string,
    type: 'id' | 'video',
    value: boolean
  ) => {
    try {
      await updateVerificationStatus(userId, {
        [type === 'id' ? 'id_verified' : 'video_verified']: value
      })
      setUsers(users.map(user =>
        user.id === userId ? {
          ...user,
          [type === 'id' ? 'id_verified' : 'video_verified']: value
        } : user
      ))
      if (selectedUser?.id === userId) {
        setSelectedUser(prev => prev ? {
          ...prev,
          [type === 'id' ? 'id_verified' : 'video_verified']: value
        } : null)
      }
    } catch (error) {
      console.error('Error updating verification:', error)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-pink-500" />
      </div>
    )
  }

  return (
    <div className="flex gap-6">
      {/* Users List */}
      <div className="flex-1">
        <h1 className="text-2xl font-semibold mb-6">Pending Verifications</h1>
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow">
          <div className="divide-y divide-gray-200 dark:divide-gray-700">
            {users.map((user) => (
              <div
                key={user.id}
                className={`p-4 flex items-center justify-between cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700 ${
                  selectedUser?.id === user.id ? 'bg-gray-50 dark:bg-gray-700' : ''
                }`}
                onClick={() => setSelectedUser(user)}
              >
                <div className="flex items-center space-x-3">
                  <div className="flex-shrink-0 h-10 w-10 relative">
                    <Image
                      src={`/api/photos/${user.id}`}
                      alt={user.full_name}
                      fill
                      className="rounded-full object-cover"
                    />
                  </div>
                  <div>
                    <div className="text-sm font-medium">{user.full_name}</div>
                    <div className="text-sm text-gray-500 dark:text-gray-400">
                      Trust Score: {user.trust_score}%
                    </div>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <div className={`flex items-center gap-1 px-2 py-1 rounded ${
                    user.id_verified
                      ? 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-500'
                      : 'bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-500'
                  }`}>
                    {user.id_verified ? <CheckCircle className="w-4 h-4" /> : <XCircle className="w-4 h-4" />}
                    ID
                  </div>
                  <div className={`flex items-center gap-1 px-2 py-1 rounded ${
                    user.video_verified
                      ? 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-500'
                      : 'bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-500'
                  }`}>
                    {user.video_verified ? <CheckCircle className="w-4 h-4" /> : <XCircle className="w-4 h-4" />}
                    Video
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Pagination */}
        <div className="mt-6 flex justify-between items-center">
          <div className="text-sm text-gray-700 dark:text-gray-300">
            Showing {(page - 1) * 20 + 1} to {Math.min(page * 20, totalUsers)} of {totalUsers} users
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => setPage(p => Math.max(1, p - 1))}
              disabled={page === 1}
              className="px-4 py-2 border dark:border-gray-700 rounded-lg disabled:opacity-50"
            >
              Previous
            </button>
            <button
              onClick={() => setPage(p => p + 1)}
              disabled={page * 20 >= totalUsers}
              className="px-4 py-2 border dark:border-gray-700 rounded-lg disabled:opacity-50"
            >
              Next
            </button>
          </div>
        </div>
      </div>

      {/* Verification Preview */}
      {selectedUser && (
        <div className="w-96 bg-white dark:bg-gray-800 rounded-lg shadow p-6">
          <h2 className="text-xl font-semibold mb-4">Verification Details</h2>
          
          {/* User Info */}
          <div className="mb-6">
            <div className="flex items-center space-x-3 mb-4">
              <div className="flex-shrink-0 h-16 w-16 relative">
                <Image
                  src={`/api/photos/${selectedUser.id}`}
                  alt={selectedUser.full_name}
                  fill
                  className="rounded-full object-cover"
                />
              </div>
              <div>
                <div className="font-medium">{selectedUser.full_name}</div>
                <div className="text-sm text-gray-500 dark:text-gray-400">
                  {selectedUser.email}
                </div>
                <div className="text-sm text-gray-500 dark:text-gray-400">
                  Trust Score: {selectedUser.trust_score}%
                </div>
              </div>
            </div>
          </div>

          {/* ID Verification */}
          <div className="mb-6">
            <h3 className="text-lg font-medium mb-3">ID Verification</h3>
            <div className="aspect-video bg-gray-100 dark:bg-gray-700 rounded-lg mb-3">
              {/* ID Preview */}
              <Image
                src={`/api/id-documents/${selectedUser.id}`}
                alt="ID Document"
                width={400}
                height={225}
                className="rounded-lg object-contain"
              />
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => handleVerificationChange(selectedUser.id, 'id', true)}
                className={`flex-1 flex items-center justify-center gap-1 py-2 rounded ${
                  selectedUser.id_verified
                    ? 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-500'
                    : 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300 hover:bg-green-50 dark:hover:bg-green-900/10'
                }`}
              >
                <CheckCircle className="w-4 h-4" />
                Approve
              </button>
              <button
                onClick={() => handleVerificationChange(selectedUser.id, 'id', false)}
                className={`flex-1 flex items-center justify-center gap-1 py-2 rounded ${
                  !selectedUser.id_verified
                    ? 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-500'
                    : 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300 hover:bg-red-50 dark:hover:bg-red-900/10'
                }`}
              >
                <XCircle className="w-4 h-4" />
                Reject
              </button>
            </div>
          </div>

          {/* Video Verification */}
          <div>
            <h3 className="text-lg font-medium mb-3">Video Verification</h3>
            <div className="aspect-video bg-gray-100 dark:bg-gray-700 rounded-lg mb-3">
              {/* Video Player */}
              <video
                src={`/api/intro-videos/${selectedUser.id}`}
                controls
                className="w-full h-full rounded-lg"
              />
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => handleVerificationChange(selectedUser.id, 'video', true)}
                className={`flex-1 flex items-center justify-center gap-1 py-2 rounded ${
                  selectedUser.video_verified
                    ? 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-500'
                    : 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300 hover:bg-green-50 dark:hover:bg-green-900/10'
                }`}
              >
                <CheckCircle className="w-4 h-4" />
                Approve
              </button>
              <button
                onClick={() => handleVerificationChange(selectedUser.id, 'video', false)}
                className={`flex-1 flex items-center justify-center gap-1 py-2 rounded ${
                  !selectedUser.video_verified
                    ? 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-500'
                    : 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300 hover:bg-red-50 dark:hover:bg-red-900/10'
                }`}
              >
                <XCircle className="w-4 h-4" />
                Reject
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
} 