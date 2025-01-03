'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card } from '@/components/ui/card'
import { useToast } from '@/components/ui/use-toast'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { authStore } from '@/lib/auth-store'

export function SignInForm() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const { toast } = useToast()
  const router = useRouter()

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)

    try {
      const response = await fetch('/api/auth/sign-in', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to sign in')
      }

      toast({
        title: 'Success',
        description: 'Signed in successfully',
      })

      if (data.user) {
        authStore.setUser(data.user)
        router.push('/?create=true')
      }
    } catch (error) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to sign in',
      })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Card className="w-full p-6 space-y-6 backdrop-blur-sm bg-white/80 dark:bg-gray-900/80">
      <div className="space-y-2 text-center">
        <h1 className="text-3xl font-bold">Welcome back</h1>
        <p className="text-gray-500">Sign in to your account</p>
      </div>

      <form onSubmit={handleSignIn} className="space-y-4">
        <div className="space-y-2">
          <Input
            type="email"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
        </div>
        <div className="space-y-2">
          <Input
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
        </div>
        <Button 
          type="submit" 
          className="w-full bg-gradient-to-r from-violet-500 to-fuchsia-500 text-white"
          disabled={isLoading}
        >
          {isLoading ? 'Signing in...' : 'Sign In'}
        </Button>
      </form>

      <div className="text-center text-sm">
        <p className="text-gray-500">
          Don't have an account?{' '}
          <Link href="/sign-up" className="text-violet-500 hover:underline">
            Sign up
          </Link>
        </p>
      </div>
    </Card>
  )
} 