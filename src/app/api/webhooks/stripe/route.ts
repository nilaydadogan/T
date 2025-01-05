import { NextResponse } from 'next/server'
import { headers } from 'next/headers'
import Stripe from 'stripe'
import { createClient } from '@supabase/supabase-js'

// Debug function
const debug = (...args: any[]) => {
  if (process.env.NODE_ENV === 'development') {
    console.log('[STRIPE-WEBHOOK]', ...args)
  }
}

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2024-12-18.acacia'
})

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function POST(req: Request) {
  const body = await req.text()
  const signature = headers().get('stripe-signature')!

  debug('Received webhook')

  let event: Stripe.Event

  try {
    event = stripe.webhooks.constructEvent(
      body,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET!
    )
    debug('Webhook event type:', event.type)
  } catch (error) {
    debug('Webhook signature verification failed:', error)
    return new NextResponse('Webhook Error', { status: 400 })
  }

  const session = event.data.object as Stripe.Checkout.Session
  debug('Session data:', {
    id: session.id,
    client_reference_id: session.client_reference_id,
    subscription: session.subscription,
    status: session.status
  })

  try {
    if (event.type === 'checkout.session.completed' || event.type === 'invoice.payment_succeeded') {
      debug('Processing payment event:', event.type)

      let userId: string | undefined
      let subscriptionId: string | undefined

      if (event.type === 'checkout.session.completed') {
        const session = event.data.object as Stripe.Checkout.Session
        userId = session.client_reference_id || undefined
        subscriptionId = (session.subscription as string) || undefined
      } else {
        const invoice = event.data.object as Stripe.Invoice
        const subscription = await stripe.subscriptions.retrieve(invoice.subscription as string)
        const customerId = subscription.customer as string

        // Get user ID from customer ID
        const { data: userData, error: userError } = await supabase
          .from('users')
          .select('id')
          .eq('stripe_customer_id', customerId)
          .single()

        if (userError) {
          debug('Error finding user by customer ID:', userError)
          throw userError
        }

        userId = userData.id
        subscriptionId = (invoice.subscription as string) || undefined
      }

      if (!userId) {
        throw new Error('No user ID found in event')
      }

      if (!subscriptionId) {
        throw new Error('No subscription ID found in event')
      }

      // Get subscription details
      const subscription = await stripe.subscriptions.retrieve(subscriptionId)
      debug('Full subscription object:', JSON.stringify(subscription, null, 2))
      debug('Current period end timestamp:', subscription.current_period_end)
      debug('Current period end date:', new Date(subscription.current_period_end * 1000))

      // Determine subscription type based on price ID
      let subscriptionType = 'pro' // default
      const priceId = subscription.items.data[0].price.id
      debug('Price ID:', priceId)
      debug('Monthly Price ID:', process.env.STRIPE_MONTHLY_PRICE_ID)
      debug('Yearly Price ID:', process.env.STRIPE_YEARLY_PRICE_ID)

      // Always set to pro if it's a valid subscription
      if (priceId === process.env.STRIPE_MONTHLY_PRICE_ID || priceId === process.env.STRIPE_YEARLY_PRICE_ID) {
        subscriptionType = 'pro'
      }
      
      debug('Determined subscription type:', subscriptionType)

      // Update user's subscription in Supabase
      const currentPeriodEnd = new Date(subscription.current_period_end * 1000)
      debug('Formatted current_period_end:', currentPeriodEnd.toISOString())

      const subscriptionData = {
        user_id: userId,
        subscription_type: subscriptionType,
        stripe_subscription_id: subscription.id,
        current_period_end: currentPeriodEnd.toISOString(),
        created_at: new Date().toISOString()
      }

      debug('Updating subscription in database:', subscriptionData)

      // First try to delete any existing subscription
      const { error: deleteError } = await supabase
        .from('user_subscriptions')
        .delete()
        .eq('user_id', userId)

      if (deleteError) {
        debug('Error deleting existing subscription:', deleteError)
      }

      // Then insert the new subscription with explicit current_period_end
      const { data: insertedData, error: insertError } = await supabase
        .from('user_subscriptions')
        .insert([{
          user_id: userId,
          subscription_type: subscriptionType,
          stripe_subscription_id: subscription.id,
          current_period_end: currentPeriodEnd.toISOString(),
          created_at: new Date().toISOString()
        }])
        .select()

      if (insertError) {
        debug('Error inserting new subscription:', insertError)
        throw insertError
      }

      debug('Successfully inserted subscription:', insertedData)
    }

    return new NextResponse(null, { status: 200 })
  } catch (error) {
    debug('Error processing webhook:', error)
    return new NextResponse('Webhook processing failed', { status: 500 })
  }
}

export const config = {
  api: {
    bodyParser: false
  }
} 