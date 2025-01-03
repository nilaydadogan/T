import { NextResponse } from 'next/server'
import type { User } from '@/lib/auth-store'

export async function POST(req: Request) {
  try {
    const body = await req.json()
    const { email, password, name } = body

    // Create a new user with free subscription by default
    const user: User = {
      id: crypto.randomUUID(),
      name,
      email,
      subscription: 'free' // Explicitly set as free
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