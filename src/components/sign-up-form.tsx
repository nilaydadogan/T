'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card } from '@/components/ui/card'
import { useToast } from '@/components/ui/use-toast'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

export function SignUpForm() {
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [errors, setErrors] = useState({
    name: '',
    email: '',
    password: ''
  })
  const [isLoading, setIsLoading] = useState(false)
  const { toast } = useToast()
  const router = useRouter()

  const validateForm = () => {
    const newErrors = {
      name: '',
      email: '',
      password: ''
    }
    let isValid = true

    if (name.length < 2) {
      newErrors.name = 'Name must be at least 2 characters long'
      isValid = false
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(email)) {
      newErrors.email = 'Please enter a valid email address'
      isValid = false
    }

    if (password.length < 6) {
      newErrors.password = 'Password must be at least 6 characters long'
      isValid = false
    }

    setErrors(newErrors)
    return isValid
  }

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!validateForm()) {
      return
    }

    setIsLoading(true)

    try {
      const response = await fetch('/api/auth/sign-up', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          name: name.trim(), 
          email: email.trim().toLowerCase(), 
          password 
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to sign up')
      }

      toast({
        title: 'Success',
        description: 'Account created successfully',
      })

      router.push('/sign-in')
    } catch (error) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to sign up',
      })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Card className="w-full p-6 space-y-6 backdrop-blur-sm bg-white/80 dark:bg-gray-900/80">
      <div className="space-y-2 text-center">
        <h1 className="text-3xl font-bold">Create an account</h1>
        <p className="text-gray-500">Get started with our app</p>
      </div>

      <form onSubmit={handleSignUp} className="space-y-4">
        <div className="space-y-2">
          <Input
            placeholder="Name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
            className={errors.name ? 'border-red-500' : ''}
          />
          {errors.name && (
            <p className="text-sm text-red-500">{errors.name}</p>
          )}
        </div>
        <div className="space-y-2">
          <Input
            type="email"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            className={errors.email ? 'border-red-500' : ''}
          />
          {errors.email && (
            <p className="text-sm text-red-500">{errors.email}</p>
          )}
        </div>
        <div className="space-y-2">
          <Input
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            className={errors.password ? 'border-red-500' : ''}
          />
          {errors.password && (
            <p className="text-sm text-red-500">{errors.password}</p>
          )}
        </div>
        <Button 
          type="submit" 
          className="w-full bg-gradient-to-r from-violet-500 to-fuchsia-500 text-white"
          disabled={isLoading}
        >
          {isLoading ? 'Creating account...' : 'Sign Up'}
        </Button>
      </form>

      <div className="text-center text-sm">
        <p className="text-gray-500">
          Already have an account?{' '}
          <Link href="/sign-in" className="text-violet-500 hover:underline">
            Sign in
          </Link>
        </p>
      </div>
    </Card>
  )
} 