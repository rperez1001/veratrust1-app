'use client'

import { useEffect, useState } from 'react'
import { useSearchParams } from 'next/navigation'
import { updateSubscription } from '@/lib/premium-service'
import Stripe from 'stripe'

const stripe = new Stripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!)

export default function SubscriptionSuccessPage() {
  const searchParams = useSearchParams()
  const sessionId = searchParams.get('session_id')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const processSubscription = async () => {
      if (!sessionId) {
        setError('Invalid session')
        setLoading(false)
        return
      }

      try {
        // Verify the session
        const response = await fetch('/api/verify-subscription', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ sessionId }),
        })

        const data = await response.json()

        if (!response.ok) {
          throw new Error(data.error || 'Failed to verify subscription')
        }

        // Update local subscription status
        const { planId, billingCycle } = data
        const endDate = new Date()
        endDate.setFullYear(
          endDate.getFullYear() + (billingCycle === 'yearly' ? 1 : 0),
          endDate.getMonth() + (billingCycle === 'monthly' ? 1 : 0)
        )

        await updateSubscription(planId, endDate.toISOString())

        // Redirect to dashboard after a short delay
        setTimeout(() => {
          window.location.href = '/dashboard'
        }, 5000)
      } catch (err) {
        console.error('Error processing subscription:', err)
        setError('Failed to process subscription')
      } finally {
        setLoading(false)
      }
    }

    processSubscription()
  }, [sessionId])

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-950">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-pink-500 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
            Processing your subscription...
          </h2>
          <p className="mt-2 text-gray-600 dark:text-gray-400">
            Please wait while we set up your account.
          </p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-950">
        <div className="text-center">
          <div className="rounded-full h-12 w-12 bg-red-100 dark:bg-red-900 flex items-center justify-center mx-auto mb-4">
            <svg
              className="h-6 w-6 text-red-600 dark:text-red-300"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </div>
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
            Subscription Error
          </h2>
          <p className="mt-2 text-gray-600 dark:text-gray-400">{error}</p>
          <a
            href="/subscription"
            className="mt-4 inline-block px-4 py-2 bg-pink-500 text-white rounded-lg hover:bg-pink-600 transition-colors"
          >
            Try Again
          </a>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-950">
      <div className="text-center">
        <div className="rounded-full h-12 w-12 bg-green-100 dark:bg-green-900 flex items-center justify-center mx-auto mb-4">
          <svg
            className="h-6 w-6 text-green-600 dark:text-green-300"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M5 13l4 4L19 7"
            />
          </svg>
        </div>
        <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
          Thank you for subscribing!
        </h2>
        <p className="mt-2 text-gray-600 dark:text-gray-400">
          Your subscription has been processed successfully.
        </p>
        <p className="mt-1 text-gray-600 dark:text-gray-400">
          Redirecting you to the dashboard...
        </p>
      </div>
    </div>
  )
} 