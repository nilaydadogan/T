import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { storage } from '@/lib/storage'
import { GeneratedAsset } from '@/types/user'
import { Download, Trash2 } from 'lucide-react'
import Image from 'next/image'
import { useCallback, useState, useEffect } from 'react'
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
import { useToast } from './ui/use-toast'

export function Dashboard() {
  const [assets, setAssets] = useState<GeneratedAsset[]>([])
  const { toast } = useToast()
  const [isLoading, setIsLoading] = useState(true)

  // Storage'dan asset'leri yükle
  useEffect(() => {
    const loadAssets = async () => {
      try {
        console.log('🔄 Loading assets...')
        await storage.initialize()
        const currentAssets = storage.getAssets()
        console.log('📦 Loaded assets:', currentAssets.length)
        setAssets(currentAssets)
      } catch (error) {
        console.error('❌ Failed to load assets:', error)
        toast({
          variant: "destructive",
          title: "Error",
          description: "Failed to load assets",
        })
      } finally {
        setIsLoading(false)
      }
    }

    loadAssets()

    // Auth değişikliklerini dinle
    const handleAuthChange = () => {
      console.log('🔐 Auth state changed, reloading assets...')
      loadAssets()
    }

    window.addEventListener('auth-changed', handleAuthChange)
    return () => window.removeEventListener('auth-changed', handleAuthChange)
  }, [toast])

  const handleDownload = useCallback(async (asset: GeneratedAsset) => {
    try {
      const response = await fetch(asset.url)
      const blob = await response.blob()
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = asset.name
      document.body.appendChild(a)
      a.click()
      a.remove()
      window.URL.revokeObjectURL(url)
    } catch (error) {
      console.error('Download error:', error)
      toast({
        variant: "destructive",
        title: "Download Failed",
        description: "Failed to download the asset.",
      })
    }
  }, [toast])

  const handleDelete = useCallback(async (asset: GeneratedAsset) => {
    try {
      await storage.removeAsset(asset.id)
      setAssets(storage.getAssets())
      toast({
        title: "Asset Deleted",
        description: "The asset has been successfully deleted.",
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

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-10">
        <div className="animate-spin rounded-full h-8 w-8 border-2 border-violet-500 border-t-transparent" />
      </div>
    )
  }

  if (assets.length === 0) {
    return (
      <div className="text-center py-10">
        <p className="text-gray-500 dark:text-gray-400">No assets yet. Generate some icons or screenshots first!</p>
      </div>
    )
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {assets.map((asset) => (
        <Card key={asset.id} className="relative group">
          {/* Asset Preview */}
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

          {/* Asset Info */}
          <div className="p-3">
            <h3 className="font-medium text-sm truncate">{asset.name}</h3>
            <p className="text-xs text-gray-500 dark:text-gray-400">
              {asset.type} • {asset.size}
            </p>
          </div>
        </Card>
      ))}
    </div>
  )
} 