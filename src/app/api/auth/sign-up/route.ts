import { NextResponse } from 'next/server'
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { createClient } from '@supabase/supabase-js'
import { cookies } from 'next/headers'

// Debug function to ensure logs are visible
const debug = (...args: any[]) => {
  if (process.env.NODE_ENV === 'development') {
    console.log('[SIGNUP-DEBUG]', ...args)
  }
}

export async function POST(req: Request) {
  debug('Starting signup process...')
  
  try {
    const body = await req.json()
    debug('Request body:', body)
    const { email, password } = body
    
    // Create a service role client to access auth.users
    const supabaseAdmin = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false
        }
      }
    )
    debug('Admin client created with URL:', process.env.NEXT_PUBLIC_SUPABASE_URL)

    // Log the actual query we're about to make
    debug('Querying auth.users for email:', email)
    
    // Try a simpler query first to test connection
    const { data: testData, error: testError } = await supabaseAdmin
      .from('auth.users')
      .select('count')
      .limit(1)
    
    debug('Test query result:', { testData, testError })

    // Check if email exists in auth.users
    const { data: existingUsers, error: checkError } = await supabaseAdmin
      .from('auth.users')
      .select('email')
      .eq('email', email)
      .limit(1)

    debug('Email check result:', { existingUsers, checkError })

    if (checkError) {
      debug('Error checking email:', checkError)
      return NextResponse.json(
        { error: 'Error checking email' },
        { status: 500 }
      )
    }

    if (existingUsers && existingUsers.length > 0) {
      debug('Email exists, returning error')
      return NextResponse.json(
        { error: 'This email is already registered. Please try signing in instead.' },
        { status: 400 }
      )
    }

    debug('Email is available, proceeding with signup')
    const supabase = createRouteHandlerClient({ cookies })
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: `${process.env.NEXT_PUBLIC_BASE_URL}/auth/callback`
      }
    })

    if (error) {
      debug('Signup error:', error)
      throw error
    }

    debug('Signup successful:', { userId: data.user?.id })

    // Create free subscription for new user
    if (data.user) {
      debug('Creating subscription for:', data.user.id)
      const { error: subscriptionError } = await supabase
        .from('user_subscriptions')
        .insert([
          {
            user_id: data.user.id,
            subscription_type: 'free',
            created_at: new Date().toISOString()
          }
        ])

      if (subscriptionError) {
        debug('Subscription error:', subscriptionError)
      } else {
        debug('Subscription created successfully')
      }
    }

    return NextResponse.json({ 
      user: data.user,
      session: data.session 
    })

  } catch (error) {
    debug('Unhandled error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Registration failed' },
      { status: 400 }
    )
  }
} 