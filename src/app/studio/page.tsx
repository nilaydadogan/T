'use client'

import { IconGenerator } from '@/components/icon-generator'
import { ScreenshotGenerator } from '@/components/screenshot-generator'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Button } from '@/components/ui/button'
import { useSearchParams } from 'next/navigation'
import { useEffect, useState } from 'react'
import { authStore } from '@/lib/auth-store'
import { useRouter } from 'next/navigation'
import { LayoutDashboard, LogOut } from 'lucide-react'
import { PageTransition } from '@/components/page-transition'

export default function StudioPage() {
  // Move all the current generator page code here
  const searchParams = useSearchParams()
  const router = useRouter()
  const [activeTab, setActiveTab] = useState('icon')
  const isAuthenticated = authStore.isAuthenticated()

  useEffect(() => {
    const createParam = searchParams.get('create')
    if (createParam === 'true') {
      setActiveTab('icon')
    }
  }, [searchParams])

  useEffect(() => {
    // Client-side auth kontrolü
    if (!authStore.isAuthenticated()) {
      router.replace('/auth/sign-in?redirectTo=/studio')
    }
  }, [router])

  const handleLogout = () => {
    authStore.logout()
    router.push('/')
  }

  return (
    <PageTransition>
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
        <div className="container mx-auto p-6 space-y-8">
          {/* Header with buttons */}
          <div className="flex justify-end gap-4">
            {isAuthenticated && (
              <>
                <Button
                  variant="outline"
                  className="flex items-center gap-2"
                  onClick={() => router.push('/dashboard')}
                >
                  <LayoutDashboard className="w-4 h-4" />
                  Dashboard
                </Button>
                <Button
                  variant="outline"
                  className="flex items-center gap-2"
                  onClick={handleLogout}
                >
                  <LogOut className="w-4 h-4" />
                  Sign Out
                </Button>
              </>
            )}
            {!isAuthenticated && (
              <>
                <Button
                  variant="outline"
                  onClick={() => router.push('/sign-in')}
                >
                  Sign In
                </Button>
                <Button
                  className="bg-gradient-to-r from-violet-500 to-fuchsia-500 text-white"
                  onClick={() => router.push('/sign-up')}
                >
                  Sign Up
                </Button>
              </>
            )}
          </div>

          {/* Welcome Header */}
          <div className="text-center space-y-2 mb-8">
            <h1 className="text-4xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-violet-500 via-fuchsia-500 to-pink-500">
              Welcome to Studio
            </h1>
            <p className="text-gray-600 dark:text-gray-400 text-lg">
              Generate all your needs below
            </p>
          </div>

          <Tabs defaultValue={activeTab} value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="icon">Icon Generator</TabsTrigger>
              <TabsTrigger value="screenshot">Screenshot Generator</TabsTrigger>
            </TabsList>
            <TabsContent value="icon">
              <IconGenerator />
            </TabsContent>
            <TabsContent value="screenshot">
              <ScreenshotGenerator />
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </PageTransition>
  )
} 