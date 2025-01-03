'use client'

import { useEffect, useState } from 'react'
import { IconGenerator } from '@/components/icon-generator'
import { ScreenshotGenerator } from '@/components/screenshot-generator'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Button } from '@/components/ui/button'
import { useSearchParams, useRouter } from 'next/navigation'
import { authStore } from '@/lib/auth-store'
import { LayoutDashboard, LogOut } from 'lucide-react'
import { PageTransition } from '@/components/page-transition'

export default function StudioPage() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const [activeTab, setActiveTab] = useState<string>('icon')
  const [isLoading, setIsLoading] = useState(true)
  const [isAuthenticated, setIsAuthenticated] = useState(false)

  useEffect(() => {
    const initializeStudio = async () => {
      try {
        await authStore.initialize()
        const authStatus = authStore.isAuthenticated()
        setIsAuthenticated(authStatus)

        if (!authStatus) {
          router.replace('/auth/sign-in?redirectTo=/studio')
          return
        }

        const createParam = searchParams.get('create')
        if (createParam === 'true') {
          setActiveTab('icon')
        }
      } catch (error) {
        console.error('Studio initialization error:', error)
      } finally {
        setIsLoading(false)
      }
    }

    initializeStudio()
  }, [router, searchParams])

  const handleLogout = async () => {
    await authStore.signOut()
    router.push('/')
  }

  if (isLoading) {
    return null // veya loading spinner
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
                  onClick={() => router.push('/dashboard')}
                >
                  <LayoutDashboard className="w-4 h-4 mr-2" />
                  Dashboard
                </Button>
                <Button
                  variant="outline"
                  onClick={handleLogout}
                >
                  <LogOut className="w-4 h-4 mr-2" />
                  Sign Out
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

          <Tabs value={activeTab} onValueChange={setActiveTab}>
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