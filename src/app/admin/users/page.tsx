'use client'

import { useEffect, useState } from 'react'
import { useSearchParams } from 'next/navigation'
import {
  AdminProfile,
  getUsers,
  updateAccountStatus,
  updateVerificationStatus
} from '@/lib/admin-service'
import Image from 'next/image'
import { CheckCircle, XCircle, AlertTriangle } from 'lucide-react'

export default function UsersPage() {
  const searchParams = useSearchParams()
  const [users, setUsers] = useState<AdminProfile[]>([])
  const [loading, setLoading] = useState(true)
  const [totalUsers, setTotalUsers] = useState(0)
  const [page, setPage] = useState(1)
  const [filter, setFilter] = useState<'all' | 'suspicious' | 'pending_verification'>(
    (searchParams.get('filter') as any) || 'all'
  )

  useEffect(() => {
    loadUsers()
  }, [filter, page])

  const loadUsers = async () => {
    try {
      const { users, total } = await getUsers(filter, page)
      setUsers(users)
      setTotalUsers(total)
    } catch (error) {
      console.error('Error loading users:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleStatusChange = async (userId: string, status: 'active' | 'suspended' | 'deleted') => {
    try {
      await updateAccountStatus(userId, status)
      setUsers(users.map(user =>
        user.id === userId ? { ...user, account_status: status } : user
      ))
    } catch (error) {
      console.error('Error updating status:', error)
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
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-semibold">Users Management</h1>
        <div className="flex gap-2">
          <select
            value={filter}
            onChange={(e) => setFilter(e.target.value as typeof filter)}
            className="px-4 py-2 rounded-lg border dark:border-gray-700 bg-white dark:bg-gray-800"
          >
            <option value="all">All Users</option>
            <option value="suspicious">Suspicious Accounts</option>
            <option value="pending_verification">Pending Verification</option>
          </select>
        </div>
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-lg shadow overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
          <thead className="bg-gray-50 dark:bg-gray-900">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                User
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                Trust Score
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                Verifications
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                Status
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
            {users.map((user) => (
              <tr key={user.id}>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="flex items-center">
                    {user.photo_uploaded ? (
                      <div className="flex-shrink-0 h-10 w-10 relative">
                        <Image
                          src={`/api/photos/${user.id}`}
                          alt={user.full_name}
                          fill
                          className="rounded-full object-cover"
                        />
                      </div>
                    ) : (
                      <div className="flex-shrink-0 h-10 w-10 rounded-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center">
                        <span className="text-lg">{user.full_name[0]}</span>
                      </div>
                    )}
                    <div className="ml-4">
                      <div className="text-sm font-medium">
                        {user.full_name}
                      </div>
                      <div className="text-sm text-gray-500 dark:text-gray-400">
                        {user.email}
                      </div>
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                    user.trust_score >= 80
                      ? 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-500'
                      : user.trust_score >= 50
                      ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-500'
                      : 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-500'
                  }`}>
                    {user.trust_score}%
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleVerificationChange(user.id, 'id', !user.id_verified)}
                      className={`flex items-center gap-1 px-2 py-1 rounded ${
                        user.id_verified
                          ? 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-500'
                          : 'bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-500'
                      }`}
                    >
                      {user.id_verified ? <CheckCircle className="w-4 h-4" /> : <XCircle className="w-4 h-4" />}
                      ID
                    </button>
                    <button
                      onClick={() => handleVerificationChange(user.id, 'video', !user.video_verified)}
                      className={`flex items-center gap-1 px-2 py-1 rounded ${
                        user.video_verified
                          ? 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-500'
                          : 'bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-500'
                      }`}
                    >
                      {user.video_verified ? <CheckCircle className="w-4 h-4" /> : <XCircle className="w-4 h-4" />}
                      Video
                    </button>
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <select
                    value={user.account_status}
                    onChange={(e) => handleStatusChange(user.id, e.target.value as 'active' | 'suspended' | 'deleted')}
                    className={`px-2 py-1 rounded border ${
                      user.account_status === 'active'
                        ? 'text-green-800 border-green-200 dark:text-green-500 dark:border-green-900/20'
                        : user.account_status === 'suspended'
                        ? 'text-yellow-800 border-yellow-200 dark:text-yellow-500 dark:border-yellow-900/20'
                        : 'text-red-800 border-red-200 dark:text-red-500 dark:border-red-900/20'
                    }`}
                  >
                    <option value="active">Active</option>
                    <option value="suspended">Suspended</option>
                    <option value="deleted">Deleted</option>
                  </select>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                  {user.trust_score < 30 && (
                    <div className="flex items-center gap-1 text-yellow-600 dark:text-yellow-500">
                      <AlertTriangle className="w-4 h-4" />
                      Low Trust Score
                    </div>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
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
  )
} 