'use client'

import { useEffect, useState } from 'react'
import { Card, CardFooter } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { 
  ImageIcon, 
  Smartphone, 
  User, 
  LogOut, 
  Crown,
  ArrowLeft 
} from 'lucide-react'
import { useRouter } from 'next/navigation'
import type { GeneratedAsset } from '@/types/user'
import { storage } from '@/lib/storage'
import { authStore } from '@/lib/auth-store'
import { Loading } from '@/components/loading'
import { ErrorDisplay } from '@/components/error-boundary'
import { PageTransition } from '@/components/page-transition'

const downloadAsset = async (url: string, type: string) => {
  try {
    const response = await fetch(url)
    const blob = await response.blob()
    const blobUrl = window.URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = blobUrl
    a.download = `generated-${type}-${Date.now()}.png`
    document.body.appendChild(a)
    a.click()
    a.remove()
    window.URL.revokeObjectURL(blobUrl)
  } catch (error) {
    console.error('Download failed:', error)
  }
}

export default function DashboardPage() {
  const router = useRouter()
  const [user, setUser] = useState<any>(null)
  const [isPro, setIsPro] = useState(false)
  const [assets, setAssets] = useState<GeneratedAsset[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)
  const [userEmail, setUserEmail] = useState<string>('')
  const [userInitials, setUserInitials] = useState<string>('')

  useEffect(() => {
    const initializeDashboard = async () => {
      try {
        // Auth store'u initialize et
        await authStore.initialize()

        if (!authStore.isAuthenticated()) {
          router.push('/auth/sign-in')
          return
        }

        // Get user data
        const userData = authStore.getUser()
        if (!userData) {
          // Auth store'u tekrar initialize etmeyi dene
          await authStore.refreshAuth()
          const refreshedUser = authStore.getUser()
          
          if (!refreshedUser) {
            throw new Error('User data not found')
          }
          
          setUser(refreshedUser)
          setIsPro(authStore.isPro())
        } else {
          setUser(userData)
          setIsPro(authStore.isPro())
        }

        // Get stored assets
        const storedAssets = storage.getAssets()
        setAssets(storedAssets)
      } catch (err) {
        console.error('Dashboard initialization error:', err)
        setError(err instanceof Error ? err : new Error('Failed to load dashboard'))
      } finally {
        setIsLoading(false)
      }
    }

    initializeDashboard()
  }, [router])

  useEffect(() => {
    const user = authStore.getUser()
    if (user?.email) {
      setUserEmail(user.email)
      // Email adresinden baş harfleri al
      const initials = user.email
        .split('@')[0] // @ işaretinden önceki kısmı al
        .match(/\b(\w)/g) // Kelimelerin ilk harflerini al
        ?.join('') // Harfleri birleştir
        .toUpperCase() // Büyük harfe çevir
        .slice(0, 2) // İlk 2 harfi al
      setUserInitials(initials || '??')
    }
  }, [])

  const handleLogout = () => {
    authStore.logout()
    router.push('/')
  }

  const handleCreateNew = () => {
    router.push('/studio')
  }

  // Add filtered views for icons and screenshots
  const iconAssets = assets.filter(asset => asset.type === 'icon')
  const screenshotAssets = assets.filter(asset => asset.type === 'screenshot')

  // Update the asset card rendering (used in all three tabs)
  const AssetCard = ({ asset }: { asset: GeneratedAsset }) => (
    <Card className="group relative overflow-hidden">
      <div className="aspect-square relative">
        <img
          src={asset.url}
          alt={`Generated ${asset.type} - ${asset.name}`}
          className="object-cover w-full h-full"
        />
        {/* Download button overlay */}
        <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
          <Button
            variant="outline"
            className="text-white border-white hover:bg-white/20"
            onClick={() => downloadAsset(asset.url, asset.type)}
          >
            Download
          </Button>
        </div>
      </div>
      <CardFooter className="p-3">
        <div className="w-full flex items-center justify-between">
          <p className="text-sm text-gray-500 truncate">
            {new Date(asset.createdAt).toLocaleDateString()}
          </p>
          <span className={`text-sm ${
            asset.type === 'icon' 
              ? 'text-violet-500 dark:text-violet-400'
              : 'text-gray-500 dark:text-gray-400'
          }`}>
            {asset.type}
          </span>
        </div>
      </CardFooter>
    </Card>
  )

  if (isLoading) {
    return <Loading />
  }

  if (error) {
    return <ErrorDisplay error={error} reset={() => window.location.reload()} />
  }

  return (
    <PageTransition>
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
        <div className="container mx-auto p-6 space-y-8">
          {/* Header */}
          <div className="flex flex-col gap-4">
            <div className="flex items-center">
              <Button
                variant="ghost"
                className="flex items-center gap-2"
                onClick={() => router.push('/')}
              >
                <ArrowLeft className="w-4 h-4" />
                Back to Home
              </Button>
            </div>

            <div className="flex justify-between items-center">
              <div>
                <h1 className="text-3xl font-bold">Dashboard</h1>
                <p className="text-gray-600 dark:text-gray-400">
                  Manage your generated assets
                </p>
              </div>
              <div className="flex items-center gap-4">
                {!isPro && (
                  <Button
                    className="bg-gradient-to-r from-violet-500 to-fuchsia-500 hover:from-violet-600 hover:to-fuchsia-600 text-white flex items-center gap-2"
                    onClick={() => router.push('/pricing')}
                  >
                    <Crown className="w-4 h-4" />
                    Upgrade to Pro
                  </Button>
                )}
                <Button
                  variant="outline"
                  className="flex items-center gap-2"
                  onClick={handleLogout}
                >
                  <LogOut className="w-4 h-4" />
                  Sign Out
                </Button>
              </div>
            </div>
          </div>

          {/* Main Content */}
          <div className="grid gap-6 md:grid-cols-[300px,1fr]">
            {/* Sidebar */}
            <Card className="p-6 space-y-6">
              <div className="flex flex-col gap-4">
                {/* User info section */}
                <div className="p-6 rounded-lg bg-white dark:bg-gray-800 shadow">
                  <div className="flex items-center gap-5">
                    <div className="h-14 w-14 rounded-full bg-gradient-to-r from-violet-500 to-fuchsia-500 flex items-center justify-center flex-shrink-0">
                      <User className="h-7 w-7 text-white" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <h3 className="font-medium truncate">
                        {user?.email}
                      </h3>
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium mt-2 ${
                        isPro
                          ? 'bg-gradient-to-r from-violet-500 to-fuchsia-500 text-white'
                          : 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300'
                      }`}>
                        {isPro ? 'Premium' : 'Free Tier'}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Stats section */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="p-4 rounded-lg bg-white dark:bg-gray-800 shadow">
                    <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400 mb-1">
                      <ImageIcon className="h-4 w-4" />
                      <span className="text-sm">Icons</span>
                    </div>
                    <p className="text-2xl font-bold">{iconAssets.length}</p>
                  </div>
                  <div className="p-4 rounded-lg bg-white dark:bg-gray-800 shadow">
                    <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400 mb-1">
                      <Smartphone className="h-4 w-4" />
                      <span className="text-sm">Screenshots</span>
                    </div>
                    <p className="text-2xl font-bold">{screenshotAssets.length}</p>
                  </div>
                </div>

                {/* Navigation */}
                <div className="space-y-1">
                  <Button
                    variant="ghost"
                    className="w-full justify-start"
                    onClick={() => router.push('/studio')}
                  >
                    <ArrowLeft className="mr-2 h-4 w-4" />
                    Back to Studio
                  </Button>
                </div>
              </div>

              <Button 
                className="w-full"
                onClick={handleCreateNew}
              >
                Create New Asset
              </Button>
            </Card>

            {/* Main Content Area */}
            <Card className="p-6">
              <Tabs defaultValue="all">
                <TabsList>
                  <TabsTrigger value="all">All Assets</TabsTrigger>
                  <TabsTrigger value="icons" className="flex items-center gap-2">
                    <ImageIcon className="w-4 h-4" />
                    Icons
                  </TabsTrigger>
                  <TabsTrigger value="screenshots" className="flex items-center gap-2">
                    <Smartphone className="w-4 h-4" />
                    Screenshots
                  </TabsTrigger>
                </TabsList>

                <TabsContent value="all" className="mt-6">
                  {assets.length > 0 ? (
                    <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                      {assets.map((asset) => (
                        <AssetCard key={asset.id} asset={asset} />
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-12">
                      <p className="text-gray-500">No assets generated yet</p>
                      <Button 
                        className="mt-4"
                        onClick={handleCreateNew}
                      >
                        Create Your First Asset
                      </Button>
                    </div>
                  )}
                </TabsContent>

                <TabsContent value="icons" className="mt-6">
                  {iconAssets.length > 0 ? (
                    <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                      {iconAssets.map((asset) => (
                        <AssetCard key={asset.id} asset={asset} />
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-12">
                      <p className="text-gray-500">No icons generated yet</p>
                      <Button 
                        className="mt-4"
                        onClick={handleCreateNew}
                      >
                        Create Your First Icon
                      </Button>
                    </div>
                  )}
                </TabsContent>

                <TabsContent value="screenshots" className="mt-6">
                  {screenshotAssets.length > 0 ? (
                    <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                      {screenshotAssets.map((asset) => (
                        <AssetCard key={asset.id} asset={asset} />
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-12">
                      <p className="text-gray-500">No screenshots generated yet</p>
                      <Button 
                        className="mt-4"
                        onClick={handleCreateNew}
                      >
                        Create Your First Screenshot
                      </Button>
                    </div>
                  )}
                </TabsContent>
              </Tabs>
            </Card>
          </div>
        </div>
      </div>
    </PageTransition>
  )
} 