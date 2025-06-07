'use client'

import { useState } from 'react'
import { useAuth } from '@/lib/auth-context'
import { Bell, Shield, User, LogOut } from 'lucide-react'

export default function SettingsPage() {
  const { user, signOut } = useAuth()
  const [notifications, setNotifications] = useState({
    matches: true,
    messages: true,
    milestones: true
  })

  const handleNotificationChange = (key: keyof typeof notifications) => {
    setNotifications(prev => ({
      ...prev,
      [key]: !prev[key]
    }))
  }

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="max-w-2xl mx-auto">
        <h1 className="text-2xl font-semibold mb-6">Settings</h1>

        {/* Account Settings */}
        <div className="bg-white rounded-xl shadow-sm p-6 mb-6">
          <div className="flex items-center gap-2 mb-4">
            <User className="w-5 h-5 text-gray-600" />
            <h2 className="text-lg font-medium">Account</h2>
          </div>
          
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Email
              </label>
              <p className="text-gray-600">{user?.email}</p>
            </div>

            <button
              onClick={() => signOut()}
              className="flex items-center gap-2 text-red-600 hover:text-red-700"
            >
              <LogOut className="w-4 h-4" />
              <span>Sign Out</span>
            </button>
          </div>
        </div>

        {/* Notification Settings */}
        <div className="bg-white rounded-xl shadow-sm p-6 mb-6">
          <div className="flex items-center gap-2 mb-4">
            <Bell className="w-5 h-5 text-gray-600" />
            <h2 className="text-lg font-medium">Notifications</h2>
          </div>

          <div className="space-y-4">
            {Object.entries(notifications).map(([key, value]) => (
              <div key={key} className="flex items-center justify-between">
                <label className="flex items-center gap-2 cursor-pointer">
                  <span className="text-gray-700 capitalize">
                    {key.replace(/([A-Z])/g, ' $1').trim()}
                  </span>
                </label>
                <button
                  onClick={() => handleNotificationChange(key as keyof typeof notifications)}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                    value ? 'bg-primary' : 'bg-gray-200'
                  }`}
                >
                  <span
                    className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                      value ? 'translate-x-6' : 'translate-x-1'
                    }`}
                  />
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* Privacy Settings */}
        <div className="bg-white rounded-xl shadow-sm p-6">
          <div className="flex items-center gap-2 mb-4">
            <Shield className="w-5 h-5 text-gray-600" />
            <h2 className="text-lg font-medium">Privacy</h2>
          </div>

          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <label className="flex items-center gap-2">
                <span className="text-gray-700">Profile Visibility</span>
              </label>
              <select
                className="rounded-lg border border-gray-300 py-1 px-3 text-gray-700"
                defaultValue="verified"
              >
                <option value="all">Everyone</option>
                <option value="verified">Verified Users Only</option>
                <option value="matches">Matches Only</option>
              </select>
            </div>

            <div className="flex items-center justify-between">
              <label className="flex items-center gap-2">
                <span className="text-gray-700">Show Distance</span>
              </label>
              <select
                className="rounded-lg border border-gray-300 py-1 px-3 text-gray-700"
                defaultValue="approximate"
              >
                <option value="exact">Exact Distance</option>
                <option value="approximate">Approximate</option>
                <option value="hidden">Hidden</option>
              </select>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
} 