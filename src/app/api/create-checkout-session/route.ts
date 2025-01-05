import { NextResponse } from 'next/server'
import Stripe from 'stripe'
import { createClient } from '@supabase/supabase-js'

// Debug function
const debug = (...args: any[]) => {
  if (process.env.NODE_ENV === 'development') {
    console.log('[STRIPE-DEBUG]', ...args)
  }
}

if (!process.env.STRIPE_SECRET_KEY) {
  throw new Error('STRIPE_SECRET_KEY is not set')
}

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
  apiVersion: '2024-12-18.acacia'
})

// Create Supabase client with service role
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

const PRICE_IDS = {
  monthly: process.env.STRIPE_MONTHLY_PRICE_ID,
  yearly: process.env.STRIPE_YEARLY_PRICE_ID
}

export async function POST(req: Request) {
  try {
    debug('Starting checkout session creation...')
    
    const { userId, email, planType } = await req.json()
    debug('Request data:', { userId, email, planType })

    if (!userId || !email) {
      debug('Missing required fields')
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }

    const priceId = PRICE_IDS[planType as keyof typeof PRICE_IDS]
    debug('Price ID for plan:', { planType, priceId })

    if (!priceId) {
      debug('Invalid plan type or missing price ID:', { planType, PRICE_IDS })
      return NextResponse.json(
        { error: 'Invalid plan type or price ID not configured' },
        { status: 400 }
      )
    }

    debug('Creating checkout session with Stripe...')
    
    // First, create or get customer
    let customer
    const { data: customers } = await stripe.customers.list({
      email: email,
      limit: 1
    })

    if (customers && customers.length > 0) {
      customer = customers[0]
    } else {
      customer = await stripe.customers.create({
        email: email
      })
    }

    // First ensure user exists in users table
    const { data: existingUser, error: checkError } = await supabase
      .from('users')
      .select('id')
      .eq('id', userId)
      .single()

    if (checkError || !existingUser) {
      debug('Creating new user record')
      const { error: insertError } = await supabase
        .from('users')
        .insert([
          {
            id: userId,
            email: email,
            stripe_customer_id: customer.id
          }
        ])

      if (insertError) {
        debug('Error creating user record:', insertError)
        throw insertError
      }
    } else {
      debug('Updating existing user with customer ID')
      const { error: updateError } = await supabase
        .from('users')
        .update({ stripe_customer_id: customer.id })
        .eq('id', userId)

      if (updateError) {
        debug('Error updating user with customer ID:', updateError)
        throw updateError
      }
    }

    const session = await stripe.checkout.sessions.create({
      customer: customer.id,
      line_items: [
        {
          price: priceId,
          quantity: 1,
        },
      ],
      mode: 'subscription',
      success_url: `${process.env.NEXT_PUBLIC_BASE_URL}/checkout/success`,
      cancel_url: `${process.env.NEXT_PUBLIC_BASE_URL}/pricing`,
      client_reference_id: userId,
    })

    debug('Checkout session created successfully:', { sessionId: session.id })
    return NextResponse.json({ sessionId: session.id })

  } catch (error) {
    debug('Stripe error:', {
      error,
      message: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined
    })

    // Handle specific Stripe errors
    if (error instanceof Stripe.errors.StripeError) {
      return NextResponse.json(
        { error: `Stripe error: ${error.message}` },
        { status: error.statusCode || 500 }
      )
    }

    return NextResponse.json(
      { error: 'Failed to create checkout session' },
      { status: 500 }
    )
  }
} 