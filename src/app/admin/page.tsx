'use client'

import { useEffect, useState } from 'react'
import { getUsers, getReports } from '@/lib/admin-service'
import { Users, AlertTriangle, CheckSquare, UserX } from 'lucide-react'
import Link from 'next/link'

interface DashboardStats {
  totalUsers: number
  pendingVerifications: number
  pendingReports: number
  suspiciousAccounts: number
}

export default function AdminDashboard() {
  const [stats, setStats] = useState<DashboardStats>({
    totalUsers: 0,
    pendingVerifications: 0,
    pendingReports: 0,
    suspiciousAccounts: 0
  })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const loadStats = async () => {
      try {
        const [
          { total: totalUsers },
          { total: pendingVerifications },
          { total: pendingReports },
          { total: suspiciousAccounts }
        ] = await Promise.all([
          getUsers('all', 1, 1),
          getUsers('pending_verification', 1, 1),
          getReports('pending', 1, 1),
          getUsers('suspicious', 1, 1)
        ])

        setStats({
          totalUsers,
          pendingVerifications,
          pendingReports,
          suspiciousAccounts
        })
      } catch (error) {
        console.error('Error loading stats:', error)
      } finally {
        setLoading(false)
      }
    }

    loadStats()
  }, [])

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-pink-500" />
      </div>
    )
  }

  const cards = [
    {
      name: 'Total Users',
      value: stats.totalUsers,
      href: '/admin/users',
      icon: Users,
      color: 'bg-blue-500'
    },
    {
      name: 'Pending Verifications',
      value: stats.pendingVerifications,
      href: '/admin/verifications',
      icon: CheckSquare,
      color: 'bg-green-500'
    },
    {
      name: 'Pending Reports',
      value: stats.pendingReports,
      href: '/admin/reports',
      icon: AlertTriangle,
      color: 'bg-yellow-500'
    },
    {
      name: 'Suspicious Accounts',
      value: stats.suspiciousAccounts,
      href: '/admin/users?filter=suspicious',
      icon: UserX,
      color: 'bg-red-500'
    }
  ]

  return (
    <div>
      <h1 className="text-2xl font-semibold mb-6">Dashboard Overview</h1>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {cards.map((card) => (
          <Link
            key={card.name}
            href={card.href}
            className="block p-6 bg-white dark:bg-gray-800 rounded-lg shadow-sm hover:shadow-md transition-shadow"
          >
            <div className="flex items-center">
              <div
                className={`${card.color} p-3 rounded-lg text-white dark:text-gray-900`}
              >
                <card.icon className="w-6 h-6" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                  {card.name}
                </p>
                <p className="text-2xl font-semibold">{card.value}</p>
              </div>
            </div>
          </Link>
        ))}
      </div>

      <div className="mt-12">
        <h2 className="text-xl font-semibold mb-4">Quick Actions</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Link
            href="/admin/verifications"
            className="p-4 bg-white dark:bg-gray-800 rounded-lg shadow-sm hover:shadow-md transition-shadow"
          >
            <h3 className="font-medium mb-2">Review Verifications</h3>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              {stats.pendingVerifications} pending verifications need your review
            </p>
          </Link>
          <Link
            href="/admin/reports"
            className="p-4 bg-white dark:bg-gray-800 rounded-lg shadow-sm hover:shadow-md transition-shadow"
          >
            <h3 className="font-medium mb-2">Handle Reports</h3>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              {stats.pendingReports} reports waiting for action
            </p>
          </Link>
          <Link
            href="/admin/users?filter=suspicious"
            className="p-4 bg-white dark:bg-gray-800 rounded-lg shadow-sm hover:shadow-md transition-shadow"
          >
            <h3 className="font-medium mb-2">Review Suspicious Accounts</h3>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              {stats.suspiciousAccounts} accounts flagged as suspicious
            </p>
          </Link>
        </div>
      </div>
    </div>
  )
} 