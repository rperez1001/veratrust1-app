'use client'

import { useEffect, useState } from 'react'
import { SubscriptionPlan, getSubscriptionPlans, getCurrentSubscription } from '@/lib/premium-service'
import { Check, X } from 'lucide-react'
import { loadStripe } from '@stripe/stripe-js'

const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!)

export default function SubscriptionPage() {
  const [plans, setPlans] = useState<SubscriptionPlan[]>([])
  const [currentPlan, setCurrentPlan] = useState<string>('free')
  const [billingCycle, setBillingCycle] = useState<'monthly' | 'yearly'>('monthly')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const loadData = async () => {
      try {
        const [plansData, subscription] = await Promise.all([
          getSubscriptionPlans(),
          getCurrentSubscription()
        ])
        setPlans(plansData)
        setCurrentPlan(subscription.tier)
      } catch (error) {
        console.error('Error loading subscription data:', error)
      } finally {
        setLoading(false)
      }
    }

    loadData()
  }, [])

  const handleSubscribe = async (planId: string) => {
    try {
      const response = await fetch('/api/create-checkout-session', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          planId,
          billingCycle
        }),
      })

      const { sessionId } = await response.json()
      const stripe = await stripePromise

      if (stripe) {
        const { error } = await stripe.redirectToCheckout({ sessionId })
        if (error) {
          console.error('Stripe error:', error)
        }
      }
    } catch (error) {
      console.error('Error creating checkout session:', error)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-pink-500" />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        <div className="text-center">
          <h1 className="text-4xl font-bold tracking-tight text-gray-900 dark:text-white sm:text-5xl">
            Choose Your Plan
          </h1>
          <p className="mt-4 text-xl text-gray-600 dark:text-gray-400">
            Unlock premium features and find your perfect match
          </p>
        </div>

        {/* Billing Toggle */}
        <div className="mt-12 flex justify-center">
          <div className="relative bg-white dark:bg-gray-800 rounded-lg p-1 flex">
            <button
              onClick={() => setBillingCycle('monthly')}
              className={`${
                billingCycle === 'monthly'
                  ? 'bg-pink-500 text-white'
                  : 'text-gray-700 dark:text-gray-300'
              } relative w-32 rounded-md py-2 text-sm font-medium whitespace-nowrap focus:outline-none focus:z-10 transition-colors`}
            >
              Monthly
            </button>
            <button
              onClick={() => setBillingCycle('yearly')}
              className={`${
                billingCycle === 'yearly'
                  ? 'bg-pink-500 text-white'
                  : 'text-gray-700 dark:text-gray-300'
              } relative w-32 rounded-md py-2 text-sm font-medium whitespace-nowrap focus:outline-none focus:z-10 transition-colors`}
            >
              Yearly
              <span className="absolute -top-4 left-1/2 -translate-x-1/2 px-2 py-1 bg-green-500 text-white text-xs rounded">
                Save 20%
              </span>
            </button>
          </div>
        </div>

        {/* Plans Grid */}
        <div className="mt-12 grid gap-8 lg:grid-cols-3">
          {plans.map((plan) => (
            <div
              key={plan.id}
              className={`relative rounded-2xl bg-white dark:bg-gray-800 shadow-lg ${
                plan.name === currentPlan
                  ? 'ring-2 ring-pink-500'
                  : ''
              }`}
            >
              {plan.name === currentPlan && (
                <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-pink-500 text-white px-4 py-1 rounded-full text-sm font-medium">
                  Current Plan
                </div>
              )}

              <div className="p-8">
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white capitalize">
                  {plan.name.replace('_', ' ')}
                </h2>

                <p className="mt-4 text-gray-600 dark:text-gray-400">
                  {plan.name === 'free'
                    ? 'Basic features to get you started'
                    : plan.name === 'premium'
                    ? 'Advanced features for serious daters'
                    : 'Ultimate experience with all features'}
                </p>

                <div className="mt-6">
                  <div className="flex items-baseline">
                    <span className="text-5xl font-bold tracking-tight text-gray-900 dark:text-white">
                      ${billingCycle === 'monthly' ? plan.price_monthly : plan.price_yearly / 12}
                    </span>
                    <span className="ml-1 text-xl font-semibold text-gray-600 dark:text-gray-400">
                      /month
                    </span>
                  </div>
                  {billingCycle === 'yearly' && plan.name !== 'free' && (
                    <p className="mt-1 text-sm text-green-500">
                      Billed ${plan.price_yearly} yearly
                    </p>
                  )}
                </div>

                <ul className="mt-8 space-y-4">
                  {Object.entries(plan.features).map(([key, value]) => (
                    <li key={key} className="flex items-center">
                      {value ? (
                        <Check className="h-5 w-5 text-green-500 mr-3" />
                      ) : (
                        <X className="h-5 w-5 text-red-500 mr-3" />
                      )}
                      <span className="text-gray-700 dark:text-gray-300">
                        {key === 'swipes_per_day'
                          ? `${value === -1 ? 'Unlimited' : value} swipes per day`
                          : key
                              .split('_')
                              .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
                              .join(' ')}
                      </span>
                    </li>
                  ))}
                </ul>

                <button
                  onClick={() => handleSubscribe(plan.id)}
                  disabled={plan.name === currentPlan}
                  className={`mt-8 w-full rounded-lg px-4 py-2 text-center text-sm font-semibold transition-colors ${
                    plan.name === currentPlan
                      ? 'bg-gray-100 text-gray-400 dark:bg-gray-700 dark:text-gray-500 cursor-not-allowed'
                      : 'bg-pink-500 text-white hover:bg-pink-600'
                  }`}
                >
                  {plan.name === currentPlan
                    ? 'Current Plan'
                    : plan.name === 'free'
                    ? 'Current Plan'
                    : `Upgrade to ${plan.name.replace('_', ' ')}`}
                </button>
              </div>
            </div>
          ))}
        </div>

        {/* Features Comparison */}
        <div className="mt-16">
          <h2 className="text-2xl font-bold text-center text-gray-900 dark:text-white mb-8">
            Compare Features
          </h2>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-t border-gray-200 dark:border-gray-700">
                  <th className="py-4 px-6 text-left text-gray-500 dark:text-gray-400 font-medium">
                    Feature
                  </th>
                  {plans.map((plan) => (
                    <th
                      key={plan.id}
                      className="py-4 px-6 text-left text-gray-500 dark:text-gray-400 font-medium capitalize"
                    >
                      {plan.name.replace('_', ' ')}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                {Object.keys(plans[0]?.features || {}).map((feature) => (
                  <tr key={feature}>
                    <td className="py-4 px-6 text-gray-900 dark:text-white">
                      {feature
                        .split('_')
                        .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
                        .join(' ')}
                    </td>
                    {plans.map((plan) => (
                      <td key={plan.id} className="py-4 px-6">
                        {typeof plan.features[feature] === 'boolean' ? (
                          plan.features[feature] ? (
                            <Check className="h-5 w-5 text-green-500" />
                          ) : (
                            <X className="h-5 w-5 text-red-500" />
                          )
                        ) : feature === 'swipes_per_day' ? (
                          plan.features[feature] === -1 ? (
                            'Unlimited'
                          ) : (
                            plan.features[feature]
                          )
                        ) : (
                          plan.features[feature]
                        )}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* FAQ Section */}
        <div className="mt-16">
          <h2 className="text-2xl font-bold text-center text-gray-900 dark:text-white mb-8">
            Frequently Asked Questions
          </h2>
          <div className="grid gap-6 lg:grid-cols-2">
            <div className="bg-white dark:bg-gray-800 rounded-lg p-6">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                Can I change plans anytime?
              </h3>
              <p className="text-gray-600 dark:text-gray-400">
                Yes, you can upgrade, downgrade, or cancel your subscription at any time.
                Changes will take effect at the end of your current billing cycle.
              </p>
            </div>
            <div className="bg-white dark:bg-gray-800 rounded-lg p-6">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                What payment methods do you accept?
              </h3>
              <p className="text-gray-600 dark:text-gray-400">
                We accept all major credit cards, Apple Pay, and Google Pay through our
                secure payment processor, Stripe.
              </p>
            </div>
            <div className="bg-white dark:bg-gray-800 rounded-lg p-6">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                Is there a refund policy?
              </h3>
              <p className="text-gray-600 dark:text-gray-400">
                We offer a 7-day money-back guarantee for all premium subscriptions.
                Contact our support team if you're not satisfied.
              </p>
            </div>
            <div className="bg-white dark:bg-gray-800 rounded-lg p-6">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                What happens when I upgrade?
              </h3>
              <p className="text-gray-600 dark:text-gray-400">
                You'll immediately get access to all the features included in your new
                plan. Any remaining time on your current plan will be prorated.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
} 