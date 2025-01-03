import { NextResponse } from 'next/server'
import type { User } from '@/lib/auth-store'

export async function POST(req: Request) {
  try {
    const body = await req.json()
    const { email, password } = body

    // Create a premium test user for test@test.com
    if (email === 'test@test.com') {
      const user: User = {
        id: 'test-123',
        name: 'Test User',
        email: 'test@test.com',
        subscription: 'pro' // Premium test user
      }
      return NextResponse.json({
        success: true,
        user
      })
    }

    // Regular users get free subscription
    const user: User = {
      id: '1',
      name: 'User',
      email,
      subscription: 'free'
    }

    return NextResponse.json({
      success: true,
      user
    })
  } catch (error) {
    return NextResponse.json(
      { success: false, error: 'Invalid credentials' },
      { status: 400 }
    )
  }
} 