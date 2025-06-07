import { NextResponse } from 'next/server'
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import Stripe from 'stripe'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2025-05-28.basil'
})

export async function POST(request: Request) {
  try {
    const supabase = createRouteHandlerClient({ cookies })
    const {
      data: { session },
    } = await supabase.auth.getSession()

    if (!session) {
      return NextResponse.json(
        { error: 'Not authenticated' },
        { status: 401 }
      )
    }

    const { sessionId } = await request.json()

    // Retrieve the checkout session
    const checkoutSession = await stripe.checkout.sessions.retrieve(sessionId)

    if (!checkoutSession || checkoutSession.payment_status !== 'paid') {
      return NextResponse.json(
        { error: 'Invalid or unpaid session' },
        { status: 400 }
      )
    }

    // Get subscription details from metadata
    const { planId, billingCycle } = checkoutSession.metadata as {
      planId: string
      billingCycle: 'monthly' | 'yearly'
    }

    // Get plan details
    const { data: plan } = await supabase
      .from('subscription_plans')
      .select('name')
      .eq('id', planId)
      .single()

    if (!plan) {
      return NextResponse.json(
        { error: 'Plan not found' },
        { status: 404 }
      )
    }

    // Update user's subscription in database
    const endDate = new Date()
    endDate.setFullYear(
      endDate.getFullYear() + (billingCycle === 'yearly' ? 1 : 0),
      endDate.getMonth() + (billingCycle === 'monthly' ? 1 : 0)
    )

    const { error: updateError } = await supabase
      .from('profiles')
      .update({
        subscription_tier: plan.name,
        subscription_start_date: new Date().toISOString(),
        subscription_end_date: endDate.toISOString()
      })
      .eq('id', session.user.id)

    if (updateError) {
      throw updateError
    }

    return NextResponse.json({
      planId: plan.name,
      billingCycle
    })
  } catch (error) {
    console.error('Subscription verification error:', error)
    return NextResponse.json(
      { error: 'Failed to verify subscription' },
      { status: 500 }
    )
  }
} 