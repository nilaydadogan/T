'use client'

import { useEffect, useState, useCallback } from 'react'
import { Card, CardFooter } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { 
  ImageIcon, 
  Smartphone, 
  User, 
  LogOut, 
  Crown,
  ArrowLeft,
  Download,
  Trash2
} from 'lucide-react'
import { useRouter } from 'next/navigation'
import type { GeneratedAsset } from '@/types/user'
import { storage } from '@/lib/storage'
import { authStore } from '@/lib/auth-store'
import { Loading } from '@/components/loading'
import { ErrorDisplay } from '@/components/error-boundary'
import { PageTransition } from '@/components/page-transition'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import { useToast } from "@/components/ui/use-toast"
import Image from 'next/image'
import { supabase } from '@/lib/supabase'
import { format } from 'date-fns'

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
  const { toast } = useToast()
  const [subscriptionEnd, setSubscriptionEnd] = useState<string | null>(null)

  useEffect(() => {
    const initializeDashboard = async () => {
      try {
        console.log('Starting dashboard initialization...')
        
        // First initialize auth
        await authStore.initialize()
        const userData = authStore.getUser()
        
        if (!userData) {
          console.log('No user data found, redirecting to login...')
          router.push('/auth/sign-in')
          return
        }

        console.log('User authenticated:', userData.id)
        setUser(userData)
        setIsPro(authStore.isPro())

        // Then initialize storage with user ID
        console.log('Initializing storage for user:', userData.id)
        await storage.initialize()
        
        // Get stored assets
        const storedAssets = storage.getAssets()
        console.log('Loaded assets:', storedAssets.length)
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

  // Download handler
  const handleDownload = useCallback(async (asset: GeneratedAsset) => {
    try {
      // Yükleme başladığını göster
      toast({
        title: "Preparing Download",
        description: "Generating all sizes of your asset...",
      })

      // Asset tipine göre endpoint seç
      const endpoint = asset.type === 'icon' ? '/api/generate-icons' : '/api/generate-screenshots'

      // Asset URL'inden dosyayı al
      const assetResponse = await fetch(asset.url)
      const blob = await assetResponse.blob()
      const file = new File([blob], asset.name, { type: 'image/png' })

      // FormData oluştur
      const formData = new FormData()
      formData.append('file', file)
      formData.append('options', JSON.stringify({
        // İkon için varsayılan options
        ...(asset.type === 'icon' && {
          borderRadius: 0,
          borderWidth: 0,
          borderColor: '#000000',
          shadow: null
        }),
        // Screenshot için varsayılan options
        ...(asset.type === 'screenshot' && {
          deviceType: 'iphone-15-pro',
          quality: 100
        })
      }))

      // API'ye istek at
      const response = await fetch(endpoint, {
        method: 'POST',
        body: formData,
      })

      if (!response.ok) {
        throw new Error('Failed to generate assets')
      }

      // ZIP dosyasını indir
      const zipBlob = await response.blob()
      const url = window.URL.createObjectURL(zipBlob)
      const a = document.createElement('a')
      a.href = url
      a.download = `${asset.type === 'icon' ? 'app-icons' : 'app-screenshots'}.zip`
      document.body.appendChild(a)
      a.click()
      a.remove()
      window.URL.revokeObjectURL(url)

      toast({
        title: "Download Complete",
        description: `All sizes of your ${asset.type} have been downloaded.`,
      })
    } catch (error) {
      console.error('Download error:', error)
      toast({
        variant: "destructive",
        title: "Download Failed",
        description: "Failed to download the asset.",
      })
    }
  }, [toast])

  // Delete handler
  const handleDelete = useCallback(async (asset: GeneratedAsset) => {
    try {
      storage.removeAsset(asset.id)
      // Refresh assets after deletion
      setAssets(storage.getAssets())

      toast({
        title: "Delete Success",
        description: "Asset deleted successfully.",
      })
    } catch (error) {
      console.error('Delete error:', error)
      toast({
        variant: "destructive",
        title: "Delete Failed",
        description: "Failed to delete the asset.",
      })
    }
  }, [toast])

  // Add new useEffect for subscription end date
  useEffect(() => {
    const fetchSubscriptionEnd = async () => {
      console.log('Fetching subscription end date...')
      const { data: subscription, error } = await supabase
        .from('user_subscriptions')
        .select('current_period_end, subscription_type, stripe_subscription_id')
        .eq('user_id', authStore.getUser()?.id)
        .order('created_at', { ascending: false })
        .limit(1)
        .single()

      console.log('Full subscription data:', subscription)
      console.log('Subscription error:', error)

      if (subscription?.current_period_end) {
        try {
          const date = new Date(subscription.current_period_end)
          const formattedDate = format(date, 'MMMM d, yyyy')
          console.log('Parsed date:', date)
          console.log('Formatted date:', formattedDate)
          setSubscriptionEnd(formattedDate)
        } catch (err) {
          console.error('Error formatting date:', err)
          console.log('Raw current_period_end value:', subscription.current_period_end)
        }
      } else {
        console.log('No current_period_end found in subscription')
      }
    }

    // Wait for auth initialization and then check subscription
    const initAndFetch = async () => {
      await authStore.initialize()
      if (authStore.isPro()) {
        console.log('User is pro, fetching subscription end date')
        await fetchSubscriptionEnd()
      } else {
        console.log('User is not pro, skipping subscription end date fetch')
      }
    }

    initAndFetch()
  }, [])

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
            <div className="flex justify-between items-center">
              <div>
                <h1 className="text-5xl font-bold bg-gradient-to-r from-violet-500 to-fuchsia-500 bg-clip-text text-transparent">
                  Dashboard
                </h1>
                <p className="text-gray-600 dark:text-gray-400 mt-2">
                  Manage your generated assets
                </p>
              </div>
              <div className="flex items-center gap-4">
                <Button
                  variant="ghost"
                  className="flex items-center gap-2"
                  onClick={() => router.push('/')}
                >
                  <ArrowLeft className="w-4 h-4" />
                  Back to Home
                </Button>
                <Button
                  variant="ghost"
                  className="flex items-center gap-2"
                  onClick={() => router.push('/studio')}
                >
                  <ArrowLeft className="w-4 h-4" />
                  Back to Studio
                </Button>
                <Button
                  className="bg-gradient-to-r from-violet-500 to-fuchsia-500 hover:from-violet-600 hover:to-fuchsia-600 text-white"
                  onClick={handleCreateNew}
                >
                  Create
                </Button>
                {!isPro && (
                  <Button
                    className="bg-gradient-to-r from-violet-500 to-fuchsia-500 hover:from-violet-600 hover:to-fuchsia-600 text-white flex items-center gap-2"
                    onClick={() => router.push('/pricing')}
                  >
                    <Crown className="w-4 h-4" />
                    Upgrade to Pro
                  </Button>
                )}
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
                      {isPro && subscriptionEnd && (
                        <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
                          Renews: {subscriptionEnd}
                        </p>
                      )}
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
                    variant="outline"
                    className="w-full justify-start text-red-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950"
                    onClick={handleLogout}
                  >
                    <LogOut className="mr-2 h-4 w-4" />
                    Sign Out
                  </Button>
                </div>
              </div>
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
                        <Card key={asset.id} className="relative group">
                          <div className="relative aspect-square">
                            <Image
                              src={asset.url}
                              alt={asset.name}
                              fill
                              className={`object-contain p-4 rounded-t-lg ${
                                asset.type === 'screenshot' ? 'bg-gray-50 dark:bg-gray-900' : ''
                              }`}
                            />
                            
                            {/* Action Buttons */}
                            <div className="absolute top-2 right-2 flex items-center gap-1.5 opacity-0 group-hover:opacity-100 transition-all duration-200">
                              <Button
                                size="icon"
                                variant="secondary"
                                className="w-6 h-6 bg-white/80 hover:bg-white/95 shadow-sm dark:bg-gray-900/80 dark:hover:bg-gray-900/95"
                                onClick={() => handleDownload(asset)}
                                title="Download"
                              >
                                <Download className="h-3 w-3" />
                              </Button>

                              <AlertDialog>
                                <AlertDialogTrigger asChild>
                                  <Button
                                    size="icon"
                                    variant="secondary"
                                    className="w-6 h-6 bg-white/80 hover:bg-red-500 hover:text-white shadow-sm dark:bg-gray-900/80 dark:hover:bg-red-500"
                                    title="Delete"
                                  >
                                    <Trash2 className="h-3 w-3" />
                                  </Button>
                                </AlertDialogTrigger>
                                <AlertDialogContent>
                                  <AlertDialogHeader>
                                    <AlertDialogTitle>Delete Asset</AlertDialogTitle>
                                    <AlertDialogDescription>
                                      Are you sure you want to delete this asset? This action cannot be undone.
                                    </AlertDialogDescription>
                                  </AlertDialogHeader>
                                  <AlertDialogFooter>
                                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                                    <AlertDialogAction
                                      onClick={() => handleDelete(asset)}
                                      className="bg-red-500 hover:bg-red-600 text-white"
                                    >
                                      Delete
                                    </AlertDialogAction>
                                  </AlertDialogFooter>
                                </AlertDialogContent>
                              </AlertDialog>
                            </div>
                          </div>

                          <div className="p-3">
                            <h3 className="font-medium text-sm truncate">{asset.name}</h3>
                            <p className="text-xs text-gray-500 dark:text-gray-400">
                              {asset.type} • {asset.size}
                            </p>
                          </div>
                        </Card>
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
                        <Card key={asset.id} className="relative group">
                          <div className="relative aspect-square">
                            <Image
                              src={asset.url}
                              alt={asset.name}
                              fill
                              className={`object-contain p-4 rounded-t-lg ${
                                asset.type === 'screenshot' ? 'bg-gray-50 dark:bg-gray-900' : ''
                              }`}
                            />
                            
                            {/* Action Buttons */}
                            <div className="absolute top-2 right-2 flex items-center gap-1.5 opacity-0 group-hover:opacity-100 transition-all duration-200">
                              <Button
                                size="icon"
                                variant="secondary"
                                className="w-6 h-6 bg-white/80 hover:bg-white/95 shadow-sm dark:bg-gray-900/80 dark:hover:bg-gray-900/95"
                                onClick={() => handleDownload(asset)}
                                title="Download"
                              >
                                <Download className="h-3 w-3" />
                              </Button>

                              <AlertDialog>
                                <AlertDialogTrigger asChild>
                                  <Button
                                    size="icon"
                                    variant="secondary"
                                    className="w-6 h-6 bg-white/80 hover:bg-red-500 hover:text-white shadow-sm dark:bg-gray-900/80 dark:hover:bg-red-500"
                                    title="Delete"
                                  >
                                    <Trash2 className="h-3 w-3" />
                                  </Button>
                                </AlertDialogTrigger>
                                <AlertDialogContent>
                                  <AlertDialogHeader>
                                    <AlertDialogTitle>Delete Asset</AlertDialogTitle>
                                    <AlertDialogDescription>
                                      Are you sure you want to delete this asset? This action cannot be undone.
                                    </AlertDialogDescription>
                                  </AlertDialogHeader>
                                  <AlertDialogFooter>
                                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                                    <AlertDialogAction
                                      onClick={() => handleDelete(asset)}
                                      className="bg-red-500 hover:bg-red-600 text-white"
                                    >
                                      Delete
                                    </AlertDialogAction>
                                  </AlertDialogFooter>
                                </AlertDialogContent>
                              </AlertDialog>
                            </div>
                          </div>

                          <div className="p-3">
                            <h3 className="font-medium text-sm truncate">{asset.name}</h3>
                            <p className="text-xs text-gray-500 dark:text-gray-400">
                              {asset.type} • {asset.size}
                            </p>
                          </div>
                        </Card>
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
                        <Card key={asset.id} className="relative group">
                          <div className="relative aspect-square">
                            <Image
                              src={asset.url}
                              alt={asset.name}
                              fill
                              className={`object-contain p-4 rounded-t-lg ${
                                asset.type === 'screenshot' ? 'bg-gray-50 dark:bg-gray-900' : ''
                              }`}
                            />
                            
                            {/* Action Buttons */}
                            <div className="absolute top-2 right-2 flex items-center gap-1.5 opacity-0 group-hover:opacity-100 transition-all duration-200">
                              <Button
                                size="icon"
                                variant="secondary"
                                className="w-6 h-6 bg-white/80 hover:bg-white/95 shadow-sm dark:bg-gray-900/80 dark:hover:bg-gray-900/95"
                                onClick={() => handleDownload(asset)}
                                title="Download"
                              >
                                <Download className="h-3 w-3" />
                              </Button>

                              <AlertDialog>
                                <AlertDialogTrigger asChild>
                                  <Button
                                    size="icon"
                                    variant="secondary"
                                    className="w-6 h-6 bg-white/80 hover:bg-red-500 hover:text-white shadow-sm dark:bg-gray-900/80 dark:hover:bg-red-500"
                                    title="Delete"
                                  >
                                    <Trash2 className="h-3 w-3" />
                                  </Button>
                                </AlertDialogTrigger>
                                <AlertDialogContent>
                                  <AlertDialogHeader>
                                    <AlertDialogTitle>Delete Asset</AlertDialogTitle>
                                    <AlertDialogDescription>
                                      Are you sure you want to delete this asset? This action cannot be undone.
                                    </AlertDialogDescription>
                                  </AlertDialogHeader>
                                  <AlertDialogFooter>
                                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                                    <AlertDialogAction
                                      onClick={() => handleDelete(asset)}
                                      className="bg-red-500 hover:bg-red-600 text-white"
                                    >
                                      Delete
                                    </AlertDialogAction>
                                  </AlertDialogFooter>
                                </AlertDialogContent>
                              </AlertDialog>
                            </div>
                          </div>

                          <div className="p-3">
                            <h3 className="font-medium text-sm truncate">{asset.name}</h3>
                            <p className="text-xs text-gray-500 dark:text-gray-400">
                              {asset.type} • {asset.size}
                            </p>
                          </div>
                        </Card>
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