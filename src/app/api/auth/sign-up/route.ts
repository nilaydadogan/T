import { NextResponse } from 'next/server'
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'

export async function POST(req: Request) {
  try {
    const { email, password } = await req.json()
    const supabase = createRouteHandlerClient({ cookies })

    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: `${process.env.NEXT_PUBLIC_BASE_URL}/auth/callback`
      }
    })

    if (error) throw error

    // Yeni kullanıcı için free subscription oluştur
    if (data.user) {
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
        console.error('Error creating subscription:', subscriptionError)
      }
    }

    return NextResponse.json({ 
      user: data.user,
      session: data.session 
    })

  } catch (error) {
    console.error('Sign up error:', error)
    return NextResponse.json(
      { error: 'Registration failed' },
      { status: 400 }
    )
  }
} 