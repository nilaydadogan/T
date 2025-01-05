'use client'

import { Button } from '@/components/ui/button'
import dynamic from 'next/dynamic'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { authStore } from '@/lib/auth-store'
import { useEffect, useState } from 'react'
import { PageTransition } from '@/components/page-transition'
import { ShowcaseAnimation } from '@/components/showcase-animation'

// Dynamically import icons to prevent hydration mismatch
const ArrowRight = dynamic(() => import('lucide-react').then(mod => mod.ArrowRight), {
  ssr: false,
})
const Crown = dynamic(() => import('lucide-react').then(mod => mod.Crown), {
  ssr: false,
})

export default function HomePage() {
  const router = useRouter()
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    const initAuth = async () => {
      await authStore.initialize()
      setIsAuthenticated(authStore.isAuthenticated())
      setMounted(true)
    }

    initAuth()

    // Listen for auth changes
    const handleAuthChange = () => {
      setIsAuthenticated(authStore.isAuthenticated())
    }

    window.addEventListener('auth-changed', handleAuthChange)
    return () => window.removeEventListener('auth-changed', handleAuthChange)
  }, [])

  const handleGetStarted = async () => {
    if (authStore.isAuthenticated()) {
      router.push('/studio')
    } else {
      router.push('/auth/sign-in')
    }
  }

  return (
    <PageTransition>
      <div className="relative min-h-screen overflow-hidden bg-gray-50 dark:bg-gray-900">
        {/* Animated Background */}
        <div className="absolute inset-0">
          <div className="absolute inset-0 bg-grid-slate-900/[0.04] bg-[size:20px_20px] dark:bg-grid-slate-100/[0.02]" />
          <div className="absolute h-full w-full">
            <div className="absolute -top-48 -left-48 h-96 w-96 rounded-full bg-violet-500/30 mix-blend-multiply blur-3xl animate-blob" />
            <div className="absolute top-48 -right-48 h-96 w-96 rounded-full bg-fuchsia-500/30 mix-blend-multiply blur-3xl animate-blob animation-delay-2000" />
            <div className="absolute -bottom-48 left-48 h-96 w-96 rounded-full bg-pink-500/30 mix-blend-multiply blur-3xl animate-blob animation-delay-4000" />
          </div>
        </div>

        {/* Content */}
        <div className="relative">
          <div className="container mx-auto px-6">
            {/* Header */}
            <header className="flex justify-end py-6">
              {mounted && (isAuthenticated ? (
                <div className="flex gap-4">
                  <Button
                    variant="outline"
                    className="backdrop-blur-sm bg-white/10"
                    onClick={() => router.push('/dashboard')}
                  >
                    Dashboard
                  </Button>
                  <Button
                    variant="outline"
                    className="backdrop-blur-sm bg-white/10"
                    onClick={() => router.push('/studio')}
                  >
                    Studio
                  </Button>
                </div>
              ) : (
                <div className="flex gap-4">
                  <Link href="/auth/sign-in">
                    <Button
                      variant="outline"
                      className="backdrop-blur-sm bg-white/10"
                    >
                      Sign In
                    </Button>
                  </Link>
                  <Link href="/auth/sign-up">
                    <Button
                      className="bg-gradient-to-r from-violet-500 to-fuchsia-500 text-white shadow-lg hover:shadow-violet-500/25"
                    >
                      Sign Up
                    </Button>
                  </Link>
                </div>
              ))}
            </header>

            {/* Hero Section */}
            <main className="flex items-center justify-between min-h-[calc(100vh-88px)]">
              {/* Left side - Text content */}
              <div className="flex-1 text-left px-6 space-y-6">
                <div className="max-w-xl">
                  <h2 className="text-5xl md:text-6xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-violet-500 via-fuchsia-500 to-pink-500 [text-shadow:_0_1px_0_rgb(0_0_0_/_20%)] leading-tight">
                  Create professional Apple Store Icons and Screenshots with ease.  
                  </h2>
                  <p className="mt-6 text-xl text-gray-600 dark:text-gray-400">
                  Don't have a time? Let AI inspire and streamline your design process!
                  </p>
                  <div className="mt-10 flex gap-4">
                    <Button
                      className="bg-gradient-to-r from-violet-500 to-fuchsia-500 hover:from-violet-600 hover:to-fuchsia-600 text-white"
                      onClick={handleGetStarted}
                    >
                      Get Started
                      <ArrowRight className="ml-2 h-5 w-5" />
                    </Button>
                    {!isAuthenticated ? (
                      <Button
                        size="lg"
                        variant="outline"
                        className="min-w-[160px] h-12 backdrop-blur-sm bg-white/10"
                        onClick={() => router.push('/pricing')}
                      >
                        View Pricing
                      </Button>
                    ) : !authStore.isPro() && (
                      <Button
                        size="lg"
                        className="min-w-[160px] h-12 bg-gradient-to-r from-violet-500 to-fuchsia-500 text-white"
                        onClick={() => router.push('/pricing')}
                      >
                        Upgrade to Pro
                        <Crown className="ml-2 h-5 w-5" />
                      </Button>
                    )}
                  </div>
                </div>
              </div>

              {/* Right side - Animation */}
              <div className="flex-1 relative">
                <div className="absolute inset-0 bg-gradient-to-l from-transparent to-gray-50 dark:to-gray-900 w-32 z-10" />
                <ShowcaseAnimation />
              </div>
            </main>
          </div>
        </div>
      </div>
    </PageTransition>
  )
} 