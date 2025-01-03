'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useToast } from '@/components/ui/use-toast'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import { motion } from 'framer-motion'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'

interface AuthFormProps {
  mode: 'sign-in' | 'sign-up'
}

export function AuthForm({ mode }: AuthFormProps) {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const { toast } = useToast()
  const router = useRouter()
  const searchParams = useSearchParams()
  const redirectTo = searchParams.get('redirectTo') || '/dashboard'
  const supabase = createClientComponentClient()

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)

    try {
      if (mode === 'sign-up') {
        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            emailRedirectTo: `${window.location.origin}/auth/callback`,
          },
        })
        if (error) throw error
        toast({
          title: "Check your email",
          description: "We've sent you a verification link.",
        })
      } else {
        const { error } = await supabase.auth.signInWithPassword({
          email,
          password,
        })
        if (error) throw error

        toast({
          title: "Welcome back!",
          description: "Successfully signed in.",
        })

        // Use replace instead of push to avoid back button issues
        router.replace(redirectTo)
      }
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error",
        description: error instanceof Error ? error.message : "Authentication failed",
      })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <motion.div
      className="w-full max-w-md mx-auto p-6 space-y-6"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      <div className="space-y-2 text-center">
        <h2 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-violet-500 via-fuchsia-500 to-pink-500">
          {mode === 'sign-up' ? 'Create an Account' : 'Welcome Back'}
        </h2>
        <p className="text-gray-600 dark:text-gray-400">
          {mode === 'sign-up' 
            ? 'Sign up to access all features'
            : 'Sign in to continue to your account'
          }
        </p>
      </div>

      <form onSubmit={handleAuth} className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="email">Email</Label>
          <Input
            id="email"
            type="email"
            placeholder="you@example.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="password">Password</Label>
          <Input
            id="password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
        </div>
        <Button
          type="submit"
          className="w-full bg-gradient-to-r from-violet-500 via-fuchsia-500 to-pink-500 hover:from-violet-600 hover:via-fuchsia-600 hover:to-pink-600"
          disabled={isLoading}
        >
          {isLoading ? (
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 border-2 border-white/50 border-t-white rounded-full animate-spin" />
              {mode === 'sign-up' ? 'Creating account...' : 'Signing in...'}
            </div>
          ) : (
            mode === 'sign-up' ? 'Sign Up' : 'Sign In'
          )}
        </Button>
      </form>

      <div className="text-center">
        <Link 
          href={mode === 'sign-up' ? '/auth/sign-in' : '/auth/sign-up'}
          className="text-violet-500 hover:text-violet-600"
        >
          {mode === 'sign-up' 
            ? 'Already have an account? Sign in'
            : "Don't have an account? Sign up"
          }
        </Link>
      </div>
    </motion.div>
  )
} 