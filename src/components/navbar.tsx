'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { authStore } from '@/lib/auth-store'
import { useRouter } from 'next/navigation'

export function Navbar() {
  const router = useRouter()
  const [isAuthenticated, setIsAuthenticated] = useState(false)

  useEffect(() => {
    // Initial auth check
    const checkAuth = () => {
      const authStatus = authStore.isAuthenticated()
      console.log('Auth status changed:', authStatus) // Debug log
      setIsAuthenticated(authStatus)
    }

    checkAuth() // Check immediately
    
    // Listen for auth changes
    window.addEventListener('auth-changed', checkAuth)

    // Cleanup
    return () => {
      window.removeEventListener('auth-changed', checkAuth)
    }
  }, [])

  const handleLogout = async () => {
    await authStore.signOut()
    setIsAuthenticated(false) // Immediately update state
    router.push('/')
  }

  return (
    <nav className="border-b bg-background">
      <div className="container mx-auto px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-6">
            <Link href="/" className="text-xl font-bold">
              Logo
            </Link>
            {isAuthenticated && (
              <>
                <Link href="/studio" className="text-sm text-muted-foreground hover:text-foreground">
                  Studio
                </Link>
                <Link href="/dashboard" className="text-sm text-muted-foreground hover:text-foreground">
                  Dashboard
                </Link>
              </>
            )}
          </div>

          <div className="flex items-center gap-4">
            {!isAuthenticated ? (
              <>
                <Button variant="ghost" onClick={() => router.push('/auth/sign-in')}>
                  Sign In
                </Button>
                <Button onClick={() => router.push('/auth/sign-up')}>
                  Get Started
                </Button>
              </>
            ) : (
              <Button variant="ghost" onClick={handleLogout}>
                Sign Out
              </Button>
            )}
          </div>
        </div>
      </div>
    </nav>
  )
} 