import { NextResponse } from 'next/server'
import { headers } from 'next/headers'
import Stripe from 'stripe'
import { createClient } from '@supabase/supabase-js'

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

  let event: Stripe.Event

  try {
    event = stripe.webhooks.constructEvent(
      body,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET!
    )
  } catch (error) {
    console.error('Webhook signature verification failed:', error)
    return new NextResponse('Webhook Error', { status: 400 })
  }

  const session = event.data.object as Stripe.Checkout.Session

  if (event.type === 'checkout.session.completed') {
    // Subscription başarılı olduğunda
    const { error } = await supabase
      .from('user_subscriptions')
      .insert([
        {
          user_id: session.client_reference_id,
          subscription_type: 'pro',
          created_at: new Date().toISOString()
        }
      ])

    if (error) {
      console.error('Error updating subscription:', error)
      return new NextResponse('Error updating subscription', { status: 500 })
    }
  }

  return new NextResponse(null, { status: 200 })
}

export const runtime = 'edge' 